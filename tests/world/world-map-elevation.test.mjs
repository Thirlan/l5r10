import assert from "node:assert/strict";
import test from "node:test";
import { drawElevationCue, getCliffDifference, getCliffEdges, getElevation, getElevationColor } from "../../docs/scripts/world/world-map-elevation.js";
import { LAYERS, NEIGHBOR_OFFSETS, TERRAIN } from "../../docs/scripts/world/world-map-layers.js";

test("missing elevation is one metre without changing the saved cell", () => {
  const cell = {};
  assert.equal(getElevation(cell), 1);
  assert.deepEqual(cell, {});
});

[-4000, -1, 0, 1, 1000, 5000].forEach((elevation) => {
  test(`elevation ${elevation} remains a numeric value`, () => {
    assert.equal(getElevation({ elevation }), elevation);
    assert.equal(LAYERS.ELEVATION.getValue(elevation).id, elevation);
  });
});

["100", 1.5, null, undefined, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].forEach((elevation) => {
  test(`invalid elevation ${String(elevation)} is rejected`, () => {
    assert.throws(() => getElevation({ elevation }), TypeError);
    assert.throws(() => getElevationColor(elevation), TypeError);
    assert.equal(LAYERS.ELEVATION.getValue(elevation), undefined);
  });
});

test("cliff height uses the inclusive 75 metre boundary in both directions", () => {
  assert.equal(getCliffDifference({}, { elevation: 75 }), 0);
  assert.equal(getCliffDifference({}, { elevation: 76 }), 75);
  assert.equal(getCliffDifference({ elevation: 76 }, {}), 75);
  assert.equal(getCliffDifference({ elevation: 0 }, { elevation: -75 }), 75);
});

test("cliff edges include all eight directions only on the high side", () => {
  const grid = { "0,0": { elevation: 100 } };
  NEIGHBOR_OFFSETS.forEach(([x, y]) => {
    grid[`${x},${y}`] = {};
  });
  assert.deepEqual(getCliffEdges(grid, 0, 0), [0, 1, 2, 3, 4, 5, 6, 7]);
  NEIGHBOR_OFFSETS.forEach(([x, y]) => assert.deepEqual(getCliffEdges(grid, x, y), []));
});

test("missing neighbors do not create cliffs outside the saved grid", () => {
  assert.deepEqual(getCliffEdges({ "0,0": { elevation: 100 } }, 0, 0), []);
  assert.deepEqual(getCliffEdges({}, 0, 0), []);
});

test("bounded grids treat unpainted cells as one metre but exclude outside neighbors", () => {
  const grid = { "0,0": { elevation: 100 } };
  assert.deepEqual(getCliffEdges(grid, 0, 0, { maxX: 1, maxY: 0 }), [2]);
  assert.deepEqual(getCliffEdges(grid, -1, 0, { maxX: 1, maxY: 0 }), []);
});

test("water pairs cannot form cliffs but sea cliffs remain", () => {
  const water = [TERRAIN.WATER.id, TERRAIN.COASTAL_WATER.id, TERRAIN.OCEAN.id];
  water.forEach((terrain) => {
    water.forEach((neighborTerrain) => {
      assert.equal(getCliffDifference({ terrain, elevation: -4000 }, { terrain: neighborTerrain, elevation: -20 }), 0);
    });
    assert.equal(getCliffDifference({ terrain, elevation: -75 }, { elevation: 0 }), 75);
  });
});

test("the gradient is transparent only at one metre and clamps its endpoints", () => {
  assert.equal(getElevationColor(1), null);
  assert.equal(getElevationColor(0), "rgb(0, 100, 200)");
  assert.equal(getElevationColor(-4000), "rgb(0, 0, 90)");
  assert.equal(getElevationColor(-5000), getElevationColor(-4000));
  assert.equal(getElevationColor(1000), "rgb(220, 0, 0)");
  assert.equal(getElevationColor(5000), getElevationColor(1000));
  assert.notEqual(getElevationColor(100), getElevationColor(500));
});

test("invalid cells and grid coordinates are rejected", () => {
  [null, [], 2].forEach((cell) => assert.throws(() => getElevation(cell), TypeError));
  assert.throws(() => getCliffEdges(null, 0, 0), TypeError);
  assert.throws(() => getCliffEdges({}, 0.5, 0), TypeError);
});

test("elevation cue rejects invalid dimensions and colors", () => {
  assert.throws(() => drawElevationCue(null, 0, 0, 16, 16, "#000000"), TypeError);
  assert.throws(() => drawElevationCue({}, 0, 0, 0, 16, "#000000"), TypeError);
  assert.throws(() => drawElevationCue({}, 0, 0, 16, 16, null), TypeError);
});
