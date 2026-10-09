import assert from "node:assert/strict";
import test from "node:test";
import { CLAN } from "../docs/scripts/world-map-layers.js";
import { getResourceImage } from "../docs/scripts/world-map-img-resources.js";

test("resource image lookup rejects values from another layer", () => {
  // Setup
  const nonResourceValue = CLAN.CRAB;

  // Execution
  const lookupWithNonResourceValue = () => getResourceImage(nonResourceValue);

  // Assertion
  assert.throws(lookupWithNonResourceValue, TypeError);
});
