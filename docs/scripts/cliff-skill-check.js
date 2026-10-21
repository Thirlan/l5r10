import { TERRAIN } from "./world-map-layers.js";
import { bypassesCrossing, crossesWithinCell, crossingCheck, validateTravelInput, validateTravelNeighbors } from "./travel-skill-rules.js";

function crossesDiagonalCliff(neighbors, direction) {
  // Match cliff normals on both sides of a diagonal move.
  if (direction % 2 === 0) {
    return false;
  }
  const first = neighbors[(direction + 7) % 8];
  const second = neighbors[(direction + 1) % 8];
  if (!first || !second) {
    return false;
  }

  const hasDiagonal = (cell) => {
    if (cell.terrain !== TERRAIN.CLIFF.id) {
      return false;
    }
    return cell["cliff direction"][direction] === 1 || cell["cliff direction"][(direction + 4) % 8] === 1;
  };
  return hasDiagonal(first) && hasDiagonal(second);
}

/**
 * Describe each cliff crossing, inside the current cell and between cells.
 * @param {string} mode Transport name.
 * @param {object} cell Current saved map cell with numeric layer IDs.
 * @param {Array<object|null>} neighbors Eight cells, clockwise from north.
 * @param {number} direction Destination index from zero to seven.
 * @returns {import("./skill-check.js").SkillCheck[]} Crossing checks, or an empty array.
 * @throws {TypeError} If any travel input is invalid.
 */
export function getSkillAndTN(mode, cell, neighbors, direction) {
  // Validate route cells before checking cliff geometry.
  cell = validateTravelInput(mode, cell, direction);
  neighbors = validateTravelNeighbors(mode, neighbors, direction);
  const checks = [];
  const sourceBypass = bypassesCrossing(mode, cell, "cliff");

  // Keep within-cell and diagonal crossings as separate checks.
  if (cell.terrain === TERRAIN.CLIFF.id && crossesWithinCell(cell, direction, "cliff") && !sourceBypass) {
    checks.push(crossingCheck(mode, cell, "cliff", false));
  }

  const hasContinuousBypass = sourceBypass && bypassesCrossing(mode, neighbors[direction], "cliff");
  if (crossesDiagonalCliff(neighbors, direction) && !hasContinuousBypass) {
    checks.push(crossingCheck(mode, cell, "cliff", false));
  }
  return checks;
}
