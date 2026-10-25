"""Regression checks for explicit medical knowledge targets, not word-length clozes."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class ContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.full_data = json.loads((ROOT / 'data/cards.json').read_text())
        # Keep regressions for the original 500-card collection independently.
        cls.data = dict(cls.full_data)
        cls.data['lessons'] = [l for l in cls.full_data['lessons'] if not l.get('source')]
        cls.data['study_plan'] = dict(cls.full_data['study_plan'])
        cls.data['study_plan']['lessons'] = [l for l in cls.full_data['study_plan']['lessons'] if l['name'] in {x['name'] for x in cls.data['lessons']}]
        cls.cards = [c for l in cls.data['lessons'] for t in l['topics'] for c in t['cards']]

    def test_knowledge_targets_regression(self):
        # Old code blanked the longest word. These facts must hide their answer.
        examples = [
            ('Bleomisinin', 'akciğer fibrozisi', 29),
            ('Prolaktin düzeyi 200', 'prolaktinoma', 121),
            ('Cushing sendromunun en sık endojen', 'Cushing hastalığı', 127),
            ('Kompleman komponentleri arasında', 'C2', 280),
            ('p-ANCA', 'miyeloperoksidaz', 634),
            ('Parasetamolün toksik metaboliti', 'glutatyon', 840),
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
                self.assertNotIn(card['answer'].casefold(), card['question'].casefold())
                self.assertIn(card['answer'], card['explanation'])
                self.assertLessEqual(len(card['question'].split()), 90)
                self.assertTrue(card['id'].startswith('fact-'))
                self.assertTrue(1 <= card['page'] <= 874)
        self.assertEqual(len({c['id'] for c in self.cards}), len(self.cards))

    def test_500_cards_cover_each_available_lesson(self):
        self.assertEqual(len(self.data['lessons']), 9)
        self.assertEqual(len(self.cards), 500)
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

    def test_ambiguous_source_sentences_have_explicit_question_context(self):
        examples = [
            ('Bu sendromun gelişimini önlemek', 'Tümör lizis sendromunu', 'hidrasyon'),
            ('Ancak ilk tercih genellikle', 'Romatoid artritin', 'metotreksat'),
            ('Bu hastaların tedavisinde ilk ilaç', 'Beta bloker kullanan hastada anafilaksi', 'vazopresin ve glukagon'),
            ('Bu nedenle ilk tercih', 'Dağılımsal şokta', 'norepinefrin'),
            ('En önemli faktör basınçtır.', 'Bası yaralarının', 'basınç'),
            ('Fenitoin (kardiyotoksisiteyi', 'Trisiklik antidepresan intoksikasyonundaki nöbetlerde', 'Fenitoin'),
        ]
        for source, context, answer in examples:
            with self.subTest(source=source):
                cards = [c for c in self.cards if c['explanation'].startswith(source)]
                self.assertEqual(len(cards), 1)
                self.assertTrue(cards[0]['question'].startswith(context))
                self.assertEqual(cards[0]['answer'], answer)

    def test_clinical_allocation_matches_actual_cards_and_labels_evidence(self):
        counts = {}
        for lesson in self.data['lessons']:
            for topic in lesson['topics']:
                counts[lesson['name'], topic['name']] = len(topic['cards'])
        self.assertEqual(counts['Endokrinoloji', 'Diyabet'], 60)
        self.assertEqual(counts['Endokrinoloji', 'Tiroid hastalıkları'], 60)
        self.assertEqual(counts['Endokrinoloji', 'Gonadal bozukluklar'], 1)
        self.assertEqual(counts['Yoğun Bakım', 'Sepsis ve şok'], 25)
        self.assertEqual(counts['Romatoloji', 'Romatoid artrit'], 15)
        self.assertEqual(counts['Enfeksiyon Hastalıkları', 'Pnömoni ve solunum yolu enfeksiyonları'], 15)
        for lesson in self.data['study_plan']['lessons']:
            for topic in lesson['topics']:
                self.assertEqual(counts[lesson['name'], topic['name']], topic['target'])
        self.assertEqual(sum(counts.values()), 500)
        self.assertEqual(self.data['study_plan']['exam_research_status'], 'network_access_blocked')

    def test_everyday_diabetes_diagnostic_and_emergency_targets_exist(self):
        diabetes = next(t for l in self.data['lessons'] if l['name'] == 'Endokrinoloji' for t in l['topics'] if t['name'] == 'Diyabet')
        answers = {c['answer'] for c in diabetes['cards']}
        for target in ['≥ 126 mg/dl', '≥ % 6,5', 'öglisemik diyabetik ketoasidoz', 'finerenon', 'Vitamin B12 eksikliği']:
            self.assertIn(target, answers)

if __name__ == '__main__':
    unittest.main()
