import { INFRASTRUCTURE } from "./world-map-layers.js";

const infrastructureStyles = new Map([
  [INFRASTRUCTURE.ROAD, { color: "#5C3A1E", lineWidth: 3 }],
  [INFRASTRUCTURE.FOOTPATH, { color: "#A97443", lineWidth: 1.5 }],
  [INFRASTRUCTURE.SMALL_PORT, { color: "#D2B48C", marker: "p" }],
  [INFRASTRUCTURE.LARGE_PORT, { color: "#8B4513", marker: "P" }],
]);
const ROAD_DIRECTIONS = ["east", "south", "southeast", "northeast"];
for (const style of infrastructureStyles.values()) Object.freeze(style);

export const INFRASTRUCTURE_CONTROL_IMAGES = Object.freeze({});

/**
 * @param {import("./world-map-layers.js").LayerValue} value Infrastructure metadata.
 * @returns {{color: string, lineWidth?: number, marker?: string}|undefined} Drawing style.
 */
export function getInfrastructureStyle(value) {
  if (!Object.values(INFRASTRUCTURE).includes(value)) {
    throw new TypeError("Infrastructure style lookup needs an infrastructure metadata value.");
  }
  return infrastructureStyles.get(value);
}

/**
 * @param {CanvasRenderingContext2D} ctx Drawing context.
 * @param {number} x Cell column.
 * @param {number} y Cell row.
 * @param {number} gridSize Cell size in pixels.
 * @param {import("./world-map-layers.js").LayerValue} value Infrastructure metadata.
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
    ["east", 1, 0], ["south", 0, 1], ["southeast", 1, 1], ["northeast", 1, -1],
  ]) {
    if (!neighbors[direction]) continue;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + dx * gridSize, centerY + dy * gridSize);
    ctx.stroke();
  }
  ctx.restore();
}
