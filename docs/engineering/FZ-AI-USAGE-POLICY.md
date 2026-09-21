# FZ AI usage policy

Status: CURRENT. Provider privacy claims are UNVERIFIED unless a sentence
below says otherwise. This page does not authorize a new vendor.

| Tool | Data | Decision |
| --- | --- | --- |
| Cursor on this public repository | Source, Canon, synthetic fixtures | ALLOWED_WITH_GUARDRAILS |
| Main Cursor model | The same, plus the task | ALLOWED_WITH_GUARDRAILS |
| External Grok Bot | Research questions without secrets or customer data | ALLOWED_WITH_GUARDRAILS |
| CodeRabbit | Local or review diff, no secrets | ALLOWED_WITH_GUARDRAILS |
| Perplexity | A prompt built by Growth OS, synthetic facts only | ALLOWED_WITH_GUARDRAILS |
| Any external model | Customer PII, contracts, credentials, CRM exports | PROHIBITED |
| Runtime model that writes Canon or spends | Any | OWNER_GATE |

Guardrails: do not paste secrets, customer records, or private contracts
into an external tool. Synthetic plans stay labeled
`SYNTHETIC / TEST ONLY`. An external answer is evidence, not Canon.

Do not treat token count, prompt count, or generated lines as
productivity. Useful observations are accepted results, rework, false
passes, and review rejections, and only when those events were recorded.

AI output that nobody can explain from the contracts and tests is a
defect, even if a test happens to pass.

Freshness: this policy is SLOW-CHANGING. Re-read it when a tool or a
data class changes. Do not infer a vendor's privacy promise from a
marketing page that was not checked.
