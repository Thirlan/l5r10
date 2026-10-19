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
