import { CLIMATE, INFRASTRUCTURE, TERRAIN, VEGETATION } from "../data/world-map-data-layers.js";

// Travel speed

// Moving speeds, not daily averages. These estimates exclude rest and survival checks.
// Horse uses a walk; caravan includes loaded carts; ship assumes favorable wind.
export const BASE_SPEED_KMPH = Object.freeze({
  foot: 5,
  horse: 7,
  caravan: 4,
  army: 4,
  "river boat": 6.5,
  ship: 9,
});

/** Speed penalties on land, as a part of the base speed. */
export const TERRAIN_PENALTY = {
  [TERRAIN.FLAT.id]: 0,
  [TERRAIN.HILLS.id]: 0.2,
  [TERRAIN.MOUNTAINS.id]: 0.5,
  [TERRAIN.WETLANDS.id]: 0.35,
};

/** Speed adjustments by climate, on land and on water, as a part of the base speed. */
export const CLIMATE_PENALTY = {
  [CLIMATE.TROPICAL.id]: { land: -0.1 },
  [CLIMATE.POLAR.id]: { land: -0.2, water: -0.35 },
};

/** Speed bonuses on land, as a part of the base speed. */
export const INFRASTRUCTURE_BONUS = {
  [INFRASTRUCTURE.NONE.id]: 0,
  [INFRASTRUCTURE.ROAD.id]: 0.5,
  [INFRASTRUCTURE.FOOTPATH.id]: 0.2,
  [INFRASTRUCTURE.SMALL_PORT.id]: 0,
  [INFRASTRUCTURE.LARGE_PORT.id]: 0,
};

/** Other speed penalties, as a part of the base speed. */
export const SPEED_PENALTY = Object.freeze({
  shipOnRiver: 0.3,
  riverBoatOnCoastalWater: 0.25,
  underBridge: 0.1,
  againstCurrent: 0.25,
  cliff: 0.7,
  vegetation: 0.2,
  riverWithoutBridge: 0.25,
});

/** Speed bonus when a boat moves with the river current, as a part of the base speed. */
export const WITH_CURRENT_BONUS = 0.1;

/** Smallest and largest travel speed, as a part of the base speed. */
export const SPEED_MULTIPLIER_LIMITS = Object.freeze({ min: 0.1, max: 1 });

// Route finding

/** Added minutes for a route step that can cause a mishap. */
export const MISHAP_PENALTY_MIN = 1440;

/** Added cost for a route step that can cause death. */
export const DEATH_PENALTY = 10000;

/** Added cost for a border crossing without travel papers. */
export const NO_TRAVEL_PAPERS_PENALTY = 10000;

/** Added cost for a step into the lands of a clan to avoid. */
export const AVOID_CLAN_PENALTY = 1000;

/** Minutes to board or leave a boat. */
export const BOAT_BOARDING_MIN = 300;

/** Minute of the day when travel starts (08:00). */
export const DAY_START_MIN = 8 * 60;

/** Minute of the day when travel stops (18:00). */
export const DAY_END_MIN = 18 * 60;

// Skill checks

/** Target number (TN) before modifiers of a travel skill check. */
export const BASE_TN = 5;

/** Smallest TN of a travel skill check. */
export const MIN_TN = 5;

/** TN of the Forgery and Stealth checks at a closed border. */
export const BORDER_TN = 20;

/** TN of the Athletics check to climb a cliff of CLIFF_HEIGHT metres. */
export const CLIFF_BASE_TN = 10;

/** Added TN for each CLIFF_TN_STEP_HEIGHT metres of cliff above CLIFF_HEIGHT. */
export const CLIFF_TN_STEP = 5;

/** Cliff height in metres for each CLIFF_TN_STEP. */
export const CLIFF_TN_STEP_HEIGHT = 25;

export const CLIMATE_MODIFIER = {
  [CLIMATE.TEMPERATE.id]: 0,
  [CLIMATE.TROPICAL.id]: 1,
  [CLIMATE.DESERT.id]: 2,
  [CLIMATE.WASTE.id]: 3,
  [CLIMATE.POLAR.id]: 4,
  [CLIMATE.SHADOWLAND.id]: 5,
};

export const WATER_CLIMATE_MODIFIER = {
  [CLIMATE.TEMPERATE.id]: 0,
  [CLIMATE.TROPICAL.id]: 0,
  [CLIMATE.DESERT.id]: 0,
  [CLIMATE.WASTE.id]: 0,
  [CLIMATE.POLAR.id]: 4,
  [CLIMATE.SHADOWLAND.id]: 5,
};

export const VEGETATION_MODIFIER = {
  [VEGETATION.NONE.id]: 0,
  [VEGETATION.PRESENT.id]: 1,
};

export const INFRASTRUCTURE_MODIFIER = {
  [INFRASTRUCTURE.NONE.id]: 0,
  [INFRASTRUCTURE.ROAD.id]: -4,
  [INFRASTRUCTURE.FOOTPATH.id]: -2,
  [INFRASTRUCTURE.SMALL_PORT.id]: 0,
  [INFRASTRUCTURE.LARGE_PORT.id]: 0,
};

export const RIVER_AGAINST_CURRENT_MODIFIER = {
  false: 4,
  true: 8,
};

export const TERRAIN_MODIFIER = {
  [TERRAIN.FLAT.id]: 0,
  [TERRAIN.HILLS.id]: 1,
  [TERRAIN.WETLANDS.id]: 2,
  [TERRAIN.MOUNTAINS.id]: 3,
  [TERRAIN.WATER.id]: 0,
  [TERRAIN.COASTAL_WATER.id]: 12,
  [TERRAIN.OCEAN.id]: 16,
};

// Encounters

/** Chance of an encounter for each encounter level, from none to very high. */
export const ENCOUNTER_CHANCES = Object.freeze([0.00001, 0.0001, 0.001, 0.01, 0.1, 0.33]);
