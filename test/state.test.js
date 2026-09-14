const test = require("node:test");
const assert = require("node:assert/strict");
const { Templates, ITEMS, State } = require("./setup");
const { withSeededRandom } = require("./seeded-random");

const AXES = ["ti_te", "fi_fe", "ni_ne", "si_se"];
const COVERAGE_WINDOW = 8; // must match state.js

function axisOf(item) {
  return item.kind === "axis" ? item.id.split("_").slice(0, 2).join("_") : null;
}

function runSession(responseFn) {
  const session = State.createSession(ITEMS, Templates.TYPE_TEMPLATES);
  const kinds = [];
  const firstSeenAt = {};
  let q = 0;
  while (!State.isDone(session)) {
    const item = State.nextItem(session, Templates.TYPE_TEMPLATES);
    q++;
    kinds.push(item.kind);
    const axis = axisOf(item);
    if (axis && !(axis in firstSeenAt)) firstSeenAt[axis] = q;
    State.recordResponse(session, item, responseFn(item), Templates.TYPE_TEMPLATES);
  }
  return { session, kinds, firstSeenAt };
}

test("every axis is asked at least once within the coverage window (many sessions)", () => {
  withSeededRandom(1, () => {
    for (let trial = 0; trial < 30; trial++) {
      const { firstSeenAt } = runSession(() => Math.random() * 2 - 1);
      AXES.forEach((axis) => {
        assert.ok(axis in firstSeenAt, `trial ${trial}: axis "${axis}" was never asked`);
        assert.ok(
          firstSeenAt[axis] <= COVERAGE_WINDOW,
          `trial ${trial}: axis "${axis}" first asked at Q${firstSeenAt[axis]}, expected <= Q${COVERAGE_WINDOW}`
        );
      });
    }
  });
});

test("axis coverage order varies between sessions (not always the same fixed order)", () => {
  const orders = new Set();
  withSeededRandom(2, () => {
    for (let trial = 0; trial < 20; trial++) {
      const { firstSeenAt } = runSession(() => Math.random() * 2 - 1);
      const order = AXES.slice().sort((a, b) => firstSeenAt[a] - firstSeenAt[b]).join(",");
      orders.add(order);
    }
  });
  assert.ok(orders.size > 1, "expected more than one distinct axis ordering across sessions");
});

test("decoys land at exactly question 9 and question 19", () => {
  const { kinds } = runSession(() => 0);
  assert.equal(kinds[8], "decoy");
  assert.equal(kinds[18], "decoy");
  assert.equal(kinds.filter((k) => k === "decoy").length, 2);
});

test("a skipped item is not reselected until its cooldown expires", () => {
  const session = State.createSession(ITEMS, Templates.TYPE_TEMPLATES);
  const skipped = State.nextItem(session, Templates.TYPE_TEMPLATES);
  State.recordSkip(session, skipped);

  for (let i = 0; i < State.COOLDOWN_LENGTH; i++) {
    const item = State.nextItem(session, Templates.TYPE_TEMPLATES);
    assert.notEqual(item.id, skipped.id, `skipped item resurfaced too early, at cooldown step ${i}`);
    State.recordResponse(session, item, 0, Templates.TYPE_TEMPLATES);
  }
});

test("session ends after exactly TOTAL_QUESTIONS answers", () => {
  const { kinds } = runSession(() => 0);
  assert.equal(kinds.length, State.TOTAL_QUESTIONS);
});
