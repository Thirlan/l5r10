import assert from "node:assert/strict";
import test from "node:test";
import { CLIMATE, TERRAIN, VEGETATION } from "../docs/scripts/world-map-layers.js";
import { getTileImage } from "../docs/scripts/world-map-img-base-layers.js";

test("cliff tile lookup uses the flat terrain image", () => {
  // Setup
  const climate = CLIMATE.TEMPERATE;

  // Execution
  const flatImage = getTileImage(TERRAIN.FLAT, climate, VEGETATION.PRESENT);
  const cliffImage = getTileImage(TERRAIN.CLIFF, climate, VEGETATION.PRESENT);

  // Assertion
  assert.equal(cliffImage, flatImage);
});

test("water tile lookup suppresses vegetation", () => {
  // Setup
  const climate = CLIMATE.TEMPERATE;

  // Execution
  const waterWithoutVegetation = getTileImage(TERRAIN.WATER, climate, VEGETATION.NONE);
  const waterWithVegetation = getTileImage(TERRAIN.WATER, climate, VEGETATION.PRESENT);

  // Assertion
  assert.equal(waterWithVegetation, waterWithoutVegetation);
});

test("tile lookup rejects a non-vegetation value", () => {
  // Setup
  const climate = CLIMATE.TEMPERATE;

  // Execution
  const lookupWithInvalidVegetation = () => getTileImage(TERRAIN.FLAT, climate, CLIMATE.TROPICAL);

  // Assertion
  assert.throws(lookupWithInvalidVegetation, TypeError);
});
