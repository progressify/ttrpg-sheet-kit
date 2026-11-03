# Contributing to TTRPG Sheet Kit

Thanks for helping! Feedback, bug reports and pull requests are all welcome.

## Feedback, bugs and ideas

Use the [issue templates](https://github.com/progressify/ttrpg-sheet-kit/issues/new/choose):
**Bug report**, **Feature request** or **Feedback**. English or Italian are both fine.

For bugs, include the `ttrpgsk-counters` block or callout that misbehaves, your Obsidian
version, theme, view mode (Live Preview or Reading view) and platform.

## Project layout

| Path | What it is |
|---|---|
| `main.js` | the whole plugin: parsing, rendering, editing, commands, translations |
| `styles.css` | counter layouts and the `ttrpgsk-columns` callout |
| `manifest.json` | plugin metadata read by Obsidian |
| `tests/` | unit tests (`node:test`, no dependencies) |
| `examples/` | example character sheets |
| `llms.txt` | syntax reference for AI assistants |

The plugin is plain JavaScript with **no build step and no dependencies**: `main.js` is
exactly what Obsidian loads.

## Development

1. Clone the repository into `<vault>/.obsidian/plugins/ttrpg-sheet-kit/` of a test vault
   (or symlink it there).
2. Enable the plugin in Settings → Community plugins.
3. After a change, disable and re-enable the plugin (or use the
   [Hot Reload](https://github.com/pjeby/hot-reload) plugin).
4. Run the tests:

   ```bash
   npm test
   ```

Check your change in both **Live Preview** and **Reading view**, and on a narrow window.

## Pull requests

- Keep each pull request focused on one change.
- Add or update tests in `tests/` for parsing or editing changes.
- When you change the block syntax, update `README.md`, `README.it.md` and `llms.txt` too.
- New user-facing text goes in `STRINGS` in `main.js`, in both English and Italian.
- CSS: prefix classes with `tsk-`, use Obsidian's CSS variables, avoid `!important`
  unless overriding an inline style.

## Releases (maintainer)

1. Bump `version` in `manifest.json` and `package.json`, and add it to `versions.json`.
2. Commit, then push a tag equal to the version (e.g. `0.2.0`, no `v`).
3. The workflow runs the tests, attests the files and creates a draft release.
4. Review the draft on GitHub and publish it.
