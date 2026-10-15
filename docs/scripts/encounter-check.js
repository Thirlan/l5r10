// Initial house rules: probabilities per call for map levels zero through five.
export const ENCOUNTER_CHANCES = Object.freeze([
  0.00001,
  0.00010,
  0.00100,
  0.01000,
  0.10000,
  0.33000]);

const ENCOUNTERS = [
  ["spirit", 20], ["shadowland", 25], ["animal", 15], ["criminal", 20],
];

/**
 * Roll once per type, including level zero. Types use independent rolls.
 * @param {number} spirit Spirit map level from zero to five.
 * @param {number} shadowland Shadowland map level from zero to five.
 * @param {number} animal Animal map level from zero to five.
 * @param {number} criminal Crime map level from zero to five.
 * @returns {string[]} Encounter types that occur, in input order. Empty means none.
 * @throws {TypeError} If a level is invalid.
 */
export function rollEncounter(spirit, shadowland, animal, criminal) {
  const inputs = [spirit, shadowland, animal, criminal];
  if (inputs.some((level) => !Number.isInteger(level) || level < 0 || level > 5)) {
    throw new TypeError("Encounter levels must be map level numbers from zero to five.");
  }
  const chances = inputs.map((level) => ENCOUNTER_CHANCES[level]);

  return ENCOUNTERS.filter((_, index) => {
    const roll = Math.random();
    return roll < chances[index];
  }).map(([type]) => type);
}

/**
 * Initial house rules: choose one alternative to avoid an encounter.
 * Horsemanship needs a mount. Athletics means flee; Stealth means hide.
 * Base TN: spirit 20, shadowland 25, animal 15, criminal 20.
 * These defaults do not model pursuit speed or supernatural detection.
 * @param {string} encounterType Spirit, shadowland, animal, or criminal; case-insensitive.
 * @returns {Array<{skill: string, tn: number}>} Alternative checks; choose one.
 * @throws {TypeError} If the encounter type is unknown.
 */
export function getSkillAndTN(encounterType) {
  const encounter = ENCOUNTERS.find(([type]) =>
    typeof encounterType === "string" && type === encounterType.trim().toLowerCase());
  if (!encounter) throw new TypeError("Unknown encounter type.");
  return ["Horsemanship", "Athletics", "Stealth"].map((skill) => ({ skill, tn: encounter[1] }));
}
