'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const files = ['index.html', 'style.css', 'data.js', 'core.js', 'app.js', 'favicon.svg'];
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  if (file.endsWith('.js')) new vm.Script(source, {filename: file});
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// Catch missing static DOM anchors before shipping a partially initialized app.
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
for (const [, id] of app.matchAll(/\$\('([\w-]+)'\)/g)) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing app DOM anchor: ${id}`);
}
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  const target = match[1];
  if (!target.startsWith('https:') && !files.includes(target)) throw new Error(`Missing local asset: ${target}`);
}
const ctx = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), ctx);
if (ctx.window.KAZE_SONGS.length !== 18) throw new Error('Playlist requires 18 songs');
const out = path.join(root, 'dist');
fs.mkdirSync(out, {recursive: true});
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(out, file));
// Self-contained delivery works when a local preview server is unavailable.
let standalone = html.replace(/\s*<script src="(?:data|core|app)\.js" defer><\/script>/g, '');
standalone = standalone.replace('<link rel="stylesheet" href="style.css">', () => `<style>${fs.readFileSync(path.join(root, 'style.css'), 'utf8')}</style>`);
standalone = standalone.replace('href="favicon.svg"', () => `href="data:image/svg+xml,${encodeURIComponent(fs.readFileSync(path.join(root,'favicon.svg'),'utf8'))}"`);
const scripts = ['data.js','core.js','app.js'].map(file => `<script>${fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi, '<\\/script')}</script>`).join('\n');
standalone = standalone.replace('</body>', () => `${scripts}\n</body>`);
fs.writeFileSync(path.join(out,'standalone.html'), standalone);
const bytes = files.reduce((sum, file) => sum + fs.statSync(path.join(out, file)).size, 0);
console.log(`Built ${files.length} static assets, ${Math.round(bytes / 1024)} KB, 18 songs.`);
console.log('Also built dist/standalone.html for direct browser opening.');
