/**
 * Billboard material for the 3D map markers and labels.
 *
 * - Each vertex moves from its anchor by its corner offset in view space, so the quad faces the camera.
 * - The scale is max(1, distance × shape.x). So a far marker keeps a minimum angular size.
 * - When shape.y is more than 0, the marker shows only nearer than shape.y.
 * - Pixels with alpha below 0.5 are discarded, so the markers need no sorting.
 */

/**
 * Distance that moves each quad toward the camera along the view ray, multiplied by the marker scale.
 * It keeps the quad out of nearby terrain. The quad scales with its distance, so its screen shape does not change.
 */
const CAMERA_PULL = 0.5;

const VERTEX_SHADER = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
attribute vec2 corner;
attribute vec2 shape;
uniform mat4 world;
uniform mat4 view;
uniform mat4 projection;
uniform vec3 cameraPosition;
uniform float cameraPull;
varying vec2 vUV;
varying float vVisible;
void main(void) {
  vec4 anchor = world * vec4(position, 1.0);
  float distance = length(cameraPosition - anchor.xyz);
  float scale = max(1.0, distance * shape.x);
  vec4 viewPosition = view * anchor;
  viewPosition.xy += corner * scale;
  viewPosition.xyz *= max(0.05, 1.0 - cameraPull * scale / max(distance, 0.001));
  gl_Position = projection * viewPosition;
  vUV = uv;
  vVisible = shape.y <= 0.0 || distance < shape.y ? 1.0 : 0.0;
}`;

const FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D atlas;
varying vec2 vUV;
varying float vVisible;
void main(void) {
  if (vVisible < 0.5) discard;
  vec4 color = texture2D(atlas, vUV);
  if (color.a < 0.5) discard;
  gl_FragColor = vec4(color.rgb, 1.0);
}`;

/**
 * Makes one billboard material for an atlas texture.
 * @param {BABYLON.Scene} scene Scene.
 * @param {string} name Material name.
 * @param {BABYLON.BaseTexture} atlas Atlas texture with alpha.
 * @returns {BABYLON.ShaderMaterial} Marker material.
 */
export function createMarkerMaterial(scene, name, atlas) {
  // Validation
  if (!scene || !atlas) throw new TypeError("createMarkerMaterial needs a scene and an atlas texture.");

  // Computation
  const material = new BABYLON.ShaderMaterial(name, scene, { vertexSource: VERTEX_SHADER, fragmentSource: FRAGMENT_SHADER }, { attributes: ["position", "uv", "corner", "shape"], uniforms: ["world", "view", "projection", "cameraPosition", "cameraPull"], samplers: ["atlas"] });
  material.setTexture("atlas", atlas);
  material.setFloat("cameraPull", CAMERA_PULL);
  material.backFaceCulling = false;
  return material;
}
