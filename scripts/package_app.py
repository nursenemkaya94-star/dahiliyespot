"""Build a single HTML file usable without a server or internet."""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text()
css = (root / 'style.css').read_text()
css = '\n'.join(line for line in css.splitlines() if not line.startswith('@import'))
js = (root / 'app.js').read_text()
data = (root / 'data/cards.json').read_text()
js = js.replace("fetch('data/cards.json').then(r=>{if(!r.ok)throw Error();return r.json()})", 'Promise.resolve(' + data + ')')
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + css + '</style>')
html = html.replace('<script src="app.js"></script>', '<script>' + js.replace('</script', '<\\/script') + '</script>')
(root / 'TUS-Spot.html').write_text(html)
print('Created TUS-Spot.html')
