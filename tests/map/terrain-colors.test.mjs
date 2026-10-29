import assert from "node:assert/strict";
import test from "node:test";
import { CLIMATE, RIVER, TERRAIN } from "../../docs/scripts/world/world-map-layers.js";
import { MapModel } from "../../docs/map/scripts/map-data.js";
import { hexToRgb, terrainVertexColors } from "../../docs/map/scripts/terrain-colors.js";
import { HeightField, SUBDIVISIONS } from "../../docs/map/scripts/terrain-height.js";

const PALETTE = {
  climate: new Map(Object.values(CLIMATE).map((climate) => [climate.id, [0.1, 0.5, 0.2]])),
  water: new Map([
    [TERRAIN.WATER.id, [0, 0, 1]],
    [TERRAIN.COASTAL_WATER.id, [0, 0, 0.5]],
    [TERRAIN.OCEAN.id, [0, 0, 0.25]],
  ]),
};

test("hex colors become RGB values from 0 to 1", () => {
  // Assertion
  assert.deepEqual(hexToRgb("#FF0033"), [1, 0, 0.2]);
  assert.throws(() => hexToRgb("red"), TypeError);
});

test("water cells use their water color and river channels use the water color", () => {
  // Setup
  const grid = { "0,0": { terrain: TERRAIN.OCEAN.id }, "1,0": { river: RIVER.PRESENT.id, "river direction": {} } };
  const field = new HeightField(new MapModel(grid, { columns: 2, rows: 1 }));
  const colorAt = (colors, column, row) => [...colors.subarray((row * field.width + column) * 4, (row * field.width + column) * 4 + 3)];

  // Execution
  const colors = terrainVertexColors(field, PALETTE);

  // Assertion
  assert.deepEqual(colorAt(colors, SUBDIVISIONS / 2, SUBDIVISIONS / 2), [0, 0, 0.25]);
  assert.deepEqual(colorAt(colors, SUBDIVISIONS * 1.5, SUBDIVISIONS / 2), [0, 0, 1]);
});
