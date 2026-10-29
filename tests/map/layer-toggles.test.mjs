import assert from "node:assert/strict";
import test from "node:test";
import { bindLayerToggles } from "../../docs/map/scripts/layer-toggles.js";

function fakeInput(layer, checked) {
  const listeners = [];
  return {
    dataset: { mapLayer: layer },
    checked,
    disabled: false,
    addEventListener: (type, listener) => listeners.push([type, listener]),
    toggle() {
      this.checked = !this.checked;
      listeners.filter(([type]) => type === "change").forEach(([, listener]) => listener());
    },
  };
}

function fakeMesh() {
  return {
    enabled: true,
    setEnabled(enabled) {
      this.enabled = enabled;
    },
  };
}

test("each layer checkbox shows and hides its own mesh group", () => {
  // Setup
  const inputs = [fakeInput("roads", true), fakeInput("trees", false), fakeInput("labels", true)];
  const panel = { querySelectorAll: () => inputs };
  const groups = { roads: [fakeMesh(), fakeMesh()], trees: [fakeMesh()] };

  // Execution
  const bound = bindLayerToggles(panel, groups);
  const afterBind = [...groups.roads, ...groups.trees].map((mesh) => mesh.enabled);
  inputs[0].toggle();

  // Assertion
  assert.deepEqual(bound, ["roads", "trees"]);
  assert.deepEqual(afterBind, [true, true, false]);
  assert.deepEqual(
    groups.roads.map((mesh) => mesh.enabled),
    [false, false],
  );
  assert.equal(groups.trees[0].enabled, false);
});

test("a checkbox without meshes is disabled", () => {
  // Setup
  const input = fakeInput("ports", true);

  // Execution
  bindLayerToggles({ querySelectorAll: () => [input] }, { ports: [] });

  // Assertion
  assert.equal(input.disabled, true);
  assert.throws(() => bindLayerToggles(null, {}), TypeError);
});
