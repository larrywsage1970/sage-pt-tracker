// Sage PT — zero-build PWA. Preact + htm loaded straight from a CDN (esm.sh),
// no bundler/npm required. Service worker (sw.js) caches these CDN modules
// on first load so the app keeps working offline after that.
import { h, render } from "https://esm.sh/preact@10.24.3";
import { useState, useEffect } from "https://esm.sh/preact@10.24.3/hooks";
import htm from "https://esm.sh/htm@3.1.1";

const html = htm.bind(h);

// ── EXERCISE LIBRARY ──────────────────────────────────────────────────────────
// Built around a standing desk (in place of a wall) + a small balance board.
const LIBRARY = [
  // CHEST / PUSH — desk edge in place of a wall
  { id: "desk-pu",       name: "Desk Push-Ups",            muscle: "Chest / Shoulders",    category: "Chest", defaultReps: 15, tip: "Hands shoulder-width on the desk edge, step feet back. Control the descent." },
  { id: "wide-desk-pu",  name: "Wide-Grip Desk Push-Ups",  muscle: "Outer Chest",           category: "Chest", defaultReps: 12, tip: "Hands wider than shoulders on the desk edge. Targets the outer chest more directly." },
  { id: "close-desk-pu", name: "Close-Grip Desk Push-Ups", muscle: "Inner Chest / Triceps", category: "Chest", defaultReps: 10, tip: "Hands close together on the desk, thumbs nearly touching. Hits the inner chest and triceps hard." },
  { id: "desk-dip",      name: "Desk Edge Dips",           muscle: "Chest / Triceps",       category: "Chest", defaultReps: 10, tip: "Hands on the desk edge behind you, feet forward. Lower slowly until elbows hit 90°, push back up." },
  { id: "chest-iso",     name: "Isometric Chest Press",    muscle: "Chest",                 category: "Chest", defaultReps: 10, tip: "Press palms together hard at chest height. Hold 5 sec, release. Pure chest contraction — no equipment." },
  { id: "chest-open",    name: "Standing Chest Fly",       muscle: "Chest / Anterior Delt", category: "Chest", defaultReps: 12, tip: "Arms wide, palms forward. Slowly bring hands together in front of chest like hugging a barrel. Slow return." },

  // SHOULDERS
  { id: "shoulder-p",   name: "Standing Shoulder Press",  muscle: "Shoulders",            category: "Shoulders", defaultReps: 12, tip: "Clasp hands overhead and press against your own resistance. Or use a light filled bag." },
  { id: "lateral-r",    name: "Lateral Raise (No Weight)",muscle: "Side Delts",           category: "Shoulders", defaultReps: 12, tip: "Arms straight, raise to shoulder height, lower slow. Add a bag for resistance. Slow wins here." },
  { id: "desk-pike-pu", name: "Desk Pike Push-Ups",       muscle: "Shoulders / Triceps",  category: "Shoulders", defaultReps: 8,  tip: "Hands on the desk edge, walk feet back so hips are high. Lower your head toward the desk. Serious shoulder builder." },
  { id: "front-raise",  name: "Front Raise (No Weight)",  muscle: "Front Delts",          category: "Shoulders", defaultReps: 12, tip: "Arms straight, raise forward to shoulder height. Squeeze at top. Hold a bag to add load." },
  { id: "rear-delt",    name: "Rear Delt Squeeze",        muscle: "Rear Delts / Upper Back",category:"Shoulders",defaultReps: 15, tip: "Arms out to sides, bent slightly. Pull elbows back, squeeze shoulder blades. Hold 2 sec." },

  // BACK / PULL — desk-anchored instead of a doorframe
  { id: "desk-row",     name: "Under-Desk Isometric Row", muscle: "Back / Biceps",        category: "Pull",  defaultReps: 10, tip: "Grip the underside of the desk with both hands, pull up hard like you're trying to lift it. Hold 3–5 sec, release." },
  { id: "band-desk-row",name: "Desk-Anchored Band Row",   muscle: "Back / Rear Delt",     category: "Pull",  defaultReps: 15, tip: "Loop a resistance band around a desk leg, hinge forward slightly, row both handles to waist. Optional — band needed." },
  { id: "bicep-iso",    name: "Isometric Bicep Curl",     muscle: "Biceps",               category: "Pull",  defaultReps: 12, tip: "Press palm up under the desk edge and resist. Hold 3 sec each arm. Real tension, no weights." },

  // ABS / CORE
  { id: "desk-plank",   name: "Standing Desk Plank",      muscle: "Core / Abs",           category: "Abs",   defaultReps: 30, isTimeBased: true, tip: "Hands on the desk at hip height, step feet back, hold body rigid. Same tension as a floor plank." },
  { id: "stand-crunch", name: "Standing Crunch",          muscle: "Upper Abs",            category: "Abs",   defaultReps: 15, tip: "Hands behind head, bring elbow to opposite knee as knee rises. Slow — squeeze the abs at top." },
  { id: "stand-oblique",name: "Standing Oblique Crunch",  muscle: "Obliques",             category: "Abs",   defaultReps: 12, tip: "Hands behind head, crunch same elbow to same knee. Targets the side abs directly." },
  { id: "side-bend",    name: "Standing Side Bend",       muscle: "Obliques",             category: "Abs",   defaultReps: 15, tip: "Slide one hand down your leg toward the knee. Feel the side stretch and resist back up." },
  { id: "dead-bug-s",   name: "Standing Dead Bug",        muscle: "Deep Core",            category: "Abs",   defaultReps: 10, tip: "One arm forward, opposite leg slightly back. Hold 2 sec. Alternating. Braces the deep stabilizers." },
  { id: "anti-rot",     name: "Anti-Rotation Press",      muscle: "Core / Shoulders",     category: "Abs",   defaultReps: 10, tip: "Press palms together at chest. Extend arms forward slowly, hold 3 sec, return. Core resists rotation." },
  { id: "march-stand",  name: "Standing March",           muscle: "Lower Abs / Hip Flexors",category:"Abs",  defaultReps: 20, tip: "Controlled high knees in place. Arms pump opposite to legs. Engages lower abs with every lift." },
  { id: "knee-raise",   name: "Standing Knee Raises",     muscle: "Lower Abs / Hip Flexors",category:"Abs",  defaultReps: 12, tip: "Hold the desk edge for balance. Drive one knee up to waist height, hold 2 sec, lower with control. Alternate legs." },

  // LEGS
  { id: "desk-squat",   name: "Desk-Assisted Squat",      muscle: "Quads / Glutes",       category: "Legs",  defaultReps: 15, tip: "Face the desk, hold the edge lightly for balance. Sit hips back into a squat, drive back up." },
  { id: "calf-raise",   name: "Standing Calf Raises",     muscle: "Calves",               category: "Legs",  defaultReps: 20, tip: "Hold the desk for balance. Rise on toes, lower slowly. Pause at the top for a full contraction." },
  { id: "glute-sq",     name: "Standing Glute Squeeze",   muscle: "Glutes",               category: "Legs",  defaultReps: 15, tip: "Stand tall, squeeze both glutes hard for 2 seconds, release. Focused and deliberate." },
  { id: "side-leg",     name: "Side Leg Raises",          muscle: "Hip Abductors",        category: "Legs",  defaultReps: 12, tip: "Hold the desk. Raise one leg out to side with control. Hip stability and balance." },

  // BALANCE BOARD
  { id: "bb-squat",     name: "Balance Board Squats",     muscle: "Quads / Glutes / Ankles",category: "Balance", defaultReps: 12, tip: "Stand on the board, feet shoulder-width. Squat slowly while keeping the board level. Hold the desk if needed." },
  { id: "bb-calf",      name: "Balance Board Calf Raises",muscle: "Calves / Ankles",       category: "Balance", defaultReps: 15, tip: "Rise onto toes while balancing on the board. Control the wobble, lower slow." },
  { id: "bb-single-leg",name: "Single-Leg Balance Hold",  muscle: "Ankles / Deep Core",    category: "Balance", defaultReps: 30, isTimeBased: true, tip: "Stand on one leg on the board, find stillness, hold. Switch legs for the next set." },
  { id: "bb-tilt",      name: "Balance Board Tilts",      muscle: "Ankles / Stability",    category: "Balance", defaultReps: 15, tip: "Rock the board side-to-side under control. Each full rock is one rep — builds ankle stability." },
];

