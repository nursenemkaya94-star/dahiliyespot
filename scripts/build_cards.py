"""Build explicitly authored, source-linked recall cards. Never choose a random blank.

Usage: python3 scripts/build_cards.py [source.pdf]
An optional source PDF enables a full verbatim-sentence audit via pdftotext.
data/editorial_cards.tsv defines the unmodified quote, hidden fact, and a separate
question that integrates the missing disease/drug/patient context into its sentence.
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAMES = ['Onkoloji', 'Endokrinoloji', 'Temel İmmünoloji', 'Klinik İmmünoloji', 'Alerji', 'Enfeksiyon Hastalıkları', 'Romatoloji', 'Geriatri', 'Yoğun Bakım']
STARTS = [1, 108, 233, 292, 317, 361, 632, 752, 809, 875]

def normalize(text):
    return re.sub(r'\s+', '', text)

def build(pdf=None):
    pages = None
    if pdf:
        pages = subprocess.check_output(['pdftotext', '-raw', str(pdf), '-']).decode('utf-8').split('\f')
    lessons = [{'id': str(i), 'name': name, 'topics': []} for i, name in enumerate(NAMES)]
    seen = set()
    for line_number, row in enumerate((ROOT / 'data/editorial_cards.tsv').read_text().splitlines(), 1):
        if not row.strip() or row.startswith('#'):
            continue
        name, page, topic, statement, question = row.split('|')
        page = int(page)
        li = NAMES.index(name)
        assert STARTS[li] <= page < STARTS[li+1], f'Wrong lesson/page at line {line_number}'
        answers = re.findall(r'{{([^{}]+)}}', statement)
        assert len(answers) == 1, f'Exactly one knowledge target required at line {line_number}'
        answer = answers[0]
        assert len(statement.split()) <= 90, f'Verbatim passage too long at line {line_number}'
        assert question.count('________') == 1, f'Exactly one blank required at line {line_number}'
        assert answer.casefold() not in question.casefold(), f'Question reveals its answer at line {line_number}'
        assert not re.match(r'^(Bu |En sık |En önemli |Sıklıkla |Genellikle |Ancak |Hastaların )', question), f'Missing explicit context at line {line_number}'
        if pages:
            quote = statement.replace('{{', '').replace('}}', '')
            assert normalize(quote) in normalize(pages[page-1]), f'Full sentence not found on source page {page}: {quote}'
        explanation = statement.replace('{{', '').replace('}}', '')
        assert statement not in seen, f'Duplicate card at line {line_number}'
        seen.add(statement)
        # Content-based IDs keep old arbitrary-blank progress off unrelated facts.
        identity = f'{name}|{page}|{statement}'
        card = {
            'id': 'fact-' + hashlib.sha256(identity.encode()).hexdigest()[:16],
            'question': question,
            'answer': answer,
            'explanation': explanation,
            'page': page,
        }
        topics = lessons[li]['topics']
        group = next((t for t in topics if t['name'] == topic), None)
        if group is None:
            group = {'name': topic, 'cards': []}
            topics.append(group)
        group['cards'].append(card)
    assert all(l['topics'] for l in lessons), 'Every included lesson needs cards'
    result = {
        'version': 'context-300-v4',
        'source': 'Klinisyen Yan Dal Dahiliye Konu Kitabı · 2. PDF',
        'status': '300 bilgi kartında hastalık, ilaç veya durum sorunun cümlesinde belirtilir. Cevabın altında kaynak cümlesi değiştirilmeden korunur. Uzman incelemesi yapılmadı; kitabın tüm önemli konularını kapsama iddiası yoktur.',
        'lessons': lessons,
    }
    (ROOT / 'data/cards.json').write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
    print(f'{len(lessons)} ders, {sum(len(l["topics"]) for l in lessons)} konu, {len(seen)} bilgi odaklı kart; source audit: {bool(pages)}')

if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else None)
