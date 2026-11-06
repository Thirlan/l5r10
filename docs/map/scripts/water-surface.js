/**
 * Water surface for the 3D map, clipped to submerged terrain.
 *
 * - The default water uses the Babylon.js WaterMaterial. It reflects and refracts the terrain chunks.
 * - "?water=simple" uses a plain see-through material, for slow devices.
 * - Dry terrain has no water triangles beneath it. This prevents depth collisions at physical map scale.
 */
import { METERS_PER_TILE } from "../../scripts/world/world-map-scale.js";
import { HeightField } from "./terrain-height.js";

/** Water level in tile units, one centimetre below sea level. */
export const WATER_LEVEL = -0.01 / METERS_PER_TILE;

/** Sine waves for the bump texture: [x cycles, y cycles, amplitude, phase]. Whole cycles make the texture repeat without seams. */
const BUMP_WAVES = Object.freeze([
  [3, 1, 1, 0],
  [-2, 4, 0.8, 1.3],
  [5, -3, 0.5, 2.1],
  [1, 7, 0.35, 0.4],
  [-8, 5, 0.25, 3.7],
  [11, 2, 0.15, 5.2],
]);

/**
 * Makes the pixels of a normal map that repeats without seams, for the water bump texture.
 * @param {number} size Width and height in pixels.
 * @returns {Uint8Array} RGBA bytes. RGB is the normal, with Z up.
 */
export function waterBumpPixels(size) {
  // Validation
  if (!Number.isInteger(size) || size < 4) throw new TypeError("The bump texture size must be an integer of 4 or more.");

  // Computation
  const slopeScale = 0.06;
  return Uint8Array.from({ length: size * size * 4 }, (_, index) => {
    const channel = index & 3;
    if (channel === 3) return 255;
    const pixel = index >> 2;
    const [x, y] = [pixel % size, Math.floor(pixel / size)];
    const [slopeX, slopeY] = BUMP_WAVES.reduce(
      ([sumX, sumY], [cyclesX, cyclesY, amplitude, phase]) => {
        const angle = (2 * Math.PI * (cyclesX * x + cyclesY * y)) / size + phase;
        const slope = amplitude * Math.cos(angle) * slopeScale;
        return [sumX + slope * cyclesX, sumY + slope * cyclesY];
      },
      [0, 0],
    );
    const length = Math.hypot(slopeX, slopeY, 1);
    const value = [-slopeX / length, -slopeY / length, 1 / length][channel];
    return Math.round((value * 0.5 + 0.5) * 255);
  });
}

/**
 * Clips water polygons against the same triangles as the terrain.
 * @param {HeightField} field Global terrain surface.
 * @returns {{positions: Float32Array, normals: Float32Array, uvs: Float32Array, indices: Uint32Array}} Water mesh data.
 */
export function waterVertexData(field) {
  if (!(field instanceof HeightField)) throw new TypeError("Water geometry needs a HeightField.");
  const { columns, rows } = field.model;
  const scale = field.subdivisions;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const point = (x, y) => [x / scale, y / scale, field.heightAt(x, y)];
  const addPolygon = (vertices) => {
    const heights = vertices.map((vertex) => vertex[2]);
    // Keep rounded Float32 shoreline coordinates on the wet side of steep banks.
    const margin = (Math.max(...heights) - Math.min(...heights)) * scale * (columns + rows) * 2 ** -23;
    const level = heights.every((height) => height < WATER_LEVEL) ? WATER_LEVEL : WATER_LEVEL - margin;
    const clipped = [];
    vertices.forEach((current, index) => {
      const previous = vertices[(index + vertices.length - 1) % vertices.length];
      const inside = current[2] < level;
      const previousInside = previous[2] < level;
      if (inside !== previousInside) {
        const ratio = (level - previous[2]) / (current[2] - previous[2]);
        clipped.push([previous[0] + ratio * (current[0] - previous[0]), previous[1] + ratio * (current[1] - previous[1])]);
      }
      if (inside) clipped.push(current);
    });
    if (clipped.length < 3) return;
    const offset = positions.length / 3;
    clipped.forEach(([x, y]) => {
      positions.push(x, 0, rows - y);
      normals.push(0, 1, 0);
      uvs.push(x / columns, 1 - y / rows);
    });
    for (let index = 1; index < clipped.length - 1; index++) indices.push(offset, offset + index, offset + index + 1);
  };
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const left = column * scale;
      const top = row * scale;
      const samples = Array.from({ length: (scale + 1) ** 2 }, (_, index) => field.heightAt(left + (index % (scale + 1)), top + Math.floor(index / (scale + 1))));
      if (samples.every((height) => height >= WATER_LEVEL)) continue;
      if (samples.every((height) => height < WATER_LEVEL)) {
        addPolygon([point(left, top + scale), point(left + scale, top + scale), point(left + scale, top), point(left, top)]);
        continue;
      }
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const x = left + dx;
          const y = top + dy;
          addPolygon([point(x + 1, y + 1), point(x + 1, y), point(x, y)]);
          addPolygon([point(x, y + 1), point(x + 1, y + 1), point(x, y)]);
        }
      }
    }
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), uvs: new Float32Array(uvs), indices: new Uint32Array(indices) };
}

