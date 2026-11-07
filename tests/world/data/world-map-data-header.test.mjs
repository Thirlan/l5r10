import assert from "node:assert/strict";
import test from "node:test";
import { MapHeader } from "../../../docs/scripts/world/data/world-map-data-header.js";
import { createMapHeader, readMapFile, stringifyMapFile } from "../../../docs/scripts/world/data/world-map-data-file.js";
import { WorldMapDataGrid } from "../../../docs/scripts/world/data/world-map-data-grid.js";

const DATA = createMapHeader({ columns: 3, rows: 2 }, new Date(2026, 10, 7));
const HEADER_FIELDS = ["name", "summary", "seed", "maxX", "maxY", "version", "lastUpdated"];

test("a header POJO has all declared values and only a constructor", () => {
  const header = new MapHeader(DATA);
  assert.deepEqual(Object.keys(header), HEADER_FIELDS);
  assert.deepEqual({ ...header }, DATA);
  assert.deepEqual(Object.getOwnPropertyNames(MapHeader.prototype), ["constructor"]);
  assert.ok(Object.isFrozen(header));
  Object.keys(DATA).forEach((field) =>
    assert.throws(() => {
      header[field] = null;
    }, TypeError),
  );
});

test("grid composition keeps exactly the declared header fields", () => {
  const grid = new WorldMapDataGrid({ ...DATA, tiles: {} });
  assert.ok(grid.header instanceof MapHeader);
  assert.deepEqual(Object.keys(grid.header), HEADER_FIELDS);
  assert.deepEqual({ ...grid.header }, DATA);
  assert.throws(() => {
    grid.header = new MapHeader(DATA);
  }, TypeError);
  const saved = JSON.parse(stringifyMapFile(grid.header, {}, new Date(2026, 10, 7)));
  assert.deepEqual(readMapFile(saved).header, DATA);
});

test("header construction rejects undeclared fields and invalid values", () => {
  assert.throws(() => new MapHeader({ ...DATA, author: "Unknown" }), /unknown field "author"/);
  assert.throws(() => new MapHeader({ ...DATA, ["__proto__"]: {} }), /unknown field "__proto__"/);
  assert.throws(() => new MapHeader({ ...DATA, seed: "1" }), /header field "seed"/);
  assert.throws(() => new MapHeader(null), /header must be an object/);
  assert.throws(() => new WorldMapDataGrid({ ...DATA, notes: {}, tiles: {} }), /unknown field "notes"/);
});

test("header construction rejects inherited or non-enumerable required fields", () => {
  const inherited = Object.create(DATA);
  const hidden = Object.defineProperty({ ...DATA }, "name", { enumerable: false });
  assert.throws(() => new MapHeader(inherited), /header field "name"/);
  assert.throws(() => new MapHeader(hidden), /header field "name"/);
});
