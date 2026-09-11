import React, { useState, useEffect, useRef, useCallback } from "react";
import SmartCity3D from "./SmartCity3D.jsx";
import "./ui.css";

export default function App() {
  const [isNight, setIsNight] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState(null);
  const [camIndicator, setCamIndicator] = useState(null);
  const [locations, setLocations] = useState([]);
  const [aiTraffic, setAiTraffic] = useState({
    currentSide: "north",
    currentPhase: "green",
    queueCounts: { north: 0, south: 0, east: 0, west: 0 },
    signals: [
      { side: "north", count: 0, signal: "green" },
      { side: "south", count: 0, signal: "red" },
      { side: "east", count: 0, signal: "red" },
      { side: "west", count: 0, signal: "red" },
    ],
    totalCycles: 0,
    jamEvents: 0,
    aiActions: 0,
    aiHistory: [],
    elapsed: 0,
  });
  const [simTime, setSimTime] = useState("00:00");
  const [cycleLabel, setCycleLabel] = useState("NEXT TRAFFIC EVENT IN");
  const [cyclePct, setCyclePct] = useState(0);
  const [aiMsg, setAiMsg] = useState("");
  const [aiMsgVisible, setAiMsgVisible] = useState(false);
  const [touristMsg, setTouristMsg] = useState("");
  const [touristMsgVisible, setTouristMsgVisible] = useState(false);
  const cityRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (cityRef.current?.getLocations) {
        const locs = cityRef.current.getLocations();
        if (locs?.length) setLocations(locs);
      }
    }, 200);
    return () => clearTimeout(t);
  }, []);

  const showAiMessage = useCallback((msg) => {
    setAiMsg(msg);
    setAiMsgVisible(true);
    setTimeout(() => setAiMsgVisible(false), 3000);
  }, []);

  const showTouristMessage = useCallback((msg) => {
    setTouristMsg(msg);
    setTouristMsgVisible(true);
    setTimeout(() => setTouristMsgVisible(false), 1000);
  }, []);

  const handleToggleMenu = () => setMenuOpen((v) => !v);
  const handleCameraSelect = (key, camName) => {
    setMenuOpen(false);
    cityRef.current?.goToLocationCamera?.(key, camName, (label) => setCamIndicator({ text: `🔒 ${label.toUpperCase()} — ${camName}` }));
  };
  const handleLocationClick = (key) => {
    setMenuOpen(false);
    cityRef.current?.goToLocation?.(key, (label) => setCamIndicator({ text: `🔒 ${label.toUpperCase()}` }));
  };
  const handleFollowVehicle = (key) => {
    setMenuOpen(false);
    cityRef.current?.followVehicle?.(key, (text) => setCamIndicator({ text }));
  };
  const handleOverview = () => { setMenuOpen(false); setCamIndicator(null); cityRef.current?.goToOverview?.(); };
  const handleTopDown = () => { setMenuOpen(false); setCamIndicator(null); cityRef.current?.goToTopDown?.(); };
  const handleExitCamera = () => { setCamIndicator(null); cityRef.current?.exitCameraView?.(); };
  const handleToggleDayNight = () => { const next = !isNight; setIsNight(next); cityRef.current?.setDayNight?.(next); };

  const getSignalColor = (signal) => {
    if (signal === "green") return "#22ff66";
    if (signal === "yellow") return "#ffcc22";
    return "#ff2222";
  };

  return (
    <div className="app-root">
      <SmartCity3D
        ref={cityRef}
        onPanel={setPanel}
        onSimTime={setSimTime}
        onCycleUpdate={(label, pct) => { setCycleLabel(label); setCyclePct(pct); }}
        onAiMessage={showAiMessage}
        onTouristMessage={showTouristMessage}
        onAITrafficUpdate={setAiTraffic}
      />

      <div className="ui-brand">
        <div className="title">BSS WORLD</div>
        <div className="sub">AI-POWERED SMART CITY</div>
      </div>

      <button className={`day-night-btn ${isNight ? "night" : ""}`} onClick={handleToggleDayNight}>
        {isNight ? "🌙 NIGHT" : "☀ DAY"}
      </button>

      {camIndicator && (
        <div className="cam-indicator show">
          <span className="rec"></span>
          <span>{camIndicator.text}</span>
          <button className="cam-btn" onClick={handleExitCamera}>✕ EXIT</button>
        </div>
      )}

      <div className="ai-panel">
        <div className="ai-panel-header">
          <div className="ai-dot"></div>
          <div>
            <div className="ai-title">AI TRAFFIC MONITORING</div>
            <div className="ai-subtitle">AUTONOMOUS SIGNAL CONTROL</div>
          </div>
        </div>

        <div className="signal-grid">
          {["north", "south", "east", "west"].map((side) => {
            const sig = aiTraffic.signals.find(s => s.side === side) || { count: 0, signal: "red" };
            const isActive = aiTraffic.currentSide === side;
            return (
              <div key={side} className={`signal-box ${isActive ? "active" : ""}`}>
                <div className="signal-label">{side.toUpperCase()}</div>
                <div className="signal-light" style={{ background: getSignalColor(sig.signal), boxShadow: `0 0 15px ${getSignalColor(sig.signal)}` }}></div>
                <div className="signal-info">
                  <span className="queue-count">{sig.count}</span>
                  <span className="queue-label">QUEUE</span>
                </div>
                <div className="signal-state" style={{ color: getSignalColor(sig.signal) }}>
                  {sig.signal.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="cycle-bar-new">
          <div className="cycle-label">{cycleLabel}</div>
          <div className="cycle-track"><div className="cycle-fill" style={{ width: `${cyclePct}%` }} /></div>
        </div>

        <div className="ai-stats">
          <div className="stat-box"><span className="stat-value">{simTime}</span><span className="stat-label">TIME</span></div>
          <div className="stat-box"><span className="stat-value">{aiTraffic.totalCycles}</span><span className="stat-label">CYCLES</span></div>
          <div className="stat-box"><span className="stat-value">{aiTraffic.aiActions}</span><span className="stat-label">AI ACTIONS</span></div>
          <div className="stat-box"><span className="stat-value">{aiTraffic.jamEvents}</span><span className="stat-label">JAMS</span></div>
        </div>

        {aiTraffic.aiHistory.length > 0 && (
          <div className="ai-log">
            <div className="ai-log-title">🔵 AI ACTION LOG</div>
            {aiTraffic.aiHistory.slice(0, 3).map((h, i) => (
              <div key={i} className="ai-log-item"><span className="ai-log-time">{h.time}</span><span className="ai-log-text">{h.action}</span></div>
            ))}
          </div>
        )}
      </div>

      <div className={`ai-message ${aiMsgVisible ? "show" : ""}`}>{aiMsg}</div>
      {touristMsgVisible && <div className="tourist-message">{touristMsg}</div>}

      <button className="menu-btn" onClick={handleToggleMenu}>
        <span className="icon">☰</span>
        <span>SMART CITY</span>
      </button>

      <div className={`main-menu ${menuOpen ? "open" : ""}`}>
        <div className="menu-header">
          <div className="menu-title">🏙 SMART CITY</div>
          <button className="close-btn" onClick={handleToggleMenu}>×</button>
        </div>
        <div className="menu-sub">🏛 LOCATIONS</div>
        <div className="menu-list">
          {locations.length === 0 ? (
            <div className="menu-item" style={{ opacity: 0.5 }}><span className="m-icon">⏳</span><span className="m-label">Loading...</span></div>
          ) : (
            locations.map((loc) => (
              <LocationItem key={loc.key} loc={loc} onCameraClick={handleCameraSelect} onLocationClick={handleLocationClick} />
            ))
          )}
        </div>
        <div className="menu-sub">🚗 VEHICLES</div>
        <div className="menu-list">
          {[
            { key: "garbageTruck", label: "Garbage Truck", icon: "🚛" },
            { key: "fertTruck1", label: "Fertilizer Truck 1", icon: "🌱" },
            { key: "fertTruck2", label: "Fertilizer Truck 2", icon: "🌱" },
          ].map((v) => (
            <div key={v.key} className="menu-item" onClick={() => handleFollowVehicle(v.key)}>
              <span className="m-icon">{v.icon}</span><span className="m-label">{v.label}</span>
            </div>
          ))}
        </div>
        <div className="menu-sub">🌍 CITY VIEW</div>
        <div className="menu-list">
          <div className="menu-item" onClick={handleOverview}><span className="m-icon">🌐</span><span className="m-label">360° OVERVIEW</span></div>
          <div className="menu-item" onClick={handleTopDown}><span className="m-icon">🛰</span><span className="m-label">TOP-DOWN VIEW</span></div>
        </div>
      </div>

      {panel && (
        <div className="panel">
          <button className="close" onClick={() => setPanel(null)}>×</button>
          <h2>{panel.title}</h2>
          <div className="type">{panel.type}</div>
          <p>{panel.text}</p>
        </div>
      )}
    </div>
  );
}

function LocationItem({ loc, onCameraClick, onLocationClick }) {
  const [open, setOpen] = useState(false);
  const handleClick = () => {
    const next = !open;
    setOpen(next);
    if (!next) onLocationClick(loc.key);
  };
  return (
    <>
      <div className={`menu-item ${open ? "active" : ""}`} onClick={handleClick}>
        <span className="m-icon">{loc.icon}</span>
        <span className="m-label">{loc.label}</span>
        <span className="arrow">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="camera-options">
          {loc.cameras.map((cam) => (
            <div key={cam.name} className="cam-option" onClick={(e) => { e.stopPropagation(); onCameraClick(loc.key, cam.name); }}>
              <span className="cam-icon">{cam.inside ? "🎯" : cam.top ? "🔭" : "📹"}</span>
              <span>{cam.name}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
