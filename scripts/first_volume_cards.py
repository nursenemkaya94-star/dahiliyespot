"""Merge the remaining audited pages/cards of volume one; retain all existing IDs."""
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RANGES = [(141,210,'Göğüs Hastalıkları'),(211,313,'Hematoloji'),(314,492,'Nefroloji'),(493,590,'Gastroenteroloji'),(591,658,'Hepatoloji')]

def append_remaining_volume(result, audit=True):
    sources = result['sources']
    sources['first-part-1'].update(start=1,book='first',part=1)
    for part,start,end in [(2,141,280),(3,281,420),(4,421,560),(5,561,658)]:
        sources[f'first-part-{part}'] = {'label':f'İlk kitap · {part}. parça · kitap sayfa {start}–{end}', 'path':f'library/dahiliye-ilk-parca{part}.pdf', 'pages':end-start+1, 'start':start, 'book':'first', 'part':part}
    pdf_pages = {}
    if audit:
        for key,src in sources.items():
            if key.startswith('first-part-'):
                pdf_pages[key] = subprocess.check_output(['pdftotext','-raw',str(ROOT/src['path']),'-']).decode().split('\f')
    lessons = {l['name']:l for l in result['lessons']}
    new_ids = set()
    for n,row in enumerate((ROOT/'data/editorial_first_rest.tsv').read_text().splitlines(),1):
        name,global_page,topic,statement,question = row.split('|')
        global_page = int(global_page)
        assert any(start<=global_page<=end and name==lesson for start,end,lesson in RANGES), n
        part = (global_page-1)//140+1
        source = f'first-part-{part}'
        local_page = global_page-(part-1)*140
        matches = re.findall(r'{{([^{}]+)}}',statement)
        assert len(matches)==1, n
        answer = matches[0]
        quote = statement.replace('{{','').replace('}}','')
        assert len(quote.split())<=90,n
        assert question.count('________')==1 and answer.casefold() not in question.casefold(),n
        assert not re.match(r'^(Bu |En sık |En önemli |Genellikle |Ancak )',question),n
        if audit:
            normalize=lambda s:re.sub(r'\s+','',s)
            assert normalize(quote) in normalize(pdf_pages[source][local_page-1]), f'Quote mismatch: page {global_page}: {quote}'
        identity=f'first-volume|{name}|{global_page}|{statement}'
        card_id='fact-'+hashlib.sha256(identity.encode()).hexdigest()[:16]
        assert card_id not in new_ids, n
        new_ids.add(card_id)
        if name not in lessons:
            lessons[name]={'id':'volume1-'+name,'name':name,'topics':[], 'source':'first-volume'}
        lesson=lessons[name]
        lesson.pop('coverage',None)
        group=next((t for t in lesson['topics'] if t['name']==topic),None)
        if group is None:
            group={'name':topic,'cards':[]};lesson['topics'].append(group)
        group['cards'].append({'id':card_id,'question':question,'answer':answer,'explanation':quote,'page':local_page,'book_page':global_page,'source':source})
    assert len(new_ids)==160
    first_names=['Kardiyoloji','Göğüs Hastalıkları','Hematoloji','Nefroloji','Gastroenteroloji','Hepatoloji']
    result['lessons']=[lessons[name] for name in first_names]+[l for l in result['lessons'] if l['name'] not in first_names]
    plan=result['study_plan']
    first_plan=json.loads((ROOT/'data/first_volume_plan.json').read_text())
    for item in first_plan['lessons']:
        actual={t['name']:len(t['cards']) for t in lessons[item['name']]['topics']}
        expected={t['name']:t['target'] for t in item['topics']}
        assert actual==expected, f'Allocation mismatch: {item["name"]}'
    plan['lessons']=first_plan['lessons']+[l for l in plan['lessons'] if l['name'] not in first_names]
    plan['first_volume_status']={'received_parts':[1,2,3,4,5],'blocked_parts':[],'pages':658,'coverage_checked':True,'transfer_limit_mib':32}
    result['version']='full-first-750-v1'
    result['source']='Klinisyen Yan Dal Dahiliye Konu Kitabı · ilk kitap (658 sayfa) ve ikinci kitap (874 sayfa)'
    result['status']='Klinik öncelikli 750 kart. İlk kitabın 658 sayfası eksiksiz alınmıştır. Kartlar seçilmiş önemli bilgilerden oluşur; kitabın tüm bilgilerini kapsamaz. Sınav dağılımları doğrulanmadı. Uzman incelemesi yapılmadı.'
    return result
