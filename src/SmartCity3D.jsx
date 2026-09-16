import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const CITY_HALF = 3900;
const ROAD_HALF_LEN = 3800;
const GROUND_SIZE = 8200;
const CAR_Y = 5.0;

/* ═══════════════ LOCATIONS DATA ═══════════════ */
export const LOCATIONS = {
  school: { key: "school", label: "Beacon School System", icon: "🏫", type: "school", position: [-600, 5, -600], info: "American curriculum · AI classrooms · 450 students · 32 teachers · Robotics lab · Smart boards" },
  hospital: { key: "hospital", label: "Smart City Hospital", icon: "🏥", type: "hospital", position: [600, 5, -600], info: "24/7 emergency · AI diagnosis · Robotic surgery · 8 ICU beds · 32 patients" },
  bank: { key: "bank", label: "Smart City State Bank", icon: "🏦", type: "bank", position: [600, 5, 600], info: "Digital banking · AI fraud detection · 8 ATMs · 1,240 transactions/hour" },
  society: { key: "society", label: "BSS Smart Society", icon: "🏘", type: "society", position: [-600, 5, 600], info: "12 smart residential towers · IoT security · 2,400 residents · 82% solar" },
  farm: { key: "farm", label: "Smart Eco Farm", icon: "🌾", type: "farm", position: [1800, 5, -600], info: "IoT sensors · Drip irrigation · 3 drones · 94% crop health" },
  event: { key: "event", label: "Liverpool Event Hall", icon: "🎪", type: "event", position: [600, 5, 1800], info: "Events · Concerts · Capacity 2,000 · Smart lighting" },
  gas: { key: "gas", label: "Gas Station · Car Wash", icon: "🚗", type: "gas", position: [1800, 5, 1750], info: "Automated car wash · 4 EV chargers · 6 fuel pumps · 78% recycling" },
  sewage: { key: "sewage", label: "Sewage & Gas Co.", icon: "🏭", type: "sewage", position: [1800, 5, 600], info: "AI sewage treatment · Biogas 2.1 MW · 8M L/day" },
  culture: { key: "culture", label: "Culture Center", icon: "🏛", type: "culture", position: [-1800, 5, 1800], info: "Museums · Art galleries · VR tours · 45 exhibits" },
  powerCompany: { key: "powerCompany", label: "City Power Supply Co.", icon: "🔌", type: "powerCompany", position: [-1600, 5, 800], info: "Grid monitoring · 68 MW load · 0 outages" },
  scifi9: { key: "scifi9", label: "Sci-Fi Building 9", icon: "🛸", type: "scifi", position: [-3900, 5, -2400], info: "Futuristic R&D · Quantum computing · 12 active labs" },
  tower: { key: "tower", label: "Beautiful Tower", icon: "🗼", type: "tower", position: [-3600, 5, -800], info: "320m landmark · Observation deck · Smart show lighting" },
  scifi10: { key: "scifi10", label: "Sci-Fi Building 10", icon: "🚀", type: "scifi", position: [-3600, 5, 800], info: "Space tech · 6 satellites linked · AI missions" },
  traffic: { key: "traffic", label: "AI Traffic Controller", icon: "🚦", type: "traffic", position: [0, 5, 0], info: "4 roads · Adaptive signals · 24 sensors" },
  power: { key: "power", label: "Power Supply Zone", icon: "⚡", type: "power", position: [-5400, 5, 3600], info: "Solar 42 MW + Wind 28 MW = 70 MW" },
  filtration: { key: "filtration", label: "Filtration System", icon: "💧", type: "filtration", position: [2600, 5, -2600], info: "9-stage · 12M L/day · 99.7% purity" },
  food: { key: "food", label: "AI Food Production", icon: "🍎", type: "food", position: [2900, 5, -1200], info: "9 fields · Drones · 48 daily deliveries" },
  waste: { key: "waste", label: "Waste Management", icon: "♻️", type: "waste", position: [2900, 5, 2900], info: "Recycling · Biogas 4.2 MW · 68% recycled" },
};

/* ═══════════════ STAGES ═══════════════ */
const FILTRATION_STAGES = [
  { id: "wastewater", label: "Wastewater Collection", color: 0x6b4a2f, duration: 5, desc: "Raw sewage intake" },
  { id: "primary", label: "Primary Filtration", color: 0x8a7a4a, duration: 5, desc: "Screens remove solids" },
  { id: "biological", label: "Biological Treatment", color: 0x4a8a5a, duration: 5, desc: "Bacteria break organics" },
  { id: "aeration", label: "Aeration", color: 0x4ac8e0, duration: 5, desc: "Oxygen activates microbes" },
  { id: "clarification", label: "Clarification", color: 0x6ab0d0, duration: 5, desc: "Sludge settles out" },
  { id: "advanced", label: "Advanced Filtration", color: 0x3aa0d0, duration: 5, desc: "Membrane micro-filter" },
  { id: "uv", label: "UV Purification", color: 0x9a6aff, duration: 5, desc: "UV kills pathogens" },
  { id: "storage", label: "Clean Water Storage", color: 0x22cfff, duration: 5, desc: "Reservoir ready" },
  { id: "recycling", label: "Water Recycling", color: 0x2ecc71, duration: 5, desc: "82% returned to city" },
];

const POWER_STAGES = [
  { id: "solar", label: "Solar Array", color: 0xffcc22, duration: 5, desc: "42 MW from solar" },
  { id: "wind", label: "Wind Turbines", color: 0x22cfff, duration: 5, desc: "28 MW from wind" },
  { id: "battery", label: "Battery Storage", color: 0x22ff9d, duration: 5, desc: "78% charge" },
  { id: "grid", label: "Grid Distribution", color: 0xff6b6b, duration: 5, desc: "Load balanced" },
  { id: "load", label: "City Load Balance", color: 0xb266ff, duration: 5, desc: "Real-time matching" },
];

const FOOD_STAGES = [
  { id: "planting", label: "Smart Planting", color: 0x2ecc71, duration: 5, desc: "9 fields · AI seeds" },
  { id: "irrigation", label: "Smart Irrigation", color: 0x22cfff, duration: 5, desc: "Sprinklers · 68% moisture" },
  { id: "monitoring", label: "Drone Monitoring", color: 0xffcc22, duration: 5, desc: "3 drones · 94% health" },
  { id: "harvest", label: "Robotic Harvest", color: 0xe67e22, duration: 5, desc: "Auto-harvesters" },
  { id: "processing", label: "Food Processing", color: 0x9b59b6, duration: 5, desc: "Washing · packing" },
  { id: "distribution", label: "City Distribution", color: 0xff6b6b, duration: 5, desc: "48 deliveries daily" },
];

const WASTE_STAGES = [
  { id: "collection", label: "Waste Collection", color: 0x8a6a3a, duration: 5, desc: "Smart bins collecting" },
  { id: "segregation", label: "Segregation", color: 0x3498db, duration: 5, desc: "4 streams sorting" },
  { id: "recycling", label: "Recycling", color: 0x2ecc71, duration: 5, desc: "Processing recyclables" },
  { id: "biogas", label: "Biogas Generation", color: 0x4a7a3a, duration: 5, desc: "4.2 MW output" },
  { id: "composting", label: "Composting", color: 0x5a3a1a, duration: 5, desc: "Organic compost" },
  { id: "disposal", label: "Safe Disposal", color: 0x8a3a3a, duration: 5, desc: "Incineration" },
];

/* ═══════════════ AI TRAFFIC SYSTEM ═══════════════ */
function createAITrafficSystem(cb) {
  const PHASES = [
    { id: "NS", green: [1, 2], label: "NORTH-SOUTH GREEN" },
    { id: "EW", green: [3, 4], label: "EAST-WEST GREEN" },
  ];
  let pIdx = 0, elapsed = 0, inYellow = false, yEl = 0, inRed = false, rEl = 0;
  const queues = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const log = [];
  const stats = { vehiclesMoving: 0, vehiclesWaiting: 0, density: "LOW", phaseTimeRemaining: 8 };
  function addLog(m) { log.unshift({ message: m, time: Date.now() }); if (log.length > 5) log.pop(); }
  addLog("AI Traffic initialized");

  return {
    tick(delta) {
      const cur = PHASES[pIdx];
      if (inRed) {
        rEl += delta;
        if (rEl >= 0.8) { inRed = false; rEl = 0; pIdx = (pIdx + 1) % 2; elapsed = 0; addLog(`→ ${PHASES[pIdx].label}`); }
      } else if (inYellow) {
        yEl += delta;
        if (yEl >= 2.5) { inYellow = false; yEl = 0; inRed = true; }
      } else {
        elapsed += delta;
        if (elapsed >= 8) { inYellow = true; yEl = 0; addLog("Yellow transition"); }
      }
      for (let r = 1; r <= 4; r++) {
        if (cur.green.includes(r) && !inYellow && !inRed) queues[r] = Math.max(0, queues[r] - delta * 3);
        else queues[r] = Math.min(30, queues[r] + delta * 2);
      }
      const tq = Object.values(queues).reduce((a, b) => a + b, 0);
      stats.vehiclesMoving = inYellow || inRed ? 0 : cur.green.length * 6;
      stats.vehiclesWaiting = Math.floor(tq * 1.5);
      stats.density = tq > 40 ? "HIGH" : tq > 20 ? "MEDIUM" : "LOW";
      stats.phaseTimeRemaining = inRed ? 0.8 - rEl : inYellow ? 2.5 - yEl : 8 - elapsed;
      cb({
        inYellow, inAllRed: inRed,
        currentGreenRoads: (inYellow || inRed) ? [] : cur.green,
        phaseProgress: elapsed / 8,
        phaseLabel: inRed ? "ALL RED" : inYellow ? `${cur.label} — YELLOW` : cur.label,
        stats: { ...stats },
        decisionLog: [...log],
      });
    },
    isGreen: (r) => !inYellow && !inRed && PHASES[pIdx].green.includes(r),
    isYellowRoad: (r) => inYellow && PHASES[pIdx].green.includes(r),
  };
}

