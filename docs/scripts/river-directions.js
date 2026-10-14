import { TERRAIN } from "./world-map-layers.js";
import { RIVER_OFFSETS } from "./world-map-img-river.js";

const SEARCH_ORDER = [0, 2, 4, 6, 1, 3, 5, 7];

/**
 * @param {Object<string, Object>} grid Map cells. Existing directions stay unchanged.
 * @returns {void}
 */
export function inferRiverDirections(grid) {
  const remaining = new Set(Object.keys(grid).filter((key) => grid[key].river));
  const neighbors = (key) => {
    const [x, y] = key.split(",").map(Number);
    return SEARCH_ORDER.map((direction) => {
      const [, dx, dy] = RIVER_OFFSETS[direction];
      return { key: `${x + dx},${y + dy}`, direction };
    });
  };
  const assign = (key, direction) => {
    grid[key]["river direction"] ??= Object.fromEntries(
      RIVER_OFFSETS.map((_, index) => [index, Number(index === direction)]),
    );
  };
  const drain = (seeds) => {
    const queue = [];
    for (const { key, direction } of seeds) {
      if (!remaining.delete(key)) continue;
      assign(key, direction);
      queue.push(key);
    }
    for (let index = 0; index < queue.length; index++) {
      for (const neighbor of neighbors(queue[index])) {
        if (!remaining.delete(neighbor.key)) continue;
        assign(neighbor.key, (neighbor.direction + 4) % 8);
        queue.push(neighbor.key);
      }
    }
  };
  const waterSeeds = (keys, terrain) => [...keys].flatMap((key) => {
    const outlet = neighbors(key).find((neighbor) => grid[neighbor.key]?.terrain === terrain);
    return outlet ? [{ key, direction: outlet.direction }] : [];
  });
  drain(waterSeeds(remaining, TERRAIN.COASTAL_WATER.id));

  const highlandScore = (key) => [key, ...neighbors(key).map((neighbor) => neighbor.key)]
    .reduce((score, nearby) => score + (grid[nearby]?.terrain === TERRAIN.MOUNTAINS.id ? 2
      : Number(grid[nearby]?.terrain === TERRAIN.HILLS.id)), 0);
  while (remaining.size) {
    const component = [remaining.values().next().value];
    const distances = new Map([[component[0], 0]]);
    for (let index = 0; index < component.length; index++) {
      for (const neighbor of neighbors(component[index])) {
        if (!remaining.has(neighbor.key) || distances.has(neighbor.key)) continue;
        distances.set(neighbor.key, 0);
        component.push(neighbor.key);
      }
    }
    const source = component.reduce((best, key) => highlandScore(key) > highlandScore(best) ? key : best);
    const outlets = waterSeeds(component, TERRAIN.WATER.id);
    if (highlandScore(source) > 0 && outlets.length) {
      distances.clear();
      distances.set(source, 0);
      const queue = [source];
      for (let index = 0; index < queue.length; index++) {
        for (const neighbor of neighbors(queue[index])) {
          if (!remaining.has(neighbor.key) || distances.has(neighbor.key)) continue;
          distances.set(neighbor.key, distances.get(queue[index]) + 1);
          queue.push(neighbor.key);
        }
      }
      drain([outlets.reduce((best, outlet) =>
        distances.get(outlet.key) > distances.get(best.key) ? outlet : best)]);
    } else if (outlets.length) {
      drain(outlets);
    } else {
      // A disconnected river has no water outlet. Use the least elevated end.
      const end = component.reduce((best, key) => highlandScore(key) < highlandScore(best) ? key : best);
      const exits = neighbors(end).filter((neighbor) => !grid[neighbor.key]?.river);
      const exit = exits.reduce((best, neighbor) =>
        highlandScore(neighbor.key) < highlandScore(best.key) ? neighbor : best, exits[0]);
      drain([{ key: end, direction: exit?.direction ?? 0 }]);
    }
  }
}
