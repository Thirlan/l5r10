import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { CLIMATE, TERRAIN } from "../../docs/scripts/world/world-map-layers.js";
import { MapModel } from "../../docs/map/scripts/map-data.js";
import { DEFAULT_LAYER, SNOW_LAYER, TEXTURE_SETS, WATER_CLASS, cellSurface, layerIndex, packCellIds } from "../../docs/map/scripts/surface-layers.js";

const textureFolder = new URL("../../docs/map/textures/", import.meta.url);

test("all texture files of the catalog exist", () => {
  // Execution
  const files = TEXTURE_SETS.flatMap((set) => [set.diffuse, set.displacement, set.normal, set.roughness].filter(Boolean));

  // Assertion
  files.forEach((file) => assert.ok(existsSync(new URL(file, textureFolder)), file));
});

test("climate roles use the texture sets from the user mapping", () => {
  // Assertion
  assert.deepEqual(cellSurface(CLIMATE.TEMPERATE.id, TERRAIN.FLAT.id), { primary: layerIndex("grass_ground"), rock: layerIndex("marble_cliff_05"), snowLine: 0 });
  assert.equal(cellSurface(CLIMATE.TEMPERATE.id, TERRAIN.HILLS.id).primary, layerIndex("rocky_terrain_02"));
  assert.equal(cellSurface(CLIMATE.DESERT.id, TERRAIN.HILLS.id).primary, layerIndex("marble_cliff_02"));
  assert.equal(cellSurface(CLIMATE.WASTE.id, TERRAIN.CLIFF.id).primary, layerIndex("rock_boulder_dry"));
  assert.equal(cellSurface(CLIMATE.SHADOWLAND.id, TERRAIN.MOUNTAINS.id).primary, layerIndex("dark_rock"));
  assert.equal(cellSurface(CLIMATE.TROPICAL.id, TERRAIN.FLAT.id).primary, layerIndex("leafy_grass"));
});

test("roles without a texture set use the default layer", () => {
  // Assertion
  assert.equal(cellSurface(CLIMATE.POLAR.id, TERRAIN.FLAT.id).primary, DEFAULT_LAYER);
  assert.equal(cellSurface(CLIMATE.TROPICAL.id, TERRAIN.HILLS.id).primary, DEFAULT_LAYER);
  assert.equal(cellSurface(CLIMATE.TEMPERATE.id, TERRAIN.WETLANDS.id).primary, DEFAULT_LAYER);
  assert.equal(TEXTURE_SETS[DEFAULT_LAYER].name, "moon_dusted_01");
});

test("only temperate and polar mountains have a snow line", () => {
  // Execution
  const snowLines = Object.values(CLIMATE).map((climate) => cellSurface(climate.id, TERRAIN.MOUNTAINS.id).snowLine > 0);

  // Assertion
  assert.deepEqual(snowLines, [true, false, false, true, false, false]);
  assert.equal(cellSurface(CLIMATE.POLAR.id, TERRAIN.HILLS.id).snowLine, 0);
  assert.equal(TEXTURE_SETS[SNOW_LAYER].name, "snow_02");
});

test("the cell ID texture packs layers, snow line, and water class for each cell", () => {
  // Setup
  const grid = { "0,0": { terrain: TERRAIN.MOUNTAINS.id, climate: CLIMATE.POLAR.id }, "1,0": { terrain: TERRAIN.OCEAN.id } };
  const model = new MapModel(grid, { columns: 3, rows: 1 });

  // Execution
  const pixels = packCellIds(model);

  // Assertion
  assert.deepEqual([...pixels.subarray(0, 4)], [layerIndex("marble_rock_03"), layerIndex("marble_rock_03"), 120, WATER_CLASS.LAKE]);
  assert.equal(pixels[7], WATER_CLASS.OCEAN);
  assert.deepEqual([...pixels.subarray(8, 12)], [layerIndex("grass_ground"), layerIndex("marble_cliff_05"), 0, WATER_CLASS.LAKE]);
});
