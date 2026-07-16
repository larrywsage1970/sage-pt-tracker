"""In-memory job store + temp-file management for the transposer backend.

Good enough for single-instance personal use. Each job gets its own temp
directory holding the extracted source audio and, later, the transposed
output. Jobs older than JOB_TTL_SECONDS are swept on every new job creation.
"""
from __future__ import annotations

import shutil
import tempfile
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

JOB_TTL_SECONDS = 2 * 60 * 60  # 2 hours


@dataclass
class Job:
    id: str
    dir: Path
    created_at: float = field(default_factory=time.time)
    title: str = ""
    duration: float = 0.0
    source_wav: Optional[Path] = None
    detected_key: Optional[str] = None
    detected_mode: Optional[str] = None
    detected_label: Optional[str] = None
    confidence: float = 0.0
    output_mp3: Optional[Path] = None
    output_key: Optional[str] = None


_jobs: dict[str, Job] = {}


def _sweep_expired() -> None:
    now = time.time()
    expired = [jid for jid, j in _jobs.items() if now - j.created_at > JOB_TTL_SECONDS]
    for jid in expired:
        job = _jobs.pop(jid)
        shutil.rmtree(job.dir, ignore_errors=True)


def create_job() -> Job:
    _sweep_expired()
    job_id = uuid.uuid4().hex
    job_dir = Path(tempfile.mkdtemp(prefix=f"transposer_{job_id}_"))
    job = Job(id=job_id, dir=job_dir)
    _jobs[job_id] = job
    return job


def get_job(job_id: str) -> Optional[Job]:
    return _jobs.get(job_id)
