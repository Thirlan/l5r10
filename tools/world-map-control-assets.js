/**
 * @param {Iterable<string>} paths Asset paths relative to map pages.
 * @returns {Promise<Map<string, HTMLImageElement>>} Loaded images by asset path.
 */
export async function loadControlImages(paths) {
  const entries = await Promise.all([...new Set(paths)].map((path) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve([path, image]);
    image.onerror = () => reject(new Error(`Failed to load control source image: ${path}`));
    image.src = new URL(path, new URL("../docs/world/", import.meta.url)).href;
  })));
  return new Map(entries);
}

/**
 * @param {HTMLCanvasElement} canvas Rendered control preview.
 * @returns {Promise<Blob>} Verified WebP image.
 */
export function exportControlWebP(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Control export produced no image."));
      else if (blob.type !== "image/webp") reject(new Error(`Control export requires WebP; received ${blob.type}.`));
      else resolve(blob);
    }, "image/webp", 1);
  });
}
