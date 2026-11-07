import assert from "node:assert/strict";
import test from "node:test";
import { CLIMATE, TERRAIN, VEGETATION } from "../../../docs/scripts/world/data/world-map-data-layers.js";
import { BASE_LAYER_IMAGES, drawBaseLayers, drawCliffEdges, drawWaterEdges } from "../../../docs/scripts/world/draw/world-map-img-base-layers.js";

function createDrawing() {
  const calls = [];
  const images = new Map(BASE_LAYER_IMAGES.map(({ value, image }) => [image, { value, complete: true, naturalWidth: 32 }]));
  const ctx = {
    save() {},
    restore() {},
    fillRect: (...args) => calls.push(["fill", ...args]),
    drawImage: (image, ...args) => calls.push([image.value, ...args]),
  };
  return { ctx, images, calls };
}

test("water edges draw sandbank lines beside land, but not beside water", () => {
  const calls = [];
  const ctx = {
    save() {},
    restore() {},
    beginPath() {},
    stroke() {
      calls.push([this.strokeStyle, this.lineWidth]);
    },
    moveTo: (...point) => calls.push(["move", ...point]),
    lineTo: (...point) => calls.push(["line", ...point]),
  };

  drawWaterEdges(ctx, 2, 3, 16, TERRAIN.WATER, {
    north: TERRAIN.FLAT,
    east: TERRAIN.COASTAL_WATER,
    south: TERRAIN.OCEAN,
    west: null,
  });

  assert.deepEqual(calls, [
    ["move", 32, 48],
    ["line", 48, 48],
    ["#F4A460", 0.3],
  ]);
});

test("water edges skip banks beside connected rivers", () => {
  const calls = [];
  const ctx = {
    save() {},
    restore() {},
    beginPath() {},
    stroke() {
      calls.push([this.strokeStyle, this.lineWidth]);
    },
    moveTo: (...point) => calls.push(["move", ...point]),
    lineTo: (...point) => calls.push(["line", ...point]),
  };

  drawWaterEdges(
    ctx,
    0,
    0,
    16,
    TERRAIN.WATER,
    {
      north: TERRAIN.FLAT,
      east: TERRAIN.FLAT,
      south: TERRAIN.FLAT,
      west: null,
    },
    { north: true },
  );

  assert.deepEqual(calls, [
    ["move", 16, 0],
    ["line", 16, 16],
    ["move", 0, 16],
    ["line", 16, 16],
    ["#F4A460", 0.3],
  ]);
});

test("coastal water edges use the sandbank line beside land", () => {
  const calls = [];
  const ctx = {
    save() {},
    restore() {},
    beginPath() {},
    stroke() {
      calls.push([this.strokeStyle, this.lineWidth]);
    },
    moveTo() {},
    lineTo() {},
  };

  drawWaterEdges(ctx, 0, 0, 16, TERRAIN.COASTAL_WATER, {
    north: null,
    east: TERRAIN.HILLS,
    south: TERRAIN.WATER,
    west: TERRAIN.OCEAN,
  });

  assert.deepEqual(calls, [["#F4A460", 0.3]]);
});