const DEFAULT_ACTIVE = [
  "desk-pu","desk-dip","chest-iso",
  "desk-row","bicep-iso",
  "desk-plank","stand-crunch","knee-raise",
  "desk-squat","calf-raise",
  "bb-squat","bb-single-leg"
];

const CATEGORY_ORDER = ["Chest","Shoulders","Pull","Abs","Legs","Balance"];
const CATEGORY_COLOR = {
  Chest:     "#c87a5a",
  Shoulders: "#ae8c6a",
  Pull:      "#6a8cae",
  Abs:       "#7c9e6a",
  Legs:      "#9e7a9e",
  Balance:   "#5a9ea8",
};

const BACKUP_VERSION = 2;

// ── STORAGE ──────────────────────────────────────────────────────────────────
const S = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" }).toUpperCase();
}
function todayKey() { return new Date().toDateString(); }

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}
function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

// Exercise IDs renamed when the library was rebuilt around a desk + balance
// board — maps old saved choices forward so they aren't silently dropped.
// Paired with each old id's original default, so an untouched entry (still
// sitting at its old default) doesn't override the new curated default —
// only a genuine user change gets carried forward.
const ID_MIGRATIONS = {
  "wall-pu":      { to: "desk-pu",       oldDefault: { reps: 15, active: true } },
  "wide-wall-pu": { to: "wide-desk-pu",  oldDefault: { reps: 12, active: false } },
  "close-wall-pu":{ to: "close-desk-pu", oldDefault: { reps: 10, active: false } },
  "chair-dip":    { to: "desk-dip",      oldDefault: { reps: 10, active: false } },
  "pike-pu":      { to: "desk-pike-pu",  oldDefault: { reps: 8,  active: false } },
  "door-row":     { to: "desk-row",      oldDefault: { reps: 12, active: true } },
  "band-row":     { to: "band-desk-row", oldDefault: { reps: 15, active: false } },
  "wall-plank":   { to: "desk-plank",    oldDefault: { reps: 30, active: true } },
  "chair-squat":  { to: "desk-squat",    oldDefault: { reps: 15, active: true } },
};

