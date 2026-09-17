// src/SmartCity3D.jsx — COMPLETE CODES-BASED SMART CITY
// No GLB files. Everything built with code.
// Features:
// - 50+ smart places with unique structures
// - 4-lane traffic system with drones monitoring
// - AI Traffic Manager (drone feeds)
// - Bright traffic lights with halos
// - Vertical Farming with growing crops
// - Power Supply: turbines + solar panels + batteries
// - Smart Houses with rooftop turbines
// - Filtration system with real pipes + sensors
// - 4 cameras per place (clickable)
// - Rich popups with animation on click
// - Small compact city

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const CITY_HALF = 1800;
const ROAD_HALF_LEN = 1700;
const GROUND_SIZE = 4000;
const CAR_Y = 5.2;
const CAR_SPEED = 0.0025;
const INTERSECTION_SPEED = 0.022;

const BUILDING_INFO = {
  school: { title: "American High School", type: "EDUCATION", icon: "🏫", desc: "AI-powered classrooms, robotics lab, smart boards, digital attendance, and immersive VR learning pods.", stats: [["Students","450"],["Teachers","32"],["Classes","18"],["Robotics Lab","Active"]] },
  hospital: { title: "Smart Hospital", type: "HEALTHCARE", icon: "🏥", desc: "24/7 emergency response, AI-assisted diagnosis, robotic surgery suite, and smart ICU beds with real-time monitoring.", stats: [["Patients","32"],["Ambulances","2 ready"],["ICU Beds","8 free"],["AI Diagnosis","Online"]] },
  bank: { title: "Smart City State Bank", type: "FINANCIAL", icon: "🏦", desc: "Digital banking hub with AI fraud detection, 24/7 smart ATMs, and blockchain-secured vaults.", stats: [["Transactions","1,240/hr"],["ATMs","8 online"],["AI Security","Active"],["Uptime","99.9%"]] },
  farm: { title: "Smart Eco Farm", type: "AGRICULTURE", icon: "🌾", desc: "IoT sensors, drip irrigation, autonomous drone monitoring, and AI fertilizer dosing.", stats: [["Crop Health","94%"],["Soil Moisture","68%"],["Drones","3 active"],["Temp","24°C"]] },
  power: { title: "Power Supply Zone", type: "RENEWABLE", icon: "⚡", desc: "Hybrid renewable generation: solar arrays, wind turbines, and grid-scale battery storage with AI load balancing.", stats: [["Solar","42 MW"],["Wind","28 MW"],["Batteries","78%"],["Output","70 MW"]] },
  filtration: { title: "Filtration System", type: "WATER TREATMENT", icon: "💧", desc: "9-stage purification: wastewater → primary → biological → UV → clean reuse with 24 IoT quality sensors.", stats: [["Processed","12M L/day"],["Purity","99.7%"],["Sensors","24 active"],["Recycle","82%"]] },
  verticalFarm: { title: "Vertical Farm Tower", type: "AGRICULTURE", icon: "🌿", desc: "Multi-level hydroponic tower with real-time crop growth, magenta grow-LED spectrum, and AI nutrient dosing.", stats: [["Levels","12"],["Water Save","-92%"],["Yield","+340%"],["LEDs","Full Spectrum"]] },
  smartHome: { title: "Smart Home", type: "RESIDENTIAL", icon: "🏠", desc: "IoT home with rooftop solar panel, wind turbine, smart meter, AI climate control, and A+ energy rating.", stats: [["Type","IoT Home"],["Solar","Yes"],["Wind","Turbine"],["Energy","A+"]] },
  waste: { title: "Waste Management", type: "MUNICIPAL", icon: "♻", desc: "Smart segregation, recycling, and waste-to-energy conversion plant with AI route optimization.", stats: [["Recycled","68%"],["Energy","4.2 MW"],["Trucks","3 out"],["Bins","42%"]] },
  police: { title: "Smart Police Station", type: "SAFETY", icon: "🚔", desc: "AI surveillance hub with autonomous drone dispatch and 4-minute emergency response.", stats: [["Officers","48"],["Units","6"],["Cameras","120"],["Response","4 min"]] },
  fire: { title: "Fire Station", type: "SAFETY", icon: "🚒", desc: "Emergency fire response with smart dispatch, thermal drones, and 3-minute city-wide reach.", stats: [["Trucks","4"],["Crew","24"],["Drones","2"],["Response","3 min"]] },
  library: { title: "Smart Public Library", type: "EDUCATION", icon: "📚", desc: "Digital library with AI book finder, VR reading rooms, and holographic exhibit space.", stats: [["Books","45K"],["Digital","12K"],["Today","180"],["VR Rooms","4"]] },
  ev: { title: "EV Charging Station", type: "ENERGY", icon: "⚡", desc: "Fast-charging station with solar canopy, smart grid integration, and 30-minute full charge.", stats: [["Chargers","4"],["Today","22"],["Solar","Yes"],["Charge","30 min"]] },
  trafficController: { title: "AI Traffic Controller", type: "TRANSPORTATION", icon: "🤖", desc: "Central AI that monitors 4 roads with drone feeds, adapts signals in real-time, detects jams, and reroutes traffic.", stats: [["Vehicles","80"],["Drones","4 active"],["AI Mode","Active"],["Sensors","24"]] },
  dataCenter: { title: "Smart Data Center", type: "TECHNOLOGY", icon: "💾", desc: "Tier-4 cloud server facility with AI compute cluster and secure city data vaults.", stats: [["Servers","2,400"],["Storage","18 PB"],["Security","Tier-4"],["Temp","18°C"]] },
  telecom: { title: "Smart Telecom Tower", type: "TELECOM", icon: "📡", desc: "5G/6G broadcast tower with AI signal optimization and 25km coverage radius.", stats: [["Bands","5G+6G"],["Range","25 km"],["Uptime","99.9%"],["Power","Solar"]] },
  waterTower: { title: "Smart Water Tower", type: "UTILITY", icon: "💧", desc: "Elevated reservoir with quality sensors, automated distribution, and 2M liter capacity.", stats: [["Capacity","2M L"],["Quality","Optimal"],["Level","78%"],["Sensors","8"]] },
  parking: { title: "Smart Parking", type: "TRANSPORT", icon: "🅿️", desc: "AI-guided multi-level parking with EV charging and auto-valet service.", stats: [["Spaces","240"],["Free","82"],["EV","Yes"],["App","Live"]] },
  helipad: { title: "Emergency Helipad", type: "EMERGENCY", icon: "🚁", desc: "Rooftop helipad for medical and emergency air response with radar guidance.", stats: [["Landings","12"],["Ready","24/7"],["Radar","Active"],["Lights","ON"]] },
  culture: { title: "Culture Center", type: "CULTURAL", icon: "🏛", desc: "Museums, art galleries, VR cultural tours, and immersive workshops.", stats: [["Visitors","320"],["Exhibits","45"],["VR Tours","Online"],["Workshops","2"]] },
  hall: { title: "Event Hall", type: "EVENT VENUE", icon: "🎪", desc: "Smart auditorium with adaptive lighting, immersive surround sound, and 2,000 capacity.", stats: [["Capacity","2,000"],["Events","3 today"],["Lights","Smart ON"],["Sound","Surround"]] },
};

const PLACES = [
  { key: "school", label: "High School", icon: "🏫", type: "school", pos: [-1200, -1200], kind: "school" },
  { key: "hospital", label: "Hospital", icon: "🏥", type: "hospital", pos: [1200, -1200], kind: "hospital" },
  { key: "bank", label: "State Bank", icon: "🏦", type: "bank", pos: [1200, 1200], kind: "bank" },
  { key: "farm", label: "Eco Farm", icon: "🌾", type: "farm", pos: [-1200, 1200], kind: "farm" },
  { key: "hall", label: "Event Hall", icon: "🎪", type: "hall", pos: [-200, -1500], kind: "hall" },
  { key: "culture", label: "Culture Center", icon: "🏛", type: "culture", pos: [200, 1500], kind: "culture" },
  { key: "police", label: "Police Station", icon: "🚔", type: "police", pos: [1400, -200], kind: "police" },
  { key: "fire", label: "Fire Station", icon: "🚒", type: "fire", pos: [-1400, -200], kind: "fire" },
  { key: "library", label: "Library", icon: "📚", type: "library", pos: [1400, 200], kind: "library" },
  { key: "dataCenter", label: "Data Center", icon: "💾", type: "dataCenter", pos: [-1000, -400], kind: "dataCenter" },
  { key: "telecom", label: "Telecom Tower", icon: "📡", type: "telecom", pos: [1000, -400], kind: "telecom" },
  { key: "waterTower", label: "Water Tower", icon: "💧", type: "waterTower", pos: [-1000, 400], kind: "waterTower" },
  { key: "ev", label: "EV Charging", icon: "⚡", type: "ev", pos: [1000, 400], kind: "ev" },
  { key: "parking", label: "Smart Parking", icon: "🅿️", type: "parking", pos: [-400, -1000], kind: "parking" },
  { key: "helipad", label: "Helipad", icon: "🚁", type: "helipad", pos: [400, 1000], kind: "helipad" },
];

