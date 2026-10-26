import assert from "node:assert/strict";
import test from "node:test";
import { MapHoldToPan } from "../../docs/scripts/world/world-map-pan.js";

function createPan(options = {}) {
  const canvasTarget = new EventTarget();
  const classes = new Set();
  const canvas = Object.assign(canvasTarget, {
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) },
  });
  const scrollContainer = { scrollLeft: 100, scrollTop: 200 };
  const windowTarget = new EventTarget();
  let pending = null;
  const timers = { setTimeout: (fn) => ((pending = fn), 1), clearTimeout: () => (pending = null) };
  const pan = new MapHoldToPan(canvas, { scrollContainer, windowTarget, timers, ...options });
  const fire = (target, type, props = {}) => target.dispatchEvent(Object.assign(new Event(type), { button: 0, clientX: 0, clientY: 0, ...props }));
  return { pan, canvas, classes, scrollContainer, windowTarget, fire, runTimer: () => pending?.() };
}

test("hold then move pans the map with the grabbing class", () => {
  // Setup
  const { pan, canvas, classes, scrollContainer, windowTarget, fire, runTimer } = createPan();

  // Execution
  fire(canvas, "mousedown", { clientX: 50, clientY: 50 });
  runTimer();
  fire(windowTarget, "mousemove", { clientX: 30, clientY: 80 });

  // Assertion
  assert.ok(classes.has("map-panning"));
  assert.equal(scrollContainer.scrollLeft, 120);
  assert.equal(scrollContainer.scrollTop, 170);
  fire(windowTarget, "mouseup");
  assert.ok(!classes.has("map-panning"));
  assert.equal(pan.consumePan(), true);
  assert.equal(pan.consumePan(), false);
});

test("moving before the hold completes cancels the pan", () => {
  // Setup
  let cancelled = 0;
  const { pan, canvas, scrollContainer, windowTarget, fire, runTimer } = createPan({ onHoldCancel: () => cancelled++ });

  // Execution
  fire(canvas, "mousedown", { clientX: 50, clientY: 50 });
  fire(windowTarget, "mousemove", { clientX: 70, clientY: 50 });
  runTimer();

  // Assertion
  assert.equal(cancelled, 1);
  assert.equal(pan.isPanning, false);
  assert.equal(scrollContainer.scrollLeft, 100);
});

test("right button does not start a hold", () => {
  // Setup
  let started = 0;
  const { canvas, fire, runTimer } = createPan({ onPanStart: () => started++ });

  // Execution
  fire(canvas, "mousedown", { button: 2 });
  runTimer();

  // Assertion
  assert.equal(started, 0);
});
