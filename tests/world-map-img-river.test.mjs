import assert from "node:assert/strict";
import test from "node:test";
import { drawRiver } from "../docs/scripts/world-map-img-river.js";

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
