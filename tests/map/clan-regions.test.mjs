import assert from "node:assert/strict";
import test from "node:test";
import { getClanColors } from "../../docs/scripts/clan-colors.js";
import { CLAN } from "../../docs/scripts/world/world-map-layers.js";
import { CLAN_SLOTS, clanPalette, createClanLayer, hexToRgb, packClanIds } from "../../docs/map/scripts/clan-regions.js";
import { MapModel } from "../../docs/map/scripts/map-data.js";

test("hex colors become RGB values from 0 to 1", () => {
  // Setup
  const colors = ["#FF0000", "#87ceeb", "#000000"];

  // Execution
  const values = colors.map(hexToRgb);

  // Assertion
  assert.deepEqual(values, [
    [1, 0, 0],
    [0x87 / 255, 0xce / 255, 0xeb / 255],
    [0, 0, 0],
  ]);
  assert.throws(() => hexToRgb("red"), TypeError);
});

test("the clan ID texture has one byte for each cell in map row order", () => {
  // Setup
  const model = new MapModel({ "1,0": { clan: CLAN.CRAB.id }, "0,2": { clan: CLAN.SHADOWLANDS.id } }, { columns: 3, rows: 3 });

  // Execution
  const ids = packClanIds(model);

  // Assertion
  assert.ok(ids instanceof Uint8Array);
  assert.deepEqual([...ids], [0, CLAN.CRAB.id, 0, 0, 0, 0, CLAN.SHADOWLANDS.id, 0, 0]);
  assert.throws(() => packClanIds({}), TypeError);
});

test("the clan palette has the 2D fill and border colors, and no colors for no clan", () => {
  // Setup
  const crab = getClanColors(CLAN.CRAB);

  // Execution
  const palette = clanPalette();
  const at = (values, id) => values.slice(id * 4, id * 4 + 4);

  // Assertion
  assert.equal(CLAN_SLOTS, Object.values(CLAN).length);
  assert.equal(palette.fill.length, CLAN_SLOTS * 4);
  assert.equal(palette.border.length, CLAN_SLOTS * 4);
  assert.deepEqual(at(palette.fill, CLAN.NONE.id), [0, 0, 0, 0]);
  assert.deepEqual(at(palette.border, CLAN.NONE.id), [0, 0, 0, 0]);
  assert.deepEqual(at(palette.fill, CLAN.CRAB.id), [...hexToRgb(crab.fill), 1]);
  assert.deepEqual(at(palette.border, CLAN.CRAB.id), [...hexToRgb(crab.border), 1]);
});

test("the clan layer keeps its state until the terrain material is attached", () => {
  // Setup
  const calls = [];
  const material = { setFloat: (name, value) => calls.push([name, value]) };
  const layer = createClanLayer();

  // Execution
  layer.setEnabled(false);
  layer.attach(material);
  layer.setEnabled(true);

  // Assertion
  assert.deepEqual(calls, [
    ["clanStrength", 0],
    ["clanStrength", 1],
  ]);
  assert.equal(layer.enabled, true);
});
