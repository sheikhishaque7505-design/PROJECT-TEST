import React, { useState, useRef, useEffect } from "react";
import SmartCity3D from "./SmartCity3D.jsx";
import "./ui.css";

export default function App() {
  const [panel, setPanel] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [isNight, setIsNight] = useState(false);
  const [aiTraffic, setAiTraffic] = useState({
    phaseLabel: "NORTH-SOUTH GREEN",
    phaseProgress: 0,
    inYellow: false,
    inAllRed: false,
    currentGreenRoads: [1, 2],
    stats: { vehiclesMoving: 0, vehiclesWaiting: 0, density: "LOW" },
    decisionLog: [],
  });

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
        const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
        chunksRef.current = [];
        rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        rec.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `smartcity-${Date.now()}.webm`;
          a.click(); URL.revokeObjectURL(url);
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
    if (aiTraffic.inYellow) return aiTraffic.currentGreenRoads?.includes(r) ? "yellow" : "red";
    return aiTraffic.currentGreenRoads?.includes(r) ? "green" : "red";
  };

  const sigColor = (s) => s === "green" ? "#22ff66" : s === "yellow" ? "#ffcc22" : "#ff2222";

  return (
    <div className="app">
      <SmartCity3D
        ref={cityRef}
        onPanel={setPanel}
        onAITrafficUpdate={setAiTraffic}
      />

      {/* TOP BAR */}
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">🏙</div>
          <div>
            <div className="brand-name">BSS WORLD</div>
            <div className="brand-sub">Smart City Control</div>
          </div>
        </div>
        <div className="topbar-center">
          <div className="sys-pill">
            <span className="pill-dot" style={{ background: sigColor(getRoadSignal(1)) }} />
            <span className="pill-label">AI TRAFFIC:</span>
            <span className="pill-phase">{aiTraffic.phaseLabel}</span>
          </div>
        </div>
        <div className="topbar-right">
          <button className={`rec-btn ${recording ? "on" : ""}`} onClick={toggleRecording}>
            <span className={`rec-dot ${recording ? "on" : ""}`} />
            <span>{recording ? fmt(recTime) : "REC"}</span>
          </button>
        </div>
      </div>

      {/* SYSTEM CARDS */}
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
            <div className="card-sub">6-stage production</div>
          </div>
          <div className="card-arrow">›</div>
        </button>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="bottom-controls">
        <button className="ctrl-btn" onClick={() => cityRef.current?.goToOverview?.()}>
          <span className="ctrl-icon">🏠</span>
          <span className="ctrl-label">Overview</span>
        </button>
        <button className="ctrl-btn" onClick={() => cityRef.current?.goToTopDown?.()}>
          <span className="ctrl-icon">🛰</span>
          <span className="ctrl-label">Top View</span>
        </button>
        <button className={`ctrl-btn ${isNight ? "active" : ""}`} onClick={toggleDayNight}>
          <span className="ctrl-icon">{isNight ? "🌙" : "☀"}</span>
          <span className="ctrl-label">{isNight ? "Night" : "Day"}</span>
        </button>
      </div>

      {/* PANEL */}
      {panel && (
        <div className="panel-backdrop" onClick={() => setPanel(null)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <div className="panel-icon">
                {panel.type === "traffic" && "🚦"}
                {panel.type === "power" && "⚡"}
                {panel.type === "filtration" && "💧"}
                {panel.type === "food" && "🍎"}
                {!["traffic", "power", "filtration", "food"].includes(panel.type) && "🏢"}
              </div>
              <div className="panel-title-group">
                <div className="panel-title">
                  {panel.type === "traffic" && "AI Traffic Control Center"}
                  {panel.type === "power" && "Power Supply System"}
                  {panel.type === "filtration" && "Water Filtration System"}
                  {panel.type === "food" && "AI Food Production"}
                  {!["traffic", "power", "filtration", "food"].includes(panel.type) && (panel.name || "Building")}
                </div>
                <div className="panel-subtitle">{panel.type.toUpperCase()}</div>
              </div>
              <button className="panel-close" onClick={() => setPanel(null)}>✕</button>
            </div>
            <div className="panel-body">
              {panel.type === "traffic" && (
                <>
                  <div className="p-section">
                    <div className="p-label">CURRENT PHASE</div>
                    <div className="p-big">{aiTraffic.phaseLabel}</div>
                    <div className="p-progress"><div className="p-progress-fill" style={{ width: `${(aiTraffic.phaseProgress || 0) * 100}%`, background: "#22cfff" }} /></div>
                  </div>
                  <div className="p-section">
                    <div className="p-label">SIGNAL STATE — 4 ROADS</div>
                    <div className="signal-grid">
                      {[1, 2, 3, 4].map((r) => {
                        const sig = getRoadSignal(r);
                        const col = sigColor(sig);
                        return (
                          <div key={r} className="signal-box" style={{ borderColor: col + "60" }}>
                            <div className="signal-name">Road {r}</div>
                            <div className="signal-light" style={{ background: col, boxShadow: `0 0 16px ${col}` }} />
                            <div className="signal-state" style={{ color: col }}>{sig.toUpperCase()}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              {panel.type === "power" && (
                <p style={{ color: "#b8e8ff", lineHeight: 1.6 }}>
                  ⚡ Renewable energy zone: 16 wind turbines, 10 solar arrays, 10 battery banks.
                  Total output: 70 MW. Grid status: Stable.
                </p>
              )}
              {panel.type === "filtration" && (
                <p style={{ color: "#b8e8ff", lineHeight: 1.6 }}>
                  💧 9-stage water purification. Processed: 12M L/day. Purity: 99.7%. Recycle rate: 82%.
                </p>
              )}
              {panel.type === "food" && (
                <p style={{ color: "#b8e8ff", lineHeight: 1.6 }}>
                  🍎 AI Food Production: 9 farming plots, drone monitoring, automated processing.
                  Daily yield: 2.4 tons. Deliveries: 48/day.
                </p>
              )}
              {!["traffic", "power", "filtration", "food"].includes(panel.type) && (
                <p style={{ color: "#b8e8ff", lineHeight: 1.6 }}>
                  Smart building part of BSS WORLD network. Click system cards on the right to explore details.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
