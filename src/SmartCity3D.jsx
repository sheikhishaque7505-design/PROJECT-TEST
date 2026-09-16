import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const CITY_HALF = 3900;
const ROAD_HALF_LEN = 3800;
const GROUND_SIZE = 8200;
const CAR_Y = 5.0;

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
  { id: "solar", label: "Solar Array", color: 0xffcc22, duration: 5, desc: "42 MW from solar arrays" },
  { id: "wind", label: "Wind Turbines", color: 0x22cfff, duration: 5, desc: "28 MW from turbines" },
  { id: "battery", label: "Battery Storage", color: 0x22ff9d, duration: 5, desc: "10 batteries, 78% charge" },
  { id: "grid", label: "Grid Distribution", color: 0xff6b6b, duration: 5, desc: "Load balanced to city" },
  { id: "load", label: "City Load Balance", color: 0xb266ff, duration: 5, desc: "Real-time demand matching" },
];

const FOOD_STAGES = [
  { id: "planting", label: "Smart Planting", color: 0x2ecc71, duration: 5, desc: "9 fields · AI seed placement" },
  { id: "irrigation", label: "Smart Irrigation", color: 0x22cfff, duration: 5, desc: "Sprinklers · 68% moisture" },
  { id: "monitoring", label: "Drone Monitoring", color: 0xffcc22, duration: 5, desc: "3 drones · 94% crop health" },
  { id: "harvest", label: "Robotic Harvest", color: 0xe67e22, duration: 5, desc: "Auto-harvesters collecting" },
  { id: "processing", label: "Food Processing", color: 0x9b59b6, duration: 5, desc: "Washing · cutting · packing" },
  { id: "distribution", label: "City Distribution", color: 0xff6b6b, duration: 5, desc: "48 deliveries daily" },
];

function createAITrafficSystem(callback) {
  const PHASES = [
    { id: "NS", green: [1, 2], label: "NORTH-SOUTH GREEN" },
    { id: "EW", green: [3, 4], label: "EAST-WEST GREEN" },
  ];
  const BASE_GREEN = 8;
  const YELLOW_DURATION = 2.5;
  const ALL_RED = 0.8;

  let phaseIndex = 0;
  let elapsed = 0;
  let inYellow = false, yellowElapsed = 0;
  let inAllRed = false, allRedElapsed = 0;

  const roadQueues = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const decisionLog = [];
  const stats = {
    vehiclesDetected: 0, vehiclesMoving: 0, vehiclesWaiting: 0,
    density: "LOW", avgWaitTime: 4.0, throughput: 0, aiConfidence: 98,
    currentPhaseLabel: PHASES[0].label, phaseTimeRemaining: BASE_GREEN,
  };

  function addLog(msg, type = "info") {
    decisionLog.unshift({ message: msg, type, time: Date.now() });
    if (decisionLog.length > 6) decisionLog.pop();
  }
  addLog("AI Traffic Control initialized", "phase");

  function tick(delta) {
    const currentPhase = PHASES[phaseIndex];
    if (inAllRed) {
      allRedElapsed += delta;
      if (allRedElapsed >= ALL_RED) {
        inAllRed = false; allRedElapsed = 0;
        phaseIndex = (phaseIndex + 1) % PHASES.length;
        elapsed = 0;
        addLog(`Switched to ${PHASES[phaseIndex].label}`, "phase");
      }
    } else if (inYellow) {
      yellowElapsed += delta;
      if (yellowElapsed >= YELLOW_DURATION) {
        inYellow = false; yellowElapsed = 0;
        inAllRed = true; allRedElapsed = 0;
        addLog("All-red safety interval", "phase");
      }
    } else {
      elapsed += delta;
      if (elapsed >= BASE_GREEN) {
        inYellow = true; yellowElapsed = 0;
        addLog(`${currentPhase.label} ending — yellow`, "phase");
      }
    }

    for (let r = 1; r <= 4; r++) {
      if (currentPhase.green.includes(r) && !inYellow && !inAllRed) {
        roadQueues[r] = Math.max(0, roadQueues[r] - delta * 3);
      } else {
        roadQueues[r] = Math.min(30, roadQueues[r] + delta * 2);
      }
    }

    const totalQ = Object.values(roadQueues).reduce((a, b) => a + b, 0);
    stats.vehiclesMoving = inYellow || inAllRed ? 0 : Math.floor(currentPhase.green.length * 6 + Math.random() * 4);
    stats.vehiclesWaiting = Math.floor(totalQ * 1.5 + Math.random() * 5);
    stats.vehiclesDetected = stats.vehiclesMoving + stats.vehiclesWaiting;
    stats.density = totalQ > 40 ? "HIGH" : totalQ > 20 ? "MEDIUM" : "LOW";
    stats.currentPhaseLabel = inAllRed ? "ALL RED — SWITCHING"
      : inYellow ? `${currentPhase.label} — YELLOW`
      : currentPhase.label;
    stats.phaseTimeRemaining = inAllRed ? ALL_RED - allRedElapsed
      : inYellow ? YELLOW_DURATION - yellowElapsed
      : BASE_GREEN - elapsed;

    const greenRoads = (inYellow || inAllRed) ? [] : currentPhase.green;
    const redRoads = (inYellow || inAllRed) ? [1, 2, 3, 4] : [1, 2, 3, 4].filter(r => !currentPhase.green.includes(r));

    callback({
      phase: phaseIndex + 1, inYellow, inAllRed,
      currentGreenRoads: greenRoads, currentRedRoads: redRoads,
      phaseProgress: inAllRed ? allRedElapsed / ALL_RED
        : inYellow ? yellowElapsed / YELLOW_DURATION
        : elapsed / BASE_GREEN,
      stats: { ...stats }, decisionLog: [...decisionLog],
      phaseLabel: stats.currentPhaseLabel, roadQueues: { ...roadQueues },
    });
  }

  return {
    tick,
    isGreen: (r) => !inYellow && !inAllRed && PHASES[phaseIndex].green.includes(r),
    isYellowRoad: (r) => inYellow && PHASES[phaseIndex].green.includes(r),
  };
}

