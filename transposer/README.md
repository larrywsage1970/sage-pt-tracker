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

## iPhone Shortcut

You don't need to open the app at all — share a YouTube link straight to a
Shortcut and get a transposed MP3 back. This uses the backend's `POST
/api/quick` endpoint, which does analyze+transpose+export in one HTTP call
so the Shortcut only needs to make a single request.

**Build it once** (Shortcuts app → tap **+** for a new shortcut):

1. **Rename it** — tap the shortcut's name at the top, call it e.g. "Transpose Song".
2. **Enable Share Sheet** — tap the **⋯** (or ⓘ) settings icon → turn on
   **Use with Share Sheet** → under **Share Sheet Types**, check **URLs**
   (and **Text**, if the YouTube app shares as text on your iOS version).
   This makes the shortcut show up when you tap Share on a YouTube video.
3. **Add action: "Ask for Input"** (search for it in the action picker).
   - Input Type: **Text**
   - Prompt: `YouTube link`
   - Default Answer: tap the field, then insert the **Shortcut Input**
     variable (the ⓘ/variables icon above the keyboard) — this pre-fills
     it with the link when you arrive here via the Share Sheet, so you can
     just tap Done without retyping anything.
4. **Add another "Ask for Input"** action:
   - Input Type: **Text**
   - Prompt: `Target key — C, C#, D, D#, E, F, F#, G, G#, A, A#, or B`
   - Default Answer: whatever key you transpose to most often (e.g. `D`)
5. **Add action: "Get Contents of URL"**:
   - URL: `https://YOUR-BACKEND-URL/api/quick` (your deployed `/server` URL)
   - Method: **POST**
   - Headers: add one — Key `Content-Type`, Value `application/json`
   - Request Body: **JSON**, with three fields:
     - `url` → insert the variable from step 3 (the first "Provided Input")
     - `target_key` → insert the variable from step 4 (the second "Provided Input")
     - `target_mode` → `major` (plain text)
6. **Add action: "Save File"** (search for it) and pick a folder — e.g. On My
   iPhone → Shortcuts, or an iCloud Drive folder. Turn off "Ask Where to
   Save" once you've picked a default, so it saves silently.

That's it — 5 actions total. Now: watch a song on YouTube → Share → tap
your shortcut → confirm the link → type a target key → wait a bit → the
transposed MP3 lands in your chosen folder, ready to open in the Files app,
AirDrop, or import into GarageBand/a DAW.

**Notes**
- The backend still has to actually download + process the song, which
  takes real time (tens of seconds, depending on track length and server
  CPU) — Shortcuts will show a spinner the whole time, that's expected.
- If you want to see the detected key before committing to a target, use
  the [web app](../transposer) instead (Analyze first, then pick a key) —
  `/api/quick` is a one-shot fire-and-forget call and doesn't let you
  preview the detected key first.
- If a request fails, "Get Contents of URL" still returns the response
  body — since `/api/quick` sends JSON `{"detail": "..."}"` on errors, add
  an "If" action checking the response for a "detail" key if you want the
  Shortcut to surface errors instead of trying to save an error message as
  an mp3.
