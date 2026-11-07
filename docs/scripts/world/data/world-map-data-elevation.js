import { isWaterTerrain } from "./world-map-data-layers.js";
import { NEIGHBOR_OFFSETS } from "./world-map-data.const.js";
import { CLIFF_HEIGHT, DEFAULT_ELEVATION } from "./world-map-data.config.js";

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
