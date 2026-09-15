import React, { useState, useEffect, useRef, useCallback } from "react";
import SmartCity3D from "./SmartCity3D.jsx";
import "./ui.css";

export default function App() {
  const [isNight, setIsNight] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState(null);
  const [camIndicator, setCamIndicator] = useState(null);
  const [locations, setLocations] = useState([]);
  const [liveTrafficMode, setLiveTrafficMode] = useState(false);

  const [showTraffic, setShowTraffic] = useState(true);
  const [showPower, setShowPower] = useState(false);
  const [showFiltration, setShowFiltration] = useState(false);
  const [showFood, setShowFood] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);

  const [aiTraffic, setAiTraffic] = useState({
    phase: 1, inYellow: false, inPedestrian: false, inAllRed: false,
    currentGreenRoads: [1, 2], currentRedRoads: [3, 4],
    phaseProgress: 0, phaseLabel: "Initializing…",
    stats: { vehiclesDetected: 80, vehiclesMoving: 40, vehiclesWaiting: 40, density: "HIGH" },
    roadQueues: { 1: 0, 2: 0, 3: 0, 4: 0 },
    decisionLog: [],
  });

  const [powerData, setPowerData] = useState(null);
  const [filtrationData, setFiltrationData] = useState(null);
  const [foodData, setFoodData] = useState(null);

  const cityRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setRecTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (cityRef.current?.getLocations) {
        const locs = cityRef.current.getLocations();
        if (locs?.length) setLocations(locs);
      }
    }, 200);
    return () => clearTimeout(t);
  }, []);

  const handleToggleRecording = () => {
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
          a.href = url; a.download = `smartcity-${Date.now()}.webm`;
          a.click(); URL.revokeObjectURL(url);
        };
        rec.start(1000);
        mediaRecorderRef.current = rec;
        setRecTime(0);
        setRecording(true);
      } catch (e) { console.error(e); }
    } else {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
      setRecording(false);
    }
  };

  const handleCameraSelect = (key, camName) => {
    setLiveTrafficMode(false);
    setMenuOpen(false);
    cityRef.current?.goToLocationCamera?.(key, camName, (label) => {
      setCamIndicator({ text: `🔒 ${label} — ${camName}` });
    });
  };

  const handleLocationClick = (key) => {
    setLiveTrafficMode(false);
    setMenuOpen(false);
    cityRef.current?.goToLocation?.(key, (label) => {
      setCamIndicator({ text: `🔒 ${label.toUpperCase()}` });
    });
  };

  const handleFollowVehicle = (key) => {
    setLiveTrafficMode(false);
    setMenuOpen(false);
    cityRef.current?.followVehicle?.(key, (text) => setCamIndicator({ text }));
  };

  const handleOverview = () => {
    setLiveTrafficMode(false);
    setMenuOpen(false);
    setCamIndicator(null);
    cityRef.current?.goToOverview?.();
  };

  const handleTopDown = () => {
    setLiveTrafficMode(false);
    setMenuOpen(false);
    setCamIndicator(null);
    cityRef.current?.goToTopDown?.();
  };

  const handleExitCamera = () => {
    setCamIndicator(null);
    setLiveTrafficMode(false);
    cityRef.current?.exitCameraView?.();
  };

  const handleToggleDayNight = () => {
    const next = !isNight;
    setIsNight(next);
    cityRef.current?.setDayNight?.(next);
  };

  const handleViewLiveTraffic = () => {
    setMenuOpen(false);
    setLiveTrafficMode(true);
    setCamIndicator({ text: "🔴 LIVE TRAFFIC" });
    cityRef.current?.goToLiveTraffic?.();
  };

  const handleBackToCity = () => {
    setLiveTrafficMode(false);
    setCamIndicator(null);
    cityRef.current?.goToOverview?.();
  };

  const formatRecTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const getRoadSignal = (r) => {
    if (aiTraffic.inPedestrian || aiTraffic.inAllRed) return "ped";
    if (aiTraffic.inYellow) return aiTraffic.currentGreenRoads?.includes(r) ? "yellow" : "red";
    return aiTraffic.currentGreenRoads?.includes(r) ? "green" : "red";
  };
  const getSignalColor = (s) => s === "green" ? "#22ff66" : s === "yellow" ? "#ffcc22" : s === "ped" ? "#ffdd57" : "#ff2222";

  return (
    <div className="app-root">
      <SmartCity3D
        ref={cityRef}
        onPanel={setPanel}
        onAITrafficUpdate={setAiTraffic}
        onPowerUpdate={setPowerData}
        onFiltrationUpdate={setFiltrationData}
        onFoodUpdate={setFoodData}
      />

      {/* BRAND */}
      <div className="ui-brand">
        <div className="title">BSS WORLD</div>
        <div className="sub">3D SMART CITY</div>
      </div>

      {/* RECORDING BAR */}
      <div style={{ position: "fixed", top: 16, left: 16, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, background: "rgba(5,10,18,0.85)", border: "1px solid rgba(34,207,255,0.4)", borderRadius: 10, padding: "8px 14px", fontFamily: "system-ui" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: recording ? "#ff3b3b" : "#3bff7a", boxShadow: recording ? "0 0 12px #ff3b3b" : "0 0 8px #3bff7a" }} />
        <span style={{ color: "#cfe9f5", fontSize: 12, fontWeight: 700 }}>{recording ? "REC" : "LIVE"}</span>
        <span style={{ color: "#7fe3ff", fontSize: 12, fontVariantNumeric: "tabular-nums", minWidth: 44 }}>{formatRecTime(recTime)}</span>
        <button onClick={handleToggleRecording} style={{ background: recording ? "rgba(255,59,59,0.2)" : "rgba(34,207,255,0.15)", border: `1px solid ${recording ? "rgba(255,80,80,0.6)" : "rgba(34,207,255,0.5)"}`, color: recording ? "#ff6b6b" : "#22cfff", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{recording ? "STOP" : "REC"}</button>
      </div>

      {/* SYSTEM BUTTONS */}
      <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", gap: 8, fontFamily: "system-ui" }}>
        <SysBtn label="🚦 TRAFFIC" active={showTraffic} onClick={() => setShowTraffic(v => !v)} color="#22cfff" />
        <SysBtn label="⚡ POWER" active={showPower} onClick={() => setShowPower(v => !v)} color="#ffcc22" />
        <SysBtn label="💧 WATER" active={showFiltration} onClick={() => setShowFiltration(v => !v)} color="#22cfff" />
        <SysBtn label="🍎 FOOD" active={showFood} onClick={() => setShowFood(v => !v)} color="#2ecc71" />
      </div>

      {/* DAY/NIGHT */}
      <button className={`day-night-btn ${isNight ? "night" : ""}`} onClick={handleToggleDayNight}>
        {isNight ? "🌙 NIGHT" : "☀ DAY"}
      </button>

      {/* LIVE TRAFFIC */}
      {!liveTrafficMode && (
        <button className="live-traffic-btn" onClick={handleViewLiveTraffic}>
          <span className="live-dot"></span>
          <span>VIEW LIVE TRAFFIC</span>
        </button>
      )}
      {liveTrafficMode && (
        <button className="back-to-city-btn" onClick={handleBackToCity}>← BACK</button>
      )}

      {/* CAMERA INDICATOR */}
      {camIndicator && !liveTrafficMode && (
        <div className="cam-indicator show">
          <span className="rec"></span>
          <span>{camIndicator.text}</span>
          <button className="cam-btn" onClick={handleExitCamera}>✕ EXIT</button>
        </div>
      )}

      {/* TRAFFIC PANEL */}
      {showTraffic && !liveTrafficMode && (
        <div className="filtration-panel" style={{ right: "auto", left: 24 }}>
          <button className="close-x-btn" onClick={() => setShowTraffic(false)}>✕</button>
          <div className="fp-title">🤖 AI TRAFFIC</div>
          <div className="fp-stage-label">CURRENT PHASE</div>
          <div className="fp-stage-name">{aiTraffic.phaseLabel || "—"}</div>
          <div className="fp-meter-row"><span>Progress</span><span>{Math.round((aiTraffic.phaseProgress || 0) * 100)}%</span></div>
          <div className="fp-meter"><div className="fp-meter-fill" style={{ width: `${(aiTraffic.phaseProgress || 0) * 100}%`, background: "#22cfff" }} /></div>
          <div className="fp-meter-row" style={{ marginTop: 8 }}><span>Moving</span><span style={{ color: "#3bff7a", fontWeight: 700 }}>{aiTraffic.stats?.vehiclesMoving ?? 0}</span></div>
          <div className="fp-meter-row"><span>Waiting</span><span style={{ color: "#ffcc22", fontWeight: 700 }}>{aiTraffic.stats?.vehiclesWaiting ?? 0}</span></div>
          <div className="fp-stages-list" style={{ marginTop: 10 }}>
            {[1, 2, 3, 4].map(r => {
              const sig = getRoadSignal(r);
              const col = getSignalColor(sig);
              return (
                <div key={r} className="fp-stage-item active" style={{ borderColor: col }}>
                  <span className="fp-dot" style={{ background: col, boxShadow: `0 0 8px ${col}` }} />
                  <span>ROAD {r} — {sig.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SYSTEM PANELS */}
      {showPower && powerData?.stage && !liveTrafficMode && (
        <SysPanel title="⚡ POWER SUPPLY" color="#ffcc22" data={powerData} onClose={() => setShowPower(false)}
          extras={[["☀️ Solar", "42 MW"], ["💨 Wind", "28 MW"], ["🔋 Batteries", "78%"], ["⚡ Output", "70 MW"]]} />
      )}
      {showFiltration && filtrationData?.stage && !liveTrafficMode && (
        <SysPanel title="💧 WATER FILTRATION" color="#22cfff" data={filtrationData} onClose={() => setShowFiltration(false)} left
          extras={[["💧 Processed", "12M L/day"], ["🧪 Purity", "99.7%"], ["🔬 Sensors", "24"], ["♻️ Recycle", "82%"]]} />
      )}
      {showFood && foodData?.stage && !liveTrafficMode && (
        <SysPanel title="🍎 FOOD PRODUCTION" color="#2ecc71" data={foodData} onClose={() => setShowFood(false)}
          extras={[["🌾 Crops", "9 fields"], ["🚚 Deliveries", "48/day"], ["🍎 Quality", "98%"], ["🤖 AI", "Active"]]} />
      )}

      {/* LIVE TRAFFIC PANEL */}
      {liveTrafficMode && (
        <div className="live-traffic-panel">
          <button className="close-x-btn" onClick={handleBackToCity}>✕</button>
          <div className="ltp-header">
            <div className="ai-dot"></div>
            <div>
              <div className="ltp-title">AI TRAFFIC MONITORING</div>
              <div className="ltp-status">STATUS: <span className="active-txt">ACTIVE</span></div>
            </div>
          </div>
          <div className="ltp-signals-title">CURRENT SIGNAL STATE</div>
          <div className="ltp-signal-grid">
            {[1, 2, 3, 4].map((roadId) => {
              const sig = getRoadSignal(roadId);
              const col = getSignalColor(sig);
              return (
                <div key={roadId} className={`ltp-signal-box ${sig}`}>
                  <div className="ltp-road-name">ROAD {roadId}</div>
                  <div className="ltp-light" style={{ background: col, boxShadow: `0 0 20px ${col}` }}></div>
                  <div className="ltp-state" style={{ color: col }}>{sig.toUpperCase()}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INFO PANEL */}
      {panel && (
        <div className="panel">
          <button className="close" onClick={() => setPanel(null)}>×</button>
          <h2>{panel.title}</h2>
          <div className="type">{panel.type}</div>
          <p>{panel.text}</p>
        </div>
      )}

      {/* MENU BUTTON */}
      <button className="menu-btn" onClick={() => setMenuOpen(v => !v)}>
        <span className="icon">☰</span>
        <span>SMART CITY MENU</span>
      </button>

      {/* MAIN MENU */}
      <div className={`main-menu ${menuOpen ? "open" : ""}`}>
        <div className="menu-header">
          <div className="menu-title">🏙 SMART CITY</div>
          <button className="close-btn" onClick={() => setMenuOpen(false)}>×</button>
        </div>

        <div className="menu-sub">🏛 LOCATIONS</div>
        <div className="menu-list">
          {locations.length === 0 ? (
            <div className="menu-item" style={{ opacity: 0.5 }}>
              <span className="m-icon">⏳</span>
              <span className="m-label">Loading…</span>
            </div>
          ) : locations.map((loc) => (
            <LocationItem key={loc.key} loc={loc} onCameraClick={handleCameraSelect} onLocationClick={handleLocationClick} />
          ))}
        </div>

        <div className="menu-sub">🚗 VEHICLES</div>
        <div className="menu-list">
          {[
            { key: "garbage", label: "Garbage Truck", icon: "🚛" },
            { key: "fert", label: "Fertilizer Truck", icon: "🌱" },
          ].map((v) => (
            <div key={v.key} className="menu-item" onClick={() => handleFollowVehicle(v.key)}>
              <span className="m-icon">{v.icon}</span>
              <span className="m-label">{v.label}</span>
            </div>
          ))}
        </div>

        <div className="menu-sub">🌍 CITY VIEW</div>
        <div className="menu-list">
          <div className="menu-item" onClick={handleViewLiveTraffic}>
            <span className="m-icon">🔴</span><span className="m-label">VIEW LIVE TRAFFIC</span>
          </div>
          <div className="menu-item" onClick={handleOverview}>
            <span className="m-icon">🌐</span><span className="m-label">360° CITY OVERVIEW</span>
          </div>
          <div className="menu-item" onClick={handleTopDown}>
            <span className="m-icon">🛰</span><span className="m-label">TOP-DOWN VIEW</span>
          </div>
        </div>

        <div className="menu-sub">📊 SYSTEM PANELS</div>
        <div className="menu-list">
          {[
            { label: "AI Traffic", icon: "🚦", val: showTraffic, set: setShowTraffic },
            { label: "Power Supply", icon: "⚡", val: showPower, set: setShowPower },
            { label: "Water Filtration", icon: "💧", val: showFiltration, set: setShowFiltration },
            { label: "Food Production", icon: "🍎", val: showFood, set: setShowFood },
          ].map((p) => (
            <div key={p.label} className={`menu-item ${p.val ? "active" : ""}`} onClick={() => p.set(v => !v)}>
              <span className="m-icon">{p.icon}</span>
              <span className="m-label">{p.label}</span>
              <span className="arrow">{p.val ? "ON" : "OFF"}</span>
            </div>
          ))}
        </div>
      </div>
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
              <span className="cam-icon">{cam.top ? "🔭" : "📹"}</span>
              <span>{cam.name}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function SysBtn({ label, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 14px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
      borderRadius: 8, cursor: "pointer",
      background: active ? `${color}25` : "rgba(5,12,22,0.85)",
      border: `1.5px solid ${active ? color : "rgba(255,255,255,0.15)"}`,
      color: active ? color : "#7fe3ff",
      boxShadow: active ? `0 0 14px ${color}80` : "none",
      transition: "all 0.2s",
    }}>{label}</button>
  );
}

function SysPanel({ title, color, data, onClose, extras = [], left }) {
  if (!data?.stage) return null;
  const stages = data.allStages || [];
  const progress = data.progress || 0;
  const pct = ((data.stageIndex + progress) / stages.length) * 100;

  return (
    <div className="filtration-panel" style={{ [left ? "left" : "right"]: 24, [left ? "right" : "left"]: "auto" }}>
      <button className="close-x-btn" onClick={onClose}>✕</button>
      <div className="fp-title" style={{ color }}>{title}</div>
      <div className="fp-stage-label">CURRENT STAGE</div>
      <div className="fp-stage-name">{data.stage.label}</div>
      <div className="fp-meter-row"><span>Overall</span><span style={{ color, fontWeight: 700 }}>{Math.round(pct)}%</span></div>
      <div className="fp-meter"><div className="fp-meter-fill" style={{ width: `${pct}%`, background: color }} /></div>
      <div className="fp-meter-row" style={{ marginTop: 8 }}><span>Stage</span><span>{Math.round(progress * 100)}%</span></div>
      <div className="fp-meter"><div className="fp-meter-fill" style={{ width: `${progress * 100}%`, background: "#fff", opacity: 0.7 }} /></div>
      {extras.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginTop: 10 }}>
          {extras.map(([l, v], i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}25`, borderRadius: 5, padding: "5px 7px" }}>
              <div style={{ fontSize: 9, color: "#8fd8f0" }}>{l}</div>
              <div style={{ fontSize: 11, color, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      )}
      <div className="fp-stage-label" style={{ marginTop: 10 }}>PIPELINE</div>
      <div className="fp-stages-list">
        {stages.map((st, i) => {
          const done = i < data.stageIndex;
          const active = i === data.stageIndex;
          return (
            <div key={st.id} className={`fp-stage-item ${done ? "done" : active ? "active" : ""}`}>
              <span className="fp-dot" />
              <span>{st.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
