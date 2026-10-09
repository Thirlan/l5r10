import { ANIMAL } from "./world-map-layers.js";

const colors = new Map([
  [ANIMAL.VERY_LOW, "rgba(255, 255, 0, 0.45)"],
  [ANIMAL.LOW, "rgba(255, 255, 0, 0.55)"],
  [ANIMAL.MEDIUM, "rgba(255, 165, 0, 0.55)"],
  [ANIMAL.HIGH, "rgba(255, 0, 0, 0.65)"],
  [ANIMAL.VERY_HIGH, "rgba(128, 0, 128, 0.75)"],
]);

export const ANIMAL_CONTROL_IMAGES = Object.freeze({});

export function getAnimalColor(value) {
  if (!Object.values(ANIMAL).includes(value)) {
    throw new TypeError("Animal color lookup requires an animal metadata value.");
  }
  return colors.get(value) || null;
}

export function drawAnimalCue(ctx, left, top, width, height, color) {
  if (!ctx || ![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0
    || typeof color !== "string") {
    throw new TypeError("Animal cue drawing needs a canvas context, dimensions, and color.");
  }
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(left + width / 2, top + height / 2, Math.max(1, Math.min(width, height) * 0.18), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
