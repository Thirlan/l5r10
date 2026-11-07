import { ANIMAL, CLIMATE, CRIME, INFRASTRUCTURE, RESOURCE_LEVEL, SETTLEMENT, SHADOWLAND, SPIRIT, TERRAIN } from "../data/world-map-data-layers.js";

/** Size of one map tile in canvas pixels. */
export const GRID_SIZE = 16;

/** Zoom of a map renderer when no start zoom is given. */
export const DEFAULT_ZOOM = 0.5;

/** Start zoom of the map builder. */
export const BUILDER_START_ZOOM = 0.35;

/** Start zoom of the map viewer. */
export const VIEWER_START_ZOOM = 0.55;

/** Smallest zoom of the zoom controls. */
export const MIN_ZOOM = 0.55;

/** Largest zoom of the zoom controls. */
export const MAX_ZOOM = 4;

/** Zoom multiplier of one zoom-in or zoom-out step. */
export const ZOOM_STEP = 1.25;

/** Time in milliseconds between two frames of the river flow animation. */
export const RIVER_FLOW_FRAME_MS = 120;

export const CLIMATE_COLORS = new Map([
  [CLIMATE.TEMPERATE, "#2E5A44"],
  [CLIMATE.TROPICAL, "#7FFF00"],
  [CLIMATE.DESERT, "#F4A460"],
  [CLIMATE.POLAR, "#8B5A2B"],
  [CLIMATE.WASTE, "#4A4A4A"],
  [CLIMATE.SHADOWLAND, "#1A590F"],
]);

export const WATER_COLORS = new Map([
  [TERRAIN.WATER, "#1E90FF"],
  [TERRAIN.COASTAL_WATER, "#4169E1"],
  [TERRAIN.OCEAN, "#00008B"],
]);

export const SAND_BANK_COLOR = "#F4A460";

/** Line widths of the river stripes (bank, water, bank), in canvas pixels. */
export const RIVER_STRIPE_WIDTHS = Object.freeze([0.3, 2.7, 0.3]);

/** Elevation color gradient as [metres, [red, green, blue]] stops. */
export const ELEVATION_COLOR_STOPS = Object.freeze([
  [-4000, [0, 0, 90]],
  [0, [0, 100, 200]],
  [250, [70, 180, 80]],
  [500, [255, 215, 0]],
  [1000, [220, 0, 0]],
]);

export const ANIMAL_COLORS = new Map([
  [ANIMAL.VERY_LOW, "rgba(255, 255, 0, 0.45)"],
  [ANIMAL.LOW, "rgba(255, 255, 0, 0.55)"],
  [ANIMAL.MEDIUM, "rgba(255, 165, 0, 0.55)"],
  [ANIMAL.HIGH, "rgba(255, 0, 0, 0.65)"],
  [ANIMAL.VERY_HIGH, "rgba(128, 0, 128, 0.75)"],
]);

export const SPIRIT_COLORS = new Map([
  [SPIRIT.VERY_LOW, "rgba(255, 255, 0, 0.45)"],
  [SPIRIT.LOW, "rgba(255, 255, 0, 0.55)"],
  [SPIRIT.MEDIUM, "rgba(255, 165, 0, 0.55)"],
  [SPIRIT.HIGH, "rgba(255, 0, 0, 0.65)"],
  [SPIRIT.VERY_HIGH, "rgba(128, 0, 128, 0.75)"],
]);

export const SHADOWLAND_COLORS = new Map([
  [SHADOWLAND.VERY_LOW, "rgba(255, 255, 0, 0.45)"],
  [SHADOWLAND.LOW, "rgba(255, 255, 0, 0.55)"],
  [SHADOWLAND.MEDIUM, "rgba(255, 165, 0, 0.55)"],
  [SHADOWLAND.HIGH, "rgba(255, 0, 0, 0.65)"],
  [SHADOWLAND.VERY_HIGH, "rgba(128, 0, 128, 0.75)"],
]);

export const CRIME_COLORS = new Map([
  [CRIME.VERY_LOW, "rgba(255, 255, 0, 0.45)"],
  [CRIME.LOW, "rgba(255, 255, 0, 0.55)"],
  [CRIME.MEDIUM, "rgba(255, 165, 0, 0.55)"],
  [CRIME.HIGH, "rgba(255, 0, 0, 0.65)"],
  [CRIME.VERY_HIGH, "rgba(128, 0, 128, 0.75)"],
]);

export const RESOURCE_LEVEL_COLORS = new Map([
  [RESOURCE_LEVEL.VERY_LOW, "rgba(128, 0, 128, 0.75)"],
  [RESOURCE_LEVEL.LOW, "rgba(255, 0, 0, 0.65)"],
  [RESOURCE_LEVEL.MEDIUM, "rgba(255, 165, 0, 0.55)"],
  [RESOURCE_LEVEL.HIGH, "rgba(255, 255, 0, 0.55)"],
  [RESOURCE_LEVEL.VERY_HIGH, "rgba(255, 255, 0, 0.45)"],
]);

export const INFRASTRUCTURE_STYLES = new Map([
  [INFRASTRUCTURE.ROAD, Object.freeze({ color: "#5C3A1E", lineWidth: 3 })],
  [INFRASTRUCTURE.FOOTPATH, Object.freeze({ color: "#A97443", lineWidth: 1.5 })],
  [INFRASTRUCTURE.SMALL_PORT, Object.freeze({ color: "#D2B48C", marker: "p" })],
  [INFRASTRUCTURE.LARGE_PORT, Object.freeze({ color: "#8B4513", marker: "P" })],
]);

/** Settlement marker colors for tiles without a clan. */
export const NEUTRAL_SETTLEMENT_COLORS = Object.freeze({ border: "#444444", fill: "#DDDDDD" });

/** Size of a resource marker in canvas pixels. */
export const RESOURCE_MARKER_SIZE = 12;

/** Settlement label font sizes as [settlement, size] pairs. */
export const SETTLEMENT_LABEL_SIZE_ENTRIES = Object.freeze([
  [SETTLEMENT.VILLAGE, 6],
  [SETTLEMENT.CITY, 8],
  [SETTLEMENT.CAPITAL, 10],
  [SETTLEMENT.FORTIFICATION, 6],
  [SETTLEMENT.CASTLE, 8],
  [SETTLEMENT.KYUDEN, 10],
  [SETTLEMENT.SMALL_SHRINE, 6],
  [SETTLEMENT.LARGE_SHRINE, 8],
  [SETTLEMENT.VILLAGE_RUINS, 6],
  [SETTLEMENT.CASTLE_RUINS, 8],
  [SETTLEMENT.ACADEMY, 6],
  [SETTLEMENT.WATCHTOWER, 6],
  [SETTLEMENT.SMALL_TEMPLE, 6],
  [SETTLEMENT.LARGE_TEMPLE, 8],
]);

/** Settlement label font size for a settlement without an entry. */
export const DEFAULT_SETTLEMENT_LABEL_SIZE = 6;
