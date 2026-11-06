/**
 * The global height sampler of the 3D world map.
 *
 * The terrain is one lattice of height samples for the full map, with SUBDIVISIONS samples for each cell edge.
 * Every chunk mesh copies its part of this lattice, so adjacent chunks get equal positions and normals.
 *
 * Height model:
 * - Saved elevation supplies height in metres. One world unit is five miles (8046.72 m).
 * - Each cell has a sign and an absolute base height.
 * - The sampler blends the values of the four nearest cell centers with smoothstep weights.
 *   Height = sign × level, so the shoreline (height 0) is on the cell edge between land and water.
 * - Elevation drops of at least 75 m use one lattice step on the low side. Water-to-water changes stay smooth.
 * - Water at the default elevation uses a 1 m display bed below sea level.
 * - Seeded relief adds rounded hills up to 600 m and mountain ridges up to 8000 m.
 * - Relief fades to zero at terrain-type boundaries, keeping coasts and adjoining regions connected.
 * - River channels are carved to RIVER_BED, below the water plane at height 0.
 * - A seal pass then walks along each river segment. Where the surface is not below RIVER_SEAL, it lowers the
 *   four corners of that lattice quad to RIVER_BED. Steep terrain can otherwise lift a channel above the water.
 */
import { TERRAIN, NEIGHBOR_OFFSETS } from "../../scripts/world/world-map-layers.js";
import { MapModel, isWaterTerrain } from "./map-data.js";
import { buildRiverSegments } from "./river-paths.js";
import { DEFAULT_ELEVATION, getCliffDifference } from "../../scripts/world/world-map-elevation.js";
import { METERS_PER_TILE } from "../../scripts/world/world-map-scale.js";

export const SUBDIVISIONS = 4;
export const RIVER_BED = -0.12 / METERS_PER_TILE;
export const RIVER_INNER_WIDTH = 0.12;
export const RIVER_OUTER_WIDTH = 0.36;
/** Highest surface height that the seal pass accepts on a river segment. */
export const RIVER_SEAL = -0.04 / METERS_PER_TILE;
const SEAL_SAMPLES_PER_STEP = 4;
const NOISE_OCTAVES = Object.freeze([
  [0.45, 0.55],
  [0.9, 0.3],
  [1.8, 0.15],
]);

const TERRAIN_SHAPES = new Map([
  [TERRAIN.FLAT.id, { roughness: 0.1 }],
  [TERRAIN.HILLS.id, { roughness: 600 }],
  [TERRAIN.MOUNTAINS.id, { roughness: 8000 }],
  [TERRAIN.WATER.id, { roughness: 0 }],
  [TERRAIN.COASTAL_WATER.id, { roughness: 0 }],
  [TERRAIN.OCEAN.id, { roughness: 0 }],
  [TERRAIN.WETLANDS.id, { roughness: 0.02 }],
]);

/**
 * @param {number} terrainId Saved terrain ID.
 * @returns {{roughness: number}} Maximum added relief in metres.
 */
export function terrainShape(terrainId) {
  const shape = TERRAIN_SHAPES.get(terrainId);
  if (!shape) throw new TypeError(`No terrain shape for terrain ID ${terrainId}.`);
  return shape;
}

const smoothstep = (edge0, edge1, value) => {
  const ratio = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return ratio * ratio * (3 - 2 * ratio);
};
const lerp = (start, end, ratio) => start + (end - start) * ratio;

