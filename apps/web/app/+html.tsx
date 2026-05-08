import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const SW_REGISTRATION = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <title>SnapViral</title>
        <meta
          name="description"
          content="AI-powered YouTube content studio. Turn topics, scripts, or links into ready-to-publish videos."
        />

        {/* PWA */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#FF0033" />
        <meta name="background-color" content="#FFFFFF" />
        <meta name="application-name" content="SnapViral" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="SnapViral" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <link rel="shortcut icon" href="/icons/icon-192.png" />

        <ScrollViewStyleReset />
        <style id="snapviral-shell">{`
          html, body, #root { height: 100%; }
          body { margin: 0; background: #FFFFFF; -webkit-tap-highlight-color: transparent; }
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: SW_REGISTRATION }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
