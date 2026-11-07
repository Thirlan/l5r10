// @ts-check

import { WorldMapDataTile } from "./world-map-data-tile.js";

/**
 * @typedef {Readonly<Omit<WorldMapDataTile, "riverDirections" | "label">> & {
 *   readonly riverDirections: Readonly<WorldMapDataTile["riverDirections"]>,
 *   readonly label: Readonly<NonNullable<WorldMapDataTile["label"]>> | null
 * }} WorldMapDataTileReadOnly
 */

/** @type {new (values: ConstructorParameters<typeof WorldMapDataTile>[0]) => WorldMapDataTileReadOnly} */
export const WorldMapDataTileReadOnly = class WorldMapDataTileReadOnly extends WorldMapDataTile {
  /** @param {ConstructorParameters<typeof WorldMapDataTile>[0]} values Tile values to copy. */
  constructor(values) {
    super(values);
    Object.freeze(this.riverDirections);
    if (this.label !== null) Object.freeze(this.label);
    Object.freeze(this);
  }
};
