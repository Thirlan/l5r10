import assert from "node:assert/strict";
import test from "node:test";
import { RIVER, TERRAIN } from "../../docs/scripts/world/world-map-layers.js";
import { MapModel } from "../../docs/map/scripts/map-data.js";
import { buildRiverSegments, isRiverConnected } from "../../docs/map/scripts/river-paths.js";

const river = (flags) => ({ river: RIVER.PRESENT.id, "river direction": flags });

test("two connected river cells make half segments that meet on the shared edge", () => {
  // Setup
  const model = new MapModel({ "0,0": river({ 2: 1 }), "1,0": river({}) }, { columns: 2, rows: 1 });

  // Execution
  const segments = buildRiverSegments(model);

  // Assertion
  assert.deepEqual(segments, [
    [0.5, 0.5, 1, 0.5],
    [1.5, 0.5, 1, 0.5],
  ]);
});

test("a river mouth goes on to the center of the cardinal water cell", () => {
  // Setup
  const model = new MapModel({ "0,0": river({}), "0,1": { terrain: TERRAIN.WATER.id } }, { columns: 1, rows: 2 });

  // Execution
  const segments = buildRiverSegments(model);

  // Assertion
  assert.deepEqual(segments, [[0.5, 0.5, 0.5, 1.5]]);
});

test("river cells connect only with a saved flag on either side", () => {
  // Setup
  const model = new MapModel({ "0,0": river({}), "1,0": river({}), "1,1": river({ 7: 1 }) }, { columns: 2, rows: 2 });

  // Execution
  const eastward = isRiverConnected(model, 0, 0, 2);
  const diagonal = isRiverConnected(model, 0, 0, 3);

  // Assertion
  assert.equal(eastward, false);
  assert.equal(diagonal, true);
});
