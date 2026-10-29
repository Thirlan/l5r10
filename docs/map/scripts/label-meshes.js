/**
 * Settlement and map label meshes for the 3D world map.
 * The text style is the same as on the 2D map: bold Arial, black fill, and a white outline.
 */
import { LABEL_PADDING, LABEL_SCALE, labelAtlasLayout, labelGeometry, mapLabels, settlementLabels } from "./label-layout.js";
import { createMarkerMaterial } from "./marker-material.js";
import { createMarkerMesh } from "./marker-meshes.js";

const measureContext = document.createElement("canvas").getContext("2d");

/**
 * @param {string} line Text line.
 * @param {number} fontSize Font size in 2D map pixels.
 * @returns {number} Line width in 2D map pixels.
 */
function measureLine(line, fontSize) {
  measureContext.font = `bold ${fontSize}px Arial`;
  return measureContext.measureText(line).width;
}

/**
 * Draws all labels into one atlas canvas.
 * @param {ReturnType<typeof settlementLabels>} labels Labels.
 * @param {ReturnType<typeof labelAtlasLayout>} layout Atlas layout.
 * @returns {HTMLCanvasElement} Atlas canvas.
 */
function drawLabelAtlas(labels, layout) {
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const context = canvas.getContext("2d");
  Object.assign(context, { textAlign: "center", textBaseline: "middle", lineJoin: "round", strokeStyle: "#FFFFFF", fillStyle: "#000000" });
  labels.forEach((label) => {
    const rect = layout.rects.get(label.key);
    const lineHeight = label.fontSize * LABEL_SCALE;
    context.font = `bold ${lineHeight}px Arial`;
    context.lineWidth = Math.max(2, label.fontSize / 6) * LABEL_SCALE;
    label.lines.forEach((line, index) => {
      const [x, y] = [rect.left + rect.width / 2, rect.top + LABEL_PADDING + (index + 0.5) * lineHeight];
      context.strokeText(line, x, y);
      context.fillText(line, x, y);
    });
  });
  return canvas;
}

/**
 * Creates the label meshes for one language, with one mesh for each chunk.
 * @param {BABYLON.Scene} scene Scene.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {number} chunkCells Cells along each chunk edge.
 * @param {"english" | "rokugani"} language Language.
 * @param {BABYLON.TransformNode} root Parent of the label meshes.
 * @returns {{meshes: BABYLON.Mesh[], material: BABYLON.Material, atlas: BABYLON.DynamicTexture}} Label meshes and their resources.
 */
function buildLabels(scene, field, chunkCells, language, root) {
  const labels = [...settlementLabels(field.model, language), ...mapLabels(field.model, language)];
  const layout = labelAtlasLayout(labels, measureLine);
  const atlas = new BABYLON.DynamicTexture(`labelAtlas_${language}`, drawLabelAtlas(labels, layout), scene, true);
  atlas.hasAlpha = true;
  atlas.update();
  const material = createMarkerMaterial(scene, `labelMaterial_${language}`, atlas);
  const meshes = [...labelGeometry(field, labels, layout, chunkCells).values()].map((group) => {
    const mesh = createMarkerMesh(scene, `labels_${group.chunk}`, group, material);
    mesh.parent = root;
    return mesh;
  });
  return { meshes, material, atlas };
}

/**
 * Creates the label layer. All label meshes are children of one root node, so the layer toggle shows or hides them together.
 * @param {BABYLON.Scene} scene Scene.
 * @param {import("./terrain-height.js").HeightField} field Height field.
 * @param {{chunkCells: number}} options Chunk size.
 * @returns {{root: BABYLON.TransformNode, count: () => number, show: (language: "english" | "rokugani") => void}} Label layer. show() rebuilds the labels in a language.
 */
export function createLabelLayer(scene, field, options) {
  // Validation
  if (!scene || !field || !Number.isInteger(options?.chunkCells)) throw new TypeError("createLabelLayer needs a scene, a height field, and a chunk size.");

  // Computation
  const root = new BABYLON.TransformNode("labels", scene);
  const current = { meshes: [], material: null, atlas: null };
  const show = (language) => {
    current.meshes.forEach((mesh) => mesh.dispose());
    current.material?.dispose();
    current.atlas?.dispose();
    Object.assign(current, buildLabels(scene, field, options.chunkCells, language, root));
  };
  show("english");
  return { root, count: () => current.meshes.reduce((sum, mesh) => sum + mesh.metadata.count, 0), show };
}
