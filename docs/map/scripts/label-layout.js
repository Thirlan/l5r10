/**
 * Settlement and map labels for the 3D world map: the label text, the label atlas layout, and the billboard geometry.
 *
 * - A settlement label shows the name and the settlement type, above the settlement marker.
 * - A map label shows the text of a map text cell, for example a forest or a lake name.
 * - The labels use the same billboard material as the markers.
 *   A settlement label grows with its marker, so they do not overlap.
 */
import { getSettlementLabelSize } from "../../scripts/world/world-map-img-settlements.js";
import { MARKER_STYLES, billboardGeometry } from "./marker-layout.js";

/** Atlas pixels for each 2D map pixel. */
export const LABEL_SCALE = 4;
/** Atlas pixels around each label, so the white outline is not cut. */
export const LABEL_PADDING = 6;
const MAP_CELL_PIXELS = 16;
const ATLAS_WIDTH = 2048;
/** Gap between a settlement marker and its label, in cell units. */
const LABEL_GAP = 0.05;
/** A settlement label shows nearer than this distance for each font pixel. So the labels of larger settlements show from farther. */
const LABEL_DISTANCE_PER_FONT_PIXEL = 8;
/** Growth of the map labels with distance. It keeps the map labels legible on the whole-map view. */
const MAP_LABEL_GROWTH = 0.016;

/**
 * Gets the text of one map text cell in the selected language, with the same fallback as the 2D map.
 * @param {string | {text?: string, englishText?: string, rokuganiText?: string}} text Saved text.
 * @param {"english" | "rokugani"} language Language.
 * @returns {string} Text, or an empty string.
 */
export function labelText(text, language) {
  if (typeof text === "string") return text;
  return language === "english" ? text.englishText || text.text || text.rokuganiText || "" : text.rokuganiText || text.text || text.englishText || "";
}

/**
 * @param {import("./map-data.js").MapModel} model Map model.
 * @param {"english" | "rokugani"} language Language.
 * @returns {Array<{key: string, x: number, y: number, lines: string[], fontSize: number, bottom: number, growth: number, maxDistance: number}>} One label for each settlement with a name.
 */
export function settlementLabels(model, language) {
  const marker = MARKER_STYLES.get("settlements");
  return model.settlements
    .map((item) => ({ item, name: language === "english" ? item.englishName : item.rokuganiName }))
    .filter(({ name }) => name)
    .map(({ item, name }) => {
      const fontSize = getSettlementLabelSize(item.settlement);
      const type = language === "english" ? item.settlement.englishType : item.settlement.rokuganiType;
      return { key: `settlement:${item.x},${item.y}`, x: item.x, y: item.y, lines: [name, type].filter(Boolean), fontSize, bottom: marker.size + LABEL_GAP, growth: marker.minAngle / marker.size, maxDistance: fontSize * LABEL_DISTANCE_PER_FONT_PIXEL };
    });
}

/**
 * @param {import("./map-data.js").MapModel} model Map model.
 * @param {"english" | "rokugani"} language Language.
 * @returns {ReturnType<typeof settlementLabels>} One label for each map text cell with text. Map labels show at all distances.
 */
export function mapLabels(model, language) {
  return model.labels
    .map((label) => ({ label, lines: labelText(label.text, language).split(/\r?\n/).filter(Boolean) }))
    .filter(({ lines }) => lines.length > 0)
    .map(({ label, lines }) => ({ key: `map:${label.x},${label.y}`, x: label.x, y: label.y, lines, fontSize: label.fontSize, bottom: 0, growth: MAP_LABEL_GROWTH, maxDistance: 0 }));
}

const nextPowerOfTwo = (value) => 2 ** Math.ceil(Math.log2(Math.max(1, value)));

/**
 * Puts each label in one atlas rectangle, in shelves of equal height.
 * The V coordinate starts at the bottom of the canvas, because Babylon.js turns the canvas upside down on upload.
 * @param {ReturnType<typeof settlementLabels>} labels Labels.
 * @param {(line: string, fontSize: number) => number} measure Width of one text line in 2D map pixels.
 * @returns {{width: number, height: number, rects: Map<string, {left: number, top: number, width: number, height: number, u0: number, v0: number, u1: number, v1: number}>}} Atlas size in pixels and the rectangle of each label key.
 */
export function labelAtlasLayout(labels, measure) {
  // Validation
  if (!Array.isArray(labels) || typeof measure !== "function") throw new TypeError("labelAtlasLayout needs a list of labels and a measure function.");

  // Computation
  const sizes = labels.map((label) => ({
    key: label.key,
    width: Math.ceil(Math.max(...label.lines.map((line) => measure(line, label.fontSize))) * LABEL_SCALE) + 2 * LABEL_PADDING,
    height: Math.ceil(label.lines.length * label.fontSize * LABEL_SCALE) + 2 * LABEL_PADDING,
  }));
  const tooWide = sizes.find((size) => size.width > ATLAS_WIDTH);
  if (tooWide) throw new RangeError(`The label ${tooWide.key} is wider than the label atlas.`);
  const shelf = { left: 0, top: 0, height: 0 };
  const placed = [...sizes]
    .sort((first, second) => second.height - first.height)
    .map((size) => {
      if (shelf.left + size.width > ATLAS_WIDTH) Object.assign(shelf, { left: 0, top: shelf.top + shelf.height, height: 0 });
      const place = { ...size, left: shelf.left, top: shelf.top };
      Object.assign(shelf, { left: shelf.left + size.width, height: Math.max(shelf.height, size.height) });
      return place;
    });
  const height = nextPowerOfTwo(shelf.top + shelf.height);
  const rects = new Map(placed.map((place) => [place.key, { left: place.left, top: place.top, width: place.width, height: place.height, u0: place.left / ATLAS_WIDTH, v0: 1 - (place.top + place.height) / height, u1: (place.left + place.width) / ATLAS_WIDTH, v1: 1 - place.top / height }]));
  return { width: ATLAS_WIDTH, height, rects };
}

/**
 * Builds the billboard quads of the labels, in one list for each chunk.
 * One cell is 16 map pixels, so a label has the same size in cells as on the 2D map.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {ReturnType<typeof settlementLabels>} labels Labels.
 * @param {ReturnType<typeof labelAtlasLayout>} layout Atlas layout with a rectangle for each label key.
 * @param {number} chunkCells Cells along each chunk edge.
 * @returns {ReturnType<typeof billboardGeometry>} Geometry by chunk index.
 */
export function labelGeometry(field, labels, layout, chunkCells) {
  const lift = MARKER_STYLES.get("settlements").lift;
  const quads = labels.map((label) => {
    const rect = layout.rects.get(label.key);
    if (!rect) throw new TypeError(`The atlas has no rectangle for the label key ${label.key}.`);
    const [width, height] = [rect.width, rect.height].map((pixels) => pixels / (LABEL_SCALE * MAP_CELL_PIXELS));
    return { x: label.x, y: label.y, lift, rect, corners: [-width / 2, label.bottom, width / 2, label.bottom + height], shape: [label.growth, label.maxDistance] };
  });
  return billboardGeometry(field, quads, chunkCells);
}
