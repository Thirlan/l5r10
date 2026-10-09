import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const layers = await import("../docs/scripts/world-map-layers.js");
const { LayerDefinition, LayerValue, SettlementValue } = layers;

test("layer values expose immutable IDs and names", () => {
  const value = new LayerValue(0, "flat");

  assert.deepEqual({ id: value.id, name: value.name }, { id: 0, name: "flat" });
  assert.ok(Object.isFrozen(value));
  assert.throws(() => { value.id = 2; }, TypeError);
});

test("settlement values expose immutable type labels", () => {
  const value = new SettlementValue(1, "Village", "Village", "Mura");

  assert.deepEqual(
    { id: value.id, name: value.name, englishType: value.englishType, rokuganiType: value.rokuganiType },
    { id: 1, name: "Village", englishType: "Village", rokuganiType: "Mura" },
  );
  assert.ok(Object.isFrozen(value));
  assert.throws(() => { value.englishType = "City"; }, TypeError);
});

test("layer definitions look up numeric IDs without coercion", () => {
  const flat = new LayerValue(0, "flat");
  const layer = new LayerDefinition("terrain", "Terrain Layer", [flat]);

  assert.equal(layer.getValue(0), flat);
  assert.equal(layer.getValue("0"), undefined);
  assert.equal(layer.getValue(1), undefined);
  assert.ok(Object.isFrozen(layer));
  assert.ok(Object.isFrozen(layer.values));
});

test("layer definitions reject duplicate IDs and non-value entries", () => {
  assert.throws(
    () => new LayerDefinition("terrain", "Terrain Layer", [new LayerValue(0, "flat"), new LayerValue(0, "water")]),
    TypeError,
  );
  assert.throws(() => new LayerDefinition("terrain", "Terrain Layer", [{}]), TypeError);
});

test("base layer catalogs preserve source IDs and names", () => {
  const expected = {
    TERRAIN: [[0, "flat"], [1, "hills"], [2, "mountains"], [3, "water"], [4, "coastal water"], [5, "ocean"], [7, "wetlands"], [8, "cliff"]],
    CLIMATE: [[0, "temperate"], [1, "tropical"], [2, "desert"], [3, "polar"], [4, "waste"], [5, "shadowland"]],
    VEGETATION: [[0, "none"], [1, "Vegetation"]],
    RIVER: [[0, "none"], [1, "River"]],
    INFRASTRUCTURE: [[0, "none"], [1, "Road"], [2, "Footpath"], [3, "Small Port"], [4, "Large Port"]],
  };

  for (const [name, entries] of Object.entries(expected)) {
    assert.deepEqual(
      Object.values(layers[name]).map(({ id, name: label }) => [id, label]),
      entries,
    );
    assert.ok(Object.isFrozen(layers[name]));
    for (const value of Object.values(layers[name])) assert.ok(Object.isFrozen(value));
  }
});

test("clan and settlement catalogs preserve source values and settlement labels", () => {
  assert.deepEqual(
    Object.values(layers.CLAN).map(({ id, name }) => [id, name]),
    [[0, "none"], [1, "Crab"], [2, "Crane"], [3, "Dragon"], [4, "Lion"], [5, "Phoenix"], [6, "Scorpion"], [7, "Unicorn"], [8, "Imperial"], [9, "Hare"], [10, "Centipede"], [11, "Fox"], [12, "Badger"], [13, "Dragonfly"], [14, "Falcon"], [15, "Sparrow"], [16, "Tortoise"], [17, "Mantis"], [18, "Shadowlands"]],
  );
  assert.deepEqual(
    Object.values(layers.SETTLEMENT).map(({ id, name, englishType, rokuganiType }) => [id, name, englishType, rokuganiType]),
    [[0, "none", "", ""], [1, "Village", "Village", "Mura"], [2, "City", "City", "Toshi"], [3, "Capital", "Capital", "Shuto"], [4, "Fortification", "Fortification", ""], [5, "Castle", "Castle", "Shiro"], [6, "Kyuden", "Palace", "Kyuden"], [10, "Small Shrine", "Small Shrine", "Shōsha"], [11, "Large Shrine", "Large Shrine", "Taisha"], [12, "Village Ruins", "Village Ruins", ""], [13, "Castle Ruins", "Castle Ruins", ""], [14, "Academy", "Academy", ""], [15, "Watchtower", "Watchtower", ""], [16, "Small Temple", "Small Temple", ""], [17, "Large Temple", "Large Temple", ""]],
  );
});

