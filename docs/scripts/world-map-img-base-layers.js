import {
  CLIMATE,
  TERRAIN,
  VEGETATION,
} from "./world-map-layers.js";

const tileMappings = [
  [TERRAIN.FLAT, CLIMATE.TEMPERATE, VEGETATION.NONE, "../img/map/flat_temperate_0.png"],
  [TERRAIN.FLAT, CLIMATE.WASTE, VEGETATION.NONE, "../img/map/flat_waste_0.webp"],
  [TERRAIN.FLAT, CLIMATE.SHADOWLAND, VEGETATION.NONE, "../img/map/flat_shadowland_0.webp"],
  [TERRAIN.FLAT, CLIMATE.TEMPERATE, VEGETATION.PRESENT, "../img/map/flat_temperate_1.png"],
  [TERRAIN.FLAT, CLIMATE.WASTE, VEGETATION.PRESENT, "../img/map/flat_waste_1.webp"],
  [TERRAIN.FLAT, CLIMATE.SHADOWLAND, VEGETATION.PRESENT, "../img/map/flat_shadowland_1.webp"],
  [TERRAIN.FLAT, CLIMATE.TROPICAL, VEGETATION.NONE, "../img/map/flat_tropical_0.png"],
  [TERRAIN.FLAT, CLIMATE.TROPICAL, VEGETATION.PRESENT, "../img/map/flat_tropical_1.png"],
  [TERRAIN.FLAT, CLIMATE.DESERT, VEGETATION.NONE, "../img/map/flat_desert_0.png"],
  [TERRAIN.FLAT, CLIMATE.DESERT, VEGETATION.PRESENT, "../img/map/flat_desert_1.png"],
  [TERRAIN.FLAT, CLIMATE.POLAR, VEGETATION.NONE, "../img/map/flat_polar_0.png"],
  [TERRAIN.FLAT, CLIMATE.POLAR, VEGETATION.PRESENT, "../img/map/flat_polar_1.png"],
  [TERRAIN.HILLS, CLIMATE.TEMPERATE, VEGETATION.NONE, "../img/map/hills_temperate_0.png"],
  [TERRAIN.HILLS, CLIMATE.WASTE, VEGETATION.NONE, "../img/map/hills_waste_0.webp"],
  [TERRAIN.HILLS, CLIMATE.SHADOWLAND, VEGETATION.NONE, "../img/map/hills_shadowland_0.webp"],
  [TERRAIN.HILLS, CLIMATE.TEMPERATE, VEGETATION.PRESENT, "../img/map/hills_temperate_1.png"],
  [TERRAIN.HILLS, CLIMATE.WASTE, VEGETATION.PRESENT, "../img/map/hills_waste_1.webp"],
  [TERRAIN.HILLS, CLIMATE.SHADOWLAND, VEGETATION.PRESENT, "../img/map/hills_shadowland_1.webp"],
  [TERRAIN.HILLS, CLIMATE.TROPICAL, VEGETATION.NONE, "../img/map/hills_tropical_0.png"],
  [TERRAIN.HILLS, CLIMATE.TROPICAL, VEGETATION.PRESENT, "../img/map/hills_tropical_1.png"],
  [TERRAIN.HILLS, CLIMATE.DESERT, VEGETATION.NONE, "../img/map/hills_desert_0.png"],
  [TERRAIN.HILLS, CLIMATE.DESERT, VEGETATION.PRESENT, "../img/map/hills_desert_1.png"],
  [TERRAIN.HILLS, CLIMATE.POLAR, VEGETATION.NONE, "../img/map/hills_polar_0.png"],
  [TERRAIN.HILLS, CLIMATE.POLAR, VEGETATION.PRESENT, "../img/map/hills_polar_1.png"],
  [TERRAIN.MOUNTAINS, CLIMATE.TEMPERATE, VEGETATION.NONE, "../img/map/mountains_temperate_0.png"],
  [TERRAIN.MOUNTAINS, CLIMATE.WASTE, VEGETATION.NONE, "../img/map/mountains_waste_0.webp"],
  [TERRAIN.MOUNTAINS, CLIMATE.SHADOWLAND, VEGETATION.NONE, "../img/map/mountains_shadowland_0.webp"],
  [TERRAIN.MOUNTAINS, CLIMATE.TEMPERATE, VEGETATION.PRESENT, "../img/map/mountains_temperate_1.png"],
  [TERRAIN.MOUNTAINS, CLIMATE.WASTE, VEGETATION.PRESENT, "../img/map/mountains_waste_1.webp"],
  [TERRAIN.MOUNTAINS, CLIMATE.SHADOWLAND, VEGETATION.PRESENT, "../img/map/mountains_shadowland_1.webp"],
  [TERRAIN.MOUNTAINS, CLIMATE.TROPICAL, VEGETATION.NONE, "../img/map/mountains_tropical_0.png"],
  [TERRAIN.MOUNTAINS, CLIMATE.TROPICAL, VEGETATION.PRESENT, "../img/map/mountains_tropical_1.png"],
  [TERRAIN.MOUNTAINS, CLIMATE.DESERT, VEGETATION.NONE, "../img/map/mountains_desert_0.png"],
  [TERRAIN.MOUNTAINS, CLIMATE.DESERT, VEGETATION.PRESENT, "../img/map/mountains_desert_1.png"],
  [TERRAIN.MOUNTAINS, CLIMATE.POLAR, VEGETATION.NONE, "../img/map/mountains_polar_0.png"],
  [TERRAIN.MOUNTAINS, CLIMATE.POLAR, VEGETATION.PRESENT, "../img/map/mountains_polar_1.png"],
  [TERRAIN.WATER, CLIMATE.TEMPERATE, VEGETATION.NONE, "../img/map/water_temperate_0.png"],
  [TERRAIN.WATER, CLIMATE.WASTE, VEGETATION.NONE, "../img/map/water_waste_0.webp"],
  [TERRAIN.WATER, CLIMATE.SHADOWLAND, VEGETATION.NONE, "../img/map/water_shadowland_0.webp"],
  [TERRAIN.WATER, CLIMATE.TROPICAL, VEGETATION.NONE, "../img/map/water_tropical_0.png"],
  [TERRAIN.WATER, CLIMATE.DESERT, VEGETATION.NONE, "../img/map/water_desert_0.png"],
  [TERRAIN.WATER, CLIMATE.POLAR, VEGETATION.NONE, "../img/map/water_polar_0.png"],
  [TERRAIN.COASTAL_WATER, CLIMATE.TEMPERATE, VEGETATION.NONE, "../img/map/coastal_water_temperate_0.png"],
  [TERRAIN.COASTAL_WATER, CLIMATE.WASTE, VEGETATION.NONE, "../img/map/coastal_water_waste_0.webp"],
  [TERRAIN.COASTAL_WATER, CLIMATE.SHADOWLAND, VEGETATION.NONE, "../img/map/coastal_water_shadowland_0.webp"],
  [TERRAIN.COASTAL_WATER, CLIMATE.TROPICAL, VEGETATION.NONE, "../img/map/coastal_water_tropical_0.png"],
  [TERRAIN.COASTAL_WATER, CLIMATE.DESERT, VEGETATION.NONE, "../img/map/coastal_water_desert_0.png"],
  [TERRAIN.COASTAL_WATER, CLIMATE.POLAR, VEGETATION.NONE, "../img/map/coastal_water_polar_0.png"],
  [TERRAIN.OCEAN, CLIMATE.TEMPERATE, VEGETATION.NONE, "../img/map/ocean_temperate_0.png"],
  [TERRAIN.OCEAN, CLIMATE.WASTE, VEGETATION.NONE, "../img/map/ocean_waste_0.webp"],
  [TERRAIN.OCEAN, CLIMATE.SHADOWLAND, VEGETATION.NONE, "../img/map/ocean_shadowland_0.webp"],
  [TERRAIN.OCEAN, CLIMATE.TROPICAL, VEGETATION.NONE, "../img/map/ocean_tropical_0.png"],
  [TERRAIN.OCEAN, CLIMATE.DESERT, VEGETATION.NONE, "../img/map/ocean_desert_0.png"],
  [TERRAIN.OCEAN, CLIMATE.POLAR, VEGETATION.NONE, "../img/map/ocean_polar_0.png"],
  [TERRAIN.WETLANDS, CLIMATE.TEMPERATE, VEGETATION.NONE, "../img/map/wetlands_temperate_0.png"],
  [TERRAIN.WETLANDS, CLIMATE.WASTE, VEGETATION.NONE, "../img/map/wetlands_waste_0.webp"],
  [TERRAIN.WETLANDS, CLIMATE.SHADOWLAND, VEGETATION.NONE, "../img/map/wetlands_shadowland_0.webp"],
  [TERRAIN.WETLANDS, CLIMATE.TEMPERATE, VEGETATION.PRESENT, "../img/map/wetlands_temperate_1.png"],
  [TERRAIN.WETLANDS, CLIMATE.WASTE, VEGETATION.PRESENT, "../img/map/wetlands_waste_1.webp"],
  [TERRAIN.WETLANDS, CLIMATE.SHADOWLAND, VEGETATION.PRESENT, "../img/map/wetlands_shadowland_1.webp"],
  [TERRAIN.WETLANDS, CLIMATE.TROPICAL, VEGETATION.NONE, "../img/map/wetlands_tropical_0.png"],
  [TERRAIN.WETLANDS, CLIMATE.TROPICAL, VEGETATION.PRESENT, "../img/map/wetlands_tropical_1.png"],
  [TERRAIN.WETLANDS, CLIMATE.DESERT, VEGETATION.NONE, "../img/map/wetlands_desert_0.png"],
  [TERRAIN.WETLANDS, CLIMATE.DESERT, VEGETATION.PRESENT, "../img/map/wetlands_desert_1.png"],
  [TERRAIN.WETLANDS, CLIMATE.POLAR, VEGETATION.NONE, "../img/map/wetlands_polar_0.png"],
  [TERRAIN.WETLANDS, CLIMATE.POLAR, VEGETATION.PRESENT, "../img/map/wetlands_polar_1.png"],
];

