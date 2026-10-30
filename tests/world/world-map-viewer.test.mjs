import assert from "node:assert/strict";
import test from "node:test";
import { WorldMapViewer } from "../../docs/scripts/world/world-map-viewer.js";
import { createMapHeader } from "../../docs/scripts/world/world-map-file.js";
import { CLAN, TERRAIN, CLIMATE, VEGETATION, INFRASTRUCTURE } from "../../docs/scripts/world/world-map-layers.js";
import { getClanColors } from "../../docs/scripts/clan-colors.js";

test("viewer initialization reports and propagates loading failures", async (t) => {
  // Setup
  const error = new Error("Map data unavailable");
  t.mock.method(WorldMapViewer.prototype, "loadBaseLayerImages", async () => { throw error; });
  const logging = t.mock.method(console, "error", () => {});
  const viewer = Object.create(WorldMapViewer.prototype);

  // Execution
  const loading = viewer.initialize();

  // Assertion
  await assert.rejects(loading, (failure) => failure === error);
  assert.equal(logging.mock.calls.length, 1);
});

test("viewer initializes travel papers from metadata before loading assets", async () => {
  // Setup
  const viewer = Object.create(WorldMapViewer.prototype);
  viewer.canvas = { dataset: {} };
  viewer.render = () => {};
  let paperAtAssetLoad;
  viewer.loadBaseLayerImages = async () => { paperAtAssetLoad = viewer.travelPapers[CLAN.CRAB.name]; };

  // Execution
  await viewer.initialize();

  // Assertion
  assert.equal(paperAtAssetLoad, true);
  assert.equal(Object.hasOwn(viewer.travelPapers, CLAN.NONE.name), false);
  assert.equal(Object.hasOwn(viewer.travelPapers, CLAN.SHADOWLANDS.name), false);
});

test("viewer terrain lookup defaults missing terrain to flat", () => {
  // Setup
  const viewer = Object.create(WorldMapViewer.prototype);
  viewer.grid = { "0,0": {} };

  // Execution
  const terrain = viewer.cellTerrain(0, 0);

  // Assertion
  assert.equal(terrain, TERRAIN.FLAT.name);
});

test("viewer travel lookup gives vegetation priority over climate", () => {
  // Setup
  const viewer = Object.create(WorldMapViewer.prototype);
  viewer.grid = { "0,0": { terrain: TERRAIN.HILLS.id, climate: CLIMATE.DESERT.id, vegetation: VEGETATION.PRESENT.id } };

  // Execution
  const key = viewer.tileCostKey(0, 0);

  // Assertion
  assert.equal(key, VEGETATION.PRESENT.name.toLowerCase());
});

test("invalid viewer map imports report failure without replacing the current map", async (t) => {
  // Setup
  const viewer = Object.create(WorldMapViewer.prototype);
  const original = { "0,0": {} };
  viewer.grid = original;
  const invalidFile = { ...createMapHeader({ columns: 3, rows: 2 }), tiles: { "0,0": { terrain: "flat" } } };
  t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => invalidFile }));

  // Execution
  const loading = viewer.loadMap("map.json");

  // Assertion
  await assert.rejects(loading, /Invalid terrain value/);
  assert.equal(viewer.grid, original);
});

test("viewer map imports reject the old format without a header", async (t) => {
  // Setup
  const viewer = Object.create(WorldMapViewer.prototype);
  t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => ({ "0,0": { terrain: TERRAIN.FLAT.id } }) }));

  // Execution
  const loading = viewer.loadMap("map.json");

  // Assertion
  await assert.rejects(loading, /needs a "tiles" object/);
});

test("viewer map import replaces the map header and the tiles, then repaints", async (t) => {
  // Setup
  const viewer = Object.create(WorldMapViewer.prototype);
  viewer.gridSize = 16;
  let repaints = 0;
  viewer.applyZoom = () => (repaints += 1);
  const header = createMapHeader({ columns: 3, rows: 2 });
  const tiles = { "0,0": { terrain: TERRAIN.HILLS.id } };
  t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => ({ ...header, tiles }) }));

  // Execution
  await viewer.loadMap("map.json");

  // Assertion
  assert.deepEqual(viewer.mapHeader, header);
  assert.deepEqual(viewer.grid, tiles);
  assert.equal(repaints, 1);
});

