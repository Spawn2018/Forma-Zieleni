#!/usr/bin/env python3
from pathlib import Path
import sys, yaml
p=Path(__file__).resolve().parents[1]/"contracts/openapi.yaml"
s=yaml.safe_load(p.read_text(encoding="utf-8"))
assert str(s.get("openapi","")).startswith("3.0."), "Project requires OpenAPI 3.0.x"
assert s.get("paths"), "No paths"
ops=set()
for path,item in s["paths"].items():
  for method,op in item.items():
    if method.lower() not in {"get","post","put","patch","delete"}: continue
    oid=op.get("operationId"); assert oid, f"Missing operationId: {method} {path}"
    assert oid not in ops, f"Duplicate operationId: {oid}"; ops.add(oid)
print(f"OK OpenAPI {s['openapi']}: {len(ops)} operations, {len(s['components']['schemas'])} schemas")