/* ═══════════════ BUILDING BORDER ═══════════════ */
function makeBorder(scene, borderLights, pos, size, color) {
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.5, metalness: 0.7, roughness: 0.2 });
  borderLights.push(m);
  const fw = size * 1.4;
  const half = fw / 2;
  const front = new THREE.Mesh(new THREE.BoxGeometry(fw, 2.5, 6), m);
  front.position.set(pos[0], 6.5, pos[1] + half + 10);
  scene.add(front);
  const back = front.clone(); back.position.z = pos[1] - half - 10; scene.add(back);
  const left = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, fw), m);
  left.position.set(pos[0] - half - 10, 6.5, pos[1]); scene.add(left);
  const right = left.clone(); right.position.x = pos[0] + half + 10; scene.add(right);
  // Corner posts
  for (const cx of [-1, 1]) for (const cz of [-1, 1]) {
    const px = pos[0] + cx * (half + 10);
    const pz = pos[1] + cz * (half + 10);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 30, 10), m);
    post.position.set(px, 20, pz); scene.add(post);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 4 });
    borderLights.push(capMat);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(3.5, 12, 12), capMat);
    cap.position.set(px, 37, pz); scene.add(cap);
  }
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
const SmartCity3D = forwardRef((props, ref) => {
  const mountRef = useRef(null);
  const s = useRef({
    camera: null, controls: null, renderer: null, scene: null,
    camTransition: null, cars: [],
    intLights: [], turbines: [], bulbMats: [], batteryRings: [], borderLights: [], clickable: [],
    controllerRing: null, controllerSig: null, radar: null,
    aiSystem: null,
    pIdx: 0, pEl: 0, fIdx: 0, fEl: 0, foIdx: 0, foEl: 0, wIdx: 0, wEl: 0,
    grassMat: null, roadMat: null, roadLaneMat: null, sidewalkMat: null, ambient: null, sun: null,
    filtTanks: [], foodCrops: [], foodSprinklers: [], foodConveyor: [], foodGears: [], foodDroneRotors: [], foodDrone: null, foodBeacon: null,
    wasteBins: [], wasteConveyor: [], wasteSmoke: [], wasteSteam: [], wasteFlame: null, wasteGears: [],
    powerRings: [],
    onAITrafficUpdate: null, onPowerUpdate: null, onFiltrationUpdate: null, onFoodUpdate: null, onWasteUpdate: null, onPanel: null,
  }).current;

  s.onAITrafficUpdate = props.onAITrafficUpdate;
  s.onPowerUpdate = props.onPowerUpdate;
  s.onFiltrationUpdate = props.onFiltrationUpdate;
  s.onFoodUpdate = props.onFoodUpdate;
  s.onWasteUpdate = props.onWasteUpdate;
  s.onPanel = props.onPanel;

  useImperativeHandle(ref, () => ({
    goToOverview: () => smoothCam(new THREE.Vector3(1400, 950, 1400), new THREE.Vector3(0, 5, 0)),
    goToTopDown: () => smoothCam(new THREE.Vector3(0, 2800, 500), new THREE.Vector3(0, 0, 0)),
    setDayNight: (n) => setDayNight(n),
    goToSystem: (k) => goToSystem(k),
    goToLocation: (k) => goToLocation(k),
  }));

  function smoothCam(pos, look, dur = 1500) {
    if (!s.camera || !s.controls) return;
    s.camTransition = { startPos: s.camera.position.clone(), targetPos: pos, startLook: s.controls.target.clone(), targetLook: look, startTime: performance.now(), duration: dur };
  }

  function goToSystem(k) {
    const P = {
      traffic: [[0, 350, 600], [0, 5, 0]],
      power: [[-5400, 500, 4400], [-5400, 5, 3600]],
      filtration: [[2600, 500, -1900], [2600, 5, -2600]],
      food: [[2900, 500, -400], [2900, 5, -1200]],
      waste: [[2900, 500, 3600], [2900, 5, 2900]],
    };
    if (P[k]) smoothCam(new THREE.Vector3(...P[k][0]), new THREE.Vector3(...P[k][1]), 1800);
  }

  function goToLocation(k) {
    const L = LOCATIONS[k];
    if (!L) return;
    const [x, y, z] = L.position;
    smoothCam(new THREE.Vector3(x + 400, 400, z + 400), new THREE.Vector3(x, y, z), 1800);
  }

  function setDayNight(n) {
    if (!s.scene) return;
    s.scene.background = new THREE.Color(n ? 0x050a14 : 0x8fbcd4);
    s.ambient.intensity = n ? 0.5 : 2.8;
    s.sun.intensity = n ? 0.35 : 2.6;
    if (s.grassMat) s.grassMat.color.setHex(n ? 0x1a3a24 : 0x4d8f50);
    if (s.roadMat) s.roadMat.color.setHex(n ? 0x0e1418 : 0x2a3238);
    if (s.roadLaneMat) s.roadLaneMat.color.setHex(n ? 0x080c10 : 0x1e2428);
    if (s.sidewalkMat) s.sidewalkMat.color.setHex(n ? 0x353a3e : 0x8a8f94);
    s.bulbMats.forEach(m => m.emissiveIntensity = n ? 6.5 : 1.8);
    s.batteryRings.forEach(m => m.emissiveIntensity = n ? 5.5 : 2.0);
    s.borderLights.forEach(m => m.emissiveIntensity = n ? 6.5 : 3.0);
  }

  useEffect(() => {
    const c = mountRef.current;
    if (!c) return;
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
    c.appendChild(renderer.domElement);
    s.renderer = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.minDistance = 200;
    controls.maxDistance = 8000;
    controls.target.set(0, 5, 0);
    s.controls = controls;

    const ambient = new THREE.HemisphereLight(0xffffff, 0x4a7a56, 2.8);
    scene.add(ambient); s.ambient = ambient;
    const sun = new THREE.DirectionalLight(0xffffff, 2.6);
    sun.position.set(-800, 1400, 500); scene.add(sun); s.sun = sun;
    const fill = new THREE.DirectionalLight(0xd0e8ff, 1.2);
    fill.position.set(800, 1000, -500); scene.add(fill);

    const mat = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    const grassMat = mat(0x4d8f50, 0.98);
    const roadMat = mat(0x2a3238, 0.96);
    const roadLaneMat = mat(0x1e2428, 0.96);
    const yellowLine = mat(0xf5c84b, 0.65);
    const darkMat = mat(0x182327, 0.65, 0.15);
    const sidewalkMat = mat(0x8a8f94, 0.9);
    s.grassMat = grassMat; s.roadMat = roadMat; s.roadLaneMat = roadLaneMat; s.sidewalkMat = sidewalkMat;

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE), grassMat);
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    /* ═══ BOUNDARY ═══ */
    const boundMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 3, metalness: 0.7, roughness: 0.2 });
    s.borderLights.push(boundMat);
    [[CITY_HALF * 2 + 20, 3, 20, 0, 6, CITY_HALF], [CITY_HALF * 2 + 20, 3, 20, 0, 6, -CITY_HALF],
     [20, 3, CITY_HALF * 2 + 20, -CITY_HALF, 6, 0], [20, 3, CITY_HALF * 2 + 20, CITY_HALF, 6, 0]].forEach(([w, h, d, x, y, z]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boundMat);
      m.position.set(x, y, z); scene.add(m);
    });

    /* ═══ ROADS ═══ */
    const ROAD_W = 110, ROAD_HALF = ROAD_W / 2, ROAD_LEN = ROAD_HALF_LEN * 2;
    const roadZs = [-2400, -1200, 0, 1200, 2400];
    const roadXs = [-2400, -1200, 0, 1200, 2400];
    function roadE(z) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LEN, 0.25, ROAD_W + 20), roadLaneMat); sh.position.set(0, 4.55, z); scene.add(sh);
      const r = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LEN, 0.45, ROAD_W), roadMat); r.position.set(0, 4.7, z); scene.add(r);
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LEN, 0.1, 2), yellowLine); c1.position.set(0, 5, z - 2.5); scene.add(c1);
      const c2 = c1.clone(); c2.position.z = z + 2.5; scene.add(c2);
    }
    function roadN(x) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W + 20, 0.25, ROAD_LEN), roadLaneMat); sh.position.set(x, 4.55, 0); scene.add(sh);
      const r = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W, 0.45, ROAD_LEN), roadMat); r.position.set(x, 4.7, 0); scene.add(r);
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, ROAD_LEN), yellowLine); c1.position.set(x - 2.5, 5, 0); scene.add(c1);
      const c2 = c1.clone(); c2.position.x = x + 2.5; scene.add(c2);
    }
    roadZs.forEach(roadE);
    roadXs.forEach(roadN);
    roadZs.forEach(z => {
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LEN, 0.3, 10), sidewalkMat); s1.position.set(0, 5.05, z + ROAD_HALF + 10); scene.add(s1);
      const s2 = s1.clone(); s2.position.z = z - ROAD_HALF - 10; scene.add(s2);
    });

    /* ═══ WALL ═══ */
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a6670, roughness: 0.85, metalness: 0.15 });
    [[25, 100, CITY_HALF * 2 + 50, CITY_HALF, 55, 0], [25, 100, CITY_HALF * 2 + 50, -CITY_HALF, 55, 0],
     [CITY_HALF * 2 + 50, 100, 25, 0, 55, CITY_HALF], [CITY_HALF * 2 + 50, 100, 25, 0, 55, -CITY_HALF]].forEach(([w, h, d, x, y, z]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      m.position.set(x, y, z); scene.add(m);
    });

    /* ═══ STREET LIGHTS ═══ */
    s.bulbMats = [];
    function streetLight(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 11, 5), darkMat); pole.position.y = 5.5; g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.22, 0.22), darkMat); arm.position.set(1.5, 10, 0); g.add(arm);
      const bMat = new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffd36a, emissiveIntensity: 1.8 });
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), bMat); b.position.set(3, 9.8, 0); g.add(b);
      scene.add(g); s.bulbMats.push(bMat);
    }
    roadZs.forEach(z => {
      for (let x = -ROAD_HALF_LEN + 100; x <= ROAD_HALF_LEN - 100; x += 400) {
        streetLight(x, z + ROAD_HALF + 18);
        streetLight(x, z - ROAD_HALF - 18);
      }
    });

    /* ═══ TRAFFIC LIGHTS ═══ */
    s.intLights = [];
    function trafficLight(x, z, road, faceAngle) {
      const g = new THREE.Group(); g.position.set(x, 5, z); g.rotation.y = faceAngle;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 24, 8), mat(0x1a1a1a, 0.5, 0.6)); pole.position.y = 12; g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(20, 0.7, 0.7), mat(0x1a1a1a, 0.5, 0.6)); arm.position.set(10, 23, 0); g.add(arm);
      const box = new THREE.Mesh(new THREE.BoxGeometry(4, 11, 4), mat(0x0a0a0a, 0.7, 0.4)); box.position.set(18, 23, 0); g.add(box);
      const light = (col, y) => {
        const core = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 24), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0 })); core.position.set(18, y, 2.2); g.add(core);
        const halo = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 20), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false })); halo.position.set(18, y, 2.2); g.add(halo);
        return { core, halo };
      };
      const r = light(0xff2222, 26.5);
      const y = light(0xffcc22, 23);
      const gr = light(0x22ff66, 19.5);
      scene.add(g);
      s.intLights.push({ road, r: r.core, rH: r.halo, y: y.core, yH: y.halo, gr: gr.core, grH: gr.halo });
    }
    trafficLight(-110, -110, 1, Math.PI / 4);
    trafficLight(110, 110, 2, -Math.PI * 3 / 4);
    trafficLight(110, -110, 3, Math.PI * 3 / 4);
    trafficLight(-110, 110, 4, -Math.PI / 4);

    /* ═══ AI TRAFFIC TOWER ═══ */
    const tower = new THREE.Group(); tower.position.set(0, 5, 0);
    const tBase = new THREE.Mesh(new THREE.CylinderGeometry(65, 75, 5, 32), mat(0x142f3b, 0.28, 0.5)); tBase.position.y = 2.5; tower.add(tBase);
    s.controllerRing = new THREE.Mesh(new THREE.TorusGeometry(63, 1.8, 10, 48), new THREE.MeshStandardMaterial({ color: 0x32dfff, emissive: 0x18cfff, emissiveIntensity: 3 }));
    s.controllerRing.rotation.x = Math.PI / 2; s.controllerRing.position.y = 5.5; tower.add(s.controllerRing);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(50, 1.2, 10, 48), new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 2.5 }));
    ring2.rotation.x = Math.PI / 2; ring2.position.y = 9; tower.add(ring2);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const bMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 5 });
      const b = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), bMat);
      b.position.set(Math.cos(a) * 60, 8, Math.sin(a) * 60); tower.add(b);
      s.borderLights.push(bMat);
    }
    const tBody = new THREE.Mesh(new THREE.CylinderGeometry(20, 26, 55, 10), mat(0x185a72, 0.3, 0.5)); tBody.position.y = 30; tower.add(tBody);
    const tUp = new THREE.Mesh(new THREE.CylinderGeometry(26, 24, 14, 12), new THREE.MeshStandardMaterial({ color: 0x0a3345, emissive: 0x1a7a9a, emissiveIntensity: 2 })); tUp.position.y = 64; tower.add(tUp);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const wMat = new THREE.MeshStandardMaterial({ color: 0x03141b, emissive: 0x21cfff, emissiveIntensity: 4 });
      const w = new THREE.Mesh(new THREE.BoxGeometry(5, 7, 0.6), wMat);
      w.position.set(Math.cos(a) * 24, 64, Math.sin(a) * 24); w.rotation.y = -a; tower.add(w);
      s.borderLights.push(wMat);
    }
    s.radar = new THREE.Mesh(new THREE.TorusGeometry(12, 1, 10, 32), new THREE.MeshStandardMaterial({ color: 0x61e7ff, emissive: 0x23dfff, emissiveIntensity: 3 }));
    s.radar.rotation.x = Math.PI / 2; s.radar.position.y = 80; tower.add(s.radar);
    s.controllerSig = new THREE.Mesh(new THREE.SphereGeometry(3.5, 20, 20), new THREE.MeshStandardMaterial({ color: 0x66e5ff, emissive: 0x33dfff, emissiveIntensity: 5 }));
    s.controllerSig.position.y = 95; tower.add(s.controllerSig);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 35, 6), mat(0x99a0a6, 0.4, 0.6));
    ant.position.y = 112; tower.add(ant);
    scene.add(tower);
    s.clickable.push({ object: tower, type: "traffic", name: "AI Traffic Controller" });
        /* ═══ OCCUPANCY ═══ */
    const occupied = [
      { x: -600, z: -600, r: 260 }, { x: 600, z: -600, r: 250 }, { x: 600, z: 600, r: 300 },
      { x: 1800, z: -600, r: 400 }, { x: 600, z: 1800, r: 290 }, { x: 1800, z: 1750, r: 320 },
      { x: 1800, z: 600, r: 290 }, { x: 0, z: 0, r: 200 }, { x: -5400, z: 3600, r: 1200 },
      { x: 2600, z: -2600, r: 700 }, { x: 2900, z: 2900, r: 700 }, { x: 2900, z: -1200, r: 550 },
      { x: -1600, z: 800, r: 260 }, { x: -1800, z: 1800, r: 400 },
      { x: -3900, z: -2400, r: 350 }, { x: -3600, z: -800, r: 400 }, { x: -3600, z: 800, r: 350 },
    ];
    const isOnBld = (x, z) => occupied.some(o => (x - o.x) ** 2 + (z - o.z) ** 2 < o.r * o.r);
    const isOnRd = (x, z) => {
      for (const rz of roadZs) if (Math.abs(z - rz) < 100) return true;
      for (const rx of roadXs) if (Math.abs(x - rx) < 100) return true;
      return false;
    };

    /* ═══ TREES ═══ */
    const trunkMat = mat(0x5a3d24, 0.95, 0.05), leafMat = mat(0x2d6e3d, 0.9);
    const trunkGeo = new THREE.CylinderGeometry(2.2, 3.5, 28, 7), leafGeo = new THREE.ConeGeometry(18, 42, 8);
    for (let i = 0; i < 150; i++) {
      const x = (Math.random() - 0.5) * (CITY_HALF * 2 - 400);
      const z = (Math.random() - 0.5) * (CITY_HALF * 2 - 400);
      if (isOnBld(x, z) || isOnRd(x, z)) continue;
      const g = new THREE.Group(); g.position.set(x, 5, z); g.scale.setScalar(0.8 + Math.random() * 0.6);
      const t = new THREE.Mesh(trunkGeo, trunkMat); t.position.y = 14; g.add(t);
      const l = new THREE.Mesh(leafGeo, leafMat); l.position.y = 38; g.add(l);
      scene.add(g);
    }

    /* ═══ SMALL BUILDINGS WITH BORDERS ═══ */
    function smallBld(x, z, w, h, d, color, name) {
      if (isOnRd(x, z)) return;
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, 0.6, 0.3)); b.position.y = h / 2; g.add(b);
      const r = new THREE.Mesh(new THREE.BoxGeometry(w + 2, 2, d + 2), mat(0x1a1a1a, 0.5, 0.6)); r.position.y = h + 1; g.add(r);
      const wMat = new THREE.MeshStandardMaterial({ color: 0xffcc22, emissive: 0xffcc22, emissiveIntensity: 1.5 });
      const lvl = Math.max(2, Math.floor(h / 15));
      for (let i = 1; i <= lvl; i++) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 2, d + 0.5), wMat); band.position.y = (h / (lvl + 1)) * i; g.add(band);
      }
      scene.add(g);
      // Border
      makeBorder(scene, s.borderLights, [x, z], w, color);
      s.clickable.push({ object: g, type: "building", name: name || "Small Building" });
    }
    smallBld(-800, -300, 30, 20, 30, 0x8e44ad, "Small Office 1"); smallBld(800, -300, 30, 20, 30, 0xf39c12, "Small Office 2");
    smallBld(-800, 300, 30, 20, 30, 0x3498db, "Small Office 3"); smallBld(800, 300, 30, 20, 30, 0xe74c3c, "Small Office 4");
    smallBld(-1500, -900, 40, 25, 40, 0x9b59b6, "Residence 1"); smallBld(1500, -900, 40, 25, 40, 0x16a085, "Residence 2");
    smallBld(-1500, 900, 40, 25, 40, 0x2ecc71, "Residence 3"); smallBld(1500, 900, 40, 25, 40, 0xd35400, "Residence 4");
    smallBld(-2100, -500, 45, 30, 45, 0x34495e, "Warehouse A"); smallBld(2100, -500, 45, 30, 45, 0x8e44ad, "Warehouse B");
    smallBld(-2100, 500, 45, 30, 45, 0xe67e22, "Warehouse C"); smallBld(2100, 500, 45, 30, 45, 0x2980b9, "Warehouse D");
    smallBld(-2700, -2700, 50, 35, 50, 0x5b9bd5, "Shop 1"); smallBld(2700, -2700, 50, 35, 50, 0xc0629b, "Shop 2");
    smallBld(-2700, 2700, 50, 35, 50, 0xf5a623, "Shop 3"); smallBld(2700, 2700, 50, 35, 50, 0x6cd4a0, "Shop 4");

    /* ═══ GLB BUILDINGS WITH BORDERS + FALLBACK ═══ */
    const loader = new GLTFLoader();
    function prep(o, size) {
      const b = new THREE.Box3().setFromObject(o);
      const sz = new THREE.Vector3(); b.getSize(sz);
      const max = Math.max(sz.x, sz.y, sz.z);
      o.scale.setScalar(size / Math.max(max, 0.001));
      const b2 = new THREE.Box3().setFromObject(o);
      const c2 = new THREE.Vector3(); b2.getCenter(c2);
      o.position.x -= c2.x; o.position.z -= c2.z; o.position.y -= b2.min.y;
    }
    function bld(file, size, pos, type, name, col) {
      const fallback = () => {
        const g = new THREE.Group();
        const h = size * 0.8;
        const b = new THREE.Mesh(new THREE.BoxGeometry(size, h, size), mat(col, 0.6, 0.4));
        b.position.set(pos[0], 5 + h / 2, pos[1]); g.add(b);
        const wMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 0.8 });
        for (let i = 0; i < 4; i++) {
          const band = new THREE.Mesh(new THREE.BoxGeometry(size + 1, 2, size + 1), wMat);
          band.position.set(pos[0], 5 + h * (i + 1) / 5, pos[1]);
          g.add(band);
        }
        const cap = new THREE.Mesh(new THREE.BoxGeometry(size * 0.9, 4, size * 0.9), mat(0x1a1a1a, 0.5, 0.6));
        cap.position.set(pos[0], 5 + h + 2, pos[1]); g.add(cap);
        scene.add(g);
        s.clickable.push({ object: g, type, name });
        makeBorder(scene, s.borderLights, pos, size, col);
      };
      loader.load(file, (g) => {
        const b = g.scene;
        prep(b, size);
        b.position.set(pos[0], 5, pos[1]);
        scene.add(b);
        s.clickable.push({ object: b, type, name });
        makeBorder(scene, s.borderLights, pos, size, col);
      }, undefined, fallback);
    }

    bld("/american_high_school.glb", 300, [-600, -600], "school", "Beacon School System", 0x1a5490);
    bld("/low_poly_hospital.glb", 280, [600, -600], "hospital", "Smart City Hospital", 0xc0392b);
    bld("/us_bank_tower.glb", 360, [600, 600], "bank", "Smart City State Bank", 0x8e44ad);
    bld("/simple_farm_free.glb", 520, [1800, -600], "farm", "Smart Eco Farm", 0x27ae60);
    bld("/liverpool_street_station_south_entrance.glb", 420, [600, 1800], "event", "Liverpool Event Hall", 0xd4a017);
    bld("/gas_station.glb", 380, [1800, 1750], "gas", "Gas Station · Car Wash", 0xc0392b);
    bld("/office.glb", 380, [1800, 600], "sewage", "Sewage & Gas Co.", 0x2ecc71);
    bld("/national_archives_research_center.glb", 480, [-1800, 1800], "culture", "Culture Center", 0xf39c12);
    bld("/power-suply-companey.glb", 380, [-1600, 800], "powerCompany", "City Power Supply Co.", 0xf1c40f);
    bld("/sci-fi_building_9.glb", 440, [-3900, -2400], "scifi", "Sci-Fi Building 9", 0x66ff99);
    bld("/beautifultowerbuilding.glb", 520, [-3600, -800], "tower", "Beautiful Tower", 0x22cfff);
    bld("/sci-fi_building_10.glb", 440, [-3600, 800], "scifi", "Sci-Fi Building 10", 0xff66dd);

    /* ═══ SOCIETY TOWERS WITH BORDER ═══ */
    const innerG = new THREE.Mesh(new THREE.BoxGeometry(820, 0.6, 820), mat(0xb8bcc0, 0.92));
    innerG.position.set(-600, 4.85, 600); scene.add(innerG);
    const socGroup = new THREE.Group();
    socGroup.position.set(-600, 0, 600); scene.add(socGroup);
    const towerCols = [0x5b9bd5, 0x7bb3e0, 0xc0629b, 0xf5a623, 0x6cd4a0, 0x9b7ad9, 0xe8635c];
    for (let r = 0; r < 4; r++) {
      for (let cc = 0; cc < 3; cc++) {
        const tx = -340 + (cc + 0.5) * (680 / 3);
        const tz = -340 + (r + 0.5) * (680 / 4);
        const h = 180 + Math.random() * 180;
        const towerCol = towerCols[Math.floor(Math.random() * towerCols.length)];
        const b = new THREE.Mesh(new THREE.BoxGeometry(30, h, 30), mat(towerCol, 0.4, 0.55));
        b.position.set(tx, 5 + h / 2, tz);
        socGroup.add(b);
        // Roof glow
        const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: towerCol, emissiveIntensity: 3 });
        const cap = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 12), capMat);
        cap.position.set(tx, 5 + h + 2, tz);
        socGroup.add(cap);
        s.borderLights.push(capMat);
      }
    }
    // Society border
    makeBorder(scene, s.borderLights, [-600, 600], 500, 0x2ecc71);
    s.clickable.push({ object: socGroup, type: "society", name: "BSS Smart Society" });

    /* ═══ BOARDS ═══ */
    function board(text, x, y, z, w = 200, h = 16, col = 0x22cfff) {
      const g = new THREE.Group(); g.position.set(x, y, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 14, 6), darkMat);
      pole.position.y = 7; g.add(pole);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.9), mat(col, 0.35, 0.25));
      b.position.y = 12; g.add(b);
      const cv = document.createElement("canvas"); cv.width = 1400; cv.height = 350;
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#" + col.toString(16).padStart(6, "0");
      ctx.fillRect(0, 0, 1400, 350);
      ctx.strokeStyle = "#78e9ff"; ctx.lineWidth = 12;
      ctx.strokeRect(10, 10, 1380, 330);
      ctx.fillStyle = "#fff"; ctx.font = "bold 82px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(text, 700, 175);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(w - 1, h - 0.8), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
      sm.position.set(0, 12, 0.5); g.add(sm);
      scene.add(g);
    }
    board("AI TRAFFIC CONTROL", 0, 5, 450, 320, 20, 0x22cfff);
    board("POWER SUPPLY", -5400, 5, 4400, 460, 22, 0xffcc22);
    board("WATER FILTRATION", 2600, 5, -1900, 460, 20, 0x22cfff);
    board("AI FOOD PRODUCTION", 2900, 5, -400, 420, 22, 0x2ecc71);
    board("WASTE MANAGEMENT", 2900, 5, 3600, 420, 22, 0x2ecc71);
    board("BEACON SCHOOL SYSTEM", -600, 5, -950, 320, 16, 0x1a5490);
    board("SMART CITY HOSPITAL", 600, 5, -950, 320, 16, 0xc0392b);
    board("SMART CITY STATE BANK", 600, 5, 950, 340, 16, 0x8e44ad);
    board("SMART ECO FARM", 1800, 5, -950, 260, 16, 0x27ae60);

    /* ═══════════════ POWER ZONE (with ground pad) ═══════════════ */
    const pZone = new THREE.Group();
    pZone.position.set(-5400, 0, 3600);
    scene.add(pZone);
    const pPad = new THREE.Mesh(new THREE.BoxGeometry(1700, 3, 1400), mat(0x1d3a2e, 0.92));
    pPad.position.set(0, 4, 0); pZone.add(pPad);
    const pBMat = new THREE.MeshStandardMaterial({ color: 0xffcc22, emissive: 0xffcc22, emissiveIntensity: 3, metalness: 0.7, roughness: 0.2 });
    s.borderLights.push(pBMat);
    [[1700, 3, 10, 0, 7, -700], [1700, 3, 10, 0, 7, 700], [10, 3, 1400, -850, 7, 0], [10, 3, 1400, 850, 7, 0]].forEach(([w, h, d, x, y, z]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), pBMat);
      m.position.set(x, y, z); pZone.add(m);
    });
    for (const cx of [-850, 850]) for (const cz of [-700, 700]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 40, 12), pBMat);
      post.position.set(cx, 25, cz); pZone.add(post);
      const capM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffcc22, emissiveIntensity: 6 });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 16), capM);
      cap.position.set(cx, 48, cz); pZone.add(cap); s.borderLights.push(capM);
    }
    const pHit = new THREE.Mesh(new THREE.PlaneGeometry(1700, 1400), new THREE.MeshBasicMaterial({ visible: false }));
    pHit.rotation.x = -Math.PI / 2; pHit.position.set(0, 6, 0); pZone.add(pHit);
    s.clickable.push({ object: pHit, type: "power", name: "Power Supply Zone" });

    s.turbines = [];
    const tMat = mat(0xf0f0f0, 0.4, 0.3);
    const tGeo = new THREE.CylinderGeometry(1.2, 2, 80, 8);
    const blGeo = new THREE.BoxGeometry(2.5, 32, 1);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
      const g = new THREE.Group();
      g.position.set(-700 + col * 240, 6, -550 + row * 380);
      g.scale.setScalar(1 + (row % 3) * 0.08);
      const t = new THREE.Mesh(tGeo, tMat); t.position.y = 40; g.add(t);
      const blades = new THREE.Group(); blades.position.y = 80;
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(blGeo, tMat); b.position.y = 15; b.rotation.z = i * Math.PI * 2 / 3; blades.add(b);
      }
      g.add(blades); pZone.add(g); s.turbines.push(blades);
    }

    const sPMat = new THREE.MeshStandardMaterial({ color: 0x082c4b, roughness: 0.18, metalness: 0.7, emissive: 0x063b62, emissiveIntensity: 1 });
    const sPark = new THREE.Group();
    sPark.position.set(500, 6, 0); pZone.add(sPark);
    const sGround = new THREE.Mesh(new THREE.BoxGeometry(650, 2, 1300), mat(0x2a4536, 0.92));
    sGround.position.y = 0; sPark.add(sGround);
    for (let i = 0; i < 5; i++) for (const xo of [-140, 140]) {
      const g = new THREE.Group();
      g.position.set(xo, 4, -480 + i * 220); g.rotation.x = -0.22;
      for (let r = 0; r < 2; r++) for (let cc = 0; cc < 4; cc++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(60, 0.7, 85), sPMat);
        p.position.set((cc - 1.5) * 70, 0, (r - 0.5) * 90); g.add(p);
      }
      sPark.add(g);
    }

    s.batteryRings = []; s.powerRings = [];
    [[-500, 850], [-370, 850], [-240, 850], [-110, 850], [20, 850],
     [-500, 980], [-370, 980], [-240, 980], [-110, 980], [20, 980]].forEach(([x, z]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(45, 60, 45), mat(0x2a5a4a, 0.4, 0.5));
      b.position.set(x, 36, z); pZone.add(b);
      const rM = new THREE.MeshStandardMaterial({ color: 0x22ff9d, emissive: 0x22ff9d, emissiveIntensity: 2.5 });
      const r = new THREE.Mesh(new THREE.TorusGeometry(32, 1, 8, 20), rM);
      r.rotation.x = Math.PI / 2; r.position.set(x, 9, z); pZone.add(r);
      s.batteryRings.push(rM); s.powerRings.push(r);
    });

    /* ═══════════════ FILTRATION ZONE (2600, -2600) with borders ═══════════════ */
    const fZone = new THREE.Group();
    fZone.position.set(2600, 5, -2600);
    scene.add(fZone);
    const fPad = new THREE.Mesh(new THREE.BoxGeometry(1000, 2, 1000), mat(0x1a2836, 0.95));
    fPad.position.y = -0.5; fZone.add(fPad);

    // Border lights (cyan)
    const fBMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 3, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(fBMat);
    [[1000, 3, 10, 0, 2, -500], [1000, 3, 10, 0, 2, 500], [10, 3, 1000, -500, 2, 0], [10, 3, 1000, 500, 2, 0]].forEach(([w, h, d, x, y, z]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), fBMat);
      m.position.set(x, y, z); fZone.add(m);
    });
    for (const cx of [-500, 500]) for (const cz of [-500, 500]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 30, 12), fBMat);
      post.position.set(cx, 15, cz); fZone.add(post);
      const capM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x22cfff, emissiveIntensity: 5 });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), capM);
      cap.position.set(cx, 33, cz); fZone.add(cap); s.borderLights.push(capM);
    }
    const fHit = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshBasicMaterial({ visible: false }));
    fHit.rotation.x = -Math.PI / 2; fHit.position.set(0, 2, 0); fZone.add(fHit);
    s.clickable.push({ object: fHit, type: "filtration", name: "Water Filtration System" });

    // Skid filtration GLB (with fallback)
    loader.load("/skid_filtration_system.glb", (g) => {
      const m = g.scene;
      prep(m, 220);
      m.position.set(240, 5, 0);
      fZone.add(m);
      s.clickable.push({ object: m, type: "filtration", name: "Skid Filtration Machine" });
    }, undefined, () => {
      const g = new THREE.Group(); g.position.set(240, 0, 0);
      const base = new THREE.Mesh(new THREE.BoxGeometry(80, 12, 140), mat(0x2c3e50, 0.5, 0.6));
      base.position.y = 6; g.add(base);
      for (let i = 0; i < 4; i++) {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 40, 12), mat(0x22cfff, 0.3, 0.5));
        t.position.set(-25 + i * 17, 32, -40 + i * 25); g.add(t);
      }
      const pipes = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 120), mat(0x9aa0a6, 0.5, 0.7));
      pipes.position.y = 50; g.add(pipes);
      fZone.add(g);
    });

    // 9-stage tanks
    s.filtTanks = [];
    for (let i = 0; i < FILTRATION_STAGES.length; i++) {
      const row = Math.floor(i / 3), col = i % 3;
      const tx = -380 + col * 80, tz = -250 + row * 80;
      const tCol = FILTRATION_STAGES[i].color;
      const tMat = new THREE.MeshStandardMaterial({ color: tCol, emissive: tCol, emissiveIntensity: 0.5, metalness: 0.3, roughness: 0.3, transparent: true, opacity: 0.85 });
      const tb = new THREE.Mesh(new THREE.CylinderGeometry(20, 22, 40, 20), tMat);
      tb.position.set(tx, 20, tz); fZone.add(tb);
      const tc = new THREE.Mesh(new THREE.SphereGeometry(20, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), tMat);
      tc.position.set(tx, 40, tz); fZone.add(tc);
      const wMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 1.5, transparent: true, opacity: 0.8, metalness: 0.4, roughness: 0.1 });
      const wf = new THREE.Mesh(new THREE.CylinderGeometry(17, 17, 1, 20), wMat);
      wf.position.set(tx, 8, tz); fZone.add(wf);
      s.filtTanks.push({ tb, tc, wf, baseY: 8 });
    }
    const res = new THREE.Mesh(new THREE.CylinderGeometry(50, 55, 45, 32), new THREE.MeshStandardMaterial({ color: 0x0a4a6a, roughness: 0.3, metalness: 0.5, emissive: 0x0a2a4a, emissiveIntensity: 1 }));
    res.position.set(-380, 22.5, 250); fZone.add(res);

    /* ═══════════════ FOOD ZONE (2900, -1200) ═══════════════ */
    const foZone = new THREE.Group();
    foZone.position.set(2900, 5, -1200);
    scene.add(foZone);
    const foPad = new THREE.Mesh(new THREE.BoxGeometry(1000, 2, 1000), mat(0x1a2e1e, 0.95));
    foPad.position.y = -0.5; foZone.add(foPad);

    const foBMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 3.5, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(foBMat);
    [[1000, 3, 10, 0, 2, -500], [1000, 3, 10, 0, 2, 500], [10, 3, 1000, -500, 2, 0], [10, 3, 1000, 500, 2, 0]].forEach(([w, h, d, x, y, z]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), foBMat);
      m.position.set(x, y, z); foZone.add(m);
    });
    for (const cx of [-500, 500]) for (const cz of [-500, 500]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 30, 12), foBMat);
      post.position.set(cx, 15, cz); foZone.add(post);
      const capM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x2ecc71, emissiveIntensity: 5 });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), capM);
      cap.position.set(cx, 33, cz); foZone.add(cap); s.borderLights.push(capM);
    }
    const foHit = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshBasicMaterial({ visible: false }));
    foHit.rotation.x = -Math.PI / 2; foHit.position.set(0, 2, 0); foZone.add(foHit);
    s.clickable.push({ object: foHit, type: "food", name: "AI Food Production" });

    // 9 plots with crops
    s.foodCrops = []; s.foodSprinklers = [];
    const cropCols = [0x2ecc71, 0x27ae60, 0x7bc96f, 0x4a9d4a];
    for (let r = 0; r < 3; r++) for (let cc = 0; cc < 3; cc++) {
      const px = -300 + cc * 130, pz = -300 + r * 130;
      const plot = new THREE.Mesh(new THREE.BoxGeometry(110, 3, 110), mat(0x4a2f1a, 0.95));
      plot.position.set(px, 1.5, pz); foZone.add(plot);
      const pBorderM = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 1.5 });
      const pBorder = new THREE.Mesh(new THREE.BoxGeometry(114, 1, 114), pBorderM);
      pBorder.position.set(px, 3, pz); foZone.add(pBorder);
      for (let k = 0; k < 6; k++) {
        const cCol = cropCols[Math.floor(Math.random() * cropCols.length)];
        const crop = new THREE.Mesh(new THREE.ConeGeometry(4, 16, 6),
          new THREE.MeshStandardMaterial({ color: cCol, emissive: cCol, emissiveIntensity: 0.3, roughness: 0.8 }));
        crop.position.set(px + (Math.random() - 0.5) * 80, 11, pz + (Math.random() - 0.5) * 80);
        crop.userData = { phase: Math.random() * Math.PI * 2, scale: 0.7 + Math.random() * 0.6 };
        crop.scale.setScalar(crop.userData.scale);
        foZone.add(crop); s.foodCrops.push(crop);
      }
      const spBase = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 4, 8), mat(0x9aa0a6, 0.5, 0.7));
      spBase.position.set(px, 5, pz); foZone.add(spBase);
      const sprayRing = new THREE.Mesh(new THREE.TorusGeometry(20, 0.5, 6, 24),
        new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 3, transparent: true, opacity: 0.7 }));
      sprayRing.rotation.x = Math.PI / 2; sprayRing.position.set(px, 6, pz); foZone.add(sprayRing);
      s.foodSprinklers.push({ ring: sprayRing, phase: Math.random() * Math.PI * 2 });
    }

    // Processing plant
    const plant = new THREE.Group();
    plant.position.set(0, 0, 150); foZone.add(plant);
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(180, 120, 140), mat(0x1a8a4e, 0.4, 0.5));
    pBody.position.y = 60; plant.add(pBody);
    const pRoof = new THREE.Mesh(new THREE.BoxGeometry(190, 6, 150), mat(0x0a3a1a, 0.5, 0.5));
    pRoof.position.y = 123; plant.add(pRoof);
    s.foodBeacon = new THREE.Mesh(new THREE.SphereGeometry(7, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 6 }));
    s.foodBeacon.position.y = 138; plant.add(s.foodBeacon);

    s.foodGears = [];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 3, 12),
        new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.2 }));
      g.rotation.x = Math.PI / 2; g.rotation.z = Math.PI / 2;
      g.position.set(-60 + i * 60, 30, 72); plant.add(g); s.foodGears.push(g);
    }

    s.foodConveyor = [];
    for (let i = 0; i < 6; i++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(18, 18, 18),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0xf39c12 : 0xe67e22, emissive: i % 2 ? 0xf39c12 : 0xe67e22, emissiveIntensity: 1.5 }));
      box.position.set(-90 + i * 30, 23, 200);
      box.userData = { startX: -90, endX: 90, offset: i * 30 };
      plant.add(box); s.foodConveyor.push(box);
    }

    s.foodDrone = new THREE.Group(); s.foodDrone.position.set(-250, 80, -250); foZone.add(s.foodDrone);
    s.foodDrone.add(new THREE.Mesh(new THREE.BoxGeometry(12, 4, 12), mat(0x2c3e50, 0.5, 0.6)));
    s.foodDroneRotors = [];
    for (const [rx, rz] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) {
      const rot = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 1, 12),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.8 }));
      rot.position.set(rx, 3, rz); s.foodDrone.add(rot); s.foodDroneRotors.push(rot);
    }

    /* ═══════════════ WASTE ZONE (2900, 2900) ═══════════════ */
    const wZone = new THREE.Group();
    wZone.position.set(2900, 5, 2900);
    scene.add(wZone);
    const wPad = new THREE.Mesh(new THREE.BoxGeometry(1000, 2, 1000), mat(0x2a3a2e, 0.95));
    wPad.position.y = -0.5; wZone.add(wPad);

    const wBMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 3.5, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(wBMat);
    [[1000, 3, 10, 0, 2, -500], [1000, 3, 10, 0, 2, 500], [10, 3, 1000, -500, 2, 0], [10, 3, 1000, 500, 2, 0]].forEach(([w, h, d, x, y, z]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wBMat);
      m.position.set(x, y, z); wZone.add(m);
    });
    for (const cx of [-500, 500]) for (const cz of [-500, 500]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 30, 12), wBMat);
      post.position.set(cx, 15, cz); wZone.add(post);
      const capM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x2ecc71, emissiveIntensity: 5 });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), capM);
      cap.position.set(cx, 33, cz); wZone.add(cap); s.borderLights.push(capM);
    }
    const wHit = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshBasicMaterial({ visible: false }));
    wHit.rotation.x = -Math.PI / 2; wHit.position.set(0, 2, 0); wZone.add(wHit);
    s.clickable.push({ object: wHit, type: "waste", name: "Waste Management System" });

    // 9 smart bins
    s.wasteBins = [];
    const binCols = [0x2ecc71, 0x3498db, 0xe74c3c, 0xf39c12];
    for (let r = 0; r < 3; r++) for (let cc = 0; cc < 3; cc++) {
      const px = -300 + cc * 90, pz = -300 + r * 90;
      const bCol = binCols[(r * 3 + cc) % 4];
      const bG = new THREE.Group(); bG.position.set(px, 5, pz);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(16, 18, 32, 12), mat(bCol, 0.5, 0.4));
      body.position.y = 16; bG.add(body);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 3, 12), mat(0x1a1a1a, 0.6, 0.5));
      lid.position.y = 33; bG.add(lid);
      const ledM = new THREE.MeshStandardMaterial({ color: bCol, emissive: bCol, emissiveIntensity: 3 });
      const led = new THREE.Mesh(new THREE.TorusGeometry(17, 0.6, 6, 20), ledM);
      led.rotation.x = Math.PI / 2; led.position.y = 22; bG.add(led);
      wZone.add(bG);
      s.wasteBins.push({ led: ledM, phase: Math.random() * Math.PI * 2 });
    }

    // Conveyor items
    s.wasteConveyor = [];
    const wItemCols = [0x2ecc71, 0x3498db, 0xe74c3c, 0xf39c12];
    for (let i = 0; i < 8; i++) {
      const it = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12),
        new THREE.MeshStandardMaterial({ color: wItemCols[i % 4], emissive: wItemCols[i % 4], emissiveIntensity: 1.5 }));
      it.position.set(-120 + i * 30, 26, 0);
      it.userData = { startX: -120, endX: 120, offset: i * 30, speed: 0.6 + Math.random() * 0.4 };
      wZone.add(it); s.wasteConveyor.push(it);
    }

    // Recycling machine
    const recM = new THREE.Group();
    recM.position.set(-300, 0, 250); wZone.add(recM);
    const recBody = new THREE.Mesh(new THREE.BoxGeometry(80, 70, 80), mat(0x2ecc71, 0.4, 0.5));
    recBody.position.y = 35; recM.add(recBody);
    s.wasteGears = [];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.2 }));
      g.rotation.x = Math.PI / 2; g.position.set(-20 + i * 20, 40, 42);
      recM.add(g); s.wasteGears.push(g);
    }

    // Biogas plant
    const bioG = new THREE.Group();
    bioG.position.set(300, 0, 250); wZone.add(bioG);
    const dig = new THREE.Mesh(new THREE.SphereGeometry(45, 20, 16), mat(0x4a7a3a, 0.6, 0.3));
    dig.position.y = 45; bioG.add(dig);
    s.wasteFlame = new THREE.Mesh(new THREE.ConeGeometry(7, 22, 8),
      new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 5, transparent: true, opacity: 0.9 }));
    s.wasteFlame.position.y = 118; bioG.add(s.wasteFlame);

    // Composting + Incinerator
    for (let i = 0; i < 3; i++) {
      const pit = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 10, 16), mat(0x5a3a1a, 0.9));
      pit.position.set(-300 - 70 + i * 70, 5, -250); wZone.add(pit);
      const steam = new THREE.Mesh(new THREE.SphereGeometry(7, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
      steam.position.set(-300 - 70 + i * 70, 28, -250); wZone.add(steam); s.wasteSteam.push(steam);
    }
    for (let i = 0; i < 6; i++) {
      const sm = new THREE.Mesh(new THREE.SphereGeometry(7, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, transparent: true, opacity: 0.4 }));
      sm.position.set(300 + (Math.random() - 0.5) * 15, 200 + i * 15, -250);
      wZone.add(sm); s.wasteSmoke.push(sm);
    }
    const incBody = new THREE.Mesh(new THREE.CylinderGeometry(35, 35, 90, 16), mat(0x8a3a3a, 0.5, 0.4));
    incBody.position.set(300, 50, -250); wZone.add(incBody);
    const incChimney = new THREE.Mesh(new THREE.CylinderGeometry(10, 12, 100, 12), mat(0x5a5a5a, 0.6, 0.3));
    incChimney.position.set(300, 145, -250); wZone.add(incChimney);

    /* ═══════════════ CARS (on-road, correct direction) ═══════════════ */
    s.cars = [];
    const carCols = [0x287ca3, 0xc83f49, 0xe1a72e, 0x5b72c9, 0x2f9d65, 0xd8d8d8, 0xd97b2a, 0x8b3ad9];
    const V_L = 28, V_W = 12, V_H = 6;
    const bodyG = new THREE.BoxGeometry(V_L, V_H, V_W);
    const cabinG = new THREE.BoxGeometry(V_L * 0.45, V_H * 0.85, V_W * 0.85);
    const wheelG = new THREE.CylinderGeometry(2.8, 2.8, 2, 12);
    const glassM = new THREE.MeshStandardMaterial({ color: 0x1a3a4a, emissive: 0x0a2535, emissiveIntensity: 0.8, roughness: 0.12, metalness: 0.5 });
    const wheelM = mat(0x0c1012, 0.6, 0.1);
    const headM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8e0, emissiveIntensity: 4 });
    const tailM = new THREE.MeshStandardMaterial({ color: 0xff1e1e, emissive: 0xff1010, emissiveIntensity: 4 });
    function makeCar(col) {
      const g = new THREE.Group();
      const bM = mat(col, 0.35, 0.5);
      const b = new THREE.Mesh(bodyG, bM); b.position.y = 5; g.add(b);
      const cabin = new THREE.Mesh(cabinG, glassM); cabin.position.set(-1, 9.8, 0); g.add(cabin);
      for (const wp of [[V_L * 0.33, V_W * 0.5], [V_L * 0.33, -V_W * 0.5], [-V_L * 0.33, V_W * 0.5], [-V_L * 0.33, -V_W * 0.5]]) {
        const w = new THREE.Mesh(wheelG, wheelM); w.rotation.x = Math.PI / 2; w.position.set(wp[0], 3, wp[1]); g.add(w);
      }
      for (const z of [-4, 4]) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2.5), headM); l.position.set(V_L * 0.5, 5, z); g.add(l);
        const t = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2.5), tailM); t.position.set(-V_L * 0.5, 5, z); g.add(t);
      }
      return g;
    }
    const LANES = [
      { id: "N1", axis: "z", dir: 1, fixed: -25, road: 1, start: -3600, end: 3600 },
      { id: "N2", axis: "z", dir: 1, fixed: -45, road: 1, start: -3600, end: 3600 },
      { id: "S1", axis: "z", dir: -1, fixed: 25, road: 2, start: 3600, end: -3600 },
      { id: "S2", axis: "z", dir: -1, fixed: 45, road: 2, start: 3600, end: -3600 },
      { id: "E1", axis: "x", dir: 1, fixed: 25, road: 3, start: -3600, end: 3600 },
      { id: "E2", axis: "x", dir: 1, fixed: 45, road: 3, start: -3600, end: 3600 },
      { id: "W1", axis: "x", dir: -1, fixed: -25, road: 4, start: 3600, end: -3600 },
      { id: "W2", axis: "x", dir: -1, fixed: -45, road: 4, start: 3600, end: -3600 },
    ];
    function updateCar(c) {
      const { lane, pos } = c;
      const lp = Math.round(pos * 10) / 10;
      if (lane.axis === "z") {
        c.car.position.set(lane.fixed, CAR_Y, lp);
        c.car.rotation.y = lane.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      } else {
        c.car.position.set(lp, CAR_Y, lane.fixed);
        c.car.rotation.y = lane.dir > 0 ? 0 : Math.PI;
      }
      c.car.rotation.x = 0;
      c.car.rotation.z = 0;
    }
    LANES.forEach(lane => {
      for (let i = 0; i < 3; i++) {
        const car = makeCar(carCols[Math.floor(Math.random() * carCols.length)]);
        scene.add(car);
        const gap = Math.abs(lane.end - lane.start) / 3;
        const startPos = lane.dir > 0 ? lane.start + gap * i : lane.start - gap * i;
        const obj = { car, lane, pos: startPos, speed: 0, baseSpeed: 50 + Math.random() * 25 };
        s.cars.push(obj); updateCar(obj);
      }
    });

    /* ═══════════════ PEOPLE ═══════════════ */
    const people = [];
    const skinC = [0xf2c9a0, 0xd9a373, 0xa06a3c, 0x6b4a2f];
    const shirtC = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6];
    function spawnPeople(cx, cz, n, r) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, rr = r * (0.5 + Math.random() * 0.5);
        const px = cx + Math.cos(a) * rr, pz = cz + Math.sin(a) * rr;
        if (isOnBld(px, pz) || isOnRd(px, pz)) continue;
        const g = new THREE.Group();
        const head = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 6),
          mat(skinC[Math.floor(Math.random() * skinC.length)], 0.9));
        head.position.y = 10; g.add(head);
        const body = new THREE.Mesh(new THREE.BoxGeometry(3, 5.5, 2),
          mat(shirtC[Math.floor(Math.random() * shirtC.length)], 0.85));
        body.position.y = 6; g.add(body);
        const legL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.5, 1.2), mat(0x2c3e50, 0.85));
        legL.position.set(-0.8, 2.2, 0); g.add(legL);
        const legR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.5, 1.2), mat(0x2c3e50, 0.85));
        legR.position.set(0.8, 2.2, 0); g.add(legR);
        g.position.set(px, 5, pz);
        g.rotation.y = a;
        scene.add(g);
        people.push({ obj: g, legL, legR, cx, cz, r: rr, angle: a, dir: Math.random() > 0.5 ? 1 : -1, speed: 0.01 + Math.random() * 0.012, phase: Math.random() * Math.PI * 2 });
      }
    }
    spawnPeople(-600, -900, 6, 180); spawnPeople(600, -900, 6, 180);
    spawnPeople(-600, 1100, 8, 250); spawnPeople(600, 900, 5, 180);

    /* ═══════════════ AI SYSTEM ═══════════════ */
    s.aiSystem = createAITrafficSystem((data) => {
      if (s.onAITrafficUpdate) s.onAITrafficUpdate(data);
    });

    /* ═══════════════ CLICK ═══════════════ */
    const ray = new THREE.Raycaster();
    const mous = new THREE.Vector2();
    const onClick = (e) => {
      if (e.target !== renderer.domElement) return;
      mous.x = (e.clientX / window.innerWidth) * 2 - 1;
      mous.y = -(e.clientY / window.innerHeight) * 2 + 1;
      ray.setFromCamera(mous, camera);
      for (const item of s.clickable) {
        if (ray.intersectObject(item.object, true).length) {
          if (s.onPanel) s.onPanel({ type: item.type, name: item.name });
          return;
        }
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    /* ═══════════════ ANIMATE LOOP ═══════════════ */
    const clock = new THREE.Clock();
    let fc = 0, rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const t = clock.elapsedTime;
      fc++;
      try {
        s.aiSystem.tick(delta);

        // CARS
        const byLane = {};
        for (const c of s.cars) {
          if (!byLane[c.lane.id]) byLane[c.lane.id] = [];
          byLane[c.lane.id].push(c);
        }
        for (const laneId in byLane) {
          const lCars = byLane[laneId];
          const lane = lCars[0].lane;
          const ai = s.aiSystem;
          lCars.sort((a, b) => lane.dir > 0 ? b.pos - a.pos : a.pos - b.pos);
          for (let i = 0; i < lCars.length; i++) {
            const c = lCars[i];
            const leader = i > 0 ? lCars[i - 1] : null;
            let ts = c.baseSpeed;
            const isG = ai.isGreen(lane.road);
            const isY = ai.isYellowRoad(lane.road);
            const sl = lane.dir > 0 ? -130 : 130;
            const d = Math.abs(c.pos - sl);
            if (!isG && d < 220) { ts = d < 40 ? 0 : c.baseSpeed * (d / 220) * 0.5; }
            else if (isY && d < 120) ts = c.baseSpeed * 0.4;
            if (leader) {
              const gap = Math.abs(leader.pos - c.pos);
              if (gap < 90) { ts = Math.min(ts, leader.speed * 0.9); if (gap < 45) ts = 0; }
            }
            c.speed += (ts - c.speed) * Math.min(1, delta * 4);
            c.pos += c.speed * lane.dir * delta;
            if (lane.dir > 0 && c.pos > lane.end) c.pos = lane.start;
            else if (lane.dir < 0 && c.pos < lane.end) c.pos = lane.start;
            updateCar(c);
          }
        }

        // TRAFFIC LIGHTS
        const bF = Math.floor(t * 4) % 2 === 0;
        const bM = Math.floor(t * 2) % 2 === 0;
        for (const l of s.intLights) {
          const ai = s.aiSystem;
          l.r.material.emissiveIntensity = 0;
          l.y.material.emissiveIntensity = 0;
          l.gr.material.emissiveIntensity = 0;
          l.rH.material.opacity = 0;
          l.yH.material.opacity = 0;
          l.grH.material.opacity = 0;
          if (ai.isGreen(l.road)) { l.gr.material.emissiveIntensity = 5 + Math.sin(t * 3) * 1.5; l.grH.material.opacity = 0.35; }
          else if (ai.isYellowRoad(l.road)) { l.y.material.emissiveIntensity = bF ? 8 : 1; l.yH.material.opacity = bF ? 0.6 : 0.1; }
          else { l.r.material.emissiveIntensity = bM ? 7 : 2.5; l.rH.material.opacity = bM ? 0.55 : 0.15; }
        }

        // PEOPLE
        for (const p of people) {
          p.angle += p.speed * p.dir;
          p.obj.position.x = p.cx + Math.cos(p.angle) * p.r;
          p.obj.position.z = p.cz + Math.sin(p.angle) * p.r;
          p.obj.rotation.y = p.angle + (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
          const sw = Math.sin(t * 6 + p.phase) * 0.5;
          p.legL.rotation.x = sw; p.legR.rotation.x = -sw;
        }

        // TURBINES
        if (fc % 3 === 0) for (const bl of s.turbines) bl.rotation.z = t * 2.4;

        // AI TOWER
        if (s.radar) s.radar.rotation.z = t * 1.7;
        if (s.controllerRing) s.controllerRing.rotation.z = t * 0.5;
        if (s.controllerSig) {
          s.controllerSig.scale.setScalar(1 + Math.sin(t * 4) * 0.2);
          s.controllerSig.material.emissiveIntensity = 4 + Math.sin(t * 4) * 2;
        }
        for (let i = 0; i < s.powerRings.length; i++) s.powerRings[i].rotation.z = t * 0.8 + i;

        // FILTRATION
        s.fEl += delta;
        if (s.fEl >= FILTRATION_STAGES[s.fIdx].duration) { s.fEl = 0; s.fIdx = (s.fIdx + 1) % FILTRATION_STAGES.length; }
        if (fc % 15 === 0 && s.onFiltrationUpdate) {
          s.onFiltrationUpdate({ stageIndex: s.fIdx, stage: FILTRATION_STAGES[s.fIdx], allStages: FILTRATION_STAGES, progress: s.fEl / FILTRATION_STAGES[s.fIdx].duration });
        }
        for (let i = 0; i < s.filtTanks.length; i++) {
          const tk = s.filtTanks[i];
          const isA = i === s.fIdx;
          if (isA) {
            tk.tb.material.emissiveIntensity = 1.5 + Math.sin(t * 4) * 0.8;
            const fh = 30 + Math.sin(t * 2.5) * 10;
            tk.wf.scale.y = fh; tk.wf.position.y = tk.baseY + fh / 2;
          } else {
            tk.tb.material.emissiveIntensity = 0.5;
            tk.wf.scale.y = 8; tk.wf.position.y = tk.baseY + 4;
          }
        }

        // POWER
        s.pEl += delta;
        if (s.pEl >= POWER_STAGES[s.pIdx].duration) { s.pEl = 0; s.pIdx = (s.pIdx + 1) % POWER_STAGES.length; }
        if (fc % 15 === 0 && s.onPowerUpdate) {
          s.onPowerUpdate({ stageIndex: s.pIdx, stage: POWER_STAGES[s.pIdx], allStages: POWER_STAGES, progress: s.pEl / POWER_STAGES[s.pIdx].duration });
        }

        // FOOD
        s.foEl += delta;
        if (s.foEl >= FOOD_STAGES[s.foIdx].duration) { s.foEl = 0; s.foIdx = (s.foIdx + 1) % FOOD_STAGES.length; }
        if (fc % 15 === 0 && s.onFoodUpdate) {
          s.onFoodUpdate({ stageIndex: s.foIdx, stage: FOOD_STAGES[s.foIdx], allStages: FOOD_STAGES, progress: s.foEl / FOOD_STAGES[s.foIdx].duration });
        }
        const fSid = FOOD_STAGES[s.foIdx].id;
        for (const c of s.foodCrops) {
          c.rotation.z = Math.sin(t * 1.5 + c.userData.phase) * 0.08;
          const gb = (fSid === "planting" || fSid === "irrigation") ? (1 + Math.sin(t * 0.8 + c.userData.phase) * 0.15) : 1;
          c.scale.y = c.userData.scale * gb;
        }
        for (const sp of s.foodSprinklers) {
          const ph = (t * 0.8 + sp.phase) % 2;
          sp.ring.scale.setScalar(1 + ph * 0.8);
          sp.ring.material.opacity = Math.max(0, 0.7 - ph * 0.35);
          sp.ring.visible = fSid === "irrigation" || fSid === "planting";
        }
        const bs = fSid === "processing" ? 1.5 : 0.5;
        for (const it of s.foodConveyor) {
          it.position.x += bs * delta * 30;
          if (it.position.x > it.userData.endX) it.position.x = it.userData.startX;
        }
        const gs = fSid === "processing" ? 4 : 1.5;
        for (const g of s.foodGears) g.rotation.y += delta * gs;
        if (s.foodBeacon) {
          s.foodBeacon.scale.setScalar(1 + Math.sin(t * 3) * 0.3);
          s.foodBeacon.material.emissiveIntensity = 5 + Math.sin(t * 3) * 2;
        }
        if (s.foodDrone) {
          const da = t * 0.4;
          s.foodDrone.position.x = Math.cos(da) * 320;
          s.foodDrone.position.z = Math.sin(da) * 320;
          s.foodDrone.position.y = 80 + Math.sin(t * 1.5) * 10;
          s.foodDrone.rotation.y = -da + Math.PI / 2;
          for (const r of s.foodDroneRotors) r.rotation.y += delta * 30;
        }

        // WASTE
        s.wEl += delta;
        if (s.wEl >= WASTE_STAGES[s.wIdx].duration) { s.wEl = 0; s.wIdx = (s.wIdx + 1) % WASTE_STAGES.length; }
        if (fc % 15 === 0 && s.onWasteUpdate) {
          s.onWasteUpdate({ stageIndex: s.wIdx, stage: WASTE_STAGES[s.wIdx], allStages: WASTE_STAGES, progress: s.wEl / WASTE_STAGES[s.wIdx].duration });
        }
        for (const bin of s.wasteBins) {
          bin.led.emissiveIntensity = 2.5 + Math.sin(t * 3 + bin.phase) * 1.5;
        }
        for (const it of s.wasteConveyor) {
          it.position.x += it.userData.speed * delta * 30;
          if (it.position.x > it.userData.endX) it.position.x = it.userData.startX;
          it.position.y = 26 + Math.sin(t * 6 + it.userData.offset) * 2;
          it.rotation.y += delta * 2;
        }
        for (const g of s.wasteGears) g.rotation.y += delta * 3;
        if (s.wasteFlame) {
          s.wasteFlame.scale.y = 1 + Math.sin(t * 8) * 0.3;
          s.wasteFlame.material.emissiveIntensity = 4 + Math.sin(t * 8) * 2;
        }
        for (const st of s.wasteSteam) {
          st.position.y += delta * 5;
          st.material.opacity = Math.max(0, 0.35 - (st.position.y - 28) * 0.008);
          if (st.position.y > 50) st.position.y = 28;
        }
        for (const sm of s.wasteSmoke) {
          sm.position.y += delta * 8;
          sm.material.opacity = Math.max(0, 0.4 - (sm.position.y - 200) * 0.003);
          if (sm.position.y > 400) sm.position.y = 200;
        }

        // CAMERA
        if (s.camTransition && s.camera && s.controls) {
          const now = performance.now();
          const el = now - s.camTransition.startTime;
          const tt = Math.min(el / s.camTransition.duration, 1);
          const ease = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2;
          s.camera.position.lerpVectors(s.camTransition.startPos, s.camTransition.targetPos, ease);
          s.controls.target.lerpVectors(s.camTransition.startLook, s.camTransition.targetLook, ease);
          if (tt >= 1) s.camTransition = null;
        }

        controls.update();
        renderer.render(scene, camera);
      } catch (err) {
        console.error("Animate error:", err);
      }
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
      if (c.contains(renderer.domElement)) c.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh" }} />;
});

export default SmartCity3D;
