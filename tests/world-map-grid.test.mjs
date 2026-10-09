import assert from "node:assert/strict";
import test from "node:test";
import { WorldMapGrid } from "../docs/scripts/world-map-grid.js";
import { TERRAIN, CLIMATE, VEGETATION, RESOURCE_LEVEL, CLAN } from "../docs/scripts/world-map-layers.js";
import { getClanColors } from "../docs/scripts/clan-colors.js";

function createBuilder() {
  return Object.assign(Object.create(WorldMapGrid.prototype), {
    grid: {}, currentLayer: "terrain", currentValue: null, brushSize: 1,
    cliffDirections: { 0: 0 }, draw() {}, getGridCell: () => ({ x: 0, y: 0 }),
  });
}

test("builder tool selection rejects layer names as values", () => {
  // Setup
  const builder = createBuilder();

  // Execution
  const select = () => builder.selectTool("terrain", "flat", "terrain");

  // Assertion
  assert.throws(select, /Invalid tool selection/);
});

test("builder tool selection rejects an unknown layer", () => {
  // Setup
  const builder = createBuilder();

  // Execution
  const select = () => builder.selectTool("resources", 1);

  // Assertion
  assert.throws(select, /Invalid tool selection/);
});

test("builder erase selection rejects an unknown target", () => {
  // Setup
  const builder = createBuilder();

  // Execution
  const select = () => builder.selectTool("erase", "unknown");

  // Assertion
  assert.throws(select, /Unknown erase layer/);
});

test("builder painting retains zero-valued terrain", () => {
  // Setup
  const builder = createBuilder();
  builder.selectTool("terrain", TERRAIN.FLAT.id);

  // Execution
  builder.paintAt({});

  // Assertion
  assert.equal(builder.grid["0,0"].terrain, TERRAIN.FLAT.id);
});

test("builder painting retains zero-valued climate", () => {
  // Setup
  const builder = createBuilder();
  builder.selectTool("climate", CLIMATE.TEMPERATE.id);

  // Execution
  builder.paintAt({});

  // Assertion
  assert.equal(builder.grid["0,0"].climate, CLIMATE.TEMPERATE.id);
});

test("builder painting removes none-valued vegetation", () => {
  // Setup
  const builder = createBuilder();
  builder.grid["0,0"] = { vegetation: VEGETATION.PRESENT.id };
  builder.selectTool("vegetation", VEGETATION.NONE.id);

  // Execution
  builder.paintAt({});

  // Assertion
  assert.equal(Object.hasOwn(builder.grid["0,0"], "vegetation"), false);
});

test("builder painting stores the numeric ordered level", () => {
  // Setup
  const builder = createBuilder();
  builder.selectTool("resourceLevel", RESOURCE_LEVEL.VERY_HIGH.value);

  // Execution
  builder.paintAt({});

  // Assertion
  assert.equal(builder.grid["0,0"].resourceLevel, RESOURCE_LEVEL.VERY_HIGH.value);
});

test("builder numeric export and import preserve cell data", () => {
  // Setup
  const builder = createBuilder();
  builder.grid = { "0,0": { terrain: TERRAIN.CLIFF.id, resourceLevel: RESOURCE_LEVEL.LOW.value } };
  const imported = createBuilder();

  // Execution
  const loaded = imported.loadFromJSON(builder.saveToJSON());

  // Assertion
  assert.equal(loaded, true);
  assert.deepEqual(imported.grid, builder.grid);
});

test("invalid builder imports report errors and retain the current map", (t) => {
  // Setup
  const builder = createBuilder();
  const original = { "0,0": { terrain: TERRAIN.FLAT.id } };
  builder.grid = original;
  const logging = t.mock.method(console, "error", () => {});

  // Execution
  const loaded = builder.loadFromJSON('{"0,0":{"terrain":"flat"}}');

  // Assertion
  assert.equal(loaded, false);
  assert.equal(builder.grid, original);
  assert.equal(logging.mock.calls.length, 1);
});

test("builder clan boundaries use presentation border and fill colors", (t) => {
  // Setup
  const original = Object.getOwnPropertyDescriptor(globalThis, "Path2D");
  globalThis.Path2D = class { rect() {} moveTo() {} lineTo() {} closePath() {} };
  // Tear down
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "Path2D", original);
    else delete globalThis.Path2D;
  });
  const builder = createBuilder();
  builder.gridSize = 16;
  builder.zoom = 1;
  builder.grid = { "0,0": { clan: CLAN.CRANE.id } };
  const strokes = [];
  builder.ctx = {
    save() {}, restore() {}, clip() {},
    stroke() { strokes.push(this.strokeStyle); },
  };
  const colors = getClanColors(CLAN.CRANE);

  // Execution
  builder.drawClanBoundariesLayer();

  // Assertion
  assert.deepEqual(strokes.slice(0, 2), [colors.border, colors.fill]);
});
