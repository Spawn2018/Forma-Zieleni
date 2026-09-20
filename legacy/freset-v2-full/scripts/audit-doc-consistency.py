from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[1]
errors=[]
# Required artifacts
required=[
'docs/00-MASTER-PLAN.md','docs/25-MASTER-CONTEXT-2026-09-20.md','docs/26-DECISION-REGISTER.md',
'docs/27-AUDIT-COVERAGE-2026-09-20.md','docs/28-ZERO-OMISSION-AUDIT-2026-09-20.md',
'contracts/openapi.yaml','AGENTS.md','CHECKPOINT.md','.cursor/rules/formazieleni.mdc']
for x in required:
    if not (root/x).exists(): errors.append(f'MISSING {x}')
# Canonical required phrases
checks={
'docs/25-MASTER-CONTEXT-2026-09-20.md':['OpenAPI 3.0','Auth, CRM, Sales, Capacity, Projects, Offers, Payments, Files, Events, Automation','Sebastiana','Agnieszka','Cloudflare','Site Intelligence','Plant Knowledge','Garden OS'],
'docs/26-DECISION-REGISTER.md':['ADR-001','ADR-020','ADR-024'],
'.cursor/rules/formazieleni.mdc':['Hosting/backend/storage/database nie są jeszcze wybrane','Konto Sebastiana = test/integration','OpenAPI jest source of truth'],
'CHECKPOINT.md':['Gate B nadal otwarty','ETAP D: zamrożony']}
for f,terms in checks.items():
    s=(root/f).read_text(encoding='utf-8')
    for t in terms:
        if t not in s: errors.append(f'{f}: missing phrase {t!r}')
# OpenAPI exact branch
s=(root/'contracts/openapi.yaml').read_text(encoding='utf-8')
if not re.search(r'^openapi:\s*["\']?3\.0\.',s,re.M): errors.append('OpenAPI is not 3.0.x')
# Active docs containing old CF stack must have explicit infra disclaimer
for p in list((root/'docs').glob('*.md')):
    if p.name.startswith('_research-'): continue
    s=p.read_text(encoding='utf-8')
    if re.search(r'Cloudflare Workers|\bD1\b|\bR2\b|Cloudflare Pages|\bwrangler\b',s,re.I):
        if 'INFRA F-RESET' not in s and p.name not in {'00-MASTER-PLAN.md','25-MASTER-CONTEXT-2026-09-20.md','26-DECISION-REGISTER.md','27-AUDIT-COVERAGE-2026-09-20.md','28-ZERO-OMISSION-AUDIT-2026-09-20.md'}:
            errors.append(f'{p}: old infra mention without INFRA F-RESET disclaimer')
# Cursor rules must not lock legacy stack
for p in (root/'.cursor/rules').glob('*.mdc'):
    s=p.read_text(encoding='utf-8')
    if 'Cloudflare Workers + D1 + R2' in s: errors.append(f'{p}: locks legacy Cloudflare stack')
if errors:
    print('FAIL')
    print('\n'.join('- '+e for e in errors))
    sys.exit(1)
print('PASS: documentation consistency checks passed')

# F-RESET v2: every active markdown document in docs has explicit sync marker.
for p in (root/'docs').glob('*.md'):
    s=p.read_text(encoding='utf-8')
    if 'FRESET-V2-SYNC-2026-09-20' not in s:
        errors.append(f'{p}: missing F-RESET v2 status marker')
for x in ['docs/30-F-RESET-EXECUTION-2026-09-20.md','docs/31-IMPLEMENTATION-STATUS-MATRIX.md']:
    if not (root/x).exists(): errors.append(f'MISSING {x}')
# Re-evaluate because original script may already have printed PASS before these checks.
if errors:
    print('FAIL F-RESET v2')
    print('\n'.join('- '+e for e in errors))
    sys.exit(1)
print('PASS: F-RESET v2 all-document status checks passed')
