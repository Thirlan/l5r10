/*
Canonical map metadata
Identity values have immutable id and name fields.
Ordered overlays have immutable value and name fields.
Save numeric IDs or levels in map cells, not metadata objects.
LayerDefinition.getValue resolves only the matching numeric value.
Settlement metadata also contains English and Rokugani type labels.
Resource labels use name in both language modes.
Images, palettes, and drawing functions belong in the presentation modules.

Usage
Import catalogs and layer definitions from this module.
Read a value ID: TERRAIN.FLAT.id
Resolve a saved ID: LAYERS.TERRAIN.getValue(0)

Examples
Terrain: TERRAIN.COASTAL_WATER.id
Climate: CLIMATE.TEMPERATE.id
Vegetation: VEGETATION.PRESENT.id
River: RIVER.PRESENT.id
Infrastructure: INFRASTRUCTURE.SMALL_PORT.id
Clan: CLAN.CRAB.id
Settlement: SETTLEMENT.LARGE_SHRINE.id
Resource: RESOURCE.IRON_MINE.id
Animal: ANIMAL.HIGH.value
Spirit: SPIRIT.MEDIUM.value
Shadowland: SHADOWLAND.LOW.value
Crime: CRIME.VERY_HIGH.value
Resource level: RESOURCE_LEVEL.HIGH.value
Compare levels: SHADOWLAND.HIGH.value > SHADOWLAND.LOW.value
*/

export class LayerValue {
  constructor(id, name) {
    if (!Number.isInteger(id) || typeof name !== "string" || name.length === 0) {
      throw new TypeError("Layer values need an integer ID and a name.");
    }

    Object.defineProperties(this, {
      id: { value: id, enumerable: true },
      name: { value: name, enumerable: true },
    });
    if (new.target === LayerValue) Object.freeze(this);
  }
}

export class SettlementValue extends LayerValue {
  constructor(id, name, englishType, rokuganiType) {
    if (typeof englishType !== "string" || typeof rokuganiType !== "string") {
      throw new TypeError("Settlement type labels must be strings.");
    }
    super(id, name);
    Object.defineProperties(this, {
      englishType: { value: englishType, enumerable: true },
      rokuganiType: { value: rokuganiType, enumerable: true },
    });
    Object.freeze(this);
  }
}

export class LevelValue {
  /**
   * @param {number} value Ordered level from zero to five.
   * @param {string} name Display name.
   */
  constructor(value, name) {
    if (!Number.isInteger(value) || value < 0 || value > 5 || typeof name !== "string" || !name) {
      throw new TypeError("Levels need an integer value from zero to five and a name.");
    }
    this.value = value;
    this.name = name;
    Object.freeze(this);
  }
}

export class LayerDefinition {
  #valueByNumber;

  constructor(id, name, values) {
    if (typeof id !== "string" || id.length === 0 || typeof name !== "string" || name.length === 0) {
      throw new TypeError("Layer definitions need an ID and a name.");
    }
    if (!Array.isArray(values) || values.some((value) => !(value instanceof LayerValue)
      && !(value instanceof LevelValue))) {
      throw new TypeError("Layer definitions need an array of metadata values.");
    }
    if (values.some((value) => (value instanceof LevelValue) !== (values[0] instanceof LevelValue))) {
      throw new TypeError("Layer definitions cannot mix metadata types.");
    }
    if (new Set(values.map((value) => value instanceof LevelValue ? value.value : value.id)).size !== values.length) {
      throw new TypeError("Layer values must be unique within a layer.");
    }

    this.id = id;
    this.name = name;
    this.values = Object.freeze([...values]);
    this.#valueByNumber = new Map(this.values.map((value) => [
      value instanceof LevelValue ? value.value : value.id, value,
    ]));
    Object.freeze(this);
  }

  /**
   * @param {number} number Saved identity ID or ordered level value.
   * @returns {LayerValue|LevelValue|undefined} Matching metadata.
   */
  getValue(number) {
    return this.#valueByNumber.get(number);
  }
}

function createValues(entries, ValueType = LayerValue) {
  return Object.freeze(Object.fromEntries(
    entries.map(([key, ...valueArgs]) => [key, new ValueType(...valueArgs)]),
  ));
}

