"""Extract source-linked recall cards; requires pdftotext, no external Python packages."""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAMES = ['Onkoloji', 'Endokrinoloji', 'Temel İmmünoloji', 'Klinik İmmünoloji', 'Alerji', 'Enfeksiyon Hastalıkları', 'Romatoloji', 'Geriatri', 'Yoğun Bakım']
STARTS = [1, 108, 233, 292, 317, 361, 632, 752, 809, 875]
UPPER = ['ONKOLOJİ', 'ENDOKRİNOLOJİ', 'TEMEL İMMÜNOLOJİ', 'KLİNİK İMMÜNOLOJİ', 'ALERJİ', 'ENFEKSİYON HASTALIKLARI', 'ROMATOLOJİ', 'GERİATRİ', 'YOĞUN BAKIM']

def clean(line):
    if any(x in line for x in ['SENEM', 'TUSDATA', 'KLİNİSYEN', 'https://', 'telif haklari']):
        return ''
    line = re.sub(r'47401761000|\bNUR\b', '', line)
    return re.sub(r'\s+', ' ', line).strip()

def build(pdf):
    text = subprocess.check_output(['pdftotext', '-layout', str(pdf), '-']).decode('utf-8')
    lessons = []
    for li, name in enumerate(NAMES):
        topics = {}
        title = 'Genel bilgiler'
        for page, raw in enumerate(text.split('\f'), 1):
            if not STARTS[li] <= page < STARTS[li+1]:
                continue
            lines = [clean(x) for x in raw.splitlines()]
            j = 0
            while j < len(lines):
                line = lines[j]
                if line.isupper() and 10 < len(line) < 95 and line not in UPPER and re.search('[A-ZÇĞİÖŞÜ]', line) and not re.search(r'[\d@%=+*,]|^[•Øü\-]|\bOD\b|\bOR\b|YORUM|BULGULAR SIKLIK|VE AŞAĞI', line) and line.count('(') == line.count(')'):
                    title = line.replace('İ', 'i').replace('I', 'ı').lower()
                    title = title[0].upper() + title[1:]
                if line.startswith(('Ø ', '• ')):
                    body = line[2:].strip()
                    k = j + 1
                    while k < len(lines) and lines[k] and not lines[k].startswith(('Ø', '•', 'ü', '-', '(')) and not lines[k].isupper():
                        body += ' ' + lines[k]
                        k += 1
                    score = sum(w in body.lower() for w in ['en sık', 'en önemli', 'ilk ', 'tanı', 'tipik', 'karakteristik', 'neden', 'özgül', 'altın standart', 'risk', 'kontrendik'])
                    if score and 65 <= len(body) <= 520 and body.endswith(('.', ')')) and not re.search(r'\s{3,}|\||%\s*[’\u2019]|(?:biri|olarak|önemli|aşağıdaki);?$', body):
                        topics.setdefault(title, []).append({'answer': body, 'page': page, 'score': score})
                    j = k - 1
                j += 1
        out = []
        for ti, (topic, candidates) in enumerate(topics.items()):
            seen = set()
            cards = []
            for c in sorted(candidates, key=lambda c: -c['score']):
                if c['answer'] in seen:
                    continue
                seen.add(c['answer'])
                words = c['answer'].split()
                # Keep the source fact intact on the back; use a cloze on the front.
                # Prefer a long content word over a connective or punctuation.
                positions = [i for i, w in enumerate(words) if len(w.strip('.,;():')) >= 7 and i > 0]
                pos = max(positions, key=lambda i: len(words[i])) if positions else len(words)//2
                words[pos] = '________'
                question = 'Boşluğu tamamla: ' + ' '.join(words)
                cards.append({'id': f'{li}-{ti}-{len(cards)}', 'question': question, 'answer': c['answer'], 'page': c['page']})
                if len(cards) == 6:
                    break
            if cards:
                out.append({'name': topic, 'cards': cards})
        lessons.append({'id': str(li), 'name': name, 'topics': out})
    (ROOT / 'data/cards.json').write_text(json.dumps({'source': 'Klinisyen Yan Dal Dahiliye Konu Kitabı · 2. PDF', 'status': 'Otomatik çıkarılmış çalışma taslağı; uzman incelemesi yapılmadı. Kitabın tamamını veya sınavdaki tüm önemli konuları kapsamaz.', 'lessons': lessons}, ensure_ascii=False), encoding='utf-8')
    print(f'{len(lessons)} ders, {sum(len(l["topics"]) for l in lessons)} konu, {sum(len(t["cards"]) for l in lessons for t in l["topics"])} kart')

if __name__ == '__main__':
    build(sys.argv[1])
