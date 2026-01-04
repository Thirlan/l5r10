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

export default HexMapGenerator;