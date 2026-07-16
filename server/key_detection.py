"""Musical key detection from an audio file using chroma features.

Approach: average a chromagram over the whole track into a 12-bin pitch-class
profile, then correlate that profile against the Krumhansl-Schmuckler major
and minor key profiles (rotated to all 12 roots) and pick the best match.
"""
from __future__ import annotations

import numpy as np
import librosa

PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Krumhansl-Kessler key profiles (relative perceived stability of each pitch
# class within a major/minor key, root-relative).
_MAJOR_PROFILE = np.array(
    [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
)
_MINOR_PROFILE = np.array(
    [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
)


def _rotate(profile: np.ndarray, n: int) -> np.ndarray:
    return np.roll(profile, n)


def detect_key(audio_path: str) -> dict:
    """Return the best-guess key for the audio file at `audio_path`.

    Returns a dict: {"key": "G", "mode": "major", "label": "G major",
    "confidence": 0.0-1.0, "candidates": [...]}
    """
    y, sr = librosa.load(audio_path, sr=22050, mono=True)

    # Trim near-silence at the ends so intro/outro noise doesn't skew the profile.
    y, _ = librosa.effects.trim(y, top_db=30)
    if y.size == 0:
        y, sr = librosa.load(audio_path, sr=22050, mono=True)

    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    profile = chroma.mean(axis=1)
    # Normalize so correlation is scale-invariant.
    if profile.std() > 0:
        profile = (profile - profile.mean()) / profile.std()

    scores = []
    for root in range(12):
        major = _rotate(_MAJOR_PROFILE, root)
        minor = _rotate(_MINOR_PROFILE, root)
        major = (major - major.mean()) / major.std()
        minor = (minor - minor.mean()) / minor.std()
        scores.append((np.dot(profile, major) / 12, root, "major"))
        scores.append((np.dot(profile, minor) / 12, root, "minor"))

    scores.sort(key=lambda s: s[0], reverse=True)
    best_score, best_root, best_mode = scores[0]

    # Rough confidence: how far the winner is ahead of the runner-up,
    # squashed into 0..1.
    second_score = next(s[0] for s in scores if s[1] != best_root or s[2] != best_mode)
    margin = max(best_score - second_score, 0.0)
    confidence = float(min(1.0, margin))

    key_name = PITCH_CLASSES[best_root]
    label = f"{key_name} {best_mode}"

    candidates = [
        {"key": PITCH_CLASSES[root], "mode": mode, "label": f"{PITCH_CLASSES[root]} {mode}", "score": float(score)}
        for score, root, mode in scores[:5]
    ]

    return {
        "key": key_name,
        "mode": best_mode,
        "label": label,
        "confidence": confidence,
        "candidates": candidates,
    }


def semitone_shift(from_key: str, from_mode: str, to_key: str, to_mode: str) -> int:
    """Semitone distance to move `from_key` to `to_key` (mode is informational
    only; we shift pitch class, not major/minor quality)."""
    from_idx = PITCH_CLASSES.index(from_key)
    to_idx = PITCH_CLASSES.index(to_key)
    diff = (to_idx - from_idx) % 12
    # Prefer the smaller absolute shift (e.g. -2 instead of +10).
    if diff > 6:
        diff -= 12
    return diff
