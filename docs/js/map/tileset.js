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
   * @param {number} offsetX - X offset for tile positioning
   * @param {number} offsetY - Y offset for tile positioning
   */
  constructor(imgSource, pixelWidth, pixelHeight, rows, columns, offsetX = 0, offsetY = 0) {
    this.imgSource = imgSource;
    this.pixelWidth = pixelWidth;
    this.pixelHeight = pixelHeight;
    this.rows = rows;
    this.columns = columns;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.image = null;
    
    // Load the image
    this.image = new Image();
    this.image.src = imgSource;
  }

  /**
   * Get the dimensions and coordinates of a sprite in the tileset
   * @param {number} row - Row index of the sprite
   * @param {number} column - Column index of the sprite
   * @returns {Object} Object with x, y, width, height, offsetX, and offsetY properties
   */
  getDimensions(row, column) {
    return {
      x: column * this.pixelWidth,
      y: row * this.pixelHeight,
      width: this.pixelWidth,
      height: this.pixelHeight,
      offsetX: this.offsetX,
      offsetY: this.offsetY
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

export default TileSet;