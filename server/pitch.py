"""Pitch shifting + MP3 export via the rubberband and ffmpeg CLIs."""
from __future__ import annotations

import subprocess
from pathlib import Path


def pitch_shift_wav(src_wav: Path, dst_wav: Path, semitones: int) -> None:
    """Shift `src_wav` by `semitones` (can be 0) into `dst_wav`, preserving
    tempo and formants (so vocals don't turn chipmunk-y)."""
    if semitones == 0:
        dst_wav.write_bytes(src_wav.read_bytes())
        return

    subprocess.run(
        [
            "rubberband",
            "-3",  # finer R3 engine, better quality at the cost of CPU
            "--formant",
            "-p",
            str(semitones),
            str(src_wav),
            str(dst_wav),
        ],
        check=True,
        capture_output=True,
    )


def export_mp3(src_wav: Path, dst_mp3: Path, bitrate_kbps: int = 192) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(src_wav),
            "-codec:a",
            "libmp3lame",
            "-b:a",
            f"{bitrate_kbps}k",
            str(dst_mp3),
        ],
        check=True,
        capture_output=True,
    )
