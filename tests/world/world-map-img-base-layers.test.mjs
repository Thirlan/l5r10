import assert from "node:assert/strict";
import test from "node:test";
import { CLIMATE, TERRAIN, VEGETATION } from "../../docs/scripts/world/world-map-layers.js";
import {
  BASE_LAYER_IMAGES, drawBaseLayers, drawCliffEdges, drawWaterEdges,
} from "../../docs/scripts/world/world-map-img-base-layers.js";

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

test("water edges draw sandbank lines beside land, but not beside water", () => {
  const calls = [];
  const ctx = {
    save() {}, restore() {}, beginPath() {}, stroke() { calls.push([this.strokeStyle, this.lineWidth]); },
    moveTo: (...point) => calls.push(["move", ...point]), lineTo: (...point) => calls.push(["line", ...point]),
  };

  drawWaterEdges(ctx, 2, 3, 16, TERRAIN.WATER, {
    north: TERRAIN.FLAT, east: TERRAIN.COASTAL_WATER, south: TERRAIN.OCEAN, west: null,
  });

  assert.deepEqual(calls, [
    ["move", 32, 48], ["line", 48, 48],
    ["#F4A460", 0.3],
  ]);
});

test("water edges skip banks beside connected rivers", () => {
  const calls = [];
  const ctx = {
    save() {}, restore() {}, beginPath() {}, stroke() { calls.push([this.strokeStyle, this.lineWidth]); },
    moveTo: (...point) => calls.push(["move", ...point]), lineTo: (...point) => calls.push(["line", ...point]),
  };

  drawWaterEdges(ctx, 0, 0, 16, TERRAIN.WATER, {
    north: TERRAIN.FLAT, east: TERRAIN.FLAT, south: TERRAIN.FLAT, west: null,
  }, { north: true });

  assert.deepEqual(calls, [
    ["move", 16, 0], ["line", 16, 16],
    ["move", 0, 16], ["line", 16, 16],
    ["#F4A460", 0.3],
  ]);
});

test("coastal water edges use the sandbank line beside land", () => {
  const calls = [];
  const ctx = {
    save() {}, restore() {}, beginPath() {}, stroke() { calls.push([this.strokeStyle, this.lineWidth]); },
    moveTo() {}, lineTo() {},
  };

  drawWaterEdges(ctx, 0, 0, 16, TERRAIN.COASTAL_WATER, {
    north: null, east: TERRAIN.HILLS, south: TERRAIN.WATER, west: TERRAIN.OCEAN,
  });

  assert.deepEqual(calls, [["#F4A460", 0.3]]);
});

test("ocean cells do not draw sandbank edges", () => {
  const ctx = { save() { throw new Error("Ocean edges must not be drawn"); } };
  drawWaterEdges(ctx, 0, 0, 16, TERRAIN.OCEAN, { north: TERRAIN.FLAT });
});

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

