import { SPIRIT, SHADOWLAND, ANIMAL, CRIME } from "./world-map-layers.js";

// Initial house rules: probabilities per call for map levels zero through five.
export const ENCOUNTER_CHANCES = Object.freeze([0, 0.05, 0.1, 0.2, 0.3, 0.5]);
const ENCOUNTERS = [
  ["spirit", SPIRIT, 20], ["shadowland", SHADOWLAND, 25],
  ["animal", ANIMAL, 15], ["criminal", CRIME, 20],
];

/**
 * Roll once per type, including level zero. Types use independent rolls.
 * @param {number|string|object} spirit Spirit level, name, or metadata.
 * @param {number|string|object} shadowland Shadowland level, name, or metadata.
 * @param {number|string|object} animal Animal level, name, or metadata.
 * @param {number|string|object} criminal Crime level, name, or metadata.
 * @param {function(): number} [random=Math.random] Random source in the range [0, 1).
 * @returns {string[]} Encounter types that occur, in input order. Empty means none.
 * @throws {TypeError} If a level or random source is invalid.
 */
export function rollEncounter(spirit, shadowland, animal, criminal, random = Math.random) {
  const inputs = [spirit, shadowland, animal, criminal];
  const chances = ENCOUNTERS.map(([, catalog], index) => {
    const input = inputs[index];
    const level = Object.values(catalog).find(({ value, name }) => value === input || value === input?.value
      || (typeof input === "string" && name.toLowerCase() === input.trim().toLowerCase()));
    if (!level) throw new TypeError("Encounter levels must be map levels from zero to five.");
    return ENCOUNTER_CHANCES[level.value];
  });
  if (typeof random !== "function") throw new TypeError("Random source must be a function.");
  return ENCOUNTERS.filter((_, index) => {
    const roll = random();
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
      throw new TypeError("Random values must be in the range [0, 1).");
    }
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
  return ["Horsemanship", "Athletics", "Stealth"].map((skill) => ({ skill, tn: encounter[2] }));
}
