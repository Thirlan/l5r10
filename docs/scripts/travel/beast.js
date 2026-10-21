import { CLIMATE, RIVER, TERRAIN, VEGETATION } from "../world/world-map-layers.js";
import { SkillCheck } from "../skill-check.js";

const ENCOUNTER_TYPES = new Set(["spirit", "shadowland", "animal", "criminal"]);
const VALID_IDS = Object.freeze({
  terrain: new Set(Object.values(TERRAIN).map(({ id }) => id)),
  climate: new Set(Object.values(CLIMATE).map(({ id }) => id)),
  vegetation: new Set(Object.values(VEGETATION).map(({ id }) => id)),
  river: new Set(Object.values(RIVER).map(({ id }) => id)),
});
const CHECK_FIELDS = ["spotSkillCheck", "avoidSkillCheck", "escapeSkillCheck", "impactSkillCheck"];

export class Beast {
  /**
   * Create one validated creature entry.
   * @param {object} data Creature identity, habitat, checks, and description.
   * @throws {TypeError} If any field is invalid.
   */
  constructor(data) {
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      throw new TypeError("Beast data must be an object.");
    }
    const { name, encounterType, rank, weight, encounterDescription } = data;
    if (typeof name !== "string" || name.trim().length === 0 || !ENCOUNTER_TYPES.has(encounterType) || !Number.isInteger(rank) || rank < 1 || rank > 5 || !Number.isInteger(weight) || weight < 1 || weight > 100 || typeof encounterDescription !== "string" || !/^[^\n.!?]+[.!?]$/.test(encounterDescription.trim())) {
      throw new TypeError("Beast identity, rank, weight, and description are invalid.");
    }

    const fields = {};
    for (const field of ["terrain", "climate", "vegetation", "river"]) {
      if (!Array.isArray(data[field]) || data[field].length === 0 || data[field].some((id) => !VALID_IDS[field].has(id))) {
        throw new TypeError(`Beast ${field} values must be valid, non-empty map ID lists.`);
      }
      fields[field] = Object.freeze([...new Set(data[field])]);
    }
    for (const field of CHECK_FIELDS) {
      if (!Array.isArray(data[field]) || data[field].some((check) => !(check instanceof SkillCheck))) {
        throw new TypeError(`Beast ${field} must contain SkillCheck instances.`);
      }
      if (field === "escapeSkillCheck" && data[field].length === 0) {
        throw new TypeError("Beast escape checks cannot be empty.");
      }
      fields[field] = Object.freeze([...data[field]]);
    }

    Object.assign(this, {
      name,
      encounterType,
      rank,
      weight,
      ...fields,
      encounterDescription: encounterDescription.trim(),
    });
    Object.freeze(this);
  }
}
