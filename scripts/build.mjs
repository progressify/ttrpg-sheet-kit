// Checks the plugin's syntax and copies src/plugin.js to main.js,
// the file Obsidian loads and the release ships. The source is not named
// main.js because Obsidian's build check deletes every main.js before building.
import { execFileSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';

execFileSync(process.execPath, ['--check', 'src/plugin.js'], { stdio: 'inherit' });
copyFileSync('src/plugin.js', 'main.js');
console.log('Built main.js');
