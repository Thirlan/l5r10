import assert from "node:assert/strict";
import test from "node:test";
import { CLAN, SETTLEMENT } from "../docs/scripts/world-map-layers.js";
import {
  drawSettlementAsset,
  drawSettlementMarker,
  drawCircularSettlement,
  drawSquareSettlement,
} from "../docs/scripts/world-map-img-settlements.js";

function createContext() {
  const calls = { arcs: 0, fills: 0, outlines: 0, lines: 0, text: 0, images: 0 };
  const context = {
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    fill() {},
    stroke() {},
    moveTo() { calls.lines += 1; },
    lineTo() { calls.lines += 1; },
    arc() { calls.arcs += 1; },
    fillRect() { calls.fills += 1; },
    strokeRect() { calls.outlines += 1; },
    fillText() { calls.text += 1; },
    drawImage() { calls.images += 1; },
  };
  return { context, calls };
}

test("village uses a circular settlement marker", () => {
  // Setup
  const { context, calls } = createContext();

  // Execution
  const drawn = drawCircularSettlement(context, SETTLEMENT.VILLAGE, 8, 10, 1);

  // Assertion
  assert.equal(drawn, true);
  assert.equal(calls.arcs, 1);
});

test("capital marker adds an inner circle", () => {
  // Setup
  const { context, calls } = createContext();

  // Execution
  drawCircularSettlement(context, SETTLEMENT.CAPITAL, 8, 10, 1);

  // Assertion
  assert.equal(calls.arcs, 2);
});

test("village ruins marker adds a slash", () => {
  // Setup
  const { context, calls } = createContext();

  // Execution
  drawCircularSettlement(context, SETTLEMENT.VILLAGE_RUINS, 8, 10, 1);

  // Assertion
  assert.equal(calls.lines, 2);
});

test("circular drawing skips unsupported settlement types", () => {
  // Setup
  const { context, calls } = createContext();

  // Execution
  const drawn = drawCircularSettlement(context, SETTLEMENT.CASTLE, 8, 10, 1);

  // Assertion
  assert.equal(drawn, false);
  assert.equal(calls.arcs, 0);
});

test("circular drawing rejects a non-settlement value", () => {
  // Setup
  const { context } = createContext();

  // Execution
  const drawInvalidSettlement = () => drawCircularSettlement(context, CLAN.CRAB, 8, 10, 1);

  // Assertion
  assert.throws(drawInvalidSettlement, TypeError);
});

test("fortification uses a filled square marker", () => {
  // Setup
  const { context, calls } = createContext();

  // Execution
  const drawn = drawSquareSettlement(context, SETTLEMENT.FORTIFICATION, 8, 10, 1);

  // Assertion
  assert.equal(drawn, true);
  assert.equal(calls.fills, 1);
});

test("Kyuden marker adds an inner circle", () => {
  // Setup
  const { context, calls } = createContext();

  // Execution
  drawSquareSettlement(context, SETTLEMENT.KYUDEN, 8, 10, 1);

  // Assertion
  assert.equal(calls.arcs, 1);
});

test("castle ruins marker adds a slash", () => {
  // Setup
  const { context, calls } = createContext();

  // Execution
  drawSquareSettlement(context, SETTLEMENT.CASTLE_RUINS, 8, 10, 1);

  // Assertion
  assert.equal(calls.lines, 2);
});

test("academy marker draws its label", () => {
  // Setup
  const { context, calls } = createContext();

  // Execution
  drawSquareSettlement(context, SETTLEMENT.ACADEMY, 8, 10, 1);

  // Assertion
  assert.equal(calls.text, 1);
});

test("watchtower marker draws its tower shape", () => {
  // Setup
  const { context, calls } = createContext();

  // Execution
  drawSquareSettlement(context, SETTLEMENT.WATCHTOWER, 8, 10, 1);

  // Assertion
  assert.equal(calls.lines, 3);
  assert.equal(calls.fills, 1);
});

test("square drawing skips unsupported settlement types", () => {
  // Setup
  const { context, calls } = createContext();

  // Execution
  const drawn = drawSquareSettlement(context, SETTLEMENT.CITY, 8, 10, 1);

  // Assertion
  assert.equal(drawn, false);
  assert.equal(calls.fills, 0);
});

test("settlement marker skips an asset that is still loading", () => {
  // Setup
  const { context, calls } = createContext();
  const pendingImage = { complete: false };

  // Execution
  const drawn = drawSettlementMarker(context, SETTLEMENT.SMALL_SHRINE, pendingImage, 8, 10, 1, null, {});

  // Assertion
  assert.equal(drawn, false);
  assert.equal(calls.images, 0);
});

test("asset drawing reuses a cached tinted image", () => {
  // Setup
  const originalDocument = globalThis.document;
  let canvasCreations = 0;
  globalThis.document = {
    createElement() {
      canvasCreations += 1;
      return {
        getContext: () => ({ drawImage() {}, fillRect() {} }),
      };
    },
  };
  const source = { complete: true, naturalWidth: 16, naturalHeight: 12, src: "asset" };
  const { context, calls } = createContext();
  const cache = {};

  try {
    // Execution
    const firstDraw = drawSettlementAsset(context, SETTLEMENT.SMALL_SHRINE, source, 8, 10, "#123456", cache);
    const cachedDraw = drawSettlementAsset(context, SETTLEMENT.SMALL_SHRINE, source, 8, 10, "#123456", cache);

    // Assertion
    assert.equal(firstDraw, true);
    assert.equal(cachedDraw, true);
    assert.equal(canvasCreations, 1);
    assert.equal(calls.images, 2);
  } finally {
    // Tear down
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test("settlement marker falls back to procedural drawing without an asset", () => {
  // Setup
  const { context, calls } = createContext();

  // Execution
  const drawn = drawSettlementMarker(context, SETTLEMENT.VILLAGE, null, 8, 10, 1);

  // Assertion
  assert.equal(drawn, true);
  assert.equal(calls.arcs, 1);
});

test("settlement marker rejects a non-settlement value", () => {
  // Setup
  const { context } = createContext();

  // Execution
  const drawInvalidSettlement = () => drawSettlementMarker(context, CLAN.CRAB, null, 8, 10, 1);

  // Assertion
  assert.throws(drawInvalidSettlement, TypeError);
});
