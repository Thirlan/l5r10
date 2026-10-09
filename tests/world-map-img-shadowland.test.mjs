import assert from "node:assert/strict";
import test from "node:test";
import { SHADOWLAND, SPIRIT } from "../docs/scripts/world-map-layers.js";
import { drawShadowlandCue, getShadowlandColor } from "../docs/scripts/world-map-img-shadowland.js";

test("shadowland color lookup returns no color for the none value", () => {
  // Setup
  const value = SHADOWLAND.NONE;

  // Execution
  const color = getShadowlandColor(value);

  // Assertion
  assert.equal(color, null);
});

test("shadowland color lookup rejects values from another overlay", () => {
  // Setup
  const value = SPIRIT.LOW;

  // Execution
  const lookupColor = () => getShadowlandColor(value);

  // Assertion
  assert.throws(lookupColor, TypeError);
});

test("shadowland cue draws a descending diagonal", () => {
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
  drawShadowlandCue(context, 0, 0, 16, 16, getShadowlandColor(SHADOWLAND.LOW));

  // Assertion
  assert.ok(points[0][0] < points[1][0]);
  assert.ok(points[0][1] < points[1][1]);
});

test("shadowland cue rejects invalid dimensions", () => {
  // Setup
  const context = {};

  // Execution
  const drawWithInvalidWidth = () => drawShadowlandCue(context, 0, 0, 0, 16, "black");

  // Assertion
  assert.throws(drawWithInvalidWidth, TypeError);
});
