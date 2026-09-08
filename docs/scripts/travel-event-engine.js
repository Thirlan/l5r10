class TravelEventEngine {
  static defaultSkillConfig() {
    return {
      survival:    { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false },
      sailing:     { roll: 6, keep: 3, mod: 0, rerollOnes: false, explodeOnNines: false },
      investigate: { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false },
      swim:        { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false, allowed: false, tn: 20 },
      sneak:       { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false, allowed: false },
      forgery:     { roll: 3, keep: 2, mod: 0, rerollOnes: false, explodeOnNines: false, allowed: false }
    };
  }

  constructor(skillConfig) {
    this.skillConfig = skillConfig;
    this._probCache = new Map();
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
    if (!cfg) return -Infinity;
    const keepScore = 5 * cfg.keep;
    const unkeptScore = 2 * (cfg.roll - cfg.keep);
    const rerollOnesScore = cfg.rerollOnes ? cfg.roll : 0;
    const explodeOnNinesScore = cfg.explodeOnNines ? 2 * cfg.roll : 0;
    return keepScore + unkeptScore + rerollOnesScore + explodeOnNinesScore + cfg.mod;
  }

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

  resolveCheck(check, terrain) {
    const skill = this.checkSkill(check);
    const cfg = this.skillConfig[skill];
    if (Math.random() >= (check.probability ?? 1)) return null;
    const result = cfg ? L5RDice.rollKeep(cfg) : 0;
    return {
      event: this.eventName(check, terrain),
      skill: skill || '',
      tn: check.tn,
      result,
      failed: !cfg || result < check.tn
    };
  }

  eventName(check, terrain) {
    if (check.skills) return 'Papers';
    if (check.skill === 'survival') return 'Survival';
    if (check.skill === 'investigate' && terrain === 'City') return 'Pick Pocket';
    return '';
  }
}
