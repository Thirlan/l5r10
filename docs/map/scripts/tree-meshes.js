/**
 * Tree meshes for the 3D world map: one thin-instance mesh for each chunk and tree kind.
 * The prototype has white canopy vertices, so the instance color sets the canopy color.
 * The trunk vertices are dark, so the trunk shows as a dark shade of the canopy color.
 */
import { TREE_KINDS, buildTreeGroups } from "./tree-placement.js";

const TRUNK_SHADE = [0.55, 0.42, 0.36, 1];
const CANOPY_SHADE = [1, 1, 1, 1];
/** Lowers each trunk into the ground, so a tree on a slope does not float. */
const TRUNK_SINK = 0.015;

function paint(mesh, shade) {
  const count = mesh.getTotalVertices();
  mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, Array.from({ length: count }, () => shade).flat());
  return mesh;
}

/**
 * Makes the geometry of one tree kind, in cell units, with the trunk base at the origin.
 * @param {BABYLON.Scene} scene Scene.
 * @param {string} kind Value of TREE_KINDS.
 * @returns {BABYLON.VertexData} Prototype geometry with vertex colors.
 */
function treePrototype(scene, kind) {
  const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", { height: 0.1, diameterTop: 0.018, diameterBottom: 0.03, tessellation: 5 }, scene);
  trunk.position.y = 0.05;
  const canopy = kind === TREE_KINDS.CONIFER ? BABYLON.MeshBuilder.CreateCylinder("canopy", { height: 0.28, diameterTop: 0, diameterBottom: 0.16, tessellation: 7 }, scene) : BABYLON.MeshBuilder.CreateIcoSphere("canopy", { radius: 0.095, subdivisions: 1, flat: true }, scene);
  canopy.position.y = kind === TREE_KINDS.CONIFER ? 0.2 : 0.17;
  canopy.scaling.y = kind === TREE_KINDS.CONIFER ? 1 : 1.15;
  const merged = BABYLON.Mesh.MergeMeshes([paint(trunk, TRUNK_SHADE), paint(canopy, CANOPY_SHADE)], true);
  const vertexData = BABYLON.VertexData.ExtractFromMesh(merged);
  merged.dispose();
  return vertexData;
}

/**
 * Packs the world matrix and the canopy color of each tree.
 * @param {ReturnType<typeof import("./tree-placement.js").placeTrees>} trees Trees of one group.
 * @param {number} rows Map rows. World Z is rows - y.
 * @returns {{matrices: Float32Array, colors: Float32Array}} Thin instance buffers.
 */
function instanceBuffers(trees, rows) {
  const matrices = new Float32Array(trees.length * 16);
  const colors = new Float32Array(trees.length * 4);
  const matrix = new BABYLON.Matrix();
  trees.forEach((tree, index) => {
    BABYLON.Matrix.ComposeToRef(new BABYLON.Vector3(tree.scale, tree.scale, tree.scale), BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, tree.yaw), new BABYLON.Vector3(tree.x, tree.height - TRUNK_SINK, rows - tree.y), matrix);
    matrix.copyToArray(matrices, index * 16);
    colors.set([...tree.color, 1], index * 4);
  });
  return { matrices, colors };
}

/**
 * Creates the tree meshes. The trees are not in the water reflection list, because they would double the reflection cost.
 * @param {BABYLON.Scene} scene Scene.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {{chunkCells: number}} options Chunk size.
 * @returns {BABYLON.Mesh[]} Tree meshes. Each mesh has metadata.chunk, metadata.kind, and metadata.count.
 */
export function createTreeMeshes(scene, field, options) {
  // Validation
  if (!scene || !field || !Number.isInteger(options?.chunkCells)) throw new TypeError("createTreeMeshes needs a scene, a height field, and a chunk size.");

  // Computation
  const material = new BABYLON.StandardMaterial("treeMaterial", scene);
  material.specularColor = BABYLON.Color3.Black();
  const prototypes = new Map(Object.values(TREE_KINDS).map((kind) => [kind, treePrototype(scene, kind)]));
  return [...buildTreeGroups(field, options.chunkCells).values()].map((group) => {
    const mesh = new BABYLON.Mesh(`trees_${group.kind}_${group.chunk}`, scene);
    prototypes.get(group.kind).applyToMesh(mesh);
    mesh.material = material;
    const { matrices, colors } = instanceBuffers(group.trees, field.model.rows);
    mesh.thinInstanceSetBuffer("matrix", matrices, 16, true);
    mesh.thinInstanceSetBuffer("color", colors, 4, true);
    mesh.thinInstanceRefreshBoundingInfo(false);
    mesh.isPickable = false;
    mesh.metadata = { chunk: group.chunk, kind: group.kind, count: group.trees.length };
    mesh.freezeWorldMatrix();
    return mesh;
  });
}
