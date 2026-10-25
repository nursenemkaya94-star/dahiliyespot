let data, cards=[], index=0, flipped=false, lesson=null, mode='lesson';
const $=id=>document.getElementById(id);
let saved={known:[],again:[],favorites:[]};
try{const s=JSON.parse(localStorage.getItem('tusspot-v1'));if(s)for(const k of Object.keys(saved))if(Array.isArray(s[k]))saved[k]=s[k].filter(x=>typeof x==='string')}catch{}
function persist(){try{localStorage.setItem('tusspot-v1',JSON.stringify(saved))}catch{}}
function allCards(){return data.lessons.flatMap(l=>l.topics.flatMap(t=>t.cards.map(c=>({...c,topic:t.name,lesson:l.name}))))}
function stats(){const total=allCards().length;$('lessonCount').textContent=data.lessons.length;$('cardCount').textContent=total;const validIds=new Set(allCards().map(c=>c.id));const known=new Set(saved.known.filter(id=>validIds.has(id))).size;$('knownCount').textContent=known;$('progress').textContent='%'+Math.round(known/Math.max(total,1)*100)}
const icons=['✧','⌁','⬡','◈','❋','✣','⟡','❀','♡'];const colors=['#e6eddc','#f9ead8','#e8e4f1','#e4edf3','#f6e5df','#deede7','#f4ead9','#eae6ee','#e2ecf0'];
function renderLessons(){const query=$('search').value.toLocaleLowerCase('tr');$('lessons').replaceChildren();data.lessons.forEach((l,i)=>{if(![l.name,...l.topics.map(t=>t.name)].join(' ').toLocaleLowerCase('tr').includes(query))return;const b=document.createElement('button');b.className='lesson';b.style.setProperty('--tint',colors[i%colors.length]);b.style.setProperty('--accent','#66785b');const top=document.createElement('div');top.className='lesson-top';const icon=document.createElement('span');icon.className='icon';icon.textContent=icons[i%icons.length];const num=document.createElement('span');num.className='lesson-number';num.textContent='DERS '+String(i+1).padStart(2,'0');top.append(icon,num);const h=document.createElement('h3');h.textContent=l.name;const bottom=document.createElement('div');bottom.className='lesson-bottom';const p=document.createElement('p');p.textContent=l.topics.length+' konu · '+l.topics.reduce((n,t)=>n+t.cards.length,0)+' kart'+(l.coverage?' · İlk bölüm':'');const arrow=document.createElement('span');arrow.textContent='↗';bottom.append(p,arrow);b.append(top,h,bottom);b.onclick=()=>openLesson(l);$('lessons').append(b)});if(!$('lessons').children.length)$('lessons').textContent='Bu aramada ders veya konu bulunamadı.'}
function showStudy(){ $('questionsView').hidden=true; $('distributionView').hidden=true;$('pdfView').hidden=true;$('library').hidden=true;$('study').hidden=false;window.scrollTo(0,0)}
function setOptions(options){$('topics').replaceChildren();options.forEach(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;$('topics').append(o)})}
function openLesson(l){document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$('home').classList.add('active');lesson=l;mode='lesson';$('studyLesson').textContent='DAHİLİYE / '+l.name.toLocaleUpperCase('tr');$('studyTitle').textContent=l.name;$('studyCoverage').textContent=l.coverage||'';$('studyCoverage').hidden=!l.coverage;setOptions([['all','Tüm konular'],...l.topics.map((t,i)=>[String(i),t.name])]);showStudy();filterCards()}
function filterCards(){if(mode==='lesson'){const t=$('topics').value;const topics=t==='all'?lesson.topics:[lesson.topics[Number(t)]];cards=topics.flatMap(t=>t.cards.map(c=>({...c,topic:t.name,lesson:lesson.name})))}else cards=allCards().filter(c=>saved[mode].includes(c.id));index=0;flipped=false;renderCard()}
function collection(kind){$('studyCoverage').hidden=true;mode=kind;lesson=null;document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$(kind==='again'?'review':'favorites').classList.add('active');$('studyLesson').textContent='KİŞİSEL KOLEKSİYONUN';$('studyTitle').textContent=kind==='again'?'Tekrar edeceklerim':'Favori kartlarım';setOptions([['all','Tüm dersler']]);showStudy();filterCards()}
function renderCard(){const c=cards[index];$('empty').hidden=!!c;$('cardArea').hidden=!c;$('position').textContent=c?`${index+1} / ${cards.length}`:'0 kart';$('studyProgress').style.width=c?`${(index+1)/cards.length*100}%`:'0%';if(!c)return;$('cardText').textContent=flipped?c.answer:c.question;$('cardExplanation').hidden=!flipped;$('cardExplanation').textContent=flipped?(c.explanation||''):'';$('cardKicker').textContent=flipped?'CEVAP':'HATIRLAMA ZAMANI';$('flashcard').classList.toggle('answer',flipped);$('flashcard').setAttribute('aria-label',flipped?'Kartın sorusunu göster':'Kartın cevabını göster');$('flipHint').textContent=flipped?'Soruyu görmek için karta dokun ↶':'Cevabı görmek için karta dokun ↗';$('flip').textContent=flipped?'Soruyu göster':'Cevabı göster';$('favorite').textContent=saved.favorites.includes(c.id)?'♥ Favorilerde':'♡ Favorilere ekle';$('source').textContent=c.lesson+' · '+(c.source?'İlk kitap / '+sourceBooks[c.source].part+'. parça':'İkinci kitap')+' · '+(c.book_page?'Kitap sayfa '+c.book_page+' / Parça sayfa '+c.page:'PDF sayfa '+c.page)+' ↗';$('source').onclick=()=>openPdf(c.page,c.source||'second');$('prev').disabled=index===0;$('next').disabled=index===cards.length-1;$('know').textContent=saved.known.includes(c.id)?'✓ Öğrenildi':'✓ Biliyorum';$('again').textContent=saved.again.includes(c.id)?'↻ Tekrar listesinde':'↻ Tekrar et'}
function flip(){if(!cards.length)return;flipped=!flipped;renderCard()}
function move(delta){index=Math.max(0,Math.min(cards.length-1,index+delta));flipped=false;renderCard()}
function mark(kind){const c=cards[index];if(!c)return;const other=kind==='known'?'again':'known';saved[other]=saved[other].filter(id=>id!==c.id);if(!saved[kind].includes(c.id))saved[kind].push(c.id);persist();stats();if(mode==='again'&&kind==='known'){filterCards();return}if(index<cards.length-1)move(1);else renderCard()}
$('home').onclick=()=>{$('questionsView').hidden=true;document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$('home').classList.add('active');$('library').hidden=false;$('study').hidden=true;$('pdfView').hidden=true;$('distributionView').hidden=true;stats()};$('back').onclick=$('home').onclick;$('favorites').onclick=()=>collection('favorites');$('review').onclick=()=>collection('again');$('search').oninput=renderLessons;$('topics').onchange=filterCards;$('flashcard').onclick=flip;$('flip').onclick=flip;$('next').onclick=()=>move(1);$('prev').onclick=()=>move(-1);$('know').onclick=()=>mark('known');$('again').onclick=()=>mark('again');$('favorite').onclick=()=>{const c=cards[index];if(!c)return;saved.favorites=saved.favorites.includes(c.id)?saved.favorites.filter(x=>x!==c.id):[...saved.favorites,c.id];persist();if(mode==='favorites')filterCards();else renderCard()};document.addEventListener('keydown',e=>{if($('study').hidden||['INPUT','SELECT','BUTTON','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();flip()}if(e.key==='ArrowRight')move(1);if(e.key==='ArrowLeft')move(-1)});
fetch('data/cards.json?v=full-first-750-v1', {cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{data=d;configurePdfSources(d.sources);stats();renderLessons();renderDistribution()}).catch(()=>{$('error').hidden=false;$('error').textContent='Kartlar yüklenemedi. Uygulamayı sunucu üzerinden açıp yeniden dene.'});

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
 const source=sourceBooks[sourceId];if(!source)return;
 const n=Number(pageNumber);
 if(!Number.isInteger(n)||n<1||n>source.pages){$('pdfStatus').textContent='1–'+source.pages+' arasında bir sayfa seç.';return;}
 currentPdfSource=sourceId;$('pdfBook').value=sourceId;$('pdfBookLabel').textContent=source.label;$('pdfPage').max=source.pages;
 const url=source.path+'#page='+n+'&view=FitH';
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
 $('distributionBasis').textContent='Geçici klinik çalışma planı. TUS/YDUS geçmiş soru analizleri internet erişimi engeli nedeniyle henüz doğrulanmadı. Aşağıdaki paylar sınav yüzdesini veya klinik görülme sıklığını değil, bu uygulamadaki '+total+' kartın dağılımını gösterir.';
 $('distributionTables').replaceChildren();
 data.lessons.forEach(l=>{
  const section=document.createElement('details');section.className='allocation-section';section.open=true;
  const heading=document.createElement('summary'),name=document.createElement('strong'),count=document.createElement('span');
  name.textContent=l.name;count.textContent=l.topics.reduce((n,t)=>n+t.cards.length,0)+' kart';heading.append(name,count);section.append(heading);
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
$('distribution').onclick=()=>{$('questionsView').hidden=true;
 if(!data)return;
 $('library').hidden=true;$('study').hidden=true;$('pdfView').hidden=true;$('distributionView').hidden=false;
 document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$('distribution').classList.add('active');window.scrollTo(0,0);
};

// The quiz uses separate storage; flashcard progress is preserved.
let quizData=null, quizIndex=0, quizAnswers={};
try{const stored=JSON.parse(localStorage.getItem('tusspot-endo-quiz-v1'));if(stored&&typeof stored==='object'&&!Array.isArray(stored))for(const [id,a] of Object.entries(stored))if(Number.isInteger(a)&&a>=0&&a<4)quizAnswers[id]=a;}catch{}
function saveQuizPlace(){try{localStorage.setItem('tusspot-endo-quiz-place-v1',JSON.stringify({index:quizIndex,topic:$('quizTopic').value,filter:$('quizFilter').value}))}catch{}}
function saveQuiz(){try{localStorage.setItem('tusspot-endo-quiz-v1',JSON.stringify(quizAnswers))}catch{}}
function quizList(){return quizData.questions.filter(q=>($('quizTopic').value==='all'||q.topic===$('quizTopic').value)&&($('quizFilter').value==='all'||($('quizFilter').value==='wrong'?q.id in quizAnswers&&quizAnswers[q.id]!==q.correct:!(q.id in quizAnswers))))}
function renderQuiz(){
 const questions=quizData.questions,list=quizList();quizIndex=Math.max(0,Math.min(quizIndex,list.length-1));const q=list[quizIndex];saveQuizPlace();
 const answered=questions.filter(q=>q.id in quizAnswers),correct=answered.filter(q=>quizAnswers[q.id]===q.correct).length;
 $('quizStats').replaceChildren();[[answered.length,'çözülen'],[correct,'doğru'],[answered.length-correct,'yanlış'],[questions.length-answered.length,'kalan']].forEach(([value,label])=>{const el=document.createElement('div'),n=document.createElement('strong'),t=document.createElement('span');n.textContent=value;t.textContent=label;el.append(n,t);$('quizStats').append(el)});
 $('quizCard').hidden=!q;$('quizEmpty').hidden=!!q;$('quizPosition').textContent=q?`Soru ${questions.indexOf(q)+1} / 50 · Bu listede ${quizIndex+1} / ${list.length}`:'0 soru';
 $('quizPrev').disabled=!q||quizIndex===0;$('quizNext').disabled=!q||quizIndex===list.length-1;
 $('quizMap').replaceChildren();questions.forEach((item,i)=>{const b=document.createElement('button');b.textContent=i+1;b.className=item.id in quizAnswers?(quizAnswers[item.id]===item.correct?'correct':'incorrect'):'';if(item===q)b.setAttribute('aria-current','step');b.setAttribute('aria-label',`${i+1}. soru · ${item.id in quizAnswers?(quizAnswers[item.id]===item.correct?'doğru':'yanlış'):'çözülmedi'}`);b.onclick=()=>{$('quizTopic').value='all';$('quizFilter').value='all';quizIndex=i;renderQuiz();$('quizPrompt').focus()};$('quizMap').append(b)});
 if(!q)return;
 $('quizTopicLabel').textContent=q.topic;$('quizPrompt').textContent=q.question;$('quizOptions').replaceChildren();
 const answeredCurrent=q.id in quizAnswers;
 q.options.forEach((option,i)=>{const b=document.createElement('button');b.className='quiz-option';b.textContent='ABCD'[i]+') '+option;b.disabled=answeredCurrent;
 if(answeredCurrent){if(i===q.correct){b.classList.add('correct');b.textContent+=' ✓ Doğru cevap'}else if(i===quizAnswers[q.id]){b.classList.add('incorrect');b.textContent+=' ✕ Seçimin'}}
 b.onclick=()=>{quizAnswers[q.id]=i;saveQuiz();/* Keep feedback visible even when the active filter would remove this item. */if($('quizFilter').value!=='all'){$('quizFilter').value='all';quizIndex=quizList().indexOf(q)}renderQuiz()};$('quizOptions').append(b)});
 $('quizFeedback').hidden=!answeredCurrent;$('quizFeedback').replaceChildren();
 if(answeredCurrent){const result=document.createElement('strong');result.textContent=quizAnswers[q.id]===q.correct?'Doğru!':'Yanlış. Doğru cevap: '+ 'ABCD'[q.correct];const exp=document.createElement('p');exp.textContent=q.explanation;$('quizFeedback').append(result,exp);const retry=document.createElement('button');retry.className='back';retry.textContent='↻ Bu soruyu yeniden çöz';retry.onclick=()=>{delete quizAnswers[q.id];saveQuiz();$('quizFilter').value='all';quizIndex=quizList().indexOf(q);renderQuiz()};$('quizFeedback').append(retry);q.pages.forEach(page=>{const b=document.createElement('button');b.className='back';b.textContent='Kaynak PDF · sayfa '+page+' ↗';b.onclick=()=>openPdf(page);$('quizFeedback').append(b)})}
}
$('questions').onclick=async()=>{
 ['library','study','pdfView','distributionView'].forEach(id=>$(id).hidden=true);$('questionsView').hidden=false;document.querySelectorAll('.nav').forEach(b=>b.classList.remove('active'));$('questions').classList.add('active');window.scrollTo(0,0);
 if(!quizData){$('quizPosition').textContent='Sorular yükleniyor…';try{quizData=await fetch('data/questions.json?v=endo-quiz-v1',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()});$('quizNote').textContent=quizData.note;$('quizTopic').replaceChildren();['all',...new Set(quizData.questions.map(q=>q.topic))].forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t==='all'?'Tüm konular':t;$('quizTopic').append(o)});try{const place=JSON.parse(localStorage.getItem('tusspot-endo-quiz-place-v1'));if(place){if([...$('quizTopic').options].some(o=>o.value===place.topic))$('quizTopic').value=place.topic;if(['all','wrong','unanswered'].includes(place.filter))$('quizFilter').value=place.filter;if(Number.isInteger(place.index)&&place.index>=0)quizIndex=place.index}}catch{}}catch{$('quizPosition').textContent='Sorular yüklenemedi. Sorular sekmesine yeniden dokunarak dene.';return}}
 renderQuiz();
};
$('quizTopic').onchange=$('quizFilter').onchange=()=>{if(!quizData)return;quizIndex=0;renderQuiz()};
$('quizPrev').onclick=()=>{quizIndex--;renderQuiz();$('quizPrompt').focus()};$('quizNext').onclick=()=>{quizIndex++;renderQuiz();$('quizPrompt').focus()};
$('quizReset').onclick=()=>{$('quizResetPrompt').hidden=false};$('quizResetCancel').onclick=()=>{$('quizResetPrompt').hidden=true};$('quizResetConfirm').onclick=()=>{quizAnswers={};saveQuiz();quizIndex=0;$('quizResetPrompt').hidden=true;if(quizData)renderQuiz()};
