// @ts-check

import { MapHeader } from "./world-map-data-header.js";

/** @typedef {Readonly<MapHeader>} MapHeaderReadOnly */

/** @type {new (data: ConstructorParameters<typeof MapHeader>[0]) => MapHeaderReadOnly} */
export const MapHeaderReadOnly = class MapHeaderReadOnly extends MapHeader {
  /** @param {ConstructorParameters<typeof MapHeader>[0]} data Header values to copy. */
  constructor(data) {
    super(data);
    Object.freeze(this);
  }
};
