/**
 * Scene setup for the 3D world map: the scene, the orbit camera, and the light.
 *
 * World units: one map cell is one unit. World X is the column. World Z is
 * (rows - row), so north is far from the default camera. Y is up.
 */

const CAMERA_ALPHA = -Math.PI / 2;
const CAMERA_BETA = 0.7;
const FRAME_MARGIN = 1.04;
const SKY_COLOR = [0.62, 0.74, 0.86];

/** Direction of the sunlight: from the northwest, down to the southeast, like a hill-shaded map. */
export const SUN_DIRECTION = new BABYLON.Vector3(0.5, -0.7, -0.5).normalize();

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
  const aspect = camera.getEngine().getAspectRatio(camera) || 1;
  camera.radius = fitRadius(size, CAMERA_ALPHA, CAMERA_BETA, camera.fov, aspect) * FRAME_MARGIN;
}

/**
 * Finds the smallest orbit radius that shows the four map corners.
 * @param {{columns: number, rows: number}} size Map size in cells.
 * @param {number} alpha Orbit angle around the vertical axis.
 * @param {number} beta Orbit angle from the vertical axis.
 * @param {number} fov Vertical field of view in radians.
 * @param {number} aspect Width divided by height of the view.
 * @returns {number} Orbit radius in cells.
 */
function fitRadius(size, alpha, beta, fov, aspect) {
  const forward = [-Math.cos(alpha) * Math.sin(beta), -Math.cos(beta), -Math.sin(alpha) * Math.sin(beta)];
  const up = [-Math.cos(alpha) * Math.cos(beta), Math.sin(beta), -Math.sin(alpha) * Math.cos(beta)];
  const right = [-Math.sin(alpha), 0, Math.cos(alpha)];
  const dot = (first, second) => first[0] * second[0] + first[1] * second[1] + first[2] * second[2];
  const tanVertical = Math.tan(fov / 2);
  const tanHorizontal = tanVertical * aspect;
  const corners = [-1, 1].flatMap((east) => [-1, 1].map((north) => [(east * size.columns) / 2, 0, (north * size.rows) / 2]));
  return Math.max(...corners.map((corner) => Math.max(Math.abs(dot(corner, up)) / tanVertical, Math.abs(dot(corner, right)) / tanHorizontal) - dot(corner, forward)));
}

/**
 * Creates the scene, the orbit camera, the sky light, and the sun.
 * @param {BABYLON.Engine} engine Babylon.js engine.
 * @param {{columns: number, rows: number}} size Map size in cells.
 * @returns {{scene: BABYLON.Scene, camera: BABYLON.ArcRotateCamera, sun: BABYLON.DirectionalLight}} New scene objects.
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

  const light = new BABYLON.HemisphericLight("mapSkyLight", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.55;
  light.groundColor = new BABYLON.Color3(0.35, 0.33, 0.3);
  const sun = new BABYLON.DirectionalLight("mapSun", SUN_DIRECTION.clone(), scene);
  sun.intensity = 0.75;
  return { scene, camera, sun };
}