/**
 * Makes the water plane and its material.
 * @param {BABYLON.Scene} scene Scene.
 * @param {HeightField} field Global terrain surface.
 * @param {BABYLON.AbstractMesh[]} reflected Meshes that the water reflects and refracts.
 * @param {{simple?: boolean}} [options] Use the simple material.
 * @returns {BABYLON.Mesh} Water plane.
 */
export function createWaterSurface(scene, field, reflected, options = {}) {
  // Validation
  if (!Array.isArray(reflected)) throw new TypeError("createWaterSurface needs a list of meshes to reflect.");

  // Computation
  const data = waterVertexData(field);
  const size = field.model;
  const plane = new BABYLON.Mesh("mapWater", scene);
  const vertices = new BABYLON.VertexData();
  Object.assign(vertices, data);
  vertices.applyToMesh(plane);
  plane.position.y = WATER_LEVEL;
  plane.isPickable = false;
  plane.material = options.simple ? createSimpleWater(scene) : createReflectingWater(scene, size, reflected);
  return plane;
}

/**
 * Makes the see-through water material for "?water=simple".
 * @param {BABYLON.Scene} scene Scene.
 * @returns {BABYLON.StandardMaterial} Water material.
 */
function createSimpleWater(scene) {
  const material = new BABYLON.StandardMaterial("mapWaterSimple", scene);
  material.diffuseColor = new BABYLON.Color3(0.12, 0.3, 0.5);
  material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
  material.alpha = 0.55;
  return material;
}

/**
 * Makes the WaterMaterial with a procedural bump texture.
 * @param {BABYLON.Scene} scene Scene.
 * @param {{columns: number, rows: number}} size Map size in cells.
 * @param {BABYLON.AbstractMesh[]} reflected Meshes that the water reflects and refracts.
 * @returns {BABYLON.WaterMaterial} Water material.
 */
function createReflectingWater(scene, size, reflected) {
  const bumpSize = 256;
  const bump = new BABYLON.RawTexture(waterBumpPixels(bumpSize), bumpSize, bumpSize, BABYLON.Constants.TEXTUREFORMAT_RGBA, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
  bump.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  bump.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;

  const material = new BABYLON.WaterMaterial("mapWaterMaterial", scene, new BABYLON.Vector2(512, 512));
  material.bumpTexture = bump;
  // About 2.5 cells for each bump repeat. Longer repeats show as diagonal bands in the full map view.
  material.waveLength = 2.5 / Math.max(size.columns, size.rows);
  material.waveHeight = 0;
  material.bumpHeight = 0.08;
  material.windForce = -4;
  material.windDirection = new BABYLON.Vector2(1, 0.6);
  material.waterColor = new BABYLON.Color3(0.08, 0.24, 0.4);
  material.colorBlendFactor = 0.25;
  material.specularPower = 128;
  reflected.forEach((mesh) => material.addToRenderList(mesh));
  return material;
}
