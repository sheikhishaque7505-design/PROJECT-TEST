import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const CITY_HALF = 3900;
const ROAD_HALF_LEN = 3800;
const GROUND_SIZE = 8200;
const CAR_Y = 5.0;
const LANE_OFFSET = 12;

/* =====================================================================
   LOCATIONS
   ===================================================================== */
export const LOCATIONS = {
  school: { key: "school", label: "American High School", icon: "🏫", type: "EDUCATION", position: [-600, 5, -600], camHeight: 380, camDistance: 330, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  hospital: { key: "hospital", label: "Smart Hospital", icon: "🏥", type: "HEALTHCARE", position: [600, 5, -600], camHeight: 380, camDistance: 330, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  society: { key: "society", label: "BSS Smart Society", icon: "🏘", type: "RESIDENTIAL", position: [-600, 5, 600], camHeight: 500, camDistance: 500, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  bank: { key: "bank", label: "Smart City State Bank", icon: "🏦", type: "FINANCIAL", position: [600, 5, 600], camHeight: 380, camDistance: 330, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  farm: { key: "farm", label: "Smart Eco Farm", icon: "🌾", type: "AGRICULTURE", position: [1800, 5, -600], camHeight: 420, camDistance: 420, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  newHall: { key: "newHall", label: "Liverpool Event Hall", icon: "🎪", type: "EVENT VENUE", position: [600, 5, 1800], camHeight: 420, camDistance: 420, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  carWash: { key: "carWash", label: "Car Wash · Gas Station", icon: "🚗", type: "AUTOMOTIVE", position: [1800, 5, 1750], camHeight: 420, camDistance: 420, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  powerCompany: { key: "powerCompany", label: "City Power Supply Co.", icon: "🔌", type: "UTILITY", position: [-1600, 5, 800], camHeight: 380, camDistance: 380, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  powerSupply: { key: "powerSupply", label: "Power Supply Zone", icon: "⚡", type: "RENEWABLE", position: [-5400, 5, 3600], camHeight: 900, camDistance: 1000, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  filtration: { key: "filtration", label: "Filtration System", icon: "💧", type: "WATER TREATMENT", position: [3600, 5, -3600], camHeight: 420, camDistance: 380, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  foodSystem: { key: "foodSystem", label: "AI Food Production", icon: "🍎", type: "FOOD SYSTEM", position: [2900, 5, -1200], camHeight: 450, camDistance: 450, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  fertilizer: { key: "fertilizer", label: "AI Fertilizer System", icon: "🌱", type: "FERTILIZER", position: [-3600, 5, -3600], camHeight: 450, camDistance: 480, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  wasteManagement: { key: "wasteManagement", label: "Waste Management", icon: "♻", type: "MUNICIPAL", position: [3600, 5, 3600], camHeight: 450, camDistance: 480, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  cultureCenter: { key: "cultureCenter", label: "Culture Center", icon: "🏛", type: "CULTURAL", position: [-1800, 5, 1800], camHeight: 450, camDistance: 450, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  sewageCompany: { key: "sewageCompany", label: "Sewage & Gas Co.", icon: "🏭", type: "INDUSTRIAL", position: [1800, 5, 600], camHeight: 400, camDistance: 400, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  scifi9: { key: "scifi9", label: "Sci-Fi Building 9", icon: "🛸", type: "SCI-FI", position: [-3900, 5, -2400], camHeight: 520, camDistance: 480, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  beautifulTower: { key: "beautifulTower", label: "Beautiful Tower", icon: "🗼", type: "SKYLINE", position: [-3600, 5, -800], camHeight: 550, camDistance: 500, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  scifi10: { key: "scifi10", label: "Sci-Fi Building 10", icon: "🚀", type: "SCI-FI", position: [-3600, 5, 800], camHeight: 520, camDistance: 480, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  wasteCollector: { key: "wasteCollector", label: "Waste Collector Point", icon: "🗑", type: "MUNICIPAL", position: [900, 5, 1400], camHeight: 300, camDistance: 280, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  trafficController: { key: "trafficController", label: "AI Traffic Controller", icon: "🤖", type: "TRANSPORTATION", position: [0, 5, 0], camHeight: 320, camDistance: 280, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
};

/* =====================================================================
   SYSTEM STAGES
   ===================================================================== */
const FILTRATION_STAGES = [
  { id: "wastewater", label: "WASTEWATER COLLECTION", color: 0x6b4a2f, duration: 4 },
  { id: "primary", label: "PRIMARY FILTRATION", color: 0x8a7a4a, duration: 4 },
  { id: "biological", label: "BIOLOGICAL TREATMENT", color: 0x4a8a5a, duration: 4 },
  { id: "aeration", label: "AERATION", color: 0x4ac8e0, duration: 4 },
  { id: "clarification", label: "CLARIFICATION", color: 0x6ab0d0, duration: 4 },
  { id: "advanced", label: "ADVANCED FILTRATION", color: 0x3aa0d0, duration: 4 },
  { id: "uv", label: "UV PURIFICATION", color: 0x9a6aff, duration: 4 },
  { id: "storage", label: "CLEAN WATER STORAGE", color: 0x22cfff, duration: 4 },
  { id: "recycling", label: "WATER RECYCLING", color: 0x2ecc71, duration: 4 },
];
const STAGE_WATER_COLORS = [0x4a2a1a, 0x6a4a2a, 0x4a6a3a, 0x3a8aaa, 0x5a9aba, 0x3a9aca, 0x8a6aff, 0x22cfff, 0x2ecc71];

const POWER_STAGES = [
  { id: "solar", label: "SOLAR ARRAY", color: 0xffcc22, duration: 4 },
  { id: "wind", label: "WIND TURBINES", color: 0x22cfff, duration: 4 },
  { id: "battery", label: "BATTERY STORAGE", color: 0x22ff9d, duration: 4 },
  { id: "grid", label: "GRID DISTRIBUTION", color: 0xff6b6b, duration: 4 },
  { id: "load", label: "CITY LOAD BALANCE", color: 0xb266ff, duration: 4 },
];

const FOOD_STAGES = [
  { id: "farm", label: "SMART FARMING", color: 0x2ecc71, duration: 4 },
  { id: "harvest", label: "AUTO HARVEST", color: 0xffcc22, duration: 4 },
  { id: "processing", label: "FOOD PROCESSING", color: 0xe67e22, duration: 4 },
  { id: "quality", label: "QUALITY CHECK", color: 0x3498db, duration: 4 },
  { id: "packaging", label: "SMART PACKAGING", color: 0x9b59b6, duration: 4 },
  { id: "distribution", label: "CITY DISTRIBUTION", color: 0xff6b6b, duration: 4 },
];

const WASTE_STAGES = [
  { id: "collection", label: "WASTE COLLECTION", color: 0x8a6a3a, duration: 4 },
  { id: "segregation", label: "SEGREGATION", color: 0x3498db, duration: 4 },
  { id: "recycling", label: "RECYCLING", color: 0x2ecc71, duration: 4 },
  { id: "biogas", label: "BIOGAS GENERATION", color: 0x4a7a3a, duration: 4 },
  { id: "composting", label: "COMPOSTING", color: 0x5a3a1a, duration: 4 },
  { id: "incineration", label: "SAFE DISPOSAL", color: 0x8a3a3a, duration: 4 },
];

/* =====================================================================
   STRONG AI TRAFFIC SYSTEM
   ===================================================================== */
function createAITrafficSystem(callbacks) {
  const PHASES = [
    { id: "NS", green: [1, 2], label: "N-S STRAIGHT" },
    { id: "NS_L", green: [1], label: "N-S LEFT TURN" },
    { id: "EW", green: [3, 4], label: "E-W STRAIGHT" },
    { id: "EW_L", green: [3], label: "E-W LEFT TURN" },
  ];
  const BASE_GREEN = 7, MIN_GREEN = 4, MAX_GREEN = 16;
  const YELLOW_DURATION = 2.5, ALL_RED = 1.0, PEDESTRIAN = 3.0;

  let phaseIndex = 0, elapsed = 0;
  let inYellow = false, yellowElapsed = 0;
  let inAllRed = false, allRedElapsed = 0;
  let inPedestrian = false, pedestrianElapsed = 0;
  let phaseGreenDuration = BASE_GREEN;

  const roadQueues = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let emergencyActive = false, emergencyRoad = null, emergencyTimer = 0;

  const decisionLog = [];
  const stats = {
    vehiclesDetected: 80, vehiclesMoving: 40, vehiclesWaiting: 40,
    density: "HIGH", avgWaitTime: 12.4, throughput: 1240, aiConfidence: 94,
    emergencyMode: false, pedestrianPhase: false,
    currentPhaseLabel: PHASES[0].label, phaseTimeRemaining: BASE_GREEN,
  };

  function addLog(message, type = "info") {
    decisionLog.unshift({ message, type, time: Date.now() });
    if (decisionLog.length > 8) decisionLog.pop();
  }

  function calcAdaptiveGreen() {
    const nextPhase = PHASES[(phaseIndex + 1) % PHASES.length];
    const qNext = nextPhase.green.reduce((s, r) => s + roadQueues[r], 0);
    const qCur = PHASES[phaseIndex].green.reduce((s, r) => s + roadQueues[r], 0);
    let d = BASE_GREEN;
    if (qNext > qCur * 1.5) { d = Math.max(MIN_GREEN, BASE_GREEN - 2); addLog(`Next phase queue high (${qNext}) — shortening green`, "adaptive"); }
    else if (qCur > qNext * 1.8) { d = Math.min(MAX_GREEN, BASE_GREEN + 3); addLog(`Current congested (${qCur}) — extending green`, "adaptive"); }
    return d;
  }

  function tick(delta) {
    const currentPhase = PHASES[phaseIndex];

    if (emergencyActive) {
      emergencyTimer -= delta;
      if (emergencyTimer <= 0) {
        emergencyActive = false; emergencyRoad = null; stats.emergencyMode = false;
        addLog("Emergency cleared — resuming adaptive cycle", "emergency");
      } else {
        stats.emergencyMode = true;
        stats.currentPhaseLabel = `🚨 EMERGENCY — Road ${emergencyRoad}`;
        stats.phaseTimeRemaining = emergencyTimer;
        callbacks.onTrafficUpdate?.({
          phase: phaseIndex + 1, inYellow: false, inAllRed: false, inPedestrian: false,
          currentGreenRoads: [emergencyRoad],
          currentRedRoads: [1, 2, 3, 4].filter(r => r !== emergencyRoad),
          phaseProgress: 1 - emergencyTimer / 5,
          stats: { ...stats }, decisionLog: [...decisionLog],
          phaseLabel: stats.currentPhaseLabel, roadQueues: { ...roadQueues },
        });
        return;
      }
    }

    if (inPedestrian) {
      pedestrianElapsed += delta;
      if (pedestrianElapsed >= PEDESTRIAN) {
        inPedestrian = false; pedestrianElapsed = 0; elapsed = 0;
        phaseIndex = (phaseIndex + 1) % PHASES.length;
        phaseGreenDuration = calcAdaptiveGreen();
        stats.pedestrianPhase = false;
        addLog(`AI switched to ${PHASES[phaseIndex].label}`, "phase");
      }
    } else if (inAllRed) {
      allRedElapsed += delta;
      if (allRedElapsed >= ALL_RED) {
        inAllRed = false; allRedElapsed = 0;
        inPedestrian = true; pedestrianElapsed = 0;
        stats.pedestrianPhase = true;
        addLog("Pedestrian crossing active", "pedestrian");
      }
    } else if (inYellow) {
      yellowElapsed += delta;
      if (yellowElapsed >= YELLOW_DURATION) {
        inYellow = false; yellowElapsed = 0;
        inAllRed = true; allRedElapsed = 0;
      }
    } else {
      elapsed += delta;
      if (elapsed >= phaseGreenDuration) {
        inYellow = true; yellowElapsed = 0;
        addLog(`${currentPhase.label} ending — yellow`, "phase");
      }
    }

    const cycleFactor = Math.sin((Date.now() / 5000) % (Math.PI * 2)) * 0.5 + 0.5;
    for (let r = 1; r <= 4; r++) {
      if (currentPhase.green.includes(r) && !inYellow && !inAllRed && !inPedestrian) {
        roadQueues[r] = Math.max(0, roadQueues[r] - delta * 4);
      } else {
        roadQueues[r] = Math.min(30, roadQueues[r] + delta * (2 + cycleFactor * 3));
      }
    }

    if (!emergencyActive && Math.random() < 0.0006) {
      emergencyActive = true;
      emergencyRoad = Math.floor(Math.random() * 4) + 1;
      emergencyTimer = 5;
      stats.emergencyMode = true;
      addLog(`🚨 Emergency on Road ${emergencyRoad} — priority override`, "emergency");
    }

    const totalQ = Object.values(roadQueues).reduce((a, b) => a + b, 0);
    stats.vehiclesMoving = Math.floor((inPedestrian || inAllRed ? 0 : currentPhase.green.length) * 20 + Math.random() * 8);
    stats.vehiclesWaiting = Math.floor(totalQ * 3 + Math.random() * 10);
    stats.vehiclesDetected = stats.vehiclesMoving + stats.vehiclesWaiting;
    stats.density = totalQ > 60 ? "HIGH" : totalQ > 30 ? "MEDIUM" : "LOW";
    stats.avgWaitTime = (8 + totalQ * 0.4).toFixed(1);
    stats.throughput = Math.floor(1100 + (4 - totalQ / 20) * 80);
    stats.aiConfidence = Math.floor(88 + Math.random() * 10);
    stats.currentPhaseLabel = inPedestrian ? "🚶 PEDESTRIAN CROSSING" : inAllRed ? "⛔ ALL RED"
      : inYellow ? `⚠️ ${currentPhase.label} — YELLOW` : currentPhase.label;
    stats.phaseTimeRemaining = inPedestrian ? PEDESTRIAN - pedestrianElapsed
      : inAllRed ? ALL_RED - allRedElapsed
      : inYellow ? YELLOW_DURATION - yellowElapsed
      : phaseGreenDuration - elapsed;

    const greenRoads = (inPedestrian || inAllRed) ? [] : currentPhase.green;
    const redRoads = (inPedestrian || inAllRed) ? [1, 2, 3, 4] : [1, 2, 3, 4].filter(r => !currentPhase.green.includes(r));

    callbacks.onTrafficUpdate?.({
      phase: phaseIndex + 1, inYellow, inAllRed, inPedestrian,
      currentGreenRoads: greenRoads, currentRedRoads: redRoads,
      phaseProgress: inPedestrian ? pedestrianElapsed / PEDESTRIAN
        : inAllRed ? allRedElapsed / ALL_RED
        : inYellow ? yellowElapsed / YELLOW_DURATION
        : elapsed / phaseGreenDuration,
      stats: { ...stats }, decisionLog: [...decisionLog],
      phaseLabel: stats.currentPhaseLabel, roadQueues: { ...roadQueues },
    });
  }

  return {
    tick,
    isGreen: (r) => emergencyActive ? r === emergencyRoad : (!inYellow && !inAllRed && !inPedestrian && PHASES[phaseIndex].green.includes(r)),
    isYellowRoad: (r) => inYellow && PHASES[phaseIndex].green.includes(r),
    getPhase: () => phaseIndex + 1,
    getStats: () => ({ ...stats }),
  };
}

/* =====================================================================
   MAIN COMPONENT
   ===================================================================== */
const SmartCity3D = forwardRef((props, ref) => {
  const {
    onPanel, onTrafficUpdate, onFiltrationUpdate, onPowerUpdate, onFoodUpdate,
    onWasteUpdate, onTouristMessage, onAITrafficUpdate,
  } = props;

  const mountRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  const s = useRef({
    camera: null, controls: null, renderer: null, scene: null,
    camTransition: null,
    intersectionCars: [], trucks: {},
    intersectionLights: [], turbines: [], streetBulbMats: [],
    batteryRings: [], borderLights: [], clickable: [],
    controller: null, controllerRing: null, aiSystem: null,
    powerStageIndex: 0, powerStageElapsed: 0,
    filtrationStageIndex: 0, filtrationStageElapsed: 0,
    foodStageIndex: 0, foodStageElapsed: 0,
    grassMaterial: null, roadMaterial: null, roadLaneMaterial: null,
    curbMaterial: null, sidewalkMat: null, ambient: null, sun: null,
    filtrationStageMeshes: [], foodCropMeshes: [], foodConveyorItems: [],
    powerRings: [],
  }).current;

  const showToast = useCallback((msg, type = "info") => {
    if (!msg) return;
    setToast({ msg: String(msg), type });
    setToastKey((k) => k + 1);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ==================== IMPERATIVE API ==================== */
  useImperativeHandle(ref, () => ({
    getLocations: () => Object.values(LOCATIONS),
    goToOverview: () => smoothCameraTo(new THREE.Vector3(1400, 950, 1400), new THREE.Vector3(0, 5, 0), 1500),
    goToTopDown: () => smoothCameraTo(new THREE.Vector3(0, 2800, 500), new THREE.Vector3(0, 0, 0), 1500),
    goToLiveTraffic: () => smoothCameraTo(new THREE.Vector3(0, 420, 520), new THREE.Vector3(0, 5, 0), 2000),
    setDayNight: (night) => setDayNight(night),
    exitCameraView: () => smoothCameraTo(new THREE.Vector3(1400, 950, 1400), new THREE.Vector3(0, 5, 0), 1500),
    goToLocation: (key, onLabel) => goToLocation(key, onLabel),
    goToLocationCamera: (key, camName, onLabel) => goToLocationCamera(key, camName, onLabel),
    followVehicle: (key, onText) => followVehicle(key, onText),
  }));

  function smoothCameraTo(targetPos, targetLook, duration = 1400) {
    if (!s.camera || !s.controls) return;
    s.camTransition = {
      startPos: s.camera.position.clone(), targetPos,
      startLook: s.controls.target.clone(), targetLook,
      startTime: performance.now(), duration,
    };
  }

  function goToLocation(key, onLabel) {
    const loc = LOCATIONS[key]; if (!loc || !s.camera) return;
    const [x, y, z] = loc.position;
    smoothCameraTo(
      new THREE.Vector3(x + loc.camDistance * 0.7, loc.camHeight, z + loc.camDistance * 0.7),
      new THREE.Vector3(x, y, z)
    );
    onLabel?.(loc.label);
  }

  function goToLocationCamera(key, camName, onLabel) {
    const loc = LOCATIONS[key]; if (!loc || !s.camera) return;
    const cam = loc.cameras.find((c) => c.name === camName); if (!cam) return;
    const [x, y, z] = loc.position;
    let camPos, lookAt;
    if (cam.inside) { camPos = new THREE.Vector3(x - 80, y + 60, z - 80); lookAt = new THREE.Vector3(x, y + 25, z); }
    else if (cam.top) { camPos = new THREE.Vector3(x, y + loc.camHeight * 1.8, z + 10); lookAt = new THREE.Vector3(x, y, z); }
    else { camPos = new THREE.Vector3(x + Math.sin(cam.angle) * loc.camDistance, y + loc.camHeight * 0.5, z + Math.cos(cam.angle) * loc.camDistance); lookAt = new THREE.Vector3(x, y, z); }
    smoothCameraTo(camPos, lookAt);
    onLabel?.(loc.label);
  }

  function followVehicle(key, onText) {
    if (!s.camera) return;
    const truck = s.trucks[key];
    if (truck) {
      smoothCameraTo(truck.position.clone().add(new THREE.Vector3(120, 90, 120)), truck.position.clone(), 1200);
      onText?.(`🎥 FOLLOWING — ${key.toUpperCase()}`);
    } else {
      smoothCameraTo(new THREE.Vector3(0, 2000, 2000), new THREE.Vector3(0, 0, 0), 1500);
      onText?.("🌐 WATCHING CITY CARS");
    }
  }

  function setDayNight(night) {
    if (!s.scene) return;
    const DAY_BG = new THREE.Color(0x8fbcd4);
    const NIGHT_BG = new THREE.Color(0x050a14);
    if (night) {
      s.scene.background = NIGHT_BG.clone();
      s.ambient.intensity = 0.5; s.sun.intensity = 0.35;
    } else {
      s.scene.background = DAY_BG.clone();
      s.ambient.intensity = 2.8; s.sun.intensity = 2.6;
    }
    s.grassMaterial.color.setHex(night ? 0x1a3a24 : 0x4d8f50);
    s.roadMaterial.color.setHex(night ? 0x0e1418 : 0x2a3238);
    s.roadLaneMaterial.color.setHex(night ? 0x080c10 : 0x1e2428);
    s.curbMaterial.color.setHex(night ? 0x252a2e : 0x697578);
    s.sidewalkMat.color.setHex(night ? 0x353a3e : 0x8a8f94);
    s.streetBulbMats.forEach((m) => { m.emissiveIntensity = night ? 6.5 : 1.8; });
    s.batteryRings.forEach((m) => { m.emissiveIntensity = night ? 5.5 : 2.0; });
    s.borderLights.forEach((m) => { m.emissiveIntensity = night ? 6.5 : 3.0; });
  }

  /* ==================== MAIN 3D SETUP ==================== */
  useEffect(() => {
    const container = mountRef.current; if (!container) return;

    const scene = new THREE.Scene();
    s.scene = scene;
    scene.background = new THREE.Color(0x8fbcd4);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 5, 15000);
    camera.position.set(1400, 950, 1400);
    s.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);
    s.renderer = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.15;
    controls.minDistance = 200; controls.maxDistance = 8000;
    controls.target.set(0, 5, 0);
    s.controls = controls;

    const ambient = new THREE.HemisphereLight(0xffffff, 0x4a7a56, 2.8);
    scene.add(ambient); s.ambient = ambient;

    const sun = new THREE.DirectionalLight(0xffffff, 2.6);
    sun.position.set(-800, 1400, 500);
    scene.add(sun); s.sun = sun;

    const fillLight = new THREE.DirectionalLight(0xd0e8ff, 1.2);
    fillLight.position.set(800, 1000, -500);
    scene.add(fillLight);

    const mat = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    const grassMaterial = mat(0x4d8f50, 0.98);
    const roadMaterial = mat(0x2a3238, 0.96);
    const roadLaneMaterial = mat(0x1e2428, 0.96);
    const yellowLineMaterial = mat(0xf5c84b, 0.65);
    const whiteLineMaterial = mat(0xffffff, 0.65);
    const curbMaterial = mat(0x697578, 0.88);
    const darkMaterial = mat(0x182327, 0.65, 0.15);
    const sidewalkMat = mat(0x8a8f94, 0.9);

    s.grassMaterial = grassMaterial; s.roadMaterial = roadMaterial;
    s.roadLaneMaterial = roadLaneMaterial; s.curbMaterial = curbMaterial;
    s.sidewalkMat = sidewalkMat;

    // Ground
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE), grassMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // City boundary
    const cityBoundMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 3.0, metalness: 0.7, roughness: 0.2 });
    s.borderLights.push(cityBoundMat);
    const bt = 20, by = 6;
    const bF = new THREE.Mesh(new THREE.BoxGeometry(CITY_HALF * 2 + bt, 2, bt), cityBoundMat);
    bF.position.set(0, by, CITY_HALF); scene.add(bF);
    const bB = bF.clone(); bB.position.z = -CITY_HALF; scene.add(bB);
    const bL = new THREE.Mesh(new THREE.BoxGeometry(bt, 2, CITY_HALF * 2 + bt), cityBoundMat);
    bL.position.set(-CITY_HALF, by, 0); scene.add(bL);
    const bR = bL.clone(); bR.position.x = CITY_HALF; scene.add(bR);

    // Roads
    const ROAD_W = 110, ROAD_HALF = ROAD_W / 2;
    const ROAD_LEN = ROAD_HALF_LEN * 2;
    const roadZs = [-2400, -1200, 0, 1200, 2400];
    const roadXs = [-2400, -1200, 0, 1200, 2400];

    function makeRoadE(x, z, length) {
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(length, 0.25, ROAD_W + 20), roadLaneMaterial);
      shoulder.position.set(x, 4.55, z); scene.add(shoulder);
      const r = new THREE.Mesh(new THREE.BoxGeometry(length, 0.45, ROAD_W), roadMaterial);
      r.position.set(x, 4.7, z); scene.add(r);
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(length, 0.1, 2), yellowLineMaterial);
      c1.position.set(x, 5, z - 2.5); scene.add(c1);
      const c2 = c1.clone(); c2.position.z = z + 2.5; scene.add(c2);
      for (let lx = x - length / 2 + 30; lx < x + length / 2 - 20; lx += 70) {
        const d1 = new THREE.Mesh(new THREE.BoxGeometry(30, 0.09, 0.8), whiteLineMaterial);
        d1.position.set(lx, 5.06, z + 30); scene.add(d1);
        const d2 = d1.clone(); d2.position.z = z - 30; scene.add(d2);
      }
    }
    function makeRoadN(x, z, length) {
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W + 20, 0.25, length), roadLaneMaterial);
      shoulder.position.set(x, 4.55, z); scene.add(shoulder);
      const r = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W, 0.45, length), roadMaterial);
      r.position.set(x, 4.7, z); scene.add(r);
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, length), yellowLineMaterial);
      c1.position.set(x - 2.5, 5, z); scene.add(c1);
      const c2 = c1.clone(); c2.position.x = x + 2.5; scene.add(c2);
      for (let lz = z - length / 2 + 30; lz < z + length / 2 - 20; lz += 70) {
        const d1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.09, 30), whiteLineMaterial);
        d1.position.set(x + 30, 5.06, lz); scene.add(d1);
        const d2 = d1.clone(); d2.position.x = x - 30; scene.add(d2);
      }
    }
    roadZs.forEach((z) => makeRoadE(0, z, ROAD_LEN));
    roadXs.forEach((x) => makeRoadN(x, 0, ROAD_LEN));

    // Sidewalks
    roadZs.forEach((z) => {
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LEN, 0.3, 10), sidewalkMat);
      s1.position.set(0, 5.05, z + ROAD_HALF + 10); scene.add(s1);
      const s2 = s1.clone(); s2.position.z = z - ROAD_HALF - 10; scene.add(s2);
    });

    // City Wall
    const wallConcreteMat = new THREE.MeshStandardMaterial({ color: 0x5a6670, roughness: 0.85, metalness: 0.15 });
    const wallGlowMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 3.5, metalness: 0.7, roughness: 0.2 });
    s.borderLights.push(wallGlowMat);
    const wallH = 140, wallT = 30;
    const wallLen = CITY_HALF * 2 + wallT * 2;
    const eWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, wallLen), wallConcreteMat);
    eWall.position.set(CITY_HALF, 5 + wallH / 2, 0); scene.add(eWall);
    const wWall = eWall.clone(); wWall.position.x = -CITY_HALF; scene.add(wWall);
    const nWall = new THREE.Mesh(new THREE.BoxGeometry(wallLen, wallH, wallT), wallConcreteMat);
    nWall.position.set(0, 5 + wallH / 2, CITY_HALF); scene.add(nWall);
    const sWall = nWall.clone(); sWall.position.z = -CITY_HALF; scene.add(sWall);

    // Board helper
    function board(text, x, y, z, w = 80, h = 12, color) {
      const g = new THREE.Group(); g.position.set(x, y, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 14, 6), darkMaterial);
      pole.position.y = 7; g.add(pole);
      const bMat = color ? mat(color, 0.35, 0.25) : mat(0x087fa8, 0.35, 0.25);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.9), bMat);
      b.position.y = 12; g.add(b);
      const c = document.createElement("canvas"); c.width = 1400; c.height = 350;
      const ctx = c.getContext("2d");
      ctx.fillStyle = color ? "#" + color.toString(16).padStart(6, "0") : "#075c7b";
      ctx.fillRect(0, 0, 1400, 350);
      ctx.strokeStyle = "#78e9ff"; ctx.lineWidth = 12;
      ctx.strokeRect(10, 10, 1380, 330);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 82px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(text, 700, 175);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const sMesh = new THREE.Mesh(new THREE.PlaneGeometry(w - 1, h - 0.8), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
      sMesh.position.set(0, 12, 0.5); g.add(sMesh);
      scene.add(g);
    }

    // Street lights
    const streetBulbMats = []; s.streetBulbMats = streetBulbMats;
    function sl(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 11, 5), darkMaterial);
      pole.position.y = 5.5; g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.22, 0.22), darkMaterial);
      arm.position.set(1.5, 10, 0); g.add(arm);
      const bMat = new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffd36a, emissiveIntensity: 1.8 });
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), bMat);
      b.position.set(3, 9.8, 0); g.add(b);
      scene.add(g); streetBulbMats.push(bMat);
    }
    roadZs.forEach((z) => {
      for (let x = -ROAD_HALF_LEN + 100; x <= ROAD_HALF_LEN - 100; x += 400) {
        sl(x, z + ROAD_HALF + 18); sl(x, z - ROAD_HALF - 18);
      }
    });

    // Intersection lights
    const intersectionLights = []; s.intersectionLights = intersectionLights;
    const ILO = 70;
    function makeIntersectionLight(x, z, road) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 11, 5), darkMaterial);
      pole.position.y = 5.5; g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(3, 0.25, 0.25), darkMaterial);
      arm.position.set(1.5, 10.5, 0); g.add(arm);
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.8, 5.5, 1.6), darkMaterial);
      box.position.set(3, 10.5, 0); g.add(box);
      const light = (color, y) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0 }));
        m.position.set(3, y, 0.9); g.add(m); return m;
      };
      const r = light(0xff2222, 12.2);
      const yL = light(0xffcc22, 10.5);
      const gr = light(0x22ff66, 8.8);
      scene.add(g);
      intersectionLights.push({ r, y: yL, gr, road });
    }
    makeIntersectionLight(-ILO, -ILO, 1);
    makeIntersectionLight(ILO, ILO, 2);
    makeIntersectionLight(ILO, -ILO, 3);
    makeIntersectionLight(-ILO, ILO, 4);

    // AI Controller tower
    const controller = new THREE.Group(); s.controller = controller;
    controller.position.set(0, 5, 0);
    const controllerBase = new THREE.Mesh(new THREE.CylinderGeometry(55, 62, 3, 24), mat(0x142f3b, 0.28, 0.4));
    controllerBase.position.y = 1.5; controller.add(controllerBase);
    const controllerRing = new THREE.Mesh(new THREE.TorusGeometry(53, 1.2, 8, 36), new THREE.MeshStandardMaterial({ color: 0x32dfff, emissive: 0x18cfff, emissiveIntensity: 2.5 }));
    controllerRing.rotation.x = Math.PI / 2; controllerRing.position.y = 3.2; controller.add(controllerRing);
    s.controllerRing = controllerRing;
    const cTower = new THREE.Mesh(new THREE.BoxGeometry(22, 40, 22), mat(0x185a72, 0.25, 0.35));
    cTower.position.y = 22; controller.add(cTower);
    const cUpper = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 18), new THREE.MeshStandardMaterial({ color: 0x0a3345, emissive: 0x1a7a9a, emissiveIntensity: 1.8 }));
    cUpper.position.y = 44; controller.add(cUpper);
    const radar = new THREE.Mesh(new THREE.TorusGeometry(8, 0.5, 8, 32), new THREE.MeshStandardMaterial({ color: 0x61e7ff, emissive: 0x23dfff, emissiveIntensity: 2.5 }));
    radar.rotation.x = Math.PI / 2; radar.position.y = 53; controller.add(radar);
    const cSig = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0x66e5ff, emissive: 0x33dfff, emissiveIntensity: 3.5 }));
    cSig.position.y = 68; controller.add(cSig);
    scene.add(controller);
    s.radar = radar; s.cSig = cSig;

    // Occupied zones (buildings) — cars/trees avoid these
    const occupiedSpots = [
      { x: -600, z: -600, r: 260 }, { x: 600, z: -600, r: 250 },
      { x: 600, z: 600, r: 300 }, { x: 1800, z: -600, r: 400 },
      { x: 600, z: 1800, r: 290 }, { x: 1800, z: 1750, r: 320 },
      { x: 1800, z: 600, r: 290 }, { x: 0, z: 0, r: 130 },
      { x: -5400, z: 3600, r: 1200 }, { x: 3600, z: -3600, r: 600 },
      { x: -3600, z: -3600, r: 600 }, { x: 3600, z: 3600, r: 600 },
      { x: -1800, z: 1800, r: 400 }, { x: -600, z: 600, r: 500 },
      { x: -1600, z: 800, r: 260 }, { x: -3900, z: -2400, r: 350 },
      { x: -3600, z: -800, r: 400 }, { x: -3600, z: 800, r: 350 },
      { x: 900, z: 1400, r: 250 }, { x: 2900, z: -1200, r: 450 },
    ];
    function isOnBuilding(x, z) {
      for (const o of occupiedSpots) {
        const dx = x - o.x, dz = z - o.z;
        if (dx * dx + dz * dz < o.r * o.r) return true;
      }
      return false;
    }

    // Trees
    const treeTrunkMat = mat(0x5a3d24, 0.95, 0.05);
    const treeLeafMat = mat(0x2d6e3d, 0.9);
    const treeTrunkGeo = new THREE.CylinderGeometry(2.2, 3.5, 28, 7);
    const treeLeafCone = new THREE.ConeGeometry(18, 42, 8);

    function tree(x, z, sc = 1) {
      if (isOnBuilding(x, z)) return;
      const g = new THREE.Group(); g.position.set(x, 5, z); g.scale.setScalar(sc);
      const t = new THREE.Mesh(treeTrunkGeo, treeTrunkMat); t.position.y = 14; g.add(t);
      const l = new THREE.Mesh(treeLeafCone, treeLeafMat); l.position.y = 38; g.add(l);
      scene.add(g);
    }

    // Place trees away from roads and buildings
    for (let i = 0; i < 400; i++) {
      const x = (Math.random() - 0.5) * (CITY_HALF * 2 - 300);
      const z = (Math.random() - 0.5) * (CITY_HALF * 2 - 300);
      // skip near roads
      let nearRoad = false;
      for (const rz of roadZs) if (Math.abs(z - rz) < 130) nearRoad = true;
      for (const rx of roadXs) if (Math.abs(x - rx) < 130) nearRoad = true;
      if (nearRoad) continue;
      tree(x, z, 0.8 + Math.random() * 0.6);
    }

    /* ==================== LOAD BUILDINGS ==================== */
    const loader = new GLTFLoader();
    const clickable = []; s.clickable = clickable;

    function prep(obj, size) {
      const box = new THREE.Box3().setFromObject(obj);
      const sz = new THREE.Vector3(); box.getSize(sz);
      const maxD = Math.max(sz.x, sz.y, sz.z);
      obj.scale.setScalar(size / Math.max(maxD, 0.001));
      const b2 = new THREE.Box3().setFromObject(obj);
      const c = new THREE.Vector3(); b2.getCenter(c);
      obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= b2.min.y;
    }

    function bld(file, size, pos, type, name, borderColor) {
      const url = file.startsWith("/") ? file : "/" + file;
      loader.load(url, (g) => {
        const b = g.scene;
        prep(b, size);
        b.position.set(pos[0], 5, pos[1]);
        scene.add(b);
        clickable.push({ object: b, type, name: name || type });

        const bMat = new THREE.MeshStandardMaterial({ color: borderColor || 0x22cfff, emissive: borderColor || 0x22cfff, emissiveIntensity: 2.5, metalness: 0.7, roughness: 0.2 });
        s.borderLights.push(bMat);
        const fw = size * 1.4;
        const front = new THREE.Mesh(new THREE.BoxGeometry(fw, 2.5, 6), bMat);
        front.position.set(pos[0], 6.5, pos[1] + fw / 2 + 10); scene.add(front);
        const back = front.clone(); back.position.z = pos[1] - fw / 2 - 10; scene.add(back);
        const left = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, fw), bMat);
        left.position.set(pos[0] - fw / 2 - 10, 6.5, pos[1]); scene.add(left);
        const right = left.clone(); right.position.x = pos[0] + fw / 2 + 10; scene.add(right);
      }, undefined, (err) => console.warn("GLB load failed:", url, err));
    }

    bld("/american_high_school.glb", 300, [-600, -600], "school", "American High School", 0x1a5490);
    bld("/low_poly_hospital.glb", 280, [600, -600], "hospital", "Smart Hospital", 0xc0392b);
    bld("/us_bank_tower.glb", 360, [600, 600], "bank", "State Bank", 0x8e44ad);
    bld("/simple_farm_free.glb", 520, [1800, -600], "farm", "Smart Eco Farm", 0x27ae60);
    bld("/liverpool_street_station_south_entrance.glb", 420, [600, 1800], "newHall", "Liverpool Event Hall", 0xd4a017);
    bld("/gas_station.glb", 380, [1800, 1750], "gasStation", "Gas Station · Car Wash", 0xc0392b);
    bld("/office.glb", 380, [1800, 600], "sewageCompany", "Sewage & Gas Co.", 0x2ecc71);
    bld("/national_archives_research_center.glb", 480, [-1800, 1800], "cultureCenter", "Culture Center", 0xf39c12);
    bld("/power-suply-companey.glb", 380, [-1600, 800], "powerCompany", "City Power Supply Co.", 0xf1c40f);
    bld("/sci-fi_building_9.glb", 440, [-3900, -2400], "scifi9", "Sci-Fi Building 9", 0x66ff99);
    bld("/beautifultowerbuilding.glb", 520, [-3600, -800], "beautifulTower", "Beautiful Tower", 0x22cfff);
    bld("/sci-fi_building_10.glb", 440, [-3600, 800], "scifi10", "Sci-Fi Building 10", 0xff66dd);

    // Simple society towers
    const societyBorderMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 2.4, metalness: 0.6, roughness: 0.25 });
    s.borderLights.push(societyBorderMat);
    const innerGround = new THREE.Mesh(new THREE.BoxGeometry(820, 0.6, 820), mat(0xb8bcc0, 0.92));
    innerGround.position.set(-600, 4.85, 600); scene.add(innerGround);
    const TOWER_COLORS = [0x5b9bd5, 0x7bb3e0, 0xc0629b, 0xf5a623, 0x6cd4a0, 0x9b7ad9, 0xe8635c];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const tx = -600 - 340 + (c + 0.5) * (680 / 3);
        const tz = 600 - 340 + (r + 0.5) * (680 / 4);
        const h = 180 + Math.random() * 180;
        const tg = new THREE.Group(); tg.position.set(tx, 5, tz);
        const body = new THREE.Mesh(new THREE.BoxGeometry(30, h, 30), mat(TOWER_COLORS[Math.floor(Math.random() * TOWER_COLORS.length)], 0.4, 0.55));
        body.position.y = h / 2; tg.add(body);
        scene.add(tg);
      }
    }

    // Boards
    board("AMERICAN HIGH SCHOOL", -600, 5, -950, 200, 14, 0x1a5490);
    board("BSS SMART HOSPITAL", 600, 5, -950, 200, 14, 0xc0392b);
    board("SMART CITY STATE BANK", 600, 5, 950, 200, 14, 0x8e44ad);
    board("SMART ECO FARM", 1800, 5, -950, 200, 14, 0x27ae60);
    board("BSS SMART SOCIETY", -600, 5, 1100, 240, 16, 0x2ecc71);
    board("LIVERPOOL EVENT HALL", 600, 5, 2250, 280, 16, 0xd4a017);
    board("CAR WASH · GAS STATION", 1800, 5, 2200, 220, 16, 0xc0392b);
    board("CULTURE CENTER", -1800, 5, 2400, 260, 18, 0xf39c12);
    board("CITY POWER SUPPLY CO.", -1600, 5, 400, 300, 16, 0xf1c40f);
    board("AI TRAFFIC CONTROLLER", 0, 5, 300, 190, 14);

    /* =====================================================================
       POWER SUPPLY ZONE — ON GROUND (y=5) ✅
       ===================================================================== */
    const powerZone = new THREE.Group();
    powerZone.position.set(-5400, 0, 3600);
    scene.add(powerZone);

    board("POWER SUPPLY ZONE", -5400, 5, 4600, 460, 22, 0x0a4d5c);

    // Base pad — ON GROUND
    const powerBasePad = new THREE.Mesh(
      new THREE.BoxGeometry(2400, 0.8, 1800),
      mat(0x2a3238, 0.92)
    );
    powerBasePad.position.set(0, 4.6, 0);
    powerZone.add(powerBasePad);

    // Inner pad
    const powerPad = new THREE.Mesh(
      new THREE.BoxGeometry(1600, 1, 1300),
      mat(0x1d3a2e, 0.92)
    );
    powerPad.position.set(0, 5.1, 0);
    powerZone.add(powerPad);

    // Border
    const powerBorderMat = new THREE.MeshStandardMaterial({ color: 0x00e0ff, emissive: 0x00cfff, emissiveIntensity: 2.5, metalness: 0.7, roughness: 0.2 });
    s.borderLights.push(powerBorderMat);
    const pbF = new THREE.Mesh(new THREE.BoxGeometry(1600, 1.6, 5), powerBorderMat);
    pbF.position.set(0, 6.5, -650); powerZone.add(pbF);
    const pbB = pbF.clone(); pbB.position.z = 650; powerZone.add(pbB);
    const pbL = new THREE.Mesh(new THREE.BoxGeometry(5, 1.6, 1300), powerBorderMat);
    pbL.position.set(-800, 6.5, 0); powerZone.add(pbL);
    const pbR = pbL.clone(); pbR.position.x = 800; powerZone.add(pbR);

    // Wind turbines — ON GROUND
    const turbines = []; s.turbines = turbines;
    const turbTowerMat = mat(0xeeeeee, 0.4, 0.3);
    const turbTowerGeo = new THREE.CylinderGeometry(0.85, 1.4, 68, 6);
    const turbBladeGeo = new THREE.BoxGeometry(2, 27, 0.85);
    function turbine(x, z, sc = 1) {
      const g = new THREE.Group();
      g.position.set(x, 6, z);   // 6 = ground level + 1 above pad
      g.scale.setScalar(sc);
      const t = new THREE.Mesh(turbTowerGeo, turbTowerMat);
      t.position.y = 34; g.add(t);   // tower base at y=0 relative to group → on ground
      const blades = new THREE.Group();
      blades.position.y = 68;
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(turbBladeGeo, turbTowerMat);
        b.position.y = 12.5;
        b.rotation.z = i * Math.PI * 2 / 3;
        blades.add(b);
      }
      g.add(blades);
      powerZone.add(g);
      turbines.push(blades);
    }
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 4; col++)
        turbine(-650 + col * 200, -600 + row * 220, 1 + (row % 3) * 0.08);

    // Solar park — ON GROUND
    const solarPark = new THREE.Group();
    solarPark.position.set(500, 6, 0);
    powerZone.add(solarPark);

    const solarGround = new THREE.Mesh(
      new THREE.BoxGeometry(650, 0.8, 1250),
      mat(0x2a4536, 0.92)
    );
    solarGround.position.y = 0;
    solarPark.add(solarGround);

    const solarPanelMat = new THREE.MeshStandardMaterial({ color: 0x082c4b, roughness: 0.18, metalness: 0.7, emissive: 0x063b62, emissiveIntensity: 0.7 });

    function solarArray(x, z, w, d, rows, cols) {
      const g = new THREE.Group();
      g.position.set(x, 3, z);
      g.rotation.x = -0.22;
      const pw = w / cols - 3, pd = d / rows - 3;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const p = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.5, pd), solarPanelMat);
          p.position.set((c - (cols - 1) / 2) * (w / cols), 0, (r - (rows - 1) / 2) * (d / rows));
          g.add(p);
        }
      solarPark.add(g);
    }
    for (let i = 0; i < 5; i++) {
      solarArray(-160, -480 + i * 220, 280, 180, 2, 4);
      solarArray(160, -480 + i * 220, 280, 180, 2, 4);
    }

    // Battery banks — ON GROUND
    const batteryRings = []; s.batteryRings = batteryRings;
    const powerRings = []; s.powerRings = powerRings;

    const batteryPositions = [
      [-500, 850], [-370, 850], [-240, 850], [-110, 850], [20, 850],
      [-500, 980], [-370, 980], [-240, 980], [-110, 980], [20, 980],
    ];
    batteryPositions.forEach((pos) => {
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(40, 55, 40),
        mat(0x2a5a4a, 0.4, 0.5)
      );
      b.position.set(pos[0], 6 + 27.5, pos[1]);   // ON GROUND
      powerZone.add(b);
      const rMat = new THREE.MeshStandardMaterial({ color: 0x22ff9d, emissive: 0x22ff9d, emissiveIntensity: 2.0 });
      const r = new THREE.Mesh(new THREE.TorusGeometry(28, 0.8, 6, 16), rMat);
      r.rotation.x = Math.PI / 2;
      r.position.set(pos[0], 8, pos[1]);
      powerZone.add(r);
      batteryRings.push(rMat);
      powerRings.push(r);
    });

    /* =====================================================================
       FILTRATION ZONE — ON GROUND (y=5) ✅
       ===================================================================== */
    const filtZone = new THREE.Group();
    filtZone.position.set(3600, 5, -3600);
    scene.add(filtZone);
    board("FILTRATION SYSTEM", 3600, 5, -2700, 380, 18, 0x22cfff);

    // Ground pad
    const filtPad = new THREE.Mesh(
      new THREE.BoxGeometry(950, 1, 950),
      mat(0x1a2836, 0.95)
    );
    filtPad.position.y = 0;
    filtZone.add(filtPad);

    // Border
    const filtBorderMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 2.5, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(filtBorderMat);
    const fzF = new THREE.Mesh(new THREE.BoxGeometry(950, 1.8, 6), filtBorderMat);
    fzF.position.set(0, 1.5, -475); filtZone.add(fzF);
    const fzB = fzF.clone(); fzB.position.z = 475; filtZone.add(fzB);
    const fzL = new THREE.Mesh(new THREE.BoxGeometry(6, 1.8, 950), filtBorderMat);
    fzL.position.set(-475, 1.5, 0); filtZone.add(fzL);
    const fzR = fzL.clone(); fzR.position.x = 475; filtZone.add(fzR);

    // Tanks — ON GROUND
    const tankGroup = new THREE.Group();
    tankGroup.position.set(0, 0, 0);
    filtZone.add(tankGroup);
    s.filtrationStageMeshes = [];

    for (let i = 0; i < FILTRATION_STAGES.length; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const tx = (col - 1) * 75;
      const tz = (row - 1) * 75;
      const tankColor = FILTRATION_STAGES[i].color;

      const tankMat = new THREE.MeshStandardMaterial({
        color: tankColor, emissive: tankColor, emissiveIntensity: 0.4,
        metalness: 0.3, roughness: 0.3, transparent: true, opacity: 0.75,
      });

      // Tank body — sits on ground: y = half of height = 20
      const tankBody = new THREE.Mesh(new THREE.CylinderGeometry(22, 24, 40, 16), tankMat);
      tankBody.position.set(tx, 20, tz);
      tankGroup.add(tankBody);

      // Cap      const tankCap = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), tankMat);
      tankCap.position.set(tx, 40, tz);
      tankGroup.add(tankCap);

      // Water fill
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 1.2,
        transparent: true, opacity: 0.75, metalness: 0.4, roughness: 0.1,
      });
      const waterFill = new THREE.Mesh(new THREE.CylinderGeometry(19, 19, 1, 16), waterMat);
      waterFill.position.set(tx, 8, tz);
      tankGroup.add(waterFill);

      s.filtrationStageMeshes.push({ tankBody, tankCap, waterFill, baseY: 8, stageIndex: i });
      clickable.push({ object: tankBody, type: "filtrationStage", name: FILTRATION_STAGES[i].label });
    }

    // Big clean reservoir — ON GROUND
    const reservoirMat = new THREE.MeshStandardMaterial({ color: 0x0a4a6a, roughness: 0.3, metalness: 0.5, emissive: 0x0a2a4a, emissiveIntensity: 0.6 });
    const reservoir = new THREE.Mesh(new THREE.CylinderGeometry(50, 55, 40, 24), reservoirMat);
    reservoir.position.set(-320, 20, 0);
    filtZone.add(reservoir);

    /* =====================================================================
       FOOD SYSTEM (NEW) — ON GROUND at (2900, 5, -1200) ✅
       ===================================================================== */
    const foodZone = new THREE.Group();
    foodZone.position.set(2900, 5, -1200);
    scene.add(foodZone);
    board("AI FOOD PRODUCTION", 2900, 5, -400, 380, 18, 0x2ecc71);

    // Ground pad
    const foodPad = new THREE.Mesh(
      new THREE.BoxGeometry(800, 1, 800),
      mat(0x2a3a2e, 0.95)
    );
    foodPad.position.y = 0;
    foodZone.add(foodPad);

    // Border
    const foodBorderMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 2.5, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(foodBorderMat);
    const foodF = new THREE.Mesh(new THREE.BoxGeometry(800, 1.8, 6), foodBorderMat);
    foodF.position.set(0, 1.5, -400); foodZone.add(foodF);
    const foodB = foodF.clone(); foodB.position.z = 400; foodZone.add(foodB);
    const foodL = new THREE.Mesh(new THREE.BoxGeometry(6, 1.8, 800), foodBorderMat);
    foodL.position.set(-400, 1.5, 0); foodZone.add(foodL);
    const foodR = foodL.clone(); foodR.position.x = 400; foodZone.add(foodR);

    // Farming plots — ON GROUND
    s.foodCropMeshes = [];
    const cropColors = [0x2ecc71, 0x27ae60, 0xf1c40f, 0xe67e22];

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const px = -260 + c * 100;
        const pz = -260 + r * 100;

        // Soil plot
        const plot = new THREE.Mesh(
          new THREE.BoxGeometry(80, 1, 80),
          mat(0x5a3a1a, 0.95)
        );
        plot.position.set(px, 0.5, pz);
        foodZone.add(plot);

        // Crops
        for (let k = 0; k < 6; k++) {
          const crop = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 4, 12, 6),
            new THREE.MeshStandardMaterial({
              color: cropColors[Math.floor(Math.random() * cropColors.length)],
              emissive: 0x112211, emissiveIntensity: 0.3, roughness: 0.8
            })
          );
          crop.position.set(
            px + (Math.random() - 0.5) * 60,
            7,
            pz + (Math.random() - 0.5) * 60
          );
          foodZone.add(crop);
          s.foodCropMeshes.push(crop);
        }
      }
    }

    // Processing plant — ON GROUND
    const foodPlant = new THREE.Group();
    foodPlant.position.set(0, 0, 0);
    foodZone.add(foodPlant);

    const plantBody = new THREE.Mesh(
      new THREE.BoxGeometry(120, 90, 120),
      mat(0x1a8a4e, 0.4, 0.5)
    );
    plantBody.position.y = 45;   // half height
    foodPlant.add(plantBody);

    const plantRoof = new THREE.Mesh(
      new THREE.BoxGeometry(130, 4, 130),
      mat(0x0a3a1a, 0.5, 0.5)
    );
    plantRoof.position.y = 92;
    foodPlant.add(plantRoof);

    const foodBeacon = new THREE.Mesh(
      new THREE.SphereGeometry(4, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 4 })
    );
    foodBeacon.position.y = 102;
    foodPlant.add(foodBeacon);

    // Conveyor belt
    s.foodConveyorItems = [];
    const belt = new THREE.Mesh(
      new THREE.BoxGeometry(180, 2, 25),
      mat(0x2ecc71, 0.5, 0.4)
    );
    belt.position.set(0, 10, 80);
    foodPlant.add(belt);

    for (let i = 0; i < 5; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(12, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xe67e22, emissive: 0xe67e22, emissiveIntensity: 1.5 })
      );
      box.position.set(-70 + i * 35, 18, 80);
      box.userData = { speed: 0.4 + Math.random() * 0.3, offset: i * 35, startX: -70 };
      foodPlant.add(box);
      s.foodConveyorItems.push(box);
    }

    /* =====================================================================
       CARS — STRAIGHT & BACK, NO BUILDINGS ✅
       ===================================================================== */
    const intersectionCars = []; s.intersectionCars = intersectionCars;
    const carColors = [0x287ca3, 0xc83f49, 0xe1a72e, 0x5b72c9, 0x2f9d65, 0xd8d8d8, 0xd97b2a, 0x8b3ad9, 0x16a085, 0x8e44ad, 0xf39c12, 0xe74c3c, 0x1abc9c, 0x3498db, 0xe91e63, 0x9b59b6, 0xff5722];

    const V_LEN = 26, V_WID = 10, V_HGT = 5.5;
    const carBodyGeo = new THREE.BoxGeometry(V_LEN, V_HGT, V_WID);
    const carCabinGeo = new THREE.BoxGeometry(V_LEN * 0.42, V_HGT * 0.85, V_WID * 0.88);
    const carWheelGeo = new THREE.CylinderGeometry(2.4, 2.4, 1.6, 10);
    const carGlassMat = new THREE.MeshStandardMaterial({ color: 0x1a3a4a, emissive: 0x0a2535, emissiveIntensity: 0.6, roughness: 0.12, metalness: 0.5 });
    const wheelMat = mat(0x0c1012, 0.6, 0.1);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8e0, emissiveIntensity: 3.0 });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff1e1e, emissive: 0xff1010, emissiveIntensity: 3.0 });

    function makeCar(colorHex) {
      const g = new THREE.Group();
      const bMat = mat(colorHex, 0.35, 0.5);
      const body = new THREE.Mesh(carBodyGeo, bMat); body.position.y = 4.2; g.add(body);
      const cabin = new THREE.Mesh(carCabinGeo, carGlassMat); cabin.position.set(-1, 8.8, 0); g.add(cabin);
      for (const wp of [[V_LEN * 0.32, V_WID * 0.48], [V_LEN * 0.32, -V_WID * 0.48], [-V_LEN * 0.32, V_WID * 0.48], [-V_LEN * 0.32, -V_WID * 0.48]]) {
        const w = new THREE.Mesh(carWheelGeo, wheelMat); w.rotation.x = Math.PI / 2; w.position.set(wp[0], 2.8, wp[1]); g.add(w);
      }
      for (const z of [-3.2, 3.2]) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.6, 1.9), headMat); l.position.set(V_LEN * 0.49, 4.5, z); g.add(l);
        const t = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.6, 1.9), tailMat); t.position.set(-V_LEN * 0.49, 4.5, z); g.add(t);
      }
      return g;
    }

    // Straight routes — cars go back and forth along main roads
    const STRAIGHT_ROUTES = [
      // Horizontal roads — X axis
      { axis: "x", fixedCoord: -2400, laneOffset: -30, min: -3500, max: 3500 },
      { axis: "x", fixedCoord: -2400, laneOffset: 30, min: 3500, max: -3500 },
      { axis: "x", fixedCoord: -1200, laneOffset: -30, min: -3500, max: 3500 },
      { axis: "x", fixedCoord: -1200, laneOffset: 30, min: 3500, max: -3500 },
      { axis: "x", fixedCoord: 0, laneOffset: -30, min: -3500, max: 3500 },
      { axis: "x", fixedCoord: 0, laneOffset: 30, min: 3500, max: -3500 },
      { axis: "x", fixedCoord: 1200, laneOffset: -30, min: -3500, max: 3500 },
      { axis: "x", fixedCoord: 1200, laneOffset: 30, min: 3500, max: -3500 },
      { axis: "x", fixedCoord: 2400, laneOffset: -30, min: -3500, max: 3500 },
      { axis: "x", fixedCoord: 2400, laneOffset: 30, min: 3500, max: -3500 },
      // Vertical roads — Z axis
      { axis: "z", fixedCoord: -2400, laneOffset: -30, min: -3500, max: 3500 },
      { axis: "z", fixedCoord: -2400, laneOffset: 30, min: 3500, max: -3500 },
      { axis: "z", fixedCoord: -1200, laneOffset: -30, min: -3500, max: 3500 },
      { axis: "z", fixedCoord: -1200, laneOffset: 30, min: 3500, max: -3500 },
      { axis: "z", fixedCoord: 0, laneOffset: -30, min: -3500, max: 3500 },
      { axis: "z", fixedCoord: 0, laneOffset: 30, min: 3500, max: -3500 },
      { axis: "z", fixedCoord: 1200, laneOffset: -30, min: -3500, max: 3500 },
      { axis: "z", fixedCoord: 1200, laneOffset: 30, min: 3500, max: -3500 },
      { axis: "z", fixedCoord: 2400, laneOffset: -30, min: -3500, max: 3500 },
      { axis: "z", fixedCoord: 2400, laneOffset: 30, min: 3500, max: -3500 },
    ];

    function updateStraightCarTransform(c) {
      const { route, pos } = c;
      if (route.axis === "x") {
        c.car.position.set(pos, CAR_Y, route.fixedCoord + route.laneOffset);
        c.car.rotation.y = route.max > route.min ? 0 : Math.PI;
      } else {
        c.car.position.set(route.fixedCoord + route.laneOffset, CAR_Y, pos);
        c.car.rotation.y = route.max > route.min ? Math.PI / 2 : -Math.PI / 2;
      }
    }

    function spawnStraightCar(route) {
      const car = makeCar(carColors[Math.floor(Math.random() * carColors.length)]);
      scene.add(car);
      const startPos = route.min + Math.random() * (route.max - route.min);
      const speed = 80 + Math.random() * 40;
      const carObj = { car, route, pos: startPos, speed, dir: Math.sign(route.max - route.min) };
      intersectionCars.push(carObj);
      updateStraightCarTransform(carObj);
    }

    STRAIGHT_ROUTES.forEach((route) => {
      for (let i = 0; i < 4; i++) spawnStraightCar(route);
    });

    /* ==================== TRUCKS ==================== */
    function buildTruck(c1, c2) {
      const truck = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(100, 68, 44), mat(c1, 0.4, 0.3)); box.position.y = 45; truck.add(box);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(38, 44, 44), mat(c2, 0.4, 0.4)); cabin.position.set(65, 35, 0); truck.add(cabin);
      const warn = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 10), new THREE.MeshStandardMaterial({ color: 0xff8a00, emissive: 0xff8a00, emissiveIntensity: 3 }));
      warn.position.set(0, 82, 0); truck.add(warn);
      return { truck, warn };
    }

    const g1 = buildTruck(0x3498db, 0x2980b9);
    const garbageTruck = g1.truck; scene.add(garbageTruck); s.trucks.garbage = garbageTruck;

    const g2 = buildTruck(0xb266ff, 0x7a3b9d);
    const fertTruck = g2.truck; scene.add(fertTruck); s.trucks.fert = fertTruck;

    /* ==================== PEOPLE ==================== */
    const people = [];
    const skinColors = [0xf2c9a0, 0xd9a373, 0xa06a3c, 0x6b4a2f, 0xffd8b8];
    const shirtColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0x1abc9c];

    function makePerson() {
      const g = new THREE.Group();
      const skinMat = mat(skinColors[Math.floor(Math.random() * skinColors.length)], 0.9);
      const shirtMat = mat(shirtColors[Math.floor(Math.random() * shirtColors.length)], 0.85);
      const pantsMat = mat(0x2c3e50, 0.85);
      const head = new THREE.Mesh(new THREE.SphereGeometry(1.8, 6, 5), skinMat); head.position.y = 9; g.add(head);
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 5, 1.8), shirtMat); body.position.y = 5.5; g.add(body);
      const legL = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), pantsMat); legL.position.set(-0.7, 2, 0); g.add(legL);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), pantsMat); legR.position.set(0.7, 2, 0); g.add(legR);
      return { g, legL, legR };
    }

    function spawnPeople(cx, cz, count, radius) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = radius * (0.5 + Math.random() * 0.5);
        const px = cx + Math.cos(angle) * r;
        const pz = cz + Math.sin(angle) * r;
        if (isOnBuilding(px, pz)) continue;
        const p = makePerson();
        p.g.position.set(px, 5, pz);
        p.g.rotation.y = angle;
        scene.add(p.g);
        people.push({ obj: p.g, legL: p.legL, legR: p.legR, cx, cz, r, angle, dir: Math.random() > 0.5 ? 1 : -1, speed: 0.008 + Math.random() * 0.01, phase: Math.random() * Math.PI * 2 });
      }
    }
    spawnPeople(-600, -900, 8, 150);
    spawnPeople(600, -900, 8, 150);
    spawnPeople(-600, 900, 10, 200);
    spawnPeople(600, 900, 6, 150);
    spawnPeople(1800, -900, 5, 200);
    spawnPeople(600, 1500, 8, 180);

    /* ==================== AI TRAFFIC SYSTEM ==================== */
    const aiSystem = createAITrafficSystem({
      onTrafficUpdate: (data) => onAITrafficUpdate?.(data),
    });
    s.aiSystem = aiSystem;

    /* ==================== CLICK ==================== */
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (e) => {
      if (e.target !== renderer.domElement) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      for (const item of clickable) {
        const hit = raycaster.intersectObject(item.object, true);
        if (hit.length) {
          onPanel?.({ title: item.name, type: item.type.toUpperCase(), text: `${item.name} — click for details.` });
          return;
        }
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    /* ==================== ANIMATE ==================== */
    const clock = new THREE.Clock();
    let fc = 0;
    let rafId;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.elapsedTime;
      fc++;

      aiSystem.tick(delta);

      // Cars — straight & back
      for (const c of intersectionCars) {
        c.pos += c.speed * c.dir * delta;
        if (c.dir > 0 && c.pos > c.route.max) { c.pos = c.route.max; c.dir = -1; }
        else if (c.dir < 0 && c.pos < c.route.min) { c.pos = c.route.min; c.dir = 1; }
        updateStraightCarTransform(c);
      }

      // Intersection lights
      for (const l of intersectionLights) {
        l.r.material.emissiveIntensity = 0;
        l.y.material.emissiveIntensity = 0;
        l.gr.material.emissiveIntensity = 0;
        if (aiSystem.isGreen(l.road)) l.gr.material.emissiveIntensity = 4.5;
        else if (aiSystem.isYellowRoad(l.road)) l.y.material.emissiveIntensity = 5;
        else l.r.material.emissiveIntensity = 4.5;
      }

      // People
      for (const p of people) {
        p.angle += p.speed * p.dir;
        if (p.angle > Math.PI * 2) p.angle -= Math.PI * 2;
        if (p.angle < 0) p.angle += Math.PI * 2;
        p.obj.position.x = p.cx + Math.cos(p.angle) * p.r;
        p.obj.position.z = p.cz + Math.sin(p.angle) * p.r;
        const swing = Math.sin(t * 6 + p.phase) * 0.4;
        p.legL.rotation.x = swing; p.legR.rotation.x = -swing;
      }

      // Turbines
      if (fc % 3 === 0) for (const bl of turbines) bl.rotation.z = t * 2.4;

      // Radar + controller
      if (s.radar) s.radar.rotation.z = t * 1.7;
      if (s.controllerRing) s.controllerRing.rotation.z = t * 0.5;
      if (s.cSig) s.cSig.scale.setScalar(1 + Math.sin(t * 4) * 0.15);

      // Battery rings pulse
      for (let i = 0; i < s.powerRings.length; i++) {
        const r = s.powerRings[i];
        r.rotation.z = t * 0.8 + i;
      }

      // Filtration cycle
      s.filtrationStageElapsed += delta;
      const curFilt = FILTRATION_STAGES[s.filtrationStageIndex];
      if (s.filtrationStageElapsed >= curFilt.duration) {
        s.filtrationStageElapsed = 0;
        s.filtrationStageIndex = (s.filtrationStageIndex + 1) % FILTRATION_STAGES.length;
      }
      onFiltrationUpdate?.({
        stageIndex: s.filtrationStageIndex,
        stage: FILTRATION_STAGES[s.filtrationStageIndex],
        allStages: FILTRATION_STAGES,
        progress: s.filtrationStageElapsed / curFilt.duration,
      });
      for (let i = 0; i < s.filtrationStageMeshes.length; i++) {
        const sm = s.filtrationStageMeshes[i];
        const isActive = i === s.filtrationStageIndex;
        if (isActive) {
          sm.tankBody.material.emissiveIntensity = 1.2 + Math.sin(t * 4) * 0.6;
          const fillH = 30 + Math.sin(t * 2.5) * 10;
          sm.waterFill.scale.y = fillH;
          sm.waterFill.position.y = sm.baseY + fillH / 2;
          sm.waterFill.material.color.setHex(STAGE_WATER_COLORS[i]);
          sm.waterFill.material.emissive.setHex(STAGE_WATER_COLORS[i]);
        } else {
          sm.tankBody.material.emissiveIntensity = 0.4;
          sm.waterFill.scale.y = 8;
          sm.waterFill.position.y = sm.baseY + 4;
        }
      }

      // Power cycle
      s.powerStageElapsed += delta;
      const curPower = POWER_STAGES[s.powerStageIndex];
      if (s.powerStageElapsed >= curPower.duration) {
        s.powerStageElapsed = 0;
        s.powerStageIndex = (s.powerStageIndex + 1) % POWER_STAGES.length;
      }
      onPowerUpdate?.({
        stageIndex: s.powerStageIndex,
        stage: POWER_STAGES[s.powerStageIndex],
        allStages: POWER_STAGES,
        progress: s.powerStageElapsed / curPower.duration,
      });

      // Food cycle
      s.foodStageElapsed += delta;
      const curFood = FOOD_STAGES[s.foodStageIndex];
      if (s.foodStageElapsed >= curFood.duration) {
        s.foodStageElapsed = 0;
        s.foodStageIndex = (s.foodStageIndex + 1) % FOOD_STAGES.length;
      }
      onFoodUpdate?.({
        stageIndex: s.foodStageIndex,
        stage: FOOD_STAGES[s.foodStageIndex],
        allStages: FOOD_STAGES,
        progress: s.foodStageElapsed / curFood.duration,
      });

      // Food conveyor items
      for (const item of s.foodConveyorItems) {
        item.position.x += item.userData.speed * delta * 30;
        if (item.position.x > item.userData.startX + 140) item.position.x = item.userData.startX;
        item.position.y = 18 + Math.sin(t * 5 + item.userData.offset) * 2;
      }
      for (let i = 0; i < s.foodCropMeshes.length; i++) {
        s.foodCropMeshes[i].rotation.y = Math.sin(t * 2 + i) * 0.1;
      }

      // Camera transition
      if (s.camTransition) {
        const now = performance.now();
        const elapsed = now - s.camTransition.startTime;
        const tt = Math.min(elapsed / s.camTransition.duration, 1);
        const ease = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2;
        camera.position.lerpVectors(s.camTransition.startPos, s.camTransition.targetPos, ease);
        controls.target.lerpVectors(s.camTransition.startLook, s.camTransition.targetLook, ease);
        if (tt >= 1) s.camTransition = null;
      }

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("click", onClick);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div ref={mountRef} style={{ position: "fixed", inset: 0 }} />
      {toast && (
        <div key={toastKey} style={{
          position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
          zIndex: 10000, background: "rgba(8,20,35,0.95)",
          border: "1.5px solid #22cfff", borderRadius: 10, padding: "10px 18px",
          color: "#e8f7ff", fontFamily: "system-ui", fontSize: 12, fontWeight: 600,
          boxShadow: "0 0 30px rgba(34,207,255,0.5)", backdropFilter: "blur(12px)",
        }}>{toast.msg}</div>
      )}
    </>
  );
});

export default SmartCity3D;
