import { fromZeni, getUnitPrice, isAvailable, priceSellList, toZeni } from "./shop-logic.js";

const ITEMS_URL = "../data/shop-items.json";
const RULES_URL = "../data/shop-rules.json";

/** @type {{ categories: string[], items: object[] }} */
let catalog;
/** @type {object} */
let rules;

const rowsById = new Map();

function formatMoney(zeniAmount) {
  const { koku, bu, zeni } = fromZeni(zeniAmount, rules);
  return `${koku} koku, ${bu} bu, ${zeni} zeni`;
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function fillSelect(select, options) {
  options.forEach((option) => {
    const element = document.createElement("option");
    element.value = option.id;
    element.textContent = option.name;
    select.append(element);
  });
}

function readContext() {
  return {
    clan: document.querySelector("#shop-clan").value,
    settlement: document.querySelector("#shop-settlement").value,
    settlementType: document.querySelector("#shop-settlement-type").value,
  };
}

function readMoney() {
  const readField = (selector) => Math.max(0, Number(document.querySelector(selector).value) || 0);
  return {
    koku: readField("#shop-money-koku"),
    bu: readField("#shop-money-bu"),
    zeni: readField("#shop-money-zeni"),
  };
}

function buildRow(item) {
  const row = document.createElement("tr");
  const nameCell = createCell(item.name);
  row.append(nameCell);

  const priceCells = ["koku", "bu", "zeni"].map(() => createCell(""));
  row.append(...priceCells);
  const noteCell = createCell("");
  row.append(noteCell);

  const quantityCell = document.createElement("td");
  const quantity = document.createElement("input");
  quantity.type = "number";
  quantity.min = "0";
  quantity.step = "1";
  quantity.value = "0";
  quantity.id = `shop-qty-${item.id}`;
  quantity.setAttribute("aria-label", `Quantity of ${item.name}`);
  quantityCell.append(quantity);

  const qualityCell = document.createElement("td");
  const quality = document.createElement("input");
  quality.type = "checkbox";
  quality.id = `shop-hq-${item.id}`;
  quality.setAttribute("aria-label", `High quality ${item.name}`);
  qualityCell.append(quality);

  row.append(quantityCell, qualityCell);
  rowsById.set(item.id, { item, row, priceCells, noteCell, quantity, quality });
  return row;
}

function renderTable() {
  const body = document.querySelector("#shop-body");
  catalog.categories.forEach((category) => {
    const headingRow = document.createElement("tr");
    const heading = document.createElement("th");
    heading.colSpan = 7;
    heading.scope = "colgroup";
    heading.textContent = category;
    headingRow.append(heading);
    body.append(headingRow);
    catalog.items.filter((item) => item.category === category).forEach((item) => body.append(buildRow(item)));
  });
}

function describeNote(item, context) {
  const parts = [];
  if (item.zeniMax) {
    const top = getUnitPrice({ ...item, zeni: item.zeniMax }, context, rules, false);
    parts.push(`up to ${formatMoney(top)}`);
  }
  if (item.note) {
    parts.push(item.note);
  }
  return parts.join("; ");
}

function refresh() {
  const context = readContext();
  let totalZeni = 0;
  const purchased = [];

  rowsById.forEach((entry) => {
    const available = isAvailable(entry.item, context, rules, false);
    const qualityAvailable = isAvailable(entry.item, context, rules, true);

    // Availability
    entry.row.classList.toggle("unavailable", !available);
    entry.quantity.disabled = !available;
    entry.quality.disabled = !qualityAvailable;
    if (!available) {
      entry.quantity.value = "0";
    }
    if (!qualityAvailable) {
      entry.quality.checked = false;
    }

    // Prices
    const unitZeni = getUnitPrice(entry.item, context, rules, entry.quality.checked);
    const { koku, bu, zeni } = fromZeni(unitZeni, rules);
    [koku, bu, zeni].forEach((value, index) => {
      entry.priceCells[index].textContent = String(value);
    });
    entry.noteCell.textContent = describeNote(entry.item, context);

    // Totals
    const count = Math.max(0, Math.floor(Number(entry.quantity.value) || 0));
    if (available && count > 0) {
      totalZeni += unitZeni * count;
      const label = entry.quality.checked ? `${entry.item.name} (high quality)` : entry.item.name;
      purchased.push(`${count} x ${label} - ${formatMoney(unitZeni * count)}`);
    }
  });

  renderSummary(totalZeni, purchased);
  renderSellList(context);
}

function renderSummary(totalZeni, purchased) {
  const haveZeni = toZeni(readMoney(), rules);
  document.querySelector("#shop-total").textContent = formatMoney(totalZeni);
  document.querySelector("#shop-have").textContent = formatMoney(haveZeni);
  const remaining = document.querySelector("#shop-remaining");
  remaining.textContent = formatMoney(haveZeni - totalZeni);
  remaining.classList.toggle("over-budget", haveZeni - totalZeni < 0);
  document.querySelector("#shop-purchase-list").value = purchased.join("\n");
}

function renderSellList(context) {
  const text = document.querySelector("#shop-sell-input").value;
  const output = document.querySelector("#shop-sell-output");
  output.replaceChildren();
  const results = priceSellList(text, catalog.items, context, rules);
  let sellTotal = 0;
  results.forEach((result) => {
    const line = document.createElement("li");
    if (result.item) {
      line.textContent = `${result.quantity} x ${result.name}: ${formatMoney(result.totalZeni)}`;
    } else {
      line.textContent = `${result.name}: not recognised`;
    }
    sellTotal += result.totalZeni;
    output.append(line);
  });
  document.querySelector("#shop-sell-total").textContent = formatMoney(sellTotal);
}

async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Cannot load ${url}: ${response.status}`);
  }
  return response.json();
}

async function start() {
  try {
    [catalog, rules] = await Promise.all([loadJson(ITEMS_URL), loadJson(RULES_URL)]);
  } catch (error) {
    document.querySelector("#shop-error").textContent = error.message;
    return;
  }
  fillSelect(document.querySelector("#shop-clan"), rules.clans);
  fillSelect(document.querySelector("#shop-settlement"), rules.settlements);
  fillSelect(document.querySelector("#shop-settlement-type"), rules.settlementTypes);
  renderTable();
  document.querySelector("#shop-form").addEventListener("submit", (event) => {
    event.preventDefault();
    refresh();
  });
  document.querySelector("#shop-form").addEventListener("input", refresh);
  document.querySelector("#shop-form").addEventListener("change", refresh);
  refresh();
}

start();
