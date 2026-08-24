// Sage PT — zero-build PWA. Preact + htm loaded straight from a CDN (esm.sh),
// no bundler/npm required. Service worker (sw.js) caches these CDN modules
// on first load so the app keeps working offline after that.
import { h, render } from "https://esm.sh/preact@10.24.3";
import { useState, useEffect } from "https://esm.sh/preact@10.24.3/hooks";
import htm from "https://esm.sh/htm@3.1.1";

const html = htm.bind(h);

// ── DESK LIBRARY ──────────────────────────────────────────────────────────────
// Built around a standing desk (in place of a wall) + a small balance board.
const DESK_LIBRARY = [
  // CHEST / PUSH — desk edge in place of a wall
  { id: "desk-pu",       name: "Desk Push-Ups",            muscle: "Chest / Shoulders",    category: "Chest", defaultReps: 15, tip: "Hands shoulder-width on the desk edge, step feet back. Control the descent." },
  { id: "wide-desk-pu",  name: "Wide-Grip Desk Push-Ups",  muscle: "Outer Chest",           category: "Chest", defaultReps: 12, tip: "Hands wider than shoulders on the desk edge. Targets the outer chest more directly." },
  { id: "close-desk-pu", name: "Close-Grip Desk Push-Ups", muscle: "Inner Chest / Triceps", category: "Chest", defaultReps: 10, tip: "Hands close together on the desk, thumbs nearly touching. Hits the inner chest and triceps hard." },
  { id: "desk-dip",      name: "Desk Edge Dips",           muscle: "Chest / Triceps",       category: "Chest", defaultReps: 10, tip: "Hands on the desk edge behind you, feet forward. Lower slowly until elbows hit 90°, push back up." },
  { id: "desk-pu-neg",   name: "Negative Desk Push-Ups",   muscle: "Chest / Triceps",       category: "Chest", defaultReps: 8,  tip: "Lower yourself as slowly as possible (4–5 count), push back up at normal speed. The slow negative is where it grows." },
  { id: "chest-iso",     name: "Isometric Chest Press",    muscle: "Chest",                 category: "Chest", defaultReps: 10, tip: "Press palms together hard at chest height. Hold 5 sec, release. Pure chest contraction — no equipment." },
  { id: "chest-open",    name: "Standing Chest Fly",       muscle: "Chest / Anterior Delt", category: "Chest", defaultReps: 12, tip: "Arms wide, palms forward. Slowly bring hands together in front of chest like hugging a barrel. Slow return." },

  // SHOULDERS
  { id: "shoulder-p",   name: "Standing Shoulder Press",  muscle: "Shoulders",            category: "Shoulders", defaultReps: 12, tip: "Clasp hands overhead and press against your own resistance. Or use a light filled bag." },
  { id: "lateral-r",    name: "Lateral Raise (No Weight)",muscle: "Side Delts",           category: "Shoulders", defaultReps: 12, tip: "Arms straight, raise to shoulder height, lower slow. Add a bag for resistance. Slow wins here." },
  { id: "desk-pike-pu", name: "Desk Pike Push-Ups",       muscle: "Shoulders / Triceps",  category: "Shoulders", defaultReps: 8,  tip: "Hands on the desk edge, walk feet back so hips are high. Lower your head toward the desk. Serious shoulder builder." },
  { id: "front-raise",  name: "Front Raise (No Weight)",  muscle: "Front Delts",          category: "Shoulders", defaultReps: 12, tip: "Arms straight, raise forward to shoulder height. Squeeze at top. Hold a bag to add load." },
  { id: "rear-delt",    name: "Rear Delt Squeeze",        muscle: "Rear Delts / Upper Back",category:"Shoulders",defaultReps: 15, tip: "Arms out to sides, bent slightly. Pull elbows back, squeeze shoulder blades. Hold 2 sec." },
  { id: "desk-y-raise", name: "Desk Y-Raises",            muscle: "Rear Delts / Traps",   category: "Shoulders", defaultReps: 12, tip: "Hinge forward slightly, raise arms up and out into a Y shape, squeeze shoulder blades. Add a light bag for resistance." },

  // BACK / PULL — desk-anchored instead of a doorframe
  { id: "desk-row",     name: "Under-Desk Isometric Row", muscle: "Back / Biceps",        category: "Pull",  defaultReps: 10, tip: "Grip the underside of the desk with both hands, pull up hard like you're trying to lift it. Hold 3–5 sec, release." },
  { id: "band-desk-row",name: "Desk-Anchored Band Row",   muscle: "Back / Rear Delt",     category: "Pull",  defaultReps: 15, tip: "Loop a resistance band around a desk leg, hinge forward slightly, row both handles to waist. Optional — band needed." },
  { id: "bicep-iso",    name: "Isometric Bicep Curl",     muscle: "Biceps",               category: "Pull",  defaultReps: 12, tip: "Press palm up under the desk edge and resist. Hold 3 sec each arm. Real tension, no weights." },

  // ABS / CORE
  { id: "desk-plank",   name: "Standing Desk Plank",      muscle: "Core / Abs",           category: "Abs",   defaultReps: 30, unit: "sec", tip: "Hands on the desk at hip height, step feet back, hold body rigid. Same tension as a floor plank." },
  { id: "stand-crunch", name: "Standing Crunch",          muscle: "Upper Abs",            category: "Abs",   defaultReps: 15, tip: "Hands behind head, bring elbow to opposite knee as knee rises. Slow — squeeze the abs at top." },
  { id: "stand-oblique",name: "Standing Oblique Crunch",  muscle: "Obliques",             category: "Abs",   defaultReps: 12, tip: "Hands behind head, crunch same elbow to same knee. Targets the side abs directly." },
  { id: "side-bend",    name: "Standing Side Bend",       muscle: "Obliques",             category: "Abs",   defaultReps: 15, tip: "Slide one hand down your leg toward the knee. Feel the side stretch and resist back up." },
  { id: "dead-bug-s",   name: "Standing Dead Bug",        muscle: "Deep Core",            category: "Abs",   defaultReps: 10, tip: "One arm forward, opposite leg slightly back. Hold 2 sec. Alternating. Braces the deep stabilizers." },
  { id: "anti-rot",     name: "Anti-Rotation Press",      muscle: "Core / Shoulders",     category: "Abs",   defaultReps: 10, tip: "Press palms together at chest. Extend arms forward slowly, hold 3 sec, return. Core resists rotation." },
  { id: "march-stand",  name: "Standing March",           muscle: "Lower Abs / Hip Flexors",category:"Abs",  defaultReps: 20, tip: "Controlled high knees in place. Arms pump opposite to legs. Engages lower abs with every lift." },
  { id: "knee-raise",   name: "Standing Knee Raises",     muscle: "Lower Abs / Hip Flexors",category:"Abs",  defaultReps: 12, tip: "Hold the desk edge for balance. Drive one knee up to waist height, hold 2 sec, lower with control. Alternate legs." },
  { id: "suitcase-hold",name: "Suitcase Carry Hold",      muscle: "Obliques / Core / Grip",category:"Abs",  defaultReps: 20, unit: "sec", tip: "Hold a weighted bag at your side, stand tall without leaning. Switch sides. Resisting the lean is the whole exercise." },

  // LEGS
  { id: "desk-squat",   name: "Desk-Assisted Squat",      muscle: "Quads / Glutes",       category: "Legs",  defaultReps: 15, tip: "Face the desk, hold the edge lightly for balance. Sit hips back into a squat, drive back up." },
  { id: "calf-raise",   name: "Standing Calf Raises",     muscle: "Calves",               category: "Legs",  defaultReps: 20, tip: "Hold the desk for balance. Rise on toes, lower slowly. Pause at the top for a full contraction." },
  { id: "glute-sq",     name: "Standing Glute Squeeze",   muscle: "Glutes",               category: "Legs",  defaultReps: 15, tip: "Stand tall, squeeze both glutes hard for 2 seconds, release. Focused and deliberate." },
  { id: "side-leg",     name: "Side Leg Raises",          muscle: "Hip Abductors",        category: "Legs",  defaultReps: 12, tip: "Hold the desk. Raise one leg out to side with control. Hip stability and balance." },
  { id: "reverse-lunge",name: "Reverse Lunges",           muscle: "Quads / Glutes",       category: "Legs",  defaultReps: 12, tip: "Hold the desk lightly for balance. Step one leg back into a lunge, drive through the front heel to return. Alternate legs." },
  { id: "single-leg-dl",name: "Single-Leg Desk Deadlift", muscle: "Hamstrings / Glutes",  category: "Legs",  defaultReps: 10, tip: "Hold the desk with one hand for balance. Hinge at the hips, extend the free leg back, keep your back flat. Slow and controlled." },

  // BALANCE BOARD
  { id: "bb-squat",     name: "Balance Board Squats",     muscle: "Quads / Glutes / Ankles",category: "Balance", defaultReps: 12, tip: "Stand on the board, feet shoulder-width. Squat slowly while keeping the board level. Hold the desk if needed." },
  { id: "bb-calf",      name: "Balance Board Calf Raises",muscle: "Calves / Ankles",       category: "Balance", defaultReps: 15, tip: "Rise onto toes while balancing on the board. Control the wobble, lower slow." },
  { id: "bb-single-leg",name: "Single-Leg Balance Hold",  muscle: "Ankles / Deep Core",    category: "Balance", defaultReps: 30, unit: "sec", tip: "Stand on one leg on the board, find stillness, hold. Switch legs for the next set." },
  { id: "bb-tilt",      name: "Balance Board Tilts",      muscle: "Ankles / Stability",    category: "Balance", defaultReps: 15, tip: "Rock the board side-to-side under control. Each full rock is one rep — builds ankle stability." },
];