function hash(column, row, seed) {
  const mixed = Math.imul(column, 374761393) + Math.imul(row, 668265263) + Math.imul(seed, 1442695041) + Math.imul(Math.floor(seed / 4294967296), 1013904223);
  const scrambled = Math.imul(mixed ^ (mixed >>> 13), 1274126177);
  return ((scrambled ^ (scrambled >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(u, v, seed) {
  const column = Math.floor(u);
  const row = Math.floor(v);
  const blendX = smoothstep(0, 1, u - column);
  const blendY = smoothstep(0, 1, v - row);
  const top = lerp(hash(column, row, seed), hash(column + 1, row, seed), blendX);
  const bottom = lerp(hash(column, row + 1, seed), hash(column + 1, row + 1, seed), blendX);
  return lerp(top, bottom, blendY);
}

/**
 * Deterministic ridged noise in the range 0 to 1.
 * @param {number} u Position east, in cell units.
 * @param {number} v Position south, in cell units.
 * @param {number} [seed=0] Map seed.
 * @returns {number} Noise value.
 */
export function ridgedNoise(u, v, seed = 0) {
  if (![u, v].every(Number.isFinite) || !Number.isSafeInteger(seed)) throw new TypeError("Terrain noise needs finite coordinates and an integer seed.");
  const total = NOISE_OCTAVES.reduce((sum, [frequency, amplitude], octave) => sum + amplitude * (1 - Math.abs(2 * valueNoise(u * frequency + octave * 17.3, v * frequency - octave * 9.1, seed) - 1)), 0);
  return total / NOISE_OCTAVES.reduce((sum, [, amplitude]) => sum + amplitude, 0);
}

/** One height lattice for the full map, with normals from central differences. */
export class HeightField {
  /**
   * @param {MapModel} model Map model.
   * @param {{subdivisions?: number, carveRivers?: boolean}} [options] Lattice options.
   */
  constructor(model, options = {}) {
    // Validation
    if (!(model instanceof MapModel)) throw new TypeError("HeightField needs a MapModel.");
    if (!Number.isSafeInteger(model.header.seed)) throw new TypeError("Terrain height needs an integer map seed.");
    const { subdivisions = SUBDIVISIONS, carveRivers = true } = options;
    if (!Number.isInteger(subdivisions) || subdivisions < 1) throw new TypeError("Subdivisions must be a positive integer.");

    // Computation
    this.model = model;
    this.subdivisions = subdivisions;
    this.width = model.columns * subdivisions + 1;
    this.depth = model.rows * subdivisions + 1;
    this.cells = this.#cellValues();
    this.heights = Float32Array.from({ length: this.width * this.depth }, (_, index) => this.#baseHeight(index % this.width, Math.floor(index / this.width)));
    this.riverSegments = carveRivers ? buildRiverSegments(model) : [];
    this.riverSegments.forEach((segment) => this.#carveSegment(segment));
    this.riverSegments.forEach((segment) => this.#sealSegment(segment));
    this.normals = this.#normals();
  }

  /**
   * @param {number} column Lattice column, from 0 to width - 1.
   * @param {number} row Lattice row, from 0 to depth - 1 (row 0 is the north edge).
   * @returns {number} Height of the lattice point.
   */
  heightAt(column, row) {
    const clampedColumn = Math.min(this.width - 1, Math.max(0, column));
    const clampedRow = Math.min(this.depth - 1, Math.max(0, row));
    return this.heights[clampedRow * this.width + clampedColumn];
  }

  /**
   * Samples the triangulated surface. The result is on the mesh, not only near it.
   * @param {number} u Position east, in cell units.
   * @param {number} v Position south, in cell units.
   * @returns {number} Surface height.
   */
  sample(u, v) {
    const latticeU = Math.min(this.width - 1.000001, Math.max(0, u * this.subdivisions));
    const latticeV = Math.min(this.depth - 1.000001, Math.max(0, v * this.subdivisions));
    const column = Math.floor(latticeU);
    const row = Math.floor(latticeV);
    const ratioX = latticeU - column;
    const ratioY = latticeV - row;
    const corner = this.heightAt(column, row);
    const diagonal = this.heightAt(column + 1, row + 1);
    if (ratioX >= ratioY) return corner + ratioX * (this.heightAt(column + 1, row) - corner) + ratioY * (diagonal - this.heightAt(column + 1, row));
    return corner + ratioY * (this.heightAt(column, row + 1) - corner) + ratioX * (diagonal - this.heightAt(column, row + 1));
  }

  #cellValues() {
    const terrain = this.model.ids("terrain");
    const saved = Array.from(terrain, (id, index) => ({ terrain: id, elevation: this.model.elevations[index] }));
    const heights = saved.map(({ terrain, elevation }) => (isWaterTerrain(terrain) && elevation === DEFAULT_ELEVATION ? -1 : elevation) / METERS_PER_TILE);
    return {
      saved,
      sign: Float32Array.from(heights, (height) => Math.sign(height)),
      level: Float32Array.from(heights, (height) => Math.abs(height)),
    };
  }

  #cellIndex(x, y) {
    const column = Math.min(this.model.columns - 1, Math.max(0, x));
    const row = Math.min(this.model.rows - 1, Math.max(0, y));
    return row * this.model.columns + column;
  }

  /**
   * Blend weight across two cells. An elevation cliff puts the drop into one lattice step on the low side.
   * @param {number} ratio Position from the first cell center (0) to the second cell center (1).
   * @param {number} first Index of the first cell (west or north).
   * @param {number} second Index of the second cell (east or south).
   * @returns {number} Weight of the second cell.
   */
  #edgeWeight(ratio, first, second) {
    if (getCliffDifference(this.cells.saved[first], this.cells.saved[second])) {
      const step = 1 / this.subdivisions;
      return this.cells.saved[first].elevation > this.cells.saved[second].elevation ? smoothstep(0.5, 0.5 + step, ratio) : smoothstep(0.5 - step, 0.5, ratio);
    }
    return smoothstep(0, 1, ratio);
  }

  #baseHeight(column, row) {
    const centerX = column / this.subdivisions - 0.5;
    const centerY = row / this.subdivisions - 0.5;
    const x = Math.floor(centerX);
    const y = Math.floor(centerY);
    const [topLeft, topRight, bottomLeft, bottomRight] = [this.#cellIndex(x, y), this.#cellIndex(x + 1, y), this.#cellIndex(x, y + 1), this.#cellIndex(x + 1, y + 1)];
    const weightTop = this.#edgeWeight(centerX - x, topLeft, topRight);
    const weightBottom = this.#edgeWeight(centerX - x, bottomLeft, bottomRight);
    const hasCliff = (first, second) => getCliffDifference(this.cells.saved[first], this.cells.saved[second]) > 0;
    const weightY = hasCliff(topLeft, bottomLeft) || !hasCliff(topRight, bottomRight) ? this.#edgeWeight(centerY - y, topLeft, bottomLeft) : this.#edgeWeight(centerY - y, topRight, bottomRight);
    const blend = (values) => lerp(lerp(values[topLeft], values[topRight], weightTop), lerp(values[bottomLeft], values[bottomRight], weightBottom), weightY);
    const sign = blend(this.cells.sign);
    return sign * blend(this.cells.level) + this.#relief(column / this.subdivisions, row / this.subdivisions, sign);
  }

  #relief(u, v, sign) {
    const column = Math.min(this.model.columns - 1, Math.floor(u));
    const row = Math.min(this.model.rows - 1, Math.floor(v));
    const terrain = this.cells.saved[this.#cellIndex(column, row)].terrain;
    if (isWaterTerrain(terrain)) return 0;
    const { seed } = this.model.header;
    const maximum = terrainShape(terrain).roughness;
    let envelope = 1;
    NEIGHBOR_OFFSETS.forEach(([dx, dy]) => {
      const x = column + dx;
      const y = row + dy;
      if (x < 0 || y < 0 || x >= this.model.columns || y >= this.model.rows || this.cells.saved[this.#cellIndex(x, y)].terrain === terrain) return;
      const distance = Math.hypot(Math.max(x - u, 0, u - x - 1), Math.max(y - v, 0, v - y - 1));
      envelope = Math.min(envelope, smoothstep(0, 0.5, distance));
    });
    const warpedU = u + 1.2 * (valueNoise(u * 0.22 + 17, v * 0.22 + 8, seed) - 0.5);
    const warpedV = v + 1.2 * (valueNoise(u * 0.22 - 9, v * 0.22 + 31, seed) - 0.5);
    const noise = terrain === TERRAIN.HILLS.id ? smoothstep(0.1, 0.9, 0.7 * valueNoise(warpedU * 0.7, warpedV * 0.7, seed) + 0.3 * valueNoise(warpedU * 1.4 + 23, warpedV * 1.4 - 11, seed)) : ridgedNoise(warpedU, warpedV, seed) ** 1.5;
    const aboveBase = terrain === TERRAIN.HILLS.id || terrain === TERRAIN.MOUNTAINS.id ? 1 : Math.max(0, sign);
    return (maximum * noise * envelope * aboveBase) / METERS_PER_TILE;
  }

  #carveSegment([startX, startY, endX, endY]) {
    const scale = this.subdivisions;
    const columns = { from: Math.max(0, Math.floor((Math.min(startX, endX) - RIVER_OUTER_WIDTH) * scale)), to: Math.min(this.width - 1, Math.ceil((Math.max(startX, endX) + RIVER_OUTER_WIDTH) * scale)) };
    const rows = { from: Math.max(0, Math.floor((Math.min(startY, endY) - RIVER_OUTER_WIDTH) * scale)), to: Math.min(this.depth - 1, Math.ceil((Math.max(startY, endY) + RIVER_OUTER_WIDTH) * scale)) };
    const lengthSquared = (endX - startX) ** 2 + (endY - startY) ** 2;
    const range = (from, to) => Array.from({ length: to - from + 1 }, (_, offset) => from + offset);
    range(rows.from, rows.to).forEach((row) =>
      range(columns.from, columns.to).forEach((column) => {
        const u = column / scale;
        const v = row / scale;
        const along = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, ((u - startX) * (endX - startX) + (v - startY) * (endY - startY)) / lengthSquared));
        const distance = Math.hypot(u - (startX + along * (endX - startX)), v - (startY + along * (endY - startY)));
        const index = row * this.width + column;
        const height = this.heights[index];
        this.heights[index] = Math.min(height, lerp(RIVER_BED, height, smoothstep(RIVER_INNER_WIDTH, RIVER_OUTER_WIDTH, distance)));
      }),
    );
  }

  #sealSegment([startX, startY, endX, endY]) {
    const steps = Math.ceil(Math.hypot(endX - startX, endY - startY) * this.subdivisions * SEAL_SAMPLES_PER_STEP);
    Array.from({ length: steps + 1 }, (_, step) => step / Math.max(1, steps)).forEach((ratio) => {
      const u = lerp(startX, endX, ratio);
      const v = lerp(startY, endY, ratio);
      if (this.sample(u, v) <= RIVER_SEAL) return;
      const column = Math.min(this.width - 2, Math.floor(u * this.subdivisions));
      const row = Math.min(this.depth - 2, Math.floor(v * this.subdivisions));
      [0, 1, this.width, this.width + 1].forEach((offset) => {
        const index = row * this.width + column + offset;
        this.heights[index] = Math.min(this.heights[index], RIVER_BED);
      });
    });
  }

  #normals() {
    const spacing = 1 / this.subdivisions;
    const normals = new Float32Array(this.width * this.depth * 3);
    this.heights.forEach((_, index) => {
      const column = index % this.width;
      const row = Math.floor(index / this.width);
      const slopeEast = (this.heightAt(column + 1, row) - this.heightAt(column - 1, row)) / (spacing * (Math.min(column + 1, this.width - 1) - Math.max(column - 1, 0)));
      const slopeSouth = (this.heightAt(column, row + 1) - this.heightAt(column, row - 1)) / (spacing * (Math.min(row + 1, this.depth - 1) - Math.max(row - 1, 0)));
      const length = Math.hypot(slopeEast, 1, slopeSouth);
      normals.set([-slopeEast / length, 1 / length, slopeSouth / length], index * 3);
    });
    return normals;
  }
}
