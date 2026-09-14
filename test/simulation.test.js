// Replicates the ad-hoc "perfect INTJ" / "noisy INTJ" simulations used to
// investigate a real INTJ-identifying respondent scoring as ESFP. These
// tests exist to catch a regression in the scoring/selection engine that
// would make the model converge to the wrong type, not to validate any
// individual real quiz result (people are noisier than these simulations).

const test = require("node:test");
const assert = require("node:assert/strict");
const { Templates, ITEMS, Scoring, State } = require("./setup");
const { mulberry32, withSeededRandom } = require("./seeded-random");

const { dot, clip } = Scoring;

function runPerfectRespondent(type) {
  const template = Templates.TYPE_TEMPLATES[type];
  const session = State.createSession(ITEMS, Templates.TYPE_TEMPLATES);
  while (!State.isDone(session)) {
    const item = State.nextItem(session, Templates.TYPE_TEMPLATES);
    const response = item.kind === "decoy" ? 0 : clip(dot(item.loading, template), -1, 1);
    State.recordResponse(session, item, response, Templates.TYPE_TEMPLATES);
  }
  const sorted = Object.keys(session.weights).sort((a, b) => session.weights[b] - session.weights[a]);
  return { winner: sorted[0], weights: session.weights };
}

test("a perfect-answer respondent converges to their own type, for all 16 types", () => {
  withSeededRandom(100, () => {
    for (const type of Object.keys(Templates.TYPE_TEMPLATES)) {
      const { winner, weights } = runPerfectRespondent(type);
      assert.equal(winner, type, `perfect ${type} respondent scored as ${winner} instead`);
      assert.ok(
        weights[type] > 0.5,
        `perfect ${type} respondent's own weight was only ${weights[type].toFixed(3)}, expected > 0.5`
      );
    }
  });
});

// Gaussian noise via Box-Muller, using the seeded RNG so this is deterministic.
function gaussianNoise(sd) {
  const u1 = Math.random();
  const u2 = Math.random();
  return sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function runNoisyRespondent(type, noiseSd) {
  const template = Templates.TYPE_TEMPLATES[type];
  const session = State.createSession(ITEMS, Templates.TYPE_TEMPLATES);
  while (!State.isDone(session)) {
    const item = State.nextItem(session, Templates.TYPE_TEMPLATES);
    let response;
    if (item.kind === "decoy") {
      response = clip(gaussianNoise(0.3), -1, 1);
    } else {
      const truePosition = clip(dot(item.loading, template), -1, 1);
      response = clip(truePosition + gaussianNoise(noiseSd), -1, 1);
    }
    State.recordResponse(session, item, response, Templates.TYPE_TEMPLATES);
  }
  const sorted = Object.keys(session.weights).sort((a, b) => session.weights[b] - session.weights[a]);
  return sorted[0];
}

test("a moderately noisy INTJ respondent still lands on INTJ most of the time", () => {
  const rng = mulberry32(200);
  const original = Math.random;
  Math.random = rng;
  try {
    const trials = 100;
    let correct = 0;
    for (let i = 0; i < trials; i++) {
      if (runNoisyRespondent("INTJ", 0.3) === "INTJ") correct += 1;
    }
    // Matches the ~93% observed manually at this noise level; a wide floor
    // here since this is a statistical property, not an exact figure.
    assert.ok(correct / trials > 0.75, `only ${correct}/${trials} noisy INTJ runs landed on INTJ`);
  } finally {
    Math.random = original;
  }
});

test("a heavily noisy respondent's misfires stay concentrated near their true type, not scattered anywhere", () => {
  // At high noise, INTJ should mostly get confused for its nearest
  // functional neighbor (ENTJ, same Ni/Te pair) rather than something
  // functionally unrelated. This is the regression check for the kind of
  // "INTJ scored as ESFP" report that prompted this investigation: rare
  // confusion is expected, but it shouldn't dominate.
  const rng = mulberry32(300);
  const original = Math.random;
  Math.random = rng;
  try {
    const trials = 200;
    const counts = {};
    for (let i = 0; i < trials; i++) {
      const winner = runNoisyRespondent("INTJ", 0.6);
      counts[winner] = (counts[winner] || 0) + 1;
    }
    const nearNeighbors = (counts.INTJ || 0) + (counts.ENTJ || 0);
    assert.ok(
      nearNeighbors / trials > 0.8,
      `expected INTJ+ENTJ to dominate even under heavy noise, got ${JSON.stringify(counts)}`
    );
  } finally {
    Math.random = original;
  }
});
