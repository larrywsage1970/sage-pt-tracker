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
job. Any small always-on Python host works, e.g. Render, Railway, or Fly.io:

1. Point the service at this `server/` directory.
2. Build command: `pip install -r requirements.txt`, plus an apt step (or a
   Docker base image) that installs `ffmpeg` and `rubberband-cli`.
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. Set `ALLOWED_ORIGINS` to your frontend's URL.
5. Paste the deployed URL into the app's Settings panel on your phone.
