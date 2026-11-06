import { isWaterTerrain, NEIGHBOR_OFFSETS } from "./world-map-layers.js";

export const DEFAULT_ELEVATION = 1;
export const CLIFF_HEIGHT = 75;
// Conservative width of a digit or minus sign, relative to the font size.
const LABEL_CHARACTER_WIDTH = 0.6;
const COLOR_STOPS = [
  [-4000, [0, 0, 90]],
  [0, [0, 100, 200]],
  [250, [70, 180, 80]],
  [500, [255, 215, 0]],
  [1000, [220, 0, 0]],
];

/**
 * @param {object} cell Saved map cell.
 * @returns {number} Elevation in whole metres. Missing elevation is 1 m.
 */
export function getElevation(cell) {
  if (!cell || typeof cell !== "object" || Array.isArray(cell)) throw new TypeError("Elevation needs a map cell.");
  const elevation = Object.hasOwn(cell, "elevation") ? cell.elevation : DEFAULT_ELEVATION;
  if (!Number.isSafeInteger(elevation)) throw new TypeError("Elevation must be a safe integer in metres.");
  return elevation;
}

/**
 * @param {object} cell First map cell.
 * @param {object} neighbor Adjacent map cell.
 * @returns {number} Absolute cliff height, or zero below 75 m and between water tiles.
 */
export function getCliffDifference(cell, neighbor) {
  const difference = Math.abs(getElevation(cell) - getElevation(neighbor));
  if (isWaterTerrain(cell.terrain) && isWaterTerrain(neighbor.terrain)) return 0;
  return difference >= CLIFF_HEIGHT ? difference : 0;
}

/**
 * @param {Object<string, object>} grid Saved cells keyed by "x,y".
 * @param {number} x Tile column.
 * @param {number} y Tile row.
 * @param {{maxX: number, maxY: number}} [bounds] Map bounds. Missing in-bounds cells use 1 m.
 * @returns {number[]} Directions of drops of at least 75 m, clockwise from north.
 */
export function getCliffEdges(grid, x, y, bounds) {
  if (!grid || typeof grid !== "object" || Array.isArray(grid) || !Number.isInteger(x) || !Number.isInteger(y)) {
    throw new TypeError("Cliff edges need a map grid and integer coordinates.");
  }
  if (bounds && (!Number.isSafeInteger(bounds.maxX) || !Number.isSafeInteger(bounds.maxY) || bounds.maxX < 0 || bounds.maxY < 0)) {
    throw new TypeError("Cliff bounds need non-negative integer indexes.");
  }
  const inside = (column, row) => !bounds || (column >= 0 && row >= 0 && column <= bounds.maxX && row <= bounds.maxY);
  if (!inside(x, y)) return [];
  const cell = grid[`${x},${y}`] ?? (bounds ? {} : null);
  if (!cell) return [];
  const elevation = getElevation(cell);
  return NEIGHBOR_OFFSETS.flatMap(([dx, dy], direction) => {
    if (!inside(x + dx, y + dy)) return [];
    const neighbor = grid[`${x + dx},${y + dy}`] ?? (bounds ? {} : null);
    return neighbor && elevation > getElevation(neighbor) && getCliffDifference(cell, neighbor) ? [direction] : [];
  });
}

/**
 * @param {number} elevation Elevation in whole metres.
 * @returns {string|null} Gradient color, or no color for the default elevation.
 */
export function getElevationColor(elevation) {
  if (!Number.isSafeInteger(elevation)) throw new TypeError("Elevation color needs a safe integer in metres.");
  if (elevation === DEFAULT_ELEVATION) return null;
  const height = Math.min(1000, Math.max(-4000, elevation));
  const upper = COLOR_STOPS.findIndex(([stop]) => stop >= height);
  const [end, endColor] = COLOR_STOPS[upper];
  const [start, startColor] = COLOR_STOPS[Math.max(0, upper - 1)];
  const ratio = end === start ? 0 : (height - start) / (end - start);
  return `rgb(${startColor.map((channel, index) => Math.round(channel + (endColor[index] - channel) * ratio)).join(", ")})`;
}

/**
 * @param {CanvasRenderingContext2D} ctx Drawing context.
 * @param {number} left Band left edge.
 * @param {number} top Band top edge.
 * @param {number} width Band width.
 * @param {number} height Band height.
 * @param {string} color Contrast color.
 * @param {number} elevation Elevation in whole metres.
 * @returns {void}
 */
export function drawElevationCue(ctx, left, top, width, height, color, elevation) {
  if (!ctx || ![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0 || typeof color !== "string" || !Number.isSafeInteger(elevation)) {
    throw new TypeError("Elevation label needs a canvas context, dimensions, color, and integer elevation.");
  }
  const text = String(elevation);
  // Size the font instead of using maxWidth to avoid canvas text corruption on large maps.
  const fontSize = Math.min(height * 0.65, (width * 0.9) / (text.length * LABEL_CHARACTER_WIDTH));
  ctx.save();
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = fontSize * 0.12;
  ctx.strokeStyle = color.includes("255") ? "#111111" : "#ffffff";
  ctx.fillStyle = color;
  const label = [text, left + width / 2, top + height / 2];
  ctx.strokeText(...label);
  ctx.fillText(...label);
  ctx.restore();
}
