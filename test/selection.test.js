const test = require("node:test");
const assert = require("node:assert/strict");
const { Templates, Scoring, Selection } = require("./setup");
const { withSeededRandom } = require("./seeded-random");

test("topKTypes returns the k highest-weight types, highest first", () => {
  const weights = { A: 0.5, B: 0.3, C: 0.1, D: 0.1 };
  assert.deepEqual(Selection.topKTypes(weights, 2), ["A", "B"]);
});

test("selectNextItem never returns an item outside the max-spread tie set", () => {
  const weights = Scoring.createUniformWeights(Object.keys(Templates.TYPE_TEMPLATES));
  const strong = { id: "strong", loading: { Ti: -0.8, Te: 0.8 }, spread: 0.4 };
  const weak = { id: "weak", loading: { Fi: -0.05, Fe: 0.05 }, spread: 0.4 };

  withSeededRandom(42, () => {
    for (let i = 0; i < 50; i++) {
      const picked = Selection.selectNextItem(
        [strong, weak],
        weights,
        Templates.TYPE_TEMPLATES,
        Scoring.dot,
        Scoring.clip,
        4
      );
      assert.equal(picked.id, "strong");
    }
  });
});

test("selectNextItem breaks ties among equally-good items instead of always picking the first", () => {
  const weights = Scoring.createUniformWeights(Object.keys(Templates.TYPE_TEMPLATES));
  // Two items with identical loading (and therefore identical spread) should
  // both get picked over enough draws, proving the tie-break isn't fixed.
  const a = { id: "a", loading: { Ti: -0.8, Te: 0.8 }, spread: 0.4 };
  const b = { id: "b", loading: { Ti: -0.8, Te: 0.8 }, spread: 0.4 };

  const picks = withSeededRandom(7, () => {
    const seen = new Set();
    for (let i = 0; i < 50; i++) {
      const picked = Selection.selectNextItem([a, b], weights, Templates.TYPE_TEMPLATES, Scoring.dot, Scoring.clip, 4);
      seen.add(picked.id);
    }
    return seen;
  });

  assert.ok(picks.has("a") && picks.has("b"), `expected both items to be picked at least once, got ${[...picks]}`);
});
