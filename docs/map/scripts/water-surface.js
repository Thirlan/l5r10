/**
 * Water surface for the 3D map: one plane at the water level over the full map.
 *
 * - The default water uses the Babylon.js WaterMaterial. It reflects and refracts the terrain chunks.
 * - "?water=simple" uses a plain see-through material, for slow devices.
 * - The terrain is below the water level only in lakes, seas, and river channels, so the plane shows only there.
 */

/** Height of the water plane. It is a little below 0, so that the plane does not flicker on the shoreline. */
export const WATER_LEVEL = -0.01;

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
 * Makes the water plane and its material.
 * @param {BABYLON.Scene} scene Scene.
 * @param {{columns: number, rows: number}} size Map size in cells.
 * @param {BABYLON.AbstractMesh[]} reflected Meshes that the water reflects and refracts.
 * @param {{simple?: boolean}} [options] Use the simple material.
 * @returns {BABYLON.Mesh} Water plane.
 */
export function createWaterSurface(scene, size, reflected, options = {}) {
  // Validation
  if (!Array.isArray(reflected)) throw new TypeError("createWaterSurface needs a list of meshes to reflect.");

  // Computation
  const plane = BABYLON.MeshBuilder.CreateGround("mapWater", { width: size.columns, height: size.rows, subdivisions: 1 }, scene);
  plane.position.set(size.columns / 2, WATER_LEVEL, size.rows / 2);
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
