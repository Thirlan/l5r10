import assert from "node:assert/strict";
import test from "node:test";
import { CLIMATE, TERRAIN, VEGETATION } from "../docs/scripts/world-map-layers.js";
import { BASE_LAYER_IMAGES, drawBaseLayers } from "../docs/scripts/world-map-img-base-layers.js";

function createDrawing() {
  const calls = [];
  const images = new Map(BASE_LAYER_IMAGES.map(({ value, image }) =>
    [image, { value, complete: true, naturalWidth: 32 }]));
  const ctx = {
    save() {}, restore() {},
    fillRect: (...args) => calls.push(["fill", ...args]),
    drawImage: (image, ...args) => calls.push([image.value, ...args]),
  };
  return { ctx, images, calls };
}

test("land drawing composites climate, terrain, and vegetation in order", () => {
  // Setup
  const { ctx, images, calls } = createDrawing();

  // Execution
  drawBaseLayers(ctx, 2, 3, 16, TERRAIN.HILLS, CLIMATE.DESERT, VEGETATION.PRESENT, images);

  // Assertion
  assert.deepEqual(calls, [
    ["fill", 32, 48, 16, 16],
    [TERRAIN.HILLS, 32, 48, 16, 16],
    [VEGETATION.PRESENT, 32, 48, 16, 16],
  ]);
});

test("cliff drawing uses the cliff image beneath vegetation", () => {
  // Setup
  const { ctx, images, calls } = createDrawing();

  // Execution
  drawBaseLayers(ctx, 0, 0, 16, TERRAIN.CLIFF, CLIMATE.TEMPERATE, VEGETATION.PRESENT, images);

  // Assertion
  assert.deepEqual(calls.map(([layer]) => layer), ["fill", TERRAIN.CLIFF, VEGETATION.PRESENT]);
});

[TERRAIN.WATER, TERRAIN.COASTAL_WATER, TERRAIN.OCEAN].forEach((terrain) => {
  test(`${terrain.name} drawing composites vegetation above the water fill`, () => {
    // Setup
    const { ctx, images, calls } = createDrawing();

    // Execution
    drawBaseLayers(ctx, 0, 0, 16, terrain, CLIMATE.TEMPERATE, VEGETATION.PRESENT, images);

    // Assertion
    assert.deepEqual(calls.map(([layer]) => layer), ["fill", "fill", VEGETATION.PRESENT]);
  });
});

test("absent vegetation draws no vegetation image", () => {
  // Setup
  const { ctx, images, calls } = createDrawing();

  // Execution
  drawBaseLayers(ctx, 0, 0, 16, TERRAIN.FLAT, CLIMATE.TEMPERATE, VEGETATION.NONE, images);

  // Assertion
  assert.deepEqual(calls.map(([layer]) => layer), ["fill", TERRAIN.FLAT]);
});

test("base drawing rejects invalid dimensions", () => {
  // Setup
  const { ctx, images } = createDrawing();

  // Execution
  const draw = () => drawBaseLayers(ctx, 0, 0, 0, TERRAIN.FLAT, CLIMATE.TEMPERATE, VEGETATION.NONE, images);

  // Assertion
  assert.throws(draw, /valid cell dimensions/);
});

test("base drawing rejects non-terrain metadata", () => {
  // Setup
  const { ctx, images } = createDrawing();

  // Execution
  const draw = () => drawBaseLayers(ctx, 0, 0, 16, CLIMATE.TEMPERATE, CLIMATE.TEMPERATE, VEGETATION.NONE, images);

  // Assertion
  assert.throws(draw, /metadata/);
});

test("base drawing rejects non-climate metadata", () => {
  // Setup
  const { ctx, images } = createDrawing();

  // Execution
  const draw = () => drawBaseLayers(ctx, 0, 0, 16, TERRAIN.FLAT, TERRAIN.FLAT, VEGETATION.NONE, images);

  // Assertion
  assert.throws(draw, /metadata/);
});

test("base drawing rejects non-vegetation metadata", () => {
  // Setup
  const { ctx, images } = createDrawing();

  // Execution
  const draw = () => drawBaseLayers(ctx, 0, 0, 16, TERRAIN.FLAT, CLIMATE.TEMPERATE, CLIMATE.TROPICAL, images);

  // Assertion
  assert.throws(draw, /metadata/);
});

test("missing terrain images report the failed asset", () => {
  // Setup
  const { ctx } = createDrawing();

  // Execution
  const draw = () => drawBaseLayers(ctx, 0, 0, 16, TERRAIN.HILLS, CLIMATE.TEMPERATE, VEGETATION.NONE, new Map());

  // Assertion
  assert.throws(draw, /Base-layer image is not loaded:/);
});

test("unfinished vegetation images are rejected before painting", () => {
  // Setup
  const { ctx, images, calls } = createDrawing();
  const vegetation = [...images.values()].find((image) => image.value === VEGETATION.PRESENT);
  vegetation.complete = false;

  // Execution
  const draw = () => drawBaseLayers(ctx, 0, 0, 16, TERRAIN.WATER, CLIMATE.TEMPERATE, VEGETATION.PRESENT, images);

  // Assertion
  assert.throws(draw, /Base-layer image is not loaded:/);
  assert.deepEqual(calls, []);
});
