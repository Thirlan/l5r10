/**
 * River channel paths for the 3D world map.
 * The rules follow the 2D river layer: a river cell connects to a river neighbor if either cell has the
 * saved direction flag toward the other, and a river mouth opens into a cardinal water neighbor.
 * Coordinates are in cell units: x goes east, y goes south, and the cell center is at (x + 0.5, y + 0.5).
 */
import { RIVER } from "../../scripts/world/world-map-layers.js";
import { RIVER_OFFSETS } from "../../scripts/world/world-map-img-river.js";
import { MapModel } from "./map-data.js";

/**
 * Tells if two river cells connect in a direction.
 * @param {MapModel} model Map model.
 * @param {number} x Column of the first cell.
 * @param {number} y Row of the first cell.
 * @param {number} direction Direction index from 0 (north) to 7 (northwest).
 * @returns {boolean} True if the neighbor in that direction is a connected river cell.
 */
export function isRiverConnected(model, x, y, direction) {
  const [, dx, dy] = RIVER_OFFSETS[direction];
  const neighborX = x + dx;
  const neighborY = y + dy;
  if (!model.contains(neighborX, neighborY)) return false;
  const rivers = model.ids("river");
  if (rivers[model.index(neighborX, neighborY)] === RIVER.NONE.id) return false;
  if (model.savedCell(x, y)["river direction"] === undefined) return true;
  const outgoing = (model.riverMask[model.index(x, y)] >> direction) & 1;
  const incoming = (model.riverMask[model.index(neighborX, neighborY)] >> ((direction + 4) % 8)) & 1;
  return outgoing === 1 || incoming === 1;
}

/**
 * Makes the channel segments of one river cell.
 * @param {MapModel} model Map model.
 * @param {number} x Column.
 * @param {number} y Row.
 * @returns {Array<number[]>} Segments as [startX, startY, endX, endY] in cell units.
 */
function cellSegments(model, x, y) {
  const centerX = x + 0.5;
  const centerY = y + 0.5;
  const mask = model.riverMask[model.index(x, y)];
  return RIVER_OFFSETS.flatMap(([, dx, dy], direction) => {
    const inside = model.contains(x + dx, y + dy);
    const flagged = ((mask >> direction) & 1) === 1;
    const cardinal = dx === 0 || dy === 0;
    if (inside && model.isWater(x + dx, y + dy) && (cardinal || flagged)) return [[centerX, centerY, centerX + dx, centerY + dy]];
    if (flagged || isRiverConnected(model, x, y, direction)) return [[centerX, centerY, centerX + dx / 2, centerY + dy / 2]];
    return [];
  });
}

/**
 * Builds all river channel segments of the map.
 * Two connected river cells each add a half segment, so together they make one segment from center to center.
 * A segment into water goes on to the center of the water cell, so the channel reaches the lake or the sea.
 * @param {MapModel} model Map model.
 * @returns {Array<number[]>} Segments as [startX, startY, endX, endY] in cell units.
 */
export function buildRiverSegments(model) {
  if (!(model instanceof MapModel)) throw new TypeError("buildRiverSegments needs a MapModel.");
  const rivers = model.ids("river");
  return [...rivers.keys()].filter((index) => rivers[index] !== RIVER.NONE.id).flatMap((index) => cellSegments(model, index % model.columns, Math.floor(index / model.columns)));
}
