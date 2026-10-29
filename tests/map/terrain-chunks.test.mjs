import assert from "node:assert/strict";
import test from "node:test";
import { CLIMATE, RIVER, TERRAIN } from "../../docs/scripts/world/world-map-layers.js";
import { MapModel } from "../../docs/map/scripts/map-data.js";
import { chunkRanges, chunkVertexData } from "../../docs/map/scripts/terrain-chunks.js";
import { HeightField } from "../../docs/map/scripts/terrain-height.js";

function mixedField() {
  const grid = {
    "0,0": { terrain: TERRAIN.MOUNTAINS.id },
    "1,1": { terrain: TERRAIN.CLIFF.id, "cliff direction": { 2: 1 } },
    "2,1": { terrain: TERRAIN.COASTAL_WATER.id },
    "1,2": { river: RIVER.PRESENT.id, "river direction": { 4: 1 }, climate: CLIMATE.DESERT.id },
    "1,3": { river: RIVER.PRESENT.id, "river direction": {} },
    "3,3": { terrain: TERRAIN.HILLS.id },
  };
  return new HeightField(new MapModel(grid, { columns: 4, rows: 4 }));
}

function vertex(data, index) {
  return [...data.positions.subarray(index * 3, index * 3 + 3), ...data.normals.subarray(index * 3, index * 3 + 3)];
}

test("chunk ranges cover the full map once", () => {
  // Execution
  const ranges = chunkRanges(135, 196, 32);
  const area = ranges.reduce((sum, range) => sum + (range.endX - range.startX) * (range.endY - range.startY), 0);

  // Assertion
  assert.equal(ranges.length, 35);
  assert.equal(area, 135 * 196);
  assert.deepEqual([ranges.at(-1).endX, ranges.at(-1).endY], [135, 196]);
});

test("adjacent chunks have equal positions and normals on the east-west seam", () => {
  // Setup
  const field = mixedField();
  const [west, east] = chunkRanges(4, 4, 2);
  const columns = 2 * field.subdivisions + 1;

  // Execution
  const westData = chunkVertexData(field, west);
  const eastData = chunkVertexData(field, east);

  // Assertion
  Array.from({ length: columns }).forEach((_, row) => assert.deepEqual(vertex(westData, row * columns + columns - 1), vertex(eastData, row * columns)));
});

test("adjacent chunks have equal positions and normals on the north-south seam", () => {
  // Setup
  const field = mixedField();
  const [north, , south] = chunkRanges(4, 4, 2);
  const columns = 2 * field.subdivisions + 1;

  // Execution
  const northData = chunkVertexData(field, north);
  const southData = chunkVertexData(field, south);

  // Assertion
  Array.from({ length: columns }).forEach((_, column) => assert.deepEqual(vertex(northData, (columns - 1) * columns + column), vertex(southData, column)));
});

test("chunk indices make two triangles for each lattice quad", () => {
  // Setup
  const field = mixedField();

  // Execution
  const data = chunkVertexData(field, chunkRanges(4, 4, 4)[0]);
  const vertexCount = data.positions.length / 3;

  // Assertion
  assert.equal(data.indices.length, (4 * field.subdivisions) ** 2 * 6);
  assert.ok(data.indices.every((index) => index < vertexCount));
});