// ── MAIN APP ─────────────────────────────────────────────────────────────────
function SagePT() {
  const [tab, setTab] = useState("today");

  const [config, setConfig] = useState(() => {
    const saved = S.get("spt_config", null) || {};
    Object.entries(ID_MIGRATIONS).forEach(([oldId, { to, oldDefault }]) => {
      const oldVal = saved[oldId];
      if (!oldVal || saved[to]) return;
      const wasChanged = oldVal.active !== oldDefault.active || oldVal.reps !== oldDefault.reps;
      if (wasChanged) saved[to] = oldVal;
    });
    // Merge onto current LIBRARY ids: keeps any saved choice, falls back to
    // the default for ids that are new or were never saved. An id missing
    // from LIBRARY entirely (removed exercise) is simply never looked up.
    const c = {};
    LIBRARY.forEach(ex => {
      c[ex.id] = saved[ex.id] ?? { reps: ex.defaultReps, active: DEFAULT_ACTIVE.includes(ex.id) };
    });
    return c;
  });

  const [checked, setChecked] = useState(() => S.get("spt_checked_" + todayKey(), {}));
  const [log, setLog] = useState(() => S.get("spt_log", []));

  useEffect(() => { S.set("spt_config", config); }, [config]);
  useEffect(() => { S.set("spt_checked_" + todayKey(), checked); }, [checked]);

  const activeExercises = LIBRARY.filter(ex => config[ex.id]?.active);

  // Auto-log today's progress as it happens — no separate "mark complete" step
  // to remember. As soon as anything is checked, today shows up in the Log tab
  // and keeps updating live; unchecking everything removes the (empty) entry.
  useEffect(() => {
    const total = activeExercises.length;
    const done = activeExercises.filter(ex => checked[ex.id]).length;
    setLog(prev => {
      const others = prev.filter(e => e.dateKey !== todayKey());
      if (done === 0) {
        if (others.length === prev.length) return prev; // nothing to remove
        S.set("spt_log", others);
        return others;
      }
      const entry = {
        dateKey: todayKey(),
        dateLabel: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),
        timestamp: Date.now(),
        done, total,
        pct: total ? Math.round((done/total)*100) : 0,
        exercises: activeExercises.map(ex => ({ id: ex.id, name: ex.name, reps: config[ex.id]?.reps ?? ex.defaultReps, done: !!checked[ex.id] }))
      };
      const newLog = [entry, ...others];
      S.set("spt_log", newLog);
      return newLog;
    });
    // eslint-disable-next-line
  }, [checked, config]);

  const streak = (() => {
    let s = 0, d = new Date();
    while (true) {
      const key = d.toDateString();
      if (log.find(e => e.dateKey === key)) { s++; d.setDate(d.getDate()-1); }
      else break;
    }
    return s;
  })();
  const weekCount = log.filter(e => Date.now() - new Date(e.dateKey).getTime() < 7*86400000).length;

  const toggleCheck = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));

  const updateReps = (id, delta) => {
    setConfig(p => ({ ...p, [id]: { ...p[id], reps: Math.max(1, (p[id]?.reps ?? 10) + delta) } }));
  };
  const toggleActive = (id) => {
    setConfig(p => ({ ...p, [id]: { ...p[id], active: !p[id]?.active } }));
  };

  const todayLogged = log.find(e => e.dateKey === todayKey());

  const exportData = () => {
    const payload = { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), config, log };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sage-pt-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.config) { setConfig(data.config); S.set("spt_config", data.config); }
        if (Array.isArray(data.log)) { setLog(data.log); S.set("spt_log", data.log); }
        alert("Backup restored.");
      } catch {
        alert("Couldn't read that file — make sure it's a Sage PT backup JSON.");
      }
    };
    reader.readAsText(file);
  };

  const resetToday = () => {
    if (!confirm("Clear today's checkmarks?")) return;
    setChecked({});
  };

  return html`
    <div style=${styles.root}>
      <div style=${styles.header}>
        <div style=${styles.headerInner}>
          <div>
            <div style=${styles.badge}>SAGE PT · DESK EDITION</div>
            <div style=${styles.h1}>DAILY PT</div>
            <div style=${styles.dateStr}>${todayStr()}</div>
          </div>
          <div style=${styles.statsBlock}>
            <${Stat} label="STREAK" value=${streak} />
            <${Stat} label="THIS WEEK" value=${weekCount} />
          </div>
        </div>
      </div>

      <div style=${styles.tabs}>
        ${[["today","TODAY"],["library","LIBRARY"],["log","LOG"],["more","MORE"]].map(([k,l]) => html`
          <button key=${k} style=${{...styles.tab, ...(tab===k ? styles.tabActive : {})}} onClick=${() => setTab(k)}>${l}</button>
        `)}
      </div>

      <div style=${styles.content}>
        ${tab === "today" && html`<${TodayTab}
          exercises=${activeExercises}
          config=${config}
          checked=${checked}
          onCheck=${toggleCheck}
          todayLogged=${todayLogged}
        />`}
        ${tab === "library" && html`<${LibraryTab} config=${config} onToggleActive=${toggleActive} onUpdateReps=${updateReps} />`}
        ${tab === "log" && html`<${LogTab} log=${log} />`}
        ${tab === "more" && html`<${MoreTab} onExport=${exportData} onImport=${importData} onResetToday=${resetToday} />`}
      </div>
    </div>
  `;
}

