// @ts-check

/**
 * The values of one tile. Catalog values are shared, frozen metadata objects.
 * The map tile factory validates saved cells and supplies these values.
 *
 * @typedef {object} WorldMapTileData
 * @property {number} x Tile column.
 * @property {number} y Tile row.
 * @property {Readonly<{id: number, name: string}>} terrain Terrain catalog value.
 * @property {Readonly<{id: number, name: string}>} climate Climate catalog value.
 * @property {Readonly<{id: number, name: string}>} vegetation Vegetation catalog value.
 * @property {Readonly<{id: number, name: string}>} river River catalog value.
 * @property {Readonly<{id: number, name: string}>} infrastructure Infrastructure catalog value.
 * @property {Readonly<{id: number, name: string}>} clan Clan catalog value.
 * @property {Readonly<{id: number, name: string, englishType: string, rokuganiType: string}>} settlement Settlement catalog value.
 * @property {Readonly<{id: number, name: string}>} resource Resource catalog value.
 * @property {Readonly<{value: number, name: string}>} resourceLevel Resource level catalog value.
 * @property {Readonly<{value: number, name: string}>} animal Animal level catalog value.
 * @property {Readonly<{value: number, name: string}>} spirit Spirit level catalog value.
 * @property {Readonly<{value: number, name: string}>} shadowland Shadowland level catalog value.
 * @property {Readonly<{value: number, name: string}>} crime Crime level catalog value.
 * @property {number} elevation Elevation in whole metres.
 * @property {readonly [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean]} riverDirections Outgoing flags, north first, then clockwise.
 * @property {string} englishName English name of the settlement, or an empty text.
 * @property {string} rokuganiName Rokugani name of the settlement, or an empty text.
 * @property {Readonly<{englishText: string, rokuganiText: string, fontSize: number|null}>|null} label Map label, or null. A null fontSize uses the renderer default.
 */

/**
 * A data-only, read-only POJO, as defined in the project coding glossary.
 * @implements {Readonly<WorldMapTileData>}
 */
export class WorldMapTile {
  /**
   * Sets the attributes from validated tile values.
   * Catalog values must be frozen. River flags and the label are copied and frozen.
   * @param {Readonly<WorldMapTileData>} values Validated tile values.
   */
  constructor(values) {
    // Validation
    const catalogValues = [values.terrain, values.climate, values.vegetation, values.river, values.infrastructure, values.clan, values.settlement, values.resource, values.resourceLevel, values.animal, values.spirit, values.shadowland, values.crime];

    if (catalogValues.some((value) => value === null || typeof value !== "object" || !Object.isFrozen(value))) {
      throw new TypeError("A map tile needs frozen catalog values.");
    }

    // Initialization
    /** @readonly */
    this.x = values.x;
    /** @readonly */
    this.y = values.y;
    /** @readonly */
    this.terrain = values.terrain;
    /** @readonly */
    this.climate = values.climate;
    /** @readonly */
    this.vegetation = values.vegetation;
    /** @readonly */
    this.river = values.river;
    /** @readonly */
    this.infrastructure = values.infrastructure;
    /** @readonly */
    this.clan = values.clan;
    /** @readonly */
    this.settlement = values.settlement;
    /** @readonly */
    this.resource = values.resource;
    /** @readonly */
    this.resourceLevel = values.resourceLevel;
    /** @readonly */
    this.animal = values.animal;
    /** @readonly */
    this.spirit = values.spirit;
    /** @readonly */
    this.shadowland = values.shadowland;
    /** @readonly */
    this.crime = values.crime;
    /** @readonly */
    this.elevation = values.elevation;
    /**
     * @readonly
     * @type {WorldMapTileData["riverDirections"]}
     */
    this.riverDirections = Object.freeze([...values.riverDirections]);
    /** @readonly */
    this.englishName = values.englishName;
    /** @readonly */
    this.rokuganiName = values.rokuganiName;
    /** @readonly */
    this.label = values.label === null ? null : Object.freeze({ ...values.label });

    // Output
    Object.freeze(this);
  }
}
