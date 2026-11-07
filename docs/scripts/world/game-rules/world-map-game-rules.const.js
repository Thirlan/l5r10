/** Minutes in one day. */
export const MINUTES_PER_DAY = 24 * 60;

/** Cost multiplier of a diagonal step, about the square root of 2. */
export const DIAGONAL_COST_MULTIPLIER = 1.41;

/** Travel mode names that route finding uses. */
export const MODE_FOOT = "foot";
export const MODE_RIVER_BOAT = "river boat";
export const MODE_SHIP = "ship";
export const MODE_SWIM = "swim";

/** Encounter types, in the order of an encounter check. */
export const ENCOUNTER_TYPES = Object.freeze(["criminal", "animal", "spirit", "shadowland"]);

/** Travel skills of the map viewer party table, as [key, label] pairs. */
export const TRAVEL_SKILLS = Object.freeze([
  ["survival", "Survival"],
  ["sailing", "Sailing"],
  ["investigate", "Investigation"],
  ["swim", "Swim"],
  ["sneak", "Sneak"],
  ["forgery", "Forgery"],
]);
