const SKILLS = [
  ["survival", "Survival"], ["sailing", "Sailing"], ["investigate", "Investigation"],
  ["swim", "Swim"], ["sneak", "Sneak"], ["forgery", "Forgery"],
];

function appendInput(row, type, value, label) {
  const cell = document.createElement("td");
  const input = document.createElement("input");
  input.type = type;
  input.setAttribute("aria-label", label);
  if (type === "checkbox") input.checked = value;
  else input.value = value;
  cell.append(input);
  row.append(cell);
  return input;
}

/**
 * @param {import("./world-map-viewer.js").WorldMapViewer} map Viewer instance.
 * @returns {void}
 */
export function bindViewerSkills(map) {
  const tbody = document.querySelector("#skillRows");
  SKILLS.forEach(([key, label]) => {
    const config = map.skillConfig[key];
    const row = document.createElement("tr");
    const heading = document.createElement("td");
    heading.textContent = label;
    row.append(heading);
    ["roll", "keep", "mod", "rerollOnes", "explodeOnNines", "allowed"].forEach((field) => {
      if (field === "allowed" && !["swim", "sneak", "forgery"].includes(key)) {
        row.append(document.createElement("td"));
        return;
      }
      const type = ["roll", "keep", "mod"].includes(field) ? "number" : "checkbox";
      const input = appendInput(row, type, config[field], `${label}: ${field}`);
      if (field === "roll" || field === "keep") input.min = "1";
      input.addEventListener("change", () => {
        map.setSkillConfig(key, { [field]: type === "checkbox" ? input.checked : Number(input.value) || 0 });
      });
    });
    tbody.append(row);
  });
  const swimTN = document.querySelector("#swimTNInput");
  swimTN.value = map.skillConfig.swim.tn;
  swimTN.addEventListener("change", () => map.setSkillConfig("swim", { tn: Number(swimTN.value) || 0 }));
}

/**
 * @param {import("./world-map-viewer.js").WorldMapViewer} map Initialized viewer.
 * @returns {void}
 */
export function bindViewerClans(map) {
  const tbody = document.querySelector("#clanRows");
  tbody.replaceChildren();
  Object.keys(map.travelPapers).forEach((clan) => {
    const row = document.createElement("tr");
    const heading = document.createElement("td");
    heading.textContent = clan;
    row.append(heading);
    [["travelPapers", "Papers"], ["avoidClans", "Avoid"]].forEach(([field, label]) => {
      const input = appendInput(row, "checkbox", Boolean(map[field][clan]), `${clan}: ${label}`);
      input.addEventListener("change", () => {
        map[field][clan] = input.checked;
        if (map.startCell && map.waypoints.length) map.computePath();
      });
    });
    tbody.append(row);
  });
}
