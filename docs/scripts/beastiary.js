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
const DESCRIPTIONS = Object.freeze({
  Mokumokuren: "A shrine haunting watches from an abandoned mountain or marsh shrine.",
  "Naga Guardian": "A Naga guardian protects a hidden marsh city.",
  Zokujin: "A territorial Zokujin defends its mountain tunnels.",
});
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
  const groups = { LAND, MOUNTAIN_LAND, DESERT_LAND, WATER };
  const expandedValues = Array.isArray(values) ? values : [values];
  return [...new Set(expandedValues.flatMap((value) => groups[value] ?? [value])
    .flatMap((value) => TERRAIN_IDS[value]))];
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
    encounterDescription: DESCRIPTIONS[name] ?? `${name} threatens travelers in its habitat.`,
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

const SPIRITS = [
  ["Hinotoma", "spirit", 1, 50, ["FLAT", "WETLANDS"], "LIVING", "ANY", "ANY", true],
  ["Kodama", "spirit", 1, 40, "LAND", ["TEMPERATE", "TROPICAL"], "PRESENT", "ANY", true],
  ["Mujina", "spirit", 1, 40, ["FLAT", "HILLS"], "LIVING", "ANY", "ANY", true],
  ["Tanuki", "spirit", 1, 50, ["FLAT", "HILLS"], ["TEMPERATE"], "PRESENT", "ANY", true],
  ["Yobuko", "spirit", 1, 30, ["MOUNTAINS", "CLIFF"], "LIVING", "ANY", "ANY", true],
  ["Amikiri", "spirit", 1, 30, ["WATER", "COASTAL_WATER", "WETLANDS"], "LIVING", "ANY", "ANY", true],
  ["Basan", "spirit", 1, 20, ["HILLS", "MOUNTAINS"], ["TEMPERATE", "TROPICAL"], "PRESENT", "ANY", true],
  ["Gaki", "spirit", 2, 40, "LAND", ["TEMPERATE", "TROPICAL", "DESERT", "POLAR", "WASTE"], "ANY", "ANY"],
  ["Kappa", "spirit", 2, 50, ["WATER", "WETLANDS", "FLAT"], ["TEMPERATE", "TROPICAL"], "ANY", "PRESENT"],
  ["Kitsune", "spirit", 2, 30, ["FLAT", "HILLS"], ["TEMPERATE"], "PRESENT", "ANY", true],
  ["Bakeneko", "spirit", 2, 30, ["FLAT", "HILLS"], ["TEMPERATE", "TROPICAL"], "ANY", "ANY"],
  ["Koumori", "spirit", 2, 20, ["HILLS", "MOUNTAINS", "CLIFF"], "LIVING", "ANY", "ANY"],
  ["Shojo", "spirit", 2, 20, ["COASTAL_WATER", "OCEAN"], ["TEMPERATE", "TROPICAL"], "ANY", "ANY", true],
  ["Ubume", "spirit", 2, 20, ["FLAT", "HILLS", "WETLANDS"], "LIVING", "ANY", "ANY", true],
  ["Fudoshi Tanglevine", "spirit", 2, 20, ["FLAT", "HILLS"], ["TROPICAL", "TEMPERATE"], "PRESENT", "ANY"],
  ["Kenku", "spirit", 3, 15, ["MOUNTAINS", "CLIFF"], ["TEMPERATE"], "PRESENT", "ANY"],
  ["Tengu", "spirit", 3, 20, ["MOUNTAINS", "CLIFF"], ["TEMPERATE", "POLAR"], "ANY", "ANY"],
  ["Konaki-jiji", "spirit", 3, 15, ["FLAT", "HILLS"], "LIVING", "ANY", "ANY", true],
  ["Nure-onna", "spirit", 3, 15, ["WATER", "COASTAL_WATER", "WETLANDS"], ["TEMPERATE", "TROPICAL"], "ANY", "ANY"],
  ["Nekomata", "spirit", 3, 15, ["HILLS", "MOUNTAINS"], ["TEMPERATE"], "PRESENT", "ANY"],
  ["Satori", "spirit", 3, 15, ["MOUNTAINS"], ["TEMPERATE", "POLAR"], "PRESENT", "ANY", true],
  ["Spirit Hound", "spirit", 3, 15, "LAND", "LIVING", "ANY", "ANY"],
  ["Yuki-onna", "spirit", 3, 30, ["MOUNTAINS", "HILLS", "FLAT"], ["POLAR"], "ANY", "ANY", true],
  ["Ningyo", "spirit", 3, 10, ["WATER", "COASTAL_WATER", "OCEAN", "WETLANDS"], "LIVING", "ANY", "ANY", true],
  ["Onryo", "spirit", 4, 10, "LAND", ["TEMPERATE", "TROPICAL", "DESERT", "POLAR", "WASTE"], "ANY", "ANY"],
  ["Toshigoku Spirit", "spirit", 4, 10, ["FLAT", "HILLS"], ["TEMPERATE", "TROPICAL", "DESERT", "POLAR", "WASTE"], "ANY", "ANY"],
  ["Returned Spirit", "spirit", 4, 10, "LAND", ["TEMPERATE", "TROPICAL", "DESERT", "POLAR", "WASTE"], "ANY", "ANY", true],
  ["Wanyudo", "spirit", 4, 8, ["FLAT", "HILLS"], "LIVING", "NONE", "ANY"],
  ["Nue", "spirit", 4, 8, ["HILLS", "MOUNTAINS"], ["TEMPERATE", "TROPICAL"], "PRESENT", "ANY"],
  ["Wani", "spirit", 4, 10, ["WATER", "WETLANDS"], ["TROPICAL"], "ANY", "PRESENT"],
  ["Isonade", "spirit", 4, 8, ["OCEAN", "COASTAL_WATER"], "LIVING", "ANY", "ANY"],
  ["Goryo", "spirit", 5, 3, "LAND", ["TEMPERATE", "TROPICAL", "DESERT", "POLAR", "WASTE"], "ANY", "ANY", true],
  ["Orochi", "spirit", 5, 3, ["OCEAN", "WATER"], "LIVING", "ANY", "ANY"],
  ["Ki-rin", "spirit", 5, 2, ["FLAT", "HILLS", "MOUNTAINS"], ["TEMPERATE"], "PRESENT", "ANY", true],
];

