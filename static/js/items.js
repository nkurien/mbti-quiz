// Item bank: short scenario stems with two pole-completions on a slider.
//
// Sign convention for `loading`: for a loading entry on function `f`, use
// a NEGATIVE value if the LEFT pole (r = -1) is the statement associated
// with high `f`, and a POSITIVE value if the RIGHT pole (r = +1) is.
// Getting this backwards doesn't crash anything — it silently inverts
// that item's evidence in the Bayesian update.
//
// `spread` is the likelihood curve width for this item — smaller means a
// more theoretically "clean"/confident item, larger means messier signal.
//
// `kind` is for logging/selection bookkeeping, not scoring:
//   "axis"  — same-letter opposite-attitude contrast (cleanest signal)
//   "cross" — two different functions in one realistic scenario
//   "decoy" — zero-loaded, logged only, never affects scoring or results

const ITEMS = [
  // ---- Ti / Te axis (Ti = left/negative, Te = right/positive) ----
  {
    id: "ti_te_01",
    kind: "axis",
    stem: "When you make a big decision, you trust...",
    poles: ["your own internal logic checks out", "it holds up against outside results"],
    loading: { Ti: -0.8, Te: 0.8 },
    spread: 0.4,
  },
  {
    id: "ti_te_02",
    kind: "axis",
    stem: "You're more likely to keep refining an idea until...",
    poles: ["it's logically airtight to you", "it's actually useful and gets implemented"],
    loading: { Ti: -0.75, Te: 0.75 },
    spread: 0.4,
  },
  {
    id: "ti_te_03",
    kind: "axis",
    stem: "In a group project, you push back on a plan when...",
    poles: ["the reasoning behind it doesn't add up", "it wastes time or resources"],
    loading: { Ti: -0.7, Te: 0.7 },
    spread: 0.45,
  },
  {
    id: "ti_te_04",
    kind: "axis",
    stem: "You'd rather work somewhere that...",
    poles: ["lets you think things through your own way", "runs on clear metrics and results"],
    loading: { Ti: -0.65, Te: 0.65 },
    spread: 0.45,
  },
  {
    id: "ti_te_05",
    kind: "axis",
    stem: "When explaining something you understand well, you focus on...",
    poles: ["making the underlying logic clear", "giving people what they need to act on it"],
    loading: { Ti: -0.7, Te: 0.7 },
    spread: 0.4,
  },
  {
    id: "ti_te_06",
    kind: "axis",
    stem: "You feel most \"right\" about a conclusion when...",
    poles: ["it's internally consistent with how you see things", "it's been tested and proven to work"],
    loading: { Ti: -0.75, Te: 0.75 },
    spread: 0.4,
  },
  {
    id: "ti_te_07",
    kind: "axis",
    stem: "Faced with a messy process at work, your instinct is to...",
    poles: ["work out the actual principle behind it first", "just fix whatever's slowing things down"],
    loading: { Ti: -0.6, Te: 0.7 },
    spread: 0.45,
  },
  {
    id: "ti_te_08",
    kind: "axis",
    stem: "You're more annoyed by...",
    poles: ["a rule that doesn't make logical sense", "a process that's inefficient"],
    loading: { Ti: -0.65, Te: 0.65 },
    spread: 0.45,
  },

  // ---- Fi / Fe axis (Fi = left/negative, Fe = right/positive) ----
  {
    id: "fi_fe_01",
    kind: "axis",
    stem: "When deciding if something's okay to do, you check it against...",
    poles: ["your own personal sense of right and wrong", "how it'll affect the people around you"],
    loading: { Fi: -0.8, Fe: 0.8 },
    spread: 0.4,
  },
  {
    id: "fi_fe_02",
    kind: "axis",
    stem: "You're more upset by...",
    poles: ["being untrue to yourself", "causing tension in a relationship"],
    loading: { Fi: -0.75, Fe: 0.75 },
    spread: 0.4,
  },
  {
    id: "fi_fe_03",
    kind: "axis",
    stem: "In a disagreement with a friend, your priority is...",
    poles: ["staying true to what you actually feel", "keeping things comfortable for both of you"],
    loading: { Fi: -0.7, Fe: 0.7 },
    spread: 0.45,
  },
  {
    id: "fi_fe_04",
    kind: "axis",
    stem: "You'd describe your values as...",
    poles: ["something private that don't need explaining to anyone", "something you actively shape around people you care about"],
    loading: { Fi: -0.65, Fe: 0.65 },
    spread: 0.45,
  },
  {
    id: "fi_fe_05",
    kind: "axis",
    stem: "When someone asks your opinion on something sensitive, you...",
    poles: ["say what you genuinely believe, even if it's unpopular", "read the room and soften it accordingly"],
    loading: { Fi: -0.75, Fe: 0.75 },
    spread: 0.4,
  },
  {
    id: "fi_fe_06",
    kind: "axis",
    stem: "You feel most like yourself when...",
    poles: ["you're acting in line with your own convictions", "you're helping smooth things over for a group"],
    loading: { Fi: -0.7, Fe: 0.7 },
    spread: 0.4,
  },
  {
    id: "fi_fe_07",
    kind: "axis",
    stem: "A group decision feels wrong to you when...",
    poles: ["it conflicts with something you personally believe", "it leaves someone feeling excluded or hurt"],
    loading: { Fi: -0.65, Fe: 0.7 },
    spread: 0.45,
  },
  {
    id: "fi_fe_08",
    kind: "axis",
    stem: "You'd rather be seen as...",
    poles: ["authentic, even if that's inconvenient for others", "considerate, even if it means holding back what you think"],
    loading: { Fi: -0.6, Fe: 0.65 },
    spread: 0.45,
  },

  // ---- Ni / Ne axis (Ni = left/negative, Ne = right/positive) ----
  {
    id: "ni_ne_01",
    kind: "axis",
    stem: "When you look at a situation, you tend to arrive at...",
    poles: ["one underlying pattern that explains it", "a bunch of different ways it could play out"],
    loading: { Ni: -0.8, Ne: 0.8 },
    spread: 0.4,
  },
  {
    id: "ni_ne_02",
    kind: "axis",
    stem: "Thinking about the future, you're more drawn to...",
    poles: ["a single, clear sense of where things are headed", "the many directions things could branch into"],
    loading: { Ni: -0.75, Ne: 0.75 },
    spread: 0.4,
  },
  {
    id: "ni_ne_03",
    kind: "axis",
    stem: "In a brainstorm, you're the person who...",
    poles: ["waits and then names the one idea that actually matters", "keeps generating new angles and connections"],
    loading: { Ni: -0.7, Ne: 0.75 },
    spread: 0.45,
  },
  {
    id: "ni_ne_04",
    kind: "axis",
    stem: "You trust a hunch more when it...",
    poles: ["feels like it's crystallized after sitting with it a while", "came from noticing lots of little connections at once"],
    loading: { Ni: -0.7, Ne: 0.65 },
    spread: 0.45,
  },
  {
    id: "ni_ne_05",
    kind: "axis",
    stem: "When reading into someone's behaviour, you tend to...",
    poles: ["settle on what you're sure is really going on", "hold several possible explanations open at once"],
    loading: { Ni: -0.75, Ne: 0.7 },
    spread: 0.4,
  },
  {
    id: "ni_ne_06",
    kind: "axis",
    stem: "You'd rather a project have...",
    poles: ["one clear long-term vision driving it", "room to keep exploring new directions as you go"],
    loading: { Ni: -0.7, Ne: 0.7 },
    spread: 0.45,
  },
  {
    id: "ni_ne_07",
    kind: "axis",
    stem: "Your ideas usually arrive...",
    poles: ["fully-formed, after something clicks internally", "as a stream of possibilities you riff on out loud"],
    loading: { Ni: -0.65, Ne: 0.65 },
    spread: 0.45,
  },
  {
    id: "ni_ne_08",
    kind: "axis",
    stem: "You're more confident when you have...",
    poles: ["a strong conviction about what's actually true", "a wide set of options still open"],
    loading: { Ni: -0.6, Ne: 0.6 },
    spread: 0.5,
  },

  // ---- Si / Se axis (Si = left/negative, Se = right/positive) ----
  {
    id: "si_se_01",
    kind: "axis",
    stem: "When learning something new, you lean on...",
    poles: ["how it compares to things you've done before", "just diving in and reacting to what's happening now"],
    loading: { Si: -0.8, Se: 0.8 },
    spread: 0.4,
  },
  {
    id: "si_se_02",
    kind: "axis",
    stem: "You feel most comfortable when...",
    poles: ["things go the way they usually do", "something new is happening right in front of you"],
    loading: { Si: -0.75, Se: 0.75 },
    spread: 0.4,
  },
  {
    id: "si_se_03",
    kind: "axis",
    stem: "In a fast-changing situation, your instinct is to...",
    poles: ["find something familiar to anchor to first", "react to what's directly in front of you"],
    loading: { Si: -0.7, Se: 0.75 },
    spread: 0.45,
  },
  {
    id: "si_se_04",
    kind: "axis",
    stem: "You remember experiences mostly through...",
    poles: ["specific sensory detail you can recall later", "how alive and present they felt at the time"],
    loading: { Si: -0.65, Se: 0.65 },
    spread: 0.45,
  },
  {
    id: "si_se_05",
    kind: "axis",
    stem: "Given free time, you're drawn to...",
    poles: ["a familiar routine that feels reliable", "something physical or sensory happening right now"],
    loading: { Si: -0.7, Se: 0.7 },
    spread: 0.4,
  },
  {
    id: "si_se_06",
    kind: "axis",
    stem: "When something breaks unexpectedly, you...",
    poles: ["think back to how it was handled last time", "jump in and start working the problem hands-on"],
    loading: { Si: -0.65, Se: 0.7 },
    spread: 0.45,
  },
  {
    id: "si_se_07",
    kind: "axis",
    stem: "You'd rather plan a trip by...",
    poles: ["sticking close to what's worked well before", "leaving room to just see what happens"],
    loading: { Si: -0.6, Se: 0.6 },
    spread: 0.5,
  },
  {
    id: "si_se_08",
    kind: "axis",
    stem: "Your attention is grabbed more by...",
    poles: ["how something fits with what you already know", "what's immediately happening around you"],
    loading: { Si: -0.65, Se: 0.65 },
    spread: 0.45,
  },

  // ---- Cross-axis: Se + Ti (ESTP / ISTP pairing) ----
  {
    id: "se_ti_01",
    kind: "cross",
    stem: "Fixing something with your hands, you rely on...",
    poles: ["feeling out what works through direct trial and error", "a clear internal sense of how the mechanism should work"],
    loading: { Se: -0.7, Ti: 0.6 },
    spread: 0.45,
  },
  {
    id: "se_ti_02",
    kind: "cross",
    stem: "You trust a plan more when...",
    poles: ["you've physically tested it yourself", "the logic behind it holds together on its own"],
    loading: { Se: -0.6, Ti: 0.6 },
    spread: 0.45,
  },
  {
    id: "se_ti_03",
    kind: "cross",
    stem: "When troubleshooting, you'd rather...",
    poles: ["just start poking at it and see what happens", "stop and reason out what must be going wrong"],
    loading: { Se: -0.65, Ti: 0.65 },
    spread: 0.45,
  },

  // ---- Cross-axis: Se + Fi (ESFP / ISFP pairing) ----
  {
    id: "se_fi_01",
    kind: "cross",
    stem: "You feel best expressing yourself through...",
    poles: ["doing something bold in the moment", "staying quietly true to what you actually feel"],
    loading: { Se: -0.6, Fi: 0.6 },
    spread: 0.45,
  },
  {
    id: "se_fi_02",
    kind: "cross",
    stem: "A good day, for you, involves...",
    poles: ["something exciting happening right now", "time to just be yourself, without performing"],
    loading: { Se: -0.55, Fi: 0.6 },
    spread: 0.5,
  },
  {
    id: "se_fi_03",
    kind: "cross",
    stem: "When you commit to something, it's usually because...",
    poles: ["it felt right to jump in", "it genuinely matches who you are"],
    loading: { Se: -0.5, Fi: 0.6 },
    spread: 0.5,
  },

  // ---- Cross-axis: Ne + Fi (ENFP / INFP pairing) ----
  {
    id: "ne_fi_01",
    kind: "cross",
    stem: "You get most excited about an idea when...",
    poles: ["it opens up a bunch of new possibilities", "it feels true to something you deeply believe"],
    loading: { Ne: -0.6, Fi: 0.6 },
    spread: 0.45,
  },
  {
    id: "ne_fi_02",
    kind: "cross",
    stem: "You'd rather a conversation...",
    poles: ["wander into new and unexpected territory", "get real, about what actually matters to people"],
    loading: { Ne: -0.55, Fi: 0.55 },
    spread: 0.5,
  },
  {
    id: "ne_fi_03",
    kind: "cross",
    stem: "When choosing between paths in life, you're pulled by...",
    poles: ["which one keeps the most doors open", "which one feels most true to who you are"],
    loading: { Ne: -0.6, Fi: 0.6 },
    spread: 0.45,
  },

  // ---- Cross-axis: Ne + Ti (ENTP / INTP pairing) ----
  {
    id: "ne_ti_01",
    kind: "cross",
    stem: "You enjoy a debate most when...",
    poles: ["it keeps spinning off into new angles", "you can pin down exactly where the logic breaks"],
    loading: { Ne: -0.6, Ti: 0.6 },
    spread: 0.45,
  },
  {
    id: "ne_ti_02",
    kind: "cross",
    stem: "Your favourite kind of problem is one where...",
    poles: ["there are lots of interesting directions to take it", "there's one elegant, internally consistent answer"],
    loading: { Ne: -0.55, Ti: 0.6 },
    spread: 0.5,
  },
  {
    id: "ne_ti_03",
    kind: "cross",
    stem: "You're more likely to abandon an idea because...",
    poles: ["a more interesting one showed up", "you found a flaw in its logic"],
    loading: { Ne: -0.5, Ti: 0.55 },
    spread: 0.5,
  },

  // ---- Cross-axis: Te + Si (ESTJ / ISTJ pairing) ----
  {
    id: "te_si_01",
    kind: "cross",
    stem: "Running a project, you lean on...",
    poles: ["a process that's proven to work before", "whatever gets the clearest results, tested or not"],
    loading: { Si: -0.6, Te: 0.6 },
    spread: 0.45,
  },
  {
    id: "te_si_02",
    kind: "cross",
    stem: "You trust a system more when...",
    poles: ["it's been reliable for a long time", "it's clearly the most effective one available"],
    loading: { Si: -0.55, Te: 0.55 },
    spread: 0.5,
  },
  {
    id: "te_si_03",
    kind: "cross",
    stem: "Given a new tool at work, you...",
    poles: ["stick with the method you already know works", "switch immediately if it gets better results"],
    loading: { Si: -0.6, Te: 0.6 },
    spread: 0.45,
  },

  // ---- Cross-axis: Fe + Si (ESFJ / ISFJ pairing) ----
  {
    id: "fe_si_01",
    kind: "cross",
    stem: "You keep a group running smoothly by...",
    poles: ["following the routines everyone's used to", "staying tuned to how everyone's feeling right now"],
    loading: { Si: -0.55, Fe: 0.6 },
    spread: 0.5,
  },
  {
    id: "fe_si_02",
    kind: "cross",
    stem: "A tradition matters to you because...",
    poles: ["it's familiar and dependable", "it brings people together"],
    loading: { Si: -0.5, Fe: 0.55 },
    spread: 0.5,
  },
  {
    id: "fe_si_03",
    kind: "cross",
    stem: "When hosting, your priority is...",
    poles: ["doing things the way that's always worked", "making sure everyone feels comfortable"],
    loading: { Si: -0.55, Fe: 0.6 },
    spread: 0.45,
  },

  // ---- Cross-axis: Ni + Te (INTJ / ENTJ pairing) ----
  {
    id: "ni_te_01",
    kind: "cross",
    stem: "You plan long-term by...",
    poles: ["trusting a clear vision of where things are headed", "building the most efficient path to a concrete goal"],
    loading: { Ni: -0.6, Te: 0.6 },
    spread: 0.45,
  },
  {
    id: "ni_te_02",
    kind: "cross",
    stem: "You'd rather be right about...",
    poles: ["where things are ultimately going", "what actually gets results now"],
    loading: { Ni: -0.55, Te: 0.55 },
    spread: 0.5,
  },
  {
    id: "ni_te_03",
    kind: "cross",
    stem: "Your confidence in a decision comes from...",
    poles: ["a strong internal conviction about the outcome", "hard evidence that it's the most effective option"],
    loading: { Ni: -0.55, Te: 0.6 },
    spread: 0.5,
  },

  // ---- Cross-axis: Ni + Fe (INFJ / ENFJ pairing) ----
  {
    id: "ni_fe_01",
    kind: "cross",
    stem: "You're drawn to helping people by...",
    poles: ["seeing where someone's really headed before they do", "tuning into what they need from you right now"],
    loading: { Ni: -0.55, Fe: 0.6 },
    spread: 0.5,
  },
  {
    id: "ni_fe_02",
    kind: "cross",
    stem: "You trust your read on a group when...",
    poles: ["it comes from one clear insight suddenly clicking into place", "it comes from picking up on everyone's mood"],
    loading: { Ni: -0.55, Fe: 0.55 },
    spread: 0.5,
  },
  {
    id: "ni_fe_03",
    kind: "cross",
    stem: "You feel most purposeful when...",
    poles: ["working toward a vision only you can see clearly", "actively holding a group together emotionally"],
    loading: { Ni: -0.5, Fe: 0.55 },
    spread: 0.5,
  },

  // ---- Decoys (zero-loaded; logged only, never scored) ----
  {
    id: "decoy_01",
    kind: "decoy",
    stem: "On a Saturday morning, you'd rather...",
    poles: ["sleep in", "get up early"],
    loading: {},
    spread: 0.5,
  },
  {
    id: "decoy_02",
    kind: "decoy",
    stem: "You consider yourself...",
    poles: ["more of a night person", "more of a morning person"],
    loading: {},
    spread: 0.5,
  },
  {
    id: "decoy_03",
    kind: "decoy",
    stem: "When it comes to spending, you...",
    poles: ["save for later", "spend on things you enjoy now"],
    loading: {},
    spread: 0.5,
  },
  {
    id: "decoy_04",
    kind: "decoy",
    stem: "Your desk or workspace is usually...",
    poles: ["a bit messy", "kept tidy"],
    loading: {},
    spread: 0.5,
  },
  {
    id: "decoy_05",
    kind: "decoy",
    stem: "You'd rather your week have...",
    poles: ["fewer plans", "more plans"],
    loading: {},
    spread: 0.5,
  },
  {
    id: "decoy_06",
    kind: "decoy",
    stem: "In general, you'd call yourself...",
    poles: ["more of an introvert", "more of an extrovert"],
    loading: {},
    spread: 0.5,
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ITEMS };
}
