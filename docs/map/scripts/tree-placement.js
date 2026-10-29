/**
 * Tree placement for the 3D world map. The placement is deterministic, so each page load shows the same forest.
 *
 * - Each vegetation cell gets TREES_PER_CELL candidate positions from a hash of the cell and the candidate number.
 * - A candidate is removed when it is near water, on a steep slope, near the snow line, on a road, or in a settlement clearing.
 * - The climate and terrain of the cell select the tree kind (conifer or broadleaf) and the canopy color.
 * - Coordinates are in cell units: x goes east, y goes south.
 */
import { CLIMATE, SETTLEMENT, TERRAIN, VEGETATION } from "../../scripts/world/world-map-layers.js";
import { ROAD_STYLES, buildRoadSegments } from "./road-paths.js";
import { cellSurface } from "./surface-layers.js";
import { HeightField } from "./terrain-height.js";
import { chunkIndexAt } from "./terrain-chunks.js";

export const TREES_PER_CELL = 6;
/** Lowest surface height for a tree. River banks and shores are below it. */
export const TREE_MIN_HEIGHT = 0.06;
/** Lowest normal height (cosine of the slope) for a tree. The terrain shader starts to show rock below 0.8. */
export const TREE_MIN_NORMAL = 0.75;
/** Distance from the road edge to the tree trunk. */
export const ROAD_MARGIN = 0.1;
/** Radius of the clearing around a settlement at its cell center. */
export const SETTLEMENT_CLEARING = 0.35;
const SNOW_MARGIN = 0.2;
const CELL_INSET = 0.08;

export const TREE_KINDS = Object.freeze({ CONIFER: "conifer", BROADLEAF: "broadleaf" });

/** Share of conifers for each climate. Hills add 0.25 and mountains add 0.5. Wetlands have no conifers. */
const CONIFER_SHARES = new Map([
  [CLIMATE.TEMPERATE.id, 0.25],
  [CLIMATE.TROPICAL.id, 0],
  [CLIMATE.DESERT.id, 0],
  [CLIMATE.POLAR.id, 1],
  [CLIMATE.WASTE.id, 0.5],
  [CLIMATE.SHADOWLAND.id, 0.5],
]);
const TERRAIN_CONIFER_SHARES = new Map([
  [TERRAIN.HILLS.id, 0.25],
  [TERRAIN.MOUNTAINS.id, 0.5],
]);

/** Canopy color for each climate and tree kind, as linear RGB values from 0 to 1. */
const CANOPY_COLORS = new Map([
  [CLIMATE.TEMPERATE.id, { conifer: [0.12, 0.27, 0.14], broadleaf: [0.24, 0.42, 0.15] }],
  [CLIMATE.TROPICAL.id, { conifer: [0.1, 0.33, 0.14], broadleaf: [0.16, 0.48, 0.12] }],
  [CLIMATE.DESERT.id, { conifer: [0.36, 0.38, 0.2], broadleaf: [0.42, 0.42, 0.22] }],
  [CLIMATE.POLAR.id, { conifer: [0.13, 0.25, 0.22], broadleaf: [0.3, 0.36, 0.24] }],
  [CLIMATE.WASTE.id, { conifer: [0.3, 0.26, 0.2], broadleaf: [0.34, 0.3, 0.2] }],
  [CLIMATE.SHADOWLAND.id, { conifer: [0.2, 0.14, 0.22], broadleaf: [0.26, 0.15, 0.24] }],
]);

/**
 * Deterministic random value for one cell and one salt.
 * @param {number} x Cell column.
 * @param {number} y Cell row.
 * @param {number} salt Different salts give independent values.
 * @returns {number} Value from 0 to 1.
 */
export function treeRandom(x, y, salt) {
  const mixed = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(salt + 1, 83492791);
  const scrambled = Math.imul(mixed ^ (mixed >>> 15), 2246822519);
  const final = Math.imul(scrambled ^ (scrambled >>> 13), 3266489917);
  return ((final ^ (final >>> 16)) >>> 0) / 4294967296;
}

/**
 * @param {number} climateId Climate catalog ID.
 * @param {number} terrainId Terrain catalog ID.
 * @returns {number} Share of conifers, from 0 to 1.
 */
export function coniferShare(climateId, terrainId) {
  if (terrainId === TERRAIN.WETLANDS.id) return 0;
  return Math.min(1, (CONIFER_SHARES.get(climateId) ?? 0.5) + (TERRAIN_CONIFER_SHARES.get(terrainId) ?? 0));
}

/**
 * @param {number} climateId Climate catalog ID.
 * @param {string} kind Value of TREE_KINDS.
 * @returns {number[]} Canopy color [red, green, blue].
 */
