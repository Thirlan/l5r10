import { KM_PER_MILE } from "../data/world-map-data.const.js";

/** Distance units of the map viewer, as the number of units in one mile. */
export const DISTANCE_UNITS = Object.freeze({ miles: 1, km: KM_PER_MILE });

/** Tools of the map viewer. */
export const MAP_TOOLS = Object.freeze(["route", "measure", "pan"]);

/** Neighbor directions that a road or footpath can connect to. */
export const ROAD_DIRECTIONS = Object.freeze(["east", "south", "southeast", "northeast"]);

/** Neighbor directions that a river line can connect to. */
export const RIVER_DIRECTIONS = Object.freeze(["east", "south", "west", "north"]);

/** Position of each river stripe (bank, water, bank), relative to the river center line. */
export const RIVER_STRIPE_OFFSETS = Object.freeze([-1, 0, 1]);

/** Conservative width of a digit or minus sign, relative to the font size. */
export const LABEL_CHARACTER_WIDTH = 0.6;
