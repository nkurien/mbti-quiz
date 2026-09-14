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

function computeFlags(bestFitType, functionVector, typeRanks) {
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
      functionVector[shadowFn] > functionVector[tertiary] ||
      functionVector[shadowFn] > functionVector[inferior]
    ) {
      flags.push({
        type: "shadow_intrusion",
        shadowFunction: shadowFn,
        shadowScore: functionVector[shadowFn],
        tertiary,
        tertiaryScore: functionVector[tertiary],
        inferior,
        inferiorScore: functionVector[inferior],
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
