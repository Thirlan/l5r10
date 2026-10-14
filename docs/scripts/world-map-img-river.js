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

/**
 * Builds one flow path for each saved outgoing river direction.
 * A path starts at the incoming edge (or the cell center), goes through the center, and ends at the outgoing edge.
 * @param {Object<string, Object>} grid Map cells keyed by "x,y".
 * @param {number} gridSize Cell size in map units.
 * @returns {Array<{points: number[], length: number}>} Flow paths in map units.
 */
export function buildRiverFlowPaths(grid, gridSize) {
  const paths = [];
  for (const [key, cell] of Object.entries(grid)) {
    const directions = cell?.river ? cell["river direction"] : null;
    if (!directions) continue;
    const [x, y] = key.split(",").map(Number);
    const centerX = x * gridSize + gridSize / 2;
    const centerY = y * gridSize + gridSize / 2;
    const incoming = RIVER_OFFSETS.findIndex(([, dx, dy], index) => {
      const neighbor = grid[`${x + dx},${y + dy}`];
      return neighbor?.river && neighbor["river direction"]?.[(index + 4) % 8] === 1;
    });
    const startX = incoming < 0 ? centerX : centerX + RIVER_OFFSETS[incoming][1] * gridSize / 2;
    const startY = incoming < 0 ? centerY : centerY + RIVER_OFFSETS[incoming][2] * gridSize / 2;
    RIVER_OFFSETS.forEach(([, dx, dy], index) => {
      if (directions[index] !== 1) return;
      const endX = centerX + dx * gridSize / 2;
      const endY = centerY + dy * gridSize / 2;
      const length = Math.hypot(centerX - startX, centerY - startY) + Math.hypot(endX - centerX, endY - centerY);
      paths.push({ points: [startX, startY, centerX, centerY, endX, endY], length });
    });
  }
  return paths;
}

/**
 * Draws one white pixel on each flow path. The pixel moves one screen pixel for each frame and loops.
 * @param {CanvasRenderingContext2D} ctx Overlay drawing context in screen pixels.
 * @param {Array<{points: number[], length: number}>} paths Flow paths in map units.
 * @param {number} frame Frame counter.
 * @param {number} zoom Map units to screen pixels scale.
 * @returns {void}
 */
export function drawRiverFlowFrame(ctx, paths, frame, zoom) {
  ctx.fillStyle = "#FFFFFF";
  for (const { points: [ax, ay, bx, by, cx, cy], length } of paths) {
    const steps = Math.max(1, Math.round(length * zoom));
    const distance = (frame % steps) / zoom;
    const firstLength = Math.hypot(bx - ax, by - ay);
    const [fromX, fromY, toX, toY, segment, offset] = distance < firstLength
      ? [ax, ay, bx, by, firstLength, distance]
      : [bx, by, cx, cy, length - firstLength, distance - firstLength];
    const ratio = segment > 0 ? offset / segment : 0;
    ctx.fillRect(Math.floor((fromX + (toX - fromX) * ratio) * zoom),
      Math.floor((fromY + (toY - fromY) * ratio) * zoom), 1, 1);
  }
}
