/**
 * Loads the PBR texture sets into two Babylon.js texture arrays with a pool of module workers.
 *
 * - The albedo array has the diffuse color in RGB and the displacement in alpha.
 * - The shading array has the normal X and Y in red and green, and the roughness in blue.
 */

const WORKER_URL = new URL("./pbr-layer-worker.js", import.meta.url);
const TEXTURE_FOLDER = new URL("../textures/", import.meta.url).href;
const MAX_WORKERS = 4;

/** Layer sizes that the page accepts with "?textureSize=". */
export const TEXTURE_SIZES = Object.freeze([256, 512, 1024]);
export const DEFAULT_TEXTURE_SIZE = 512;

/**
 * Sends one texture set to a worker and waits for the decoded layers.
 * @param {Worker} worker Module worker.
 * @param {object} set Texture set from TEXTURE_SETS.
 * @param {number} size Layer width and height.
 * @returns {Promise<{albedo: Uint8Array, shading: Uint8Array}>} Decoded layers.
 */
function decodeInWorker(worker, set, size) {
  return new Promise((resolve, reject) => {
    worker.onmessage = ({ data }) => (data.error ? reject(new Error(`${set.name}: ${data.error}`)) : resolve(data));
    worker.onerror = (event) => reject(new Error(`${set.name}: ${event.message || "the texture worker did not start"}`));
    worker.postMessage({ set, folder: TEXTURE_FOLDER, size });
  });
}

/**
 * Makes one texture array with mipmaps that repeats in U and V.
 * @param {BABYLON.Scene} scene Scene.
 * @param {Uint8Array} data RGBA bytes of all layers.
 * @param {number} size Layer width and height.
 * @param {number} depth Number of layers.
 * @returns {BABYLON.RawTexture2DArray} Texture array.
 */
function createArray(scene, data, size, depth) {
  const texture = new BABYLON.RawTexture2DArray(data, size, size, depth, BABYLON.Constants.TEXTUREFORMAT_RGBA, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
  texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  texture.anisotropicFilteringLevel = 8;
  return texture;
}

/**
 * Decodes all texture sets and makes the albedo and shading texture arrays.
 * @param {BABYLON.Scene} scene Scene.
 * @param {ReadonlyArray<object>} sets Texture sets in layer order.
 * @param {{size: number, onProgress?: (done: number, total: number) => void}} options Layer size and progress callback.
 * @returns {Promise<{albedo: BABYLON.RawTexture2DArray, shading: BABYLON.RawTexture2DArray}>} Texture arrays.
 */
export async function loadTextureArrays(scene, sets, options) {
  // Validation
  if (!Array.isArray(sets) || sets.length === 0) throw new TypeError("loadTextureArrays needs texture sets.");
  if (!TEXTURE_SIZES.includes(options?.size)) throw new TypeError(`The texture size must be one of ${TEXTURE_SIZES.join(", ")}.`);

  // Computation
  const { size, onProgress } = options;
  const layerBytes = size * size * 4;
  const albedo = new Uint8Array(layerBytes * sets.length);
  const shading = new Uint8Array(layerBytes * sets.length);
  const queue = sets.map((set, index) => ({ set, index }));
  let done = 0;
  const decodeNext = async (worker) => {
    const job = queue.shift();
    if (!job) return;
    const layers = await decodeInWorker(worker, job.set, size);
    albedo.set(layers.albedo, job.index * layerBytes);
    shading.set(layers.shading, job.index * layerBytes);
    done += 1;
    onProgress?.(done, sets.length);
    await decodeNext(worker);
  };
  const workerCount = Math.min(sets.length, MAX_WORKERS, Math.max(1, (navigator.hardwareConcurrency || 2) - 1));
  const workers = Array.from({ length: workerCount }, () => new Worker(WORKER_URL, { type: "module" }));
  try {
    await Promise.all(workers.map((worker) => decodeNext(worker)));
  } finally {
    workers.forEach((worker) => worker.terminate());
  }
  return { albedo: createArray(scene, albedo, size, sets.length), shading: createArray(scene, shading, size, sets.length) };
}
