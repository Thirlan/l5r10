import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const layersConfig = JSON.parse(read("../docs/scripts/layers.json"));
const entries = JSON.parse(read("../docs/scripts/map_tile_img.json"));
const sourcePixels = [120, 140, 100, 255, 140, 90, 60, 200, 16, 16, 16, 255, 0, 0, 0, 0];
const document = {
  createElement() {
    const pixels = { data: new Uint8ClampedArray(sourcePixels) };
    return {
      pixels,
      getContext: () => ({
        drawImage() {},
        getImageData: () => pixels,
        putImageData() {}
      })
    };
  }
};
const Renderer = vm.runInNewContext(read("../docs/scripts/world-map-common.js") + "\nWorldMapRenderer;", { document });

function createRenderer() {
  const renderer = Object.create(Renderer.prototype);
  Object.assign(renderer, { layersConfig, layerMaps: {}, climateTileCache: {}, tileImageMap: {}, grid: {}, gridSize: 16 });
  renderer.buildLayerMaps();
  return renderer;
}

test("Waste is greyscale; Shadowland uses green, purple, and black with unchanged transparency", () => {
  const renderer = createRenderer();
  const image = { naturalWidth: 2, naturalHeight: 2 };
  for (const climate of ["waste", "shadowland"]) {
    const tile = renderer.getClimateTileImage(image, climate, "0,0,3");
    assert.equal(tile.width, 2);
    assert.equal(tile.height, 2);
    assert.equal(renderer.getClimateTileImage(image, climate, "0,0,3"), tile);
    const data = tile.pixels.data;
    for (let i = 0; i < data.length; i += 4) {
      assert.equal(data[i + 3], sourcePixels[i + 3]);
      if (climate === "waste") {
        assert.equal(data[i], data[i + 1]);
        assert.equal(data[i], data[i + 2]);
      }
    }
    if (climate === "shadowland") {
      assert.ok(data[1] > data[0] && data[1] > data[2]);
      assert.ok(data[6] > data[4] && data[4] > data[5]);
      assert.deepEqual(Array.from(data.slice(8, 11)), [0, 0, 0]);
    }
  }
});

test("Both climates render all temperate combinations, preserve existing tiles, and normalize saved values", () => {
  const renderer = createRenderer();
  const drawn = [];
  renderer.ctx = { drawImage: (image) => drawn.push(image) };
  for (const entry of entries) {
    renderer.tileImageMap[`${entry.terrain},${entry.climate},${entry.vegetation}`] =
      { complete: true, naturalWidth: 2, naturalHeight: 2 };
  }
  for (const entry of entries.filter((item) => item.climate === 0)) {
    for (const climate of [0, 6, 7]) {
      renderer.grid = { "0,0": { terrain: entry.terrain, vegetation: entry.vegetation, climate } };
      renderer.drawBaseTiles();
      const image = drawn.at(-1);
      const key = `${entry.terrain},0,${entry.vegetation}`;
      assert.equal(image, climate === 0 ? renderer.tileImageMap[key] :
        renderer.climateTileCache[`${climate === 6 ? "waste" : "shadowland"},${key}`]);
    }
  }
  assert.equal(drawn.length, 57);
  const normalized = renderer.normalizeGridData({ "0,0": { climate: "waste" }, "1,0": { climate: "shadowland" } });
  assert.equal(normalized["0,0"].climate, 6);
  assert.equal(normalized["1,0"].climate, 7);
  assert.equal(renderer.normalizeGridData(JSON.parse(JSON.stringify(normalized)))["1,0"].climate, 7);
  renderer.isLayerVisible = () => false;
  renderer.grid = { "0,0": { terrain: 8, vegetation: 3, climate: 6 }, "1,0": { terrain: 3, vegetation: 3, climate: 7 } };
  renderer.drawBaseTiles();
  assert.equal(drawn.at(-2), renderer.climateTileCache["waste,0,0,0"]);
  assert.equal(drawn.at(-1), renderer.climateTileCache["shadowland,3,0,0"]);
});
