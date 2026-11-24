/**
 * @typedef {{ id: string, name: string, category: string, zeni: number, zeniMax?: number, note?: string, minSettlement?: string, settlementTypes?: string[], clans?: string[] }} ShopItem
 * @typedef {{ clan: string, settlement: string, settlementType: string }} ShopContext
 * @typedef {{ koku: number, bu: number, zeni: number }} Money
 */

function assertObject(value, label) {
  if (typeof value !== "object" || value === null) {
    throw new TypeError(`${label} must be an object`);
  }
}

function findById(list, id, label) {
  const found = list.find((entry) => entry.id === id);
  if (!found) {
    throw new RangeError(`Unknown ${label}: ${id}`);
  }
  return found;
}

/**
 * Convert a money amount to zeni.
 * @param {Money} money
 * @param {{ zeniPerBu: number, zeniPerKoku: number }} rules
 * @returns {number}
 */
export function toZeni(money, rules) {
  assertObject(money, "money");
  assertObject(rules, "rules");
  return money.koku * rules.zeniPerKoku + money.bu * rules.zeniPerBu + money.zeni;
}

/**
 * Split a zeni amount into koku, bu and zeni. A negative amount gives negative parts.
 * @param {number} totalZeni
 * @param {{ zeniPerBu: number, zeniPerKoku: number }} rules
 * @returns {Money}
 */
export function fromZeni(totalZeni, rules) {
  if (!Number.isFinite(totalZeni)) {
    throw new TypeError("totalZeni must be a finite number");
  }
  const sign = totalZeni < 0 ? -1 : 1;
  const absolute = Math.abs(Math.round(totalZeni));
  const koku = Math.floor(absolute / rules.zeniPerKoku);
  const remainder = absolute - koku * rules.zeniPerKoku;
  const bu = Math.floor(remainder / rules.zeniPerBu);
  const zeni = remainder - bu * rules.zeniPerBu;
  return { koku: koku * sign, bu: bu * sign, zeni: zeni * sign };
}

/**
 * Get the unit price of an item in zeni for a place.
 * @param {ShopItem} item
 * @param {ShopContext} context
 * @param {object} rules
 * @param {boolean} highQuality
 * @returns {number}
 */
export function getUnitPrice(item, context, rules, highQuality = false) {
  assertObject(item, "item");
  assertObject(context, "context");
  assertObject(rules, "rules");

  // Multipliers
  const settlement = findById(rules.settlements, context.settlement, "settlement");
  const settlementType = findById(rules.settlementTypes, context.settlementType, "settlement type");
  const typeCategory = settlementType.categoryMultipliers?.[item.category] ?? 1;
  const clanCategory = rules.clanCategoryMultipliers?.[context.clan]?.[item.category] ?? 1;
  const quality = highQuality ? rules.highQualityMultiplier : 1;

  // Computation
  const price = item.zeni * settlement.priceMultiplier * settlementType.priceMultiplier * typeCategory * clanCategory * quality;
  return Math.max(1, Math.round(price));
}

/**
 * Check whether an item can be bought at a place.
 * @param {ShopItem} item
 * @param {ShopContext} context
 * @param {object} rules
 * @param {boolean} highQuality
 * @returns {boolean}
 */
export function isAvailable(item, context, rules, highQuality = false) {
  assertObject(item, "item");
  assertObject(context, "context");
  assertObject(rules, "rules");

  // Validation of the place
  const settlement = findById(rules.settlements, context.settlement, "settlement");
  const settlementType = findById(rules.settlementTypes, context.settlementType, "settlement type");
  const effectiveRank = settlement.rank + settlementType.rank;

  // Item restrictions
  if (item.clans && !item.clans.includes(context.clan)) {
    return false;
  }
  if (item.settlementTypes && !item.settlementTypes.includes(context.settlementType)) {
    return false;
  }
  if (item.minSettlement) {
    const required = findById(rules.settlements, item.minSettlement, "settlement");
    if (effectiveRank < required.rank) {
      return false;
    }
  }
  if (highQuality && effectiveRank < rules.highQualityMinRank) {
    return false;
  }
  return true;
}

/**
 * Parse a text list. Each line can be "name", "2 name", "name x2" or "name, 2". Add "hq" for high quality.
 * @param {string} text
 * @returns {{ name: string, quantity: number, highQuality: boolean }[]}
 */
export function parseItemList(text) {
  if (typeof text !== "string") {
    throw new TypeError("text must be a string");
  }
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const highQuality = /\b(hq|high quality)\b/i.test(line);
      let name = line.replace(/\(?\b(hq|high quality)\b\)?/gi, "").trim();
      let quantity = 1;
      const leading = name.match(/^(\d+)\s*x?\s+(.+)$/i);
      const trailing = name.match(/^(.+?)\s*(?:,|x)\s*(\d+)$/i);
      if (leading) {
        quantity = Number(leading[1]);
        name = leading[2];
      } else if (trailing) {
        name = trailing[1];
        quantity = Number(trailing[2]);
      }
      return { name: name.trim(), quantity, highQuality };
    });
}

/**
 * Find an item by name. An exact match wins. A single prefix match is also accepted.
 * @param {ShopItem[]} items
 * @param {string} name
 * @returns {ShopItem | undefined}
 */
export function findItemByName(items, name) {
  const wanted = name.toLowerCase();
  const exact = items.find((item) => item.name.toLowerCase() === wanted);
  if (exact) {
    return exact;
  }
  const partial = items.filter((item) => item.name.toLowerCase().startsWith(wanted));
  return partial.length === 1 ? partial[0] : undefined;
}

/**
 * Get the price a merchant pays for each item in a text list.
 * @param {string} text
 * @param {ShopItem[]} items
 * @param {ShopContext} context
 * @param {object} rules
 * @returns {{ name: string, quantity: number, highQuality: boolean, item?: ShopItem, unitZeni: number, totalZeni: number }[]}
 */
export function priceSellList(text, items, context, rules) {
  const settlementType = findById(rules.settlementTypes, context.settlementType, "settlement type");
  const sellRatio = settlementType.sellRatio ?? rules.sellRatio;
  return parseItemList(text).map((entry) => {
    const item = findItemByName(items, entry.name);
    if (!item) {
      return { ...entry, unitZeni: 0, totalZeni: 0 };
    }
    const unitZeni = Math.floor(getUnitPrice(item, context, rules, entry.highQuality) * sellRatio);
    return { ...entry, name: item.name, item, unitZeni, totalZeni: unitZeni * entry.quantity };
  });
}
