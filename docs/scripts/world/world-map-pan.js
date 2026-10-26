export const HOLD_TO_PAN_DELAY_MS = 300;
export const HOLD_MOVE_TOLERANCE_PX = 4;

/**
 * Press and hold the left mouse button on the map to pan it.
 * While panning, the map shows the browser "grabbing" cursor.
 * The map moves with the mouse, like dragging a sheet of paper.
 */
export class MapHoldToPan {
  /**
   * @param {HTMLCanvasElement} canvas The map canvas.
   * @param {object} [options]
   * @param {HTMLElement} [options.scrollContainer] The element that scrolls. Default is the parent of the canvas.
   * @param {Function} [options.onPanStart] Called when the hold starts panning.
   * @param {Function} [options.onHoldCancel] Called when the mouse moves before the hold completes.
   * @param {object} [options.timers] Timer functions. Tests can replace them.
   * @param {EventTarget} [options.windowTarget] Target for move and release events. Default is window.
   */
  constructor(canvas, { scrollContainer, onPanStart = () => {}, onHoldCancel = () => {}, timers = globalThis, windowTarget = globalThis } = {}) {
    this.canvas = canvas;
    this.scrollContainer = scrollContainer || canvas.parentElement;
    this.onPanStart = onPanStart;
    this.onHoldCancel = onHoldCancel;
    this.timers = timers;
    this.holdTimer = null;
    this.isPanning = false;
    this.didPan = false;
    this.start = null;

    canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    windowTarget.addEventListener("mousemove", (e) => this.onMouseMove(e));
    windowTarget.addEventListener("mouseup", () => this.onMouseUp());
  }

  onMouseDown(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    this.cancelHold();
    this.didPan = false;
    this.start = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: this.scrollContainer.scrollLeft,
      scrollTop: this.scrollContainer.scrollTop,
    };
    this.holdTimer = this.timers.setTimeout(() => this.beginPan(), HOLD_TO_PAN_DELAY_MS);
  }

  onMouseMove(event) {
    if (!this.start) return;
    const dx = event.clientX - this.start.x;
    const dy = event.clientY - this.start.y;
    if (this.isPanning) {
      this.scrollContainer.scrollLeft = this.start.scrollLeft - dx;
      this.scrollContainer.scrollTop = this.start.scrollTop - dy;
      return;
    }
    if (this.holdTimer !== null && Math.hypot(dx, dy) > HOLD_MOVE_TOLERANCE_PX) {
      this.cancelHold();
      this.start = null;
      this.onHoldCancel();
    }
  }

  onMouseUp() {
    this.cancelHold();
    this.start = null;
    if (!this.isPanning) return;
    this.isPanning = false;
    this.canvas.classList.remove("map-panning");
  }

  beginPan() {
    this.holdTimer = null;
    this.isPanning = true;
    this.didPan = true;
    this.canvas.classList.add("map-panning");
    this.onPanStart();
  }

  cancelHold() {
    if (this.holdTimer === null) return;
    this.timers.clearTimeout(this.holdTimer);
    this.holdTimer = null;
  }

  /**
   * @returns {boolean} True one time after a pan. Use it to ignore the click that ends a pan.
   */
  consumePan() {
    const didPan = this.didPan;
    this.didPan = false;
    return didPan;
  }
}
