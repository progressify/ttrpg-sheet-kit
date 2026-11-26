// Checks the plugin's syntax and copies src/main.js to main.js,
// the file Obsidian loads and the release ships.
import { execFileSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';

execFileSync(process.execPath, ['--check', 'src/main.js'], { stdio: 'inherit' });
copyFileSync('src/main.js', 'main.js');
console.log('Built main.js');
