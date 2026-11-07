import { CLIFF_HEIGHT, getCliffDifference } from "../data/world-map-elevation.js";
import { SkillCheck } from "../../skill-check.js";
import { bypassesCrossing, validateTravelInput, validateTravelNeighbors } from "./travel-skill-rules.js";

/**
 * Describe the elevation crossing between the current cell and the destination.
 * TN is 10, plus 5 for each full 25 m above a 75 m difference.
 * @param {string} mode Transport name.
 * @param {object} cell Current saved map cell with numeric layer IDs.
 * @param {Array<object|null>} neighbors Eight cells, clockwise from north.
 * @param {number} direction Destination index from zero to seven.
 * @returns {import("../../skill-check.js").SkillCheck[]} Crossing checks, or an empty array.
 * @throws {TypeError} If any travel input is invalid.
 */
export function getSkillAndTN(mode, cell, neighbors, direction) {
  cell = validateTravelInput(mode, cell, direction);
  neighbors = validateTravelNeighbors(mode, neighbors, direction);
  const destination = neighbors[direction];
  const difference = getCliffDifference(cell, destination);
  if (!difference || (bypassesCrossing(mode, cell, "cliff") && bypassesCrossing(mode, destination, "cliff"))) return [];
  return [new SkillCheck("Athletics", "Strength", 10 + 5 * Math.floor((difference - CLIFF_HEIGHT) / 25))];
}
