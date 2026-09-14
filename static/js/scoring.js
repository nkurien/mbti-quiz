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

// Derived function vector: weighted average of the 16 templates.
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
    bestFitType,
  };
}
