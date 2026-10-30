#!/usr/bin/env bash
# Format and lint the HTML pages and the JavaScript files in docs.
# Usage: tools/format-and-lint.sh
# The script runs all steps. It exits with 1 if one or more steps fail.

cd "$(dirname "$0")/.." || exit 1

html_targets=(
  "docs/character_creation/**/*.html"
  "docs/great_clans/**/*.html"
  "docs/other_clans/**/*.html"
  "docs/rules/**/*.html"
  "docs/shadowlands/**/*.html"
  "docs/world/**/*.html"
  "docs/map/**/*.html"
  "docs/index.html"
  "docs/navbar.html"
)
js_targets=("docs/scripts/**/*.js" "docs/map/scripts/**/*.js")

status=0

echo "== Prettier: format HTML and JavaScript =="
npx prettier --write "${html_targets[@]}" "${js_targets[@]}" || status=1

echo "== html-validate: lint HTML =="
npx html-validate "${html_targets[@]}" || status=1

echo "== ESLint: lint JavaScript =="
npx eslint "${js_targets[@]}" || status=1

exit $status
