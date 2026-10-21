import { CLIMATE, INFRASTRUCTURE, TERRAIN } from "./world-map-layers.js";
import { SkillCheck } from "./skill-check.js";
import { environmentModifier, infrastructureModifier, isBoat, isWater, validateTravelInput } from "./travel-skill-rules.js";
import { RIVER_AGAINST_CURRENT_MODIFIER, TERRAIN_MODIFIER } from "./terrain-skill-check-tn-modifiers.js";

/**
 * Describe ordinary land travel, swimming, or Sailing in the current tile.
 * River swimming and cliff climbing use separate crossing modules.
 * Roads bridge inland water. Infrastructure reduces land exposure.
 * @param {string} mode Transport name from the travel speed module.
 * @param {object} cell Saved map cell with numeric layer IDs.
 * @param {number} direction Movement direction, clockwise from north at zero.
 * @param {boolean} [isAgainstCurrent=false] True for upstream travel.
 * @returns {SkillCheck|null} One check, or null when no check applies.
 * @throws {TypeError} If inputs are invalid or a boat has no water route.
 */
export function getSkillAndTN(mode, cell, direction, isAgainstCurrent = false) {
  // Validate inputs and identify the travel surface.
  cell = validateTravelInput(mode, cell, direction);
  if (typeof isAgainstCurrent !== "boolean") {
    throw new TypeError("Current must be boolean.");
  }
  const boating = isBoat(mode);
  const water = isWater(cell);
  if (boating && !water && cell.river === 0) {
    throw new TypeError("Boat travel needs water or a river.");
  }

  // Keep all Sailing here until it has a separate module.
  if (boating) {
    const waterModifier = water ? TERRAIN_MODIFIER[cell.terrain] : RIVER_AGAINST_CURRENT_MODIFIER[isAgainstCurrent];
    return new SkillCheck("Sailing", "Intelligence", 5 + waterModifier + environmentModifier(cell, true));
  }

  // Unbridged water requires swimming.
  const environment = environmentModifier(cell);
  const infrastructure = infrastructureModifier(cell);
  const hasWaterBridge = cell.terrain === TERRAIN.WATER.id && cell.infrastructure === INFRASTRUCTURE.ROAD.id;
  if (water && !hasWaterBridge) {
    const swimmingTN = Math.max(5, 5 + TERRAIN_MODIFIER[cell.terrain] + environmentModifier(cell, true) + infrastructure);
    return new SkillCheck("Athletics", "Strength", swimmingTN);
  }

  // Compare terrain effort with environmental exposure for land travel.
  const terrain = water ? 0 : TERRAIN_MODIFIER[cell.terrain];
  const tn = Math.max(5, 5 + terrain + environment + infrastructure);
  if (cell.climate === CLIMATE.SHADOWLAND.id) {
    return new SkillCheck("Lore: Shadowlands", "Perception", tn);
  }
  return terrain > environment ? new SkillCheck("Athletics", "Stamina", tn) : new SkillCheck("Survival", "Perception", tn);
}
