import assert from "node:assert/strict";
import test from "node:test";
import { BASE_SPEED_KMPH, getTravelSpeed } from "../../docs/scripts/travel/travel-speed.js";
import { TERRAIN, CLIMATE, VEGETATION, RIVER, INFRASTRUCTURE } from "../../docs/scripts/world/world-map-layers.js";

const cases = [
  ["hills", ["foot", "hills"], 4],
  ["mountains", ["foot", "mountains"], 2.5],
  ["wetlands", ["foot", "wetlands"], 3.25],
  ["forest", ["foot", "flat", "temperate", "vegetation"], 4],
  ["tropical land", ["foot", "flat", "tropical"], 4.5],
  ["polar land", ["foot", "flat", "polar"], 4],
  ["river crossing", ["foot", "flat", "temperate", "none", "river"], 3.75],
  ["additive penalties", ["foot", "hills", "polar", "vegetation", "river"], 0.75],
  ["road bonus", ["foot", "mountains", "temperate", "vegetation", "none", "road"], 4],
  ["footpath bonus", ["foot", "mountains", "temperate", "none", "none", "footpath"], 3.5],
  ["road bridge", ["caravan", "flat", "temperate", "none", "river", "road"], 4],
  ["footpath bridge", ["horse", "flat", "temperate", "none", "river", "footpath"], 7],
  ["inland bridge", ["army", "water", "temperate", "none", "none", "road"], 4],
  ["road on cliff", ["horse", "cliff", "temperate", "none", "none", "road"], 5.6],
  ["footpath on cliff", ["foot", "cliff", "temperate", "none", "none", "footpath"], 2.5],
  ["ship on land", ["ship"], -1],
  ["boat on land", ["river boat"], -1],
  ["ship in lake", ["ship", "water"], 9],
  ["ship at sea", ["ship", "ocean"], 9],
  ["polar waters", ["ship", "ocean", "polar"], 5.85],
  ["tropical waters", ["ship", "ocean", "tropical"], 9],
  ["river boat at sea", ["river boat", "ocean"], -1],
  ["river boat on coast", ["river boat", "coastal water"], 4.875],
  ["downstream cap", ["river boat", "flat", "temperate", "none", "river"], 6.5],
  ["upstream boat", ["river boat", "flat", "temperate", "none", "river", "none", true], 4.875],
  ["downstream ship size", ["ship", "flat", "temperate", "none", "river"], 7.2],
  ["upstream ship size", ["ship", "flat", "temperate", "none", "river", "none", true], 4.05],
  ["ship bridge blocked", ["ship", "flat", "temperate", "none", "river", "road"], -1],
  ["ship footbridge blocked", ["ship", "flat", "temperate", "none", "river", "footpath"], -1],
  ["lake ship bridge blocked", ["ship", "water", "temperate", "none", "none", "road"], -1],
  ["boat bridge clearance", ["river boat", "water", "temperate", "none", "none", "road"], 5.85],
  ["river waterfall", ["river boat", "cliff", "temperate", "none", "river"], -1],
  ["mounted cliff path", ["horse", "cliff", "temperate", "none", "none", "footpath"], -1],
  ["river on ocean tile", ["ship", "ocean", "temperate", "none", "river"], -1],
  ["forest on water", ["ship", "water", "temperate", "vegetation"], -1],
  ["port on land", ["ship", "flat", "temperate", "none", "none", "large port"], -1],
  ["port gives no land bonus", ["foot", "hills", "temperate", "none", "none", "small port"], 4],
  ["positive minimum", ["foot", "mountains", "polar", "vegetation", "river"], 0.5],
  ["unknown mode", ["swim"], -1],
  ["unknown terrain", ["foot", "city"], -1],
  ["unknown climate", ["foot", "flat", "cold"], -1],
  ["unknown vegetation", ["foot", "flat", "temperate", "unknown"], -1],
  ["unknown river", ["foot", "flat", "temperate", "none", "unknown"], -1],
  ["unknown infrastructure", ["foot", "flat", "temperate", "none", "none", "unknown"], -1],
  ["invalid direction", ["foot", "flat", "temperate", "none", "none", "none", "upstream"], -1],
  ["metadata inputs", [0, TERRAIN.FLAT, CLIMATE.TEMPERATE, VEGETATION.NONE, RIVER.NONE, INFRASTRUCTURE.NONE], 5],
  ["numeric inputs", [1, 0, 0, 0, 0, 0], 7],
  ["case and whitespace", [" FOOT ", " Flat ", "TEMPERATE", "None", "None", "Road"], 5],
  ["null terrain", ["foot", null], -1],
  ["missing mode", [undefined], -1],
  ["invalid numeric mode", [6], -1],
];
Object.entries(BASE_SPEED_KMPH).forEach(([mode, speed]) => {
  const terrain = mode === "ship" || mode === "river boat" ? "water" : "flat";
  ["temperate", "desert", "waste", "shadowland"].forEach((climate) =>
    cases.push([`${mode} ideal ${climate}`, [mode, terrain, climate], speed]));
  if (terrain === "flat") {
    ["water", "coastal water", "ocean", "cliff"].forEach((blocked) =>
      cases.push([`${mode} blocked ${blocked}`, [mode, blocked], -1]));
    cases.push([`${mode} road cap`, [mode, "flat", "temperate", "none", "none", "road"], speed]);
  }
});

cases.forEach(([name, inputs, expected]) => test(name, () => {
  // Setup
  const args = ["foot", "flat", "temperate", "none", "none", "none", false];
  inputs.forEach((value, index) => { args[index] = value; });
  // Execution
  const actual = getTravelSpeed(...args);
  // Assertion
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
}));
