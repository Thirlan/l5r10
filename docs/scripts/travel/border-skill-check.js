import { INFRASTRUCTURE, LAYERS } from "../world/world-map-layers.js";
import { SkillCheck } from "../skill-check.js";

function validateBorderCell(cell) {
  if (!cell || typeof cell !== "object" || Array.isArray(cell)) {
    throw new TypeError("Border checks need current and destination map cells.");
  }

  const result = {};
  ["clan", "infrastructure"].forEach((layer) => {
    const value = Object.hasOwn(cell, layer) ? cell[layer] : 0;
    if (!Number.isInteger(value) || !LAYERS[layer.toUpperCase()].getValue(value)) {
      throw new TypeError(`Unknown border cell ${layer} ID.`);
    }
    result[layer] = value;
  });
  return result;
}

/**
 * Describe road checkpoint alternatives without checking papers or permissions.
 * Entering or leaving neutral territory also crosses a border.
 * @param {object} cell Current map cell with numeric clan and infrastructure IDs.
 * @param {object} destination Destination map cell with numeric clan and infrastructure IDs.
 * @returns {SkillCheck[]|null} Forgery and Stealth alternatives, or no checkpoint.
 * @throws {TypeError} If either cell or its border layer IDs are invalid.
 */
export function getSkillAndTN(cell, destination) {
  // Validate only the layers needed for a border check.
  cell = validateBorderCell(cell);
  destination = validateBorderCell(destination);

  // A checkpoint requires a clan change and a continuous road.
  const crossesClanBorder = cell.clan !== destination.clan;
  const hasContinuousRoad = cell.infrastructure === INFRASTRUCTURE.ROAD.id && destination.infrastructure === INFRASTRUCTURE.ROAD.id;
  if (crossesClanBorder && hasContinuousRoad) {
    return [new SkillCheck("Forgery", "Intelligence", 20), new SkillCheck("Stealth", "Agility", 20)];
  }
  return null;
}
