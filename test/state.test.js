const test = require("node:test");
const assert = require("node:assert/strict");
const { Templates, ITEMS, State } = require("./setup");
const { withSeededRandom } = require("./seeded-random");

const AXES = ["ti_te", "fi_fe", "ni_ne", "si_se"];
const COVERAGE_WINDOW = 8; // must match state.js

function functionAxis(fn) {
  const letter = fn[0].toLowerCase();
  return AXES.find((axis) => axis.startsWith(letter));
}

// Mirrors state.js's axesOf: an "axis" item covers its own axis; a "cross"
// item provides evidence on each axis its loaded functions belong to.
function axesOf(item) {
  if (item.kind === "axis") {
    return [item.id.split("_").slice(0, 2).join("_")];
  }
  if (item.kind === "cross") {
    return Object.keys(item.loading)
      .map(functionAxis)
      .filter((axis, i, arr) => axis && arr.indexOf(axis) === i);
  }
  return [];
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
    axesOf(item).forEach((axis) => {
      if (!(axis in firstSeenAt)) firstSeenAt[axis] = q;
    });
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

test("an item skipped twice is retired for the rest of the session, not just cooled down again", () => {
  const session = State.createSession(ITEMS, Templates.TYPE_TEMPLATES);
  const skipped = State.nextItem(session, Templates.TYPE_TEMPLATES);
  State.recordSkip(session, skipped);

  // Burn through the cooldown so the item becomes eligible again.
  for (let i = 0; i < State.COOLDOWN_LENGTH; i++) {
    const item = State.nextItem(session, Templates.TYPE_TEMPLATES);
    State.recordResponse(session, item, 0, Templates.TYPE_TEMPLATES);
  }
  assert.ok(
    State.eligibleScoredItems(session).some((i) => i.id === skipped.id),
    "expected the once-skipped item back in the pool after its cooldown"
  );

  // Skip it again — this time it should be retired outright.
  State.recordSkip(session, skipped);
  assert.ok(
    !State.eligibleScoredItems(session).some((i) => i.id === skipped.id),
    "expected the twice-skipped item to be retired, not merely cooled down"
  );

  for (let i = 0; i < State.TOTAL_QUESTIONS; i++) {
    const item = State.nextItem(session, Templates.TYPE_TEMPLATES);
    if (!item) break;
    assert.notEqual(item.id, skipped.id, "twice-skipped item resurfaced");
    if (State.isDone(session)) break;
    State.recordResponse(session, item, 0, Templates.TYPE_TEMPLATES);
  }
});

test("session ends after exactly TOTAL_QUESTIONS answers", () => {
  const { kinds } = runSession(() => 0);
  assert.equal(kinds.length, State.TOTAL_QUESTIONS);
});
