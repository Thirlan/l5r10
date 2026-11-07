/**
 * One tile of the world map, with the values of all layers.
 * A tile is a plain, read-only JavaScript object (a POJO). It has no methods and no logic.
 * Only world-map-data-tile-factory.js makes tiles. The factory reads the saved cell and sets the default values.
 *
 * @typedef {Readonly<Object>} WorldMapTile
 * @property {number} x Tile column.
 * @property {number} y Tile row.
 * @property {Readonly<Object>} terrain Catalog value of LAYERS.TERRAIN, for example TERRAIN.FLAT.
 * @property {Readonly<Object>} climate Catalog value of LAYERS.CLIMATE.
 * @property {Readonly<Object>} vegetation Catalog value of LAYERS.VEGETATION.
 * @property {Readonly<Object>} river Catalog value of LAYERS.RIVER.
 * @property {Readonly<Object>} infrastructure Catalog value of LAYERS.INFRASTRUCTURE.
 * @property {Readonly<Object>} clan Catalog value of LAYERS.CLAN.
 * @property {Readonly<Object>} settlement Catalog value of LAYERS.SETTLEMENT.
 * @property {Readonly<Object>} resource Catalog value of LAYERS.RESOURCE.
 * @property {Readonly<Object>} resourceLevel Catalog value of LAYERS.RESOURCE_LEVEL.
 * @property {Readonly<Object>} animal Catalog value of LAYERS.ANIMAL.
 * @property {Readonly<Object>} spirit Catalog value of LAYERS.SPIRIT.
 * @property {Readonly<Object>} shadowland Catalog value of LAYERS.SHADOWLAND.
 * @property {Readonly<Object>} crime Catalog value of LAYERS.CRIME.
 * @property {number} elevation Elevation in whole metres.
 * @property {readonly boolean[]} riverDirections Outgoing river flags. Index 0 is north, then clockwise to 7, northwest.
 * @property {string} englishName English name of the settlement, or an empty text.
 * @property {string} rokuganiName Rokugani name of the settlement, or an empty text.
 * @property {{englishText: string, rokuganiText: string, fontSize: number|null}|null} label Map label of the tile, or null. A null fontSize uses the renderer default.
 */

export {};
