import { RIVER, TERRAIN } from "./world-map-layers.js";
import { getWaterColor, SAND_BANK_COLOR } from "./world-map-img-base-layers.js";

const STRIPE_COLORS = [SAND_BANK_COLOR, getWaterColor(TERRAIN.WATER), SAND_BANK_COLOR];
const STRIPE_OFFSETS = [-1, 0, 1];
const STRIPE_WIDTHS = [0.3, 2.7, 0.3];
const RIVER_DIRECTIONS = ["east", "south", "west", "north"];
export const RIVER_OFFSETS = Object.freeze([
  ["north", 0, -1], ["northeast", 1, -1], ["east", 1, 0], ["southeast", 1, 1],
  ["south", 0, 1], ["southwest", -1, 1], ["west", -1, 0], ["northwest", -1, -1],
].map((offset) => Object.freeze(offset)));

export const RIVER_CONTROL_IMAGES = Object.freeze(Object.entries(RIVER).map(([key, value]) =>
  Object.freeze({ value, image: `../img/map/control_river_${key.toLowerCase()}.webp` })));

/**
 * @param {CanvasRenderingContext2D} ctx Drawing context.
 * @param {number} x Cell column.
 * @param {number} y Cell row.
 * @param {number} gridSize Cell size in pixels.
 * @param {Object<string, boolean>} neighbors River connections.
 * @param {Object<string, import("./world-map-layers.js").LayerValue|null>} [water] Adjacent water terrain.
 * @param {Object<string, number>} [directions] Saved flow directions.
 * @returns {void}
 */
export function drawRiver(ctx, x, y, gridSize, neighbors, water = {}, directions) {
  if (!ctx || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(gridSize) || gridSize <= 0) {
    throw new TypeError("River drawing needs a canvas context and valid cell dimensions.");
  }
  if (!neighbors || RIVER_DIRECTIONS.some((direction) => typeof neighbors[direction] !== "boolean")) {
    throw new TypeError("River drawing needs boolean cardinal-neighbor values.");
  }

  const centerX = x * gridSize + gridSize / 2;
  const centerY = y * gridSize + gridSize / 2;
  const stripeSpacing = (STRIPE_WIDTHS[1] + STRIPE_WIDTHS[0]) / 2;
  const connected = RIVER_DIRECTIONS.some((direction) => neighbors[direction]);

  ctx.save();
  ctx.lineCap = "round";

  if (directions) {
    for (const [index, [name, dx, dy]] of RIVER_OFFSETS.entries()) {
      if (water[name] && !(dx && dy)) {
        ctx.beginPath();
        ctx.fillStyle = getWaterColor(water[name]);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + (dx - dy) * gridSize / 2, centerY + (dy + dx) * gridSize / 2);
        ctx.lineTo(centerX + (dx + dy) * gridSize / 2, centerY + (dy - dx) * gridSize / 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + (dx - dy) * gridSize / 2, centerY + (dy + dx) * gridSize / 2);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + (dx + dy) * gridSize / 2, centerY + (dy - dx) * gridSize / 2);
        ctx.strokeStyle = SAND_BANK_COLOR;
        ctx.lineWidth = 0.3;
        ctx.stroke();
      } else if (neighbors[name] || directions[index] === 1) {
        const scale = Math.hypot(dx, dy);
        drawRiverStripes(ctx, centerX, centerY, gridSize * scale / 2,
          dx / scale, dy / scale, stripeSpacing);
      }
    }
    ctx.restore();
    return;
  }

  for (const [direction, dx, dy] of [["east", 1, 0], ["south", 0, 1]]) {
    if (!neighbors[direction]) continue;
    drawRiverStripes(ctx, centerX, centerY, gridSize, dx, dy, stripeSpacing);
  }

  if (!connected) {
    const halfLength = gridSize * 0.25;
    drawRiverStripes(ctx, centerX, centerY, halfLength * 2, 1, 0, stripeSpacing, -halfLength);
    drawRiverStripes(ctx, centerX, centerY, halfLength * 2, 0, 1, stripeSpacing, -halfLength);
  }

  ctx.restore();
}

function drawRiverStripes(ctx, centerX, centerY, length, dx, dy, spacing, startDistance = 0) {
  const normalX = -dy;
  const normalY = dx;
  STRIPE_COLORS.forEach((color, index) => {
    const offset = STRIPE_OFFSETS[index] * spacing;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = STRIPE_WIDTHS[index];
    ctx.moveTo(centerX + dx * startDistance + normalX * offset,
      centerY + dy * startDistance + normalY * offset);
    ctx.lineTo(centerX + dx * (startDistance + length) + normalX * offset,
      centerY + dy * (startDistance + length) + normalY * offset);
    ctx.stroke();
  });
}
