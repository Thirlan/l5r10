import { RESOURCE_LEVEL } from "./world-map-layers.js";

const colors = new Map([
  [RESOURCE_LEVEL.VERY_LOW, "rgba(128, 0, 128, 0.75)"],
  [RESOURCE_LEVEL.LOW, "rgba(255, 0, 0, 0.65)"],
  [RESOURCE_LEVEL.MEDIUM, "rgba(255, 165, 0, 0.55)"],
  [RESOURCE_LEVEL.HIGH, "rgba(255, 255, 0, 0.55)"],
  [RESOURCE_LEVEL.VERY_HIGH, "rgba(255, 255, 0, 0.45)"],
]);

export const RESOURCE_LEVEL_CONTROL_IMAGES = Object.freeze({});

/**
 * @param {import("./world-map-layers.js").LevelValue} value Resource level metadata.
 * @returns {string|null} Overlay color, or null for None.
 */
export function getResourceLevelColor(value) {
  if (!Object.values(RESOURCE_LEVEL).includes(value)) {
    throw new TypeError("Resource level color lookup requires a resource level metadata value.");
  }
  return colors.get(value) || null;
}

/**
 * @param {CanvasRenderingContext2D} ctx Canvas context.
 * @param {number} left Left coordinate.
 * @param {number} top Top coordinate.
 * @param {number} width Band width.
 * @param {number} height Band height.
 * @param {string} color Cue color from the renderer contrast calculation.
 * @param {number} [lineWidth=1] Stroke width.
 * @returns {void}
 */
export function drawResourceLevelCue(ctx, left, top, width, height, color, lineWidth = 1) {
  if (!ctx || ![left, top, width, height, lineWidth].every(Number.isFinite)
    || width <= 0 || height <= 0 || lineWidth <= 0 || typeof color !== "string") {
    throw new TypeError("Resource level cue drawing needs a canvas context, dimensions, and color.");
  }
  const inset = Math.max(0.75, Math.min(width, height) * 0.2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(left + width / 2, top + inset);
  ctx.lineTo(left + width / 2, top + height - inset);
  ctx.moveTo(left + inset, top + height / 2);
  ctx.lineTo(left + width - inset, top + height / 2);
  ctx.stroke();
  ctx.restore();
}
