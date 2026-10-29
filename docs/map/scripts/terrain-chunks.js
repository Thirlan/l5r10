/**
 * Chunk meshes of the continuous terrain surface.
 * Each chunk copies a rectangle of the global height lattice, with the edge rows duplicated in both chunks.
 * Positions and normals come from the global lattice, so adjacent chunks match at the seam.
 */
import { HeightField } from "./terrain-height.js";

export const DEFAULT_CHUNK_CELLS = 32;

/**
 * Splits the map into chunk rectangles.
 * @param {number} columns Map columns.
 * @param {number} rows Map rows.
 * @param {number} chunkCells Cells along each chunk edge.
 * @returns {Array<{column: number, row: number, startX: number, endX: number, startY: number, endY: number}>} Chunk cell ranges (end is exclusive).
 */
export function chunkRanges(columns, rows, chunkCells) {
  // Validation
  if (![columns, rows, chunkCells].every((value) => Number.isInteger(value) && value > 0)) throw new TypeError("chunkRanges needs positive integer sizes.");

  // Computation
  const columnCount = Math.ceil(columns / chunkCells);
  const rowCount = Math.ceil(rows / chunkCells);
  return Array.from({ length: columnCount * rowCount }, (_, index) => {
    const column = index % columnCount;
    const row = Math.floor(index / columnCount);
    return Object.freeze({ column, row, startX: column * chunkCells, endX: Math.min(columns, (column + 1) * chunkCells), startY: row * chunkCells, endY: Math.min(rows, (row + 1) * chunkCells) });
  });
}

/**
 * Copies the vertex data of one chunk from the global lattice.
 * @param {HeightField} field Global height lattice.
 * @param {{startX: number, endX: number, startY: number, endY: number}} range Chunk cell range.
 * @param {Float32Array} [colors] Optional global RGBA colors, four for each lattice point.
 * @returns {{positions: Float32Array, normals: Float32Array, indices: Uint32Array, colors: Float32Array|null}} Vertex data.
 */
export function chunkVertexData(field, range, colors) {
  // Validation
  if (!(field instanceof HeightField)) throw new TypeError("chunkVertexData needs a HeightField.");

  // Computation
  const scale = field.subdivisions;
  const columns = (range.endX - range.startX) * scale + 1;
  const rows = (range.endY - range.startY) * scale + 1;
  const positions = new Float32Array(columns * rows * 3);
  const normals = new Float32Array(columns * rows * 3);
  const chunkColors = colors ? new Float32Array(columns * rows * 4) : null;
  Array.from({ length: columns * rows }).forEach((_, vertex) => {
    const latticeColumn = range.startX * scale + (vertex % columns);
    const latticeRow = range.startY * scale + Math.floor(vertex / columns);
    const source = latticeRow * field.width + latticeColumn;
    positions.set([latticeColumn / scale, field.heights[source], field.model.rows - latticeRow / scale], vertex * 3);
    normals.set(field.normals.subarray(source * 3, source * 3 + 3), vertex * 3);
    if (chunkColors) chunkColors.set(colors.subarray(source * 4, source * 4 + 4), vertex * 4);
  });
  const indices = new Uint32Array((columns - 1) * (rows - 1) * 6);
  Array.from({ length: (columns - 1) * (rows - 1) }).forEach((_, quad) => {
    const topLeft = Math.floor(quad / (columns - 1)) * columns + (quad % (columns - 1));
    const bottomLeft = topLeft + columns;
    indices.set([bottomLeft + 1, topLeft + 1, topLeft, bottomLeft, bottomLeft + 1, topLeft], quad * 6);
  });
  return { positions, normals, indices, colors: chunkColors };
}

/**
 * Creates one mesh for each chunk. All chunks share one material.
 * @param {BABYLON.Scene} scene Scene.
 * @param {HeightField} field Global height lattice.
 * @param {{chunkCells: number, material: BABYLON.Material, colors?: Float32Array}} options Chunk options.
 * @returns {BABYLON.Mesh[]} Chunk meshes. Each mesh has metadata.chunk with its cell range.
 */
export function createTerrainChunks(scene, field, options) {
  // Validation
  if (!scene || !options || !options.material) throw new TypeError("createTerrainChunks needs a scene and a material.");

  // Computation
  return chunkRanges(field.model.columns, field.model.rows, options.chunkCells).map((range) => {
    const data = chunkVertexData(field, range, options.colors);
    const mesh = new BABYLON.Mesh(`terrainChunk_${range.column}_${range.row}`, scene);
    const vertexData = new BABYLON.VertexData();
    vertexData.positions = data.positions;
    vertexData.normals = data.normals;
    vertexData.indices = data.indices;
    if (data.colors) vertexData.colors = data.colors;
    vertexData.applyToMesh(mesh, true);
    mesh.material = options.material;
    mesh.metadata = { chunk: range };
    mesh.freezeWorldMatrix();
    return mesh;
  });
}
