import assert from "node:assert/strict";
import test from "node:test";
import { MapHeader } from "../../../docs/scripts/world/data/world-map-data-header.js";
import { MapHeaderReadOnly } from "../../../docs/scripts/world/data/world-map-data-header-read-only.js";
import { createMapHeader, readMapFile, stringifyMapFile } from "../../../docs/scripts/world/data/world-map-data-file.js";

test("a read-only header copies and freezes all seven fields", () => {
  const writable = new MapHeader(createMapHeader({ columns: 3, rows: 2 }));
  const header = new MapHeaderReadOnly(writable);
  assert.ok(header instanceof MapHeaderReadOnly);
  assert.deepEqual({ ...header }, { ...writable });
  assert.deepEqual(Object.getOwnPropertyNames(MapHeaderReadOnly.prototype), ["constructor"]);
  assert.ok(Object.isFrozen(header));
  Object.keys(header).forEach((field) =>
    assert.throws(() => {
      header[field] = null;
    }, TypeError),
  );
  writable.name = "Changed";
  assert.equal(header.name, "Untitled map");
  assert.throws(() => new MapHeaderReadOnly({ ...writable, author: "Unknown" }), /unknown field/);
  const date = new Date(2026, 10, 7);
  const saved = readMapFile(JSON.parse(stringifyMapFile(header, {}, date)));
  assert.deepEqual(saved.header, { ...header, lastUpdated: "2026/11/07" });
});
