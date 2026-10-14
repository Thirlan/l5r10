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
export const SAND_BANK_COLOR = "#F4A460";

/**
 * @param {import("./world-map-layers.js").LayerValue} terrain Terrain metadata.
 * @returns {string|undefined} Water color, if the terrain is water.
 */
export function getWaterColor(terrain) {
  return waterColors.get(terrain);
}

/**
 * @param {CanvasRenderingContext2D} ctx Drawing context.
 * @param {number} x Cell column.
 * @param {number} y Cell row.
 * @param {number} gridSize Cell size in pixels.
 * @param {import("./world-map-layers.js").LayerValue} terrain Terrain metadata.
 * @param {Object<string, import("./world-map-layers.js").LayerValue|null>} neighbors Adjacent terrain.
 * @param {Object<string, boolean>} [riverConnections] Adjacent river connections.
 * @returns {void}
 */
export function drawWaterEdges(ctx, x, y, gridSize, terrain, neighbors, riverConnections = {}) {
  if (!ctx || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(gridSize) || gridSize <= 0) {
    throw new TypeError("Water-edge drawing needs a canvas context and valid cell dimensions.");
  }
  if (!neighbors || typeof neighbors !== "object") {
    throw new TypeError("Water-edge drawing needs adjacent terrain metadata.");
  }
  if (terrain !== TERRAIN.WATER && terrain !== TERRAIN.COASTAL_WATER) return;

  const left = x * gridSize;
  const top = y * gridSize;
  const right = left + gridSize;
  const bottom = top + gridSize;
  const edges = [
    ["north", left, top, right, top],
    ["east", right, top, right, bottom],
    ["south", left, bottom, right, bottom],
    ["west", left, top, left, bottom],
  ].filter(([direction]) => neighbors[direction] && !getWaterColor(neighbors[direction])
    && !riverConnections[direction]);
  if (!edges.length) return;

  ctx.save();
  ctx.beginPath();
  for (const [, startX, startY, endX, endY] of edges) {
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
  }
  ctx.strokeStyle = SAND_BANK_COLOR;
  ctx.lineWidth = 0.3;
  ctx.stroke();
  ctx.restore();
}

export const BASE_LAYER_IMAGES = Object.freeze([
  [TERRAIN.FLAT, "../img/map/terrain_flat.webp"],
  [TERRAIN.HILLS, "../img/map/terrain_hills.webp"],
  [TERRAIN.MOUNTAINS, "../img/map/terrain_mountains.webp"],
  [TERRAIN.WETLANDS, "../img/map/terrain_wetlands.webp"],
  [VEGETATION.PRESENT, "../img/map/vegetation.webp"],
  ...["bottom", "corner", "slope", "diagonal", "inward"].map((name) =>
    [name, `../img/map/cliff_${name}.webp`]),
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
  const terrainColor = getWaterColor(terrain);
  const terrainImage = terrainColor ? null : getLoadedImage(terrain === TERRAIN.CLIFF ? TERRAIN.FLAT : terrain, images);
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
 * @param {Map<string, HTMLImageElement>} images Loaded images by asset path.
 * @param {Object<number, Record<number, number|string>>} [neighbors] Adjacent cliff direction flags.
 * @returns {void}
 */
export function drawCliffEdges(ctx, x, y, gridSize, zoom, directions, images, neighbors = {}) {
  if (!ctx || !Number.isFinite(x) || !Number.isFinite(y)
    || !Number.isFinite(gridSize) || gridSize <= 0 || !Number.isFinite(zoom) || zoom <= 0) {
    throw new TypeError("Cliff drawing needs a canvas context, valid cell dimensions, and positive zoom.");
  }
  if (!directions || typeof directions !== "object") return;
  const selected = Array.from({ length: 8 }, (_, index) => Number(directions[index]) === 1);
  if (!selected.some(Boolean)) return;

  const size = gridSize / 3;
  const has = (flags, direction) => Number(flags?.[direction % 8]) === 1;
  const draw = (name, column, row, rotation, mirror = false) => {
    const image = getLoadedImage(name, images);
    ctx.save();
    ctx.translate((x + 0.5) * gridSize, (y + 0.5) * gridSize);
    ctx.rotate(rotation * Math.PI / 2);
    ctx.translate((column - 1) * size, (row - 1) * size);
    if (mirror) ctx.scale(-1, 1);
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
  };
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  [0, 1, 2, 3].forEach((rotation) => {
    const bottom = (4 + rotation * 2) % 8;
    const left = (bottom + 2) % 8;
    const right = (bottom + 6) % 8;
    if (selected[bottom]) {
      draw("bottom", 1, 2, rotation);
      if (!selected[left]) draw(has(neighbors[left], bottom) ? "bottom" : "slope", 0, 2, rotation, true);
      draw(selected[right] ? "corner" : has(neighbors[right], bottom) ? "bottom" : "slope", 2, 2, rotation);
    }
    const diagonal = (bottom + 1) % 8;
    if (has(neighbors[left], diagonal) && has(neighbors[bottom], diagonal)) {
      draw("inward", 0, 2, rotation);
    } else if (selected[diagonal] && !(selected[bottom] && selected[left])) {
      [0, 1, 2].forEach((index) => draw("diagonal", index, index, rotation));
    }
  });
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
