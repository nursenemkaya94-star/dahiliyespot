// Optional browser regression: run the HTTP server, then node tests/check_daily.cjs.
const {chromium}=require('playwright');const assert=require('node:assert/strict');
const fs=require('node:fs');const base=process.env.TUSSPOT_BASE_URL||'http://127.0.0.1:3000/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[],pdfRequests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\.pdf(?:$|[?#])/.test(r.url()))pdfRequests.push(r.url())});
 await page.clock.install({time:new Date('2026-10-31T12:00:00Z')});
 await page.goto(base);await page.locator('#cardCount').filter({hasText:'1510'}).waitFor();
 const today=await page.evaluate(()=>localDay());
 await page.locator('#dailyStart').click();assert.equal(await page.locator('#dailyKnown').isDisabled(),true);
 const state=await page.evaluate(()=>dailyHistory[localDay()]);assert.equal(state.ids.length,20);assert.equal(new Set(state.ids).size,20);
 const lessons=await page.evaluate(()=>new Set(dailyHistory[localDay()].ids.map(id=>allCards().find(c=>c.id===id).lesson)).size);assert.equal(lessons,15);
 await page.locator('#dailyReveal').click();assert.ok(await page.locator('#dailyExplanation').innerText());assert.equal(pdfRequests.length,0);
 await page.locator('#dailyKnown').click();await page.reload();await page.locator('#dailyStart').click();
 assert.match(await page.locator('#dailyScore').innerText(),/1\/20/);
 assert.deepEqual(await page.evaluate(()=>dailyHistory[localDay()].ids),state.ids);
 for(let i=1;i<20;i++){await page.locator('#dailyReveal').click();await page.locator(i%2?'#dailyAgain':'#dailyKnown').click()}
 assert.equal(await page.locator('#dailyComplete').isVisible(),true);
 const result=await page.evaluate(()=>dailyResult(dailyHistory[localDay()]));assert.deepEqual(result,{done:20,known:10,again:10});
 await page.locator('#dailyPrev').click();assert.equal(await page.locator('#dailyKnown').isDisabled(),true);
 await page.locator('#dailyBack').click();await page.locator('.daily-history summary').click();
 assert.match(await page.locator('#dailyHistoryBody').innerText(),/%50/);
 const download=page.waitForEvent('download');await page.locator('#dailyExport').click();const file=await download;const path=await file.path();const backup=JSON.parse(fs.readFileSync(path,'utf8'));assert.equal(Object.keys(backup.days).length,1);
 await page.clock.fastForward('24:00:00');await page.locator('#home').click();await page.locator('#dailyStart').click();
 const tomorrow=await page.evaluate(()=>localDay());assert.notEqual(today,tomorrow);
 const next=await page.evaluate(()=>dailyHistory[localDay()]);assert.notDeepEqual(next.ids,state.ids);assert.equal(Object.keys(next.answers).length,0);
 assert.deepEqual(await page.evaluate(day=>dailyResult(dailyHistory[day]),today),result);
 // Midnight rollover cannot accidentally grade yesterday's card as a new day's answer.
 await page.locator('#dailyReveal').click();await page.clock.fastForward('24:00:00');await page.locator('#dailyKnown').click();
 assert.match(await page.locator('#dailyLive').innerText(),/Yeni gün/);
 assert.equal(await page.evaluate(()=>dailyResult(dailyHistory[localDay()]).done),0);
 await page.locator('#dailyBack').click();await page.locator('#questions').click();await page.locator('#quizBank').selectOption('neph');
 await page.locator('#quizOptions button').first().click();assert.ok(await page.locator('.source-excerpt').first().innerText());assert.equal(pdfRequests.length,0);
 await page.locator('#home').click();await page.locator('button.lesson').filter({has:page.getByRole('heading',{name:'Nefroloji',exact:true})}).click();await page.locator('#flip').click();assert.ok(await page.locator('#cardExplanation').innerText());assert.equal(pdfRequests.length,0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('Daily 20/15 lessons, deterministic resume, first scores, history/export, new day/midnight, mobile and PDF-free excerpts passed');
 await page.goto(base+'TUS-Spot.html');await page.locator('#dailyStart').click();await page.locator('#dailyReveal').click();assert.ok(await page.locator('#dailyExplanation').innerText());console.log('Standalone daily challenge passed');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
