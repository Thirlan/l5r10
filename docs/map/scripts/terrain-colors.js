/**
 * Temporary terrain colors for the 3D world map.
 * The colors come from the base presentation module: the climate control images and getWaterColor().
 * The page uses these vertex colors until the PBR textures load, and when WebGL2 is not available.
 */
import { CLIMATE, TERRAIN } from "../../scripts/world/world-map-layers.js";
import { BASE_LAYER_CONTROL_IMAGES, getWaterColor } from "../../scripts/world/world-map-img-base-layers.js";
import { isWaterTerrain } from "./map-data.js";
import { HeightField } from "./terrain-height.js";

const ROCK_COLOR = Object.freeze([0.46, 0.44, 0.42]);
const STEEP_NORMAL = 0.8;

/**
 * Converts a "#rrggbb" color to RGB values from 0 to 1.
 * @param {string} hex Color text.
 * @returns {number[]} Red, green, and blue.
 */
export function hexToRgb(hex) {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex ?? "");
  if (!match) throw new TypeError(`Not a #rrggbb color: ${hex}`);
  return match.slice(1).map((part) => Number.parseInt(part, 16) / 255);
}

/**
 * Loads the climate swatch colors from the climate control images, and the water colors.
 * @returns {Promise<{climate: Map<number, number[]>, water: Map<number, number[]>}>} Colors by catalog ID.
 */
export async function loadSurfacePalette() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const climates = BASE_LAYER_CONTROL_IMAGES.filter(({ value }) => Object.values(CLIMATE).includes(value));
  const climate = new Map(
    await Promise.all(
      climates.map(async ({ value, image }) => {
        const element = new Image();
        element.src = image;
        await element.decode();
        context.drawImage(element, element.naturalWidth / 2, element.naturalHeight / 2, 1, 1, 0, 0, 1, 1);
        return [value.id, [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)].map((channel) => channel / 255)];
      }),
    ),
  );
  const water = new Map([TERRAIN.WATER, TERRAIN.COASTAL_WATER, TERRAIN.OCEAN].map((terrain) => [terrain.id, hexToRgb(getWaterColor(terrain))]));
  return { climate, water };
}

/**
 * Makes one RGBA color for each lattice point: the climate color on land, rock on steep slopes, and water below height 0.
 * @param {HeightField} field Global height lattice.
 * @param {{climate: Map<number, number[]>, water: Map<number, number[]>}} palette Colors by catalog ID.
 * @returns {Float32Array} Four values for each lattice point.
 */
export function terrainVertexColors(field, palette) {
  // Validation
  if (!(field instanceof HeightField)) throw new TypeError("terrainVertexColors needs a HeightField.");
  if (!palette || !(palette.climate instanceof Map) || !(palette.water instanceof Map)) throw new TypeError("terrainVertexColors needs climate and water colors.");

  // Computation
  const { model, subdivisions } = field;
  const terrain = model.ids("terrain");
  const climate = model.ids("climate");
  const colors = new Float32Array(field.heights.length * 4);
  field.heights.forEach((height, index) => {
    const x = Math.min(model.columns - 1, Math.floor((index % field.width) / subdivisions));
    const y = Math.min(model.rows - 1, Math.floor(Math.floor(index / field.width) / subdivisions));
    const cell = y * model.columns + x;
    const waterId = isWaterTerrain(terrain[cell]) ? terrain[cell] : TERRAIN.WATER.id;
    const steepness = Math.min(1, Math.max(0, (STEEP_NORMAL - field.normals[index * 3 + 1]) * 3));
    const land = palette.climate.get(climate[cell]).map((channel, part) => channel + (ROCK_COLOR[part] - channel) * steepness);
    colors.set([...(height < 0 ? palette.water.get(waterId) : land), 1], index * 4);
  });
  return colors;
}
