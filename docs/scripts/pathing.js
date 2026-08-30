const MODE_FOOT = 'foot';
const MODE_BOAT = 'boat';
const MODE_SWIM = 'swim';

const MISHAP_PENALTY_MIN = 180;
const SWIM_PENALTY_MIN = 10000;
const BOAT_BOARDING_MIN = 300;
const DIAGONAL_COST_MULTIPLIER = 1.41;

const DAY_START_MIN = 8 * 60;
const DAY_END_MIN = 18 * 60;
const MINUTES_PER_DAY = 24 * 60;

const WATER_TERRAINS = new Set(['Water', 'Ocean', 'Deep Ocean']);

// Mode-aware A* + trip simulator. Consumes a small map-query interface so it stays UI-agnostic.
// Config: { getTerrain(x, y) -> string|null, getTileData(x, y) -> { terrain, cost, zeni, skill, tn }|null, skillConfig, strategy }
class L5RPathing {
  constructor({ getTerrain, getTileData, skillConfig, strategy = 'risky' }) {
    this.getTerrain = getTerrain;
    this.getTileData = getTileData;
    this.skillConfig = skillConfig;
    this.strategy = strategy;
    this._probCache = new Map();
  }

  // Assume travellers starting on a water tile are already aboard a boat.
  initialMode(cell) {
    const terrain = this.getTerrain(cell.x, cell.y);
    return terrain && WATER_TERRAINS.has(terrain) ? MODE_BOAT : MODE_FOOT;
  }

  // Returns { toMode, cost, check } for entering `to` from `from` in `fromMode`, or null if the move is forbidden.
  transition(from, fromMode, to) {
    const fromT = this.getTerrain(from.x, from.y);
    const toT = this.getTerrain(to.x, to.y);
    if (!fromT || !toT) return null;
    const toData = this.getTileData(to.x, to.y);
    if (!toData || toData.cost === null) return null;

    const toWater = WATER_TERRAINS.has(toT);
    const tileProb = toData.prob ?? 1;
    const sailingCheck = { skill: 'sailing', tn: toData.tn, penalty: MISHAP_PENALTY_MIN, probability: tileProb };
    const swimCheck = { skill: 'swim', tn: this.skillConfig.swim.tn, penalty: SWIM_PENALTY_MIN, probability: 1 };
    const tileCheck = (toData.skill && toData.tn !== null) ? { skill: toData.skill, tn: toData.tn, penalty: MISHAP_PENALTY_MIN, probability: tileProb } : null;

    if (fromMode === MODE_FOOT) {
      if (!toWater) return { toMode: MODE_FOOT, cost: toData.cost, check: tileCheck };
      if (fromT === 'City') return { toMode: MODE_BOAT, cost: toData.cost + BOAT_BOARDING_MIN, check: sailingCheck };
      if (toT === 'Water' && this.skillConfig.swim.allowed) return { toMode: MODE_SWIM, cost: toData.cost, check: swimCheck };
      return null;
    }
    if (fromMode === MODE_BOAT) {
      if (toWater) return { toMode: MODE_BOAT, cost: toData.cost, check: sailingCheck };
      if (toT === 'City') return { toMode: MODE_FOOT, cost: toData.cost, check: tileCheck };
      return null;
    }
    if (fromMode === MODE_SWIM) {
      if (toT === 'Water') return { toMode: MODE_SWIM, cost: toData.cost, check: swimCheck };
      if (!toWater) return { toMode: MODE_FOOT, cost: toData.cost, check: tileCheck };
      return null;
    }
    return null;
  }

  // P(mishap) = P(check triggered) * P(fail the check). Fail probability is Monte-Carlo cached per skill/TN/config.
  mishapProbability(check) {
    if (!check) return 0;
    const cfg = this.skillConfig[check.skill];
    if (!cfg) return 0;
    const cacheKey = `${check.skill}|${check.tn}|${cfg.roll}|${cfg.keep}|${cfg.mod}|${cfg.rerollOnes ? 1 : 0}|${cfg.explodeOnNines ? 1 : 0}`;
    let failProb;
    if (this._probCache.has(cacheKey)) {
      failProb = this._probCache.get(cacheKey);
    } else {
      const trials = 300;
      let fails = 0;
      for (let i = 0; i < trials; i++) if (L5RDice.rollKeep(cfg) < check.tn) fails++;
      failProb = fails / trials;
      this._probCache.set(cacheKey, failProb);
    }
    return (check.probability ?? 1) * failProb;
  }

  // Octile distance keeps the heuristic admissible for 8-connected movement.
  heuristic(a, b) {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return (Math.max(dx, dy) + (DIAGONAL_COST_MULTIPLIER - 1) * Math.min(dx, dy)) * 100;
  }

