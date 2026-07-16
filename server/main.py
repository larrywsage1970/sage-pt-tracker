"""YouTube Audio Transposer backend.

Two endpoints do the heavy lifting server-side (download, key detection,
pitch shifting, mp3 encoding) so the mobile frontend stays a thin, battery-
friendly PWA that only uploads a URL and downloads a result:

  POST /api/analyze     {url}                     -> detected key + job_id
  POST /api/transpose   {job_id, target_key, target_mode} -> output_url
  GET  /api/jobs/{id}/audio.mp3                    -> the transposed file
"""
from __future__ import annotations

import logging
import os
from pathlib import Path

import yt_dlp
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from jobs import Job, create_job, get_job
from key_detection import PITCH_CLASSES, detect_key, semitone_shift
from pitch import export_mp3, pitch_shift_wav

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("transposer")

MAX_DURATION_SECONDS = int(os.environ.get("MAX_DURATION_SECONDS", 20 * 60))
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",")]

app = FastAPI(title="YouTube Audio Transposer")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    url: str = Field(..., min_length=1)


class AnalyzeResponse(BaseModel):
    job_id: str
    title: str
    duration: float
    detected_key: str
    detected_mode: str
    detected_label: str
    confidence: float
    keys: list[str]


class TransposeRequest(BaseModel):
    job_id: str
    target_key: str
    target_mode: str = "major"


class TransposeResponse(BaseModel):
    job_id: str
    semitones: int
    download_url: str


def _download_audio(url: str, job: Job) -> None:
    outtmpl = str(job.dir / "source.%(ext)s")
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": outtmpl,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
                "preferredquality": "0",
            }
        ],
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)

    duration = float(info.get("duration") or 0)
    if MAX_DURATION_SECONDS and duration > MAX_DURATION_SECONDS:
        raise HTTPException(
            status_code=400,
            detail=f"Track is {int(duration)}s long; this instance caps analysis at {MAX_DURATION_SECONDS}s.",
        )

    job.title = info.get("title") or "Untitled"
    job.duration = duration
    job.source_wav = job.dir / "source.wav"
    if not job.source_wav.exists():
        raise HTTPException(status_code=502, detail="Audio extraction failed — no output file produced.")


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    job = create_job()
    try:
        _download_audio(req.url, job)
        result = detect_key(str(job.source_wav))
    except HTTPException:
        raise
    except yt_dlp.utils.DownloadError as e:
        raise HTTPException(status_code=400, detail=f"Couldn't fetch that YouTube URL: {e}")
    except Exception as e:  # noqa: BLE001 - surface unexpected failures to the client
        log.exception("analyze failed")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")

    job.detected_key = result["key"]
    job.detected_mode = result["mode"]
    job.detected_label = result["label"]
    job.confidence = result["confidence"]

    return AnalyzeResponse(
        job_id=job.id,
        title=job.title,
        duration=job.duration,
        detected_key=job.detected_key,
        detected_mode=job.detected_mode,
        detected_label=job.detected_label,
        confidence=job.confidence,
        keys=PITCH_CLASSES,
    )


@app.post("/api/transpose", response_model=TransposeResponse)
def transpose(req: TransposeRequest) -> TransposeResponse:
    job = get_job(req.job_id)
    if job is None or job.source_wav is None:
        raise HTTPException(status_code=404, detail="Unknown or expired job_id — analyze the URL again.")
    if req.target_key not in PITCH_CLASSES:
        raise HTTPException(status_code=400, detail=f"target_key must be one of {PITCH_CLASSES}")

    shift = semitone_shift(job.detected_key, job.detected_mode, req.target_key, req.target_mode)

    try:
        shifted_wav = job.dir / "shifted.wav"
        pitch_shift_wav(job.source_wav, shifted_wav, shift)

        output_mp3 = job.dir / "output.mp3"
        export_mp3(shifted_wav, output_mp3)
    except Exception as e:  # noqa: BLE001
        log.exception("transpose failed")
        raise HTTPException(status_code=500, detail=f"Transposition failed: {e}")

    job.output_mp3 = output_mp3
    job.output_key = f"{req.target_key} {req.target_mode}"

    return TransposeResponse(
        job_id=job.id,
        semitones=shift,
        download_url=f"/api/jobs/{job.id}/audio.mp3",
    )


@app.get("/api/jobs/{job_id}/audio.mp3")
def download(job_id: str) -> FileResponse:
    job = get_job(job_id)
    if job is None or job.output_mp3 is None or not job.output_mp3.exists():
        raise HTTPException(status_code=404, detail="No transposed audio for this job yet.")
    filename = f"{job.title} ({job.output_key}).mp3".replace("/", "-")
    return FileResponse(job.output_mp3, media_type="audio/mpeg", filename=filename)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
