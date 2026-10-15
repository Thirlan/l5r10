import { Beast } from "./beast.js";
import { SkillCheck } from "./skill-check.js";
import { CLIMATE, RIVER, TERRAIN, VEGETATION } from "./world-map-layers.js";

const TERRAIN_IDS = Object.freeze({
  FLAT: [TERRAIN.FLAT.id],
  HILLS: [TERRAIN.HILLS.id],
  MOUNTAINS: [TERRAIN.MOUNTAINS.id],
  WATER: [TERRAIN.WATER.id],
  COASTAL_WATER: [TERRAIN.COASTAL_WATER.id],
  OCEAN: [TERRAIN.OCEAN.id],
  WETLANDS: [TERRAIN.WETLANDS.id],
  CLIFF: [TERRAIN.CLIFF.id],
});
const LAND = ["FLAT", "HILLS", "MOUNTAINS", "WETLANDS", "CLIFF"];
const MOUNTAIN_LAND = ["HILLS", "MOUNTAINS", "CLIFF"];
const DESERT_LAND = ["FLAT", "HILLS", "MOUNTAINS", "CLIFF"];
const WATER = ["WATER", "COASTAL_WATER", "OCEAN"];
const LIVING = ["TEMPERATE", "TROPICAL", "DESERT", "POLAR"];
const TAINTED = ["WASTE", "SHADOWLAND"];
const CLIMATE_IDS = Object.freeze({
  TEMPERATE: [CLIMATE.TEMPERATE.id],
  TROPICAL: [CLIMATE.TROPICAL.id],
  DESERT: [CLIMATE.DESERT.id],
  POLAR: [CLIMATE.POLAR.id],
  WASTE: [CLIMATE.WASTE.id],
  SHADOWLAND: [CLIMATE.SHADOWLAND.id],
});
const ALL_TERRAINS = Object.values(TERRAIN).map(({ id }) => id);
const ALL_CLIMATES = Object.values(CLIMATE).map(({ id }) => id);
const ALL_VEGETATION = Object.values(VEGETATION).map(({ id }) => id);
const ALL_RIVERS = Object.values(RIVER).map(({ id }) => id);
const FAST_BEASTS = new Set([
  "Death-Worm", "Griffon", "Manticore", "Guawa", "Serow Stampede", "Wolf Pack",
  "Wild Horse Stampede", "Shark", "Lion", "Tiger", "Shadow Wing", "Onikage Rider",
  "Yobuko", "Koumori", "Kenku", "Tengu", "Yuki-onna", "Wanyudo", "Isonade",
]);
const HARD_TO_SPOT = new Set([
  "Mamushi Viper", "Scorpion", "Rattlesnake", "Giant Spider", "Kyorinrin",
  "Penanggalan", "Harionago", "Kansen Possession", "Silt-Stalker", "Sun-Viper",
  "Flame-Core Scorpion", "Giant Burrowing Worm", "Mizugumo", "Sanjuro",
]);
const NO_AVOID_CHECK = new Set(["Mamushi Viper", "Scorpion", "Rattlesnake"]);
const IMPACT_CHECKS = Object.freeze({
  "Mamushi Viper": [["Medicine", "Intelligence", 15], ["", "Stamina", 15]],
  "Giant Hornet Swarm": [["", "Stamina", 15]],
  "Mukade Centipede": [["Medicine", "Intelligence", 15], ["", "Stamina", 15]],
  Scorpion: [["Medicine", "Intelligence", 15], ["", "Stamina", 15]],
  "Jellyfish Bloom": [["Medicine", "Intelligence", 15], ["", "Stamina", 15]],
  "Wild Horse Stampede": [["", "Stamina", 15]],
  "Giant Spider": [["Medicine", "Intelligence", 15]],
  "Pekkle no Oni": [["", "Willpower", 15]],
  "Gokimono Swarm": [["", "Stamina", 20]],
  Kyofu: [["", "Willpower", 20]],
  "Hinotoma": [["", "Stamina", 10]],
  Kodama: [["Etiquette", "Awareness", 10]],
  Mujina: [["Investigation", "Perception", 10]],
  Tanuki: [["Etiquette", "Awareness", 10]],
  Yobuko: [["Athletics", "Strength", 10]],
  Amikiri: [["Athletics", "Strength", 10]],
  Basan: [["", "Willpower", 10]],
  Kitsune: [["Etiquette", "Awareness", 15]],
  Shojo: [["", "Willpower", 15]],
  Ubume: [["", "Willpower", 15]],
  "Fudoshi Tanglevine": [["Athletics", "Strength", 15]],
  "Konaki-jiji": [["Athletics", "Strength", 20]],
  "Yuki-onna": [["", "Willpower", 20]],
  Ningyo: [["Athletics", "Strength", 20]],
  "Returned Spirit": [["", "Willpower", 25]],
  Goryo: [["", "Willpower", 30]],
  "Ki-rin": [["Etiquette", "Awareness", 30]],
  "Sun-Viper": [["Medicine", "Intelligence", 15], ["", "Stamina", 15]],
  "Flame-Core Scorpion": [["Medicine", "Intelligence", 20], ["", "Stamina", 20]],
  "Giant Burrowing Worm": [["Athletics", "Agility", 30]],
  Hanajin: [["Investigation", "Perception", 20]],
  "Qabalistic Phantom": [["", "Willpower", 20]],
  "Sea Jinn": [["Athletics", "Strength", 25]],
  "Wind Jinn": [["Athletics", "Strength", 25], ["", "Stamina", 25]],
  "Ka Jinn": [["", "Willpower", 30], ["Etiquette", "Awareness", 30]],
  "Oni-bi": [["Athletics", "Agility", 10]],
  Mokumokuren: [["", "Willpower", 15]],
  "Great Marsh Leech": [["Medicine", "Intelligence", 10], ["", "Stamina", 10]],
  Yurei: [["", "Willpower", 15]],
  "Corrupted Water Kami": [["Athletics", "Strength", 20]],
});

