/**
 * Frame statistics of the 3D world map. The "?stats=1" page option shows them in an overlay.
 * They are for the performance measurements of the proof of concept.
 */

/** Time between two overlay updates, in milliseconds. */
const STATS_INTERVAL = 500;
const MEGABYTE = 1024 * 1024;

/**
 * Estimates the GPU memory of one texture. A full mipmap chain adds about one third.
 * @param {{width: number, height: number, layers?: number, channels?: number, bytesPerChannel?: number, mipmaps?: boolean}} texture Texture description. Layers is the depth of an array, or 6 for a cube.
 * @returns {number} Bytes.
 */
export function textureBytes({ width, height, layers = 1, channels = 4, bytesPerChannel = 1, mipmaps = false }) {
  // Validation
  if (![width, height, layers, channels, bytesPerChannel].every((value) => Number.isInteger(value) && value >= 0)) {
    throw new TypeError("textureBytes needs integer sizes of 0 or more.");
  }

  // Computation
  const base = width * height * layers * channels * bytesPerChannel;
  return mipmaps ? Math.round((base * 4) / 3) : base;
}

/**
 * Writes the statistics as text lines.
 * @param {{fps: number, cpuMs: number, drawCalls: number, activeMeshes: number, meshes: number, triangles: number, textureBytes: number}} sample Statistics of the last frame.
 * @returns {string} Text with one statistic on each line.
 */
export function formatStats(sample) {
  // Validation
  const names = ["fps", "cpuMs", "drawCalls", "activeMeshes", "meshes", "triangles", "textureBytes"];
  if (!names.every((name) => Number.isFinite(sample?.[name]))) throw new TypeError(`formatStats needs finite values for ${names.join(", ")}.`);

  // Computation
  return [`Frame rate: ${sample.fps.toFixed(1)} fps`, `CPU frame time: ${sample.cpuMs.toFixed(1)} ms`, `Draw calls: ${sample.drawCalls}`, `Meshes: ${sample.activeMeshes} active of ${sample.meshes}`, `Triangles: ${(sample.triangles / 1e6).toFixed(2)} M`, `Textures: ${Math.round(sample.textureBytes / MEGABYTE)} MB`].join("\n");
}

/**
 * Estimates the GPU memory of all scene textures. Textures that share one GPU texture count once.
 * @param {BABYLON.Scene} scene Scene.
 * @returns {number} Bytes.
 */
function sceneTextureBytes(scene) {
  const constants = BABYLON.Constants;
  const channels = { [constants.TEXTUREFORMAT_R]: 1, [constants.TEXTUREFORMAT_ALPHA]: 1, [constants.TEXTUREFORMAT_LUMINANCE]: 1, [constants.TEXTUREFORMAT_RG]: 2, [constants.TEXTUREFORMAT_LUMINANCE_ALPHA]: 2 };
  const bytesPerChannel = { [constants.TEXTURETYPE_FLOAT]: 4, [constants.TEXTURETYPE_HALF_FLOAT]: 2 };
  const internals = new Set(scene.textures.map((texture) => texture.getInternalTexture()).filter(Boolean));
  return [...internals].reduce((sum, internal) => {
    const layers = internal.isCube ? 6 : internal.is2DArray || internal.is3D ? internal.depth : 1;
    const description = { width: internal.width, height: internal.height, layers, channels: channels[internal.format] ?? 4, bytesPerChannel: bytesPerChannel[internal.type] ?? 1, mipmaps: internal.generateMipMaps };
    return sum + textureBytes(description);
  }, 0);
}

/**
 * Shows the frame statistics in an overlay and updates them two times each second.
 * @param {BABYLON.Scene} scene Scene.
 * @param {HTMLElement} output Overlay element.
 * @returns {void}
 */
export function bindFrameStats(scene, output) {
  // Validation
  if (!scene || !output) throw new TypeError("bindFrameStats needs a scene and an output element.");

  // Computation
  const instrumentation = new BABYLON.SceneInstrumentation(scene);
  instrumentation.captureFrameTime = true;
  output.hidden = false;
  setInterval(() => {
    output.textContent = formatStats({
      fps: scene.getEngine().getFps(),
      cpuMs: instrumentation.frameTimeCounter.current,
      drawCalls: instrumentation.drawCallsCounter.current,
      activeMeshes: scene.getActiveMeshes().length,
      meshes: scene.meshes.length,
      triangles: scene.getActiveIndices() / 3,
      textureBytes: sceneTextureBytes(scene),
    });
  }, STATS_INTERVAL);
}
