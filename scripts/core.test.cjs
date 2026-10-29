'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {filterSongs, escapeHTML, readState, sanitizeState} = require('../core.js');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data.js'), 'utf8'), context);
const songs = JSON.parse(JSON.stringify(context.window.KAZE_SONGS));
const ids = songs.map(s => s.id);
test('playlist order and complete, traceable research remain explicit', () => {
  assert.equal(songs.length, 18);
  assert.equal(new Set(ids).size, 18);
  assert.equal(new Set(songs.map(s=>s.spotifyTrackId)).size,18);
  assert.equal(songs[0].spotify, 'Nan-Nan');
  assert.equal(songs[17].spotify, 'masshiro (pure white)');
  assert.equal(songs.filter(s => s.pending || s.partial).length, 0);
  for (const s of songs) {
    assert.match(s.id, /^[a-z0-9-]+$/);
    assert.match(s.duration, /^\d+:\d{2}$/);
    assert.match(s.spotifyTrackId, /^[A-Za-z0-9]{22}$/);
    for (const key of ['name','reading','chinese','line','summary','interpretation','listen','titleMeaning','highlight']) assert.ok(s[key]?.trim(), `${s.id}: ${key}`);
    assert.ok(s.meaning.length > 0);
    assert.equal(s.verified, true);
    assert.match(s.research.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(s.research.originalScope, /全文/);
    assert.equal(s.research.translationScope, '全文');
    for (const kind of ['original', 'translation']) {
      const source = s.sources.find(source => source.kind === kind);
      assert.ok(source?.name && source.scope, `${s.id}: ${kind} source`);
      assert.equal(new URL(source.url).protocol, 'https:');
    }
    assert.ok(s.sources.find(source => source.kind === 'translation').credit);
  }
});
test('search supports Japanese, Chinese, English, apostrophes and full width', () => {
  for (const [query, expected] of [['何なん','nan-nan'], ['清醒','none'], ['夠了','mo-eh-wa'], ['ｎａｎ－ｎａｎ','nan-nan'], ["feelin' good",'feelin-good'], ['SHINUNOGA E WA','shinunoga-e-wa'], ['満ちてゆく','michi-teyu-ku']]) {
    const results = filterSongs(songs, {query});
    if (expected === 'none') assert.equal(results.length, 0); else assert.equal(results[0]?.id, expected);
  }
});
test('theme and saved filters intersect', () => {
  assert.deepEqual(filterSongs(songs, {theme:'放下',savedOnly:true,saved:['nan-nan','matsuri']}).map(s => s.id), ['nan-nan']);
  assert.equal(filterSongs(songs, {savedOnly:true,saved:[]}).length, 0);
  assert.ok(filterSongs(songs, {theme:'自由'}).every(s => !s.pending));
  assert.equal(filterSongs(songs, {query:'not a song'}).length, 0);
});
test('corrupt storage falls back without blocking reading', () => {
  assert.equal(readState({getItem(){throw new Error('blocked');}},ids).available,false);
  assert.equal(readState({getItem(){return 'broken json';}},ids).available,false);
  assert.deepEqual(readState({getItem(){return '{}';}},ids).state,{saved:[],read:[],mode:'slow'});
});
test('restored state excludes stale IDs, wrong types and duplicate progress', () => {
  assert.deepEqual(sanitizeState({saved:['nan-nan','nan-nan','deleted',22],read:'not an array',mode:'quick'},ids),{saved:['nan-nan'],read:[],mode:'quick'});
  assert.deepEqual(sanitizeState(null,ids),{saved:[],read:[],mode:'slow'});
});
test('HTML escaping preserves text rather than creating injected markup', () => {
  assert.equal(escapeHTML('<img src=x onerror="x"> & \'test\''),'&lt;img src=x onerror=&quot;x&quot;&gt; &amp; &#39;test&#39;');
});
