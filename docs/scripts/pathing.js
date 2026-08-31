const MODE_FOOT = 'foot';
const MODE_BOAT = 'boat';
const MODE_SWIM = 'swim';

const MISHAP_PENALTY_MIN = 1440;
const DEATH_PENALTY = 10000;
const NO_TRAVEL_PAPERS_PENALTY = 10000;
const AVOID_CLAN_PENALTY = 1000;
const BOAT_BOARDING_MIN = 300;
const DIAGONAL_COST_MULTIPLIER = 1.41;

const DAY_START_MIN = 8 * 60;
const DAY_END_MIN = 18 * 60;
const MINUTES_PER_DAY = 24 * 60;

const WATER_TERRAINS = new Set(['Water', 'Ocean', 'Deep Ocean']);

// Mode-aware A* + trip simulator. Consumes a small map-query interface so it stays UI-agnostic.
// Config: { getTerrain, getTileData, getClan, skillConfig, travelPapers, avoidClans, includeRisk, includeMoney }
class L5RPathing {
  constructor({ getTerrain, getTileData, getClan = () => null, skillConfig, travelPapers = {}, avoidClans = {}, includeRisk = false, includeMoney = false }) {
    this.getTerrain = getTerrain;
    this.getTileData = getTileData;
    this.getClan = getClan;
    this.skillConfig = skillConfig;
    this.travelPapers = travelPapers;
    this.avoidClans = avoidClans;
    this.includeRisk = includeRisk;
    this.includeMoney = includeMoney;
    this._probCache = new Map();
  }

  // Assume travellers starting on a water tile are aboard a boat unless the tile is a bridge (has a road).
  initialMode(cell) {
    const terrain = this.getTerrain(cell.x, cell.y);
    if (!terrain || !WATER_TERRAINS.has(terrain)) return MODE_FOOT;
    const data = this.getTileData(cell.x, cell.y, MODE_FOOT);
    return data && data.hasRoad ? MODE_FOOT : MODE_BOAT;
  }

  // Returns every valid { toMode, cost, zeni, checks, avoidPenalty } for entering `to` from `from` in `fromMode`.
  transitions(from, fromMode, to) {
    const results = [];
    for (const toMode of [MODE_FOOT, MODE_BOAT, MODE_SWIM]) {
      const t = this.transitionAs(from, fromMode, to, toMode);
      if (t) results.push(t);
    }
    return results;
  }

  // Returns a movement transition, or null if the move isn't allowed.
  transitionAs(from, fromMode, to, toMode) {
    const fromT = this.getTerrain(from.x, from.y);
    const toT = this.getTerrain(to.x, to.y);
    if (!fromT || !toT) return null;
    const toData = this.getTileData(to.x, to.y, toMode);
    if (!toData || toData.cost === null) return null;

    const toWater = WATER_TERRAINS.has(toT);
    const tileProb = toData.prob ?? 1;
    const sailingCheck = { skill: 'sailing', tn: toData.tn, timePenalty: MISHAP_PENALTY_MIN, riskPenalty: MISHAP_PENALTY_MIN, probability: tileProb };
    const swimCheck = { skill: 'swim', tn: this.skillConfig.swim.tn, timePenalty: 0, riskPenalty: DEATH_PENALTY, probability: 1 };
    const tileCheck = (toData.skill && toData.tn !== null) ? { skill: toData.skill, tn: toData.tn, penalty: MISHAP_PENALTY_MIN, probability: tileProb } : null;
    if (tileCheck) {
      tileCheck.timePenalty = MISHAP_PENALTY_MIN;
      tileCheck.riskPenalty = MISHAP_PENALTY_MIN;
      delete tileCheck.penalty;
    }
    const clan = this.getClan(to.x, to.y);
    const crossedClanBorderOnRoad = this.getClan(from.x, from.y) !== clan && toData.hasRoad;
    const enteredClanCity = toT === 'City';
    const territorialCheck = clan && (crossedClanBorderOnRoad || enteredClanCity) && !this.travelPapers[clan]
      ? { skills: ['sneak', 'forgery'], tn: 20, timePenalty: 0, riskPenalty: NO_TRAVEL_PAPERS_PENALTY, probability: 1 }
      : null;
    const transition = (checks = []) => ({
      toMode,
      cost: toData.cost,
      zeni: toData.zeni ?? 0,
      checks: [...checks, ...(territorialCheck ? [territorialCheck] : [])],
      avoidPenalty: clan && this.avoidClans[clan] ? AVOID_CLAN_PENALTY : 0
    });

    if (toMode === MODE_FOOT) {
      if (fromMode === MODE_FOOT) {
        if (!toWater) return transition(tileCheck ? [tileCheck] : []);
        // Water tile requires a bridge for foot travel.
        if (toData.hasRoad) return transition(tileCheck ? [tileCheck] : []);
        return null;
      }
      if (fromMode === MODE_BOAT) return toT === 'City' ? transition(tileCheck ? [tileCheck] : []) : null;
      if (fromMode === MODE_SWIM) return !toWater ? transition(tileCheck ? [tileCheck] : []) : null;
      return null;
    }
    if (toMode === MODE_BOAT) {
      if (fromMode === MODE_FOOT) {
        if (fromT === 'City' && toWater) {
          const result = transition([sailingCheck]);
          result.cost += BOAT_BOARDING_MIN;
          return result;
        }
        return null;
      }
      if (fromMode === MODE_BOAT) return toWater ? transition([sailingCheck]) : null;
      return null;
    }
    if (toMode === MODE_SWIM) {
      if (fromMode === MODE_FOOT) {
        if (toT === 'Water' && this.skillConfig.swim.allowed) return transition([swimCheck]);
        return null;
      }
      if (fromMode === MODE_SWIM) return toT === 'Water' ? transition([swimCheck]) : null;
      return null;
    }
    return null;
  }

