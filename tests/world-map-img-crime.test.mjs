import assert from "node:assert/strict";
import test from "node:test";
import { CRIME, SPIRIT } from "../docs/scripts/world-map-layers.js";
import { drawCrimeCue, getCrimeColor } from "../docs/scripts/world-map-img-crime.js";

test("crime color lookup returns no color for the none value", () => {
  // Setup
  const value = CRIME.NONE;

  // Execution
  const color = getCrimeColor(value);

  // Assertion
  assert.equal(color, null);
});

test("crime color lookup rejects values from another overlay", () => {
  // Setup
  const value = SPIRIT.LOW;

  // Execution
  const lookupColor = () => getCrimeColor(value);

  // Assertion
  assert.throws(lookupColor, TypeError);
});

test("crime cue draws a horizontal line", () => {
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
  drawCrimeCue(context, 0, 0, 16, 16, getCrimeColor(CRIME.LOW));

  // Assertion
  assert.ok(points[0][0] < points[1][0]);
  assert.equal(points[0][1], points[1][1]);
});

test("crime cue rejects invalid dimensions", () => {
  // Setup
  const context = {};

  // Execution
  const drawWithInvalidWidth = () => drawCrimeCue(context, 0, 0, 0, 16, "black");

  // Assertion
  assert.throws(drawWithInvalidWidth, TypeError);
});
