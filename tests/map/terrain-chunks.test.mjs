import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { CLIMATE, RIVER, TERRAIN } from "../../docs/scripts/world/world-map-layers.js";
import { MapModel, createMapModel } from "../../docs/map/scripts/map-data.js";
import { chunkIndexAt, chunkRanges, chunkVertexData } from "../../docs/map/scripts/terrain-chunks.js";
import { HeightField, RIVER_SEAL } from "../../docs/map/scripts/terrain-height.js";

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

test("chunkIndexAt gives the index of the chunk range that holds the position", () => {
  // Setup
  const ranges = chunkRanges(135, 196, 32);
  const points = [
    [0, 0],
    [31.9, 0.5],
    [32, 0.5],
    [134.5, 195.5],
    [70.2, 100.7],
  ];

  // Execution
  const owners = points.map(([x, y]) => ranges[chunkIndexAt(135, 32, x, y)]);

  // Assertion
  owners.forEach((range, index) => {
    const [x, y] = points[index];
    assert.ok(x >= range.startX && x < range.endX && y >= range.startY && y < range.endY, `${points[index]}`);
  });
  assert.throws(() => chunkIndexAt(135, 0, 1, 1), TypeError);
});

test("river channels stay carved and equal in both chunks where they cross a chunk border", () => {
  // Setup
  const field = new HeightField(createMapModel(JSON.parse(fs.readFileSync(new URL("../../docs/data/world-map-grid.json", import.meta.url)))));
  const chunkCells = 32;
  const ranges = chunkRanges(135, 196, chunkCells);
  const scale = field.subdivisions;
  const crossings = field.riverSegments.flatMap(([startX, startY, endX, endY]) =>
    [
      [startX, endX, startY, endY, "x"],
      [startY, endY, startX, endX, "y"],
    ].flatMap(([from, to, otherFrom, otherTo, axis]) => {
      const border = Math.ceil(Math.min(from, to) / chunkCells) * chunkCells;
      if (border <= Math.min(from, to) || border >= Math.max(from, to)) return [];
      const other = otherFrom + ((otherTo - otherFrom) * (border - from)) / (to - from);
      return [axis === "x" ? { x: border, y: other, axis } : { x: other, y: border, axis }];
    }),
  );

  // Execution
  const borderHeight = (range, crossing) => {
    const data = chunkVertexData(field, range);
    const columns = (range.endX - range.startX) * scale + 1;
    const along = (crossing.axis === "x" ? crossing.y - range.startY : crossing.x - range.startX) * scale;
    const across = (crossing.axis === "x" ? crossing.x - range.startX : crossing.y - range.startY) * scale;
    const first = Math.floor(along);
    const vertexAt = (step) => (crossing.axis === "x" ? step * columns + across : across * columns + step);
    const heightAt = (step) => data.positions[vertexAt(step) * 3 + 1];
    return heightAt(first) + (heightAt(first + 1) - heightAt(first)) * (along - first);
  };
  const results = crossings.map((crossing) => {
    const before = ranges[chunkIndexAt(135, chunkCells, crossing.x - (crossing.axis === "x" ? 0.5 : 0), crossing.y - (crossing.axis === "y" ? 0.5 : 0))];
    const after = ranges[chunkIndexAt(135, chunkCells, crossing.x, crossing.y)];
    return [borderHeight(before, crossing), borderHeight(after, crossing)];
  });

  // Assertion
  assert.ok(crossings.length > 0);
  results.forEach(([before, after]) => {
    assert.equal(before, after);
    assert.ok(before <= RIVER_SEAL, `height ${before}`);
  });
});
