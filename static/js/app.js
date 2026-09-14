(function () {
  const { TYPE_TEMPLATES, TYPE_RANKS, ALL_FUNCTIONS, TYPE_COLORS } = window.Templates;
  const { ITEMS } = window.ItemBank;
  const { deriveFunctionVector, deriveRawFunctionVector, bestFitType } = window.Scoring;
  const { computeFlags } = window.Discrepancy;
  const { buildResultsNarrative, FUNCTION_NAMES, FUNCTION_DESCRIPTIONS } = window.Narrative;
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
    intake = {};
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
    slider.classList.add("untouched");
    slider.setAttribute(
      "aria-label",
      `Slide from "${currentItem.poles[0]}" to "${currentItem.poles[1]}"`
    );
    slider.setAttribute("aria-valuetext", "not yet answered");

    const submitButton = document.getElementById("submit-button");
    submitButton.disabled = true;

    renderConfidence();
    updateProgressBar();
  }

  function updateProgressBar() {
    const pct = (session.questionNumber / State.TOTAL_QUESTIONS) * 100;
    document.getElementById("progress-fill").style.width = pct + "%";
  }

  // Deliberately anonymised: no type letters or percentage numbers, just
  // a colour-coded dot + bar per leading type, so the respondent can't
  // read an explicit "leaning" during the quiz (that would bias answers).
  function renderConfidence() {
    const top = Object.keys(session.weights)
      .sort((a, b) => session.weights[b] - session.weights[a])
      .slice(0, 3);
    const container = document.getElementById("confidence-bars");
    container.innerHTML = "";
    top.forEach((type) => {
      const pct = Math.round(session.weights[type] * 100);
      const color = TYPE_COLORS[type];

      const dot = document.createElement("span");
      dot.className = "confidence-dot";
      dot.style.background = color;

      const fill = document.createElement("div");
      fill.className = "confidence-fill";
      fill.style.width = pct + "%";
      fill.style.background = color;

      const track = document.createElement("div");
      track.className = "confidence-track";
      track.appendChild(fill);

      const row = document.createElement("div");
      row.className = "confidence-row";
      row.appendChild(dot);
      row.appendChild(track);
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
    const rawFunctionVector = deriveRawFunctionVector(session.axisEvidence, ALL_FUNCTIONS);
    const bestType = bestFitType(session.weights);
    const flags = computeFlags(bestType, functionVector, TYPE_RANKS, rawFunctionVector);
    const narrative = buildResultsNarrative(bestType, functionVector, flags, intake);

    const typeColor = TYPE_COLORS[bestType];
    const resultTypeEl = document.getElementById("result-type");
    resultTypeEl.textContent = bestType;
    resultTypeEl.style.color = typeColor;
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
      // Bar grows outward from the 50% (score = 0) center rather than
      // filling left-to-right, so a negative score visibly fills toward
      // the left and a positive score toward the right.
      const halfWidthPct = (Math.abs(score) / 2) * 100;

      const label = document.createElement("span");
      label.className = "function-label";
      label.textContent = fn;

      const fill = document.createElement("div");
      fill.className = "function-fill";
      fill.style.width = halfWidthPct + "%";
      fill.style.left = (score >= 0 ? 50 : 50 - halfWidthPct) + "%";
      fill.style.background = typeColor;

      const track = document.createElement("div");
      track.className = "function-track";
      track.appendChild(fill);

      const scoreEl = document.createElement("span");
      scoreEl.className = "function-score";
      const formattedScore = score.toFixed(2);
      scoreEl.textContent = formattedScore === "-0.00" ? "0.00" : formattedScore;

      const descId = "function-desc-" + fn;
      const description = document.createElement("p");
      description.className = "function-description";
      description.id = descId;
      description.textContent = FUNCTION_NAMES[fn] + " — " + FUNCTION_DESCRIPTIONS[fn];
      description.hidden = true;

      const row = document.createElement("div");
      row.className = "function-row";
      row.title = FUNCTION_NAMES[fn] + ": " + FUNCTION_DESCRIPTIONS[fn];
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-expanded", "false");
      row.setAttribute("aria-controls", descId);
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(scoreEl);

      const toggleDescription = () => {
        const expanded = row.getAttribute("aria-expanded") === "true";
        row.setAttribute("aria-expanded", String(!expanded));
        description.hidden = expanded;
      };
      row.addEventListener("click", toggleDescription);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleDescription();
        }
      });

      const item = document.createElement("div");
      item.className = "function-item";
      item.appendChild(row);
      item.appendChild(description);
      chart.appendChild(item);
    });

    showScreen("results");
  }

  document.getElementById("slider").addEventListener("input", (e) => {
    e.target.classList.remove("untouched");
    e.target.setAttribute("aria-valuetext", e.target.value);
    document.getElementById("submit-button").disabled = false;
  });

  document.getElementById("start-button").addEventListener("click", startQuiz);
  document.getElementById("submit-button").addEventListener("click", submitAnswer);
  document.getElementById("skip-button").addEventListener("click", skipQuestion);
  document.getElementById("intake-submit").addEventListener("click", submitIntake);
  document.getElementById("restart-button").addEventListener("click", () => showScreen("intro"));
})();
