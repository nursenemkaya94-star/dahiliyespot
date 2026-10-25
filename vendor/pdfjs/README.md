PDF.js 5.4.624, from the official pdfjs-dist npm package.
https://www.npmjs.com/package/pdfjs-dist/v/5.4.624
Apache-2.0; see LICENSE. Files are vendored so GitHub Pages needs no CDN or build step.
Reproduce: npm install --prefix /tmp/tusspot-pdfjs --ignore-scripts pdfjs-dist@5.4.624
Copy legacy/build/pdf.mjs, legacy/build/pdf.worker.mjs, LICENSE, cmaps/, standard_fonts/, wasm/ here.
The legacy build supplies compatibility polyfills for older mobile browsers (including Promise.withResolvers and URL.parse).
