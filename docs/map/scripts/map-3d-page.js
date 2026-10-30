/**
 * Entry module for the 3D world map page (docs/map/world_map_3d.html).
 * It starts the Babylon.js engine and the render loop.
 */
import { bindCellInspector } from "./cell-inspector.js";
import { createClanLayer } from "./clan-regions.js";
import { bindFrameStats } from "./frame-stats.js";
import { createLabelLayer } from "./label-meshes.js";
import { bindLanguageToggle, bindLayerToggles } from "./layer-toggles.js";
import { describeMapModel, loadMapModel } from "./map-data.js";
import { createMarkerMeshes } from "./marker-meshes.js";
import { createMapScene, frameMap } from "./map-3d-scene.js";
import { createPortMeshes } from "./port-meshes.js";
import { createRoadMeshes } from "./road-meshes.js";
import { DEFAULT_CHUNK_CELLS, createTerrainChunks } from "./terrain-chunks.js";
import { loadSurfacePalette, terrainVertexColors } from "./terrain-colors.js";
import { HeightField } from "./terrain-height.js";
import { createTerrainMaterial, supportsTerrainShader } from "./terrain-material.js";
import { TEXTURE_SETS } from "./surface-layers.js";
import { createTreeMeshes } from "./tree-meshes.js";
import { DEFAULT_TEXTURE_SIZE, TEXTURE_SIZES, loadTextureArrays } from "./texture-arrays.js";
import { createWaterSurface } from "./water-surface.js";

const canvas = document.getElementById("map3dCanvas");
const status = document.getElementById("map3dStatus");
const layerPanel = document.getElementById("map3dLayers");
const resetButton = document.getElementById("map3dReset");
const inspector = document.getElementById("map3dInspector");
const statsOverlay = document.getElementById("map3dStats");

/**
 * Reads the map size from the data attributes of the canvas.
 * @param {HTMLCanvasElement} element Map canvas.
 * @returns {{columns: number, rows: number}} Map size in cells.
 */
function readMapSize(element) {
  return { columns: Number(element.dataset.mapColumns), rows: Number(element.dataset.mapRows) };
}

/**
 * Reads the page options from the URL, for example "?chunk=16&textureSize=1024&water=simple&stats=1".
 * @returns {{chunkCells: number, textureSize: number, simpleWater: boolean, stats: boolean}} Page options.
 */
function readOptions() {
  const parameters = new URLSearchParams(window.location.search);
  const chunkCells = Number(parameters.get("chunk") ?? DEFAULT_CHUNK_CELLS);
  const textureSize = Number(parameters.get("textureSize") ?? DEFAULT_TEXTURE_SIZE);
  return {
    chunkCells: Number.isInteger(chunkCells) && chunkCells > 0 ? chunkCells : DEFAULT_CHUNK_CELLS,
    textureSize: TEXTURE_SIZES.includes(textureSize) ? textureSize : DEFAULT_TEXTURE_SIZE,
    simpleWater: parameters.get("water") === "simple",
    stats: parameters.get("stats") === "1",
  };
}

/**
 * Builds the terrain chunks with the temporary vertex colors.
 * @param {BABYLON.Scene} scene Scene.
 * @param {import("./map-data.js").MapModel} model Map model.
 * @param {{chunkCells: number}} options Page options.
 * @returns {Promise<{field: HeightField, chunks: BABYLON.Mesh[], palette: object}>} Terrain objects.
 */
async function buildTerrain(scene, model, options) {
  const field = new HeightField(model);
  const palette = await loadSurfacePalette();
  const colors = terrainVertexColors(field, palette);
  const material = new BABYLON.StandardMaterial("terrainVertexColors", scene);
  material.specularColor = BABYLON.Color3.Black();
  const chunks = createTerrainChunks(scene, field, { chunkCells: options.chunkCells, material, colors });
  return { field, chunks, palette };
}

/**
 * Loads the PBR texture arrays and puts the terrain material on all chunks.
 * The vertex colors stay until the textures are ready, or when the engine has no WebGL2.
 * @param {BABYLON.Scene} scene Scene.
 * @param {import("./map-data.js").MapModel} model Map model.
 * @param {{chunks: BABYLON.Mesh[], palette: object}} terrain Terrain objects from buildTerrain.
 * @param {{textureSize: number}} options Page options.
 * @param {(text: string) => void} report Writes one status line.
 * @returns {Promise<BABYLON.ShaderMaterial|null>} Terrain material, or null when the engine has no WebGL2.
 */
async function applyTextures(scene, model, terrain, options, report) {
  if (!supportsTerrainShader(scene.getEngine())) {
    report("Textures: WebGL2 is not available, so the terrain uses flat colors.");
    return null;
  }
  const started = performance.now();
  const arrays = await loadTextureArrays(scene, TEXTURE_SETS, {
    size: options.textureSize,
    onProgress: (done, total) => report(`Textures: ${done} of ${total} sets decoded…`),
  });
  const material = createTerrainMaterial(scene, model, arrays, terrain.palette);
  terrain.chunks.forEach((chunk) => (chunk.material = material));
  report(`Textures: ${TEXTURE_SETS.length} sets at ${options.textureSize} px in ${Math.round(performance.now() - started)} ms.`);
  return material;
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
  const { scene, camera } = createMapScene(engine, size);
  resetButton.addEventListener("click", () => frameMap(camera, size));

  engine.runRenderLoop(() => scene.render());
  new ResizeObserver(() => engine.resize()).observe(canvas);
  if (options.stats) bindFrameStats(scene, statsOverlay);

  status.textContent = "Loading the map data…";
  const model = await loadMapModel(canvas.dataset.mapData, size);
  status.textContent = "Building the terrain…";
  const terrain = await buildTerrain(scene, model, options);
  const roads = createRoadMeshes(scene, terrain.field, options);
  const trees = createTreeMeshes(scene, terrain.field, options);
  const ports = createPortMeshes(scene, terrain.field, options);
  const { settlements, resources } = await createMarkerMeshes(scene, terrain.field, options);
  const labels = createLabelLayer(scene, terrain.field, options);
  createWaterSurface(scene, size, [...terrain.chunks, ...roads], { simple: options.simpleWater });
  bindCellInspector(scene, terrain.chunks, terrain.field, inspector);
  const clans = createClanLayer();
  bindLayerToggles(layerPanel, { roads, trees, ports, settlements, resources, labels: [labels.root], clans: supportsTerrainShader(engine) ? [clans] : [] });
  bindLanguageToggle(layerPanel.parentElement, labels.show);
  const count = (meshes) => meshes.reduce((sum, mesh) => sum + mesh.metadata.count, 0);
  const summary = `${describeMapModel(model)}\nTerrain: ${terrain.chunks.length} chunks of ${options.chunkCells} × ${options.chunkCells} cells. Roads: ${roads.length} meshes. Trees: ${count(trees)} in ${trees.length} meshes. Ports: ${count(ports)}. Markers: ${count(settlements)} settlements, ${count(resources)} resources. Labels: ${labels.count()}.`;
  const report = (line) => (status.textContent = `${summary}\n${line}`);
  report("Textures: loading…");
  const material = await applyTextures(scene, model, terrain, options, report);
  if (material) clans.attach(material);
  console.info(status.textContent);
}

start().catch((error) => {
  status.textContent = `The 3D map could not start: ${error.message}`;
  console.error(error);
});
