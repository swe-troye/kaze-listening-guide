'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.KAZE_PLAYWRIGHT_MODULE || 'playwright-core');
const executablePath = process.env.KAZE_BROWSER_PATH || '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const artifactDir = process.env.KAZE_QA_DIR || '/private/tmp/kaze-anime-qa';
const base = process.env.KAZE_SITE_URL || pathToFileURL(path.resolve(__dirname,'../dist/standalone.html')).href;
const url = new URL(base.startsWith('file:') ? 'anime-standalone.html' : 'anime.html',base).href;
const results = [];
async function check(name,fn) { await fn(); results.push(name); console.log(`PASS ${name}`); }
(async()=>{
  fs.mkdirSync(artifactDir,{recursive:true});
  const browser = await chromium.launch({executablePath,headless:true});
  const errors = [];
  try {
    const context = await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page = await context.newPage();
    page.on('pageerror',err=>errors.push(err.message));
    await page.goto(base);
    await check('homepage opens anime guide in a new tab',async()=>{
      const popup = context.waitForEvent('page');
      await page.locator('.anime-entry').click();
      const anime = await popup; await anime.waitForLoadState();
      assert.equal(await anime.locator('#slide-title').innerText(),'何なんw');
      assert.equal(await anime.locator('#guide-character').evaluate(img=>img.complete && img.naturalWidth>0),true);
      await anime.close();
    });
    await page.goto(url);
    const songs = await page.evaluate(()=>window.KAZE_SONGS);
    await check('all 18 slides, three tabs, notes and source links match verified data',async()=>{
      for (const [i,song] of songs.entries()) {
        assert.equal(await page.locator('#slide-title').innerText(),song.name);
        assert.equal(await page.locator('#slide-line').innerText(),song.line);
        for (const view of ['summary','interpretation','listen']) {
          await page.locator(`#tab-${view}`).click();
          assert.equal(await page.locator('#slide-text').innerText(),song[view]);
          assert.equal(await page.locator(`#tab-${view}`).getAttribute('aria-selected'),'true');
        }
        await page.locator('#notes-open').click();
        assert.equal(await page.locator('#notes-dialog').evaluate(d=>d.open),true);
        const links=await page.locator('#notes-content li a').evaluateAll(xs=>xs.map(x=>x.href));
        assert.deepEqual(links,song.sources.map(x=>x.url));
        assert.equal(await page.locator('#notes-content').innerText().then(t=>t.includes(song.meaning[0])),true);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#notes-open').evaluate(e=>e===document.activeElement),true);
        if(i<17) await page.locator('#next').click();
      }
      assert.equal(await page.locator('#next-label').innerText(),'再走一遍');
      await page.locator('#next').click();
      assert.equal(await page.locator('#previous').isDisabled(),true);
    });
    await check('keyboard slide navigation and tab arrows have separate behavior',async()=>{
      await page.locator('#slide-title').focus(); await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#slide-title').innerText(),songs[1].name);
      await page.keyboard.press('PageUp');
      await page.locator('#tab-summary').click(); await page.locator('#tab-summary').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#tab-interpretation').getAttribute('aria-selected'),'true');
      assert.equal(await page.locator('#slide-title').innerText(),songs[0].name);
      await page.locator('#slide-title').focus(); await page.keyboard.press('End');
      assert.equal(await page.locator('#slide-title').innerText(),songs[17].name);
      await page.keyboard.press('Home');
    });
    await check('chapter search, empty state, modal isolation and direct jump',async()=>{
      await page.locator('#chapter-open').click(); await page.locator('#chapter-search').fill('不存在999');
      assert.equal(await page.locator('#chapter-empty').isVisible(),true);
      await page.locator('#chapter-search').fill('Prema');
      assert.equal(await page.locator('.chapter-choice:visible').count(),1);
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#slide-title').innerText(),songs[0].name);
      await page.locator('.chapter-choice:visible').click();
      assert.equal(await page.locator('#slide-title').innerText(),songs[12].name);
      assert.equal(await page.locator('#chapter-dialog').evaluate(d=>d.open),false);
      assert.equal(await page.locator('#chapter-open').evaluate(e=>e===document.activeElement),true);
    });
    await check('share hash, saved chapter and corrupt storage are safe',async()=>{
      await page.reload(); assert.equal(await page.locator('#slide-title').innerText(),songs[12].name);
      await page.goto(url); assert.equal(await page.locator('#slide-title').innerText(),songs[12].name);
      await page.goto(`${url}#song-${songs[6].id}`); assert.equal(await page.locator('#slide-title').innerText(),songs[6].name);
      await page.evaluate(()=>localStorage.setItem('kaze-anime-v1','bad JSON'));
      await page.goto(`${url}#unknown`); await page.reload(); assert.equal(await page.locator('#slide-title').innerText(),songs[0].name);
      const blocked=await browser.newContext();
      await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}}));
      const p=await blocked.newPage(); await p.goto(url); await p.locator('#next').click();
      assert.equal(await p.locator('#slide-title').innerText(),songs[1].name); await blocked.close();
    });
    await check('horizontal swipe advances; vertical scroll and multitouch do not',async()=>{
      await page.locator('#slide-title').focus(); await page.keyboard.press('Home');
      const swipe=async(dx,dy,multi=false)=>page.evaluate(({dx,dy,multi})=>{
        const el=document.querySelector('.scene-panel');
        const touch=(id,x,y)=>new Touch({identifier:id,target:el,clientX:x,clientY:y});
        const a=touch(1,250,200),b=touch(2,200,200);
        el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:multi?[a,b]:[a]}));
        el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,touches:[],changedTouches:[touch(1,250+dx,200+dy)]}));
      },{dx,dy,multi});
      await swipe(-120,10); assert.equal(await page.locator('#slide-title').innerText(),songs[1].name);
      await swipe(-80,120); assert.equal(await page.locator('#slide-title').innerText(),songs[1].name);
      await swipe(-120,10,true); assert.equal(await page.locator('#slide-title').innerText(),songs[1].name);
      await swipe(120,10); assert.equal(await page.locator('#slide-title').innerText(),songs[0].name);
    });
    await check('reduced motion, rapid navigation and normal animations settle correctly',async()=>{
      await page.locator('#next').click(); assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.waitForFunction(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches);
      await page.waitForTimeout(50);
      await page.evaluate(()=>document.getElementById('next').click());
      assert.ok(await page.evaluate(()=>document.getAnimations().length)>0);
      await page.evaluate(()=>{for(let i=0;i<8;i++) document.getElementById('next').click();});
      assert.equal(await page.locator('#slide-title').innerText(),songs[10].name);
      await page.waitForTimeout(750);
      assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
      assert.equal(await page.locator('#slide-copy').evaluate(e=>getComputedStyle(e).opacity),'1');
      await page.emulateMedia({reducedMotion:'reduce'});
    });
    await check('responsive portrait and landscape layouts keep navigation accessible',async()=>{
      for(const [w,h] of [[1440,900],[1280,720],[844,390],[667,375],[390,844],[320,740],[768,1024]]) {
        await page.setViewportSize({width:w,height:h});
        await page.locator('#slide-title').focus(); await page.keyboard.press('Home');
        const metrics=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,button:document.querySelector('#next').getBoundingClientRect().toJSON(),copy:document.querySelector('#slide-copy').getBoundingClientRect().toJSON()}));
        assert.ok(metrics.width<=w,`horizontal overflow ${w}: ${JSON.stringify(metrics)}`);
        assert.ok(metrics.button.height>=44 && metrics.button.y+metrics.button.height<=h,`navigation clipped ${w}: ${JSON.stringify(metrics)}`);
        assert.ok(metrics.copy.height>100,`reading area too small ${w}`);
        for(const song of songs) {
          await page.evaluate(id=>{location.hash=`song-${id}`;},song.id);
          await page.waitForFunction(id=>document.getElementById('slide-title').textContent===window.KAZE_SONGS.find(s=>s.id===id).name,song.id);
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`title overflow ${song.id} ${w}`);
        }
        await page.locator('#slide-title').focus(); await page.keyboard.press('Home');
        await page.evaluate(()=>document.activeElement?.blur());
        await page.screenshot({path:path.join(artifactDir,`anime-${w}x${h}.png`),fullPage:true});
      }
    });
    await check('200 percent text size and fullscreen failure keep page usable',async()=>{
      await page.setViewportSize({width:1280,height:720});
      await page.addStyleTag({content:':root {font-size:200%;}'});
      await page.setViewportSize({width:320,height:740});
      assert.ok(await page.locator('#content-tabs').evaluate(e=>e.scrollWidth<=e.clientWidth));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.setViewportSize({width:1280,height:720});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.locator('#notes-open').click(); assert.equal(await page.locator('#notes-dialog').evaluate(d=>d.open),true);
      await page.keyboard.press('Escape'); await page.reload();
      await page.evaluate(()=>{document.documentElement.requestFullscreen=()=>Promise.reject(new Error('unsupported'));});
      if(await page.locator('#fullscreen').isVisible()) {
        await page.locator('#fullscreen').click(); assert.equal(await page.locator('#anime-toast').isVisible(),true);
      }
      await page.locator('#next').click(); assert.equal(await page.locator('#slide-title').innerText(),songs[1].name);
    });
    await check('no page errors',async()=>assert.deepEqual(errors,[]));
    fs.writeFileSync(path.join(artifactDir,'results.json'),JSON.stringify({url,checks:results,errors},null,2));
    console.log(`${results.length} anime browser checks passed. Screenshots: ${artifactDir}`);
  } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
