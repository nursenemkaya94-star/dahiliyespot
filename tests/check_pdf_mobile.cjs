// Optional browser regression: run the HTTP server, then node tests/check_pdf_mobile.cjs.
// Requires Playwright and Chromium; emulates missing APIs on older mobile browsers.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await b.newPage({viewport:{width:390,height:844}});
 await page.addInitScript(()=>{URL.parse=undefined;Promise.withResolvers=undefined});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text())});
 for(const [file,n] of [['dahiliye-ilk-parca2.pdf',81],['dahiliye.pdf',39]]){
  await page.goto((process.env.TUSSPOT_BASE_URL || 'http://127.0.0.1:3000/')+'pdf-viewer.html?file='+encodeURIComponent('library/'+file)+'#page='+n);
  await page.locator(`canvas[data-page="${n}"]`).waitFor({timeout:90000});
  assert.equal(await page.locator('#status').textContent(),'');
  const download=await page.locator('#download').getAttribute('href');assert.ok(download.endsWith('/library/'+file));
  await page.evaluate(n=>location.hash='page='+(n+1),n);
  await page.locator(`canvas[data-page="${n+1}"]`).waitFor({timeout:90000});
  console.log('Older mobile APIs:',file,'pages',n,n+1,'OK');
 }
 assert.deepEqual(errors,[]);await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
