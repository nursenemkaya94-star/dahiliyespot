"""Protect the clinical allocation and hematology/oncology expansion and important recall targets."""
import json
import unittest
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class ClinicalPlanTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'data/cards.json').read_text())
        cls.cards=[c for l in cls.data['lessons'] for t in l['topics'] for c in t['cards']]

    def test_exact_book_balance_and_clinical_weights(self):
        self.assertEqual(len(self.cards),1110)
        self.assertEqual(len({c['id'] for c in self.cards}),1110)
        books=Counter('first' if c.get('source') else 'second' for c in self.cards)
        self.assertEqual(dict(books),{'first':565,'second':545})
        counts={l['name']:sum(len(t['cards']) for t in l['topics']) for l in self.data['lessons']}
        for lesson,total in {'Nefroloji':170,'Gastroenteroloji':100,'Hepatoloji':100,'Kardiyoloji':50,'Göğüs Hastalıkları':45,'Hematoloji':100,'Onkoloji':100}.items():
            self.assertEqual(counts[lesson],total)
        self.assertEqual(self.data['lessons'][0]['name'],'Nefroloji')
        self.assertIn('Doğrulanmış yatış/poliklinik sıklığı',self.data['study_plan']['clinical_note'])

    def test_every_front_hides_one_information_target(self):
        for c in self.cards:
            self.assertEqual(c['question'].count('________'),1,c['id'])
            self.assertNotIn(c['answer'].casefold(),c['question'].casefold(),c['id'])
            self.assertIn(c['answer'],c['explanation'])

    def test_frequent_clinical_decisions_have_specific_targets(self):
        examples={
            'Diüretik kullanan akut böbrek hasarlı hastada':'<%35',
            'Potasyum replasmanına yanıt alınamayan':'Hipomagnezemi',
            'Akut böbrek hasarı için 48 saat':'0.3 mg/dL’lik artış',
            'Hepatit B’nin pencere döneminde':'anti-HBc IgM',
            'H. pylori eradikasyonunu doğrulamak':'seroloji uzun süre pozitif olabilir',
            'IBS’de seçilmiş hastalarda fermentabl':'FODMAP',
        }
        for prefix,answer in examples.items():
            matches=[c for c in self.cards if c['question'].startswith(prefix)]
            self.assertEqual(len(matches),1,prefix)
            self.assertEqual(matches[0]['answer'],answer)

if __name__=='__main__':unittest.main()
