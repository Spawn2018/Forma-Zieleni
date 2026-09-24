# WWW portfolio projection

Status: contracted for `WWW-PORTFOLIO-PROJECTION` / `FZ-REQ-WWW-002`.

## Public projection (binding)

- A project appears on the public portfolio only when `markedForPublication`
  is true.
- `REAL_PROJECT`, `CONCEPT_PROJECT`, and `ILLUSTRATIVE_PROJECT` stay distinct.
  Only `REAL_PROJECT` may set `realization: true`.
- Explicitly synthetic items may publish; unpublished private work may not.
- Awards, prices, ratings, and private client fields (`address`,
  `customerName`, `email`, `phone`, `quote`) are refused on the public path.
- The projection does not invent commercial or social-proof claims.

## Out of scope

- Sales portfolio UI routes or CMS `ProjectCaseStudy` pages.
- Live editorial fetch wiring (separate from the pure projection contract).
- Invented awards, prices, or client testimonials.

Machine checks: `projectPortfolioItem()` / `projectPublicPortfolio()` in
`apps/web/app/portfolio-projection.ts`.
