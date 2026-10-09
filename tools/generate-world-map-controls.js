import { loadControlImages, exportControlWebP } from "./world-map-control-assets.js";
import { CONTROL_SIZE, CONTROL_SOURCE_IMAGES, createControlPreviews } from "./world-map-control-previews.js";

const status = document.querySelector("#status");
const container = document.querySelector("#previews");
const downloadUrls = [];

try {
  const images = await loadControlImages(CONTROL_SOURCE_IMAGES);
  const previews = createControlPreviews(images);
  for (const preview of previews) {
    const article = document.createElement("article");
    const heading = document.createElement("h2");
    heading.textContent = preview.label;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = CONTROL_SIZE;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", preview.label);
    preview.draw(canvas.getContext("2d"));
    const blob = await exportControlWebP(canvas);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    downloadUrls.push(link.href);
    link.download = preview.filename;
    link.textContent = `Download ${preview.filename}`;
    article.append(heading, canvas, link);
    container.append(article);
  }
  status.textContent = `${previews.length} previews ready. All downloads are verified WebP images.`;
} catch (error) {
  console.error("Failed to generate world map controls:", error);
  status.classList.add("error");
  status.setAttribute("role", "alert");
  status.textContent = `Generation failed: ${error.message}`;
}

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) downloadUrls.forEach((url) => URL.revokeObjectURL(url));
});
