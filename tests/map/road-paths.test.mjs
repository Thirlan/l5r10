import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { INFRASTRUCTURE, RIVER, TERRAIN } from "../../docs/scripts/world/world-map-layers.js";
import { MapModel, createMapModel } from "../../docs/map/scripts/map-data.js";
import { BRIDGE_DECK, ROAD_STYLES, addRibbon, buildRoadGeometry, buildRoadSegments, roadBase, roadJunctions } from "../../docs/map/scripts/road-paths.js";
import { HeightField } from "../../docs/map/scripts/terrain-height.js";

const ROAD = INFRASTRUCTURE.ROAD.id;
const FOOTPATH = INFRASTRUCTURE.FOOTPATH.id;

function roadModel() {
  const grid = {
    "0,1": { infrastructure: ROAD },
    "1,1": { infrastructure: ROAD },
    "2,1": { infrastructure: FOOTPATH },
    "1,2": { infrastructure: ROAD },
    "2,0": { infrastructure: INFRASTRUCTURE.SMALL_PORT.id },
  };
  return new MapModel(grid, { columns: 4, rows: 4 });
}

const link = (segment) => `${segment.startX - 0.5},${segment.startY - 0.5}>${segment.endX - 0.5},${segment.endY - 0.5}`;

function triangles(target) {
  return Array.from({ length: target.indices.length / 3 }, (_, triangle) => [0, 1, 2].map((corner) => target.indices[triangle * 3 + corner]).map((vertex) => [...target.positions.slice(vertex * 3, vertex * 3 + 3)]));
}

const SAMPLE_WEIGHTS = [
  [1 / 3, 1 / 3, 1 / 3],
  [0.5, 0.5, 0],
  [0, 0.5, 0.5],
  [0.5, 0, 0.5],
];

function lowestClearance(field, target) {
  return triangles(target).reduce(
    (lowest, corners) =>
      SAMPLE_WEIGHTS.reduce((low, weights) => {
        const [x, y, z] = [0, 1, 2].map((axis) => corners.reduce((sum, corner, index) => sum + corner[axis] * weights[index], 0));
        return Math.min(low, y - roadBase(field, x, field.model.rows - z));
      }, lowest),
    Infinity,
  );
}

test("road links follow the forward links of the 2D infrastructure layer", () => {
  // Setup
  const model = roadModel();

  // Execution
  const links = buildRoadSegments(model).map(link).sort();

  // Assertion
  assert.deepEqual(links, ["0,1>1,1", "0,1>1,2", "1,1>1,2", "1,1>2,0", "1,1>2,1", "1,2>2,1"].sort());
  assert.throws(() => buildRoadSegments({}), TypeError);
});

test("a link uses the kind of its start cell, and a port junction uses the kind of its link", () => {
  // Setup
  const model = roadModel();
  const segments = buildRoadSegments(model);

  // Execution
  const junctions = roadJunctions(model, segments);
  const kindAt = (x, y) => junctions.filter((junction) => junction.x === x + 0.5 && junction.y === y + 0.5).map((junction) => junction.kind);

  // Assertion
  assert.ok(segments.every((segment) => segment.kind === model.valueAt("infrastructure", segment.startX - 0.5, segment.startY - 0.5).id));
  assert.deepEqual(kindAt(2, 1), [FOOTPATH]);
  assert.deepEqual(kindAt(2, 0), [ROAD]);
});

test("a ribbon over a river channel stays on the bridge deck and above the surface", () => {
  // Setup
  const grid = { "1,0": { terrain: TERRAIN.MOUNTAINS.id }, "1,1": { river: RIVER.PRESENT.id, "river direction": { 4: 1 } }, "1,2": { river: RIVER.PRESENT.id, "river direction": {} } };
  const field = new HeightField(new MapModel(grid, { columns: 3, rows: 3 }));
  const target = { positions: [], uvs: [], indices: [] };
  const style = ROAD_STYLES.get(ROAD);

  // Execution
  addRibbon(target, field, { startX: 0.5, startY: 1.5, endX: 2.5, endY: 1.5 }, style);
  const clearance = lowestClearance(field, target);

  // Assertion
  assert.ok(field.sample(1.5, 1.5) < 0);
  assert.ok(clearance > 0, `lowest clearance ${clearance}`);
  assert.ok(Math.min(...target.positions.filter((_, index) => index % 3 === 1)) >= BRIDGE_DECK + style.lift);
});

test("road triangles face up", () => {
  // Setup
  const field = new HeightField(roadModel());

  // Execution
  const groups = [...buildRoadGeometry(field, 2).values()];
  const normalHeights = groups.flatMap((group) =>
    triangles(group).map(([first, second, third]) => {
      const [edgeX, edgeZ] = [second[0] - first[0], second[2] - first[2]];
      const [otherX, otherZ] = [third[0] - first[0], third[2] - first[2]];
      return edgeX * otherZ - edgeZ * otherX;
    }),
  );

  // Assertion
  assert.ok(normalHeights.length > 0);
  assert.ok(normalHeights.every((turn) => turn > 0));
});

test("road geometry joins the chunk of the link midpoint and the junction cell", () => {
  // Setup
  const field = new HeightField(roadModel());

  // Execution
  const groups = buildRoadGeometry(field, 2);

  // Assertion
  assert.deepEqual([...groups.keys()].sort(), [`0:${ROAD}`, `1:${FOOTPATH}`, `1:${ROAD}`, `2:${ROAD}`, `3:${ROAD}`].sort());
  [...groups.values()].forEach((group) => assert.equal(group.uvs.length / 2, group.positions.length / 3));
});

test("every road triangle of the live map stays above the surface", () => {
  // Setup
  const field = new HeightField(createMapModel(JSON.parse(fs.readFileSync(new URL("../../docs/data/world-map-grid.json", import.meta.url)))));

  // Execution
  const groups = [...buildRoadGeometry(field, 32).values()];
  const clearance = Math.min(...groups.map((group) => lowestClearance(field, group)));

  // Assertion
  assert.equal(groups.length, 42);
  assert.ok(clearance > 0.015, `lowest clearance ${clearance}`);
});
