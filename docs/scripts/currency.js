// House rates: 1 koku = 5 bu = 50 zeni; 1 bu = 10 zeni.
const L5RCurrency = {
  KOKU_TO_ZENI: 50,
  BU_TO_ZENI: 10,

  toZeni({ koku = 0, bu = 0, zeni = 0 } = {}) {
    return koku * L5RCurrency.KOKU_TO_ZENI + bu * L5RCurrency.BU_TO_ZENI + zeni;
  },

  fromZeni(totalZeni) {
    const koku = Math.floor(totalZeni / L5RCurrency.KOKU_TO_ZENI);
    const remainder = totalZeni - koku * L5RCurrency.KOKU_TO_ZENI;
    const bu = Math.floor(remainder / L5RCurrency.BU_TO_ZENI);
    const zeni = remainder - bu * L5RCurrency.BU_TO_ZENI;
    return { koku, bu, zeni };
  }
};