const DESK_DEFAULT_ACTIVE = [
  "desk-pu","desk-dip","chest-iso",
  "desk-row","bicep-iso",
  "desk-plank","stand-crunch","knee-raise",
  "desk-squat","calf-raise",
  "bb-squat","bb-single-leg"
];

const DESK_CATEGORY_ORDER = ["Chest","Shoulders","Pull","Abs","Legs","Balance"];

// ── GYM LIBRARY ───────────────────────────────────────────────────────────────
// Standard Planet Fitness machine circuit. Warm up with a mile on the treadmill
// (or the bike/elliptical). Exact machine names/layout vary by location — swap
// in whatever's equivalent.
// Every strength machine carries Sets + Reps + Weight (weight adjustable per
// exercise in the Library, starting from defaultWeight below). Two kinds of
// exception, both deliberate: `cardio: true` items (treadmill/bike/elliptical)
// keep the simpler distance-or-duration display — sets/weight don't apply to
// a warmup. `hasWeight: false` (currently just Captain's Chair) marks a
// bodyweight-only apparatus with no weight stack to adjust.
const GYM_LIBRARY = [
  // WARM-UP
  { id: "gym-treadmill", name: "Treadmill Warm-Up",         muscle: "Cardio / Warm-Up",  category: "Warmup", defaultReps: 1, unit: "mile", cardio: true, tip: "Moderate pace, slight incline (1–2%). Gets blood flowing before lifting — don't skip it." },
  { id: "gym-bike",      name: "Stationary Bike Warm-Up",   muscle: "Cardio / Warm-Up",  category: "Warmup", defaultReps: 10, unit: "min", cardio: true, tip: "Easy-moderate resistance, steady cadence. A lower-impact alternative to the treadmill." },
  { id: "gym-elliptical",name: "Elliptical Warm-Up",        muscle: "Cardio / Warm-Up",  category: "Warmup", defaultReps: 10, unit: "min", cardio: true, tip: "Full-body, joint-friendly warm-up. Use the arm handles too, not just the legs." },

  // CHEST
  { id: "gym-chest-press", name: "Chest Press Machine",     muscle: "Chest / Triceps",   category: "Chest", defaultReps: 12, defaultSets: 3, hasWeight: true, defaultWeight: 50, tip: "Adjust seat so handles line up with mid-chest. Press out fully, control the return." },
  { id: "gym-pec-deck",    name: "Pec Deck / Chest Fly Machine", muscle: "Chest",        category: "Chest", defaultReps: 12, defaultSets: 3, hasWeight: true, defaultWeight: 40, tip: "Elbows slightly bent, squeeze pads together in front of chest. Slow negative." },
  { id: "gym-smith-bench", name: "Smith Machine Bench Press", muscle: "Chest / Triceps", category: "Chest", defaultReps: 10, defaultSets: 3, hasWeight: true, defaultWeight: 45, tip: "Bar path is fixed — focus on driving through the chest. Start light to learn the groove." },
  { id: "gym-cable-fly",   name: "Cable Chest Fly",         muscle: "Chest",             category: "Chest", defaultReps: 12, defaultSets: 3, hasWeight: true, defaultWeight: 25, tip: "Cables set at chest height on the functional trainer. Sweep hands together in front of you, squeeze, slow return." },

  // BACK
  { id: "gym-lat-pulldown", name: "Lat Pulldown Machine",   muscle: "Lats / Biceps",     category: "Back", defaultReps: 15, defaultSets: 3, hasWeight: true, defaultWeight: 80, tip: "Wide grip, pull the bar to your upper chest, squeeze shoulder blades down and back." },
  { id: "gym-seated-row",   name: "Seated Row Machine",     muscle: "Back / Biceps",     category: "Back", defaultReps: 12, defaultSets: 3, hasWeight: true, defaultWeight: 50, tip: "Chest against the pad, pull handles to torso, squeeze shoulder blades together." },
  { id: "gym-assisted-pu",  name: "Assisted Pull-Up Machine", muscle: "Back / Biceps",   category: "Back", defaultReps: 8,  defaultSets: 3, hasWeight: true, defaultWeight: 60, tip: "Set assistance so the last rep or two is genuinely hard. Full hang to chin-over-bar." },
  { id: "gym-back-ext",     name: "Back Extension",        muscle: "Lower Back / Glutes",category: "Back", defaultReps: 20, defaultSets: 3, hasWeight: true, defaultWeight: 30, tip: "Hips hinge over the pad, lower under control, extend back up to neutral — don't hyperextend at the top. Add weight across your chest if the machine has a plate holder." },

  // SHOULDERS
  { id: "gym-shoulder-press", name: "Shoulder Press Machine", muscle: "Shoulders / Triceps", category: "Shoulders", defaultReps: 10, defaultSets: 2, hasWeight: true, defaultWeight: 30, tip: "Handles start at shoulder height, press straight up without arching the back." },
  { id: "gym-rear-delt",      name: "Rear Delt / Reverse Fly Machine", muscle: "Rear Delts / Upper Back", category: "Shoulders", defaultReps: 15, defaultSets: 3, hasWeight: true, defaultWeight: 20, tip: "Face into the pad, sweep arms out and back. Light weight, high control." },
  { id: "gym-cable-lateral",  name: "Cable Lateral Raise",  muscle: "Side Delts",        category: "Shoulders", defaultReps: 12, defaultSets: 3, hasWeight: true, defaultWeight: 10, tip: "Cable at the lowest pin, raise your arm out to the side to shoulder height. Slow on the way down." },

  // LEGS
  { id: "gym-leg-press",     name: "Leg Press Machine",     muscle: "Quads / Glutes",    category: "Legs", defaultReps: 12, defaultSets: 3, hasWeight: true, defaultWeight: 90, tip: "Feet shoulder-width on the platform. Don't lock your knees out at the top." },
  { id: "gym-smith-squat",   name: "Smith Machine Squat",   muscle: "Quads / Glutes",    category: "Legs", defaultReps: 10, defaultSets: 3, hasWeight: true, defaultWeight: 45, tip: "Bar on your upper back, feet shoulder-width. Fixed bar path — focus on depth and control." },
  { id: "gym-leg-extension", name: "Leg Extension Machine", muscle: "Quads",             category: "Legs", defaultReps: 12, defaultSets: 3, hasWeight: true, defaultWeight: 40, tip: "Pad rests just above the ankle. Extend fully, pause, lower slow." },
  { id: "gym-leg-curl",      name: "Leg Curl Machine",      muscle: "Hamstrings",        category: "Legs", defaultReps: 12, defaultSets: 3, hasWeight: true, defaultWeight: 40, tip: "Curl heels toward glutes, squeeze, lower with control — don't let the weight drop." },
  { id: "gym-hip-abductor",  name: "Hip Abductor Machine",  muscle: "Hip Abductors / Glutes", category: "Legs", defaultReps: 15, defaultSets: 3, hasWeight: true, defaultWeight: 40, tip: "Push your knees outward against the pads. Controlled squeeze at the widest point." },
  { id: "gym-hip-adductor",  name: "Hip Adductor Machine",  muscle: "Inner Thigh",       category: "Legs", defaultReps: 15, defaultSets: 3, hasWeight: true, defaultWeight: 40, tip: "Pull your knees inward against the pads. Controlled squeeze, slow release — same machine as the abductor, opposite direction." },
  { id: "gym-multi-hip",     name: "Multi-Hip / Glute Kickback Machine", muscle: "Glutes", category: "Legs", defaultReps: 12, defaultSets: 3, hasWeight: true, defaultWeight: 30, tip: "Strap in, drive one leg back and up against the pad, squeeze the glute at the top, control the return." },
  { id: "gym-calf-machine",  name: "Seated Calf Raise Machine", muscle: "Calves",        category: "Legs", defaultReps: 15, defaultSets: 3, hasWeight: true, defaultWeight: 60, tip: "Full stretch at the bottom, rise onto toes, pause at the top." },

  // ARMS
  { id: "gym-bicep-curl",    name: "Cable Bicep Curl",      muscle: "Biceps",            category: "Arms", defaultReps: 12, defaultSets: 3, hasWeight: true, defaultWeight: 20, tip: "Elbows pinned to your sides, curl the bar up, squeeze, lower slow." },
  { id: "gym-preacher-curl", name: "Preacher Curl Machine", muscle: "Biceps",            category: "Arms", defaultReps: 12, defaultSets: 3, hasWeight: true, defaultWeight: 25, tip: "Arms rest on the pad, curl up without letting your elbows lift off. Isolates the bicep hard." },
  { id: "gym-tricep-push",   name: "Tricep Pushdown",       muscle: "Triceps",           category: "Arms", defaultReps: 12, defaultSets: 3, hasWeight: true, defaultWeight: 25, tip: "Elbows pinned to your sides, push the bar down to full extension, control the return." },

  // ABS
  { id: "gym-ab-crunch",     name: "Ab Crunch Machine",     muscle: "Abs",               category: "Abs", defaultReps: 15, defaultSets: 3, hasWeight: true, defaultWeight: 30, tip: "Curl down and forward, exhale on the crunch, don't yank with your arms." },
  { id: "gym-torso-rotation",name: "Torso Rotation Machine",muscle: "Obliques",          category: "Abs", defaultReps: 12, defaultSets: 3, hasWeight: true, defaultWeight: 20, tip: "Rotate under control through a comfortable range — don't force the twist." },
  { id: "gym-captains-chair",name: "Captain's Chair Knee Raises", muscle: "Lower Abs / Hip Flexors", category: "Abs", defaultReps: 12, defaultSets: 3, hasWeight: false, tip: "Forearms on the pads, back against the support. Raise knees to hip height, lower with control — no swinging." },
];

