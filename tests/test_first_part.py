"""Cross-volume citations, progress preservation, and allocation regressions."""
import hashlib
import json
import re
import subprocess
import unittest
from collections import Counter
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

class FirstPartTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / 'data/cards.json').read_text())
        cls.new = [c for l in cls.data['lessons'] for t in l['topics'] for c in t['cards'] if c.get('source') == 'first-part-1']

    def test_new_scope_and_clinical_priority(self):
        self.assertEqual(len(self.data['lessons']), 15)
        all_cards = [c for l in self.data['lessons'] for t in l['topics'] for c in t['cards']]
        self.assertEqual(len(all_cards), 750)
        self.assertEqual(len({c['id'] for c in all_cards}), 750)
        self.assertEqual(len(self.new), 90)
        counts = {l['name']: sum(len(t['cards']) for t in l['topics']) for l in self.data['lessons']}
        self.assertEqual(counts['Kardiyoloji'], 80)
        self.assertEqual(counts['Göğüs Hastalıkları'], 45)
        pulm = next(l for l in self.data['lessons'] if l['name']=='Göğüs Hastalıkları')
        self.assertNotIn('coverage', pulm)
        self.assertEqual(self.data['study_plan']['first_volume_status']['blocked_parts'], [])
        for l in self.data['lessons']:
            targets=next(p for p in self.data['study_plan']['lessons'] if p['name']==l['name'])
            self.assertEqual({t['name']:len(t['cards']) for t in l['topics']},{t['name']:t['target'] for t in targets['topics']})

    def test_original_fact_ids_and_content_are_preserved(self):
        existing = {c['id']: c for l in self.data['lessons'] if not l.get('source') for t in l['topics'] for c in t['cards']}
        for line in (ROOT / 'data/editorial_cards.tsv').read_text().splitlines():
            if not line or line.startswith('#'): continue
            name,page,topic,statement,prompt=line.split('|')
            identity=f'{name}|{page}|{statement}'
            card_id='fact-'+hashlib.sha256(identity.encode()).hexdigest()[:16]
            self.assertIn(card_id,existing)
            self.assertEqual(existing[card_id]['question'],prompt)
            self.assertEqual(existing[card_id]['explanation'],statement.replace('{{','').replace('}}',''))

    def test_every_new_quote_matches_its_own_pdf(self):
        pdf = ROOT / self.data['sources']['first-part-1']['path']
        pages=subprocess.check_output(['pdftotext','-raw',str(pdf),'-']).decode().split('\f')
        normalize=lambda s:re.sub(r'\s+','',s)
        for c in self.new:
            with self.subTest(card=c['id']):
                self.assertIn(normalize(c['explanation']), normalize(pages[c['page']-1]))
                self.assertIn(c['answer'],c['explanation'])
                self.assertEqual(c['question'].count('________'),1)
                self.assertNotIn(c['answer'].casefold(),c['question'].casefold())
                self.assertTrue(1 <= c['page'] <= 140)

if __name__=='__main__':unittest.main()
