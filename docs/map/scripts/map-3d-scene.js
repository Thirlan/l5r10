/**
 * Scene setup for the 3D world map: the scene, the orbit camera, and the light.
 *
 * World units: one map cell is one unit. World X is the column. World Z is
 * (rows - row), so north is far from the default camera. Y is up.
 */

const CAMERA_ALPHA = -Math.PI / 2;
const CAMERA_BETA = 0.8;
const FRAME_RADIUS_FACTOR = 0.95;
const SKY_COLOR = [0.62, 0.74, 0.86];

/**
 * Makes sure that a map size has positive integer columns and rows.
 * @param {{columns: number, rows: number}} size Map size in cells.
 * @returns {void}
 */
export function validateMapSize(size) {
  if (!size || !Number.isInteger(size.columns) || !Number.isInteger(size.rows) || size.columns <= 0 || size.rows <= 0) {
    throw new TypeError("The map size needs positive integer columns and rows.");
  }
}

/**
 * Moves the camera so that it shows the full map from the south.
 * @param {BABYLON.ArcRotateCamera} camera Orbit camera.
 * @param {{columns: number, rows: number}} size Map size in cells.
 * @returns {void}
 */
export function frameMap(camera, size) {
  // Validation
  if (!camera || !camera.target) throw new TypeError("frameMap needs an orbit camera.");
  validateMapSize(size);

  // Computation
  camera.setTarget(new BABYLON.Vector3(size.columns / 2, 0, size.rows / 2));
  camera.alpha = CAMERA_ALPHA;
  camera.beta = CAMERA_BETA;
  camera.radius = Math.max(size.columns, size.rows) * FRAME_RADIUS_FACTOR;
}

/**
 * Creates the scene, the orbit camera, and the sky light.
 * @param {BABYLON.Engine} engine Babylon.js engine.
 * @param {{columns: number, rows: number}} size Map size in cells.
 * @returns {{scene: BABYLON.Scene, camera: BABYLON.ArcRotateCamera}} New scene objects.
 */
export function createMapScene(engine, size) {
  // Validation
  if (!engine || typeof engine.runRenderLoop !== "function") throw new TypeError("createMapScene needs a Babylon.js engine.");
  validateMapSize(size);

  // Computation
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(...SKY_COLOR, 1);
  const camera = new BABYLON.ArcRotateCamera("mapCamera", CAMERA_ALPHA, CAMERA_BETA, 1, BABYLON.Vector3.Zero(), scene);
  camera.minZ = 0.05;
  camera.maxZ = Math.max(size.columns, size.rows) * 6;
  camera.wheelDeltaPercentage = 0.02;
  camera.panningSensibility = 40;
  camera.attachControl(true);
  frameMap(camera, size);

  const light = new BABYLON.HemisphericLight("mapSkyLight", new BABYLON.Vector3(0.3, 1, -0.4), scene);
  light.groundColor = new BABYLON.Color3(0.35, 0.33, 0.3);
  return { scene, camera };
}
