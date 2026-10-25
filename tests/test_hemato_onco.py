"""Validate the requested expansion against original editorial facts and source PDFs."""
import hashlib
import json
import re
import subprocess
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class HematoOncoTests(unittest.TestCase):
    def test_all_110_additions_have_exact_sources_and_stable_ids(self):
        data = json.loads((ROOT / 'data/cards.json').read_text())
        actual = {c['id']: (l['name'], t['name'], c)
                  for l in data['lessons'] for t in l['topics'] for c in t['cards']}
        texts = {}
        counts = Counter()
        for row in (ROOT / 'data/editorial_hemato_onco.tsv').read_text().splitlines():
            name, page, topic, statement, question = row.split('|')
            card_id = 'fact-' + hashlib.sha256(f'hemato-onco-100|{name}|{page}|{statement}'.encode()).hexdigest()[:16]
            self.assertIn(card_id, actual)
            lesson, group, card = actual[card_id]
            self.assertEqual((lesson, group, card['question']), (name, topic, question))
            source = card.get('source', 'second')
            info = data['sources'][source]
            self.assertEqual(int(page), card['page'] + info.get('start', 1) - 1)
            if source not in texts:
                texts[source] = subprocess.check_output(['pdftotext', '-raw', str(ROOT / info['path']), '-']).decode().split('\f')
            quote = statement.replace('{{', '').replace('}}', '')
            self.assertEqual(card['explanation'], quote)
            normalize = lambda s: re.sub(r'\s+', '', s)
            self.assertIn(normalize(quote), normalize(texts[source][card['page'] - 1]), card_id)
            self.assertEqual(card['answer'], re.search(r'{{([^{}]+)}}', statement)[1])
            counts[name] += 1
        self.assertEqual(counts, {'Hematoloji': 65, 'Onkoloji': 45})


if __name__ == '__main__':
    unittest.main()
