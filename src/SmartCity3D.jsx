import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const CITY_HALF = 3900;
const ROAD_HALF_LEN = 3800;
const GROUND_SIZE = 8200;

export const LOCATIONS = {
  school: { key: "school", label: "American High School", icon: "🏫", type: "EDUCATION", position: [-600, 5, -600], camHeight: 380, camDistance: 330, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  hospital: { key: "hospital", label: "Smart Hospital", icon: "🏥", type: "HEALTHCARE", position: [600, 5, -600], camHeight: 380, camDistance: 330, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  society: { key: "society", label: "BSS Smart Society", icon: "🏘", type: "RESIDENTIAL", position: [-600, 5, 600], camHeight: 500, camDistance: 500, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  bank: { key: "bank", label: "Smart City State Bank", icon: "🏦", type: "FINANCIAL", position: [600, 5, 600], camHeight: 380, camDistance: 330, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  nearBank: { key: "nearBank", label: "Near Bank Building", icon: "🏢", type: "COMMERCIAL", position: [750, 5, 750], camHeight: 320, camDistance: 300, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  commercial: { key: "commercial", label: "Commercial Building", icon: "🏬", type: "COMMERCIAL", position: [1000, 5, 400], camHeight: 340, camDistance: 320, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  farm: { key: "farm", label: "Smart Eco Farm", icon: "🌾", type: "AGRICULTURE", position: [1800, 5, -600], camHeight: 420, camDistance: 420, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  newHall: { key: "newHall", label: "Liverpool Event Hall", icon: "🎪", type: "EVENT VENUE", position: [600, 5, 1800], camHeight: 420, camDistance: 420, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  carWash: { key: "carWash", label: "Car Wash · Gas Station", icon: "🚗", type: "AUTOMOTIVE", position: [1800, 5, 1750], camHeight: 420, camDistance: 420, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  powerCompany: { key: "powerCompany", label: "City Power Supply Co.", icon: "🔌", type: "UTILITY", position: [-1600, 5, 800], camHeight: 380, camDistance: 380, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  powerSupply: { key: "powerSupply", label: "Power Supply Zone", icon: "⚡", type: "RENEWABLE", position: [-3600, 5, 3600], camHeight: 800, camDistance: 900, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  filtration: { key: "filtration", label: "Filtration System", icon: "💧", type: "WATER TREATMENT", position: [3600, 5, -3600], camHeight: 420, camDistance: 380, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }, { name: "Inside Machine", inside: true }] },
  fertilizer: { key: "fertilizer", label: "AI Fertilizer System", icon: "🌱", type: "FERTILIZER MANAGEMENT", position: [-3600, 5, -3600], camHeight: 450, camDistance: 480, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  wasteManagement: { key: "wasteManagement", label: "Waste Management", icon: "♻", type: "MUNICIPAL", position: [3600, 5, 3600], camHeight: 450, camDistance: 480, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  cultureCenter: { key: "cultureCenter", label: "Culture Center", icon: "🏛", type: "CULTURAL", position: [-1800, 5, 1800], camHeight: 450, camDistance: 450, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  sewageCompany: { key: "sewageCompany", label: "Sewage & Gas Co.", icon: "🏭", type: "INDUSTRIAL", position: [1800, 5, 600], camHeight: 400, camDistance: 400, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  scifi9: { key: "scifi9", label: "Sci-Fi Building 9", icon: "🛸", type: "SCI-FI", position: [-3600, 5, -2400], camHeight: 520, camDistance: 480, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  beautifulTower: { key: "beautifulTower", label: "Beautiful Tower", icon: "🗼", type: "SKYLINE", position: [-3600, 5, -800], camHeight: 550, camDistance: 500, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  scifi10: { key: "scifi10", label: "Sci-Fi Building 10", icon: "🚀", type: "SCI-FI", position: [-3600, 5, 800], camHeight: 520, camDistance: 480, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  twinTowers: { key: "twinTowers", label: "Twin Sci-Fi Towers", icon: "🏙", type: "SKYLINE", position: [-3600, 5, 2400], camHeight: 550, camDistance: 500, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  wasteCollector: { key: "wasteCollector", label: "Waste Collector Point", icon: "🗑", type: "MUNICIPAL", position: [900, 5, 1400], camHeight: 300, camDistance: 280, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
  trafficController: { key: "trafficController", label: "AI Traffic Controller", icon: "🤖", type: "TRANSPORTATION", position: [0, 5, 0], camHeight: 320, camDistance: 280, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Camera 3", angle: Math.PI / 2 }, { name: "Camera 4", angle: -Math.PI / 2 }, { name: "Top View", top: true }] },
};

function createAITrafficSystem(callbacks) {
  const PHASE_DURATION = 10;
  const YELLOW_DURATION = 2.5;
  let elapsed = 0;
  let phase = 1;
  let inYellow = false;
  let yellowElapsed = 0;
  let currentGreenRoads = [1, 2];
  let currentRedRoads = [3, 4];

  const stats = {
    vehiclesDetected: 60,
    vehiclesMoving: 30,
    vehiclesWaiting: 30,
    density: "HIGH",
  };

  function tick(delta) {
    elapsed += delta;

    if (inYellow) {
      yellowElapsed += delta;
      if (yellowElapsed >= YELLOW_DURATION) {
        inYellow = false;
        yellowElapsed = 0;
        elapsed = 0;
        if (phase === 1) {
          phase = 2;
          currentGreenRoads = [3, 4];
          currentRedRoads = [1, 2];
        } else {
          phase = 1;
          currentGreenRoads = [1, 2];
          currentRedRoads = [3, 4];
        }
      }
    } else if (elapsed >= PHASE_DURATION) {
      inYellow = true;
      yellowElapsed = 0;
    }

    const greenCount = 30;
    const redCount = 30;
    if (phase === 1) {
      stats.vehiclesMoving = greenCount + Math.floor(Math.random() * 5);
      stats.vehiclesWaiting = redCount + Math.floor(Math.random() * 5);
    } else {
      stats.vehiclesMoving = redCount + Math.floor(Math.random() * 5);
      stats.vehiclesWaiting = greenCount + Math.floor(Math.random() * 5);
    }

    const densityRoll = stats.vehiclesWaiting / (stats.vehiclesMoving + stats.vehiclesWaiting);
    if (densityRoll > 0.6) stats.density = "HIGH";
    else if (densityRoll > 0.35) stats.density = "MEDIUM";
    else stats.density = "LOW";

    callbacks.onTrafficUpdate?.({
      phase,
      inYellow,
      currentGreenRoads,
      currentRedRoads,
      phaseProgress: inYellow ? yellowElapsed / YELLOW_DURATION : elapsed / PHASE_DURATION,
      stats: { ...stats },
      timeInPhase: inYellow ? yellowElapsed : elapsed,
    });
  }

  function isGreen(road) {
    return !inYellow && currentGreenRoads.includes(road);
  }
  function isRed(road) {
    return !inYellow && currentRedRoads.includes(road);
  }
  function isYellowRoad(road) {
    return inYellow && (currentGreenRoads.includes(road) || currentRedRoads.includes(road));
  }

  return {
    tick,
    isGreen,
    isRed,
    isYellowRoad,
    getPhase: () => phase,
    getStats: () => ({ ...stats }),
  };
}

const SmartCity3D = forwardRef((props, ref) => {
  const { onPanel, onTrafficUpdate, onSimTime, onCycleUpdate, onAiMessage, onAiReason, onTouristMessage, onAITrafficUpdate } = props;
  const mountRef = useRef(null);

  const s = useRef({
    camera: null, controls: null, renderer: null, scene: null,
    isLocked: false, lockedLocation: null, followTarget: null,
    savedCamPos: null, savedCamTarget: null, camTransition: null,
    trucks: {}, people: [], tourists: [], cityCars: [], intersectionCars: [],
    trafficLights: [], intersectionLights: [],
    turbines: [], streetBulbMats: [], batteryRings: [],
    waterParticles: [], clickable: [], borderLights: [],
    controller: null, radar: null, controllerRing: null, controllerRing2: null,
    controllerSig: null, garbageWarn: null, fertWarn1: null, fertWarn2: null,
    grassMaterial: null, roadMaterial: null, roadLaneMaterial: null,
    curbMaterial: null, sidewalkMat: null, ambient: null, sun: null,
    sim: null, roadZs: null, roadXs: null,
    aiSystem: null,
  }).current;

  useImperativeHandle(ref, () => ({
    getLocations: () => Object.values(LOCATIONS),
    goToLocation: (key, onLabel) => goToLocation(key, onLabel),
    goToLocationCamera: (key, camName, onLabel) => goToLocationCamera(key, camName, onLabel),
    exitCameraView: () => exitCameraView(),
    followVehicle: (key, onText) => followVehicle(key, onText),
    goToOverview: () => goToOverview(),
    goToTopDown: () => goToTopDown(),
    setDayNight: (night) => setDayNight(night),
    goToLiveTraffic: () => goToLiveTraffic(),
  }));

  function smoothCameraTo(targetPos, targetLook, duration = 1400) {
    s.camTransition = { startPos: s.camera.position.clone(), targetPos, startLook: s.controls.target.clone(), targetLook, startTime: performance.now(), duration };
  }

  function goToLocation(key, onLabel) {
    const loc = LOCATIONS[key]; if (!loc || !s.camera) return;
    s.isLocked = true; s.lockedLocation = key; s.followTarget = null;
    s.savedCamPos = s.camera.position.clone(); s.savedCamTarget = s.controls.target.clone();
    const [x, y, z] = loc.position;
    smoothCameraTo(new THREE.Vector3(x + loc.camDistance * 0.7, loc.camHeight, z + loc.camDistance * 0.7), new THREE.Vector3(x, y, z));
    s.controls.enableRotate = false; onLabel?.(loc.label);
  }

  function goToLocationCamera(key, camName, onLabel) {
    const loc = LOCATIONS[key]; if (!loc || !s.camera) return;
    const cam = loc.cameras.find((c) => c.name === camName); if (!cam) return;
    s.isLocked = true; s.lockedLocation = key; s.followTarget = null;
    s.savedCamPos = s.camera.position.clone(); s.savedCamTarget = s.controls.target.clone();
    const [x, y, z] = loc.position;
    let camPos, lookAt;
    if (cam.inside) { camPos = new THREE.Vector3(x - 80, y + 60, z - 80); lookAt = new THREE.Vector3(x, y + 25, z); }
    else if (cam.top) { camPos = new THREE.Vector3(x, y + loc.camHeight * 1.8, z + 10); lookAt = new THREE.Vector3(x, y, z); }
    else { camPos = new THREE.Vector3(x + Math.sin(cam.angle) * loc.camDistance, y + loc.camHeight * 0.5, z + Math.cos(cam.angle) * loc.camDistance); lookAt = new THREE.Vector3(x, y, z); }
    smoothCameraTo(camPos, lookAt);
    s.controls.enableRotate = false; onLabel?.(loc.label);
  }

  function exitCameraView() {
    if (!s.camera) return;
    s.isLocked = false; s.lockedLocation = null; s.followTarget = null;
    if (s.savedCamPos && s.savedCamTarget) smoothCameraTo(s.savedCamPos, s.savedCamTarget);
    s.controls.enableRotate = true;
  }

  function followVehicle(key, onText) {
    if (!s.camera) return;
    s.isLocked = false; s.lockedLocation = null;
    if (key === "garbageTruck") s.followTarget = s.trucks.garbage;
    else if (key === "fertTruck1") s.followTarget = s.trucks.fert1;
    else if (key === "fertTruck2") s.followTarget = s.trucks.fert2;
    else s.followTarget = null;
    if (s.followTarget) {
      smoothCameraTo(s.followTarget.position.clone().add(new THREE.Vector3(120, 90, 120)), s.followTarget.position.clone(), 1200);
      onText?.("🎥 FOLLOWING — " + key.toUpperCase());
    } else {
      smoothCameraTo(new THREE.Vector3(0, 2000, 2000), new THREE.Vector3(0, 0, 0), 1500);
      onText?.("🌐 WATCHING CITY CARS");
    }
    s.controls.enableRotate = true;
  }

  function goToOverview() { if (!s.camera) return; s.isLocked = false; s.lockedLocation = null; s.followTarget = null; s.controls.enableRotate = true; smoothCameraTo(new THREE.Vector3(1400, 950, 1400), new THREE.Vector3(0, 5, 0), 1500); }
  function goToTopDown() { if (!s.camera) return; s.isLocked = false; s.lockedLocation = null; s.followTarget = null; s.controls.enableRotate = true; smoothCameraTo(new THREE.Vector3(0, 2800, 500), new THREE.Vector3(0, 0, 0), 1500); }

  function goToLiveTraffic() {
    if (!s.camera) return;
    s.isLocked = false;
    s.lockedLocation = "liveTraffic";
    s.followTarget = null;
    s.savedCamPos = s.camera.position.clone();
    s.savedCamTarget = s.controls.target.clone();
    smoothCameraTo(
      new THREE.Vector3(180, 180, 480),
      new THREE.Vector3(0, 5, 0),
      2000
    );
    s.controls.enableRotate = true;
  }

  function setDayNight(night) {
    if (!s.scene) return;
    const DAY_BG = new THREE.Color(0xa9dcf4);
    const NIGHT_BG = new THREE.Color(0x050810);
    if (night) {
      s.scene.background = NIGHT_BG.clone();
      s.ambient.intensity = 0.35; s.sun.intensity = 0.1;
    } else {
      s.scene.background = DAY_BG.clone();
      s.ambient.intensity = 3.7; s.sun.intensity = 3.5;
    }
    s.grassMaterial.color.setHex(night ? 0x14241a : 0x4d8f50);
    s.roadMaterial.color.setHex(night ? 0x080a0c : 0x20272a);
    s.roadLaneMaterial.color.setHex(night ? 0x060809 : 0x1a2023);
    s.curbMaterial.color.setHex(night ? 0x1e262a : 0x697578);
    s.sidewalkMat.color.setHex(night ? 0x30363a : 0x8a8f94);
    s.streetBulbMats.forEach((m) => { m.emissiveIntensity = night ? 6.0 : 0.9; });
    s.batteryRings.forEach((m) => { m.emissiveIntensity = night ? 5.0 : 1.5; });
    s.borderLights.forEach((m) => { m.emissiveIntensity = night ? 6.5 : 2.8; });
  }

  useEffect(() => {
    const container = mountRef.current; if (!container) return;

    const scene = new THREE.Scene();
    s.scene = scene;
    scene.background = new THREE.Color(0xa9dcf4);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 5, 15000);
    camera.position.set(1400, 950, 1400); s.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement); s.renderer = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.15;
    controls.minDistance = 200; controls.maxDistance = 6000;
    controls.target.set(0, 5, 0); s.controls = controls;

    const ambient = new THREE.HemisphereLight(0xf8fcff, 0x315c38, 3.7);
    scene.add(ambient); s.ambient = ambient;
    const sun = new THREE.DirectionalLight(0xffffff, 3.5);
    sun.position.set(-800, 1400, 500); scene.add(sun); s.sun = sun;

    const mat = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    const grassMaterial = mat(0x4d8f50, 0.98);
    const roadMaterial = mat(0x2a3238, 0.96);
    const roadLaneMaterial = mat(0x1e2428, 0.96);
    const yellowLineMaterial = mat(0xf5c84b, 0.65);
    const whiteLineMaterial = mat(0xffffff, 0.65);
    const curbMaterial = mat(0x697578, 0.88);
    const darkMaterial = mat(0x182327, 0.65, 0.15);
    const blueMaterial = mat(0x087fa8, 0.35, 0.25);
    const sidewalkMat = mat(0x8a8f94, 0.9);
    s.grassMaterial = grassMaterial; s.roadMaterial = roadMaterial;
    s.roadLaneMaterial = roadLaneMaterial; s.curbMaterial = curbMaterial;
    s.sidewalkMat = sidewalkMat;

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE), grassMaterial);
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    const cityBoundMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 2.5, metalness: 0.7, roughness: 0.2 });
    s.borderLights.push(cityBoundMat);
    const boundThick = 20, boundY = 6;
    const boundFront = new THREE.Mesh(new THREE.BoxGeometry(CITY_HALF * 2 + boundThick, 2, boundThick), cityBoundMat);
    boundFront.position.set(0, boundY, CITY_HALF); scene.add(boundFront);
    const boundBack = boundFront.clone(); boundBack.position.z = -CITY_HALF; scene.add(boundBack);
    const boundLeft = new THREE.Mesh(new THREE.BoxGeometry(boundThick, 2, CITY_HALF * 2 + boundThick), cityBoundMat);
    boundLeft.position.set(-CITY_HALF, boundY, 0); scene.add(boundLeft);
    const boundRight = boundLeft.clone(); boundRight.position.x = CITY_HALF; scene.add(boundRight);

    for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
      const cx = dx * CITY_HALF, cz = dz * CITY_HALF;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(6, 8, 30, 12), cityBoundMat);
      p.position.set(cx, 20, cz); scene.add(p);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x22cfff, emissiveIntensity: 4 }));
      s.borderLights.push(cap.material);
      cap.position.set(cx, 37, cz); scene.add(cap);
    }

    const ROAD_W = 110, ROAD_HALF = ROAD_W / 2;
    const ROAD_LEN = ROAD_HALF_LEN * 2;
    const roadZs = [-2400, -1200, 0, 1200, 2400];
    const roadXs = [-2400, -1200, 0, 1200, 2400];
    s.roadZs = roadZs;
    s.roadXs = roadXs;

    function makeRoadE(x, z, length) {
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(length, 0.25, ROAD_W + 20), roadLaneMaterial);
      shoulder.position.set(x, 4.55, z); scene.add(shoulder);
      const r = new THREE.Mesh(new THREE.BoxGeometry(length, 0.45, ROAD_W), roadMaterial);
      r.position.set(x, 4.7, z); scene.add(r);
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(length, 0.1, 2), yellowLineMaterial);
      c1.position.set(x, 5, z - 2.5); scene.add(c1);
      const c2 = c1.clone(); c2.position.z = z + 2.5; scene.add(c2);
      const topLine = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 1.5), whiteLineMaterial);
      topLine.position.set(x, 5.05, z + ROAD_HALF - 6); scene.add(topLine);
      const botLine = topLine.clone(); botLine.position.z = z - ROAD_HALF + 6; scene.add(botLine);
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
      const leftLine = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, length), whiteLineMaterial);
      leftLine.position.set(x - ROAD_HALF + 6, 5.05, z); scene.add(leftLine);
      const rightLine = leftLine.clone(); rightLine.position.x = x + ROAD_HALF - 6; scene.add(rightLine);
      for (let lz = z - length / 2 + 30; lz < z + length / 2 - 20; lz += 70) {
        const d1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.09, 30), whiteLineMaterial);
        d1.position.set(x + 30, 5.06, lz); scene.add(d1);
        const d2 = d1.clone(); d2.position.x = x - 30; scene.add(d2);
      }
    }

    roadZs.forEach((z) => makeRoadE(0, z, ROAD_LEN));
    roadXs.forEach((x) => makeRoadN(x, 0, ROAD_LEN));

    roadZs.forEach((z) => {
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LEN, 0.3, 10), sidewalkMat);
      s1.position.set(0, 5.05, z + ROAD_HALF + 10); scene.add(s1);
      const s2 = s1.clone(); s2.position.z = z - ROAD_HALF - 10; scene.add(s2);
    });
    roadXs.forEach((x) => {
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, ROAD_LEN), sidewalkMat);
      s1.position.set(x + ROAD_HALF + 10, 5.05, 0); scene.add(s1);
      const s2 = s1.clone(); s2.position.x = x - ROAD_HALF - 10; scene.add(s2);
    });

    function buildingBorder(x, z, w, d, color = 0x22cfff) {
      const bMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.8, metalness: 0.7, roughness: 0.2 });
      s.borderLights.push(bMat);
      const front = new THREE.Mesh(new THREE.BoxGeometry(w + 20, 2.5, 6), bMat);
      front.position.set(x, 6.5, z + d / 2 + 10); scene.add(front);
      const back = front.clone(); back.position.z = z - d / 2 - 10; scene.add(back);
      const left = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, d + 20), bMat);
      left.position.set(x - w / 2 - 10, 6.5, z); scene.add(left);
      const right = left.clone(); right.position.x = x + w / 2 + 10; scene.add(right);
      for (const cx of [-1, 1]) for (const cz of [-1, 1]) {
        const px = x + cx * (w / 2 + 10), pz = z + cz * (d / 2 + 10);
        const p = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.5, 22, 10), bMat);
        p.position.set(px, 16, pz); scene.add(p);
        const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 4 });
        s.borderLights.push(capMat);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 10), capMat);
        cap.position.set(px, 30, pz); scene.add(cap);
      }
      const accentColors = [0xff6b6b, 0xffdd57, 0x6aff9d, 0x22cfff, 0xff66dd, 0xffa500];
      for (let i = 0; i < 4; i++) {
        const accentColor = accentColors[Math.floor(Math.random() * accentColors.length)];
        const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 3.5 });
        s.borderLights.push(accentMat);
        const side = Math.floor(Math.random() * 4);
        let ax, az;
        if (side === 0) { ax = x + (Math.random() - 0.5) * w; az = z + d / 2 + 14; }
        else if (side === 1) { ax = x + (Math.random() - 0.5) * w; az = z - d / 2 - 14; }
        else if (side === 2) { ax = x - w / 2 - 14; az = z + (Math.random() - 0.5) * d; }
        else { ax = x + w / 2 + 14; az = z + (Math.random() - 0.5) * d; }
        const accent = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), accentMat);
        accent.position.set(ax, 8 + Math.random() * 4, az); scene.add(accent);
      }
    }

    function board(text, x, y, z, w = 80, h = 12, color) {
      const g = new THREE.Group(); g.position.set(x, y, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 14, 6), darkMaterial);
      pole.position.y = 7; g.add(pole);
      const bMat = color ? mat(color, 0.35, 0.25) : blueMaterial;
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

    const streetBulbMats = []; s.streetBulbMats = streetBulbMats;
    function sl(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 11, 5), darkMaterial);
      pole.position.y = 5.5; g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.22, 0.22), darkMaterial);
      arm.position.set(1.5, 10, 0); g.add(arm);
      const bMat = new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffd36a, emissiveIntensity: 0.9 });
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), bMat);
      b.position.set(3, 9.8, 0); g.add(b);
      scene.add(g); streetBulbMats.push(bMat);
    }
    roadZs.forEach((z) => {
      for (let x = -ROAD_HALF_LEN + 100; x <= ROAD_HALF_LEN - 100; x += 400) {
        sl(x, z + ROAD_HALF + 18); sl(x, z - ROAD_HALF - 18);
      }
    });

    const trafficLights = []; s.trafficLights = trafficLights;
    function tl(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 9, 5), darkMaterial);
      pole.position.y = 4.5; g.add(pole);
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5, 1.4), darkMaterial);
      box.position.y = 7.5; g.add(box);
      const light = (color, y) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0 }));
        m.position.set(0, y, 0.75); g.add(m); return m;
      };
      const r = light(0xff2222, 8.8);
      const yL = light(0xffcc22, 7.5);
      const gr = light(0x22ff66, 6.2);
      scene.add(g);
      trafficLights.push({ r, y: yL, gr, phase: Math.random() * 10 });
    }
    roadXs.forEach((x) => roadZs.forEach((z) => tl(x, z)));

    const intersectionLights = []; s.intersectionLights = intersectionLights;
    const INTERSECTION_LIGHT_OFFSET = 70;
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

    makeIntersectionLight(-INTERSECTION_LIGHT_OFFSET, -INTERSECTION_LIGHT_OFFSET, 1);
    makeIntersectionLight(INTERSECTION_LIGHT_OFFSET, INTERSECTION_LIGHT_OFFSET, 2);
    makeIntersectionLight(INTERSECTION_LIGHT_OFFSET, -INTERSECTION_LIGHT_OFFSET, 3);
    makeIntersectionLight(-INTERSECTION_LIGHT_OFFSET, INTERSECTION_LIGHT_OFFSET, 4);

    const controller = new THREE.Group(); s.controller = controller;
    controller.position.set(0, 5, 0);
    const controllerBase = new THREE.Mesh(new THREE.CylinderGeometry(55, 62, 3, 24), mat(0x142f3b, 0.28, 0.4));
    controllerBase.position.y = 1.5; controller.add(controllerBase);
    const controllerRing = new THREE.Mesh(new THREE.TorusGeometry(53, 1.2, 8, 36), new THREE.MeshStandardMaterial({ color: 0x32dfff, emissive: 0x18cfff, emissiveIntensity: 2.2 }));
    controllerRing.rotation.x = Math.PI / 2; controllerRing.position.y = 3.2; controller.add(controllerRing); s.controllerRing = controllerRing;
    const controllerRing2 = new THREE.Mesh(new THREE.TorusGeometry(44, 0.8, 8, 36), new THREE.MeshStandardMaterial({ color: 0x22bfff, emissive: 0x0a9fdf, emissiveIntensity: 1.8 }));
    controllerRing2.rotation.x = Math.PI / 2; controllerRing2.position.y = 5; controller.add(controllerRing2); s.controllerRing2 = controllerRing2;
    const controllerTower = new THREE.Mesh(new THREE.BoxGeometry(22, 40, 22), mat(0x185a72, 0.25, 0.35));
    controllerTower.position.y = 22; controller.add(controllerTower);
    const controllerUpper = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 18), new THREE.MeshStandardMaterial({ color: 0x0a3345, emissive: 0x1a7a9a, emissiveIntensity: 1.8 }));
    controllerUpper.position.y = 44; controller.add(controllerUpper);
    [{ x: 0, y: 22, z: 12, ry: 0 }, { x: 0, y: 22, z: -12, ry: Math.PI }, { x: 12, y: 22, z: 0, ry: Math.PI / 2 }, { x: -12, y: 22, z: 0, ry: -Math.PI / 2 }].forEach((sp) => {
      const m = new THREE.MeshStandardMaterial({ color: 0x03141b, emissive: 0x21cfff, emissiveIntensity: 2.6 });
      const sMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 7.5, 0.4), m);
      sMesh.position.set(sp.x, sp.y, sp.z); sMesh.rotation.y = sp.ry; controller.add(sMesh);
    });
    const radar = new THREE.Mesh(new THREE.TorusGeometry(8, 0.5, 8, 32), new THREE.MeshStandardMaterial({ color: 0x61e7ff, emissive: 0x23dfff, emissiveIntensity: 2.5 }));
    radar.rotation.x = Math.PI / 2; radar.position.y = 53; controller.add(radar); s.radar = radar;
    const controllerSig = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0x66e5ff, emissive: 0x33dfff, emissiveIntensity: 3.5 }));
    controllerSig.position.y = 68; controller.add(controllerSig); s.controllerSig = controllerSig;
    scene.add(controller);

    const loader = new GLTFLoader(); const clickable = []; s.clickable = clickable;

    function removeGroundFromGLB(model) {
      const toRemove = [];
      model.traverse((child) => {
        if (child.isMesh) {
          const name = (child.name || "").toLowerCase();
          if (name.includes("ground") || name.includes("floor") || name.includes("plane") ||
              name.includes("terrain") || name.includes("grass") || name === "base" || name.includes("_base")) {
            toRemove.push(child);
          }
        }
      });
      toRemove.forEach((m) => m.parent && m.parent.remove(m));
    }

    function prep(obj, size, stripGround = true) {
      if (stripGround) removeGroundFromGLB(obj);
      const box = new THREE.Box3().setFromObject(obj);
      const sz = new THREE.Vector3(); box.getSize(sz);
      const maxD = Math.max(sz.x, sz.y, sz.z);
      obj.scale.setScalar(size / Math.max(maxD, 0.001));
      const b2 = new THREE.Box3().setFromObject(obj);
      const c = new THREE.Vector3(); b2.getCenter(c);
      obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= b2.min.y;
    }

    function bld(file, size, pos, type, name, borderColor, stripGround = true) {
      const url = file.startsWith("/") ? file : "/" + file;
      loader.load(
        url,
        (g) => {
          const b = g.scene;
          prep(b, size, stripGround);
          b.position.set(pos[0], 5, pos[1]);
          scene.add(b);
          clickable.push({ object: b, type, name: name || type });
          buildingBorder(pos[0], pos[1], size * 1.4, size * 1.4, borderColor || 0x22cfff);
        },
        undefined,
        (err) => console.warn("GLB load failed:", url, err)
      );
    }

    const treeTrunkMat = mat(0x5a3d24, 0.95, 0.05);
    const treeLeafMat = mat(0x2d6e3d, 0.9);
    const treeLeafMat2 = mat(0x3a8a4c, 0.9);
    const treeLeafMat3 = mat(0x1f5a2e, 0.9);
    const treeLeafMat4 = mat(0x4a9d5a, 0.9);
    const treeTrunkGeo = new THREE.CylinderGeometry(2.2, 3.5, 28, 7);
    const treeLeafCone = new THREE.ConeGeometry(18, 42, 8);
    const treeLeafConeSmall = new THREE.ConeGeometry(14, 32, 7);
    const treeLeafSphereBig = new THREE.SphereGeometry(18, 10, 9);

    function tree(x, z, sc = 1) {
      const g = new THREE.Group(); g.position.set(x, 5, z); g.scale.setScalar(sc);
      const t = new THREE.Mesh(treeTrunkGeo, treeTrunkMat); t.position.y = 14; g.add(t);
      const roll = Math.random();
      if (roll < 0.5) {
        const l = new THREE.Mesh(treeLeafCone, treeLeafMat); l.position.y = 38; g.add(l);
        const l2 = new THREE.Mesh(treeLeafConeSmall, treeLeafMat2); l2.position.y = 52; l2.scale.setScalar(0.75); g.add(l2);
      } else {
        const l = new THREE.Mesh(treeLeafSphereBig, treeLeafMat4); l.position.y = 40; l.scale.set(1.2, 1.1, 1.2); g.add(l);
        const l2 = new THREE.Mesh(treeLeafConeSmall, treeLeafMat3); l2.position.y = 55; l2.scale.setScalar(0.6); g.add(l2);
      }
      scene.add(g);
    }

    function bush(x, z, sc = 1) {
      const g = new THREE.Group(); g.position.set(x, 5, z); g.scale.setScalar(sc);
      const colors = [0x2d6e3d, 0x3a8a4c, 0x1f5a2e, 0x4a9d5a];
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(4 + Math.random() * 3, 6, 5),
          mat(colors[Math.floor(Math.random() * colors.length)], 0.95));
        b.position.set((Math.random() - 0.5) * 6, 4 + Math.random() * 2, (Math.random() - 0.5) * 6);
        g.add(b);
      }
      scene.add(g);
    }

    function isOnRoad(x, z) {
      const clear = 130;
      for (const rz of roadZs) if (Math.abs(z - rz) < clear) return true;
      for (const rx of roadXs) if (Math.abs(x - rx) < clear) return true;
      return false;
    }
    function isInsideCity(x, z) {
      return Math.abs(x) < CITY_HALF - 100 && Math.abs(z) < CITY_HALF - 100;
    }

    const occupiedSpots = [
      { x: -600, z: -600, r: 260 }, { x: 600, z: -600, r: 250 },
      { x: 600, z: 600, r: 300 },
      { x: 1800, z: -600, r: 400 }, { x: 600, z: 1800, r: 290 },
      { x: 1800, z: 1750, r: 320 }, { x: 1800, z: 600, r: 290 },
      { x: 0, z: 0, r: 130 },
      { x: -3600, z: 3600, r: 900 }, { x: 3600, z: -3600, r: 600 },
      { x: -3600, z: -3600, r: 600 }, { x: 3600, z: 3600, r: 600 },
      { x: -1800, z: 1800, r: 400 },
      { x: -600, z: 600, r: 500 },
      { x: 750, z: 750, r: 200 }, { x: 1000, z: 400, r: 220 },
      { x: -1600, z: 800, r: 260 },
      { x: -3600, z: -2400, r: 350 }, { x: -3600, z: -800, r: 400 },
      { x: -3600, z: 800, r: 350 }, { x: -3600, z: 2400, r: 400 },
      { x: 900, z: 1400, r: 250 },
    ];
    function isOnBuilding(x, z) {
      for (const o of occupiedSpots) {
        const dx = x - o.x, dz = z - o.z;
        if (dx * dx + dz * dz < o.r * o.r) return true;
      }
      return false;
    }
    function isFree(x, z) {
      return isInsideCity(x, z) && !isOnRoad(x, z) && !isOnBuilding(x, z);
    }

    const TOWER_COLORS = [
      0x5b9bd5, 0x4a90e2, 0x7bb3e0, 0x6ba3d9, 0x82c0e8, 0x5090d0,
      0xc0629b, 0xd475a8, 0xb84f8a, 0xe087b6, 0xf5a623, 0xf7b955,
      0xe89b3e, 0xffc866, 0x6cd4a0, 0x4ec39a, 0x8adbb8, 0x5bc08a,
      0x9b7ad9, 0xaa8ae0, 0x8a66c9, 0xbaa0e8, 0xe8635c, 0xd94f4a,
      0xf0776b, 0x4a4a5c, 0x5a5a6e, 0x3d3d4e, 0x6a6a7e, 0xdde0e3,
      0xc8ccd0, 0xb0b5bb, 0x22a5b8, 0x2bb8c9, 0x40c9d9,
    ];

    function tallTower(x, z, w, h, d, color) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const bMat = mat(color, 0.4, 0.55);
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bMat);
      body.position.y = h / 2; g.add(body);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 6, d * 0.95), mat(0x2a2a35, 0.5, 0.6));
      cap.position.y = h + 3; g.add(cap);
      if (Math.random() > 0.4) {
        const antH = 30 + Math.random() * 40;
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, antH, 6), mat(0x9a9a9a, 0.4, 0.8));
        ant.position.y = h + 6 + antH / 2; g.add(ant);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 4 }));
        beacon.position.y = h + 6 + antH; g.add(beacon);
      }
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, emissive: 0x66ccff, emissiveIntensity: 0.5, metalness: 0.6, roughness: 0.2 });
      const floorLines = 4;
      for (let f = 1; f <= floorLines; f++) {
        const fy = (h / (floorLines + 1)) * f;
        const line = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.6, d + 0.5), glassMat);
        line.position.y = fy; g.add(line);
      }
      const lightColor = [0xff6666, 0x66ff99, 0x66aaff, 0xffdd66][Math.floor(Math.random() * 4)];
      const spot = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), new THREE.MeshStandardMaterial({ color: lightColor, emissive: lightColor, emissiveIntensity: 3 }));
      spot.position.y = h + 8; g.add(spot);
      scene.add(g);
    }

    const solarPanelMat = new THREE.MeshStandardMaterial({ color: 0x082c4b, roughness: 0.18, metalness: 0.7, emissive: 0x063b62, emissiveIntensity: 0.7 });
    const solarFrameMat = mat(0x2a2a35, 0.5, 0.6);

    function solarPanelUnit(x, z, rotY = 0) {
      const g = new THREE.Group(); g.position.set(x, 5, z); g.rotation.y = rotY;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(28, 2, 20), solarFrameMat); frame.position.y = 3; g.add(frame);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(26, 0.6, 18), solarPanelMat); panel.position.y = 4.2; panel.rotation.x = -0.2; g.add(panel);
      const legGeo = new THREE.CylinderGeometry(0.6, 0.6, 3, 6);
      const legMat = mat(0x555a5e, 0.5, 0.7);
      for (const lx of [-10, 10]) for (const lz of [-7, 7]) {
        const leg = new THREE.Mesh(legGeo, legMat); leg.position.set(lx, 1.5, lz); g.add(leg);
      }
      scene.add(g);
    }

    function buildSociety(centerX, centerZ) {
      const SOCIETY_W = 850, SOCIETY_D = 850;
      const HALF_W = SOCIETY_W / 2, HALF_D = SOCIETY_D / 2;
      const SOCIETY_GREEN = 0x2ecc71;
      const societyBorderMat = new THREE.MeshStandardMaterial({ color: SOCIETY_GREEN, emissive: SOCIETY_GREEN, emissiveIntensity: 2.4, metalness: 0.6, roughness: 0.25 });
      s.borderLights.push(societyBorderMat);

      const innerGround = new THREE.Mesh(new THREE.BoxGeometry(SOCIETY_W - 30, 0.6, SOCIETY_D - 30), mat(0xb8bcc0, 0.92));
      innerGround.position.set(centerX, 4.85, centerZ); scene.add(innerGround);
      const grassPad = new THREE.Mesh(new THREE.BoxGeometry(SOCIETY_W + 50, 0.4, SOCIETY_D + 50), grassMaterial);
      grassPad.position.set(centerX, 4.6, centerZ); scene.add(grassPad);

      const WALL_H = 14, WALL_T = 6;
      const wallF = new THREE.Mesh(new THREE.BoxGeometry(SOCIETY_W + 12, WALL_H, WALL_T), societyBorderMat);
      wallF.position.set(centerX, 5 + WALL_H / 2, centerZ + HALF_D + 6); scene.add(wallF);
      const wallB = wallF.clone(); wallB.position.z = centerZ - HALF_D - 6; scene.add(wallB);
      const wallL = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, WALL_H, SOCIETY_D + 12), societyBorderMat);
      wallL.position.set(centerX - HALF_W - 6, 5 + WALL_H / 2, centerZ); scene.add(wallL);
      const wallR = wallL.clone(); wallR.position.x = centerX + HALF_W + 6; scene.add(wallR);

      for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
        const cx = centerX + dx * (HALF_W + 6), cz = centerZ + dz * (HALF_D + 6);
        const p = new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 40, 12), societyBorderMat);
        p.position.set(cx, 25, cz); scene.add(p);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: SOCIETY_GREEN, emissiveIntensity: 3.5 }));
        cap.position.set(cx, 48, cz); scene.add(cap);
      }

      const gateLeft = new THREE.Mesh(new THREE.BoxGeometry(10, 30, 12), societyBorderMat);
      gateLeft.position.set(centerX - 50, 20, centerZ + HALF_D + 6); scene.add(gateLeft);
      const gateRight = gateLeft.clone(); gateRight.position.x = centerX + 50; scene.add(gateRight);
      const gateTop = new THREE.Mesh(new THREE.BoxGeometry(120, 8, 12), societyBorderMat);
      gateTop.position.set(centerX, 34, centerZ + HALF_D + 6); scene.add(gateTop);

      const towerRows = 4, towerCols = 3, innerMargin = 100;
      const usableW = SOCIETY_W - innerMargin * 2, usableD = SOCIETY_D - innerMargin * 2;
      for (let r = 0; r < towerRows; r++) {
        for (let c = 0; c < towerCols; c++) {
          const tx = centerX - usableW / 2 + (c + 0.5) * (usableW / towerCols);
          const tz = centerZ - usableD / 2 + (r + 0.5) * (usableD / towerRows);
          const w = 28 + Math.random() * 14, d = 28 + Math.random() * 14, h = 180 + Math.random() * 180;
          tallTower(tx, tz, w, h, d, TOWER_COLORS[Math.floor(Math.random() * TOWER_COLORS.length)]);
        }
      }

      for (let i = 0; i < 6; i++) solarPanelUnit(centerX - 250 + i * 100, centerZ + HALF_D - 60, 0);
      for (let i = 0; i < 6; i++) solarPanelUnit(centerX - 250 + i * 100, centerZ - HALF_D + 60, Math.PI);
      board("BSS SMART SOCIETY", centerX, 5, centerZ + HALF_D + 100, 280, 18, SOCIETY_GREEN);
    }

    const SOCIETY_X = -600, SOCIETY_Z = 600;
    buildSociety(SOCIETY_X, SOCIETY_Z);
    const societyGroup = new THREE.Group();
    societyGroup.position.set(SOCIETY_X, 0, SOCIETY_Z);
    clickable.push({ object: societyGroup, type: "society", name: "BSS Smart Society" });

    bld("/american_high_school.glb", 300, [-600, -600], "school", "American High School", 0x1a5490);
    bld("/low_poly_hospital.glb", 280, [600, -600], "hospital", "Smart Hospital", 0xc0392b);
    bld("/us_bank_tower.glb", 360, [600, 600], "bank", "State Bank", 0x8e44ad);
    bld("/simple_farm_free.glb", 520, [1800, -600], "farm", "Smart Eco Farm", 0x27ae60);
    bld("/liverpool_street_station_south_entrance.glb", 420, [600, 1800], "newHall", "Liverpool Event Hall", 0xd4a017);
    bld("/gas_station.glb", 380, [1800, 1750], "gasStation", "Gas Station · Car Wash", 0xc0392b);
    bld("/office.glb", 380, [1800, 600], "sewageCompany", "Sewage & Gas Co.", 0x2ecc71);
    bld("/brutalist_building.glb", 300, [2200, 600], "sewageCompanyOld", "Old Office Building", 0x34495e);
    bld("/national_archives_research_center.glb", 480, [-1800, 1800], "cultureCenter", "Culture Center", 0xf39c12);
    bld("/nearbank.glb", 240, [750, 750], "nearBank", "Near Bank Building", 0xf39c12);
    bld("/commercial_building_concept.glb", 340, [1000, 400], "commercial", "Commercial Building", 0x3498db);
    bld("/power-suply-companey.glb", 380, [-1600, 800], "powerCompany", "City Power Supply Co.", 0xf1c40f);
    bld("/sci-fi_building_9.glb", 440, [-3600, -2400], "scifi9", "Sci-Fi Building 9", 0x66ff99);
    bld("/beautifultowerbuilding.glb", 520, [-3600, -800], "beautifulTower", "Beautiful Tower", 0x22cfff);
    bld("/sci-fi_building_10.glb", 440, [-3600, 800], "scifi10", "Sci-Fi Building 10", 0xff66dd);
    bld("/twobuildingsneedspace.glb", 560, [-3600, 2400], "twinTowers", "Twin Sci-Fi Towers", 0xaa8ae0);

    const wcGroup = new THREE.Group();
    wcGroup.position.set(900, 5, 1400); scene.add(wcGroup);
    const wcPad = new THREE.Mesh(new THREE.BoxGeometry(280, 0.8, 280), mat(0x2a3a2e, 0.95));
    wcPad.position.y = 0.4; wcGroup.add(wcPad);
    const wcBorderMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 2.5, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(wcBorderMat);
    const wcF = new THREE.Mesh(new THREE.BoxGeometry(280, 1.5, 4), wcBorderMat); wcF.position.set(0, 1, 140); wcGroup.add(wcF);
    const wcB = wcF.clone(); wcB.position.z = -140; wcGroup.add(wcB);
    const wcL = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 280), wcBorderMat); wcL.position.set(-140, 1, 0); wcGroup.add(wcL);
    const wcR = wcL.clone(); wcR.position.x = 140; wcGroup.add(wcR);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const bin = new THREE.Group();
      bin.position.set(-80 + c * 80, 0, -80 + r * 80);
      const body = new THREE.Mesh(new THREE.BoxGeometry(40, 26, 40), mat(0x2ecc71, 0.5, 0.5));
      body.position.y = 13; bin.add(body);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(42, 2, 42), mat(0x1a1a1a, 0.6, 0.3));
      lid.position.y = 27; bin.add(lid);
      wcGroup.add(bin);
    }
    board("WASTE COLLECTOR", 900, 5, 1600, 260, 16, 0x2ecc71);
    clickable.push({ object: wcGroup, type: "wasteCollector", name: "Waste Collector Point" });

    board("AMERICAN HIGH SCHOOL", -600, 5, -950, 200, 14, 0x1a5490);
    board("BSS SMART HOSPITAL", 600, 5, -950, 200, 14, 0xc0392b);
    board("SMART CITY STATE BANK", 600, 5, 950, 200, 14, 0x8e44ad);
    board("NEAR BANK", 750, 5, 1050, 220, 14, 0xf39c12);
    board("COMMERCIAL BUILDING", 1000, 5, 100, 260, 16, 0x3498db);
    board("SMART ECO FARM", 1800, 5, -950, 200, 14, 0x27ae60);
    board("LIVERPOOL EVENT HALL", 600, 5, 2250, 280, 16, 0xd4a017);
    board("CAR WASH · GAS STATION", 1800, 5, 2200, 220, 16, 0xc0392b);
    board("SEWAGE & GAS CO.", 1800, 5, 300, 240, 16, 0x2ecc71);
    board("CULTURE CENTER", -1800, 5, 2400, 260, 18, 0xf39c12);
    board("CITY POWER SUPPLY CO.", -1600, 5, 400, 300, 16, 0xf1c40f);
    board("AI TRAFFIC CONTROLLER", 0, 5, 300, 190, 14);
    board("SCI-FI BUILDING 9", -3600, 5, -2400 + 320, 260, 16, 0x66ff99);
    board("BEAUTIFUL TOWER", -3600, 5, -800 + 320, 260, 16, 0x22cfff);
    board("SCI-FI BUILDING 10", -3600, 5, 800 + 320, 260, 16, 0xff66dd);
    board("TWIN SCI-FI TOWERS", -3600, 5, 2400 + 320, 280, 16, 0xaa8ae0);

    function shop(x, z, scale = 1.4, name) {
      loader.load("/dagashiya_shop_japanese_old_snack_shop.glb", (g) => {
        const sm = g.scene; prep(sm, 50 * scale); sm.position.set(x, 5, z); scene.add(sm);
        clickable.push({ object: sm, type: "shop", name: name || "Dagashiya Snack Shop" });
      }, undefined, () => {});
    }
    shop(-1000, -600, 1.4, "School Canteen");
    shop(1000, -600, 1.4, "Hospital Canteen");
    shop(1000, 600, 1.4, "Bank Shop");

    const powerZone = new THREE.Group();
    powerZone.position.set(-3600, 0, 3600); scene.add(powerZone);
    board("POWER SUPPLY (SMART-CITY)", -3600, 5, 4500, 420, 20, 0x0a4d5c);
    const powerPad = new THREE.Mesh(new THREE.BoxGeometry(1600, 1, 1300), mat(0x1d3a2e, 0.92));
    powerPad.position.y = 4.2; powerZone.add(powerPad);
    const powerBorderMat = new THREE.MeshStandardMaterial({ color: 0x00e0ff, emissive: 0x00cfff, emissiveIntensity: 2.2, metalness: 0.7, roughness: 0.2 });
    s.borderLights.push(powerBorderMat);
    const pbF = new THREE.Mesh(new THREE.BoxGeometry(1600, 1.6, 5), powerBorderMat); pbF.position.set(0, 6.5, -650); powerZone.add(pbF);
    const pbB = pbF.clone(); pbB.position.z = 650; powerZone.add(pbB);
    const pbL = new THREE.Mesh(new THREE.BoxGeometry(5, 1.6, 1300), powerBorderMat); pbL.position.set(-800, 6.5, 0); powerZone.add(pbL);
    const pbR = pbL.clone(); pbR.position.x = 800; powerZone.add(pbR);

    loader.load("/old_antenna.glb", (g) => { const a = g.scene; prep(a, 360); a.position.set(-550, 5, 0); powerZone.add(a); clickable.push({ object: a, type: "antenna", name: "Old Antenna" }); }, undefined, () => {});
    loader.load("/antena.glb", (g) => { const a = g.scene; prep(a, 270); a.position.set(-280, 5, -100); powerZone.add(a); clickable.push({ object: a, type: "antenna", name: "Antenna 1" }); }, undefined, () => {});
    loader.load("/antena.glb", (g) => { const a = g.scene; prep(a, 230); a.position.set(-720, 5, 100); powerZone.add(a); clickable.push({ object: a, type: "antenna", name: "Antenna 2" }); }, undefined, () => {});

    const turbines = []; s.turbines = turbines;
    const turbTowerMat = mat(0xeeeeee, 0.4, 0.3);
    const turbTowerGeo = new THREE.CylinderGeometry(0.85, 1.4, 68, 6);
    const turbBladeGeo = new THREE.BoxGeometry(2, 27, 0.85);
    function turbine(x, z, sc = 1) {
      const g = new THREE.Group(); g.position.set(x, 5, z); g.scale.setScalar(sc);
      const t = new THREE.Mesh(turbTowerGeo, turbTowerMat); t.position.y = 34; g.add(t);
      const blades = new THREE.Group(); blades.position.y = 68;
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(turbBladeGeo, turbTowerMat);
        b.position.y = 12.5; b.rotation.z = i * Math.PI * 2 / 3; blades.add(b);
      }
      g.add(blades); powerZone.add(g); turbines.push(blades);
    }
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++)
      turbine(-650 + col * 200, -600 + row * 220, 1 + (row % 3) * 0.08);

    const solarPark = new THREE.Group();
    solarPark.position.set(500, 0, 0); powerZone.add(solarPark);
    const solarGround = new THREE.Mesh(new THREE.BoxGeometry(650, 0.8, 1250), mat(0x2a4536, 0.92));
    solarGround.position.y = 5; solarPark.add(solarGround);
    const solarPanelGeo = new THREE.BoxGeometry(1, 1, 1);
    function solarArray(x, z, w, d, rows, cols) {
      const g = new THREE.Group(); g.position.set(x, 8, z); g.rotation.x = -0.22;
      const pw = w / cols - 3, pd = d / rows - 3;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const p = new THREE.Mesh(solarPanelGeo, solarPanelMat);
        p.scale.set(pw, 0.5, pd);
        p.position.set((c - (cols - 1) / 2) * (w / cols), 0, (r - (rows - 1) / 2) * (d / rows));
        g.add(p);
      }
      solarPark.add(g);
    }
    for (let i = 0; i < 5; i++) { solarArray(-160, -480 + i * 220, 280, 180, 2, 4); solarArray(160, -480 + i * 220, 280, 180, 2, 4); }
    const solarControl = new THREE.Mesh(new THREE.BoxGeometry(36, 58, 28), mat(0x15536a, 0.25, 0.35));
    solarControl.position.set(0, 38, 0); solarPark.add(solarControl);
    const solarScreen = new THREE.Mesh(new THREE.BoxGeometry(22, 13, 0.6), new THREE.MeshStandardMaterial({ color: 0x04151d, emissive: 0x20d9ff, emissiveIntensity: 2.6 }));
    solarScreen.position.set(0, 42, -14.4); solarPark.add(solarScreen);

    const batteryRings = []; s.batteryRings = batteryRings;
    const batteryPositions = [[-500, 850], [-370, 850], [-240, 850], [-110, 850], [20, 850], [-500, 980], [-370, 980], [-240, 980], [-110, 980], [20, 980]];
    batteryPositions.forEach((pos, i) => {
      loader.load("/battery.glb", (g) => {
        const b = g.scene; prep(b, 60); b.position.set(pos[0], 6, pos[1]); b.rotation.y = Math.PI / 2;
        powerZone.add(b);
        const rMat = new THREE.MeshStandardMaterial({ color: 0x22ff9d, emissive: 0x22ff9d, emissiveIntensity: 1.5 });
        const r = new THREE.Mesh(new THREE.TorusGeometry(28, 0.8, 6, 16), rMat);
        r.rotation.x = Math.PI / 2; r.position.set(pos[0], 7, pos[1]); powerZone.add(r);
        batteryRings.push(rMat);
        clickable.push({ object: b, type: "battery", name: "Battery " + (i + 1) });
      }, undefined, () => {});
    });

    const filtZone = new THREE.Group();
    filtZone.position.set(3600, 0, -3600); scene.add(filtZone);
    board("FILTRATION SYSTEM", 3600, 5, -2700, 380, 18, 0x22cfff);
    const filtPad = new THREE.Mesh(new THREE.BoxGeometry(950, 1, 950), mat(0x1a2836, 0.95));
    filtPad.position.y = 4.2; filtZone.add(filtPad);
    const filtBorderMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 2.5, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(filtBorderMat);
    const fzF = new THREE.Mesh(new THREE.BoxGeometry(950, 1.8, 6), filtBorderMat); fzF.position.set(0, 6.5, -475); filtZone.add(fzF);
    const fzB = fzF.clone(); fzB.position.z = 475; filtZone.add(fzB);
    const fzL = new THREE.Mesh(new THREE.BoxGeometry(6, 1.8, 950), filtBorderMat); fzL.position.set(-475, 6.5, 0); filtZone.add(fzL);
    const fzR = fzL.clone(); fzR.position.x = 475; filtZone.add(fzR);

    const filtBoxGroup = new THREE.Group(); filtBoxGroup.position.set(0, 5, 0); filtZone.add(filtBoxGroup);
    const filtBase = new THREE.Mesh(new THREE.BoxGeometry(220, 4, 220), mat(0x2c3e50, 0.7, 0.3));
    filtBase.position.y = 2; filtBoxGroup.add(filtBase);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 0.5, metalness: 0.3, roughness: 0.15, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(220, 110, 3), glassMat); wallFront.position.set(0, 57, 110); filtBoxGroup.add(wallFront);
    const wallBack = wallFront.clone(); wallBack.position.z = -110; filtBoxGroup.add(wallBack);
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(3, 110, 220), glassMat); wallLeft.position.set(-110, 57, 0); filtBoxGroup.add(wallLeft);
    const wallRight = wallLeft.clone(); wallRight.position.x = 110; filtBoxGroup.add(wallRight);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x22cfff, emissiveIntensity: 0.3, metalness: 0.6, roughness: 0.25, transparent: true, opacity: 0.75 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(230, 3, 230), roofMat); roof.position.y = 114; filtBoxGroup.add(roof);

    loader.load("/skid_filtration_system.glb", (g) => {
      const m = g.scene; prep(m, 160); m.position.set(0, 6, 0); filtBoxGroup.add(m);
      clickable.push({ object: m, type: "filtrationMachine", name: "Filtration Machine" });
    }, undefined, () => {});

    const waterParticles = []; s.waterParticles = waterParticles;
    for (let i = 0; i < 30; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 6), new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 2.5 }));
      p.position.set((Math.random() - 0.5) * 190, 20 + Math.random() * 80, (Math.random() - 0.5) * 190);
      filtBoxGroup.add(p);
      waterParticles.push({ mesh: p, speed: 0.4 + Math.random() * 0.6 });
    }

    const fertZone = new THREE.Group();
    fertZone.position.set(-3600, 0, -3600); scene.add(fertZone);
    board("AI FERTILIZER SYSTEM", -3600, 5, -2700, 420, 22, 0x8e44ad);
    const fertPad = new THREE.Mesh(new THREE.BoxGeometry(950, 1, 950), mat(0x2a1e3a, 0.95));
    fertPad.position.y = 4.2; fertZone.add(fertPad);
    const fertBorderMat = new THREE.MeshStandardMaterial({ color: 0xb266ff, emissive: 0xb266ff, emissiveIntensity: 2.2, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(fertBorderMat);
    const ftF = new THREE.Mesh(new THREE.BoxGeometry(950, 1.8, 6), fertBorderMat); ftF.position.set(0, 6.5, -475); fertZone.add(ftF);
    const ftB = ftF.clone(); ftB.position.z = 475; fertZone.add(ftB);
    const ftL = new THREE.Mesh(new THREE.BoxGeometry(6, 1.8, 950), fertBorderMat); ftL.position.set(-475, 6.5, 0); fertZone.add(ftL);
    const ftR = ftL.clone(); ftR.position.x = 475; fertZone.add(ftR);
    const fertOffice = new THREE.Mesh(new THREE.BoxGeometry(60, 80, 60), mat(0x4a2c6b, 0.3, 0.4));
    fertOffice.position.set(0, 45, 0); fertZone.add(fertOffice);
    const fertOfficeUpper = new THREE.Mesh(new THREE.BoxGeometry(50, 24, 50), new THREE.MeshStandardMaterial({ color: 0x2a1e3a, emissive: 0x8e44ad, emissiveIntensity: 1.5, metalness: 0.5, roughness: 0.15 }));
    fertOfficeUpper.position.set(0, 97, 0); fertZone.add(fertOfficeUpper);
    const fertBeacon = new THREE.Mesh(new THREE.SphereGeometry(5, 14, 14), new THREE.MeshStandardMaterial({ color: 0xb266ff, emissive: 0xb266ff, emissiveIntensity: 3.5 }));
    fertBeacon.position.set(0, 118, 0); fertZone.add(fertBeacon);
    for (const cx of [-200, -100, 100, 200]) {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(22, 26, 60, 16), mat(0x5a3e7d, 0.4, 0.35));
      tank.position.set(cx, 30, -350); fertZone.add(tank);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7a5a9d, 0.3, 0.5));
      cap.position.set(cx, 60, -350); fertZone.add(cap);
      const light = new THREE.Mesh(new THREE.SphereGeometry(2.5, 10, 10), new THREE.MeshStandardMaterial({ color: 0xb266ff, emissive: 0xb266ff, emissiveIntensity: 3 }));
      light.position.set(cx, 72, -350); fertZone.add(light);
    }

    const wasteZone = new THREE.Group();
    wasteZone.position.set(3600, 0, 3600); scene.add(wasteZone);
    board("WASTE MANAGEMENT", 3600, 5, 4500, 380, 18, 0x2ecc71);
    const wastePad = new THREE.Mesh(new THREE.BoxGeometry(950, 1, 950), mat(0x2a3a2e, 0.95));
    wastePad.position.y = 4.2; wasteZone.add(wastePad);
    const wasteBorderMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 2.2, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(wasteBorderMat);
    const wbF = new THREE.Mesh(new THREE.BoxGeometry(950, 1.4, 5), wasteBorderMat); wbF.position.set(0, 6.5, -475); wasteZone.add(wbF);
    const wbB = wbF.clone(); wbB.position.z = 475; wasteZone.add(wbB);
    const wbL = new THREE.Mesh(new THREE.BoxGeometry(5, 1.4, 950), wasteBorderMat); wbL.position.set(-475, 6.5, 0); wasteZone.add(wbL);
    const wbR = wbL.clone(); wbR.position.x = 475; wasteZone.add(wbR);

    function wasteDumpster(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const body = new THREE.Mesh(new THREE.BoxGeometry(38, 22, 26), mat(0x2ecc71, 0.5, 0.5));
      body.position.y = 11; g.add(body);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 28), mat(0x1a1a1a, 0.6, 0.3));
      lid.position.set(0, 23, -3); lid.rotation.x = -0.15; g.add(lid);
      const glowMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 2.5 });
      const glow = new THREE.Mesh(new THREE.BoxGeometry(38, 1.5, 26.5), glowMat);
      glow.position.y = 22; g.add(glow);
      wasteZone.add(g);
      clickable.push({ object: g, type: "wasteBin", name: "Waste Container" });
    }
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++)
      wasteDumpster(-280 + col * 190, -300 + row * 220);

    const recycleMachine = new THREE.Mesh(new THREE.BoxGeometry(120, 100, 120), mat(0x1a8a4e, 0.4, 0.5));
    recycleMachine.position.set(0, 55, 0); wasteZone.add(recycleMachine);
    const recycleTop = new THREE.Mesh(new THREE.BoxGeometry(100, 20, 100), new THREE.MeshStandardMaterial({ color: 0x0a5a2e, emissive: 0x2ecc71, emissiveIntensity: 1.5, metalness: 0.5, roughness: 0.2 }));
    recycleTop.position.set(0, 115, 0); wasteZone.add(recycleTop);
    const recycleRing = new THREE.Mesh(new THREE.TorusGeometry(80, 2, 8, 32), new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 2.5 }));
    recycleRing.rotation.x = Math.PI / 2; recycleRing.position.set(0, 10, 0); wasteZone.add(recycleRing);

    function buildTruck(c1, c2, label, txtColor) {
      const truck = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(100, 68, 44), mat(c1, 0.4, 0.3)); box.position.y = 45; truck.add(box);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(38, 44, 44), mat(c2, 0.4, 0.4)); cabin.position.set(65, 35, 0); truck.add(cabin);
      const win = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 34), new THREE.MeshStandardMaterial({ color: 0x8be8ff, transparent: true, opacity: 0.7, roughness: 0.1, metalness: 0.3 }));
      win.position.set(84, 42, 0); truck.add(win);
      const wm = mat(0x0c1012, 0.6, 0.1);
      const wg = new THREE.CylinderGeometry(12, 12, 8, 12);
      for (const wx of [-36, 36, 60]) for (const wz of [-20, 20]) {
        const w = new THREE.Mesh(wg, wm); w.rotation.x = Math.PI / 2; w.position.set(wx, 12, wz); truck.add(w);
      }
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(135, 8, 42), darkMaterial); chassis.position.set(16, 18, 0); truck.add(chassis);
      const canvas = document.createElement("canvas"); canvas.width = 1400; canvas.height = 280;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = txtColor; ctx.fillRect(0, 0, 1400, 280);
      ctx.fillStyle = "#fff"; ctx.font = "bold 115px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const lines = label.split("|");
      if (lines.length === 2) { ctx.fillText(lines[0], 700, 80); ctx.fillText(lines[1], 700, 200); }
      else ctx.fillText(label, 700, 140);
      const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
      const tMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      const t1 = new THREE.Mesh(new THREE.PlaneGeometry(95, 48), tMat); t1.position.set(0, 45, 22.5); truck.add(t1);
      const t2 = new THREE.Mesh(new THREE.PlaneGeometry(95, 48), tMat); t2.position.set(0, 45, -22.5); t2.rotation.y = Math.PI; truck.add(t2);
      const warn = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 10), new THREE.MeshStandardMaterial({ color: 0xff8a00, emissive: 0xff8a00, emissiveIntensity: 3 }));
      warn.position.set(0, 82, 0); truck.add(warn);
      return { truck, warn };
    }

    const g1 = buildTruck(0x3498db, 0x2980b9, "WASTE|MANAGEMENT", "#3498db");
    const garbageTruck = g1.truck; scene.add(garbageTruck); s.trucks.garbage = garbageTruck; s.garbageWarn = g1.warn;
    const g2 = buildTruck(0xb266ff, 0x7a3b9d, "AI FERTILIZER", "#8e44ad");
    const fertTruck1 = g2.truck; scene.add(fertTruck1); s.trucks.fert1 = fertTruck1; s.fertWarn1 = g2.warn;
    const g3 = buildTruck(0xd8b3ff, 0x8e44ad, "AI FERTILIZER", "#8e44ad");
    const fertTruck2 = g3.truck; scene.add(fertTruck2); s.trucks.fert2 = fertTruck2; s.fertWarn2 = g3.warn;

    const cityCars = []; s.cityCars = cityCars;
    const carColors = [0x287ca3, 0xc83f49, 0xe1a72e, 0x5b72c9, 0x2f9d65, 0xd8d8d8, 0xd97b2a, 0x8b3ad9, 0x16a085, 0x8e44ad, 0xf39c12, 0xe74c3c];
    const V_LEN = 26, V_WID = 10, V_HGT = 5.5;
    const carBodyGeo = new THREE.BoxGeometry(V_LEN, V_HGT, V_WID);
    const carHoodGeo = new THREE.BoxGeometry(V_LEN * 0.25, V_HGT * 0.55, V_WID * 0.95);
    const carCabinGeo = new THREE.BoxGeometry(V_LEN * 0.42, V_HGT * 0.85, V_WID * 0.88);
    const carWindshieldGeo = new THREE.BoxGeometry(1.8, V_HGT * 0.75, V_WID * 0.82);
    const carWheelGeo = new THREE.CylinderGeometry(2.4, 2.4, 1.6, 10);
    const carWheelHubGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.7, 8);
    const carLightGeo = new THREE.BoxGeometry(1.5, 1.6, 1.9);
    const carGlassMat = new THREE.MeshStandardMaterial({ color: 0x1a3a4a, emissive: 0x0a2535, emissiveIntensity: 0.4, roughness: 0.12, metalness: 0.5 });
    const wheelMat = mat(0x0c1012, 0.6, 0.1);
    const hubMat = mat(0xa0a8ac, 0.3, 0.7);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8e0, emissiveIntensity: 2.5 });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff1e1e, emissive: 0xff1010, emissiveIntensity: 2.5 });

    function makeCar(colorHex) {
      const g = new THREE.Group();
      const bMat = mat(colorHex, 0.35, 0.5);
      const body = new THREE.Mesh(carBodyGeo, bMat); body.position.y = 4.2; g.add(body);
      const hood = new THREE.Mesh(carHoodGeo, bMat); hood.position.set(V_LEN * 0.36, 4, 0); g.add(hood);
      const trunk = new THREE.Mesh(carHoodGeo, bMat); trunk.position.set(-V_LEN * 0.36, 4, 0); g.add(trunk);
      const cabin = new THREE.Mesh(carCabinGeo, carGlassMat); cabin.position.set(-1, 8.8, 0); g.add(cabin);
      const ws = new THREE.Mesh(carWindshieldGeo, carGlassMat); ws.position.set(V_LEN * 0.18, 8.5, 0); g.add(ws);
      const rw = new THREE.Mesh(carWindshieldGeo, carGlassMat); rw.position.set(-V_LEN * 0.22, 8.5, 0); g.add(rw);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(V_LEN * 0.35, 0.4, V_WID * 0.6), mat(0x222222, 0.5, 0.3));
      roof.position.set(-1, 12, 0); g.add(roof);
      for (const wp of [[V_LEN * 0.32, V_WID * 0.48], [V_LEN * 0.32, -V_WID * 0.48], [-V_LEN * 0.32, V_WID * 0.48], [-V_LEN * 0.32, -V_WID * 0.48]]) {
        const w = new THREE.Mesh(carWheelGeo, wheelMat); w.rotation.x = Math.PI / 2; w.position.set(wp[0], 2.8, wp[1]); g.add(w);
        const h = new THREE.Mesh(carWheelHubGeo, hubMat); h.rotation.x = Math.PI / 2; h.position.set(wp[0], 2.8, wp[1]); g.add(h);
      }
      for (const z of [-3.2, 3.2]) {
        const l = new THREE.Mesh(carLightGeo, headMat); l.position.set(V_LEN * 0.49, 4.5, z); g.add(l);
        const t = new THREE.Mesh(carLightGeo, tailMat); t.position.set(-V_LEN * 0.49, 4.5, z); g.add(t);
      }
      return g;
    }

    const outerRoute = [[-3300, -2400], [3300, -2400], [3300, 2400], [-3300, 2400]];
    const innerRoute = [[-1200, -1200], [1200, -1200], [1200, 1200], [-1200, 1200]];
    const midRoute = [[-2400, -1200], [2400, -1200], [2400, 1200], [-2400, 1200]];

    function routePoint(route, progress) {
      const scaled = progress * route.length;
      const i = Math.floor(scaled) % route.length;
      const n = (i + 1) % route.length;
      const t = scaled - Math.floor(scaled);
      const a = route[i], b = route[n];
      return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, ax: a[0], az: a[1], bx: b[0], bz: b[1] };
    }

    function spawnCar(route, progress, dir, speed, laneOffset) {
      const c = makeCar(carColors[Math.floor(Math.random() * carColors.length)]);
      scene.add(c);
      const p = routePoint(route, progress);
      const dx = p.bx - p.ax, dz = p.bz - p.az;
      const len = Math.sqrt(dx * dx + dz * dz);
      const nx = dx / len, nz = dz / len;
      c.position.set(p.x + -nz * laneOffset, 5.2, p.z + nx * laneOffset);
      let angle = -Math.atan2(dz, dx);
      if (dir < 0) angle += Math.PI;
      c.rotation.y = angle;
      cityCars.push({ car: c, route, progress, direction: dir, speed, baseSpeed: speed, laneOffset });
    }

    for (let i = 0; i < 12; i++) spawnCar(outerRoute, i / 12, 1, 0.32, -30);
    for (let i = 0; i < 12; i++) spawnCar(outerRoute, i / 12 + 0.5, -1, 0.32, 30);
    for (let i = 0; i < 8; i++) spawnCar(midRoute, i / 8, 1, 0.28, -28);
    for (let i = 0; i < 8; i++) spawnCar(midRoute, i / 8 + 0.5, -1, 0.28, 28);
    for (let i = 0; i < 5; i++) spawnCar(innerRoute, i / 5, 1, 0.25, -26);
    for (let i = 0; i < 5; i++) spawnCar(innerRoute, i / 5 + 0.5, -1, 0.25, 26);

    const intersectionCars = []; s.intersectionCars = intersectionCars;

    const ROAD_LANES = [
      { id: 1, dir: "north", axis: "z", sign: -1, xOffset: -30, startPos: -1000, endPos: 400 },
      { id: 2, dir: "south", axis: "z", sign: 1, xOffset: 30, startPos: 1000, endPos: -400 },
      { id: 3, dir: "east", axis: "x", sign: 1, zOffset: 30, startPos: 1000, endPos: -400 },
      { id: 4, dir: "west", axis: "x", sign: -1, zOffset: -30, startPos: -1000, endPos: 400 },
    ];

    function spawnIntersectionCar(roadId, startPos, lane) {
      const car = makeCar(carColors[Math.floor(Math.random() * carColors.length)]);
      scene.add(car);
      const carObj = {
        car,
        roadId,
        axis: lane.axis,
        sign: lane.sign,
        xOffset: lane.xOffset || 0,
        zOffset: lane.zOffset || 0,
        pos: startPos,
        speed: 0.4 + Math.random() * 0.3,
        baseSpeed: 0.4 + Math.random() * 0.3,
        waiting: false,
      };
      intersectionCars.push(carObj);
      updateIntersectionCarTransform(carObj);
    }

    function updateIntersectionCarTransform(c) {
      if (c.axis === "z") {
        c.car.position.set(c.xOffset, 5.2, c.pos);
        c.car.rotation.y = c.sign < 0 ? 0 : Math.PI;
      } else {
        c.car.position.set(c.pos, 5.2, c.zOffset);
        c.car.rotation.y = c.sign < 0 ? Math.PI : 0;
      }
    }

    for (let i = 0; i < 12; i++) {
      const roadId = (i % 4) + 1;
      const lane = ROAD_LANES[roadId - 1];
      const startPos = lane.startPos + (i * 60) * Math.sign(lane.endPos - lane.startPos);
      spawnIntersectionCar(roadId, startPos, lane);
    }

    function updateIntersectionCars(delta, aiSystem) {
      for (const c of intersectionCars) {
        const isGreen = aiSystem.isGreen(c.roadId);
        const isYellow = aiSystem.isYellowRoad(c.roadId);

        const stopLinePos = c.axis === "z"
          ? (c.sign < 0 ? 180 : -180)
          : (c.sign < 0 ? -180 : 180);

        const distToStop = Math.abs(c.pos - stopLinePos);

        let targetSpeed = c.baseSpeed;

        if (isYellow) {
          targetSpeed = c.baseSpeed * 0.6;
        } else if (!isGreen) {
          if (distToStop < 60) {
            targetSpeed = 0;
            c.waiting = true;
          } else if (distToStop < 180) {
            targetSpeed = c.baseSpeed * 0.3;
            c.waiting = false;
          } else {
            targetSpeed = c.baseSpeed * 0.7;
            c.waiting = false;
          }
        } else {
          c.waiting = false;
        }

        c.speed = c.speed + (targetSpeed - c.speed) * Math.min(1, delta * 4);

        c.pos += c.sign * c.speed * delta * 60;

        if (c.sign < 0 && c.pos < c.endPosAt || c.sign > 0 && c.pos > c.endPosAt) {
        }

        const range = 1200;
        if (c.sign < 0 && c.pos < -range) {
          c.pos = range;
        } else if (c.sign > 0 && c.pos > range) {
          c.pos = -range;
        }

        updateIntersectionCarTransform(c);
      }
    }

    const people = []; s.people = people;
    const skinColors = [0xf2c9a0, 0xd9a373, 0xa06a3c, 0x6b4a2f, 0xffd8b8];
    const shirtColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0x1abc9c, 0xe67e22, 0x34495e, 0xc0392b, 0x16a085];
    const pantsColors = [0x2c3e50, 0x34495e, 0x1a252f, 0x4a4a4a];

    function makePerson() {
      const g = new THREE.Group();
      const skin = skinColors[Math.floor(Math.random() * skinColors.length)];
      const shirt = shirtColors[Math.floor(Math.random() * shirtColors.length)];
      const pants = pantsColors[Math.floor(Math.random() * pantsColors.length)];
      const skinMat = mat(skin, 0.9);
      const shirtMat = mat(shirt, 0.85);
      const pantsMat = mat(pants, 0.85);
      const head = new THREE.Mesh(new THREE.SphereGeometry(1.8, 6, 5), skinMat); head.position.y = 9; g.add(head);
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 5, 1.8), shirtMat); body.position.y = 5.5; g.add(body);
      const legL = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), pantsMat); legL.position.set(-0.7, 2, 0); g.add(legL);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), pantsMat); legR.position.set(0.7, 2, 0); g.add(legR);
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.6, 0.8), shirtMat); armL.position.set(-2.1, 5.5, 0); g.add(armL);
      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.6, 0.8), shirtMat); armR.position.set(2.1, 5.5, 0); g.add(armR);
      return { g, legL, legR, armL, armR };
    }

    function spawnPeople(cx, cz, count, radius) {
      for (let i = 0; i < count; i++) {
        const p = makePerson();
        const angle = Math.random() * Math.PI * 2;
        const r = radius * (0.5 + Math.random() * 0.5);
        p.g.position.set(cx + Math.cos(angle) * r, 5, cz + Math.sin(angle) * r);
        p.g.rotation.y = angle;
        scene.add(p.g);
        people.push({ obj: p.g, legL: p.legL, legR: p.legR, armL: p.armL, armR: p.armR, cx, cz, r, angle, dir: Math.random() > 0.5 ? 1 : -1, speed: 0.005 + Math.random() * 0.008, phase: Math.random() * Math.PI * 2 });
      }
    }
    spawnPeople(-600, -600, 10, 180);
    spawnPeople(600, -600, 10, 180);
    spawnPeople(-600, 600, 16, 350);
    spawnPeople(600, 600, 8, 180);
    spawnPeople(1800, -600, 6, 240);
    spawnPeople(600, 1800, 10, 220);
    spawnPeople(0, 0, 5, 130);
    spawnPeople(-1800, 1800, 12, 200);
    spawnPeople(-3600, -2400, 4, 200);
    spawnPeople(-3600, -800, 4, 200);
    spawnPeople(-3600, 800, 4, 200);
    spawnPeople(-3600, 2400, 4, 200);

    const tourists = []; s.tourists = tourists;
    const touristShirtColors = [0xff6b6b, 0xffdd57, 0xff8fab, 0xa29bfe, 0x74b9ff, 0xfd79a8, 0x00cec9, 0xff9f43];

    function makeTourist() {
      const g = new THREE.Group();
      const skin = skinColors[Math.floor(Math.random() * skinColors.length)];
      const shirt = touristShirtColors[Math.floor(Math.random() * touristShirtColors.length)];
      const skinMat = mat(skin, 0.9);
      const shirtMat = mat(shirt, 0.85);
      const shortMat = mat(0xf5c84b, 0.85);
      const head = new THREE.Mesh(new THREE.SphereGeometry(1.8, 6, 5), skinMat); head.position.y = 9; g.add(head);
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 5, 1.8), shirtMat); body.position.y = 5.5; g.add(body);
      const legL = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), shortMat); legL.position.set(-0.7, 2, 0); g.add(legL);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), shortMat); legR.position.set(0.7, 2, 0); g.add(legR);
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.6, 0.8), shirtMat); armL.position.set(-2.1, 5.5, 0); g.add(armL);
      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.6, 0.8), shirtMat); armR.position.set(2.1, 5.5, 0); g.add(armR);
      const cam = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.8), mat(0x222222, 0.4, 0.7));
      cam.position.set(0, 5.5, 1.5); g.add(cam);
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.4, 12), mat(0xf5c84b, 0.7));
      hat.position.y = 11; g.add(hat);
      const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1, 12), mat(0xf5c84b, 0.7));
      hatTop.position.y = 11.7; g.add(hatTop);
      return { g, legL, legR, armL, armR };
    }

    function spawnTourists(count) {
      for (let i = 0; i < count; i++) {
        const p = makeTourist();
        const angle = Math.random() * Math.PI * 2;
        const r = 200 + Math.random() * 600;
        p.g.position.set(-3600 + Math.cos(angle) * r, 5, -200 + Math.sin(angle) * r);
        p.g.rotation.y = angle;
        scene.add(p.g);
        tourists.push({ obj: p.g, legL: p.legL, legR: p.legR, armL: p.armL, armR: p.armR, cx: -3600, cz: -200, r, angle, dir: Math.random() > 0.5 ? 1 : -1, speed: 0.004 + Math.random() * 0.006, phase: Math.random() * Math.PI * 2 });
      }
    }
    spawnTourists(20);

    let touristMsgShown = false;
    setTimeout(() => {
      if (!touristMsgShown) {
        touristMsgShown = true;
        onTouristMessage?.("Tourist has been joined our city");
      }
    }, 30000);

    for (let i = 0; i < 400; i++) {
      const x = (Math.random() - 0.5) * (CITY_HALF * 2 - 300);
      const z = (Math.random() - 0.5) * (CITY_HALF * 2 - 300);
      if (isFree(x, z)) tree(x, z, 0.8 + Math.random() * 0.6);
    }
    for (let i = 0; i < 150; i++) {
      const x = (Math.random() - 0.5) * (CITY_HALF * 2 - 300);
      const z = (Math.random() - 0.5) * (CITY_HALF * 2 - 300);
      if (isFree(x, z)) bush(x, z, 0.7 + Math.random() * 0.6);
    }

    function addLandscaping() {
      const grassPatchMat = new THREE.MeshStandardMaterial({ color: 0x3d7f45, roughness: 0.95 });
      const sidewalkPatchMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.9 });
      const parkingMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
      const buildingPlots = [
        { x: -600, z: -600, w: 500, d: 500, sidewalk: true, parking: true, trees: 6 },
        { x: 600, z: -600, w: 480, d: 480, sidewalk: true, parking: true, trees: 5 },
        { x: 600, z: 600, w: 520, d: 520, sidewalk: true, parking: true, trees: 6 },
        { x: 1800, z: -600, w: 700, d: 700, sidewalk: true, parking: false, trees: 10 },
        { x: 600, z: 1800, w: 560, d: 560, sidewalk: true, parking: true, trees: 6 },
        { x: 1800, z: 1750, w: 600, d: 600, sidewalk: true, parking: true, trees: 5 },
        { x: 1800, z: 600, w: 560, d: 560, sidewalk: true, parking: false, trees: 6 },
        { x: -1800, z: 1800, w: 620, d: 620, sidewalk: true, parking: false, trees: 8 },
        { x: 750, z: 750, w: 400, d: 400, sidewalk: true, parking: false, trees: 4 },
        { x: 1000, z: 400, w: 460, d: 460, sidewalk: true, parking: true, trees: 5 },
        { x: -1600, z: 800, w: 480, d: 480, sidewalk: true, parking: true, trees: 5 },
        { x: -3600, z: -2400, w: 700, d: 700, sidewalk: true, parking: false, trees: 10 },
        { x: -3600, z: -800, w: 720, d: 720, sidewalk: true, parking: false, trees: 10 },
        { x: -3600, z: 800, w: 700, d: 700, sidewalk: true, parking: false, trees: 10 },
        { x: -3600, z: 2400, w: 720, d: 720, sidewalk: true, parking: false, trees: 10 },
      ];
      buildingPlots.forEach(plot => {
        const grass = new THREE.Mesh(new THREE.BoxGeometry(plot.w + 60, 0.35, plot.d + 60), grassPatchMat);
        grass.position.set(plot.x, 4.5, plot.z); scene.add(grass);
        if (plot.sidewalk) {
          const swW = 12;
          const f1 = new THREE.Mesh(new THREE.BoxGeometry(plot.w + 60, 0.5, swW), sidewalkPatchMat);
          f1.position.set(plot.x, 4.7, plot.z + plot.d / 2 + 30 + swW / 2); scene.add(f1);
          const f2 = f1.clone(); f2.position.z = plot.z - plot.d / 2 - 30 - swW / 2; scene.add(f2);
          const f3 = new THREE.Mesh(new THREE.BoxGeometry(swW, 0.5, plot.d + 60), sidewalkPatchMat);
          f3.position.set(plot.x - plot.w / 2 - 30 - swW / 2, 4.7, plot.z); scene.add(f3);
          const f4 = f3.clone(); f4.position.x = plot.x + plot.w / 2 + 30 + swW / 2; scene.add(f4);
        }
        if (plot.parking) {
          const pW = 120, pD = 60;
          const parking = new THREE.Mesh(new THREE.BoxGeometry(pW, 0.55, pD), parkingMat);
          parking.position.set(plot.x + plot.w / 2 - pW / 2 - 10, 4.75, plot.z + plot.d / 2 + 60); scene.add(parking);
          const parkingLineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
          for (let i = 0; i < 5; i++) {
            const line = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, pD - 8), parkingLineMat);
            line.position.set(plot.x + plot.w / 2 - pW / 2 - 10 - pW / 2 + 12 + i * ((pW - 24) / 4), 5.1, plot.z + plot.d / 2 + 60);
            scene.add(line);
          }
        }
        for (let i = 0; i < plot.trees; i++) {
          const angle = (i / plot.trees) * Math.PI * 2;
          const rx = Math.cos(angle) * (plot.w / 2 + 40);
          const rz = Math.sin(angle) * (plot.d / 2 + 40);
          const tx = plot.x + rx;
          const tz = plot.z + rz;
          if (!isOnRoad(tx, tz)) tree(tx, tz, 0.7 + Math.random() * 0.4);
        }
      });
      const walkwayMat = new THREE.MeshStandardMaterial({ color: 0xa8a8a8, roughness: 0.9 });
      const crosswalks = [
        { x: 0, z: -1200, w: 90, d: 24, horizontal: true },
        { x: 0, z: 0, w: 90, d: 24, horizontal: true },
        { x: 0, z: 1200, w: 90, d: 24, horizontal: true },
        { x: -1200, z: 0, w: 24, d: 90, horizontal: false },
        { x: 1200, z: 0, w: 24, d: 90, horizontal: false },
        { x: -2400, z: 0, w: 24, d: 90, horizontal: false },
        { x: 2400, z: 0, w: 24, d: 90, horizontal: false },
        { x: 0, z: -2400, w: 90, d: 24, horizontal: true },
        { x: 0, z: 2400, w: 90, d: 24, horizontal: true },
      ];
      crosswalks.forEach(cw => {
        for (let i = 0; i < 6; i++) {
          const stripe = new THREE.Mesh(
            new THREE.BoxGeometry(cw.horizontal ? 6 : cw.w - 10, 0.55, cw.horizontal ? cw.d - 10 : 6),
            walkwayMat
          );
          const offset = (i - 2.5) * 10;
          if (cw.horizontal) stripe.position.set(cw.x + offset, 5.15, cw.z);
          else stripe.position.set(cw.x, 5.15, cw.z + offset);
          scene.add(stripe);
        }
      });
    }

    addLandscaping();

    const sim = createCitySimulation({ onTrafficUpdate, onSimTime, onCycleUpdate, onAiMessage, onAiReason });
    s.sim = sim;

    const aiSystem = createAITrafficSystem({
      onTrafficUpdate: (data) => onAITrafficUpdate?.(data),
    });
    s.aiSystem = aiSystem;

    const garbageRoute = [
      [-1200, -1200], [0, -1200], [1200, -1200], [1200, 0], [1200, 1200],
      [900, 1400], [600, 1800], [600, 2400], [1200, 2400], [2400, 2400],
      [2400, 1200], [2400, 0], [2400, -1200], [1200, -1200], [0, -1200], [-1200, -1200],
      [-2400, -1200], [-2400, -2400], [-1200, -2400], [0, -2400],
      [1200, -2400], [2400, -2400], [3300, -2400], [3300, 0],
      [3300, 2400], [2400, 2400], [1200, 2400], [0, 1200], [-1200, 0], [-1200, -1200],
    ];
    const fertRoute1 = [
      [1800, -1200], [1200, -1200], [1200, 0], [1200, 1200], [0, 1200],
      [-1200, 1200], [-2400, 1200], [-2400, 0], [-2400, -1200], [-2400, -2400],
      [-3600, -2400], [-3600, -3600], [-2400, -3600], [-1200, -3600], [0, -3600],
      [1200, -3600], [1200, -2400], [1200, -1200], [1800, -1200],
    ];
    const fertRoute2 = [
      [-3600, -3600], [-3600, -2400], [-3600, -1200], [-2400, -1200], [-1200, -1200],
      [-1200, 0], [-1200, 1200], [-1200, 2400], [-2400, 2400], [-3600, 2400],
      [-3600, 3600], [-2400, 3600], [-1200, 3600], [0, 3600], [1200, 3600],
      [1200, 2400], [1200, 1200], [1200, 0], [1200, -1200], [0, -1200],
      [-1200, -1200], [-2400, -1200], [-3600, -1200], [-3600, -2400], [-3600, -3600],
    ];
    const garbageState = { idx: 0, prog: 0 };
    const fert1State = { idx: 0, prog: 0 };
    const fert2State = { idx: 0, prog: 0 };

    function moveTruck(truck, route, state, delta, speed) {
      const from = route[state.idx];
      const to = route[(state.idx + 1) % route.length];
      state.prog += delta * speed;
      if (state.prog >= 1) { state.prog = 0; state.idx = (state.idx + 1) % route.length; }
      const x = from[0] + (to[0] - from[0]) * state.prog;
      const z = from[1] + (to[1] - from[1]) * state.prog;
      truck.position.set(x, 5.2, z);
      const dx = to[0] - from[0], dz = to[1] - from[1];
      if (Math.abs(dx) + Math.abs(dz) > 0.1) truck.rotation.y = -Math.atan2(dz, dx);
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (e) => {
      if (s.isLocked) return;
      if (e.target !== renderer.domElement) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      for (const item of clickable) {
        const hit = raycaster.intersectObject(item.object, true);
        if (hit.length) {
          let title = item.name || "Location";
          let type = "INFO";
          let text = "Details available.";
          switch (item.type) {
            case "school": type = "EDUCATION"; text = "Modern high school."; break;
            case "hospital": type = "HEALTHCARE"; text = "Smart hospital."; break;
            case "society": type = "RESIDENTIAL"; text = "BSS Smart Society — 12 towers, solar panels, green border."; break;
            case "bank": type = "FINANCIAL"; text = "Smart banking."; break;
            case "nearBank": type = "COMMERCIAL"; text = "Near bank building."; break;
            case "commercial": type = "COMMERCIAL"; text = "Commercial building concept."; break;
            case "farm": type = "AGRICULTURE"; text = "Sustainable farming."; break;
            case "newHall": type = "EVENT VENUE"; text = "Liverpool Event Hall."; break;
            case "gasStation": type = "AUTOMOTIVE"; text = "Gas station + car wash."; break;
            case "powerCompany": type = "UTILITY"; text = "City power supply company."; break;
            case "sewageCompany": type = "INDUSTRIAL"; text = "Sewage & gas company."; break;
            case "sewageCompanyOld": type = "INDUSTRIAL"; text = "Old office building."; break;
            case "cultureCenter": type = "CULTURAL"; text = "Culture Center."; break;
            case "beautifulTower": type = "SKYLINE"; text = "Beautiful tower."; break;
            case "twinTowers": type = "SKYLINE"; text = "Twin sci-fi towers."; break;
            case "scifi9": type = "SCI-FI"; text = "Sci-Fi Building 9."; break;
            case "scifi10": type = "SCI-FI"; text = "Sci-Fi Building 10."; break;
            case "wasteCollector": type = "MUNICIPAL"; text = "Waste collection point."; break;
            case "wasteBin": type = "WASTE"; text = "Waste container."; break;
          }
          onPanel({ title, type, text });
          return;
        }
      }
      const ctrlHit = raycaster.intersectObject(controller, true);
      if (ctrlHit.length) {
        onPanel({ title: "AI Traffic Management Center", type: "INTELLIGENT TRANSPORTATION", text: "Monitors all 4 city entry routes." });
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    const clock = new THREE.Clock();
    let fc = 0;
    let rafId;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.elapsedTime;
      fc++;

      sim.tick(delta);
      aiSystem.tick(delta);
      updateCarMovement();
      updateIntersectionCars(delta, aiSystem);

      const currentGreen = aiSystem.isGreen;
      for (const l of intersectionLights) {
        l.r.material.emissiveIntensity = 0;
        l.y.material.emissiveIntensity = 0;
        l.gr.material.emissiveIntensity = 0;
        if (aiSystem.isGreen(l.road)) {
          l.gr.material.emissiveIntensity = 4.5;
        } else if (aiSystem.isYellowRoad(l.road)) {
          l.y.material.emissiveIntensity = 5;
        } else {
          l.r.material.emissiveIntensity = 4.5;
        }
      }

      for (const p of people) {
        p.angle += p.speed * p.dir;
        if (p.angle > Math.PI * 2) p.angle -= Math.PI * 2;
        if (p.angle < 0) p.angle += Math.PI * 2;
        p.obj.position.x = p.cx + Math.cos(p.angle) * p.r;
        p.obj.position.z = p.cz + Math.sin(p.angle) * p.r;
        p.obj.rotation.y = p.angle + (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
        const swing = Math.sin(t * 6 + p.phase) * 0.4;
        p.legL.rotation.x = swing;
        p.legR.rotation.x = -swing;
        p.armL.rotation.x = -swing * 0.7;
        p.armR.rotation.x = swing * 0.7;
      }

      for (const p of tourists) {
        p.angle += p.speed * p.dir;
        if (p.angle > Math.PI * 2) p.angle -= Math.PI * 2;
        if (p.angle < 0) p.angle += Math.PI * 2;
        p.obj.position.x = p.cx + Math.cos(p.angle) * p.r;
        p.obj.position.z = p.cz + Math.sin(p.angle) * p.r;
        p.obj.rotation.y = p.angle + (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
        const swing = Math.sin(t * 6 + p.phase) * 0.5;
        p.legL.rotation.x = swing;
        p.legR.rotation.x = -swing;
        p.armL.rotation.x = -swing * 0.8;
        p.armR.rotation.x = swing * 0.8;
      }

      for (const wp of waterParticles) {
        wp.mesh.position.y += wp.speed * 0.4;
        if (wp.mesh.position.y > 105) {
          wp.mesh.position.y = 18;
          wp.mesh.position.x = (Math.random() - 0.5) * 180;
          wp.mesh.position.z = (Math.random() - 0.5) * 180;
        }
      }

      for (const l of trafficLights) {
        const cyc = (t + l.phase) % 12;
        l.r.material.emissiveIntensity = 0;
        l.y.material.emissiveIntensity = 0;
        l.gr.material.emissiveIntensity = 0;
        if (cyc < 5) l.r.material.emissiveIntensity = 4;
        else if (cyc < 7) l.y.material.emissiveIntensity = 4;
        else l.gr.material.emissiveIntensity = 4;
      }

      moveTruck(garbageTruck, garbageRoute, garbageState, delta, 0.18);
      moveTruck(fertTruck1, fertRoute1, fert1State, delta, 0.16);
      moveTruck(fertTruck2, fertRoute2, fert2State, delta, 0.15);
      const blink = Math.floor(t * 2) % 2 === 0 ? 3 : 0.5;
      if (s.garbageWarn) s.garbageWarn.material.emissiveIntensity = blink;
      if (s.fertWarn1) s.fertWarn1.material.emissiveIntensity = blink;
      if (s.fertWarn2) s.fertWarn2.material.emissiveIntensity = blink;

      if (fc % 3 === 0) for (const bl of turbines) bl.rotation.z = t * 2.4;

      radar.rotation.z = t * 1.7;
      controllerRing.rotation.z = t * 0.5;
      controllerRing2.rotation.z = -t * 0.4;
      controllerSig.scale.setScalar(1 + Math.sin(t * 4) * 0.15);

      if (s.camTransition) {
        const now = performance.now();
        const elapsed = now - s.camTransition.startTime;
        const tt = Math.min(elapsed / s.camTransition.duration, 1);
        const ease = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2;
        camera.position.lerpVectors(s.camTransition.startPos, s.camTransition.targetPos, ease);
        controls.target.lerpVectors(s.camTransition.startLook, s.camTransition.targetLook, ease);
        if (tt >= 1) s.camTransition = null;
      }

      if (s.followTarget) {
        const target = s.followTarget.position.clone();
        camera.position.lerp(target.clone().add(new THREE.Vector3(120, 90, 120)), 0.05);
        controls.target.lerp(target, 0.08);
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

  return <div ref={mountRef} style={{ position: "fixed", inset: 0 }} />;
});

export default SmartCity3D;
