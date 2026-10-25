"""Question-bank contract and medically meaningful answer regressions."""
import json
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
class QuestionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / 'data/questions.json').read_text())
        cls.questions = cls.data['questions']

    def test_pilot_size_allocation_and_unique_questions(self):
        self.assertEqual(len(self.questions), 50)
        self.assertEqual(len({q['id'] for q in self.questions}), 50)
        self.assertEqual(len({q['question'] for q in self.questions}), 50)
        self.assertEqual(Counter(q['topic'] for q in self.questions), {
            'Diyabet':18, 'Tiroid hastalıkları':16, 'Adrenal hastalıklar':7,
            'Hipofiz hastalıkları':5, 'Kalsiyum ve kemik metabolizması':4})

    def test_four_distinct_options_and_usable_explanations(self):
        for q in self.questions:
            with self.subTest(q=q['id']):
                self.assertEqual(len(q['options']), 4)
                self.assertEqual(len(set(q['options'])), 4)
                self.assertIn(q['correct'], range(4))
                self.assertTrue(all(isinstance(o,str) and o.strip() for o in q['options']))
                self.assertGreater(len(q['explanation']), 100)
                self.assertTrue(q['question'].endswith('?'))
                self.assertTrue(q['pages'])
                self.assertTrue(all(108 <= p <= 232 for p in q['pages']))
        self.assertEqual(sorted(Counter(q['correct'] for q in self.questions).values()), [12,12,13,13])

    def test_critical_differentials_and_treatment_order(self):
        expected = {
            4:'Osmotik diüreze bağlı azalma',
            6:'Öglisemik diyabetik ketoasidoz',
            17:'Açlık değeri nedeniyle gestasyonel diyabet ölçütü karşılanır',
            25:'Tiyonamid verildikten en az bir saat sonra',
            29:'Feokromositoma',
            38:'Baskılı renin, uygunsuz yüksek aldosteron',
            46:'Glukokortikoid',
            49:'Osteoporoz',
        }
        for number,answer in expected.items():
            q=self.questions[number-1]
            self.assertEqual(q['options'][q['correct']],answer)

if __name__ == '__main__':
    unittest.main()
