// The rules Obsidian's community plugin review runs (eslint-plugin-obsidianmd).
// Kept close to the review's own setup: no jsconfig.json/tsconfig.json, so
// JavaScript is linted without type information, as the review does.
import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  // main.js is the build output (a copy of src/plugin.js)
  globalIgnores(["node_modules", "main.js"]),
  ...obsidianmd.configs.recommended,
  // Obsidian loads the plugin as CommonJS
  { files: ["src/**/*.js"], languageOptions: { globals: { module: "writable", exports: "writable" } } },
]);
