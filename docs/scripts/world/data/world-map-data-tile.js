// @ts-check

/**
 * A data-only, writable tile. Catalog objects stay shared and frozen.
 */
export class WorldMapDataTile {
  /**
   * Sets the attributes from validated tile values.
   * Catalog values must be frozen. River flags and the label are copied.
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
   * @param {{englishText: string, rokuganiText: string, fontSize: number|null}|null} values.label Map label, or null. A null fontSize uses the renderer default.
   */
  constructor(values) {
    // Validation
    const catalogValues = [values.terrain, values.climate, values.vegetation, values.river, values.infrastructure, values.clan, values.settlement, values.resource, values.resourceLevel, values.animal, values.spirit, values.shadowland, values.crime];

    if (catalogValues.some((value) => value === null || typeof value !== "object" || !Object.isFrozen(value))) {
      throw new TypeError("A map tile needs frozen catalog values.");
    }

    // Initialization
    this.x = values.x;
    this.y = values.y;
    this.terrain = values.terrain;
    this.climate = values.climate;
    this.vegetation = values.vegetation;
    this.river = values.river;
    this.infrastructure = values.infrastructure;
    this.clan = values.clan;
    this.settlement = values.settlement;
    this.resource = values.resource;
    this.resourceLevel = values.resourceLevel;
    this.animal = values.animal;
    this.spirit = values.spirit;
    this.shadowland = values.shadowland;
    this.crime = values.crime;
    this.elevation = values.elevation;
    /** @type {[boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean]} */
    this.riverDirections = [...values.riverDirections];
    this.englishName = values.englishName;
    this.rokuganiName = values.rokuganiName;
    this.label = values.label === null ? null : { ...values.label };
  }
}
