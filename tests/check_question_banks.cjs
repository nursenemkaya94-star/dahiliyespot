// Optional end-to-end checks: requires an HTTP server, Playwright and Chromium.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const data=require('../data/questions.json');
const base=process.env.TUSSPOT_BASE_URL||'http://127.0.0.1:3000/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 await page.evaluate(()=>{
  localStorage.clear();localStorage.setItem('tusspot-endo-quiz-v1',JSON.stringify({'endo-mcq-001':0}));
  localStorage.setItem('tusspot-endo-quiz-place-v1',JSON.stringify({index:4,topic:'all',filter:'all'}));
  localStorage.setItem('tusspot-v1',JSON.stringify({known:['keep-known'],again:[],favorites:['keep-favorite']}));
 });
 await page.reload();await page.locator('#questions').click();
 await page.locator('#quizPosition').filter({hasText:'Soru 5 / 50'}).waitFor();
 assert.equal(await page.locator('#quizBank option').count(),13);
 assert.match(await page.locator('#quizStats').innerText(),/1\s*çözülen/);
 for(const bank of data.banks){
  await page.locator('#quizBank').selectOption(bank.id);
  assert.equal(await page.locator('#quizMap button').count(),bank.count);
  assert.equal(await page.locator('#quizOptions button').count(),4);
  assert.match(await page.locator('#quizSummary').innerText(),new RegExp(`${bank.count} soru`));
  assert.ok(await page.locator('#quizPrompt').innerText());
 }
 await page.locator('#quizBank').selectOption('neph');
 const neph=data.questions.filter(q=>q.bank==='neph');
 const wrong=(neph[0].correct+1)%4;
 await page.locator('#quizOptions button').nth(wrong).click();
 assert.equal(await page.locator('#quizOptions button:disabled').count(),4);
 assert.match(await page.locator('#quizFeedback').innerText(),/Yanlış/);
 await page.locator('#quizFilter').selectOption('wrong');
 assert.match(await page.locator('#quizPosition').innerText(),/Bu listede 1 \/ 1/);
 await page.locator('#quizFeedback button').first().click();
 assert.equal(await page.locator('#quizOptions button:disabled').count(),0);
 await page.locator('#quizOptions button').nth(neph[0].correct).click();
 assert.match(await page.locator('#quizFeedback').innerText(),/Doğru!/);
 const cite=neph[0].citations[0];
 await page.locator('#quizFeedback button').last().click();
 await page.frameLocator('#pdfFrame').locator(`canvas[data-page="${cite.page}"]`).waitFor({timeout:90000});
 const sourceURL=new URL(await page.locator('#pdfFrame').getAttribute('src'),base);
 assert.equal(sourceURL.searchParams.get('file'),data.sources[cite.source].path);
 await page.locator('#questions').click();
 await page.locator('#quizFilter').selectOption('all');await page.locator('#quizNext').click();
 assert.match(await page.locator('#quizPosition').innerText(),/Soru 2 \/ 50/);
 await page.locator('#quizBank').selectOption('endo');
 assert.match(await page.locator('#quizPosition').innerText(),/Soru 5 \/ 50/);
 await page.locator('#quizBank').selectOption('neph');
 assert.match(await page.locator('#quizPosition').innerText(),/Soru 2 \/ 50/);
 await page.reload();await page.locator('#questions').click();
 await page.locator('#quizPosition').filter({hasText:'Soru 2 / 50'}).waitFor();
 assert.equal(await page.locator('#quizBank').inputValue(),'neph');
 // Reset only the current group; legacy endocrine history and flashcards remain.
 await page.locator('#quizReset').click();await page.locator('#quizResetCancel').click();
 let answers=await page.evaluate(()=>JSON.parse(localStorage.getItem('tusspot-quiz-v2')));
 assert.equal(answers[neph[0].id],neph[0].correct);
 await page.locator('#quizReset').click();await page.locator('#quizResetConfirm').click();
 answers=await page.evaluate(()=>JSON.parse(localStorage.getItem('tusspot-quiz-v2')));
 assert.equal(answers['endo-mcq-001'],0);assert.equal(answers[neph[0].id],undefined);
 await page.reload();await page.locator('#questions').click();await page.locator('#quizBank option').first().waitFor({state:'attached'});
 answers=await page.evaluate(()=>JSON.parse(localStorage.getItem('tusspot-quiz-v2')));
 assert.equal(answers[neph[0].id],undefined);
 await page.locator('#quizBank').selectOption('endo');await page.locator('#quizReset').click();await page.locator('#quizResetConfirm').click();
 await page.reload();await page.locator('#questions').click();await page.locator('#quizBank option').first().waitFor({state:'attached'});
 answers=await page.evaluate(()=>JSON.parse(localStorage.getItem('tusspot-quiz-v2')));assert.equal(answers['endo-mcq-001'],undefined);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('tusspot-v1'))),{known:['keep-known'],again:[],favorites:['keep-favorite']});
 // Source buttons of every question use correct book and physical page.
 const links=await page.evaluate(()=>{
  const frame=document.getElementById('pdfFrame');let target='';
  Object.defineProperty(frame,'src',{configurable:true,set(v){target=v},get(){return target}});
  const results=[];
  for(const bank of quizData.banks){
   quizBank=bank.id;selectQuizBank();document.getElementById('quizTopic').value='all';document.getElementById('quizFilter').value='all';
   const group=bankQuestions();
   group.forEach((q,i)=>{quizIndex=i;quizAnswers[q.id]=q.correct;renderQuiz();
    const buttons=[...document.getElementById('quizFeedback').querySelectorAll('button')].slice(1);
    buttons.forEach((b,j)=>{b.click();results.push({id:q.id,citation:j,url:target})});
   });
  }
  delete frame.src;return results;
 });
 for(const link of links){const q=data.questions.find(q=>q.id===link.id);const c=(q.citations||q.pages.map(page=>({source:'second',page})))[link.citation];
  const url=new URL(link.url,base);assert.equal(url.searchParams.get('file'),data.sources[c.source].path,link.id);assert.equal(url.hash,`#page=${c.page}`,link.id);
 }
 console.log('All 13 banks, migration, answer locking, filters, retry, per-bank persistence/reset and',links.length,'source links passed');
 await page.goto(base+'TUS-Spot.html');await page.locator('#questions').click();
 await page.locator('#quizBank').selectOption('gastro-hep');
 assert.equal(await page.locator('#quizMap button').count(),50);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('Single-file build and mobile layout passed');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
