"""Assemble authored question banks without changing the endocrine pilot IDs or answers."""
import argparse
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BANKS = [
    ('endo', 'Endokrinoloji', ['Endokrinoloji'], 75),
    ('neph', 'Nefroloji', ['Nefroloji'], 75),
    ('gastro-hep', 'Gastroenteroloji ve Hepatoloji', ['Gastroenteroloji', 'Hepatoloji'], 80),
    ('onco-hem', 'Onkoloji ve Hematoloji', ['Onkoloji', 'Hematoloji'], 80),
    ('cardio', 'Kardiyoloji', ['Kardiyoloji'], 30),
    ('pulmo', 'Göğüs Hastalıkları', ['Göğüs Hastalıkları'], 25),
    ('infect', 'Enfeksiyon Hastalıkları', ['Enfeksiyon Hastalıkları'], 30),
    ('rheum', 'Romatoloji', ['Romatoloji'], 30),
    ('icu', 'Yoğun Bakım', ['Yoğun Bakım'], 25),
    ('geri', 'Geriatri', ['Geriatri'], 15),
    ('allergy', 'Alerji', ['Alerji'], 10),
    ('clin-imm', 'Klinik İmmünoloji', ['Klinik İmmünoloji'], 15),
    ('basic-imm', 'Temel İmmünoloji', ['Temel İmmünoloji'], 10),
]


def build(audit=False):
    cards_data = json.loads((ROOT / 'data/cards.json').read_text())
    cards = {c['id']: (l['name'], c) for l in cards_data['lessons'] for t in l['topics'] for c in t['cards']}
    endo = json.loads((ROOT / 'data/questions_endo.json').read_text())['questions']
    additions = json.loads((ROOT / 'data/questions_additions.json').read_text())['questions']
    assert len(endo) == 50 and len(additions) == 240
    expansion = json.loads((ROOT / 'data/questions_expansion_210.json').read_text())['questions']
    assert len(expansion) == 210
    questions = endo + additions + expansion
    assert len({q['id'] for q in questions}) == len(questions)
    assert len({q['question'] for q in questions}) == len(questions)
    texts = {}
    counts = Counter(q.get('bank', 'endo') for q in questions)
    for q in questions:
        assert len(q['options']) == len(set(q['options'])) == 4, q['id']
        assert q['correct'] in range(4) and len(q['explanation']) > 100, q['id']
        assert q['question'].endswith('?') and '________' not in q['question'], q['id']
        if not q.get('evidence_card_ids'):
            assert all(108 <= page <= 232 for page in q['pages'])
            continue
        citations = []
        for card_id in q['evidence_card_ids']:
            lesson, c = cards[card_id]
            source = c.get('source', 'second')
            info = cards_data['sources'][source]
            citation = {'source': source, 'page': c['page']}
            if c.get('book_page'):
                citation['book_page'] = c['book_page']
                assert c['book_page'] == info['start'] + c['page'] - 1
            if citation not in citations:
                citations.append(citation)
            if audit:
                if source not in texts:
                    texts[source] = subprocess.check_output(['pdftotext', '-raw', str(ROOT / info['path']), '-']).decode().split('\f')
                norm = lambda s: re.sub(r'\s+', '', s)
                assert norm(c['explanation']) in norm(texts[source][c['page'] - 1]), q['id']
        assert citations == q['citations'], q['id']
        assert q['pages'] == [c['page'] for c in citations], q['id']
        assert cards[q['evidence_card_ids'][0]][0] == q['lesson']
    banks = []
    for bank, title, lessons, target in BANKS:
        subset = [q for q in questions if q.get('bank', 'endo') == bank]
        assert counts[bank] == target, (bank, counts[bank])
        assert {q.get('lesson', 'Endokrinoloji') for q in subset} == set(lessons)
        if len(lessons) == 2:
            assert Counter(q['lesson'] for q in subset) == {l: target // 2 for l in lessons}
        correct_counts = Counter(q['correct'] for q in subset)
        assert len(correct_counts) == 4 and max(correct_counts.values()) - min(correct_counts.values()) <= 1
        banks.append({'id': bank, 'title': title, 'lessons': lessons, 'count': target})
    assert set(counts) == {b['id'] for b in banks}
    result = {
        'version': 'daily-1510-500-v1', 'lesson': 'Dahiliye', 'level': 'Orta–üst',
        'note': '500 özgün çalışma sorusu · 15 ders / 13 ders grubu. Klinik vaka, ayırıcı tanı, laboratuvar yorumlama ve tedavi önceliği ağırlıklı; orta–üst düzey hedeflenmiştir. Açıklamalar kaynak kitaba dayalı özgün özetlerdir. Resmî sınav sorusu değildir; klinik uzman incelemesi yapılmadı. Her ders grubunun ilerlemesi ayrı tutulur.',
        'sources': cards_data['sources'], 'banks': banks, 'questions': questions,
    }
    from source_excerpts import attach_question_excerpts
    result = attach_question_excerpts(result, cards_data)
    (ROOT / 'data/questions.json').write_text(json.dumps(result, ensure_ascii=False) + '\n')
    print(f'{len(questions)} questions in {len(banks)} banks; PDF evidence audit: {audit}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--audit-sources', action='store_true')
    build(parser.parse_args().audit_sources)