const SmartCity3D = forwardRef((props, ref) => {
  const mountRef = useRef(null);

  const s = useRef({
    camera: null, controls: null, renderer: null, scene: null,
    camTransition: null, cars: [],
    intersectionLights: [], turbines: [], streetBulbMats: [],
    batteryRings: [], borderLights: [], clickable: [],
    controller: null, controllerRing: null, controllerSig: null, radar: null,
    aiSystem: null,
    powerStageIndex: 0, powerStageElapsed: 0,
    filtrationStageIndex: 0, filtrationStageElapsed: 0,
    foodStageIndex: 0, foodStageElapsed: 0,
    grassMaterial: null, roadMaterial: null, roadLaneMaterial: null,
    curbMaterial: null, sidewalkMat: null, ambient: null, sun: null,
    filtrationStageMeshes: [], foodCropMeshes: [], foodConveyorItems: [],
    foodSprinklers: [], foodGears: [], foodDroneRotors: [],
    foodDrone: null, foodLaser: null, foodPackArm: null, foodBeacon: null,
    powerRings: [],
    onAITrafficUpdate: null, onPowerUpdate: null,
    onFiltrationUpdate: null, onFoodUpdate: null, onPanel: null,
  }).current;

  s.onAITrafficUpdate = props.onAITrafficUpdate;
  s.onPowerUpdate = props.onPowerUpdate;
  s.onFiltrationUpdate = props.onFiltrationUpdate;
  s.onFoodUpdate = props.onFoodUpdate;
  s.onPanel = props.onPanel;

  useImperativeHandle(ref, () => ({
    goToOverview: () => smoothCameraTo(new THREE.Vector3(1400, 950, 1400), new THREE.Vector3(0, 5, 0), 1500),
    goToTopDown: () => smoothCameraTo(new THREE.Vector3(0, 2800, 500), new THREE.Vector3(0, 0, 0), 1500),
    setDayNight: (night) => setDayNight(night),
    goToSystem: (key) => goToSystem(key),
  }));

  function smoothCameraTo(targetPos, targetLook, duration = 1400) {
    if (!s.camera || !s.controls) return;
    s.camTransition = {
      startPos: s.camera.position.clone(), targetPos,
      startLook: s.controls.target.clone(), targetLook,
      startTime: performance.now(), duration,
    };
  }

  function goToSystem(key) {
    if (!s.camera) return;
    const positions = {
      traffic: { pos: new THREE.Vector3(0, 350, 600), look: new THREE.Vector3(0, 5, 0) },
      power: { pos: new THREE.Vector3(-5400, 450, 4400), look: new THREE.Vector3(-5400, 5, 3600) },
      filtration: { pos: new THREE.Vector3(3600, 450, -2900), look: new THREE.Vector3(3600, 5, -3600) },
      food: { pos: new THREE.Vector3(2900, 500, -400), look: new THREE.Vector3(2900, 5, -1200) },
    };
    const t = positions[key];
    if (t) smoothCameraTo(t.pos, t.look, 1800);
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
    if (s.grassMaterial) s.grassMaterial.color.setHex(night ? 0x1a3a24 : 0x4d8f50);
    if (s.roadMaterial) s.roadMaterial.color.setHex(night ? 0x0e1418 : 0x2a3238);
    if (s.roadLaneMaterial) s.roadLaneMaterial.color.setHex(night ? 0x080c10 : 0x1e2428);
    if (s.curbMaterial) s.curbMaterial.color.setHex(night ? 0x252a2e : 0x697578);
    if (s.sidewalkMat) s.sidewalkMat.color.setHex(night ? 0x353a3e : 0x8a8f94);
    s.streetBulbMats.forEach((m) => { m.emissiveIntensity = night ? 6.5 : 1.8; });
    s.batteryRings.forEach((m) => { m.emissiveIntensity = night ? 5.5 : 2.0; });
    s.borderLights.forEach((m) => { m.emissiveIntensity = night ? 6.5 : 3.0; });
  }

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

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
    container.appendChild(renderer.domElement);
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
    sun.position.set(-800, 1400, 500);
    scene.add(sun); s.sun = sun;

    const fill = new THREE.DirectionalLight(0xd0e8ff, 1.2);
    fill.position.set(800, 1000, -500);
    scene.add(fill);

    const mat = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    const grassMaterial = mat(0x4d8f50, 0.98);
    const roadMaterial = mat(0x2a3238, 0.96);
    const roadLaneMaterial = mat(0x1e2428, 0.96);
    const yellowLineMaterial = mat(0xf5c84b, 0.65);
    const whiteLineMaterial = mat(0xffffff, 0.65);
    const darkMaterial = mat(0x182327, 0.65, 0.15);
    const sidewalkMat = mat(0x8a8f94, 0.9);

    s.grassMaterial = grassMaterial;
    s.roadMaterial = roadMaterial;
    s.roadLaneMaterial = roadLaneMaterial;
    s.sidewalkMat = sidewalkMat;

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE), grassMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // BOUNDARY
    const boundMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 3.0, metalness: 0.7, roughness: 0.2 });
    s.borderLights.push(boundMat);
    const bF = new THREE.Mesh(new THREE.BoxGeometry(CITY_HALF * 2 + 20, 3, 20), boundMat);
    bF.position.set(0, 6, CITY_HALF); scene.add(bF);
    const bB = bF.clone(); bB.position.z = -CITY_HALF; scene.add(bB);
    const bL = new THREE.Mesh(new THREE.BoxGeometry(20, 3, CITY_HALF * 2 + 20), boundMat);
    bL.position.set(-CITY_HALF, 6, 0); scene.add(bL);
    const bR = bL.clone(); bR.position.x = CITY_HALF; scene.add(bR);

    // ROADS
    const ROAD_W = 110, ROAD_HALF = ROAD_W / 2;
    const ROAD_LEN = ROAD_HALF_LEN * 2;
    const roadZs = [-2400, -1200, 0, 1200, 2400];
    const roadXs = [-2400, -1200, 0, 1200, 2400];

    function makeRoadE(x, z, length) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(length, 0.25, ROAD_W + 20), roadLaneMaterial);
      sh.position.set(x, 4.55, z); scene.add(sh);
      const r = new THREE.Mesh(new THREE.BoxGeometry(length, 0.45, ROAD_W), roadMaterial);
      r.position.set(x, 4.7, z); scene.add(r);
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(length, 0.1, 2), yellowLineMaterial);
      c1.position.set(x, 5, z - 2.5); scene.add(c1);
      const c2 = c1.clone(); c2.position.z = z + 2.5; scene.add(c2);
      for (let lx = x - length / 2 + 30; lx < x + length / 2 - 20; lx += 90) {
        const d1 = new THREE.Mesh(new THREE.BoxGeometry(40, 0.09, 0.8), whiteLineMaterial);
        d1.position.set(lx, 5.06, z + 30); scene.add(d1);
        const d2 = d1.clone(); d2.position.z = z - 30; scene.add(d2);
      }
    }
    function makeRoadN(x, z, length) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W + 20, 0.25, length), roadLaneMaterial);
      sh.position.set(x, 4.55, z); scene.add(sh);
      const r = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W, 0.45, length), roadMaterial);
      r.position.set(x, 4.7, z); scene.add(r);
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, length), yellowLineMaterial);
      c1.position.set(x - 2.5, 5, z); scene.add(c1);
      const c2 = c1.clone(); c2.position.x = x + 2.5; scene.add(c2);
      for (let lz = z - length / 2 + 30; lz < z + length / 2 - 20; lz += 90) {
        const d1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.09, 40), whiteLineMaterial);
        d1.position.set(x + 30, 5.06, lz); scene.add(d1);
        const d2 = d1.clone(); d2.position.x = x - 30; scene.add(d2);
      }
    }
    roadZs.forEach(z => makeRoadE(0, z, ROAD_LEN));
    roadXs.forEach(x => makeRoadN(x, 0, ROAD_LEN));

    roadZs.forEach(z => {
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LEN, 0.3, 10), sidewalkMat);
      s1.position.set(0, 5.05, z + ROAD_HALF + 10); scene.add(s1);
      const s2 = s1.clone(); s2.position.z = z - ROAD_HALF - 10; scene.add(s2);
    });

    // WALL
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a6670, roughness: 0.85, metalness: 0.15 });
    const wallH = 100, wallT = 25;
    const wallLen = CITY_HALF * 2 + wallT * 2;
    const eW = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, wallLen), wallMat);
    eW.position.set(CITY_HALF, 5 + wallH / 2, 0); scene.add(eW);
    const wW = eW.clone(); wW.position.x = -CITY_HALF; scene.add(wW);
    const nW = new THREE.Mesh(new THREE.BoxGeometry(wallLen, wallH, wallT), wallMat);
    nW.position.set(0, 5 + wallH / 2, CITY_HALF); scene.add(nW);
    const sW = nW.clone(); sW.position.z = -CITY_HALF; scene.add(sW);

    // STREET LIGHTS
    s.streetBulbMats = [];
    function sl(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 11, 5), darkMaterial);
      pole.position.y = 5.5; g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.22, 0.22), darkMaterial);
      arm.position.set(1.5, 10, 0); g.add(arm);
      const bMat = new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffd36a, emissiveIntensity: 1.8 });
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), bMat);
      b.position.set(3, 9.8, 0); g.add(b);
      scene.add(g); s.streetBulbMats.push(bMat);
    }
    roadZs.forEach(z => {
      for (let x = -ROAD_HALF_LEN + 100; x <= ROAD_HALF_LEN - 100; x += 400) {
        sl(x, z + ROAD_HALF + 18);
        sl(x, z - ROAD_HALF - 18);
      }
    });

    // TRAFFIC LIGHTS
    s.intersectionLights = [];
    function makeTrafficLight(x, z, road, faceAngle) {
      const g = new THREE.Group();
      g.position.set(x, 5, z);
      g.rotation.y = faceAngle;

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 24, 8), mat(0x1a1a1a, 0.5, 0.6));
      pole.position.y = 12; g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(20, 0.7, 0.7), mat(0x1a1a1a, 0.5, 0.6));
      arm.position.set(10, 23, 0); g.add(arm);
      const box = new THREE.Mesh(new THREE.BoxGeometry(4, 11, 4), mat(0x0a0a0a, 0.7, 0.4));
      box.position.set(18, 23, 0); g.add(box);

      const light = (color, y) => {
        const core = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 24), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0 }));
        core.position.set(18, y, 2.2); g.add(core);
        const halo = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }));
        halo.position.set(18, y, 2.2); g.add(halo);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.3, 8, 20), mat(0x111111, 0.9));
        ring.position.set(18, y, 2); g.add(ring);
        return { core, halo };
      };

      const r = light(0xff2222, 26.5);
      const y = light(0xffcc22, 23);
      const gr = light(0x22ff66, 19.5);

      scene.add(g);
      s.intersectionLights.push({ road, r: r.core, rHalo: r.halo, y: y.core, yHalo: y.halo, gr: gr.core, grHalo: gr.halo });
    }

    makeTrafficLight(-110, -110, 1, Math.PI / 4);
    makeTrafficLight(110, 110, 2, -Math.PI * 3 / 4);
    makeTrafficLight(110, -110, 3, Math.PI * 3 / 4);
    makeTrafficLight(-110, 110, 4, -Math.PI / 4);

    // AI TOWER
    s.controller = new THREE.Group();
    s.controller.position.set(0, 5, 0);
    const cBase = new THREE.Mesh(new THREE.CylinderGeometry(65, 75, 5, 32), mat(0x142f3b, 0.28, 0.5));
    cBase.position.y = 2.5; s.controller.add(cBase);
    s.controllerRing = new THREE.Mesh(new THREE.TorusGeometry(63, 1.8, 10, 48), new THREE.MeshStandardMaterial({ color: 0x32dfff, emissive: 0x18cfff, emissiveIntensity: 3 }));
    s.controllerRing.rotation.x = Math.PI / 2;
    s.controllerRing.position.y = 5.5;
    s.controller.add(s.controllerRing);
    const cT = new THREE.Mesh(new THREE.CylinderGeometry(20, 26, 55, 10), mat(0x185a72, 0.3, 0.5));
    cT.position.y = 30; s.controller.add(cT);
    const cU = new THREE.Mesh(new THREE.CylinderGeometry(26, 24, 14, 12), new THREE.MeshStandardMaterial({ color: 0x0a3345, emissive: 0x1a7a9a, emissiveIntensity: 2 }));
    cU.position.y = 64; s.controller.add(cU);
    s.radar = new THREE.Mesh(new THREE.TorusGeometry(12, 1, 10, 32), new THREE.MeshStandardMaterial({ color: 0x61e7ff, emissive: 0x23dfff, emissiveIntensity: 3 }));
    s.radar.rotation.x = Math.PI / 2;
    s.radar.position.y = 80;
    s.controller.add(s.radar);
    s.controllerSig = new THREE.Mesh(new THREE.SphereGeometry(3.5, 20, 20), new THREE.MeshStandardMaterial({ color: 0x66e5ff, emissive: 0x33dfff, emissiveIntensity: 5 }));
    s.controllerSig.position.y = 95;
    s.controller.add(s.controllerSig);
    scene.add(s.controller);
    s.clickable.push({ object: s.controller, type: "traffic", name: "AI Traffic Control Center" });

    // OCCUPANCY
    const occupied = [
      { x: -600, z: -600, r: 260 }, { x: 600, z: -600, r: 250 },
      { x: 600, z: 600, r: 300 }, { x: 1800, z: -600, r: 400 },
      { x: 600, z: 1800, r: 290 }, { x: 1800, z: 1750, r: 320 },
      { x: 1800, z: 600, r: 290 }, { x: 0, z: 0, r: 200 },
      { x: -5400, z: 3600, r: 1200 }, { x: 3600, z: -3600, r: 600 },
      { x: 3600, z: 3600, r: 600 }, { x: 2900, z: -1200, r: 550 },
    ];
    const isOnBuilding = (x, z) => {
      for (const o of occupied) {
        const dx = x - o.x, dz = z - o.z;
        if (dx * dx + dz * dz < o.r * o.r) return true;
      }
      return false;
    };

    // TREES
    const treeTrunkMat = mat(0x5a3d24, 0.95, 0.05);
    const treeLeafMat = mat(0x2d6e3d, 0.9);
    const treeTrunkGeo = new THREE.CylinderGeometry(2.2, 3.5, 28, 7);
    const treeLeafGeo = new THREE.ConeGeometry(18, 42, 8);
    function tree(x, z, sc = 1) {
      if (isOnBuilding(x, z)) return;
      const g = new THREE.Group(); g.position.set(x, 5, z); g.scale.setScalar(sc);
      const t = new THREE.Mesh(treeTrunkGeo, treeTrunkMat); t.position.y = 14; g.add(t);
      const l = new THREE.Mesh(treeLeafGeo, treeLeafMat); l.position.y = 38; g.add(l);
      scene.add(g);
    }
    for (let i = 0; i < 180; i++) {
      const x = (Math.random() - 0.5) * (CITY_HALF * 2 - 400);
      const z = (Math.random() - 0.5) * (CITY_HALF * 2 - 400);
      let nearRoad = false;
      for (const rz of roadZs) if (Math.abs(z - rz) < 150) nearRoad = true;
      for (const rx of roadXs) if (Math.abs(x - rx) < 150) nearRoad = true;
      if (nearRoad) continue;
      tree(x, z, 0.8 + Math.random() * 0.6);
    }

    // GLB BUILDINGS with fallback
    const loader = new GLTFLoader();
    function prep(obj, size) {
      const box = new THREE.Box3().setFromObject(obj);
      const sz = new THREE.Vector3(); box.getSize(sz);
      const maxD = Math.max(sz.x, sz.y, sz.z);
      obj.scale.setScalar(size / Math.max(maxD, 0.001));
      const b2 = new THREE.Box3().setFromObject(obj);
      const c = new THREE.Vector3(); b2.getCenter(c);
      obj.position.x -= c.x;
      obj.position.z -= c.z;
      obj.position.y -= b2.min.y;
    }
    function makeProc(size, pos, color) {
      const g = new THREE.Group();
      const h = size * 0.8;
      const body = new THREE.Mesh(new THREE.BoxGeometry(size, h, size), new THREE.MeshStandardMaterial({ color: color || 0x3a4a5a, roughness: 0.6, metalness: 0.4 }));
      body.position.set(pos[0], 5 + h / 2, pos[1]);
      g.add(body);
      const winMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 0.8 });
      for (let i = 0; i < 4; i++) {
        const y = 5 + h * (i + 1) / 5;
        const band = new THREE.Mesh(new THREE.BoxGeometry(size + 1, 2, size + 1), winMat);
        band.position.set(pos[0], y, pos[1]);
        g.add(band);
      }
      const cap = new THREE.Mesh(new THREE.BoxGeometry(size * 0.9, 4, size * 0.9), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.6 }));
      cap.position.set(pos[0], 5 + h + 2, pos[1]);
      g.add(cap);
      return g;
    }
    function bld(file, size, pos, type, name, borderColor) {
      loader.load(
        file,
        (g) => {
          const b = g.scene;
          prep(b, size);
          b.position.set(pos[0], 5, pos[1]);
          scene.add(b);
          s.clickable.push({ object: b, type, name: name || type });
          addBorder(pos, size, borderColor);
        },
        undefined,
        () => {
          const proc = makeProc(size, pos, borderColor);
          scene.add(proc);
          s.clickable.push({ object: proc, type, name: name || type });
          addBorder(pos, size, borderColor);
        }
      );
    }
    function addBorder(pos, size, borderColor) {
      const bMat = new THREE.MeshStandardMaterial({ color: borderColor || 0x22cfff, emissive: borderColor || 0x22cfff, emissiveIntensity: 2.5, metalness: 0.7, roughness: 0.2 });
      s.borderLights.push(bMat);
      const fw = size * 1.4;
      const front = new THREE.Mesh(new THREE.BoxGeometry(fw, 2.5, 6), bMat);
      front.position.set(pos[0], 6.5, pos[1] + fw / 2 + 10); scene.add(front);
      const back = front.clone(); back.position.z = pos[1] - fw / 2 - 10; scene.add(back);
      const left = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, fw), bMat);
      left.position.set(pos[0] - fw / 2 - 10, 6.5, pos[1]); scene.add(left);
      const right = left.clone(); right.position.x = pos[0] + fw / 2 + 10; scene.add(right);
    }

    bld("/american_high_school.glb", 300, [-600, -600], "school", "American High School", 0x1a5490);
    bld("/low_poly_hospital.glb", 280, [600, -600], "hospital", "Smart Hospital", 0xc0392b);
    bld("/us_bank_tower.glb", 360, [600, 600], "bank", "State Bank", 0x8e44ad);
    bld("/simple_farm_free.glb", 520, [1800, -600], "farm", "Smart Eco Farm", 0x27ae60);
    bld("/liverpool_street_station_south_entrance.glb", 420, [600, 1800], "event", "Event Hall", 0xd4a017);
    bld("/gas_station.glb", 380, [1800, 1750], "gas", "Gas Station", 0xc0392b);
    bld("/office.glb", 380, [1800, 600], "sewage", "Sewage Co.", 0x2ecc71);
    bld("/national_archives_research_center.glb", 480, [-1800, 1800], "culture", "Culture Center", 0xf39c12);
    bld("/power-suply-companey.glb", 380, [-1600, 800], "powerCompany", "Power Co.", 0xf1c40f);
    bld("/sci-fi_building_9.glb", 440, [-3900, -2400], "scifi", "Sci-Fi 9", 0x66ff99);
    bld("/beautifultowerbuilding.glb", 520, [-3600, -800], "tower", "Beautiful Tower", 0x22cfff);
    bld("/sci-fi_building_10.glb", 440, [-3600, 800], "scifi", "Sci-Fi 10", 0xff66dd);

    // SOCIETY
    const innerGround = new THREE.Mesh(new THREE.BoxGeometry(820, 0.6, 820), mat(0xb8bcc0, 0.92));
    innerGround.position.set(-600, 4.85, 600); scene.add(innerGround);
    const towerColors = [0x5b9bd5, 0x7bb3e0, 0xc0629b, 0xf5a623, 0x6cd4a0, 0x9b7ad9, 0xe8635c];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const tx = -600 - 340 + (c + 0.5) * (680 / 3);
        const tz = 600 - 340 + (r + 0.5) * (680 / 4);
        const h = 180 + Math.random() * 180;
        const body = new THREE.Mesh(new THREE.BoxGeometry(30, h, 30), mat(towerColors[Math.floor(Math.random() * towerColors.length)], 0.4, 0.55));
        body.position.set(tx, 5 + h / 2, tz);
        scene.add(body);
      }
    }

    // BOARDS
    function board(text, x, y, z, w = 80, h = 12, color) {
      const g = new THREE.Group(); g.position.set(x, y, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 14, 6), darkMaterial);
      pole.position.y = 7; g.add(pole);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.9), color ? mat(color, 0.35, 0.25) : mat(0x087fa8, 0.35, 0.25));
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
      const sM = new THREE.Mesh(new THREE.PlaneGeometry(w - 1, h - 0.8), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
      sM.position.set(0, 12, 0.5); g.add(sM);
      scene.add(g);
    }
    board("AI TRAFFIC CONTROL", 0, 5, 450, 320, 20, 0x22cfff);
    board("POWER SUPPLY", -5400, 5, 4600, 460, 22, 0xffcc22);
    board("WATER FILTRATION", 3600, 5, -2700, 460, 20, 0x22cfff);
    board("AI FOOD PRODUCTION", 2900, 5, -400, 420, 22, 0x2ecc71);

    // POWER ZONE
    const powerZone = new THREE.Group();
    powerZone.position.set(-5400, 0, 3600);
    scene.add(powerZone);
    const pPad = new THREE.Mesh(new THREE.BoxGeometry(1600, 1, 1300), mat(0x1d3a2e, 0.92));
    pPad.position.set(0, 5.1, 0); powerZone.add(pPad);
    const pBorderMat = new THREE.MeshStandardMaterial({ color: 0xffcc22, emissive: 0xffcc22, emissiveIntensity: 3.0, metalness: 0.7, roughness: 0.2 });
    s.borderLights.push(pBorderMat);
    const pbF = new THREE.Mesh(new THREE.BoxGeometry(1600, 2.5, 8), pBorderMat);
    pbF.position.set(0, 7, -650); powerZone.add(pbF);
    const pbB = pbF.clone(); pbB.position.z = 650; powerZone.add(pbB);
    const pbL = new THREE.Mesh(new THREE.BoxGeometry(8, 2.5, 1300), pBorderMat);
    pbL.position.set(-800, 7, 0); powerZone.add(pbL);
    const pbR = pbL.clone(); pbR.position.x = 800; powerZone.add(pbR);

    const zoneHit = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1300), new THREE.MeshBasicMaterial({ visible: false }));
    zoneHit.rotation.x = -Math.PI / 2;
    zoneHit.position.set(0, 6, 0);
    powerZone.add(zoneHit);
    s.clickable.push({ object: zoneHit, type: "power", name: "Power Supply System" });

    s.turbines = [];
    const turbTowerMat = mat(0xf0f0f0, 0.4, 0.3);
    const turbTowerGeo = new THREE.CylinderGeometry(1.2, 2, 80, 8);
    const turbBladeGeo = new THREE.BoxGeometry(2.5, 32, 1);
    function turbine(x, z, sc = 1) {
      const g = new THREE.Group();
      g.position.set(x, 6, z);
      g.scale.setScalar(sc);
      const t = new THREE.Mesh(turbTowerGeo, turbTowerMat);
      t.position.y = 40; g.add(t);
      const blades = new THREE.Group();
      blades.position.y = 80;
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(turbBladeGeo, turbTowerMat);
        b.position.y = 15;
        b.rotation.z = i * Math.PI * 2 / 3;
        blades.add(b);
      }
      g.add(blades);
      powerZone.add(g);
      s.turbines.push(blades);
    }
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 4; col++)
        turbine(-650 + col * 200, -600 + row * 220, 1 + (row % 3) * 0.08);

    const solarPanelMat = new THREE.MeshStandardMaterial({ color: 0x082c4b, roughness: 0.18, metalness: 0.7, emissive: 0x063b62, emissiveIntensity: 1 });
    const solarPark = new THREE.Group();
    solarPark.position.set(500, 6, 0);
    powerZone.add(solarPark);
    const solarGround = new THREE.Mesh(new THREE.BoxGeometry(650, 1, 1250), mat(0x2a4536, 0.92));
    solarGround.position.y = 0; solarPark.add(solarGround);
    for (let i = 0; i < 5; i++) {
      for (const xOff of [-160, 160]) {
        const g = new THREE.Group();
        g.position.set(xOff, 4, -480 + i * 220);
        g.rotation.x = -0.22;
        for (let r = 0; r < 2; r++)
          for (let c = 0; c < 4; c++) {
            const p = new THREE.Mesh(new THREE.BoxGeometry(67, 0.7, 87), solarPanelMat);
            p.position.set((c - 1.5) * 70, 0, (r - 0.5) * 90);
            g.add(p);
          }
        solarPark.add(g);
      }
    }

    s.batteryRings = [];
    s.powerRings = [];
    const batteryPositions = [
      [-500, 850], [-370, 850], [-240, 850], [-110, 850], [20, 850],
      [-500, 980], [-370, 980], [-240, 980], [-110, 980], [20, 980],
    ];
    batteryPositions.forEach((pos) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(45, 60, 45), mat(0x2a5a4a, 0.4, 0.5));
      b.position.set(pos[0], 36, pos[1]); powerZone.add(b);
      const rMat = new THREE.MeshStandardMaterial({ color: 0x22ff9d, emissive: 0x22ff9d, emissiveIntensity: 2.5 });
      const r = new THREE.Mesh(new THREE.TorusGeometry(32, 1, 8, 20), rMat);
      r.rotation.x = Math.PI / 2; r.position.set(pos[0], 8, pos[1]); powerZone.add(r);
      s.batteryRings.push(rMat);
      s.powerRings.push(r);
    });

    // FILTRATION ZONE
    const filtZone = new THREE.Group();
    filtZone.position.set(3600, 5, -3600);
    scene.add(filtZone);
    const fPad = new THREE.Mesh(new THREE.BoxGeometry(1000, 1, 1000), mat(0x1a2836, 0.95));
    fPad.position.y = 0; filtZone.add(fPad);
    const fBorderMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 3.0, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(fBorderMat);
    const fzF = new THREE.Mesh(new THREE.BoxGeometry(1000, 2.5, 8), fBorderMat);
    fzF.position.set(0, 1.5, -500); filtZone.add(fzF);
    const fzB = fzF.clone(); fzB.position.z = 500; filtZone.add(fzB);
    const fzL = new THREE.Mesh(new THREE.BoxGeometry(8, 2.5, 1000), fBorderMat);
    fzL.position.set(-500, 1.5, 0); filtZone.add(fzL);
    const fzR = fzL.clone(); fzR.position.x = 500; filtZone.add(fzR);

    const filtHit = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshBasicMaterial({ visible: false }));
    filtHit.rotation.x = -Math.PI / 2;
    filtHit.position.set(0, 1, 0);
    filtZone.add(filtHit);
    s.clickable.push({ object: filtHit, type: "filtration", name: "Water Filtration System" });

    s.filtrationStageMeshes = [];
    for (let i = 0; i < FILTRATION_STAGES.length; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const tx = (col - 1) * 90;
      const tz = (row - 1) * 90;
      const tankColor = FILTRATION_STAGES[i].color;
      const tankMat = new THREE.MeshStandardMaterial({ color: tankColor, emissive: tankColor, emissiveIntensity: 0.5, metalness: 0.3, roughness: 0.3, transparent: true, opacity: 0.8 });
      const tankBody = new THREE.Mesh(new THREE.CylinderGeometry(28, 30, 55, 20), tankMat);
      tankBody.position.set(tx, 27.5, tz);
      filtZone.add(tankBody);
      const tankCap = new THREE.Mesh(new THREE.SphereGeometry(28, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), tankMat);
      tankCap.position.set(tx, 55, tz);
      filtZone.add(tankCap);
      const waterMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 1.5, transparent: true, opacity: 0.8, metalness: 0.4, roughness: 0.1 });
      const waterFill = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 1, 20), waterMat);
      waterFill.position.set(tx, 10, tz);
      filtZone.add(waterFill);
      s.filtrationStageMeshes.push({ tankBody, tankCap, waterFill, baseY: 10, stageIndex: i });
    }
    const resMat = new THREE.MeshStandardMaterial({ color: 0x0a4a6a, roughness: 0.3, metalness: 0.5, emissive: 0x0a2a4a, emissiveIntensity: 1 });
    const reservoir = new THREE.Mesh(new THREE.CylinderGeometry(60, 65, 55, 32), resMat);
    reservoir.position.set(-370, 27.5, 0);
    filtZone.add(reservoir);

    // FOOD ZONE
    const foodZone = new THREE.Group();
    foodZone.position.set(2900, 5, -1200);
    scene.add(foodZone);
    const foodPad = new THREE.Mesh(new THREE.BoxGeometry(1000, 1, 1000), mat(0x1a2e1e, 0.95));
    foodPad.position.y = 0; foodZone.add(foodPad);
    const foodBorderMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 3.5, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(foodBorderMat);
    const foodF = new THREE.Mesh(new THREE.BoxGeometry(1000, 3, 10), foodBorderMat);
    foodF.position.set(0, 2, -500); foodZone.add(foodF);
    const foodB = foodF.clone(); foodB.position.z = 500; foodZone.add(foodB);
    const foodL = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 1000), foodBorderMat);
    foodL.position.set(-500, 2, 0); foodZone.add(foodL);
    const foodR = foodL.clone(); foodR.position.x = 500; foodZone.add(foodR);
    for (const cx of [-500, 500]) for (const cz of [-500, 500]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 30, 12), foodBorderMat);
      post.position.set(cx, 15, cz); foodZone.add(post);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x2ecc71, emissiveIntensity: 5 });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), capMat);
      cap.position.set(cx, 33, cz); foodZone.add(cap);
      s.borderLights.push(capMat);
    }
    const foodHit = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshBasicMaterial({ visible: false }));
    foodHit.rotation.x = -Math.PI / 2;
    foodHit.position.set(0, 2, 0);
    foodZone.add(foodHit);
    s.clickable.push({ object: foodHit, type: "food", name: "AI Food Production" });

    s.foodCropMeshes = [];
    s.foodSprinklers = [];
    const cropColors = [0x2ecc71, 0x27ae60, 0x7bc96f, 0x4a9d4a];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const px = -280 + c * 130;
        const pz = -280 + r * 130;
        const plot = new THREE.Mesh(new THREE.BoxGeometry(110, 3, 110), mat(0x4a2f1a, 0.95));
        plot.position.set(px, 1.5, pz);
        foodZone.add(plot);
        const plotBorderMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 1.5 });
        const plotBorder = new THREE.Mesh(new THREE.BoxGeometry(114, 1, 114), plotBorderMat);
        plotBorder.position.set(px, 3, pz);
        foodZone.add(plotBorder);
        for (let k = 0; k < 8; k++) {
          const cropColor = cropColors[Math.floor(Math.random() * cropColors.length)];
          const crop = new THREE.Mesh(new THREE.ConeGeometry(4, 16, 6), new THREE.MeshStandardMaterial({ color: cropColor, emissive: cropColor, emissiveIntensity: 0.3, roughness: 0.8 }));
          crop.position.set(px + (Math.random() - 0.5) * 80, 11, pz + (Math.random() - 0.5) * 80);
          crop.userData = { baseY: 11, phase: Math.random() * Math.PI * 2, scale: 0.7 + Math.random() * 0.6 };
          crop.scale.setScalar(crop.userData.scale);
          foodZone.add(crop);
          s.foodCropMeshes.push(crop);
        }
        const sprinklerBase = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 4, 8), mat(0x9aa0a6, 0.5, 0.7));
        sprinklerBase.position.set(px, 5, pz);
        foodZone.add(sprinklerBase);
        const sprinklerHead = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 12), new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 2 }));
        sprinklerHead.position.set(px, 8, pz);
        foodZone.add(sprinklerHead);
        const sprayRing = new THREE.Mesh(new THREE.TorusGeometry(20, 0.5, 6, 24), new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 3, transparent: true, opacity: 0.7 }));
        sprayRing.rotation.x = Math.PI / 2;
        sprayRing.position.set(px, 6, pz);
        foodZone.add(sprayRing);
        s.foodSprinklers.push({ ring: sprayRing, baseX: px, baseZ: pz, phase: Math.random() * Math.PI * 2 });
        const sensorPole = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 25, 6), mat(0x4a5a6a, 0.5, 0.7));
        sensorPole.position.set(px + 50, 12.5, pz - 50);
        foodZone.add(sensorPole);
        const sensorTop = new THREE.Mesh(new THREE.SphereGeometry(2.5, 10, 10), new THREE.MeshStandardMaterial({ color: 0xffcc22, emissive: 0xffcc22, emissiveIntensity: 3 }));
        sensorTop.position.set(px + 50, 26, pz - 50);
        foodZone.add(sensorTop);
      }
    }
    const plant = new THREE.Group();
    plant.position.set(0, 0, 100);
    foodZone.add(plant);
    const plantBody = new THREE.Mesh(new THREE.BoxGeometry(180, 120, 140), mat(0x1a8a4e, 0.4, 0.5));
    plantBody.position.y = 60;
    plant.add(plantBody);
    const glassBand = new THREE.Mesh(new THREE.BoxGeometry(182, 30, 142), new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 0.8, transparent: true, opacity: 0.5, metalness: 0.7, roughness: 0.15 }));
    glassBand.position.y = 60;
    plant.add(glassBand);
    const plantRoof = new THREE.Mesh(new THREE.BoxGeometry(190, 6, 150), mat(0x0a3a1a, 0.5, 0.5));
    plantRoof.position.y = 123;
    plant.add(plantRoof);
    const plantBeacon = new THREE.Mesh(new THREE.SphereGeometry(7, 20, 20), new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 6 }));
    plantBeacon.position.y = 138;
    plant.add(plantBeacon);
    s.foodBeacon = plantBeacon;

    s.foodGears = [];
    for (let i = 0; i < 3; i++) {
      const gear = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 3, 12), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.2 }));
      gear.rotation.x = Math.PI / 2;
      gear.rotation.z = Math.PI / 2;
      gear.position.set(-60 + i * 60, 30, 72);
      plant.add(gear);
      s.foodGears.push(gear);
    }

    s.foodConveyorItems = [];
    const beltBase = new THREE.Mesh(new THREE.BoxGeometry(240, 3, 30), mat(0x2c3e50, 0.6, 0.4));
    beltBase.position.set(0, 8, 200);
    plant.add(beltBase);
    const beltTop = new THREE.Mesh(new THREE.BoxGeometry(240, 1, 26), new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 0.5 }));
    beltTop.position.set(0, 12, 200);
    plant.add(beltTop);
    for (let i = 0; i < 8; i++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(18, 18, 18), new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xe67e22 : 0xf39c12, emissive: i % 2 === 0 ? 0xe67e22 : 0xf39c12, emissiveIntensity: 1.5 }));
      box.position.set(-110 + i * 30, 23, 200);
      box.userData = { speed: 0.8, offset: i * 30, startX: -110, endX: 110 };
      plant.add(box);
      s.foodConveyorItems.push(box);
    }

    const laserBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 50, 6), new THREE.MeshBasicMaterial({ color: 0x22cfff, transparent: true, opacity: 0.7 }));
    laserBeam.position.set(60, 30, 200);
    plant.add(laserBeam);
    s.foodLaser = laserBeam;

    const drone = new THREE.Group();
    drone.position.set(-280, 80, -280);
    foodZone.add(drone);
    const droneBody = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 12), mat(0x2c3e50, 0.5, 0.6));
    drone.add(droneBody);
    s.foodDroneRotors = [];
    for (const [rx, rz] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) {
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 1, 12), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.8 }));
      rotor.position.set(rx, 3, rz);
      drone.add(rotor);
      s.foodDroneRotors.push(rotor);
    }
    s.foodDrone = drone;

    // CARS
    s.cars = [];
    const carColors = [0x287ca3, 0xc83f49, 0xe1a72e, 0x5b72c9, 0x2f9d65, 0xd8d8d8, 0xd97b2a, 0x8b3ad9, 0x16a085, 0x8e44ad];
    const V_LEN = 28, V_WID = 12, V_HGT = 6;
    const carBodyGeo = new THREE.BoxGeometry(V_LEN, V_HGT, V_WID);
    const carCabinGeo = new THREE.BoxGeometry(V_LEN * 0.45, V_HGT * 0.85, V_WID * 0.85);
    const carWheelGeo = new THREE.CylinderGeometry(2.8, 2.8, 2, 12);
    const carGlassMat = new THREE.MeshStandardMaterial({ color: 0x1a3a4a, emissive: 0x0a2535, emissiveIntensity: 0.8, roughness: 0.12, metalness: 0.5 });
    const wheelMat = mat(0x0c1012, 0.6, 0.1);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8e0, emissiveIntensity: 4 });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff1e1e, emissive: 0xff1010, emissiveIntensity: 4 });

    function makeCar(colorHex) {
      const g = new THREE.Group();
      const bMat = mat(colorHex, 0.35, 0.5);
      const body = new THREE.Mesh(carBodyGeo, bMat); body.position.y = 5; g.add(body);
      const hood = new THREE.Mesh(new THREE.BoxGeometry(V_LEN * 0.3, V_HGT * 0.6, V_WID * 0.95), bMat);
      hood.position.set(V_LEN * 0.35, 4.5, 0); g.add(hood);
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(V_LEN * 0.28, V_HGT * 0.55, V_WID * 0.95), bMat);
      trunk.position.set(-V_LEN * 0.36, 4.3, 0); g.add(trunk);
      const cabin = new THREE.Mesh(carCabinGeo, carGlassMat); cabin.position.set(-1, 9.8, 0); g.add(cabin);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(V_LEN * 0.4, 0.6, V_WID * 0.7), mat(0x2a2a2a, 0.5, 0.4));
      roof.position.set(-1, 13, 0); g.add(roof);
      for (const wp of [[V_LEN * 0.33, V_WID * 0.5], [V_LEN * 0.33, -V_WID * 0.5], [-V_LEN * 0.33, V_WID * 0.5], [-V_LEN * 0.33, -V_WID * 0.5]]) {
        const w = new THREE.Mesh(carWheelGeo, wheelMat);
        w.rotation.x = Math.PI / 2; w.position.set(wp[0], 3, wp[1]); g.add(w);
      }
      for (const z of [-4, 4]) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2.5), headMat);
        l.position.set(V_LEN * 0.5, 5, z); g.add(l);
        const t = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2.5), tailMat);
        t.position.set(-V_LEN * 0.5, 5, z); g.add(t);
      }
      return g;
    }

    const STOP_DIST = 130;
    const CAR_GAP = 90;
    const LANES = [
      { id: "N1", axis: "z", dir: 1, fixed: -30, road: 1, start: -3600, end: 3600 },
      { id: "N2", axis: "z", dir: 1, fixed: -65, road: 1, start: -3600, end: 3600 },
      { id: "S1", axis: "z", dir: -1, fixed: 30, road: 2, start: 3600, end: -3600 },
      { id: "S2", axis: "z", dir: -1, fixed: 65, road: 2, start: 3600, end: -3600 },
      { id: "E1", axis: "x", dir: 1, fixed: 30, road: 3, start: -3600, end: 3600 },
      { id: "E2", axis: "x", dir: 1, fixed: 65, road: 3, start: -3600, end: 3600 },
      { id: "W1", axis: "x", dir: -1, fixed: -30, road: 4, start: 3600, end: -3600 },
      { id: "W2", axis: "x", dir: -1, fixed: -65, road: 4, start: 3600, end: -3600 },
    ];

    function updateCarTransform(c) {
      const { lane, pos } = c;
      const lockedPos = Math.round(pos * 10) / 10;
      if (lane.axis === "z") {
        c.car.position.set(lane.fixed, CAR_Y, lockedPos);
        c.car.rotation.y = lane.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      } else {
        c.car.position.set(lockedPos, CAR_Y, lane.fixed);
        c.car.rotation.y = lane.dir > 0 ? 0 : Math.PI;
      }
      c.car.rotation.x = 0;
      c.car.rotation.z = 0;
    }

    function makeCarObj(lane, startPos) {
      const car = makeCar(carColors[Math.floor(Math.random() * carColors.length)]);
      scene.add(car);
      const obj = { car, lane, pos: startPos, speed: 0, baseSpeed: 50 + Math.random() * 25 };
      s.cars.push(obj);
      updateCarTransform(obj);
      return obj;
    }

    LANES.forEach(lane => {
      const count = 3;
      const totalDist = Math.abs(lane.end - lane.start);
      const gap = totalDist / count;
      for (let i = 0; i < count; i++) {
        let startPos;
        if (lane.dir > 0) startPos = lane.start + gap * i + Math.random() * 50;
        else startPos = lane.start - gap * i - Math.random() * 50;
        makeCarObj(lane, startPos);
      }
    });

    // PEOPLE
    const people = [];
    const skinColors = [0xf2c9a0, 0xd9a373, 0xa06a3c, 0x6b4a2f, 0xffd8b8];
    const shirtColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0x1abc9c];

    function makePerson() {
      const g = new THREE.Group();
      const skinMat = mat(skinColors[Math.floor(Math.random() * skinColors.length)], 0.9);
      const shirtMat = mat(shirtColors[Math.floor(Math.random() * shirtColors.length)], 0.85);
      const pantsMat = mat(0x2c3e50, 0.85);
      const head = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 6), skinMat); head.position.y = 10; g.add(head);
      const body = new THREE.Mesh(new THREE.BoxGeometry(3, 5.5, 2), shirtMat); body.position.y = 6; g.add(body);
      const legL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.5, 1.2), pantsMat); legL.position.set(-0.8, 2.2, 0); g.add(legL);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.5, 1.2), pantsMat); legR.position.set(0.8, 2.2, 0); g.add(legR);
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
        people.push({ obj: p.g, legL: p.legL, legR: p.legR, cx, cz, r, angle, dir: Math.random() > 0.5 ? 1 : -1, speed: 0.01 + Math.random() * 0.012, phase: Math.random() * Math.PI * 2 });
      }
    }
    spawnPeople(-600, -900, 6, 180);
    spawnPeople(600, -900, 6, 180);
    spawnPeople(-600, 1100, 8, 250);
    spawnPeople(600, 900, 5, 180);

    // AI SYSTEM
    s.aiSystem = createAITrafficSystem((data) => {
      if (s.onAITrafficUpdate) s.onAITrafficUpdate(data);
    });

    // CLICK
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (e) => {
      if (e.target !== renderer.domElement) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      for (const item of s.clickable) {
        const hit = raycaster.intersectObject(item.object, true);
        if (hit.length) {
          if (s.onPanel) s.onPanel({ type: item.type, name: item.name });
          return;
        }
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    // ANIMATE
    const clock = new THREE.Clock();
    let fc = 0;
    let rafId;

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
          const laneCars = byLane[laneId];
          const lane = laneCars[0].lane;
          const ai = s.aiSystem;
          laneCars.sort((a, b) => lane.dir > 0 ? b.pos - a.pos : a.pos - b.pos);
          for (let i = 0; i < laneCars.length; i++) {
            const c = laneCars[i];
            const leader = i > 0 ? laneCars[i - 1] : null;
            let targetSpeed = c.baseSpeed;
            const isGreen = ai.isGreen(lane.road);
            const isYellow = ai.isYellowRoad(lane.road);
            const stopLine = lane.dir > 0 ? -STOP_DIST : STOP_DIST;
            const distToStop = Math.abs(c.pos - stopLine);
            if (!isGreen && distToStop < 220) {
              if (distToStop < 40) targetSpeed = 0;
              else targetSpeed = c.baseSpeed * (distToStop / 220) * 0.5;
            } else if (isYellow && distToStop < 120) {
              targetSpeed = c.baseSpeed * 0.4;
            }
            if (leader) {
              const gap = Math.abs(leader.pos - c.pos);
              if (gap < CAR_GAP) {
                targetSpeed = Math.min(targetSpeed, leader.speed * 0.9);
                if (gap < 45) targetSpeed = 0;
              }
            }
            c.speed += (targetSpeed - c.speed) * Math.min(1, delta * 4);
            c.pos += c.speed * lane.dir * delta;
            if (lane.dir > 0 && c.pos > lane.end) c.pos = lane.start;
            else if (lane.dir < 0 && c.pos < lane.end) c.pos = lane.start;
            updateCarTransform(c);
          }
        }

        // TRAFFIC LIGHTS
        const blinkFast = Math.floor(t * 4) % 2 === 0;
        const blinkMed = Math.floor(t * 2) % 2 === 0;
        for (const l of s.intersectionLights) {
          const ai = s.aiSystem;
          l.r.material.emissiveIntensity = 0;
          l.y.material.emissiveIntensity = 0;
          l.gr.material.emissiveIntensity = 0;
          l.rHalo.material.opacity = 0;
          l.yHalo.material.opacity = 0;
          l.grHalo.material.opacity = 0;
          if (ai.isGreen(l.road)) {
            l.gr.material.emissiveIntensity = 5 + Math.sin(t * 3) * 1.5;
            l.grHalo.material.opacity = 0.35 + Math.sin(t * 3) * 0.15;
          } else if (ai.isYellowRoad(l.road)) {
            l.y.material.emissiveIntensity = blinkFast ? 8 : 1;
            l.yHalo.material.opacity = blinkFast ? 0.6 : 0.1;
          } else {
            l.r.material.emissiveIntensity = blinkMed ? 7 : 2.5;
            l.rHalo.material.opacity = blinkMed ? 0.55 : 0.15;
          }
        }

        // PEOPLE
        for (const p of people) {
          p.angle += p.speed * p.dir;
          if (p.angle > Math.PI * 2) p.angle -= Math.PI * 2;
          if (p.angle < 0) p.angle += Math.PI * 2;
          p.obj.position.x = p.cx + Math.cos(p.angle) * p.r;
          p.obj.position.z = p.cz + Math.sin(p.angle) * p.r;
          p.obj.rotation.y = p.angle + (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
          const swing = Math.sin(t * 6 + p.phase) * 0.5;
          p.legL.rotation.x = swing; p.legR.rotation.x = -swing;
        }

        if (fc % 3 === 0) for (const bl of s.turbines) bl.rotation.z = t * 2.4;

        if (s.radar) s.radar.rotation.z = t * 1.7;
        if (s.controllerRing) s.controllerRing.rotation.z = t * 0.5;
        if (s.controllerSig) {
          s.controllerSig.scale.setScalar(1 + Math.sin(t * 4) * 0.2);
          s.controllerSig.material.emissiveIntensity = 4 + Math.sin(t * 4) * 2;
        }

        for (let i = 0; i < s.powerRings.length; i++) {
          s.powerRings[i].rotation.z = t * 0.8 + i;
        }

        // FILTRATION
        s.filtrationStageElapsed += delta;
        const curFilt = FILTRATION_STAGES[s.filtrationStageIndex];
        if (s.filtrationStageElapsed >= curFilt.duration) {
          s.filtrationStageElapsed = 0;
          s.filtrationStageIndex = (s.filtrationStageIndex + 1) % FILTRATION_STAGES.length;
        }
        if (fc % 15 === 0 && s.onFiltrationUpdate) {
          s.onFiltrationUpdate({ stageIndex: s.filtrationStageIndex, stage: FILTRATION_STAGES[s.filtrationStageIndex], allStages: FILTRATION_STAGES, progress: s.filtrationStageElapsed / curFilt.duration });
        }
        for (let i = 0; i < s.filtrationStageMeshes.length; i++) {
          const sm = s.filtrationStageMeshes[i];
          if (!sm || !sm.waterFill) continue;
          const isActive = i === s.filtrationStageIndex;
          if (isActive) {
            sm.tankBody.material.emissiveIntensity = 1.5 + Math.sin(t * 4) * 0.8;
            const fillH = 40 + Math.sin(t * 2.5) * 12;
            sm.waterFill.scale.y = fillH;
            sm.waterFill.position.y = sm.baseY + fillH / 2;
          } else {
            sm.tankBody.material.emissiveIntensity = 0.5;
            sm.waterFill.scale.y = 10;
            sm.waterFill.position.y = sm.baseY + 5;
          }
        }

        // POWER
        s.powerStageElapsed += delta;
        const curPower = POWER_STAGES[s.powerStageIndex];
        if (s.powerStageElapsed >= curPower.duration) {
          s.powerStageElapsed = 0;
          s.powerStageIndex = (s.powerStageIndex + 1) % POWER_STAGES.length;
        }
        if (fc % 15 === 0 && s.onPowerUpdate) {
          s.onPowerUpdate({ stageIndex: s.powerStageIndex, stage: POWER_STAGES[s.powerStageIndex], allStages: POWER_STAGES, progress: s.powerStageElapsed / curPower.duration });
        }

        // FOOD
        s.foodStageElapsed += delta;
        const curFood = FOOD_STAGES[s.foodStageIndex];
        if (s.foodStageElapsed >= curFood.duration) {
          s.foodStageElapsed = 0;
          s.foodStageIndex = (s.foodStageIndex + 1) % FOOD_STAGES.length;
        }
        if (fc % 15 === 0 && s.onFoodUpdate) {
          s.onFoodUpdate({ stageIndex: s.foodStageIndex, stage: FOOD_STAGES[s.foodStageIndex], allStages: FOOD_STAGES, progress: s.foodStageElapsed / curFood.duration });
        }
        const foodStageId = FOOD_STAGES[s.foodStageIndex].id;
        for (let i = 0; i < s.foodCropMeshes.length; i++) {
          const crop = s.foodCropMeshes[i];
          if (!crop) continue;
          crop.rotation.z = Math.sin(t * 1.5 + crop.userData.phase) * 0.08;
          const growthBoost = (foodStageId === "planting" || foodStageId === "irrigation") ? (1 + Math.sin(t * 0.8 + crop.userData.phase) * 0.15) : 1;
          crop.scale.y = crop.userData.scale * growthBoost;
        }
        for (const spr of s.foodSprinklers) {
          const phase = (t * 0.8 + spr.phase) % 2;
          spr.ring.scale.setScalar(1 + phase * 0.8);
          spr.ring.material.opacity = Math.max(0, 0.7 - phase * 0.35);
          spr.ring.visible = foodStageId === "irrigation" || foodStageId === "planting";
        }
        const beltSpeed = foodStageId === "processing" ? 1.5 : 0.5;
        for (const item of s.foodConveyorItems) {
          item.position.x += beltSpeed * delta * 30;
          if (item.position.x > item.userData.endX) item.position.x = item.userData.startX;
          item.position.y = 23 + Math.sin(t * 5 + item.userData.offset) * 1.5;
        }
        const gearSpeed = foodStageId === "processing" ? 4 : 1.5;
        for (const gear of s.foodGears) gear.rotation.y += delta * gearSpeed;
        if (s.foodLaser) {
          const isQuality = foodStageId === "quality";
          s.foodLaser.visible = isQuality;
          if (isQuality) s.foodLaser.material.opacity = 0.5 + Math.sin(t * 20) * 0.3;
        }
        if (s.foodBeacon) {
          s.foodBeacon.scale.setScalar(1 + Math.sin(t * 3) * 0.3);
          s.foodBeacon.material.emissiveIntensity = 5 + Math.sin(t * 3) * 2;
        }
        if (s.foodDrone) {
          const droneAngle = t * 0.4;
          s.foodDrone.position.x = Math.cos(droneAngle) * 320;
          s.foodDrone.position.z = Math.sin(droneAngle) * 320;
          s.foodDrone.position.y = 80 + Math.sin(t * 1.5) * 10;
          s.foodDrone.rotation.y = -droneAngle + Math.PI / 2;
          for (const rotor of s.foodDroneRotors) rotor.rotation.y += delta * 30;
        }

        // CAMERA
        if (s.camTransition && s.camera && s.controls) {
          const now = performance.now();
          const elapsed = now - s.camTransition.startTime;
          const tt = Math.min(elapsed / s.camTransition.duration, 1);
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
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh" }} />;
});

export default SmartCity3D;
