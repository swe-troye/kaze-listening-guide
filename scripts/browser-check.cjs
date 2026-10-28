'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.KAZE_PLAYWRIGHT_MODULE || 'playwright-core');
const executablePath = process.env.KAZE_BROWSER_PATH || '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const artifactDir = process.env.KAZE_QA_DIR || '/private/tmp/kaze-browser-qa';
const url = process.env.KAZE_SITE_URL || pathToFileURL(path.resolve(__dirname, '../dist/standalone.html')).href;
const results = [];
async function check(name, run) { await run(); results.push(name); console.log(`PASS ${name}`); }
async function mode(page, value) {
  await page.locator(`label:has(#${value}-mode)`).click();
  assert.equal(await page.locator(`#${value}-mode`).isChecked(), true, JSON.stringify(await page.evaluate(()=>({slow:document.getElementById('slow-mode').checked,quick:document.getElementById('quick-mode').checked,mode:document.body.dataset.mode,description:document.getElementById('mode-description').textContent}))));
  assert.equal(await page.locator('#song-nan-nan .summary-block').isVisible(), value === 'slow');
  assert.equal(await page.locator('#song-nan-nan .song-details').isVisible(), value === 'slow');
  assert.equal(await page.locator('#song-nan-nan .listen-tip').isVisible(), true);
}
(async () => {
  fs.mkdirSync(artifactDir, {recursive:true});
  const browser = await chromium.launch({executablePath, headless:true});
  const errors = [];
  try {
    const context = await browser.newContext({viewport:{width:1440,height:1000}, reducedMotion:'reduce'});
    const page = await context.newPage();
    page.on('pageerror', error => {errors.push(error.message); console.error('PAGE ERROR',error.stack);});
    await page.goto(url);
    await check('site loads 18 songs and 18 source disclosures', async () => {
      assert.equal(await page.locator('.song').count(),18);
      assert.equal(await page.locator('.song-sources').count(),18);
      assert.equal(await page.locator('.verified-note').count(),18);
      const count = await page.locator('.song-sources a[href^="https://"]').count();
      assert.ok(count >= 36);
    });
    await check('label clicks visibly switch slow → quick → slow and retain expanded content', async () => {
      await page.locator('#song-nan-nan .song-details > summary').click();
      await mode(page,'quick');
      await mode(page,'slow');
      assert.equal(await page.locator('#song-nan-nan .song-details').getAttribute('open'),'');
    });
    await check('keyboard arrows switch the native radio group', async () => {
      await page.locator('#slow-mode').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#quick-mode').isChecked(),true);
      assert.equal(await page.locator('#song-nan-nan .summary-block').isVisible(),false);
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.locator('#slow-mode').isChecked(),true);
    });
    await check('saved reading mode survives reload', async () => {
      await mode(page,'quick'); await page.reload();
      assert.equal(await page.locator('#quick-mode').isChecked(),true);
      assert.equal(await page.locator('#song-nan-nan .summary-block').isVisible(),false);
      await mode(page,'slow');
    });
    await check('sources remain available in both reading modes', async () => {
      await mode(page,'quick');
      await page.locator('#song-nan-nan .song-sources > summary').click();
      assert.equal(await page.locator('#song-nan-nan .song-sources a').first().isVisible(),true);
      assert.match(await page.locator('#song-nan-nan .song-sources').innerText(),/2026-10-28/);
      await mode(page,'slow');
    });
    await check('search, theme, favorites, read progress, reset and reload', async () => {
      await page.locator('#song-search').fill('Prema');
      assert.equal(await page.locator('.song:not([hidden])').count(),1);
      assert.equal(await page.locator('#song-prema').isVisible(),true);
      await page.locator('#clear-filters').click();
      await page.locator('#theme-filter').selectOption('放下');
      assert.ok(await page.locator('.song:not([hidden])').count() > 0);
      await page.locator('#clear-filters').click();
      await page.locator('#song-nan-nan [data-action="save"]').click();
      await page.locator('#saved-only').click();
      assert.equal(await page.locator('.song:not([hidden])').count(),1);
      await page.locator('#song-nan-nan [data-action="read"]').click();
      assert.equal(await page.locator('#progress-count').textContent(),'1 / 18');
      await page.reload();
      assert.equal(await page.locator('#song-nan-nan [data-action="save"]').getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('#song-nan-nan [data-action="read"]').getAttribute('aria-pressed'),'true');
      await page.locator('#song-search').fill('not a song');
      assert.equal(await page.locator('#empty-state').isVisible(),true);
      await page.locator('#empty-reset').click();
      assert.equal(await page.locator('.song:not([hidden])').count(),18);
    });
    await check('switch at a later song retains that song in the viewport', async () => {
      await page.locator('#song-michi-teyu-ku').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
      const threshold = await page.locator('#reading-controls').evaluate(el=>el.getBoundingClientRect().bottom);
      await mode(page,'quick');
      const box = await page.locator('#song-michi-teyu-ku').boundingBox();
      assert.ok(box.y + box.height > threshold && box.y < 1000,JSON.stringify(box));
      await mode(page,'slow');
    });
    await page.locator('#song-nan-nan').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
    await page.screenshot({path:path.join(artifactDir,'desktop-slow.png')});
    await mode(page,'quick');
    await page.screenshot({path:path.join(artifactDir,'desktop-quick.png')});
    await context.close();
    for (const width of [768,390,320]) {
      const mobile = await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
      const p = await mobile.newPage(); p.on('pageerror',error=>errors.push(error.message)); await p.goto(url);
      await check(`${width}px: no horizontal overflow, both modes and directory navigation`,async()=>{
        assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
        await mode(p,'quick'); await mode(p,'slow');
        await p.locator('#open-directory').click();
        assert.equal(await p.locator('#directory-dialog').evaluate(el=>el.open),true);
        await p.locator('#mobile-song-nav [data-nav="masshiro"]').click();
        assert.equal(await p.locator('#directory-dialog').evaluate(el=>el.open),false);
        assert.equal(await p.evaluate(()=>location.hash),'#song-masshiro');
        const box=await p.locator('#song-masshiro').boundingBox();
        assert.ok(box.y >= 0 && box.y < 900, JSON.stringify(box));
        await p.locator('#song-masshiro .song-details > summary').click();
        await p.locator('#song-masshiro .song-sources > summary').click();
        assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
      });
      await p.screenshot({path:path.join(artifactDir,`${width}-slow.png`)});
      await mode(p,'quick');
      await p.locator('#song-masshiro').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
      await p.screenshot({path:path.join(artifactDir,`${width}-quick.png`)});
      await mobile.close();
    }
    const blocked=await browser.newContext({viewport:{width:1280,height:900}});
    await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('storage disabled for QA');}}));
    const p=await blocked.newPage();p.on('pageerror',error=>errors.push(error.message));await p.goto(url);
    await check('unavailable storage still allows reading and both modes',async()=>{
      assert.equal(await p.locator('.song').count(),18);await mode(p,'quick');await mode(p,'slow');
      await p.locator('#song-nan-nan [data-action="read"]').click();
      assert.equal(await p.locator('#progress-count').textContent(),'1 / 18');
    });
    await check('CSS switches modes even with mode JS listeners removed',async()=>{
      await p.evaluate(()=>{for(const id of ['slow-mode','quick-mode']){const el=document.getElementById(id);el.replaceWith(el.cloneNode(true));}});
      await mode(p,'quick');await mode(p,'slow');
    });
    await blocked.close();
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(artifactDir,'results.json'),JSON.stringify({browser:await browser.version(),url,passed:results,errors},null,2));
    console.log(`${results.length} browser checks passed; screenshots: ${artifactDir}`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
