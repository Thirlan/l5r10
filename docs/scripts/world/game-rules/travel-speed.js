import { TERRAIN, CLIMATE, VEGETATION, RIVER, INFRASTRUCTURE } from "../data/world-map-data-layers.js";
import { CLIFF_HEIGHT } from "../data/world-map-data.config.js";
import { BASE_SPEED_KMPH, CLIMATE_PENALTY, INFRASTRUCTURE_BONUS, SPEED_MULTIPLIER_LIMITS, SPEED_PENALTY, TERRAIN_PENALTY, WITH_CURRENT_BONUS } from "./world-map-game-rules.config.js";

const MODE_NAMES = Object.keys(BASE_SPEED_KMPH);
const WATER_TERRAINS = new Set([TERRAIN.WATER, TERRAIN.COASTAL_WATER, TERRAIN.OCEAN]);

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
 * @param {number} [cliffDifference=0] Height from getCliffDifference. Water-to-water changes must use zero.
 * @returns {number} Speed in km/h, or -1.0 for invalid inputs or impossible travel.
 * @throws {TypeError} If the cliff difference is not a non-negative safe integer.
 */
export function getTravelSpeed(mode, terrain, climate, vegetation, river, infrastructure, isAgainstCurrent = false, cliffDifference = 0) {
  if (!Number.isSafeInteger(cliffDifference) || cliffDifference < 0) throw new TypeError("Cliff difference must be a non-negative integer in metres.");
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
  const hasCliff = cliffDifference >= CLIFF_HEIGHT;
  if (onWater && (onRiver || vegetation !== VEGETATION.NONE)) return -1.0;
  if (hasCliff && (waterTransport || (infrastructure !== INFRASTRUCTURE.ROAD && !(mode === "foot" && infrastructure === INFRASTRUCTURE.FOOTPATH)))) return -1.0;

  let adjustment = 0;
  if (waterTransport) {
    if (!onWater && !onRiver) return -1.0;
    if (mode === "river boat" && terrain === TERRAIN.OCEAN) return -1.0;
    const underBridge = hasBridge && (onRiver || terrain === TERRAIN.WATER);
    if (mode === "ship" && underBridge) return -1.0;
    adjustment += CLIMATE_PENALTY[climate.id]?.water ?? 0;
    if (mode === "ship" && onRiver) adjustment -= SPEED_PENALTY.shipOnRiver;
    if (mode === "river boat" && terrain === TERRAIN.COASTAL_WATER) adjustment -= SPEED_PENALTY.riverBoatOnCoastalWater;
    if (underBridge) adjustment -= SPEED_PENALTY.underBridge;
    if (onRiver) adjustment += isAgainstCurrent ? -SPEED_PENALTY.againstCurrent : WITH_CURRENT_BONUS;
  } else {
    if (onWater && !(terrain === TERRAIN.WATER && infrastructure === INFRASTRUCTURE.ROAD)) return -1.0;
    adjustment -= Math.max(hasCliff ? SPEED_PENALTY.cliff : 0, onWater ? 0 : TERRAIN_PENALTY[terrain.id]);
    adjustment += CLIMATE_PENALTY[climate.id]?.land ?? 0;
    if (vegetation !== VEGETATION.NONE) adjustment -= SPEED_PENALTY.vegetation;
    if (onRiver && !hasBridge) adjustment -= SPEED_PENALTY.riverWithoutBridge;
    adjustment += INFRASTRUCTURE_BONUS[infrastructure.id];
  }
  return BASE_SPEED_KMPH[mode] * Math.max(SPEED_MULTIPLIER_LIMITS.min, Math.min(SPEED_MULTIPLIER_LIMITS.max, 1 + adjustment));
}
