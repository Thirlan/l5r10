import assert from "node:assert/strict";
import test from "node:test";
import { CLIMATE, TERRAIN, VEGETATION } from "../docs/scripts/world-map-layers.js";
import { BASE_LAYER_IMAGES, drawBaseLayers, drawCliffEdges } from "../docs/scripts/world-map-img-base-layers.js";

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

function createCliffDrawing() {
  const calls = [];
  const ctx = Object.fromEntries(["save", "restore", "beginPath", "moveTo", "lineTo", "stroke", "strokeRect"]
    .map((name) => [name, (...args) => calls.push([name, ...args])]));
  return { ctx, calls };
}

[undefined, {}, { 0: 0 }].forEach((directions) => {
  test(`cliff drawing skips unselected directions: ${JSON.stringify(directions)}`, () => {
    // Setup
    const { ctx, calls } = createCliffDrawing();

    // Execution
    drawCliffEdges(ctx, 0, 0, 32, 1, directions);

    // Assertion
    assert.deepEqual(calls, []);
  });
});

[
  [0, [72, 104], [88, 104]],
  [2, [88, 104], [88, 120]],
  [4, [72, 120], [88, 120]],
  [6, [72, 104], [72, 120]],
].forEach(([direction, start, end]) => {
  test(`cliff direction ${direction} draws its cardinal edge`, () => {
    // Setup
    const { ctx, calls } = createCliffDrawing();

    // Execution
    drawCliffEdges(ctx, 2, 3, 32, 1, { [direction]: 1 });

    // Assertion
    assert.deepEqual(calls, [
      ["save"], ["beginPath"], ["moveTo", ...start], ["lineTo", ...end], ["stroke"], ["restore"],
    ]);
  });
});

[
  [1, [72, 104], [88, 120], 1, -1],
  [3, [88, 104], [72, 120], 1, 1],
  [5, [72, 104], [88, 120], -1, 1],
  [7, [72, 120], [88, 104], -1, -1],
].forEach(([direction, start, end, dx, dy]) => {
  test(`cliff direction ${direction} draws its diagonal and direction mark`, () => {
    // Setup
    const { ctx, calls } = createCliffDrawing();

    // Execution
    drawCliffEdges(ctx, 2, 3, 32, 1, { [direction]: 1 });

    // Assertion
    assert.deepEqual(calls, [
      ["save"], ["beginPath"], ["moveTo", ...start], ["lineTo", ...end],
      ["moveTo", 80, 112], ["lineTo", 80 + dx * Math.SQRT1_2 * 4, 112 + dy * Math.SQRT1_2 * 4],
      ["stroke"], ["restore"],
    ]);
  });
});

test("all cliff directions draw a single rectangle", () => {
  // Setup
  const { ctx, calls } = createCliffDrawing();
  const directions = Object.fromEntries(Array.from({ length: 8 }, (_, index) => [index, 1]));

  // Execution
  drawCliffEdges(ctx, 2, 3, 32, 1, directions);

  // Assertion
  assert.deepEqual(calls, [["save"], ["strokeRect", 72, 104, 16, 16], ["restore"]]);
});

test("cliff drawing preserves numeric-string direction flags", () => {
  // Setup
  const { ctx, calls } = createCliffDrawing();

  // Execution
  drawCliffEdges(ctx, 2, 3, 32, 1, { 0: "1" });

  // Assertion
  assert.ok(calls.some(([name]) => name === "stroke"));
});

test("cliff line width is capped for small cells at low zoom", () => {
  // Setup
  const { ctx } = createCliffDrawing();

  // Execution
  drawCliffEdges(ctx, 0, 0, 8, 0.35, { 0: 1 });

  // Assertion
  assert.equal(ctx.lineWidth, 4);
});

test("cliff line width scales inversely with zoom", () => {
  // Setup
  const { ctx } = createCliffDrawing();

  // Execution
  drawCliffEdges(ctx, 0, 0, 32, 4, { 0: 1 });

  // Assertion
  assert.equal(ctx.lineWidth, 1);
});

test("cliff drawing rejects zero zoom", () => {
  // Setup
  const { ctx } = createCliffDrawing();

  // Execution
  const draw = () => drawCliffEdges(ctx, 0, 0, 32, 0, { 0: 1 });

  // Assertion
  assert.throws(draw, /positive zoom/);
});
