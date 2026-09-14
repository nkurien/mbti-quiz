// v1 question selection heuristic (see project-brief.md Appendix B for the
// documented future upgrade to expected-information-gain). Among eligible
// items, take the current top-K types by weight, compute each candidate
// item's expected slider position against those K templates, and pick the
// item with the largest spread across those K expected positions — i.e.
// the item most likely to separate the current leaders.

function topKTypes(weights, k) {
  return Object.keys(weights)
    .sort((a, b) => weights[b] - weights[a])
    .slice(0, k);
}

// Ties (or near-ties) in spread are common, especially on the uniform
// prior before any answers come in — without randomizing among them, the
// opening run of questions would be identical for every session, since
// `Object.keys` iteration order is otherwise deterministic. `epsilon`
// controls how close two spreads have to be to count as tied.
const TIE_EPSILON = 1e-9;

function selectNextItem(candidateItems, weights, templates, dot, clip, k = 4) {
  const leaders = topKTypes(weights, k);
  let bestSpread = -Infinity;
  let tiedBest = [];

  for (const item of candidateItems) {
    const positions = leaders.map((type) => clip(dot(item.loading, templates[type]), -1, 1));
    const spread = Math.max(...positions) - Math.min(...positions);
    if (spread > bestSpread + TIE_EPSILON) {
      bestSpread = spread;
      tiedBest = [item];
    } else if (spread > bestSpread - TIE_EPSILON) {
      tiedBest.push(item);
    }
  }
  if (tiedBest.length === 0) return null;
  return tiedBest[Math.floor(Math.random() * tiedBest.length)];
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { topKTypes, selectNextItem };
}
