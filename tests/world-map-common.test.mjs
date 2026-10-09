import assert from "node:assert/strict";
import test from "node:test";
import { WorldMapRenderer } from "../docs/scripts/world-map-common.js";
import { TERRAIN, CLIMATE, VEGETATION, RESOURCE_LEVEL, CLAN, SETTLEMENT } from "../docs/scripts/world-map-layers.js";
import { getResourceLevelColor } from "../docs/scripts/world-map-img-resource-level.js";
import { getClanColors } from "../docs/scripts/clan-colors.js";
import { getSettlementAsset } from "../docs/scripts/world-map-img-settlements.js";
import { BASE_LAYER_IMAGES } from "../docs/scripts/world-map-img-base-layers.js";

function createRenderer() {
  return Object.assign(Object.create(WorldMapRenderer.prototype), { grid: {}, gridSize: 16, zoom: 1 });
}

function installImage(t, image) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "Image");
  globalThis.Image = image;
  // Tear down
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "Image", original);
    else delete globalThis.Image;
  });
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

test("base asset loading failures report the image path and propagate", async (t) => {
  // Setup
  const renderer = createRenderer();
  class FailedImage {
    set src(path) { this.path = path; this.onerror(); }
  }
  installImage(t, FailedImage);
  const logging = t.mock.method(console, "error", () => {});

  // Execution
  const loading = renderer.loadBaseLayerImages();

  // Assertion
  await assert.rejects(loading, (error) => error.message.includes(BASE_LAYER_IMAGES[0].image));
  assert.equal(logging.mock.calls.length, 1);
});

test("base asset loading caches images without requesting tile JSON", async (t) => {
  // Setup
  const renderer = createRenderer();
  class LoadedImage {
    complete = true;
    naturalWidth = 32;
    set src(path) { this.path = path; this.onload(); }
  }
  installImage(t, LoadedImage);
  const requests = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected JSON request"); });

  // Execution
  await renderer.loadBaseLayerImages();

  // Assertion
  assert.equal(requests.mock.calls.length, 0);
  assert.ok(BASE_LAYER_IMAGES.every(({ image }) => renderer.baseLayerImages.get(image)?.path === image));
});

test("base rendering defaults cells with missing base values", () => {
  // Setup
  const renderer = createRenderer();
  renderer.grid = { "0,0": {} };
  renderer.baseLayerImages = new Map(BASE_LAYER_IMAGES.map(({ image }) =>
    [image, { complete: true, naturalWidth: 32 }]));
  const imagesDrawn = [];
  renderer.ctx = { save() {}, restore() {}, fillRect() {}, drawImage: (image) => imagesDrawn.push(image) };

  // Execution
  renderer.drawBaseTiles();

  // Assertion
  const flatPath = BASE_LAYER_IMAGES.find(({ value }) => value === TERRAIN.FLAT).image;
  assert.deepEqual(imagesDrawn, [renderer.baseLayerImages.get(flatPath)]);
});

test("hidden vegetation is not drawn on water", () => {
  // Setup
  const renderer = createRenderer();
  renderer.grid = { "0,0": { terrain: TERRAIN.WATER.id, vegetation: VEGETATION.PRESENT.id } };
  renderer.baseLayerImages = new Map();
  renderer.isLayerVisible = (layer) => layer !== "vegetation";
  const imagesDrawn = [];
  renderer.ctx = { save() {}, restore() {}, fillRect() {}, drawImage: (image) => imagesDrawn.push(image) };

  // Execution
  renderer.drawBaseTiles();

  // Assertion
  assert.deepEqual(imagesDrawn, []);
});

test("base rendering waits while its images are loading", () => {
  // Setup
  const renderer = createRenderer();
  renderer.grid = { "0,0": {} };
  renderer.baseLayersLoading = true;
  const calls = [];
  renderer.ctx = { fillRect: () => calls.push("fill"), drawImage: () => calls.push("image") };

  // Execution
  renderer.drawBaseTiles();

  // Assertion
  assert.deepEqual(calls, []);
});

test("renderer delegates saved cliff directions without requiring cliff terrain", () => {
  // Setup
  const renderer = createRenderer();
  renderer.gridSize = 32;
  renderer.grid = { "2,3": { terrain: TERRAIN.FLAT.id, "cliff direction": { 0: 1 } } };
  const lines = [];
  renderer.ctx = {
    save() {}, restore() {}, beginPath() {}, stroke() {},
    moveTo() {}, lineTo: (...args) => lines.push(args),
  };

  // Execution
  renderer.drawCliffEdges();

  // Assertion
  assert.deepEqual(lines, [[88, 104]]);
});
