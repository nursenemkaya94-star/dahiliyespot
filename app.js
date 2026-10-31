let data, cards=[], index=0, flipped=false, lesson=null, mode='lesson';
const $=id=>document.getElementById(id);
let saved={known:[],again:[],favorites:[]};
try{const s=JSON.parse(localStorage.getItem('tusspot-v1'));if(s)for(const k of Object.keys(saved))if(Array.isArray(s[k]))saved[k]=s[k].filter(x=>typeof x==='string')}catch{}
function persist(){try{localStorage.setItem('tusspot-v1',JSON.stringify(saved))}catch{}}
function allCards(){return data.lessons.flatMap(l=>l.topics.flatMap(t=>t.cards.map(c=>({...c,topic:t.name,lesson:l.name}))))}
function stats(){const total=allCards().length;$('lessonCount').textContent=data.lessons.length;$('cardCount').textContent=total;const validIds=new Set(allCards().map(c=>c.id));const known=new Set(saved.known.filter(id=>validIds.has(id))).size;$('knownCount').textContent=known;$('progress').textContent='%'+Math.round(known/Math.max(total,1)*100)}
const icons=['✧','⌁','⬡','◈','❋','✣','⟡','❀','♡'];const colors=['#e6eddc','#f9ead8','#e8e4f1','#e4edf3','#f6e5df','#deede7','#f4ead9','#eae6ee','#e2ecf0'];
function renderLessons(){const query=$('search').value.toLocaleLowerCase('tr');$('lessons').replaceChildren();data.lessons.forEach((l,i)=>{if(![l.name,...l.topics.map(t=>t.name)].join(' ').toLocaleLowerCase('tr').includes(query))return;const b=document.createElement('button');b.className='lesson';b.style.setProperty('--tint',colors[i%colors.length]);b.style.setProperty('--accent','#66785b');const top=document.createElement('div');top.className='lesson-top';const icon=document.createElement('span');icon.className='icon';icon.textContent=icons[i%icons.length];const num=document.createElement('span');num.className='lesson-number';num.textContent='DERS '+String(i+1).padStart(2,'0');top.append(icon,num);const h=document.createElement('h3');h.textContent=l.name;const bottom=document.createElement('div');bottom.className='lesson-bottom';const p=document.createElement('p');p.textContent=l.topics.length+' konu · '+l.topics.reduce((n,t)=>n+t.cards.length,0)+' kart'+(l.coverage?' · İlk bölüm':'');const arrow=document.createElement('span');arrow.textContent='↗';bottom.append(p,arrow);b.append(top,h,bottom);b.onclick=()=>openLesson(l);$('lessons').append(b)});if(!$('lessons').children.length)$('lessons').textContent='Bu aramada ders veya konu bulunamadı.'}
function showStudy(){hideDaily(); $('questionsView').hidden=true; $('distributionView').hidden=true;$('pdfView').hidden=true;$('library').hidden=true;$('study').hidden=false;window.scrollTo(0,0)}
function setOptions(options){$('topics').replaceChildren();options.forEach(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;$('topics').append(o)})}
function openLesson(l){document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$('home').classList.add('active');lesson=l;mode='lesson';$('studyLesson').textContent='DAHİLİYE / '+l.name.toLocaleUpperCase('tr');$('studyTitle').textContent=l.name;$('studyCoverage').textContent=l.coverage||'';$('studyCoverage').hidden=!l.coverage;setOptions([['all','Tüm konular'],...l.topics.map((t,i)=>[String(i),t.name])]);showStudy();filterCards()}
function filterCards(){if(mode==='lesson'){const t=$('topics').value;const topics=t==='all'?lesson.topics:[lesson.topics[Number(t)]];cards=topics.flatMap(t=>t.cards.map(c=>({...c,topic:t.name,lesson:lesson.name})))}else cards=allCards().filter(c=>saved[mode].includes(c.id));index=0;flipped=false;renderCard()}
function collection(kind){$('studyCoverage').hidden=true;mode=kind;lesson=null;document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$(kind==='again'?'review':'favorites').classList.add('active');$('studyLesson').textContent='KİŞİSEL KOLEKSİYONUN';$('studyTitle').textContent=kind==='again'?'Tekrar edeceklerim':'Favori kartlarım';setOptions([['all','Tüm dersler']]);showStudy();filterCards()}
function renderCard(){const c=cards[index];$('empty').hidden=!!c;$('cardArea').hidden=!c;$('position').textContent=c?`${index+1} / ${cards.length}`:'0 kart';$('studyProgress').style.width=c?`${(index+1)/cards.length*100}%`:'0%';if(!c)return;$('cardText').textContent=flipped?c.answer:c.question;$('cardExplanation').hidden=!flipped;$('cardExplanation').textContent=flipped?(c.source_excerpt||c.explanation||''):'';$('cardKicker').textContent=flipped?'CEVAP':'HATIRLAMA ZAMANI';$('flashcard').classList.toggle('answer',flipped);$('flashcard').setAttribute('aria-label',flipped?'Kartın sorusunu göster':'Kartın cevabını göster');$('flipHint').textContent=flipped?'Soruyu görmek için karta dokun ↶':'Cevabı görmek için karta dokun ↗';$('flip').textContent=flipped?'Soruyu göster':'Cevabı göster';$('favorite').textContent=saved.favorites.includes(c.id)?'♥ Favorilerde':'♡ Favorilere ekle';$('source').textContent=c.lesson+' · '+(c.source?'İlk kitap / '+sourceBooks[c.source].part+'. parça':'İkinci kitap')+' · '+(c.book_page?'Kitap sayfa '+c.book_page+' / Parça sayfa '+c.page:'PDF sayfa '+c.page)+' ↗';$('source').onclick=()=>openPdf(c.page,c.source||'second');$('prev').disabled=index===0;$('next').disabled=index===cards.length-1;$('know').textContent=saved.known.includes(c.id)?'✓ Öğrenildi':'✓ Biliyorum';$('again').textContent=saved.again.includes(c.id)?'↻ Tekrar listesinde':'↻ Tekrar et'}
function flip(){if(!cards.length)return;flipped=!flipped;renderCard()}
function move(delta){index=Math.max(0,Math.min(cards.length-1,index+delta));flipped=false;renderCard()}
function mark(kind){const c=cards[index];if(!c)return;const other=kind==='known'?'again':'known';saved[other]=saved[other].filter(id=>id!==c.id);if(!saved[kind].includes(c.id))saved[kind].push(c.id);persist();stats();if(mode==='again'&&kind==='known'){filterCards();return}if(index<cards.length-1)move(1);else renderCard()}
$('home').onclick=()=>{hideDaily();renderDailyHome();$('questionsView').hidden=true;document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$('home').classList.add('active');$('library').hidden=false;$('study').hidden=true;$('pdfView').hidden=true;$('distributionView').hidden=true;stats()};$('back').onclick=$('home').onclick;$('favorites').onclick=()=>collection('favorites');$('review').onclick=()=>collection('again');$('search').oninput=renderLessons;$('topics').onchange=filterCards;$('flashcard').onclick=flip;$('flip').onclick=flip;$('next').onclick=()=>move(1);$('prev').onclick=()=>move(-1);$('know').onclick=()=>mark('known');$('again').onclick=()=>mark('again');$('favorite').onclick=()=>{const c=cards[index];if(!c)return;saved.favorites=saved.favorites.includes(c.id)?saved.favorites.filter(x=>x!==c.id):[...saved.favorites,c.id];persist();if(mode==='favorites')filterCards();else renderCard()};document.addEventListener('keydown',e=>{if($('study').hidden||['INPUT','SELECT','BUTTON','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();flip()}if(e.key==='ArrowRight')move(1);if(e.key==='ArrowLeft')move(-1)});
fetch('data/cards.json?v=daily-1510-500-v1', {cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{data=d;configurePdfSources(d.sources);stats();renderLessons();renderDistribution();renderDailyHome()}).catch(()=>{$('error').hidden=false;$('error').textContent='Kartlar yüklenemedi. Uygulamayı sunucu üzerinden açıp yeniden dene.'});

const sourceBooks={second:{label:'İkinci kitap · 874 sayfa',path:'library/dahiliye.pdf',pages:874},'first-part-1':{label:'İlk kitap · 1. parça · 140 sayfa',path:'library/dahiliye-ilk-parca1.pdf',pages:140}};
function configurePdfSources(sources){
 if(sources)Object.assign(sourceBooks,sources);
 $('pdfBook').replaceChildren();
 const order=['first-part-1','first-part-2','first-part-3','first-part-4','first-part-5','second'];
 order.filter(id=>sourceBooks[id]).forEach(id=>{const option=document.createElement('option');option.value=id;option.textContent=sourceBooks[id].label;$('pdfBook').append(option)});
 $('pdfBook').value=currentPdfSource;
}
let currentPdfSource='second';
function openPdf(pageNumber=1,sourceId='second'){
 hideDaily();
 const source=sourceBooks[sourceId];if(!source)return;
 const n=Number(pageNumber);
 if(!Number.isInteger(n)||n<1||n>source.pages){$('pdfStatus').textContent='1–'+source.pages+' arasında bir sayfa seç.';return;}
 currentPdfSource=sourceId;$('pdfBook').value=sourceId;$('pdfBookLabel').textContent=source.label;$('pdfPage').max=source.pages;
 const url='pdf-viewer.html?v=mobile-compat-v2&file='+encodeURIComponent(source.path)+'#page='+n;
 $('questionsView').hidden=true;$('library').hidden=true;$('study').hidden=true;$('distributionView').hidden=true;$('pdfView').hidden=false;
 document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$('pdf').classList.add('active');
 $('pdfPage').value=n;$('pdfStatus').textContent='';$('pdfFrame').src=url;$('pdfOpen').href=url;window.scrollTo(0,0);
}
$('pdf').onclick=()=>openPdf(1,currentPdfSource);$('pdfGo').onclick=()=>openPdf($('pdfPage').value,currentPdfSource);
$('pdfBook').onchange=()=>openPdf(1,$('pdfBook').value);
$('pdfPage').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();openPdf($('pdfPage').value,currentPdfSource);}});

function renderDistribution(){
 const total=allCards().length, topicCount=data.lessons.reduce((n,l)=>n+l.topics.length,0);
 $('distributionStats').replaceChildren();
 [[total,'kart'],[data.lessons.length,'ders'],[topicCount,'konu']].forEach(([value,label])=>{
  const item=document.createElement('div'),n=document.createElement('strong'),t=document.createElement('span');
  n.textContent=value;t.textContent=label;item.append(n,t);$('distributionStats').append(item);
 });
 $('distributionBooks').replaceChildren();
 const first=allCards().filter(c=>c.source).length,second=total-first;
 [[first,'ilk kitap'],[second,'ikinci kitap']].forEach(([value,label])=>{const el=document.createElement('div'),n=document.createElement('strong'),t=document.createElement('span');n.textContent=value;t.textContent=label;el.append(n,t);$('distributionBooks').append(el)});
 $('distributionBasis').textContent='Servis ve poliklinikte önemli klinik sorunları önceleyen çalışma planı. Hasta başvuru veya yatış sıklığına ait ölçülmüş bir dağılım değildir. TUS/YDUS geçmiş soru analizleri internet erişimi engeli nedeniyle henüz doğrulanmadı. Aşağıdaki paylar sınav yüzdesini veya klinik görülme sıklığını değil, bu uygulamadaki '+total+' kartın dağılımını gösterir.';
 $('distributionTables').replaceChildren();
 data.lessons.forEach(l=>{
  const section=document.createElement('details');section.className='allocation-section';section.open=true;
  const heading=document.createElement('summary'),name=document.createElement('strong'),count=document.createElement('span');
  name.textContent=l.name;count.textContent=l.topics.reduce((n,t)=>n+t.cards.length,0)+' kart';heading.append(name,count);section.append(heading);
  if(l.clinical_focus){const focus=document.createElement('p');focus.className='clinical-focus';focus.textContent=l.clinical_focus;section.append(focus)}
  const table=document.createElement('table'),caption=document.createElement('caption');caption.className='sr-only';caption.textContent=l.name+' konu dağılımı';table.append(caption);
  const head=document.createElement('thead'),header=document.createElement('tr');['Konu','Kart','Setteki payı',''].forEach(label=>{const th=document.createElement('th');th.textContent=label;th.scope='col';header.append(th)});head.append(header);table.append(head);
  const body=document.createElement('tbody');l.topics.forEach((t,i)=>{
   const tr=document.createElement('tr'),subject=document.createElement('th');subject.scope='row';subject.textContent=t.name;
   const n=document.createElement('td');n.className='allocation-count';n.textContent=t.cards.length;
   const share=document.createElement('td');share.textContent=(t.cards.length/total*100).toLocaleString('tr',{maximumFractionDigits:1})+'%';
   const action=document.createElement('td'),button=document.createElement('button');button.className='allocation-start';button.textContent='Çalış →';button.setAttribute('aria-label',t.name+' kartlarını çalış');button.onclick=()=>{openLesson(l);$('topics').value=String(i);filterCards()};action.append(button);
   tr.append(subject,n,share,action);body.append(tr);
  });table.append(body);section.append(table);$('distributionTables').append(section);
 });
}
$('distribution').onclick=()=>{hideDaily();$('questionsView').hidden=true;
 if(!data)return;
 $('library').hidden=true;$('study').hidden=true;$('pdfView').hidden=true;$('distributionView').hidden=false;
 document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$('distribution').classList.add('active');window.scrollTo(0,0);
};

// Each bank keeps its position and answers; legacy endocrine records are migrated once.
let quizData=null, quizIndex=0, quizBank='endo', quizAnswers={}, quizPlaces={};
try {
 const stored=localStorage.getItem('tusspot-quiz-v2');
 const parsed=JSON.parse(stored===null?localStorage.getItem('tusspot-endo-quiz-v1'):stored);
 if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))for(const [id,a] of Object.entries(parsed))if(Number.isInteger(a)&&a>=0&&a<4)quizAnswers[id]=a;
} catch {}
try {
 const stored=localStorage.getItem('tusspot-quiz-place-v2');
 if(stored){const state=JSON.parse(stored);if(typeof state.bank==='string')quizBank=state.bank;if(state.places&&typeof state.places==='object')quizPlaces=state.places;}
 else {const old=JSON.parse(localStorage.getItem('tusspot-endo-quiz-place-v1'));if(old)quizPlaces.endo=old;}
} catch {}
function saveQuiz(){try{localStorage.setItem('tusspot-quiz-v2',JSON.stringify(quizAnswers))}catch{}}
function saveQuizPlace(){
 quizPlaces[quizBank]={index:quizIndex,topic:$('quizTopic').value,filter:$('quizFilter').value};
 try{localStorage.setItem('tusspot-quiz-place-v2',JSON.stringify({bank:quizBank,places:quizPlaces}))}catch{}
}
function bankQuestions(){return quizData.questions.filter(q=>(q.bank||'endo')===quizBank)}
function quizList(){return bankQuestions().filter(q=>($('quizTopic').value==='all'||q.topic===$('quizTopic').value)&&($('quizFilter').value==='all'||($('quizFilter').value==='wrong'?q.id in quizAnswers&&quizAnswers[q.id]!==q.correct:!(q.id in quizAnswers))))}
function selectQuizBank(){
 const bank=quizData.banks.find(b=>b.id===quizBank)||quizData.banks[0];quizBank=bank.id;$('quizBank').value=quizBank;
 const questions=bankQuestions();
 $('quizTitle').textContent=bank.title+' soruları';
 $('quizSummary').textContent=questions.length+' soru · 4 seçenek · Orta–üst düzey';
 $('quizMapTitle').textContent='Soruya git · 1–'+questions.length;
 $('quizTopic').replaceChildren();
 ['all',...new Set(questions.map(q=>q.topic))].forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t==='all'?'Tüm konular':t;$('quizTopic').append(o)});
 const place=quizPlaces[quizBank]||{};
 $('quizTopic').value=[...$('quizTopic').options].some(o=>o.value===place.topic)?place.topic:'all';
 $('quizFilter').value=['all','wrong','unanswered'].includes(place.filter)?place.filter:'all';
 quizIndex=Number.isInteger(place.index)&&place.index>=0?place.index:0;
 $('quizResetPrompt').hidden=true;renderQuiz();
}
function renderQuiz(){
 const questions=bankQuestions(),list=quizList();quizIndex=Math.max(0,Math.min(quizIndex,list.length-1));const q=list[quizIndex];saveQuizPlace();
 const answered=questions.filter(q=>q.id in quizAnswers),correct=answered.filter(q=>quizAnswers[q.id]===q.correct).length;
 $('quizStats').replaceChildren();[[answered.length,'çözülen'],[correct,'doğru'],[answered.length-correct,'yanlış'],[questions.length-answered.length,'kalan']].forEach(([value,label])=>{const el=document.createElement('div'),n=document.createElement('strong'),t=document.createElement('span');n.textContent=value;t.textContent=label;el.append(n,t);$('quizStats').append(el)});
 $('quizCard').hidden=!q;$('quizEmpty').hidden=!!q;$('quizPosition').textContent=q?`Soru ${questions.indexOf(q)+1} / ${questions.length} · Bu listede ${quizIndex+1} / ${list.length}`:'0 soru';
 $('quizPrev').disabled=!q||quizIndex===0;$('quizNext').disabled=!q||quizIndex===list.length-1;
 $('quizMap').replaceChildren();questions.forEach((item,i)=>{const b=document.createElement('button');b.textContent=i+1;b.className=item.id in quizAnswers?(quizAnswers[item.id]===item.correct?'correct':'incorrect'):'';if(item===q)b.setAttribute('aria-current','step');b.setAttribute('aria-label',`${i+1}. soru · ${item.id in quizAnswers?(quizAnswers[item.id]===item.correct?'doğru':'yanlış'):'çözülmedi'}`);b.onclick=()=>{$('quizTopic').value='all';$('quizFilter').value='all';quizIndex=i;renderQuiz();$('quizPrompt').focus()};$('quizMap').append(b)});
 if(!q)return;
 $('quizTopicLabel').textContent=(q.lesson||'Endokrinoloji')+' · '+q.topic;$('quizPrompt').textContent=q.question;$('quizOptions').replaceChildren();
 const answeredCurrent=q.id in quizAnswers;
 q.options.forEach((option,i)=>{const b=document.createElement('button');b.className='quiz-option';b.textContent='ABCD'[i]+') '+option;b.disabled=answeredCurrent;
  if(answeredCurrent){if(i===q.correct){b.classList.add('correct');b.textContent+=' ✓ Doğru cevap'}else if(i===quizAnswers[q.id]){b.classList.add('incorrect');b.textContent+=' ✕ Seçimin'}}
  b.onclick=()=>{quizAnswers[q.id]=i;saveQuiz();if($('quizFilter').value!=='all'){$('quizFilter').value='all';quizIndex=quizList().indexOf(q)}renderQuiz()};$('quizOptions').append(b)});
 $('quizFeedback').hidden=!answeredCurrent;$('quizFeedback').replaceChildren();
 if(answeredCurrent){
  const result=document.createElement('strong');result.textContent=quizAnswers[q.id]===q.correct?'Doğru!':'Yanlış. Doğru cevap: '+ 'ABCD'[q.correct];
  const exp=document.createElement('p');exp.textContent=q.explanation;$('quizFeedback').append(result,exp);
  for(const excerpt of q.source_excerpts||[]){const box=document.createElement('blockquote');box.className='source-excerpt';const label=document.createElement('strong');label.textContent='Kaynak paragrafı · '+(excerpt.source==='second'?'İkinci kitap':'İlk kitap')+' · '+(excerpt.book_page?'kitap sayfa '+excerpt.book_page:'PDF sayfa '+excerpt.page);const text=document.createElement('p');text.textContent=excerpt.text;box.append(label,text);$('quizFeedback').append(box)}
  const retry=document.createElement('button');retry.className='back';retry.textContent='↻ Bu soruyu yeniden çöz';retry.onclick=()=>{delete quizAnswers[q.id];saveQuiz();$('quizFilter').value='all';quizIndex=quizList().indexOf(q);renderQuiz()};$('quizFeedback').append(retry);
  const citations=q.citations||q.pages.map(page=>({page,source:'second'}));
  citations.forEach(c=>{const b=document.createElement('button');b.className='back';
   const source=sourceBooks[c.source];
   b.textContent=(c.source==='second'?'İkinci kitap':'İlk kitap · '+source.part+'. parça')+' · '+(c.book_page?'kitap '+c.book_page+' / PDF '+c.page:'PDF sayfa '+c.page)+' ↗';
   b.onclick=()=>openPdf(c.page,c.source);$('quizFeedback').append(b);
  });
 }
}
$('questions').onclick=async()=>{hideDaily();
 ['library','study','pdfView','distributionView'].forEach(id=>$(id).hidden=true);$('questionsView').hidden=false;document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$('questions').classList.add('active');window.scrollTo(0,0);
 if(!quizData){
  $('quizPosition').textContent='Sorular yükleniyor…';
  try{
   quizData=await fetch('data/questions.json?v=daily-1510-500-v1',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()});
   configurePdfSources(quizData.sources);$('quizNote').textContent=quizData.note;
   $('quizBank').replaceChildren();quizData.banks.forEach(bank=>{const o=document.createElement('option');o.value=bank.id;o.textContent=bank.title+' · '+bank.count+' soru';$('quizBank').append(o)});
   selectQuizBank();saveQuiz();return;
  }catch{quizData=null;$('quizPosition').textContent='Sorular yüklenemedi. Sorular sekmesine yeniden dokunarak dene.';return;}
 }
 renderQuiz();
};
$('quizBank').onchange=()=>{if(!quizData)return;quizBank=$('quizBank').value;selectQuizBank()};
$('quizTopic').onchange=$('quizFilter').onchange=()=>{if(!quizData)return;quizIndex=0;renderQuiz()};
$('quizPrev').onclick=()=>{quizIndex--;renderQuiz();$('quizPrompt').focus()};$('quizNext').onclick=()=>{quizIndex++;renderQuiz();$('quizPrompt').focus()};
$('quizReset').onclick=()=>{if(quizData)$('quizResetPrompt').hidden=false};$('quizResetCancel').onclick=()=>{$('quizResetPrompt').hidden=true};
$('quizResetConfirm').onclick=()=>{if(!quizData)return;for(const q of bankQuestions())delete quizAnswers[q.id];saveQuiz();quizIndex=0;$('quizResetPrompt').hidden=true;renderQuiz()};