function resolveTerrain(values) {
  if (values === "ANY") return ALL_TERRAINS;
  if (values === "LAND") values = LAND;
  if (values === "MOUNTAIN_LAND") values = MOUNTAIN_LAND;
  if (values === "DESERT_LAND") values = DESERT_LAND;
  if (values === "WATER") values = WATER;
  return [...new Set(values.flatMap((value) => TERRAIN_IDS[value]))];
}

function resolveClimate(values) {
  if (values === "ANY" || values === "ALL") return ALL_CLIMATES;
  if (values === "LIVING") values = LIVING;
  if (values === "TAINTED") values = TAINTED;
  return [...new Set(values.flatMap((value) => CLIMATE_IDS[value]))];
}

function makeChecks(definitions) {
  return definitions.map(([skill, trait, tn]) => new SkillCheck(skill, trait, tn));
}

function buildBeast([name, encounterType, rank, weight, terrain, climate, vegetation, river, impact = false]) {
  const baseTN = 5 + 5 * rank;
  const spotTN = Math.max(5, baseTN - (rank >= 4 ? 5 : 0) + (HARD_TO_SPOT.has(name) ? 5 : 0));
  const avoidTN = baseTN + (FAST_BEASTS.has(name) ? 5 : 0);
  const avoid = NO_AVOID_CHECK.has(name)
    ? []
    : [["Horsemanship", "Agility", avoidTN], ["Athletics", "Strength", avoidTN]];
  const escape = [["Horsemanship", "Agility", avoidTN + 5], ["Athletics", "Strength", avoidTN + 5]];
  const impactDefinitions = IMPACT_CHECKS[name]
    ?? (impact ? [["", "Stamina", baseTN]] : []);

  return new Beast({
    name,
    encounterType,
    rank,
    weight,
    terrain: resolveTerrain(terrain),
    climate: resolveClimate(climate),
    vegetation: vegetation === "ANY" ? ALL_VEGETATION : [VEGETATION[vegetation].id],
    river: river === "ANY" ? ALL_RIVERS : [RIVER[river].id],
    spotSkillCheck: makeChecks([["Hunting", "Perception", spotTN]]),
    avoidSkillCheck: makeChecks(avoid),
    escapeSkillCheck: makeChecks(escape),
    impactSkillCheck: makeChecks(impactDefinitions),
    encounterDescription: `${name} threatens travelers in its habitat.`,
  });
}

