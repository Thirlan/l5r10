import assert from "node:assert/strict";
import test from "node:test";
import {
  LayerDefinition,
  LayerValue,
  LevelValue,
  SettlementValue,
} from "../docs/scripts/world-map-layers.js";

test("layer values reject non-integer IDs", () => {
  // Setup
  const id = 1.5;
  const name = "flat";

  // Execution
  const createValue = () => new LayerValue(id, name);

  // Assertion
  assert.throws(createValue, TypeError);
});

test("layer values reject empty names", () => {
  // Setup
  const id = 0;
  const name = "";

  // Execution
  const createValue = () => new LayerValue(id, name);

  // Assertion
  assert.throws(createValue, TypeError);
});

test("settlement values reject non-string English labels", () => {
  // Setup
  const englishType = null;

  // Execution
  const createValue = () => new SettlementValue(1, "Village", englishType, "Mura");

  // Assertion
  assert.throws(createValue, TypeError);
});

test("settlement values reject non-string Rokugani labels", () => {
  // Setup
  const rokuganiType = undefined;

  // Execution
  const createValue = () => new SettlementValue(1, "Village", "Village", rokuganiType);

  // Assertion
  assert.throws(createValue, TypeError);
});

test("layer definitions reject empty IDs", () => {
  // Setup
  const validValue = new LayerValue(0, "flat");

  // Execution
  const createDefinition = () => new LayerDefinition("", "Terrain Layer", [validValue]);

  // Assertion
  assert.throws(createDefinition, TypeError);
});

test("layer definitions reject empty names", () => {
  // Setup
  const validValue = new LayerValue(0, "flat");

  // Execution
  const createDefinition = () => new LayerDefinition("terrain", "", [validValue]);

  // Assertion
  assert.throws(createDefinition, TypeError);
});

test("layer definitions reject non-array values", () => {
  // Setup
  const values = null;

  // Execution
  const createDefinition = () => new LayerDefinition("terrain", "Terrain Layer", values);

  // Assertion
  assert.throws(createDefinition, TypeError);
});

test("layer definitions reject non-layer values", () => {
  // Setup
  const invalidValues = [{}];

  // Execution
  const createDefinition = () => new LayerDefinition("terrain", "Terrain Layer", invalidValues);

  // Assertion
  assert.throws(createDefinition, TypeError);
});

test("layer definitions reject duplicate value IDs", () => {
  // Setup
  const values = [new LayerValue(0, "flat"), new LayerValue(0, "water")];

  // Execution
  const createDefinition = () => new LayerDefinition("terrain", "Terrain Layer", values);

  // Assertion
  assert.throws(createDefinition, TypeError);
});

test("ordered levels reject fractional values", () => {
  // Setup
  const value = 1.5;

  // Execution
  const createLevel = () => new LevelValue(value, "Low");

  // Assertion
  assert.throws(createLevel, TypeError);
});

test("ordered levels reject values outside zero to five", () => {
  // Setup
  const values = [-1, 6];

  // Execution
  const createLevels = values.map((value) => () => new LevelValue(value, "Invalid"));

  // Assertion
  createLevels.forEach((createLevel) => assert.throws(createLevel, TypeError));
});

test("ordered levels reject empty names", () => {
  // Setup
  const name = "";

  // Execution
  const createLevel = () => new LevelValue(1, name);

  // Assertion
  assert.throws(createLevel, TypeError);
});

test("layer definitions resolve ordered metadata by its numeric value", () => {
  // Setup
  const low = new LevelValue(2, "Low");
  const high = new LevelValue(4, "High");
  const layer = new LayerDefinition("test", "Test", [high, low]);

  // Execution
  const resolved = layer.getValue(low.value);

  // Assertion
  assert.equal(resolved, low);
});

test("layer definitions reject duplicate ordered values", () => {
  // Setup
  const levels = [new LevelValue(2, "Low"), new LevelValue(2, "Duplicate")];

  // Execution
  const createDefinition = () => new LayerDefinition("test", "Test", levels);

  // Assertion
  assert.throws(createDefinition, TypeError);
});

test("layer definitions reject mixed identity and ordered metadata", () => {
  // Setup
  const values = [new LayerValue(1, "Site"), new LevelValue(2, "Low")];

  // Execution
  const createDefinition = () => new LayerDefinition("test", "Test", values);

  // Assertion
  assert.throws(createDefinition, TypeError);
});
