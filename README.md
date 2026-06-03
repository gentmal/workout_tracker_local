# OVERLOAD

A personal, offline-first strength-training PWA. Local-only (no accounts, no backend) — all data lives on your device in `localStorage` + `IndexedDB` (photos).

## Features
- Custom programs, days & exercises (full editor)
- Guided **active session** mode with auto rest timer + plate calculator
- Progress charts: top-set weight, est. 1RM (Epley), volume, weekly volume, volume-by-muscle, PR board
- Body tracking: bodyweight trend, measurements, cardio log, progress photos
- Metric (kg) only
- JSON backup / restore (includes photos)
- Installable to the iOS Home Screen, works fully offline

## Use it
Open `index.html` over HTTPS (e.g. GitHub Pages), then on iOS Safari: **Share → Add to Home Screen**.

Offline support (service worker) requires HTTPS or `localhost`.

## Files
- `index.html` — the entire app (HTML/CSS/JS, no build step)
- `manifest.webmanifest` — PWA manifest
- `sw.js` — service worker (offline cache; bump `CACHE` to force updates)
- `icons/` — app icons
