import assert from "node:assert/strict";
import test from "node:test";
import { CLAN, SETTLEMENT } from "../../docs/scripts/world/world-map-layers.js";
import { LABEL_PADDING, LABEL_SCALE, labelAtlasLayout, labelGeometry, labelText, mapLabels, settlementLabels } from "../../docs/map/scripts/label-layout.js";
import { MapModel } from "../../docs/map/scripts/map-data.js";
import { MARKER_STYLES } from "../../docs/map/scripts/marker-layout.js";
import { HeightField } from "../../docs/map/scripts/terrain-height.js";

/** A named castle, a village without a name, and two map text cells, on a 6 × 6 grid. */
function labelModel() {
  const grid = {
    "1,1": { settlement: SETTLEMENT.CASTLE.id, clan: CLAN.CRANE.id, englishName: "Son of the Crane", rokuganiName: "Daidoji" },
    "2,2": { settlement: SETTLEMENT.VILLAGE.id },
    "4,1": { text: { englishText: "Plum Blossom Pass", rokuganiText: "Iuchi Pass", fontSize: 8 } },
    "4,4": { text: { text: "Red Lake\nNorth", fontSize: 14 } },
  };
  return new MapModel(grid, { columns: 6, rows: 6 });
}

/** Each character is 0.5 font pixels wide. */
const measure = (line, fontSize) => line.length * fontSize * 0.5;

test("map text follows the language with the same fallback as the 2D map", () => {
  // Setup
  const both = { englishText: "Plum Blossom Pass", rokuganiText: "Iuchi Pass" };

  // Execution
  const texts = [labelText(both, "english"), labelText(both, "rokugani"), labelText({ englishText: "Only English" }, "rokugani"), labelText("Plain", "rokugani"), labelText({}, "english")];

  // Assertion
  assert.deepEqual(texts, ["Plum Blossom Pass", "Iuchi Pass", "Only English", "Plain", ""]);
});

test("a settlement label has the name and the type, and only named settlements get a label", () => {
  // Setup
  const model = labelModel();

  // Execution
  const english = settlementLabels(model, "english");
  const rokugani = settlementLabels(model, "rokugani");

  // Assertion
  assert.equal(english.length, 1);
  assert.deepEqual(english[0].lines, ["Son of the Crane", SETTLEMENT.CASTLE.englishType]);
  assert.deepEqual(rokugani[0].lines, ["Daidoji", SETTLEMENT.CASTLE.rokuganiType]);
  assert.equal(english[0].fontSize, 8);
  assert.ok(english[0].bottom > MARKER_STYLES.get("settlements").size);
  assert.ok(english[0].maxDistance > 0);
});

test("a map label splits its text into lines and shows at all distances", () => {
  // Setup
  const model = labelModel();

  // Execution
  const labels = mapLabels(model, "rokugani");

  // Assertion
  assert.deepEqual(
    labels.map((label) => label.lines),
    [["Iuchi Pass"], ["Red Lake", "North"]],
  );
  assert.ok(labels.every((label) => label.maxDistance === 0 && label.bottom === 0));
});

test("label rectangles do not overlap and stay inside the atlas", () => {
  // Setup
  const model = labelModel();
  const labels = Array.from({ length: 30 }, () => [...settlementLabels(model, "english"), ...mapLabels(model, "english")])
    .flat()
    .map((label, index) => ({ ...label, key: `${label.key}:${index}` }));

  // Execution
  const layout = labelAtlasLayout(labels, measure);
  const rects = [...layout.rects.values()];
  const overlap = (first, second) => first.left < second.left + second.width && second.left < first.left + first.width && first.top < second.top + second.height && second.top < first.top + first.height;

  // Assertion
  assert.equal(rects.length, labels.length);
  assert.equal(Math.log2(layout.height) % 1, 0);
  assert.ok(rects.every((rect) => rect.left + rect.width <= layout.width && rect.top + rect.height <= layout.height));
  assert.ok(rects.every((rect, index) => rects.slice(index + 1).every((other) => !overlap(rect, other))));
  assert.ok(rects.every((rect) => rect.v0 < rect.v1 && Math.abs(rect.v1 - (1 - rect.top / layout.height)) < 1e-12));
  assert.throws(() => labelAtlasLayout(labels, null), TypeError);
  assert.throws(() => labelAtlasLayout(labels, () => 1e6), RangeError);
});

test("a label quad has the size of its atlas rectangle and sits above its marker", () => {
  // Setup
  const model = labelModel();
  const field = new HeightField(model);
  const labels = [...settlementLabels(model, "english"), ...mapLabels(model, "english")];
  const layout = labelAtlasLayout(labels, measure);

  // Execution
  const groups = labelGeometry(field, labels, layout, 3);
  const castle = groups.get(0);
  const rect = layout.rects.get(labels[0].key);
  const [left, bottom, right, top] = [castle.corners[0], castle.corners[1], castle.corners[4], castle.corners[5]];

  // Assertion
  assert.equal(rect.height, 2 * 8 * LABEL_SCALE + 2 * LABEL_PADDING);
  assert.ok(Math.abs(right - left - rect.width / (LABEL_SCALE * 16)) < 1e-9);
  assert.ok(Math.abs(top - bottom - rect.height / (LABEL_SCALE * 16)) < 1e-9);
  assert.equal(bottom, labels[0].bottom);
  assert.deepEqual(castle.shapes.slice(0, 2), [labels[0].growth, labels[0].maxDistance]);
  assert.equal(
    [...groups.values()].reduce((sum, group) => sum + group.count, 0),
    3,
  );
  assert.throws(() => labelGeometry(field, labels, labelAtlasLayout([], measure), 3), TypeError);
});
