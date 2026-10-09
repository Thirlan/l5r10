import * as layers from "../docs/scripts/world-map-layers.js";
import { BASE_LAYER_IMAGES, drawBaseLayers, drawCliffEdges } from "../docs/scripts/world-map-img-base-layers.js";
import { drawRiver } from "../docs/scripts/world-map-img-river.js";
import { drawInfrastructure } from "../docs/scripts/world-map-img-infrastructure.js";
import { SETTLEMENT_ASSETS, getSettlementAsset, drawSettlementMarker, NEUTRAL_SETTLEMENT_COLORS } from "../docs/scripts/world-map-img-settlements.js";
import { getAnimalColor, drawAnimalCue } from "../docs/scripts/world-map-img-animal.js";
import { getSpiritColor, drawSpiritCue } from "../docs/scripts/world-map-img-spirit.js";
import { getShadowlandColor, drawShadowlandCue } from "../docs/scripts/world-map-img-shadowland.js";
import { getCrimeColor, drawCrimeCue } from "../docs/scripts/world-map-img-crime.js";
import { getResourceLevelColor, drawResourceLevelCue } from "../docs/scripts/world-map-img-resource-level.js";
import { getOverlayCueColor } from "../docs/scripts/world-map-common.js";

export const CONTROL_SIZE = 32;
const CONTROL_ZOOM = 1;
export const CONTROL_SOURCE_IMAGES = Object.freeze([
  ...BASE_LAYER_IMAGES.map(({ image }) => image),
  ...SETTLEMENT_ASSETS.map(({ image }) => image),
]);

/**
 * @param {Map<string, HTMLImageElement>} images Loaded source images.
 * @returns {{filename: string, label: string, draw: (ctx: CanvasRenderingContext2D) => void}[]} Preview definitions.
 */
export function createControlPreviews(images) {
  const previews = [];
  const cache = {};
  function add(filename, label, draw) {
    previews.push({ filename: `control_${filename}.webp`, label, draw });
  }
  function base(ctx, terrain, climate = layers.CLIMATE.TEMPERATE, vegetation = layers.VEGETATION.NONE) {
    drawBaseLayers(ctx, 0, 0, CONTROL_SIZE, terrain, climate, vegetation, images);
  }
  Object.entries(layers.TERRAIN).forEach(([key, value]) => {
    add(key.toLowerCase(), `Terrain: ${value.name}`, (ctx) => {
      base(ctx, value);
      if (value === layers.TERRAIN.CLIFF) drawCliffEdges(ctx, 0, 0, CONTROL_SIZE, CONTROL_ZOOM, { 0: 1 });
    });
  });
  Object.entries(layers.CLIMATE).forEach(([key, value]) => {
    add(key.toLowerCase(), `Climate: ${value.name}`, (ctx) => base(ctx, layers.TERRAIN.FLAT, value));
  });
  Object.values(layers.VEGETATION).forEach((value) => {
    add(`veg_${value.id}`, `Vegetation: ${value.name}`, (ctx) => base(ctx, layers.TERRAIN.FLAT, layers.CLIMATE.TEMPERATE, value));
  });
  Object.entries(layers.RIVER).forEach(([key, value]) => {
    add(`river_${key.toLowerCase()}`, `River: ${value.name}`, (ctx) => {
      if (value === layers.RIVER.NONE) return;
      drawRiver(ctx, 0, 0, 16, { east: true, south: true, west: false, north: false });
      drawRiver(ctx, 1, 0, 16, { east: false, south: false, west: true, north: false });
      drawRiver(ctx, 0, 1, 16, { east: false, south: false, west: false, north: true });
    });
  });
  Object.entries(layers.INFRASTRUCTURE).forEach(([key, value]) => {
    add(`infrastructure_${key.toLowerCase()}`, `Infrastructure: ${value.name}`, (ctx) => {
      const road = value === layers.INFRASTRUCTURE.ROAD || value === layers.INFRASTRUCTURE.FOOTPATH;
      drawInfrastructure(ctx, 0, 0, road ? 16 : CONTROL_SIZE, value, {
        east: road, south: road, southeast: road, northeast: false,
      });
    });
  });
  const overlays = [
    ["animal", layers.ANIMAL, getAnimalColor, drawAnimalCue],
    ["spirit", layers.SPIRIT, getSpiritColor, drawSpiritCue],
    ["shadowland", layers.SHADOWLAND, getShadowlandColor, drawShadowlandCue],
    ["crime", layers.CRIME, getCrimeColor, drawCrimeCue],
    ["resource_level", layers.RESOURCE_LEVEL, getResourceLevelColor, drawResourceLevelCue],
  ];
  overlays.forEach(([name, catalog, getColor, drawCue]) => {
    Object.entries(catalog).forEach(([key, value]) => {
      add(`${name}_${key.toLowerCase()}`, `${name.replaceAll("_", " ")}: ${value.name}`, (ctx) => {
        const color = getColor(value);
        if (!color) return;
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, CONTROL_SIZE, CONTROL_SIZE);
        drawCue(ctx, 0, 0, CONTROL_SIZE, CONTROL_SIZE, getOverlayCueColor(color), 1);
        ctx.restore();
      });
    });
  });
  Object.entries(layers.SETTLEMENT).forEach(([key, value]) => {
    add(`settlement_${key.toLowerCase()}`, `Settlement: ${value.name}`, (ctx) => {
      const path = getSettlementAsset(value);
      drawSettlementMarker(ctx, value, images.get(path), CONTROL_SIZE / 2, CONTROL_SIZE / 2,
        CONTROL_ZOOM, NEUTRAL_SETTLEMENT_COLORS, cache);
    });
  });
  return previews;
}