// Daily cards are fixed for a local calendar date; first self-assessment is retained.
const DAILY_KEY='tusspot-daily-v1';
let dailyHistory={},dailyDateShown=null,dailyIndex=0,dailyFlipped=false,dailySaveFailed=false;
try{const value=JSON.parse(localStorage.getItem(DAILY_KEY));if(value&&typeof value==='object'&&!Array.isArray(value))for(const [day,record] of Object.entries(value)){
 if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&record&&Array.isArray(record.ids)&&record.ids.length===20&&new Set(record.ids).size===20&&record.ids.every(id=>typeof id==='string')&&record.answers&&typeof record.answers==='object'&&!Array.isArray(record.answers)){
  const answers={};for(const [id,a]of Object.entries(record.answers))if(record.ids.includes(id)&&a&&typeof a.known==='boolean')answers[id]={known:a.known,at:typeof a.at==='string'?a.at:''};
  dailyHistory[day]={...record,answers};
 }
}}catch{}
function localDay(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}
function dayLabel(day){const [y,m,d]=day.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})}
function dailySeed(text){let h=2166136261;for(const char of text){h^=char.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function dailyShuffle(values,seed){const out=[...values];let x=seed||1;for(let i=out.length-1;i>0;i--){x^=x<<13;x^=x>>>17;x^=x<<5;const j=(x>>>0)%(i+1);[out[i],out[j]]=[out[j],out[i]]}return out}
function chooseDailyCards(day){
 const groups=data.lessons.map(l=>({id:l.id,cards:l.topics.flatMap(t=>t.cards).sort((a,b)=>a.id.localeCompare(b.id))})).filter(l=>l.cards.length).sort((a,b)=>a.id.localeCompare(b.id));
 const ordered=dailyShuffle(groups,dailySeed(day));const chosen=[];
 // Round-robin gives every available lesson a place before filling the remaining slots.
 for(let round=0;chosen.length<20;round++){
  let added=false;
  for(const group of ordered){const pool=dailyShuffle(group.cards,dailySeed(day+'|'+group.id));if(pool[round]){chosen.push(pool[round].id);added=true;if(chosen.length===20)break}}
  if(!added)break;
 }
 return dailyShuffle(chosen,dailySeed(day+'|order'));
}
function saveDaily(){try{localStorage.setItem(DAILY_KEY,JSON.stringify(dailyHistory));dailySaveFailed=false}catch{dailySaveFailed=true}$('dailyStorageStatus').textContent=dailySaveFailed?'Bu tarayıcı kayda izin vermedi; sonuçlar kalıcı kaydedilemedi.':'Kayıtlar bu cihazın tarayıcısında saklanır. Yedek indirerek koruyabilirsin.'}
function dailyResult(record){const values=record.ids.map(id=>record.answers[id]).filter(Boolean);return{done:values.length,known:values.filter(a=>a.known).length,again:values.filter(a=>!a.known).length}}
function todayDaily(create=false){const day=localDay();if(!dailyHistory[day]&&create){dailyHistory[day]={ids:chooseDailyCards(day),answers:{},startedAt:new Date().toISOString(),completedAt:null};saveDaily()}return dailyHistory[day]}
function renderDailyHome(){
 if(!data)return;const day=localDay(),record=todayDaily(),result=record?dailyResult(record):{done:0,known:0,again:0};
 $('dailyDate').textContent=dayLabel(day);$('dailyHomeProgress').textContent=result.done===20?`Tamamlandı · ${result.known}/20 bildim · %${result.known*5}`:`${result.done}/20 kart tamamlandı · 15 dersten karışık tekrar`;
 $('dailyStart').disabled=false;$('dailyStart').textContent=result.done===20?'Bugünün sonucunu gör':result.done?'Challenge’a devam et':'Günlük Challenge’a başla';
 $('dailyHistoryBody').replaceChildren();const days=Object.keys(dailyHistory).sort().reverse();
 $('dailyHistoryEmpty').hidden=days.length>0;
 for(const date of days){const r=dailyResult(dailyHistory[date]),row=document.createElement('tr');for(const text of [dayLabel(date),`${r.done}/20`,String(r.known),String(r.again),r.done===20?`%${r.known*5}`:'Devam ediyor']){const td=document.createElement('td');td.textContent=text;row.append(td)}$('dailyHistoryBody').append(row)}
 const completed=days.filter(d=>dailyResult(dailyHistory[d]).done===20);const sum=completed.reduce((n,d)=>n+dailyResult(dailyHistory[d]).known,0);
 $('dailyHistorySummary').textContent=completed.length?`${completed.length} gün tamamlandı · Ortalama %${Math.round(sum/(completed.length*20)*100)}`:'Sonuçların gün gün burada birikecek.';
 $('dailyStorageStatus').textContent=dailySaveFailed?'Bu tarayıcı kayda izin vermedi; sonuçlar kalıcı kaydedilemedi.':'Kayıtlar bu cihazın tarayıcısında saklanır. Yedek indirerek koruyabilirsin.';
}
function hideDaily(){$('dailyView').hidden=true}
function openDaily(){if(!data)return;dailyDateShown=localDay();const record=todayDaily(true);dailyIndex=record.ids.findIndex(id=>!record.answers[id]);if(dailyIndex<0)dailyIndex=0;dailyFlipped=false;
 ['library','study','pdfView','questionsView','distributionView'].forEach(id=>$(id).hidden=true);$('dailyView').hidden=false;document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));renderDailyCard();window.scrollTo(0,0)}