test("ocean cells do not draw sandbank edges", () => {
  const ctx = {
    save() {
      throw new Error("Ocean edges must not be drawn");
    },
  };
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

test("flat land draws its terrain image beneath vegetation", () => {
  // Setup
  const { ctx, images, calls } = createDrawing();

  // Execution
  drawBaseLayers(ctx, 0, 0, 16, TERRAIN.FLAT, CLIMATE.TEMPERATE, VEGETATION.PRESENT, images);

  // Assertion
  assert.deepEqual(
    calls.map(([layer]) => layer),
    ["fill", TERRAIN.FLAT, VEGETATION.PRESENT],
  );
});

[TERRAIN.WATER, TERRAIN.COASTAL_WATER, TERRAIN.OCEAN].forEach((terrain) => {
  test(`${terrain.name} drawing composites vegetation above the water fill`, () => {
    // Setup
    const { ctx, images, calls } = createDrawing();

    // Execution
    drawBaseLayers(ctx, 0, 0, 16, terrain, CLIMATE.TEMPERATE, VEGETATION.PRESENT, images);

    // Assertion
    assert.deepEqual(
      calls.map(([layer]) => layer),
      ["fill", "fill", VEGETATION.PRESENT],
    );
  });
});

test("absent vegetation draws no vegetation image", () => {
  // Setup
  const { ctx, images, calls } = createDrawing();

  // Execution
  drawBaseLayers(ctx, 0, 0, 16, TERRAIN.FLAT, CLIMATE.TEMPERATE, VEGETATION.NONE, images);

  // Assertion
  assert.deepEqual(
    calls.map(([layer]) => layer),
    ["fill", TERRAIN.FLAT],
  );
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
  const rotations = [];
  Object.assign(drawing.ctx, { translate() {}, scale() {}, rotate: (angle) => rotations.push(angle) });
  return { ...drawing, rotations };
}

test("cliff drawing skips cells without elevation edges", () => {
  const { ctx, calls } = createCliffDrawing();
  drawCliffEdges(ctx, 0, 0, 32, 1, []);
  assert.deepEqual(calls, []);
});

[0, 1, 2, 3, 4, 5, 6, 7].forEach((direction) => {
  test(`elevation edge ${direction} draws rotated contour sprites`, () => {
    const { ctx, images, calls, rotations } = createCliffDrawing();
    drawCliffEdges(ctx, 2, 3, 16, 1, [direction], images);
    assert.deepEqual(
      calls.map(([name]) => name),
      direction % 2 ? ["inward"] : ["bottom", "slope", "slope"],
    );
    assert.ok(rotations.every((angle) => angle === (((Math.floor(direction / 2) + 2) % 4) * Math.PI) / 2));
    assert.equal(ctx.imageSmoothingEnabled, false);
  });
});

test("a raised tile draws four sides without extra diagonal cuts", () => {
  const { ctx, images, calls } = createCliffDrawing();
  drawCliffEdges(ctx, 0, 0, 16, 1, [0, 1, 2, 3, 4, 5, 6, 7], images);
  assert.equal(calls.filter(([kind]) => kind === "bottom").length, 4);
  assert.equal(calls.filter(([kind]) => kind === "corner").length, 4);
  assert.equal(calls.filter(([kind]) => kind === "inward").length, 0);
});

test("neighboring cliffs continue a contour without slope ends", () => {
  const { ctx, images, calls } = createCliffDrawing();
  drawCliffEdges(ctx, 0, 0, 16, 1, [4], images, { 2: [4], 6: [4] });
  assert.deepEqual(
    calls.map(([name]) => name),
    ["bottom", "bottom", "bottom"],
  );
});

test("neighboring diagonal edges fill an inward corner", () => {
  const { ctx, images, calls } = createCliffDrawing();
  drawCliffEdges(ctx, 0, 0, 16, 1, [], images, { 4: [5], 6: [5] });
  assert.deepEqual(
    calls.map(([name]) => name),
    ["inward"],
  );
});

test("missing contour sprites report their asset path", () => {
  const { ctx } = createCliffDrawing();
  assert.throws(() => drawCliffEdges(ctx, 0, 0, 16, 1, [4], new Map()), /cliff_bottom.webp/);
});

test("cliff drawing rejects invalid edge directions", () => {
  const { ctx } = createCliffDrawing();
  [undefined, {}, [8], [-1], [1.5], ["0"]].forEach((edges) => {
    assert.throws(() => drawCliffEdges(ctx, 0, 0, 16, 1, edges), /directions/);
  });
});

test("cliff drawing rejects zero zoom", () => {
  const { ctx } = createCliffDrawing();
  assert.throws(() => drawCliffEdges(ctx, 0, 0, 32, 0, [0]), /positive zoom/);
});
