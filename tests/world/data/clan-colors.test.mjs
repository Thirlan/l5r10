import assert from "node:assert/strict";
import test from "node:test";
import { TERRAIN } from "../../../docs/scripts/world/data/world-map-data-layers.js";
import { getClanColors } from "../../../docs/scripts/world/data/clan-colors.js";

test("clan color lookup rejects values from another layer", () => {
  // Setup
  const nonClanValue = TERRAIN.FLAT;

  // Execution
  const lookupWithNonClanValue = () => getClanColors(nonClanValue);

  // Assertion
  assert.throws(lookupWithNonClanValue, TypeError);
});
