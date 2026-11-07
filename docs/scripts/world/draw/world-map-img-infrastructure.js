import { INFRASTRUCTURE } from "../data/world-map-data-layers.js";
import { ROAD_DIRECTIONS } from "./world-map-draw.const.js";
import { INFRASTRUCTURE_STYLES } from "./world-map-draw.config.js";

export const INFRASTRUCTURE_CONTROL_IMAGES = Object.freeze(Object.entries(INFRASTRUCTURE).map(([key, value]) => Object.freeze({ value, image: `../img/map/control_infrastructure_${key.toLowerCase()}.webp` })));

/**
 * @param {import("../data/world-map-data-layers.js").LayerValue} value Infrastructure metadata.
 * @returns {{color: string, lineWidth?: number, marker?: string}|undefined} Drawing style.
 */
export function getInfrastructureStyle(value) {
  if (!Object.values(INFRASTRUCTURE).includes(value)) {
    throw new TypeError("Infrastructure style lookup needs an infrastructure metadata value.");
  }
  return INFRASTRUCTURE_STYLES.get(value);
}

/**
 * @param {CanvasRenderingContext2D} ctx Drawing context.
 * @param {number} x Cell column.
 * @param {number} y Cell row.
 * @param {number} gridSize Cell size in pixels.
 * @param {import("../data/world-map-data-layers.js").LayerValue} value Infrastructure metadata.
 * @param {{east: boolean, south: boolean, southeast: boolean, northeast: boolean}} neighbors Forward connections.
 * @returns {void}
 */
export function drawInfrastructure(ctx, x, y, gridSize, value, neighbors) {
  if (!ctx || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(gridSize) || gridSize <= 0) {
    throw new TypeError("Infrastructure drawing needs a canvas context and valid cell dimensions.");
  }
  if (!Object.values(INFRASTRUCTURE).includes(value)) {
    throw new TypeError("Infrastructure drawing needs an infrastructure metadata value.");
  }
  if (!neighbors || ROAD_DIRECTIONS.some((direction) => typeof neighbors[direction] !== "boolean")) {
    throw new TypeError("Infrastructure drawing needs boolean forward-neighbor values.");
  }

  const style = getInfrastructureStyle(value);
  if (!style) return;

  const left = x * gridSize;
  const top = y * gridSize;
  const centerX = left + gridSize / 2;
  const centerY = top + gridSize / 2;

  ctx.save();
  if (style.marker) {
    ctx.fillStyle = style.color;
    ctx.font = `bold ${gridSize * 0.625}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(style.marker, left + 1, top + 1);
    ctx.restore();
    return;
  }

  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;
  ctx.lineCap = "round";
  for (const [direction, dx, dy] of [
    ["east", 1, 0],
    ["south", 0, 1],
    ["southeast", 1, 1],
    ["northeast", 1, -1],
  ]) {
    if (!neighbors[direction]) continue;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + dx * gridSize, centerY + dy * gridSize);
    ctx.stroke();
  }
  ctx.restore();
}
