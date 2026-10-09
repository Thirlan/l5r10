import { RIVER } from "./world-map-layers.js";

const STRIPE_COLORS = ["#F4A460", "#ADD8E6", "#0000FF", "#ADD8E6", "#F4A460"];
const STRIPE_OFFSETS = [-2, -1, 0, 1, 2];
const RIVER_DIRECTIONS = ["east", "south", "west", "north"];

export const RIVER_CONTROL_IMAGES = Object.freeze(Object.entries(RIVER).map(([key, value]) =>
  Object.freeze({ value, image: `../img/map/control_river_${key.toLowerCase()}.webp` })));

/**
 * @param {CanvasRenderingContext2D} ctx Drawing context.
 * @param {number} x Cell column.
 * @param {number} y Cell row.
 * @param {number} gridSize Cell size in pixels.
 * @param {{east: boolean, south: boolean, west: boolean, north: boolean}} neighbors River connections.
 * @returns {void}
 */
export function drawRiver(ctx, x, y, gridSize, neighbors) {
  if (!ctx || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(gridSize) || gridSize <= 0) {
    throw new TypeError("River drawing needs a canvas context and valid cell dimensions.");
  }
  if (!neighbors || RIVER_DIRECTIONS.some((direction) => typeof neighbors[direction] !== "boolean")) {
    throw new TypeError("River drawing needs boolean cardinal-neighbor values.");
  }

  const centerX = x * gridSize + gridSize / 2;
  const centerY = y * gridSize + gridSize / 2;
  const stripeWidth = Math.max(1.25, 4 * 0.45);
  const stripeSpacing = stripeWidth * 0.85;
  const connected = RIVER_DIRECTIONS.some((direction) => neighbors[direction]);

  ctx.save();
  ctx.lineCap = "round";

  for (const [direction, dx, dy] of [["east", 1, 0], ["south", 0, 1]]) {
    if (!neighbors[direction]) continue;
    drawRiverStripes(ctx, centerX, centerY, gridSize, dx, dy, stripeSpacing, stripeWidth);
  }

  if (!connected) {
    const halfLength = gridSize * 0.25;
    drawRiverStripes(ctx, centerX, centerY, halfLength * 2, 1, 0, stripeSpacing, stripeWidth, -halfLength);
    drawRiverStripes(ctx, centerX, centerY, halfLength * 2, 0, 1, stripeSpacing, stripeWidth, -halfLength);
  }

  ctx.restore();
}

function drawRiverStripes(ctx, centerX, centerY, length, dx, dy, spacing, width, startDistance = 0) {
  const normalX = -dy;
  const normalY = dx;
  STRIPE_COLORS.forEach((color, index) => {
    const offset = STRIPE_OFFSETS[index] * spacing;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(centerX + dx * startDistance + normalX * offset,
      centerY + dy * startDistance + normalY * offset);
    ctx.lineTo(centerX + dx * (startDistance + length) + normalX * offset,
      centerY + dy * (startDistance + length) + normalY * offset);
    ctx.stroke();
  });
}
