/**
 * Camera limits of the 3D world map. They keep the orbit camera above the ground and near the map.
 */

/**
 * Orbit camera limits.
 * - minRadius: the nearest zoom, in cells.
 * - maxRadiusRatio: the farthest zoom, as a ratio of the radius that fits the full map.
 * - minBeta and maxBeta: the orbit angle from the vertical axis. maxBeta keeps the camera above the horizon.
 */
export const CAMERA_LIMITS = Object.freeze({ minRadius: 2, maxRadiusRatio: 1.5, minBeta: 0.05, maxBeta: 1.35 });

/**
 * Keeps an orbit target inside the map area on the ground plane.
 * @param {{x: number, y: number, z: number}} target Orbit target in world units.
 * @param {{columns: number, rows: number}} size Map size in cells.
 * @returns {{x: number, y: number, z: number}} Target with x from 0 to columns and z from 0 to rows.
 */
export function clampTarget(target, size) {
  // Validation
  if (![target?.x, target?.y, target?.z].every(Number.isFinite)) throw new TypeError("clampTarget needs a target with finite x, y, and z.");

  // Computation
  const clamp = (value, maximum) => Math.min(maximum, Math.max(0, value));
  return { x: clamp(target.x, size.columns), y: target.y, z: clamp(target.z, size.rows) };
}
