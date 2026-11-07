// @ts-check

/**
 * The world map as JavaScript objects.
 * It reads the map file (docs/data/world-map-grid.json) and makes one WorldMapDataTile for each coordinate of the map.
 * Coordinates without a saved cell get a tile with the default values of all layers.
 * Saved cells outside maxX and maxY are not used.
 * Header and tile values are writable. Build a new grid to change its size.
 *
 * Usage
 * const grid = new WorldMapDataGrid(await (await fetch("../data/world-map-grid.json")).json());
 * grid.get(10, 20).terrain.name;
 * grid.getGrid9(10, 20)[0][1]; // The tile north of 10,20.
 */
import { getMapSize, readMapFile } from "./world-map-data-file.js";
import { createWorldMapTile } from "./world-map-data-tile-factory.js";
import { MapHeader } from "./world-map-data-header.js";

/**
 * Shared loading and queries for the writable and read-only grids.
 * @template {import("./world-map-data-header.js").MapHeaderData} H
 * @template T
 * @internal
 */
export class WorldMapDataGridBase {
  /** @type {readonly T[]} */
  #tiles;

  /**
   * @param {Object|string} data The map file, as parsed JSON or as JSON text.
   * @param {new (data: import("./world-map-data-header.js").MapHeaderData) => H} Header Header constructor.
   * @param {(x: number, y: number, cell?: Object) => T} createTile Saved-cell factory.
   */
  constructor(data, Header, createTile) {
    // Validation
    const { header, tiles } = readMapFile(typeof data === "string" ? JSON.parse(data) : data);

    // Computation
    /** @readonly */
    this.header = new Header(header);
    const { columns, rows } = getMapSize(this.header);
    /** @readonly Number of tile columns at construction (maxX + 1). */
    this.columns = columns;
    /** @readonly Number of tile rows at construction (maxY + 1). */
    this.rows = rows;
    /** @type {T[]} */
    const cells = new Array(columns * rows);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) cells[y * columns + x] = createTile(x, y, tiles[`${x},${y}`]);
    }
    this.#tiles = Object.freeze(cells);
    Object.freeze(this);
  }

  /**
   * @param {number} x Tile column.
   * @param {number} y Tile row.
   * @returns {boolean} True if the tile is inside the dimensions set at construction.
   */
  isInside(x, y) {
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < this.columns && y < this.rows;
  }

  /**
   * @param {number} x Tile column.
   * @param {number} y Tile row.
   * @returns {T|null} The tile at x,y, or null if x,y is outside the map.
   */
  get(x, y) {
    // Validation
    if (!Number.isInteger(x) || !Number.isInteger(y)) throw new TypeError("get needs integer coordinates.");

    // Output
    return this.isInside(x, y) ? this.#tiles[y * this.columns + x] : null;
  }

  /**
   * Gets the 3x3 tiles around a center tile. The first index is the row and the second index is the column.
   * Index [1][1] is the center, [0][1] is north, and [1][2] is east.
   * @param {number} x Column of the center tile.
   * @param {number} y Row of the center tile.
   * @returns {(T|null)[][]} Three rows of three tiles. A tile outside the map is null.
   */
  getGrid9(x, y) {
    // Validation
    if (!Number.isInteger(x) || !Number.isInteger(y)) throw new TypeError("getGrid9 needs integer coordinates.");

    // Output
    return [-1, 0, 1].map((dy) => [-1, 0, 1].map((dx) => this.get(x + dx, y + dy)));
  }
}

/** @extends {WorldMapDataGridBase<MapHeader, import("./world-map-data-tile.js").WorldMapDataTile>} */
export class WorldMapDataGrid extends WorldMapDataGridBase {
  /** @param {Object|string} data The map file, as parsed JSON or JSON text. */
  constructor(data) {
    super(data, MapHeader, createWorldMapTile);
  }
}