const SmartCity3D = forwardRef((props, ref) => {
  const mountRef = useRef(null);
  const [placePopup, setPlacePopup] = useState(null);
  const [trafficHUD, setTrafficHUD] = useState({ phase: 1, inYellow: false, green: [1, 2], red: [3, 4], density: "LOW", drones: 4, cars: 4 });
  const [logs, setLogs] = useState([]);

  const s = useRef({
    camera: null, controls: null, renderer: null, scene: null,
    clickable: [], trafficLights: [], intersectionLights: [], drones: [],
    cityCars: [], people: [], plants: [], borderMats: [],
    grassMat: null, roadMat: null, edgeLights: [], camTrans: null,
    trafficSystem: null,
  }).current;

  useImperativeHandle(ref, () => ({
    goToPlace: (key) => goToPlace(key),
    goToOverview: () => goToOverview(),
    goToTopDown: () => goToTopDown(),
  }));

  function goToOverview() {
    if (!s.camera) return;
    s.camTrans = { startPos: s.camera.position.clone(), targetPos: new THREE.Vector3(900, 700, 900), startLook: s.controls.target.clone(), targetLook: new THREE.Vector3(0, 5, 0), startTime: performance.now(), duration: 1400 };
  }
  function goToTopDown() {
    if (!s.camera) return;
    s.camTrans = { startPos: s.camera.position.clone(), targetPos: new THREE.Vector3(0, 2200, 400), startLook: s.controls.target.clone(), targetLook: new THREE.Vector3(0, 0, 0), startTime: performance.now(), duration: 1400 };
  }
  function goToPlace(key) {
    const p = PLACES.find((x) => x.key === key); if (!p || !s.camera) return;
    const [x, z] = p.pos;
    s.camTrans = { startPos: s.camera.position.clone(), targetPos: new THREE.Vector3(x + 200, 200, z + 200), startLook: s.controls.target.clone(), targetLook: new THREE.Vector3(x, 5, z), startTime: performance.now(), duration: 1400 };
    setPlacePopup(BUILDING_INFO[p.type]);
  }

  useEffect(() => {
    const container = mountRef.current; if (!container) return;
    const clickable = []; s.clickable = clickable;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const scene = new THREE.Scene(); s.scene = scene;
    scene.background = new THREE.Color(0x8fbcd4);
    scene.fog = new THREE.Fog(0x8fbcd4, 2500, 6000);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 5, 12000);
    camera.position.set(900, 700, 900); s.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement); s.renderer = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.12;
    controls.minDistance = 150; controls.maxDistance = 4500;
    controls.target.set(0, 5, 0); s.controls = controls;

    const ambient = new THREE.HemisphereLight(0xffffff, 0x4a7a56, 2.9);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.7);
    sun.position.set(-800, 1400, 500); scene.add(sun);
    const rim = new THREE.DirectionalLight(0x88ddff, 0.9);
    rim.position.set(0, 600, -1200); scene.add(rim);

    const mat = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x2ac8ff, emissive: 0x1a7ac8, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.15, transparent: true, opacity: 0.75 });
    const grassMaterial = mat(0x4d8f50, 0.98);
    const roadMaterial = mat(0x2a3238, 0.85, 0.15);
    const laneMaterial = mat(0x1e2428, 0.96);
    const whiteLine = mat(0xffffff, 0.65);
    const yellowLine = mat(0xf5c84b, 0.65);
    const darkMat = mat(0x182327, 0.65, 0.15);
    s.grassMat = grassMaterial; s.roadMat = roadMaterial;

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE), grassMaterial);
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    // ============ ROADS ============
    const ROAD_W = 80, ROAD_HALF = 40;
    const ROAD_LEN = ROAD_HALF_LEN * 2;
    const roadXs = [-900, -300, 300, 900];
    const roadZs = [-900, -300, 300, 900];

    function makeRoadE(z) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LEN, 0.3, ROAD_W + 20), laneMaterial);
      sh.position.set(0, 4.55, z); scene.add(sh);
      const r = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LEN, 0.5, ROAD_W), roadMaterial);
      r.position.set(0, 4.7, z); scene.add(r);
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LEN, 0.1, 2), yellowLine);
      c1.position.set(0, 5, z - 2.5); scene.add(c1);
      const c2 = c1.clone(); c2.position.z = z + 2.5; scene.add(c2);
      for (let lx = -ROAD_HALF_LEN + 30; lx < ROAD_HALF_LEN - 20; lx += 70) {
        const d1 = new THREE.Mesh(new THREE.BoxGeometry(30, 0.09, 0.8), whiteLine);
        d1.position.set(lx, 5.05, z + 25); scene.add(d1);
        const d2 = d1.clone(); d2.position.z = z - 25; scene.add(d2);
      }
    }
    function makeRoadN(x) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W + 20, 0.3, ROAD_LEN), laneMaterial);
      sh.position.set(x, 4.55, 0); scene.add(sh);
      const r = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W, 0.5, ROAD_LEN), roadMaterial);
      r.position.set(x, 4.7, 0); scene.add(r);
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, ROAD_LEN), yellowLine);
      c1.position.set(x - 2.5, 5, 0); scene.add(c1);
      const c2 = c1.clone(); c2.position.x = x + 2.5; scene.add(c2);
      for (let lz = -ROAD_HALF_LEN + 30; lz < ROAD_HALF_LEN - 20; lz += 70) {
        const d1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.09, 30), whiteLine);
        d1.position.set(x + 25, 5.05, lz); scene.add(d1);
        const d2 = d1.clone(); d2.position.x = x - 25; scene.add(d2);
      }
    }
    roadZs.forEach(makeRoadE);
    roadXs.forEach(makeRoadN);

    // ============ CITY WALL ============
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a6670, roughness: 0.85, metalness: 0.15 });
    const glowMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 3.5 });
    s.borderMats.push(glowMat);
    const wallH = 80, wallT = 15;
    const corners = [[-CITY_HALF, -CITY_HALF], [CITY_HALF, -CITY_HALF], [CITY_HALF, CITY_HALF], [-CITY_HALF, CITY_HALF]];
    for (let i = 0; i < 4; i++) {
      const a = corners[i], b = corners[(i + 1) % 4];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(len, wallH, wallT), wallMat);
      wall.position.set((a[0] + b[0]) / 2, wallH / 2 + 5, (a[1] + b[1]) / 2);
      wall.rotation.y = Math.atan2(b[1] - a[1], b[0] - a[0]);
      scene.add(wall);
      const top = new THREE.Mesh(new THREE.BoxGeometry(len, 4, wallT + 4), glowMat);
      top.position.set((a[0] + b[0]) / 2, wallH + 8, (a[1] + b[1]) / 2);
      top.rotation.y = wall.rotation.y; scene.add(top);
    }
    for (const [cx, cz] of corners) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 30, 12), glowMat);
      p.position.set(cx, 20, cz); scene.add(p);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x22cfff, emissiveIntensity: 5 }));
      s.borderMats.push(cap.material);
      cap.position.set(cx, 40, cz); scene.add(cap);
    }

    // ============ BUILDING HELPERS ============
    function placeBorder(x, z, w, d, color) {
      const bMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3.0, metalness: 0.6, roughness: 0.25 });
      s.borderMats.push(bMat);
      const f = new THREE.Mesh(new THREE.BoxGeometry(w + 12, 2, 4), bMat); f.position.set(x, 6.5, z + d / 2 + 6); scene.add(f);
      const b = f.clone(); b.position.z = z - d / 2 - 6; scene.add(b);
      const l = new THREE.Mesh(new THREE.BoxGeometry(4, 2, d + 12), bMat); l.position.set(x - w / 2 - 6, 6.5, z); scene.add(l);
      const r = l.clone(); r.position.x = x + w / 2 + 6; scene.add(r);
    }

    function makeBuilding(x, z, w, d, h, color, roofColor, type, name, hasBorder = true, borderColor = 0x22cfff) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const bMat = mat(color, 0.55, 0.35);
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bMat); body.position.y = h / 2; g.add(body);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 4, 6, d + 4), mat(roofColor || 0x2a2a35, 0.6, 0.4)); roof.position.y = h + 3; g.add(roof);
      const winMat = new THREE.MeshStandardMaterial({ color: 0x0a2a3a, emissive: 0x66ccff, emissiveIntensity: 0.8, metalness: 0.5, roughness: 0.2 });
      const floors = Math.min(10, Math.max(2, Math.floor(h / 12)));
      for (let i = 1; i <= floors; i++) {
        const y = (h / (floors + 1)) * i;
        const strip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 1.8, d + 0.5), winMat);
        strip.position.y = y; g.add(strip);
      }
      const door = new THREE.Mesh(new THREE.BoxGeometry(Math.min(w * 0.3, 20), Math.min(14, h * 0.2), 3), mat(0x0a0a0a, 0.5, 0.4));
      door.position.set(0, Math.min(7, h * 0.1), d / 2 + 1); g.add(door);
      if (h > 60) {
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 22, 6), mat(0x9a9a9a, 0.4, 0.8));
        ant.position.y = h + 17; g.add(ant);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 4 }));
        beacon.position.y = h + 30; g.add(beacon);
      }
      scene.add(g);
      clickable.push({ object: g, type, name: name || type });
      if (hasBorder) placeBorder(x, z, w + 20, d + 20, borderColor);
      return g;
    }

    // ============ CAMERAS on building corners ============
    function addCameras(g, w, d, h, color = 0x22cfff) {
      const camMat = mat(0x111417, 0.5, 0.6);
      const lensMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3 });
      const camData = [];
      const positions = [
        { x: -w / 2 - 2, y: h + 3, z: -d / 2 - 2, ry: -Math.PI / 4 },
        { x: w / 2 + 2, y: h + 3, z: -d / 2 - 2, ry: Math.PI / 4 },
        { x: w / 2 + 2, y: h + 3, z: d / 2 + 2, ry: 3 * Math.PI / 4 },
        { x: -w / 2 - 2, y: h + 3, z: d / 2 + 2, ry: -3 * Math.PI / 4 },
      ];
      positions.forEach((p, i) => {
        const cg = new THREE.Group(); cg.position.set(p.x, p.y, p.z); cg.rotation.y = p.ry;
        const body = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 6), camMat); cg.add(body);
        const lens = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), lensMat);
        lens.position.set(0, 0, -3.5); cg.add(lens);
        g.add(cg);
        camData.push({ index: i + 1, group: cg, lens });
      });
      return camData;
    }

    // ============ SPECIFIC BUILDINGS ============
    function buildSchool(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const main = new THREE.Mesh(new THREE.BoxGeometry(180, 80, 140), mat(0xa83a3a, 0.55, 0.35)); main.position.y = 40; g.add(main);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(80, 50, 120), mat(0xc04a4a, 0.55, 0.35)); wing.position.set(140, 25, 10); g.add(wing);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(190, 6, 150), mat(0x5a2a2a, 0.6)); roof.position.y = 83; g.add(roof);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(25, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x8a3a3a, 0.5)); dome.position.set(0, 83, 0); g.add(dome);
      const winMat = new THREE.MeshStandardMaterial({ color: 0x0a2a3a, emissive: 0x66ccff, emissiveIntensity: 1.0 });
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(20, 15, 2), winMat);
        win.position.set(-70 + j * 45, 25 + i * 20, 71); g.add(win);
      }
      const cams = addCameras(g, 180, 140, 80);
      scene.add(g);
      clickable.push({ object: g, type: "school", name: "High School", cams });
      placeBorder(x, z, 220, 180, 0x1a5490);
    }

    function buildHospital(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(160, 90, 160), mat(0xf0f0f0, 0.7, 0.15)); base.position.y = 45; g.add(base);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(80, 130, 80), mat(0xe8e8e8, 0.7, 0.15)); tower.position.y = 65; g.add(tower);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(170, 5, 170), mat(0xc0392b, 0.5)); roof.position.y = 92; g.add(roof);
      const redCross = new THREE.Mesh(new THREE.BoxGeometry(60, 15, 2), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 2 }));
      redCross.position.set(0, 60, 82); g.add(redCross);
      const cross2 = new THREE.Mesh(new THREE.BoxGeometry(15, 60, 2), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 2 }));
      cross2.position.set(0, 60, 82); g.add(cross2);
      const cams = addCameras(g, 160, 160, 90, 0xff4444);
      scene.add(g);
      clickable.push({ object: g, type: "hospital", name: "Hospital", cams });
      placeBorder(x, z, 200, 200, 0xc0392b);
    }

    function buildBank(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(120, 150, 120), mat(0x6a3a8a, 0.35, 0.55)); base.position.y = 75; g.add(base);
      const glass = new THREE.MeshStandardMaterial({ color: 0x2ac8ff, emissive: 0x2ac8ff, emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.1, transparent: true, opacity: 0.7 });
      for (let i = 1; i <= 6; i++) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(122, 3, 122), glass);
        band.position.y = 10 + i * 22; g.add(band);
      }
      const cap = new THREE.Mesh(new THREE.BoxGeometry(130, 8, 130), mat(0x2a2a35, 0.5, 0.6)); cap.position.y = 154; g.add(cap);
      const cams = addCameras(g, 120, 120, 150, 0xf39c12);
      scene.add(g);
      clickable.push({ object: g, type: "bank", name: "State Bank", cams });
      placeBorder(x, z, 160, 160, 0x8e44ad);
    }

    function buildFarm(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const barn = new THREE.Mesh(new THREE.BoxGeometry(140, 50, 100), mat(0xa83a2a, 0.7)); barn.position.y = 25; g.add(barn);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(110, 40, 4), mat(0x6a3a2a, 0.6)); roof.rotation.y = Math.PI / 4; roof.position.y = 70; g.add(roof);
      // crop fields
      const cropMat = new THREE.MeshStandardMaterial({ color: 0x4a9d3a, roughness: 0.9 });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        const field = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 30), cropMat);
        field.position.set(-180 + c * 60, 9, 100 + r * 50); g.add(field);
      }
      const cams = addCameras(g, 140, 100, 60, 0x27ae60);
      scene.add(g);
      clickable.push({ object: g, type: "farm", name: "Eco Farm", cams });
      placeBorder(x, z, 240, 260, 0x27ae60);
    }

    function buildEventHall(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const body = new THREE.Mesh(new THREE.BoxGeometry(200, 70, 160), mat(0xd4a017, 0.55, 0.35)); body.position.y = 35; g.add(body);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(150, 40, 4), mat(0x8a6a17, 0.6)); roof.rotation.y = Math.PI / 4; roof.position.y = 90; g.add(roof);
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 20, 20, 1, false, 0, Math.PI), mat(0xb8860a, 0.6));
      arch.rotation.z = Math.PI / 2; arch.rotation.y = Math.PI / 2; arch.position.set(0, 70, 0); g.add(arch);
      const cams = addCameras(g, 200, 160, 70, 0xd4a017);
      scene.add(g);
      clickable.push({ object: g, type: "hall", name: "Event Hall", cams });
      placeBorder(x, z, 240, 200, 0xd4a017);
    }

    function buildCultureCenter(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const body = new THREE.Mesh(new THREE.BoxGeometry(180, 70, 140), mat(0xc98a3a, 0.5, 0.4)); body.position.y = 35; g.add(body);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(70, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xa86a2a, 0.5)); dome.position.y = 70; g.add(dome);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(8, 30, 8), mat(0xf39c12, 0.5, 0.6)); spire.position.y = 145; g.add(spire);
      // columns
      for (let i = 0; i < 4; i++) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 60, 12), mat(0xe8d5b0, 0.6, 0.2));
        col.position.set(-60 + i * 40, 30, 72); g.add(col);
      }
      const cams = addCameras(g, 180, 140, 70, 0xf39c12);
      scene.add(g);
      clickable.push({ object: g, type: "culture", name: "Culture Center", cams });
      placeBorder(x, z, 220, 180, 0xf39c12);
    }

    function buildPoliceStation(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const body = new THREE.Mesh(new THREE.BoxGeometry(140, 70, 140), mat(0x2a3a6a, 0.4, 0.4)); body.position.y = 35; g.add(body);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(150, 4, 150), mat(0x1a2a4a, 0.5)); roof.position.y = 72; g.add(roof);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 12), new THREE.MeshStandardMaterial({ color: 0x3388ff, emissive: 0x3388ff, emissiveIntensity: 5 }));
      beacon.position.y = 82; g.add(beacon);
      const siren = new THREE.Mesh(new THREE.SphereGeometry(4, 10, 10), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 5 }));
      siren.position.set(-12, 78, 0); g.add(siren);
      const cams = addCameras(g, 140, 140, 70, 0x3388ff);
      scene.add(g);
      clickable.push({ object: g, type: "police", name: "Police Station", cams });
      placeBorder(x, z, 180, 180, 0x3388ff);
    }

    function buildFireStation(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const body = new THREE.Mesh(new THREE.BoxGeometry(150, 70, 130), mat(0xa02a2a, 0.5, 0.4)); body.position.y = 35; g.add(body);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(158, 4, 138), mat(0x6a1a1a, 0.5)); roof.position.y = 72; g.add(roof);
      for (let i = 0; i < 3; i++) {
        const door = new THREE.Mesh(new THREE.BoxGeometry(26, 46, 4), new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff4444, emissiveIntensity: 2 }));
        door.position.set(-42 + i * 42, 28, 66); g.add(door);
      }
      const cams = addCameras(g, 150, 130, 70, 0xff4444);
      scene.add(g);
      clickable.push({ object: g, type: "fire", name: "Fire Station", cams });
      placeBorder(x, z, 190, 170, 0xff4444);
    }

    function buildLibrary(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const body = new THREE.Mesh(new THREE.BoxGeometry(140, 80, 140), mat(0x8a6a3a, 0.5, 0.3)); body.position.y = 40; g.add(body);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(60, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xa88a4a, 0.4, 0.35)); dome.position.y = 80; g.add(dome);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffdd66, emissive: 0xffdd66, emissiveIntensity: 4 }));
      beacon.position.y = 142; g.add(beacon);
      const cams = addCameras(g, 140, 140, 80, 0xffdd66);
      scene.add(g);
      clickable.push({ object: g, type: "library", name: "Library", cams });
      placeBorder(x, z, 180, 180, 0xffdd66);
    }

    function buildDataCenter(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(140, 80, 140), mat(0x1a4a6a, 0.35, 0.5)); base.position.y = 40; g.add(base);
      const glass = new THREE.MeshStandardMaterial({ color: 0x2ac8ff, emissive: 0x2ac8ff, emissiveIntensity: 1.8, transparent: true, opacity: 0.65 });
      for (let i = 0; i < 3; i++) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(142, 3, 142), glass);
        band.position.y = 15 + i * 22; g.add(band);
      }
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12), new THREE.MeshStandardMaterial({ color: 0x66e5ff, emissive: 0x33dfff, emissiveIntensity: 5 }));
      beacon.position.y = 88; g.add(beacon);
      const cams = addCameras(g, 140, 140, 80, 0x2ac8ff);
      scene.add(g);
      clickable.push({ object: g, type: "dataCenter", name: "Data Center", cams });
      placeBorder(x, z, 180, 180, 0x2ac8ff);
    }

    function buildTelecomTower(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(80, 3, 80), mat(0x2a2a3a, 0.8)); base.position.y = 1.5; g.add(base);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(2, 4, 180, 6), mat(0xb0b8bc, 0.4, 0.7)); tower.position.y = 90; g.add(tower);
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(10, 0.8, 6, 16), new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff3333, emissiveIntensity: 4 }));
        ring.rotation.x = Math.PI / 2; ring.position.y = 50 + i * 40; g.add(ring);
      }
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 6 }));
      beacon.position.y = 185; g.add(beacon);
      const cams = addCameras(g, 80, 80, 180, 0xff3333);
      scene.add(g);
      clickable.push({ object: g, type: "telecom", name: "Telecom Tower", cams });
      placeBorder(x, z, 100, 100, 0xcc2222);
    }

    function buildWaterTower(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      for (const lx of [-25, 25]) for (const lz of [-25, 25]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 100, 6), mat(0x8a9aa8, 0.4, 0.6));
        leg.position.set(lx, 50, lz); g.add(leg);
      }
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(35, 35, 50, 16), mat(0x4a9ac8, 0.3, 0.5)); tank.position.y = 125; g.add(tank);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(38, 20, 16), mat(0x2a7aa8, 0.3, 0.5)); cap.position.y = 160; g.add(cap);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 10), new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 5 }));
      beacon.position.y = 172; g.add(beacon);
      const cams = addCameras(g, 60, 60, 150, 0x22cfff);
      scene.add(g);
      clickable.push({ object: g, type: "waterTower", name: "Water Tower", cams });
      placeBorder(x, z, 80, 80, 0x22cfff);
    }

    function buildEVStation(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(120, 1, 120), mat(0x2a3a2e, 0.9)); pad.position.y = 0.5; g.add(pad);
      for (let i = 0; i < 4; i++) {
        const px = (i - 1.5) * 30;
        const post = new THREE.Mesh(new THREE.BoxGeometry(6, 35, 6), mat(0x2ecc71, 0.4, 0.5)); post.position.set(px, 18, 0); g.add(post);
        const head = new THREE.Mesh(new THREE.BoxGeometry(12, 10, 12), new THREE.MeshStandardMaterial({ color: 0x0a2a1a, emissive: 0x2ecc71, emissiveIntensity: 3 }));
        head.position.set(px, 40, 0); g.add(head);
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(140, 2, 50), mat(0x0a3a1a, 0.5)); roof.position.y = 60; g.add(roof);
      const cams = addCameras(g, 120, 120, 60, 0x2ecc71);
      scene.add(g);
      clickable.push({ object: g, type: "ev", name: "EV Charging", cams });
      placeBorder(x, z, 140, 140, 0x2ecc71);
    }

    function buildParking(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(200, 2, 200), mat(0x3a3a3a, 0.95)); pad.position.y = 1; g.add(pad);
      const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      for (let i = 0; i < 5; i++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 50), lineMat);
        line.position.set(-70 + i * 35, 2.3, 0); g.add(line);
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(210, 3, 210), new THREE.MeshStandardMaterial({ color: 0x2a3a5a, emissive: 0x3388ff, emissiveIntensity: 1.2, transparent: true, opacity: 0.8 }));
      roof.position.y = 80; g.add(roof);
      for (const cx of [-100, 100]) for (const cz of [-100, 100]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 80, 8), mat(0x4a5a6a, 0.4, 0.5));
        pillar.position.set(cx, 40, cz); g.add(pillar);
      }
      const cams = addCameras(g, 200, 200, 80, 0x3388ff);
      scene.add(g);
      clickable.push({ object: g, type: "parking", name: "Smart Parking", cams });
      placeBorder(x, z, 240, 240, 0x3388ff);
    }

    function buildHelipad(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(70, 70, 4, 32), mat(0x3a4a5a, 0.7, 0.4)); pad.position.y = 2; g.add(pad);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(50, 3, 8, 32), new THREE.MeshStandardMaterial({ color: 0xffdd22, emissive: 0xffdd22, emissiveIntensity: 4 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 4.5; g.add(ring);
      const cams = addCameras(g, 140, 140, 20, 0xffdd22);
      scene.add(g);
      clickable.push({ object: g, type: "helipad", name: "Helipad", cams });
      placeBorder(x, z, 160, 160, 0xffdd22);
    }

    // ============ SMART HOME ============
    function buildSmartHome(cx, cz, name, wallColor, roofColor) {
      const g = new THREE.Group(); g.position.set(cx, 5, cz);
      const base = new THREE.Mesh(new THREE.BoxGeometry(90, 3, 90), mat(0x5a5a5a, 0.9)); base.position.y = 1.5; g.add(base);
      const body = new THREE.Mesh(new THREE.BoxGeometry(70, 45, 65), mat(wallColor, 0.7, 0.1)); body.position.y = 25.5; g.add(body);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(55, 30, 4), mat(roofColor, 0.6, 0.2));
      roof.rotation.y = Math.PI / 4; roof.position.y = 63; g.add(roof);
      // Door
      const door = new THREE.Mesh(new THREE.BoxGeometry(14, 28, 3), mat(0x5a2a1a, 0.6));
      door.position.set(0, 17, 33); g.add(door);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), mat(0xd4af37, 0.3, 0.9));
      knob.position.set(5, 17, 35); g.add(knob);
      // Windows
      const winMat = new THREE.MeshStandardMaterial({ color: 0x9adfff, emissive: 0x66aaff, emissiveIntensity: 1.8, transparent: true, opacity: 0.85 });
      for (const wx of [-22, 22]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(14, 14, 2), winMat);
        win.position.set(wx, 32, 33); g.add(win);
      }
      // Rooftop solar panel
      const solar = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 45), new THREE.MeshStandardMaterial({ color: 0x082c4b, roughness: 0.2, metalness: 0.8, emissive: 0x0a3a5a, emissiveIntensity: 1 }));
      solar.rotation.x = -0.15; solar.position.y = 55; g.add(solar);
      // Rooftop WIND TURBINE
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.4, 25, 8), mat(0xeeeeee, 0.5, 0.3));
      pole.position.y = 78; g.add(pole);
      const hub = new THREE.Mesh(new THREE.SphereGeometry(2, 10, 10), mat(0xcccccc, 0.4, 0.5));
      hub.position.y = 91; g.add(hub);
      const blades = new THREE.Group(); blades.position.y = 91;
      for (let i = 0; i < 3; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.8, 14, 0.4), mat(0xffffff, 0.5, 0.3));
        blade.position.y = 7; blade.rotation.z = (i / 3) * Math.PI * 2; blades.add(blade);
      }
      g.add(blades);
      s.drones.push({ obj: blades, type: "homeTurbine", spin: 3.5 });
      // Name sign
      const c = document.createElement("canvas"); c.width = 512; c.height = 128;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#0a1e10"; ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = "#22c866"; ctx.lineWidth = 6; ctx.strokeRect(8, 8, 496, 112);
      ctx.fillStyle = "#6aff9d"; ctx.font = "bold 50px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(name, 256, 60);
      ctx.fillStyle = "#7fe3ff"; ctx.font = "500 22px Arial";
      ctx.fillText("SMART HOME", 256, 100);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(50, 12), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      sign.position.set(0, 66, 34); g.add(sign);
      const cams = addCameras(g, 70, 65, 45, 0x22c866);
      scene.add(g);
      clickable.push({ object: g, type: "smartHome", name, cams });
      placeBorder(cx, cz, 110, 110, 0x22c866);
    }

    // ============ VERTICAL FARM ============
    const cropMeshes = [];
    function buildVerticalFarm(cx, cz, count = 4) {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const ax = cx + Math.cos(angle) * 120;
        const az = cz + Math.sin(angle) * 120;
        const g = new THREE.Group(); g.position.set(ax, 5, az);
        const levels = 10, levelH = 12, towerH = levels * levelH + 15;
        const core = new THREE.Mesh(new THREE.CylinderGeometry(14, 18, towerH, 10), mat(0x1c3a2e, 0.5, 0.6));
        core.position.y = towerH / 2; g.add(core);
        // Crops on each level
        for (let l = 0; l < levels; l++) {
          const y = 15 + l * levelH;
          const tray = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 2, 12), mat(0x14452a, 0.8));
          tray.position.y = y; g.add(tray);
          const ring = new THREE.Mesh(new THREE.TorusGeometry(23, 1, 6, 18), new THREE.MeshStandardMaterial({ color: 0x22c866, emissive: 0x22c866, emissiveIntensity: 3 }));
          ring.rotation.x = Math.PI / 2; ring.position.y = y + 2; g.add(ring);
          for (let k = 0; k < 8; k++) {
            const a2 = (k / 8) * Math.PI * 2;
            const plant = new THREE.Group();
            plant.position.set(Math.cos(a2) * 20, y + 3, Math.sin(a2) * 20);
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 6), mat(0x2a7a2a, 0.9)); stem.position.y = 1.5; plant.add(stem);
            const leafMat = new THREE.MeshStandardMaterial({ color: 0x3ab54a, roughness: 0.9, emissive: 0x0a3a1a, emissiveIntensity: 0.5 });
            const leaves = new THREE.Group();
            for (let lf = 0; lf < 4; lf++) {
              const leaf = new THREE.Mesh(new THREE.SphereGeometry(2, 6, 5), leafMat);
              leaf.position.set(Math.cos(lf * 1.57) * 2, 2 + lf * 0.4, Math.sin(lf * 1.57) * 2);
              leaf.scale.set(1, 0.6, 1); leaves.add(leaf);
            }
            plant.add(leaves);
            const fruit = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshStandardMaterial({ color: 0x2a8a2a, roughness: 0.6, emissive: 0x0a3a1a, emissiveIntensity: 0.4 }));
            fruit.position.y = 3.5; plant.add(fruit);
            g.add(plant);
            cropMeshes.push({ plant, stem, leaves, fruit, grow: Math.random() * Math.PI * 2 });
          }
        }
        // Magenta LED
        const ledMat = new THREE.MeshStandardMaterial({ color: 0xff4adf, emissive: 0xff4adf, emissiveIntensity: 5 });
        s.borderMats.push(ledMat);
        const topLED = new THREE.Mesh(new THREE.TorusGeometry(20, 2, 8, 24), ledMat);
        topLED.rotation.x = Math.PI / 2; topLED.position.y = towerH + 6; g.add(topLED);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 12), new THREE.MeshStandardMaterial({ color: 0xff4adf, emissive: 0xff4adf, emissiveIntensity: 6 }));
        beacon.position.y = towerH + 15; g.add(beacon);
        const cams = addCameras(g, 40, 40, towerH, 0xff4adf);
        scene.add(g);
        clickable.push({ object: g, type: "verticalFarm", name: `Vertical Farm ${i + 1}`, cams });
      }
      placeBorder(cx, cz, 320, 320, 0x2a8a4a);
    }

    // ============ POWER SUPPLY ZONE ============
    function buildPowerZone(cx, cz) {
      const g = new THREE.Group(); g.position.set(cx, 5, cz);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(600, 1, 500), mat(0x2a3238, 0.95)); pad.position.y = 4.5; g.add(pad);
      // Solar panels
      const solarMat = new THREE.MeshStandardMaterial({ color: 0x082c4b, roughness: 0.15, metalness: 0.8, emissive: 0x063b62, emissiveIntensity: 1.0 });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 30), solarMat);
        p.rotation.x = -0.3; p.position.set(-200 + c * 60, 8, -150 + r * 60); g.add(p);
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 4, 6), mat(0x555a5e, 0.5));
        leg.position.set(-200 + c * 60, 6, -150 + r * 60); g.add(leg);
      }
      // Wind turbines
      const turbTower = new THREE.CylinderGeometry(0.6, 1, 50, 6);
      const turbBlade = new THREE.BoxGeometry(1.5, 20, 0.6);
      for (let i = 0; i < 4; i++) {
        const tx = 100 + (i % 2) * 100;
        const tz = -100 + Math.floor(i / 2) * 200;
        const tg = new THREE.Group(); tg.position.set(tx, 5, tz);
        const t = new THREE.Mesh(turbTower, mat(0xeeeeee, 0.4, 0.3)); t.position.y = 25; tg.add(t);
        const blades = new THREE.Group(); blades.position.y = 50;
        for (let b = 0; b < 3; b++) {
          const bl = new THREE.Mesh(turbBlade, mat(0xffffff, 0.4, 0.3));
          bl.position.y = 10; bl.rotation.z = (b / 3) * Math.PI * 2; blades.add(bl);
        }
        tg.add(blades); g.add(tg);
        s.drones.push({ obj: blades, type: "wind", spin: 2.4 });
      }
      // Battery storage
      const batMat = mat(0x2a3a4a, 0.5, 0.6);
      for (let i = 0; i < 6; i++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(24, 30, 30), batMat);
        b.position.set(-100 + i * 35, 20, 180); g.add(b);
        const top = new THREE.Mesh(new THREE.BoxGeometry(22, 3, 28), new THREE.MeshStandardMaterial({ color: 0x22ff9d, emissive: 0x22ff9d, emissiveIntensity: 3 }));
        top.position.set(-100 + i * 35, 36, 180); g.add(top);
      }
      const cams = addCameras(g, 600, 500, 60, 0xffdd22);
      scene.add(g);
      clickable.push({ object: g, type: "power", name: "Power Supply Zone", cams });
      placeBorder(cx, cz, 640, 540, 0xffdd22);
    }

    // ============ FILTRATION SYSTEM ============
    function buildFiltration(cx, cz) {
      const g = new THREE.Group(); g.position.set(cx, 5, cz);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(400, 1, 400), mat(0x1a2836, 0.95)); pad.position.y = 4.5; g.add(pad);
      // 3x3 tanks
      const tankColors = [0x6b4a2f, 0x8a7a4a, 0x4a8a5a, 0x4ac8e0, 0x6ab0d0, 0x3aa0d0, 0x9a6aff, 0x22cfff, 0x2ecc71];
      const tankMeshes = [];
      for (let i = 0; i < 9; i++) {
        const r = Math.floor(i / 3), c = i % 3;
        const tx = (c - 1) * 90, tz = (r - 1) * 90;
        const tankMat = new THREE.MeshStandardMaterial({ color: tankColors[i], emissive: tankColors[i], emissiveIntensity: 0.6, transparent: true, opacity: 0.85 });
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(22, 24, 40, 16), tankMat);
        tank.position.set(tx, 25, tz); g.add(tank);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), tankMat);
        cap.position.set(tx, 45, tz); g.add(cap);
        const water = new THREE.Mesh(new THREE.CylinderGeometry(19, 19, 1, 16), new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 2, transparent: true, opacity: 0.8 }));
        water.position.set(tx, 15, tz); g.add(water);
        tankMeshes.push({ tank, water, baseY: 15, tx, tz, color: tankColors[i] });
        // Sensor
        const sensor = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 3), mat(0xffd15a, 0.4, 0.5));
        sensor.position.set(tx + 24, 45, tz); g.add(sensor);
        const sensorLight = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 3 }));
        sensorLight.position.set(tx + 24, 48, tz); g.add(sensorLight);
      }
      // Real pipes connecting tanks
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 1.5, metalness: 0.7, roughness: 0.2 });
      for (let i = 0; i < 8; i++) {
        const a = tankMeshes[i], b = tankMeshes[i + 1];
        const mx = (a.tx + b.tx) / 2, mz = (a.tz + b.tz) / 2;
        const dx = b.tx - a.tx, dz = b.tz - a.tz;
        const len = Math.sqrt(dx * dx + dz * dz);
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, len, 10), pipeMat);
        pipe.rotation.z = Math.PI / 2;
        pipe.rotation.y = -Math.atan2(dz, dx);
        pipe.position.set(mx, 35, mz);
        g.add(pipe);
      }
      // Clean water reservoir
      const reservoir = new THREE.Mesh(new THREE.CylinderGeometry(45, 50, 40, 24), mat(0x0a4a6a, 0.35, 0.5));
      reservoir.position.set(-180, 25, 0); g.add(reservoir);
      const resCap = new THREE.Mesh(new THREE.SphereGeometry(48, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x0a4a6a, 0.35, 0.5));
      resCap.position.set(-180, 45, 0); g.add(resCap);
      const cams = addCameras(g, 400, 400, 60, 0x22cfff);
      scene.add(g);
      clickable.push({ object: g, type: "filtration", name: "Filtration System", cams, tanks: tankMeshes });
      placeBorder(cx, cz, 440, 440, 0x22cfff);
    }

    // ============ TRAFFIC SYSTEM ============
    const trafficLights = []; s.trafficLights = trafficLights;
    function tl(x, z, road) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 14, 6), darkMat); pole.position.y = 7; g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 0.4), darkMat); arm.position.set(2, 13.5, 0); g.add(arm);
      const box = new THREE.Mesh(new THREE.BoxGeometry(3, 9, 3), darkMat); box.position.set(4, 13.5, 0); g.add(box);
      const light = (color, y) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(1.2, 14, 14), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0 }));
        m.position.set(4, y, 1.5); g.add(m);
        const halo = new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 14), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
        halo.position.set(4, y, 1.5); g.add(halo);
        return { core: m, halo };
      };
      const r = light(0xff2222, 17), yL = light(0xffcc22, 13.5), gr = light(0x22ff66, 10);
      const pl = new THREE.PointLight(0xffcc22, 0, 30); pl.position.set(4, 13.5, 2); g.add(pl);
      scene.add(g);
      trafficLights.push({ r, y: yL, gr, pl, road });
    }
    roadXs.forEach((x) => roadZs.forEach((z) => tl(x, z, ((roadXs.indexOf(x) + roadZs.indexOf(z)) % 4) + 1)));

    // ============ AI TRAFFIC CONTROLLER ============
    const controller = new THREE.Group(); controller.position.set(0, 5, 0);
    const cBase = new THREE.Mesh(new THREE.CylinderGeometry(40, 46, 3, 24), mat(0x142f3b, 0.3, 0.4)); cBase.position.y = 1.5; controller.add(cBase);
    const cRing = new THREE.Mesh(new THREE.TorusGeometry(38, 1, 8, 36), new THREE.MeshStandardMaterial({ color: 0x32dfff, emissive: 0x18cfff, emissiveIntensity: 3 }));
    cRing.rotation.x = Math.PI / 2; cRing.position.y = 3; controller.add(cRing);
    const cTower = new THREE.Mesh(new THREE.BoxGeometry(18, 30, 18), mat(0x185a72, 0.3, 0.35)); cTower.position.y = 17; controller.add(cTower);
    const cScreen = new THREE.Mesh(new THREE.BoxGeometry(15, 10, 0.5), new THREE.MeshStandardMaterial({ color: 0x03141b, emissive: 0x21cfff, emissiveIntensity: 3 }));
    cScreen.position.set(0, 17, 9.5); controller.add(cScreen);
    const cRadar = new THREE.Mesh(new THREE.TorusGeometry(6, 0.5, 8, 32), new THREE.MeshStandardMaterial({ color: 0x61e7ff, emissive: 0x23dfff, emissiveIntensity: 3 }));
    cRadar.rotation.x = Math.PI / 2; cRadar.position.y = 40; controller.add(cRadar);
    const cBeacon = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 12), new THREE.MeshStandardMaterial({ color: 0x66e5ff, emissive: 0x33dfff, emissiveIntensity: 4 }));
    cBeacon.position.y = 48; controller.add(cBeacon);
    s.drones.push({ obj: cRadar, type: "radar", spin: 1.7 });
    s.drones.push({ obj: cBeacon, type: "pulse", base: cBeacon });
    const cCams = addCameras(controller, 30, 30, 30, 0x22cfff);
    scene.add(controller);
    clickable.push({ object: controller, type: "trafficController", name: "AI Traffic Controller", cams: cCams });

    // ============ DRONES (4) ============
    const droneObjs = [];
    function makeDrone(color) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 8), mat(0x1a1a1a, 0.5, 0.4)); g.add(body);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(2, 10, 10), new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 4 }));
      lens.position.y = -2; g.add(lens);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x333, transparent: true, opacity: 0.6 });
      for (const [bx, bz] of [[-5, -5], [5, -5], [5, 5], [-5, 5]]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 6), mat(0x222, 0.5)); arm.position.set(bx, 1, bz); g.add(arm);
        const blade = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.3, 12), bladeMat);
        blade.position.set(bx, 2, bz); g.add(blade);
      }
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 10), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 5 }));
      beacon.position.y = 3; g.add(beacon);
      scene.add(g);
      return g;
    }
    for (let i = 0; i < 4; i++) {
      const color = [0xff2222, 0x22ff66, 0x22ccff, 0xffdd22][i];
      const d = makeDrone(color);
      droneObjs.push({ obj: d, angle: (i / 4) * Math.PI * 2, radius: 500, height: 200, color });
    }
    s.drones.push(...droneObjs.map((d) => ({ obj: d.obj, type: "drone", data: d })));

    // ============ BUILD ALL PLACES ============
    buildSchool(-1200, -1200);
    buildHospital(1200, -1200);
    buildBank(1200, 1200);
    buildFarm(-1200, 1200);
    buildEventHall(-200, -1500);
    buildCultureCenter(200, 1500);
    buildPoliceStation(1400, -200);
    buildFireStation(-1400, -200);
    buildLibrary(1400, 200);
    buildDataCenter(-1000, -400);
    buildTelecomTower(1000, -400);
    buildWaterTower(-1000, 400);
    buildEVStation(1000, 400);
    buildParking(-400, -1000);
    buildHelipad(400, 1000);

    // Smart homes
    const homeNames = ["HOME-01", "HOME-02", "HOME-03", "HOME-04", "HOME-05", "HOME-06"];
    const wallCols = [0xe8d5b0, 0xd5c0a0, 0xe8d0b8, 0xd0b890, 0xe0cfa8, 0xc8b090];
    const roofCols = [0x8a3a3a, 0x6a3a5a, 0x5a4a3a, 0x7a3a3a, 0x8a4a3a, 0x6a4a5a];
    const homePositions = [[-1800, -1800], [-1700, -1800], [-1600, -1800], [-1800, -1700], [-1700, -1700], [-1600, -1700]];
    homePositions.forEach((p, i) => buildSmartHome(p[0], p[1], homeNames[i], wallCols[i], roofCols[i]));

    // Vertical farm
    buildVerticalFarm(1800, -1800, 4);
    // Power zone
    buildPowerZone(-1800, 1800);
    // Filtration
    buildFiltration(1800, 1800);

    // ============ CARS ============
    const cityCars = [];
    function makeCar(color) {
      const g = new THREE.Group();
      const bMat = mat(color, 0.4, 0.5);
      const body = new THREE.Mesh(new THREE.BoxGeometry(22, 5, 9), bMat); body.position.y = 3.5; g.add(body);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 8), new THREE.MeshStandardMaterial({ color: 0x1a3a4a, emissive: 0x0a2535, emissiveIntensity: 0.8, metalness: 0.5, roughness: 0.15 }));
      cabin.position.set(-1, 7.5, 0); g.add(cabin);
      const wGeo = new THREE.CylinderGeometry(2, 2, 1.5, 10);
      for (const [wx, wz] of [[7, 4.3], [7, -4.3], [-7, 4.3], [-7, -4.3]]) {
        const w = new THREE.Mesh(wGeo, mat(0x0c1012, 0.6)); w.rotation.x = Math.PI / 2; w.position.set(wx, 2.4, wz); g.add(w);
      }
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.7), new THREE.MeshStandardMaterial({ color: 0xfff8e0, emissive: 0xfff8e0, emissiveIntensity: 3 }));
      head.position.set(11, 3.8, 3); g.add(head);
      const head2 = head.clone(); head2.position.z = -3; g.add(head2);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.7), new THREE.MeshStandardMaterial({ color: 0xff1e1e, emissive: 0xff1010, emissiveIntensity: 3 }));
      tail.position.set(-11, 3.8, 3); g.add(tail);
      const tail2 = tail.clone(); tail2.position.z = -3; g.add(tail2);
      g.userData.tailLights = [tail.material, tail2.material];
      return g;
    }

    const carData = [
      { road: 0, lane: 0, dir: 1, progress: 0.1, color: 0xff2222 },
      { road: 1, lane: 0, dir: -1, progress: 0.35, color: 0x22ccff },
      { road: 2, lane: 0, dir: 1, progress: 0.55, color: 0x22ff66 },
      { road: 3, lane: 0, dir: -1, progress: 0.8, color: 0xffdd22 },
    ];
    carData.forEach((c) => {
      const m = makeCar(c.color); scene.add(m);
      cityCars.push({ car: m, roadIndex: c.road, dir: c.dir, progress: c.progress, speed: CAR_SPEED, baseSpeed: CAR_SPEED, waiting: false });
    });
    s.cityCars = cityCars;

    function getRoadPos(roadIndex, progress, dir) {
      const isX = roadIndex < 2;
      const offset = (dir > 0 ? 20 : -20);
      const p = (progress % 1 + 1) % 1;
      if (isX) {
        const x = -ROAD_HALF_LEN + p * (ROAD_HALF_LEN * 2);
        return { x, z: roadZs[roadIndex] + offset, angle: dir > 0 ? 0 : Math.PI };
      }
      const z = -ROAD_HALF_LEN + p * (ROAD_HALF_LEN * 2);
      return { x: roadXs[roadIndex - 2] + offset, z, angle: dir > 0 ? Math.PI / 2 : -Math.PI / 2 };
    }

    // ============ TRAFFIC SYSTEM (4 phases) ============
    const trafficSystem = {
      phase: 1, inYellow: false, elapsed: 0, yellowElapsed: 0,
      PHASE_DURATION: 9, YELLOW_DURATION: 2.5,
      currentGreen: [1, 2], currentRed: [3, 4],
    };
    s.trafficSystem = trafficSystem;

    function tickTraffic(delta) {
      const sys = trafficSystem;
      sys.elapsed += delta;
      if (sys.inYellow) {
        sys.yellowElapsed += delta;
        if (sys.yellowElapsed >= sys.YELLOW_DURATION) {
          sys.inYellow = false; sys.yellowElapsed = 0; sys.elapsed = 0;
          if (sys.phase === 1) { sys.phase = 2; sys.currentGreen = [3, 4]; sys.currentRed = [1, 2]; }
          else { sys.phase = 1; sys.currentGreen = [1, 2]; sys.currentRed = [3, 4]; }
        }
      } else if (sys.elapsed >= sys.PHASE_DURATION) {
        sys.inYellow = true; sys.yellowElapsed = 0;
      }
    }
    function isGreen(r) { return !trafficSystem.inYellow && trafficSystem.currentGreen.includes(r); }
    function isYellow(r) { return trafficSystem.inYellow && (trafficSystem.currentGreen.includes(r) || trafficSystem.currentRed.includes(r)); }

    // ============ PEOPLE ============
    const people = []; s.people = people;
    function makePerson() {
      const g = new THREE.Group();
      const shirt = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0x1abc9c][Math.floor(Math.random() * 6)];
      const head = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 5), mat(0xf2c9a0, 0.9)); head.position.y = 6; g.add(head);
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.4, 1.2), mat(shirt, 0.85)); body.position.y = 3.6; g.add(body);
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.6, 0.7), mat(0x2c3e50, 0.85)); legL.position.set(-0.5, 1.3, 0); g.add(legL);
      const legR = legL.clone(); legR.position.x = 0.5; g.add(legR);
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.4, 0.5), mat(shirt, 0.85)); armL.position.set(-1.4, 3.6, 0); g.add(armL);
      const armR = armL.clone(); armR.position.x = 1.4; g.add(armR);
      return { g, legL, legR, armL, armR };
    }
    function spawnPeople(cx, cz, count, radius) {
      for (let i = 0; i < count; i++) {
        const p = makePerson();
        const a = Math.random() * Math.PI * 2;
        const r = radius * (0.5 + Math.random() * 0.5);
        p.g.position.set(cx + Math.cos(a) * r, 5, cz + Math.sin(a) * r); p.g.rotation.y = a;
        scene.add(p.g);
        people.push({ obj: p.g, legL: p.legL, legR: p.legR, armL: p.armL, armR: p.armR, cx, cz, r, angle: a, dir: Math.random() > 0.5 ? 1 : -1, speed: 0.006 + Math.random() * 0.008, phase: Math.random() * Math.PI * 2 });
      }
    }
    spawnPeople(-1200, -1200, 8, 150); spawnPeople(1200, -1200, 8, 150);
    spawnPeople(1200, 1200, 8, 150); spawnPeople(-1200, 1200, 8, 150);
    spawnPeople(0, 0, 6, 100);

    // ============ TREES ============
    const treeTrunkMat = mat(0x5a3d24, 0.95);
    const treeLeafMat = mat(0x2d6e3d, 0.9);
    const treeLeafMat2 = mat(0x3a8a4c, 0.9);
    function tree(x, z, sc = 1) {
      const g = new THREE.Group(); g.position.set(x, 5, z); g.scale.setScalar(sc);
      const t = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.8, 22, 6), treeTrunkMat); t.position.y = 11; g.add(t);
      const l = new THREE.Mesh(new THREE.SphereGeometry(14, 8, 6), treeLeafMat); l.position.y = 30; g.add(l);
      const l2 = new THREE.Mesh(new THREE.ConeGeometry(10, 22, 6), treeLeafMat2); l2.position.y = 42; g.add(l2);
      scene.add(g);
    }
    function isOnRoad(x, z) {
      for (const rz of roadZs) if (Math.abs(z - rz) < 90) return true;
      for (const rx of roadXs) if (Math.abs(x - rx) < 90) return true;
      return false;
    }
    for (let i = 0; i < 300; i++) {
      const x = (Math.random() - 0.5) * (CITY_HALF * 2 - 200);
      const z = (Math.random() - 0.5) * (CITY_HALF * 2 - 200);
      if (!isOnRoad(x, z) && Math.abs(x) > 200 && Math.abs(z) > 200) tree(x, z, 0.7 + Math.random() * 0.5);
    }

    // ============ CLICK HANDLER ============
    const onClick = (e) => {
      if (e.target !== renderer.domElement) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      for (const item of clickable) {
        const hit = raycaster.intersectObject(item.object, true);
        if (hit.length) {
          const info = BUILDING_INFO[item.type];
          if (info) setPlacePopup({ ...info, cameras: item.cams ? item.cams.length : 4 });
          return;
        }
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    // ============ LOGS ============
    const addLog = (msg) => {
      setLogs((prev) => [...prev.slice(-4), { t: new Date().toLocaleTimeString(), msg }]);
    };

    // ============ ANIMATION ============
    const clock = new THREE.Clock();
    let rafId, fc = 0;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.elapsedTime; fc++;

      // Traffic system
      tickTraffic(delta);

      // Cars movement
      cityCars.forEach((c) => {
        const road = c.roadIndex;
        // Stop line detection: intersect at center 0
        const p = ((c.progress % 1) + 1) % 1;
        const posAlong = -ROAD_HALF_LEN + p * (ROAD_HALF_LEN * 2);
        // if approaching stop line (center)
        const distToCenter = Math.abs(posAlong);
        const nearCenter = distToCenter < 100;
        let canGo = true;
        let targetSpeed = c.baseSpeed;
        // cross-road: road 0 uses sig 1&2 → green when phase1; road 1 uses sig 3&4 → green when phase2
        const mySignal = road < 2 ? (road === 0 ? 1 : 2) : (road === 2 ? 3 : 4);
        const green = isGreen(mySignal);
        const yellow = isYellow(mySignal);
        if (nearCenter && !green) {
          if (distToCenter < 50) { targetSpeed = 0; c.waiting = true; }
          else if (yellow) targetSpeed = c.baseSpeed * 0.5;
          else targetSpeed = c.baseSpeed * 0.4;
        } else {
          c.waiting = false;
        }
        c.speed += (targetSpeed - c.speed) * Math.min(1, delta * 3);
        c.progress += c.dir * c.speed;
        if (c.progress > 1) c.progress -= 1;
        if (c.progress < 0) c.progress += 1;
        const pos = getRoadPos(road, c.progress, c.dir);
        c.car.position.set(pos.x, CAR_Y, pos.z);
        c.car.rotation.y = pos.angle;
        // brake lights
        const bl = c.waiting;
        c.car.userData.tailLights.forEach((m) => { m.emissiveIntensity = bl ? 6 : 3; });
      });

      // Traffic lights brightness
      trafficLights.forEach((l) => {
        const green = isGreen(l.road), yellow = isYellow(l.road), red = !green && !yellow;
        const blink = 0.55 + 0.45 * Math.abs(Math.sin(t * 7));
        l.r.core.material.emissiveIntensity = 0;
        l.y.core.material.emissiveIntensity = 0;
        l.gr.core.material.emissiveIntensity = 0;
        l.r.halo.material.opacity = 0;
        l.y.halo.material.opacity = 0;
        l.gr.halo.material.opacity = 0;
        l.pl.intensity = 0;
        if (green) {
          l.gr.core.material.emissiveIntensity = 10 * blink;
          l.gr.halo.material.opacity = 0.9 * blink;
          l.pl.color.setHex(0x22ff66); l.pl.intensity = 2.5 * blink;
        } else if (yellow) {
          l.y.core.material.emissiveIntensity = 11 * blink;
          l.y.halo.material.opacity = 0.95 * blink;
          l.pl.color.setHex(0xffcc22); l.pl.intensity = 3 * blink;
        } else {
          l.r.core.material.emissiveIntensity = 10 * blink;
          l.r.halo.material.opacity = 0.9 * blink;
          l.pl.color.setHex(0xff2222); l.pl.intensity = 2.5 * blink;
        }
      });

      // Drones flying in circles
      droneObjs.forEach((d, i) => {
        d.angle += delta * 0.4;
        const x = Math.cos(d.angle) * d.radius;
        const z = Math.sin(d.angle) * d.radius;
        d.obj.position.set(x, d.height, z);
        d.obj.rotation.y = -d.angle + Math.PI / 2;
        d.obj.children.forEach((c) => { if (c.geometry && c.geometry.type === "CylinderGeometry") c.rotation.y = t * 20; });
        if (fc % 60 === 0 && i === 0) addLog(`🛸 Drone-${i + 1} scanning sector ${Math.floor(d.angle * 180 / Math.PI)}°`);
      });

      // Spin turbines, radar
      for (const d of s.drones) {
        if (d.type === "homeTurbine" || d.type === "wind") d.obj.rotation.z = t * d.spin;
        else if (d.type === "radar") d.obj.rotation.z = t * d.spin;
        else if (d.type === "pulse") d.obj.scale.setScalar(1 + Math.sin(t * 4) * 0.2);
      }

      // Vertical farm crop growth
      for (const c of cropMeshes) {
        const cycle = ((t * 0.25) + c.grow) % 1;
        const leafScale = 0.5 + Math.sin(cycle * Math.PI) * 0.9;
        c.leaves.scale.setScalar(leafScale);
        const fruitScale = 0.3 + cycle * 1.0;
        c.fruit.scale.setScalar(fruitScale);
        const hue = cycle < 0.5 ? 0.33 - cycle * 0.4 : 0.13 - (cycle - 0.5) * 0.4;
        const col = new THREE.Color().setHSL(Math.max(0, hue), 0.85, 0.5);
        c.fruit.material.color.copy(col);
        c.fruit.material.emissive.copy(col).multiplyScalar(0.3);
        c.stem.scale.y = 0.6 + cycle * 0.8;
      }

      // People walking
      for (const p of people) {
        p.angle += p.speed * p.dir;
        if (p.angle > Math.PI * 2) p.angle -= Math.PI * 2;
        if (p.angle < 0) p.angle += Math.PI * 2;
        p.obj.position.x = p.cx + Math.cos(p.angle) * p.r;
        p.obj.position.z = p.cz + Math.sin(p.angle) * p.r;
        p.obj.rotation.y = p.angle + (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
        const swing = Math.sin(t * 6 + p.phase) * 0.4;
        p.legL.rotation.x = swing; p.legR.rotation.x = -swing;
        p.armL.rotation.x = -swing * 0.7; p.armR.rotation.x = swing * 0.7;
      }

      // HUD update every 15 frames
      if (fc % 15 === 0) {
        setTrafficHUD({
          phase: trafficSystem.phase,
          inYellow: trafficSystem.inYellow,
          green: [...trafficSystem.currentGreen],
          red: [...trafficSystem.currentRed],
          density: cityCars.filter((c) => c.waiting).length > 2 ? "HIGH" : "LOW",
          drones: 4,
          cars: cityCars.length,
        });
      }

      // AI logs (drones → AI)
      if (fc % 180 === 0) addLog(`🤖 AI Traffic Manager: Roads ${trafficSystem.currentGreen.join(",")} GREEN`);
      if (fc % 240 === 0) addLog(`📡 Sensor grid: All zones reporting OK`);

      // Camera transition
      if (s.camTrans) {
        const now = performance.now();
        const e = now - s.camTrans.startTime;
        const tt = Math.min(e / s.camTrans.duration, 1);
        const ease = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2;
        camera.position.lerpVectors(s.camTrans.startPos, s.camTrans.targetPos, ease);
        controls.target.lerpVectors(s.camTrans.startLook, s.camTrans.targetLook, ease);
        if (tt >= 1) s.camTrans = null;
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

      {/* TOP BAR */}
      <div style={{
        position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
        background: "linear-gradient(135deg, rgba(6,20,35,0.95), rgba(12,35,55,0.9))",
        border: "1px solid rgba(34,207,255,0.55)", borderRadius: 14,
        padding: "10px 20px", color: "#fff", fontFamily: "system-ui, sans-serif",
        boxShadow: "0 0 40px rgba(34,207,255,0.35)",
        display: "flex", gap: 14, alignItems: "center", zIndex: 9999, backdropFilter: "blur(10px)"
      }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, color: "#22cfff" }}>🌐 SMART CITY 3D</div>
        <button style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(34,207,255,0.15)", border: "1px solid rgba(34,207,255,0.5)", color: "#bfefff", fontSize: 11, cursor: "pointer", fontWeight: 700 }} onClick={() => goToOverview()}>Overview</button>
        <button style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(34,207,255,0.15)", border: "1px solid rgba(34,207,255,0.5)", color: "#bfefff", fontSize: 11, cursor: "pointer", fontWeight: 700 }} onClick={() => goToTopDown()}>Top</button>
      </div>

      {/* LEFT — Places */}
      <div style={{
        position: "fixed", top: 80, left: 16, maxHeight: "80vh", overflowY: "auto",
        background: "linear-gradient(135deg, rgba(6,20,35,0.94), rgba(12,35,55,0.92))",
        border: "1px solid rgba(34,207,255,0.45)", borderRadius: 12, padding: "12px",
        color: "#fff", fontFamily: "system-ui, sans-serif", fontSize: 11, zIndex: 9999,
        backdropFilter: "blur(10px)", width: 200
      }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: "#7fe3ff", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>📍 Places</div>
        {PLACES.map((p) => (
          <button key={p.key} style={{
            width: "100%", textAlign: "left", padding: "6px 10px", margin: "2px 0",
            borderRadius: 8, background: "rgba(34,207,255,0.08)", border: "1px solid rgba(34,207,255,0.3)",
            color: "#bfefff", fontSize: 11, cursor: "pointer", fontWeight: 600
          }} onClick={() => goToPlace(p.key)}>{p.icon} {p.label}</button>
        ))}
      </div>

      {/* RIGHT — Traffic HUD */}
      <div style={{
        position: "fixed", top: 80, right: 16, width: 280,
        background: "linear-gradient(135deg, rgba(6,20,35,0.94), rgba(12,35,55,0.92))",
        border: "1px solid rgba(34,207,255,0.45)", borderRadius: 12, padding: "14px",
        color: "#fff", fontFamily: "system-ui, sans-serif", fontSize: 11, zIndex: 9999,
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: "#7fe3ff", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>🚦 AI Traffic Manager</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ color: "#8fd8f0" }}>Phase</span><b>{trafficHUD.phase} {trafficHUD.inYellow ? "(YELLOW)" : ""}</b>
        </div>
        {[1, 2, 3, 4].map((r) => {
          const green = trafficHUD.green.includes(r);
          const yellow = trafficHUD.inYellow && !green;
          const color = yellow ? "#ffcc22" : green ? "#22ff66" : "#ff2222";
          const label = yellow ? "YELLOW" : green ? "GREEN" : "RED";
          return (
            <div key={r} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "5px 8px", marginBottom: 4,
              background: color + "22", border: `1px solid ${color}80`, borderRadius: 6
            }}>
              <span style={{ color: "#b8e8ff" }}>Road {r}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}` }} />
                <b style={{ color, fontSize: 10 }}>{label}</b>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 8, fontSize: 10, color: "#7fe3ff", display: "flex", justifyContent: "space-between" }}>
          <span>🛸 Drones: <b style={{ color: "#22cfff" }}>{trafficHUD.drones}</b></span>
          <span>🚗 Cars: <b style={{ color: "#ffd15a" }}>{trafficHUD.cars}</b></span>
        </div>
      </div>

      {/* BOTTOM LEFT — AI logs */}
      <div style={{
        position: "fixed", bottom: 16, left: 16, width: 300,
        background: "linear-gradient(135deg, rgba(6,20,35,0.94), rgba(12,35,55,0.92))",
        border: "1px solid rgba(34,207,255,0.45)", borderRadius: 12, padding: "10px 12px",
        color: "#b8e8ff", fontFamily: "monospace", fontSize: 10, zIndex: 9999,
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: "#7fe3ff", textTransform: "uppercase", marginBottom: 6, fontWeight: 700, fontFamily: "system-ui" }}>📡 AI + Drone Feed</div>
        {logs.map((l, i) => (
          <div key={i} style={{ padding: "1px 0", color: l.msg.startsWith("🛸") ? "#22cfff" : l.msg.startsWith("🤖") ? "#6aff9d" : "#ffd15a" }}>[{l.t}] {l.msg}</div>
        ))}
      </div>

      {/* POPUP — Place info with animation */}
      {placePopup && (
        <div style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          background: "linear-gradient(135deg, rgba(6,20,35,0.98), rgba(12,35,55,0.96))",
          border: "2px solid #22cfff", borderRadius: 20, padding: "22px 28px",
          color: "#fff", fontFamily: "system-ui, sans-serif",
          boxShadow: "0 0 60px rgba(34,207,255,0.6)",
          zIndex: 99999, minWidth: 420, maxWidth: 540,
          backdropFilter: "blur(16px)",
          animation: "popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 44 }}>{placePopup.icon}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#22cfff" }}>{placePopup.title}</div>
                <div style={{ fontSize: 10, color: "#7fe3ff", letterSpacing: 2, textTransform: "uppercase", marginTop: 3 }}>{placePopup.type}</div>
              </div>
            </div>
            <button onClick={() => setPlacePopup(null)} style={{ background: "transparent", border: "none", color: "#7fe3ff", cursor: "pointer", fontSize: 22 }}>✕</button>
          </div>
          <div style={{ fontSize: 13, color: "#b8e8ff", marginBottom: 14, lineHeight: 1.6 }}>{placePopup.desc}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {placePopup.stats.map((st, i) => (
              <div key={i} style={{ background: "rgba(34,207,255,0.1)", border: "1px solid rgba(34,207,255,0.3)", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#8fd8f0" }}>{st[0]}</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>{st[1]}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(34,207,255,0.08)", borderRadius: 8, fontSize: 11, color: "#7fe3ff", textAlign: "center" }}>
            📹 {placePopup.cameras || 4} live cameras monitoring this location
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(34,207,255,0.4); border-radius: 3px; }
        button:hover { background: rgba(34,207,255,0.3) !important; }
      `}</style>
    </>
  );
});

export default SmartCity3D;
