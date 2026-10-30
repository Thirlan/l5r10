/**
 * Road and footpath paths for the 3D world map, and their ribbon geometry on the terrain.
 *
 * - The links follow the 2D infrastructure layer. A road or footpath cell links to its east, south,
 *   southeast, and northeast neighbors when they have any infrastructure. Ports start no links.
 * - A ribbon follows the sampled terrain height. Over river channels and water, it stays at BRIDGE_DECK.
 * - Each ribbon vertex is at the highest surface point on the edges to its neighbor vertices, plus a lift.
 *   So the terrain does not come through the ribbon between two vertices.
 * - Coordinates are in cell units: x goes east, y goes south, and the cell center is at (x + 0.5, y + 0.5).
 */
import { INFRASTRUCTURE } from "../../scripts/world/world-map-layers.js";
import { MapModel } from "./map-data.js";
import { chunkIndexAt } from "./terrain-chunks.js";

/** Forward links of the 2D infrastructure layer: east, south, southeast, northeast. */
const FORWARD_LINKS = Object.freeze([
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
]);
const RIBBON_STEP = 0.125;
/** Side offsets of the ribbon vertex lines: left edge, middle, right edge. */
const RIBBON_LINES = Object.freeze([1, 0, -1]);
const COVER_SAMPLES = 4;
const DISC_SIDES = 8;
const TEXTURE_REPEATS_PER_CELL = 3;

/** Lowest height of a road. Roads over river channels and water stay at this height, like a bridge deck. */
export const BRIDGE_DECK = 0.05;

/** Ribbon width, lift over the terrain, and texture set for each path kind. Roads are higher than footpaths where they meet. */
export const ROAD_STYLES = new Map([
  [INFRASTRUCTURE.ROAD.id, Object.freeze({ name: "road", width: 0.2, lift: 0.03, texture: "pavement_04" })],
  [INFRASTRUCTURE.FOOTPATH.id, Object.freeze({ name: "footpath", width: 0.11, lift: 0.025, texture: "road_damaged" })],
]);

/**
 * Builds the road and footpath links of the map. Each link starts at a road or footpath cell.
 * @param {MapModel} model Map model.
 * @returns {Array<Readonly<{kind: number, startX: number, startY: number, endX: number, endY: number}>>} Links from cell center to cell center.
 */
export function buildRoadSegments(model) {
  // Validation
  if (!(model instanceof MapModel)) throw new TypeError("buildRoadSegments needs a MapModel.");

  // Computation
  const infrastructure = model.ids("infrastructure");
  const hasInfrastructure = (x, y) => model.contains(x, y) && infrastructure[model.index(x, y)] !== INFRASTRUCTURE.NONE.id;
  return [...infrastructure.keys()]
    .filter((index) => ROAD_STYLES.has(infrastructure[index]))
    .flatMap((index) => {
      const [x, y] = [index % model.columns, Math.floor(index / model.columns)];
      return FORWARD_LINKS.filter(([dx, dy]) => hasInfrastructure(x + dx, y + dy)).map(([dx, dy]) => Object.freeze({ kind: infrastructure[index], startX: x + 0.5, startY: y + 0.5, endX: x + dx + 0.5, endY: y + dy + 0.5 }));
    });
}

/**
 * Finds the cell centers where links meet. A junction uses the kind of its own cell, or the kind of the link for a port.
 * @param {MapModel} model Map model.
 * @param {ReadonlyArray<{kind: number, startX: number, startY: number, endX: number, endY: number}>} segments Links from buildRoadSegments.
 * @returns {Array<{kind: number, x: number, y: number}>} Junctions at cell centers.
 */
export function roadJunctions(model, segments) {
  const infrastructure = model.ids("infrastructure");
  const junctions = new Map();
  segments.forEach((segment) =>
    [
      [segment.startX, segment.startY],
      [segment.endX, segment.endY],
    ].forEach(([x, y]) => {
      const cellKind = infrastructure[model.index(Math.floor(x), Math.floor(y))];
      const kind = ROAD_STYLES.has(cellKind) ? cellKind : segment.kind;
      junctions.set(`${kind}:${x},${y}`, { kind, x, y });
    }),
  );
  return [...junctions.values()];
}

/**
 * Finds the base height of a road point: the surface, but never lower than the bridge deck.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {number} x Position east, in cell units.
 * @param {number} y Position south, in cell units.
 * @returns {number} Road base height.
 */
export function roadBase(field, x, y) {
  return Math.max(field.sample(x, y), BRIDGE_DECK);
}

/**
 * Finds the highest road base on the lines from a point to its neighbors.
 * When each vertex is at least this high, the surface stays under every edge between two vertices.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {number[]} point Position [x, y] in cell units.
 * @param {number[][]} neighbors Positions of the neighbor vertices.
 * @returns {number} Highest road base.
 */
function coverHeight(field, point, neighbors) {
  const [x, y] = point;
  const samples = neighbors.flatMap(([neighborX, neighborY]) => Array.from({ length: COVER_SAMPLES }, (_, sample) => (sample + 1) / COVER_SAMPLES).map((ratio) => roadBase(field, x + (neighborX - x) * ratio, y + (neighborY - y) * ratio)));
  return Math.max(roadBase(field, x, y), ...samples);
}

/**
 * Adds vertices in world coordinates with planar texture coordinates. Each vertex covers the lines to its neighbors.
 * @param {{positions: number[], uvs: number[]}} target Geometry lists.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {number[][]} points Positions [x, y] in cell units.
 * @param {number[][]} neighborLists Indices into points of the neighbors of each point.
 * @param {number} lift Height over the covered surface.
 * @returns {number[]} Indices of the new vertices.
 */
