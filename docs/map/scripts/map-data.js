/**
 * Map data for the 3D world map.
 * It loads the saved grid of the 2D map and resolves the saved numbers with the canonical catalogs.
 * Missing layers use the same defaults as the 2D map: flat, temperate, and no vegetation.
 */
import { CLAN, CLIMATE, INFRASTRUCTURE, LAYERS, RESOURCE, RIVER, SETTLEMENT, TERRAIN, VEGETATION } from "../../scripts/world/world-map-layers.js";

/** Saved cell fields that hold one catalog ID, with their layer and default value. */
const ID_FIELDS = Object.freeze([
  ["terrain", LAYERS.TERRAIN, TERRAIN.FLAT],
  ["climate", LAYERS.CLIMATE, CLIMATE.TEMPERATE],
  ["vegetation", LAYERS.VEGETATION, VEGETATION.NONE],
  ["river", LAYERS.RIVER, RIVER.NONE],
  ["infrastructure", LAYERS.INFRASTRUCTURE, INFRASTRUCTURE.NONE],
  ["clan", LAYERS.CLAN, CLAN.NONE],
  ["settlement", LAYERS.SETTLEMENT, SETTLEMENT.NONE],
  ["resource", LAYERS.RESOURCE, RESOURCE.NONE],
]);

const WATER_TERRAIN_IDS = new Set([TERRAIN.WATER.id, TERRAIN.COASTAL_WATER.id, TERRAIN.OCEAN.id]);

/**
 * Tells if a terrain ID is water (water, coastal water, or ocean).
 * @param {number} terrainId Saved terrain ID.
 * @returns {boolean} True for water terrain.
 */
export function isWaterTerrain(terrainId) {
  return WATER_TERRAIN_IDS.has(terrainId);
}

/**
 * Converts saved direction flags ({"0": 0|1, ... "7": 0|1}) to a bit mask. Bit 0 is north, then clockwise.
 * @param {Object<string, number>|undefined} flags Saved direction flags.
 * @returns {number} Bit mask from 0 to 255.
 */
export function directionMask(flags) {
  if (flags === undefined) return 0;
  if (typeof flags !== "object" || flags === null) throw new TypeError("Direction flags must be an object.");
  return Object.entries(flags).reduce((mask, [key, value]) => (value === 1 && /^[0-7]$/.test(key) ? mask | (1 << Number(key)) : mask), 0);
}

/** An in-memory model of the saved map grid. */
export class MapModel {
  #ids;
  #saved;

