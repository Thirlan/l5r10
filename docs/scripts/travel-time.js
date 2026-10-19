import { TERRAIN, CLIMATE, VEGETATION, RIVER, INFRASTRUCTURE } from "./world-map-layers.js";

// Moving speeds, not daily averages. These estimates exclude rest and survival checks.
// Horse uses a walk; caravan includes loaded carts; ship assumes favorable wind.
export const BASE_SPEED_KMPH = Object.freeze({
  foot: 5,
  horse: 7,
  caravan: 4,
  army: 4,
  "river boat": 6.5,
  ship: 9,
});
const MODE_NAMES = Object.keys(BASE_SPEED_KMPH);
const WATER_TERRAINS = new Set([TERRAIN.WATER, TERRAIN.COASTAL_WATER, TERRAIN.OCEAN]);
const TERRAIN_PENALTY = {
  [TERRAIN.FLAT.id]: 0,
  [TERRAIN.HILLS.id]: 0.2,
  [TERRAIN.MOUNTAINS.id]: 0.5,
  [TERRAIN.WETLANDS.id]: 0.35,
  [TERRAIN.CLIFF.id]: 0.7,
};
const CLIMATE_PENALTY = {
  [CLIMATE.TROPICAL.id]: { land: -0.1 },
  [CLIMATE.POLAR.id]: { land: -0.2, water: -0.35 },
};
const INFRASTRUCTURE_BONUS = {
  [INFRASTRUCTURE.NONE.id]: 0,
  [INFRASTRUCTURE.ROAD.id]: 0.5,
  [INFRASTRUCTURE.FOOTPATH.id]: 0.2,
  [INFRASTRUCTURE.SMALL_PORT.id]: 0,
  [INFRASTRUCTURE.LARGE_PORT.id]: 0,
};

function getLayerValue(value, catalog) {
  return Object.values(catalog).find(({ id, name }) => id === value || id === value?.id || (typeof value === "string" && name.toLowerCase() === value.trim().toLowerCase()));
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
  terrain = getLayerValue(terrain, TERRAIN);
  climate = getLayerValue(climate, CLIMATE);
  vegetation = getLayerValue(vegetation, VEGETATION);
  river = getLayerValue(river, RIVER);
  infrastructure = getLayerValue(infrastructure, INFRASTRUCTURE);
  if (!MODE_NAMES.includes(mode) || !terrain || !climate || !vegetation || !river || !infrastructure || typeof isAgainstCurrent !== "boolean") return -1.0;

  const onWater = WATER_TERRAINS.has(terrain);
  const onRiver = river === RIVER.PRESENT;
  const hasBridge = infrastructure === INFRASTRUCTURE.ROAD || infrastructure === INFRASTRUCTURE.FOOTPATH;
  const waterTransport = mode === "river boat" || mode === "ship";
  if (onWater && (onRiver || vegetation !== VEGETATION.NONE)) return -1.0;
  if (terrain === TERRAIN.CLIFF && (waterTransport || (infrastructure !== INFRASTRUCTURE.ROAD && !(mode === "foot" && infrastructure === INFRASTRUCTURE.FOOTPATH)))) return -1.0;

  let adjustment = 0;
  if (waterTransport) {
    if (!onWater && !onRiver) return -1.0;
    if (mode === "river boat" && terrain === TERRAIN.OCEAN) return -1.0;
    const underBridge = hasBridge && (onRiver || terrain === TERRAIN.WATER);
    if (mode === "ship" && underBridge) return -1.0;
    adjustment += CLIMATE_PENALTY[climate.id]?.water ?? 0;
    if (mode === "ship" && onRiver) adjustment -= 0.3;
    if (mode === "river boat" && terrain === TERRAIN.COASTAL_WATER) adjustment -= 0.25;
    if (underBridge) adjustment -= 0.1;
    if (onRiver) adjustment += isAgainstCurrent ? -0.25 : 0.1;
  } else {
    if (onWater && !(terrain === TERRAIN.WATER && infrastructure === INFRASTRUCTURE.ROAD)) return -1.0;
    adjustment -= onWater ? 0 : TERRAIN_PENALTY[terrain.id];
    adjustment += CLIMATE_PENALTY[climate.id]?.land ?? 0;
    if (vegetation !== VEGETATION.NONE) adjustment -= 0.2;
    if (onRiver && !hasBridge) adjustment -= 0.25;
    adjustment += INFRASTRUCTURE_BONUS[infrastructure.id];
  }
  return BASE_SPEED_KMPH[mode] * Math.max(0.1, Math.min(1, 1 + adjustment));
}
