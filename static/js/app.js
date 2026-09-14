(function () {
  const { TYPE_TEMPLATES, TYPE_RANKS, ALL_FUNCTIONS } = window.Templates;
  const { ITEMS } = window.ItemBank;
  const { deriveFunctionVector, bestFitType } = window.Scoring;
  const { computeFlags } = window.Discrepancy;
  const { buildResultsNarrative, FUNCTION_NAMES } = window.Narrative;
  const State = window.State;

  let session = State.createSession(ITEMS, TYPE_TEMPLATES);
  let currentItem = null;
  let intake = {};

  const screens = {
    intro: document.getElementById("screen-intro"),
    quiz: document.getElementById("screen-quiz"),
    intake: document.getElementById("screen-intake"),
    results: document.getElementById("screen-results"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function startQuiz() {
    session = State.createSession(ITEMS, TYPE_TEMPLATES);
    showScreen("quiz");
    renderQuestion();
  }

  function renderQuestion() {
    if (State.isDone(session)) {
      showScreen("intake");
      return;
    }
    currentItem = State.nextItem(session, TYPE_TEMPLATES);
    if (!currentItem) {
      // Pool exhausted (shouldn't happen with a 62-item bank over 25
      // questions, but fail safe into intake rather than crashing).
      showScreen("intake");
      return;
    }

    document.getElementById("question-number").textContent = session.questionNumber + 1;
    document.getElementById("question-total").textContent = State.TOTAL_QUESTIONS;
    document.getElementById("stem").textContent = currentItem.stem;
    document.getElementById("pole-left").textContent = currentItem.poles[0];
    document.getElementById("pole-right").textContent = currentItem.poles[1];

    const slider = document.getElementById("slider");
    slider.value = 0;

    renderConfidence();
    updateProgressBar();
  }

  function updateProgressBar() {
    const pct = (session.questionNumber / State.TOTAL_QUESTIONS) * 100;
    document.getElementById("progress-fill").style.width = pct + "%";
  }

  function renderConfidence() {
    const top = Object.keys(session.weights)
      .sort((a, b) => session.weights[b] - session.weights[a])
      .slice(0, 3);
    const container = document.getElementById("confidence-bars");
    container.innerHTML = "";
    top.forEach((type) => {
      const pct = Math.round(session.weights[type] * 100);
      const row = document.createElement("div");
      row.className = "confidence-row";
      row.innerHTML =
        '<span class="confidence-label">' +
        type +
        '</span><div class="confidence-track"><div class="confidence-fill" style="width:' +
        pct +
        '%"></div></div><span class="confidence-pct">' +
        pct +
        "%</span>";
      container.appendChild(row);
    });
  }

  function submitAnswer() {
    const slider = document.getElementById("slider");
    const response = parseFloat(slider.value);
    State.recordResponse(session, currentItem, response, TYPE_TEMPLATES);
    renderQuestion();
  }

  function skipQuestion() {
    State.recordSkip(session, currentItem);
    renderQuestion();
  }

  function submitIntake() {
    const age = parseInt(document.getElementById("intake-age").value, 10);
    const stress = document.getElementById("intake-stress").value;
    const sleep = document.getElementById("intake-sleep").value;
    intake = { age: isNaN(age) ? null : age, stress, sleep };
    renderResults();
  }

  function renderResults() {
    const functionVector = deriveFunctionVector(session.weights, TYPE_TEMPLATES, ALL_FUNCTIONS);
    const bestType = bestFitType(session.weights);
    const flags = computeFlags(bestType, functionVector, TYPE_RANKS);
    const narrative = buildResultsNarrative(bestType, functionVector, flags, intake);

    document.getElementById("result-type").textContent = bestType;
    const narrativeEl = document.getElementById("result-narrative");
    narrativeEl.innerHTML = "";
    narrative.forEach((p) => {
      const para = document.createElement("p");
      para.textContent = p;
      narrativeEl.appendChild(para);
    });

    const chart = document.getElementById("function-chart");
    chart.innerHTML = "";
    const ranked = ALL_FUNCTIONS.slice().sort((a, b) => functionVector[b] - functionVector[a]);
    ranked.forEach((fn) => {
      const score = functionVector[fn];
      const pct = ((score + 1) / 2) * 100;
      const row = document.createElement("div");
      row.className = "function-row";
      row.innerHTML =
        '<span class="function-label">' +
        fn +
        '</span><div class="function-track"><div class="function-fill" style="width:' +
        pct +
        '%"></div></div><span class="function-score">' +
        score.toFixed(2) +
        "</span>";
      row.title = FUNCTION_NAMES[fn];
      chart.appendChild(row);
    });

    showScreen("results");
  }

  document.getElementById("start-button").addEventListener("click", startQuiz);
  document.getElementById("submit-button").addEventListener("click", submitAnswer);
  document.getElementById("skip-button").addEventListener("click", skipQuestion);
  document.getElementById("intake-submit").addEventListener("click", submitIntake);
  document.getElementById("restart-button").addEventListener("click", () => showScreen("intro"));
})();
