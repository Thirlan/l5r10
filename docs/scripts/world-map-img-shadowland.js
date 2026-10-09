import { SHADOWLAND } from "./world-map-layers.js";

const colors = new Map([
  [SHADOWLAND.VERY_LOW, "rgba(255, 255, 0, 0.45)"],
  [SHADOWLAND.LOW, "rgba(255, 255, 0, 0.55)"],
  [SHADOWLAND.MEDIUM, "rgba(255, 165, 0, 0.55)"],
  [SHADOWLAND.HIGH, "rgba(255, 0, 0, 0.65)"],
  [SHADOWLAND.VERY_HIGH, "rgba(128, 0, 128, 0.75)"],
]);

export const SHADOWLAND_CONTROL_IMAGES = Object.freeze({});

export function getShadowlandColor(value) {
  if (!Object.values(SHADOWLAND).includes(value)) {
    throw new TypeError("Shadowland color lookup requires a shadowland metadata value.");
  }
  return colors.get(value) || null;
}

export function drawShadowlandCue(ctx, left, top, width, height, color, lineWidth = 1) {
  if (!ctx || ![left, top, width, height, lineWidth].every(Number.isFinite)
    || width <= 0 || height <= 0 || lineWidth <= 0 || typeof color !== "string") {
    throw new TypeError("Shadowland cue drawing needs a canvas context, dimensions, and color.");
  }
  const inset = Math.max(0.75, Math.min(width, height) * 0.2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(left + inset, top + inset);
  ctx.lineTo(left + width - inset, top + height - inset);
  ctx.stroke();
  ctx.restore();
}