const GYM_DEFAULT_ACTIVE = [
  "gym-treadmill",
  "gym-chest-press","gym-lat-pulldown","gym-shoulder-press","gym-back-ext",
  "gym-leg-press","gym-leg-extension","gym-leg-curl","gym-calf-machine",
  "gym-bicep-curl","gym-tricep-push",
  "gym-ab-crunch","gym-seated-row"
];

const GYM_CATEGORY_ORDER = ["Warmup","Chest","Back","Shoulders","Legs","Arms","Abs"];

// ── COMBINED ──────────────────────────────────────────────────────────────────
const LIBRARY = [
  ...DESK_LIBRARY.map(ex => ({ ...ex, section: "desk" })),
  ...GYM_LIBRARY.map(ex => ({ ...ex, section: "gym" })),
];
const DEFAULT_ACTIVE = [...DESK_DEFAULT_ACTIVE, ...GYM_DEFAULT_ACTIVE];

const SECTIONS = {
  desk: { label: "Desk", categoryOrder: DESK_CATEGORY_ORDER },
  gym:  { label: "Gym",  categoryOrder: GYM_CATEGORY_ORDER },
};

const CATEGORY_COLOR = {
  Chest:     "#c87a5a",
  Shoulders: "#ae8c6a",
  Pull:      "#6a8cae",
  Back:      "#6a8cae",
  Abs:       "#7c9e6a",
  Legs:      "#9e7a9e",
  Balance:   "#5a9ea8",
  Arms:      "#c8a45a",
  Warmup:    "#8a8a7a",
};

