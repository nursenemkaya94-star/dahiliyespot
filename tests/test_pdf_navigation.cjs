// No browser dependencies: exercise the actual card source click handlers for all cards.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function application() {
 const elements = new Map();
 const get = id => {
  if (!elements.has(id)) elements.set(id, {value: '', style: {}, dataset: {},
   classList: {toggle() {}, add() {}, remove() {}}, setAttribute() {}, addEventListener() {}});
  return elements.get(id);
 };
 const context = vm.createContext({document: {getElementById: get, querySelectorAll: () => [], addEventListener() {}},
  localStorage: {getItem: () => null}, window: {scrollTo() {}},
  fetch: () => new Promise(() => {})});
 vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);
 const data = JSON.parse(fs.readFileSync(path.join(root, 'data/cards.json'), 'utf8'));
 context.fixture = data;
 vm.runInContext('data=fixture; Object.assign(sourceBooks,data.sources)', context);
 return {context, get, data};
}

test('every card opens its cited PDF and physical page through the application viewer', () => {
 const {context, get, data} = application();
 let count = 0;
 for (const lesson of data.lessons) for (const topic of lesson.topics) for (const card of topic.cards) {
  context.card = {...card, lesson: lesson.name};
  vm.runInContext('cards=[card];index=0;renderCard()', context);
  get('source').onclick();
  const url = new URL(get('pdfFrame').src, 'https://example.github.io/tus-spot/');
  assert.equal(url.pathname, '/tus-spot/pdf-viewer.html');
  assert.equal(url.searchParams.get('file'), data.sources[card.source || 'second'].path, card.id);
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('page'), String(card.page), card.id);
  assert.equal(get('pdfOpen').href, get('pdfFrame').src);
  count++;
 }
 assert.equal(count, 1110);
});

test('same-file page navigation changes the viewer fragment and rejects invalid pages', () => {
 const {context, get} = application();
 vm.runInContext("openPdf(81,'first-part-2')", context);
 const first = new URL(get('pdfFrame').src, 'https://example.test/');
 vm.runInContext("openPdf(82,'first-part-2')", context);
 const second = new URL(get('pdfFrame').src, 'https://example.test/');
 assert.equal(first.search, second.search);
 assert.equal(first.hash, '#page=81');
 assert.equal(second.hash, '#page=82');
 const valid = get('pdfFrame').src;
 for (const number of [0, -1, 141, 1.5, 'invalid']) {
  context.number = number;
  vm.runInContext("openPdf(number,'first-part-2')", context);
  assert.equal(get('pdfFrame').src, valid);
  assert.match(get('pdfStatus').textContent, /1–140/);
 }
});
