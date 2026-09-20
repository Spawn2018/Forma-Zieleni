# Forma Zieleni — Visual Product Canon

Status: **CURRENT / BINDING**  
Applies to: `apps/web`, `apps/portal`, `apps/admin`, future mobile UI, Garden OS UI.

## 1. Purpose

Forma Zieleni must look like a deliberate landscape-architecture studio and product ecosystem, not a generic SaaS template and not AI-generated marketing. Visual work must derive from the project's established visual language, real product flows and supplied mockups/screenshots. Cursor may refine implementation details for accessibility, responsiveness and performance, but may not invent a new brand or generic visual direction.

## 2. Source precedence for visual work

1. This Visual Product Canon.
2. Current Product Canon, UX Canon and Content Canon.
3. Current approved screen/slice specification.
4. Supplied mockups/screenshots catalogued in `docs/design/VISUAL-REFERENCE-MAP.md`.
5. Legacy `02-DESIGN.md`, `KANON-WWW.md`, `KANON-MOBILE.md` only as evidence/reference where not superseded.

Legacy stack-specific instructions (Astro, Sanity, Vite, WebView, Workers/D1 etc.) are **not** visual requirements.

## 3. Signature visual language — “Plan nasadzeń”

The established identity is retained:
- real garden/project photography is primary;
- visual language borrows from landscape plans and planting documentation;
- thin plan lines and plant annotations use Latin + Polish plant names;
- editorial, quiet composition rather than decorative UI noise;
- one strong moment per view, not many competing effects;
- interfaces feel precise, calm, natural and professional.

The distinctive motif is a planting-plan line/annotation system used selectively, especially where it genuinely explains a garden, plant or design. It must not become repetitive decoration.

## 4. Current brand tokens

Canonical palette intent:
- `igliwie` `#24392E` — primary dark/text/dark surfaces;
- `kamien` `#EEF0EA` — cool light background;
- `mech` `#4E6B4F` — secondary green/link/support;
- `szalwia` `#C5CFBF` — quiet highlighted surface;
- `kreska` `#8A968C` — plan/annotation line, not body text;
- `rudbekia` `#E0A526` — scarce primary CTA accent.

Rules:
- Rudbekia has one semantic role: primary action/accent. Do not scatter it decoratively.
- No warm beige/terracotta generic lifestyle palette as a replacement brand.
- No black/neon-green “tech” restyle.
- Contrast must satisfy WCAG 2.2 AA for applicable text/UI.

Typography intent:
- editorial serif for display/headings and botanical Latin;
- restrained grotesk/sans for interface/body;
- supplied direction: Newsreader + Schibsted Grotesk is the current visual reference, but font delivery/technical implementation must be validated against the chosen stack, licensing, Polish glyphs and performance before implementation.
- no gratuitous bold display typography, all-caps eyebrow labels or gradient headline words.

## 5. Composition

- left-aligned text by default;
- generous whitespace;
- large authentic imagery;
- hierarchy through scale, spacing, typography and surface, not shadows;
- photographs generally square-cornered / print-like; controls may use role-specific radii;
- no universal card grid for every section;
- no glassmorphism, neon glow, random gradients, floating blobs, excessive pills, decorative dashboards or template-like feature-card walls;
- numbers are prominent only when they convey real information and are verified;
- mobile is designed intentionally, not a compressed desktop.

## 6. Motion

Motion must explain state or provide one deliberate signature moment. Current web signature: planting-plan line drawing in the hero when appropriate to the final hero photography.

Allowed:
- short state transitions;
- quiz/form step transitions;
- before/after interaction;
- disclosure/dialog transitions;
- progressive enhancement where cheap.

Avoid:
- reveal-on-scroll on every section;
- autoplay carousels;
- parallax for decoration;
- animated counters;
- motion that delays input or LCP.

Always respect `prefers-reduced-motion`.

## 7. Photography and evidence

Use authentic Forma Zieleni material. Never use stock imagery as if it were a completed Forma Zieleni project. Never present a render as a photograph. Evidence, testimonials, awards, counts and ratings must be real and sourced.

Images must have intrinsic dimensions, responsive variants, meaningful alt text where appropriate, and loading priority based on actual viewport importance. Visual quality cannot override performance budgets.

## 8. Product-specific expression

### Public WWW
Editorial + photographic + conversion-focused. It should feel like a landscape architecture studio with a powerful sales application underneath, not like SaaS. Site Analysis, qualification, evidence and CTA are integrated into the brand language.

### Portal
Quieter task-oriented interface. Preserve Forma Zieleni typography/color/detail language, but clarity of project status, files, revisions, decisions, approvals and payments beats decoration.

### Admin / Revenue OS
Dense professional working interface is allowed. It must not mimic the marketing homepage. Optimize scanability, keyboard efficiency, status clarity, next action and capacity. Brand continuity is subtle, not decorative.

### Mobile
Task/photo/push-first. Supplied mobile screens establish product intent and visual continuity, not a requirement to clone legacy WebView implementation. Mobile must use native/mobile interaction conventions where the future stack requires them while retaining the Forma Zieleni visual identity.

### Garden OS
Should feel like a living digital twin of a garden: weather, soil, plants, tasks, history, imagery and recommendations connected around the actual property. Avoid generic “smart home dashboard” aesthetics.

## 9. Anti-AI-slop visual gate

Reject or redesign a screen when any of these are true:
- it could belong unchanged to an unrelated startup;
- it uses generic hero copy + gradient + cards + icon grid without domain reason;
- it adds invented statistics, testimonials, logos or badges;
- every section is a rounded card;
- decorative icons replace meaningful garden/project imagery;
- botanical/landscape identity disappeared;
- the screen is visually busy without improving the user's task;
- desktop mockup was merely squeezed into mobile;
- a component exists because a UI kit offered it rather than because the domain needs it.

Self-test: **If the Forma Zieleni name were removed, would the interface still unmistakably communicate landscape architecture, real projects and this product workflow?** If no, revise before review.

## 10. Change control

AUTO: responsive fixes, accessibility corrections, implementation fidelity, minor spacing/type adjustments inside this canon.  
REVIEW: new reusable component pattern, substantial layout refinement, performance-driven visual adaptation.  
DECISION: new brand direction, palette, typography direction, navigation model, major page composition, replacement of canonical UX, materially new customer-facing visual concept.  
DANGEROUS: none by visual design alone; production publication remains governed by operational gates.
