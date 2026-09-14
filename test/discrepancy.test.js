const test = require("node:test");
const assert = require("node:assert/strict");
const { Templates } = require("./setup");
const path = require("path");
const { OPPOSITE_PAIRS, DIFFERENTIATION_THRESHOLD, computeFlags } = require(
  path.join(__dirname, "..", "static", "js", "discrepancy.js")
);

const { TYPE_RANKS, ALL_FUNCTIONS } = Templates;

// INTJ ranks (see templates.js): Ni=0 Te=1 Fi=2 Se=3 Ne=4 Ti=5 Fe=6 Si=7
function cleanVector() {
  const v = {};
  ALL_FUNCTIONS.forEach((fn) => {
    v[fn] = 1 - TYPE_RANKS.INTJ[fn] * (2 / 7);
  });
  return v;
}

test("computeFlags raises no flags for a vector that matches the canonical stack order", () => {
  const flags = computeFlags("INTJ", cleanVector(), TYPE_RANKS);
  assert.deepEqual(flags, []);
});

test("computeFlags flags dominant/auxiliary inversion when the aux outscores the dominant", () => {
  const v = cleanVector();
  v.Te = 0.9;
  v.Ni = 0.5; // auxiliary now above dominant
  const flags = computeFlags("INTJ", v, TYPE_RANKS);
  const flag = flags.find((f) => f.type === "dominant_auxiliary_inversion");
  assert.ok(flag, "expected a dominant_auxiliary_inversion flag");
  assert.equal(flag.dominant, "Ni");
  assert.equal(flag.auxiliary, "Te");
});

test("computeFlags does not flag inversion when the dominant leads", () => {
  const v = cleanVector();
  const flags = computeFlags("INTJ", v, TYPE_RANKS);
  assert.ok(!flags.some((f) => f.type === "dominant_auxiliary_inversion"));
});

test("computeFlags flags shadow intrusion when a shadow function outscores tertiary/inferior", () => {
  const v = cleanVector();
  // Ne is a shadow function (rank 4) for INTJ; push it above both
  // tertiary (Fi, rank 2) and inferior (Se, rank 3).
  v.Ne = 0.8;
  const flags = computeFlags("INTJ", v, TYPE_RANKS);
  const flag = flags.find((f) => f.type === "shadow_intrusion" && f.shadowFunction === "Ne");
  assert.ok(flag, "expected a shadow_intrusion flag for Ne");
  assert.equal(flag.tertiary, "Fi");
  assert.equal(flag.inferior, "Se");
});

test("computeFlags does not flag shadow intrusion for a clean stack", () => {
  const v = cleanVector();
  const flags = computeFlags("INTJ", v, TYPE_RANKS);
  assert.ok(!flags.some((f) => f.type === "shadow_intrusion"));
});

test("computeFlags flags poor differentiation when an opposite-attitude pair is close", () => {
  const v = cleanVector();
  v.Ti = v.Te + 0.05; // within DIFFERENTIATION_THRESHOLD
  const flags = computeFlags("INTJ", v, TYPE_RANKS);
  const flag = flags.find((f) => f.type === "poor_differentiation" && f.pair.includes("Ti") && f.pair.includes("Te"));
  assert.ok(flag, "expected a poor_differentiation flag for Ti/Te");
  assert.ok(flag.diff < DIFFERENTIATION_THRESHOLD);
});

test("computeFlags does not flag differentiation for a well-separated pair", () => {
  const v = cleanVector();
  const flags = computeFlags("INTJ", v, TYPE_RANKS);
  assert.ok(!flags.some((f) => f.type === "poor_differentiation"));
});

test("OPPOSITE_PAIRS covers all four same-letter opposite-attitude pairs", () => {
  const flat = OPPOSITE_PAIRS.flat().sort();
  assert.deepEqual(flat, ["Fe", "Fi", "Ne", "Ni", "Se", "Si", "Te", "Ti"].sort());
});
