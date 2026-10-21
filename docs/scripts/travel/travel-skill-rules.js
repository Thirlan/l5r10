import { INFRASTRUCTURE, LAYERS, TERRAIN } from "../world/world-map-layers.js";
import { BASE_SPEED_KMPH } from "./travel-speed.js";
import { RIVER_OFFSETS } from "../world/world-map-img-river.js";
import { SkillCheck } from "../skill-check.js";
import { CLIMATE_MODIFIER, WATER_CLIMATE_MODIFIER, VEGETATION_MODIFIER, INFRASTRUCTURE_MODIFIER, RIVER_AGAINST_CURRENT_MODIFIER } from "./terrain-skill-check-tn-modifiers.js";

const CELL_LAYERS = ["terrain", "climate", "vegetation", "river", "infrastructure", "clan"];

/**
 * Validate and fill missing map layers without changing the saved cell.
 * @param {string} mode Transport name from the travel speed module.
 * @param {object} cell Saved map cell. Layer values must be numeric IDs.
 * @param {number} direction Movement direction, clockwise from north at zero.
 * @returns {object} Cell with explicit layer IDs.
 * @throws {TypeError} If transport, layers, flags, or directions are invalid.
 */
export function validateTravelInput(mode, cell, direction) {
  // Validate the transport, movement direction, and cell container.
  if (typeof mode !== "string" || !Object.hasOwn(BASE_SPEED_KMPH, mode) || !Number.isInteger(direction) || direction < 0 || direction > 7) {
    throw new TypeError("Travel needs a known transport name and a direction from zero to seven.");
  }
  if (!cell || typeof cell !== "object" || Array.isArray(cell)) {
    throw new TypeError("Travel needs a map cell.");
  }
  // Resolve missing layers before checking layer combinations.
  const result = { ...cell };
  CELL_LAYERS.forEach((layer) => {
    const value = Object.hasOwn(cell, layer) ? cell[layer] : 0;
    if (!Number.isInteger(value) || !LAYERS[layer.toUpperCase()].getValue(value)) {
      throw new TypeError(`Unknown travel cell ${layer} ID.`);
    }
    result[layer] = value;
  });
  if (isWater(result) && (result.vegetation !== 0 || result.river !== 0)) {
    throw new TypeError("Water cannot have vegetation or a river.");
  }

  // Active barriers require at least one saved direction.
  ["river direction", "cliff direction"].forEach((layer) => {
    const flags = result[layer];
    const required = layer === "river direction" ? result.river !== 0 : result.terrain === TERRAIN.CLIFF.id;
    if (flags === undefined && !required) {
      return;
    }
    if (!flags || typeof flags !== "object" || Array.isArray(flags)) {
      throw new TypeError(`Travel needs valid ${layer} flags.`);
    }

    const hasInvalidFlag = Object.entries(flags).some(([key, value]) => !/^[0-7]$/.test(key) || (value !== 0 && value !== 1));
    const missingRequiredDirection = required && !Object.values(flags).includes(1);
    if (hasInvalidFlag || missingRequiredDirection) {
      throw new TypeError(`Travel needs valid ${layer} flags.`);
    }
  });
  return result;
}

/**
 * Validate all neighboring cells and require a destination.
 * @param {string} mode Transport name.
 * @param {Array<object|null>} neighbors Eight cells, clockwise from north.
 * @param {number} direction Destination index from zero to seven.
 * @returns {Array<object|null>} Validated cells with explicit layer IDs.
 * @throws {TypeError} If neighbors or the selected destination are invalid.
 */
export function validateTravelNeighbors(mode, neighbors, direction) {
  if (!Array.isArray(neighbors) || neighbors.length !== 8) {
    throw new TypeError("Traversal needs eight neighbors.");
  }

  const cells = Array.from(neighbors, (neighbor) => (neighbor === null ? null : validateTravelInput(mode, neighbor, direction)));
  if (!cells[direction]) {
    throw new TypeError("The traversal destination is outside the map.");
  }
  return cells;
}

/**
 * @param {object} cell Validated cell.
 * @returns {boolean} True for inland water, coastal water, or ocean.
 */
export function isWater(cell) {
  return [TERRAIN.WATER.id, TERRAIN.COASTAL_WATER.id, TERRAIN.OCEAN.id].includes(cell.terrain);
}

/**
 * @param {string} mode Validated transport name.
 * @returns {boolean} True for either boat transport.
 */
export function isBoat(mode) {
  return mode === "river boat" || mode === "ship";
}

/**
 * @param {object} cell Validated cell.
 * @param {boolean} [onWater=false] True for sailing, swimming, or river crossings.
 * @returns {number} Combined climate and vegetation modifier.
 */
export function environmentModifier(cell, onWater = false) {
  const climateModifier = onWater ? WATER_CLIMATE_MODIFIER : CLIMATE_MODIFIER;
  return climateModifier[cell.climate] + VEGETATION_MODIFIER[cell.vegetation];
}

/**
 * @param {object} cell Validated cell.
 * @returns {number} Infrastructure TN modifier.
 */
export function infrastructureModifier(cell) {
  return INFRASTRUCTURE_MODIFIER[cell.infrastructure];
}

/**
 * @param {string} mode Validated transport name.
 * @param {object} cell Validated cell.
 * @param {string} feature River or cliff.
 * @returns {boolean} True when infrastructure bypasses the crossing.
 */
export function bypassesCrossing(mode, cell, feature) {
  if (feature === "river" && isBoat(mode)) {
    return false;
  }

  const hasRoad = cell.infrastructure === INFRASTRUCTURE.ROAD.id;
  const hasFootpath = cell.infrastructure === INFRASTRUCTURE.FOOTPATH.id;
  const footpathBypassesFeature = feature === "river" || mode === "foot";
  return hasRoad || (hasFootpath && footpathBypassesFeature);
}

/**
 * @param {string} mode Validated transport name.
 * @param {object} cell Validated cell supplying environmental modifiers.
 * @param {string} feature River or cliff.
 * @param {boolean} isAgainstCurrent True for upstream river travel.
 * @returns {SkillCheck} One physical crossing check.
 */
export function crossingCheck(mode, cell, feature, isAgainstCurrent) {
  // Compute crossing difficulty before selecting the skill and trait.
  const sailing = feature === "river" && isBoat(mode);
  const baseTN = feature === "river" ? 5 + RIVER_AGAINST_CURRENT_MODIFIER[isAgainstCurrent] : 9;
  const infrastructure = sailing ? 0 : infrastructureModifier(cell);
  const tn = Math.max(5, baseTN + environmentModifier(cell, feature === "river") + infrastructure);

  const skill = sailing ? "Sailing" : "Athletics";
  const trait = sailing ? "Intelligence" : "Strength";
  return new SkillCheck(skill, trait, tn);
}

/**
 * @param {object} cell Validated cell.
 * @param {number} direction Movement direction.
 * @param {string} feature River or cliff.
 * @returns {boolean} True when movement crosses the saved feature.
 */
export function crossesWithinCell(cell, direction, feature) {
  const [, movementX, movementY] = RIVER_OFFSETS[direction];

  // Compare movement with each active flow direction or cliff normal.
  return Object.entries(cell[`${feature} direction`] ?? {}).some(([index, enabled]) => {
    if (enabled !== 1) {
      return false;
    }

    const [, featureX, featureY] = RIVER_OFFSETS[Number(index)];
    if (feature === "river") {
      return movementX * featureY !== movementY * featureX;
    }

    const normalMovement = movementX * featureX + movementY * featureY;
    return Number(index) % 2 === 0 ? normalMovement > 0 : normalMovement !== 0;
  });
}
