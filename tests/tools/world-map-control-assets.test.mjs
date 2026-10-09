import assert from "node:assert/strict";
import test from "node:test";
import { loadControlImages, exportControlWebP } from "../../tools/world-map-control-assets.js";

function installImage(t, implementation) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "Image");
  globalThis.Image = implementation;
  // Tear down
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "Image", original);
    else delete globalThis.Image;
  });
}

test("image loading deduplicates shared source paths", async (t) => {
  // Setup
  let loads = 0;
  installImage(t, class {
    set src(url) { this.url = url; loads++; this.onload(); }
  });
  const path = "../img/map/shrine.png";

  // Execution
  const images = await loadControlImages([path, path]);

  // Assertion
  assert.equal(loads, 1);
  assert.equal(images.size, 1);
});

test("image loading resolves paths relative to map pages, not the utility", async (t) => {
  // Setup
  installImage(t, class { set src(url) { this.url = url; this.onload(); } });
  const path = "../img/map/terrain_hills.webp";

  // Execution
  const images = await loadControlImages([path]);

  // Assertion
  assert.equal(images.get(path).url, new URL("../../docs/img/map/terrain_hills.webp", import.meta.url).href);
});

test("image loading reports the source path on failure", async (t) => {
  // Setup
  installImage(t, class { set src(_url) { this.onerror(); } });

  // Execution
  const loading = loadControlImages(["../img/map/missing.webp"]);

  // Assertion
  await assert.rejects(loading, /missing.webp/);
});

test("export requests WebP and returns the verified blob", async () => {
  // Setup
  const blob = new Blob(["image"], { type: "image/webp" });
  let requestedType;
  const canvas = { toBlob(callback, type) { requestedType = type; callback(blob); } };

  // Execution
  const result = await exportControlWebP(canvas);

  // Assertion
  assert.equal(requestedType, "image/webp");
  assert.equal(result, blob);
});

test("export rejects a browser fallback image format", async () => {
  // Setup
  const canvas = { toBlob: (callback) => callback(new Blob(["image"], { type: "image/png" })) };

  // Execution
  const exporting = exportControlWebP(canvas);

  // Assertion
  await assert.rejects(exporting, /requires WebP/);
});

test("export rejects missing image output", async () => {
  // Setup
  const canvas = { toBlob: (callback) => callback(null) };

  // Execution
  const exporting = exportControlWebP(canvas);

  // Assertion
  await assert.rejects(exporting, /no image/);
});
