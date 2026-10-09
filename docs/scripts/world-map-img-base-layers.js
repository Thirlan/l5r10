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

/**
 * @param {CanvasRenderingContext2D} ctx Drawing context.
 * @param {number} x Cell column.
 * @param {number} y Cell row.
 * @param {number} gridSize Cell size in pixels.
 * @param {number} zoom Map scale.
 * @param {Record<number, number|string>|undefined|null} directions Saved cliff direction flags.
 * @returns {void}
 */
export function drawCliffEdges(ctx, x, y, gridSize, zoom, directions) {
  if (!ctx || !Number.isFinite(x) || !Number.isFinite(y)
    || !Number.isFinite(gridSize) || gridSize <= 0 || !Number.isFinite(zoom) || zoom <= 0) {
    throw new TypeError("Cliff drawing needs a canvas context, valid cell dimensions, and positive zoom.");
  }
  if (!directions || typeof directions !== "object") return;
  const selected = Array.from({ length: 8 }, (_, index) => Number(directions[index]) === 1);
  if (!selected.some(Boolean)) return;

  const lineWidth = Math.min(4 / zoom, gridSize / 2);
  const inset = Math.min(lineWidth / 2 + gridSize / 16 + 4, gridSize * 7 / 16);
  const edgeSize = gridSize - 2 * inset;
  const directionLength = Math.min(4, edgeSize / 2);
  const left = x * gridSize + inset;
  const top = y * gridSize + inset;
  const right = left + edgeSize;
  const bottom = top + edgeSize;
  const centerX = left + edgeSize / 2;
  const centerY = top + edgeSize / 2;

  ctx.save();
  ctx.strokeStyle = "#808080";
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (selected.every(Boolean)) {
    ctx.strokeRect(left, top, edgeSize, edgeSize);
  } else {
    ctx.beginPath();
    if (selected[0]) { ctx.moveTo(left, top); ctx.lineTo(right, top); }
    if (selected[2]) { ctx.moveTo(right, top); ctx.lineTo(right, bottom); }
    if (selected[4]) { ctx.moveTo(left, bottom); ctx.lineTo(right, bottom); }
    if (selected[6]) { ctx.moveTo(left, top); ctx.lineTo(left, bottom); }

    const drawDiagonal = (index, startX, startY, endX, endY, directionX, directionY) => {
      if (!selected[index]) return;
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + directionX * Math.SQRT1_2 * directionLength,
        centerY + directionY * Math.SQRT1_2 * directionLength
      );
    };
    drawDiagonal(1, left, top, right, bottom, 1, -1);
    drawDiagonal(3, right, top, left, bottom, 1, 1);
    drawDiagonal(5, left, top, right, bottom, -1, 1);
    drawDiagonal(7, left, bottom, right, top, -1, -1);
    ctx.stroke();
  }
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
  [TERRAIN.FLAT, "../img/map/control_flat.webp"],
  [TERRAIN.HILLS, "../img/map/control_hills.webp"],
  [TERRAIN.MOUNTAINS, "../img/map/control_mountains.webp"],
  [TERRAIN.WATER, "../img/map/control_water.webp"],
  [TERRAIN.COASTAL_WATER, "../img/map/control_coastal_water.webp"],
  [TERRAIN.OCEAN, "../img/map/control_ocean.webp"],
  [TERRAIN.WETLANDS, "../img/map/control_wetlands.webp"],
  [TERRAIN.CLIFF, "../img/map/control_cliff.webp"],
  [CLIMATE.TEMPERATE, "../img/map/control_temperate.webp"],
  [CLIMATE.TROPICAL, "../img/map/control_tropical.webp"],
  [CLIMATE.DESERT, "../img/map/control_desert.webp"],
  [CLIMATE.POLAR, "../img/map/control_polar.webp"],
  [CLIMATE.WASTE, "../img/map/control_waste.webp"],
  [CLIMATE.SHADOWLAND, "../img/map/control_shadowland.webp"],
  [VEGETATION.NONE, "../img/map/control_veg_0.webp"],
  [VEGETATION.PRESENT, "../img/map/control_veg_1.webp"],
].map(([value, image]) => Object.freeze({ value, image })));
