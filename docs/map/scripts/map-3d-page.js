/**
 * Entry module for the 3D world map page (docs/map/world_map_3d.html).
 * It starts the Babylon.js engine and the render loop.
 */
import { describeMapModel, loadMapModel } from "./map-data.js";
import { createMapScene } from "./map-3d-scene.js";
import { DEFAULT_CHUNK_CELLS, createTerrainChunks } from "./terrain-chunks.js";
import { loadSurfacePalette, terrainVertexColors } from "./terrain-colors.js";
import { HeightField } from "./terrain-height.js";

const canvas = document.getElementById("map3dCanvas");
const status = document.getElementById("map3dStatus");

/**
 * Reads the map size from the data attributes of the canvas.
 * @param {HTMLCanvasElement} element Map canvas.
 * @returns {{columns: number, rows: number}} Map size in cells.
 */
function readMapSize(element) {
  return { columns: Number(element.dataset.mapColumns), rows: Number(element.dataset.mapRows) };
}

/**
 * Reads the page options from the URL, for example "?chunk=16".
 * @returns {{chunkCells: number}} Page options.
 */
function readOptions() {
  const parameters = new URLSearchParams(window.location.search);
  const chunkCells = Number(parameters.get("chunk") ?? DEFAULT_CHUNK_CELLS);
  return { chunkCells: Number.isInteger(chunkCells) && chunkCells > 0 ? chunkCells : DEFAULT_CHUNK_CELLS };
}

/**
 * Builds the terrain chunks with the temporary vertex colors.
 * @param {BABYLON.Scene} scene Scene.
 * @param {import("./map-data.js").MapModel} model Map model.
 * @param {{chunkCells: number}} options Page options.
 * @returns {Promise<{field: HeightField, chunks: BABYLON.Mesh[]}>} Terrain objects.
 */
async function buildTerrain(scene, model, options) {
  const field = new HeightField(model);
  const colors = terrainVertexColors(field, await loadSurfacePalette());
  const material = new BABYLON.StandardMaterial("terrainVertexColors", scene);
  material.specularColor = BABYLON.Color3.Black();
  const chunks = createTerrainChunks(scene, field, { chunkCells: options.chunkCells, material, colors });
  return { field, chunks };
}

/**
 * Starts the engine, creates the scene, loads the map, and starts the render loop.
 * @returns {Promise<void>}
 */
async function start() {
  if (typeof BABYLON === "undefined") {
    status.textContent = "Babylon.js did not load. Check the network connection.";
    return;
  }

  const size = readMapSize(canvas);
  const options = readOptions();
  const engine = new BABYLON.Engine(canvas, true, { stencil: true }, true);
  const { scene } = createMapScene(engine, size);

  engine.runRenderLoop(() => scene.render());
  new ResizeObserver(() => engine.resize()).observe(canvas);

  status.textContent = "Loading the map data…";
  const model = await loadMapModel(canvas.dataset.mapData, size);
  status.textContent = "Building the terrain…";
  const { chunks } = await buildTerrain(scene, model, options);
  status.textContent = `${describeMapModel(model)}\nTerrain: ${chunks.length} chunks of ${options.chunkCells} × ${options.chunkCells} cells.`;
  console.info(status.textContent);
}

start().catch((error) => {
  status.textContent = `The 3D map could not start: ${error.message}`;
  console.error(error);
});
