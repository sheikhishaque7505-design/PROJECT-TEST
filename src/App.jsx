import React, { useState, useEffect, useRef, useCallback } from "react";
import SmartCity3D from "./SmartCity3D.jsx";
import "./ui.css";

export default function App() {
  const [panel, setPanel] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [isNight, setIsNight] = useState(false);

  const [aiTraffic, setAiTraffic] = useState({
    phase: 1, inYellow: false, inAllRed: false,
    currentGreenRoads: [1, 2], currentRedRoads: [3, 4],
    phaseProgress: 0, phaseLabel: "NORTH-SOUTH GREEN",
    stats: {
      vehiclesDetected: 0, vehiclesMoving: 0, vehiclesWaiting: 0,
      density: "LOW", phaseTimeRemaining: 8,
    },
    roadQueues: { 1: 0, 2: 0, 3: 0, 4: 0 },
    decisionLog: [],
  });

  const [powerData, setPowerData] = useState(null);
  const [filtrationData, setFiltrationData] = useState(null);
  const [foodData, setFoodData] = useState(null);

  const cityRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

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
        const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9" : "video/webm";
        const rec = new MediaRecorder(stream, { mimeType: mime });
        chunksRef.current = [];
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
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
      } catch (e) {
        console.error("Recording error:", e);
      }
    } else {
      mediaRef.current?.stop();
      mediaRef.current = null;
      setRecording(false);
    }
  };

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handlePanel = useCallback((data) => {
    setPanel({ type: data.type, name: data.name });
  }, []);

  const closePanel = () => setPanel(null);

  const openSystem = (type) => {
    cityRef.current?.goToSystem?.(type);
    setPanel({ type });
  };

  const toggleDayNight = () => {
    const next = !isNight;
    setIsNight(next);
    cityRef.current?.setDayNight?.(next);
  };

  const getRoadSignal = (r) => {
    if (aiTraffic.inAllRed) return "red";
    if (aiTraffic.inYellow) {
      return aiTraffic.currentGreenRoads?.includes(r) ? "yellow" : "red";
    }
    return aiTraffic.currentGreenRoads?.includes(r) ? "green" : "red";
  };

  const sigColor = (s) =>
    s === "green" ? "#22ff66" : s === "yellow" ? "#ffcc22" : "#ff2222";

  return (
    <div className="app">
      <SmartCity3D
        ref={cityRef}
        onPanel={handlePanel}
        onAITrafficUpdate={setAiTraffic}
        onPowerUpdate={setPowerData}
        onFiltrationUpdate={setFiltrationData}
        onFoodUpdate={setFoodData}
      />

      {/* ═══ TOP BAR ═══ */}
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
            <span
              className="pill-dot"
              style={{ background: sigColor(getRoadSignal(1)) }}
            />
            <span className="pill-label">AI TRAFFIC:</span>
            <span className="pill-phase">{aiTraffic.phaseLabel}</span>
          </div>
        </div>

        <div className="topbar-right">
          <button
            className={`rec-btn ${recording ? "on" : ""}`}
            onClick={toggleRecording}
          >
            <span className={`rec-dot ${recording ? "on" : ""}`} />
            <span>{recording ? fmt(recTime) : "REC"}</span>
          </button>
        </div>
      </div>

      {/* ═══ 4 SYSTEM CARDS ═══ */}
      <div className="sys-cards">
        <button
          className="sys-card traffic"
          onClick={() => openSystem("traffic")}
        >
          <div className="card-icon">🚦</div>
          <div className="card-info">
            <div className="card-title">AI Traffic</div>
            <div className="card-sub">{aiTraffic.phaseLabel}</div>
          </div>
          <div className="card-arrow">›</div>
        </button>

        <button
          className="sys-card power"
          onClick={() => openSystem("power")}
        >
          <div className="card-icon">⚡</div>
          <div className="card-info">
            <div className="card-title">Power Supply</div>
            <div className="card-sub">70 MW · Solar + Wind</div>
          </div>
          <div className="card-arrow">›</div>
        </button>

        <button
          className="sys-card water"
          onClick={() => openSystem("filtration")}
        >
          <div className="card-icon">💧</div>
          <div className="card-info">
            <div className="card-title">Filtration</div>
            <div className="card-sub">9-stage · 12M L/day</div>
          </div>
          <div className="card-arrow">›</div>
        </button>

        <button
          className="sys-card food"
          onClick={() => openSystem("food")}
        >
          <div className="card-icon">🍎</div>
          <div className="card-info">
            <div className="card-title">Food System</div>
            <div className="card-sub">
              {foodData?.stage?.label || "6-stage production"}
            </div>
          </div>
          <div className="card-arrow">›</div>
        </button>
      </div>

      {/* ═══ BOTTOM CONTROLS ═══ */}
      <div className="bottom-controls">
        <button
          className="ctrl-btn"
          onClick={() => cityRef.current?.goToOverview?.()}
        >
          <span className="ctrl-icon">🏠</span>
          <span className="ctrl-label">Overview</span>
        </button>
        <button
          className="ctrl-btn"
          onClick={() => cityRef.current?.goToTopDown?.()}
        >
          <span className="ctrl-icon">🛰</span>
          <span className="ctrl-label">Top View</span>
        </button>
        <button
          className={`ctrl-btn ${isNight ? "active" : ""}`}
          onClick={toggleDayNight}
        >
          <span className="ctrl-icon">{isNight ? "🌙" : "☀"}</span>
          <span className="ctrl-label">{isNight ? "Night" : "Day"}</span>
        </button>
      </div>

      {/* ═══ PANEL POPUP ═══ */}
      {panel && (
        <Panel
          data={panel}
          onClose={closePanel}
          aiTraffic={aiTraffic}
          powerData={powerData}
          filtrationData={filtrationData}
          foodData={foodData}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PANEL
   ═══════════════════════════════════════════════════════════════ */
function Panel({ data, onClose, aiTraffic, powerData, filtrationData, foodData }) {
  const content = getPanelContent(data, aiTraffic, powerData, filtrationData, foodData);

  return (
    <div className="panel-backdrop" onClick={onClose}>
      <div
        className="panel"
        onClick={(e) => e.stopPropagation()}
        style={{ "--accent": content.color }}
      >
        <div className="panel-header" style={{ background: content.headerBg }}>
          <div className="panel-icon">{content.icon}</div>
          <div className="panel-title-group">
            <div className="panel-title">{content.title}</div>
            <div className="panel-subtitle">{content.subtitle}</div>
          </div>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">{content.body}</div>
      </div>
    </div>
  );
}

function getPanelContent(data, aiTraffic, powerData, filtrationData, foodData) {
  const type = data.type;

  /* ═══════════════ AI TRAFFIC ═══════════════ */
  if (type === "traffic") {
    const stats = aiTraffic.stats || {};
    const roadSignal = (r) => {
      if (aiTraffic.inAllRed) return "red";
      if (aiTraffic.inYellow) {
        return aiTraffic.currentGreenRoads?.includes(r) ? "yellow" : "red";
      }
      return aiTraffic.currentGreenRoads?.includes(r) ? "green" : "red";
    };
    const colorFor = (s) =>
      s === "green" ? "#22ff66" : s === "yellow" ? "#ffcc22" : "#ff2222";

    return {
      icon: "🚦",
      title: "AI Traffic Control Center",
      subtitle: "2-phase adaptive · Real-time signals",
      color: "#22cfff",
      headerBg: "linear-gradient(135deg, #0a2a3a, #04141c)",
      body: (
        <>
          <div className="p-section">
            <div className="p-label">CURRENT PHASE</div>
            <div className="p-big" style={{ color: "#22cfff" }}>
              {aiTraffic.phaseLabel}
            </div>
            <div className="p-progress">
              <div
                className="p-progress-fill"
                style={{
                  width: `${(aiTraffic.phaseProgress || 0) * 100}%`,
                  background: "#22cfff",
                }}
              />
            </div>
            <div className="p-timer">
              Phase timer: {Math.max(0, stats.phaseTimeRemaining || 0).toFixed(1)}s
            </div>
          </div>

          <div className="p-section">
            <div className="p-label">SIGNAL STATE — 4 ROADS</div>
            <div className="signal-grid">
              {[
                { id: 1, name: "North", icon: "⬆️" },
                { id: 2, name: "South", icon: "⬇️" },
                { id: 3, name: "East", icon: "➡️" },
                { id: 4, name: "West", icon: "⬅️" },
              ].map((r) => {
                const sig = roadSignal(r.id);
                const col = colorFor(sig);
                return (
                  <div
                    key={r.id}
                    className="signal-box"
                    style={{ borderColor: col + "60" }}
                  >
                    <div className="signal-icon">{r.icon}</div>
                    <div className="signal-name">{r.name}</div>
                    <div
                      className="signal-light"
                      style={{ background: col, boxShadow: `0 0 16px ${col}` }}
                    />
                    <div className="signal-state" style={{ color: col }}>
                      {sig.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-section">
            <div className="p-label">LIVE STATISTICS</div>
            <div className="stats-grid">
              <StatCard label="Detected" value={stats.vehiclesDetected ?? 0} color="#22cfff" />
              <StatCard label="Moving" value={stats.vehiclesMoving ?? 0} color="#22ff66" />
              <StatCard label="Waiting" value={stats.vehiclesWaiting ?? 0} color="#ffcc22" />
              <StatCard label="Density" value={stats.density ?? "LOW"} color="#ff8888" />
            </div>
          </div>

          <div className="p-section">
            <div className="p-label">AI DECISION LOG</div>
            <div className="log-list">
              {(aiTraffic.decisionLog || []).length === 0 ? (
                <div className="log-empty">Monitoring traffic…</div>
              ) : (
                (aiTraffic.decisionLog || []).slice(0, 6).map((e, i) => (
                  <div
                    key={i}
                    className="log-item"
                    style={{
                      borderLeftColor:
                        e.type === "emergency" ? "#ff4444" :
                        e.type === "phase" ? "#ffcc22" : "#22cfff",
                      color: e.type === "emergency" ? "#ff8888" : "#b8e8ff",
                    }}
                  >
                    {e.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ),
    };
  }

  /* ═══════════════ POWER ═══════════════ */
  if (type === "power") {
    const stages = [
      { name: "Solar Array", value: "42 MW", color: "#ffcc22", icon: "☀️" },
      { name: "Wind Turbines", value: "28 MW", color: "#22cfff", icon: "💨" },
      { name: "Battery Storage", value: "78%", color: "#22ff9d", icon: "🔋" },
      { name: "Grid Distribution", value: "Stable", color: "#ff6b6b", icon: "⚡" },
      { name: "City Load Balance", value: "68 MW", color: "#b266ff", icon: "📊" },
    ];
    const current = powerData?.stage;

    return {
      icon: "⚡",
      title: "Power Supply System",
      subtitle: "Renewable energy · 70 MW total output",
      color: "#ffcc22",
      headerBg: "linear-gradient(135deg, #3a2a0a, #1c1404)",
      body: (
        <>
          {current && (
            <div className="p-section">
              <div className="p-label">CURRENT STAGE</div>
              <div
                className="p-big"
                style={{
                  color: current.color
                    ? `#${current.color.toString(16).padStart(6, "0")}`
                    : "#ffcc22",
                }}
              >
                {current.label}
              </div>
              <div className="p-desc">{current.desc}</div>
              <div className="p-progress" style={{ marginTop: 10 }}>
                <div
                  className="p-progress-fill"
                  style={{
                    width: `${(powerData.progress || 0) * 100}%`,
                    background: "#ffcc22",
                  }}
                />
              </div>
            </div>
          )}

          <div className="p-section">
            <div className="p-label">POWER PIPELINE</div>
            <div className="stage-list">
              {stages.map((s, i) => (
                <div
                  key={i}
                  className="stage-item"
                  style={{ borderColor: s.color + "40" }}
                >
                  <div className="stage-icon">{s.icon}</div>
                  <div className="stage-info">
                    <div className="stage-name">{s.name}</div>
                    <div className="stage-value" style={{ color: s.color }}>
                      {s.value}
                    </div>
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
              <div className="comp-item">🔌 Antenna masts for grid sync</div>
            </div>
          </div>
        </>
      ),
    };
  }

  /* ═══════════════ FILTRATION ═══════════════ */
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
    const current = filtrationData?.stage;

    return {
      icon: "💧",
      title: "Water Filtration System",
      subtitle: "9-stage purification · 99.7% purity",
      color: "#22cfff",
      headerBg: "linear-gradient(135deg, #0a2a4a, #04121c)",
      body: (
        <>
          {current && (
            <div className="p-section">
              <div className="p-label">CURRENT STAGE</div>
              <div
                className="p-big"
                style={{
                  color: current.color
                    ? `#${current.color.toString(16).padStart(6, "0")}`
                    : "#22cfff",
                }}
              >
                {current.label}
              </div>
              <div className="p-desc">{current.desc}</div>
              <div className="p-progress" style={{ marginTop: 10 }}>
                <div
                  className="p-progress-fill"
                  style={{
                    width: `${(filtrationData.progress || 0) * 100}%`,
                    background: "#22cfff",
                  }}
                />
              </div>
            </div>
          )}

          <div className="p-section">
            <div className="p-label">PURIFICATION PIPELINE</div>
            <div className="pipeline">
              {stages.map((s, i) => {
                const isCurrent = current && i === filtrationData.stageIndex;
                const isPast = current && i < filtrationData.stageIndex;
                return (
                  <div key={i} className="pipe-stage">
                    <div
                      className="pipe-dot"
                      style={{
                        background: s.color,
                        boxShadow: isCurrent ? `0 0 16px ${s.color}, 0 0 24px ${s.color}` : `0 0 10px ${s.color}`,
                        transform: isCurrent ? "scale(1.4)" : "scale(1)",
                        transition: "all 0.3s",
                      }}
                    />
                    <div className="pipe-info">
                      <div
                        className="pipe-name"
                        style={{
                          color: isCurrent ? "#fff" : isPast ? "#7fe3ff" : "#8ba5b5",
                          fontWeight: isCurrent ? 800 : 700,
                        }}
                      >
                        Stage {i + 1}: {s.name}
                        {isCurrent && <span className="pipe-active-badge">● ACTIVE</span>}
                        {isPast && <span className="pipe-done-badge">✓ DONE</span>}
                      </div>
                      <div className="pipe-desc">{s.desc}</div>
                    </div>
                  </div>
                );
              })}
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

  /* ═══════════════ FOOD — DETAILED (AI Traffic jaise) ═══════════════ */
  if (type === "food") {
    const currentStage = foodData?.stage;
    const stageIdx = foodData?.stageIndex ?? 0;
    const progress = foodData?.progress ?? 0;

    const stages = [
      { id: "planting", label: "Smart Planting", color: "#2ecc71", icon: "🌱", desc: "9 fields · AI seed placement" },
      { id: "irrigation", label: "Smart Irrigation", color: "#22cfff", icon: "💧", desc: "Sprinklers active · 68% moisture" },
      { id: "monitoring", label: "Drone Monitoring", color: "#ffcc22", icon: "🛸", desc: "3 drones scanning · 94% health" },
      { id: "harvest", label: "Robotic Harvest", color: "#e67e22", icon: "🚜", desc: "Auto-harvesters collecting" },
      { id: "processing", label: "Food Processing", color: "#9b59b6", icon: "🏭", desc: "Washing · cutting · packing" },
      { id: "distribution", label: "City Distribution", color: "#ff6b6b", icon: "🚚", desc: "48 deliveries daily" },
    ];

    // Live stats that change per stage
    const stageStats = {
      planting: { fields: "9", seeds: "720", aiScore: "98%", temp: "24°C" },
      irrigation: { moisture: "68%", waterUse: "12K L", pressure: "2.4 bar", temp: "23°C" },
      monitoring: { drones: "3", cropHealth: "94%", coverage: "100%", temp: "25°C" },
      harvest: { yield: "2.4 T", efficiency: "91%", trucks: "2", temp: "22°C" },
      processing: { items: "1,240", quality: "98%", speed: "180/min", temp: "18°C" },
      distribution: { deliveries: "48", cities: "12", onTime: "99%", temp: "4°C" },
    };
    const stats = stageStats[currentStage?.id] || stageStats.planting;

    return {
      icon: "🍎",
      title: "AI Food Production System",
      subtitle: "6-stage farm-to-city · Fully automated",
      color: "#2ecc71",
      headerBg: "linear-gradient(135deg, #0a3a1e, #041a0e)",
      body: (
        <>
          {/* CURRENT STAGE */}
          <div className="p-section">
            <div className="p-label">CURRENT STAGE</div>
            <div className="p-big" style={{ color: "#2ecc71" }}>
              {currentStage?.label || "Initializing…"}
            </div>
            <div className="p-desc">{currentStage?.desc || "AI food system starting up"}</div>
            <div className="p-progress" style={{ marginTop: 10 }}>
              <div
                className="p-progress-fill"
                style={{
                  width: `${progress * 100}%`,
                  background: "#2ecc71",
                  boxShadow: "0 0 10px #2ecc71",
                }}
              />
            </div>
            <div className="p-timer">
              Stage {stageIdx + 1} of 6 · {Math.round(progress * 100)}% complete
            </div>
          </div>

          {/* PIPELINE */}
          <div className="p-section">
            <div className="p-label">PRODUCTION PIPELINE</div>
            <div className="pipeline">
              {stages.map((s, i) => {
                const isCurrent = i === stageIdx;
                const isPast = i < stageIdx;
                return (
                  <div key={s.id} className="pipe-stage">
                    <div
                      className="pipe-dot"
                      style={{
                        background: s.color,
                        boxShadow: isCurrent
                          ? `0 0 16px ${s.color}, 0 0 24px ${s.color}`
                          : `0 0 10px ${s.color}`,
                        transform: isCurrent ? "scale(1.4)" : "scale(1)",
                        transition: "all 0.3s",
                      }}
                    />
                    <div className="pipe-info">
                      <div
                        className="pipe-name"
                        style={{
                          color: isCurrent ? "#fff" : isPast ? "#7fe3ff" : "#8ba5b5",
                          fontWeight: isCurrent ? 800 : 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 14 }}>{s.icon}</span>
                        <span>{s.label}</span>
                        {isCurrent && <span className="pipe-active-badge">● ACTIVE</span>}
                        {isPast && <span className="pipe-done-badge">✓ DONE</span>}
                      </div>
                      <div className="pipe-desc">{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LIVE STAGE STATS */}
          <div className="p-section">
            <div className="p-label">LIVE STAGE METRICS</div>
            <div className="stats-grid">
              {Object.entries(stats).map(([k, v]) => (
                <StatCard
                  key={k}
                  label={k.replace(/([A-Z])/g, " $1").trim()}
                  value={v}
                  color="#2ecc71"
                />
              ))}
            </div>
          </div>

          {/* FIELD STATUS (9 fields) */}
          <div className="p-section">
            <div className="p-label">FIELD STATUS — 9 FIELDS</div>
            <div className="field-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                const fieldColors = ["#2ecc71", "#27ae60", "#7bc96f"];
                const col = fieldColors[n % 3];
                const health = 85 + (n * 3) % 15;
                return (
                  <div key={n} className="field-box">
                    <div className="field-icon">🌾</div>
                    <div className="field-name">F{n}</div>
                    <div
                      className="field-bar"
                      style={{ width: `${health}%`, background: col }}
                    />
                    <div className="field-value" style={{ color: col }}>
                      {health}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MACHINERY STATUS */}
          <div className="p-section">
            <div className="p-label">MACHINERY STATUS</div>
            <div className="machinery-list">
              <div className="machine-item">
                <span className="machine-icon">🛸</span>
                <span className="machine-name">Drone Fleet</span>
                <span className="machine-status active">3 ACTIVE</span>
              </div>
              <div className="machine-item">
                <span className="machine-icon">💧</span>
                <span className="machine-name">Sprinklers</span>
                <span className="machine-status active">9 ONLINE</span>
              </div>
              <div className="machine-item">
                <span className="machine-icon">⚙️</span>
                <span className="machine-name">Processing Gears</span>
                <span className="machine-status active">RUNNING</span>
              </div>
              <div className="machine-item">
                <span className="machine-icon">🔍</span>
                <span className="machine-name">Quality Scanner</span>
                <span className="machine-status active">ONLINE</span>
              </div>
              <div className="machine-item">
                <span className="machine-icon">📦</span>
                <span className="machine-name">Packaging Line</span>
                <span className="machine-status active">READY</span>
              </div>
              <div className="machine-item">
                <span className="machine-icon">🚚</span>
                <span className="machine-name">Delivery Fleet</span>
                <span className="machine-status active">2 OUT</span>
              </div>
            </div>
          </div>

          {/* SENSOR READINGS */}
          <div className="p-section">
            <div className="p-label">ENVIRONMENTAL SENSORS</div>
            <div className="sensor-row">
              <div className="sensor-chip">
                <span className="sensor-label">🌡️ Temp</span>
                <span className="sensor-value">24°C</span>
              </div>
              <div className="sensor-chip">
                <span className="sensor-label">💧 Humidity</span>
                <span className="sensor-value">68%</span>
              </div>
              <div className="sensor-chip">
                <span className="sensor-label">🌱 Soil pH</span>
                <span className="sensor-value">6.8</span>
              </div>
              <div className="sensor-chip">
                <span className="sensor-label">☀️ Sunlight</span>
                <span className="sensor-value">82%</span>
              </div>
            </div>
          </div>

          {/* DAILY TOTALS */}
          <div className="p-section">
            <div className="p-label">DAILY TOTALS</div>
            <div className="stats-grid">
              <StatCard label="Crop Yield" value="2.4 T" color="#2ecc71" />
              <StatCard label="Deliveries" value="48" color="#ffcc22" />
              <StatCard label="Quality Score" value="98%" color="#22ff66" />
              <StatCard label="Water Used" value="12K L" color="#22cfff" />
            </div>
          </div>
        </>
      ),
    };
  }

  /* ═══════════════ DEFAULT BUILDING ═══════════════ */
  return {
    icon: "🏢",
    title: data.name || "Smart Building",
    subtitle: data.type ? data.type.toUpperCase() : "LOCATION",
    color: "#22cfff",
    headerBg: "linear-gradient(135deg, #0a2a4a, #04121c)",
    body: (
      <div className="p-section">
        <p style={{ color: "#b8e8ff", lineHeight: 1.6, fontSize: 13 }}>
          This smart building is part of the BSS WORLD city network. Use the
          system cards on the right to explore detailed operations of AI
          Traffic, Power, Filtration and Food systems.
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
