/**
 * Placeholder port markers for the 3D world map: a small dock that points to the nearest water neighbor.
 * The live map has no ports yet, so the markers are simple. A later PR can replace them with models.
 */
import { INFRASTRUCTURE } from "../../scripts/world/world-map-layers.js";
import { BRIDGE_DECK } from "./road-paths.js";
import { HeightField } from "./terrain-height.js";
import { chunkIndexAt } from "./terrain-chunks.js";

/** Neighbor offsets in the order of the saved direction flags: north, then clockwise. */
const NEIGHBORS = Object.freeze([
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
]);
/** Scale of the dock for each port kind. */
export const PORT_SCALES = new Map([
  [INFRASTRUCTURE.SMALL_PORT.id, 1],
  [INFRASTRUCTURE.LARGE_PORT.id, 1.5],
]);
const DOCK_SHIFT = 0.4;
const DOCK_LIFT = 0.02;
const DOCK_COLOR = [0.42, 0.29, 0.17, 1];
const POST_COLOR = [0.75, 0.2, 0.15, 1];

/**
 * Finds the port markers of the map.
 * The dock points from the cell center to the first water neighbor. Yaw 0 points east, and yaw π/2 points south.
 * @param {HeightField} field Height field.
 * @param {number} chunkCells Cells along each chunk edge.
 * @returns {Array<{chunk: number, kind: number, x: number, y: number, height: number, yaw: number, scale: number}>} Port markers.
 */
export function portPlacements(field, chunkCells) {
  // Validation
  if (!(field instanceof HeightField) || !Number.isInteger(chunkCells)) throw new TypeError("portPlacements needs a HeightField and a chunk size.");

  // Computation
  const { model } = field;
  const infrastructure = model.ids("infrastructure");
  return [...infrastructure.keys()]
    .filter((index) => PORT_SCALES.has(infrastructure[index]))
    .map((index) => {
      const [column, row] = [index % model.columns, Math.floor(index / model.columns)];
      const [dx, dy] = NEIGHBORS.find(([offsetX, offsetY]) => model.contains(column + offsetX, row + offsetY) && model.isWater(column + offsetX, row + offsetY)) ?? [0, 0];
      const length = Math.hypot(dx, dy) || 1;
      const [x, y] = [column + 0.5 + (dx / length) * DOCK_SHIFT, row + 0.5 + (dy / length) * DOCK_SHIFT];
      return {
        chunk: chunkIndexAt(model.columns, chunkCells, column + 0.5, row + 0.5),
        kind: infrastructure[index],
        x,
        y,
        height: Math.max(field.sample(x, y), BRIDGE_DECK) + DOCK_LIFT,
        yaw: Math.atan2(dy, dx),
        scale: PORT_SCALES.get(infrastructure[index]),
      };
    });
}

function paintedPart(mesh, color) {
  mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, Array.from({ length: mesh.getTotalVertices() }, () => color).flat());
  return mesh;
}

/**
 * Makes the dock geometry: a plank deck along +X with a red post at the land end.
 * @param {BABYLON.Scene} scene Scene.
 * @returns {BABYLON.VertexData} Prototype geometry with vertex colors.
 */
function dockPrototype(scene) {
  const deck = BABYLON.MeshBuilder.CreateBox("dockDeck", { width: 0.4, height: 0.03, depth: 0.12 }, scene);
  deck.position.x = 0.05;
  const post = BABYLON.MeshBuilder.CreateCylinder("dockPost", { height: 0.16, diameter: 0.025, tessellation: 6 }, scene);
  post.position.set(-0.12, 0.08, 0);
  const merged = BABYLON.Mesh.MergeMeshes([paintedPart(deck, DOCK_COLOR), paintedPart(post, POST_COLOR)], true);
  const vertexData = BABYLON.VertexData.ExtractFromMesh(merged);
  merged.dispose();
  return vertexData;
}

/**
 * Creates one thin-instance mesh of port markers for each chunk that has ports.
 * @param {BABYLON.Scene} scene Scene.
 * @param {HeightField} field Height field.
 * @param {{chunkCells: number}} options Chunk size.
 * @returns {BABYLON.Mesh[]} Port meshes. Each mesh has metadata.chunk and metadata.count. The list is empty when the map has no ports.
 */
export function createPortMeshes(scene, field, options) {
  const ports = portPlacements(field, options?.chunkCells);
  if (ports.length === 0) return [];
  const prototype = dockPrototype(scene);
  const material = new BABYLON.StandardMaterial("portMaterial", scene);
  material.specularColor = BABYLON.Color3.Black();
  const chunks = Map.groupBy(ports, (port) => port.chunk);
  return [...chunks].map(([chunk, chunkPorts]) => {
    const mesh = new BABYLON.Mesh(`ports_${chunk}`, scene);
    prototype.applyToMesh(mesh);
    mesh.material = material;
    const matrices = new Float32Array(chunkPorts.length * 16);
    chunkPorts.forEach((port, index) => BABYLON.Matrix.Compose(new BABYLON.Vector3(port.scale, port.scale, port.scale), BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, port.yaw), new BABYLON.Vector3(port.x, port.height, field.model.rows - port.y)).copyToArray(matrices, index * 16));
    mesh.thinInstanceSetBuffer("matrix", matrices, 16, true);
    mesh.thinInstanceRefreshBoundingInfo(false);
    mesh.isPickable = false;
    mesh.metadata = { chunk, count: chunkPorts.length };
    mesh.freezeWorldMatrix();
    return mesh;
  });
}
