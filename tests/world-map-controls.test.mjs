import assert from "node:assert/strict";
import test from "node:test";
import { bindMapControls } from "../docs/scripts/world-map-controls.js";

function createInput(properties) {
  const listeners = {};
  return {
    ...properties,
    addEventListener(event, handler) { listeners[event] = handler; },
    trigger(event) { listeners[event](); },
  };
}

function createRoot(zoomButtons = [], languageInputs = []) {
  return {
    querySelectorAll(selector) {
      return selector === "[data-map-zoom]" ? zoomButtons : languageInputs;
    },
  };
}

test("zoom controls dispatch the selected map action", () => {
  // Setup
  const button = createInput({ dataset: { mapZoom: "out" } });
  let zoomOutCalls = 0;
  const map = { zoomOut() { zoomOutCalls += 1; } };
  bindMapControls(map, createRoot([button]));

  // Execution
  button.trigger("click");

  // Assertion
  assert.equal(zoomOutCalls, 1);
});

test("zoom controls reject unknown actions", () => {
  // Setup
  const button = createInput({ dataset: { mapZoom: "unknown" } });

  // Execution
  const bindInvalidAction = () => bindMapControls({}, createRoot([button]));

  // Assertion
  assert.throws(bindInvalidAction, TypeError);
});

test("selected language control updates settlement language", () => {
  // Setup
  const input = createInput({ checked: true, value: "rokugani" });
  let language;
  const map = { setSettlementLanguage(value) { language = value; } };
  bindMapControls(map, createRoot([], [input]));

  // Execution
  input.trigger("change");

  // Assertion
  assert.equal(language, "rokugani");
});

test("unselected language control does not update settlement language", () => {
  // Setup
  const input = createInput({ checked: false, value: "english" });
  let calls = 0;
  const map = { setSettlementLanguage() { calls += 1; } };
  bindMapControls(map, createRoot([], [input]));

  // Execution
  input.trigger("change");

  // Assertion
  assert.equal(calls, 0);
});
