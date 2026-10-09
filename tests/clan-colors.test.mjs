import assert from "node:assert/strict";
import test from "node:test";
import { TERRAIN } from "../docs/scripts/world-map-layers.js";
import { getClanColors } from "../docs/scripts/clan-colors.js";

test("clan color lookup rejects values from another layer", () => {
  // Setup
  const nonClanValue = TERRAIN.FLAT;

  // Execution
  const lookupWithNonClanValue = () => getClanColors(nonClanValue);

  // Assertion
  assert.throws(lookupWithNonClanValue, TypeError);
});
