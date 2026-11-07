/** Kilometres in one mile. */
export const KM_PER_MILE = 1.609344;

/** Metres in one kilometre. */
export const METERS_PER_KM = 1000;

/** Format of the map header field "lastUpdated" (YYYY/MM/DD). */
export const DATE_PATTERN = /^\d{4}\/\d{2}\/\d{2}$/;

/** Tile offsets [dx, dy] of the eight neighbors, clockwise from north. */
export const NEIGHBOR_OFFSETS = Object.freeze(
  [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
  ].map((offset) => Object.freeze(offset)),
);

/** River directions [name, dx, dy] in the order of the saved river flags: 0 is north, then clockwise. */
export const RIVER_OFFSETS = Object.freeze(["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"].map((name, direction) => Object.freeze([name, ...NEIGHBOR_OFFSETS[direction]])));