const BACKUP_VERSION = 4;

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

// Log entries created before the Desk/Gym split have no `section` field.
// Without a fallback, rendering them (SECTIONS[undefined]?.label || undefined)
// throws when .toUpperCase() hits that undefined — which is what froze the
// Log tab. Treat anything unsectioned as "desk", since that's all there was.
function normalizeLog(arr) {
  return (Array.isArray(arr) ? arr : []).map(e => e.section ? e : { ...e, section: "desk" });
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

// One-time explicit value updates from the Aug 21, 2026 change request — only
// applied if the saved value still matches the OLD default (hasn't been
// manually customized since), same guard as the ID migrations above.
const VALUE_MIGRATIONS = [
  { id: "gym-shoulder-press", field: "reps", oldDefault: 12, newDefault: 10 },
  { id: "gym-lat-pulldown",   field: "reps", oldDefault: 12, newDefault: 15 },
];

// ── MAIN APP ─────────────────────────────────────────────────────────────────
function SagePT() {
  const [tab, setTab] = useState("desk");

  const [config, setConfig] = useState(() => {
    const saved = S.get("spt_config", null) || {};
    Object.entries(ID_MIGRATIONS).forEach(([oldId, { to, oldDefault }]) => {
      const oldVal = saved[oldId];
      if (!oldVal || saved[to]) return;
      const wasChanged = oldVal.active !== oldDefault.active || oldVal.reps !== oldDefault.reps;
      if (wasChanged) saved[to] = oldVal;
    });
    VALUE_MIGRATIONS.forEach(({ id, field, oldDefault, newDefault }) => {
      const s = saved[id];
      if (s && s[field] === oldDefault) s[field] = newDefault;
    });
    // Merge per-field onto current LIBRARY ids: keeps any saved choice for a
    // field that already exists, backfills defaults for fields that are new
    // (sets/weight on an exercise saved before this update) or never saved.
    // An id missing from LIBRARY entirely (removed exercise) is never looked up.
    const c = {};
    LIBRARY.forEach(ex => {
      const s = saved[ex.id] || {};
      const entry = {
        reps: s.reps ?? ex.defaultReps,
        active: s.active ?? DEFAULT_ACTIVE.includes(ex.id),
      };
      if (ex.defaultSets != null) entry.sets = s.sets ?? ex.defaultSets;
      if (ex.hasWeight) entry.weight = s.weight ?? ex.defaultWeight;
      c[ex.id] = entry;
    });
    return c;
  });

  const [checked, setChecked] = useState(() => ({
    desk: S.get("spt_checked_desk_" + todayKey(), {}),
    gym: S.get("spt_checked_gym_" + todayKey(), {}),
  }));
  const [log, setLog] = useState(() => normalizeLog(S.get("spt_log", [])));
  const [changeLog, setChangeLog] = useState(() => S.get("spt_changelog", []));

  useEffect(() => { S.set("spt_config", config); }, [config]);
  useEffect(() => { S.set("spt_checked_desk_" + todayKey(), checked.desk); }, [checked.desk]);
  useEffect(() => { S.set("spt_checked_gym_" + todayKey(), checked.gym); }, [checked.gym]);

  const activeFor = (section) => LIBRARY.filter(ex => ex.section === section && config[ex.id]?.active);

  // Auto-log today's progress per section as it happens — no separate "mark
  // complete" step to remember. As soon as anything is checked, today shows
  // up in the Log tab and keeps updating live; unchecking everything in a
  // section removes that section's (empty) entry for today.
  const autoLog = (section, sectionChecked) => {
    const active = activeFor(section);
    const total = active.length;
    const done = active.filter(ex => sectionChecked[ex.id]).length;
    setLog(prev => {
      const others = prev.filter(e => !(e.dateKey === todayKey() && e.section === section));
      if (done === 0) {
        if (others.length === prev.length) return prev; // nothing to remove
        S.set("spt_log", others);
        return others;
      }
      const entry = {
        dateKey: todayKey(),
        section,
        dateLabel: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),
        timestamp: Date.now(),
        done, total,
        pct: total ? Math.round((done/total)*100) : 0,
        exercises: active.map(ex => ({ id: ex.id, name: ex.name, reps: config[ex.id]?.reps ?? ex.defaultReps, done: !!sectionChecked[ex.id] }))
      };
      const newLog = [entry, ...others];
      S.set("spt_log", newLog);
      return newLog;
    });
  };

  useEffect(() => { autoLog("desk", checked.desk); }, [checked.desk, config]);
  useEffect(() => { autoLog("gym", checked.gym); }, [checked.gym, config]);

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

  const toggleCheck = (section, id) => setChecked(p => ({ ...p, [section]: { ...p[section], [id]: !p[section][id] } }));

  const FIELD_LABEL = { reps: "reps", sets: "sets", weight: "weight" };
  const fmtFieldValue = (field, v) => field === "weight" ? `${v}#` : `${v}`;

  // Every Sets/Reps/Weight edit made in the Library gets a progression-history
  // entry — that's the whole point of tracking them (Aug 21, 2026 request).
  const logFieldChange = (id, field, from, to) => {
    const ex = LIBRARY.find(e => e.id === id);
    if (!ex) return;
    const entry = {
      id, field, from, to,
      summary: `${ex.name}: ${FIELD_LABEL[field]} ${fmtFieldValue(field, from)} → ${fmtFieldValue(field, to)}`,
      timestamp: Date.now(),
      dateLabel: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),
    };
    setChangeLog(prev => {
      const next = [entry, ...prev];
      S.set("spt_changelog", next);
      return next;
    });
  };

  const updateField = (id, field, delta, min) => {
    const cur = config[id]?.[field] ?? 0;
    const next = Math.max(min, cur + delta);
    if (next === cur) return;
    setConfig(p => ({ ...p, [id]: { ...p[id], [field]: next } }));
    logFieldChange(id, field, cur, next);
  };
  const toggleActive = (id) => {
    setConfig(p => ({ ...p, [id]: { ...p[id], active: !p[id]?.active } }));
  };

  const exportData = () => {
    const payload = { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), config, log, changeLog };
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
        if (Array.isArray(data.log)) { const normalized = normalizeLog(data.log); setLog(normalized); S.set("spt_log", normalized); }
        if (Array.isArray(data.changeLog)) { setChangeLog(data.changeLog); S.set("spt_changelog", data.changeLog); }
        alert("Backup restored.");
      } catch {
        alert("Couldn't read that file — make sure it's a Sage PT backup JSON.");
      }
    };
    reader.readAsText(file);
  };

  const resetToday = (section) => {
    if (!confirm(`Clear today's ${SECTIONS[section].label} checkmarks?`)) return;
    setChecked(p => ({ ...p, [section]: {} }));
  };

  return html`
    <div style=${styles.root}>
      <div style=${styles.header}>
        <div style=${styles.headerInner}>
          <div>
            <div style=${styles.badge}>SAGE PT</div>
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
        ${[["desk","DESK"],["gym","GYM"],["grades","GRADES"],["library","LIBRARY"],["log","LOG"],["more","MORE"]].map(([k,l]) => html`
          <button key=${k} style=${{...styles.tab, ...(tab===k ? styles.tabActive : {})}} onClick=${() => setTab(k)}>${l}</button>
        `)}
      </div>

      <div style=${styles.content}>
        ${(tab === "desk" || tab === "gym") && html`<${SectionTab}
          section=${tab}
          exercises=${activeFor(tab)}
          config=${config}
          checked=${checked[tab]}
          onCheck=${(id) => toggleCheck(tab, id)}
          todayLogged=${log.find(e => e.dateKey === todayKey() && e.section === tab)}
        />`}
        ${tab === "grades" && html`<${GradesTab} />`}
        ${tab === "library" && html`<${LibraryTab} config=${config} onToggleActive=${toggleActive} onUpdateField=${updateField} />`}
        ${tab === "log" && html`<${LogTab} log=${log} changeLog=${changeLog} />`}
        ${tab === "more" && html`<${MoreTab} onExport=${exportData} onImport=${importData} onResetToday=${resetToday} />`}
      </div>
    </div>
  `;
}

