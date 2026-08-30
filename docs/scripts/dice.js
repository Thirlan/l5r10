// Shared L5R roll/keep dice helper. Config: { roll, keep, mod?, rerollOnes?, explodeOnNines? }.
const L5RDice = {
  rollOne(cfg) {
    let d = 1 + Math.floor(Math.random() * 10);
    if (cfg.rerollOnes && d === 1) d = 1 + Math.floor(Math.random() * 10);
    let total = d;
    while (d === 10 || (cfg.explodeOnNines && d === 9)) {
      d = 1 + Math.floor(Math.random() * 10);
      total += d;
    }
    return total;
  },

  rollKeep(cfg) {
    const results = [];
    for (let i = 0; i < cfg.roll; i++) results.push(L5RDice.rollOne(cfg));
    results.sort((a, b) => b - a);
    return results.slice(0, cfg.keep).reduce((s, v) => s + v, 0) + (cfg.mod || 0);
  }
};
