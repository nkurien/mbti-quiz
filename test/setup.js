// Loads the plain-<script>-tag modules under static/js/ as CommonJS
// modules and wires them onto a shared `window`, the same way app.js
// expects to find them at runtime. Every test file requires this once.

const path = require("path");
const dir = path.join(__dirname, "..", "static", "js");

global.window = global.window || {};

const Templates = require(path.join(dir, "templates.js"));
const { ITEMS } = require(path.join(dir, "items.js"));
const Scoring = require(path.join(dir, "scoring.js"));
const Selection = require(path.join(dir, "selection.js"));
const State = require(path.join(dir, "state.js"));

window.Templates = Templates;
window.ItemBank = { ITEMS };
window.Scoring = Scoring;
window.Selection = Selection;
window.State = State;

module.exports = { Templates, ITEMS, Scoring, Selection, State };
