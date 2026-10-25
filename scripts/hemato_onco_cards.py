"""Expand hematology and oncology to 100 cards each; audit every new citation."""
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = {
    'Hematoloji': {'Anemiler': 29, 'Hemoliz ve hemoglobinopatiler': 22,
                  'Hematolojik maligniteler': 28, 'Kanama, tromboz ve hematolojik aciller': 21},
    'Onkoloji': {'Sık kanserler ve tanı': 45, 'Onkolojik aciller': 20,
                'Antikanser tedaviler ve yan etkiler': 30, 'Kanser genetiği': 5},
}


def append_hemato_onco(result):
    lessons = {lesson['name']: lesson for lesson in result['lessons']}
    existing = [c for l in result['lessons'] for t in l['topics'] for c in t['cards']]
    ids = {c['id'] for c in existing}
    facts = {(c.get('source', 'second'), c['page'], c['explanation'], c['answer']) for c in existing}
    texts = {}
    additions = Counter()
    normalize = lambda s: re.sub(r'\s+', '', s)
    for number, row in enumerate((ROOT / 'data/editorial_hemato_onco.tsv').read_text().splitlines(), 1):
        name, page, topic, statement, question = row.split('|')
        page = int(page)
        assert name in TARGETS and topic in TARGETS[name], number
        assert (name == 'Hematoloji' and 211 <= page <= 313) or (name == 'Onkoloji' and 1 <= page <= 107), number
        source = f'first-part-{(page - 1) // 140 + 1}' if name == 'Hematoloji' else 'second'
        local_page = page - (result['sources'][source].get('start', 1) - 1)
        answers = re.findall(r'{{([^{}]+)}}', statement)
        assert len(answers) == 1, number
        answer = answers[0]
        quote = statement.replace('{{', '').replace('}}', '')
        assert question.count('________') == 1 and answer.casefold() not in question.casefold(), number
        assert len(quote.split()) <= 90 and len(question.split()) <= 90, number
        if source not in texts:
            texts[source] = subprocess.check_output(['pdftotext', '-raw', str(ROOT / result['sources'][source]['path']), '-']).decode().split('\f')
        assert normalize(quote) in normalize(texts[source][local_page - 1]), f'New quote mismatch at line {number}, {source} page {local_page}: {quote}'
        fact = (source, local_page, quote, answer)
        assert fact not in facts, f'Duplicate fact at line {number}'
        facts.add(fact)
        identity = f'hemato-onco-100|{name}|{page}|{statement}'
        card_id = 'fact-' + hashlib.sha256(identity.encode()).hexdigest()[:16]
        assert card_id not in ids, number
        ids.add(card_id)
        card = dict(id=card_id, question=question, answer=answer, explanation=quote, page=local_page)
        if source != 'second':
            card.update(source=source, book_page=page)
        group = next(t for t in lessons[name]['topics'] if t['name'] == topic)
        group['cards'].append(card)
        additions[name] += 1
    assert additions == {'Hematoloji': 65, 'Onkoloji': 45}, additions
    for name, targets in TARGETS.items():
        assert {t['name']: len(t['cards']) for t in lessons[name]['topics']} == targets
        plan = next(l for l in result['study_plan']['lessons'] if l['name'] == name)
        for t in plan['topics']:
            t['target'] = targets[t['name']]
    result['book_counts'] = {'first': 565, 'second': 545}
    result['version'] = 'hemato-onco-1110-v1'
    result['status'] = 'Toplam 1.110 kart: ilk kitap 565, ikinci kitap 545; hematoloji ve onkoloji ayrı ayrı 100 kart. Kaynak alıntıları ve mevcut kart kimlikleri korunur. Klinik öncelikli editoryal çalışma seti; doğrulanmış sınav yüzdesi değildir. Uzman incelemesi yapılmadı.'
    return result
