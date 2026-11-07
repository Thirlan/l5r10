// @ts-check

/**
 * A data-only, read-only POJO, as defined in the project coding glossary.
 */
export class WorldMapDataTile {
  /**
   * Sets the attributes from validated tile values.
   * Catalog values must be frozen. River flags and the label are copied and frozen.
   * @param {object} values Validated tile values.
   * @param {number} values.x Tile column.
   * @param {number} values.y Tile row.
   * @param {Readonly<{id: number, name: string}>} values.terrain Terrain catalog value.
   * @param {Readonly<{id: number, name: string}>} values.climate Climate catalog value.
   * @param {Readonly<{id: number, name: string}>} values.vegetation Vegetation catalog value.
   * @param {Readonly<{id: number, name: string}>} values.river River catalog value.
   * @param {Readonly<{id: number, name: string}>} values.infrastructure Infrastructure catalog value.
   * @param {Readonly<{id: number, name: string}>} values.clan Clan catalog value.
   * @param {Readonly<{id: number, name: string, englishType: string, rokuganiType: string}>} values.settlement Settlement catalog value.
   * @param {Readonly<{id: number, name: string}>} values.resource Resource catalog value.
   * @param {Readonly<{value: number, name: string}>} values.resourceLevel Resource level catalog value.
   * @param {Readonly<{value: number, name: string}>} values.animal Animal level catalog value.
   * @param {Readonly<{value: number, name: string}>} values.spirit Spirit level catalog value.
   * @param {Readonly<{value: number, name: string}>} values.shadowland Shadowland level catalog value.
   * @param {Readonly<{value: number, name: string}>} values.crime Crime level catalog value.
   * @param {number} values.elevation Elevation in whole metres.
   * @param {readonly [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean]} values.riverDirections Outgoing flags, north first, then clockwise.
   * @param {string} values.englishName English name of the settlement, or an empty text.
   * @param {string} values.rokuganiName Rokugani name of the settlement, or an empty text.
   * @param {Readonly<{englishText: string, rokuganiText: string, fontSize: number|null}>|null} values.label Map label, or null. A null fontSize uses the renderer default.
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
     * @type {readonly [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean]}
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
