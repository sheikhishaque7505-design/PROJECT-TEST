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

  const [traffic, setTraffic] = useState({
    state: "TRAFFIC NORMAL",
    stateColor: "#63ddff",
    reason: "4-SITE NETWORK OPERATING NORMALLY",
    level: "NORMAL",
    flow: "92%",
    mode: "MONITORING",
    incident: "<span>LIVE:</span> Traffic flowing normally",
  });

  const [simTime, setSimTime] = useState("00:00");
  const [cycleLabel, setCycleLabel] = useState("NEXT TRAFFIC EVENT IN");
  const [cyclePct, setCyclePct] = useState(0);
  const [cycleVisible, setCycleVisible] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [aiMsgVisible, setAiMsgVisible] = useState(false);
  const [aiReason, setAiReason] = useState({ visible: false, title: "AI ACTION LOG", text: "", result: "" });
  const [showAiBtn, setShowAiBtn] = useState(false);
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
    setTimeout(() => setAiMsgVisible(false), 4000);
  }, []);

  const showTouristMessage = useCallback((msg) => {
    setTouristMsg(msg);
    setTouristMsgVisible(true);
    setTimeout(() => setTouristMsgVisible(false), 1000);
  }, []);

  const handleToggleMenu = () => setMenuOpen((v) => !v);

  const handleCameraSelect = (key, camName) => {
    setLiveTrafficMode(false);
    setMenuOpen(false);
    cityRef.current?.goToLocationCamera?.(key, camName, (label) => {
      setCamIndicator({ text: `🔒 ${label.toUpperCase()} — ${camName}` });
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
    setCamIndicator({ text: "🔴 LIVE TRAFFIC — MONITORING" });
    cityRef.current?.goToLiveTraffic?.();
  };

  const handleBackToCity = () => {
    setLiveTrafficMode(false);
    setCamIndicator(null);
    cityRef.current?.goToOverview?.();
  };

  const closeAiReason = () => {
    setAiReason((v) => ({ ...v, visible: false }));
    setShowAiBtn(true);
  };

  const reopenAiReason = () => {
    setAiReason((v) => ({ ...v, visible: true }));
    setShowAiBtn(false);
  };

  return (
    <div className="app-root">
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
        onAiMessage={showAiMessage}
        onAiReason={(data) => {
          setAiReason(data);
          setShowAiBtn(!data.visible);
        }}
        onTouristMessage={showTouristMessage}
      />

      <div className="ui-brand">
        <div className="title">BSS WORLD</div>
        <div className="sub">3D SMART CITY • BEACONHOUSE SCHOOL SYSTEM</div>
      </div>

      <button
        className={`day-night-btn ${isNight ? "night" : ""}`}
        onClick={handleToggleDayNight}
      >
        {isNight ? "🌙 NIGHT" : "☀ DAY"}
      </button>

      {!liveTrafficMode && (
        <button className="live-traffic-btn" onClick={handleViewLiveTraffic}>
          <span className="live-dot"></span>
          <span>VIEW LIVE TRAFFIC</span>
        </button>
      )}

      {liveTrafficMode && (
        <button className="back-to-city-btn" onClick={handleBackToCity}>
          <span>← BACK TO CITY</span>
        </button>
      )}

      {camIndicator && !liveTrafficMode && (
        <div className="cam-indicator show">
          <span className="rec"></span>
          <span>{camIndicator.text}</span>
          <button className="cam-btn" onClick={handleExitCamera}>✕ EXIT</button>
        </div>
      )}

      <div className="traffic-status">
        <div className="heading">AI TRAFFIC MANAGEMENT</div>
        <div className="state" style={{ color: traffic.stateColor }}>{traffic.state}</div>
        <div className="incident-reason">{traffic.reason}</div>
        <div className="traffic-info">
          <div className="info-box"><span>SIMULATION</span><strong>{simTime}</strong></div>
          <div className="info-box"><span>TRAFFIC</span><strong>{traffic.level}</strong></div>
          <div className="info-box"><span>FLOW</span><strong>{traffic.flow}</strong></div>
          <div className="info-box"><span>AI MODE</span><strong>{traffic.mode}</strong></div>
        </div>
      </div>

      <div className={`ai-message ${aiMsgVisible ? "show" : ""}`}>{aiMsg}</div>

      {touristMsgVisible && (
        <div className="tourist-message">{touristMsg}</div>
      )}

      <div className="incident-bar" dangerouslySetInnerHTML={{ __html: traffic.incident }} />

      {cycleVisible && !liveTrafficMode && (
        <div className="cycle-bar">
          <div className="label">{cycleLabel}</div>
          <div className="bar"><div className="fill" style={{ width: `${cyclePct}%` }} /></div>
        </div>
      )}

      {aiReason.visible && !liveTrafficMode && (
        <div className="ai-reason">
          <button className="close-reason" onClick={closeAiReason}>×</button>
          <div className="title"><span className="dot"></span><span>{aiReason.title}</span></div>
          <div className="reason" dangerouslySetInnerHTML={{ __html: aiReason.text }} />
          <div className="result" dangerouslySetInnerHTML={{ __html: aiReason.result }} />
        </div>
      )}

      {showAiBtn && !liveTrafficMode && (
        <button className="show-ai-btn" onClick={reopenAiReason}>👁 SHOW AI LOG</button>
      )}

      <button className="menu-btn" onClick={handleToggleMenu}>
        <span className="icon">☰</span>
        <span>SMART CITY MENU</span>
      </button>

      <div className={`main-menu ${menuOpen ? "open" : ""}`}>
        <div className="menu-header">
          <div className="menu-title">🏙 SMART CITY</div>
          <button className="close-btn" onClick={handleToggleMenu}>×</button>
        </div>

        <div className="menu-sub">🏛 LOCATIONS</div>
        <div className="menu-list">
          {locations.length === 0 ? (
            <div className="menu-item" style={{ opacity: 0.5 }}>
              <span className="m-icon">⏳</span>
              <span className="m-label">Loading locations...</span>
            </div>
          ) : (
            locations.map((loc) => (
              <LocationItem
                key={loc.key}
                loc={loc}
                onCameraClick={handleCameraSelect}
                onLocationClick={handleLocationClick}
              />
            ))
          )}
        </div>

        <div className="menu-sub">🚗 VEHICLES</div>
        <div className="menu-list">
          {[
            { key: "cityCars", label: "City Cars Traffic", icon: "🚗" },
            { key: "garbageTruck", label: "Garbage Truck (moving)", icon: "🚛" },
            { key: "fertTruck1", label: "Fertilizer Truck 1", icon: "🌱" },
            { key: "fertTruck2", label: "Fertilizer Truck 2", icon: "🌱" },
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
            <span className="m-icon">🔴</span>
            <span className="m-label">VIEW LIVE TRAFFIC</span>
          </div>
          <div className="menu-item" onClick={handleOverview}>
            <span className="m-icon">🌐</span>
            <span className="m-label">360° CITY OVERVIEW</span>
          </div>
          <div className="menu-item" onClick={handleTopDown}>
            <span className="m-icon">🛰</span>
            <span className="m-label">TOP-DOWN VIEW</span>
          </div>
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

      {!liveTrafficMode && (
        <div className="hint">
          Drag = Rotate &nbsp;|&nbsp; Wheel = Zoom &nbsp;|&nbsp; Click buildings &nbsp;|&nbsp; ☰ Menu
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
            <div key={cam.name} className="cam-option"
              onClick={(e) => { e.stopPropagation(); onCameraClick(loc.key, cam.name); }}>
              <span className="cam-icon">{cam.inside ? "🎯" : cam.top ? "🔭" : "📹"}</span>
              <span>{cam.name}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
