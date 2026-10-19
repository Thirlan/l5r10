import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/", "docs/data/"] },
  js.configs.recommended,
  {
    files: ["docs/**/*.js"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
        $: "readonly",
        jQuery: "readonly",
        BABYLON: "readonly",
        L5RDice: "readonly",
        L5RCurrency: "readonly",
        TravelEventEngine: "readonly",
      },
    },
    rules: { "no-unused-vars": ["error", { argsIgnorePattern: "^_" }] },
  },
  {
    files: ["tests/**/*.mjs", "*.js"],
    languageOptions: { sourceType: "module", globals: globals.node },
  },
];
