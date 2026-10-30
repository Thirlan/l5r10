/**
 * Module worker that decodes one PBR texture set into an albedo layer and a shading layer.
 *
 * Message in: {set, folder, size}. Message out: {albedo, shading} (RGBA bytes) or {error}.
 * three.js EXRLoader decodes the EXR maps, because Babylon.js cannot read DWAA compression.
 */
import { FloatType } from "https://cdn.jsdelivr.net/npm/three@0.186.1/+esm";
import { EXRLoader } from "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/EXRLoader.js/+esm";
import { downsampleAndFlip, packAlbedo, packShading } from "./pbr-pixels.js";

/** Roughness for a texture set without a roughness map. */
const DEFAULT_ROUGHNESS = 0.9;

/**
 * Fetches a file and makes sure that the server sent it.
 * @param {string} url File URL.
 * @returns {Promise<Response>} Response.
 */
async function fetchFile(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response;
}

/**
 * Decodes a JPG or PNG file into RGBA bytes with the target size, without color conversion.
 * @param {string} url File URL.
 * @param {number} size Target width and height.
 * @returns {Promise<Uint8ClampedArray>} RGBA bytes, top row first.
 */
async function imageBytes(url, size) {
  const blob = await (await fetchFile(url)).blob();
  const bitmap = await createImageBitmap(blob, { resizeWidth: size, resizeHeight: size, resizeQuality: "high", colorSpaceConversion: "none", premultiplyAlpha: "none" });
  const context = new OffscreenCanvas(size, size).getContext("2d", { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return context.getImageData(0, 0, size, size).data;
}

/**
 * Decodes an EXR file into a float pixel source with the target size.
 * @param {string} url File URL.
 * @param {number} size Target width and height.
 * @returns {Promise<{data: Float32Array, channels: number, scale: number}>} Pixel source, top row first.
 */
async function exrPixels(url, size) {
  const buffer = await (await fetchFile(url)).arrayBuffer();
  const { data, width, height } = new EXRLoader().setDataType(FloatType).parse(buffer);
  const channels = data.length / (width * height);
  return { data: downsampleAndFlip(data, width, height, channels, size), channels, scale: 1 };
}

/**
 * Decodes the roughness map of a texture set.
 * @param {{roughness: string|null}} set Texture set.
 * @param {string} folder Texture folder URL.
 * @param {number} size Target width and height.
 * @returns {Promise<{data: ArrayLike<number>, channels: number, scale: number}|number>} Pixel source, or one roughness value.
 */
async function roughnessPixels(set, folder, size) {
  if (!set.roughness) return DEFAULT_ROUGHNESS;
  const url = new URL(set.roughness, folder).href;
  return set.roughness.endsWith(".exr") ? exrPixels(url, size) : { data: await imageBytes(url, size), channels: 4, scale: 255 };
}

self.onmessage = async ({ data: { set, folder, size } }) => {
  try {
    const fileUrl = (file) => new URL(file, folder).href;
    const [diffuse, displacement, normal, roughness] = await Promise.all([imageBytes(fileUrl(set.diffuse), size), imageBytes(fileUrl(set.displacement), size), exrPixels(fileUrl(set.normal), size), roughnessPixels(set, folder, size)]);
    const albedo = packAlbedo(diffuse, displacement, size * size);
    const shading = packShading(normal, roughness, size * size);
    self.postMessage({ albedo, shading }, [albedo.buffer, shading.buffer]);
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
