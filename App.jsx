import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient.js";

// ─── Exercise Library (bodyweight only) ───────────────────────────────────────
const EXERCISES = [
  { id: "pushups",       name: "Push-ups",       emoji: "💪", category: "upper",  defaultGoal: 50 },
  { id: "pullups",       name: "Pull-ups",        emoji: "🔝", category: "upper",  defaultGoal: 20 },
  { id: "dips",          name: "Dips",            emoji: "⬇️", category: "upper",  defaultGoal: 30 },
  { id: "pikepushups",   name: "Pike Push-ups",   emoji: "🔺", category: "upper",  defaultGoal: 25 },
  { id: "squats",        name: "Squats",          emoji: "🦵", category: "lower",  defaultGoal: 60 },
  { id: "lunges",        name: "Lunges",          emoji: "🎯", category: "lower",  defaultGoal: 40 },
  { id: "glutebridges",  name: "Glute Bridges",   emoji: "🍑", category: "lower",  defaultGoal: 40 },
  { id: "calfraiser",    name: "Calf Raises",     emoji: "🦶", category: "lower",  defaultGoal: 60 },
  { id: "situps",        name: "Sit-ups",         emoji: "🔥", category: "core",   defaultGoal: 50 },
  { id: "plank",         name: "Plank (sec)",     emoji: "🧱", category: "core",   defaultGoal: 120 },
  { id: "leglifts",      name: "Leg Lifts",       emoji: "⬆️", category: "core",   defaultGoal: 30 },
  { id: "mountaincli",   name: "Mountain Climbers",emoji: "🏔️", category: "core",  defaultGoal: 40 },
  { id: "burpees",       name: "Burpees",         emoji: "⚡", category: "full",   defaultGoal: 30 },
  { id: "jumpingjacks",  name: "Jumping Jacks",   emoji: "🌟", category: "full",   defaultGoal: 80 },
  { id: "bearcrawi",     name: "Bear Crawls",     emoji: "🐻", category: "full",   defaultGoal: 20 },
  { id: "inchworm",      name: "Inchworms",       emoji: "🐛", category: "full",   defaultGoal: 15 },
];

const CATEGORIES = ["upper", "lower", "core", "full"];
const CAT_LABELS = { upper: "Upper Body", lower: "Lower Body", core: "Core", full: "Full Body" };
const CAT_COLORS = { upper: "#FF3D5A", lower: "#FF8C42", core: "#3DD9EB", full: "#A78BFA" };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─── Auto schedule: balanced upper/lower/core/full split over 7 days ──────────
function generateAutoSchedule() {
  // Pattern: upper, lower, core, full, upper, lower, core → balanced week
  const pattern = ["upper", "lower", "core", "full", "upper", "lower", "core"];
  const picks = {};
  pattern.forEach((cat, i) => {
    const pool = EXERCISES.filter(e => e.category === cat);
    const ex = pool[Math.floor(Math.random() * pool.length)];
    picks[i] = { exerciseId: ex.id, goal: ex.defaultGoal };
  });
  return picks;
}

function getTodayIndex() {
  // 0=Mon ... 6=Sun
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function getExById(id) {
  return EXERCISES.find(e => e.id === id) || EXERCISES[0];
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function RingProgress({ current, goal, size = 140 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(current / goal, 1);
  const offset = circumference - pct * circumference;
  const done = pct >= 1;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1C1C28" strokeWidth={10} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={done ? "#00E676" : "#FF3D5A"} strokeWidth={10}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize: 30, fontWeight: 900, color: done ? "#00E676" : "#F0F0F5", lineHeight: 1 }}>{current}</span>
        <span style={{ fontSize: 11, color: "#444", marginTop: 2 }}>/ {goal}</span>
      </div>
    </div>
  );
}

function WeekBar({ day, label, count, goal, isToday, isPast }) {
  const pct = goal > 0 ? Math.min(count / goal, 1) : 0;
  const done = pct >= 1;
  const hasData = count > 0 || (isPast && goal > 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: isToday ? "#FF3D5A" : "#444", letterSpacing: 0.5 }}>{label}</span>
      <div style={{
        width: "100%", height: 72, background: "#1C1C28", borderRadius: 8,
        position: "relative", overflow: "hidden",
        border: isToday ? "1px solid #FF3D5A44" : "1px solid transparent",
      }}>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: `${pct * 100}%`,
          background: done ? "#00E676" : isToday ? "#FF3D5A" : "#FF3D5A66",
          borderRadius: "6px 6px 0 0",
          transition: "height 0.4s ease",
        }} />
        {!hasData && !isToday && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize: 14, opacity: 0.3 }}>—</span>
          </div>
        )}
      </div>
      <span style={{ fontSize: 10, color: done ? "#00E676" : "#555" }}>
        {hasData ? `${Math.round(pct * 100)}%` : "·"}
      </span>
      {hasData && (
        <span style={{ fontSize: 9, color: "#333" }}>{count}/{goal}</span>
      )}
    </div>
  );
}

