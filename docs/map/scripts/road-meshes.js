/**
 * Road and footpath meshes for the 3D world map: one mesh for each chunk and path kind.
 * Each mesh uses the diffuse image of its PBR texture set, so the roads need no texture decoding.
 */
import { ROAD_STYLES, buildRoadGeometry } from "./road-paths.js";

const TEXTURE_FOLDER = new URL("../textures/", import.meta.url).href;

/**
 * Makes one material for each path kind.
 * @param {BABYLON.Scene} scene Scene.
 * @returns {Map<number, BABYLON.StandardMaterial>} Materials by infrastructure catalog ID.
 */
function createRoadMaterials(scene) {
  return new Map(
    [...ROAD_STYLES].map(([kind, style]) => {
      const material = new BABYLON.StandardMaterial(`${style.name}Material`, scene);
      material.diffuseTexture = new BABYLON.Texture(`${TEXTURE_FOLDER}${style.texture}_diff_1k.jpg`, scene);
      material.specularColor = BABYLON.Color3.Black();
      material.zOffset = -2;
      return [kind, material];
    }),
  );
}

/**
 * Creates the road and footpath meshes.
 * @param {BABYLON.Scene} scene Scene.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {{chunkCells: number}} options Chunk size.
 * @returns {BABYLON.Mesh[]} Path meshes. Each mesh has metadata.chunk (the chunk index) and metadata.kind.
 */
export function createRoadMeshes(scene, field, options) {
  // Validation
  if (!scene || !field || !Number.isInteger(options?.chunkCells)) throw new TypeError("createRoadMeshes needs a scene, a height field, and a chunk size.");

  // Computation
  const materials = createRoadMaterials(scene);
  return [...buildRoadGeometry(field, options.chunkCells).values()].map((group) => {
    const mesh = new BABYLON.Mesh(`${ROAD_STYLES.get(group.kind).name}_${group.chunk}`, scene);
    const vertexData = new BABYLON.VertexData();
    vertexData.positions = group.positions;
    vertexData.uvs = group.uvs;
    vertexData.indices = group.indices;
    vertexData.normals = [];
    BABYLON.VertexData.ComputeNormals(group.positions, group.indices, vertexData.normals);
    vertexData.applyToMesh(mesh);
    mesh.material = materials.get(group.kind);
    mesh.isPickable = false;
    mesh.metadata = { chunk: group.chunk, kind: group.kind };
    mesh.freezeWorldMatrix();
    return mesh;
  });
}
