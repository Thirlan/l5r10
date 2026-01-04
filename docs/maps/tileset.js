/**
 * TileSet class - represents a sprite sheet for hex map tiles
 */
class TileSet {
  /**
   * Constructor for TileSet
   * @param {string} imgSource - Path to the sprite image file
   * @param {number} pixelWidth - Pixel width of individual sprites
   * @param {number} pixelHeight - Pixel height of individual sprites
   * @param {number} rows - Number of sprite rows in the image
   * @param {number} columns - Number of sprite columns in the image
   */
  constructor(imgSource, pixelWidth, pixelHeight, rows, columns) {
    this.imgSource = imgSource;
    this.pixelWidth = pixelWidth;
    this.pixelHeight = pixelHeight;
    this.rows = rows;
    this.columns = columns;
    this.image = null;
    
    // Load the image
    this.image = new Image();
    this.image.src = imgSource;
  }

  /**
   * Get the dimensions and coordinates of a sprite in the tileset
   * @param {number} row - Row index of the sprite
   * @param {number} column - Column index of the sprite
   * @returns {Object} Object with x, y, width, and height properties
   */
  getDimensions(row, column) {
    return {
      x: column * this.pixelWidth,
      y: row * this.pixelHeight,
      width: this.pixelWidth,
      height: this.pixelHeight
    };
  }

  /**
   * Check if the image has been loaded
   * @returns {boolean} True if the image is loaded
   */
  isLoaded() {
    return this.image && this.image.complete;
  }
}

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

/**
 * HexMap class - manages and renders a hex-based map
 */
class HexMap {
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
   * @param {number} x - X position in the map grid
   * @param {number} y - Y position in the map grid
   * @returns {Object} Object with x and y screen coordinates
   */
  getHexScreenCoords(x, y) {
    const hexWidth = this.hexWidth;
    const hexHeight = this.hexHeight;
    const offsetX = y % 2 === 1 ? hexWidth / 2 : 0;
    
    return {
      x: x * hexWidth + offsetX,
      y: y * (hexHeight * 0.75)
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
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = this.tiles[y] && this.tiles[y][x];
        if (tile && tile.tileSet.isLoaded()) {
          const screenCoords = this.getHexScreenCoords(x, y);
          const spriteDims = tile.getSpriteDimensions();

          // Draw the sprite from the tileset, centered on the hex position
          this.ctx.drawImage(
            tile.tileSet.image,
            spriteDims.x,
            spriteDims.y,
            spriteDims.width,
            spriteDims.height,
            screenCoords.x - this.hexWidth / 2,
            screenCoords.y - this.hexHeight / 2,
            this.hexWidth,
            this.hexHeight
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