test("resources preserve IDs and names without type labels", () => {
  const names = ["none", "Iron Mine", "Lumber Mill", "Rice Paddy", "Grain Farm", "Silk Farm", "Tea Plantation", "Hemp Farm", "Cotton Farm", "Fruit Orchard", "Sheep Pasture", "Goat Pasture", "Horse Ranch", "Cattle Farm", "Salt Works", "Nut Grove", "Mushroom Farm", "Spice Farm", "Poultry Farm", "Poppy Farm", "Dye Crop Farm", "Jade Mine", "Copper Mine", "Gold Mine", "Silver Mine", "Coal Mine", "Clay Pit", "Gemstone Mine", "Stone Quarry", "Coastal Fish Boat", "Crab Boat", "Pearl Divers", "Shellfish Boat", "Squid Boat", "Ocean Fish Boat", "Kelp Farm", "Tropical Fruit Orchard", "Tropical Lumber Mill", "Utaku Ranch", "Vegetable Farm"];

  assert.deepEqual(
    Object.values(layers.RESOURCE).map(({ id, name }) => [id, name]),
    names.map((name, id) => [id, name]),
  );
  for (const value of Object.values(layers.RESOURCE)) {
    assert.deepEqual(Object.keys(value), ["id", "name"]);
  }
});

test("optional overlays and LAYERS preserve complete layer definitions", () => {
  for (const name of ["ANIMAL", "SPIRIT", "SHADOWLAND", "CRIME"]) {
    assert.deepEqual(
      Object.values(layers[name]).map(({ id, name: label }) => [id, label]),
      [[0, "none"], [1, "low"], [2, "medium"], [3, "high"], [4, "extreme"]],
    );
  }
  assert.deepEqual(
    Object.values(layers.FERTILITY).map(({ id, name }) => [id, name]),
    [[0, "none"], [1, "low"], [2, "medium"], [3, "high"]],
  );

  const expected = [
    ["TERRAIN", "terrain", "Terrain Layer"], ["CLIMATE", "climate", "Climate Layer"],
    ["VEGETATION", "vegetation", "Vegetation Layer"], ["RIVER", "river", "River Layer"],
    ["INFRASTRUCTURE", "infrastructure", "Infrastructure Layer"], ["CLAN", "clan", "Clan Layer"],
    ["SETTLEMENT", "settlement", "Settlement Layer"], ["RESOURCE", "resource", "Resource Layer"],
    ["ANIMAL", "animal", "Animal Layer"], ["SPIRIT", "spirit", "Spirit Layer"],
    ["SHADOWLAND", "shadowland", "Shadowland Layer"], ["CRIME", "crime", "Crime Layer"],
    ["FERTILITY", "fertility", "Land Fertility Layer"],
  ];
  assert.deepEqual(
    Object.values(layers.LAYERS).map(({ id, name }) => [id, name]),
    expected.map(([, id, name]) => [id, name]),
  );
  for (const [key] of expected) {
    const definition = layers.LAYERS[key];
    assert.ok(Object.isFrozen(definition));
    assert.deepEqual(definition.values, Object.values(layers[key]));
    assert.equal(definition.getValue(0), Object.values(layers[key])[0]);
  }
  assert.equal(layers.FERTILITY.EXTREME, undefined);
});

test("base tile mappings match all source tuples and reference existing assets", async () => {
  const base = await import("../docs/scripts/world-map-img-base-layers.js");
  const original = JSON.parse(await readFile(new URL("../docs/data/map_tile_img.json", import.meta.url)));
  const tuples = base.TILE_IMAGE_MAPPINGS.map(({ terrain, climate, vegetation, image }) => [
    terrain.id, climate.id, vegetation.id, image,
  ]);

  assert.equal(tuples.length, 66);
  assert.equal(new Set(tuples.map(([terrain, climate, vegetation]) =>
    `${terrain},${climate},${vegetation}`)).size, tuples.length);
  assert.deepEqual(tuples, original.map(({ terrain, climate, vegetation, image }) =>
    [terrain, climate, vegetation, image]));

  const baseModuleUrl = new URL("../docs/scripts/world-map-img-base-layers.js", import.meta.url);
  for (const { image } of [...base.TILE_IMAGE_MAPPINGS, ...base.BASE_LAYER_CONTROL_IMAGES]) {
    await access(fileURLToPath(new URL(image, baseModuleUrl)));
  }
});

