/**
 * Settlement and resource markers for the 3D world map: the icon atlas layout and the billboard geometry.
 *
 * - Each marker is one quad of 4 vertices. All 4 vertices have the anchor as position.
 *   The marker shader moves each vertex by its corner offset in view space, so the quad faces the camera.
 * - The quad has a minimum angular size, so far markers stay legible.
 * - Each marker joins the chunk of its cell, so it is culled with the terrain chunk.
 */
import { BRIDGE_DECK } from "./road-paths.js";
import { chunkIndexAt } from "./terrain-chunks.js";

/** Pixels on each side of one icon in the atlas. */
export const ICON_PIXELS = 64;
const ATLAS_COLUMNS = 16;

/**
 * Size, minimum angular size, and lift of each marker layer, in cell units.
 * Settlements are larger than resources.
 */
export const MARKER_STYLES = new Map([
  ["settlements", Object.freeze({ size: 1, minAngle: 0.014, lift: 0.04 })],
  ["resources", Object.freeze({ size: 0.8, minAngle: 0.01, lift: 0.04 })],
]);

/**
 * @param {import("./map-data.js").MapModel} model Map model.
 * @returns {Array<{layer: string, key: string, x: number, y: number, settlement: object, clan: object}>} One marker for each settlement. The key is the same for the same settlement type and clan.
 */
export function settlementMarkers(model) {
  return model.settlements.map((item) => ({ layer: "settlements", key: `settlement:${item.settlement.id}:${item.clan.id}`, x: item.x, y: item.y, settlement: item.settlement, clan: item.clan }));
}

/**
 * @param {import("./map-data.js").MapModel} model Map model.
 * @returns {Array<{layer: string, key: string, x: number, y: number, resource: object}>} One marker for each resource.
 */
export function resourceMarkers(model) {
  return model.resources.map((item) => ({ layer: "resources", key: `resource:${item.resource.id}`, x: item.x, y: item.y, resource: item.resource }));
}

const nextPowerOfTwo = (value) => 2 ** Math.ceil(Math.log2(Math.max(1, value)));

/**
 * Puts each icon key in one atlas cell, in rows of 16 cells.
 * The V coordinate starts at the bottom of the canvas, because Babylon.js turns the canvas upside down on upload.
 * @param {string[]} keys Icon keys. Duplicate keys share one cell.
 * @returns {{width: number, height: number, rects: Map<string, {left: number, top: number, u0: number, v0: number, u1: number, v1: number}>}} Atlas size in pixels and the cell of each key.
 */
export function iconAtlasLayout(keys) {
  // Validation
  if (!Array.isArray(keys)) throw new TypeError("iconAtlasLayout needs a list of keys.");

  // Computation
  const unique = [...new Set(keys)];
  const width = ATLAS_COLUMNS * ICON_PIXELS;
  const height = nextPowerOfTwo(Math.ceil(unique.length / ATLAS_COLUMNS) * ICON_PIXELS);
  const rects = new Map(
    unique.map((key, index) => {
      const [left, top] = [(index % ATLAS_COLUMNS) * ICON_PIXELS, Math.floor(index / ATLAS_COLUMNS) * ICON_PIXELS];
      return [key, { left, top, u0: left / width, v0: 1 - (top + ICON_PIXELS) / height, u1: (left + ICON_PIXELS) / width, v1: 1 - top / height }];
    }),
  );
  return { width, height, rects };
}

/**
 * Builds billboard quads, in one list for each chunk.
 * The anchor is on the surface (or the bridge deck over water), at the cell center.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {Array<{x: number, y: number, lift: number, rect: {u0: number, v0: number, u1: number, v1: number}, corners: number[], shape: number[]}>} quads Quads at cell columns and rows. Corners are [left, bottom, right, top] in cell units, and shape is [growth, maximum distance].
 * @param {number} chunkCells Cells along each chunk edge.
 * @returns {Map<number, {chunk: number, count: number, positions: number[], uvs: number[], corners: number[], shapes: number[], indices: number[]}>} Geometry by chunk index.
 */
export function billboardGeometry(field, quads, chunkCells) {
  const groups = new Map();
  quads.forEach((quad) => {
    const [x, y] = [quad.x + 0.5, quad.y + 0.5];
    const chunk = chunkIndexAt(field.model.columns, chunkCells, x, y);
    if (!groups.has(chunk)) groups.set(chunk, { chunk, count: 0, positions: [], uvs: [], corners: [], shapes: [], indices: [] });
    const group = groups.get(chunk);
    const first = group.count * 4;
    const anchor = [x, Math.max(field.sample(x, y), BRIDGE_DECK) + quad.lift, field.model.rows - y];
    const [left, bottom, right, top] = quad.corners;
    const { u0, v0, u1, v1 } = quad.rect;
    group.positions.push(...anchor, ...anchor, ...anchor, ...anchor);
    group.uvs.push(u0, v0, u1, v0, u1, v1, u0, v1);
    group.corners.push(left, bottom, right, bottom, right, top, left, top);
    group.shapes.push(...quad.shape, ...quad.shape, ...quad.shape, ...quad.shape);
    group.indices.push(first, first + 2, first + 1, first, first + 3, first + 2);
    group.count += 1;
  });
  return groups;
}

/**
 * Builds the billboard quads of one marker layer, in one list for each chunk.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {ReturnType<typeof settlementMarkers> | ReturnType<typeof resourceMarkers>} markers Markers of one layer.
 * @param {ReturnType<typeof iconAtlasLayout>} layout Atlas layout with a cell for each marker key.
 * @param {{size: number, minAngle: number, lift: number}} style Marker style.
 * @param {number} chunkCells Cells along each chunk edge.
 * @returns {ReturnType<typeof billboardGeometry>} Geometry by chunk index.
 */
export function markerGeometry(field, markers, layout, style, chunkCells) {
  const half = style.size / 2;
  const quads = markers.map((marker) => {
    const rect = layout.rects.get(marker.key);
    if (!rect) throw new TypeError(`The atlas has no cell for the marker key ${marker.key}.`);
    return { x: marker.x, y: marker.y, lift: style.lift, rect, corners: [-half, 0, half, style.size], shape: [style.minAngle / style.size, 0] };
  });
  return billboardGeometry(field, quads, chunkCells);
}
