/**
 * GLSL terrain material for the 3D map. It needs WebGL2 (texture arrays and texelFetch).
 *
 * - The cell ID texture (NEAREST) gives the layers of each cell. The shader blends the
 *   colors of the 4 nearest cells. It never blends layer indices.
 * - A steep slope selects the steep-slope layer of the cell (the cliff rule: dot(normal, up)).
 * - Snow covers mountain cells above the snow line of the cell.
 * - The displacement in the albedo alpha makes the blend follow the texture height.
 * - The surface under height 0 gets the water color of its cell.
 */
import { SUN_DIRECTION } from "./map-3d-scene.js";
import { TERRAIN } from "../../scripts/world/world-map-layers.js";
import { SNOW_LAYER, SNOW_LINE_UNITS, WATER_CLASS, packCellIds } from "./surface-layers.js";

const WATER_CLASS_TERRAINS = new Map([
  [WATER_CLASS.LAKE, TERRAIN.WATER.id],
  [WATER_CLASS.COASTAL, TERRAIN.COASTAL_WATER.id],
  [WATER_CLASS.OCEAN, TERRAIN.OCEAN.id],
]);

/** Material settings that change the look. */
export const TERRAIN_LOOK = Object.freeze({
  textureScale: 0.6,
  cellBlend: 0.35,
  rockSlope: [0.62, 0.8],
  sunColor: [1.0, 0.96, 0.88],
  skyColor: [0.3, 0.36, 0.45],
  groundColor: [0.12, 0.11, 0.09],
});

const VERTEX_SHADER = `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 world;
uniform mat4 viewProjection;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
#include<clipPlaneVertexDeclaration>
void main(void) {
  vec4 worldPos = world * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = normalize(mat3(world) * normal);
  gl_Position = viewProjection * worldPos;
  #include<clipPlaneVertex>
}`;

const FRAGMENT_SHADER = `
precision highp float;
precision highp sampler2DArray;
uniform sampler2D cellIds;
uniform sampler2DArray albedoLayers;
uniform sampler2DArray shadingLayers;
uniform vec2 mapSize;
uniform float textureScale;
uniform float cellBlend;
uniform vec2 rockSlope;
uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform vec3 skyColor;
uniform vec3 groundColor;
uniform vec3 cameraPosition;
uniform vec3 waterColors[4];
uniform int snowLayer;
uniform float snowLineUnits;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
#include<clipPlaneFragmentDeclaration>

const int SLOTS = 6;
const float HEIGHT_BLEND = 0.35;
const float HEIGHT_DEPTH = 0.15;
const float WATER_DEPTH = 0.35;
int slotLayer[SLOTS];
float slotWeight[SLOTS];

void addLayer(int layer, float weight) {
  if (weight < 0.002) return;
  for (int slot = 0; slot < SLOTS; slot++) {
    if (slotLayer[slot] == layer || slotLayer[slot] < 0) {
      slotLayer[slot] = layer;
      slotWeight[slot] += weight;
      return;
    }
  }
}

vec4 cellAt(ivec2 cell) {
  return floor(texelFetch(cellIds, clamp(cell, ivec2(0), ivec2(mapSize) - 1), 0) * 255.0 + 0.5);
}

vec3 toLinear(vec3 color) { return pow(color, vec3(2.2)); }

void main(void) {
  #include<clipPlaneFragment>
  vec3 normal = normalize(vWorldNormal);
  vec2 cellPosition = vec2(vWorldPosition.x, mapSize.y - vWorldPosition.z) - 0.5;
  vec2 baseCell = floor(cellPosition);
  vec2 ratio = smoothstep(0.5 - cellBlend, 0.5 + cellBlend, cellPosition - baseCell);
  float rock = 1.0 - smoothstep(rockSlope.x, rockSlope.y, normal.y);
  for (int slot = 0; slot < SLOTS; slot++) { slotLayer[slot] = -1; slotWeight[slot] = 0.0; }

  vec3 waterTint = vec3(0.0);
  for (int corner = 0; corner < 4; corner++) {
    ivec2 offset = ivec2(corner & 1, corner >> 1);
    vec4 ids = cellAt(ivec2(baseCell) + offset);
    vec2 axis = mix(1.0 - ratio, ratio, vec2(offset));
    float weight = axis.x * axis.y;
    float snowLine = ids.b / snowLineUnits;
    float snow = ids.b > 0.0 ? smoothstep(snowLine - 0.12, snowLine + 0.12, vWorldPosition.y) * smoothstep(0.35, 0.6, normal.y) : 0.0;
    addLayer(int(ids.r), weight * (1.0 - rock) * (1.0 - snow));
    addLayer(int(ids.g), weight * rock * (1.0 - snow));
    addLayer(snowLayer, weight * snow);
    waterTint += weight * waterColors[int(ids.a)];
  }

  vec2 uv = vec2(vWorldPosition.x, -vWorldPosition.z) * textureScale;
  vec2 uvDx = dFdx(uv);
  vec2 uvDy = dFdy(uv);
  vec4 albedoSamples[SLOTS];
  float heights[SLOTS];
  float maxHeight = -1.0;
  for (int slot = 0; slot < SLOTS; slot++) {
    if (slotLayer[slot] < 0) break;
    albedoSamples[slot] = textureGrad(albedoLayers, vec3(uv, float(slotLayer[slot])), uvDx, uvDy);
    heights[slot] = slotWeight[slot] + albedoSamples[slot].a * HEIGHT_BLEND;
    maxHeight = max(maxHeight, heights[slot]);
  }

  vec3 albedo = vec3(0.0);
  vec2 normalXY = vec2(0.0);
  float roughness = 0.0;
  float total = 0.0;
  for (int slot = 0; slot < SLOTS; slot++) {
    if (slotLayer[slot] < 0) break;
    float blend = max(heights[slot] - maxHeight + HEIGHT_DEPTH, 0.0);
    if (blend <= 0.0) continue;
    vec4 shadingSample = textureGrad(shadingLayers, vec3(uv, float(slotLayer[slot])), uvDx, uvDy);
    albedo += albedoSamples[slot].rgb * blend;
    normalXY += (shadingSample.rg * 2.0 - 1.0) * blend;
    roughness += shadingSample.b * blend;
    total += blend;
  }
  albedo /= total;
  normalXY /= total;
  roughness /= total;

  vec3 tangentNormal = vec3(normalXY, sqrt(max(1.0 - dot(normalXY, normalXY), 0.0)));
  vec3 tangent = normalize(vec3(1.0, 0.0, 0.0) - normal * normal.x);
  vec3 bitangent = cross(tangent, normal);
  vec3 shading = normalize(tangent * tangentNormal.x + bitangent * tangentNormal.y + normal * tangentNormal.z);

  vec3 lightDirection = -sunDirection;
  float diffuse = max(dot(shading, lightDirection), 0.0);
  vec3 ambient = mix(groundColor, skyColor, shading.y * 0.5 + 0.5);
  vec3 halfVector = normalize(lightDirection + normalize(cameraPosition - vWorldPosition));
  float specular = pow(max(dot(shading, halfVector), 0.0), mix(48.0, 4.0, roughness)) * (1.0 - roughness) * 0.3 * step(0.0, dot(normal, lightDirection));
  vec3 color = toLinear(albedo) * (ambient + sunColor * diffuse) + sunColor * specular;
  float underwater = smoothstep(0.0, 1.0, clamp(-vWorldPosition.y / WATER_DEPTH, 0.0, 1.0));
  color = mix(color, toLinear(waterTint) * (ambient + sunColor * 0.6), underwater * 0.9);
  gl_FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}`;