test("base tile lookup disables water vegetation and uses flat art for cliffs", async () => {
  const { getTileImage } = await import("../docs/scripts/world-map-img-base-layers.js");

  assert.equal(
    getTileImage(layers.TERRAIN.WATER, layers.CLIMATE.TEMPERATE, layers.VEGETATION.PRESENT),
    "../img/map/water_temperate_0.png",
  );
  assert.equal(
    getTileImage(layers.TERRAIN.CLIFF, layers.CLIMATE.TEMPERATE, layers.VEGETATION.PRESENT),
    "../img/map/flat_temperate_1.png",
  );
  assert.throws(
    () => getTileImage(layers.TERRAIN.FLAT, layers.CLIMATE.TEMPERATE, layers.CLIMATE.TROPICAL),
    TypeError,
  );
});

test("clan colors preserve source colors for each clan", async () => {
  const { getClanColors } = await import("../docs/scripts/clan-colors.js");
  const source = JSON.parse(await readFile(new URL("../docs/data/layers.json", import.meta.url)));

  for (const entry of source.layers.clan.values) {
    const clan = layers.LAYERS.CLAN.getValue(entry.id);
    assert.deepEqual(getClanColors(clan), { border: entry.border, fill: entry.fill });
  }
  assert.throws(() => getClanColors(layers.TERRAIN.FLAT), TypeError);
});

test("resource image mappings preserve all 39 source assets", async () => {
  const resources = await import("../docs/scripts/world-map-img-resources.js");
  const source = JSON.parse(await readFile(new URL("../docs/data/layers.json", import.meta.url)));
  const entries = source.layers.resource.values.filter(({ id }) => id !== 0);

  assert.equal(resources.RESOURCE_IMAGES.length, 39);
  assert.equal(resources.RESOURCE_MARKER_SIZE, 12);
  for (const { id, image } of entries.map(({ id, image }) => ({ id, image }))) {
    const resource = layers.LAYERS.RESOURCE.getValue(id);
    assert.equal(resources.getResourceImage(resource), image);
    await access(fileURLToPath(new URL(image, new URL("../docs/scripts/world-map-img-resources.js", import.meta.url))));
  }
  assert.equal(resources.getResourceImage(layers.RESOURCE.NONE), undefined);
  assert.throws(() => resources.getResourceImage(layers.CLAN.CRAB), TypeError);
});

test("river drawing handles isolated, straight, corner, and junction cells", async () => {
  const { drawRiver } = await import("../docs/scripts/world-map-img-river.js");
  const draw = (neighbors) => {
    const strokes = [];
    let start;
    const ctx = {
      save() {},
      restore() {},
      beginPath() {},
      moveTo(x, y) { start = [x, y]; },
      lineTo(x, y) { strokes.push([start, [x, y]]); },
      stroke() {},
    };
    drawRiver(ctx, 1, 2, 16, neighbors);
    return strokes;
  };
  const neighbors = (changes = {}) => ({
    east: false, south: false, west: false, north: false, ...changes,
  });

  assert.equal(draw(neighbors()).length, 10);
  const straight = draw(neighbors({ east: true }));
  assert.equal(straight.length, 5);
  assert.equal(straight[0][0][0], 24);
  assert.equal(straight[0][1][0], 40);
  assert.equal(straight[0][0][1], straight[0][1][1]);
  assert.equal(draw(neighbors({ east: true, south: true })).length, 10);
  assert.equal(draw(neighbors({ east: true, south: true, west: true, north: true })).length, 10);
  assert.throws(() => drawRiver({}, 0, 0, 16, {}), TypeError);
});

test("infrastructure drawing preserves roads, footpaths, and port markers", async () => {
  const { drawInfrastructure } = await import("../docs/scripts/world-map-img-infrastructure.js");
  const record = (value, changes = {}) => {
    const calls = { strokes: [], text: [] };
    let start;
    const ctx = {
      save() {},
      restore() {},
      beginPath() {},
      moveTo(x, y) { start = [x, y]; },
      lineTo(x, y) { calls.strokes.push({ start, end: [x, y], width: this.lineWidth, color: this.strokeStyle }); },
      stroke() {},
      fillText(text, x, y) { calls.text.push({ text, x, y, color: this.fillStyle }); },
    };
    drawInfrastructure(ctx, 1, 2, 16, value, {
      east: false, south: false, southeast: false, northeast: false, ...changes,
    });
    return calls;
  };

  const road = record(layers.INFRASTRUCTURE.ROAD, { east: true, northeast: true });
  assert.deepEqual(road.strokes.map(({ end }) => end), [[40, 40], [40, 24]]);
  assert.deepEqual(road.strokes.map(({ width }) => width), [3, 3]);
  assert.deepEqual(record(layers.INFRASTRUCTURE.FOOTPATH, { south: true }).strokes.map(({ width }) => width), [1.5]);
  assert.deepEqual(record(layers.INFRASTRUCTURE.SMALL_PORT).text, [
    { text: "p", x: 17, y: 33, color: "#D2B48C" },
  ]);
  assert.deepEqual(record(layers.INFRASTRUCTURE.LARGE_PORT).text.map(({ text, color }) => [text, color]), [
    ["P", "#8B4513"],
  ]);
});

