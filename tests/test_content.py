"""Regression checks for explicit medical knowledge targets, not word-length clozes."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class ContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / 'data/cards.json').read_text())
        cls.cards = [c for l in cls.data['lessons'] for t in l['topics'] for c in t['cards']]

    def test_knowledge_targets_regression(self):
        # Old code blanked the longest word. These facts must hide their answer.
        examples = [
            ('Bleomisinin', 'akciğer fibrozisi', 29),
            ('Demansın en sık', 'Alzheimer hastalığı', 776),
            ('Cushing sendromunun en sık endojen', 'Cushing hastalığı', 127),
            ('en sık görülen kompleman eksikliği', 'C2', 280),
            ('Eritrazmanın', 'Corynebacterium minutissimum', 469),
            ('p-ANCA', 'miyeloperoksidaz', 634),
            ('Parasetamol intoksikasyonunun antidotu', 'N-asetil-sistein', 841),
        ]
        for prompt, answer, page in examples:
            with self.subTest(prompt=prompt):
                cards = [c for c in self.cards if prompt.casefold() in c['question'].casefold()]
                self.assertEqual(len(cards), 1)
                self.assertEqual(cards[0]['answer'], answer)
                self.assertEqual(cards[0]['page'], page)
                self.assertNotIn(answer.casefold(), cards[0]['question'].casefold())

    def test_one_explicit_fact_per_card(self):
        for card in self.cards:
            with self.subTest(card=card['id']):
                self.assertEqual(card['question'].count('________'), 1)
                self.assertEqual(card['question'].replace('________', card['answer']), card['explanation'])
                self.assertLess(len(card['question'].split()), 45)
                self.assertTrue(card['id'].startswith('fact-'))
                self.assertTrue(1 <= card['page'] <= 874)
        self.assertEqual(len({c['id'] for c in self.cards}), len(self.cards))

    def test_smaller_set_covers_each_available_lesson(self):
        self.assertEqual(len(self.data['lessons']), 9)
        self.assertLess(len(self.cards), 804 / 2)
        for lesson in self.data['lessons']:
            self.assertGreaterEqual(sum(len(t['cards']) for t in lesson['topics']), 5)

if __name__ == '__main__':
    unittest.main()
