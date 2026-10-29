'use strict';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/private/tmp/vaundy-browsers';
const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.KAZE_PLAYWRIGHT_MODULE||'/Users/troye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
(async()=>{
 const engine=process.env.KAZE_BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true,...(engine===chromium?{executablePath:process.env.KAZE_BROWSER_PATH||'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[],externalAdErrors=[];page.on('pageerror',e=>{if(/\/{1,2}www\.youtube\.com\/pagead\/interaction\/.*due to access control checks/.test(e.message))externalAdErrors.push('YouTube ad interaction CORS');else errors.push(e.message);});page.on('console',m=>{if(process.env.KAZE_DIAG)console.log('CONSOLE',m.type(),m.text());});page.on('requestfailed',r=>{if(process.env.KAZE_DIAG)console.log('FAILED',r.url().split('?')[0],r.failure()?.errorText);});
  if(process.env.KAZE_TEST_LOCAL_SCRIPT)await page.route('**/youtube.js',r=>r.fulfill({contentType:'text/javascript',body:require('node:fs').readFileSync(require('node:path').join(__dirname,'../youtube.js'),'utf8')}));
  if(process.env.KAZE_TEST_HOST)await page.route('**/youtube.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace("host:'https://www.youtube-nocookie.com'","host:'https://www.youtube.com'")});});
  await page.goto(new URL('youtube.html#song-'+(process.env.KAZE_TEST_SONG||'nan-nan'),process.env.KAZE_SITE_URL||'http://127.0.0.1:4175/').href);
  await page.waitForFunction(()=>!document.querySelector('#play').disabled,null,{timeout:30000});
  if(!process.env.KAZE_TEST_SONG)assert.match(await page.locator('iframe').getAttribute('src'),/youtube-nocookie\.com\/embed\/Nt6ZwuVzOS4/);
  await page.click('#play');
  if(process.env.KAZE_DIAG){await page.waitForTimeout(12000);console.log('STATUS',await page.locator('#player-status').innerText());console.log('FRAME',await page.locator('iframe').getAttribute('src'));for(const frame of page.frames().slice(1)){console.log('FRAME TEXT',await frame.locator('body').innerText().catch(()=>''));console.log('REASON',await frame.evaluate(()=>({initial:window.ytInitialPlayerResponse?.playabilityStatus,response:document.querySelector('#movie_player')?.getPlayerResponse?.()?.playabilityStatus})).catch(()=>null));}await page.screenshot({path:'/private/tmp/kaze-youtube-diagnostic.png',fullPage:true});}
  if(process.env.KAZE_TEST_SONG){assert.match(await page.locator('#player-status').innerText(),/影片播放中/);return;}
  async function waitForSongPlayback(expectedTitle){
   const deadline=Date.now()+90000;
   while(Date.now()<deadline){
    try{await page.waitForFunction(title=>(!title||document.querySelector('#song-title').textContent===title)&&document.querySelector('#player-status').textContent.includes('影片播放中')&&Number(document.querySelector('#time').textContent.split(':')[1])>=2,expectedTitle,{timeout:1500});return;}catch{}
    for(const frame of page.frames().slice(1)){
     const skip=frame.locator('.ytp-skip-ad-button,.ytp-ad-skip-button,.ytp-ad-skip-button-modern').first();
     if(await skip.isVisible().catch(()=>false))await skip.click({timeout:1000}).catch(()=>{});
    }
   }
   throw Error('Real YouTube playback did not advance: '+await page.locator('#player-status').innerText());
  }
  await waitForSongPlayback();
  console.log('PASS live YouTube video playback time advances in '+engine.name());
  assert.match(await page.locator('#content-kind').innerText(),/原創繁中翻譯/);
  const cue=await page.evaluate(()=>window.KazeTimeline.parseLRC(window.KAZE_LRC['nan-nan'].text)[1]);
  await page.locator('[data-cue="1"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-cue="1"]').getAttribute('aria-current')==='true');
  assert.equal(await page.locator('[data-cue="1"] .cue-primary').evaluate(el=>{const copy=el.cloneNode(true);copy.querySelectorAll('rt').forEach(x=>x.remove());return copy.textContent;}),cue.primary);
  assert.equal(await page.locator('[data-cue="1"] .cue-secondary').innerText(),cue.secondary);
  console.log('PASS bundled Japanese and Chinese seek and highlight together on live playback');
  await page.locator('#lrc-file').setInputFiles({name:'original-test.lrc',mimeType:'text/plain',buffer:Buffer.from('[00:00]本機測試提示一\n[00:02]本機測試提示二\n[00:40]本機測試提示三')});
  await page.waitForFunction(()=>document.querySelectorAll('.cue').length===3);await page.locator('[data-cue="1"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-cue="1"]').getAttribute('aria-current')==='true');console.log('PASS real YouTube seeking highlights imported local cue');
  await page.click('#next');
  await waitForSongPlayback('もうええわ');
  console.log('PASS next official video starts and its playback time advances');assert.match(await page.locator('#content-kind').innerText(),/原創繁中翻譯/);assert.deepEqual(errors,[]);if(externalAdErrors.length)console.log(`${externalAdErrors.length} third-party YouTube ad tracking CORS errors recorded separately; playback checks passed.`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:process.env.KAZE_LIVE_SCREENSHOT||'/private/tmp/kaze-youtube-live.png',fullPage:true});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
