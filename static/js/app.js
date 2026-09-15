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
    // Disabling the button the user just clicked (submit/skip) drops focus
    // to <body> in most browsers — send it to the slider instead so
    // keyboard/screen-reader users land on the next interactive control.
    slider.focus({ preventScroll: true });

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
    resultTypeEl.innerHTML = "";
    const swatch = document.createElement("span");
    swatch.className = "result-type-swatch";
    swatch.style.background = typeColor;
    resultTypeEl.appendChild(swatch);
    resultTypeEl.appendChild(document.createTextNode(bestType));
    const narrativeEl = document.getElementById("result-narrative");
    narrativeEl.innerHTML = "";
    narrative.forEach((p) => {
      const para = document.createElement("p");
      para.textContent = p;
      narrativeEl.appendChild(para);
    });

    // The chart renders the mixture vector (functionVector), matching
    // CLAUDE.md's spec for what it shows. shadow_intrusion is flagged from
    // the raw axis-response vector instead (see discrepancy.js) because the
    // mixture vector structurally can't show a shadow function outscoring
    // tertiary/inferior — so a flagged function gets a badge here rather
    // than the chart switching vectors, which would contradict itself
    // (raw evidence only covers pure-axis items and mirrors each pair).
    const shadowFlags = flags.filter((f) => f.type === "shadow_intrusion");
    const shadowFunctions = new Set(shadowFlags.map((f) => f.shadowFunction));

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
      if (shadowFunctions.has(fn)) {
        const badge = document.createElement("span");
        badge.className = "function-shadow-badge";
        badge.textContent = "answered higher";
        badge.title =
          "Your direct answers on this leaned higher than this chart shows — see the note above.";
        row.appendChild(badge);
      }

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

  // "input" alone misses a click/tap on the thumb that leaves it at its
  // starting value (0) — no value change means no input event, so the
  // neutral response was unreachable without dragging away and back.
  // "click" and "keyup" catch that: any deliberate interaction marks the
  // slider touched even when the value didn't move.
  function markSliderTouched(e) {
    e.target.classList.remove("untouched");
    e.target.setAttribute("aria-valuetext", e.target.value);
    document.getElementById("submit-button").disabled = false;
  }
  document.getElementById("slider").addEventListener("input", markSliderTouched);
  document.getElementById("slider").addEventListener("click", markSliderTouched);
  document.getElementById("slider").addEventListener("keyup", markSliderTouched);

  document.getElementById("start-button").addEventListener("click", startQuiz);
  document.getElementById("submit-button").addEventListener("click", submitAnswer);
  document.getElementById("skip-button").addEventListener("click", skipQuestion);
  document.getElementById("intake-submit").addEventListener("click", submitIntake);
  document.getElementById("restart-button").addEventListener("click", () => showScreen("intro"));
})();
