"""Build a single HTML file usable without a server or internet."""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text()
css = (root / 'style.css').read_text()
css = '\n'.join(line for line in css.splitlines() if not line.startswith('@import'))
js = (root / 'app.js').read_text()
data = (root / 'data/cards.json').read_text()
js = js.replace("fetch('data/cards.json?v=first-part-590-v1', {cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()})", 'Promise.resolve(' + data + ')')
questions = (root / 'data/questions.json').read_text()
js = js.replace("fetch('data/questions.json?v=endo-quiz-v1',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()})", 'Promise.resolve(' + questions + ')')
html = html.replace('<link rel="stylesheet" href="style.css?v=first-part-590-v1">', '<style>' + css + '</style>')
html = html.replace('<script src="app.js?v=first-part-590-v1"></script>', '<script>' + js.replace('</script', '<\\/script') + '</script>')
(root / 'TUS-Spot.html').write_text(html)
print('Created TUS-Spot.html')
