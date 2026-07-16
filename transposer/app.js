// Key Transposer — zero-build PWA. Preact + htm loaded straight from a CDN
// (esm.sh), no bundler/npm required. All the heavy lifting (downloading the
// YouTube audio, detecting the key, pitch-shifting, encoding mp3) happens on
// a separate backend — see /server in this repo. This keeps the phone doing
// only UI work, so it stays fast and doesn't drain the battery.
import { h, render } from "https://esm.sh/preact@10.24.3";
import { useState, useEffect, useRef } from "https://esm.sh/preact@10.24.3/hooks";
import htm from "https://esm.sh/htm@3.1.1";

const html = htm.bind(h);

const PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BACKEND_KEY = "transposer_backend_url";

function isIOS() {
  return /iP(hone|od|ad)/.test(navigator.userAgent);
}
function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || navigator.standalone === true;
}

function loadBackendUrl() {
  return localStorage.getItem(BACKEND_KEY) || "";
}
function saveBackendUrl(url) {
  localStorage.setItem(BACKEND_KEY, url.trim().replace(/\/+$/, ""));
}

async function apiPost(backend, path, body) {
  const res = await fetch(`${backend}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
  return data;
}

function App() {
  const [backend, setBackend] = useState(loadBackendUrl());
  const [showSettings, setShowSettings] = useState(!loadBackendUrl());
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | analyzing | analyzed | transposing | done
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null); // analyze() response
  const [targetKey, setTargetKey] = useState("C");
  const [targetMode, setTargetMode] = useState("major");
  const [result, setResult] = useState(null); // transpose() response

  const busy = phase === "analyzing" || phase === "transposing";

  async function onAnalyze() {
    if (!backend) { setShowSettings(true); setError("Set your backend URL first."); return; }
    if (!youtubeUrl.trim()) { setError("Paste a YouTube link first."); return; }
    setError("");
    setResult(null);
    setPhase("analyzing");
    try {
      const data = await apiPost(backend, "/api/analyze", { url: youtubeUrl.trim() });
      setAnalysis(data);
      setTargetKey(data.detected_key);
      setTargetMode(data.detected_mode);
      setPhase("analyzed");
    } catch (e) {
      setError(e.message || String(e));
      setPhase("idle");
    }
  }

  async function onTranspose() {
    setError("");
    setPhase("transposing");
    try {
      const data = await apiPost(backend, "/api/transpose", {
        job_id: analysis.job_id,
        target_key: targetKey,
        target_mode: targetMode,
      });
      setResult({ ...data, audio_url: `${backend}${data.download_url}` });
      setPhase("done");
    } catch (e) {
      setError(e.message || String(e));
      setPhase("analyzed");
    }
  }

  function onStartOver() {
    setYoutubeUrl("");
    setAnalysis(null);
    setResult(null);
    setError("");
    setPhase("idle");
  }

  return html`
    <div style=${styles.root}>
      <div style=${styles.header}>
        <div style=${styles.badge}>KEY TRANSPOSER</div>
        <div style=${styles.h1}>YouTube → New Key → MP3</div>
        <button style=${styles.gearBtn} onClick=${() => setShowSettings((s) => !s)}>⚙</button>
      </div>

      <div style=${styles.content}>
        ${!isStandalone() && isIOS() && html`
          <div style=${styles.infoBox}>
            <strong style=${{color:"#7dd3fc"}}>Add to Home Screen:</strong> tap the Share icon in Safari, then "Add to Home Screen" for a full-screen app.
          </div>
        `}

        ${showSettings && html`
          <${SettingsPanel}
            backend=${backend}
            onSave=${(url) => { setBackend(url); saveBackendUrl(url); setShowSettings(false); }}
          />
        `}

        ${error && html`<div style=${styles.errorBox}>${error}</div>`}

        <div style=${styles.card}>
          <div style=${styles.label}>YouTube link</div>
          <input
            style=${styles.input}
            type="url"
            inputmode="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value=${youtubeUrl}
            disabled=${busy}
            onInput=${(e) => setYoutubeUrl(e.target.value)}
          />
          <button style=${{...styles.primaryBtn, ...(busy ? styles.btnDisabled : {})}} disabled=${busy} onClick=${onAnalyze}>
            ${phase === "analyzing" ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        ${analysis && html`
          <div style=${styles.card}>
            <div style=${styles.songTitle}>${analysis.title}</div>
            <div style=${styles.keyRow}>
              <span style=${styles.label}>Detected key</span>
              <span style=${styles.keyPill}>${analysis.detected_label}</span>
              <span style=${styles.confidence}>${Math.round(analysis.confidence * 100)}% confidence</span>
            </div>

            <div style=${{...styles.label, marginTop: 18}}>Transpose to</div>
            <div style=${styles.keyGrid}>
              ${PITCH_CLASSES.map((k) => html`
                <button
                  key=${k}
                  style=${{...styles.keyBtn, ...(targetKey === k ? styles.keyBtnActive : {})}}
                  disabled=${busy}
                  onClick=${() => setTargetKey(k)}
                >${k}</button>
              `)}
            </div>
            <div style=${styles.modeToggle}>
              ${["major", "minor"].map((m) => html`
                <button
                  key=${m}
                  style=${{...styles.modeBtn, ...(targetMode === m ? styles.modeBtnActive : {})}}
                  disabled=${busy}
                  onClick=${() => setTargetMode(m)}
                >${m}</button>
              `)}
            </div>

            <button style=${{...styles.primaryBtn, ...(busy ? styles.btnDisabled : {})}} disabled=${busy} onClick=${onTranspose}>
              ${phase === "transposing" ? "Transposing…" : `Transpose & Export MP3`}
            </button>
          </div>
        `}

        ${result && html`
          <div style=${styles.card}>
            <div style=${styles.label}>Result — shifted ${result.semitones > 0 ? "+" : ""}${result.semitones} semitone${Math.abs(result.semitones) === 1 ? "" : "s"}</div>
            <audio style=${{width: "100%", marginTop: 10}} controls src=${result.audio_url}></audio>
            <a style=${styles.downloadBtn} href=${result.audio_url} download>⬇ Download MP3</a>
            <button style=${styles.linkBtn} onClick=${onStartOver}>Transpose another song</button>
          </div>
        `}
      </div>
    </div>
  `;
}

function SettingsPanel({ backend, onSave }) {
  const [value, setValue] = useState(backend);
  return html`
    <div style=${styles.card}>
      <div style=${styles.label}>Backend URL</div>
      <div style=${{...styles.hint, marginBottom: 8}}>
        The audio processing server from /server in this repo (e.g. https://your-app.onrender.com).
      </div>
      <input
        style=${styles.input}
        type="url"
        inputmode="url"
        placeholder="https://your-backend.example.com"
        value=${value}
        onInput=${(e) => setValue(e.target.value)}
      />
      <button style=${styles.primaryBtn} onClick=${() => onSave(value)}>Save</button>
    </div>
  `;
}

const styles = {
  root: { minHeight: "100vh", background: "#12102b", color: "#e8e6f5", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  header: { padding: "20px 20px 16px", position: "relative", borderBottom: "1px solid #262247" },
  badge: { fontSize: 11, letterSpacing: 2, color: "#7dd3fc", fontWeight: 700 },
  h1: { fontSize: 22, fontWeight: 700, marginTop: 4 },
  gearBtn: { position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#9d9ac0", fontSize: 22, cursor: "pointer" },
  content: { padding: 16, paddingBottom: 60, maxWidth: 560, margin: "0 auto" },
  card: { background: "#1a1740", borderRadius: 14, padding: 16, marginBottom: 16 },
  label: { fontSize: 12, letterSpacing: 1, color: "#9d9ac0", textTransform: "uppercase", fontWeight: 600 },
  hint: { fontSize: 13, color: "#7a77a0" },
  input: { width: "100%", padding: "12px 14px", marginTop: 8, marginBottom: 12, borderRadius: 10, border: "1px solid #33306a", background: "#100e28", color: "#e8e6f5", fontSize: 16 },
  primaryBtn: { width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "#7dd3fc", color: "#0b0a1f", fontWeight: 700, fontSize: 15, cursor: "pointer" },
  btnDisabled: { opacity: 0.5, cursor: "default" },
  errorBox: { background: "#3a1a1a", border: "1px solid #6a2a2a", color: "#ffb3b3", padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 14 },
  infoBox: { background: "#182a3a", border: "1px solid #244a6a", color: "#bcd8ee", padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13, lineHeight: 1.4 },
  songTitle: { fontSize: 16, fontWeight: 700, marginBottom: 10 },
  keyRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  keyPill: { background: "#26224f", color: "#7dd3fc", padding: "4px 10px", borderRadius: 20, fontWeight: 700, fontSize: 14 },
  confidence: { fontSize: 12, color: "#7a77a0" },
  keyGrid: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginTop: 8, marginBottom: 12 },
  keyBtn: { padding: "10px 0", borderRadius: 8, border: "1px solid #33306a", background: "#100e28", color: "#e8e6f5", fontWeight: 600, cursor: "pointer" },
  keyBtnActive: { background: "#7dd3fc", color: "#0b0a1f", borderColor: "#7dd3fc" },
  modeToggle: { display: "flex", gap: 8, marginBottom: 16 },
  modeBtn: { flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #33306a", background: "#100e28", color: "#e8e6f5", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" },
  modeBtnActive: { background: "#26224f", color: "#7dd3fc", borderColor: "#7dd3fc" },
  downloadBtn: { display: "block", textAlign: "center", marginTop: 12, padding: "14px", borderRadius: 10, background: "#7dd3fc", color: "#0b0a1f", fontWeight: 700, textDecoration: "none" },
  linkBtn: { display: "block", width: "100%", marginTop: 10, background: "none", border: "none", color: "#9d9ac0", fontSize: 13, cursor: "pointer", textAlign: "center" },
};

render(html`<${App} />`, document.getElementById("root"));