const DESERT_CREATURES = [
  ["Silt-Stalker", "animal", 2, 30, ["FLAT", "WETLANDS"], ["DESERT"], "NONE", "ANY"],
  ["Sun-Viper", "animal", 2, 30, ["FLAT", "HILLS"], ["DESERT"], "ANY", "ANY", true],
  ["Giant Tortoise", "animal", 2, 10, ["FLAT"], ["DESERT"], "ANY", "ANY"],
  ["Flame-Core Scorpion", "animal", 3, 20, ["FLAT", "HILLS"], ["DESERT"], "NONE", "NONE", true],
  ["Sand-Drake", "animal", 4, 10, ["FLAT", "HILLS"], ["DESERT"], "NONE", "NONE"],
  ["Giant Burrowing Worm", "animal", 5, 3, ["FLAT"], ["DESERT"], "NONE", "NONE", true],
  ["Hanajin", "spirit", 3, 15, "DESERT_LAND", ["DESERT"], "ANY", "ANY", true],
  ["Qabalistic Phantom", "spirit", 3, 10, "DESERT_LAND", ["DESERT", "WASTE"], "ANY", "ANY", true],
  ["Obsidian Golem", "spirit", 4, 8, ["HILLS", "MOUNTAINS", "CLIFF"], ["DESERT"], "ANY", "ANY"],
  ["Flame Jinn", "spirit", 4, 5, "DESERT_LAND", ["DESERT"], "NONE", "ANY"],
  ["Sea Jinn", "spirit", 4, 5, ["WATER", "COASTAL_WATER"], ["DESERT"], "ANY", "ANY", true],
  ["Wind Jinn", "spirit", 4, 5, "DESERT_LAND", ["DESERT"], "ANY", "ANY", true],
  ["Sand Jinn", "spirit", 4, 5, ["FLAT", "HILLS"], ["DESERT"], "NONE", "ANY"],
  ["Ka Jinn", "spirit", 5, 2, "DESERT_LAND", ["DESERT"], "ANY", "ANY", true],
  ["Grave-Ghoul", "shadowland", 2, 30, ["FLAT", "HILLS"], ["DESERT", "WASTE"], "ANY", "ANY"],
  ["Jackal Fiend", "shadowland", 3, 20, "DESERT_LAND", ["DESERT", "WASTE"], "ANY", "ANY"],
  ["Khadi Horror", "shadowland", 4, 10, "DESERT_LAND", ["DESERT", "WASTE"], "ANY", "ANY"],
  ["Ashalan Abomination", "shadowland", 5, 3, "DESERT_LAND", ["DESERT"], "ANY", "ANY"],
];

