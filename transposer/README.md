# Key Transposer

Paste a YouTube link, see the song's key, transpose it to another key, and
export an MP3 — installable on your phone as a home-screen app.

## How it works

This folder is a zero-build static PWA (same pattern as the Sage PT app at
the repo root): Preact + htm loaded from a CDN, no bundler, no npm install.
It only handles UI — the actual audio work (downloading, key detection,
pitch shifting, MP3 export) happens on the backend in [`/server`](../server),
since that's CPU-heavy work a phone shouldn't be doing. See that folder's
README for how to run/deploy it.

## Local development

```
python3 -m http.server 8878
```
Open http://localhost:8878, tap the gear icon, and enter your backend's URL
(e.g. `http://localhost:8001` while developing, or your deployed backend URL).

## Install on iPhone

1. Deploy this folder (e.g. GitHub Pages) and open it in Safari
2. Tap the Share icon → **Add to Home Screen**
3. Launch it from the home screen — it opens full-screen, no browser chrome

## Deploy

Static files only, same as the rest of this repo — GitHub Pages (or any
static host) serves this folder directly. The backend needs separate
hosting (see `/server`), since it isn't a static site.