export function canopyColor(climateId, kind) {
  return (CANOPY_COLORS.get(climateId) ?? CANOPY_COLORS.get(CLIMATE.TEMPERATE.id))[kind];
}

function distanceToSegment(x, y, segment) {
  const [lineX, lineY] = [segment.endX - segment.startX, segment.endY - segment.startY];
  const ratio = Math.min(1, Math.max(0, ((x - segment.startX) * lineX + (y - segment.startY) * lineY) / (lineX * lineX + lineY * lineY)));
  return Math.hypot(x - segment.startX - ratio * lineX, y - segment.startY - ratio * lineY);
}

/** Puts each road link under the cells of its two ends, so a tree checks only the links near its cell. */
function segmentsByCell(segments) {
  const cells = new Map();
  const add = (x, y, segment) => cells.set(`${Math.floor(x)},${Math.floor(y)}`, [...(cells.get(`${Math.floor(x)},${Math.floor(y)}`) ?? []), segment]);
  segments.forEach((segment) => {
    add(segment.startX, segment.startY, segment);
    add(segment.endX, segment.endY, segment);
  });
  return cells;
}

function nearRoad(roadCells, x, y) {
  const [column, row] = [Math.floor(x), Math.floor(y)];
  return [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => (roadCells.get(`${column + dx},${row + dy}`) ?? []).some((segment) => distanceToSegment(x, y, segment) < ROAD_STYLES.get(segment.kind).width / 2 + ROAD_MARGIN)));
}

function normalHeight(field, x, y) {
  const column = Math.round(x * field.subdivisions);
  const row = Math.round(y * field.subdivisions);
  return field.normals[(row * field.width + column) * 3 + 1];
}

/**
 * Places the trees of the map.
 * @param {HeightField} field Height field.
 * @returns {Array<{x: number, y: number, height: number, kind: string, scale: number, yaw: number, color: number[]}>} Trees. The height is the surface height at the trunk.
 */
export function placeTrees(field) {
  // Validation
  if (!(field instanceof HeightField)) throw new TypeError("placeTrees needs a HeightField.");

  // Computation
  const { model } = field;
  const [vegetation, climate, terrain, settlement] = ["vegetation", "climate", "terrain", "settlement"].map((layer) => model.ids(layer));
  const roadCells = segmentsByCell(buildRoadSegments(model));
  return [...vegetation.keys()]
    .filter((index) => vegetation[index] === VEGETATION.PRESENT.id && !model.isWater(index % model.columns, Math.floor(index / model.columns)))
    .flatMap((index) => {
      const [column, row] = [index % model.columns, Math.floor(index / model.columns)];
      const snowLine = cellSurface(climate[index], terrain[index]).snowLine;
      const hasSettlement = settlement[index] !== SETTLEMENT.NONE.id;
      return Array.from({ length: TREES_PER_CELL }, (_, candidate) => {
        const random = (salt) => treeRandom(column, row, candidate * 8 + salt);
        const [x, y] = [column + CELL_INSET + random(0) * (1 - 2 * CELL_INSET), row + CELL_INSET + random(1) * (1 - 2 * CELL_INSET)];
        const height = field.sample(x, y);
        if (height < TREE_MIN_HEIGHT || normalHeight(field, x, y) < TREE_MIN_NORMAL) return null;
        if (snowLine > 0 && height > snowLine - SNOW_MARGIN) return null;
        if (hasSettlement && Math.hypot(x - column - 0.5, y - row - 0.5) < SETTLEMENT_CLEARING) return null;
        if (nearRoad(roadCells, x, y)) return null;
        const kind = random(2) < coniferShare(climate[index], terrain[index]) ? TREE_KINDS.CONIFER : TREE_KINDS.BROADLEAF;
        const shade = 0.85 + random(3) * 0.3;
        const color = canopyColor(climate[index], kind).map((channel) => Math.min(1, channel * shade));
        return { x, y, height, kind, scale: 0.8 + random(4) * 0.45, yaw: random(5) * 2 * Math.PI, color };
      }).filter(Boolean);
    });
}

/**
 * Places the trees and puts them in one list for each chunk and tree kind.
 * @param {HeightField} field Height field.
 * @param {number} chunkCells Cells along each chunk edge.
 * @returns {Map<string, {chunk: number, kind: string, trees: ReturnType<typeof placeTrees>}>} Trees by "chunk:kind" key.
 */
export function buildTreeGroups(field, chunkCells) {
  const groups = new Map();
  placeTrees(field).forEach((tree) => {
    const chunk = chunkIndexAt(field.model.columns, chunkCells, tree.x, tree.y);
    const key = `${chunk}:${tree.kind}`;
    if (!groups.has(key)) groups.set(key, { chunk, kind: tree.kind, trees: [] });
    groups.get(key).trees.push(tree);
  });
  return groups;
}
