import assert from "node:assert/strict";
import test from "node:test";
import { WorldMapGrid } from "../../docs/scripts/world/world-map-grid.js";

function element(dataset = {}) {
  const events = new Map();
  const classes = new Set();
  return {
    dataset,
    events,
    addEventListener(name, handler) {
      events.set(name, handler);
    },
    classList: {
      add(name) {
        classes.add(name);
      },
      remove(name) {
        classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
    click() {
      events.get("click")?.();
    },
  };
}

async function setupPage(context) {
  const button = element({ toolLayer: "elevation" });
  const input = Object.assign(element(), {
    valueAsNumber: 1,
    validationMessage: "",
    reports: 0,
    setCustomValidity(message) {
      this.validationMessage = message;
    },
    reportValidity() {
      this.reports += 1;
      return !this.validationMessage;
    },
  });
  const canvas = Object.assign(element({ gridSize: "16", mapColumns: "5", mapRows: "5" }), { getContext: () => ({}) });
  const elements = new Map([
    ["#mapCanvas", canvas],
    ["#elevationInput", input],
  ]);
  const document = {
    querySelector(selector) {
      return elements.get(selector) ?? element();
    },
    querySelectorAll(selector) {
      if (selector === "[data-tool-layer]") return [button];
      if (selector === ".tool-button.active") return button.classList.contains("active") ? [button] : [];
      return [];
    },
  };
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  globalThis.document = document;
  context.after(() => {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else delete globalThis.document;
  });
  let map;
  context.mock.method(WorldMapGrid.prototype, "setupEventListeners", function () {
    map = this;
  });
  context.mock.method(WorldMapGrid.prototype, "loadBaseLayerImages", async () => {});
  context.mock.method(WorldMapGrid.prototype, "applyZoom", () => {});
  context.mock.method(WorldMapGrid.prototype, "draw", () => {});
  await import(`../../docs/scripts/world/world-map-builder-page.js?test=${context.name}`);
  map.getGridCell = () => ({ x: 0, y: 0 });
  return { map, button, input };
}

test("elevation input updates the active paint value, including zero and negatives", async (context) => {
  const { map, button, input } = await setupPage(context);
  input.valueAsNumber = -200;
  button.click();
  map.paintAt({});
  assert.equal(map.grid["0,0"].elevation, -200);
  input.valueAsNumber = 0;
  input.events.get("input")();
  map.paintAt({});
  assert.equal(map.grid["0,0"].elevation, 0);
  assert.equal(button.classList.contains("active"), true);
});

test("invalid elevation input reports an error and stops painting until corrected", async (context) => {
  const { map, button, input } = await setupPage(context);
  button.click();
  [NaN, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1].forEach((value) => {
    input.valueAsNumber = value;
    input.events.get("input")();
    assert.match(input.validationMessage, /whole number/);
    map.paintAt({});
    assert.deepEqual(map.grid, {});
  });
  input.valueAsNumber = 100;
  input.events.get("input")();
  map.paintAt({});
  assert.equal(map.grid["0,0"].elevation, 100);
  assert.equal(input.validationMessage, "");
});
