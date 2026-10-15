import { TERRAIN, CLIMATE, VEGETATION, RIVER } from "./world-map-layers.js";

const MOVEMENT_TN = { hills: 10, mountains: 20, wetlands: 15, cliff: 25 };
const SWIMMING_TN = { water: 15, "coastal water": 20, ocean: 25 };

function resolveLayer(value, catalog) {
  const match = Object.values(catalog).find(({ id, name }) => id === value || id === value?.id
    || (typeof value === "string" && name.toLowerCase() === value.trim().toLowerCase()));
  if (!match) throw new TypeError("Unknown map layer value.");
  return match.name.toLowerCase();
}

/**
 * Initial house rules, not official rules. Each returned check is required.
 * Land movement uses Athletics: hills 10, wetlands 15, mountains 20, cliffs 25.
 * Water assumes swimming: inland 15, coast 20, ocean 25.
 * Hunting starts at 10. Add 5 each for harsh climate, vegetation, and forest.
 * Temperate climate is not harsh. Forest is a separate boolean, not a map layer.
 * Rivers require Athletics 15, or 20 upstream. Ignore current without a river.
 * Return no checks for clear, flat, temperate land.
 * @param {string|number|object} terrain Terrain name, ID, or metadata.
 * @param {string|number|object} climate Climate name, ID, or metadata.
 * @param {string|number|object} vegetation Vegetation name, ID, or metadata.
 * @param {boolean} forest True for forest cover.
 * @param {string|number|object} river River name, ID, or metadata.
 * @param {boolean} [isAgainstCurrent=false] True for upstream travel.
 * @returns {Array<{skill: string, tn: number}>} Required checks, in movement, Hunting, river order.
 * @throws {TypeError} If inputs are invalid, or water has vegetation, forest, or a river.
 */
export function getSkillAndTN(terrain, climate, vegetation, forest, river, isAgainstCurrent = false) {
  terrain = resolveLayer(terrain, TERRAIN);
  climate = resolveLayer(climate, CLIMATE);
  vegetation = resolveLayer(vegetation, VEGETATION);
  river = resolveLayer(river, RIVER);
  if (typeof forest !== "boolean" || typeof isAgainstCurrent !== "boolean") {
    throw new TypeError("Forest and current flags must be boolean.");
  }
  const onWater = Object.hasOwn(SWIMMING_TN, terrain);
  if (onWater && (vegetation !== "none" || forest || river !== "none")) {
    throw new TypeError("Water cannot have vegetation, forest, or a river.");
  }
  const checks = [];
  const movementTN = onWater ? SWIMMING_TN[terrain] : MOVEMENT_TN[terrain];
  if (movementTN) checks.push({ skill: "Athletics", tn: movementTN });
  const survivalPenalty = Number(climate !== "temperate") + Number(vegetation !== "none") + Number(forest);
  if (survivalPenalty) checks.push({ skill: "Hunting", tn: 10 + 5 * survivalPenalty });
  if (river !== "none") checks.push({ skill: "Athletics", tn: isAgainstCurrent ? 20 : 15 });
  return checks;
}
