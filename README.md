# Cognitive Function Stack Test

An adaptive single-page quiz that infers a person's Jungian cognitive function stack using Bayesian updating over the 16 canonical MBTI types, rather than scoring the four letter dichotomies directly.

Live site: [mbti.nathankurien.com](https://mbti.nathankurien.com/)

## How it works

Most personality quizzes sum up answers across four independent axes (E/I, S/N, T/F, J/P). This test instead models the respondent's cognitive profile as a mixture over 16 canonical function templates.

### 1. Function templates
Each of the 16 types has an 8-function vector ordered by Jungian stack (ranks 1 to 4 for the conscious stack, ranks 5 to 8 for the corresponding shadow stack). Function values are evenly spaced from +1.0 (dominant) down to -1.0 (demon).

### 2. Bayesian scoring
The respondent starts with a uniform prior across all 16 types (weight = 1/16 each). Each question presents a scenario with two opposite poles on a continuous slider mapped from -1.0 to +1.0.

When an answer $r$ is submitted:
1. For each type, the expected slider position is computed by taking the dot product of the item loading vector and that type's template:
   $$\text{expected}_i = \text{clip}(\mathbf{L} \cdot \mathbf{T}_i, -1, 1)$$
2. Likelihood is evaluated using a Gaussian probability density function around that expected position with item spread $\sigma$:
   $$\mathcal{L}_i = \text{gaussianPdf}(r, \text{mean}=\text{expected}_i, \text{sd}=\sigma)$$
3. Mixture weights update proportionally and renormalize to sum to 1.0:
   $$w_i \leftarrow \frac{w_i \cdot \mathcal{L}_i}{\sum_j w_j \cdot \mathcal{L}_j}$$

The resulting weight vector represents the full posterior distribution over types.

### 3. Adaptive question selection
Questions are not picked in a hardcoded sequence:
- **Baseline coverage**: During the first 8 scored questions, the engine ensures each of the four main axes (Ti/Te, Fi/Fe, Ni/Ne, Si/Se) receives at least two pure axis questions.
- **Weighted disagreement**: After baseline coverage, the engine evaluates remaining candidate items against the current leading types. It selects the item that maximizes pairwise disagreement between leaders, weighted by their probabilities:
   $$\text{score} = \sum_{i < j} w_i \cdot w_j \cdot |\text{pos}_i - \text{pos}_j|$$
   This prevents eliminated types from hijacking question selection and focuses questions where the model is least certain.
- **Decoys**: Two zero-loaded decoy questions (at questions 9 and 19) are logged for consistency checks but do not touch scoring weights.
- **Skips**: A skipped item enters a 3-question cooldown. If skipped a second time, it is retired for the session.

### 4. Item bank
The bank contains 74 scenario-based items:
- **Axis items (32)**: Direct contrasts between same-letter opposite-attitude pairs (e.g. Ti vs Te).
- **Cross-axis items (36)**: Contrasts across different functions to separate adjacent-rank pairings (dominant vs auxiliary) and quadra-mate pairings (dominant vs inferior, such as Ni vs Se or Te vs Fi).
- **Decoy items (6)**: Unscored lifestyle contrasts.

### 5. Results and discrepancy flags
Once 25 questions are complete and brief intake questions (age, recent stress, recent sleep) are answered:
- **Best-fit type**: The type with the highest posterior weight.
- **Function breakdown**: Continuous scores for all 8 functions rendered on a bidirectional chart filling outward from zero.
- **Discrepancy flags**: Highlights nuances where the respondent deviates from textbook stacks:
  - *Dominant/Auxiliary Inversion*: Auxiliary function outscores dominant.
  - *Shadow Intrusion*: A shadow function outscores tertiary or inferior functions (tracked via raw axis evidence).
  - *Poor Differentiation*: An introverted/extraverted function pair differs by less than 0.15.

Intake inputs only contextualize the narrative wording (for example, softening an inversion for younger respondents or noting stress when a shadow spike occurs); they never alter mathematical weights or thresholds.

## Project structure

```
.
├── config.toml           # Hugo site config for Cloudflare Pages
├── layouts/
│   └── index.html        # Main HTML shell
├── static/
│   ├── css/
│   │   └── style.css     # CSS styles (light and dark mode)
│   └── js/
│       ├── app.js        # DOM bindings and UI screen flow
│       ├── discrepancy.js# Post-quiz discrepancy detection
│       ├── items.js      # 74-item bank with loading vectors
│       ├── narrative.js  # Result copy and contextual descriptions
│       ├── scoring.js    # Bayesian math and vector derivation
│       ├── selection.js  # Weighted question selection heuristic
│       ├── state.js      # Session state, cooldowns, and coverage
│       └── templates.js  # 16 type stacks, shadow rules, and colors
└── test/
    ├── discrepancy.test.js
    ├── narrative.test.js
    ├── scoring.test.js
    ├── selection.test.js
    ├── simulation.test.js# Seeded respondent convergence checks
    └── state.test.js
```

Zero external dependencies or bundlers. The application runs entirely on vanilla modern JavaScript, HTML5, and CSS. Hugo is used solely to match Nathan's existing personal site deployment pipeline.

## Running locally

To run the site locally with Hugo:

```bash
hugo server
```

Or serve the static directory directly with any static file server:

```bash
npx serve static
```

## Running tests

The test suite uses Node's native test runner:

```bash
npm test
```

This runs unit tests covering Bayesian updating, selection math, state transitions, narrative formatting, and simulated respondent convergence across all 16 types.
