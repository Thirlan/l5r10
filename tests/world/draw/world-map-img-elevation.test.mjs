import assert from "node:assert/strict";
import test from "node:test";
import { drawElevationCue, getElevationColor } from "../../../docs/scripts/world/draw/world-map-img-elevation.js";

["100", 1.5, null, undefined, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].forEach((elevation) => {
  test(`invalid elevation ${String(elevation)} has no color`, () => {
    assert.throws(() => getElevationColor(elevation), TypeError);
  });
});

test("the gradient is transparent only at one metre and clamps its endpoints", () => {
  assert.equal(getElevationColor(1), null);
  assert.equal(getElevationColor(0), "rgb(0, 100, 200)");
  assert.equal(getElevationColor(-4000), "rgb(0, 0, 90)");
  assert.equal(getElevationColor(-5000), getElevationColor(-4000));
  assert.equal(getElevationColor(1000), "rgb(220, 0, 0)");
  assert.equal(getElevationColor(5000), getElevationColor(1000));
  assert.notEqual(getElevationColor(100), getElevationColor(500));
});

test("elevation cue rejects invalid dimensions and colors", () => {
  assert.throws(() => drawElevationCue(null, 0, 0, 16, 16, "#000000"), TypeError);
  assert.throws(() => drawElevationCue({}, 0, 0, 0, 16, "#000000"), TypeError);
  assert.throws(() => drawElevationCue({}, 0, 0, 16, 16, null), TypeError);
  assert.throws(() => drawElevationCue({}, 0, 0, 16, 16, "#000000", 0.5), /integer elevation/);
});

[-100, 0, 1, 8000, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER].forEach((elevation) => {
  test(`elevation label prints ${elevation} inside its band without text compression`, () => {
    const strokes = [];
    const fills = [];
    const ctx = { save() {}, restore() {}, strokeText: (...args) => strokes.push(args), fillText: (...args) => fills.push(args) };
    drawElevationCue(ctx, 10, 20, 8, 16, "#000000", elevation);
    assert.deepEqual(strokes, [[String(elevation), 14, 28]]);
    assert.deepEqual(fills, strokes);
    const fontSize = Number.parseFloat(ctx.font);
    assert.ok(fontSize > 0 && fontSize <= 16 * 0.65);
    assert.ok(String(elevation).length * 0.6 * fontSize <= 8 * 0.9 + 1e-9);
    assert.equal(ctx.lineWidth, fontSize * 0.12);
    assert.equal(ctx.textAlign, "center");
    assert.equal(ctx.textBaseline, "middle");
  });
});
