import React, { useRef, useState, useCallback } from "react";
import SmartCity3D from "./SmartCity3D.jsx";

const btn = {
  padding: "8px 12px", margin: "3px", borderRadius: 8,
  background: "linear-gradient(135deg, rgba(34,207,255,0.15), rgba(34,207,255,0.05))",
  border: "1px solid rgba(34,207,255,0.45)", color: "#bfefff",
  fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5,
  textTransform: "uppercase"
};

const panelStyle = {
  position: "fixed",
  background: "linear-gradient(135deg, rgba(6,20,35,0.94), rgba(12,35,55,0.92))",
  border: "1px solid rgba(34,207,255,0.45)",
  borderRadius: 12, padding: "12px 14px", color: "#fff",
  fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 11,
  boxShadow: "0 0 24px rgba(34,207,255,0.25)",
  backdropFilter: "blur(10px)", zIndex: 9999, maxWidth: 280
};

const sectionTitle = {
  fontSize: 10, letterSpacing: 2, color: "#7fe3ff",
  textTransform: "uppercase", fontWeight: 700, marginBottom: 8
};

export default function App() {
  const cityRef = useRef(null);
  const [panel, setPanel] = useState(null);
  const [aiTraffic, setAiTraffic] = useState(null);
  const [simTime, setSimTime] = useState("00:00");
  const [cycle, setCycle] = useState({ label: "", pct: 0, visible: false });
  const [aiReason, setAiReason] = useState({ visible: false, title: "", text: "", result: "" });
  const [notice, setNotice] = useState(null);
  const [filtration, setFiltration] = useState(null);
  const [security, setSecurity] = useState(null);
  const [dayNight, setDayNight] = useState(false);
  const [touristMsg, setTouristMsg] = useState(null);

  const showNotice = useCallback((msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3200);
  }, []);

  const locations = cityRef.current?.getLocations() || [];

  return (
    <>
      <SmartCity3D
        ref={cityRef}
        onPanel={setPanel}
        onSimTime={setSimTime}
        onCycleUpdate={(label, pct, visible) => setCycle({ label, pct, visible })}
        onAiMessage={showNotice}
        onAiReason={setAiReason}
        onTouristMessage={setTouristMsg}
        onAITrafficUpdate={setAiTraffic}
        onFiltrationUpdate={setFiltration}
        onSecurityUpdate={setSecurity}
      />

      {/* TOP BAR */}
      <div style={{
        position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
        background: "linear-gradient(135deg, rgba(6,20,35,0.95), rgba(12,35,55,0.9))",
        border: "1px solid rgba(34,207,255,0.55)", borderRadius: 14,
        padding: "10px 20px", color: "#fff", fontFamily: "system-ui, sans-serif",
        boxShadow: "0 0 40px rgba(34,207,255,0.35)",
        display: "flex", gap: 18, alignItems: "center", zIndex: 9999,
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, color: "#22cfff" }}>🌐 SMART CITY 3D</div>
        <div style={{ width: 1, height: 22, background: "rgba(34,207,255,0.4)" }} />
        <div style={{ fontSize: 11, color: "#7fe3ff" }}>⏱ <b style={{ color: "#fff" }}>{simTime}</b></div>
        <div style={{ width: 1, height: 22, background: "rgba(34,207,255,0.4)" }} />
        <button style={btn} onClick={() => cityRef.current?.goToOverview()}>Overview</button>
        <button style={btn} onClick={() => cityRef.current?.goToTopDown()}>Top</button>
        <button style={btn} onClick={() => cityRef.current?.goToLiveTraffic()}>Live Traffic</button>
        <button style={{ ...btn, borderColor: "#ffd15a", color: "#ffd15a" }}
          onClick={() => { const n = !dayNight; setDayNight(n); cityRef.current?.setDayNight(n); }}>
          {dayNight ? "☀ Day" : "🌙 Night"}
        </button>
      </div>

      {/* LEFT — NAVIGATION */}
      <div style={{ ...panelStyle, top: 90, left: 16, maxHeight: "72vh", overflowY: "auto" }}>
        <div style={sectionTitle}>📍 Navigate</div>
        {locations.map((l) => (
          <button key={l.key} style={{ ...btn, width: "100%", textAlign: "left" }}
            onClick={() => cityRef.current?.goToLocation(l.key, (t) => showNotice("📍 " + t))}>
            {l.icon} {l.label}
          </button>
        ))}
        <div style={{ height: 8 }} />
        <div style={sectionTitle}>🛡️ Security Gates</div>
        {["securitySG01", "securitySG02", "securitySG03", "securitySG04"].map((k) => (
          <button key={k} style={{ ...btn, width: "100%" }}
            onClick={() => cityRef.current?.goToLocation(k, (t) => showNotice("🛡️ " + t))}>
            {k.replace("security", "").toUpperCase()}
          </button>
        ))}
        <div style={{ height: 8 }} />
        <div style={sectionTitle}>🚚 Follow Vehicles</div>
        <button style={{ ...btn, width: "100%" }} onClick={() => cityRef.current?.followVehicle("garbageTruck", showNotice)}>🚛 Garbage</button>
        <button style={{ ...btn, width: "100%" }} onClick={() => cityRef.current?.followVehicle("fertTruck1", showNotice)}>🚚 Fert 1</button>
        <button style={{ ...btn, width: "100%" }} onClick={() => cityRef.current?.followVehicle("fertTruck2", showNotice)}>🚚 Fert 2</button>
      </div>

      {/* RIGHT — TRAFFIC */}
      <div style={{ ...panelStyle, top: 90, right: 16, width: 260 }}>
        <div style={sectionTitle}>🚦 AI Traffic Control</div>
        {aiTraffic ? (
          <>
            <Row k="Phase" v={aiTraffic.phase} />
            <Row k="Green" v={"R" + aiTraffic.currentGreenRoads.join(", R")} color="#6aff9d" />
            <Row k="Red" v={"R" + aiTraffic.currentRedRoads.join(", R")} color="#ff5a5a" />
            <Row k="Density" v={aiTraffic.stats.density}
              color={aiTraffic.stats.density === "HIGH" ? "#ffd15a" : "#6aff9d"} />
            <Row k="Moving / Waiting" v={`${aiTraffic.stats.vehiclesMoving} / ${aiTraffic.stats.vehiclesWaiting}`} />
            <div style={{ marginTop: 6, height: 6, borderRadius: 3, background: "rgba(34,207,255,0.15)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${(aiTraffic.phaseProgress || 0) * 100}%`,
                background: aiTraffic.inYellow ? "linear-gradient(90deg,#ffd15a,#ff8a1f)" : "linear-gradient(90deg,#22cfff,#2ecc71)",
                transition: "width .2s linear"
              }} />
            </div>
          </>
        ) : <div style={{ color: "#7fe3ff" }}>Initializing…</div>}
      </div>

      {/* SECURITY HUD */}
      {security && (
        <div style={{ ...panelStyle, bottom: 24, right: 16, width: 260 }}>
          <div style={sectionTitle}>🛡️ Security Gates</div>
          {security.gates.map((g) => (
            <div key={g.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(34,207,255,0.12)" }}>
              <span style={{ color: "#b8e8ff" }}>{g.id}</span>
              <span style={{ color: g.status === "CLOSED" ? "#ff8a1f" : "#6aff9d", fontWeight: 700 }}>
                {g.status} · {g.vehiclesWaiting}q
              </span>
            </div>
          ))}
          <div style={{ marginTop: 6, fontSize: 10, color: "#7fe3ff", letterSpacing: 1.2 }}>PHASE: {security.phase} · ACTIVE</div>
        </div>
      )}

      {/* FILTRATION */}
      {filtration && (
        <div style={{ ...panelStyle, bottom: 24, left: 16, width: 280 }}>
          <div style={sectionTitle}>💧 Filtration System</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#22cfff", marginBottom: 6 }}>{filtration.stage?.label}</div>
          <div style={{ fontSize: 10, color: "#7fe3ff", marginBottom: 6 }}>
            STAGE {filtration.stageIndex + 1} / {filtration.allStages.length}
          </div>
          <div style={{ height: 5, borderRadius: 3, background: "rgba(34,207,255,0.15)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${((filtration.stageIndex + (filtration.progress || 0)) / filtration.allStages.length) * 100}%`,
              background: "linear-gradient(90deg,#22cfff,#2ecc71)", transition: "width .3s"
            }} />
          </div>
        </div>
      )}

      {/* CYCLE */}
      {cycle.visible && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, rgba(6,20,35,0.95), rgba(12,35,55,0.9))",
          border: "1px solid rgba(34,207,255,0.5)", borderRadius: 12,
          padding: "10px 20px", color: "#fff", fontFamily: "system-ui, sans-serif",
          zIndex: 9999, minWidth: 320, backdropFilter: "blur(10px)"
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{cycle.label}</div>
          <div style={{ height: 5, borderRadius: 3, background: "rgba(34,207,255,0.15)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${cycle.pct}%`, background: "linear-gradient(90deg,#22cfff,#ffd15a)" }} />
          </div>
        </div>
      )}

      {/* AI REASON */}
      {aiReason.visible && (
        <div style={{ ...panelStyle, top: 90, left: "50%", transform: "translateX(-50%)", maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#22cfff", marginBottom: 6 }}>{aiReason.title}</div>
          <div style={{ fontSize: 12, color: "#b8e8ff", marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: aiReason.text }} />
          <div style={{ fontSize: 11, color: "#6aff9d" }} dangerouslySetInnerHTML={{ __html: aiReason.result }} />
        </div>
      )}

      {/* NOTICE */}
      {notice && (
        <div style={{
          position: "fixed", top: 76, right: 16,
          background: "linear-gradient(135deg, rgba(6,20,35,0.95), rgba(12,35,55,0.9))",
          border: "1px solid rgba(34,207,255,0.55)", borderRadius: 10,
          padding: "10px 16px", color: "#bfefff", fontSize: 12, fontWeight: 700,
          zIndex: 10000, backdropFilter: "blur(10px)", animation: "slideIn .3s ease-out"
        }}>{notice}</div>
      )}

      {/* TOURIST */}
      {touristMsg && (
        <div style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          background: "linear-gradient(135deg, rgba(6,20,35,0.97), rgba(12,35,55,0.95))",
          border: "2px solid #22cfff", borderRadius: 18, padding: "22px 34px",
          color: "#fff", textAlign: "center", zIndex: 99999,
          boxShadow: "0 0 80px rgba(34,207,255,0.6)", minWidth: 340
        }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🧳</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#22cfff", marginBottom: 6 }}>{touristMsg}</div>
          <button style={{ ...btn, marginTop: 10, padding: "10px 22px" }} onClick={() => setTouristMsg(null)}>Welcome</button>
        </div>
      )}

      {panel && (
        <div style={{ ...panelStyle, bottom: 100, left: "50%", transform: "translateX(-50%)", minWidth: 300, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#22cfff" }}>{panel.title}</div>
          <div style={{ fontSize: 11, color: "#8fd8f0", marginTop: 3 }}>{panel.type} · {panel.text}</div>
          <button style={{ ...btn, marginTop: 8 }} onClick={() => setPanel(null)}>Close</button>
        </div>
      )}
    </>
  );
}

function Row({ k, v, color = "#fff" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
      <span style={{ color: "#8fd8f0" }}>{k}</span>
      <b style={{ color }}>{v}</b>
    </div>
  );
}
