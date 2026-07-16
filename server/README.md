# Key Transposer — backend

Does all the CPU-heavy work for the [Key Transposer](../transposer) mobile app:
downloads a YouTube video's audio, detects its musical key, pitch-shifts it to
a target key (tempo-preserving, formant-preserving), and encodes the result
as an MP3.

Everything heavy runs here — not in the browser — so the frontend stays a
thin, battery-friendly PWA that works well on a phone.

## Endpoints

- `POST /api/analyze` — `{"url": "<youtube link>"}` → downloads the audio,
  detects its key, returns `{job_id, title, duration, detected_key,
  detected_mode, detected_label, confidence, keys}`.
- `POST /api/transpose` — `{"job_id", "target_key", "target_mode"}` →
  pitch-shifts the previously analyzed audio to the target key, encodes MP3,
  returns `{job_id, semitones, download_url}`.
- `GET /api/jobs/{job_id}/audio.mp3` — the transposed MP3.
- `POST /api/quick` — `{"url", "target_key", "target_mode"}` → does
  analyze+transpose+encode in one request and returns the **mp3 bytes
  directly** (`audio/mpeg`), with `X-Song-Title`, `X-Detected-Key`, and
  `X-Semitone-Shift` response headers carrying the metadata that would
  otherwise come back as JSON. Built for callers that can't easily chain two
  HTTP requests and thread a `job_id` between them — namely iOS Shortcuts.
  See [`/transposer` README](../transposer/README.md#iphone-shortcut) for the
  Shortcut build steps.
- `GET /api/health` — liveness check.

Jobs (and their temp audio files) live in memory/disk for 2 hours, then get
swept. This is built for single-instance personal use, not multi-tenant scale.

## System dependencies

Install these on the host (not via pip):
- **ffmpeg** — audio extraction/encoding
- **rubberband-cli** — pitch shifting (`rubberband` binary on PATH)

```
# Debian/Ubuntu
sudo apt-get install -y ffmpeg rubberband-cli
```

## Local development

```
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

uvicorn main:app --reload --port 8001
```

Then point the frontend's Settings panel at `http://localhost:8001`.

Note: downloading YouTube audio is subject to YouTube's Terms of Service —
this is intended for personal practice/reference use, not redistribution.

## Configuration

Environment variables:
- `ALLOWED_ORIGINS` — comma-separated CORS origins allowed to call this API
  (default `*`). Set this to your deployed frontend's origin, e.g.
  `https://yourname.github.io`.
- `MAX_DURATION_SECONDS` — reject tracks longer than this (default 1200 = 20
  min), to keep processing time bounded.

## Deploying

This needs a real server (not an edge/serverless function) because it shells
out to `ffmpeg`/`rubberband` binaries and can take real wall-clock time per
job. Any small always-on host that can run a Docker image works — Render,
Railway, Fly.io, etc.

### Render (one click, using the included Blueprint)

The repo root has a [`render.yaml`](../render.yaml) that points at
[`server/Dockerfile`](./Dockerfile) — a `python:3.11-slim` image with
`ffmpeg` and `rubberband-cli` baked in, so there's no separate build-step
config to get right.

1. Push this repo to GitHub (already done if you're reading this from a clone).
2. In the Render dashboard: **New +** → **Blueprint**.
3. Connect your GitHub account/repo if you haven't already, then pick this repo.
4. Render reads `render.yaml` and proposes one service, `key-transposer-backend` —
   review and click **Apply**.
5. Wait for the first build (a few minutes — it's building a Docker image).
6. Once live, note the service URL Render gives you
   (`https://key-transposer-backend-xxxx.onrender.com`), and:
   - `curl https://<that-url>/api/health` should return `{"status":"ok"}`.
   - Paste that URL into the transposer app's Settings panel, or into the
     iOS Shortcut's `Get Contents of URL` action.
7. Once you know your frontend's URL, set `ALLOWED_ORIGINS` in the
   service's Render dashboard → Environment tab to that origin (it defaults
   to `*` from the Blueprint, which works but is looser than necessary).

Free-tier Render services spin down after inactivity and take ~30-60s to
wake back up on the next request — expect that cold-start delay on the
first song after a while away.

### Manual setup (Railway, Fly.io, your own VPS, ...)

1. Point the service at this `server/` directory, using `server/Dockerfile`
   if the host supports Docker; otherwise run the build/start commands below
   directly with `ffmpeg`/`rubberband-cli` installed via apt on the host.
2. Build command: `pip install -r requirements.txt`.
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. Set `ALLOWED_ORIGINS` to your frontend's URL.
5. Paste the deployed URL into the app's Settings panel on your phone (or
   the Shortcut).