function addVertices(target, field, points, neighborLists, lift) {
  const firstVertex = target.positions.length / 3;
  points.forEach((point, index) => {
    const worldZ = field.model.rows - point[1];
    const height =
      coverHeight(
        field,
        point,
        neighborLists[index].map((neighbor) => points[neighbor]),
      ) + lift;
    target.positions.push(point[0], height, worldZ);
    target.uvs.push(point[0] * TEXTURE_REPEATS_PER_CELL, worldZ * TEXTURE_REPEATS_PER_CELL);
  });
  return points.map((_, index) => firstVertex + index);
}

/**
 * Adds one triangle that faces up, in the same winding as the terrain chunks.
 * @param {{positions: number[], indices: number[]}} target Geometry lists.
 * @param {number[]} corners Three vertex indices.
 * @returns {void}
 */
function addUpTriangle(target, [first, second, third]) {
  const point = (index) => [target.positions[index * 3], target.positions[index * 3 + 2]];
  const [[ax, az], [bx, bz], [cx, cz]] = [point(first), point(second), point(third)];
  const turn = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
  target.indices.push(...(turn > 0 ? [first, second, third] : [first, third, second]));
}

/**
 * Adds a ribbon along one link. It has a left, a middle, and a right vertex every RIBBON_STEP cells, so it follows the terrain.
 * @param {{positions: number[], uvs: number[], indices: number[]}} target Geometry lists.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {{startX: number, startY: number, endX: number, endY: number}} segment Link.
 * @param {{width: number, lift: number}} style Path style.
 * @returns {void}
 */
export function addRibbon(target, field, segment, style) {
  const { startX, startY, endX, endY } = segment;
  const length = Math.hypot(endX - startX, endY - startY);
  const steps = Math.max(1, Math.ceil(length / RIBBON_STEP));
  const [sideX, sideY] = [((startY - endY) / length) * (style.width / 2), ((endX - startX) / length) * (style.width / 2)];
  const lines = RIBBON_LINES.length;
  const points = Array.from({ length: (steps + 1) * lines }, (_, index) => {
    const [step, side] = [Math.floor(index / lines), RIBBON_LINES[index % lines]];
    return [startX + ((endX - startX) * step) / steps + sideX * side, startY + ((endY - startY) * step) / steps + sideY * side];
  });
  const neighborLists = points.map((_, index) => {
    const [step, line] = [Math.floor(index / lines), index % lines];
    return [-1, 0, 1]
      .flatMap((stepOffset) => [-1, 0, 1].map((lineOffset) => [step + stepOffset, line + lineOffset]))
      .filter(([otherStep, otherLine]) => otherStep >= 0 && otherStep <= steps && otherLine >= 0 && otherLine < lines && (otherStep !== step || otherLine !== line))
      .map(([otherStep, otherLine]) => otherStep * lines + otherLine);
  });
  const vertices = addVertices(target, field, points, neighborLists, style.lift);
  Array.from({ length: steps * (lines - 1) }).forEach((_, quad) => {
    const [step, line] = [Math.floor(quad / (lines - 1)), quad % (lines - 1)];
    const [first, second, third, fourth] = [vertices[step * lines + line], vertices[step * lines + line + 1], vertices[(step + 1) * lines + line], vertices[(step + 1) * lines + line + 1]];
    addUpTriangle(target, [first, third, second]);
    addUpTriangle(target, [second, third, fourth]);
  });
}

/**
 * Adds a round cap at a junction, so that the ribbons that meet there join without gaps.
 * @param {{positions: number[], uvs: number[], indices: number[]}} target Geometry lists.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {{x: number, y: number}} center Junction.
 * @param {{width: number, lift: number}} style Path style.
 * @returns {void}
 */
export function addDisc(target, field, center, style) {
  const ring = Array.from({ length: DISC_SIDES }, (_, side) => {
    const angle = (2 * Math.PI * side) / DISC_SIDES;
    return [center.x + (Math.cos(angle) * style.width) / 2, center.y + (Math.sin(angle) * style.width) / 2];
  });
  const ringNeighbors = ring.map((_, side) => [0, 1 + ((side + DISC_SIDES - 1) % DISC_SIDES), 1 + ((side + 1) % DISC_SIDES)]);
  const [middle, ...edge] = addVertices(target, field, [[center.x, center.y], ...ring], [ring.map((_, side) => side + 1), ...ringNeighbors], style.lift);
  edge.forEach((vertex, side) => addUpTriangle(target, [middle, vertex, edge[(side + 1) % DISC_SIDES]]));
}

/**
 * Builds the ribbon and cap geometry of all paths, in one list for each chunk and path kind.
 * A link joins the chunk of its midpoint. A cap joins the chunk of its cell.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {number} chunkCells Cells along each chunk edge.
 * @returns {Map<string, {chunk: number, kind: number, positions: number[], uvs: number[], indices: number[]}>} Geometry by "chunk:kind" key.
 */
export function buildRoadGeometry(field, chunkCells) {
  const segments = buildRoadSegments(field.model);
  const groups = new Map();
  const groupAt = (x, y, kind) => {
    const chunk = chunkIndexAt(field.model.columns, chunkCells, x, y);
    const key = `${chunk}:${kind}`;
    if (!groups.has(key)) groups.set(key, { chunk, kind, positions: [], uvs: [], indices: [] });
    return groups.get(key);
  };
  segments.forEach((segment) => addRibbon(groupAt((segment.startX + segment.endX) / 2, (segment.startY + segment.endY) / 2, segment.kind), field, segment, ROAD_STYLES.get(segment.kind)));
  roadJunctions(field.model, segments).forEach((junction) => addDisc(groupAt(junction.x, junction.y, junction.kind), field, junction, ROAD_STYLES.get(junction.kind)));
  return groups;
}
