import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { RIVER, TERRAIN } from "../../docs/scripts/world/data/world-map-layers.js";
import { MapModel, createMapModel } from "../../docs/map/scripts/map-data.js";
import { HeightField, RIVER_BED, RIVER_SEAL, SUBDIVISIONS, ridgedNoise, terrainShape } from "../../docs/map/scripts/terrain-height.js";
import { createMapHeader } from "../../docs/scripts/world/data/world-map-file.js";
import { METERS_PER_TILE } from "../../docs/scripts/world/data/world-map-data.config.js";

const river = (flags) => ({ river: RIVER.PRESENT.id, "river direction": flags });

test("the shoreline is at height 0 on the edge between land and water", () => {
  // Setup
  const model = new MapModel({ "1,0": { terrain: TERRAIN.OCEAN.id } }, { columns: 2, rows: 1 });

  // Execution
  const field = new HeightField(model, { carveRivers: false });

  // Assertion
  assert.equal(field.heightAt(SUBDIVISIONS, SUBDIVISIONS / 2), 0);
  assert.ok(field.heightAt(SUBDIVISIONS / 2, SUBDIVISIONS / 2) > 0);
  assert.ok(field.heightAt(SUBDIVISIONS * 1.5, SUBDIVISIONS / 2) < 0);
});

test("the 75 metre threshold makes a steeper step than a lower elevation change", () => {
  // Setup
  const steepestStep = (grid) => {
    const field = new HeightField(new MapModel(grid, { columns: 2, rows: 1 }), { carveRivers: false });
    return Math.max(...Array.from({ length: field.width - 1 }, (_, column) => Math.abs(field.heightAt(column + 1, 2) - field.heightAt(column, 2))));
  };

  // Execution
  const cliff = steepestStep({ "0,0": { elevation: 76 } });
  const slope = steepestStep({ "0,0": { elevation: 75 } });

  // Assertion
  assert.ok(cliff > slope * 1.5, `${cliff} should be steeper than ${slope}`);
});

test("a river channel stays below the water plane from center to center", () => {
  // Setup
  const model = new MapModel({ "0,0": river({ 2: 1 }), "1,0": river({ 2: 1 }), "2,0": river({}) }, { columns: 3, rows: 1 });

  // Execution
  const field = new HeightField(model);
  const along = Array.from({ length: 2 * SUBDIVISIONS + 1 }, (_, step) => field.heightAt(SUBDIVISIONS / 2 + step, SUBDIVISIONS / 2));

  // Assertion
  along.forEach((height) => assert.ok(height <= RIVER_BED + 1e-6, `height ${height}`));
});

test("the seal pass keeps a river mouth on a steep mountain below the water plane", () => {
  // Setup: the noise uses absolute lattice positions, so the cells keep their saved map positions.
  const grid = Object.fromEntries([24, 25, 26].flatMap((y) => [64, 65, 66].map((x) => [`${x},${y}`, { terrain: TERRAIN.MOUNTAINS.id }])));
  grid["65,25"] = { terrain: TERRAIN.MOUNTAINS.id, ...river({ 5: 1 }) };
  grid["64,26"] = { terrain: TERRAIN.WATER.id };

  // Execution
  const field = new HeightField(new MapModel(grid, { columns: 67, rows: 27 }));
  const [[startX, startY, endX, endY]] = field.riverSegments;
  const along = Array.from({ length: 41 }, (_, step) => field.sample(startX + ((endX - startX) * step) / 40, startY + ((endY - startY) * step) / 40));

  // Assertion
  assert.equal(field.riverSegments.length, 1);
  along.forEach((height) => assert.ok(height <= RIVER_SEAL, `height ${height}`));
});

test("every river path of the live map stays below the water plane", () => {
  // Setup
  const field = new HeightField(createMapModel(JSON.parse(fs.readFileSync(new URL("../../docs/data/world-map-grid.json", import.meta.url)))));

  // Execution
  const highest = field.riverSegments.reduce((worst, [startX, startY, endX, endY]) => {
    const steps = Math.ceil(Math.hypot(endX - startX, endY - startY) * 32);
    const heights = Array.from({ length: steps + 1 }, (_, step) => field.sample(startX + ((endX - startX) * step) / steps, startY + ((endY - startY) * step) / steps));
    return Math.max(worst, ...heights);
  }, -Infinity);

  // Assertion
  assert.ok(field.riverSegments.length > 0);
  assert.ok(highest <= RIVER_SEAL, `highest river height ${highest}`);
});

test("normals have unit length", () => {
  // Setup
  const model = new MapModel({ "1,1": { terrain: TERRAIN.MOUNTAINS.id }, "0,0": { terrain: TERRAIN.OCEAN.id } }, { columns: 3, rows: 3 });

  // Execution
  const field = new HeightField(model);
  const lengths = Array.from({ length: field.heights.length }, (_, index) => Math.hypot(...field.normals.subarray(index * 3, index * 3 + 3)));

  // Assertion
  lengths.forEach((length) => assert.ok(Math.abs(length - 1) < 1e-5));
});

