import { ANIMAL } from "../data/world-map-layers.js";
import { ANIMAL_COLORS } from "./world-map-draw.config.js";

export const ANIMAL_CONTROL_IMAGES = Object.freeze(Object.entries(ANIMAL).map(([key, value]) => Object.freeze({ value, image: `../img/map/control_animal_${key.toLowerCase()}.webp` })));

export function getAnimalColor(value) {
  if (!Object.values(ANIMAL).includes(value)) {
    throw new TypeError("Animal color lookup requires an animal metadata value.");
  }
  return ANIMAL_COLORS.get(value) || null;
}

export function drawAnimalCue(ctx, left, top, width, height, color) {
  if (!ctx || ![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0 || typeof color !== "string") {
    throw new TypeError("Animal cue drawing needs a canvas context, dimensions, and color.");
  }
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(left + width / 2, top + height / 2, Math.max(1, Math.min(width, height) * 0.18), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
