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
