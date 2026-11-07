/**
 * The world map as JavaScript objects.
 * It reads the map file (docs/data/world-map-grid.json) and makes one WorldMapTile for each coordinate of the map.
 * Coordinates without a saved cell get a tile with the default values of all layers.
 * Saved cells outside maxX and maxY are not used.
 *
 * Usage
 * const grid = new WorldMapDataGrid(await (await fetch("../data/world-map-grid.json")).json());
 * grid.get(10, 20).terrain.name;
 * grid.getGrid9(10, 20)[0][1]; // The tile north of 10,20.
 */
import { getMapSize, isInsideMap, readMapFile } from "./world-map-file.js";
import { createWorldMapTile } from "./world-map-data-tile-factory.js";

export class WorldMapDataGrid {
  #tiles;

  /**
   * @param {Object|string} data The map file, as parsed JSON or as JSON text.
   */
  constructor(data) {
    // Validation
    const { header, tiles } = readMapFile(typeof data === "string" ? JSON.parse(data) : data);

    // Computation
    /** @type {Readonly<import("./world-map-file.js").MapHeader>} Header of the map file. */
    this.header = Object.freeze({ ...header });
    const { columns, rows } = getMapSize(header);
    /** @type {number} Number of tile columns (maxX + 1). */
    this.columns = columns;
    /** @type {number} Number of tile rows (maxY + 1). */
    this.rows = rows;
    this.#tiles = new Array(columns * rows);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) this.#tiles[y * columns + x] = createWorldMapTile(x, y, tiles[`${x},${y}`]);
    }
    Object.freeze(this);
  }

  /**
   * @param {number} x Tile column.
   * @param {number} y Tile row.
   * @returns {boolean} True if the tile is from 0 to maxX and from 0 to maxY.
   */
  isInside(x, y) {
    return isInsideMap(this.header, x, y);
  }

  /**
   * @param {number} x Tile column.
   * @param {number} y Tile row.
   * @returns {import("./world-map-tile.js").WorldMapTile|null} The tile at x,y, or null if x,y is outside the map.
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
   * @returns {(import("./world-map-tile.js").WorldMapTile|null)[][]} Three rows of three tiles. A tile outside the map is null.
   */
  getGrid9(x, y) {
    // Validation
    if (!Number.isInteger(x) || !Number.isInteger(y)) throw new TypeError("getGrid9 needs integer coordinates.");

    // Output
    return [-1, 0, 1].map((dy) => [-1, 0, 1].map((dx) => this.get(x + dx, y + dy)));
  }
}
