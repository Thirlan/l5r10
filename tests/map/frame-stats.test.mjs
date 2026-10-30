import assert from "node:assert/strict";
import test from "node:test";
import { formatStats, textureBytes } from "../../docs/map/scripts/frame-stats.js";

test("the texture memory is width × height × layers × channels × bytes, and mipmaps add one third", () => {
  // Setup
  const textures = [
    { width: 512, height: 512, layers: 30 },
    { width: 512, height: 512, layers: 30, mipmaps: true },
    { width: 135, height: 196, channels: 1 },
    { width: 64, height: 64, layers: 6, channels: 4, bytesPerChannel: 2 },
  ];

  // Execution
  const bytes = textures.map(textureBytes);

  // Assertion
  assert.deepEqual(bytes, [31457280, 41943040, 26460, 196608]);
});

test("a texture size that is not a whole number causes a TypeError", () => {
  // Execution and Assertion
  assert.throws(() => textureBytes({ width: 1.5, height: 2 }), TypeError);
  assert.throws(() => textureBytes({ width: 2 }), TypeError);
  assert.throws(() => textureBytes({ width: 2, height: 2, layers: -1 }), TypeError);
});

test("the statistics text has one line for each statistic, with the units", () => {
  // Setup
  const sample = { fps: 59.94, cpuMs: 4.25, drawCalls: 212, activeMeshes: 140, meshes: 380, triangles: 1250000, textureBytes: 96 * 1024 * 1024 };

  // Execution
  const text = formatStats(sample);

  // Assertion
  assert.equal(text, ["Frame rate: 59.9 fps", "CPU frame time: 4.3 ms", "Draw calls: 212", "Meshes: 140 active of 380", "Triangles: 1.25 M", "Textures: 96 MB"].join("\n"));
});

test("a statistic that is missing or not finite causes a TypeError", () => {
  // Setup
  const sample = { fps: 60, cpuMs: 4, drawCalls: 10, activeMeshes: 1, meshes: 2, triangles: 3 };

  // Execution and Assertion
  assert.throws(() => formatStats(sample), TypeError);
  assert.throws(() => formatStats({ ...sample, textureBytes: Number.NaN }), TypeError);
  assert.throws(() => formatStats(null), TypeError);
});
