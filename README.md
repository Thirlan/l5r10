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
| [docs/scripts/world/](docs/scripts/world/) | World map display and editing logic. |
| [docs/scripts/travel/](docs/scripts/travel/) | Travel rules, encounters, and route calculation. |
| [tests/](tests/) | Automated tests, with subfolders that mirror the script folders. |
| [tests/world/](tests/world/) | World map tests. |
| [tests/travel/](tests/travel/) | Travel tests. |
| [plans/](plans/) | Implementation plans and design decisions. |
| [tools/](tools/) | Development and maintenance tools. |
