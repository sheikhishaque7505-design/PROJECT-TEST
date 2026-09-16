import React, { useRef, useState, useEffect, useCallback } from "react";
import SmartCity3D, { LOCATIONS, LOCATION_LIVE_DATA } from "./SmartCity3D";

/* ============================================================
   BSS WORLD — 3D SMART CITY 2027
   Beaconhouse School System — Cambridge O Level
   ============================================================ */

const FILTRATION_STAGE_LABELS = [
  { id: "wastewater", label: "WASTEWATER COLLECTION", icon: "🚰" },
  { id: "primary", label: "PRIMARY FILTRATION", icon: "🧽" },
  { id: "biological", label: "BIOLOGICAL TREATMENT", icon: "🦠" },
  { id: "aeration", label: "AERATION", icon: "🫧" },
  { id: "clarification", label: "CLARIFICATION", icon: "🥃" },
  { id: "advanced", label: "ADVANCED FILTRATION", icon: "🧪" },
  { id: "uv", label: "UV PURIFICATION", icon: "☀️" },
  { id: "storage", label: "CLEAN WATER STORAGE", icon: "💧" },
  { id: "recycling", label: "WATER RECYCLING", icon: "♻️" },
];

export default function App() {
  const cityRef = useRef(null);

  // Live state coming from the 3D component
  const [panel, setPanel] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [aiTraffic, setAiTraffic] = useState(null);
  const [simTime, setSimTime] = useState("00:00");
  const [cycleLabel, setCycleLabel] = useState("");
  const [cyclePct, setCyclePct] = useState(0);
  const [cycleVisible, setCycleVisible] = useState(true);
  const [aiMsg, setAiMsg] = useState("");
  const [aiReason, setAiReason] = useState(null);
  const [touristMsg, setTouristMsg] = useState("");
  const [filtration, setFiltration] = useState({ stageIndex: 0, stage: FILTRATION_STAGE_LABELS[0], allStages: FILTRATION_STAGE_LABELS, progress: 0 });

  // UI state
  const [showMenu, setShowMenu] = useState(true);
  const [night, setNight] = useState(false);
  const [activeLocation, setActiveLocation] = useState(null);
  const [showTrafficPanel, setShowTrafficPanel] = useState(true);
  const [showFiltrationPanel, setShowFiltrationPanel] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => setToastVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastVisible]);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
  }, []);

  // Handler: click a location from the menu
  const handleLocationClick = (key) => {
    const loc = LOCATIONS[key];
    if (!loc) return;
    setActiveLocation(key);
    cityRef.current?.goToLocation(key, (label) => showToast(`📡 Navigating to ${label}`));
    setShowMenu(false);
  };

  const handleCameraClick = (key, camName) => {
    const loc = LOCATIONS[key];
    if (!loc) return;
    cityRef.current?.goToLocationCamera(key, camName, (label) => showToast(`🎥 ${label} · ${camName}`));
  };

  const handleOverview = () => {
    cityRef.current?.goToOverview();
    setActiveLocation(null);
    setShowMenu(false);
    showToast("🌐 City overview");
  };

  const handleTopDown = () => {
    cityRef.current?.goToTopDown();
    setActiveLocation(null);
    setShowMenu(false);
    showToast("🗺 Top-down view");
  };

  const handleLiveTraffic = () => {
    cityRef.current?.goToLiveTraffic();
    setActiveLocation("liveTraffic");
    setShowMenu(false);
    setShowTrafficPanel(true);
    showToast("🚦 Live traffic view");
  };

  const handleExitCamera = () => {
    cityRef.current?.exitCameraView();
    setActiveLocation(null);
    showToast("↩️ Camera released");
  };

  const handleFollowTruck = (key, label) => {
    cityRef.current?.followVehicle(key, (txt) => showToast(txt));
  };

  const handleDayNightToggle = () => {
    const next = !night;
    setNight(next);
    cityRef.current?.setDayNight(next);
    showToast(next ? "🌙 Night mode" : "☀️ Day mode");
  };

  // AI traffic panel color
  const trafficColor = aiTraffic?.phase === 1 ? "#ffd15a" : "#67e4ff";
  const isJam = traffic?.state === "TRAFFIC JAM";
  const isCleared = traffic?.state === "TRAFFIC CLEAR";

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", background: "#050a14", fontFamily: "'Segoe UI', 'Poppins', system-ui, sans-serif" }}>
      {/* ============ 3D CANVAS ============ */}
      <SmartCity3D
        ref={cityRef}
        onPanel={setPanel}
        onTrafficUpdate={setTraffic}
        onSimTime={setSimTime}
        onCycleUpdate={(label, pct, visible) => {
          setCycleLabel(label);
          setCyclePct(pct);
          setCycleVisible(visible);
        }}
        onAiMessage={setAiMsg}
        onAiReason={setAiReason}
        onTouristMessage={(msg) => {
          setTouristMsg(msg);
          showToast(`🧳 ${msg}`);
        }}
        onAITrafficUpdate={setAiTraffic}
        onFiltrationUpdate={setFiltration}
      />

      {/* ============ TOP BAR ============ */}
      <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 50, pointerEvents: "none", gap: 12, flexWrap: "wrap" }}>
        {/* Title Card */}
        <div style={{ pointerEvents: "auto", background: "linear-gradient(135deg, rgba(6,20,35,0.95), rgba(12,35,55,0.92))", backdropFilter: "blur(14px)", border: "1px solid rgba(34,207,255,0.55)", borderRadius: 16, padding: "14px 20px", color: "#e0f0ff", boxShadow: "0 8px 40px rgba(0,160,255,0.25)" }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#22cfff", letterSpacing: 1 }}>BSS WORLD · 3D SMART CITY 2027</div>
          <div style={{ fontSize: 10, color: "#7fe3ff", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>Beaconhouse School System · Cambridge O Level</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 9, fontWeight: 700, letterSpacing: 1, background: "rgba(34,207,255,0.15)", border: "1px solid rgba(34,207,255,0.4)", color: "#7fe3ff" }}>🤖 AI TRAFFIC</span>
            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 9, fontWeight: 700, letterSpacing: 1, background: "rgba(46,204,113,0.15)", border: "1px solid rgba(46,204,113,0.4)", color: "#7fe3ff" }}>♻️ SUSTAINABLE</span>
            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 9, fontWeight: 700, letterSpacing: 1, background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.4)", color: "#ffe08a" }}>💧 WATER RECYCLING</span>
          </div>
        </div>

        {/* Top Right — Clock + Day/Night + Menu */}
        <div style={{ pointerEvents: "auto", display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(6,20,35,0.95), rgba(12,35,55,0.92))", backdropFilter: "blur(14px)", border: "1px solid rgba(34,207,255,0.45)", borderRadius: 14, padding: "10px 18px", color: "#fff", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#7fe3ff", letterSpacing: 2, textTransform: "uppercase" }}>Sim Time</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#22cfff", letterSpacing: 1 }}>{simTime}</div>
          </div>
          <button onClick={handleDayNightToggle} style={{ background: night ? "linear-gradient(135deg, rgba(60,30,90,0.95), rgba(30,15,50,0.95))" : "linear-gradient(135deg, rgba(30,90,140,0.95), rgba(15,50,85,0.95))", border: "1px solid rgba(34,207,255,0.45)", borderRadius: 14, padding: "10px 16px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
            {night ? "🌙 NIGHT" : "☀️ DAY"}
          </button>
          <button onClick={() => setShowMenu(v => !v)} style={{ background: "linear-gradient(135deg, rgba(6,20,35,0.95), rgba(12,35,55,0.92))", border: "1px solid rgba(34,207,255,0.55)", borderRadius: 14, padding: "10px 16px", color: "#22cfff", cursor: "pointer", fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>
            {showMenu ? "✕ CLOSE" : "☰ MENU"}
          </button>
        </div>
      </div>

      {/* ============ MAIN MENU ============ */}
      {showMenu && (
        <div style={{ position: "absolute", top: 130, left: 16, width: 340, maxHeight: "calc(100vh - 160px)", overflowY: "auto", zIndex: 60, pointerEvents: "auto", background: "linear-gradient(135deg, rgba(6,20,35,0.96), rgba(12,35,55,0.94))", backdropFilter: "blur(16px)", border: "1px solid rgba(34,207,255,0.5)", borderRadius: 18, padding: 14, boxShadow: "0 10px 50px rgba(0,160,255,0.35)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#22cfff", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>📍 City Districts</div>

          {/* Global buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            <button onClick={handleOverview} style={menuBtnStyle}>🌐 OVERVIEW</button>
            <button onClick={handleTopDown} style={menuBtnStyle}>🗺 TOP DOWN</button>
            <button onClick={handleLiveTraffic} style={{ ...menuBtnStyle, background: "rgba(255,209,90,0.15)", borderColor: "rgba(255,209,90,0.6)", color: "#ffd15a" }}>🚦 LIVE TRAFFIC</button>
            {activeLocation && <button onClick={handleExitCamera} style={{ ...menuBtnStyle, background: "rgba(255,90,90,0.15)", borderColor: "rgba(255,90,90,0.6)", color: "#ff8a8a" }}>↩ RELEASE CAM</button>}
          </div>

          <div style={{ fontSize: 12, fontWeight: 800, color: "#22cfff", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>🏙 Locations</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.values(LOCATIONS).map((loc) => (
              <div key={loc.key} style={{ background: activeLocation === loc.key ? "rgba(34,207,255,0.18)" : "rgba(0,40,70,0.4)", border: `1px solid ${activeLocation === loc.key ? "#22cfff" : "rgba(34,207,255,0.2)"}`, borderRadius: 10, padding: 8, transition: "all 0.2s" }}>
                <button onClick={() => handleLocationClick(loc.key)} style={{ width: "100%", background: "transparent", border: "none", color: "#e0f0ff", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, padding: 4, fontFamily: "inherit" }}>
                  <span style={{ fontSize: 20 }}>{loc.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{loc.label}</div>
                    <div style={{ fontSize: 9, color: "#7fe3ff", letterSpacing: 1, textTransform: "uppercase" }}>{loc.type}</div>
                  </div>
                  <span style={{ fontSize: 10, color: "#22cfff" }}>▶</span>
                </button>
                {activeLocation === loc.key && loc.cameras && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6, paddingTop: 6, borderTop: "1px dashed rgba(34,207,255,0.3)" }}>
                    {loc.cameras.map((cam) => (
                      <button key={cam.name} onClick={() => handleCameraClick(loc.key, cam.name)} style={{ background: "rgba(34,207,255,0.12)", border: "1px solid rgba(34,207,255,0.4)", color: "#7fe3ff", padding: "3px 8px", borderRadius: 6, fontSize: 9, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>{cam.name}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 800, color: "#22cfff", letterSpacing: 2, margin: "14px 0 8px", textTransform: "uppercase" }}>🎥 Follow Vehicles</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button onClick={() => handleFollowTruck("garbageTruck", "Garbage Truck")} style={menuBtnStyle}>♻️ Garbage Truck</button>
            <button onClick={() => handleFollowTruck("fertTruck1", "Fertilizer Truck 1")} style={menuBtnStyle}>🌱 Fert Truck 1</button>
            <button onClick={() => handleFollowTruck("fertTruck2", "Fertilizer Truck 2")} style={menuBtnStyle}>🌱 Fert Truck 2</button>
          </div>

          <div style={{ fontSize: 12, fontWeight: 800, color: "#22cfff", letterSpacing: 2, margin: "14px 0 8px", textTransform: "uppercase" }}>🔧 Panels</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setShowTrafficPanel(v => !v)} style={{ ...menuBtnStyle, background: showTrafficPanel ? "rgba(34,207,255,0.3)" : "rgba(20,60,100,0.6)", color: showTrafficPanel ? "#fff" : "#b0e0ff" }}>{showTrafficPanel ? "✓" : "○"} AI Traffic</button>
            <button onClick={() => setShowFiltrationPanel(v => !v)} style={{ ...menuBtnStyle, background: showFiltrationPanel ? "rgba(34,207,255,0.3)" : "rgba(20,60,100,0.6)", color: showFiltrationPanel ? "#fff" : "#b0e0ff" }}>{showFiltrationPanel ? "✓" : "○"} Filtration</button>
          </div>
        </div>
      )}

      {/* ============ AI TRAFFIC PANEL (top-right) ============ */}
      {showTrafficPanel && !showMenu && (
        <div style={{ position: "absolute", top: 130, right: 16, width: 300, zIndex: 55, pointerEvents: "auto", background: "linear-gradient(135deg, rgba(6,20,35,0.96), rgba(12,35,55,0.94))", backdropFilter: "blur(16px)", border: `1px solid ${isJam ? "#ffd15a" : isCleared ? "#6aff9d" : "#22cfff"}`, borderRadius: 16, padding: 14, color: "#e0f0ff", boxShadow: "0 10px 50px rgba(0,160,255,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#22cfff", textTransform: "uppercase" }}>🚦 AI Traffic Manager</div>
            <button onClick={() => setShowTrafficPanel(false)} style={{ background: "transparent", border: "none", color: "#7fe3ff", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>

          {traffic && (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: traffic.stateColor || "#67e4ff", letterSpacing: 1, margin: "2px 0 6px" }}>{traffic.state}</div>
              <div style={{ fontSize: 10, color: "#8ab8d0", letterSpacing: 0.5, marginBottom: 8 }}>{traffic.reason}</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                <div style={statBoxStyle}><div style={statLabelStyle}>Level</div><div style={statValueStyle}>{traffic.level}</div></div>
                <div style={statBoxStyle}><div style={statLabelStyle}>Flow</div><div style={statValueStyle}>{traffic.flow}</div></div>
                <div style={statBoxStyle}><div style={statLabelStyle}>Mode</div><div style={statValueStyle}>{traffic.mode}</div></div>
                <div style={statBoxStyle}><div style={statLabelStyle}>Sensors</div><div style={statValueStyle}>24 ✓</div></div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                {[1, 2, 3, 4].map((road) => {
                  const green = aiTraffic?.currentGreenRoads?.includes(road);
                  const yellow = aiTraffic?.inYellow;
                  const color = yellow ? "#ffcc22" : green ? "#22ff66" : "#ff2222";
                  return (
                    <div key={road} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                      <span style={{ color: "#a8d0e8" }}>Road {road}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}`, display: "inline-block" }} />
                        <span style={{ color, fontWeight: 700, fontSize: 10, letterSpacing: 1 }}>{yellow ? "YELLOW" : green ? "GREEN" : "RED"}</span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: 10, color: "#8ab8d0", marginBottom: 4 }}>{traffic.incident?.replace(/<[^>]*>/g, "")}</div>

              {cycleVisible && (
                <>
                  <div style={{ fontSize: 10, color: "#7fe3ff", fontWeight: 700, letterSpacing: 1, marginTop: 6 }}>{cycleLabel}</div>
                  <div style={{ width: "100%", height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginTop: 6, overflow: "hidden" }}>
                    <div style={{ width: `${cyclePct}%`, height: "100%", background: "linear-gradient(90deg,#22cfff,#6aff9d)", borderRadius: 4, transition: "width 0.3s linear" }} />
                  </div>
                </>
              )}

              {aiReason?.visible && (
                <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(34,207,255,0.08)", borderLeft: "3px solid #22cfff" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#22cfff", marginBottom: 4 }}>{aiReason.title}</div>
                  <div style={{ fontSize: 10, color: "#a8d0e8", lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: aiReason.text }} />
                  <div style={{ fontSize: 10, color: "#6aff9d", marginTop: 4, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: aiReason.result }} />
                </div>
              )}

              {aiMsg && (
                <div style={{ marginTop: 8, fontSize: 10, color: "#ffd15a", fontWeight: 700, letterSpacing: 0.5 }}>{aiMsg}</div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============ FILTRATION PANEL (bottom-left) ============ */}
      {showFiltrationPanel && (
        <div style={{ position: "absolute", bottom: 16, left: 16, width: 300, zIndex: 55, pointerEvents: "auto", background: "linear-gradient(135deg, rgba(6,20,35,0.96), rgba(12,35,55,0.94))", backdropFilter: "blur(16px)", border: "1px solid rgba(34,207,255,0.5)", borderRadius: 16, padding: 14, color: "#e0f0ff", boxShadow: "0 10px 50px rgba(0,160,255,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#22cfff", textTransform: "uppercase" }}>💧 Water Filtration</div>
            <button onClick={() => setShowFiltrationPanel(false)} style={{ background: "transparent", border: "none", color: "#7fe3ff", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
          <div style={{ fontSize: 10, color: "#8ab8d0", marginBottom: 10, letterSpacing: 0.5 }}>Live process flow · 9 stages</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {FILTRATION_STAGE_LABELS.map((stage, i) => {
              const isActive = i === filtration.stageIndex;
              const isDone = i < filtration.stageIndex;
              return (
                <div key={stage.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", borderRadius: 6, background: isActive ? "rgba(34,207,255,0.18)" : isDone ? "rgba(106,255,157,0.08)" : "transparent", borderLeft: isActive ? "2px solid #22cfff" : isDone ? "2px solid #6aff9d" : "2px solid transparent", transition: "all 0.3s" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? "#22cfff" : isDone ? "#6aff9d" : "#2a4a5a", boxShadow: isActive ? "0 0 8px #22cfff" : isDone ? "0 0 6px #6aff9d" : "none", flexShrink: 0 }} />
                  <span style={{ fontSize: 14 }}>{stage.icon}</span>
                  <span style={{ fontSize: 10, color: isActive ? "#fff" : isDone ? "#a8f0c0" : "#7fa8c0", fontWeight: isActive ? 700 : 500, letterSpacing: 0.5 }}>{stage.label}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(34,207,255,0.08)", borderLeft: "3px solid #22cfff" }}>
            <div style={{ fontSize: 10, color: "#7fe3ff", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Active Stage</div>
            <div style={{ fontSize: 12, color: "#fff", fontWeight: 700, marginTop: 2 }}>{filtration.stage?.label || "—"}</div>
          </div>
        </div>
      )}

      {/* ============ BOTTOM CONTROLS BAR (centre) ============ */}
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 55, pointerEvents: "auto", flexWrap: "wrap", justifyContent: "center", maxWidth: "calc(100vw - 380px)" }}>
        <button onClick={handleOverview} style={bottomBtnStyle}>🌐 OVERVIEW</button>
        <button onClick={handleTopDown} style={bottomBtnStyle}>🗺 TOP DOWN</button>
        <button onClick={handleLiveTraffic} style={{ ...bottomBtnStyle, background: "rgba(255,209,90,0.2)", borderColor: "rgba(255,209,90,0.6)", color: "#ffd15a" }}>🚦 LIVE TRAFFIC</button>
        <button onClick={() => cityRef.current?.goToLocation("filtration")} style={{ ...bottomBtnStyle, background: "rgba(34,207,255,0.2)", borderColor: "rgba(34,207,255,0.7)", color: "#7fe3ff" }}>💧 FILTRATION</button>
        <button onClick={() => cityRef.current?.goToLocation("farm")} style={{ ...bottomBtnStyle, background: "rgba(46,204,113,0.2)", borderColor: "rgba(46,204,113,0.7)", color: "#7fe3ff" }}>🌾 ECO FARM</button>
        <button onClick={() => cityRef.current?.goToLocation("wasteManagement")} style={{ ...bottomBtnStyle, background: "rgba(46,204,113,0.2)", borderColor: "rgba(46,204,113,0.7)", color: "#7fe3ff" }}>♻️ WASTE</button>
      </div>

      {/* ============ LOCATION POPUP (bottom-centre, above controls) ============ */}
      {panel && (
        <div style={{ position: "absolute", bottom: 90, left: "50%", transform: "translateX(-50%)", zIndex: 65, pointerEvents: "auto", background: "linear-gradient(135deg, rgba(6,20,35,0.97), rgba(12,35,55,0.95))", backdropFilter: "blur(16px)", border: "2px solid #22cfff", borderRadius: 16, padding: "14px 22px", color: "#fff", boxShadow: "0 0 50px rgba(34,207,255,0.5)", minWidth: 340, maxWidth: 520 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#22cfff" }}>{panel.title}</div>
              <div style={{ fontSize: 10, color: "#7fe3ff", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>{panel.type}</div>
              <div style={{ fontSize: 11, color: "#b8e8ff", marginTop: 6 }}>{panel.text}</div>
            </div>
            <button onClick={() => setPanel(null)} style={{ background: "transparent", border: "none", color: "#7fe3ff", cursor: "pointer", fontSize: 16, alignSelf: "flex-start" }}>✕</button>
          </div>
        </div>
      )}

      {/* ============ TOAST ============ */}
      {toastVisible && (
        <div style={{ position: "absolute", top: 130, left: "50%", transform: "translateX(-50%)", zIndex: 80, pointerEvents: "none", background: "rgba(6,20,35,0.95)", border: "1px solid #22cfff", borderRadius: 14, padding: "12px 24px", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: 0.5, boxShadow: "0 0 40px rgba(34,207,255,0.5)" }}>
          {toastMsg}
        </div>
      )}

      {/* ============ TOURIST NOTIFICATION ============ */}
      {touristMsg && (
        <div style={{ position: "absolute", top: 90, right: 16, zIndex: 55, background: "rgba(255,209,90,0.15)", border: "1px solid rgba(255,209,90,0.6)", borderRadius: 12, padding: "10px 16px", color: "#ffd15a", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
          🧳 {touristMsg}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   STYLE HELPERS
   ============================================================ */
const menuBtnStyle = {
  background: "rgba(20,60,100,0.6)",
  border: "1px solid rgba(34,207,255,0.45)",
  borderRadius: 8,
  padding: "6px 12px",
  color: "#b0e0ff",
  fontSize: 10,
  fontWeight: 700,
  cursor: "pointer",
  letterSpacing: 0.5,
  textTransform: "uppercase",
  fontFamily: "inherit",
};

const bottomBtnStyle = {
  background: "linear-gradient(135deg, rgba(6,20,35,0.95), rgba(12,35,55,0.92))",
  border: "1px solid rgba(34,207,255,0.55)",
  borderRadius: 12,
  padding: "10px 16px",
  color: "#b0e0ff",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
  letterSpacing: 1,
  textTransform: "uppercase",
  fontFamily: "inherit",
  backdropFilter: "blur(12px)",
  boxShadow: "0 6px 24px rgba(0,160,255,0.25)",
};

const statBoxStyle = {
  background: "rgba(0,40,70,0.5)",
  borderLeft: "2px solid #22cfff",
  borderRadius: 6,
  padding: "4px 8px",
};
const statLabelStyle = { fontSize: 9, color: "#8ab8d0", textTransform: "uppercase", letterSpacing: 0.5 };
const statValueStyle = { fontSize: 12, fontWeight: 700, color: "#fff" };
