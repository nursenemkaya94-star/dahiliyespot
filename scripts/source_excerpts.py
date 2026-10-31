"""Attach local PDF paragraphs so study answers do not require loading a PDF."""
import re
import subprocess
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


@lru_cache(maxsize=8)
def pdf_pages(path):
    return subprocess.check_output(['pdftotext', '-raw', str(ROOT / path), '-']).decode().split('\f')


def clean(text):
    text = re.split(r'\n(?:474017|NUR SENEM|\(Bu materyalin|https://)', text)[0]
    return re.sub(r'\s+', ' ', text).strip(' •üØþ@\n')


def paragraph(page, anchor='', query=''):
    blocks = [clean(s) for s in re.split(r'(?:^|\n)[•üØþ@]\s*', page)]
    blocks = [s for s in blocks if len(s) >= 25 and not re.search(r'474017|NUR SENEM|telif hak|https:|KLİNİSYEN', s)]
    norm = lambda s: re.sub(r'\s+', '', s).casefold()
    matched = [s for s in blocks if anchor and norm(anchor) in norm(s)]
    if matched:
        chosen = min(matched, key=len)
    elif anchor and norm(anchor) in norm(page):
        # Some reviewed quotes span multiple adjacent bullets; retain the exact quote.
        chosen = anchor
    else:
        words = {w for w in re.findall(r'[\wÇĞİÖŞÜçğıöşü-]+', query.casefold()) if len(w) > 3}
        chosen = max(blocks, key=lambda s: sum(1 for w in words if w in s.casefold()), default='')
    if len(chosen) <= 1400:
        return chosen
    # Keep complete source sentences around the evidence rather than an arbitrary page fragment.
    start = chosen.casefold().find(anchor[:60].casefold()) if anchor else 0
    if start < 0:
        start = 0
    left = max(chosen.rfind('. ', 0, start), chosen.rfind('; ', 0, start)) + 2
    if left < 2:
        left = 0
    end = chosen.find('. ', max(start + len(anchor), left + 800))
    if end < 0 or end > left + 1600:
        return anchor or chosen[:1400].rsplit(' ', 1)[0]
    return chosen[left:end + 1]


def attach_card_excerpts(data):
    for lesson in data['lessons']:
        for topic in lesson['topics']:
            for card in topic['cards']:
                source = data['sources'][card.get('source', 'second')]
                page = pdf_pages(source['path'])[card['page'] - 1]
                excerpt = paragraph(page, anchor=card['explanation'])
                assert excerpt, card['id']
                card['source_excerpt'] = excerpt
    return data


def attach_question_excerpts(data, cards_data):
    cards = {c['id']: c for l in cards_data['lessons'] for t in l['topics'] for c in t['cards']}
    for q in data['questions']:
        citations = q.get('citations', [{'source': 'second', 'page': p} for p in q['pages']])
        evidence = [cards[cid] for cid in q.get('evidence_card_ids', [])]
        q['source_excerpts'] = []
        for citation in citations:
            source, number = citation['source'], citation['page']
            anchors = [c['explanation'] for c in evidence if c.get('source', 'second') == source and c['page'] == number]
            page = pdf_pages(data['sources'][source]['path'])[number - 1]
            text = paragraph(page, anchor=anchors[0] if anchors else '', query=q['options'][q['correct']] + ' ' + q['question'])
            assert text, q['id']
            q['source_excerpts'].append({**citation, 'text': text})
    return data
