import { TERRAIN, CLIMATE, VEGETATION, RIVER, INFRASTRUCTURE } from "./world-map-layers.js";

// Moving speeds, not daily averages. These estimates exclude rest and survival checks.
// Horse uses a walk; caravan includes loaded carts; ship assumes favorable wind.
export const BASE_SPEED_KMPH = Object.freeze({
  foot: 5, horse: 7, caravan: 4, army: 4, "river boat": 6.5, ship: 9,
});
const MODE_NAMES = Object.keys(BASE_SPEED_KMPH);
const WATER_TERRAINS = new Set(["water", "coastal water", "ocean"]);
const TERRAIN_PENALTY = { flat: 0, hills: 0.2, mountains: 0.5, wetlands: 0.35, cliff: 0.7 };
const INFRASTRUCTURE_BONUS = { none: 0, road: 0.5, footpath: 0.2, "small port": 0, "large port": 0 };

function getLayerName(value, catalog) {
  const entry = Object.values(catalog).find(({ id, name }) =>
    id === value || id === value?.id
    || (typeof value === "string" && name.toLowerCase() === value.trim().toLowerCase()));
  return entry?.name.toLowerCase();
}

/**
 * Calculate movement speed only. Do not apply skill, stamina, or survival checks.
 * Add adjustments to the base multiplier. Limit valid travel to 10–100% of base speed.
 * Roads and footpaths bridge rivers. Only roads bridge inland water tiles.
 * Ships cannot pass bridges. River boats can pass, with a speed penalty.
 * River size is not stored in the map. Ships on rivers receive a size penalty.
 * Cliffs require a road, or a footpath for foot travel. Rivers do not bypass cliffs.
 * @param {string|number} mode Name, or ID: foot=0, horse=1, caravan=2, army=3, river boat=4, ship=5.
 * @param {string|number|object} terrain Map terrain name, ID, or metadata.
 * @param {string|number|object} climate Map climate name, ID, or metadata.
 * @param {string|number|object} vegetation Map vegetation name, ID, or metadata.
 * @param {string|number|object} river Map river name, ID, or metadata.
 * @param {string|number|object} infrastructure Map infrastructure name, ID, or metadata.
 * @param {boolean} [isAgainstCurrent=false] True for upstream travel; false for downstream travel.
 * @returns {number} Speed in km/h, or -1.0 for invalid inputs or impossible travel.
 */
export function getTravelSpeed(mode, terrain, climate, vegetation, river, infrastructure, isAgainstCurrent = false) {
  mode = typeof mode === "number" ? MODE_NAMES[mode] : mode?.trim?.().toLowerCase();
  terrain = getLayerName(terrain, TERRAIN);
  climate = getLayerName(climate, CLIMATE);
  vegetation = getLayerName(vegetation, VEGETATION);
  river = getLayerName(river, RIVER);
  infrastructure = getLayerName(infrastructure, INFRASTRUCTURE);
  if (!MODE_NAMES.includes(mode) || !terrain || !climate || !vegetation || !river || !infrastructure
    || typeof isAgainstCurrent !== "boolean") return -1.0;

  const onWater = WATER_TERRAINS.has(terrain);
  const onRiver = river === "river";
  const hasBridge = infrastructure === "road" || infrastructure === "footpath";
  const waterTransport = mode === "river boat" || mode === "ship";
  if (onWater && (onRiver || vegetation !== "none")) return -1.0;
  if (terrain === "cliff" && (waterTransport
    || (infrastructure !== "road" && !(mode === "foot" && infrastructure === "footpath")))) return -1.0;

  let adjustment = 0;
  if (waterTransport) {
    if (!onWater && !onRiver) return -1.0;
    if (mode === "river boat" && terrain === "ocean") return -1.0;
    const underBridge = hasBridge && (onRiver || terrain === "water");
    if (mode === "ship" && underBridge) return -1.0;
    if (climate === "polar") adjustment -= 0.35;
    if (mode === "ship" && onRiver) adjustment -= 0.3;
    if (mode === "river boat" && terrain === "coastal water") adjustment -= 0.25;
    if (underBridge) adjustment -= 0.1;
    if (onRiver) adjustment += isAgainstCurrent ? -0.25 : 0.1;
  } else {
    if (onWater && !(terrain === "water" && infrastructure === "road")) return -1.0;
    adjustment -= onWater ? 0 : TERRAIN_PENALTY[terrain];
    if (climate === "tropical") adjustment -= 0.1;
    if (climate === "polar") adjustment -= 0.2;
    if (vegetation !== "none") adjustment -= 0.2;
    if (onRiver && !hasBridge) adjustment -= 0.25;
    adjustment += INFRASTRUCTURE_BONUS[infrastructure];
  }
  return BASE_SPEED_KMPH[mode] * Math.max(0.1, Math.min(1, 1 + adjustment));
}