function ScheduleEditor({ schedule, onSave, onClose }) {
  const [draft, setDraft] = useState(JSON.parse(JSON.stringify(schedule)));
  const todayIdx = getTodayIndex();

  const setExercise = (dayIdx, exId) => {
    const ex = getExById(exId);
    setDraft(d => ({ ...d, [dayIdx]: { ...d[dayIdx], exerciseId: exId, goal: ex.defaultGoal } }));
  };
  const setGoal = (dayIdx, val) => {
    setDraft(d => ({ ...d, [dayIdx]: { ...d[dayIdx], goal: Number(val) } }));
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#0A0A0Fdd", zIndex: 100,
      display: "flex", flexDirection: "column",
      maxWidth: 430, margin: "0 auto",
    }}>
      <div style={{ background: "#0A0A0F", flex: 1, overflowY: "auto", padding: "24px 20px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#F0F0F5" }}>Weekly Plan</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        {DAYS.map((day, i) => {
          const entry = draft[i] || {};
          const ex = getExById(entry.exerciseId);
          return (
            <div key={i} style={{
              background: "#13131C", borderRadius: 14, padding: "14px 16px", marginBottom: 10,
              border: i === todayIdx ? "1px solid #FF3D5A44" : "1px solid #1C1C28",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: 1,
                  color: i === todayIdx ? "#FF3D5A" : "#444",
                  minWidth: 28,
                }}>{day.toUpperCase()}</span>
                <span style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 99,
                  background: CAT_COLORS[ex?.category] + "22",
                  color: CAT_COLORS[ex?.category],
                  fontWeight: 700,
                }}>{CAT_LABELS[ex?.category]}</span>
                {i === todayIdx && (
                  <span style={{ fontSize: 10, color: "#FF3D5A", fontWeight: 700, marginLeft: "auto" }}>TODAY</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={entry.exerciseId || ""}
                  onChange={e => setExercise(i, e.target.value)}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 10,
                    background: "#1C1C28", border: "1px solid #2A2A3A",
                    color: "#F0F0F5", fontSize: 14, cursor: "pointer",
                  }}
                >
                  {CATEGORIES.map(cat => (
                    <optgroup key={cat} label={CAT_LABELS[cat]}>
                      {EXERCISES.filter(e => e.category === cat).map(e => (
                        <option key={e.id} value={e.id}>{e.emoji} {e.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "#444" }}>Goal</span>
                  <input
                    type="number"
                    value={entry.goal || ""}
                    onChange={e => setGoal(i, e.target.value)}
                    style={{
                      width: 56, padding: "10px 8px", borderRadius: 10,
                      background: "#1C1C28", border: "1px solid #2A2A3A",
                      color: "#FF3D5A", fontSize: 14, fontWeight: 700, textAlign: "center",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "16px 20px 32px", background: "#0A0A0F",
        borderTop: "1px solid #1C1C28",
        display: "flex", gap: 10,
      }}>
        <button onClick={onClose}
          style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1px solid #2A2A3A", background: "none", color: "#555", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={() => { onSave(draft); onClose(); }}
          style={{ flex: 2, padding: "14px", borderRadius: 12, border: "none", background: "#FF3D5A", color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer" }}>
          Save Plan
        </button>
      </div>
    </div>
  );
}

function TeamView({ teamData, myName, myWeekData, todayIdx }) {
  const [tab, setTab] = useState("today");

  const buildMemberSummary = (name, data) => {
    const todayEntry = data.week?.[todayIdx];
    const todayPct = todayEntry
      ? Math.min((todayEntry.count || 0) / (todayEntry.goal || 1), 1) * 100
      : 0;
    const weekPct = Object.values(data.week || {}).reduce((acc, d) => {
      if (!d || !d.goal) return acc;
      return acc + Math.min((d.count || 0) / d.goal, 1);
    }, 0) / 7 * 100;
    return { name, data, todayPct: Math.round(todayPct), weekPct: Math.round(weekPct), todayEntry };
  };

  const allMembers = [
    buildMemberSummary(myName, myWeekData),
    ...Object.entries(teamData).map(([n, d]) => buildMemberSummary(n, d)),
  ];

  const sorted = [...allMembers].sort((a, b) =>
    tab === "today" ? b.todayPct - a.todayPct : b.weekPct - a.weekPct
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["today", "week"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "9px", borderRadius: 10, border: "none",
            background: tab === t ? "#FF3D5A" : "#13131C",
            color: tab === t ? "#fff" : "#555",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>
            {t === "today" ? "Today" : "This Week"}
          </button>
        ))}
      </div>

      {sorted.map((member, i) => {
        const score = tab === "today" ? member.todayPct : member.weekPct;
        const isMe = member.name === myName;
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
        return (
          <div key={member.name} style={{
            background: isMe ? "#FF3D5A0F" : "#13131C",
            border: `1px solid ${isMe ? "#FF3D5A33" : "#1C1C28"}`,
            borderRadius: 14, padding: "14px 16px", marginBottom: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 18, minWidth: 26 }}>{medal || `${i+1}`}</span>
              <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: "#F0F0F5" }}>
                {member.name}
                {isMe && <span style={{ fontSize: 11, color: "#FF3D5A", marginLeft: 6, fontWeight: 700 }}>you</span>}
              </span>
              <span style={{ fontWeight: 900, fontSize: 16, color: score >= 100 ? "#00E676" : "#FF3D5A" }}>
                {score}%
              </span>
            </div>
            <div style={{ height: 5, background: "#1C1C28", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${score}%`,
                background: score >= 100 ? "#00E676" : "#FF3D5A",
                borderRadius: 99, transition: "width 0.5s ease",
              }} />
            </div>
            {tab === "today" && member.todayEntry && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#444" }}>
                {(() => { const ex = getExById(member.todayEntry.exerciseId); return ex ? `${ex.emoji} ${ex.name} — ${member.todayEntry.count || 0}/${member.todayEntry.goal || 0} reps` : null; })()}
              </div>
            )}
            {tab === "week" && (
              <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                {DAYS.map((d, di) => {
                  const entry = member.data.week?.[di];
                  const p = entry && entry.goal ? Math.min((entry.count||0)/entry.goal,1) : 0;
                  return (
                    <div key={di} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ height: 28, background: "#1C1C28", borderRadius: 4, position: "relative", overflow: "hidden" }}>
                        <div style={{
                          position: "absolute", bottom: 0, left: 0, right: 0,
                          height: `${p*100}%`,
                          background: p >= 1 ? "#00E676" : "#FF3D5A66",
                          transition: "height 0.3s ease",
                        }} />
                      </div>
                      <div style={{ fontSize: 8, color: di === todayIdx ? "#FF3D5A" : "#333", marginTop: 2 }}>{d}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {allMembers.length === 1 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#333" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No teammates yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Share your team code to add friends</div>
        </div>
      )}
    </div>
  );
}

// ─── Local persistence (so closing the app doesn't lose your session) ────────
const LS_KEY = "push-further-session";

function loadLocalSession() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveLocalSession(session) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(session));
  } catch (e) {}
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const existing = loadLocalSession();
  const [screen, setScreen] = useState(existing ? "main" : "setup");
  const [myName, setMyName] = useState(existing?.myName || "");
  const [teamId, setTeamId] = useState(existing?.teamId || "");
  const [joinTeamId, setJoinTeamId] = useState("");
  const [creating, setCreating] = useState(true);
  const [schedule, setSchedule] = useState(existing?.schedule || null); // { 0: {exerciseId, goal}, ... }
  const [weekCounts, setWeekCounts] = useState(existing?.weekCounts || {}); // { dayIdx: count }
  const [teamData, setTeamData] = useState({});
  const [activeTab, setActiveTab] = useState("today");
  const [showSchedule, setShowSchedule] = useState(false);
  const syncRef = useRef(null);
  const todayIdx = getTodayIndex();

  // Persist session locally whenever core state changes
  useEffect(() => {
    if (screen === "main" && myName && teamId) {
      saveLocalSession({ myName, teamId, schedule, weekCounts });
    }
  }, [screen, myName, teamId, schedule, weekCounts]);

  // Resume sync + pull latest team data if we restored a session
  useEffect(() => {
    if (existing && myName && teamId) {
      loadTeam(teamId, myName);
      syncRef.current = setInterval(() => loadTeam(teamId, myName), 6000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Today's exercise from schedule
  const todaySchedule = schedule?.[todayIdx];
  const todayEx = todaySchedule ? getExById(todaySchedule.exerciseId) : null;
  const todayGoal = todaySchedule?.goal || 0;
  const todayCount = weekCounts[todayIdx] || 0;
  const todayDone = todayCount >= todayGoal && todayGoal > 0;

  const getMyWeekData = () => ({
    week: Object.fromEntries(
      DAYS.map((_, i) => {
        const s = schedule?.[i];
        return [i, s ? { exerciseId: s.exerciseId, goal: s.goal, count: weekCounts[i] || 0 } : null];
      })
    ),
    updatedAt: Date.now(),
  });

  const saveToTeam = async (tid, name, weekData) => {
    try {
      await supabase.from("members").upsert(
        {
          team_id: tid,
          name,
          week: weekData.week,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "team_id,name" }
      );
    } catch (e) {
      console.error("saveToTeam failed", e);
    }
  };

  const loadTeam = async (tid, myN) => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("name, week")
        .eq("team_id", tid);
      if (error) throw error;
      const members = {};
      (data || []).forEach(row => {
        if (row.name === myN) return;
        members[row.name] = { week: row.week };
      });
      setTeamData(members);
    } catch (e) {
      console.error("loadTeam failed", e);
    }
  };

  const handleStart = async () => {
    if (!myName.trim()) return;
    const auto = generateAutoSchedule();
    setSchedule(auto);
    let tid = creating
      ? Math.random().toString(36).slice(2, 8).toUpperCase()
      : joinTeamId.trim().toUpperCase();
    setTeamId(tid);

    // If joining, load their schedule (if any) — for now just load team members
    const initialWeek = getMyWeekDataWith(auto, {});
    await saveToTeam(tid, myName.trim(), initialWeek);
    setScreen("main");
    loadTeam(tid, myName.trim());
    syncRef.current = setInterval(() => loadTeam(tid, myName.trim()), 6000);
  };

  const getMyWeekDataWith = (sched, counts) => ({
    week: Object.fromEntries(
      DAYS.map((_, i) => {
        const s = sched?.[i];
        return [i, s ? { exerciseId: s.exerciseId, goal: s.goal, count: counts[i] || 0 } : null];
      })
    ),
    updatedAt: Date.now(),
  });

  useEffect(() => () => clearInterval(syncRef.current), []);

  const addReps = async (inc) => {
    const next = { ...weekCounts, [todayIdx]: (weekCounts[todayIdx] || 0) + inc };
    setWeekCounts(next);
    const wd = getMyWeekDataWith(schedule, next);
    await saveToTeam(teamId, myName, wd);
  };

  const handleSaveSchedule = async (newSched) => {
    setSchedule(newSched);
    const wd = getMyWeekDataWith(newSched, weekCounts);
    await saveToTeam(teamId, myName, wd);
  };

  // ── Setup screen ────────────────────────────────────────────────────────────
  if (screen === "setup") {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0F", fontFamily: "'Inter', -apple-system, sans-serif", color: "#F0F0F5", maxWidth: 430, margin: "0 auto", padding: "0 24px 40px" }}>
        <div style={{ paddingTop: 64 }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: "#FF3D5A", marginBottom: 12 }}>BODYWEIGHT</div>
            <h1 style={{ fontSize: 44, fontWeight: 900, letterSpacing: -2, lineHeight: 0.95, margin: 0 }}>
              PUSH<br />
              <span style={{ WebkitTextStroke: "2px #FF3D5A", color: "transparent" }}>FURTHER</span>
            </h1>
            <p style={{ color: "#444", marginTop: 14, fontSize: 14, lineHeight: 1.5 }}>
              One exercise. One goal. Every day.
            </p>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#444", marginBottom: 8 }}>YOUR NAME</label>
            <input value={myName} onChange={e => setMyName(e.target.value)}
              placeholder="What do your teammates call you?"
              style={{ width: "100%", padding: "15px", borderRadius: 12, background: "#13131C", border: "1px solid #1C1C28", color: "#F0F0F5", fontSize: 15, boxSizing: "border-box", outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[true, false].map(isCre => (
              <button key={String(isCre)} onClick={() => setCreating(isCre)} style={{
                flex: 1, padding: "12px", borderRadius: 12, border: "none",
                background: creating === isCre ? "#FF3D5A" : "#13131C",
                color: creating === isCre ? "#fff" : "#555",
                fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
              }}>
                {isCre ? "🆕 New team" : "🔗 Join team"}
              </button>
            ))}
          </div>

          {!creating && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#444", marginBottom: 8 }}>TEAM CODE</label>
              <input value={joinTeamId} onChange={e => setJoinTeamId(e.target.value.toUpperCase())}
                placeholder="Enter code"
                style={{ width: "100%", padding: "15px", borderRadius: 12, background: "#13131C", border: "1px solid #1C1C28", color: "#FF3D5A", fontSize: 24, fontWeight: 900, letterSpacing: 5, boxSizing: "border-box", outline: "none", textAlign: "center" }}
              />
            </div>
          )}

          <button onClick={handleStart}
            disabled={!myName.trim() || (!creating && !joinTeamId.trim())}
            style={{
              width: "100%", padding: "17px", borderRadius: 12, border: "none",
              background: myName.trim() ? "#FF3D5A" : "#1C1C28",
              color: myName.trim() ? "#fff" : "#333",
              fontWeight: 900, fontSize: 16, cursor: myName.trim() ? "pointer" : "default",
              letterSpacing: 0.5, transition: "all 0.2s",
            }}>
            {creating ? "Create team & start →" : "Join and train →"}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "#2A2A3A", marginTop: 20 }}>
            Auto-schedule generated on start · edit anytime
          </p>
        </div>
      </div>
    );
  }

  // ── Main screen ─────────────────────────────────────────────────────────────
  const catColor = todayEx ? CAT_COLORS[todayEx.category] : "#FF3D5A";

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", fontFamily: "'Inter', -apple-system, sans-serif", color: "#F0F0F5", maxWidth: 430, margin: "0 auto", paddingBottom: 80 }}>
      {showSchedule && (
        <ScheduleEditor
          schedule={schedule || {}}
          onSave={handleSaveSchedule}
          onClose={() => setShowSchedule(false)}
        />
      )}

      {/* Header */}
      <div style={{ padding: "20px 20px 0", borderBottom: "1px solid #1C1C28", paddingBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#444" }}>
              {DAY_FULL[todayIdx].toUpperCase()}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginTop: 2 }}>
              {todayEx ? `${todayEx.emoji} ${todayEx.name}` : "No exercise set"}
            </div>
            {todayEx && (
              <div style={{ fontSize: 11, marginTop: 3, padding: "2px 8px", borderRadius: 99, display: "inline-block", background: catColor + "22", color: catColor, fontWeight: 700 }}>
                {CAT_LABELS[todayEx.category]}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ background: "#13131C", border: "1px solid #1C1C28", borderRadius: 8, padding: "4px 10px", fontSize: 14, fontWeight: 900, letterSpacing: 3, color: "#FF3D5A" }}>
              {teamId}
            </div>
            <button onClick={() => setShowSchedule(true)}
              style={{ background: "none", border: "1px solid #1C1C28", borderRadius: 8, padding: "4px 10px", color: "#444", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              Edit plan
            </button>
            <button onClick={() => {
              if (confirm("Leave this team? Your local progress will be cleared on this device.")) {
                localStorage.removeItem(LS_KEY);
                clearInterval(syncRef.current);
                setScreen("setup");
                setMyName("");
                setTeamId("");
                setSchedule(null);
                setWeekCounts({});
                setTeamData({});
              }
            }}
              style={{ background: "none", border: "none", color: "#2A2A3A", fontSize: 11, cursor: "pointer", fontWeight: 600, padding: "2px 4px" }}>
              Leave team
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", padding: "12px 20px 0", gap: 8 }}>
        {["today", "week", "team"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: "9px 0", borderRadius: 10, border: "none",
            background: activeTab === tab ? "#FF3D5A" : "#13131C",
            color: activeTab === tab ? "#fff" : "#555",
            fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.2s",
          }}>
            {tab === "today" ? "Today" : tab === "week" ? "My Week" : "Team 🏆"}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 20px" }}>

        {/* ── TODAY TAB ── */}
        {activeTab === "today" && (
          <div>
            {todayEx ? (
              <>
                {/* Big counter */}
                <div style={{
                  background: "#13131C", borderRadius: 20, padding: "28px 20px 24px",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  border: `1px solid ${todayDone ? "#00E67633" : catColor + "22"}`,
                  boxShadow: todayDone ? "0 0 40px #00E67611" : "none",
                  marginBottom: 16, transition: "all 0.3s",
                }}>
                  <RingProgress current={todayCount} goal={todayGoal} size={160} />
                  {todayDone && (
                    <div style={{ marginTop: 16, fontSize: 15, fontWeight: 800, color: "#00E676", letterSpacing: 0.5 }}>
                      ✓ Daily goal crushed!
                    </div>
                  )}
                </div>

                {/* Quick-add buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                  {[1, 5, 10, 25].map(inc => (
                    <button key={inc} onClick={() => addReps(inc)} style={{
                      padding: "16px 0", borderRadius: 14, border: "none",
                      background: todayDone ? "#00E67618" : catColor + "18",
                      color: todayDone ? "#00E676" : catColor,
                      fontWeight: 800, fontSize: 18, cursor: "pointer",
                      transition: "all 0.15s",
                    }}>+{inc}</button>
                  ))}
                </div>

                {/* Undo */}
                <button onClick={() => addReps(-1)} disabled={todayCount === 0}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 12,
                    border: "1px solid #1C1C28", background: "none",
                    color: todayCount > 0 ? "#444" : "#222",
                    fontWeight: 600, fontSize: 14, cursor: todayCount > 0 ? "pointer" : "default",
                  }}>
                  Undo last rep
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#333" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#444" }}>No exercise planned today</div>
                <button onClick={() => setShowSchedule(true)}
                  style={{ marginTop: 16, padding: "12px 24px", borderRadius: 12, border: "none", background: "#FF3D5A", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  Set up your plan
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── WEEK TAB ── */}
        {activeTab === "week" && (
          <div>
            <div style={{ background: "#13131C", borderRadius: 16, padding: "20px 16px 16px", marginBottom: 16, border: "1px solid #1C1C28" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#444", marginBottom: 14 }}>
                WEEKLY PROGRESS
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                {DAYS.map((d, i) => {
                  const s = schedule?.[i];
                  const count = weekCounts[i] || 0;
                  const goal = s?.goal || 0;
                  return (
                    <WeekBar key={i} day={i} label={d} count={count} goal={goal}
                      isToday={i === todayIdx} isPast={i < todayIdx} />
                  );
                })}
              </div>
            </div>

            {/* Day-by-day breakdown */}
            {DAYS.map((d, i) => {
              const s = schedule?.[i];
              const ex = s ? getExById(s.exerciseId) : null;
              const count = weekCounts[i] || 0;
              const goal = s?.goal || 0;
              const pct = goal > 0 ? Math.min(count / goal, 1) : 0;
              const done = pct >= 1 && goal > 0;
              const isToday = i === todayIdx;
              const catCol = ex ? CAT_COLORS[ex.category] : "#333";
              return (
                <div key={i} style={{
                  background: "#13131C", borderRadius: 12, padding: "12px 14px", marginBottom: 8,
                  border: `1px solid ${isToday ? "#FF3D5A33" : done ? "#00E67622" : "#1C1C28"}`,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ minWidth: 36, textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: isToday ? "#FF3D5A" : "#444" }}>{d}</div>
                    {done && <div style={{ fontSize: 14 }}>✅</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {ex ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#F0F0F5" }}>{ex.emoji} {ex.name}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: done ? "#00E676" : catCol }}>
                            {count}/{goal}
                          </span>
                        </div>
                        <div style={{ height: 4, background: "#1C1C28", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", width: `${pct * 100}%`,
                            background: done ? "#00E676" : catCol,
                            borderRadius: 99, transition: "width 0.4s ease",
                          }} />
                        </div>
                        <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: catCol + "18", color: catCol, fontWeight: 700 }}>
                            {CAT_LABELS[ex.category]}
                          </span>
                          <span style={{ fontSize: 10, color: "#333" }}>{Math.round(pct * 100)}%</span>
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: 13, color: "#333" }}>Rest day</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TEAM TAB ── */}
        {activeTab === "team" && (
          <TeamView
            teamData={teamData}
            myName={myName}
            myWeekData={getMyWeekData()}
            todayIdx={todayIdx}
          />
        )}
      </div>
    </div>
  );
}
