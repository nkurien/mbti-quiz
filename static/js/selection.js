// v1 question selection heuristic (see project-brief.md Appendix B for the
// documented future upgrade to expected-information-gain). Among eligible
// items, take the current top-K types by weight, compute each candidate
// item's expected slider position against those K templates, and pick the
// item that best separates the current leaders — weighted by how much
// weight each leader actually holds, not just raw min/max spread. A type
// sitting in the top-K with negligible weight (e.g. 0.05%) should barely
// influence the score; a raw max-min spread lets it dominate anyway if it
// happens to sit at an extreme position on an otherwise-irrelevant item.

function topKTypes(weights, k) {
  return Object.keys(weights)
    .sort((a, b) => weights[b] - weights[a])
    .slice(0, k);
}

// Ties (or near-ties) in score are common, especially on the uniform
// prior before any answers come in — without randomizing among them, the
// opening run of questions would be identical for every session, since
// `Object.keys` iteration order is otherwise deterministic. `epsilon`
// controls how close two scores have to be to count as tied.
const TIE_EPSILON = 1e-9;

// Weighted pairwise disagreement across the leaders: for every pair of
// leader types, how far apart is this item's expected position for them,
// scaled by how much weight each of the two actually holds. A pair where
// both types are plausible (high w_i * w_j) and far apart on this item
// contributes a lot; a pair involving an all-but-eliminated type
// contributes almost nothing, regardless of how far apart their positions
// are.
function weightedDisagreement(positions, leaders, weights) {
  let score = 0;
  for (let i = 0; i < leaders.length; i++) {
    for (let j = i + 1; j < leaders.length; j++) {
      score += weights[leaders[i]] * weights[leaders[j]] * Math.abs(positions[i] - positions[j]);
    }
  }
  return score;
}

function selectNextItem(candidateItems, weights, templates, dot, clip, k = 4) {
  const leaders = topKTypes(weights, k);
  let bestScore = -Infinity;
  let tiedBest = [];

  for (const item of candidateItems) {
    const positions = leaders.map((type) => clip(dot(item.loading, templates[type]), -1, 1));
    const score = weightedDisagreement(positions, leaders, weights);
    if (score > bestScore + TIE_EPSILON) {
      bestScore = score;
      tiedBest = [item];
    } else if (score > bestScore - TIE_EPSILON) {
      tiedBest.push(item);
    }
  }
  if (tiedBest.length === 0) return null;
  return tiedBest[Math.floor(Math.random() * tiedBest.length)];
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { topKTypes, selectNextItem };
}
