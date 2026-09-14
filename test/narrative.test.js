const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { buildResultsNarrative, describeFlag, isYoung, isStressed } = require(
  path.join(__dirname, "..", "static", "js", "narrative.js")
);

test("isYoung is false with no intake, and handles missing/zero/null age", () => {
  assert.equal(isYoung(undefined), false);
  assert.equal(isYoung(null), false);
  assert.equal(isYoung({}), false);
  assert.equal(isYoung({ age: 0 }), false);
  assert.equal(isYoung({ age: null }), false);
});

test("isYoung is true only for ages under 25", () => {
  assert.equal(isYoung({ age: 19 }), true);
  assert.equal(isYoung({ age: 25 }), false);
  assert.equal(isYoung({ age: 40 }), false);
});

test("isStressed is true when stress is high or sleep is poor", () => {
  assert.equal(isStressed({ stress: "high", sleep: "good" }), true);
  assert.equal(isStressed({ stress: "low", sleep: "poor" }), true);
  assert.equal(isStressed({ stress: "low", sleep: "good" }), false);
  assert.ok(!isStressed(null));
});

test("describeFlag softens dominant/auxiliary inversion wording for a young respondent", () => {
  const flag = { type: "dominant_auxiliary_inversion", dominant: "Ni", auxiliary: "Te" };
  const youngText = describeFlag(flag, { age: 19 });
  const olderText = describeFlag(flag, { age: 40 });
  assert.match(youngText, /earlier in life/);
  assert.doesNotMatch(olderText, /earlier in life/);
});

test("describeFlag notes recent stress/sleep for a shadow intrusion flag when intake says stressed", () => {
  const flag = { type: "shadow_intrusion", shadowFunction: "Ne" };
  const stressedText = describeFlag(flag, { stress: "high", sleep: "good" });
  const calmText = describeFlag(flag, { stress: "low", sleep: "good" });
  assert.match(stressedText, /recent stress and sleep/);
  assert.doesNotMatch(calmText, /recent stress and sleep/);
});

test("describeFlag names both functions in a poor differentiation flag", () => {
  const flag = { type: "poor_differentiation", pair: ["Ti", "Te"] };
  const text = describeFlag(flag, {});
  assert.match(text, /Introverted Thinking/);
  assert.match(text, /Extraverted Thinking/);
});

test("buildResultsNarrative reports a clean fit when there are no flags", () => {
  const paragraphs = buildResultsNarrative("INTJ", {}, [], {});
  assert.equal(paragraphs.length, 2);
  assert.match(paragraphs[0], /INTJ/);
  assert.match(paragraphs[1], /line up cleanly/);
});

test("buildResultsNarrative adds one paragraph per flag", () => {
  const flags = [
    { type: "dominant_auxiliary_inversion", dominant: "Ni", auxiliary: "Te" },
    { type: "poor_differentiation", pair: ["Fi", "Fe"] },
  ];
  const paragraphs = buildResultsNarrative("INTJ", {}, flags, {});
  assert.equal(paragraphs.length, 3);
});

test("buildResultsNarrative never mentions Bayesian/technical scoring jargon", () => {
  const flags = [
    { type: "dominant_auxiliary_inversion", dominant: "Ni", auxiliary: "Te" },
    { type: "shadow_intrusion", shadowFunction: "Ne" },
    { type: "poor_differentiation", pair: ["Fi", "Fe"] },
  ];
  const text = buildResultsNarrative("INTJ", {}, flags, { age: 19, stress: "high", sleep: "poor" }).join(" ");
  assert.doesNotMatch(text, /bayesian|posterior|weight|likelihood/i);
});
