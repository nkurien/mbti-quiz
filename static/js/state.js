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

function createSession(items, templates) {
  const { createUniformWeights } = window.Scoring;
  return {
    weights: createUniformWeights(Object.keys(templates)),
    questionNumber: 0,
    asked: new Set(), // item ids already asked (scored or decoy)
    cooldowns: new Map(), // item id -> question number it becomes eligible again
    skipLog: [], // { itemId, atQuestion }
    decoyLog: [], // { itemId, response, atQuestion }
    responseLog: [], // { itemId, response, atQuestion } for scored items
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
}

// Records a skip: no weight update, item goes on cooldown.
function recordSkip(session, item) {
  session.questionNumber += 1;
  session.skipLog.push({ itemId: item.id, atQuestion: session.questionNumber });
  session.cooldowns.set(item.id, session.questionNumber + COOLDOWN_LENGTH);
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
