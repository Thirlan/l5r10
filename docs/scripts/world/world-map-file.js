/**
 * The saved map file (docs/data/world-map-grid.json).
 * The file is one JSON object. Its header has these fields: name, summary, seed, maxX, maxY, version, and lastUpdated.
 * The field "tiles" comes after the header. It holds the saved cells, keyed by "x,y".
 * The fields maxX and maxY are the highest tile indexes. The map has maxX + 1 columns and maxY + 1 rows.
 * The header can have more fields. The code keeps them.
 */

/**
 * @typedef {Object} MapHeader
 * @property {string} name Name of the map.
 * @property {string} summary Short description of the map.
 * @property {number} seed Seed number for the terrain noise. No code uses it yet.
 * @property {number} maxX Highest tile column index.
 * @property {number} maxY Highest tile row index.
 * @property {string} version Version of the map, for example "0.9.0".
 * @property {string} lastUpdated Date of the last save, as YYYY/MM/DD.
 */

const DATE_PATTERN = /^\d{4}\/\d{2}\/\d{2}$/;
const NEW_MAP_NAME = "Untitled map";
const NEW_MAP_VERSION = "0.1.0";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isTileIndex(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Header fields in file order. Each has a test for the value and a description for the error message. */
const HEADER_FIELDS = Object.freeze([
  ["name", (value) => typeof value === "string", "a text"],
  ["summary", (value) => typeof value === "string", "a text"],
  ["seed", Number.isSafeInteger, "a whole number"],
  ["maxX", isTileIndex, "a whole number of 0 or more"],
  ["maxY", isTileIndex, "a whole number of 0 or more"],
  ["version", (value) => typeof value === "string" && value.length > 0, "a text that is not empty"],
  ["lastUpdated", (value) => typeof value === "string" && DATE_PATTERN.test(value), "a date like 2026/10/27"],
]);

function validateHeader(header) {
  HEADER_FIELDS.forEach(([field, isValid, expected]) => {
    if (!isValid(header[field])) throw new TypeError(`The map header field "${field}" must be ${expected}.`);
  });
}

/**
 * Formats a date as YYYY/MM/DD in local time.
 * @param {Date} date A valid date.
 * @returns {string} The date, for example "2026/10/27".
 */
export function formatMapDate(date) {
  // Validation
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new TypeError("formatMapDate needs a valid Date.");

  // Output
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}/${month}/${day}`;
}

/**
 * Makes the header of a new map. The name and the version are placeholders, and the seed is 0.
 * @param {{columns: number, rows: number}} size Map size in tiles.
 * @param {Date} [now] Date for lastUpdated.
 * @returns {MapHeader} A new header.
 */
export function createMapHeader(size, now = new Date()) {
  // Validation
  if (!isPlainObject(size) || !Number.isInteger(size.columns) || !Number.isInteger(size.rows) || size.columns <= 0 || size.rows <= 0) {
    throw new TypeError("The map size needs positive integer columns and rows.");
  }

  // Output
  return { name: NEW_MAP_NAME, summary: "", seed: 0, maxX: size.columns - 1, maxY: size.rows - 1, version: NEW_MAP_VERSION, lastUpdated: formatMapDate(now) };
}

/**
 * @param {MapHeader} header Map header.
 * @returns {{columns: number, rows: number}} Map size in tiles.
 */
export function getMapSize(header) {
  // Validation
  if (!isPlainObject(header) || !isTileIndex(header.maxX) || !isTileIndex(header.maxY)) throw new TypeError("The map header needs whole numbers of 0 or more for maxX and maxY.");

  // Output
  return { columns: header.maxX + 1, rows: header.maxY + 1 };
}

/**
 * @param {MapHeader} header Map header.
 * @param {number} x Tile column.
 * @param {number} y Tile row.
 * @returns {boolean} True if the tile is from 0 to maxX and from 0 to maxY.
 */
export function isInsideMap(header, x, y) {
  // Validation
  const { columns, rows } = getMapSize(header);

  // Output
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < columns && y < rows;
}

/**
 * Checks the header of a parsed map file and splits the file into the header and the tiles.
 * It does not check the tiles against maxX and maxY.
 * @param {unknown} data The parsed JSON of a map file.
 * @returns {{header: MapHeader, tiles: Object<string, Object>}} The header and the tiles.
 */
export function readMapFile(data) {
  // Validation
  if (!isPlainObject(data)) throw new TypeError("The map file must be an object.");
  const { tiles, ...header } = data;
  if (!isPlainObject(tiles)) throw new TypeError('The map file needs a "tiles" object after the header.');
  validateHeader(header);

  // Output
  return { header, tiles };
}

/**
 * Makes the text of a map file. The text sets lastUpdated to the date of now.
 * @param {MapHeader} header Map header.
 * @param {Object<string, Object>} tiles Saved cells, keyed by "x,y".
 * @param {Date} [now] Date for lastUpdated.
 * @returns {string} JSON text with 2 spaces of indent. The tiles come after the header.
 */
export function stringifyMapFile(header, tiles, now = new Date()) {
  // Validation
  if (!isPlainObject(header)) throw new TypeError("The map header must be an object.");
  const mapFile = { ...header, lastUpdated: formatMapDate(now), tiles };
  readMapFile(mapFile);

  // Output
  return JSON.stringify(mapFile, null, 2);
}