test("viewer clan drawing resolves presentation colors from numeric cell IDs", () => {
  // Setup
  const viewer = Object.create(WorldMapViewer.prototype);
  viewer.gridSize = 16;
  viewer.grid = { "0,0": { clan: CLAN.LION.id } };
  const palettes = [];
  viewer.drawClanShape = (_cells, _polygons, colors) => palettes.push(colors);

  // Execution
  viewer.drawClanLayer();

  // Assertion
  assert.deepEqual(palettes, [getClanColors(CLAN.LION)]);
});

test("viewer excludes absent and none-valued clans from territory drawing", () => {
  // Setup
  const viewer = Object.create(WorldMapViewer.prototype);
  viewer.grid = { "0,0": {}, "1,0": { clan: CLAN.NONE.id } };
  const palettes = [];
  viewer.drawClanShape = (_cells, _polygons, colors) => palettes.push(colors);

  // Execution
  viewer.drawClanLayer();

  // Assertion
  assert.deepEqual(palettes, []);
});

test("viewer polar climate overrides terrain travel costs", () => {
  // Setup
  const viewer = Object.create(WorldMapViewer.prototype);
  viewer.grid = { "0,0": { terrain: TERRAIN.HILLS.id, climate: CLIMATE.POLAR.id } };
  // Execution
  const key = viewer.tileCostKey(0, 0);
  // Assertion
  assert.equal(key, CLIMATE.POLAR.name);
});

test("viewer water bridges supply road costs only for foot travel", () => {
  // Setup
  const viewer = Object.create(WorldMapViewer.prototype);
  viewer.grid = { "0,0": { terrain: TERRAIN.WATER.id, infrastructure: INFRASTRUCTURE.FOOTPATH.id } };
  viewer.terrainCosts = { [TERRAIN.WATER.name]: { cost: 100, costRoad: 50 } };
  // Execution
  const foot = viewer.tileData(0, 0, "foot");
  const ship = viewer.tileData(0, 0, "ship");
  // Assertion
  assert.equal(foot.cost, 50);
  assert.equal(ship.cost, 100);
});

test("viewer map tool enables panning only for the pan tool", () => {
  // Setup
  const viewer = Object.create(WorldMapViewer.prototype);
  const states = [];
  viewer.pan = { setEnabled: (enabled) => states.push(enabled) };

  // Execution
  viewer.setMapTool("pan");
  viewer.setMapTool("measure");

  // Assertion
  assert.deepEqual(states, [true, false]);
  assert.equal(viewer.mapTool, "measure");
  assert.throws(() => viewer.setMapTool("unknown"), /Unknown map tool/);
});

test("viewer measure uses two clicks and restarts on the third", () => {
  // Setup
  const viewer = Object.create(WorldMapViewer.prototype);
  const cells = [{ x: 0, y: 0 }, { x: 3, y: 4 }, { x: 7, y: 7 }];
  Object.assign(viewer, { measurePoints: [], render() {}, updateMeasureDisplay() {}, getGridCell: () => cells.shift() });

  // Execution
  viewer.onMeasureClick({});
  viewer.onMeasureClick({});
  const distance = viewer.measureDistance();
  viewer.onMeasureClick({});

  // Assertion
  assert.equal(distance, 5);
  assert.deepEqual(viewer.measurePoints, [{ x: 7, y: 7 }]);
  assert.equal(viewer.measureDistance(), null);
});

test("viewer measure display uses miles by default and km when selected", (t) => {
  // Setup
  const el = { textContent: "" };
  const previous = globalThis.document;
  globalThis.document = { getElementById: () => el };
  t.after(() => (globalThis.document = previous));
  const viewer = Object.create(WorldMapViewer.prototype);
  viewer.measurePoints = [{ x: 0, y: 0 }, { x: 3, y: 4 }];

  // Execution
  viewer.updateMeasureDisplay();
  const miles = el.textContent;
  viewer.setDistanceUnit("km");

  // Assertion
  assert.equal(miles, "Distance: 25 miles (5.0 tiles: 3 across, 4 down)");
  assert.equal(el.textContent, "Distance: 40 km (5.0 tiles: 3 across, 4 down)");
  assert.throws(() => viewer.setDistanceUnit("leagues"), /Unknown distance unit/);
});
