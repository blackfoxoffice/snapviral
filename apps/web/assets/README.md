# App assets

Drop in the following PNG assets before shipping (Expo references these in `app.json`):

- `icon.png` — 1024×1024 app icon
- `adaptive-icon.png` — 1024×1024 foreground for Android adaptive icon
- `splash.png` — ~1284×2778 centred logo
- `favicon.png` — 32×32 or 48×48 web favicon

During development, Expo will fall back to a placeholder if these are missing; they're
required for production builds and PWA install.
