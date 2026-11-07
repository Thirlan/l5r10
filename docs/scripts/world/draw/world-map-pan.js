/**
 * Drag the map with the left mouse button to pan it.
 * Panning works only while `enabled` is true.
 * The map moves with the mouse, like dragging a sheet of paper.
 */
export class MapDragToPan {
  /**
   * @param {HTMLCanvasElement} canvas The map canvas.
   * @param {object} [options]
   * @param {HTMLElement} [options.scrollContainer] The element that scrolls. Default is the parent of the canvas.
   * @param {EventTarget} [options.windowTarget] Target for move and release events. Default is window.
   */
  constructor(canvas, { scrollContainer, windowTarget = globalThis } = {}) {
    this.canvas = canvas;
    this.scrollContainer = scrollContainer || canvas.parentElement;
    this.enabled = false;
    this.start = null;

    canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    windowTarget.addEventListener("mousemove", (e) => this.onMouseMove(e));
    windowTarget.addEventListener("mouseup", () => this.onMouseUp());
  }

  /**
   * @param {boolean} enabled True to pan when the user drags the map.
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.onMouseUp();
    this.canvas.classList.toggle("map-pan-tool", enabled);
  }

  onMouseDown(event) {
    if (!this.enabled || event.button !== 0) return;
    event.preventDefault();
    this.start = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: this.scrollContainer.scrollLeft,
      scrollTop: this.scrollContainer.scrollTop,
    };
    this.canvas.classList.add("map-panning");
  }

  onMouseMove(event) {
    if (!this.start) return;
    this.scrollContainer.scrollLeft = this.start.scrollLeft - (event.clientX - this.start.x);
    this.scrollContainer.scrollTop = this.start.scrollTop - (event.clientY - this.start.y);
  }

  onMouseUp() {
    this.start = null;
    this.canvas.classList.remove("map-panning");
  }
}
