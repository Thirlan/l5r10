import assert from "node:assert/strict";
import test from "node:test";
import { CLAN } from "../docs/scripts/world-map-layers.js";
import { drawResourceMarker, getResourceImage } from "../docs/scripts/world-map-img-resources.js";

test("resource image lookup rejects values from another layer", () => {
  // Setup
  const nonResourceValue = CLAN.CRAB;

  // Execution
  const lookupWithNonResourceValue = () => getResourceImage(nonResourceValue);

  // Assertion
  assert.throws(lookupWithNonResourceValue, TypeError);
});

test("resource marker draws its image centered at the requested coordinates", () => {
  // Setup
  const source = { complete: true, naturalWidth: 32 };
  const calls = [];
  const ctx = { drawImage: (...args) => calls.push(args) };

  // Execution
  const drawn = drawResourceMarker(ctx, source, 40, 56);

  // Assertion
  assert.equal(drawn, true);
  assert.deepEqual(calls, [[source, 34, 50, 12, 12]]);
});

[
  ["absent", null],
  ["loading", { complete: false, naturalWidth: 32 }],
  ["failed", { complete: true, naturalWidth: 0 }],
].forEach(([state, source]) => {
  test(`resource marker skips an image that is ${state}`, () => {
    // Setup
    const calls = [];
    const ctx = { drawImage: (...args) => calls.push(args) };

    // Execution
    const drawn = drawResourceMarker(ctx, source, 40, 56);

    // Assertion
    assert.equal(drawn, false);
    assert.deepEqual(calls, []);
  });
});

test("resource drawing rejects missing canvas context", () => {
  // Setup
  const source = { complete: true, naturalWidth: 32 };

  // Execution
  const draw = () => drawResourceMarker(null, source, 40, 56);

  // Assertion
  assert.throws(draw, /canvas context/);
});

test("resource drawing rejects invalid coordinates", () => {
  // Setup
  const source = { complete: true, naturalWidth: 32 };

  // Execution
  const draw = () => drawResourceMarker({}, source, NaN, 56);

  // Assertion
  assert.throws(draw, /valid coordinates/);
});