function refreshDailyDay(){if(dailyDateShown!==localDay()){openDaily();$('dailyLive').textContent='Yeni gün başladı; bugünün 20 kartı açıldı. Önceki kayıtların korundu.';return true}return false}
function renderDailyCard(){
 const record=dailyHistory[dailyDateShown];if(!record)return;const result=dailyResult(record);const all=allCards(),card=all.find(c=>c.id===record.ids[dailyIndex]);
 $('dailyViewDate').textContent=dayLabel(dailyDateShown);$('dailyScore').textContent=`${result.done}/20 tamamlandı · ${result.known} bildim · ${result.again} tekrar`;
 $('dailyComplete').hidden=result.done!==20;$('dailyComplete').textContent=result.done===20?`Bugünün Challenge’ı tamamlandı: ${result.known}/20 · %${result.known*5}. İlk değerlendirmelerin günlüğe kaydedildi.`:'';
 $('dailyPosition').textContent=`Kart ${dailyIndex+1} / 20`;
 if(!card){$('dailyQuestion').textContent='Bu kart güncel sette bulunamadı. Diğer kartlara geçebilirsin.';$('dailyAnswer').hidden=true;['dailyReveal','dailyKnown','dailyAgain','dailySource'].forEach(id=>$(id).disabled=true);return}
 const answered=record.answers[card.id];$('dailyLesson').textContent=card.lesson+' · '+card.topic;$('dailyQuestion').textContent=card.question;
 $('dailyAnswer').hidden=!dailyFlipped&&!answered;$('dailyAnswerText').textContent=card.answer;$('dailyExplanation').textContent=card.source_excerpt||card.explanation;
 $('dailyReveal').hidden=dailyFlipped||!!answered;$('dailyKnown').disabled=!dailyFlipped||!!answered;$('dailyAgain').disabled=!dailyFlipped||!!answered;
 $('dailyAssessment').textContent=answered?(answered.known?'Bu kartı bildim olarak kaydettin.':'Bu kartı tekrar olarak kaydettin.'):'Cevabı aç, sonra hatırlayıp hatırlamadığını kendin değerlendir.';
 $('dailySource').disabled=false;$('dailySource').onclick=()=>openPdf(card.page,card.source||'second');
 $('dailyPrev').disabled=dailyIndex===0;$('dailyNext').disabled=dailyIndex===19;
 renderDailyHome();
}
function assessDaily(known){if(refreshDailyDay())return;const record=dailyHistory[dailyDateShown],id=record.ids[dailyIndex];if(!dailyFlipped||record.answers[id])return;
 record.answers[id]={known,at:new Date().toISOString()};if(dailyResult(record).done===20&&!record.completedAt)record.completedAt=new Date().toISOString();saveDaily();
 const next=record.ids.findIndex((id,i)=>i>dailyIndex&&!record.answers[id]);const remaining=record.ids.findIndex(id=>!record.answers[id]);if(next>=0)dailyIndex=next;else if(remaining>=0)dailyIndex=remaining;dailyFlipped=false;renderDailyCard();
}
$('dailyStart').onclick=openDaily;$('dailyBack').onclick=()=>{$('home').click()};
$('dailyReveal').onclick=()=>{if(refreshDailyDay())return;dailyFlipped=true;renderDailyCard()};$('dailyKnown').onclick=()=>assessDaily(true);$('dailyAgain').onclick=()=>assessDaily(false);
$('dailyPrev').onclick=()=>{if(refreshDailyDay())return;dailyIndex=Math.max(0,dailyIndex-1);dailyFlipped=false;renderDailyCard()};$('dailyNext').onclick=()=>{if(refreshDailyDay())return;dailyIndex=Math.min(19,dailyIndex+1);dailyFlipped=false;renderDailyCard()};
$('dailyExport').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),days:dailyHistory},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tusspot-challenge-'+localDay()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
window.addEventListener('focus',()=>{if(!data)return;if(!$('dailyView').hidden)refreshDailyDay();renderDailyHome()});
