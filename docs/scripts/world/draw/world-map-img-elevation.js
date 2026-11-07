import { DEFAULT_ELEVATION } from "../data/world-map-data.config.js";
import { LABEL_CHARACTER_WIDTH } from "./world-map-draw.const.js";
import { ELEVATION_COLOR_STOPS } from "./world-map-draw.config.js";

/**
 * @param {number} elevation Elevation in whole metres.
 * @returns {string|null} Gradient color, or no color for the default elevation.
 */
export function getElevationColor(elevation) {
  if (!Number.isSafeInteger(elevation)) throw new TypeError("Elevation color needs a safe integer in metres.");
  if (elevation === DEFAULT_ELEVATION) return null;
  const height = Math.min(1000, Math.max(-4000, elevation));
  const upper = ELEVATION_COLOR_STOPS.findIndex(([stop]) => stop >= height);
  const [end, endColor] = ELEVATION_COLOR_STOPS[upper];
  const [start, startColor] = ELEVATION_COLOR_STOPS[Math.max(0, upper - 1)];
  const ratio = end === start ? 0 : (height - start) / (end - start);
  return `rgb(${startColor.map((channel, index) => Math.round(channel + (endColor[index] - channel) * ratio)).join(", ")})`;
}

/**
 * @param {CanvasRenderingContext2D} ctx Drawing context.
 * @param {number} left Band left edge.
 * @param {number} top Band top edge.
 * @param {number} width Band width.
 * @param {number} height Band height.
 * @param {string} color Contrast color.
 * @param {number} elevation Elevation in whole metres.
 * @returns {void}
 */
export function drawElevationCue(ctx, left, top, width, height, color, elevation) {
  if (!ctx || ![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0 || typeof color !== "string" || !Number.isSafeInteger(elevation)) {
    throw new TypeError("Elevation label needs a canvas context, dimensions, color, and integer elevation.");
  }
  const text = String(elevation);
  // Size the font instead of using maxWidth to avoid canvas text corruption on large maps.
  const fontSize = Math.min(height * 0.65, (width * 0.9) / (text.length * LABEL_CHARACTER_WIDTH));
  ctx.save();
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = fontSize * 0.12;
  ctx.strokeStyle = color.includes("255") ? "#111111" : "#ffffff";
  ctx.fillStyle = color;
  const label = [text, left + width / 2, top + height / 2];
  ctx.strokeText(...label);
  ctx.fillText(...label);
  ctx.restore();
}
