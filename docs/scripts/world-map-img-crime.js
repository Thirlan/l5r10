import { CRIME } from "./world-map-layers.js";

const colors = new Map([
  [CRIME.VERY_LOW, "rgba(255, 255, 0, 0.45)"],
  [CRIME.LOW, "rgba(255, 255, 0, 0.55)"],
  [CRIME.MEDIUM, "rgba(255, 165, 0, 0.55)"],
  [CRIME.HIGH, "rgba(255, 0, 0, 0.65)"],
  [CRIME.VERY_HIGH, "rgba(128, 0, 128, 0.75)"],
]);

export const CRIME_CONTROL_IMAGES = Object.freeze({});

export function getCrimeColor(value) {
  if (!Object.values(CRIME).includes(value)) {
    throw new TypeError("Crime color lookup requires a crime metadata value.");
  }
  return colors.get(value) || null;
}

export function drawCrimeCue(ctx, left, top, width, height, color, lineWidth = 1) {
  if (!ctx || ![left, top, width, height, lineWidth].every(Number.isFinite)
    || width <= 0 || height <= 0 || lineWidth <= 0 || typeof color !== "string") {
    throw new TypeError("Crime cue drawing needs a canvas context, dimensions, and color.");
  }
  const inset = Math.max(0.75, Math.min(width, height) * 0.2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(left + inset, top + height / 2);
  ctx.lineTo(left + width - inset, top + height / 2);
  ctx.stroke();
  ctx.restore();
}
