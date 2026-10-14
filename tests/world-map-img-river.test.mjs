import assert from "node:assert/strict";
import test from "node:test";
import { drawRiver, RIVER_OFFSETS } from "../docs/scripts/world-map-img-river.js";

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
  assert.equal(isolatedStrokes.length, 10);
});

test("river draws lines toward forward connected neighbors", () => {
  // Setup
  const eastConnected = { east: true, south: false, west: false, north: false };
  const southConnected = { east: false, south: true, west: false, north: false };

  // Execution
  const eastStrokes = draw(eastConnected);
  const southStrokes = draw(southConnected);

  // Assertion
  assert.equal(eastStrokes.length, 5);
  assert.equal(southStrokes.length, 5);
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
    assert.equal(strokes.length, 5);
    assert.deepEqual(strokes[2], [8 + dx * 8, 8 + dy * 8]);
  });
}

test("adjacent water fills every cardinal triangle with the river center color", () => {
  const triangles = [];
  let vertices;
  const context = {
    save() {}, restore() {}, beginPath() { vertices = []; },
    moveTo(x, y) { vertices.push([x, y]); }, lineTo(x, y) { vertices.push([x, y]); },
    closePath() {}, fill() { triangles.push({ color: this.fillStyle, vertices }); },
  };
  drawRiver(context, 0, 0, 16, { east: false, south: false, west: false, north: false },
    { north: true, east: true, south: true, west: true }, {});
  assert.equal(triangles.length, 4);
  assert.deepEqual(triangles[0], { color: "#0000FF", vertices: [[8, 8], [16, 0], [0, 0]] });
  assert.deepEqual(triangles[1].vertices, [[8, 8], [16, 16], [16, 0]]);
  assert.deepEqual(triangles[2].vertices, [[8, 8], [0, 16], [16, 16]]);
  assert.deepEqual(triangles[3].vertices, [[8, 8], [0, 0], [0, 16]]);
});

test("diagonal water fills a right triangle that reaches the shared corner", () => {
  const vertices = [];
  const context = {
    save() {}, restore() {}, beginPath() {}, closePath() {}, fill() {},
    moveTo(x, y) { vertices.push([x, y]); }, lineTo(x, y) { vertices.push([x, y]); },
  };
  drawRiver(context, 0, 0, 16, { east: false, south: false, west: false, north: false },
    { northeast: true }, {});
  assert.deepEqual(vertices, [[8, 8], [16, 0], [16, 8]]);
  assert.equal(context.fillStyle, "#0000FF");
});
