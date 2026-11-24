import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fromZeni, getUnitPrice, isAvailable, parseItemList, priceSellList, toZeni } from "../../docs/scripts/shop/shop-logic.js";

const load = (name) => JSON.parse(readFileSync(new URL(`../../docs/data/${name}`, import.meta.url), "utf8"));
const { items, categories } = load("shop-items.json");
const rules = load("shop-rules.json");
const find = (id) => items.find((item) => item.id === id);
const place = { clan: "dragon", settlement: "city", settlementType: "normal" };

test("every item has a known category and a unique id", () => {
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  items.forEach((item) => assert.ok(categories.includes(item.category), item.id));
});

test("money converts both ways", () => {
  assert.equal(toZeni({ koku: 1, bu: 2, zeni: 3 }, rules), 73);
  assert.deepEqual(fromZeni(73, rules), { koku: 1, bu: 2, zeni: 3 });
});

test("price changes with settlement, type and quality", () => {
  const sandals = find("sandals");
  assert.equal(getUnitPrice(sandals, place, rules), 50);
  assert.equal(getUnitPrice(sandals, { ...place, settlement: "village" }, rules), 60);
  assert.equal(getUnitPrice(sandals, { ...place, settlementType: "merchant" }, rules), 45);
  assert.equal(getUnitPrice(sandals, place, rules, true), 150);
});

test("availability follows clan, settlement and type", () => {
  assert.equal(isAvailable(find("tent-yurt"), place, rules), false);
  assert.equal(isAvailable(find("tent-yurt"), { ...place, clan: "unicorn" }, rules), true);
  assert.equal(isAvailable(find("finger-of-jade"), place, rules), false);
  assert.equal(isAvailable(find("finger-of-jade"), { ...place, settlementType: "merchant" }, rules), true);
  assert.equal(isAvailable(find("blacksmith-hammer"), place, rules), false);
  assert.equal(isAvailable(find("sandals"), { ...place, settlement: "village" }, rules, true), false);
});

test("text list parses quantities and quality", () => {
  assert.deepEqual(parseItemList("2 Kimono\nSandals x3\nMask hq\nWig, 4"), [
    { name: "Kimono", quantity: 2, highQuality: false },
    { name: "Sandals", quantity: 3, highQuality: false },
    { name: "Mask", quantity: 1, highQuality: true },
    { name: "Wig", quantity: 4, highQuality: false },
  ]);
});

test("sell list pays a share of the price", () => {
  const [sandals, unknown] = priceSellList("2 Sandals\nDragon egg", items, place, rules);
  assert.equal(sandals.totalZeni, 50);
  assert.equal(unknown.item, undefined);
});
