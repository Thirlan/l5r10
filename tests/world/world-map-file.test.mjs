import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createMapHeader, formatMapDate, getMapSize, isInsideMap, readMapFile, stringifyMapFile } from "../../docs/scripts/world/world-map-file.js";

const MAP_FILE_URL = new URL("../../docs/data/world-map-grid.json", import.meta.url);

function createHeader() {
  return { name: "Test map", summary: "A small map.", seed: 42, maxX: 2, maxY: 1, version: "0.9.0", lastUpdated: "2026/10/27" };
}

test("map dates use YYYY/MM/DD with zeros in front", () => {
  // Setup
  const date = new Date(2026, 0, 5);

  // Execution
  const text = formatMapDate(date);

  // Assertion
  assert.equal(text, "2026/01/05");
});

test("map dates reject an invalid date", () => {
  // Execution
  const format = () => formatMapDate(new Date("not a date"));

  // Assertion
  assert.throws(format, TypeError);
});

test("a new map header sets maxX and maxY to the highest tile indexes", () => {
  // Execution
  const header = createMapHeader({ columns: 135, rows: 196 }, new Date(2026, 9, 27));

  // Assertion
  assert.deepEqual(header, { name: "Untitled map", summary: "", seed: 0, maxX: 134, maxY: 195, version: "0.1.0", lastUpdated: "2026/10/27" });
});

test("a new map header rejects a size without columns", () => {
  // Execution
  const create = () => createMapHeader({ columns: 0, rows: 196 });

  // Assertion
  assert.throws(create, /positive integer columns and rows/);
});

test("the map size is one more than the highest tile indexes", () => {
  // Execution
  const size = getMapSize(createHeader());

  // Assertion
  assert.deepEqual(size, { columns: 3, rows: 2 });
});

test("the map size rejects a header without maxY", () => {
  // Setup
  const header = createHeader();
  delete header.maxY;

  // Execution
  const getSize = () => getMapSize(header);

  // Assertion
  assert.throws(getSize, /maxX and maxY/);
});

test("tiles on the corners of the map are inside the map", () => {
  // Setup
  const header = createHeader();

  // Execution
  const corners = [isInsideMap(header, 0, 0), isInsideMap(header, 2, 1)];

  // Assertion
  assert.deepEqual(corners, [true, true]);
});

test("tiles past the highest index or below 0 are outside the map", () => {
  // Setup
  const header = createHeader();

  // Execution
  const outside = [isInsideMap(header, 3, 0), isInsideMap(header, 0, 2), isInsideMap(header, -1, 0), isInsideMap(header, 0, -1)];

  // Assertion
  assert.deepEqual(outside, [false, false, false, false]);
});

test("a tile with a fraction is outside the map", () => {
  // Execution
  const inside = isInsideMap(createHeader(), 1.5, 0);

  // Assertion
  assert.equal(inside, false);
});

test("reading a map file gives the header and the tiles", () => {
  // Setup
  const tiles = { "0,0": { terrain: 1 } };

  // Execution
  const mapFile = readMapFile({ ...createHeader(), tiles });

  // Assertion
  assert.deepEqual(mapFile, { header: createHeader(), tiles });
});

test("reading a map file keeps header fields that the code does not know", () => {
  // Execution
  const { header } = readMapFile({ ...createHeader(), author: "Thirlan", tiles: {} });

  // Assertion
  assert.equal(header.author, "Thirlan");
});

test("reading a map file does not check the tiles against maxX and maxY", () => {
  // Setup
  const tiles = { "9,9": { animal: 1 } };

  // Execution
  const mapFile = readMapFile({ ...createHeader(), tiles });

  // Assertion
  assert.deepEqual(Object.keys(mapFile.tiles), ["9,9"]);
});

test("reading a map file rejects the old format without a header", () => {
  // Execution
  const read = () => readMapFile({ "0,0": { terrain: 1 } });

  // Assertion
  assert.throws(read, /needs a "tiles" object/);
});

for (const value of [null, []]) {
  test(`reading a map file rejects ${JSON.stringify(value)}`, () => {
    // Execution
    const read = () => readMapFile(value);

    // Assertion
    assert.throws(read, /must be an object/);
  });
}

for (const [field, value] of [
  ["name", 5],
  ["summary", null],
  ["seed", 1.5],
  ["maxX", -1],
  ["maxY", "195"],
  ["version", ""],
  ["lastUpdated", "2026-10-27"],
]) {
  test(`reading a map file rejects ${field} ${JSON.stringify(value)}`, () => {
    // Setup
    const mapFile = { ...createHeader(), [field]: value, tiles: {} };

    // Execution
    const read = () => readMapFile(mapFile);

    // Assertion
    assert.throws(read, new RegExp(`header field "${field}"`));
  });
}

test("reading a map file rejects a header without a seed", () => {
  // Setup
  const header = createHeader();
  delete header.seed;

  // Execution
  const read = () => readMapFile({ ...header, tiles: {} });

  // Assertion
  assert.throws(read, /header field "seed"/);
});

test("the map file text has the header first, the tiles last, and a new date", () => {
  // Setup
  const header = { ...createHeader(), lastUpdated: "2020/01/01" };

  // Execution
  const text = stringifyMapFile(header, { "0,0": {} }, new Date(2026, 9, 28));

  // Assertion
  const saved = JSON.parse(text);
  assert.deepEqual(Object.keys(saved), ["name", "summary", "seed", "maxX", "maxY", "version", "lastUpdated", "tiles"]);
  assert.equal(saved.lastUpdated, "2026/10/28");
  assert.equal(header.lastUpdated, "2020/01/01");
  assert.match(text, /^{\n {2}"name": /);
});

test("the map file text reads back to the same header and tiles", () => {
  // Setup
  const tiles = { "0,0": { terrain: 1 }, "2,1": { river: 1, "river direction": { 0: 1 } } };

  // Execution
  const mapFile = readMapFile(JSON.parse(stringifyMapFile(createHeader(), tiles, new Date(2026, 9, 27))));

  // Assertion
  assert.deepEqual(mapFile, { header: createHeader(), tiles });
});

test("the map file text rejects a header without a name", () => {
  // Setup
  const header = createHeader();
  delete header.name;

  // Execution
  const stringify = () => stringifyMapFile(header, {});

  // Assertion
  assert.throws(stringify, /header field "name"/);
});

test("the saved map file passes the map file check", () => {
  // Setup
  const saved = JSON.parse(readFileSync(MAP_FILE_URL, "utf8"));

  // Execution
  const read = () => readMapFile(saved);

  // Assertion
  assert.doesNotThrow(read);
});

for (const page of ["build_map.html", "world_map.html"]) {
  test(`${page} gives the same canvas size as the saved map file`, () => {
    // Setup
    const { header } = readMapFile(JSON.parse(readFileSync(MAP_FILE_URL, "utf8")));
    const html = readFileSync(new URL(`../../docs/world/${page}`, import.meta.url), "utf8");

    // Execution
    const [, columns, rows] = html.match(/data-map-columns="(\d+)" data-map-rows="(\d+)"/);

    // Assertion
    assert.deepEqual({ columns: Number(columns), rows: Number(rows) }, getMapSize(header));
  });
}
