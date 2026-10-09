import assert from "node:assert/strict";
import test from "node:test";
import { INFRASTRUCTURE } from "../docs/scripts/world-map-layers.js";
import { drawInfrastructure } from "../docs/scripts/world-map-img-infrastructure.js";

function recordInfrastructureDrawing(value, changes = {}) {
  const calls = { strokes: [], text: [] };
  let start;
  const context = {
    save() {},
    restore() {},
    beginPath() {},
    moveTo(x, y) { start = [x, y]; },
    lineTo(x, y) {
      calls.strokes.push({ start, end: [x, y], width: this.lineWidth, color: this.strokeStyle });
    },
    stroke() {},
    fillText(text, x, y) { calls.text.push({ text, x, y, color: this.fillStyle }); },
  };
  drawInfrastructure(context, 1, 2, 16, value, {
    east: false, south: false, southeast: false, northeast: false, ...changes,
  });
  return calls;
}

test("road drawing follows connected neighbors", () => {
  // Setup
  const roadNeighbors = { east: true, northeast: true };

  // Execution
  const roads = recordInfrastructureDrawing(INFRASTRUCTURE.ROAD, roadNeighbors);

  // Assertion
  assert.equal(roads.strokes.length, 2);
});

test("footpath drawing follows connected neighbors", () => {
  // Setup
  const footpathNeighbors = { south: true };

  // Execution
  const footpaths = recordInfrastructureDrawing(INFRASTRUCTURE.FOOTPATH, footpathNeighbors);

  // Assertion
  assert.equal(footpaths.strokes.length, 1);
});

test("port drawing uses a marker instead of connected road lines", () => {
  // Setup
  const portType = INFRASTRUCTURE.SMALL_PORT;

  // Execution
  const port = recordInfrastructureDrawing(portType);

  // Assertion
  assert.equal(port.text.length, 1);
  assert.equal(port.strokes.length, 0);
});

test("empty infrastructure draws nothing", () => {
  // Setup
  const emptyType = INFRASTRUCTURE.NONE;

  // Execution
  const result = recordInfrastructureDrawing(emptyType);

  // Assertion
  assert.equal(result.strokes.length, 0);
  assert.equal(result.text.length, 0);
});

test("infrastructure drawing rejects a non-infrastructure value", () => {
  // Setup
  const context = {};
  const neighbors = { east: false, south: false, southeast: false, northeast: false };

  // Execution
  const drawInvalidValue = () => drawInfrastructure(context, 1, 2, 16, {}, neighbors);

  // Assertion
  assert.throws(drawInvalidValue, TypeError);
});

test("infrastructure drawing rejects incomplete neighbor data", () => {
  // Setup
  const neighbors = {};

  // Execution
  const drawWithIncompleteNeighbors = () => drawInfrastructure({}, 1, 2, 16, INFRASTRUCTURE.ROAD, neighbors);

  // Assertion
  assert.throws(drawWithIncompleteNeighbors, TypeError);
});

test("infrastructure drawing rejects a non-positive grid size", () => {
  // Setup
  const neighbors = { east: false, south: false, southeast: false, northeast: false };

  // Execution
  const drawWithInvalidGridSize = () => drawInfrastructure({}, 1, 2, 0, INFRASTRUCTURE.ROAD, neighbors);

  // Assertion
  assert.throws(drawWithInvalidGridSize, TypeError);
});
