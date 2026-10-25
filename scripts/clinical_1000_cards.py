"""Apply the 500+500 clinical plan while keeping retained cards and browser IDs stable."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RANGES=[(211,313,'Hematoloji'),(314,492,'Nefroloji'),(493,590,'Gastroenteroloji'),(591,658,'Hepatoloji')]

def apply_clinical_plan(result):
    plan=json.loads((ROOT/'data/clinical_1000_plan.json').read_text())
    archived=set(plan['archived_cardio_ids'])
    assert len(archived)==30
    lessons={l['name']:l for l in result['lessons']}
    original={c['id'] for l in result['lessons'] for t in l['topics'] for c in t['cards']}
    assert archived<=original
    for l in result['lessons']:
        for t in l['topics']:
            t['cards']=[c for c in t['cards'] if c['id'] not in archived]
        l['topics']=[t for t in l['topics'] if t['cards']]
    texts={src:subprocess.check_output(['pdftotext','-raw',str(ROOT/info['path']),'-']).decode().split('\f') for src,info in result['sources'].items() if src.startswith('first-part-')}
    new_ids=set()
    for n,row in enumerate((ROOT/'data/editorial_clinical_1000.tsv').read_text().splitlines(),1):
        name,global_page,topic,statement,question=row.split('|');global_page=int(global_page)
        assert any(a<=global_page<=b and lesson==name for a,b,lesson in RANGES),n
        part=(global_page-1)//140+1;source=f'first-part-{part}';local_page=global_page-(part-1)*140
        answers=re.findall(r'{{([^{}]+)}}',statement);assert len(answers)==1,n
        answer=answers[0];quote=statement.replace('{{','').replace('}}','')
        assert question.count('________')==1 and answer.casefold() not in question.casefold(),n
        assert not re.match(r'^(Bu |En sık |En önemli |Genellikle |Ancak )',question),n
        assert len(quote.split())<=90,n
        normalize=lambda s:re.sub(r'\s+','',s)
        assert normalize(quote) in normalize(texts[source][local_page-1]),f'Quote mismatch: {global_page}: {quote}'
        identity=f'clinical-1000|{name}|{global_page}|{statement}'
        card_id='fact-'+hashlib.sha256(identity.encode()).hexdigest()[:16]
        assert card_id not in original|new_ids,n
        new_ids.add(card_id)
        lesson=lessons[name]
        group=next((t for t in lesson['topics'] if t['name']==topic),None)
        if group is None:group={'name':topic,'cards':[]};lesson['topics'].append(group)
        group['cards'].append({'id':card_id,'question':question,'answer':answer,'explanation':quote,'page':local_page,'book_page':global_page,'source':source})
    assert len(new_ids)==280
    for item in plan['lessons']:
        l=lessons[item['name']]
        assert {t['name']:len(t['cards']) for t in l['topics']}=={t['name']:t['target'] for t in item['topics']},item['name']
        l['clinical_focus']=item['clinical_focus']
    first_names=[l['name'] for l in plan['lessons']]
    result['lessons']=[lessons[name] for name in first_names]+[l for l in result['lessons'] if l['name'] not in first_names]
    counts={'first':0,'second':0}
    for l in result['lessons']:
        for t in l['topics']:
            for c in t['cards']:counts['first' if c.get('source') else 'second']+=1
    assert counts==plan['book_targets']
    result['book_counts']=counts
    result['study_plan']['lessons']=plan['lessons']+[l for l in result['study_plan']['lessons'] if l['name'] not in first_names]
    result['study_plan']['clinical_note']=plan['note']
    result['version']='clinical-1000-v1'
    result['status']='İki kitapta 500’er kart: toplam 1.000. Servis ve poliklinikte önemli klinik sorunları önceleyen editoryal çalışma seti; doğrulanmış hasta sıklığı veya sınav yüzdesi değildir. Kaynak alıntıları korunur. Uzman incelemesi yapılmadı.'
    return result
