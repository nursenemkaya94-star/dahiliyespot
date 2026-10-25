"""Protect authored bank scope, preserved endocrine history and cross-volume citations."""
import json
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class QuestionBankTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / 'data/questions.json').read_text())
        cls.questions = cls.data['questions']
        cls.actual = {q['id']: q for q in cls.questions}

    def test_requested_counts_and_every_lesson(self):
        self.assertEqual(len(self.questions), 290)
        self.assertEqual(len(self.actual), 290)
        self.assertEqual(len({q['question'] for q in self.questions}), 290)
        counts = Counter(q.get('bank', 'endo') for q in self.questions)
        self.assertEqual(counts, {b['id']: b['count'] for b in self.data['banks']})
        for bank in ['endo', 'neph', 'gastro-hep', 'onco-hem']:
            self.assertEqual(counts[bank], 50)
        for b in self.data['banks']:
            if b['id'] not in ['endo', 'neph', 'gastro-hep', 'onco-hem']:
                self.assertEqual(counts[b['id']], 10)
        lesson_counts = Counter(q.get('lesson', 'Endokrinoloji') for q in self.questions)
        for lesson in ['Gastroenteroloji', 'Hepatoloji', 'Onkoloji', 'Hematoloji']:
            self.assertEqual(lesson_counts[lesson], 25)
        cards_data = json.loads((ROOT / 'data/cards.json').read_text())
        self.assertEqual(set(lesson_counts), {l['name'] for l in cards_data['lessons']})

    def test_endocrine_questions_and_ids_unchanged(self):
        baseline = json.loads((ROOT / 'data/questions_endo.json').read_text())['questions']
        self.assertEqual(self.questions[:50], baseline)

    def test_choices_and_citation_ranges(self):
        for q in self.questions:
            self.assertEqual(len(q['options']), 4, q['id'])
            self.assertEqual(len(set(q['options'])), 4, q['id'])
            self.assertIn(q['correct'], range(4))
            self.assertGreater(len(q['explanation']), 100)
            self.assertTrue(q['question'].endswith('?'))
            self.assertNotIn('________', q['question'])
            for c in q.get('citations', [{'source': 'second', 'page': p} for p in q['pages']]):
                info = self.data['sources'][c['source']]
                self.assertTrue(1 <= c['page'] <= info['pages'], q['id'])
                if c.get('book_page'):
                    self.assertEqual(c['book_page'], info['start'] + c['page'] - 1)
                self.assertTrue((ROOT / info['path']).is_file())
        for bank in self.data['banks']:
            values = Counter(q['correct'] for q in self.questions if q.get('bank', 'endo') == bank['id'])
            self.assertEqual(set(values), {0, 1, 2, 3})
            self.assertLessEqual(max(values.values()) - min(values.values()), 1)

    def test_clinical_calculations_and_high_risk_decisions(self):
        cases = {
            'GFR’si 38': 'G3b-A2',
            'Serum albümini 3,2': '2,2 g/dL; portal hipertansiyonu destekler',
            'triptaz 14': '14, eşik olan 11,6’yı aştığından mast hücre aktivasyonunu destekler',
            '1,80 L’den 2,12': 'Hem %12 hem 200 mL artış eşiği karşılanır',
            'nötrofil 420': 'Kültür negatif olsa da nötrositik asidi tedavi etmek',
            'Oligürik akut': 'Acil diyaliz değerlendirmesi',
            'ADAMTS13 sonucu': 'Örnek alındıktan sonra acil plazma değişimini geciktirmemek',
        }
        for snippet, expected in cases.items():
            matched = [q for q in self.questions if snippet in q['question']]
            self.assertEqual(len(matched), 1, snippet)
            self.assertEqual(matched[0]['options'][matched[0]['correct']], expected)


if __name__ == '__main__':
    unittest.main()
