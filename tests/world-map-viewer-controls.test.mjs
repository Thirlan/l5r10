import assert from "node:assert/strict";
import test from "node:test";
import { bindViewerClans, bindViewerSkills } from "../docs/scripts/world-map-viewer-controls.js";

function createDocument(t) {
  const elements = [];
  function createElement(tag) {
    const listeners = {};
    const element = {
      tag, children: [],
      setAttribute() {},
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      addEventListener(event, handler) { listeners[event] = handler; },
      trigger(event) { listeners[event](); },
    };
    elements.push(element);
    return element;
  }
  const tables = {
    "#skillRows": createElement("tbody"),
    "#clanRows": createElement("tbody"),
    "#swimTNInput": createElement("input"),
  };
  const original = globalThis.document;
  globalThis.document = { createElement, querySelector: (selector) => tables[selector] };
  t.after(() => {
    // Tear down
    if (original === undefined) delete globalThis.document;
    else globalThis.document = original;
  });
  return { elements, tables };
}

function createViewer() {
  return {
    travelPapers: { Crab: true },
    avoidClans: {},
    startCell: null,
    waypoints: [],
    computePath() {},
  };
}

function createSkills() {
  return Object.fromEntries(
    ["survival", "sailing", "investigate", "swim", "sneak", "forgery"].map((key) => [
      key, { roll: 3, keep: 2, mod: 0, tn: 20 },
    ]),
  );
}

test("travel-paper rows reflect loaded clan data when bound", (t) => {
  // Setup
  const { tables } = createDocument(t);
  const map = createViewer();
  map.travelPapers.Crane = true;

  // Execution
  bindViewerClans(map);

  // Assertion
  const names = tables["#clanRows"].children.map((row) => row.children[0].textContent);
  assert.deepEqual(names, ["Crab", "Crane"]);
});

test("travel-paper changes update the selected clan", (t) => {
  // Setup
  const { tables } = createDocument(t);
  const map = createViewer();
  bindViewerClans(map);
  const input = tables["#clanRows"].children[0].children[1].children[0];
  input.checked = false;

  // Execution
  input.trigger("change");

  // Assertion
  assert.equal(map.travelPapers.Crab, false);
});

test("avoid-clan changes recompute an active route", (t) => {
  // Setup
  const { tables } = createDocument(t);
  const map = createViewer();
  map.startCell = { x: 0, y: 0 };
  map.waypoints = [{ x: 1, y: 0 }];
  let calls = 0;
  map.computePath = () => { calls += 1; };
  bindViewerClans(map);
  const input = tables["#clanRows"].children[0].children[2].children[0];
  input.checked = true;

  // Execution
  input.trigger("change");

  // Assertion
  assert.equal(calls, 1);
  assert.equal(map.avoidClans.Crab, true);
});

test("clan changes do not compute a route without waypoints", (t) => {
  // Setup
  const { tables } = createDocument(t);
  const map = createViewer();
  let calls = 0;
  map.computePath = () => { calls += 1; };
  bindViewerClans(map);
  const input = tables["#clanRows"].children[0].children[1].children[0];

  // Execution
  input.trigger("change");

  // Assertion
  assert.equal(calls, 0);
});

test("skill controls convert numeric inputs before updating the viewer", (t) => {
  // Setup
  const { tables } = createDocument(t);
  const skillConfig = createSkills();
  let result;
  bindViewerSkills({ skillConfig, setSkillConfig(skill, changes) { result = { skill, changes }; } });
  const input = tables["#skillRows"].children[0].children[1].children[0];
  input.value = "5";

  // Execution
  input.trigger("change");

  // Assertion
  assert.deepEqual(result, { skill: "survival", changes: { roll: 5 } });
});

test("skill controls update boolean options from checked state", (t) => {
  // Setup
  const { tables } = createDocument(t);
  let result;
  bindViewerSkills({ skillConfig: createSkills(), setSkillConfig(skill, changes) { result = changes; } });
  const input = tables["#skillRows"].children[0].children[4].children[0];
  input.checked = true;

  // Execution
  input.trigger("change");

  // Assertion
  assert.deepEqual(result, { rerollOnes: true });
});

test("swim TN control updates the swim threshold", (t) => {
  // Setup
  const { tables } = createDocument(t);
  let result;
  bindViewerSkills({ skillConfig: createSkills(), setSkillConfig(skill, changes) { result = { skill, changes }; } });
  const input = tables["#swimTNInput"];
  input.value = "25";

  // Execution
  input.trigger("change");

  // Assertion
  assert.deepEqual(result, { skill: "swim", changes: { tn: 25 } });
});
