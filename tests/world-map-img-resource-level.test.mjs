import assert from "node:assert/strict";
import test from "node:test";
import { RESOURCE_LEVEL, SPIRIT } from "../docs/scripts/world-map-layers.js";
import { drawResourceLevelCue, getResourceLevelColor } from "../docs/scripts/world-map-img-resource-level.js";

test("resource level color lookup returns no color for the none value", () => {
  // Setup
  const value = RESOURCE_LEVEL.NONE;

  // Execution
  const color = getResourceLevelColor(value);

  // Assertion
  assert.equal(color, null);
});

test("resource level color lookup rejects values from another overlay", () => {
  // Setup
  const value = SPIRIT.LOW;

  // Execution
  const lookupColor = () => getResourceLevelColor(value);

  // Assertion
  assert.throws(lookupColor, TypeError);
});

test("resource level cue draws a vertical and horizontal cross", () => {
  // Setup
  const points = [];
  const context = {
    save() {},
    restore() {},
    beginPath() {},
    moveTo(x, y) { points.push([x, y]); },
    lineTo(x, y) { points.push([x, y]); },
    stroke() {},
  };

  // Execution
  drawResourceLevelCue(context, 0, 0, 16, 16, getResourceLevelColor(RESOURCE_LEVEL.LOW));

  // Assertion
  assert.equal(points.length, 4);
  assert.equal(points[0][0], points[1][0]);
  assert.equal(points[2][1], points[3][1]);
});

test("resource level cue rejects invalid dimensions", () => {
  // Setup
  const context = {};

  // Execution
  const drawWithInvalidWidth = () => drawResourceLevelCue(context, 0, 0, 0, 16, "black");

  // Assertion
  assert.throws(drawWithInvalidWidth, TypeError);
});
