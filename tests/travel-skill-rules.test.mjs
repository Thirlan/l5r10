import assert from "node:assert/strict";
import test from "node:test";
import { crossesWithinCell, environmentModifier, infrastructureModifier, validateTravelInput } from "../docs/scripts/travel-skill-rules.js";
import { INFRASTRUCTURE, TERRAIN } from "../docs/scripts/world-map-layers.js";

test("missing layers use map defaults without changing the input", () => {
  // Setup
  const cell = Object.freeze({});
  // Execution
  const result = validateTravelInput("foot", cell, 0);
  // Assertion
  assert.deepEqual(result, { terrain: 0, climate: 0, vegetation: 0, river: 0, infrastructure: 0, clan: 0 });
  assert.deepEqual(cell, {});
});

[
  ["unknown mode", "fly", {}, 0],
  ["numeric mode", 0, {}, 0],
  ["negative direction", "foot", {}, -1],
  ["out-of-range direction", "foot", {}, 8],
  ["fractional direction", "foot", {}, 1.5],
  ["string direction", "foot", {}, "0"],
  ["missing cell", "foot", null, 0],
  ["array cell", "foot", [], 0],
  ["unknown layer", "foot", { climate: 99 }, 0],
  ["null layer", "foot", { terrain: null }, 0],
  ["string layer", "foot", { infrastructure: "Road" }, 0],
  ["water vegetation", "foot", { terrain: TERRAIN.WATER.id, vegetation: 1 }, 0],
  ["water river", "foot", { terrain: TERRAIN.WATER.id, river: 1 }, 0],
  ["missing river flow", "foot", { river: 1 }, 0],
  ["missing cliff normal", "foot", { terrain: TERRAIN.CLIFF.id }, 0],
  ["empty active flags", "foot", { river: 1, "river direction": {} }, 0],
  ["null flags", "foot", { "river direction": null }, 0],
  ["array flags", "foot", { "river direction": [] }, 0],
  ["unknown direction flag", "foot", { "river direction": { 8: 1 } }, 0],
  ["invalid direction value", "foot", { "river direction": { 0: true } }, 0],
].forEach(([name, mode, cell, direction]) =>
  test(`rejects ${name}`, () => {
    // Assertion
    assert.throws(() => validateTravelInput(mode, cell, direction), TypeError);
  }),
);

Array.from({ length: 8 }, (_, direction) => direction).forEach((direction) =>
  test(`river axis ${direction} distinguishes parallel movement`, () => {
    // Setup
    const cell = { "river direction": { [direction]: 1, [(direction + 1) % 8]: 0 } };
    // Assertion
    assert.equal(crossesWithinCell(cell, direction, "river"), false);
    assert.equal(crossesWithinCell(cell, (direction + 4) % 8, "river"), false);
    assert.equal(crossesWithinCell(cell, (direction + 2) % 8, "river"), true);
  }),
);

[1, 3, 5, 7].forEach((normal) =>
  test(`diagonal cliff normal ${normal} distinguishes walking alongside`, () => {
    // Setup
    const cell = { "cliff direction": { [normal]: 1 } };
    // Assertion
    assert.equal(crossesWithinCell(cell, normal, "cliff"), true);
    assert.equal(crossesWithinCell(cell, (normal + 4) % 8, "cliff"), true);
    assert.equal(crossesWithinCell(cell, (normal + 2) % 8, "cliff"), false);
  }),
);

test("no direction flags means no internal crossing", () => {
  // Assertion
  assert.equal(crossesWithinCell({}, 0, "river"), false);
});

[
  [0, 0],
  [1, 1],
].forEach(([vegetation, expected]) =>
  test(`vegetation ${vegetation} modifier`, () => {
    // Setup
    const cell = validateTravelInput("foot", { vegetation }, 0);
    // Assertion
    assert.equal(environmentModifier(cell), expected);
    assert.equal(environmentModifier(cell, true), expected);
  }),
);

[
  [INFRASTRUCTURE.NONE, 0],
  [INFRASTRUCTURE.ROAD, -4],
  [INFRASTRUCTURE.FOOTPATH, -2],
  [INFRASTRUCTURE.SMALL_PORT, 0],
  [INFRASTRUCTURE.LARGE_PORT, 0],
].forEach(([infrastructure, expected]) =>
  test(`${infrastructure.name} infrastructure modifier`, () => {
    // Setup
    const cell = validateTravelInput("foot", { infrastructure: infrastructure.id }, 0);
    // Assertion
    assert.equal(infrastructureModifier(cell), expected);
  }),
);
