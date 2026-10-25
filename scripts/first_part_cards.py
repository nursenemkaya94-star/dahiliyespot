"""Append source-identified first-volume cards without changing existing fact IDs."""
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'first-part-1'
SOURCES = {
    'second': {'label': 'İkinci kitap · 874 sayfa', 'path': 'library/dahiliye.pdf', 'pages': 874},
    SOURCE: {'label': 'İlk kitap · 1. parça · 140 sayfa', 'path': 'library/dahiliye-ilk-parca1.pdf', 'pages': 140},
}

def append_first_part(result, audit=True):
    text = None
    if audit:
        text = subprocess.check_output(['pdftotext', '-raw', str(ROOT / SOURCES[SOURCE]['path']), '-']).decode().split('\f')
    normalize = lambda s: re.sub(r'\s+', '', s)
    lessons = {}
    counts = Counter()
    ids = set()
    for n, row in enumerate((ROOT / 'data/editorial_first_part.tsv').read_text().splitlines(), 1):
        name, page, topic, statement, question = row.split('|')
        page = int(page)
        assert (name == 'Kardiyoloji' and 1 <= page <= 121) or (name == 'Göğüs Hastalıkları' and 122 <= page <= 140), n
        answers = re.findall(r'{{([^{}]+)}}', statement)
        assert len(answers) == 1, n
        answer = answers[0]
        quote = statement.replace('{{', '').replace('}}', '')
        assert question.count('________') == 1 and answer.casefold() not in question.casefold(), n
        assert not re.match(r'^(Bu |En sık |En önemli |Genellikle |Ancak )', question), n
        assert len(quote.split()) <= 90, n
        if text:
            assert normalize(quote) in normalize(text[page-1]), f'Full quote mismatch at first-volume page {page}: {quote}'
        card_id = 'fact-' + hashlib.sha256(f'{SOURCE}|{name}|{page}|{statement}'.encode()).hexdigest()[:16]
        assert card_id not in ids
        ids.add(card_id)
        lesson = lessons.setdefault(name, {'id':SOURCE+'-'+str(len(lessons)), 'name':name, 'source':SOURCE, 'topics':[]})
        if name == 'Göğüs Hastalıkları':
            lesson['coverage'] = 'İlk bölüm · Muayene ve solunum fonksiyonları. Diğer konular için kalan PDF parçaları bekleniyor.'
        group = next((t for t in lesson['topics'] if t['name'] == topic), None)
        if group is None:
            group = {'name':topic, 'cards':[]}
            lesson['topics'].append(group)
        group['cards'].append({'id':card_id, 'question':question, 'answer':answer, 'explanation':quote, 'page':page, 'source':SOURCE})
        counts[name,topic] += 1
    assert sum(counts.values()) == 90
    result['lessons'] = list(lessons.values()) + result['lessons']
    result['sources'] = SOURCES
    result['version'] = 'first-part-590-v1'
    result['source'] = 'Klinisyen Yan Dal Dahiliye Konu Kitabı · ikinci kitap ve ilk kitabın 1. parçası'
    result['status'] = 'Klinik öncelikli 590 kart. İlk kitabın yalnızca 1. parçası erişilebilir; 2–5. parçalar aktarım sınırını aştı. Sınav dağılımları doğrulanmadı. Uzman incelemesi yapılmadı.'
    plan = result['study_plan']
    plan['lessons'] = [{'name':l['name'], 'topics':[{'name':t['name'],'target':len(t['cards'])} for t in l['topics']]} for l in lessons.values()] + plan['lessons']
    plan['first_volume_status'] = {'received_parts':[1], 'blocked_parts':[2,3,4,5], 'transfer_limit_mib':32}
    return result
