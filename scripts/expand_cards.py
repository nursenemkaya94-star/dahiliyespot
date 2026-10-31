"""Append four hundred reviewed emphasis-linked targets without changing old IDs."""
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from source_excerpts import attach_card_excerpts, pdf_pages

ROOT = Path(__file__).resolve().parents[1]


def expand_cards(data):
    editorial = json.loads((ROOT / 'data/editorial_expansion_400.json').read_text())['cards']
    lessons = {l['name']: l for l in data['lessons']}
    ids = {c['id'] for l in data['lessons'] for t in l['topics'] for c in t['cards']}
    assert len(ids) == 1110 and len(editorial) == 400
    normalize = lambda s: re.sub(r'\s+', '', s)
    for entry in editorial:
        lesson = lessons[entry['lesson']]
        assert entry['review_status'] == 'editorial_reviewed'
        answer, question = entry['answer'], entry['question']
        assert question.count('________') == 1 and answer.casefold() not in question.casefold(), question
        assert len(answer.split()) <= 6 and answer.casefold() in entry['quote'].casefold(), answer
        info = data['sources'][entry['source']]
        page = pdf_pages(info['path'])[entry['page'] - 1]
        assert normalize(entry['quote']) in normalize(page), (entry['source'], entry['page'], entry['quote'])
        identity = '|'.join(str(entry[k]) for k in ['lesson', 'source', 'page', 'quote', 'answer'])
        card_id = 'fact-' + hashlib.sha256(('bold-expansion|' + identity).encode()).hexdigest()[:16]
        assert card_id not in ids
        ids.add(card_id)
        card = dict(id=card_id, question=question, answer=answer, explanation=entry['quote'], page=entry['page'], emphasis=entry['emphasis'])
        if entry['source'] != 'second':
            card.update(source=entry['source'], book_page=entry['book_page'])
        # Source-page proximity puts additions beside existing clinical topics.
        nearest = min(((abs(c['page'] - card['page']), t) for t in lesson['topics'] for c in t['cards'] if c.get('source', 'second') == entry['source']), key=lambda x: x[0], default=None)
        topic = nearest[1] if nearest else lesson['topics'][0]
        topic['cards'].append(card)
    corrections = json.loads((ROOT / 'data/card_target_corrections.json').read_text())
    for lesson in data['lessons']:
        for topic in lesson['topics']:
            for card in topic['cards']:
                if card['id'] in corrections:
                    change = corrections[card['id']]
                    assert change['answer'].casefold() in card['explanation'].casefold()
                    card.update(change)
    for lesson in data['lessons']:
        plan = next(l for l in data['study_plan']['lessons'] if l['name'] == lesson['name'])
        plan['topics'] = [{'name': t['name'], 'target': len(t['cards'])} for t in lesson['topics']]
    data['book_counts'] = dict(Counter('first' if c.get('source') else 'second' for l in data['lessons'] for t in l['topics'] for c in t['cards']))
    data['version'] = 'daily-1510-500-v1'
    data['status'] = 'Toplam 1.510 kart. Kalın yazılı kaynak pasajlarından 400 tek bilgi hedefli ek kart; cevap altında kaynak paragrafı. Klinik uzman incelemesi değildir.'
    return attach_card_excerpts(data)
