import { SPIRIT } from "./world-map-layers.js";

const colors = new Map([
  [SPIRIT.VERY_LOW, "rgba(255, 255, 0, 0.45)"],
  [SPIRIT.LOW, "rgba(255, 255, 0, 0.55)"],
  [SPIRIT.MEDIUM, "rgba(255, 165, 0, 0.55)"],
  [SPIRIT.HIGH, "rgba(255, 0, 0, 0.65)"],
  [SPIRIT.VERY_HIGH, "rgba(128, 0, 128, 0.75)"],
]);

export const SPIRIT_CONTROL_IMAGES = Object.freeze({});

export function getSpiritColor(value) {
  if (!Object.values(SPIRIT).includes(value)) {
    throw new TypeError("Spirit color lookup requires a spirit metadata value.");
  }
  return colors.get(value) || null;
}

export function drawSpiritCue(ctx, left, top, width, height, color, lineWidth = 1) {
  if (!ctx || ![left, top, width, height, lineWidth].every(Number.isFinite)
    || width <= 0 || height <= 0 || lineWidth <= 0 || typeof color !== "string") {
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
