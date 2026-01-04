import TileSet from './tileset.js';

/**
 * Tile class - represents a single tile in the hex map
 */
class Tile {
  /**
   * Constructor for Tile
   * @param {TileSet} tileSet - The TileSet instance for this tile
   * @param {number} row - Row index in the tileset
   * @param {number} column - Column index in the tileset
   */
  constructor(tileSet, row, column) {
    this.tileSet = tileSet;
    this.row = row;
    this.column = column;
  }

  /**
   * Get the dimensions for this tile's sprite
   * @returns {Object} Object with x, y, width, and height properties
   */
  getSpriteDimensions() {
    return this.tileSet.getDimensions(this.row, this.column);
  }
}

export default Tile;