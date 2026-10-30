/**
 * Surface layer catalog for the 3D terrain.
 *
 * A surface layer is one PBR texture set. Its index is the layer index in the
 * texture arrays. Each climate gives a layer for the flat, hills, rock, and
 * snow roles. A role without a layer uses the default layer (moon_dusted_01).
 */
import { CLIMATE, TERRAIN } from "../../scripts/world/world-map-layers.js";

/** Height units for the snow line in the blue channel of the cell ID texture. */
export const SNOW_LINE_UNITS = 100;

/** Water class in the alpha channel of the cell ID texture. Land uses the lake class, so that river channels get the lake color. */
export const WATER_CLASS = Object.freeze({ LAKE: 1, COASTAL: 2, OCEAN: 3 });

/**
 * Makes the file names of one texture set.
 * @param {string} name Texture set name, for example "grass_ground".
 * @param {"exr"|"jpg"|null} roughness File type of the roughness map, or null when the set has no roughness map.
 * @returns {Readonly<{name: string, diffuse: string, displacement: string, normal: string, roughness: string|null}>} Texture set.
 */
function textureSet(name, roughness = "exr") {
  return Object.freeze({
    name,
    diffuse: `${name}_diff_1k.jpg`,
    displacement: `${name}_disp_1k.png`,
    normal: `${name}_nor_gl_1k.exr`,
    roughness: roughness ? `${name}_rough_1k.${roughness}` : null,
  });
}

/** All texture sets in layer order. Layer 0 is the default layer. */
export const TEXTURE_SETS = Object.freeze([textureSet("moon_dusted_01"), textureSet("grass_ground"), textureSet("rocky_terrain_02"), textureSet("marble_cliff_05"), textureSet("snow_02", "jpg"), textureSet("marble_rock_03"), textureSet("leafy_grass"), textureSet("aerial_rocks_02", "jpg"), textureSet("sand_01", "jpg"), textureSet("rock_06", "jpg"), textureSet("marble_cliff_02"), textureSet("mud_cracked_dry_riverbed_002"), textureSet("rocks_ground_05", "jpg"), textureSet("rock_boulder_dry"), textureSet("brown_mud_03", null), textureSet("dark_rock"), textureSet("road_damaged"), textureSet("pavement_04")]);

/**
 * Finds the layer index of a texture set.
 * @param {string} name Texture set name.
 * @returns {number} Layer index.
 */
export function layerIndex(name) {
  const index = TEXTURE_SETS.findIndex((set) => set.name === name);
  if (index < 0) throw new TypeError(`There is no texture set "${name}".`);
  return index;
}

export const DEFAULT_LAYER = layerIndex("moon_dusted_01");
export const SNOW_LAYER = layerIndex("snow_02");

/** Texture set names for each climate role. The snow line is in height units. */
const CLIMATE_SURFACES = new Map([
  [CLIMATE.TEMPERATE.id, { flat: "grass_ground", hills: "rocky_terrain_02", rock: "marble_cliff_05", snowLine: 1.55 }],
  [CLIMATE.POLAR.id, { rock: "marble_rock_03", snowLine: 1.2 }],
  [CLIMATE.TROPICAL.id, { flat: "leafy_grass", rock: "aerial_rocks_02" }],
  [CLIMATE.DESERT.id, { flat: "sand_01", hills: "marble_cliff_02", rock: "rock_06" }],
  [CLIMATE.WASTE.id, { flat: "mud_cracked_dry_riverbed_002", hills: "rocks_ground_05", rock: "rock_boulder_dry" }],
  [CLIMATE.SHADOWLAND.id, { flat: "brown_mud_03", rock: "dark_rock" }],
]);

/** Climate role of each terrain. Terrains that are not in the map use the default layer. */
const TERRAIN_ROLES = new Map([
  [TERRAIN.FLAT.id, "flat"],
  [TERRAIN.HILLS.id, "hills"],
  [TERRAIN.MOUNTAINS.id, "rock"],
  [TERRAIN.CLIFF.id, "rock"],
]);

const WATER_CLASSES = new Map([
  [TERRAIN.WATER.id, WATER_CLASS.LAKE],
  [TERRAIN.COASTAL_WATER.id, WATER_CLASS.COASTAL],
  [TERRAIN.OCEAN.id, WATER_CLASS.OCEAN],
]);

/**
 * Finds the surface layers of one cell.
 * @param {number} climateId Climate catalog ID.
 * @param {number} terrainId Terrain catalog ID.
 * @returns {{primary: number, rock: number, snowLine: number}} Primary layer, steep-slope layer, and snow line (0 = no snow).
 */
export function cellSurface(climateId, terrainId) {
  // Validation
  if (!Number.isInteger(climateId) || !Number.isInteger(terrainId)) throw new TypeError("cellSurface needs integer catalog IDs.");

  // Computation
  const surfaces = CLIMATE_SURFACES.get(climateId) ?? {};
  const role = TERRAIN_ROLES.get(terrainId);
  const layerOf = (name) => (name ? layerIndex(name) : DEFAULT_LAYER);
  return {
    primary: layerOf(role ? surfaces[role] : undefined),
    rock: layerOf(surfaces.rock),
    snowLine: terrainId === TERRAIN.MOUNTAINS.id ? (surfaces.snowLine ?? 0) : 0,
  };
}

/**
 * Packs the cell ID texture: red = primary layer, green = steep-slope layer,
 * blue = snow line in 1/100 height units (0 = no snow), alpha = water class.
 * Rows are in map row order, so row 0 is north.
 * @param {import("./map-data.js").MapModel} model Map model.
 * @returns {Uint8Array} RGBA bytes, 4 for each cell.
 */
export function packCellIds(model) {
  // Validation
  if (!model || typeof model.ids !== "function") throw new TypeError("packCellIds needs a MapModel.");

  // Computation
  const terrain = model.ids("terrain");
  const climate = model.ids("climate");
  const pixels = new Uint8Array(terrain.length * 4);
  terrain.forEach((terrainId, index) => {
    const surface = cellSurface(climate[index], terrainId);
    pixels.set([surface.primary, surface.rock, Math.round(surface.snowLine * SNOW_LINE_UNITS), WATER_CLASSES.get(terrainId) ?? WATER_CLASS.LAKE], index * 4);
  });
  return pixels;
}