const ANIMALS = [
  ["Wild Dog Pack", "animal", 1, 60, ["FLAT", "HILLS"], ["TEMPERATE", "DESERT"], "ANY", "ANY"],
  ["Mamushi Viper", "animal", 1, 50, ["FLAT", "HILLS", "WETLANDS"], ["TEMPERATE", "TROPICAL"], "PRESENT", "ANY", true],
  ["Giant Hornet Swarm", "animal", 1, 40, ["FLAT", "HILLS"], ["TEMPERATE", "TROPICAL"], "PRESENT", "ANY", true],
  ["Mukade Centipede", "animal", 1, 30, ["FLAT", "WETLANDS"], ["TROPICAL"], "PRESENT", "ANY", true],
  ["Scorpion", "animal", 1, 40, ["FLAT", "HILLS"], ["DESERT"], "NONE", "NONE", true],
  ["Death-Worm", "animal", 4, 10, ["FLAT"], ["DESERT"], "NONE", "NONE"],
  ["Jackal Pack", "animal", 1, 30, ["FLAT", "HILLS"], ["DESERT"], "ANY", "ANY"],
  ["Griffon", "animal", 4, 10, ["FLAT", "HILLS", "MOUNTAINS"], ["DESERT"], "ANY", "ANY"],
  ["Manticore", "animal", 4, 10, ["FLAT", "HILLS", "MOUNTAINS"], ["DESERT"], "ANY", "ANY"],
  ["Guawa", "animal", 4, 10, ["FLAT", "HILLS", "MOUNTAINS"], ["DESERT"], "ANY", "ANY"],
  ["Rattlesnake", "animal", 2, 10, ["FLAT", "HILLS", "MOUNTAINS"], ["DESERT"], "ANY", "ANY"],
  ["Jellyfish Bloom", "animal", 1, 30, ["COASTAL_WATER", "OCEAN"], ["TEMPERATE", "TROPICAL"], "ANY", "ANY", true],
  ["Serow Stampede", "animal", 1, 20, ["MOUNTAINS", "CLIFF"], ["TEMPERATE", "POLAR"], "ANY", "ANY"],
  ["Boar", "animal", 2, 50, ["HILLS", "MOUNTAINS"], ["TEMPERATE"], "PRESENT", "ANY"],
  ["Wolf Pack", "animal", 2, 50, ["FLAT", "HILLS", "MOUNTAINS"], ["TEMPERATE", "POLAR"], "ANY", "ANY"],
  ["Mountain Ape Troop", "animal", 2, 30, ["MOUNTAINS", "CLIFF"], ["TEMPERATE", "POLAR"], "ANY", "ANY"],
  ["Wild Horse Stampede", "animal", 2, 20, ["FLAT"], ["TEMPERATE", "DESERT"], "NONE", "ANY", true],
  ["Giant Spider", "animal", 2, 30, ["FLAT", "HILLS"], ["TROPICAL"], "PRESENT", "ANY", true],
  ["Black Bear", "animal", 3, 30, ["HILLS", "MOUNTAINS"], ["TEMPERATE"], "PRESENT", "ANY"],
  ["Shark", "animal", 4, 30, ["COASTAL_WATER", "OCEAN"], ["TEMPERATE", "TROPICAL"], "ANY", "ANY"],
  ["Brown Bear", "animal", 3, 20, ["HILLS", "MOUNTAINS"], ["POLAR"], "ANY", "ANY"],
  ["Lion", "animal", 3, 15, ["FLAT"], ["TEMPERATE"], "NONE", "ANY"],
  ["Tiger", "animal", 3, 15, ["FLAT", "HILLS"], ["TROPICAL"], "PRESENT", "ANY"],
];

