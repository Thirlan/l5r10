import assert from "node:assert/strict";
import test from "node:test";
import { downsampleAndFlip, packAlbedo, packShading } from "../../docs/map/scripts/pbr-pixels.js";

test("downsampling averages each block and puts the top row first", () => {
  // Setup: 4 × 2 pixels, one channel, bottom row first.
  const data = Float32Array.from([1, 3, 5, 7, 2, 4, 6, 8]);

  // Execution
  const half = downsampleAndFlip(data, 4, 2, 1, 2);
  const single = downsampleAndFlip(data, 4, 2, 1, 1);
  const twoChannels = downsampleAndFlip(data, 2, 2, 2, 1);

  // Assertion
  assert.deepEqual([...half], [3, 7, 2, 6]);
  assert.deepEqual([...single], [4.5]);
  assert.deepEqual([...twoChannels], [3.5, 5.5]);
});

test("same-size copies only turn the rows over", () => {
  // Setup
  const data = Float32Array.from([1, 2, 3, 4]);

  // Execution
  const copy = downsampleAndFlip(data, 2, 2, 1, 2);

  // Assertion
  assert.deepEqual([...copy], [3, 4, 1, 2]);
  assert.throws(() => downsampleAndFlip(data, 2, 2, 1, 3), TypeError);
});

test("the albedo layer takes RGB from the diffuse map and alpha from the displacement map", () => {
  // Execution
  const albedo = packAlbedo(Uint8Array.from([10, 20, 30, 255]), Uint8Array.from([77, 77, 77, 255]), 1);

  // Assertion
  assert.deepEqual([...albedo], [10, 20, 30, 77]);
});

test("the shading layer packs normal XY and roughness as bytes", () => {
  // Setup
  const normal = { data: Float32Array.from([0.5, 1.2, 0.9, 1]), channels: 4, scale: 1 };

  // Execution
  const fromMap = packShading(normal, { data: Uint8Array.from([51, 0, 0, 255]), channels: 4, scale: 255 }, 1);
  const constant = packShading(normal, 0.9, 1);

  // Assertion
  assert.deepEqual([...fromMap], [128, 255, 51, 255]);
  assert.deepEqual([...constant], [128, 255, 230, 255]);
});
