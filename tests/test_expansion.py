"""Source fidelity, single-target editorial contract, and direct excerpt regressions."""
import json
import re
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ExpansionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cards = json.loads((ROOT / 'data/cards.json').read_text())
        cls.questions = json.loads((ROOT / 'data/questions.json').read_text())
        cls.pages = {}

    @classmethod
    def page(cls, source, number):
        if source not in cls.pages:
            path = ROOT / cls.cards['sources'][source]['path']
            cls.pages[source] = subprocess.check_output(['pdftotext', '-raw', str(path), '-']).decode().split('\f')
        return cls.pages[source][number - 1]

    def test_all_card_and_question_excerpts_are_actual_source_text(self):
        normalize = lambda s: re.sub(r'\s+', '', s)
        for lesson in self.cards['lessons']:
            for topic in lesson['topics']:
                for c in topic['cards']:
                    self.assertTrue(c['source_excerpt'], c['id'])
                    self.assertIn(normalize(c['source_excerpt']), normalize(self.page(c.get('source', 'second'), c['page'])), c['id'])
        for q in self.questions['questions']:
            self.assertTrue(q['source_excerpts'], q['id'])
            for c in q['source_excerpts']:
                self.assertIn(normalize(c['text']), normalize(self.page(c['source'], c['page'])), q['id'])

    def test_400_reviewed_targets_are_single_blanks_with_font_evidence(self):
        entries = json.loads((ROOT / 'data/editorial_expansion_400.json').read_text())['cards']
        self.assertEqual(len(entries), 400)
        identities = set()
        for e in entries:
            self.assertEqual(e['question'].count('________'), 1)
            self.assertNotIn(e['answer'].casefold(), e['question'].casefold())
            self.assertLessEqual(len(e['answer'].split()), 6)
            self.assertNotIn(e['answer'].casefold(), ['işlev', 'hücre', 'verilir', 'etkileri', 'a-primer'])
            self.assertIn(e['emphasis']['kind'], ['bold_answer', 'bold_context'])
            self.assertIn('bold', e['emphasis']['font'].lower())
            self.assertEqual(len(e['emphasis']['bbox']), 4)
            self.assertEqual(e['review_status'], 'editorial_reviewed')
            identities.add((e['source'], e['page'], e['quote'], e['answer']))
        self.assertEqual(len(identities), 400)

    def test_new_210_questions_are_distinct_and_previous_290_ids_retained(self):
        expansion = json.loads((ROOT / 'data/questions_expansion_210.json').read_text())['questions']
        additions = json.loads((ROOT / 'data/questions_additions.json').read_text())['questions']
        old = json.loads((ROOT / 'data/questions_endo.json').read_text())['questions'] + additions
        actual = {q['id']: q for q in self.questions['questions']}
        self.assertEqual(len(expansion), 210)
        for q in old + expansion:
            self.assertEqual({k: actual[q['id']][k] for k in q}, q)
        self.assertEqual(len(actual), 500)


if __name__ == '__main__':
    unittest.main()
