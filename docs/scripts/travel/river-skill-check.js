import { bypassesCrossing, crossesWithinCell, crossingCheck, validateTravelInput, validateTravelNeighbors } from "./travel-skill-rules.js";

function crossesDiagonalRiver(neighbors, direction) {
  // Only diagonal movement can cross a river between flanking cells.
  if (direction % 2 === 0) {
    return false;
  }
  const first = neighbors[(direction + 7) % 8];
  const second = neighbors[(direction + 1) % 8];
  if (!first || !second || first.river === 0 || second.river === 0) {
    return false;
  }

  const connection = (direction + 2) % 8;
  return first["river direction"][connection] === 1 || second["river direction"][(connection + 4) % 8] === 1;
}

/**
 * Describe each river crossing, inside the current cell and between cells.
 * Keep ordinary river Sailing in the terrain check module.
 * @param {string} mode Transport name.
 * @param {object} cell Current saved map cell with numeric layer IDs.
 * @param {Array<object|null>} neighbors Eight cells, clockwise from north.
 * @param {number} direction Destination index from zero to seven.
 * @param {boolean} [isAgainstCurrent=false] True for upstream river travel.
 * @returns {import("../skill-check.js").SkillCheck[]} Crossing checks, or an empty array.
 * @throws {TypeError} If any travel input is invalid.
 */
export function getSkillAndTN(mode, cell, neighbors, direction, isAgainstCurrent = false) {
  // Validate the current cell, neighbors, and current flag.
  cell = validateTravelInput(mode, cell, direction);
  neighbors = validateTravelNeighbors(mode, neighbors, direction);
  if (typeof isAgainstCurrent !== "boolean") {
    throw new TypeError("Current must be boolean.");
  }
  const checks = [];
  const sourceBypass = bypassesCrossing(mode, cell, "river");

  // The current cell and the diagonal barrier are separate crossings.
  if (cell.river !== 0 && crossesWithinCell(cell, direction, "river") && !sourceBypass) {
    checks.push(crossingCheck(mode, cell, "river", isAgainstCurrent));
  }

  const hasContinuousBridge = sourceBypass && bypassesCrossing(mode, neighbors[direction], "river");
  if (crossesDiagonalRiver(neighbors, direction) && !hasContinuousBridge) {
    checks.push(crossingCheck(mode, cell, "river", isAgainstCurrent));
  }
  return checks;
}
