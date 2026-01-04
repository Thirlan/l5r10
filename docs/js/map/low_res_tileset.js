import TileSet from './tileset.js';
import Tile from './tile.js';

/**
 * LowResTileSet class - defines a specific low-resolution tileset and its tiles
 */

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