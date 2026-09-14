# CLAUDE.md — Cognitive Function Stack Test

This file guides Claude Code when working on this repo. Full design
rationale lives in `project-brief.md` (same project) — this file is the
condensed, implementation-facing reference.

## What this is

A ~25-question adaptive quiz that infers a person's Jungian cognitive
function stack via Bayesian updating over the 16 canonical MBTI types,
rather than scoring the four dichotomies directly. Results show a best-fit
type, a visual breakdown of all 8 function scores, and narrative flags for
discrepancies from that type's typical stack (dominant/auxiliary
inversion, shadow intrusion, poor differentiation).

## Stack & structure

Plain HTML/CSS/JS, no build step, no framework — matches the rest of
Nathan's personal-site work. Deploys to Cloudflare Pages on its own
subdomain (pattern: `tuner.`, `fragrance.` → this one TBD, e.g.
`type.nathankurien.com`).

**Assumption to confirm**: since this is one interactive single-page app
rather than a content site, it probably doesn't need Hugo the way
nathankurien.com does — a plain static `index.html` + `/js` + `/css`
deployed directly to Cloudflare Pages is simpler. Flag if you'd rather
wrap it in Hugo for consistency with the rest of the site family.

Planned layout:

```
/index.html
/css/style.css
/js/
  templates.js      — 16 type templates + shadow derivation + generator formula
  items.js          — item bank (stems, poles, loading vectors, spread)
  scoring.js         — Bayesian update engine (mixture-weight posterior)
  selection.js       — question selection (v1 heuristic; entropy upgrade later)
  state.js           — session state: weights, asked/skipped items, cooldowns
  discrepancy.js      — post-quiz flag logic (inversion, shadow, differentiation)
  narrative.js        — results copy, incl. age/mood-based softening
```

## Data model

**Type template** — one entry per of the 16 types, 8 function values,
each on a −1 to +1 scale:

```js
{ type: "INTJ", template: { Ni: 1.0, Te: 0.71, Fi: 0.43, Se: 0.14,
                             Ne: -0.14, Ti: -0.43, Fe: -0.71, Si: -1.0 } }
```

**Verify the generator, don't trust it blindly**: a transposition in the
shadow ordering here silently mis-scores every shadow-intrusion flag for
every type, not just one. Before wiring this into scoring, generate and
print/log all 16 full 8-function templates and eyeball them against
Appendix A's ranked stacks — cheap to check once, expensive to debug later
as a "why do my results feel off" mystery.

**Template generation rule** (don't hand-type 128 numbers): take each
type's ranked stack from `project-brief.md` Appendix A — 4 conscious
positions, then the 4 shadow positions (same 4 functions, opposite
attitude, same order) — and assign values evenly spaced from +1.0 (rank 1)
to −1.0 (rank 8), step = 2/7 ≈ 0.286. This is a deliberately simple v1
default; retune per-function later if a type's results feel off.

**Item**:

```js
{
  id: "ti_te_01",
  stem: "When you make a big decision, you trust...",
  poles: ["your own internal logic checks out", "it holds up against outside results"],
  loading: { Ti: -0.8, Te: 0.8 },  // sign rule: negative when pole 0 (left,
                                    // r=-1) is the high-f statement;
                                    // positive when pole 1 (right, r=+1) is
  spread: 0.4                       // likelihood curve width — tighter = more confident item
}
```

**Sign convention (write this as a comment/helper in `items.js`)**: for a
loading entry on function `f`, use a **negative** value if the *left*
pole (r = −1) is the statement associated with high `f`, and a
**positive** value if the *right* pole (r = +1) is. Getting this backwards
doesn't crash anything — it silently inverts that item's evidence in the
Bayesian update. Worth spot-checking a few items against this rule once
the bank is drafted.

**Response**: slider UI, mapped to −1 (left pole) to +1 (right pole)
before touching any scoring math.

## Scoring engine

Single model: the person's function vector is a mixture of the 16
templates. Only the 16 **mixture weights** get Bayes-updated — that
weight vector *is* the type posterior. The function-vector estimate is
always derived: `Σ weight_i × template_i`.

Update per response `r` on item with loading `L`, spread `σ`:

```
expectedPosition_i = clip(dot(L, template_i), -1, 1)
likelihood_i = gaussian_pdf(r, mean=expectedPosition_i, sd=σ)
newWeight_i ∝ oldWeight_i × likelihood_i
normalize newWeight so Σ = 1
```

Worked check against the item above: for ISTP (Ti-dominant, Ti≈1.0,
Te≈−0.14 as a shadow function), `dot(L, template) = -0.8×1.0 + 0.8×(-0.14)
≈ -0.91` — correctly lands near the Ti/left pole (r=−1). This is the sanity
check to re-run any time an item's loading or a template value changes.

Start `weight_i = 1/16` for all types (uniform prior).

## Question selection (v1)

Among items not yet asked and not in cooldown: take the current top-K
(e.g. top 4) types by weight, compute `expectedPosition_i` for each on the
candidate item, pick the item with the largest spread across those K
values (i.e. most likely to separate the current leaders). No entropy math
in v1 — see `project-brief.md` Appendix B for the documented upgrade path
(expected information gain) if this ever gets revisited.

## Session flow

- Fixed at exactly 25 questions. No early stopping, no dynamic
  continuation (that's a deferred future extension — do not build it now).
- Skips: no weight update, item returns to pool with a 3-question cooldown
  before it's eligible again.
- Decoy items (zero-loaded): logged only (skip/decoy logs can share a
  simple structure), never affect scoring or the results screen.
- After 25 questions: 2–3 short intake items (recent stress level, a
  sleep/burnout proxy, age) before showing results. These never touch the
  scoring model — narrative layer only (see below).

## Results & discrepancy flags

Compute once at the end, from final weights:

- **Best-fit type** = argmax(weight).
- **Function vector** = weighted average of templates (already the thing
  you've been deriving each round).
- **Dominant/auxiliary inversion**: flag if, within the derived function
  vector, the best-fit type's rank-2 (auxiliary) function scores higher
  than its rank-1 (dominant) function.
- **Shadow intrusion**: flag if any rank 5–8 (shadow) function in the
  derived vector scores higher than either of the rank 3–4 (tertiary/
  inferior) functions.
- **Poor differentiation**: flag if any same-letter opposite-attitude pair
  (Ti/Te, Fi/Fe, Ni/Ne, Si/Se) differ by less than ~0.15 in the derived
  vector.

All thresholds above are starting defaults — tune by feel once real
sessions are running.

**Narrative/state softening**: age and the stress/sleep intake items only
adjust how a flag is *worded* (e.g. softening a dominant/auxiliary gap for
a younger respondent, or noting a stress-consistent shadow spike) — they
never modify weights, templates, or thresholds themselves.

## Explicitly out of scope for this build

- Dynamic continuation past 25 questions / two-type comparison output.
- Any server-side data collection or likelihood calibration from real
  responses.

## Working style

- Diagnose before implementing — talk through the approach first, then a
  single consolidated implementation step, consistent with how Nathan
  works on his other Claude Code projects.
- No build tooling beyond what's strictly needed (no bundler/framework
  unless something concrete demands it).
