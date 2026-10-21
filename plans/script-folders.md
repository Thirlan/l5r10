# Script folders

Status: Complete.

## Decisions

- Move all `docs/scripts/world-map-*.js` files into `docs/scripts/world/`.
- Move the requested travel files into `docs/scripts/travel/`.
- Rename `travel-time.js` to `travel-speed.js` during the move.
- Include `beastiary.js` in the travel folder, as requested after the initial move.
- Keep other unlisted files, including `skill-check.js`, in their current folder.
- Update module imports, JSDoc imports, HTML references, CSV paths, tests, and documentation links.
- Preserve document-relative image and data URLs.
- Update the ESLint classic-script exception for the moved event engine.
- Mirror script subfolders under `tests/world/` and `tests/travel/`.
- Keep tests for root-level scripts directly under `tests/`.
- Rename the speed test to match its module.
- Preserve all travel and map behavior.

## Change sets

Keep each proposed PR below 200 changed code lines, excluding file moves and documentation.
Do not create commits or PRs without a request.

1. Move world modules and update their imports and direct consumers.
   - All matching modules exist under `docs/scripts/world/`.
   - All world module references resolve.
2. Move travel modules and data, and rename the speed module.
   - All requested files exist under `docs/scripts/travel/`.
   - Update cross-folder imports, CSV references, and the classic-script lint exception.
3. Update tests and documentation.
   - Existing tests import the new locations.
   - The speed test is named `travel-speed.test.mjs`.
   - The test command discovers nested test files.
   - Map HTML pages load the moved entry modules and travel CSV.
4. Verify module and page references, run affected tests, and run the required format and lint script.
   - No old script paths remain in active code.
   - No missing local module or map page references remain.

## Validation

- Moved 19 world modules and all 13 requested travel files.
- Renamed the speed module and its test.
- All local script import and map page path checks pass.
- Affected tests: 554 pass, one existing river data test fails.
- The same river data test fails against the committed baseline: two outgoing directions instead of one.
- JavaScript lint passes, including the moved classic event script.
- The required format and lint script reports 12 existing HTML errors.
- Removed unrelated formatter changes.

## Mirrored test folders

- Moved 17 world tests into `tests/world/` and nine travel tests into `tests/travel/`.
- Updated relative imports in each moved test.
- Changed `npm test` to use recursive Node test discovery.
- Added a layout regression check for matching test and script paths.
- Full recursive discovery runs 559 tests: 558 pass, with the known river data failure.
- All five layout regression checks pass, including the new folder check.
