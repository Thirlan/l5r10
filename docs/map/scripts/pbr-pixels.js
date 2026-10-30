/**
 * Pixel helpers for the PBR texture layers. They do not use browser APIs, so the tests can run them.
 *
 * A pixel source is {data, channels, scale}: the value of channel c of pixel p is data[p * channels + c] / scale.
 */

const toByte = (value) => Math.round(Math.min(1, Math.max(0, value)) * 255);

/**
 * Makes a smaller copy of float pixels with a box filter, and turns the rows over.
 * EXRLoader gives the bottom row first. The JPG and PNG maps give the top row first.
 * @param {Float32Array} data Float pixels, one row after the other.
 * @param {number} width Source width.
 * @param {number} height Source height.
 * @param {number} channels Values for each pixel.
 * @param {number} size Target width and height. The source width and height must be integer multiples of it.
 * @returns {Float32Array} size × size pixels with the same channels, top row first.
 */
export function downsampleAndFlip(data, width, height, channels, size) {
  // Validation
  if (data?.length !== width * height * channels) throw new TypeError("The pixel data does not match the width, height, and channels.");
  if (!Number.isInteger(width / size) || !Number.isInteger(height / size)) throw new TypeError(`${width} × ${height} pixels cannot become ${size} × ${size} pixels.`);

  // Computation
  const stepX = width / size;
  const stepY = height / size;
  const offsets = Array.from({ length: stepX * stepY }, (_, index) => (-Math.floor(index / stepX) * width + (index % stepX)) * channels);
  return Float32Array.from({ length: size * size * channels }, (_, index) => {
    const channel = index % channels;
    const pixel = Math.floor(index / channels);
    const sourceRow = height - 1 - Math.floor(pixel / size) * stepY;
    const start = (sourceRow * width + (pixel % size) * stepX) * channels + channel;
    return offsets.reduce((sum, offset) => sum + data[start + offset], 0) / offsets.length;
  });
}

/**
 * Packs the albedo layer: RGB from the diffuse map and alpha from the displacement map.
 * @param {Uint8ClampedArray|Uint8Array} diffuse RGBA bytes of the diffuse map.
 * @param {Uint8ClampedArray|Uint8Array} displacement RGBA bytes of the displacement map.
 * @param {number} pixelCount Pixels in the layer.
 * @returns {Uint8Array} RGBA bytes.
 */
export function packAlbedo(diffuse, displacement, pixelCount) {
  // Validation
  if (diffuse?.length !== pixelCount * 4 || displacement?.length !== pixelCount * 4) throw new TypeError("packAlbedo needs two RGBA maps with the same size.");

  // Computation
  return Uint8Array.from({ length: pixelCount * 4 }, (_, index) => ((index & 3) === 3 ? displacement[index - 3] : diffuse[index]));
}

/**
 * Packs the shading layer: red and green = normal X and Y (OpenGL), blue = roughness, alpha = 255.
 * @param {{data: ArrayLike<number>, channels: number, scale: number}} normal Normal map pixel source with values from 0 to 1 after the scale.
 * @param {{data: ArrayLike<number>, channels: number, scale: number}|number} roughness Roughness pixel source, or one roughness for all pixels.
 * @param {number} pixelCount Pixels in the layer.
 * @returns {Uint8Array} RGBA bytes.
 */
export function packShading(normal, roughness, pixelCount) {
  // Validation
  if (normal?.data?.length !== pixelCount * normal.channels) throw new TypeError("packShading needs a normal map with the layer size.");
  if (typeof roughness !== "number" && roughness?.data?.length !== pixelCount * roughness?.channels) throw new TypeError("packShading needs a roughness map with the layer size.");

  // Computation
  const roughnessAt = typeof roughness === "number" ? () => roughness : (pixel) => roughness.data[pixel * roughness.channels] / roughness.scale;
  return Uint8Array.from({ length: pixelCount * 4 }, (_, index) => {
    const pixel = index >> 2;
    const channel = index & 3;
    if (channel < 2) return toByte(normal.data[pixel * normal.channels + channel] / normal.scale);
    return channel === 2 ? toByte(roughnessAt(pixel)) : 255;
  });
}
