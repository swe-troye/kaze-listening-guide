'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const files = ['index.html', 'style.css', 'data.js', 'core.js', 'app.js', 'favicon.svg', 'anime.html', 'anime.css', 'anime.js', 'assets/kaze-guide.svg'];
const read = file => fs.readFileSync(path.join(root,file),'utf8');
for (const file of files) if (file.endsWith('.js')) new vm.Script(read(file), {filename:file});
for (const [page, script] of [['index.html','app.js'],['anime.html','anime.js']]) {
  const html = read(page);
  for (const [,id] of read(script).matchAll(/\$\('([\w-]+)'\)/g)) {
    if (!html.includes(`id="${id}"`)) throw new Error(`Missing ${script} DOM anchor: ${id}`);
  }
  for (const [,link] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const target = link.split('#')[0];
    if (!/^https?:/.test(target) && !files.includes(target)) throw new Error(`Missing local asset: ${target}`);
  }
}
const ctx = {window:{}};
vm.runInNewContext(read('data.js'),ctx);
if (ctx.window.KAZE_SONGS.length !== 18) throw new Error('Playlist requires 18 songs');
const out = path.join(root,'dist');
fs.mkdirSync(out,{recursive:true});
for (const file of files) {
  fs.mkdirSync(path.dirname(path.join(out,file)),{recursive:true});
  fs.copyFileSync(path.join(root,file),path.join(out,file));
}
for (const [page, css, app, destination] of [['index.html','style.css','app.js','standalone.html'],['anime.html','anime.css','anime.js','anime-standalone.html']]) {
  let html = read(page).replace(/\s*<script src="[\w-]+\.js" defer><\/script>/g,'');
  html = html.replace(`<link rel="stylesheet" href="${css}">`, () => `<style>${read(css)}</style>`);
  for (const asset of ['favicon.svg','assets/kaze-guide.svg']) {
    html = html.split(`"${asset}"`).join(`"data:image/svg+xml,${encodeURIComponent(read(asset))}"`);
  }
  html = html.replaceAll('href="anime.html"','href="anime-standalone.html"').replaceAll('href="index.html','href="standalone.html');
  const scripts = ['data.js','core.js',app].map(file => {
    const source = read(file).replaceAll('index.html#song-','standalone.html#song-').replace(/<\/script/gi,'<\\/script');
    return `<script>${source}</script>`;
  }).join('\n');
  html = html.replace('</body>',() => `${scripts}\n</body>`);
  fs.writeFileSync(path.join(out,destination),html);
}
const bytes = files.reduce((sum,file)=>sum + fs.statSync(path.join(out,file)).size,0);
console.log(`Built ${files.length} static assets, ${Math.round(bytes/1024)} KB, 18 songs.`);
console.log('Also built standalone.html and anime-standalone.html for direct browser opening.');
