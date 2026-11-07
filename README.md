# l5r10
Legends of the Five Rings 4.5 - 10th Century

## Lint and format

Install the tools one time:

```sh
npm install
```

| Command                | Action                                          |
| ---------------------- | ----------------------------------------------- |
| `npm run lint`         | Run the HTML linter and the JavaScript linter.  |
| `npm run lint:html`    | Check `docs/**/*.html` with html-validate.      |
| `npm run lint:js`      | Check JavaScript with ESLint.                   |
| `npm run format`       | Format HTML, CSS and JavaScript with Prettier.  |
| `npm run format:check` | Show the files that Prettier will change.       |
| `npm test`             | Run the unit tests.                             |
| `npm run typecheck:world-map-tile` | Check tile construction and readonly JSDoc types. |
| `npm run typecheck:world-map-header` | Check header construction, composition, and readonly types. |

To format one file, use `npx prettier --write <file>`.

To format and lint only the site pages and `docs/scripts`, run `tools/format-and-lint.sh`.

## Folder structure

| Folder | Contents |
| --- | --- |
| [docs/](docs/) | Website pages and assets. |
| [docs/character_creation/](docs/character_creation/) | Character creation rules and options. |
| [docs/rules/](docs/rules/) | Core game rules. |
| [docs/great_clans/](docs/great_clans/) | Great Clan rules and lore. |
| [docs/other_clans/](docs/other_clans/) | Other clan rules and lore. |
| [docs/shadowlands/](docs/shadowlands/) | Shadowlands rules and lore. |
| [docs/spells/](docs/spells/) | Spell reference pages. |
| [docs/world/](docs/world/) | World pages and map interfaces. |
| [docs/map/](docs/map/) | Map-related content. |
| [docs/css/](docs/css/) | Website styles. |
| [docs/img/](docs/img/) | Website images and map assets. |
| [docs/data/](docs/data/) | Structured game and map data. |
| [docs/scripts/](docs/scripts/) | Shared website JavaScript. |
| [docs/scripts/world/](docs/scripts/world/) | World map logic, in three subfolders. Each subfolder has a `world-map-<folder>.const.js` file for fixed values and a `world-map-<folder>.config.js` file for game and display settings. |
| [docs/scripts/world/data/](docs/scripts/world/data/) | Raw map data: layers, map file, elevation, scale, and clan colors. |
| [docs/scripts/world/draw/](docs/scripts/world/draw/) | 2D map drawing for the map builder and the map viewer. |
| [docs/scripts/world/game-rules/](docs/scripts/world/game-rules/) | RPG rules: travel, skill checks, routes, encounters, and the beastiary. |
| [tests/](tests/) | Automated tests, with subfolders that mirror the script folders. |
| [tests/world/](tests/world/) | World map tests, in the same subfolders as the scripts. |
| [plans/](plans/) | Implementation plans and design decisions. |
| [tools/](tools/) | Development and maintenance tools. |
