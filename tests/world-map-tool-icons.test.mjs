import assert from "node:assert/strict";
import test from "node:test";
import { setToolIcon } from "../docs/scripts/world-map-tool-icons.js";
import { CLAN, RESOURCE, TERRAIN } from "../docs/scripts/world-map-layers.js";
import { getClanColors } from "../docs/scripts/clan-colors.js";
import { getResourceImage } from "../docs/scripts/world-map-img-resources.js";
import { BASE_LAYER_CONTROL_IMAGES } from "../docs/scripts/world-map-img-base-layers.js";

function createButton() {
  const icons = [];
  const events = {};
  const button = {
    ownerDocument: {
      createElement: (tag) => ({
        tag, style: {}, setAttribute() {},
        addEventListener: (name, handler) => { events[name] = handler; },
        replaceWith: (text) => { icons[0] = text; },
      }),
      createTextNode: (text) => text,
    },
    insertBefore: (icon) => icons.push(icon),
  };
  return { button, icons, events };
}

test("base tool icons resolve metadata control mappings", () => {
  // Setup
  const { button, icons } = createButton();

  // Execution
  setToolIcon(button, TERRAIN.CLIFF);

  // Assertion
  assert.equal(icons[0].src, BASE_LAYER_CONTROL_IMAGES.find(({ value }) => value === TERRAIN.CLIFF).image);
});

test("resource tool icons use resource presentation assets", () => {
  // Setup
  const { button, icons } = createButton();

  // Execution
  setToolIcon(button, RESOURCE.IRON_MINE);

  // Assertion
  assert.equal(icons[0].src, getResourceImage(RESOURCE.IRON_MINE));
});

test("clan tools use palette swatches rather than images", () => {
  // Setup
  const { button, icons } = createButton();
  const colors = getClanColors(CLAN.MANTIS);

  // Execution
  setToolIcon(button, CLAN.MANTIS);

  // Assertion
  assert.equal(icons[0].tag, "span");
  assert.deepEqual(icons[0].style, { backgroundColor: colors.fill, borderColor: colors.border });
});

test("unknown tool metadata reports missing presentation", () => {
  // Setup
  const { button } = createButton();

  // Execution
  const decorate = () => setToolIcon(button, {});

  // Assertion
  assert.throws(decorate, /No tool image/);
});

test("failed tool images log their path and show an error", (t) => {
  // Setup
  const { button, icons, events } = createButton();
  const logging = t.mock.method(console, "error", () => {});
  setToolIcon(button, TERRAIN.CLIFF);
  const path = icons[0].src;

  // Execution
  events.error();

  // Assertion
  assert.ok(logging.mock.calls[0].arguments[0].includes(path));
  assert.equal(icons[0], "[Image unavailable] ");
});