// ── TODAY TAB ─────────────────────────────────────────────────────────────────
function TodayTab({ exercises, config, checked, onCheck, todayLogged }) {
  const groups = CATEGORY_ORDER.map(cat => ({
    cat, items: exercises.filter(ex => ex.category === cat)
  })).filter(g => g.items.length > 0);

  const doneCount = exercises.filter(ex => checked[ex.id]).length;
  const pct = exercises.length ? Math.round((doneCount/exercises.length)*100) : 0;

  return html`
    <div>
      <div style=${styles.progressWrap}>
        <div style=${styles.progressBar}>
          <div style=${{...styles.progressFill, width: pct + "%"}} />
        </div>
        <div style=${styles.progressLabel}>
          ${doneCount} / ${exercises.length} · ${pct}% ${todayLogged ? "· saved automatically" : ""}
        </div>
      </div>

      ${exercises.length === 0 && html`<div style=${styles.empty}>No exercises active.<br />Turn some on in the Library tab.</div>`}

      ${groups.map(({ cat, items }) => html`
        <div key=${cat}>
          <div style=${{...styles.phaseLabel, borderColor: CATEGORY_COLOR[cat], color: CATEGORY_COLOR[cat]}}>
            ${cat.toUpperCase()}
          </div>
          ${items.map(ex => {
            const reps = config[ex.id]?.reps ?? ex.defaultReps;
            const done = !!checked[ex.id];
            return html`
              <div key=${ex.id} style=${{...styles.exCard, ...(done ? styles.exCardDone : {}), borderLeftColor: done ? CATEGORY_COLOR[ex.category] : "#333"}}>
                <button style=${{...styles.checkBtn, ...(done ? styles.checkBtnDone : {})}} onClick=${() => onCheck(ex.id)}>
                  ${done ? "✓" : ""}
                </button>
                <div style=${styles.exInfo}>
                  <div style=${{...styles.exName, ...(done ? styles.exNameDone : {})}}>${ex.name}</div>
                  <div style=${styles.exMuscle}>${ex.muscle}</div>
                  <div style=${styles.exTip}>${ex.tip}</div>
                </div>
                <div style=${styles.repBadge}>
                  <div style=${styles.repNum}>${reps}</div>
                  <div style=${styles.repUnit}>${ex.isTimeBased ? "SEC" : "REPS"}</div>
                </div>
              </div>
            `;
          })}
        </div>
      `)}

      <div style=${{height: 40}} />
    </div>
  `;
}