/**
 * Finds out if the engine can run the terrain shader.
 * @param {BABYLON.Engine} engine Babylon.js engine.
 * @returns {boolean} True when the engine uses WebGL2 or later.
 */
export function supportsTerrainShader(engine) {
  return engine.webGLVersion >= 2;
}

/**
 * Makes the cell ID texture with NEAREST filtering, so that layer indices are never blended.
 * @param {BABYLON.Scene} scene Scene.
 * @param {import("./map-data.js").MapModel} model Map model.
 * @returns {BABYLON.RawTexture} Cell ID texture.
 */
function createCellIdTexture(scene, model) {
  const texture = new BABYLON.RawTexture(packCellIds(model), model.columns, model.rows, BABYLON.Constants.TEXTUREFORMAT_RGBA, scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
  texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
  texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
  return texture;
}

/**
 * Makes the shared terrain material.
 * @param {BABYLON.Scene} scene Scene.
 * @param {import("./map-data.js").MapModel} model Map model.
 * @param {{albedo: BABYLON.BaseTexture, shading: BABYLON.BaseTexture}} arrays Texture arrays from loadTextureArrays.
 * @param {{water: Map<number, number[]>}} palette Surface palette with the water colors.
 * @returns {BABYLON.ShaderMaterial} Terrain material.
 */
export function createTerrainMaterial(scene, model, arrays, palette) {
  // Validation
  if (!arrays?.albedo || !arrays?.shading) throw new TypeError("createTerrainMaterial needs the albedo and shading texture arrays.");

  // Computation
  const uniforms = ["world", "viewProjection", "cameraPosition", "mapSize", "textureScale", "cellBlend", "rockSlope", "sunDirection", "sunColor", "skyColor", "groundColor", "waterColors", "snowLayer", "snowLineUnits"];
  const material = new BABYLON.ShaderMaterial("terrainSurface", scene, { vertexSource: VERTEX_SHADER, fragmentSource: FRAGMENT_SHADER }, { attributes: ["position", "normal"], uniforms, samplers: ["cellIds", "albedoLayers", "shadingLayers"], useClipPlane: true });
  const classColors = [WATER_CLASS.LAKE, WATER_CLASS.LAKE, WATER_CLASS.COASTAL, WATER_CLASS.OCEAN].map((waterClass) => palette.water.get(WATER_CLASS_TERRAINS.get(waterClass)));
  if (classColors.some((color) => !color)) throw new TypeError("The palette needs a color for each water class.");

  material.setTexture("cellIds", createCellIdTexture(scene, model));
  material.setTexture("albedoLayers", arrays.albedo);
  material.setTexture("shadingLayers", arrays.shading);
  material.setVector2("mapSize", new BABYLON.Vector2(model.columns, model.rows));
  material.setFloat("textureScale", TERRAIN_LOOK.textureScale);
  material.setFloat("cellBlend", TERRAIN_LOOK.cellBlend);
  material.setVector2("rockSlope", BABYLON.Vector2.FromArray(TERRAIN_LOOK.rockSlope));
  material.setVector3("sunDirection", SUN_DIRECTION);
  ["sunColor", "skyColor", "groundColor"].forEach((name) => material.setColor3(name, BABYLON.Color3.FromArray(TERRAIN_LOOK[name])));
  material.setArray3("waterColors", classColors.flat());
  material.setInt("snowLayer", SNOW_LAYER);
  material.setFloat("snowLineUnits", SNOW_LINE_UNITS);
  return material;
}
