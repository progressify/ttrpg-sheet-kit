// Same rules Obsidian's community plugin review runs (eslint-plugin-obsidianmd).
// Setup for a plugin written in JavaScript: see the plugin's docs/configuration.md,
// "Plugins written in JavaScript".
import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  // main.js is the build output (a copy of src/main.js)
  globalIgnores(["node_modules", "main.js"]),
  ...obsidianmd.configs.recommended,
  {
    // Obsidian's type-aware rules (e.g. no-unsupported-api, checked against
    // minAppVersion), with types from jsconfig.json and the obsidian package.
    // typescript-eslint's own type-checked set is left out on purpose: on
    // untyped JavaScript it only reports "unsafe any" on almost every line.
    files: ["src/**/*.js"],
    languageOptions: {
      parserOptions: { projectService: true },
      // Obsidian loads the plugin as CommonJS
      globals: { module: "writable", exports: "writable" },
    },
    rules: {
      ...obsidianmd.ruleConfigs.recommendedTypeChecked,
    },
  },
]);
