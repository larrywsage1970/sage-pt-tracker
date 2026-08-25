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
- Grades tab: shows per-class grades and missing assignments synced from ProgressBook on a schedule, no login required in the app itself (see below)

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

## Grades tab (ProgressBook sync)
The Grades tab reads `data/grades.json`, which a scheduled GitHub Action
(`.github/workflows/scrape-progressbook.yml`) keeps up to date by logging into
ProgressBook with Playwright and writing a summary of grades + missing
assignments. The app itself never logs in — it only ever displays what the
scraper last wrote.

**One-time setup:**
1. In the repo's GitHub settings → **Secrets and variables → Actions**, add:
   - `PROGRESSBOOK_URL` — your district's ParentAccess home page, e.g. `https://pa.neonet.org/district/st`. This lands on a public district page (calendar etc.) with a "Sign In" button; the scraper clicks it to kick off a fresh SSO handshake with the correct app context — the bare `https://pa.neonet.org/` root shows a district picker instead, and won't work. **Don't** use a one-time `?signin=...` link copied from a browser session/autofill either — that token is bound to the session that created it and fails with a generic SSO error ("There is an error determining which application you are signing into") when hit cold from a fresh browser.
   - `PROGRESSBOOK_USERNAME`
   - `PROGRESSBOOK_PASSWORD`

   These are encrypted at rest and only ever readable by the workflow run —
   never commit credentials to any file in this repo.
2. Run the workflow once manually (Actions tab → **Scrape ProgressBook** → **Run workflow**) to confirm login works.
3. After that it runs automatically on the schedule in the workflow file (default: every 3 hours on school days — edit the `cron` line to change it).

**Status:** login and per-course grade extraction (course name, current
grade) are wired up against the real Grades page. Teacher and missing-
assignment detail aren't extracted yet — that requires clicking into each
course's expanded row/detail page, which proved unreliable, plus there's no
real missing-assignment data yet this early in the school year to verify
that logic against anyway. Worth revisiting once assignments start showing
up.

**Security note:** if a ProgressBook password is ever pasted into a chat,
screen share, or any non-secret location, treat it as compromised and change
it — don't reuse a password that's been exposed that way as the one stored
in GitHub Secrets.
