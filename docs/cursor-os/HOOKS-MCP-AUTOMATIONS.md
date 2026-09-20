# Hooks, MCP and automations

## Hooks
Cursor project hooks can enforce deterministic safeguards. Introduce them incrementally and test locally before making them blocking. Appropriate uses: secret/PII scanning, formatting, audit logging, blocking clearly destructive shell/SQL operations, and invoking lightweight checks after edits.

Do not encode business logic in hooks. Do not create a hook that can silently deploy or mutate production.

## MCP
MCP is the tool bus for approved external systems. Every MCP connection needs: owner/purpose, minimum permissions, auth method, data classification, allowed actions, approval boundary and auditability. Read access should be separated from mutation where possible.

Never commit tokens into `mcp.json`. Authentication must use supported login/secret mechanisms.

## Automations
Use Cursor Automations only for stable recurring tasks such as dependency/security review, documentation drift, contract drift, test regressions and performance regression investigation. Automations should create reviewable artifacts or issues; production mutation is not the default.

## Initial state
No external MCP server or automation is enabled merely because it appears in documentation. Activation is a REVIEW/DECISION step based on permissions, security, cost and current need.