test("cliff drawing uses flat terrain beneath vegetation", () => {
  // Setup
  const { ctx, images, calls } = createDrawing();

  // Execution
  drawBaseLayers(ctx, 0, 0, 16, TERRAIN.CLIFF, CLIMATE.TEMPERATE, VEGETATION.PRESENT, images);

  // Assertion
  assert.deepEqual(calls.map(([layer]) => layer), ["fill", TERRAIN.FLAT, VEGETATION.PRESENT]);
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
  const drawing = createDrawing();
  const transforms = [];
  ["translate", "rotate", "scale"].forEach((name) => {
    drawing.ctx[name] = (...args) => transforms.push([name, ...args]);
  });
  return { ...drawing, transforms };
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

[4, 6, 0, 2].forEach((direction, rotation) => {
  test(`cliff direction ${direction} draws three rotated sprites with tapered ends`, () => {
    // Setup
    const { ctx, images, calls, transforms } = createCliffDrawing();

    // Execution
    drawCliffEdges(ctx, 2, 3, 48, 1, { [direction]: 1 }, images);

    // Assertion
    assert.deepEqual(calls, [["bottom", -8, -8, 16, 16], ["slope", -8, -8, 16, 16], ["slope", -8, -8, 16, 16]]);
    assert.ok(transforms.some(([name, angle]) => name === "rotate" && angle === rotation * Math.PI / 2));
    assert.ok(transforms.some(([name, x, y]) => name === "translate" && x === 120 && y === 168));
    assert.ok(transforms.some(([name, x]) => name === "scale" && x === -1));
  });
});

[5, 7, 1, 3].forEach((direction, rotation) => {
  test(`cliff direction ${direction} draws three rotated diagonal sprites`, () => {
    // Setup
    const { ctx, images, calls, transforms } = createCliffDrawing();

    // Execution
    drawCliffEdges(ctx, 2, 3, 48, 1, { [direction]: 1 }, images);

    // Assertion
    assert.deepEqual(calls.map(([name]) => name), ["diagonal", "diagonal", "diagonal"]);
    assert.equal(transforms.filter(([name, angle]) => name === "rotate" && angle === rotation * Math.PI / 2).length, 3);
  });
});

test("all cliff directions draw four edges and four corners without crossing diagonals", () => {
  // Setup
  const { ctx, images, calls } = createCliffDrawing();
  const directions = Object.fromEntries(Array.from({ length: 8 }, (_, index) => [index, 1]));

  // Execution
  drawCliffEdges(ctx, 2, 3, 32, 1, directions, images);

  // Assertion
  assert.deepEqual(calls.map(([name]) => name), ["bottom", "corner", "bottom", "corner", "bottom", "corner", "bottom", "corner"]);
});

test("cliff drawing preserves numeric-string direction flags", () => {
  // Setup
  const { ctx, images, calls } = createCliffDrawing();

  // Execution
  drawCliffEdges(ctx, 2, 3, 32, 1, { 0: "1" }, images);

  // Assertion
  assert.equal(calls.length, 3);
});

test("connected bottom cliffs tile three straight sprites", () => {
  // Setup
  const { ctx, images, calls } = createCliffDrawing();

  // Execution
  drawCliffEdges(ctx, 0, 0, 48, 1, { 4: 1 }, images, { 6: { 4: 1 }, 2: { 4: "1" } });

  // Assertion
  assert.deepEqual(calls.map(([name]) => name), ["bottom", "bottom", "bottom"]);
});

test("neighbors with a different cliff direction do not prevent tapered ends", () => {
  // Setup
  const { ctx, images, calls } = createCliffDrawing();
  // Execution
  drawCliffEdges(ctx, 0, 0, 48, 1, { 4: 1 }, images, { 6: { 0: 1 }, 2: { 0: 1 } });
  // Assertion
  assert.deepEqual(calls.map(([name]) => name), ["bottom", "slope", "slope"]);
});

test("one diagonal wing does not select an inward corner", () => {
  // Setup
  const { ctx, images, calls } = createCliffDrawing();
  // Execution
  drawCliffEdges(ctx, 0, 0, 48, 1, { 5: 1 }, images, { 6: { 5: 1 } });
  // Assertion
  assert.deepEqual(calls.map(([name]) => name), ["diagonal", "diagonal", "diagonal"]);
});

test("bottom and left cliffs share one rotated outer corner", () => {
  // Setup
  const { ctx, images, calls } = createCliffDrawing();

  // Execution
  drawCliffEdges(ctx, 0, 0, 48, 1, { 4: 1, 6: 1 }, images, { 2: { 4: 1 }, 0: { 6: 1 } });

  // Assertion
  assert.deepEqual(calls.map(([name]) => name), ["bottom", "bottom", "bottom", "bottom", "corner"]);
});

[5, 7, 1, 3].forEach((direction, rotation) => {
  test(`neighboring diagonal cliffs select an inward corner for direction ${direction}`, () => {
    // Setup
    const { ctx, images, calls } = createCliffDrawing();
    const bottom = (4 + rotation * 2) % 8;
    const neighbors = { [bottom]: { [direction]: 1 }, [(bottom + 2) % 8]: { [direction]: 1 } };
    // Execution
    drawCliffEdges(ctx, 0, 0, 48, 1, { [direction]: 1 }, images, neighbors);
    // Assertion
    assert.deepEqual(calls.map(([name]) => name), ["inward"]);
  });
});

test("missing cliff sprites report the asset path", () => {
  // Setup
  const { ctx } = createCliffDrawing();
  // Execution
  const draw = () => drawCliffEdges(ctx, 0, 0, 48, 1, { 4: 1 }, new Map());
  // Assertion
  assert.throws(draw, /cliff_bottom.webp/);
});

test("cliff drawing rejects zero zoom", () => {
  // Setup
  const { ctx } = createCliffDrawing();

  // Execution
  const draw = () => drawCliffEdges(ctx, 0, 0, 32, 0, { 0: 1 });

  // Assertion
  assert.throws(draw, /positive zoom/);
});
