// 16 canonical type templates, each an 8-function vector on [-1, +1].
//
// Generation rule (see CLAUDE.md "Template generation rule"): take each
// type's ranked stack — 4 conscious positions (dominant..inferior) from
// project-brief.md Appendix A, then the 4 shadow positions (same 4
// functions, opposite attitude, same order) — and assign values evenly
// spaced from +1.0 (rank 1) down to -1.0 (rank 8), step = 2/7 ≈ 0.2857.
//
// Shadow derivation: flip the attitude letter (i/e) on each of the 4
// conscious functions, keep the same order. E.g. INTJ conscious stack
// Ni-Te-Fi-Se (ranks 1-4) -> shadow stack Ne-Ti-Fe-Si (ranks 5-8).

const CONSCIOUS_STACKS = {
  ISTJ: ["Si", "Te", "Fi", "Ne"],
  ISFJ: ["Si", "Fe", "Ti", "Ne"],
  INFJ: ["Ni", "Fe", "Ti", "Se"],
  INTJ: ["Ni", "Te", "Fi", "Se"],
  ISTP: ["Ti", "Se", "Ni", "Fe"],
  ISFP: ["Fi", "Se", "Ni", "Te"],
  INFP: ["Fi", "Ne", "Si", "Te"],
  INTP: ["Ti", "Ne", "Si", "Fe"],
  ESTP: ["Se", "Ti", "Fe", "Ni"],
  ESFP: ["Se", "Fi", "Te", "Ni"],
  ENFP: ["Ne", "Fi", "Te", "Si"],
  ENTP: ["Ne", "Ti", "Fe", "Si"],
  ESTJ: ["Te", "Si", "Ne", "Fi"],
  ESFJ: ["Fe", "Si", "Ne", "Ti"],
  ENFJ: ["Fe", "Ni", "Se", "Ti"],
  ENTJ: ["Te", "Ni", "Se", "Fi"],
};

const ALL_FUNCTIONS = ["Ni", "Ne", "Si", "Se", "Ti", "Te", "Fi", "Fe"];

function flipAttitude(fn) {
  const letter = fn[0];
  const attitude = fn[1];
  const flipped = attitude === "i" ? "e" : "i";
  return letter + flipped;
}

function buildFullStack(consciousFour) {
  const shadow = consciousFour.map(flipAttitude);
  return consciousFour.concat(shadow);
}

function buildTemplate(consciousFour) {
  const fullStack = buildFullStack(consciousFour); // rank 1..8
  const step = 2 / 7;
  const template = {};
  fullStack.forEach((fn, rank) => {
    template[fn] = 1 - rank * step; // rank 0 -> 1.0, rank 7 -> -1.0
  });
  return template;
}

const TYPE_TEMPLATES = {};
for (const [type, stack] of Object.entries(CONSCIOUS_STACKS)) {
  TYPE_TEMPLATES[type] = buildTemplate(stack);
}

// Rank lookup per type, used by discrepancy.js (dominant/auxiliary
// inversion, shadow intrusion). Rank is 0-indexed (0 = dominant).
const TYPE_RANKS = {};
for (const [type, stack] of Object.entries(CONSCIOUS_STACKS)) {
  const fullStack = buildFullStack(stack);
  const ranks = {};
  fullStack.forEach((fn, rank) => {
    ranks[fn] = rank;
  });
  TYPE_RANKS[type] = ranks;
}

// Per-type colours, used only to anonymise the in-quiz leaning display
// (a dot + bar in this colour stands in for the type name/letters so the
// respondent isn't shown which type is currently leading). Picked for
// mutual distinctness at a glance; INTJ is dark orange per project brief.
const TYPE_COLORS = {
  INTJ: "#b5541b", // dark orange
  ISTJ: "#4a5a6b", // slate blue-grey
  ISFJ: "#7a8c6e", // sage green
  INFJ: "#5b4a8a", // deep violet
  ISTP: "#3c7a7a", // teal
  ISFP: "#c17a9e", // dusty pink
  INFP: "#8a6bb0", // lavender purple
  INTP: "#4d8fc4", // steel blue
  ESTP: "#c4472a", // brick red
  ESFP: "#e0a83c", // amber
  ENFP: "#e0673c", // coral orange
  ENTP: "#d4a017", // mustard gold
  ESTJ: "#2f6b4f", // forest green
  ESFJ: "#c45f8a", // rose pink
  ENFJ: "#3ba36e", // emerald green
  ENTJ: "#8a2f2f", // dark red
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TYPE_TEMPLATES, TYPE_RANKS, ALL_FUNCTIONS, CONSCIOUS_STACKS, TYPE_COLORS };
}
