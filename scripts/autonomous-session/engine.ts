import { classify, limits, validateSlices, type Slice } from './policy.ts';

export type Evidence = { stage: string; result: 'PASS' | 'NA'; detail: string };
export type Decision = { choice: 'repo-audit' | 'canon-audit'; rationale: string; review: string };
export type Outcome = { status: 'COMPLETE' | 'RETRYABLE' | 'BLOCKED'; evidence: Evidence[]; reason?: string };
export type Session = {
  version: 1; id: string; objective: string; repo: string; createdAt: string; updatedAt: string;
  deadline: string | null; maxIterations: number; retryBudget: number; iterationCount: number;
  currentSlice: string | null; status: string; slices: Slice[]; completedWork: string[];
  pendingWork: string[]; blockers: { slice: string; reason: string }[];
  decisions: { slice: string; record: Decision }[];
  evidence: { slice: string; iteration: number; records: Evidence[] }[];
  attempts: Record<string, number>; gitHeadBefore: string; gitHeadAfter: string;
  modifiedFiles: string[]; baselineFiles: string[]; policyHash: string;
  apiCalls: number;
};
export type Ports = {
  now(): number;
  checkpoint(state: Session): void;
  guard(state: Session): void;
  stopped(): boolean;
  decide(slice: Slice, state: Session): Promise<Decision | null>;
  execute(capability: string, state: Session): Promise<Outcome>;
};

export async function runSession(state: Session, ports: Ports): Promise<Session> {
  limits(state.maxIterations, state.retryBudget, state.deadline);
  validateSlices(state.slices);
  const save = () => { state.updatedAt = new Date(ports.now()).toISOString(); ports.checkpoint(state); };
  const waitingThisRun = new Set<string>();
  const block = (slice: Slice, reason: string) => {
    state.blockers.push({ slice: slice.id, reason });
    state.pendingWork = state.pendingWork.filter(id => id !== slice.id);
  };
  const waitForDecision = (slice: Slice) => {
    if (!state.blockers.some(item => item.slice === slice.id && item.reason === 'DECISION_UNAVAILABLE_OR_REJECTED')) {
      state.blockers.push({ slice: slice.id, reason: 'DECISION_UNAVAILABLE_OR_REJECTED' });
    }
    waitingThisRun.add(slice.id);
  };
  const clearWaitingDecision = (sliceId: string) => {
    state.blockers = state.blockers.filter(item => !(item.slice === sliceId && item.reason === 'DECISION_UNAVAILABLE_OR_REJECTED'));
  };
  try {
    ports.guard(state);
    state.status = 'RUNNING';
    save();
    while (state.pendingWork.length) {
      if (ports.stopped()) { state.status = 'STOPPED'; break; }
      if (state.deadline && ports.now() >= Date.parse(state.deadline)) { state.status = 'DEADLINE'; break; }
      if (state.iterationCount >= state.maxIterations) { state.status = 'MAX_ITERATIONS'; break; }
      ports.guard(state);
      const slice = state.slices.find(s => state.pendingWork.includes(s.id) && s.dependsOn.every(id => state.completedWork.includes(id)) && !waitingThisRun.has(s.id));
      if (!slice) { state.status = 'BLOCKED'; break; }
      state.currentSlice = slice.id;
      const risk = classify(slice);
      if (risk === 'OWNER-ONLY' || risk === 'DANGEROUS') { block(slice, risk); save(); continue; }
      let capability = slice.capability;
      if (risk === 'OWNER-DECISION') {
        let decision = state.decisions.find(d => d.slice === slice.id)?.record;
        if (!decision) {
          decision = (await ports.decide(slice, state)) ?? undefined;
          if (ports.stopped()) { state.status = 'STOPPED'; break; }
          if (state.deadline && ports.now() >= Date.parse(state.deadline)) { state.status = 'DEADLINE'; break; }
          if (!decision) { waitForDecision(slice); save(); continue; }
          if (!['repo-audit', 'canon-audit'].includes(decision.choice)) { block(slice, 'INVALID_DECISION'); save(); continue; }
          state.decisions.push({ slice: slice.id, record: decision });
          save(); // ADR is durable before the chosen capability is used.
        }
        if (!['repo-audit', 'canon-audit'].includes(decision.choice)) { block(slice, 'INVALID_DECISION'); save(); continue; }
        clearWaitingDecision(slice.id);
        capability = decision.choice;
      }
      // Persist the attempt before any work: a crash consumes its retry/iteration budget.
      const attempts = Object.hasOwn(state.attempts, slice.id) ? state.attempts[slice.id] : 0;
      if (attempts > state.retryBudget) { block(slice, 'RETRY_BUDGET'); save(); continue; }
      state.iterationCount++;
      state.attempts[slice.id] = attempts + 1;
      save();
      if (ports.stopped()) { state.status = 'STOPPED'; break; }
      if (state.deadline && ports.now() >= Date.parse(state.deadline)) { state.status = 'DEADLINE'; break; }
      ports.guard(state);
      const result = await ports.execute(capability, state);
      ports.guard(state);
      state.evidence.push({ slice: slice.id, iteration: state.iterationCount, records: result.evidence });
      if (result.status === 'COMPLETE') {
        state.completedWork.push(slice.id);
        state.pendingWork = state.pendingWork.filter(id => id !== slice.id);
      } else if (result.status === 'BLOCKED') block(slice, result.reason ?? 'GATE_FAILED');
      else if (result.status !== 'RETRYABLE') block(slice, 'UNKNOWN_OUTCOME');
      else if (state.attempts[slice.id] > state.retryBudget) block(slice, 'RETRY_BUDGET');
      save();
    }
    if (state.status === 'RUNNING') state.status = state.blockers.length ? 'BLOCKED' : 'COMPLETE';
  } catch {
    // Provider/process exceptions can contain credentials. Persist only a fixed code.
    state.status = 'BLOCKED';
    state.blockers.push({ slice: state.currentSlice ?? 'session', reason: 'GUARD_OR_EXECUTION_FAILED' });
  }
  state.currentSlice = null;
  save();
  return state;
}
