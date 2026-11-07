// @ts-check
// Compile this file only. The invalid operations test the type contract.
import { MapHeader, validateMapHeader } from "../../../docs/scripts/world/data/world-map-data-header.js";
import { WorldMapDataGrid } from "../../../docs/scripts/world/data/world-map-data-grid.js";

const data = { name: "Map", summary: "", seed: 1, maxX: 2, maxY: 1, version: "1", lastUpdated: "2026/11/07" };
const header = new MapHeader(data);
const grid = new WorldMapDataGrid({ ...data, tiles: {} });
/** @type {unknown} */
const unknownHeader = data;
validateMapHeader(unknownHeader);
/** @type {number} */
const validatedSeed = unknownHeader.seed;
/** @type {MapHeader} */
const composed = grid.header;
new MapHeader({ ...header, name: composed.name, seed: composed.seed + validatedSeed });

// @ts-expect-error Header names are read-only.
header.name = "Changed";
// @ts-expect-error Header seeds are read-only.
header.seed = 2;
// @ts-expect-error Header bounds are read-only.
header.maxX = 3;
// @ts-expect-error Composed header attributes are read-only.
composed.lastUpdated = "2026/11/08";
// @ts-expect-error The composed header cannot be replaced.
grid.header = header;
// @ts-expect-error Header bounds must be numbers.
new MapHeader({ ...data, maxX: "2" });
// @ts-expect-error All declared header attributes are required.
new MapHeader({ name: "Map" });
// @ts-expect-error Extra header fields are not declared.
new MapHeader({ ...data, author: "Unknown" });
// @ts-expect-error Summary is read-only.
header.summary = "Changed";
// @ts-expect-error Both bounds are read-only.
header.maxY = 3;
// @ts-expect-error Version is read-only.
header.version = "2";
