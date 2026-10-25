"""Complete first-volume page coverage and the remaining source-linked cards."""
import hashlib
import json
import re
import subprocess
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

class FirstVolumeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'data/cards.json').read_text())
        cls.cards=[c for l in cls.data['lessons'] for t in l['topics'] for c in t['cards'] if c.get('book_page')]

    def test_no_gaps_or_duplicate_page_content(self):
        numbers=[];fingerprints=[]
        for part,start,end in [(1,1,140),(2,141,280),(3,281,420),(4,421,560),(5,561,658)]:
            source=self.data['sources'][f'first-part-{part}']
            text=subprocess.check_output(['pdftotext','-raw',str(ROOT/source['path']),'-']).decode().split('\f')
            if not text[-1].strip():text.pop()
            self.assertEqual(len(text),end-start+1)
            self.assertEqual(source['pages'],len(text))
            self.assertEqual(source['start'],start)
            for local,t in enumerate(text):
                expected=start+local
                # Chapter opening pages omit their printed number.
                lines=[s.strip() for s in t.splitlines() if s.strip()]
                found=next((int(s) for s in lines[:5] if re.fullmatch(r'\d{1,3}',s)),None)
                if found is None:self.assertIn(expected,[1,122,211,314,493,591])
                else:self.assertEqual(found,expected)
                numbers.append(expected)
                fingerprints.append(hashlib.sha256(re.sub(r'\s+','',t).encode()).hexdigest())
        self.assertEqual(numbers,list(range(1,659)))
        self.assertEqual(len(set(fingerprints)),658)

    def test_every_new_card_uses_correct_pdf_and_verbatim_quote(self):
        self.assertEqual(len(self.cards),160)
        pages={}
        for c in self.cards:
            src=self.data['sources'][c['source']]
            self.assertEqual(c['book_page'],src['start']+c['page']-1)
            if c['source'] not in pages:
                pages[c['source']]=subprocess.check_output(['pdftotext','-raw',str(ROOT/src['path']),'-']).decode().split('\f')
            norm=lambda s:re.sub(r'\s+','',s)
            self.assertIn(norm(c['explanation']),norm(pages[c['source']][c['page']-1]),c['id'])
            self.assertEqual(c['question'].count('________'),1)
            self.assertNotIn(c['answer'].casefold(),c['question'].casefold())
            self.assertIn(c['answer'],c['explanation'])

    def test_earlier_first_part_ids_and_questions_preserved(self):
        actual={c['id']:c for l in self.data['lessons'] for t in l['topics'] for c in t['cards']}
        for row in (ROOT/'data/editorial_first_part.tsv').read_text().splitlines():
            lesson,page,topic,statement,q=row.split('|')
            identity=f'first-part-1|{lesson}|{page}|{statement}'
            card_id='fact-'+hashlib.sha256(identity.encode()).hexdigest()[:16]
            self.assertEqual(actual[card_id]['question'],q)

if __name__=='__main__':unittest.main()
