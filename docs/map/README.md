# 3D World Map (proof of concept)

This folder holds a standalone Babylon.js proof of concept of the world map.
It answers one question: is a 3D terrain view worth building out fully?
The plan is in [plans/3d-map-plan.md](../../plans/3d-map-plan.md).

The 2D map does not change. The 3D page imports catalogs and presentation data
from `docs/scripts/`. It does not import the 2D renderer classes.

## Run the page

The site uses absolute `/l5r10/` links for the navbar. Serve `docs/` at that path:

```bash
mkdir -p /tmp/site && ln -sfn "$PWD/docs" /tmp/site/l5r10
npx http-server /tmp/site -p 8080 -c-1
```

Then open <http://localhost:8080/l5r10/map/world_map_3d.html>.
The page needs a network connection to load Babylon.js from the CDN.

## Babylon.js version

- The page loads the UMD build of Babylon.js 9.33.0 from jsDelivr.
  The `cdn.babylonjs.com` versioned paths stop at version 8.
- The script tags have Subresource Integrity (SRI) hashes.
- `package.json` pins `@babylonjs/core` and `@babylonjs/materials` to the same version.
  A test in `tests/script-layout.test.mjs` makes sure that the versions stay equal.
  To update, change both places and the SRI hashes.

## Folder layout

| Path | Contents |
| --- | --- |
| `world_map_3d.html` | The page. |
| `css/map-3d.css` | Styles for the 3D canvas. Other styles come from `docs/css/`. |
| `scripts/` | ES modules for the 3D page. Tests are in `tests/map/`. |
| `textures/` | PBR texture sets for the terrain. |

## Coordinates

- One map cell is one world unit. One cell is 5 miles.
- World X is the column. World Z is `rows - row`, so north is far from the default camera.
- Y is up.