  // P(mishap) = P(check triggered) * P(fail the check). Fail probability is Monte-Carlo cached per skill/TN/config.
  mishapProbability(check) {
    if (!check) return 0;
    const skill = this.checkSkill(check);
    if (!skill) return check.probability ?? 1;
    const cfg = this.skillConfig[skill];
    if (!cfg) return 0;
    const cacheKey = `${skill}|${check.tn}|${cfg.roll}|${cfg.keep}|${cfg.mod}|${cfg.rerollOnes ? 1 : 0}|${cfg.explodeOnNines ? 1 : 0}`;
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

  checkSkill(check) {
    if (!check.skills) return check.skill;
    const allowedSkills = check.skills.filter((skill) => this.skillConfig[skill]?.allowed);
    return allowedSkills.length
      ? allowedSkills.reduce((best, candidate) => this.skillScore(candidate) > this.skillScore(best) ? candidate : best)
      : null;
  }

  skillScore(skill) {
    const cfg = this.skillConfig[skill];
    const keepScore = 5*cfg.keep;
    const unkeptScore = 2*(cfg.roll-cfg.keep);
    const rerollOnesScore = cfg.rerollOnes? cfg.roll : 0;
    const explodeOnNinesScore = cfg.explodeOnNines? 2*cfg.roll : 0;
    return cfg ? keepScore + unkeptScore + rerollOnesScore + explodeOnNinesScore + cfg.mod : -Infinity;
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
        for (const trans of this.transitions(cur.cell, cur.mode, next)) {
          const diag = dx !== 0 && dy !== 0;
          let step = Math.round(trans.cost * (diag ? DIAGONAL_COST_MULTIPLIER : 1));
          if (this.includeMoney) step += trans.zeni;
          if (this.includeRisk) {
            step += trans.avoidPenalty;
            step += trans.checks.reduce((risk, check) => risk + this.mishapProbability(check) * check.riskPenalty, 0);
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
    }
    return null;
  }

  // Walks a mode-tagged path, rolling skill dice per step and accumulating time, cost, mishaps, day markers.
  simulate(path) {
    const mishaps = new Set();
    const dayMarkers = new Map();
    const events = [];
    let totalMinutes = 0;
    let totalZeni = 0;
    let clock = DAY_START_MIN;
    let daysElapsed = 0;

    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1];
      const to = path[i];
      const trans = this.transitionAs(from, from.mode, to, to.mode);
      if (!trans) continue;
      const diag = from.x !== to.x && from.y !== to.y;
      let tileMinutes = Math.round(trans.cost * (diag ? DIAGONAL_COST_MULTIPLIER : 1));
      const eventDay = Math.floor((clock - DAY_START_MIN) / MINUTES_PER_DAY) + 1;
      const toData = this.getTileData(to.x, to.y, from.mode);
      const clan = this.getClan(to.x, to.y) || '';
      const eventRows = [];

      for (const check of trans.checks) {
        const skill = this.checkSkill(check);
        const cfg = this.skillConfig[skill];
        if (Math.random() >= (check.probability ?? 1)) continue;
        const result = cfg ? L5RDice.rollKeep(cfg) : 0;
        const failsCheck = !cfg || result < check.tn;
        if (failsCheck) {
          mishaps.add(`${to.x},${to.y}`);
          tileMinutes += check.timePenalty;
        }
        const event = this.eventName(check, toData.terrain);
        if (event) eventRows.push({ event, skill: skill || '', tn: check.tn, result });
      }

      totalMinutes += tileMinutes;
      totalZeni += toData?.zeni ?? 0;
      if (!eventRows.length) eventRows.push({ event: 'Travel', skill: '', tn: '', result: '' });
      eventRows.forEach((event, index) => events.push({
        day: eventDay,
        coord: `${to.x},${to.y}`,
        event: event.event,
        mode: to.mode[0].toUpperCase() + to.mode.slice(1),
        terrain: toData.terrain,
        clan,
        skill: event.skill,
        tn: event.tn,
        result: event.result,
        cost: index === 0 && toData?.zeni ? `${toData.zeni} zeni` : ''
      }));
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
      }

      // Day markers roll over at 08:00, whether we slept overnight or sailed through it.
      const newDays = Math.floor((clock - DAY_START_MIN) / MINUTES_PER_DAY);
      if (newDays > daysElapsed) {
        daysElapsed = newDays;
        dayMarkers.set(`${to.x},${to.y}`, `${daysElapsed}d`);
      }
    }

    return { path, totalMinutes, totalZeni, mishaps, dayMarkers, events };
  }

  eventName(check, terrain) {
    if (check.skills) return 'Papers';
    if (check.skill === 'survival') return 'Survival';
    if (check.skill === 'investigate' && terrain === 'City') return 'Pick Pocket';
    return '';
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
        return { path: [], totalMinutes: 0, totalZeni: 0, mishaps: new Set(), dayMarkers: new Map(), events: [], failed: true, failedSegment: i };
      }
      for (let j = 1; j < segment.length; j++) combined.push(segment[j]);
      currentMode = segment[segment.length - 1].mode;
    }
    return this.simulate(combined);
  }
}
