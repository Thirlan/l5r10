import assert from "node:assert/strict";
import test from "node:test";
import { CLAN, RESOURCE, SETTLEMENT, TERRAIN } from "../../docs/scripts/world/world-map-layers.js";
import { MapModel } from "../../docs/map/scripts/map-data.js";
import { ICON_PIXELS, MARKER_STYLES, iconAtlasLayout, markerGeometry, resourceMarkers, settlementMarkers } from "../../docs/map/scripts/marker-layout.js";
import { BRIDGE_DECK } from "../../docs/map/scripts/road-paths.js";
import { HeightField } from "../../docs/map/scripts/terrain-height.js";
import { chunkIndexAt } from "../../docs/map/scripts/terrain-chunks.js";

/** Two Crab villages, one neutral castle on water, and one resource, on a 6 × 6 grid. */
function markerModel() {
  const grid = {
    "0,0": { settlement: SETTLEMENT.VILLAGE.id, clan: CLAN.CRAB.id },
    "1,4": { settlement: SETTLEMENT.VILLAGE.id, clan: CLAN.CRAB.id },
    "4,4": { settlement: SETTLEMENT.CASTLE.id, terrain: TERRAIN.WATER.id },
    "5,1": { resource: RESOURCE.IRON_MINE.id },
  };
  return new MapModel(grid, { columns: 6, rows: 6 });
}

test("markers share one atlas cell for each settlement type, clan, and resource type", () => {
  // Setup
  const model = markerModel();
  const markers = [...settlementMarkers(model), ...resourceMarkers(model)];

  // Execution
  const layout = iconAtlasLayout(markers.map((marker) => marker.key));

  // Assertion
  assert.equal(markers.length, 4);
  assert.equal(layout.rects.size, 3);
  assert.equal(layout.width, 16 * ICON_PIXELS);
  assert.equal(layout.height, ICON_PIXELS);
  assert.ok(markers.every((marker) => layout.rects.has(marker.key)));
  assert.equal(settlementMarkers(model)[2].clan, CLAN.NONE);
});

test("atlas cells stay inside the texture and count V from the bottom", () => {
  // Setup
  const keys = Array.from({ length: 40 }, (_, index) => `key:${index}`);

  // Execution
  const layout = iconAtlasLayout(keys);
  const first = layout.rects.get("key:0");
  const last = layout.rects.get("key:39");

  // Assertion
  assert.equal(layout.height, 4 * ICON_PIXELS);
  assert.ok([...layout.rects.values()].every((rect) => [rect.u0, rect.v0, rect.u1, rect.v1].every((value) => value >= 0 && value <= 1)));
  assert.deepEqual([first.left, first.top, first.v1, first.v0], [0, 0, 1, 0.75]);
  assert.deepEqual([last.left, last.top, last.v1, last.v0], [7 * ICON_PIXELS, 2 * ICON_PIXELS, 0.5, 0.25]);
  assert.throws(() => iconAtlasLayout("key"), TypeError);
});

test("each marker is one quad in the chunk of its cell", () => {
  // Setup
  const model = markerModel();
  const field = new HeightField(model);
  const markers = settlementMarkers(model);
  const layout = iconAtlasLayout(markers.map((marker) => marker.key));

  // Execution
  const groups = markerGeometry(field, markers, layout, MARKER_STYLES.get("settlements"), 3);

  // Assertion
  assert.deepEqual([...groups.keys()], [0, 2, 3]);
  assert.deepEqual(
    [...groups.values()].map((group) => group.chunk),
    markers.map((marker) => chunkIndexAt(6, 3, marker.x + 0.5, marker.y + 0.5)),
  );
  [...groups.values()].forEach((group) => {
    assert.equal(group.positions.length, group.count * 12);
    assert.equal(group.uvs.length, group.count * 8);
    assert.equal(group.corners.length, group.count * 8);
    assert.equal(group.shapes.length, group.count * 8);
    assert.deepEqual(group.indices, [0, 2, 1, 0, 3, 2]);
  });
});

test("a marker anchor stays above the surface and the bridge deck", () => {
  // Setup
  const model = markerModel();
  const field = new HeightField(model);
  const style = MARKER_STYLES.get("settlements");
  const markers = settlementMarkers(model);
  const layout = iconAtlasLayout(markers.map((marker) => marker.key));

  // Execution
  const groups = markerGeometry(field, markers, layout, style, 3);
  const water = groups.get(3);
  const village = groups.get(0);

  // Assertion
  assert.deepEqual(water.positions.slice(0, 3), [4.5, Math.max(field.sample(4.5, 4.5), BRIDGE_DECK) + style.lift, 1.5]);
  assert.ok(water.positions[1] >= BRIDGE_DECK + style.lift);
  assert.ok(village.positions[1] >= field.sample(0.5, 0.5) + style.lift);
  assert.deepEqual(village.positions.slice(0, 3), village.positions.slice(9, 12));
  assert.deepEqual(village.corners, [-0.5, 0, 0.5, 0, 0.5, 1, -0.5, 1]);
  assert.deepEqual(village.shapes.slice(0, 2), [style.minAngle / style.size, 0]);
});

test("a marker key without an atlas cell throws a TypeError", () => {
  // Setup
  const model = markerModel();
  const field = new HeightField(model);
  const layout = iconAtlasLayout([]);

  // Execution and Assertion
  assert.throws(() => markerGeometry(field, resourceMarkers(model), layout, MARKER_STYLES.get("resources"), 3), TypeError);
});
