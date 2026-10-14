import assert from "node:assert/strict";
import test from "node:test";
import { drawRiver, RIVER_OFFSETS } from "../docs/scripts/world-map-img-river.js";
import { TERRAIN } from "../docs/scripts/world-map-layers.js";

function draw(neighbors) {
  const strokes = [];
  let start;
  const context = {
    save() {},
    restore() {},
    beginPath() {},
    moveTo(x, y) { start = [x, y]; },
    lineTo(x, y) { strokes.push([start, [x, y]]); },
    stroke() {},
  };
  drawRiver(context, 1, 2, 16, neighbors);
  return strokes;
}

test("isolated river draws cross-cues", () => {
  // Setup
  const isolated = { east: false, south: false, west: false, north: false };

  // Execution
  const isolatedStrokes = draw(isolated);

  // Assertion
  assert.equal(isolatedStrokes.length, 6);
});

test("river draws lines toward forward connected neighbors", () => {
  // Setup
  const eastConnected = { east: true, south: false, west: false, north: false };
  const southConnected = { east: false, south: true, west: false, north: false };

  // Execution
  const eastStrokes = draw(eastConnected);
  const southStrokes = draw(southConnected);

  // Assertion
  assert.equal(eastStrokes.length, 3);
  assert.equal(southStrokes.length, 3);
});

test("river ignores connections to reverse neighbors", () => {
  // Setup
  const westConnected = { east: false, south: false, west: true, north: false };

  // Execution
  const strokes = draw(westConnected);

  // Assertion
  assert.equal(strokes.length, 0);
});

test("river drawing rejects missing canvas context", () => {
  // Setup
  const neighbors = { east: false, south: false, west: false, north: false };

  // Execution
  const drawWithoutContext = () => drawRiver(null, 0, 0, 16, neighbors);

  // Assertion
  assert.throws(drawWithoutContext, TypeError);
});

test("river drawing rejects invalid neighbor values", () => {
  // Setup
  const invalidNeighbors = {};

  // Execution
  const drawWithInvalidNeighbors = () => drawRiver({}, 0, 0, 16, invalidNeighbors);

  // Assertion
  assert.throws(drawWithInvalidNeighbors, TypeError);
});

test("river drawing rejects a non-positive grid size", () => {
  // Setup
  const neighbors = { east: false, south: false, west: false, north: false };

  // Execution
  const drawWithInvalidGridSize = () => drawRiver({}, 0, 0, 0, neighbors);

  // Assertion
  assert.throws(drawWithInvalidGridSize, TypeError);
});

for (const [direction, [name, dx, dy]] of RIVER_OFFSETS.entries()) {
  test(`selected river direction ${name} reaches the cell boundary`, () => {
    const strokes = [];
    const context = {
      save() {}, restore() {}, beginPath() {}, moveTo() {}, stroke() {},
      lineTo(x, y) { strokes.push([x, y]); },
    };
    drawRiver(context, 0, 0, 16, { east: false, south: false, west: false, north: false },
      {}, { [direction]: 1 });
    assert.equal(strokes.length, 3);
    assert.deepEqual(strokes[1], [8 + dx * 8, 8 + dy * 8]);
  });
}

test("adjacent water fills cardinal triangles with the adjacent terrain color", () => {
  const triangles = [];
  const outlines = [];
  let vertices;
  let outlinePath;
  const context = {
    save() {}, restore() {}, beginPath() { vertices = []; outlinePath = []; },
    moveTo(x, y) { vertices.push([x, y]); outlinePath.push([x, y]); },
    lineTo(x, y) { vertices.push([x, y]); outlinePath.push([x, y]); },
    closePath() {}, fill() { triangles.push({ color: this.fillStyle, vertices }); },
    stroke() { outlines.push({ color: this.strokeStyle, width: this.lineWidth, vertices: [...outlinePath] }); },
  };
  drawRiver(context, 0, 0, 16, { east: false, south: false, west: false, north: false },
    { north: TERRAIN.WATER, east: TERRAIN.COASTAL_WATER,
      south: TERRAIN.WATER, west: TERRAIN.COASTAL_WATER }, {});
  assert.equal(triangles.length, 4);
  assert.deepEqual(triangles[0], { color: "#1E90FF", vertices: [[8, 8], [16, 0], [0, 0]] });
  assert.deepEqual(triangles.map(({ color }) => color), ["#1E90FF", "#4169E1", "#1E90FF", "#4169E1"]);
  assert.deepEqual(triangles[1].vertices, [[8, 8], [16, 16], [16, 0]]);
  assert.deepEqual(triangles[2].vertices, [[8, 8], [0, 16], [16, 16]]);
  assert.deepEqual(triangles[3].vertices, [[8, 8], [0, 0], [0, 16]]);
  assert.equal(outlines.length, 4);
  assert.ok(outlines.every(({ color, width }) => color === "#F4A460" && width === 0.3));
  assert.deepEqual(outlines[0].vertices, [[8, 8], [16, 0], [8, 8], [0, 0]]);
  assert.ok(outlines.every(({ vertices }) => vertices.length === 4));
});

test("river-to-ocean triangles use the ocean color", () => {
  const colors = [];
  const context = {
    save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
    fill() { colors.push(this.fillStyle); }, stroke() {},
  };
  drawRiver(context, 0, 0, 16, { east: false, south: false, west: false, north: false },
    { north: TERRAIN.OCEAN }, {});
  assert.deepEqual(colors, ["#00008B"]);
});

for (const terrain of [TERRAIN.WATER, TERRAIN.COASTAL_WATER, TERRAIN.OCEAN]) {
  for (const index of [1, 3, 5, 7]) {
    const [name, dx, dy] = RIVER_OFFSETS[index];
    test(`diagonal flow into ${terrain.name} toward ${name} draws strokes, not triangles`, () => {
      // Setup
      const strokes = [];
      let fills = 0;
      const context = {
        save() {}, restore() {}, beginPath() {}, moveTo() {}, closePath() {},
        lineTo(x, y) { this.end = [x, y]; },
        stroke() { strokes.push({ end: this.end, color: this.strokeStyle, width: this.lineWidth }); },
        fill() { fills++; },
      };

      // Execution
      drawRiver(context, 0, 0, 16, { east: false, south: false, west: false, north: false },
        { [name]: terrain }, { [index]: 1 });

      // Assertion
      assert.equal(fills, 0);
      assert.equal(strokes.length, 3);
      assert.deepEqual(strokes[1], { end: [8 + dx * 8, 8 + dy * 8], color: "#1E90FF", width: 2.7 });
      assert.deepEqual(strokes.filter((_, i) => i !== 1).map(({ color, width }) => [color, width]),
        [["#F4A460", 0.3], ["#F4A460", 0.3]]);
    });
  }
}

test("unselected diagonal water does not create a connection", () => {
  // Setup
  let paths = 0;
  const context = { save() {}, restore() {}, beginPath() { paths++; } };

  // Execution
  drawRiver(context, 0, 0, 16, { east: false, south: false, west: false, north: false },
    { northeast: TERRAIN.WATER }, {});

  // Assertion
  assert.equal(paths, 0);
});
