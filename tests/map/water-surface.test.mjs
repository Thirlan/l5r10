import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { WATER_LEVEL, waterBumpPixels, waterVertexData, createWaterSurface } from "../../docs/map/scripts/water-surface.js";
import { HeightField } from "../../docs/map/scripts/terrain-height.js";
import { MapModel, createMapModel } from "../../docs/map/scripts/map-data.js";
import { TERRAIN, RIVER } from "../../docs/scripts/world/data/world-map-layers.js";
import { METERS_PER_TILE } from "../../docs/scripts/world/data/world-map-scale.js";

const SIZE = 32;
const pixelAt = (pixels, x, y) => [...pixels.subarray((y * SIZE + x) * 4, (y * SIZE + x) * 4 + 4)];

test("the water bump texture repeats without a seam", () => {
  // Execution
  const pixels = waterBumpPixels(SIZE);
  const wrapStepX = pixelAt(pixels, SIZE - 1, 5).map((value, channel) => Math.abs(value - pixelAt(pixels, 0, 5)[channel]));
  const innerStepX = pixelAt(pixels, 1, 5).map((value, channel) => Math.abs(value - pixelAt(pixels, 0, 5)[channel]));

  // Assertion
  assert.equal(pixels.length, SIZE * SIZE * 4);
  assert.ok(Math.max(...wrapStepX) <= Math.max(...innerStepX) * 3 + 2, `${wrapStepX} against ${innerStepX}`);
});

test("water bump normals point up and have unit length", () => {
  // Execution
  const pixels = waterBumpPixels(SIZE);
  const normals = Array.from({ length: SIZE * SIZE }, (_, pixel) => [...pixels.subarray(pixel * 4, pixel * 4 + 3)].map((value) => (value / 255) * 2 - 1));

  // Assertion
  normals.forEach((normal) => {
    assert.ok(normal[2] > 0.7);
    assert.ok(Math.abs(Math.hypot(...normal) - 1) < 0.02);
  });
  assert.throws(() => waterBumpPixels(2), TypeError);
});

test("the water level is just under the shoreline height", () => {
  // Assertion
  assert.ok(WATER_LEVEL < 0 && WATER_LEVEL > -0.05);
});

test("default land has no water triangles even when its depth collides with the old plane", () => {
  const near = 0.05,
    far = 1176;
  const depth = (distance) => Math.round((far / (far - near) - (far * near) / ((far - near) * distance)) * (2 ** 24 - 1));
  for (const distance of [100, 200, 300, 500]) {
    assert.equal(depth(distance - Math.cos(0.7) / METERS_PER_TILE), depth(distance - Math.cos(0.7) * WATER_LEVEL));
  }
  const field = new HeightField(new MapModel({}, { columns: 2, rows: 2 }));
  const data = waterVertexData(field);
  assert.equal(data.positions.length, 0);
  assert.equal(data.indices.length, 0);
  assert.throws(() => waterVertexData({}), /HeightField/);
});

test("fully submerged cells use one upward-facing quad each", () => {
  const field = new HeightField(new MapModel({ "0,0": { terrain: TERRAIN.OCEAN.id, elevation: -100 } }, { columns: 1, rows: 1 }));
  const data = waterVertexData(field);
  assert.equal(data.positions.length, 12);
  assert.equal(data.indices.length, 6);
  assert.equal(data.uvs.length, 8);
  assert.deepEqual([...data.normals], [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]);
  const [first, second, third] = [...data.indices.slice(0, 3)].map((index) => data.positions.slice(index * 3, index * 3 + 3));
  const normalY = (second[2] - first[2]) * (third[0] - first[0]) - (second[0] - first[0]) * (third[2] - first[2]);
  // Babylon uses clockwise faces in its default left-handed scene.
  assert.ok(normalY < 0);
});

test("shore and river water polygons cover only submerged terrain", () => {
  const grid = {
    "0,0": { terrain: TERRAIN.MOUNTAINS.id, elevation: 100, river: RIVER.PRESENT.id, "river direction": { 2: 1 } },
    "1,0": { terrain: TERRAIN.WATER.id },
    "2,0": {},
  };
  const field = new HeightField(new MapModel(grid, { columns: 3, rows: 1 }));
  const data = waterVertexData(field);
  assert.ok(data.indices.length > 6);
  for (let index = 0; index < data.indices.length; index += 3) {
    const vertices = [...data.indices.slice(index, index + 3)].map((vertex) => [data.positions[vertex * 3], field.model.rows - data.positions[vertex * 3 + 2]]);
    const center = vertices.reduce(([x, y], point) => [x + point[0] / 3, y + point[1] / 3], [0, 0]);
    assert.ok(field.sample(...center) <= WATER_LEVEL + 1e-8);
  }
});

test("both water materials use the clipped surface mesh", async (context) => {
  const babylon = await import("@babylonjs/core");
  const { WaterMaterial } = await import("@babylonjs/materials/water/waterMaterial.js");
  const previous = Object.getOwnPropertyDescriptor(globalThis, "BABYLON");
  const previousName = Object.getOwnPropertyDescriptor(globalThis, "name");
  globalThis.BABYLON = { ...babylon, WaterMaterial };
  // WaterMaterial reads the browser's window.name when it makes render targets.
  globalThis.name = "";
  const engine = new babylon.NullEngine();
  const scene = new babylon.Scene(engine);
  context.after(() => {
    engine.dispose();
    if (previous) Object.defineProperty(globalThis, "BABYLON", previous);
    else delete globalThis.BABYLON;
    if (previousName) Object.defineProperty(globalThis, "name", previousName);
    else delete globalThis.name;
  });

  const field = new HeightField(new MapModel({ "0,0": { terrain: TERRAIN.OCEAN.id } }, { columns: 2, rows: 1 }));
  const expected = waterVertexData(field);
  for (const simple of [true, false]) {
    const mesh = createWaterSurface(scene, field, [], { simple });
    assert.deepEqual([...mesh.getVerticesData("position")], [...expected.positions]);
    assert.equal(mesh.position.y, WATER_LEVEL);
    assert.equal(mesh.material.getClassName(), simple ? "StandardMaterial" : "WaterMaterial");
  }
});

test("live-map water stays submerged after Float32 shoreline rounding", () => {
  const saved = JSON.parse(readFileSync(new URL("../../docs/data/world-map-grid.json", import.meta.url)));
  const field = new HeightField(createMapModel(saved));
  const data = waterVertexData(field);
  let dryCenters = 0;
  for (let index = 0; index < data.indices.length; index += 3) {
    const center = [...data.indices.subarray(index, index + 3)].reduce(([x, y], vertex) => [x + data.positions[vertex * 3] / 3, y + (field.model.rows - data.positions[vertex * 3 + 2]) / 3], [0, 0]);
    if (field.sample(...center) > WATER_LEVEL + 1e-8) dryCenters++;
  }
  assert.ok(data.indices.length > 0);
  assert.equal(dryCenters, 0);
});
