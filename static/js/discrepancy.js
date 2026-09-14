// Post-quiz discrepancy flags, computed once from the final derived
// function vector and the best-fit type's canonical rank order.
//
// All thresholds below are starting defaults per CLAUDE.md — tune by feel
// once real sessions are running.

const OPPOSITE_PAIRS = [
  ["Ti", "Te"],
  ["Fi", "Fe"],
  ["Ni", "Ne"],
  ["Si", "Se"],
];

const DIFFERENTIATION_THRESHOLD = 0.15;

function functionAtRank(ranks, rank) {
  return Object.keys(ranks).find((fn) => ranks[fn] === rank);
}

// `rawFunctionVector` (see Scoring.deriveRawFunctionVector) is optional and
// defaults to `functionVector` — callers that don't have raw axis evidence
// handy (e.g. existing tests passing a synthetic vector) get the old
// behavior unchanged. Only the shadow_intrusion check uses it: the
// template-derived `functionVector` is a weighted average of canonical
// type templates, so it structurally cannot show a shadow function
// outscoring a tertiary/inferior function unless the type posterior
// itself is genuinely split — it stays pinned near the winning type's own
// template even when a respondent's raw answers lean toward a shadow
// function. `rawFunctionVector`, built directly from axis-item responses,
// isn't confined that way.
function computeFlags(bestFitType, functionVector, typeRanks, rawFunctionVector = functionVector) {
  const ranks = typeRanks[bestFitType];
  const flags = [];

  const dominant = functionAtRank(ranks, 0);
  const auxiliary = functionAtRank(ranks, 1);
  if (functionVector[auxiliary] > functionVector[dominant]) {
    flags.push({
      type: "dominant_auxiliary_inversion",
      dominant,
      auxiliary,
      dominantScore: functionVector[dominant],
      auxiliaryScore: functionVector[auxiliary],
    });
  }

  const tertiary = functionAtRank(ranks, 2);
  const inferior = functionAtRank(ranks, 3);
  const shadowFunctions = [4, 5, 6, 7].map((rank) => functionAtRank(ranks, rank));
  for (const shadowFn of shadowFunctions) {
    if (
      rawFunctionVector[shadowFn] > rawFunctionVector[tertiary] ||
      rawFunctionVector[shadowFn] > rawFunctionVector[inferior]
    ) {
      flags.push({
        type: "shadow_intrusion",
        shadowFunction: shadowFn,
        shadowScore: rawFunctionVector[shadowFn],
        tertiary,
        tertiaryScore: rawFunctionVector[tertiary],
        inferior,
        inferiorScore: rawFunctionVector[inferior],
      });
    }
  }

  for (const [introverted, extraverted] of OPPOSITE_PAIRS) {
    const diff = Math.abs(functionVector[introverted] - functionVector[extraverted]);
    if (diff < DIFFERENTIATION_THRESHOLD) {
      flags.push({
        type: "poor_differentiation",
        pair: [introverted, extraverted],
        introvertedScore: functionVector[introverted],
        extravertedScore: functionVector[extraverted],
        diff,
      });
    }
  }

  return flags;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { OPPOSITE_PAIRS, DIFFERENTIATION_THRESHOLD, computeFlags };
}
