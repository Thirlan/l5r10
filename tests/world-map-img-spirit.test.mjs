import assert from "node:assert/strict";
import test from "node:test";
import { SPIRIT, ANIMAL } from "../docs/scripts/world-map-layers.js";
import { drawSpiritCue, getSpiritColor } from "../docs/scripts/world-map-img-spirit.js";

test("spirit color lookup returns no color for the none value", () => {
  // Setup
  const value = SPIRIT.NONE;

  // Execution
  const color = getSpiritColor(value);

  // Assertion
  assert.equal(color, null);
});

test("spirit color lookup rejects values from another overlay", () => {
  // Setup
  const value = ANIMAL.LOW;

  // Execution
  const lookupColor = () => getSpiritColor(value);

  // Assertion
  assert.throws(lookupColor, TypeError);
});

test("spirit cue draws a vertical line", () => {
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
  drawSpiritCue(context, 0, 0, 16, 16, getSpiritColor(SPIRIT.LOW));

  // Assertion
  assert.equal(points[0][0], points[1][0]);
  assert.ok(points[0][1] < points[1][1]);
});

test("spirit cue rejects invalid dimensions", () => {
  // Setup
  const context = {};

  // Execution
  const drawWithInvalidWidth = () => drawSpiritCue(context, 0, 0, 0, 16, "black");

  // Assertion
  assert.throws(drawWithInvalidWidth, TypeError);
});