// ── LIBRARY TAB ───────────────────────────────────────────────────────────────
function LibraryTab({ config, onToggleActive, onUpdateReps }) {
  const [filter, setFilter] = useState("All");
  const cats = ["All", ...CATEGORY_ORDER];
  const visible = LIBRARY.filter(ex => filter === "All" || ex.category === filter);

  return html`
    <div>
      <div style=${styles.filterRow}>
        ${cats.map(c => html`
          <button key=${c} style=${{...styles.pill, ...(filter===c ? styles.pillActive : {})}} onClick=${() => setFilter(c)}>
            ${c.toUpperCase()}
          </button>
        `)}
      </div>

      <div style=${styles.infoBox}>
        Toggle exercises on/off for your daily routine. Adjust reps with +/−. Changes save instantly.
      </div>

      ${visible.map(ex => {
        const cfg = config[ex.id] ?? { reps: ex.defaultReps, active: false };
        return html`
          <div key=${ex.id} style=${{...styles.libCard, ...(cfg.active ? styles.libCardActive : {})}}>
            <div style=${styles.libLeft}>
              <div style=${{...styles.catDot, background: CATEGORY_COLOR[ex.category]}} />
              <div>
                <div style=${styles.libName}>${ex.name}</div>
                <div style=${styles.libMuscle}>${ex.muscle} · ${ex.category}</div>
              </div>
            </div>
            <div style=${styles.libRight}>
              <div style=${styles.repControl}>
                <button style=${styles.repBtn} onClick=${() => onUpdateReps(ex.id, -1)}>−</button>
                <div style=${styles.repVal}>${cfg.reps}</div>
                <button style=${styles.repBtn} onClick=${() => onUpdateReps(ex.id, 1)}>+</button>
              </div>
              <button style=${{...styles.toggleBtn, ...(cfg.active ? styles.toggleBtnOn : {})}} onClick=${() => onToggleActive(ex.id)}>
                ${cfg.active ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        `;
      })}
      <div style=${{height: 40}} />
    </div>
  `;
}

// ── LOG TAB ───────────────────────────────────────────────────────────────────
function LogTab({ log }) {
  if (!log.length) return html`<div style=${styles.empty}>No workouts logged yet.<br />Check off an exercise on the Today tab to start today's entry.</div>`;

  return html`
    <div>
      ${log.map((entry, i) => html`
        <div key=${i} style=${styles.logEntry}>
          <div>
            <div style=${styles.logDate}>${entry.dateLabel}</div>
            <div style=${styles.logDetail}>${entry.done} of ${entry.total} exercises</div>
            <div style=${styles.logExList}>${entry.exercises?.filter(e => e.done).map(e => e.name).join(" · ")}</div>
          </div>
          <div style=${styles.logPct}>${entry.pct}%</div>
        </div>
      `)}
      <div style=${{height: 40}} />
    </div>
  `;
}

// ── MORE TAB ──────────────────────────────────────────────────────────────────
function MoreTab({ onExport, onImport, onResetToday }) {
  const [showInstall] = useState(!isStandalone() && isIOS());
  const [fileInput, setFileInput] = useState(null);

  return html`
    <div style=${{paddingTop: 20}}>
      ${showInstall && html`
        <div style=${styles.infoBox}>
          <strong style=${{color:"#c8b89a"}}>Add to Home Screen:</strong> tap the Share icon in Safari, then "Add to Home Screen". Sage PT will open full-screen like a native app.
        </div>
      `}

      <div style=${{...styles.phaseLabel, borderColor:"#6a7a5a", color:"#6a7a5a"}}>DATA</div>
      <div style=${styles.libCard}>
        <div style=${{flex:1}}>
          <div style=${styles.libName}>Backup your data</div>
          <div style=${styles.libMuscle}>Download your log & settings as a JSON file</div>
        </div>
        <button style=${{...styles.toggleBtn, ...styles.toggleBtnOn, minWidth: 70}} onClick=${onExport}>EXPORT</button>
      </div>
      <div style=${styles.libCard}>
        <div style=${{flex:1}}>
          <div style=${styles.libName}>Restore backup</div>
          <div style=${styles.libMuscle}>Load a previously exported JSON file</div>
        </div>
        <button style=${{...styles.toggleBtn, minWidth: 70}} onClick=${() => fileInput?.click()}>IMPORT</button>
        <input ref=${setFileInput} type="file" accept="application/json" style=${{display:"none"}}
          onChange=${(e) => { if (e.target.files[0]) onImport(e.target.files[0]); e.target.value = ""; }} />
      </div>

      <div style=${{...styles.phaseLabel, borderColor:"#c05a5a", color:"#c05a5a", marginTop: 24}}>DANGER ZONE</div>
      <div style=${styles.libCard}>
        <div style=${{flex:1}}>
          <div style=${styles.libName}>Reset today's checkmarks</div>
          <div style=${styles.libMuscle}>Doesn't affect past log entries</div>
        </div>
        <button style=${{...styles.toggleBtn, borderColor:"#3a2020", color:"#c05a5a", minWidth: 70}} onClick=${onResetToday}>RESET</button>
      </div>

      <div style=${{height: 40}} />
    </div>
  `;
}

// ── STAT BLOCK ────────────────────────────────────────────────────────────────
function Stat({ label, value }) {
  return html`
    <div style=${styles.stat}>
      <div style=${styles.statNum}>${value}</div>
      <div style=${styles.statLabel}>${label}</div>
    </div>
  `;
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = {
  root: { background:"#0f1109", minHeight:"100vh", color:"#e8dcc8", fontFamily:"system-ui, -apple-system, sans-serif", maxWidth: 480, margin:"0 auto" },

  header: { background:"linear-gradient(135deg,#2d3424 0%,#1a1c18 100%)", borderBottom:"2px solid #4a5240", padding:"20px 20px 16px" },
  headerInner: { display:"flex", justifyContent:"space-between", alignItems:"flex-start" },
  badge: { fontSize:10, letterSpacing:"0.2em", color:"#6a7a5a", textTransform:"uppercase", marginBottom:4 },
  h1: { fontSize:"2.4rem", fontWeight:800, letterSpacing:"0.06em", color:"#e8dcc8", lineHeight:1 },
  dateStr: { fontSize:10, color:"#6a7a5a", letterSpacing:"0.12em", marginTop:4 },
  statsBlock: { display:"flex", gap:16, alignItems:"flex-start" },
  stat: { textAlign:"right" },
  statNum: { fontSize:"1.8rem", fontWeight:800, color:"#8fa068", lineHeight:1 },
  statLabel: { fontSize:9, letterSpacing:"0.15em", color:"#6a7a5a", textTransform:"uppercase" },

  tabs: { display:"flex", background:"#0a0c07", borderBottom:"1px solid #2a2a20" },
  tab: { flex:1, padding:"12px 4px", background:"transparent", border:"none", borderBottom:"2px solid transparent", color:"#555", fontSize:11, letterSpacing:"0.12em", cursor:"pointer", fontWeight:600 },
  tabActive: { color:"#c8b89a", borderBottomColor:"#c8b89a", background:"#0f1109" },

  content: { padding:"0 16px" },

  progressWrap: { padding:"14px 0 4px" },
  progressBar: { height:4, background:"#2a2a20", borderRadius:2, overflow:"hidden" },
  progressFill: { height:"100%", background:"#8fa068", transition:"width 0.3s ease", borderRadius:2 },
  progressLabel: { fontSize:11, color:"#6a7a5a", letterSpacing:"0.1em", marginTop:6, textAlign:"right" },

  phaseLabel: { fontSize:11, fontWeight:700, letterSpacing:"0.2em", borderLeft:"3px solid", paddingLeft:8, margin:"18px 0 10px", textTransform:"uppercase" },

  exCard: { background:"#161810", border:"1px solid #2a2a20", borderLeft:"4px solid #333", borderRadius:2, marginBottom:8, padding:"12px 12px 12px 10px", display:"flex", alignItems:"flex-start", gap:10, transition:"opacity 0.2s" },
  exCardDone: { opacity:0.55 },
  checkBtn: { width:28, height:28, minWidth:28, border:"2px solid #444", background:"transparent", borderRadius:2, color:"#8fa068", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", marginTop:2 },
  checkBtnDone: { background:"#8fa068", borderColor:"#8fa068", color:"#0f1109" },
  exInfo: { flex:1 },
  exName: { fontSize:15, fontWeight:600, color:"#e8dcc8", marginBottom:2 },
  exNameDone: { textDecoration:"line-through", color:"#555" },
  exMuscle: { fontSize:10, color:"#6a7a5a", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 },
  exTip: { fontSize:11, color:"#7a8070", lineHeight:1.5 },
  repBadge: { textAlign:"center", minWidth:36 },
  repNum: { fontSize:"1.4rem", fontWeight:800, color:"#c8b89a", lineHeight:1 },
  repUnit: { fontSize:8, color:"#555", letterSpacing:"0.12em" },

  filterRow: { display:"flex", gap:6, padding:"14px 0 10px", flexWrap:"wrap" },
  pill: { padding:"5px 10px", background:"#1a1c18", border:"1px solid #333", color:"#666", fontSize:10, letterSpacing:"0.12em", cursor:"pointer", borderRadius:2 },
  pillActive: { background:"#4a5240", borderColor:"#4a5240", color:"#e8dcc8" },

  libCard: { background:"#161810", border:"1px solid #222", borderRadius:2, marginBottom:8, padding:"12px", display:"flex", justifyContent:"space-between", alignItems:"center", opacity:0.6, gap: 10 },
  libCardActive: { opacity:1, borderColor:"#3a4a30" },
  libLeft: { display:"flex", alignItems:"center", gap:10, flex:1 },
  catDot: { width:8, height:8, borderRadius:"50%", flexShrink:0 },
  libName: { fontSize:13, fontWeight:600, color:"#e8dcc8", marginBottom:2 },
  libMuscle: { fontSize:10, color:"#6a7a5a", letterSpacing:"0.08em" },
  libRight: { display:"flex", alignItems:"center", gap:10 },
  repControl: { display:"flex", alignItems:"center", gap:6 },
  repBtn: { width:24, height:24, background:"#2a2a20", border:"none", color:"#c8b89a", fontSize:14, cursor:"pointer", borderRadius:2, display:"flex", alignItems:"center", justifyContent:"center" },
  repVal: { fontSize:"1.1rem", fontWeight:700, color:"#c8b89a", minWidth:28, textAlign:"center" },
  toggleBtn: { padding:"5px 10px", background:"#2a2020", border:"1px solid #3a2020", color:"#555", fontSize:10, fontWeight:700, letterSpacing:"0.12em", cursor:"pointer", borderRadius:2, minWidth:40 },
  toggleBtnOn: { background:"#2a3a20", borderColor:"#4a6a30", color:"#8fa068" },

  logEntry: { background:"#161810", border:"1px solid #222", borderLeft:"3px solid #4a5240", borderRadius:2, padding:"12px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"flex-start" },
  logDate: { fontSize:14, fontWeight:700, color:"#c8b89a", marginBottom:2 },
  logDetail: { fontSize:11, color:"#6a7a5a", marginBottom:4 },
  logExList: { fontSize:10, color:"#4a5a40", lineHeight:1.5 },
  logPct: { fontSize:"1.6rem", fontWeight:800, color:"#8fa068" },

  infoBox: { background:"#131510", border:"1px solid #2a2a20", borderRadius:2, padding:"12px 14px", marginBottom:14, fontSize:12, color:"#7a8070", lineHeight:1.6 },
  empty: { textAlign:"center", padding:"60px 20px", color:"#444", fontSize:13, lineHeight:2 },
};

render(html`<${SagePT} />`, document.getElementById("root"));