const MOUNTAIN_CREATURES = [
  ["Oni-bi", "spirit", 1, 30, ["MOUNTAINS", "CLIFF", "WETLANDS"], ["TEMPERATE", "POLAR", "TROPICAL"], "ANY", "ANY", true],
  ["Zokujin", "spirit", 2, 20, ["MOUNTAINS", "CLIFF"], "LIVING", "ANY", "ANY"],
  ["Mokumokuren", "spirit", 2, 10, ["MOUNTAIN_LAND", "WETLANDS"], ["TEMPERATE", "POLAR", "TROPICAL"], "ANY", "ANY", true],
  ["Yama-bito", "spirit", 2, 25, "MOUNTAIN_LAND", ["TEMPERATE", "POLAR"], "ANY", "ANY"],
  ["Yama-uba", "spirit", 3, 15, ["MOUNTAIN_LAND", "WETLANDS"], ["TEMPERATE", "POLAR", "TROPICAL"], "PRESENT", "ANY"],
  ["Mountain Troll", "animal", 4, 10, ["MOUNTAINS", "CLIFF"], ["TEMPERATE", "POLAR"], "ANY", "ANY"],
];

const SWAMP_CREATURES = [
  ["Great Marsh Leech", "animal", 1, 40, ["WETLANDS", "WATER"], ["TEMPERATE", "TROPICAL"], "ANY", "ANY", true],
  ["Mizugumo", "animal", 2, 25, ["WETLANDS", "WATER"], ["TEMPERATE", "TROPICAL"], "ANY", "ANY"],
  ["Giant Alligator", "animal", 3, 20, ["WETLANDS", "WATER"], ["TROPICAL"], "ANY", "ANY"],
  ["Swamp Troll", "animal", 4, 10, ["WETLANDS"], ["TEMPERATE", "TROPICAL"], "ANY", "ANY"],
  ["Hydra", "animal", 5, 2, ["WETLANDS", "COASTAL_WATER"], ["TEMPERATE", "TROPICAL"], "ANY", "ANY"],
  ["Yurei", "spirit", 2, 25, ["WETLANDS"], "LIVING", "ANY", "ANY", true],
  ["Gokuri", "spirit", 2, 20, ["WETLANDS"], ["TEMPERATE", "TROPICAL", "DESERT", "POLAR", "WASTE"], "ANY", "ANY"],
  ["Corrupted Water Kami", "spirit", 3, 10, ["WETLANDS", "WATER"], "LIVING", "ANY", "ANY", true],
  ["Naga Guardian", "spirit", 3, 5, ["WETLANDS"], ["TROPICAL"], "PRESENT", "ANY"],
  ["Marsh Undead", "shadowland", 2, 30, ["WETLANDS"], "ALL", "ANY", "ANY"],
  ["Sanjuro", "shadowland", 3, 15, ["WETLANDS"], "ALL", "ANY", "ANY"],
];

export const BEASTIARY = Object.freeze([
  ...ANIMALS,
  ...CRIMINALS,
  ...SHADOWLANDS,
  ...SPIRITS,
  ...DESERT_CREATURES,
  ...MOUNTAIN_CREATURES,
  ...SWAMP_CREATURES,
].map(buildBeast));
