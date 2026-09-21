export type LogRecord = {
  time: string;
  level: 'info' | 'error';
  msg: 'http.request' | 'http.error';
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  actorId?: string;
};

export type TracerSpan = {
  setAttribute(key: string, value: string | number): void;
  end(): void;
};

export interface Tracer {
  startSpan(name: string): TracerSpan;
}

export const noopTracer: Tracer = {
  startSpan: () => ({ setAttribute() {}, end() {} }),
};

export function writeLog(sink: LogRecord[], record: LogRecord): void {
  sink.push(record);
}
