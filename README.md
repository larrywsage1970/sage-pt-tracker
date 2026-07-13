# Sage PT

Personal daily bodyweight PT tracker — no gym, no equipment, no account, no build step. Installs on iPhone as a home-screen app (PWA) and works offline.

## Features
- Daily checklist across Chest / Shoulders / Pull / Abs / Legs
- Toggle exercises on/off and adjust reps in the Library tab
- Streak + weekly session count
- Rest timer with vibration/sound on completion; keeps the screen awake while running
- Workout log history
- Export/import your data as a JSON backup (More tab)
- Fully offline after first load — data lives in the browser (localStorage), nothing leaves your phone

## How it's built
Plain static files — `index.html` + `app.js` — no npm, no bundler. React-like UI is
[Preact](https://preactjs.com/) + [htm](https://github.com/developit/htm), loaded straight from
the esm.sh CDN as native ES modules. A service worker (`sw.js`) caches the app shell and those
CDN modules on first load, so the app keeps working with no signal.

## Install on iPhone
1. Open the deployed URL in Safari
2. Tap the Share icon → **Add to Home Screen**
3. Launch it from the home screen icon — it opens full-screen, no browser chrome

## Local development
No install required. Serve the folder with any static file server, e.g.:
```
scripts/serve.ps1
```
then open http://localhost:8787. Re-run `scripts/generate-icons.ps1` if you change the icon design.

## Deploy
Static files only — GitHub Pages serves this repo directly from `main` / root, no CI needed.
