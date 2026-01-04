import Tile from './Tile.js';

/**
 * HexMap class - manages and renders a hex-based map
 */
export default class HexMap {
  /**
   * Constructor for HexMap
   * @param {string} canvasId - ID of the canvas element to render to
   * @param {number} mapWidth - Number of tiles wide
   * @param {number} mapHeight - Number of tiles tall
   * @param {number} hexWidth - Width of each hex in pixels
   * @param {number} hexHeight - Height of each hex in pixels
   */
  constructor(canvasId, mapWidth, mapHeight, hexWidth, hexHeight) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.hexWidth = hexWidth;
    this.hexHeight = hexHeight;
    this.tiles = [];
  }

  /**
   * Add a tile to the map at a given position
   * @param {number} x - X position in the map grid
   * @param {number} y - Y position in the map grid
   * @param {Tile} tile - The Tile instance to add
   */
  setTile(x, y, tile) {
    if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
      if (!this.tiles[y]) {
        this.tiles[y] = [];
      }
      this.tiles[y][x] = tile;
    }
  }

  /**
   * Get the screen coordinates for a hex at the given map position
   * @param {number} row - Row position in the map grid
   * @param {number} column - Column position in the map grid
   * @returns {Object} Object with x and y screen coordinates
   */
  getHexScreenCoords(row, column, tileOffsetX = 0, tileOffsetY = 0) {
    const hexWidth = this.hexWidth;
    const hexHeight = this.hexHeight;
    const offsetY = column % 2 === 1 ? hexHeight / 2 : 0;
    
    return {
      x: column * hexWidth * 0.75 - hexWidth / 2 + tileOffsetX,
      y: row * hexHeight + offsetY - hexHeight / 2 + tileOffsetY
    };
  }

  /**
   * Render the map to the canvas
   */
  render() {
    // Clear canvas
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw each tile
    for (let r = 0; r < this.mapHeight; r++) {
      for (let c = 0; c < this.mapWidth; c++) {
        const tile = this.tiles[r] && this.tiles[r][c];
        if (tile && tile.tileSet.isLoaded()) {
          const spriteDims = tile.getSpriteDimensions();
          const screenCoords = this.getHexScreenCoords(r, c, spriteDims.offsetX, spriteDims.offsetY);

          // Draw the sprite from the tileset, centered on the hex position
          this.ctx.drawImage(
            tile.tileSet.image,
            spriteDims.x,
            spriteDims.y,
            spriteDims.width,
            spriteDims.height,
            screenCoords.x,
            screenCoords.y,
            spriteDims.width,
            spriteDims.height
          );
        }
      }
    }
  }

  /**
   * Start animation loop for rendering
   */
  animate() {
    const animate = () => {
      this.render();
      requestAnimationFrame(animate);
    };
    animate();
  }
}