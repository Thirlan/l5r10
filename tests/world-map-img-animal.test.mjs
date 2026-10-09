import assert from "node:assert/strict";
import test from "node:test";
import { ANIMAL, SPIRIT } from "../docs/scripts/world-map-layers.js";
import { drawAnimalCue, getAnimalColor } from "../docs/scripts/world-map-img-animal.js";

test("animal color lookup returns no color for the none value", () => {
  // Setup
  const value = ANIMAL.NONE;

  // Execution
  const color = getAnimalColor(value);

  // Assertion
  assert.equal(color, null);
});

test("animal color lookup rejects values from another overlay", () => {
  // Setup
  const value = SPIRIT.LOW;

  // Execution
  const lookupColor = () => getAnimalColor(value);

  // Assertion
  assert.throws(lookupColor, TypeError);
});

test("animal cue draws a filled circle", () => {
  // Setup
  let arcs = 0;
  let fills = 0;
  const context = {
    save() {},
    restore() {},
    beginPath() {},
    arc() { arcs += 1; },
    fill() { fills += 1; },
  };

  // Execution
  drawAnimalCue(context, 0, 0, 16, 16, getAnimalColor(ANIMAL.LOW));

  // Assertion
  assert.equal(arcs, 1);
  assert.equal(fills, 1);
});

test("animal cue rejects invalid dimensions", () => {
  // Setup
  const context = {};

  // Execution
  const drawWithInvalidWidth = () => drawAnimalCue(context, 0, 0, 0, 16, "black");

  // Assertion
  assert.throws(drawWithInvalidWidth, TypeError);
});