  /**
   * @param {Object<string, Object>} grid Saved cells keyed by "x,y".
   * @param {{columns: number, rows: number}} size Map size in cells.
   */
  constructor(grid, size) {
    // Validation
    if (!grid || typeof grid !== "object" || Array.isArray(grid)) throw new TypeError("The map grid must be an object keyed by 'x,y'.");
    if (!size || !Number.isInteger(size.columns) || !Number.isInteger(size.rows) || size.columns <= 0 || size.rows <= 0) {
      throw new TypeError("The map size needs positive integer columns and rows.");
    }

    // Computation
    this.columns = size.columns;
    this.rows = size.rows;
    const count = this.columns * this.rows;
    this.#ids = new Map(ID_FIELDS.map(([field, , fallback]) => [field, new Uint8Array(count).fill(fallback.id)]));
    this.#saved = new Array(count);
    this.riverMask = new Uint8Array(count);
    this.cliffMask = new Uint8Array(count);
    this.unknownValues = 0;
    this.outsideCells = 0;
    Object.entries(grid).forEach(([key, cell]) => this.#readCell(key, cell));
    this.settlements = this.#collect("settlement", (x, y, saved) => ({ x, y, settlement: this.valueAt("settlement", x, y), clan: this.valueAt("clan", x, y), englishName: saved.englishName ?? "", rokuganiName: saved.rokuganiName ?? "" }));
    this.resources = this.#collect("resource", (x, y) => ({ x, y, resource: this.valueAt("resource", x, y) }));
    this.labels = this.#savedCells()
      .filter(({ saved }) => saved.text)
      .map(({ x, y, saved }) => ({ x, y, text: saved.text, fontSize: saved.text.fontSize || 14 }));
    this.landBounds = this.#landBounds();
  }

  /**
   * @param {number} x Column.
   * @param {number} y Row.
   * @returns {boolean} True if the cell is inside the map.
   */
  contains(x, y) {
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < this.columns && y < this.rows;
  }

  /**
   * @param {number} x Column.
   * @param {number} y Row.
   * @returns {number} Index of the cell in the per-cell arrays.
   */
  index(x, y) {
    if (!this.contains(x, y)) throw new RangeError(`Cell ${x},${y} is outside the map.`);
    return y * this.columns + x;
  }

  /**
   * @param {string} field Saved field name, for example "terrain".
   * @returns {Uint8Array} Catalog IDs of all cells, in row order.
   */
  ids(field) {
    const ids = this.#ids.get(field);
    if (!ids) throw new TypeError(`Unknown map field: ${field}`);
    return ids;
  }

  /**
   * @param {string} field Saved field name, for example "terrain".
   * @param {number} x Column.
   * @param {number} y Row.
   * @returns {import("../../scripts/world/world-map-layers.js").LayerValue} Resolved catalog value.
   */
  valueAt(field, x, y) {
    const layer = ID_FIELDS.find(([name]) => name === field)[1];
    return layer.getValue(this.ids(field)[this.index(x, y)]);
  }

  /**
   * @param {number} x Column.
   * @param {number} y Row.
   * @returns {boolean} True if the cell terrain is water.
   */
  isWater(x, y) {
    return isWaterTerrain(this.ids("terrain")[this.index(x, y)]);
  }

  /**
   * @param {number} x Column.
   * @param {number} y Row.
   * @returns {Object} The saved cell object, or an empty object.
   */
  savedCell(x, y) {
    return this.#saved[this.index(x, y)] ?? {};
  }

  /** @returns {Object<string, number>} Cell counts for the debug readout and the tests. */
  counts() {
    const total = (field, test) => this.ids(field).reduce((sum, id) => (test(id) ? sum + 1 : sum), 0);
    return {
      cells: this.columns * this.rows,
      painted: this.#saved.filter((cell) => cell && Object.keys(cell).length > 0).length,
      outside: this.outsideCells,
      unknown: this.unknownValues,
      water: total("terrain", isWaterTerrain),
      rivers: total("river", (id) => id !== RIVER.NONE.id),
      cliffs: total("terrain", (id) => id === TERRAIN.CLIFF.id),
      vegetation: total("vegetation", (id) => id !== VEGETATION.NONE.id),
      infrastructure: total("infrastructure", (id) => id !== INFRASTRUCTURE.NONE.id),
      settlements: this.settlements.length,
      resources: this.resources.length,
      labels: this.labels.length,
    };
  }

  #readCell(key, cell) {
    const [x, y] = key.split(",").map(Number);
    if (!this.contains(x, y)) {
      this.outsideCells += 1;
      return;
    }
    const index = this.index(x, y);
    this.#saved[index] = cell;
    ID_FIELDS.forEach(([field, layer]) => {
      if (cell[field] === undefined) return;
      const value = layer.getValue(cell[field]);
      if (value) this.#ids.get(field)[index] = value.id;
      else this.unknownValues += 1;
    });
    this.riverMask[index] = directionMask(cell["river direction"]);
    this.cliffMask[index] = directionMask(cell["cliff direction"]);
  }

  #savedCells() {
    return this.#saved.flatMap((saved, index) => (saved ? [{ x: index % this.columns, y: Math.floor(index / this.columns), saved }] : []));
  }

  #collect(field, create) {
    const ids = this.ids(field);
    const fallback = ID_FIELDS.find(([name]) => name === field)[2];
    return this.#savedCells()
      .filter(({ x, y }) => ids[this.index(x, y)] !== fallback.id)
      .map(({ x, y, saved }) => Object.freeze(create(x, y, saved)));
  }

  #landBounds() {
    const terrain = this.ids("terrain");
    const land = [...terrain.keys()].filter((index) => !isWaterTerrain(terrain[index]));
    const xs = land.map((index) => index % this.columns);
    const ys = land.map((index) => Math.floor(index / this.columns));
    return Object.freeze({ minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) });
  }
}

/**
 * Loads the saved grid and creates a map model.
 * @param {string} url URL of world-map-grid.json.
 * @param {{columns: number, rows: number}} size Map size in cells.
 * @returns {Promise<MapModel>} The loaded map model.
 */
export async function loadMapModel(url, size) {
  if (typeof url !== "string" || url.length === 0) throw new TypeError("loadMapModel needs the URL of the map grid.");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load the map grid (${response.status}).`);
  return new MapModel(await response.json(), size);
}

/**
 * Makes a short text that describes the loaded map.
 * @param {MapModel} model Map model.
 * @returns {string} Debug readout text.
 */
export function describeMapModel(model) {
  if (!(model instanceof MapModel)) throw new TypeError("describeMapModel needs a MapModel.");
  const counts = model.counts();
  const { minX, maxX, minY, maxY } = model.landBounds;
  return [`Loaded ${counts.cells} cells (${model.columns} × ${model.rows}), ${counts.painted} painted, ${counts.outside} outside, ${counts.unknown} unknown values.`, `Land bounds x ${minX}–${maxX}, y ${minY}–${maxY}. Water ${counts.water}, cliffs ${counts.cliffs}, rivers ${counts.rivers}.`, `Vegetation ${counts.vegetation}, infrastructure ${counts.infrastructure}, settlements ${counts.settlements}, resources ${counts.resources}, labels ${counts.labels}.`].join("\n");
}
