// Session state: weights, item pool bookkeeping, skip cooldowns, logs.
//
// Decoy items are zero-loaded and would almost never win the
// spread-maximizing heuristic in selection.js on their own merits, so they
// aren't left to compete for a slot — two fixed positions in the 25-question
// session are reserved for them instead. Everything else (scoring,
// selection, results) is oblivious to decoys beyond skipping them.

const TOTAL_QUESTIONS = 25;
const COOLDOWN_LENGTH = 3;
const DECOY_POSITIONS = [9, 19]; // 1-indexed question numbers reserved for decoys

// The greedy top-K spread heuristic in selection.js has no built-in reason
// to ever touch an axis that doesn't separate the current leaders, so a
// session can spend most of its 25 questions on 1-2 axes and leave others
// almost untested — weak evidence for exactly the axes the differentiation/
// shadow flags depend on. To fix that without changing the heuristic
// itself, the first few scored questions are restricted to whichever axis
// hasn't been asked yet at all, guaranteeing baseline coverage before the
// free-form greedy selection takes over.
const AXES = ["ti_te", "fi_fe", "ni_ne", "si_se"];
const COVERAGE_WINDOW = 8; // scored (non-decoy) questions reserved for guaranteeing axis coverage
// A single axis-item response is too noisy on its own to trust as the raw
// evidence for that axis (item loadings vary in magnitude item-to-item,
// e.g. 0.6 vs 0.8, which shows up as swing in the raw response even for a
// perfectly consistent respondent) — averaging 2 evens that out. 4 axes x
// 2 fits exactly inside COVERAGE_WINDOW.
const MIN_AXIS_EVIDENCE = 2;

function functionAxis(fn) {
  const letter = fn[0].toLowerCase();
  return AXES.find((axis) => axis.startsWith(letter));
}

// Which axes an item provides evidence on. "axis" items are tagged by id
// (a single axis); "cross" items load two different-letter functions, each
// of which belongs to its own axis, so they can cover more than one — and
// should still count toward coverage for each (see AXES/COVERAGE_WINDOW
// above).
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

function createSession(items, templates) {
  const { createUniformWeights } = window.Scoring;
  return {
    weights: createUniformWeights(Object.keys(templates)),
    questionNumber: 0,
    scoredCount: 0, // scored (non-decoy) questions answered so far
    axisCounts: Object.fromEntries(AXES.map((a) => [a, 0])), // axis id -> items asked from it
    asked: new Set(), // item ids already asked (scored or decoy) or retired after 2 skips
    cooldowns: new Map(), // item id -> question number it becomes eligible again
    skipCounts: new Map(), // item id -> number of times skipped
    skipLog: [], // { itemId, atQuestion }
    decoyLog: [], // { itemId, response, atQuestion }
    responseLog: [], // { itemId, response, atQuestion } for scored items
    // Raw axis-item responses, kept separately from the mixture weights —
    // feeds Scoring.deriveRawFunctionVector for discrepancy flags that the
    // template-confined derived vector can't detect (see discrepancy.js).
    // Only "axis" items are attributed here; "cross" items load two
    // functions in one response and can't be cleanly split between them.
    axisEvidence: Object.fromEntries(AXES.map((a) => [a, []])),
    decoyPool: items.filter((i) => i.kind === "decoy"),
    scoredPool: items.filter((i) => i.kind !== "decoy"),
  };
}

function eligibleScoredItems(session) {
  return session.scoredPool.filter((item) => {
    if (session.asked.has(item.id)) return false;
    const readyAt = session.cooldowns.get(item.id);
    if (readyAt !== undefined && session.questionNumber < readyAt) return false;
    return true;
  });
}

function isDone(session) {
  return session.questionNumber >= TOTAL_QUESTIONS;
}

// Returns the next item to show: a decoy if this question number is a
// reserved decoy slot (and one is still available), otherwise the item
// chosen by the selection heuristic.
function nextItem(session, templates) {
  const nextQuestionNumber = session.questionNumber + 1;
  if (DECOY_POSITIONS.includes(nextQuestionNumber)) {
    const availableDecoy = session.decoyPool.find((i) => !session.asked.has(i.id));
    if (availableDecoy) return availableDecoy;
  }
  const { selectNextItem } = window.Selection;
  const { dot, clip } = window.Scoring;
  const candidates = eligibleScoredItems(session);

  if (session.scoredCount < COVERAGE_WINDOW) {
    const uncovered = AXES.filter((a) => session.axisEvidence[a].length < MIN_AXIS_EVIDENCE);
    const uncoveredAxis = uncovered.length
      ? uncovered[Math.floor(Math.random() * uncovered.length)]
      : null;
    if (uncoveredAxis) {
      const axisCandidates = candidates.filter((i) => axesOf(i).includes(uncoveredAxis));
      // Prefer a pure "axis" item over a "cross" item that merely touches
      // this axis: cross items conflate two functions in one response and
      // don't feed Scoring.deriveRawFunctionVector (see state.js's
      // axisEvidence and scoring.js), so satisfying coverage with one
      // would leave that axis's raw evidence empty even though the axis
      // itself was "covered". Fall back to cross items only if no pure
      // axis item is available (e.g. all retired after being skipped
      // twice).
      const pureAxisCandidates = axisCandidates.filter((i) => i.kind === "axis");
      const pool = pureAxisCandidates.length ? pureAxisCandidates : axisCandidates;
      if (pool.length) {
        return selectNextItem(pool, session.weights, templates, dot, clip);
      }
    }
  }

  return selectNextItem(candidates, session.weights, templates, dot, clip);
}

// Records a response (slider value in [-1, 1]) and advances state.
function recordResponse(session, item, response, templates) {
  session.questionNumber += 1;
  session.asked.add(item.id);

  if (item.kind === "decoy") {
    session.decoyLog.push({ itemId: item.id, response, atQuestion: session.questionNumber });
    return;
  }

  const { updateWeights } = window.Scoring;
  session.weights = updateWeights(session.weights, item, response, templates);
  session.responseLog.push({ itemId: item.id, response, atQuestion: session.questionNumber });
  session.scoredCount += 1;
  axesOf(item).forEach((axis) => {
    session.axisCounts[axis] += 1;
  });
  if (item.kind === "axis") {
    session.axisEvidence[axesOf(item)[0]].push(response);
  }
}

// Records a skip: no weight update, item goes on cooldown. A second skip
// of the same item retires it for the rest of the session instead of
// cycling it back after another cooldown — one re-presentation is enough
// budget to spend on an item the respondent has already passed on twice.
function recordSkip(session, item) {
  session.questionNumber += 1;
  session.skipLog.push({ itemId: item.id, atQuestion: session.questionNumber });
  session.skipCounts.set(item.id, (session.skipCounts.get(item.id) || 0) + 1);
  if (session.skipCounts.get(item.id) >= 2) {
    session.asked.add(item.id);
  } else {
    session.cooldowns.set(item.id, session.questionNumber + COOLDOWN_LENGTH);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    TOTAL_QUESTIONS,
    COOLDOWN_LENGTH,
    DECOY_POSITIONS,
    createSession,
    eligibleScoredItems,
    isDone,
    nextItem,
    recordResponse,
    recordSkip,
  };
}
