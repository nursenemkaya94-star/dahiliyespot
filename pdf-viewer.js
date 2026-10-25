import {getDocument, GlobalWorkerOptions} from './vendor/pdfjs/pdf.mjs';

GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.mjs', import.meta.url).href;
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const file = params.get('file') || '';
const allowedFile = /^library\/dahiliye(?:-ilk-parca[1-5])?\.pdf$/;
let pdf, zoom = 1, revision = 0, renderTask;

function requestedPage() {
 const value = Number(new URLSearchParams(location.hash.slice(1)).get('page') || 1);
 if (!Number.isInteger(value) || value < 1 || value > pdf.numPages) throw Error('Geçersiz PDF sayfası.');
 return value;
}

async function renderPage() {
 if (!pdf) return;
 const currentRevision = ++revision;
 try {
  const number = requestedPage();
  $('status').textContent = 'Sayfa yükleniyor…';
  const page = await pdf.getPage(number);
  if (currentRevision !== revision) return;
  if (renderTask) {
   renderTask.cancel();
   try { await renderTask.promise; } catch {}
   if (currentRevision !== revision) return;
  }
  const natural = page.getViewport({scale: 1});
  const width = Math.max(240, document.documentElement.clientWidth - 24);
  const viewport = page.getViewport({scale: width / natural.width * zoom});
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = $('page');
  canvas.width = Math.ceil(viewport.width * ratio);
  canvas.height = Math.ceil(viewport.height * ratio);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  renderTask = page.render({canvasContext: canvas.getContext('2d'), viewport,
   transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0]});
  await renderTask.promise;
  if (currentRevision !== revision) return;
  canvas.dataset.page = String(number);
  canvas.setAttribute('aria-label', `Kaynak PDF · sayfa ${number}`);
  $('pageLabel').textContent = `PDF sayfa ${number} / ${pdf.numPages}`;
  $('status').textContent = '';
  window.scrollTo(0, 0);
 } catch (error) {
  if (currentRevision === revision && error.name !== 'RenderingCancelledException') {
   $('status').textContent = 'Sayfa gösterilemedi. PDF indir bağlantısıyla dosyayı açabilirsin.';
   console.error(error);
  }
 }
}

$('zoomOut').onclick = () => { zoom = Math.max(0.5, zoom - 0.25); renderPage(); };
$('zoomIn').onclick = () => { zoom = Math.min(3, zoom + 0.25); renderPage(); };
window.addEventListener('hashchange', renderPage);
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderPage, 150); });

try {
 if (!allowedFile.test(file)) throw Error('Geçersiz kaynak dosyası.');
 const url = new URL(file, location.href);
 $('download').href = url.href;
 pdf = await getDocument({url: url.href, cMapUrl: './vendor/pdfjs/cmaps/', cMapPacked: true,
  standardFontDataUrl: './vendor/pdfjs/standard_fonts/', wasmUrl: './vendor/pdfjs/wasm/'}).promise;
 await renderPage();
} catch (error) {
 $('status').textContent = 'PDF yüklenemedi. İnternet bağlantını kontrol edip yeniden dene.';
 console.error(error);
}
