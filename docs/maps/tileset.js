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

class LowResTileSet {
  constructor() {
    this.tileSet = new TileSet(
            '../img/fantasyhextiles_v3.png',  // Path to your sprite sheet image
            32,                    // Pixel width of each sprite
            48,                    // Pixel height of each sprite
            6,                     // Number of rows in the sprite sheet
            8,                     // Number of columns in the sprite sheet
            0,                     // X offset for tile positioning
            -16                    // Y offset for tile positioning
        );
    this.grassTile = new Tile(this.tileSet, 0, 0);
    this.grassLightForestTile = new Tile(this.tileSet, 0, 1);
    this.grassForestTile = new Tile(this.tileSet, 0, 2);
    this.grassHillsTile = new Tile(this.tileSet, 0, 3);
    this.grassForestHillsTile = new Tile(this.tileSet, 0, 4);
    this.grassVillageTile = new Tile(this.tileSet, 1, 0);
    this.grassTownTile = new Tile(this.tileSet, 1, 1);
    this.grassCityTile = new Tile(this.tileSet, 1, 2);
    this.farmTile = new Tile(this.tileSet, 1, 3);

    this.mountainTile = new Tile(this.tileSet, 0, 5);
    this.waterTile = new Tile(this.tileSet, 0, 6);
    this.oceanTile = new Tile(this.tileSet, 0, 7);
    
    this.treeSwampTile = new Tile(this.tileSet, 1, 4);
    this.lightBogTile = new Tile(this.tileSet, 1, 5);
    this.bogTile = new Tile(this.tileSet, 1, 6);
    this.swampTile = new Tile(this.tileSet, 1, 7);

    this.snowTile = new Tile(this.tileSet, 2, 0);
    this.snowLightForestTile = new Tile(this.tileSet, 2, 1);
    this.snowForestTile = new Tile(this.tileSet, 2, 2);
    this.snowHillsTile = new Tile(this.tileSet, 2, 3);
    this.snowForestHillsTile = new Tile(this.tileSet, 2, 4);
    this.snowWaterTile = new Tile(this.tileSet, 2, 5);
    this.snowTownTile = new Tile(this.tileSet, 2, 6);
    this.snowCastleTile = new Tile(this.tileSet, 2, 7);
  }
}

class HexMapGenerator {
  constructor(lowResTileSet) {
    this.lowResTileSet = lowResTileSet;
    this.seed = Math.random() * 10000;
  }

  /**
   * Seeded random number generator for consistent terrain generation
   */
  seededRandom(x, y, seed = this.seed) {
    const sin = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return sin - Math.floor(sin);
  }

  /**
   * Smoothstep interpolation for noise
   */
  smoothstep(t) {
    return t * t * (3.0 - 2.0 * t);
  }

  /**
   * Perlin-like noise function
   */
  noise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const u = this.smoothstep(xf);
    const v = this.smoothstep(yf);

    const n00 = this.seededRandom(xi, yi);
    const n10 = this.seededRandom(xi + 1, yi);
    const n01 = this.seededRandom(xi, yi + 1);
    const n11 = this.seededRandom(xi + 1, yi + 1);

    const nx0 = n00 * (1.0 - u) + n10 * u;
    const nx1 = n01 * (1.0 - u) + n11 * u;
    return nx0 * (1.0 - v) + nx1 * v;
  }

  /**
   * Fractal Brownian motion for layered noise
   */
  fbm(x, y, octaves = 4) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise(x * frequency, y * frequency);
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }

  /**
   * Generate a procedural map and populate the hexMap
   */
  generate(hexMap) {
    const width = hexMap.mapWidth;
    const height = hexMap.mapHeight;
    const tiles = this.lowResTileSet;

    // Generate base terrain
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / 50;
        const ny = y / 50;
        const terrainValue = this.fbm(nx, ny, 4);

        let tile;

        // Determine terrain type based on noise
        if (terrainValue < 0.3) {
          // Water/Ocean
          tile = terrainValue < 0.15 ? tiles.oceanTile : tiles.waterTile;
        } else if (terrainValue < 0.45) {
          // Mountains
          tile = tiles.mountainTile;
        } else if (terrainValue < 0.55) {
          // Forest variations
          const forestVariant = this.fbm(nx * 3, ny * 3, 2);
          if (forestVariant < 0.3) {
            tile = tiles.grassForestTile;
          } else if (forestVariant < 0.6) {
            tile = tiles.grassLightForestTile;
          } else {
            tile = tiles.grassTile;
          }
        } else {
          // Grassland/Plains
          tile = tiles.grassTile;
        }

        // Snow in the north (top portion of map)
        if (y < height * 0.2 && terrainValue > 0.3) {
          if (terrainValue < 0.45) {
            tile = tiles.snowHillsTile;
          } else if (terrainValue < 0.55) {
            const forestVariant = this.fbm(nx * 3, ny * 3, 2);
            if (forestVariant < 0.3) {
              tile = tiles.snowForestTile;
            } else if (forestVariant < 0.6) {
              tile = tiles.snowLightForestTile;
            } else {
              tile = tiles.snowTile;
            }
          } else {
            tile = tiles.snowTile;
          }
        }

        hexMap.setTile(x, y, tile);
      }
    }

    // Add settlements (villages, towns, cities) sparsely
    const settlementDensity = 0.015; // Sparse distribution
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const rand = this.seededRandom(x * 7, y * 11);
        
        // Only place settlements on grass terrain (not water, mountains, snow)
        const currentTile = hexMap.tiles[y][x];
        const isGrassTile = currentTile === tiles.grassTile || 
                           currentTile === tiles.grassLightForestTile ||
                           currentTile === tiles.grassForestTile;

        if (isGrassTile && rand < settlementDensity) {
          const settlementType = this.seededRandom(x * 13, y * 17);
          
          if (settlementType < 0.5) {
            // Village
            hexMap.setTile(x, y, tiles.grassVillageTile);
          } else if (settlementType < 0.8) {
            // Town
            hexMap.setTile(x, y, tiles.grassTownTile);
          } else {
            // City
            hexMap.setTile(x, y, tiles.grassCityTile);
          }
        }
      }
    }

    // Add rivers using water tiles
    const riverDensity = 0.008;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const waterNoise = this.fbm(x / 30, y / 30, 3);
        
        if (waterNoise > 0.65 && waterNoise < 0.75) {
          const currentTile = hexMap.tiles[y][x];
          
          // Only place rivers on non-water terrain
          if (currentTile !== tiles.waterTile && 
              currentTile !== tiles.oceanTile &&
              currentTile !== tiles.snowWaterTile) {
            hexMap.setTile(x, y, tiles.waterTile);
          }
        }
      }
    }

    // Add some swamps in low-lying areas
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const terrainValue = this.fbm(x / 50, y / 50, 4);
        const swampNoise = this.fbm(x / 25, y / 25, 2);

        // Swamps near water but not on water
        if (terrainValue > 0.28 && terrainValue < 0.42 && swampNoise > 0.6) {
          const currentTile = hexMap.tiles[y][x];
          
          if (currentTile === tiles.grassTile || 
              currentTile === tiles.grassLightForestTile) {
            const swampVariant = this.seededRandom(x * 19, y * 23);
            if (swampVariant < 0.4) {
              hexMap.setTile(x, y, tiles.bogTile);
            } else if (swampVariant < 0.7) {
              hexMap.setTile(x, y, tiles.lightBogTile);
            } else {
              hexMap.setTile(x, y, tiles.swampTile);
            }
          }
        }
      }
    }
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
