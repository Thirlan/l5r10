/**
 * The factory of world map tiles (see world-map-tile.js).
 * It owns the translation of a saved cell of the map file into a tile.
 * Layer values become catalog objects from world-map-layers.js, for example TERRAIN.FLAT or ANIMAL.HIGH.
 * A missing layer uses its default value: the "none" value, flat terrain, temperate climate, or level 0.
 *
 * Usage
 * const tile = createWorldMapTile(10, 20, mapFile.tiles["10,20"]);
 * tile.terrain.name;
 */
import { getElevation } from "./world-map-elevation.js";
import { ANIMAL, CLAN, CLIMATE, CRIME, INFRASTRUCTURE, LAYERS, RESOURCE, RESOURCE_LEVEL, RIVER, SETTLEMENT, SHADOWLAND, SPIRIT, TERRAIN, VEGETATION } from "./world-map-layers.js";
import { RIVER_OFFSETS } from "./world-map-data.const.js";
import { WorldMapTile } from "./world-map-tile.js";

/** Tile properties that hold one catalog value: [property and saved field, layer, default value]. */
const CATALOG_FIELDS = Object.freeze([
  ["terrain", LAYERS.TERRAIN, TERRAIN.FLAT],
  ["climate", LAYERS.CLIMATE, CLIMATE.TEMPERATE],
  ["vegetation", LAYERS.VEGETATION, VEGETATION.NONE],
  ["river", LAYERS.RIVER, RIVER.NONE],
  ["infrastructure", LAYERS.INFRASTRUCTURE, INFRASTRUCTURE.NONE],
  ["clan", LAYERS.CLAN, CLAN.NONE],
  ["settlement", LAYERS.SETTLEMENT, SETTLEMENT.NONE],
  ["resource", LAYERS.RESOURCE, RESOURCE.NONE],
  ["resourceLevel", LAYERS.RESOURCE_LEVEL, RESOURCE_LEVEL.NONE],
  ["animal", LAYERS.ANIMAL, ANIMAL.NONE],
  ["spirit", LAYERS.SPIRIT, SPIRIT.NONE],
  ["shadowland", LAYERS.SHADOWLAND, SHADOWLAND.NONE],
  ["crime", LAYERS.CRIME, CRIME.NONE],
]);

function readText(cell, field, x, y) {
  const value = cell[field] ?? "";
  if (typeof value !== "string") throw new TypeError(`The tile ${x},${y} field "${field}" must be a text.`);
  return value;
}

/**
 * Reads a saved label: a text, {text, fontSize}, or {englishText, rokuganiText, fontSize}.
 * A missing language text uses the other texts in the order of the map renderers.
 */
function readLabel(cell, x, y) {
  if (cell.text === undefined) return null;
  const saved = typeof cell.text === "string" ? { text: cell.text } : cell.text;
  const texts = [saved?.text, saved?.englishText, saved?.rokuganiText];
  const fontSize = saved?.fontSize ?? null;
  if (texts.some((text) => text !== undefined && typeof text !== "string") || texts.every((text) => !text) || (fontSize !== null && !(Number.isFinite(fontSize) && fontSize > 0))) {
    throw new TypeError(`The tile ${x},${y} label needs a text and an optional positive font size.`);
  }
  const [text, englishText, rokuganiText] = texts;
  return { englishText: englishText || text || rokuganiText, rokuganiText: rokuganiText || text || englishText, fontSize };
}

function readRiverDirections(cell, x, y) {
  const flags = cell["river direction"] ?? {};
  if (typeof flags !== "object" || Array.isArray(flags)) throw new TypeError(`The tile ${x},${y} river directions must be an object.`);
  return RIVER_OFFSETS.map((_, direction) => flags[direction] === 1);
}

/**
 * Makes a world map tile from a saved cell of the map file.
 * Catalog layer properties: terrain, climate, vegetation, river, infrastructure, clan, settlement, resource,
 * resourceLevel, animal, spirit, shadowland, and crime. Each holds one catalog value.
 * @param {number} x Tile column.
 * @param {number} y Tile row.
 * @param {Object} [cell] Saved cell of the map file. A missing cell has the default values of all layers.
 * @returns {import("./world-map-tile.js").WorldMapTile} A read-only tile.
 */
export function createWorldMapTile(x, y, cell = {}) {
  // Validation
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new TypeError("A map tile needs integer coordinates.");
  if (!cell || typeof cell !== "object" || Array.isArray(cell)) throw new TypeError(`The tile ${x},${y} must be an object.`);

  // Translation
  const catalogValues = Object.fromEntries(
    CATALOG_FIELDS.map(([field, layer, fallback]) => {
      const value = cell[field] === undefined ? fallback : layer.getValue(cell[field]);
      if (!value) throw new TypeError(`The tile ${x},${y} has an unknown ${field} value: ${cell[field]}.`);
      return [field, value];
    }),
  );

  // Output
  return new WorldMapTile({
    x,
    y,
    ...catalogValues,
    elevation: getElevation(cell),
    riverDirections: readRiverDirections(cell, x, y),
    englishName: readText(cell, "englishName", x, y),
    rokuganiName: readText(cell, "rokuganiName", x, y),
    label: readLabel(cell, x, y),
  });
}