// ── SECTION TAB (Desk / Gym) ──────────────────────────────────────────────────
function SectionTab({ section, exercises, config, checked, onCheck, todayLogged }) {
  const categoryOrder = SECTIONS[section].categoryOrder;
  const groups = categoryOrder.map(cat => ({
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
            const cfg = config[ex.id] || {};
            const reps = cfg.reps ?? ex.defaultReps;
            const done = !!checked[ex.id];
            const isStrength = ex.defaultSets != null;
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
                ${isStrength ? html`
                  <div style=${styles.repBadge}>
                    <div style=${{...styles.repNum, fontSize:"1.15rem"}}>${cfg.sets ?? ex.defaultSets}×${reps}</div>
                    <div style=${styles.repUnit}>SETS×REPS</div>
                    ${ex.hasWeight && html`<div style=${styles.weightBadge}>${cfg.weight ?? ex.defaultWeight} LBS</div>`}
                  </div>
                ` : html`
                  <div style=${styles.repBadge}>
                    <div style=${styles.repNum}>${reps}</div>
                    <div style=${styles.repUnit}>${(ex.unit || "reps").toUpperCase()}</div>
                  </div>
                `}
              </div>
            `;
          })}
        </div>
      `)}

      <div style=${{height: 40}} />
    </div>
  `;
}

// ── NUMBER CONTROL (Sets / Reps / Weight counter) ────────────────────────────
function NumberControl({ label, value, onDec, onInc }) {
  return html`
    <div style=${styles.numControl}>
      <div style=${styles.numLabel}>${label}</div>
      <div style=${styles.numRow}>
        <button style=${styles.repBtn} onClick=${onDec}>−</button>
        <div style=${styles.repVal}>${value}</div>
        <button style=${styles.repBtn} onClick=${onInc}>+</button>
      </div>
    </div>
  `;
}

// ── LIBRARY TAB ───────────────────────────────────────────────────────────────
function LibraryTab({ config, onToggleActive, onUpdateField }) {
  const [section, setSection] = useState("desk");
  const [filter, setFilter] = useState("All");
  const cats = ["All", ...SECTIONS[section].categoryOrder];
  const visible = LIBRARY.filter(ex => ex.section === section && (filter === "All" || ex.category === filter));

  return html`
    <div>
      <div style=${styles.filterRow}>
        ${["desk","gym"].map(s => html`
          <button key=${s} style=${{...styles.pill, ...styles.sectionPill, ...(section===s ? styles.pillActive : {})}}
            onClick=${() => { setSection(s); setFilter("All"); }}>
            ${SECTIONS[s].label.toUpperCase()}
          </button>
        `)}
      </div>

      <div style=${styles.filterRow}>
        ${cats.map(c => html`
          <button key=${c} style=${{...styles.pill, ...(filter===c ? styles.pillActive : {})}} onClick=${() => setFilter(c)}>
            ${c.toUpperCase()}
          </button>
        `)}
      </div>

      <div style=${styles.infoBox}>
        Toggle exercises on/off for your ${SECTIONS[section].label} routine. Adjust with +/−. Changes save instantly${section === "gym" ? " and sets/reps/weight edits are tracked in Log → Progression" : ""}.
      </div>

      ${visible.map(ex => {
        const cfg = config[ex.id] ?? { reps: ex.defaultReps, active: false, sets: ex.defaultSets, weight: ex.defaultWeight };
        const hasSets = ex.defaultSets != null;
        const hasWeight = !!ex.hasWeight;
        return html`
          <div key=${ex.id} style=${{...styles.libCard, ...(cfg.active ? styles.libCardActive : {})}}>
            <div style=${styles.libTopRow}>
              <div style=${styles.libLeft}>
                <div style=${{...styles.catDot, background: CATEGORY_COLOR[ex.category]}} />
                <div>
                  <div style=${styles.libName}>${ex.name}</div>
                  <div style=${styles.libMuscle}>${ex.muscle} · ${ex.category}</div>
                </div>
              </div>
              <button style=${{...styles.toggleBtn, ...(cfg.active ? styles.toggleBtnOn : {})}} onClick=${() => onToggleActive(ex.id)}>
                ${cfg.active ? "ON" : "OFF"}
              </button>
            </div>
            <div style=${styles.numRowWrap}>
              ${hasSets && html`<${NumberControl} label="SETS" value=${cfg.sets ?? ex.defaultSets}
                onDec=${() => onUpdateField(ex.id, "sets", -1, 1)} onInc=${() => onUpdateField(ex.id, "sets", 1, 1)} />`}
              <${NumberControl} label=${(ex.unit || "reps").toUpperCase()} value=${cfg.reps}
                onDec=${() => onUpdateField(ex.id, "reps", -1, 1)} onInc=${() => onUpdateField(ex.id, "reps", 1, 1)} />
              ${hasWeight && html`<${NumberControl} label="LBS" value=${cfg.weight ?? ex.defaultWeight}
                onDec=${() => onUpdateField(ex.id, "weight", -5, 0)} onInc=${() => onUpdateField(ex.id, "weight", 5, 0)} />`}
            </div>
          </div>
        `;
      })}
      <div style=${{height: 40}} />
    </div>
  `;
}

// ── LOG TAB ───────────────────────────────────────────────────────────────────
function LogTab({ log, changeLog }) {
  const [view, setView] = useState("sessions");
  return html`
    <div>
      <div style=${styles.filterRow}>
        ${["sessions","progression"].map(v => html`
          <button key=${v} style=${{...styles.pill, ...styles.sectionPill, ...(view===v ? styles.pillActive : {})}} onClick=${() => setView(v)}>
            ${v.toUpperCase()}
          </button>
        `)}
      </div>
      ${view === "sessions" ? html`<${SessionsLog} log=${log} />` : html`<${ProgressionLog} changeLog=${changeLog} />`}
    </div>
  `;
}

function SessionsLog({ log }) {
  if (!log.length) return html`<div style=${styles.empty}>No workouts logged yet.<br />Check off an exercise on the Desk or Gym tab to start today's entry.</div>`;

  return html`
    <div>
      ${log.map((entry, i) => {
        const section = entry.section || "desk";
        return html`
        <div key=${i} style=${{...styles.logEntry, borderLeftColor: section === "gym" ? "#6a8cae" : "#4a5240"}}>
          <div>
            <div style=${styles.logDate}>
              ${entry.dateLabel}
              <span style=${{...styles.sectionTag, color: section === "gym" ? "#6a8cae" : "#8fa068"}}>${(SECTIONS[section]?.label || section).toUpperCase()}</span>
            </div>
            <div style=${styles.logDetail}>${entry.done} of ${entry.total} exercises</div>
            <div style=${styles.logExList}>${entry.exercises?.filter(e => e.done).map(e => e.name).join(" · ")}</div>
          </div>
          <div style=${styles.logPct}>${entry.pct}%</div>
        </div>
      `;
      })}
      <div style=${{height: 40}} />
    </div>
  `;
}

// ── GRADES TAB ────────────────────────────────────────────────────────────────
// Reads data/grades.json, kept up to date by the scheduled ProgressBook
// scraper (.github/workflows/scrape-progressbook.yml). No login here —
// this tab only ever displays what the scraper last wrote.
function GradesTab() {
  const [state, setState] = useState({ loading: true, error: false, data: null });

  useEffect(() => {
    fetch("./data/grades.json", { cache: "no-store" })
      .then(res => { if (!res.ok) throw new Error("fetch failed"); return res.json(); })
      .then(data => setState({ loading: false, error: false, data }))
      .catch(() => setState({ loading: false, error: true, data: null }));
  }, []);

  if (state.loading) return html`<div style=${styles.empty}>Loading grades…</div>`;
  if (state.error) return html`<div style=${styles.empty}>Couldn't load grades data.<br />Check that the ProgressBook scraper has run.</div>`;

  const { updatedAt, courses } = state.data;

  if (!courses?.length) {
    return html`<div style=${styles.empty}>No grade data yet.<br />The scraper hasn't synced ProgressBook, or hasn't been set up.</div>`;
  }

  return html`
    <div style=${{paddingTop: 14}}>
      ${updatedAt && html`<div style=${styles.gradesUpdated}>Updated ${new Date(updatedAt).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</div>`}
      ${courses.map((course, i) => html`
        <div key=${i} style=${{...styles.courseCard, borderLeftColor: course.missingAssignments?.length ? "#c05a5a" : "#4a5240"}}>
          <div style=${styles.courseHead}>
            <div>
              <div style=${styles.courseName}>${course.name}</div>
              ${course.teacher && html`<div style=${styles.courseTeacher}>${course.teacher}</div>`}
            </div>
            ${course.grade && html`<div style=${styles.courseGrade}>${course.grade}</div>`}
          </div>
          ${course.missingAssignments?.length > 0 && html`
            <div style=${styles.missingList}>
              ${course.missingAssignments.map((a, j) => html`
                <div key=${j} style=${styles.missingItem}>
                  <span>${a.name}</span>
                  ${a.dueDate && html`<span style=${styles.missingDue}>${a.dueDate}</span>`}
                </div>
              `)}
            </div>
          `}
        </div>
      `)}
      <div style=${{height: 40}} />
    </div>
  `;
}

// Progression history — one entry per Sets/Reps/Weight edit made in the
// Library, so strength progress over time is visible, not just daily completion.
function ProgressionLog({ changeLog }) {
  if (!changeLog.length) return html`<div style=${styles.empty}>No changes tracked yet.<br />Adjust sets, reps, or weight for a Gym exercise in the Library to start a progression history.</div>`;

  return html`
    <div>
      ${changeLog.map((c, i) => html`
        <div key=${i} style=${styles.logEntry}>
          <div>
            <div style=${styles.logDate}>${c.dateLabel}</div>
            <div style=${styles.logDetail}>${c.summary}</div>
          </div>
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

      <div style=${{...styles.phaseLabel, borderColor:"#9aab8a", color:"#9aab8a"}}>DATA</div>
      <div style=${styles.libCard}>
        <div style=${styles.libTopRow}>
          <div style=${{flex:1}}>
            <div style=${styles.libName}>Backup your data</div>
            <div style=${styles.libMuscle}>Download your log & settings as a JSON file</div>
          </div>
          <button style=${{...styles.toggleBtn, ...styles.toggleBtnOn, minWidth: 70}} onClick=${onExport}>EXPORT</button>
        </div>
      </div>
      <div style=${styles.libCard}>
        <div style=${styles.libTopRow}>
          <div style=${{flex:1}}>
            <div style=${styles.libName}>Restore backup</div>
            <div style=${styles.libMuscle}>Load a previously exported JSON file</div>
          </div>
          <button style=${{...styles.toggleBtn, minWidth: 70}} onClick=${() => fileInput?.click()}>IMPORT</button>
          <input ref=${setFileInput} type="file" accept="application/json" style=${{display:"none"}}
            onChange=${(e) => { if (e.target.files[0]) onImport(e.target.files[0]); e.target.value = ""; }} />
        </div>
      </div>

      <div style=${{...styles.phaseLabel, borderColor:"#c05a5a", color:"#c05a5a", marginTop: 24}}>DANGER ZONE</div>
      <div style=${styles.libCard}>
        <div style=${styles.libTopRow}>
          <div style=${{flex:1}}>
            <div style=${styles.libName}>Reset today's Desk checkmarks</div>
            <div style=${styles.libMuscle}>Doesn't affect past log entries</div>
          </div>
          <button style=${{...styles.toggleBtn, borderColor:"#3a2020", color:"#c05a5a", minWidth: 70}} onClick=${() => onResetToday("desk")}>RESET</button>
        </div>
      </div>
      <div style=${styles.libCard}>
        <div style=${styles.libTopRow}>
          <div style=${{flex:1}}>
            <div style=${styles.libName}>Reset today's Gym checkmarks</div>
            <div style=${styles.libMuscle}>Doesn't affect past log entries</div>
          </div>
          <button style=${{...styles.toggleBtn, borderColor:"#3a2020", color:"#c05a5a", minWidth: 70}} onClick=${() => onResetToday("gym")}>RESET</button>
        </div>
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
  badge: { fontSize:10, letterSpacing:"0.2em", color:"#9aab8a", textTransform:"uppercase", marginBottom:4 },
  h1: { fontSize:"2.4rem", fontWeight:800, letterSpacing:"0.06em", color:"#e8dcc8", lineHeight:1 },
  dateStr: { fontSize:10, color:"#9aab8a", letterSpacing:"0.12em", marginTop:4 },
  statsBlock: { display:"flex", gap:16, alignItems:"flex-start" },
  stat: { textAlign:"right" },
  statNum: { fontSize:"1.8rem", fontWeight:800, color:"#8fa068", lineHeight:1 },
  statLabel: { fontSize:9, letterSpacing:"0.15em", color:"#9aab8a", textTransform:"uppercase" },

  tabs: { display:"flex", background:"#0a0c07", borderBottom:"1px solid #2a2a20" },
  tab: { flex:1, padding:"12px 4px", background:"transparent", border:"none", borderBottom:"2px solid transparent", color:"#8a8a8a", fontSize:11, letterSpacing:"0.1em", cursor:"pointer", fontWeight:600 },
  tabActive: { color:"#c8b89a", borderBottomColor:"#c8b89a", background:"#0f1109" },

  content: { padding:"0 16px" },

  progressWrap: { padding:"14px 0 4px" },
  progressBar: { height:4, background:"#2a2a20", borderRadius:2, overflow:"hidden" },
  progressFill: { height:"100%", background:"#8fa068", transition:"width 0.3s ease", borderRadius:2 },
  progressLabel: { fontSize:11, color:"#9aab8a", letterSpacing:"0.1em", marginTop:6, textAlign:"right" },

  phaseLabel: { fontSize:11, fontWeight:700, letterSpacing:"0.2em", borderLeft:"3px solid", paddingLeft:8, margin:"18px 0 10px", textTransform:"uppercase" },

  exCard: { background:"#161810", border:"1px solid #2a2a20", borderLeft:"4px solid #333", borderRadius:2, marginBottom:8, padding:"12px 12px 12px 10px", display:"flex", alignItems:"flex-start", gap:10, transition:"opacity 0.2s" },
  exCardDone: { opacity:0.55 },
  checkBtn: { width:28, height:28, minWidth:28, border:"2px solid #444", background:"transparent", borderRadius:2, color:"#8fa068", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", marginTop:2 },
  checkBtnDone: { background:"#8fa068", borderColor:"#8fa068", color:"#0f1109" },
  exInfo: { flex:1 },
  exName: { fontSize:15, fontWeight:600, color:"#e8dcc8", marginBottom:2 },
  exNameDone: { textDecoration:"line-through", color:"#8a8a8a" },
  exMuscle: { fontSize:10, color:"#9aab8a", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 },
  exTip: { fontSize:11, color:"#a3ab98", lineHeight:1.5 },
  repBadge: { textAlign:"center", minWidth:36 },
  repNum: { fontSize:"1.4rem", fontWeight:800, color:"#c8b89a", lineHeight:1 },
  repUnit: { fontSize:8, color:"#8a8a8a", letterSpacing:"0.12em" },
  weightBadge: { fontSize:10, fontWeight:700, color:"#8fa068", marginTop:2 },

  filterRow: { display:"flex", gap:6, padding:"14px 0 10px", flexWrap:"wrap" },
  pill: { padding:"5px 10px", background:"#1a1c18", border:"1px solid #333", color:"#999", fontSize:10, letterSpacing:"0.12em", cursor:"pointer", borderRadius:2 },
  sectionPill: { flex:1, textAlign:"center", fontWeight:700 },
  pillActive: { background:"#4a5240", borderColor:"#4a5240", color:"#e8dcc8" },

  libCard: { background:"#161810", border:"1px solid #222", borderRadius:2, marginBottom:8, padding:"12px", opacity:0.6 },
  libCardActive: { opacity:1, borderColor:"#3a4a30" },
  libTopRow: { display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 },
  libLeft: { display:"flex", alignItems:"center", gap:10, flex:1 },
  catDot: { width:8, height:8, borderRadius:"50%", flexShrink:0 },
  libName: { fontSize:13, fontWeight:600, color:"#e8dcc8", marginBottom:2 },
  libMuscle: { fontSize:10, color:"#9aab8a", letterSpacing:"0.08em" },
  numRowWrap: { display:"flex", gap:14, marginTop:10, paddingTop:10, borderTop:"1px solid #222", flexWrap:"wrap" },
  numControl: { display:"flex", flexDirection:"column", alignItems:"center", gap:4 },
  numLabel: { fontSize:8, color:"#8a8a8a", letterSpacing:"0.1em" },
  numRow: { display:"flex", alignItems:"center", gap:6 },
  repBtn: { width:24, height:24, background:"#2a2a20", border:"none", color:"#c8b89a", fontSize:14, cursor:"pointer", borderRadius:2, display:"flex", alignItems:"center", justifyContent:"center" },
  repVal: { fontSize:"1.1rem", fontWeight:700, color:"#c8b89a", minWidth:28, textAlign:"center" },
  toggleBtn: { padding:"5px 10px", background:"#2a2020", border:"1px solid #3a2020", color:"#8a8a8a", fontSize:10, fontWeight:700, letterSpacing:"0.12em", cursor:"pointer", borderRadius:2, minWidth:40 },
  toggleBtnOn: { background:"#2a3a20", borderColor:"#4a6a30", color:"#8fa068" },

  logEntry: { background:"#161810", border:"1px solid #222", borderLeft:"3px solid #4a5240", borderRadius:2, padding:"12px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"flex-start" },
  logDate: { fontSize:14, fontWeight:700, color:"#c8b89a", marginBottom:2 },
  sectionTag: { fontSize:9, fontWeight:700, letterSpacing:"0.1em", marginLeft:8 },
  logDetail: { fontSize:11, color:"#9aab8a", marginBottom:4 },
  logExList: { fontSize:10, color:"#7f9270", lineHeight:1.5 },
  logPct: { fontSize:"1.6rem", fontWeight:800, color:"#8fa068" },

  infoBox: { background:"#131510", border:"1px solid #2a2a20", borderRadius:2, padding:"12px 14px", marginBottom:14, fontSize:12, color:"#a3ab98", lineHeight:1.6 },
  empty: { textAlign:"center", padding:"60px 20px", color:"#8a8a8a", fontSize:13, lineHeight:2 },

  gradesUpdated: { fontSize:10, color:"#8a8a8a", letterSpacing:"0.1em", textAlign:"right", marginBottom:10 },
  courseCard: { background:"#161810", border:"1px solid #2a2a20", borderLeft:"4px solid #4a5240", borderRadius:2, marginBottom:10, padding:"12px 14px" },
  courseHead: { display:"flex", justifyContent:"space-between", alignItems:"flex-start" },
  courseName: { fontSize:15, fontWeight:700, color:"#e8dcc8" },
  courseTeacher: { fontSize:11, color:"#9aab8a", letterSpacing:"0.06em", marginTop:2 },
  courseGrade: { fontSize:"1.4rem", fontWeight:800, color:"#c8b89a", lineHeight:1 },
  missingList: { marginTop:10, paddingTop:10, borderTop:"1px solid #2a2a20" },
  missingItem: { display:"flex", justifyContent:"space-between", fontSize:12, color:"#e0a8a8", padding:"3px 0", gap:10 },
  missingDue: { color:"#a37070", fontSize:11, whiteSpace:"nowrap" },
};

render(html`<${SagePT} />`, document.getElementById("root"));
