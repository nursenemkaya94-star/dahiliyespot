"""Optional PyMuPDF audit of typography evidence in the four-hundred-card expansion."""
import json
import re
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[1]
canon = lambda s: re.sub(r'\s+', '', s).casefold().replace('à', 'fi').replace('á', 'fl')


def audit():
    data = json.loads((ROOT / 'data/cards.json').read_text())
    entries = json.loads((ROOT / 'data/editorial_expansion_400.json').read_text())['cards']
    documents = {s: fitz.open(ROOT / info['path']) for s, info in data['sources'].items()}
    answer_count = 0
    for e in entries:
        page = documents[e['source']][e['page'] - 1]
        spans = [s for b in page.get_text('dict')['blocks'] for l in b.get('lines', []) for s in l['spans'] if 'bold' in s['font'].lower() or s['flags'] & 16]
        assert spans, (e['source'], e['page'])
        highlighted = canon(e['answer']) in canon(' '.join(s['text'] for s in spans))
        if e['emphasis']['kind'] == 'bold_answer':
            assert highlighted, (e['question'], e['answer'])
            answer_count += 1
        else:
            # Some book bullets emphasize a heading/context while the target itself is regular.
            assert e['emphasis']['kind'] == 'bold_context'
            assert any(s['font'] == e['emphasis']['font'] for s in spans)
    print(f'{len(entries)} emphasis-linked cards: {answer_count} bold answer spans, {len(entries)-answer_count} highlighted contexts')


if __name__ == '__main__':
    audit()