const tileImageMap = new Map(
  tileMappings.map(([terrain, climate, vegetation, image]) => [
    `${terrain.id},${climate.id},${vegetation.id}`,
    image,
  ]),
);

export const TILE_IMAGE_MAPPINGS = Object.freeze(tileMappings.map(
  ([terrain, climate, vegetation, image]) => Object.freeze({ terrain, climate, vegetation, image }),
));

export function getTileImage(terrain, climate, vegetation) {
  if (!Object.values(TERRAIN).includes(terrain)
    || !Object.values(CLIMATE).includes(climate)
    || !Object.values(VEGETATION).includes(vegetation)) {
    throw new TypeError("Tile image lookup requires terrain, climate, and vegetation values.");
  }

  const effectiveTerrain = terrain === TERRAIN.CLIFF ? TERRAIN.FLAT : terrain;
  const effectiveVegetation = [TERRAIN.WATER, TERRAIN.COASTAL_WATER, TERRAIN.OCEAN].includes(effectiveTerrain)
    ? VEGETATION.NONE
    : vegetation;
  const image = tileImageMap.get(`${effectiveTerrain.id},${climate.id},${effectiveVegetation.id}`);
  if (!image) {
    throw new RangeError(`No tile image is configured for ${terrain.name}, ${climate.name}, ${vegetation.name}.`);
  }
  return image;
}

export const BASE_LAYER_CONTROL_IMAGES = Object.freeze([
  [TERRAIN.FLAT, "../img/map/control_flat.png"],
  [TERRAIN.HILLS, "../img/map/control_hills.png"],
  [TERRAIN.MOUNTAINS, "../img/map/control_mountains.png"],
  [TERRAIN.WATER, "../img/map/control_water.png"],
  [TERRAIN.COASTAL_WATER, "../img/map/control_coastal_water.png"],
  [TERRAIN.OCEAN, "../img/map/control_ocean.png"],
  [TERRAIN.WETLANDS, "../img/map/control_wetlands.png"],
  [CLIMATE.TEMPERATE, "../img/map/control_temperate.png"],
  [CLIMATE.TROPICAL, "../img/map/control_tropical.png"],
  [CLIMATE.DESERT, "../img/map/control_desert.png"],
  [CLIMATE.POLAR, "../img/map/control_polar.png"],
  [VEGETATION.NONE, "../img/map/control_veg_0.png"],
  [VEGETATION.PRESENT, "../img/map/control_veg_1.png"],
].map(([value, image]) => Object.freeze({ value, image })));