test("settlement assets resolve before procedural circular markers", async () => {
  const settlementModule = await import("../docs/scripts/world-map-img-settlements.js");
  const baseUrl = new URL("../docs/scripts/world-map-img-settlements.js", import.meta.url);

  assert.deepEqual(
    settlementModule.SETTLEMENT_ASSETS.map(({ settlement }) => settlement),
    [layers.SETTLEMENT.SMALL_SHRINE, layers.SETTLEMENT.LARGE_SHRINE, layers.SETTLEMENT.SMALL_TEMPLE, layers.SETTLEMENT.LARGE_TEMPLE],
  );
  for (const { image } of settlementModule.SETTLEMENT_ASSETS) {
    await access(fileURLToPath(new URL(image, baseUrl)));
  }
  assert.equal(settlementModule.getSettlementAsset(layers.SETTLEMENT.SMALL_SHRINE), "../img/map/shrine.png");
  assert.equal(settlementModule.getSettlementAsset(layers.SETTLEMENT.VILLAGE), undefined);
  assert.equal(settlementModule.getSettlementAsset(layers.SETTLEMENT.SMALL_TEMPLE), "../img/map/temple.webp");
  assert.equal(
    settlementModule.drawSettlementMarker({}, layers.SETTLEMENT.SMALL_SHRINE, { complete: false }, 8, 10, 1, null, {}),
    false,
  );

  const marker = (settlement) => {
    const arcs = [];
    const ctx = {
      save() {}, restore() {}, beginPath() {}, fill() {}, stroke() {}, moveTo() {}, lineTo() {},
      arc(x, y, radius) { arcs.push([x, y, radius]); },
    };
    const drawn = settlementModule.drawCircularSettlement(ctx, settlement, 8, 10, 0.5);
    return { drawn, arcs, lineWidth: ctx.lineWidth, fillStyle: ctx.fillStyle, strokeStyle: ctx.strokeStyle };
  };
  assert.deepEqual(marker(layers.SETTLEMENT.VILLAGE), {
    drawn: true, arcs: [[8, 10, 3]], lineWidth: 2, fillStyle: "#DDDDDD", strokeStyle: "#444444",
  });
  assert.equal(marker(layers.SETTLEMENT.CITY).arcs[0][2], 5);
  assert.deepEqual(marker(layers.SETTLEMENT.CAPITAL).arcs.map((arc) => arc[2]), [5, 1.5]);
  assert.equal(marker(layers.SETTLEMENT.VILLAGE_RUINS).arcs[0][2], 3);
  assert.equal(marker(layers.SETTLEMENT.CASTLE).drawn, false);
  assert.throws(() => settlementModule.drawCircularSettlement({}, layers.CLIMATE.TEMPERATE, 0, 0, 1), TypeError);
  const arcs = [];
  assert.equal(settlementModule.drawSettlementMarker({
    save() {}, restore() {}, beginPath() {}, arc(_x, _y, radius) { arcs.push(radius); }, fill() {}, stroke() {},
  }, layers.SETTLEMENT.VILLAGE, null, 8, 10, 1), true);
  assert.deepEqual(arcs, [3]);
});

test("square settlements retain sizes, ruins, academy, and watchtower cues", async () => {
  const { drawSquareSettlement } = await import("../docs/scripts/world-map-img-settlements.js");
  const marker = (settlement) => {
    const calls = { fills: [], outlines: [], arcs: [], points: [], text: [] };
    const ctx = {
      save() {}, restore() {}, beginPath() {}, closePath() {}, stroke() {}, fill() {},
      moveTo(x, y) { calls.points.push([x, y]); },
      lineTo(x, y) { calls.points.push([x, y]); },
      fillRect(...rect) { calls.fills.push(rect); },
      strokeRect(...rect) { calls.outlines.push(rect); },
      arc(x, y, radius) { calls.arcs.push([x, y, radius]); },
      fillText(text) { calls.text.push(text); },
    };
    calls.drawn = drawSquareSettlement(ctx, settlement, 8, 10, 0.5);
    return calls;
  };

  assert.deepEqual(marker(layers.SETTLEMENT.FORTIFICATION).fills, [[5, 7, 6, 6]]);
  assert.deepEqual(marker(layers.SETTLEMENT.CASTLE).outlines, [[3, 5, 10, 10]]);
  assert.deepEqual(marker(layers.SETTLEMENT.KYUDEN).arcs, [[8, 10, 1.5]]);
  assert.deepEqual(marker(layers.SETTLEMENT.CASTLE_RUINS).points, [[3, 15], [13, 5]]);
  assert.deepEqual(marker(layers.SETTLEMENT.ACADEMY).text, ["A"]);
  const watchtower = marker(layers.SETTLEMENT.WATCHTOWER);
  assert.deepEqual(watchtower.points, [[8, 5], [12, 9], [4, 9]]);
  assert.deepEqual(watchtower.fills, [[5.5, 9, 5, 6]]);
  assert.equal(marker(layers.SETTLEMENT.CITY).drawn, false);
});

