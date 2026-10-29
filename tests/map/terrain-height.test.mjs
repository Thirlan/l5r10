import assert from "node:assert/strict";
import test from "node:test";
import { RIVER, TERRAIN } from "../../docs/scripts/world/world-map-layers.js";
import { MapModel } from "../../docs/map/scripts/map-data.js";
import { HeightField, RIVER_BED, SUBDIVISIONS, ridgedNoise, terrainShape } from "../../docs/map/scripts/terrain-height.js";

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

test("a saved cliff direction makes a steeper step than a plain edge", () => {
  // Setup
  const steepestStep = (grid) => {
    const field = new HeightField(new MapModel(grid, { columns: 2, rows: 1 }), { carveRivers: false });
    return Math.max(...Array.from({ length: field.width - 1 }, (_, column) => Math.abs(field.heightAt(column + 1, 2) - field.heightAt(column, 2))));
  };

  // Execution
  const cliff = steepestStep({ "0,0": { terrain: TERRAIN.CLIFF.id, "cliff direction": { 2: 1 } } });
  const slope = steepestStep({ "0,0": { terrain: TERRAIN.CLIFF.id } });

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
  const levels = Object.values(TERRAIN).map((terrain) => terrainShape(terrain.id).level);
  const noise = Array.from({ length: 200 }, (_, index) => ridgedNoise(index * 0.37, index * 0.11));

  // Assertion
  assert.ok(levels.every((level) => level > 0));
  assert.ok(noise.every((value) => value >= 0 && value <= 1));
  assert.throws(() => terrainShape(99), TypeError);
});
