import { KM_PER_MILE, METERS_PER_KM } from "./world-map-data.const.js";

/** Length of one map tile in miles. Miles is the core unit of map distance. */
export const MILES_PER_TILE = 5;

/** Length of one map tile in metres. */
export const METERS_PER_TILE = MILES_PER_TILE * KM_PER_MILE * METERS_PER_KM;

/** Elevation in metres of a tile that has no saved elevation. */
export const DEFAULT_ELEVATION = 1;

/** Smallest elevation difference in metres between two neighbors that makes a cliff. */
export const CLIFF_HEIGHT = 75;

/** Name of a new map. */
export const NEW_MAP_NAME = "Untitled map";

/** Version of a new map. */
export const NEW_MAP_VERSION = "0.1.0";