export const TERRAIN = createValues([
  ["FLAT", 0, "flat"], ["HILLS", 1, "hills"], ["MOUNTAINS", 2, "mountains"],
  ["WATER", 3, "water"], ["COASTAL_WATER", 4, "coastal water"], ["OCEAN", 5, "ocean"],
  ["WETLANDS", 7, "wetlands"], ["CLIFF", 8, "cliff"],
]);

export const CLIMATE = createValues([
  ["TEMPERATE", 0, "temperate"], ["TROPICAL", 1, "tropical"], ["DESERT", 2, "desert"],
  ["POLAR", 3, "polar"], ["WASTE", 4, "waste"], ["SHADOWLAND", 5, "shadowland"],
]);

export const VEGETATION = createValues([
  ["NONE", 0, "none"], ["PRESENT", 1, "Vegetation"],
]);

export const RIVER = createValues([
  ["NONE", 0, "none"], ["PRESENT", 1, "River"],
]);

export const INFRASTRUCTURE = createValues([
  ["NONE", 0, "none"], ["ROAD", 1, "Road"], ["FOOTPATH", 2, "Footpath"],
  ["SMALL_PORT", 3, "Small Port"], ["LARGE_PORT", 4, "Large Port"],
]);

export const CLAN = createValues([
  ["NONE", 0, "none"], ["CRAB", 1, "Crab"], ["CRANE", 2, "Crane"],
  ["DRAGON", 3, "Dragon"], ["LION", 4, "Lion"], ["PHOENIX", 5, "Phoenix"],
  ["SCORPION", 6, "Scorpion"], ["UNICORN", 7, "Unicorn"], ["IMPERIAL", 8, "Imperial"],
  ["HARE", 9, "Hare"], ["CENTIPEDE", 10, "Centipede"], ["FOX", 11, "Fox"],
  ["BADGER", 12, "Badger"], ["DRAGONFLY", 13, "Dragonfly"], ["FALCON", 14, "Falcon"],
  ["SPARROW", 15, "Sparrow"], ["TORTOISE", 16, "Tortoise"], ["MANTIS", 17, "Mantis"],
  ["SHADOWLANDS", 18, "Shadowlands"],
]);

export const SETTLEMENT = createValues([
  ["NONE", 0, "none", "", ""],
  ["VILLAGE", 1, "Village", "Village", "Mura"],
  ["CITY", 2, "City", "City", "Toshi"],
  ["CAPITAL", 3, "Capital", "Capital", "Shuto"],
  ["FORTIFICATION", 4, "Fortification", "Fortification", ""],
  ["CASTLE", 5, "Castle", "Castle", "Shiro"],
  ["KYUDEN", 6, "Kyuden", "Palace", "Kyuden"],
  ["SMALL_SHRINE", 10, "Small Shrine", "Small Shrine", "Shōsha"],
  ["LARGE_SHRINE", 11, "Large Shrine", "Large Shrine", "Taisha"],
  ["VILLAGE_RUINS", 12, "Village Ruins", "Village Ruins", ""],
  ["CASTLE_RUINS", 13, "Castle Ruins", "Castle Ruins", ""],
  ["ACADEMY", 14, "Academy", "Academy", ""],
  ["WATCHTOWER", 15, "Watchtower", "Watchtower", ""],
  ["SMALL_TEMPLE", 16, "Small Temple", "Small Temple", ""],
  ["LARGE_TEMPLE", 17, "Large Temple", "Large Temple", ""],
], SettlementValue);

