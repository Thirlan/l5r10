import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const scripts = new URL("../docs/scripts/", import.meta.url);
const mapScripts = new URL("../docs/map/scripts/", import.meta.url);

test("local script imports resolve after moving world and travel modules", () => {
  // Setup
  const files = [scripts, mapScripts].flatMap((folder) =>
    readdirSync(folder, { recursive: true })
      .filter((file) => file.endsWith(".js"))
      .map((file) => new URL(file, folder)),
  );

  // Execution
  const missing = files.flatMap((source) => {
    const code = readFileSync(source, "utf8");
    const references = [...code.matchAll(/["'](\.{1,2}\/[^"'\n]+\.js)["']/g)];
    return references.filter(([, reference]) => !existsSync(new URL(reference, source))).map(([, reference]) => `${source.pathname}: ${reference}`);
  });

  // Assertion
  assert.deepEqual(missing, []);
});

["build_map.html", "world_map.html"].forEach((page) =>
  test(`${page} script and travel data paths resolve`, () => {
    // Setup
    const source = new URL(`../docs/world/${page}`, import.meta.url);
    const html = readFileSync(source, "utf8");

    // Execution
    const references = [...html.matchAll(/(?:src|data-travel-costs)="([^"]+)"/g)].map(([, reference]) => reference).filter((reference) => reference.startsWith("../scripts/"));

    // Assertion
    assert.ok(references.some((reference) => reference.includes("/world/world-map-")));
    references.forEach((reference) => assert.ok(existsSync(new URL(reference, source)), reference));
    if (page === "world_map.html") {
      assert.ok(references.includes("../scripts/travel/travel_lookup.csv"));
      assert.ok(references.includes("../scripts/travel/travel-event-engine.js"));
    }
  }),
);

test("moved files no longer occupy the flat scripts folder", () => {
  // Setup
  const files = readdirSync(scripts);

  // Assertion
  assert.equal(
    files.some((file) => file.startsWith("world-map-") && file.endsWith(".js")),
    false,
  );
  assert.equal(files.includes("travel-time.js"), false);
  assert.ok(existsSync(new URL("travel/travel-speed.js", scripts)));
  assert.ok(existsSync(new URL("travel/travel_lookup.csv", scripts)));
  assert.ok(existsSync(new URL("world/world-map-layers.js", scripts)));
});

test("module tests mirror the script subfolders", () => {
  // Setup
  const tests = new URL("./", import.meta.url);
  const files = readdirSync(tests, { recursive: true }).filter((file) => file.endsWith(".test.mjs") && file !== "script-layout.test.mjs");

  // Assertion
  files.forEach((file) => {
    const modulePath = file.replace(/\.test\.mjs$/, ".js");
    const isMapTest = modulePath.startsWith("map/") || modulePath.startsWith("map\\");
    const scriptUrl = isMapTest ? new URL(modulePath.slice(4), mapScripts) : new URL(modulePath, scripts);
    assert.ok(existsSync(scriptUrl), `${file} must match its script folder`);
  });
});

test("world_map_3d.html scripts resolve and pin the Babylon.js version from package.json", () => {
  // Setup
  const source = new URL("../docs/map/world_map_3d.html", import.meta.url);
  const html = readFileSync(source, "utf8");
  const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

  // Execution
  const references = [...html.matchAll(/(?:src|href|data-map-data)="([^"]+)"/g)].map(([, reference]) => reference);
  const local = references.filter((reference) => !reference.startsWith("http") && !reference.startsWith("/"));
  const cdnVersions = [...html.matchAll(/npm\/babylonjs(?:-materials)?@([^/]+)\//g)].map(([, version]) => version);

  // Assertion
  local.forEach((reference) => assert.ok(existsSync(new URL(reference, source)), reference));
  assert.equal(cdnVersions.length, 2);
  assert.deepEqual(cdnVersions, [packageJson.devDependencies["@babylonjs/core"], packageJson.devDependencies["@babylonjs/materials"]]);
});
