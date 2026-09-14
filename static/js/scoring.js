// Bayesian scoring engine. The person's function vector is modeled as a
// mixture of the 16 type templates; only the 16 mixture weights ever get
// updated. The continuous function-vector estimate is always derived:
// Σ weight_i * template_i. There is one model here, not two that could
// drift apart.

function clip(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function dot(loading, template) {
  let sum = 0;
  for (const fn in loading) {
    sum += loading[fn] * (template[fn] || 0);
  }
  return sum;
}

function gaussianPdf(x, mean, sd) {
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

function createUniformWeights(types) {
  const w = {};
  const p = 1 / types.length;
  types.forEach((t) => (w[t] = p));
  return w;
}

// Applies one Bayesian update in place-safe fashion, returning new weights.
// `response` r is the slider value in [-1, 1]. Decoy items (empty loading)
// should never be passed here — the caller is responsible for routing
// decoys to logging only.
function updateWeights(weights, item, response, templates) {
  const newWeights = {};
  let total = 0;
  for (const type in weights) {
    const template = templates[type];
    const expected = clip(dot(item.loading, template), -1, 1);
    const likelihood = gaussianPdf(response, expected, item.spread);
    const nw = weights[type] * likelihood;
    newWeights[type] = nw;
    total += nw;
  }
  if (total <= 0 || !isFinite(total)) {
    // Degenerate update (e.g. all likelihoods underflowed to 0) — leave
    // weights unchanged rather than dividing by zero.
    return { ...weights };
  }
  for (const type in newWeights) {
    newWeights[type] /= total;
  }
  return newWeights;
}

// Derived function vector: weighted average of the 16 templates. Because
// every template is built by the same linear-rank formula (see
// templates.js), this vector can only ever land inside the convex hull of
// the 16 templates — it structurally cannot represent an "off-template"
// combination (e.g. a genuinely strong shadow function alongside a
// dominant function no canonical type pairs it with). See
// deriveRawFunctionVector below for the un-model-confined counterpart.
function deriveFunctionVector(weights, templates, allFunctions) {
  const vector = {};
  allFunctions.forEach((fn) => (vector[fn] = 0));
  for (const type in weights) {
    const w = weights[type];
    const template = templates[type];
    allFunctions.forEach((fn) => {
      vector[fn] += w * template[fn];
    });
  }
  return vector;
}

// Axis id -> [negative-pole function, positive-pole function], matching
// the sign convention in items.js (left/negative, right/positive).
const AXIS_FUNCTIONS = {
  ti_te: ["Ti", "Te"],
  fi_fe: ["Fi", "Fe"],
  ni_ne: ["Ni", "Ne"],
  si_se: ["Si", "Se"],
};

// Raw function vector: the plain average of the person's own axis-item
// responses, per axis — never touches the type templates or mixture
// weights, so it isn't confined to the space of canonical type profiles.
// Only "axis" items (clean same-letter contrasts) feed this; "cross"
// items conflate two functions in one response and can't be cleanly
// attributed to either. `axisEvidence` is `{ axisId: [responses] }` from
// session state.
function deriveRawFunctionVector(axisEvidence, allFunctions) {
  const vector = {};
  allFunctions.forEach((fn) => (vector[fn] = 0));
  for (const axis in AXIS_FUNCTIONS) {
    const responses = axisEvidence[axis] || [];
    const avg = responses.length ? responses.reduce((a, b) => a + b, 0) / responses.length : 0;
    const [negFn, posFn] = AXIS_FUNCTIONS[axis];
    // `avg === 0 ? 0 : -avg` avoids a stray -0 (from `-0` on empty/balanced
    // evidence), which is a real distinct value in JS and trips strict
    // equality checks despite meaning the same thing here.
    vector[negFn] = avg === 0 ? 0 : -avg;
    vector[posFn] = avg;
  }
  return vector;
}

function bestFitType(weights) {
  let best = null;
  let bestWeight = -Infinity;
  for (const type in weights) {
    if (weights[type] > bestWeight) {
      bestWeight = weights[type];
      best = type;
    }
  }
  return best;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    clip,
    dot,
    gaussianPdf,
    createUniformWeights,
    updateWeights,
    deriveFunctionVector,
    deriveRawFunctionVector,
    bestFitType,
  };
}
