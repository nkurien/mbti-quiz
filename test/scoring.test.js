const test = require("node:test");
const assert = require("node:assert/strict");
const { Templates, Scoring } = require("./setup");

test("clip bounds values to [-1, 1]", () => {
  assert.equal(Scoring.clip(5, -1, 1), 1);
  assert.equal(Scoring.clip(-5, -1, 1), -1);
  assert.equal(Scoring.clip(0.3, -1, 1), 0.3);
});

test("dot ignores functions absent from the loading", () => {
  assert.equal(Scoring.dot({}, Templates.TYPE_TEMPLATES.INTJ), 0);
});

test("CLAUDE.md worked example: ti_te_01 loading against ISTP lands near -0.91", () => {
  // Ti dominant (~1.0), Te as a shadow function (~-0.14) for ISTP.
  const loading = { Ti: -0.8, Te: 0.8 };
  const value = Scoring.dot(loading, Templates.TYPE_TEMPLATES.ISTP);
  assert.ok(Math.abs(value - -0.91) < 0.02, `expected ~-0.91, got ${value}`);
});

test("createUniformWeights sums to 1 and is flat across all types", () => {
  const types = Object.keys(Templates.TYPE_TEMPLATES);
  const weights = Scoring.createUniformWeights(types);
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
  types.forEach((t) => assert.ok(Math.abs(weights[t] - 1 / types.length) < 1e-9));
});

test("updateWeights always renormalizes to sum 1", () => {
  const types = Object.keys(Templates.TYPE_TEMPLATES);
  const weights = Scoring.createUniformWeights(types);
  const item = { loading: { Ti: -0.8, Te: 0.8 }, spread: 0.4 };
  const updated = Scoring.updateWeights(weights, item, -0.9, Templates.TYPE_TEMPLATES);
  const total = Object.values(updated).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
});

test("updateWeights raises weight for types whose expected position matches the response", () => {
  const types = Object.keys(Templates.TYPE_TEMPLATES);
  const weights = Scoring.createUniformWeights(types);
  const item = { loading: { Ti: -0.8, Te: 0.8 }, spread: 0.4 };
  // A strong left-pole (Ti) answer should favor ISTP/INTP over ESTJ/ENTJ.
  const updated = Scoring.updateWeights(weights, item, -0.9, Templates.TYPE_TEMPLATES);
  assert.ok(updated.ISTP > updated.ESTJ);
  assert.ok(updated.INTP > updated.ENTJ);
});

test("deriveFunctionVector is the weighted average of the templates", () => {
  const weights = { INTJ: 0.5, ESFP: 0.5 };
  const templates = { INTJ: Templates.TYPE_TEMPLATES.INTJ, ESFP: Templates.TYPE_TEMPLATES.ESFP };
  const vector = Scoring.deriveFunctionVector(weights, templates, Templates.ALL_FUNCTIONS);
  Templates.ALL_FUNCTIONS.forEach((fn) => {
    const expected = 0.5 * Templates.TYPE_TEMPLATES.INTJ[fn] + 0.5 * Templates.TYPE_TEMPLATES.ESFP[fn];
    assert.ok(Math.abs(vector[fn] - expected) < 1e-9);
  });
});

test("bestFitType returns the argmax type", () => {
  assert.equal(Scoring.bestFitType({ INTJ: 0.2, ENTJ: 0.7, ISFP: 0.1 }), "ENTJ");
});

test("deriveRawFunctionVector averages responses per axis with the sign convention applied", () => {
  // ti_te: left/negative pole is Ti, right/positive pole is Te — a -0.8
  // response (leaning Ti) should read as high Ti, low Te.
  const axisEvidence = { ti_te: [-0.8, -0.6], fi_fe: [], ni_ne: [0.4], si_se: [] };
  const vector = Scoring.deriveRawFunctionVector(axisEvidence, Templates.ALL_FUNCTIONS);
  assert.ok(Math.abs(vector.Ti - 0.7) < 1e-9, `expected Ti ~0.7, got ${vector.Ti}`);
  assert.ok(Math.abs(vector.Te - -0.7) < 1e-9, `expected Te ~-0.7, got ${vector.Te}`);
  assert.ok(Math.abs(vector.Ne - 0.4) < 1e-9, `expected Ne ~0.4, got ${vector.Ne}`);
  assert.ok(Math.abs(vector.Ni - -0.4) < 1e-9, `expected Ni ~-0.4, got ${vector.Ni}`);
});

test("deriveRawFunctionVector defaults an axis with no evidence to 0, not undefined", () => {
  const axisEvidence = { ti_te: [], fi_fe: [], ni_ne: [], si_se: [] };
  const vector = Scoring.deriveRawFunctionVector(axisEvidence, Templates.ALL_FUNCTIONS);
  Templates.ALL_FUNCTIONS.forEach((fn) => assert.equal(vector[fn], 0));
});

test("deriveRawFunctionVector is not confined to the space of canonical templates", () => {
  // No canonical type template has both Ni and Ti scoring high at once —
  // that's exactly the "off-template" shadow-intrusion case the mixture
  // model's derived vector structurally can't represent. Raw axis
  // evidence isn't built from templates at all, so it can.
  const axisEvidence = { ti_te: [-0.9], fi_fe: [], ni_ne: [-0.9], si_se: [] };
  const vector = Scoring.deriveRawFunctionVector(axisEvidence, Templates.ALL_FUNCTIONS);
  assert.ok(vector.Ni > 0.8 && vector.Ti > 0.8, "expected both Ni and Ti to score high simultaneously");
});