test("the surface sample equals the lattice height on lattice points", () => {
  // Setup
  const field = new HeightField(new MapModel({ "1,0": { terrain: TERRAIN.HILLS.id } }, { columns: 2, rows: 2 }));

  // Execution
  const sampled = field.sample(5 / SUBDIVISIONS, 3 / SUBDIVISIONS);

  // Assertion
  assert.ok(Math.abs(sampled - field.heightAt(5, 3)) < 1e-5);
});

test("terrain shapes exist for every terrain and noise stays from 0 to 1", () => {
  // Execution
  const roughness = Object.values(TERRAIN).map((terrain) => terrainShape(terrain.id).roughness);
  const noise = Array.from({ length: 200 }, (_, index) => ridgedNoise(index * 0.37, index * 0.11));

  // Assertion
  assert.ok(roughness.every((value) => value >= 0));
  assert.ok(noise.every((value) => value >= 0 && value <= 1));
  assert.throws(() => terrainShape(99), TypeError);
});

test("saved elevations use physical scale rather than terrain height presets", () => {
  const fieldFor = (elevation) => new HeightField(new MapModel({ "0,0": { elevation } }, { columns: 1, rows: 1 }), { carveRivers: false });
  const rise = fieldFor(101).sample(0.5, 0.5) - fieldFor(1).sample(0.5, 0.5);
  assert.ok(Math.abs(rise * METERS_PER_TILE - 100) < 0.0001);
  assert.equal(fieldFor(0).sample(0.5, 0.5), 0);
  assert.ok(Math.abs(fieldFor(-100).sample(0.5, 0.5) * METERS_PER_TILE + 100) < 0.0001);
});

test("underwater height changes stay smooth even when deeper than a cliff", () => {
  const field = new HeightField(
    new MapModel(
      {
        "0,0": { terrain: TERRAIN.COASTAL_WATER.id, elevation: -20 },
        "1,0": { terrain: TERRAIN.OCEAN.id, elevation: -1020 },
      },
      { columns: 2, rows: 1 },
    ),
    { carveRivers: false },
  );
  const changes = Array.from({ length: field.width - 1 }, (_, column) => Math.abs(field.heightAt(column + 1, 2) - field.heightAt(column, 2)) * METERS_PER_TILE);
  assert.ok(Math.max(...changes) < 500);
});

function reliefField(terrain, elevation = 100, seed = 846894882) {
  const size = { columns: 32, rows: 32 };
  const grid = Object.fromEntries(Array.from({ length: size.columns * size.rows }, (_, index) => [`${index % size.columns},${Math.floor(index / size.columns)}`, { terrain, elevation }]));
  return new HeightField(new MapModel(grid, size, { ...createMapHeader(size), seed }), { carveRivers: false });
}

[
  [TERRAIN.HILLS.id, 600],
  [TERRAIN.MOUNTAINS.id, 8000],
].forEach(([terrain, maximum]) => {
  test(`terrain ${terrain} adds seeded relief up to ${maximum} metres above saved elevation`, () => {
    const field = reliefField(terrain);
    const metres = Array.from(field.heights, (height) => height * METERS_PER_TILE - 100);
    assert.ok(Math.min(...metres) >= -0.001);
    assert.ok(Math.max(...metres) <= maximum + 0.001);
    assert.ok(Math.max(...metres) > maximum * 0.95);
    const higher = reliefField(terrain, 200);
    field.heights.forEach((height, index) => assert.ok(Math.abs((higher.heights[index] - height) * METERS_PER_TILE - 100) < 0.002));
    assert.deepEqual(field.heights, reliefField(terrain).heights);
    assert.notDeepEqual(field.heights, reliefField(terrain, 100, 846894883).heights);
  });
});

test("relief respects mixed-terrain boundaries without entering water or exceeding the hill cap", () => {
  const grid = {
    "0,0": { terrain: TERRAIN.MOUNTAINS.id, elevation: 100 },
    "1,0": { terrain: TERRAIN.HILLS.id, elevation: 100 },
    "2,0": { terrain: TERRAIN.COASTAL_WATER.id, elevation: -20 },
  };
  const field = new HeightField(new MapModel(grid, { columns: 3, rows: 1 }), { carveRivers: false });
  for (let row = 0; row < field.depth; row++) {
    assert.ok(Math.abs(field.heightAt(SUBDIVISIONS, row) * METERS_PER_TILE - 100) < 0.001);
    for (let column = SUBDIVISIONS; column < SUBDIVISIONS * 2; column++) {
      assert.ok(field.heightAt(column, row) * METERS_PER_TILE <= 700.001);
    }
    assert.ok(Math.abs(field.heightAt(SUBDIVISIONS * 2, row) * METERS_PER_TILE - 100) < 0.001);
    assert.ok(field.heightAt(SUBDIVISIONS * 2.5, row) < 0);
  }
});

test("terrain noise rejects invalid seeds and distinguishes high seed bits", () => {
  assert.throws(() => ridgedNoise(0, 0, 1.5), /integer seed/);
  assert.throws(() => ridgedNoise(Infinity, 0, 1), /finite coordinates/);
  assert.notEqual(ridgedNoise(1.2, 2.3, 1), ridgedNoise(1.2, 2.3, 4294967297));
});
