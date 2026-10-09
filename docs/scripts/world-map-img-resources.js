import { RESOURCE } from "./world-map-layers.js";

const resourceImageEntries = [
  [RESOURCE.IRON_MINE, "../img/map/iron_mine.webp"],
  [RESOURCE.LUMBER_MILL, "../img/map/lumber_mill.webp"],
  [RESOURCE.RICE_PADDY, "../img/map/rice_paddy.webp"],
  [RESOURCE.GRAIN_FARM, "../img/map/grain_farm.webp"],
  [RESOURCE.SILK_FARM, "../img/map/silk_farm.webp"],
  [RESOURCE.TEA_PLANTATION, "../img/map/tea_plantation.webp"],
  [RESOURCE.HEMP_FARM, "../img/map/hemp_farm.webp"],
  [RESOURCE.COTTON_FARM, "../img/map/cotton_farm.webp"],
  [RESOURCE.FRUIT_ORCHARD, "../img/map/fruit_orchard.webp"],
  [RESOURCE.SHEEP_PASTURE, "../img/map/sheep_pasture.webp"],
  [RESOURCE.GOAT_PASTURE, "../img/map/goat_pasture.webp"],
  [RESOURCE.HORSE_RANCH, "../img/map/horse_ranch.webp"],
  [RESOURCE.CATTLE_FARM, "../img/map/cattle_farm.webp"],
  [RESOURCE.SALT_WORKS, "../img/map/salt_works.webp"],
  [RESOURCE.NUT_GROVE, "../img/map/nut_grove.webp"],
  [RESOURCE.MUSHROOM_FARM, "../img/map/mushroom_farm.webp"],
  [RESOURCE.SPICE_FARM, "../img/map/spice_farm.webp"],
  [RESOURCE.POULTRY_FARM, "../img/map/poultry_farm.webp"],
  [RESOURCE.POPPY_FARM, "../img/map/poppy_farm.webp"],
  [RESOURCE.DYE_CROP_FARM, "../img/map/dye_crop_farm.webp"],
  [RESOURCE.JADE_MINE, "../img/map/jade_mine.webp"],
  [RESOURCE.COPPER_MINE, "../img/map/copper_mine.webp"],
  [RESOURCE.GOLD_MINE, "../img/map/gold_mine.webp"],
  [RESOURCE.SILVER_MINE, "../img/map/silver_mine.webp"],
  [RESOURCE.COAL_MINE, "../img/map/coal_mine.webp"],
  [RESOURCE.CLAY_PIT, "../img/map/clay_pit.webp"],
  [RESOURCE.GEMSTONE_MINE, "../img/map/gemstone_mine.webp"],
  [RESOURCE.STONE_QUARRY, "../img/map/stone_quarry.webp"],
  [RESOURCE.COASTAL_FISH_BOAT, "../img/map/coastal_fish_boat.webp"],
  [RESOURCE.CRAB_BOAT, "../img/map/crab_boat.webp"],
  [RESOURCE.PEARL_DIVERS, "../img/map/pearl_divers.webp"],
  [RESOURCE.SHELLFISH_BOAT, "../img/map/shellfish_boat.webp"],
  [RESOURCE.SQUID_BOAT, "../img/map/squid_boat.webp"],
  [RESOURCE.OCEAN_FISH_BOAT, "../img/map/ocean_fish_boat.webp"],
  [RESOURCE.KELP_FARM, "../img/map/kelp_farm.webp"],
  [RESOURCE.TROPICAL_FRUIT_ORCHARD, "../img/map/tropical_fruit_orchard.webp"],
  [RESOURCE.TROPICAL_LUMBER_MILL, "../img/map/tropical_lumber_mill.webp"],
  [RESOURCE.UTAKU_RANCH, "../img/map/utaku_ranch.webp"],
  [RESOURCE.VEGETABLE_FARM, "../img/map/vegetable_farm.webp"],
];

const resourceImageMap = new Map(resourceImageEntries);
export const RESOURCE_IMAGES = Object.freeze(resourceImageEntries.map(
  ([resource, image]) => Object.freeze({ resource, image }),
));
export const RESOURCE_MARKER_SIZE = 12;

export function getResourceImage(resource) {
  if (!Object.values(RESOURCE).includes(resource)) {
    throw new TypeError("Resource image lookup requires a resource metadata value.");
  }
  return resourceImageMap.get(resource);
}