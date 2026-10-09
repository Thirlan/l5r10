import { CLIMATE, TERRAIN, VEGETATION } from "./world-map-layers.js";

const climateColors = new Map([
  [CLIMATE.TEMPERATE, "#2E5A44"],
  [CLIMATE.TROPICAL, "#7FFF00"],
  [CLIMATE.DESERT, "#F4A460"],
  [CLIMATE.POLAR, "#8B5A2B"],
  [CLIMATE.WASTE, "#4A4A4A"],
  [CLIMATE.SHADOWLAND, "#1A590F"],
]);
const waterColors = new Map([
  [TERRAIN.WATER, "#1E90FF"],
  [TERRAIN.COASTAL_WATER, "#4169E1"],
  [TERRAIN.OCEAN, "#00008B"],
]);

export const BASE_LAYER_IMAGES = Object.freeze([
  [TERRAIN.FLAT, "../img/map/terrain_flat.webp"],
  [TERRAIN.HILLS, "../img/map/terrain_hills.webp"],
  [TERRAIN.MOUNTAINS, "../img/map/terrain_mountains.webp"],
  [TERRAIN.WETLANDS, "../img/map/terrain_wetlands.webp"],
  [TERRAIN.CLIFF, "../img/map/terrain_cliff.webp"],
  [VEGETATION.PRESENT, "../img/map/vegetation.webp"],
].map(([value, image]) => Object.freeze({ value, image })));

const imagePaths = new Map(BASE_LAYER_IMAGES.map(({ value, image }) => [value, image]));

/**
 * @param {CanvasRenderingContext2D} ctx Drawing context.
 * @param {number} x Cell column.
 * @param {number} y Cell row.
 * @param {number} gridSize Cell size in pixels.
 * @param {import("./world-map-layers.js").LayerValue} terrain Terrain metadata.
 * @param {import("./world-map-layers.js").LayerValue} climate Climate metadata.
 * @param {import("./world-map-layers.js").LayerValue} vegetation Vegetation metadata.
 * @param {Map<string, HTMLImageElement>} images Loaded images by asset path.
 * @returns {void}
 */
export function drawBaseLayers(ctx, x, y, gridSize, terrain, climate, vegetation, images) {
  if (!ctx || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(gridSize) || gridSize <= 0) {
    throw new TypeError("Base-layer drawing needs a canvas context and valid cell dimensions.");
  }
  if (!Object.values(TERRAIN).includes(terrain)
    || !climateColors.has(climate)
    || !Object.values(VEGETATION).includes(vegetation)) {
    throw new TypeError("Base-layer drawing needs terrain, climate, and vegetation metadata.");
  }

  const left = x * gridSize;
  const top = y * gridSize;
  const terrainColor = waterColors.get(terrain);
  const terrainImage = terrainColor ? null : getLoadedImage(terrain, images);
  const vegetationImage = vegetation === VEGETATION.PRESENT ? getLoadedImage(vegetation, images) : null;

  ctx.save();
  ctx.fillStyle = climateColors.get(climate);
  ctx.fillRect(left, top, gridSize, gridSize);
  if (terrainColor) {
    ctx.fillStyle = terrainColor;
    ctx.fillRect(left, top, gridSize, gridSize);
  } else {
    ctx.drawImage(terrainImage, left, top, gridSize, gridSize);
  }
  if (vegetationImage) ctx.drawImage(vegetationImage, left, top, gridSize, gridSize);
  ctx.restore();
}

function getLoadedImage(value, images) {
  const path = imagePaths.get(value);
  const image = images.get(path);
  if (!image?.complete || !image.naturalWidth) {
    throw new Error(`Base-layer image is not loaded: ${path}`);
  }
  return image;
}

export const BASE_LAYER_CONTROL_IMAGES = Object.freeze([
  [TERRAIN.FLAT, "../img/map/control_flat.png"],
  [TERRAIN.HILLS, "../img/map/control_hills.png"],
  [TERRAIN.MOUNTAINS, "../img/map/control_mountains.png"],
  [TERRAIN.WATER, "../img/map/control_water.png"],
  [TERRAIN.COASTAL_WATER, "../img/map/control_coastal_water.png"],
  [TERRAIN.OCEAN, "../img/map/control_ocean.png"],
  [TERRAIN.WETLANDS, "../img/map/control_wetlands.png"],
  [CLIMATE.TEMPERATE, "../img/map/control_temperate.png"],
  [CLIMATE.TROPICAL, "../img/map/control_tropical.png"],
  [CLIMATE.DESERT, "../img/map/control_desert.png"],
  [CLIMATE.POLAR, "../img/map/control_polar.png"],
  [VEGETATION.NONE, "../img/map/control_veg_0.png"],
  [VEGETATION.PRESENT, "../img/map/control_veg_1.png"],
].map(([value, image]) => Object.freeze({ value, image })));