test("shrine and temple tinting preserves asset sizes and label sizes", async () => {
  const settlements = await import("../docs/scripts/world-map-img-settlements.js");
  const expectedLabels = [
    [layers.SETTLEMENT.VILLAGE, 6], [layers.SETTLEMENT.CITY, 8], [layers.SETTLEMENT.CAPITAL, 10],
    [layers.SETTLEMENT.FORTIFICATION, 6], [layers.SETTLEMENT.CASTLE, 8], [layers.SETTLEMENT.KYUDEN, 10],
    [layers.SETTLEMENT.SMALL_SHRINE, 6], [layers.SETTLEMENT.LARGE_SHRINE, 8],
    [layers.SETTLEMENT.VILLAGE_RUINS, 6], [layers.SETTLEMENT.CASTLE_RUINS, 8],
    [layers.SETTLEMENT.ACADEMY, 6], [layers.SETTLEMENT.WATCHTOWER, 6],
    [layers.SETTLEMENT.SMALL_TEMPLE, 6], [layers.SETTLEMENT.LARGE_TEMPLE, 8],
  ];
  assert.deepEqual(
    settlements.SETTLEMENT_LABEL_SIZES.map(({ settlement, size }) => [settlement, size]),
    expectedLabels,
  );
  assert.equal(settlements.getSettlementLabelSize(layers.SETTLEMENT.NONE), 6);
  assert.throws(() => settlements.getSettlementLabelSize(layers.CLAN.CRAB), TypeError);

  const originalDocument = globalThis.document;
  const createdCanvases = [];
  globalThis.document = {
    createElement(name) {
      assert.equal(name, "canvas");
      const canvas = {
        context: null,
        getContext() { return this.context; },
      };
      canvas.context = {
        drawImage(...args) { canvas.sourceDraw = args; },
        fillRect(...args) { canvas.tintRect = args; },
      };
      createdCanvases.push(canvas);
      return canvas;
    },
  };
  try {
    const source = { complete: true, naturalWidth: 20, naturalHeight: 12, src: "settlement-asset" };
    const draws = [];
    const ctx = { drawImage(...args) { draws.push(args); } };
    const cache = {};
    assert.equal(settlements.drawSettlementAsset(ctx, layers.SETTLEMENT.SMALL_SHRINE, source, 8, 10, "#123456", cache), true);
    assert.equal(settlements.drawSettlementAsset(ctx, layers.SETTLEMENT.SMALL_SHRINE, source, 8, 10, "#123456", cache), true);
    assert.equal(createdCanvases.length, 1);
    assert.deepEqual([createdCanvases[0].width, createdCanvases[0].height], [15, 9]);
    assert.equal(createdCanvases[0].context.globalCompositeOperation, "source-in");
    assert.equal(createdCanvases[0].context.fillStyle, "#123456");
    assert.equal(settlements.drawSettlementAsset(ctx, layers.SETTLEMENT.LARGE_SHRINE, source, 8, 10, "#123456", cache), true);
    assert.deepEqual([createdCanvases[1].width, createdCanvases[1].height], [20, 12]);
    assert.equal(settlements.drawSettlementAsset(ctx, layers.SETTLEMENT.SMALL_TEMPLE, source, 8, 10, "#123456", cache), true);
    assert.equal(settlements.drawSettlementAsset(ctx, layers.SETTLEMENT.LARGE_TEMPLE, source, 8, 10, "#123456", cache), true);
    assert.deepEqual(createdCanvases.slice(2).map(({ width, height }) => [width, height]), [[12, 12], [16, 16]]);
    assert.deepEqual(draws[0].slice(1), [0.5, 5.5]);
    assert.equal(settlements.drawSettlementAsset(ctx, layers.SETTLEMENT.VILLAGE, source, 8, 10, "#123456", cache), false);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
