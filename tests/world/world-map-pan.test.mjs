import assert from "node:assert/strict";
import test from "node:test";
import { MapDragToPan } from "../../docs/scripts/world/world-map-pan.js";

function createPan() {
  const classes = new Set();
  const canvas = Object.assign(new EventTarget(), {
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)),
    },
  });
  const scrollContainer = { scrollLeft: 100, scrollTop: 200 };
  const windowTarget = new EventTarget();
  const pan = new MapDragToPan(canvas, { scrollContainer, windowTarget });
  const fire = (target, type, props = {}) => target.dispatchEvent(Object.assign(new Event(type), { button: 0, clientX: 0, clientY: 0, ...props }));
  return { pan, canvas, classes, scrollContainer, windowTarget, fire };
}

test("drag pans the map with the grabbing class when enabled", () => {
  // Setup
  const { pan, canvas, classes, scrollContainer, windowTarget, fire } = createPan();
  pan.setEnabled(true);

  // Execution
  fire(canvas, "mousedown", { clientX: 50, clientY: 50 });
  fire(windowTarget, "mousemove", { clientX: 30, clientY: 80 });

  // Assertion
  assert.ok(classes.has("map-pan-tool"));
  assert.ok(classes.has("map-panning"));
  assert.equal(scrollContainer.scrollLeft, 120);
  assert.equal(scrollContainer.scrollTop, 170);
  fire(windowTarget, "mouseup");
  assert.ok(!classes.has("map-panning"));
});

test("drag does not pan when disabled", () => {
  // Setup
  const { canvas, classes, scrollContainer, windowTarget, fire } = createPan();

  // Execution
  fire(canvas, "mousedown", { clientX: 50, clientY: 50 });
  fire(windowTarget, "mousemove", { clientX: 30, clientY: 80 });

  // Assertion
  assert.ok(!classes.has("map-panning"));
  assert.equal(scrollContainer.scrollLeft, 100);
});

test("right button does not pan", () => {
  // Setup
  const { pan, canvas, scrollContainer, windowTarget, fire } = createPan();
  pan.setEnabled(true);

  // Execution
  fire(canvas, "mousedown", { button: 2, clientX: 50, clientY: 50 });
  fire(windowTarget, "mousemove", { clientX: 30, clientY: 80 });

  // Assertion
  assert.equal(scrollContainer.scrollTop, 200);
});
