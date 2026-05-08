#!/usr/bin/env node
// Post-process dist/index.html to add PWA head tags + service worker registration.
// Runs after `expo export --platform web`.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const INDEX = join(DIST, 'index.html');

if (!existsSync(INDEX)) {
  console.error('[inject-pwa] dist/index.html not found — did expo export run?');
  process.exit(1);
}

const HEAD_INJECTION = `
  <!-- PWA -->
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="application-name" content="SnapViral">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="SnapViral">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="description" content="AI-powered YouTube content studio. Turn topics, scripts, or links into ready-to-publish videos.">
  <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png">
  <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png">
  <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png">
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').catch(function () {});
      });
    }
  </script>
`;

let html = readFileSync(INDEX, 'utf8');

if (html.includes('rel="manifest"')) {
  console.log('[inject-pwa] already injected — skipping');
  process.exit(0);
}

html = html.replace('</head>', `${HEAD_INJECTION}</head>`);
writeFileSync(INDEX, html);
console.log('[inject-pwa] injected manifest + icons + sw registration into dist/index.html');
