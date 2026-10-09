import assert from "node:assert/strict";
import test from "node:test";
import { WorldMapViewer } from "../docs/scripts/world-map-viewer.js";

test("viewer initialization reports and propagates loading failures", async (t) => {
  // Setup
  const error = new Error("Map data unavailable");
  t.mock.method(globalThis, "fetch", async () => { throw error; });
  const logging = t.mock.method(console, "error", () => {});
  const viewer = Object.create(WorldMapViewer.prototype);

  // Execution
  const loading = viewer.loadLayersConfig();

  // Assertion
  await assert.rejects(loading, (failure) => failure === error);
  assert.equal(logging.mock.calls.length, 1);
});
