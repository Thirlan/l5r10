import assert from "node:assert/strict";
import test from "node:test";
import { CAMERA_LIMITS, clampTarget } from "../../docs/map/scripts/camera-limits.js";

const SIZE = Object.freeze({ columns: 135, rows: 196 });

test("a target inside the map does not change", () => {
  // Setup
  const target = { x: 40.5, y: 3, z: 120.25 };

  // Execution
  const clamped = clampTarget(target, SIZE);

  // Assertion
  assert.deepEqual(clamped, target);
});

test("a target outside the map moves to the nearest map edge and keeps its height", () => {
  // Setup
  const targets = [
    { x: -40, y: 2, z: 900 },
    { x: 500, y: -1, z: -3 },
  ];

  // Execution
  const clamped = targets.map((target) => clampTarget(target, SIZE));

  // Assertion
  assert.deepEqual(clamped, [
    { x: 0, y: 2, z: 196 },
    { x: 135, y: -1, z: 0 },
  ]);
});

test("a target that is not finite causes a TypeError", () => {
  // Setup
  const targets = [null, { x: 1, y: 2 }, { x: Number.NaN, y: 0, z: 0 }, { x: 0, y: 0, z: Infinity }];

  // Execution and Assertion
  targets.forEach((target) => assert.throws(() => clampTarget(target, SIZE), TypeError));
});

test("the camera limits keep the camera above the horizon and allow a zoom out past the full map", () => {
  // Assertion
  assert.ok(CAMERA_LIMITS.minRadius > 0);
  assert.ok(CAMERA_LIMITS.maxRadiusRatio > 1);
  assert.ok(CAMERA_LIMITS.minBeta > 0 && CAMERA_LIMITS.minBeta < CAMERA_LIMITS.maxBeta);
  assert.ok(CAMERA_LIMITS.maxBeta < Math.PI / 2);
  assert.ok(Object.isFrozen(CAMERA_LIMITS));
});
