/**
 * Entry module for the 3D world map page (docs/map/world_map_3d.html).
 * It starts the Babylon.js engine and the render loop.
 */
import { describeMapModel, loadMapModel } from "./map-data.js";
import { createMapScene } from "./map-3d-scene.js";

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
 * Starts the engine, creates the scene, loads the map, and starts the render loop.
 * @returns {Promise<void>}
 */
async function start() {
  if (typeof BABYLON === "undefined") {
    status.textContent = "Babylon.js did not load. Check the network connection.";
    return;
  }

  const size = readMapSize(canvas);
  const engine = new BABYLON.Engine(canvas, true, { stencil: true }, true);
  const { scene } = createMapScene(engine, size);
  const placeholder = BABYLON.MeshBuilder.CreateGround("mapPlaceholder", { width: size.columns, height: size.rows }, scene);
  placeholder.position = new BABYLON.Vector3(size.columns / 2, 0, size.rows / 2);

  engine.runRenderLoop(() => scene.render());
  new ResizeObserver(() => engine.resize()).observe(canvas);

  status.textContent = "Loading the map data…";
  const model = await loadMapModel(canvas.dataset.mapData, size);
  status.textContent = describeMapModel(model);
  console.info(status.textContent);
}

start().catch((error) => {
  status.textContent = `The 3D map could not start: ${error.message}`;
  console.error(error);
});
