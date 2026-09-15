import React, { useState, useEffect, useRef, useCallback } from "react";
import SmartCity3D from "./SmartCity3D.jsx";
import "./ui.css";

export default function App() {
  const [panel, setPanel] = useState(null); // { type: "traffic"|"power"|"filtration"|"food"|"building"|"location", data }
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [liveTraffic, setLiveTraffic] = useState(false);

  const [aiTraffic, setAiTraffic] = useState({
    phase: 1, inYellow: false, inAllRed: false,
    currentGreenRoads: [1, 2], currentRedRoads: [3, 4],
    phaseProgress: 0, phaseLabel: "N-S GREEN",
    stats: { vehiclesDetected: 120, vehiclesMoving: 80, vehiclesWaiting: 40, density: "MEDIUM" },
    roadQueues: { 1: 0, 2: 0, 3: 0, 4: 0 },
    decisionLog: [],
  });

  const cityRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  // Recording timer
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setRecTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  const toggleRecording = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    if (!recording) {
      try {
        const stream = canvas.captureStream(30);
        const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
        const rec = new MediaRecorder(stream, { mimeType: mime });
        chunksRef.current = [];
        rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        rec.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `smartcity-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        };
        rec.start(1000);
        mediaRef.current = rec;
        setRecTime(0);
        setRecording(true);
      } catch (e) { console.error(e); }
    } else {
      mediaRef.current?.stop();
      mediaRef.current = null;
      setRecording(false);
    }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handlePanel = useCallback((data) => {
    setPanel({ type: data.type || "building", title: data.title, name: data.name });
  }, []);

  const closePanel = () => setPanel(null);

  const openSystem = (key) => {
    cityRef.current?.goToSystem?.(key);
    setPanel({ type: key });
  };

  const getRoadSignal = (r) => {
    if (aiTraffic.inAllRed) return "red";
    if (aiTraffic.inYellow) return aiTraffic.currentGreenRoads?.includes(r) ? "yellow" : "red";
    return aiTraffic.currentGreenRoads?.includes(r) ? "green" : "red";
  };
  const sigColor = (s) => s === "green" ? "#22ff66" : s === "yellow" ? "#ffcc22" : "#ff2222";

  return (
    <div className="app">
      <SmartCity3D
        ref={cityRef}
        onPanel={handlePanel}
        onAITrafficUpdate={setAiTraffic}
      />

      {/* ═══════════ TOP BAR ═══════════ */}
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">🏙</div>
          <div>
            <div className="brand-name">BSS WORLD</div>
            <div className="brand-sub">Smart City Control Center</div>
          </div>
        </div>

        <div className="topbar-center">
          <div className="sys-pill">
            <span className="pill-dot" style={{ background: sigColor(getRoadSignal(1)) }} />
            <span>AI Traffic: {aiTraffic.phaseLabel}</span>
          </div>
        </div>

        <div className="topbar-right">
          <button className="rec-btn" onClick={toggleRecording}>
            <span className={`rec-dot ${recording ? "on" : ""}`} />
            <span>{recording ? fmt(recTime) : "REC"}</span>
          </button>
        </div>
      </div>

      {/* ═══════════ SYSTEM CARDS — RIGHT SIDE ═══════════ */}
      <div className="sys-cards">
        <button className="sys-card traffic" onClick={() => openSystem("traffic")}>
          <div className="card-icon">🚦</div>
          <div className="card-info">
            <div className="card-title">AI Traffic</div>
            <div className="card-sub">{aiTraffic.phaseLabel}</div>
          </div>
          <div className="card-arrow">›</div>
        </button>

        <button className="sys-card power" onClick={() => openSystem("power")}>
          <div className="card-icon">⚡</div>
          <div className="card-info">
            <div className="card-title">Power Supply</div>
            <div className="card-sub">70 MW · Solar + Wind</div>
          </div>
          <div className="card-arrow">›</div>
        </button>

        <button className="sys-card water" onClick={() => openSystem("filtration")}>
          <div className="card-icon">💧</div>
          <div className="card-info">
            <div className="card-title">Filtration</div>
            <div className="card-sub">9-stage · 12M L/day</div>
          </div>
          <div className="card-arrow">›</div>
        </button>

        <button className="sys-card food" onClick={() => openSystem("food")}>
          <div className="card-icon">🍎</div>
          <div className="card-info">
            <div className="card-title">Food System</div>
            <div className="card-sub">9 fields · 48 deliveries</div>
          </div>
          <div className="card-arrow">›</div>
        </button>
      </div>

      {/* ═══════════ BOTTOM CONTROLS ═══════════ */}
      <div className="bottom-controls">
        <button className="ctrl-btn" onClick={() => cityRef.current?.goToOverview?.()}>
          <span>🏠</span><span className="ctrl-label">Overview</span>
        </button>
        <button className="ctrl-btn" onClick={() => cityRef.current?.goToTopDown?.()}>
          <span>🛰</span><span className="ctrl-label">Top View</span>
        </button>
        <button className="ctrl-btn" onClick={() => cityRef.current?.setDayNight?.(!window.__isNight) || (window.__isNight = !window.__isNight)}>
          <span>☀</span><span className="ctrl-label">Day/Night</span>
        </button>
      </div>

      {/* ═══════════ PANEL — SLIDES IN ═══════════ */}
      {panel && (
        <Panel data={panel} onClose={closePanel} aiTraffic={aiTraffic} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PANEL — Detailed popup for each system/building
   ═══════════════════════════════════════════════════════════════ */
function Panel({ data, onClose, aiTraffic }) {
  const type = data.type;
  const content = getPanelContent(type, data, aiTraffic);

  return (
    <div className="panel-backdrop" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()} style={{ "--accent": content.color }}>
        <div className="panel-header" style={{ background: content.headerBg }}>
          <div className="panel-icon">{content.icon}</div>
          <div className="panel-title-group">
            <div className="panel-title">{content.title}</div>
            <div className="panel-subtitle">{content.subtitle}</div>
          </div>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="panel-body">
          {content.body}
        </div>
      </div>
    </div>
  );
}

function getPanelContent(type, data, aiTraffic) {
  /* ─────────── AI TRAFFIC ─────────── */
  if (type === "traffic") {
    const stats = aiTraffic.stats || {};
    const roadSignal = (r) => {
      if (aiTraffic.inAllRed) return "red";
      if (aiTraffic.inYellow) return aiTraffic.currentGreenRoads?.includes(r) ? "yellow" : "red";
      return aiTraffic.currentGreenRoads?.includes(r) ? "green" : "red";
    };
    const colorFor = (s) => s === "green" ? "#22ff66" : s === "yellow" ? "#ffcc22" : "#ff2222";

    return {
      icon: "🚦",
      title: "AI Traffic Control Center",
      subtitle: "Adaptive 2-phase system · Emergency override ready",
      color: "#22cfff",
      headerBg: "linear-gradient(135deg, #0a2a3a, #04141c)",
      body: (
        <>
          {/* Current Phase */}
          <div className="p-section">
            <div className="p-label">CURRENT PHASE</div>
            <div className="p-big" style={{ color: "#22cfff" }}>{aiTraffic.phaseLabel}</div>
            <div className="p-progress">
              <div className="p-progress-fill" style={{ width: `${(aiTraffic.phaseProgress || 0) * 100}%`, background: "#22cfff" }} />
            </div>
          </div>

          {/* 4 Road Signals */}
          <div className="p-section">
            <div className="p-label">SIGNAL STATE — 4 ROADS</div>
            <div className="signal-grid">
              {[
                { id: 1, name: "North", icon: "⬆️" },
                { id: 2, name: "South", icon: "⬇️" },
                { id: 3, name: "East", icon: "➡️" },
                { id: 4, name: "West", icon: "⬅️" },
              ].map(r => {
                const sig = roadSignal(r.id);
                const col = colorFor(sig);
                return (
                  <div key={r.id} className="signal-box" style={{ borderColor: col + "60" }}>
                    <div className="signal-icon">{r.icon}</div>
                    <div className="signal-name">{r.name}</div>
                    <div className="signal-light" style={{ background: col, boxShadow: `0 0 16px ${col}` }} />
                    <div className="signal-state" style={{ color: col }}>{sig.toUpperCase()}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="p-section">
            <div className="p-label">LIVE STATISTICS</div>
            <div className="stats-grid">
              <StatCard label="Detected" value={stats.vehiclesDetected ?? 0} color="#22cfff" />
              <StatCard label="Moving" value={stats.vehiclesMoving ?? 0} color="#22ff66" />
              <StatCard label="Waiting" value={stats.vehiclesWaiting ?? 0} color="#ffcc22" />
              <StatCard label="Density" value={stats.density ?? "—"} color="#ff8888" />
            </div>
          </div>

          {/* AI Decision Log */}
          <div className="p-section">
            <div className="p-label">AI DECISION LOG</div>
            <div className="log-list">
              {(aiTraffic.decisionLog || []).length === 0 ? (
                <div className="log-empty">Monitoring traffic…</div>
              ) : (aiTraffic.decisionLog || []).slice(0, 6).map((e, i) => (
                <div key={i} className="log-item" style={{
                  borderLeftColor: e.type === "emergency" ? "#ff4444" : e.type === "phase" ? "#ffcc22" : "#22cfff",
                  color: e.type === "emergency" ? "#ff8888" : "#b8e8ff",
                }}>
                  {e.message}
                </div>
              ))}
            </div>
          </div>
        </>
      ),
    };
  }

  /* ─────────── POWER ─────────── */
  if (type === "power") {
    const stages = [
      { name: "Solar Array", value: "42 MW", color: "#ffcc22", icon: "☀️" },
      { name: "Wind Turbines", value: "28 MW", color: "#22cfff", icon: "💨" },
      { name: "Battery Storage", value: "78%", color: "#22ff9d", icon: "🔋" },
      { name: "Grid Distribution", value: "Stable", color: "#ff6b6b", icon: "⚡" },
      { name: "City Load Balance", value: "68 MW", color: "#b266ff", icon: "📊" },
    ];
    return {
      icon: "⚡",
      title: "Power Supply System",
      subtitle: "Renewable energy · 70 MW total output",
      color: "#ffcc22",
      headerBg: "linear-gradient(135deg, #3a2a0a, #1c1404)",
      body: (
        <>
          <div className="p-section">
            <div className="p-label">POWER PIPELINE</div>
            <div className="stage-list">
              {stages.map((s, i) => (
                <div key={i} className="stage-item" style={{ borderColor: s.color + "40" }}>
                  <div className="stage-icon">{s.icon}</div>
                  <div className="stage-info">
                    <div className="stage-name">{s.name}</div>
                    <div className="stage-value" style={{ color: s.color }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-section">
            <div className="p-label">SYSTEM METRICS</div>
            <div className="stats-grid">
              <StatCard label="Total Output" value="70 MW" color="#ffcc22" />
              <StatCard label="Grid Status" value="Stable" color="#22ff66" />
              <StatCard label="Reserve" value="22%" color="#22cfff" />
              <StatCard label="Outages Today" value="0" color="#22ff66" />
            </div>
          </div>

          <div className="p-section">
            <div className="p-label">COMPONENTS</div>
            <div className="comp-list">
              <div className="comp-item">🌬 16 Wind turbines (4×4 grid)</div>
              <div className="comp-item">☀ 10 Solar arrays (2 cols × 5 rows)</div>
              <div className="comp-item">🔋 10 Battery banks (2×5 grid)</div>
              <div className="comp-item">🔌 2 Antenna masts for grid sync</div>
            </div>
          </div>
        </>
      ),
    };
  }

  /* ─────────── FILTRATION ─────────── */
  if (type === "filtration") {
    const stages = [
      { name: "Wastewater Collection", color: "#6b4a2f", desc: "Raw sewage intake" },
      { name: "Primary Filtration", color: "#8a7a4a", desc: "Screens remove solids" },
      { name: "Biological Treatment", color: "#4a8a5a", desc: "Bacteria break organics" },
      { name: "Aeration", color: "#4ac8e0", desc: "Oxygen activates microbes" },
      { name: "Clarification", color: "#6ab0d0", desc: "Sludge settles out" },
      { name: "Advanced Filtration", color: "#3aa0d0", desc: "Membrane micro-filter" },
      { name: "UV Purification", color: "#9a6aff", desc: "UV kills pathogens" },
      { name: "Clean Water Storage", color: "#22cfff", desc: "Reservoir ready" },
      { name: "Water Recycling", color: "#2ecc71", desc: "82% returned to city" },
    ];
    return {
      icon: "💧",
      title: "Water Filtration System",
      subtitle: "9-stage purification · 99.7% purity",
      color: "#22cfff",
      headerBg: "linear-gradient(135deg, #0a2a4a, #04121c)",
      body: (
        <>
          <div className="p-section">
            <div className="p-label">PURIFICATION PIPELINE</div>
            <div className="pipeline">
              {stages.map((s, i) => (
                <div key={i} className="pipe-stage">
                  <div className="pipe-dot" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                  <div className="pipe-info">
                    <div className="pipe-name">Stage {i + 1}: {s.name}</div>
                    <div className="pipe-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-section">
            <div className="p-label">PRODUCTION METRICS</div>
            <div className="stats-grid">
              <StatCard label="Processed" value="12M L/day" color="#22cfff" />
              <StatCard label="Purity" value="99.7%" color="#22ff66" />
              <StatCard label="Active Sensors" value="24" color="#b266ff" />
              <StatCard label="Recycle Rate" value="82%" color="#2ecc71" />
            </div>
          </div>
        </>
      ),
    };
  }

  /* ─────────── FOOD ─────────── */
  if (type === "food") {
    const stages = [
      { name: "Smart Farming", color: "#2ecc71", icon: "🌾", desc: "9 AI-monitored crop fields" },
      { name: "Auto Harvest", color: "#ffcc22", icon: "🚜", desc: "Robotic harvesters collect produce" },
      { name: "Food Processing", color: "#e67e22", icon: "🏭", desc: "Washing, cutting, packaging" },
      { name: "Quality Check", color: "#3498db", icon: "🔍", desc: "AI vision inspects every item" },
      { name: "Smart Packaging", color: "#9b59b6", icon: "📦", desc: "Barcode + freshness tracking" },
      { name: "City Distribution", color: "#ff6b6b", icon: "🚚", desc: "48 deliveries daily" },
    ];
    return {
      icon: "🍎",
      title: "AI Food Production",
      subtitle: "Farm-to-city automated food supply",
      color: "#2ecc71",
      headerBg: "linear-gradient(135deg, #0a3a1e, #041a0e)",
      body: (
        <>
          <div className="p-section">
            <div className="p-label">PRODUCTION PIPELINE</div>
            <div className="stage-list">
              {stages.map((s, i) => (
                <div key={i} className="stage-item" style={{ borderColor: s.color + "40" }}>
                  <div className="stage-icon">{s.icon}</div>
                  <div className="stage-info">
                    <div className="stage-name">{s.name}</div>
                    <div className="stage-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-section">
            <div className="p-label">PRODUCTION METRICS</div>
            <div className="stats-grid">
              <StatCard label="Crop Fields" value="9" color="#2ecc71" />
              <StatCard label="Daily Deliveries" value="48" color="#ffcc22" />
              <StatCard label="Quality Score" value="98%" color="#22ff66" />
              <StatCard label="AI Mode" value="Active" color="#b266ff" />
            </div>
          </div>

          <div className="p-section">
            <div className="p-label">FACILITIES</div>
            <div className="comp-list">
              <div className="comp-item">🌾 9 farming plots with animated crops</div>
              <div className="comp-item">🏭 Central processing plant (140×100×140)</div>
              <div className="comp-item">📦 Conveyor belt with 6 moving packages</div>
              <div className="comp-item">🚚 Distribution trucks ready 24/7</div>
            </div>
          </div>
        </>
      ),
    };
  }

  /* ─────────── BUILDING (default) ─────────── */
  return {
    icon: "🏢",
    title: data.name || "Location",
    subtitle: data.title || "Smart City Building",
    color: "#22cfff",
    headerBg: "linear-gradient(135deg, #0a2a4a, #04121c)",
    body: (
      <div className="p-section">
        <p style={{ color: "#b8e8ff", lineHeight: 1.6 }}>
          This is a smart city facility connected to the AI control network.
          Click any system card on the right to explore detailed operations.
        </p>
      </div>
    ),
  };
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  );
}
