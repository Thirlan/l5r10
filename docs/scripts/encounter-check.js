import { BeastSelection } from "./beast-selection.js";
import { BEASTIARY } from "./beastiary.js";
import { CLIMATE, RIVER, TERRAIN, VEGETATION } from "./world-map-layers.js";

export const ENCOUNTER_CHANCES = Object.freeze([0.00001, 0.0001, 0.001, 0.01, 0.1, 0.33]);

const ENCOUNTER_TYPES = Object.freeze(["criminal", "animal", "spirit", "shadowland"]);
const MAP_CATALOGS = Object.freeze({
  terrain: TERRAIN,
  climate: CLIMATE,
  vegetation: VEGETATION,
  river: RIVER,
});
const LOOKUP_TABLES = new Map();

function keyFor(encounterType, terrain, climate, vegetation, river) {
  return [encounterType, terrain, climate, vegetation, river].join(":");
}

function isKnownMapId(field, id) {
  return Number.isInteger(id) && Object.values(MAP_CATALOGS[field]).some((value) => value.id === id);
}

export class BeastiaryLookUpTable {
  /**
   * Create an empty lookup table for one map cell.
   * @param {number} terrain Terrain catalog ID.
   * @param {number} climate Climate catalog ID.
   * @param {number} vegetation Vegetation catalog ID.
   * @param {number} river River catalog ID.
   * @throws {TypeError} If any map ID is unknown.
   */
  constructor(terrain, climate, vegetation, river) {
    if (!isKnownMapId("terrain", terrain) || !isKnownMapId("climate", climate) || !isKnownMapId("vegetation", vegetation) || !isKnownMapId("river", river)) {
      throw new TypeError("Lookup table map values must be known catalog IDs.");
    }
    Object.assign(this, { terrain, climate, vegetation, river, diceRollSize: 0, beastList: [] });
  }

  /**
   * Add one beast and assign its inclusive and exclusive weighted range.
   * @param {import("./beast.js").Beast} beast Beast to add.
   * @returns {BeastSelection} Weighted entry added to the table.
   * @throws {TypeError} If the table is frozen or the value is not a Beast.
   */
  add(beast) {
    if (Object.isFrozen(this) || !beast || typeof beast !== "object" || !Number.isInteger(beast.weight) || beast.weight < 1) {
      throw new TypeError("A mutable lookup table needs a beast with a positive integer weight.");
    }
    const selection = new BeastSelection(beast, this.diceRollSize, this.diceRollSize + beast.weight);
    this.diceRollSize += beast.weight;
    this.beastList.push(selection);
    return selection;
  }

  /**
   * Select a beast by its weighted range.
   * @returns {BeastSelection|undefined} Selected beast, or undefined for an empty table.
   */
  select() {
    if (this.diceRollSize === 0) return undefined;
    const roll = Math.floor(Math.random() * this.diceRollSize);
    return this.beastList.find(({ selectionFrom, selectionTo }) => selectionFrom <= roll && roll < selectionTo);
  }

  /**
   * Freeze the completed table and its weighted entries.
   * @returns {BeastiaryLookUpTable} This immutable table.
   */
  freeze() {
    Object.freeze(this.beastList);
    return Object.freeze(this);
  }
}

function buildLookUpTables() {
  const terrains = Object.values(TERRAIN);
  const climates = Object.values(CLIMATE);
  const vegetationValues = Object.values(VEGETATION);
  const rivers = Object.values(RIVER);

  ENCOUNTER_TYPES.forEach((encounterType) => {
    terrains.forEach(({ id: terrain }) => {
      climates.forEach(({ id: climate }) => {
        vegetationValues.forEach(({ id: vegetation }) => {
          rivers.forEach(({ id: river }) => {
            const table = new BeastiaryLookUpTable(terrain, climate, vegetation, river);
            BEASTIARY.filter((beast) => beast.encounterType === encounterType && beast.terrain.includes(terrain) && beast.climate.includes(climate) && beast.vegetation.includes(vegetation) && beast.river.includes(river)).forEach((beast) => table.add(beast));
            LOOKUP_TABLES.set(keyFor(encounterType, terrain, climate, vegetation, river), table.freeze());
          });
        });
      });
    });
  });
}

buildLookUpTables();

/**
 * Get the weighted table for an encounter type and map-cell values.
 * @param {string} encounterType Encounter category.
 * @param {number} terrain Terrain catalog ID.
 * @param {number} climate Climate catalog ID.
 * @param {number} vegetation Vegetation catalog ID.
 * @param {number} river River catalog ID.
 * @returns {BeastiaryLookUpTable} Matching immutable table.
 * @throws {TypeError} If the type or any map ID is unknown.
 */
export function getLookUpTable(encounterType, terrain, climate, vegetation, river) {
  if (!ENCOUNTER_TYPES.includes(encounterType) || !isKnownMapId("terrain", terrain) || !isKnownMapId("climate", climate) || !isKnownMapId("vegetation", vegetation) || !isKnownMapId("river", river)) {
    throw new TypeError("Encounter type and map values must be valid catalog values.");
  }
  return LOOKUP_TABLES.get(keyFor(encounterType, terrain, climate, vegetation, river));
}

/**
 * Roll each encounter type once and select a matching beast for every success.
 * @param {number} criminal Crime map level from zero to five.
 * @param {number} animal Animal map level from zero to five.
 * @param {number} spirit Spirit map level from zero to five.
 * @param {number} shadowland Shadowland map level from zero to five.
 * @param {number} terrain Terrain catalog ID.
 * @param {number} climate Climate catalog ID.
 * @param {number} vegetation Vegetation catalog ID.
 * @param {number} river River catalog ID.
 * @returns {BeastSelection[]} Selected encounters in argument order; empty means none.
 * @throws {TypeError} If a level or map ID is invalid.
 */
export function rollEncounter(criminal, animal, spirit, shadowland, terrain, climate, vegetation, river) {
  const levels = [criminal, animal, spirit, shadowland];
  if (levels.some((level) => !Number.isInteger(level) || level < 0 || level > 5)) {
    throw new TypeError("Encounter levels must be map level numbers from zero to five.");
  }
  if (!isKnownMapId("terrain", terrain) || !isKnownMapId("climate", climate) || !isKnownMapId("vegetation", vegetation) || !isKnownMapId("river", river)) {
    throw new TypeError("Encounter map values must be known catalog IDs.");
  }

  return ENCOUNTER_TYPES.flatMap((encounterType, index) => {
    if (Math.random() >= ENCOUNTER_CHANCES[levels[index]]) return [];
    const beast = getLookUpTable(encounterType, terrain, climate, vegetation, river).select();
    return beast ? [beast] : [];
  });
}
