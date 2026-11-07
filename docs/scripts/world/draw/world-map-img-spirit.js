import { SPIRIT } from "../data/world-map-data-layers.js";
import { SPIRIT_COLORS } from "./world-map-draw.config.js";

export const SPIRIT_CONTROL_IMAGES = Object.freeze(Object.entries(SPIRIT).map(([key, value]) => Object.freeze({ value, image: `../img/map/control_spirit_${key.toLowerCase()}.webp` })));

export function getSpiritColor(value) {
  if (!Object.values(SPIRIT).includes(value)) {
    throw new TypeError("Spirit color lookup requires a spirit metadata value.");
  }
  return SPIRIT_COLORS.get(value) || null;
}

export function drawSpiritCue(ctx, left, top, width, height, color, lineWidth = 1) {
  if (!ctx || ![left, top, width, height, lineWidth].every(Number.isFinite) || width <= 0 || height <= 0 || lineWidth <= 0 || typeof color !== "string") {
    throw new TypeError("Spirit cue drawing needs a canvas context, dimensions, and color.");
  }
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(left + width / 2, top + Math.max(0.75, Math.min(width, height) * 0.2));
  ctx.lineTo(left + width / 2, top + height - Math.max(0.75, Math.min(width, height) * 0.2));
  ctx.stroke();
  ctx.restore();
}
