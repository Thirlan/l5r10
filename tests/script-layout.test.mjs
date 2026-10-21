import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const scripts = new URL("../docs/scripts/", import.meta.url);

test("local script imports resolve after moving world and travel modules", () => {
  // Setup
  const files = readdirSync(scripts, { recursive: true }).filter((file) => file.endsWith(".js"));

  // Execution
  const missing = files.flatMap((file) => {
    const source = new URL(file, scripts);
    const code = readFileSync(source, "utf8");
    const references = [...code.matchAll(/["'](\.{1,2}\/[^"'\n]+\.js)["']/g)];
    return references.filter(([, reference]) => !existsSync(new URL(reference, source))).map(([, reference]) => `${file}: ${reference}`);
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
    assert.ok(existsSync(new URL(modulePath, scripts)), `${file} must match its script folder`);
  });
});
