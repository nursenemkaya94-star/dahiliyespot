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
            ('Bleomisin:', 'akciğer fibrozisi', 29),
            ('Prolaktin düzeyi 200', 'prolaktinoma', 121),
            ('Cushing sendromunun en sık endojen', 'Cushing hastalığı', 127),
            ('en sık görülen kompleman eksikliği', 'C2', 280),
            ('p-ANCA', 'miyeloperoksidaz', 634),
            ('Terapötik koşullarda bu NAPQI', 'glutatyon', 840),
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
                self.assertLessEqual(len(card['question'].split()), 90)
                self.assertTrue(card['id'].startswith('fact-'))
                self.assertTrue(1 <= card['page'] <= 874)
        self.assertEqual(len({c['id'] for c in self.cards}), len(self.cards))

    def test_smaller_set_covers_each_available_lesson(self):
        self.assertEqual(len(self.data['lessons']), 9)
        self.assertEqual(len(self.cards), 300)
        for lesson in self.data['lessons']:
            self.assertGreaterEqual(sum(len(t['cards']) for t in lesson['topics']), 5)

    def test_verbatim_examples_and_no_added_book_commentary(self):
        quotes = {c['explanation'] for c in self.cards}
        self.assertIn('Prolaktin düzeyi 200 ng/mL’nin üstünde ise en sık neden prolaktinomadır.', quotes)
        self.assertIn('Tanıda kan kültürü altın standarttır, mannan ve beta glukan testleri yardımcı olabilir.', quotes)
        self.assertIn('Tanı için periferik yayma altın standarttır, 48 saat içerisinde 3 numune alınır.', quotes)
        for card in self.cards:
            self.assertNotIn('kitapta belirtilen', card['explanation'])
            self.assertNotIn('kitapta altın standart olarak belirtilen', card['explanation'])

if __name__ == '__main__':
    unittest.main()
