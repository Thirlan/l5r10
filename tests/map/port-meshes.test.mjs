import assert from "node:assert/strict";
import test from "node:test";
import { INFRASTRUCTURE, TERRAIN } from "../../docs/scripts/world/world-map-layers.js";
import { MapModel } from "../../docs/map/scripts/map-data.js";
import { PORT_SCALES, portPlacements } from "../../docs/map/scripts/port-meshes.js";
import { BRIDGE_DECK } from "../../docs/map/scripts/road-paths.js";
import { HeightField } from "../../docs/map/scripts/terrain-height.js";

/** A small port at (1, 1) with water to the east, and a large port at (4, 4) with water to the south. */
function portModel() {
  const grid = {
    "1,1": { infrastructure: INFRASTRUCTURE.SMALL_PORT.id },
    "2,1": { terrain: TERRAIN.WATER.id },
    "4,4": { infrastructure: INFRASTRUCTURE.LARGE_PORT.id },
    "4,5": { terrain: TERRAIN.COASTAL_WATER.id },
    "0,4": { infrastructure: INFRASTRUCTURE.ROAD.id },
  };
  return new MapModel(grid, { columns: 6, rows: 6 });
}

test("each port gets one dock that points to its water neighbor", () => {
  // Setup
  const field = new HeightField(portModel());

  // Execution
  const [small, large] = portPlacements(field, 3);

  // Assertion
  assert.equal(portPlacements(field, 3).length, 2);
  assert.equal(small.kind, INFRASTRUCTURE.SMALL_PORT.id);
  assert.equal(small.yaw, 0);
  assert.ok(small.x > 1.5 && small.y === 1.5);
  assert.equal(large.kind, INFRASTRUCTURE.LARGE_PORT.id);
  assert.equal(large.yaw, Math.PI / 2);
  assert.ok(large.y > 4.5 && large.x === 4.5);
  assert.equal(large.scale, PORT_SCALES.get(INFRASTRUCTURE.LARGE_PORT.id));
});

test("a dock stays above the bridge deck and joins the chunk of its port cell", () => {
  // Setup
  const field = new HeightField(portModel());

  // Execution
  const ports = portPlacements(field, 3);

  // Assertion
  assert.ok(ports.every((port) => port.height > BRIDGE_DECK && port.height > field.sample(port.x, port.y)));
  assert.deepEqual(
    ports.map((port) => port.chunk),
    [0, 3],
  );
  assert.throws(() => portPlacements(portModel(), 3), TypeError);
});

test("a port without a water neighbor keeps its dock at the cell center", () => {
  // Setup
  const field = new HeightField(new MapModel({ "1,1": { infrastructure: INFRASTRUCTURE.SMALL_PORT.id } }, { columns: 3, rows: 3 }));

  // Execution
  const [port] = portPlacements(field, 3);

  // Assertion
  assert.deepEqual([port.x, port.y, port.yaw], [1.5, 1.5, 0]);
});
