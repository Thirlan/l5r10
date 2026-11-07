// @ts-check

import { DATE_PATTERN } from "./world-map-data.const.js";

/**
 * @typedef {object} MapHeaderData
 * @property {string} name Name of the map.
 * @property {string} summary Short description of the map.
 * @property {number} seed Seed for repeatable terrain shapes.
 * @property {number} maxX Highest tile column index.
 * @property {number} maxY Highest tile row index.
 * @property {string} version Version of the map.
 * @property {string} lastUpdated Date of the last save, as YYYY/MM/DD.
 */

/**
 * @param {unknown} value Possible tile index.
 * @returns {boolean} True for a non-negative safe integer.
 */
export function isTileIndex(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/** @type {ReadonlyArray<readonly [keyof MapHeaderData, (value: unknown) => boolean, string]>} */
const HEADER_FIELDS = Object.freeze([
  ["name", (value) => typeof value === "string", "a text"],
  ["summary", (value) => typeof value === "string", "a text"],
  ["seed", Number.isSafeInteger, "a whole number"],
  ["maxX", isTileIndex, "a whole number of 0 or more"],
  ["maxY", isTileIndex, "a whole number of 0 or more"],
  ["version", (value) => typeof value === "string" && value.length > 0, "a text that is not empty"],
  ["lastUpdated", (value) => typeof value === "string" && DATE_PATTERN.test(value), "a date like 2026/10/27"],
]);

/**
 * Validates the seven map header fields and rejects other fields.
 * @param {unknown} header Header values.
 * @returns {asserts header is Readonly<MapHeaderData>}
 * @throws {TypeError} If the header or a field is invalid.
 */
export function validateMapHeader(header) {
  if (!header || typeof header !== "object" || Array.isArray(header)) {
    throw new TypeError("The map header must be an object.");
  }
  const unknownField = Reflect.ownKeys(header).find((field) => !HEADER_FIELDS.some(([name]) => name === field));
  if (unknownField !== undefined) {
    throw new TypeError(`The map header has an unknown field "${String(unknownField)}".`);
  }
  HEADER_FIELDS.forEach(([field, isValid, expected]) => {
    if (!Object.prototype.propertyIsEnumerable.call(header, field)) {
      throw new TypeError(`The map header field "${field}" must be an enumerable own property.`);
    }
    if (!isValid(Reflect.get(header, field))) {
      throw new TypeError(`The map header field "${field}" must be ${expected}.`);
    }
  });
}

/** The data-only, writable class of a map header. */
export class MapHeader {
  /**
   * Validates and sets the seven declared attributes.
   * @param {Readonly<MapHeaderData>} data Header values.
   */
  constructor(data) {
    // Validation
    validateMapHeader(data);

    // Initialization
    this.name = data.name;
    this.summary = data.summary;
    this.seed = data.seed;
    this.maxX = data.maxX;
    this.maxY = data.maxY;
    this.version = data.version;
    this.lastUpdated = data.lastUpdated;
  }
}
