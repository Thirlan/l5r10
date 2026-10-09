import assert from "node:assert/strict";
import test from "node:test";
import { WorldMapRenderer } from "../docs/scripts/world-map-common.js";
import { TERRAIN, CLIMATE, VEGETATION, RESOURCE_LEVEL, CLAN, SETTLEMENT } from "../docs/scripts/world-map-layers.js";
import { getResourceLevelColor } from "../docs/scripts/world-map-img-resource-level.js";
import { getClanColors } from "../docs/scripts/clan-colors.js";
import { getSettlementAsset } from "../docs/scripts/world-map-img-settlements.js";

function createRenderer() {
  return Object.assign(Object.create(WorldMapRenderer.prototype), { grid: {}, gridSize: 16, zoom: 1 });
}

test("map validation rejects non-object map data", () => {
  // Setup
  const renderer = createRenderer();
  const invalid = [];

  // Execution
  const validate = () => renderer.validateGridData(invalid);

  // Assertion
  assert.throws(validate, /Map data must be an object/);
});

test("map validation rejects non-object cells", () => {
  // Setup
  const renderer = createRenderer();
  const invalid = { "0,0": null };

  // Execution
  const validate = () => renderer.validateGridData(invalid);

  // Assertion
  assert.throws(validate, /Map cell 0,0 must be an object/);
});

test("map validation rejects name-based terrain without converting it", () => {
  // Setup
  const renderer = createRenderer();
  const grid = { "0,0": { terrain: "flat" } };

  // Execution
  const validate = () => renderer.validateGridData(grid);

  // Assertion
  assert.throws(validate, /Invalid terrain value in map cell 0,0/);
  assert.equal(grid["0,0"].terrain, "flat");
});

test("map validation rejects invalid vegetation instead of normalizing it", () => {
  // Setup
  const renderer = createRenderer();
  const grid = { "0,0": { vegetation: 2 } };

  // Execution
  const validate = () => renderer.validateGridData(grid);

  // Assertion
  assert.throws(validate, /Invalid vegetation value/);
  assert.equal(grid["0,0"].vegetation, 2);
});

test("map validation accepts numeric zero defaults without changing data", () => {
  // Setup
  const renderer = createRenderer();
  const grid = { "0,0": { terrain: TERRAIN.FLAT.id, climate: CLIMATE.TEMPERATE.id, vegetation: VEGETATION.NONE.id } };
  const snapshot = structuredClone(grid);

  // Execution
  renderer.validateGridData(grid);

  // Assertion
  assert.deepEqual(grid, snapshot);
});

test("map validation rejects unknown ordered level values", () => {
  // Setup
  const renderer = createRenderer();
  const grid = { "0,0": { resourceLevel: 6 } };

  // Execution
  const validate = () => renderer.validateGridData(grid);

  // Assertion
  assert.throws(validate, /Invalid resourceLevel value/);
});

test("absent overlay values do not produce a color", () => {
  // Setup
  const renderer = createRenderer();

  // Execution
  const color = renderer.overlayColor("resourceLevel", undefined);

  // Assertion
  assert.equal(color, null);
});

test("overlay color selection resolves ordered metadata", () => {
  // Setup
  const renderer = createRenderer();
  const level = RESOURCE_LEVEL.HIGH;

  // Execution
  const color = renderer.overlayColor("resourceLevel", level.value);

  // Assertion
  assert.equal(color, getResourceLevelColor(level));
});

test("overlay color selection rejects non-overlay layers", () => {
  // Setup
  const renderer = createRenderer();

  // Execution
  const selectColor = () => renderer.overlayColor("terrain", 1);

  // Assertion
  assert.throws(selectColor, /Unknown overlay layer/);
});

test("settlement asset drawing uses presentation lookup and clan colors", () => {
  // Setup
  const renderer = createRenderer();
  renderer.ctx = { save() {}, restore() {} };
  let result;
  renderer.drawShrine = (...args) => { result = args; };
  const cell = { settlement: SETTLEMENT.SMALL_SHRINE.id, clan: CLAN.CRAB.id };

  // Execution
  renderer.drawSettlementMarker(0, 0, cell);

  // Assertion
  assert.equal(result[2], getClanColors(CLAN.CRAB).border);
  assert.equal(result[3], getSettlementAsset(SETTLEMENT.SMALL_SHRINE));
});

test("tile mapping request failures report and propagate initialization errors", async (t) => {
  // Setup
  const renderer = createRenderer();
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 503 }));
  const logging = t.mock.method(console, "error", () => {});

  // Execution
  const loading = renderer.loadMapTileImages();

  // Assertion
  await assert.rejects(loading, /HTTP 503/);
  assert.equal(logging.mock.calls.length, 1);
});
