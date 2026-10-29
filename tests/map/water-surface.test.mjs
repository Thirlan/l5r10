import assert from "node:assert/strict";
import test from "node:test";
import { WATER_LEVEL, waterBumpPixels } from "../../docs/map/scripts/water-surface.js";

const SIZE = 32;
const pixelAt = (pixels, x, y) => [...pixels.subarray((y * SIZE + x) * 4, (y * SIZE + x) * 4 + 4)];

test("the water bump texture repeats without a seam", () => {
  // Execution
  const pixels = waterBumpPixels(SIZE);
  const wrapStepX = pixelAt(pixels, SIZE - 1, 5).map((value, channel) => Math.abs(value - pixelAt(pixels, 0, 5)[channel]));
  const innerStepX = pixelAt(pixels, 1, 5).map((value, channel) => Math.abs(value - pixelAt(pixels, 0, 5)[channel]));

  // Assertion
  assert.equal(pixels.length, SIZE * SIZE * 4);
  assert.ok(Math.max(...wrapStepX) <= Math.max(...innerStepX) * 3 + 2, `${wrapStepX} against ${innerStepX}`);
});

test("water bump normals point up and have unit length", () => {
  // Execution
  const pixels = waterBumpPixels(SIZE);
  const normals = Array.from({ length: SIZE * SIZE }, (_, pixel) => [...pixels.subarray(pixel * 4, pixel * 4 + 3)].map((value) => (value / 255) * 2 - 1));

  // Assertion
  normals.forEach((normal) => {
    assert.ok(normal[2] > 0.7);
    assert.ok(Math.abs(Math.hypot(...normal) - 1) < 0.02);
  });
  assert.throws(() => waterBumpPixels(2), TypeError);
});

test("the water level is just under the shoreline height", () => {
  // Assertion
  assert.ok(WATER_LEVEL < 0 && WATER_LEVEL > -0.05);
});