export const RESOURCE = createValues([
  ["NONE", 0, "none"], ["IRON_MINE", 1, "Iron Mine"], ["LUMBER_MILL", 2, "Lumber Mill"],
  ["RICE_PADDY", 3, "Rice Paddy"], ["GRAIN_FARM", 4, "Grain Farm"], ["SILK_FARM", 5, "Silk Farm"],
  ["TEA_PLANTATION", 6, "Tea Plantation"], ["HEMP_FARM", 7, "Hemp Farm"],
  ["COTTON_FARM", 8, "Cotton Farm"], ["FRUIT_ORCHARD", 9, "Fruit Orchard"],
  ["SHEEP_PASTURE", 10, "Sheep Pasture"], ["GOAT_PASTURE", 11, "Goat Pasture"],
  ["HORSE_RANCH", 12, "Horse Ranch"], ["CATTLE_FARM", 13, "Cattle Farm"],
  ["SALT_WORKS", 14, "Salt Works"], ["NUT_GROVE", 15, "Nut Grove"],
  ["MUSHROOM_FARM", 16, "Mushroom Farm"], ["SPICE_FARM", 17, "Spice Farm"],
  ["POULTRY_FARM", 18, "Poultry Farm"], ["POPPY_FARM", 19, "Poppy Farm"],
  ["DYE_CROP_FARM", 20, "Dye Crop Farm"], ["JADE_MINE", 21, "Jade Mine"],
  ["COPPER_MINE", 22, "Copper Mine"], ["GOLD_MINE", 23, "Gold Mine"],
  ["SILVER_MINE", 24, "Silver Mine"], ["COAL_MINE", 25, "Coal Mine"],
  ["CLAY_PIT", 26, "Clay Pit"], ["GEMSTONE_MINE", 27, "Gemstone Mine"],
  ["STONE_QUARRY", 28, "Stone Quarry"], ["COASTAL_FISH_BOAT", 29, "Coastal Fish Boat"],
  ["CRAB_BOAT", 30, "Crab Boat"], ["PEARL_DIVERS", 31, "Pearl Divers"],
  ["SHELLFISH_BOAT", 32, "Shellfish Boat"], ["SQUID_BOAT", 33, "Squid Boat"],
  ["OCEAN_FISH_BOAT", 34, "Ocean Fish Boat"], ["KELP_FARM", 35, "Kelp Farm"],
  ["TROPICAL_FRUIT_ORCHARD", 36, "Tropical Fruit Orchard"],
  ["TROPICAL_LUMBER_MILL", 37, "Tropical Lumber Mill"], ["UTAKU_RANCH", 38, "Utaku Ranch"],
  ["VEGETABLE_FARM", 39, "Vegetable Farm"],
]);

function createLevels() {
  return createValues(["None", "Very Low", "Low", "Medium", "High", "Very High"].map(
    (name, value) => [name.toUpperCase().replaceAll(" ", "_"), value, name],
  ), LevelValue);
}

export const ANIMAL = createLevels();
export const SPIRIT = createLevels();
export const SHADOWLAND = createLevels();
export const CRIME = createLevels();
export const RESOURCE_LEVEL = createLevels();

export const LAYERS = Object.freeze({
  TERRAIN: new LayerDefinition("terrain", "Terrain Layer", Object.values(TERRAIN)),
  CLIMATE: new LayerDefinition("climate", "Climate Layer", Object.values(CLIMATE)),
  VEGETATION: new LayerDefinition("vegetation", "Vegetation Layer", Object.values(VEGETATION)),
  RIVER: new LayerDefinition("river", "River Layer", Object.values(RIVER)),
  INFRASTRUCTURE: new LayerDefinition("infrastructure", "Infrastructure Layer", Object.values(INFRASTRUCTURE)),
  CLAN: new LayerDefinition("clan", "Clan Layer", Object.values(CLAN)),
  SETTLEMENT: new LayerDefinition("settlement", "Settlement Layer", Object.values(SETTLEMENT)),
  RESOURCE: new LayerDefinition("resource", "Resource Layer", Object.values(RESOURCE)),
  ANIMAL: new LayerDefinition("animal", "Animal Layer", Object.values(ANIMAL)),
  SPIRIT: new LayerDefinition("spirit", "Spirit Layer", Object.values(SPIRIT)),
  SHADOWLAND: new LayerDefinition("shadowland", "Shadowland Layer", Object.values(SHADOWLAND)),
  CRIME: new LayerDefinition("crime", "Crime Layer", Object.values(CRIME)),
  RESOURCE_LEVEL: new LayerDefinition("resourceLevel", "Resource Level", Object.values(RESOURCE_LEVEL)),
});
