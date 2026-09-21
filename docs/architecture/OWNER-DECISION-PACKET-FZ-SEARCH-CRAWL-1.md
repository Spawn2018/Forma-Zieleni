# FZ-SEARCH-CRAWL-1 — Production policy for model-training crawlers

Status: OPEN — OWNER-DECISION. Research date **2026-09-21**.

This packet does not change robots.txt, Cloudflare, DNS, or spend.
Search Intelligence architecture still proceeds. CMS implementation
does not wait on this reply.

Silence is not a decision.

## Decision statement

Choose whether production `robots.txt` opts out of known
model-training crawlers.

## Why this is blocked

Official docs distinguish training crawlers from search crawlers.
`Google-Extended` is also the control for Gemini grounding, and it
does not affect inclusion in Google Search. `GPTBot` is independent
of `OAI-SearchBot`. `ClaudeBot` is independent of `Claude-SearchBot`.
Choosing a production opt-out is a business and content-use decision,
not a CMS engineering default.

Canonical context: [`FZ-SEARCH-1.md`](./FZ-SEARCH-1.md) section 8.

## Constraints

- Do not emit training-token rules until this packet is DECIDED.
- Do not block `Googlebot`, `OAI-SearchBot`, `Claude-SearchBot`, or
  `PerplexityBot` as a side effect of a training opt-out.
- User-triggered fetchers (`ChatGPT-User`, `Claude-User`,
  `Perplexity-User`) are not reliably governed by robots.txt.
- Applying the result on the live Cloudflare zone is a separate
  DANGEROUS approval immediately before the change.
- No paid crawler product.

## Options

| Option | Meaning |
|---|---|
| A | In production robots.txt, `Disallow: /` for `GPTBot`, `ClaudeBot`, and `Google-Extended`. Leave search-indexing tokens allowed. Accept that Gemini grounding is also opted out. |
| B | No training-token disallow. Search and training tokens follow the same allow stance as ordinary public pages. |
| C | Keep omitting training-token groups until a later review. Search-indexing allow rules may still ship. |

## Safe work that continues

CMS-DATA and the rest of the AUTO/REVIEW graph in
[`NEXT-SLICES-CMS.md`](./NEXT-SLICES-CMS.md). Non-production
environments stay non-indexable regardless of this packet.

## Reply

```text
DECISION FZ-SEARCH-CRAWL-1: OPTION A
```

or `OPTION B` or `OPTION C`.
