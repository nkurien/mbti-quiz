// Results copy. Age and the stress/sleep intake only ever change how a
// flag is *worded* here — they never touch weights, templates, or
// thresholds in scoring.js / discrepancy.js.

const FUNCTION_NAMES = {
  Ni: "Introverted Intuition",
  Ne: "Extraverted Intuition",
  Si: "Introverted Sensing",
  Se: "Extraverted Sensing",
  Ti: "Introverted Thinking",
  Te: "Extraverted Thinking",
  Fi: "Introverted Feeling",
  Fe: "Extraverted Feeling",
};

function isYoung(intake) {
  const age = intake && intake.age;
  return typeof age === "number" && age > 0 && age < 25;
}

function isStressed(intake) {
  return intake && (intake.stress === "high" || intake.sleep === "poor");
}

function describeFlag(flag, intake) {
  switch (flag.type) {
    case "dominant_auxiliary_inversion": {
      const base = `Your ${FUNCTION_NAMES[flag.auxiliary]} score came out ahead of your ${FUNCTION_NAMES[flag.dominant]} score, even though ${flag.dominant} is meant to lead for this type.`;
      if (isYoung(intake)) {
        return (
          base +
          " That's fairly common earlier in life, before a dominant function has fully settled in — this may sort itself out with time rather than pointing to a different type."
        );
      }
      return (
        base +
        " That can mean you're leaning on your second function to drive, which sometimes shows up during periods of stress or when a role calls for it more than your natural lead."
      );
    }
    case "shadow_intrusion": {
      const base = `${FUNCTION_NAMES[flag.shadowFunction]} — usually a background function for this type — scored higher than expected.`;
      if (isStressed(intake)) {
        return (
          base +
          " Given what you said about recent stress and sleep, this may be a temporary spike rather than a lasting pattern."
        );
      }
      return (
        base +
        " This can reflect a well-developed secondary skill, or a current stretch of life leaning on it more than usual."
      );
    }
    case "poor_differentiation": {
      const [a, b] = flag.pair;
      return `Your ${FUNCTION_NAMES[a]} and ${FUNCTION_NAMES[b]} scores came out close together, so this pair isn't strongly resolved one way or the other yet.`;
    }
    default:
      return "";
  }
}

function buildResultsNarrative(bestFitType, functionVector, flags, intake) {
  const paragraphs = [`Your best-fit type is ${bestFitType}.`];
  if (flags.length === 0) {
    paragraphs.push("Your function scores line up cleanly with this type's usual profile.");
  } else {
    flags.forEach((flag) => paragraphs.push(describeFlag(flag, intake)));
  }
  return paragraphs;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { FUNCTION_NAMES, buildResultsNarrative, describeFlag, isYoung, isStressed };
}
