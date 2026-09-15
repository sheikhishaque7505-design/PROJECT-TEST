import React, { useState, useEffect, useRef, useCallback } from "react";
import SmartCity3D from "./SmartCity3D.jsx";
import "./ui.css";

export default function App() {
  const [isNight, setIsNight] = useState(false);
  const [camIndicator, setCamIndicator] = useState(null);
  const [liveTrafficMode, setLiveTrafficMode] = useState(false);

  // ── Recording state ──
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);

  // ── Toast notification ──
  const [toast, setToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  // ── AI traffic mini-status ──
  const [aiTraffic, setAiTraffic] = useState({
    phase: 1,
    inYellow: false,
    inPedestrian: false,
    inAllRed: false,
    currentGreenRoads: [1, 2],
    currentRedRoads: [3, 4],
    phaseProgress: 0,
    stats: {
      vehiclesDetected: 80,
      vehiclesMoving: 40,
      vehiclesWaiting: 40,
      density: "HIGH",
    },
    phaseLabel: "Initializing…",
  });

  const [simTime, setSimTime] = useState("00:00");

  const cityRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // ── Recording timer ──
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setRecTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  // ── Toast helper ──
  const showToast = useCallback((msg, type = "info") => {
    if (!msg) return;
    setToast({ msg: String(msg), type });
    setToastKey((k) => k + 1);
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, []);

  // ── Simulation clock (UTC HH:MM) ──
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, "0");
      const mm = String(now.getUTCMinutes()).padStart(2, "0");
      setSimTime(`${hh}:${mm}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── MediaRecorder — actually record the canvas ──
  const startRecording = useCallback(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      showToast("No canvas found to record", "info");
      return;
    }
    try {
      const stream = canvas.captureStream(30);
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";

      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `smartcity-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("✅ Recording saved", "info");
      };

      rec.start(1000);
      mediaRecorderRef.current = rec;
    } catch (err) {
      console.error(err);
      showToast("Recording failed: " + err.message, "info");
    }
  }, [showToast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
  }, []);

  const handleToggleRecording = useCallback(() => {
    setRecording((prev) => {
      const next = !prev;
      if (next) {
        setRecTime(0);
        startRecording();
      } else {
        stopRecording();
      }
      return next;
    });
  }, [startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch (_) {}
      }
    };
  }, []);

  // ── Handlers ──
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

  const handleOverview = () => {
    setLiveTrafficMode(false);
    setCamIndicator(null);
    cityRef.current?.goToOverview?.();
  };

  const handleTopDown = () => {
    setLiveTrafficMode(false);
    setCamIndicator(null);
    cityRef.current?.goToTopDown?.();
  };

  const handleLiveTraffic = () => {
    setLiveTrafficMode(true);
    setCamIndicator({ text: "🔴 LIVE TRAFFIC — MONITORING" });
    cityRef.current?.goToLiveTraffic?.();
  };

  const handleAITrafficUpdate = useCallback((data) => {
    if (!data) return;
    setAiTraffic((prev) => ({ ...prev, ...data }));
  }, []);

  // Silent callbacks (no big panels anymore)
  const handleFiltrationUpdate = useCallback(() => {}, []);
  const handleWasteUpdate = useCallback(() => {}, []);
  const handleTrafficUpdate = useCallback(() => {}, []);
  const handleCycleUpdate = useCallback(() => {}, []);
  const handleAiReason = useCallback(() => {}, []);

  // ── Helpers ──
  const formatRecTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const getRoadSignal = (roadId) => {
    if (aiTraffic.inPedestrian || aiTraffic.inAllRed) return "ped";
    if (aiTraffic.inYellow) {
      return aiTraffic.currentGreenRoads?.includes(roadId) ? "yellow" : "red";
    }
    return aiTraffic.currentGreenRoads?.includes(roadId) ? "green" : "red";
  };

  const getSignalColor = (s) => {
    if (s === "green") return "#22ff66";
    if (s === "yellow") return "#ffcc22";
    if (s === "ped") return "#ffdd57";
    return "#ff2222";
  };

  const topLight = getSignalColor(
    aiTraffic.inPedestrian || aiTraffic.inAllRed
      ? "ped"
      : aiTraffic.inYellow
      ? "yellow"
      : "green"
  );

  return (
    <div className="app-root">
      <SmartCity3D
        ref={cityRef}
        onPanel={(p) => showToast(`${p.title}: ${p.text}`, "info")}
        onTrafficUpdate={handleTrafficUpdate}
        onSimTime={setSimTime}
        onCycleUpdate={handleCycleUpdate}
        onAiMessage={(m) => showToast(m, "ai")}
        onAiReason={handleAiReason}
        onTouristMessage={(m) => showToast(m, "tourist")}
        onAITrafficUpdate={handleAITrafficUpdate}
        onFiltrationUpdate={handleFiltrationUpdate}
        onWasteUpdate={handleWasteUpdate}
      />

      {/* ===== RECORDING BAR (top-left) ===== */}
      <div className="rec-bar">
        <span className={`rec-dot ${recording ? "on" : "off"}`} />
        <span className="rec-label">{recording ? "REC" : "LIVE"}</span>
        <span className="rec-time">{formatRecTime(recTime)}</span>
        <button
          className={`rec-btn ${recording ? "stop" : ""}`}
          onClick={handleToggleRecording}
          title={recording ? "Stop recording" : "Start recording"}
        >
          {recording ? "STOP" : "REC"}
        </button>
      </div>

      {/* ===== CAMERA INDICATOR PILL (bottom-left, above status line) ===== */}
      {camIndicator && (
        <div className="cam-pill">
          <span className="cam-pill-dot" />
          <span className="cam-pill-text">{camIndicator.text}</span>
          <button
            className="cam-pill-exit"
            onClick={handleExitCamera}
            title="Exit camera view"
          >
            ✕
          </button>
        </div>
      )}

      {/* ===== BOTTOM-LEFT STATUS LINE ===== */}
      <div className="status-line">
        <span className="sl-dot" style={{ background: topLight, boxShadow: `0 0 8px ${topLight}` }} />
        <span className="sl-phase">{aiTraffic.phaseLabel || "AI MONITORING"}</span>
        <span className="sl-sep">·</span>
        <span className="sl-time">{simTime}</span>
        <span className="sl-sep">·</span>
        <span className="sl-roads">
          {[1, 2, 3, 4].map((r) => {
            const sig = getRoadSignal(r);
            const col = getSignalColor(sig);
            return (
              <span
                key={r}
                className="sl-road"
                style={{ color: col, borderColor: col }}
                title={`Road ${r}: ${sig.toUpperCase()}`}
              >
                R{r}
              </span>
            );
          })}
        </span>
      </div>

      {/* ===== BOTTOM-RIGHT CONTROL CLUSTER ===== */}
      <div className="ctrl-cluster">
        <button
          className={`ctrl-btn ${liveTrafficMode ? "active" : ""}`}
          onClick={handleLiveTraffic}
          title="Live Traffic View"
        >
          🔴
        </button>
        <button
          className="ctrl-btn"
          onClick={handleOverview}
          title="City Overview"
        >
          🏠
        </button>
        <button
          className="ctrl-btn"
          onClick={handleTopDown}
          title="Top-Down View"
        >
          🛰
        </button>
        <button
          className={`ctrl-btn ${isNight ? "active" : ""}`}
          onClick={handleToggleDayNight}
          title="Toggle Day / Night"
        >
          {isNight ? "🌙" : "☀"}
        </button>
      </div>

      {/* ===== TOAST NOTIFICATION ===== */}
      {toast && (
        <div key={toastKey} className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