  findPath(start, end, startMode) {
    const key = (c, m) => `${c.x},${c.y}|${m}`;
    if (!this.getTerrain(start.x, start.y) || !this.getTerrain(end.x, end.y)) return null;

    const startKey = key(start, startMode);
    const gScore = new Map([[startKey, 0]]);
    const cameFrom = new Map();
    const open = new Map([[startKey, { cell: start, mode: startMode, f: this.heuristic(start, end) }]]);

    while (open.size) {
      let curKey = null;
      let cur = null;
      for (const [k, node] of open) {
        if (cur === null || node.f < cur.f) { cur = node; curKey = k; }
      }
      open.delete(curKey);

      if (cur.cell.x === end.x && cur.cell.y === end.y) {
        const path = [{ x: cur.cell.x, y: cur.cell.y, mode: cur.mode }];
        let k = curKey;
        while (cameFrom.has(k)) {
          k = cameFrom.get(k);
          const [xy, mode] = k.split('|');
          const [x, y] = xy.split(',').map(Number);
          path.unshift({ x, y, mode });
        }
        return path;
      }

      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const next = { x: cur.cell.x + dx, y: cur.cell.y + dy };
        const trans = this.transition(cur.cell, cur.mode, next);
        if (!trans) continue;
        const diag = dx !== 0 && dy !== 0;
        let step = Math.round(trans.cost * (diag ? DIAGONAL_COST_MULTIPLIER : 1));
        if (this.strategy === 'safe' && trans.check) {
          step += this.mishapProbability(trans.check) * trans.check.penalty;
        }
        const tentative = gScore.get(curKey) + step;
        const nk = key(next, trans.toMode);
        if (tentative < (gScore.get(nk) ?? Infinity)) {
          gScore.set(nk, tentative);
          cameFrom.set(nk, curKey);
          open.set(nk, { cell: next, mode: trans.toMode, f: tentative + this.heuristic(next, end) });
        }
      }
    }
    return null;
  }

  // Walks a mode-tagged path, rolling skill dice per step and accumulating time, cost, mishaps, day markers.
  simulate(path) {
    const mishaps = new Set();
    const dayMarkers = new Map();
    let totalMinutes = 0;
    let totalZeni = 0;
    let clock = DAY_START_MIN;
    let daysElapsed = 0;

    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1];
      const to = path[i];
      const trans = this.transition(from, from.mode, to);
      if (!trans) continue;
      const diag = from.x !== to.x && from.y !== to.y;
      let tileMinutes = Math.round(trans.cost * (diag ? DIAGONAL_COST_MULTIPLIER : 1));

      if (trans.check && Math.random() < (trans.check.probability ?? 1)) {
        const cfg = this.skillConfig[trans.check.skill];
        if (cfg && L5RDice.rollKeep(cfg) < trans.check.tn) {
          mishaps.add(`${to.x},${to.y}`);
          tileMinutes += trans.check.penalty;
        }
      }

      totalMinutes += tileMinutes;
      const toData = this.getTileData(to.x, to.y);
      totalZeni += toData?.zeni ?? 0;
      clock += tileMinutes;

      const timeOfDay = ((clock % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
      const pastSundown = timeOfDay >= DAY_END_MIN || timeOfDay < DAY_START_MIN;
      const nextTile = path[i + 1];
      const nextIsWater = nextTile && WATER_TERRAINS.has(this.getTerrain(nextTile.x, nextTile.y));
      if (pastSundown && nextTile && !nextIsWater) {
        const dayStart = clock - timeOfDay;
        const nextMorning = dayStart + MINUTES_PER_DAY + DAY_START_MIN;
        const sleep = nextMorning - clock;
        totalMinutes += sleep;
        clock = nextMorning;
        daysElapsed += 1;
        dayMarkers.set(`${to.x},${to.y}`, `${daysElapsed}d`);
      }
    }

    return { path, totalMinutes, totalZeni, mishaps, dayMarkers };
  }

  // Chains A* segments through the waypoints, keeping the transport mode continuous across segment boundaries.
  computeRoute(startCell, waypoints) {
    if (!startCell || !waypoints.length) return null;
    const anchors = [startCell, ...waypoints];
    let currentMode = this.initialMode(anchors[0]);
    const combined = [{ x: anchors[0].x, y: anchors[0].y, mode: currentMode }];
    for (let i = 1; i < anchors.length; i++) {
      const segment = this.findPath(anchors[i - 1], anchors[i], currentMode);
      if (!segment) {
        return { path: [], totalMinutes: 0, totalZeni: 0, mishaps: new Set(), dayMarkers: new Map(), failed: true, failedSegment: i };
      }
      for (let j = 1; j < segment.length; j++) combined.push(segment[j]);
      currentMode = segment[segment.length - 1].mode;
    }
    return this.simulate(combined);
  }
}