const CRIMINALS = [
  ["Cutpurse", "criminal", 1, 20, "LAND", "LIVING", "ANY", "ANY", true],
  ["Peasant Bandits", "criminal", 2, 100, "LAND", "LIVING", "ANY", "ANY"],
  ["Ronin Bandits", "criminal", 3, 50, "LAND", "LIVING", "ANY", "ANY"],
  ["Smugglers", "criminal", 3, 10, ["WATER", "WETLANDS"], "LIVING", "NONE", "NONE"],
  ["Pirates", "criminal", 4, 10, ["COASTAL_WATER", "OCEAN"], "LIVING", "NONE", "NONE"],
  ["Gaijin Bandits", "criminal", 5, 1, "ANY", "LIVING", "ANY", "ANY"],
];

const SHADOWLANDS = [
  ["Bakemono Raiders", "shadowland", 1, 80, "LAND", "ALL", "ANY", "ANY"],
  ["Pekkle no Oni", "shadowland", 1, 30, "LAND", "ALL", "ANY", "ANY", true],
  ["Zombie Peasants", "shadowland", 1, 50, "LAND", "ALL", "ANY", "ANY"],
  ["Shadow Wing", "shadowland", 1, 30, "LAND", "ALL", "ANY", "ANY"],
  ["Gokimono Swarm", "shadowland", 2, 30, ["FLAT", "WETLANDS"], "ALL", "ANY", "ANY", true],
  ["Hounds of the Lost", "shadowland", 2, 30, "LAND", "ALL", "ANY", "ANY"],
  ["Skeletal Bushi", "shadowland", 2, 40, "LAND", "ALL", "ANY", "ANY"],
  ["Kyofu", "shadowland", 2, 20, "LAND", "ALL", "ANY", "ANY", true],
  ["Kyorinrin", "shadowland", 2, 10, "LAND", "ALL", "ANY", "ANY"],
  ["Penanggalan", "shadowland", 3, 20, "LAND", "ALL", "ANY", "ANY"],
  ["Harionago", "shadowland", 3, 15, "LAND", "ALL", "PRESENT", "ANY"],
  ["Bog Hag", "shadowland", 3, 20, ["WETLANDS"], "ALL", "ANY", "ANY"],
  ["Kumo", "shadowland", 3, 20, ["HILLS", "MOUNTAINS", "WETLANDS"], "ALL", "PRESENT", "ANY"],
  ["Ashi no Oni", "shadowland", 3, 20, "LAND", "ALL", "ANY", "ANY"],
  ["Suiteiru no Oni", "shadowland", 3, 20, ["WATER", "WETLANDS"], "ALL", "ANY", "ANY"],
  ["Kansen Possession", "shadowland", 3, 15, "ANY", "ALL", "ANY", "ANY", true],
  ["Shadowlands Troll", "shadowland", 4, 25, "LAND", "ALL", "ANY", "ANY"],
  ["Shadowlands Ogre", "shadowland", 4, 20, "LAND", "ALL", "ANY", "ANY"],
  ["Revenant", "shadowland", 4, 15, "LAND", "ALL", "ANY", "ANY"],
  ["Onikage Rider", "shadowland", 4, 10, ["FLAT", "HILLS"], "ALL", "ANY", "ANY"],
  ["Bonestealer", "shadowland", 4, 10, "LAND", "ALL", "ANY", "ANY"],
  ["Skull Tide", "shadowland", 4, 10, ["FLAT", "HILLS"], "ALL", "ANY", "ANY"],
  ["Uragirimono", "shadowland", 4, 10, "LAND", "ALL", "ANY", "ANY"],
  ["Shokushu no Oni", "shadowland", 4, 10, ["LAND", "WATER"], "ALL", "ANY", "ANY"],
  ["Sodatsu no Oni", "shadowland", 4, 10, "LAND", "ALL", "ANY", "ANY", true],
  ["Tsuburu no Oni", "shadowland", 5, 5, "LAND", "ALL", "ANY", "ANY"],
  ["Shikibu no Oni", "shadowland", 5, 5, "LAND", "ALL", "ANY", "ANY", true],
  ["Ryu Saino Oni", "shadowland", 5, 3, "ANY", "ALL", "ANY", "ANY"],
  ["Ashura", "shadowland", 5, 3, "LAND", "ALL", "ANY", "ANY"],
  ["Gashadokuro", "shadowland", 5, 3, ["FLAT", "HILLS"], "ALL", "ANY", "ANY", true],
];
