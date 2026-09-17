// src/SmartCity3D.jsx
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const CITY_HALF = 3900;
const ROAD_HALF_LEN = 3800;
const GROUND_SIZE = 8200;

const CAR_Y = 5.2;
const CITY_CAR_SPEED = 0.006;
const INNER_CAR_SPEED = 0.008;
const INTERSECTION_BASE_SPEED = 0.08;

const BARRIER_ARM_LENGTH = 90;
const BARRIER_ARM_THICKNESS = 5;
const BARRIER_POLE_HEIGHT = 42;
const BARRIER_HINGE_Y = 30;
const BARRIER_OPEN_ANGLE = -Math.PI / 2.15;
const BARRIER_CLOSED_ANGLE = 0;
const BARRIER_ANIM_SPEED = 1.6;

const SECURITY_GATES_DEF = [
  { id: "SG-01", label: "North Entry Gate", axis: "z", sign: -1, offset: -30, stop: 150, hinge: 1 },
  { id: "SG-02", label: "South Entry Gate", axis: "z", sign: 1, offset: 30, stop: -150, hinge: 1 },
  { id: "SG-03", label: "East Entry Gate", axis: "x", sign: 1, offset: 30, stop: -150, hinge: -1 },
  { id: "SG-04", label: "West Entry Gate", axis: "x", sign: -1, offset: -30, stop: 150, hinge: -1 },
];

const BUILDING_INFO = {
  school: { title: "American High School", type: "EDUCATION", icon: "🏫", desc: "AI-powered classrooms, robotics lab, smart boards.", stats: [["👨‍🎓 Students","450"],["👩‍🏫 Teachers","32"],["📚 Classes","18"],["🤖 Robotics","Active"]] },
  hospital: { title: "Smart Hospital", type: "HEALTHCARE", icon: "🏥", desc: "24/7 emergency, AI diagnosis, robotic surgery.", stats: [["🏥 Patients","32"],["🚑 Ambulances","2"],["💊 ICU Beds","8"],["🩺 AI","Online"]] },
  society: { title: "BSS Smart Society", type: "RESIDENTIAL", icon: "🏘", desc: "IoT towers with solar power, AI security.", stats: [["🏠 Towers","12"],["👥 Residents","2,400"],["☀️ Solar","82%"],["🔒 Security","AI"]] },
  bank: { title: "Smart City State Bank", type: "FINANCIAL", icon: "🏦", desc: "Digital banking, AI fraud detection.", stats: [["💰 Txns","1,240/hr"],["🏧 ATMs","8"],["🔐 Security","Active"],["📈 Uptime","99.9%"]] },
  farm: { title: "Smart Eco Farm", type: "AGRICULTURE", icon: "🌾", desc: "IoT sensors, drip irrigation, drone monitoring.", stats: [["🌾 Crop","94%"],["💧 Moisture","68%"],["🚁 Drones","3"],["🌡️ Temp","24°C"]] },
  newHall: { title: "Liverpool Event Hall", type: "EVENT VENUE", icon: "🎪", desc: "Smart auditorium with adaptive lighting.", stats: [["🎪 Capacity","2,000"],["🎤 Events","3"],["💡 Lights","ON"],["🎵 Sound","Surround"]] },
  carWash: { title: "Car Wash · Gas Station", type: "AUTOMOTIVE", icon: "🚗", desc: "Automated wash, EV fast charging.", stats: [["🚗 Cars","87"],["⚡ EV","4"],["⛽ Pumps","6"],["💧 Recycle","78%"]] },
  powerCompany: { title: "City Power Supply Co.", type: "UTILITY", icon: "🔌", desc: "AI load balancing, smart substation.", stats: [["⚡ Load","68 MW"],["🔋 Reserve","22%"],["📊 Grid","Stable"],["🔌 Outages","0"]] },
  powerSupply: { title: "Power Supply Zone", type: "RENEWABLE", icon: "⚡", desc: "Solar + wind hybrid generation.", stats: [["☀️ Solar","42 MW"],["💨 Wind","28 MW"],["🔋 Batt","78%"],["⚡ Output","70 MW"]] },
  filtration: { title: "Filtration System", type: "WATER TREATMENT", icon: "💧", desc: "9-stage purification.", stats: [["💧 Processed","12M L/d"],["🧪 Purity","99.7%"],["🔬 Sensors","24"],["♻️ Recycle","82%"]] },
  fertilizer: { title: "AI Fertilizer System", type: "FERTILIZER", icon: "🌱", desc: "AI nutrient mixing, auto dosing.", stats: [["🌱 NPK","Optimal"],["🤖 AI","Active"],["🚚 Trucks","2"],["📊 Soil","94%"]] },
  wasteManagement: { title: "Waste Management", type: "MUNICIPAL", icon: "♻", desc: "Smart segregation, waste-to-energy.", stats: [["♻️ Recycled","68%"],["⚡ Energy","4.2 MW"],["🗑️ Trucks","3"],["📊 Bins","42%"]] },
  cultureCenter: { title: "Culture Center", type: "CULTURAL", icon: "🏛", desc: "Museums, galleries, VR tours.", stats: [["🎭 Visitors","320"],["🖼️ Exhibits","45"],["🎬 VR","Online"],["🎨 Workshops","2"]] },
  sewageCompany: { title: "Sewage & Gas Co.", type: "INDUSTRIAL", icon: "🏭", desc: "AI sewage treatment, biogas.", stats: [["🏭 Processed","8M L/d"],["💨 Biogas","2.1 MW"],["♻️ Recycle","75%"],["🔬 Quality","Clean"]] },
  scifi9: { title: "Sci-Fi Building 9", type: "SCI-FI R&D", icon: "🛸", desc: "Holographic labs, quantum computing.", stats: [["🧪 Labs","12"],["💻 Quantum","Online"],["🔬 Projects","8"],["⚡ Power","Stable"]] },
  beautifulTower: { title: "Beautiful Tower", type: "SKYLINE", icon: "🗼", desc: "Iconic landmark, LED facade.", stats: [["🏙️ Height","320 m"],["👁️ Visitors","180"],["💡 Lights","Show"],["📡 Antenna","Active"]] },
  scifi10: { title: "Sci-Fi Building 10", type: "SCI-FI", icon: "🚀", desc: "Space tech, satellite control.", stats: [["🛰️ Sats","6"],["🚀 Missions","2"],["📡 Signal","Strong"],["🤖 AI","Online"]] },
  wasteCollector: { title: "Waste Collector Point", type: "MUNICIPAL", icon: "🗑", desc: "Smart bins, AI route optimisation.", stats: [["🗑️ Bins","24"],["📊 Fill","42%"],["🚛 Pickup","18 min"],["♻️ Sorted","78%"]] },
  trafficController: { title: "AI Traffic Controller", type: "TRANSPORTATION", icon: "🤖", desc: "Adaptive signals, jam detection.", stats: [["🚗 Vehicles","80"],["🟢 Green","R1&2"],["🤖 AI","Active"],["📡 Sensors","24"]] },
  dataCenter: { title: "Smart Data Center", type: "TECHNOLOGY", icon: "💾", desc: "Cloud servers, AI compute cluster.", stats: [["🖥️ Servers","2,400"],["💾 Storage","18 PB"],["🔒 Security","Tier-4"],["🌡️ Temp","18°C"]] },
  telecom: { title: "Smart Telecom Tower", type: "TELECOM", icon: "📡", desc: "5G/6G broadcast.", stats: [["📶 Bands","5G+6G"],["📡 Range","25 km"],["📊 Uptime","99.9%"],["🔋 Power","Solar"]] },
  waterTower: { title: "Smart Water Tower", type: "UTILITY", icon: "💧", desc: "Elevated reservoir with sensors.", stats: [["💧 Capacity","2M L"],["🧪 Quality","Optimal"],["📊 Level","78%"],["🔬 Sensors","8"]] },
  ev: { title: "EV Charging Station", type: "ENERGY", icon: "⚡", desc: "Fast charging with solar canopy.", stats: [["⚡ Chargers","4"],["🚗 Today","22"],["☀️ Solar","Yes"],["⏱️ Fast","30 min"]] },
  police: { title: "Smart Police Station", type: "SAFETY", icon: "🚔", desc: "AI surveillance, drone dispatch.", stats: [["👮 Officers","48"],["🚔 Units","6"],["📹 Cameras","120"],["📞 Response","4 min"]] },
  fire: { title: "Fire Station", type: "SAFETY", icon: "🚒", desc: "Emergency fire response.", stats: [["🚒 Trucks","4"],["👨‍🚒 Crew","24"],["🚁 Drones","2"],["⏱️ Response","3 min"]] },
  library: { title: "Smart Public Library", type: "EDUCATION", icon: "📚", desc: "Digital library, VR reading rooms.", stats: [["📚 Books","45K"],["💻 Digital","12K"],["👥 Today","180"],["🎬 VR","4"]] },
  helipad: { title: "Emergency Helipad", type: "EMERGENCY", icon: "🚁", desc: "Rooftop helipad for air response.", stats: [["🚁 Landings","12"],["⏱️ Ready","24/7"],["📡 Radar","Active"],["💡 Lights","ON"]] },
  parking: { title: "Smart Parking", type: "TRANSPORT", icon: "🅿️", desc: "AI-guided multi-level parking.", stats: [["🚗 Spaces","240"],["🅿️ Free","82"],["⚡ EV","Yes"],["📱 App","Live"]] },
  wasteBin: { title: "Waste Container", type: "WASTE", icon: "🗑", desc: "IoT bin with auto-notification.", stats: [["📊 Fill","42%"],["🔋 Batt","88%"],["📡 Signal","Good"],["♻️ Type","Mixed"]] },
  filtrationMachine: { title: "Filtration Machine", type: "WATER TREATMENT", icon: "⚙️", desc: "RO + UV purification core.", stats: [["💧 Flow","180 L/m"],["🧪 Purity","99.7%"],["🔬 Stages","9"],["⚡ Power","12 kW"]] },
  battery: { title: "Battery Storage", type: "ENERGY", icon: "🔋", desc: "Grid-scale battery bank.", stats: [["⚡ Capacity","20 MWh"],["🔋 Charge","78%"],["📊 Cycles","1,240"],["🌡️ Temp","Stable"]] },
  antenna: { title: "Smart Antenna", type: "TELECOM", icon: "📡", desc: "Multi-band city coverage.", stats: [["📶 Bands","4"],["📡 Range","30 km"],["🔋 Power","Solar"],["📊 Uptime","99%"]] },
  shop: { title: "Smart Shop", type: "COMMERCE", icon: "🛒", desc: "AI-powered retail, cashless payment.", stats: [["🛒 Items","1,200"],["💳 Digital","100%"],["👥 Today","86"],["📦 Delivery","Yes"]] },
  securityGate: { title: "Smart Security Gate", type: "SECURITY", icon: "🛡️", desc: "AI barrier with detection, CCTV.", stats: [["🛡️ AI","ACTIVE"],["🚗 Detection","Laser+Radar"],["📹 CCTV","Online"],["⚡ Priority","Emergency"]] },
  verticalFarm: { title: "Vertical Farm Tower", type: "AGRICULTURE", icon: "🌿", desc: "Multi-level hydroponic tower with AI nutrient dosing.", stats: [["🌿 Levels","24"],["💧 Water","-92%"],["🥬 Yield","+340%"],["💡 LEDs","Full"]] },
  smartHome: { title: "Smart Home", type: "RESIDENTIAL", icon: "🏠", desc: "IoT home with solar roof, smart meter and AI climate control.", stats: [["🏠 Type","IoT Home"],["☀️ Solar","Yes"],["🔒 Security","Smart"],["📊 Energy","A+"]] },
  modernBuilding: { title: "Modern Building", type: "COMMERCIAL", icon: "🏢", desc: "Modern commercial building with smart energy.", stats: [["🏢 Floors","Mixed"],["⚡ Energy","A+"],["🌡️ HVAC","Smart"],["🅿️ Parking","Auto"]] },
  skyline: { title: "City Skyline", type: "SKYLINE", icon: "🌃", desc: "Dense downtown skyline with dynamic facade lighting.", stats: [["🏙️ Towers","Many"],["💡 Lights","Dynamic"],["🌆 Mode","Night"],["📡 WiFi","City-wide"]] },
  commercial: { title: "Commercial Hub", type: "COMMERCIAL", icon: "🏬", desc: "Concept commercial building with retail + offices.", stats: [["🏬 Retail","Multi"],["💼 Offices","Yes"],["☕ Cafes","3"],["📶 WiFi","Free"]] },
  greatHall: { title: "Great Hall", type: "CIVIC", icon: "🏛️", desc: "Civic assembly hall for city events and ceremonies.", stats: [["🎭 Capacity","1,200"],["🎤 Events","Weekly"],["💡 Lights","Smart"],["🎵 Sound","Pro"]] },
};

export const LOCATIONS = {
  school: { key: "school", label: "American High School", icon: "🏫", type: "EDUCATION", position: [-600, 5, -600], camHeight: 380, camDistance: 330, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Top View", top: true }] },
  hospital: { key: "hospital", label: "Smart Hospital", icon: "🏥", type: "HEALTHCARE", position: [600, 5, -600], camHeight: 380, camDistance: 330, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Camera 2", angle: Math.PI }, { name: "Top View", top: true }] },
  society: { key: "society", label: "BSS Smart Society", icon: "🏘", type: "RESIDENTIAL", position: [-600, 5, 600], camHeight: 500, camDistance: 500, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  bank: { key: "bank", label: "Smart City State Bank", icon: "🏦", type: "FINANCIAL", position: [600, 5, 600], camHeight: 380, camDistance: 330, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  farm: { key: "farm", label: "Smart Eco Farm", icon: "🌾", type: "AGRICULTURE", position: [1800, 5, -600], camHeight: 420, camDistance: 420, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  newHall: { key: "newHall", label: "Liverpool Event Hall", icon: "🎪", type: "EVENT VENUE", position: [600, 5, 1800], camHeight: 420, camDistance: 420, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  carWash: { key: "carWash", label: "Car Wash · Gas Station", icon: "🚗", type: "AUTOMOTIVE", position: [1800, 5, 1750], camHeight: 420, camDistance: 420, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  powerCompany: { key: "powerCompany", label: "City Power Supply Co.", icon: "🔌", type: "UTILITY", position: [-1600, 5, 800], camHeight: 380, camDistance: 380, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  powerSupply: { key: "powerSupply", label: "Power Supply Zone", icon: "⚡", type: "RENEWABLE", position: [-5400, 5, 3600], camHeight: 900, camDistance: 1000, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  filtration: { key: "filtration", label: "Filtration System", icon: "💧", type: "WATER TREATMENT", position: [3600, 5, -3600], camHeight: 420, camDistance: 380, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }, { name: "Inside Machine", inside: true }] },
  fertilizer: { key: "fertilizer", label: "AI Fertilizer System", icon: "🌱", type: "FERTILIZER MANAGEMENT", position: [-3600, 5, -3600], camHeight: 450, camDistance: 480, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  wasteManagement: { key: "wasteManagement", label: "Waste Management", icon: "♻", type: "MUNICIPAL", position: [3600, 5, 3600], camHeight: 450, camDistance: 480, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  cultureCenter: { key: "cultureCenter", label: "Culture Center", icon: "🏛", type: "CULTURAL", position: [-1800, 5, 1800], camHeight: 450, camDistance: 450, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  sewageCompany: { key: "sewageCompany", label: "Sewage & Gas Co.", icon: "🏭", type: "INDUSTRIAL", position: [1800, 5, 600], camHeight: 400, camDistance: 400, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  scifi9: { key: "scifi9", label: "Sci-Fi Building 9", icon: "🛸", type: "SCI-FI", position: [-3900, 5, -2400], camHeight: 520, camDistance: 480, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  beautifulTower: { key: "beautifulTower", label: "Beautiful Tower", icon: "🗼", type: "SKYLINE", position: [-3600, 5, -800], camHeight: 550, camDistance: 500, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  scifi10: { key: "scifi10", label: "Sci-Fi Building 10", icon: "🚀", type: "SCI-FI", position: [-3600, 5, 800], camHeight: 520, camDistance: 480, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  wasteCollector: { key: "wasteCollector", label: "Waste Collector Point", icon: "🗑", type: "MUNICIPAL", position: [900, 5, 1400], camHeight: 300, camDistance: 280, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  trafficController: { key: "trafficController", label: "AI Traffic Controller", icon: "🤖", type: "TRANSPORTATION", position: [0, 5, 0], camHeight: 320, camDistance: 280, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  securitySG01: { key: "securitySG01", label: "Security Gate SG-01", icon: "🛡️", type: "SECURITY", position: [-30, 5, 150], camHeight: 260, camDistance: 260, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  securitySG02: { key: "securitySG02", label: "Security Gate SG-02", icon: "🛡️", type: "SECURITY", position: [30, 5, -150], camHeight: 260, camDistance: 260, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  securitySG03: { key: "securitySG03", label: "Security Gate SG-03", icon: "🛡️", type: "SECURITY", position: [-150, 5, 30], camHeight: 260, camDistance: 260, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  securitySG04: { key: "securitySG04", label: "Security Gate SG-04", icon: "🛡️", type: "SECURITY", position: [150, 5, -30], camHeight: 260, camDistance: 260, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  verticalFarm: { key: "verticalFarm", label: "Vertical Farm Towers", icon: "🌿", type: "AGRICULTURE", position: [2900, 5, -2400], camHeight: 480, camDistance: 460, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
  smartHomes: { key: "smartHomes", label: "Smart Homes", icon: "🏠", type: "RESIDENTIAL", position: [-900, 5, -1500], camHeight: 320, camDistance: 340, cameras: [{ name: "Camera 1", angle: 0 }, { name: "Top View", top: true }] },
};

export const LOCATION_LIVE_DATA = {
  school: { desc: "AI-powered classrooms", stats: [["👨‍🎓 Students","450"],["👩‍🏫 Teachers","32"],["📚 Classes","18"],["🤖 Robotics","Active"]] },
  hospital: { desc: "24/7 emergency, AI diagnosis", stats: [["🏥 Patients","32"],["🚑 Amb","2"],["💊 ICU","8"],["🩺 AI","Online"]] },
  society: { desc: "IoT residential towers", stats: [["🏠 Towers","12"],["👥 People","2,400"],["☀️ Solar","82%"],["🔒 Sec","AI"]] },
  bank: { desc: "Digital banking", stats: [["💰 Txn","1,240"],["🏧 ATM","8"],["🔐 Sec","Active"],["📈 Up","99.9%"]] },
  farm: { desc: "IoT farming", stats: [["🌾 Crop","94%"],["💧 Water","68%"],["🚁 Drone","3"],["🌡️ Temp","24°C"]] },
  newHall: { desc: "Smart auditorium", stats: [["🎪 Cap","2,000"],["🎤 Evt","3"],["💡 Light","ON"],["🎵 Sound","Sur"]] },
  carWash: { desc: "Automated wash + EV", stats: [["🚗 Cars","87"],["⚡ EV","4"],["⛽ Pump","6"],["💧 Rec","78%"]] },
  powerCompany: { desc: "AI load balancing", stats: [["⚡ Load","68 MW"],["🔋 Res","22%"],["📊 Grid","OK"],["🔌 Out","0"]] },
  powerSupply: { desc: "Solar + wind renewable", stats: [["☀️ Solar","42 MW"],["💨 Wind","28 MW"],["🔋 Batt","78%"],["⚡ Out","70 MW"]] },
  filtration: { desc: "9-stage purification", stats: [["💧 Water","12M L/d"],["🧪 Pure","99.7%"],["🔬 Sens","24"],["♻️ Rec","82%"]] },
  fertilizer: { desc: "AI nutrient mixing", stats: [["🌱 NPK","Opt"],["🤖 AI","Act"],["🚚 Trk","2"],["📊 Soil","94%"]] },
  wasteManagement: { desc: "Smart segregation", stats: [["♻️ Rec","68%"],["⚡ En","4.2MW"],["🗑️ Trk","3"],["📊 Bin","42%"]] },
  cultureCenter: { desc: "Museums, VR tours", stats: [["🎭 Vis","320"],["🖼️ Ex","45"],["🎬 VR","On"],["🎨 Ws","2"]] },
  sewageCompany: { desc: "AI sewage, biogas", stats: [["🏭 Proc","8M L/d"],["💨 Gas","2.1MW"],["♻️ Rec","75%"],["🔬 Qual","OK"]] },
  scifi9: { desc: "Holographic labs", stats: [["🧪 Labs","12"],["💻 Q","On"],["🔬 Proj","8"],["⚡ Pwr","OK"]] },
  beautifulTower: { desc: "Iconic landmark", stats: [["🏙️ H","320 m"],["👁️ Vis","180"],["💡 L","Show"],["📡 Ant","On"]] },
  scifi10: { desc: "Space tech hub", stats: [["🛰️ Sat","6"],["🚀 M","2"],["📡 Sig","Str"],["🤖 AI","On"]] },
  wasteCollector: { desc: "Smart bins, AI routing", stats: [["🗑️ Bin","24"],["📊 Fill","42%"],["🚛 Pk","18m"],["♻️ Srt","78%"]] },
  trafficController: { desc: "Adaptive signals, AI", stats: [["🚗 Veh","80"],["🟢 Grn","R1&2"],["🤖 AI","Act"],["📡 Sen","24"]] },
  securitySG01: { desc: "AI barrier, CCTV", stats: [["🛡️ Gate","01"],["🚗 Det","Act"],["📹 CCTV","On"],["⚡ Pri","Emer"]] },
  securitySG02: { desc: "AI barrier, CCTV", stats: [["🛡️ Gate","02"],["🚗 Det","Act"],["📹 CCTV","On"],["⚡ Pri","Emer"]] },
  securitySG03: { desc: "AI barrier, CCTV", stats: [["🛡️ Gate","03"],["🚗 Det","Act"],["📹 CCTV","On"],["⚡ Pri","Emer"]] },
  securitySG04: { desc: "AI barrier, CCTV", stats: [["🛡️ Gate","04"],["🚗 Det","Act"],["📹 CCTV","On"],["⚡ Pri","Emer"]] },
  verticalFarm: { desc: "24-level hydroponic tower", stats: [["🌿 Levels","24"],["💧 Water","-92%"],["🥬 Yield","+340%"],["💡 LEDs","Full"]] },
  smartHomes: { desc: "IoT smart homes", stats: [["🏠 Homes","12"],["☀️ Solar","100%"],["🔒 Sec","Smart"],["📊 En","A+"]] },
};

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

function createAITrafficSystem(callbacks) {
  const PHASE_DURATION = 9, YELLOW_DURATION = 2.5;
  let elapsed = 0, phase = 1, inYellow = false, yellowElapsed = 0;
  let currentGreenRoads = [1, 2], currentRedRoads = [3, 4];
  let emergencyLane = null, emergencyTimer = 0;
  const stats = { vehiclesDetected: 80, vehiclesMoving: 40, vehiclesWaiting: 40, density: "HIGH", emergency: false };

  function tick(delta) {
    elapsed += delta;

    if (!emergencyLane && Math.random() < 0.002) {
      emergencyLane = 1 + Math.floor(Math.random() * 4);
      emergencyTimer = 6;
      stats.emergency = true;
      callbacks.onEmergency?.(emergencyLane);
    }
    if (emergencyLane) {
      emergencyTimer -= delta;
      currentGreenRoads = [emergencyLane];
      currentRedRoads = [1, 2, 3, 4].filter((r) => r !== emergencyLane);
      inYellow = false;
      if (emergencyTimer <= 0) { emergencyLane = null; stats.emergency = false; elapsed = 0; }
    } else if (inYellow) {
      yellowElapsed += delta;
      if (yellowElapsed >= YELLOW_DURATION) {
        inYellow = false; yellowElapsed = 0; elapsed = 0;
        if (phase === 1) { phase = 2; currentGreenRoads = [3, 4]; currentRedRoads = [1, 2]; }
        else { phase = 1; currentGreenRoads = [1, 2]; currentRedRoads = [3, 4]; }
      }
    } else if (elapsed >= PHASE_DURATION) {
      inYellow = true; yellowElapsed = 0;
    }

    stats.vehiclesMoving = 40 + Math.floor(Math.random() * 8);
    stats.vehiclesWaiting = 40 + Math.floor(Math.random() * 8);
    const densityRoll = stats.vehiclesWaiting / (stats.vehiclesMoving + stats.vehiclesWaiting);
    if (densityRoll > 0.6) stats.density = "HIGH";
    else if (densityRoll > 0.35) stats.density = "MEDIUM";
    else stats.density = "LOW";

    callbacks.onTrafficUpdate?.({
      phase, inYellow, currentGreenRoads, currentRedRoads,
      phaseProgress: inYellow ? yellowElapsed / YELLOW_DURATION : elapsed / PHASE_DURATION,
      stats: { ...stats },
      timeInPhase: inYellow ? yellowElapsed : elapsed,
      emergency: stats.emergency
    });
  }
  function isGreen(road) { return !inYellow && currentGreenRoads.includes(road); }
  function isRed(road) { return !inYellow && currentRedRoads.includes(road); }
  function isYellowRoad(road) { return inYellow && (currentGreenRoads.includes(road) || currentRedRoads.includes(road)); }
  return { tick, isGreen, isRed, isYellowRoad, getPhase: () => phase, getStats: () => ({ ...stats }) };
}

function createAISecuritySystem(callbacks) {
  const CYCLE = 70, NORMAL_T = 30, ALERT_T = 10, CLOSED_T = 18, OPEN_T = 12;
  let elapsed = 0, phase = "NORMAL", activeGateIdx = 0;
  const gates = SECURITY_GATES_DEF.map((g) => ({
    ...g, status: "OPEN", aiState: "NORMAL",
    armAngle: BARRIER_OPEN_ANGLE, targetAngle: BARRIER_OPEN_ANGLE,
    vehiclesDetected: 0, vehiclesWaiting: 0, density: "LOW"
  }));
  function tick(delta, vehicleSnapshot) {
    elapsed += delta;
    if (elapsed > CYCLE) { elapsed = 0; activeGateIdx = (activeGateIdx + 1) % gates.length; phase = "NORMAL"; }
    if (elapsed < NORMAL_T) phase = "NORMAL";
    else if (elapsed < NORMAL_T + ALERT_T) phase = "ALERT";
    else if (elapsed < NORMAL_T + ALERT_T + CLOSED_T) phase = "CLOSED";
    else if (elapsed < NORMAL_T + ALERT_T + CLOSED_T + OPEN_T) phase = "OPENING";
    else phase = "NORMAL";
    const activeGate = gates[activeGateIdx];
    for (const g of gates) {
      const isActive = g === activeGate;
      if (isActive) {
        if (phase === "NORMAL")       { g.status = "OPEN";   g.aiState = "NORMAL";     g.targetAngle = BARRIER_OPEN_ANGLE; }
        else if (phase === "ALERT")   { g.status = "OPEN";   g.aiState = "RESTRICTED"; g.targetAngle = BARRIER_OPEN_ANGLE; }
        else if (phase === "CLOSED")  { g.status = "CLOSED"; g.aiState = "RESTRICTED"; g.targetAngle = BARRIER_CLOSED_ANGLE; }
        else if (phase === "OPENING") { g.status = "OPEN";   g.aiState = "NORMAL";     g.targetAngle = BARRIER_OPEN_ANGLE; }
      } else { g.status = "OPEN"; g.aiState = "NORMAL"; g.targetAngle = BARRIER_OPEN_ANGLE; }
      const diff = g.targetAngle - g.armAngle;
      const step = Math.sign(diff) * Math.min(Math.abs(diff), BARRIER_ANIM_SPEED * delta);
      g.armAngle += step;
    }
    if (vehicleSnapshot) {
      for (const g of gates) {
        let detected = 0, waiting = 0;
        for (const v of vehicleSnapshot) {
          const d = g.axis === "z" ? Math.abs(v.z - g.stop) : Math.abs(v.x - g.stop);
          if (d < 350) detected++;
          if (d < 200 && v.speed < 0.02) waiting++;
        }
        g.vehiclesDetected = detected; g.vehiclesWaiting = waiting;
        g.density = waiting > 8 ? "HIGH" : waiting > 3 ? "MEDIUM" : "LOW";
      }
    }
    callbacks.onSecurityUpdate?.({
      phase, activeGateId: activeGate.id,
      gates: gates.map((g) => ({
        id: g.id, label: g.label, status: g.status, aiState: g.aiState,
        vehiclesDetected: g.vehiclesDetected, vehiclesWaiting: g.vehiclesWaiting,
        density: g.density, armAngle: g.armAngle, axis: g.axis, sign: g.sign,
        offset: g.offset, stop: g.stop
      }))
    });
  }
  function isGateClosed(id) { const g = gates.find((x) => x.id === id); return g ? g.status === "CLOSED" : false; }
  function getGate(id) { return gates.find((x) => x.id === id); }
  return { tick, isGateClosed, getGate, getGates: () => gates };
}

function createCitySimulation(callbacks) {
  const CYCLE_TIME = 60, NORMAL_DURATION = 25, JAM_DURATION = 20, REROUTE_DURATION = 15;
  let simSec = 0, tState = 0, cycleStart = 0, jamStart = 0, rerouteStart = 0;
  function tick(delta) {
    simSec += delta;
    const tt = Math.floor(simSec);
    callbacks.onSimTime?.(String(Math.floor(tt / 60)).padStart(2, "0") + ":" + String(tt % 60).padStart(2, "0"));
    const now = simSec - cycleStart;
    if (tState === 0) { if (now >= CYCLE_TIME) { jamStart = simSec; setState(1); callbacks.onAiMessage?.("⚠ CARS QUEUING AT INTERSECTION"); } }
    else if (tState === 1) { if (simSec - jamStart >= JAM_DURATION) { rerouteStart = simSec; setState(2); callbacks.onAiMessage?.("🤖 AI SPLITS TRAFFIC TO INNER ROADS"); } }
    else if (tState === 2) { if (simSec - rerouteStart >= REROUTE_DURATION) { setState(3); callbacks.onAiMessage?.("✅ JAM CLEARED BY AI"); } }
    else if (tState === 3) { if (simSec - rerouteStart >= REROUTE_DURATION + 10) { cycleStart = simSec; setState(0); } }
    const pct = Math.min(((simSec - cycleStart) / CYCLE_TIME) * 100, 100);
    let label = "", visible = true;
    if (tState === 0) label = "🚦 TRAFFIC EVENT IN " + Math.max(0, Math.ceil(CYCLE_TIME - now)) + "s";
    else if (tState === 1) label = "🔴 JAM ACTIVE — " + Math.max(0, Math.ceil(NORMAL_DURATION + JAM_DURATION - now)) + "s";
    else if (tState === 2) label = "🔵 AI REROUTING — " + Math.max(0, Math.ceil(NORMAL_DURATION + JAM_DURATION + REROUTE_DURATION - now)) + "s";
    else { label = "🟢 RESOLVED"; visible = false; }
    callbacks.onCycleUpdate?.(label, pct, visible);
  }
  function setState(s) {
    tState = s;
    const t = { state: "", stateColor: "", reason: "", level: "", flow: "", mode: "", incident: "" };
    let aiReason = null;
    if (s === 0) { t.state = "TRAFFIC NORMAL"; t.stateColor = "#63ddff"; t.reason = "4-SITE NETWORK OPERATING NORMALLY"; t.level = "NORMAL"; t.flow = "92%"; t.mode = "MONITORING"; t.incident = "<span>LIVE:</span> Traffic flowing normally"; }
    else if (s === 1) { t.state = "TRAFFIC JAM"; t.stateColor = "#ffd15a"; t.reason = "QUEUE BUILDING AT CENTRAL INTERSECTION"; t.level = "HEAVY"; t.flow = "28%"; t.mode = "ANALYZING"; t.incident = "<span>INCIDENT:</span> Cars queuing"; aiReason = { visible: true, title: "🔴 PROBLEM DETECTED", text: "<strong>REASON:</strong> Too many cars at central intersection.", result: "AI is <strong>reading the queue</strong>." }; }
    else if (s === 2) { t.state = "AI REROUTING"; t.stateColor = "#67e4ff"; t.reason = "AI SPLITTING TRAFFIC TO INNER ROADS"; t.level = "RECOVERING"; t.flow = "68%"; t.mode = "OPTIMIZING"; t.incident = "<span>AI ACTION:</span> Rerouting via inner roads"; aiReason = { visible: true, title: "🔵 AI IS ACTING", text: "<strong>AI DID THIS:</strong> Flipped inner roads to green.", result: "Result: <strong>jam clearing.</strong>" }; }
    else if (s === 3) { t.state = "TRAFFIC CLEAR"; t.stateColor = "#6aff9d"; t.reason = "ALL ROUTES FLOWING NORMALLY"; t.level = "CLEAR"; t.flow = "96%"; t.mode = "OPTIMAL"; t.incident = "<span>SYSTEM:</span> All routes flowing"; aiReason = { visible: true, title: "🟢 RESOLVED BY AI", text: "<strong>AI RESOLVED IT</strong> by splitting traffic.", result: "Jam cleared in <strong>15 seconds</strong>." }; }
    callbacks.onTrafficUpdate?.(t);
    if (s === 0) callbacks.onAiReason?.({ visible: false, title: "", text: "", result: "" });
    else if (aiReason) callbacks.onAiReason?.(aiReason);
  }
  return { tick, getState: () => tState };
}

const SmartCity3D = forwardRef((props, ref) => {
  const {
    onPanel, onTrafficUpdate, onSimTime, onCycleUpdate, onAiMessage,
    onAiReason, onTouristMessage, onAITrafficUpdate, onFiltrationUpdate,
    onSecurityUpdate,
  } = props;
  const mountRef = useRef(null);
  const [locationPopup, setLocationPopup] = useState(null);
  const [buildingPopup, setBuildingPopup] = useState(null);
  const [securityPopup, setSecurityPopup] = useState(null);
  const [securityHUD, setSecurityHUD] = useState(null);

  const s = useRef({
    camera: null, controls: null, renderer: null, scene: null,
    isLocked: false, lockedLocation: null, followTarget: null,
    savedCamPos: null, savedCamTarget: null, camTransition: null,
    trucks: {}, people: [], tourists: [], cityCars: [], intersectionCars: [],
    dubaiCars: [], trafficLights: [], intersectionLights: [],
    turbines: [], streetBulbMats: [], batteryRings: [],
    waterParticles: [], clickable: [], borderLights: [],
    controller: null, radar: null, controllerRing: null, controllerRing2: null,
    controllerSig: null, garbageWarn: null, fertWarn1: null, fertWarn2: null,
    grassMaterial: null, roadMaterial: null, roadLaneMaterial: null,
    curbMaterial: null, sidewalkMat: null, ambient: null, sun: null,
    sim: null, roadZs: null, roadXs: null, aiSystem: null,
    securitySystem: null, securityGates: [],
    filtrationStageIndex: 0, filtrationStageElapsed: 0,
    filtrationStageMeshes: [], filtrationFlowMeshes: [],
    filtrationUVLight: null, filtrationCleanReservoir: null, filtrationPumpRings: [],
    verticalFarms: [],
    growLights: [],
    smartHomeSigns: [],
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
    s.camTransition = {
      startPos: s.camera.position.clone(), targetPos,
      startLook: s.controls.target.clone(), targetLook,
      startTime: performance.now(), duration
    };
  }
  function goToLocation(key, onLabel) {
    const loc = LOCATIONS[key]; if (!loc || !s.camera) return;
    s.isLocked = true; s.lockedLocation = key; s.followTarget = null;
    s.savedCamPos = s.camera.position.clone(); s.savedCamTarget = s.controls.target.clone();
    const [x, y, z] = loc.position;
    smoothCameraTo(
      new THREE.Vector3(x + loc.camDistance * 0.7, loc.camHeight, z + loc.camDistance * 0.7),
      new THREE.Vector3(x, y, z)
    );
    s.controls.enableRotate = false; onLabel?.(loc.label);
    const live = LOCATION_LIVE_DATA[key];
    if (live) setLocationPopup({ key, label: loc.label, icon: loc.icon, type: loc.type, desc: live.desc, stats: live.stats });
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
    const live = LOCATION_LIVE_DATA[key];
    if (live) setLocationPopup({ key, label: loc.label, icon: loc.icon, type: loc.type, desc: live.desc, stats: live.stats });
  }
  function exitCameraView() {
    if (!s.camera) return;
    s.isLocked = false; s.lockedLocation = null; s.followTarget = null;
    setLocationPopup(null);
    if (s.savedCamPos && s.savedCamTarget) smoothCameraTo(s.savedCamPos, s.savedCamTarget);
    s.controls.enableRotate = true;
  }
  function followVehicle(key, onText) {
    if (!s.camera) return;
    s.isLocked = false; s.lockedLocation = null; setLocationPopup(null);
    if (key === "garbageTruck") s.followTarget = s.trucks.garbage;
    else if (key === "fertTruck1") s.followTarget = s.trucks.fert1;
    else if (key === "fertTruck2") s.followTarget = s.trucks.fert2;
    else s.followTarget = null;
    if (s.followTarget) {
      smoothCameraTo(s.followTarget.position.clone().add(new THREE.Vector3(120, 90, 120)), s.followTarget.position.clone(), 1200);
      onText?.("🎥 FOLLOWING — " + key.toUpperCase());
    } else { smoothCameraTo(new THREE.Vector3(0, 2000, 2000), new THREE.Vector3(0, 0, 0), 1500); onText?.("🌐 WATCHING CITY CARS"); }
    s.controls.enableRotate = true;
  }
  function goToOverview() {
    if (!s.camera) return;
    s.isLocked = false; s.lockedLocation = null; s.followTarget = null; setLocationPopup(null);
    s.controls.enableRotate = true;
    smoothCameraTo(new THREE.Vector3(1400, 950, 1400), new THREE.Vector3(0, 5, 0), 1500);
  }
  function goToTopDown() {
    if (!s.camera) return;
    s.isLocked = false; s.lockedLocation = null; s.followTarget = null; setLocationPopup(null);
    s.controls.enableRotate = true;
    smoothCameraTo(new THREE.Vector3(0, 2800, 500), new THREE.Vector3(0, 0, 0), 1500);
  }
  function goToLiveTraffic() {
    if (!s.camera) return;
    s.isLocked = false; s.lockedLocation = "liveTraffic"; s.followTarget = null; setLocationPopup(null);
    s.savedCamPos = s.camera.position.clone(); s.savedCamTarget = s.controls.target.clone();
    smoothCameraTo(new THREE.Vector3(0, 420, 520), new THREE.Vector3(0, 5, 0), 2000);
    s.controls.enableRotate = true;
  }
  function focusSecurityGate(gateId) {
    if (!s.camera) return;
    const gate = s.securityGates.find((g) => g.id === gateId);
    if (!gate) return;
    s.isLocked = false; s.lockedLocation = null; s.followTarget = null; setLocationPopup(null);
    const p = new THREE.Vector3();
    if (gate.axis === "z") p.set(gate.offset, 5, gate.stop);
    else p.set(gate.stop, 5, gate.offset);
    smoothCameraTo(p.clone().add(new THREE.Vector3(180, 200, 180)), p.clone(), 1500);
    s.controls.enableRotate = true;
  }
  function setDayNight(night) {
    if (!s.scene) return;
    const DAY_BG = new THREE.Color(0x8fbcd4);
    const NIGHT_BG = new THREE.Color(0x050a14);
    if (night) { s.scene.background = NIGHT_BG.clone(); s.scene.fog.color = NIGHT_BG; s.ambient.intensity = 0.55; s.sun.intensity = 0.4; }
    else { s.scene.background = DAY_BG.clone(); s.scene.fog.color = DAY_BG; s.ambient.intensity = 2.9; s.sun.intensity = 2.7; }
    s.grassMaterial.color.setHex(night ? 0x1a3a24 : 0x4d8f50);
    s.roadMaterial.color.setHex(night ? 0x0e1418 : 0x2a3238);
    s.roadLaneMaterial.color.setHex(night ? 0x080c10 : 0x1e2428);
    s.curbMaterial.color.setHex(night ? 0x252a2e : 0x697578);
    s.sidewalkMat.color.setHex(night ? 0x353a3e : 0x8a8f94);
    s.streetBulbMats.forEach((m) => { m.emissiveIntensity = night ? 7.5 : 1.8; });
    s.batteryRings.forEach((m) => { m.emissiveIntensity = night ? 6.5 : 2.0; });
    s.borderLights.forEach((m) => { m.emissiveIntensity = night ? 7.5 : 3.0; });
    s.growLights.forEach((m) => { m.emissiveIntensity = night ? 8.0 : 4.5; });
  }

  useEffect(() => {
    const container = mountRef.current; if (!container) return;
    const clickable = []; s.clickable = clickable;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const scene = new THREE.Scene(); s.scene = scene;
    scene.background = new THREE.Color(0x8fbcd4);
    scene.fog = new THREE.Fog(0x8fbcd4, 4500, 11000);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 5, 15000);
    camera.position.set(1400, 950, 1400); s.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement); s.renderer = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.15;
    controls.minDistance = 200; controls.maxDistance = 8000;
    controls.target.set(0, 5, 0); s.controls = controls;

    const ambient = new THREE.HemisphereLight(0xffffff, 0x4a7a56, 2.9);
    scene.add(ambient); s.ambient = ambient;
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.7);
    sun.position.set(-800, 1400, 500); scene.add(sun); s.sun = sun;
    const fillLight = new THREE.DirectionalLight(0xd0e8ff, 1.3);
    fillLight.position.set(800, 1000, -500); scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0x88ddff, 0.9);
    rimLight.position.set(0, 600, -1200); scene.add(rimLight);

    const mat = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    const grassMaterial = mat(0x4d8f50, 0.98);
    const roadMaterial = mat(0x2a3238, 0.85, 0.15);
    const roadLaneMaterial = mat(0x1e2428, 0.96);
    const yellowLineMaterial = mat(0xf5c84b, 0.65);
    const whiteLineMaterial = mat(0xffffff, 0.65);
    const curbMaterial = mat(0x697578, 0.88);
    const darkMaterial = mat(0x182327, 0.65, 0.15);
    const blueMaterial = mat(0x087fa8, 0.35, 0.25);
    const sidewalkMat = mat(0x8a8f94, 0.9);
    s.grassMaterial = grassMaterial; s.roadMaterial = roadMaterial;
    s.roadLaneMaterial = roadLaneMaterial; s.curbMaterial = curbMaterial; s.sidewalkMat = sidewalkMat;

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE), grassMaterial);
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    const cityBoundMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 3.0, metalness: 0.7, roughness: 0.2 });
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
      s.borderLights.push(cap.material); cap.position.set(cx, 37, cz); scene.add(cap);
    }

    const ROAD_W = 110, ROAD_HALF = ROAD_W / 2;
    const ROAD_LEN = ROAD_HALF_LEN * 2;
    const roadZs = [-2400, -1200, 0, 1200, 2400];
    const roadXs = [-2400, -1200, 0, 1200, 2400];
    s.roadZs = roadZs; s.roadXs = roadXs;

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

    /* ===== CITY WALL ===== */
    const wallConcreteMat = new THREE.MeshStandardMaterial({ color: 0x5a6670, roughness: 0.85, metalness: 0.15 });
    const wallTopMat = new THREE.MeshStandardMaterial({ color: 0x3a4650, roughness: 0.7, metalness: 0.35 });
    const wallGlowMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 3.5, metalness: 0.7, roughness: 0.2 });
    s.borderLights.push(wallGlowMat);

    function makeWallTextTexture(text, sub) {
      const c = document.createElement("canvas"); c.width = 2048; c.height = 512;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#3a4650"; ctx.fillRect(0, 0, 2048, 512);
      ctx.strokeStyle = "#22cfff"; ctx.lineWidth = 12; ctx.strokeRect(20, 20, 2008, 472);
      ctx.fillStyle = "#e8f7ff"; ctx.font = "bold 200px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(text, 1024, 210);
      ctx.fillStyle = "#7fe3ff"; ctx.font = "bold 90px Arial"; ctx.fillText(sub, 1024, 380);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }
    const wallH = 140, wallT = 30;
    const wallLen = CITY_HALF * 2 + wallT * 2;
    function buildCityWall() {
      const eastWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, wallLen), wallConcreteMat);
      eastWall.position.set(CITY_HALF, 5 + wallH / 2, 0); scene.add(eastWall);
      const eastTop = new THREE.Mesh(new THREE.BoxGeometry(wallT + 6, 6, wallLen), wallTopMat);
      eastTop.position.set(CITY_HALF, 5 + wallH + 3, 0); scene.add(eastTop);
      for (let z = -CITY_HALF + 100; z <= CITY_HALF - 100; z += 400) {
        const gl = new THREE.Mesh(new THREE.BoxGeometry(wallT + 1, 4, 20), wallGlowMat);
        gl.position.set(CITY_HALF, 5 + wallH - 25, z); scene.add(gl);
        const gl2 = gl.clone(); gl2.position.y = 5 + 25; scene.add(gl2);
      }
      const texE = makeWallTextTexture("MA DEVELOPERS", "DEVELOPED BY MA DEVELOPERS");
      const panelE = new THREE.Mesh(new THREE.PlaneGeometry(900, 220), new THREE.MeshBasicMaterial({ map: texE, side: THREE.DoubleSide }));
      panelE.position.set(CITY_HALF - wallT / 2 - 1, 5 + wallH / 2, 0);
      panelE.rotation.y = -Math.PI / 2; scene.add(panelE);
      const panelE2 = panelE.clone(); panelE2.position.set(CITY_HALF + wallT / 2 + 1, 5 + wallH / 2, 0); panelE2.rotation.y = Math.PI / 2; scene.add(panelE2);
      const westWall = eastWall.clone(); westWall.position.x = -CITY_HALF; scene.add(westWall);
      const westTop = eastTop.clone(); westTop.position.x = -CITY_HALF; scene.add(westTop);
      for (let z = -CITY_HALF + 100; z <= CITY_HALF - 100; z += 400) {
        const gl = new THREE.Mesh(new THREE.BoxGeometry(wallT + 1, 4, 20), wallGlowMat);
        gl.position.set(-CITY_HALF, 5 + wallH - 25, z); scene.add(gl);
        const gl2 = gl.clone(); gl2.position.y = 5 + 25; scene.add(gl2);
      }
      const panelW = panelE.clone(); panelW.position.set(-CITY_HALF + wallT / 2 + 1, 5 + wallH / 2, 0); panelW.rotation.y = Math.PI / 2; scene.add(panelW);
      const panelW2 = panelE.clone(); panelW2.position.set(-CITY_HALF - wallT / 2 - 1, 5 + wallH / 2, 0); panelW2.rotation.y = -Math.PI / 2; scene.add(panelW2);
      const northWall = new THREE.Mesh(new THREE.BoxGeometry(wallLen, wallH, wallT), wallConcreteMat);
      northWall.position.set(0, 5 + wallH / 2, CITY_HALF); scene.add(northWall);
      const northTop = new THREE.Mesh(new THREE.BoxGeometry(wallLen, 6, wallT + 6), wallTopMat);
      northTop.position.set(0, 5 + wallH + 3, CITY_HALF); scene.add(northTop);
      for (let x = -CITY_HALF + 100; x <= CITY_HALF - 100; x += 400) {
        const gl = new THREE.Mesh(new THREE.BoxGeometry(20, 4, wallT + 1), wallGlowMat);
        gl.position.set(x, 5 + wallH - 25, CITY_HALF); scene.add(gl);
        const gl2 = gl.clone(); gl2.position.y = 5 + 25; scene.add(gl2);
      }
      const panelN = panelE.clone(); panelN.position.set(0, 5 + wallH / 2, CITY_HALF - wallT / 2 - 1); panelN.rotation.y = 0; scene.add(panelN);
      const panelN2 = panelE.clone(); panelN2.position.set(0, 5 + wallH / 2, CITY_HALF + wallT / 2 + 1); panelN2.rotation.y = Math.PI; scene.add(panelN2);
      const southWall = northWall.clone(); southWall.position.z = -CITY_HALF; scene.add(southWall);
      const southTop = northTop.clone(); southTop.position.z = -CITY_HALF; scene.add(southTop);
      for (let x = -CITY_HALF + 100; x <= CITY_HALF - 100; x += 400) {
        const gl = new THREE.Mesh(new THREE.BoxGeometry(20, 4, wallT + 1), wallGlowMat);
        gl.position.set(x, 5 + wallH - 25, -CITY_HALF); scene.add(gl);
        const gl2 = gl.clone(); gl2.position.y = 5 + 25; scene.add(gl2);
      }
      const panelS = panelE.clone(); panelS.position.set(0, 5 + wallH / 2, -CITY_HALF + wallT / 2 + 1); panelS.rotation.y = Math.PI; scene.add(panelS);
      const panelS2 = panelE.clone(); panelS2.position.set(0, 5 + wallH / 2, -CITY_HALF - wallT / 2 - 1); panelS2.rotation.y = 0; scene.add(panelS2);
    }
    buildCityWall();

    function buildingBorder(x, z, w, d, color = 0x22cfff) {
      const bMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3.0, metalness: 0.7, roughness: 0.2 });
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
    }
    function board(text, x, y, z, w = 80, h = 12, color) {
      const g = new THREE.Group(); g.position.set(x, y, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 14, 6), darkMaterial);
      pole.position.y = 7; g.add(pole);
      const bMat = color ? mat(color, 0.35, 0.25) : blueMaterial;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.9), bMat); b.position.y = 12; g.add(b);
      const c = document.createElement("canvas"); c.width = 1400; c.height = 350;
      const ctx = c.getContext("2d");
      ctx.fillStyle = color ? "#" + color.toString(16).padStart(6, "0") : "#075c7b";
      ctx.fillRect(0, 0, 1400, 350);
      ctx.strokeStyle = "#78e9ff"; ctx.lineWidth = 12; ctx.strokeRect(10, 10, 1380, 330);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 82px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(text, 700, 175);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const sMesh = new THREE.Mesh(new THREE.PlaneGeometry(w - 1, h - 0.8), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
      sMesh.position.set(0, 12, 0.5); g.add(sMesh);
      scene.add(g);
    }

    function buildInfoBoard(x, z, title, subtitle, panels, accent = 0xc98a3a) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const frameMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.4, metalness: 0.5 });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(260, 200, 8), frameMat); frame.position.y = 100; g.add(frame);
      const back = new THREE.Mesh(new THREE.BoxGeometry(252, 192, 2), mat(0x1a0f08, 0.85)); back.position.set(0, 100, 4.5); g.add(back);
      const c = document.createElement("canvas"); c.width = 1024; c.height = 800;
      const ctx = c.getContext("2d");
      const hex = (n) => "#" + n.toString(16).padStart(6, "0");
      ctx.fillStyle = hex(accent); ctx.fillRect(0, 0, 1024, 800);
      ctx.fillStyle = "#2a1608"; ctx.fillRect(20, 20, 984, 130);
      ctx.fillStyle = "#ffd9a0"; ctx.font = "bold 62px Georgia, serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(title, 512, 75);
      ctx.fillStyle = "#f5c98a"; ctx.font = "500 26px Georgia, serif";
      ctx.fillText(subtitle, 512, 122);
      const colors = ["#c94a5a", "#3a9a8a", "#3a7ac9", "#5aa54a", "#c98a3a", "#8a5ac9"];
      const cols = 3, rows = 2, padX = 24, padY = 24;
      const startX = 30, startY = 170;
      const cellW = (1024 - padX * (cols + 1)) / cols;
      const cellH = (600 - padY * (rows + 1)) / rows;
      for (let i = 0; i < cols * rows; i++) {
        const r = Math.floor(i / cols), cc = i % cols;
        const px = startX + padX + cc * (cellW + padX);
        const py = startY + padY + r * (cellH + padY);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(px, py, cellW, cellH);
        ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
        ctx.strokeRect(px, py, cellW, cellH);
        const p = panels[i] || { t: "", d: "" };
        ctx.fillStyle = "#ffffff"; ctx.font = "bold 34px Georgia, serif";
        ctx.fillText(p.t || "", px + cellW / 2, py + 45);
        ctx.font = "500 18px Georgia, serif";
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText(p.d || "", px + cellW / 2, py + 85);
      }
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(20, 720, 984, 60);
      ctx.fillStyle = "#ffe4b8"; ctx.font = "500 20px Georgia, serif";
      ctx.fillText("Smart City · IoT · AI-Powered Urban Management", 512, 750);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const face = new THREE.Mesh(new THREE.PlaneGeometry(252, 192), new THREE.MeshBasicMaterial({ map: tex }));
      face.position.set(0, 100, -4.5); face.rotation.y = Math.PI; g.add(face);
      const face2 = face.clone(); face2.position.set(0, 100, 4.6); face2.rotation.y = 0; g.add(face2);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x2a1608, roughness: 0.7 });
      for (const lx of [-110, 110]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(12, 100, 12), legMat);
        leg.position.set(lx, 50, 0); g.add(leg);
      }
      scene.add(g);
      clickable.push({ object: g, type: "cultureCenter", name: title });
      return g;
    }

    function buildVerticalFarm(cx, cz, count = 6) {
      for (let i = 0; i < count; i++) {
        const ax = cx + Math.cos((i / count) * Math.PI * 2) * 180;
        const az = cz + Math.sin((i / count) * Math.PI * 2) * 180;
        const g = new THREE.Group(); g.position.set(ax, 5, az);
        const levels = 12, levelH = 14, towerH = levels * levelH + 20;
        const towerMat = new THREE.MeshStandardMaterial({ color: 0x1c3a2e, roughness: 0.5, metalness: 0.6 });
        const core = new THREE.Mesh(new THREE.CylinderGeometry(18, 22, towerH, 10), towerMat);
        core.position.y = towerH / 2; g.add(core);
        for (let l = 0; l < levels; l++) {
          const y = 20 + l * levelH;
          const ringMat = new THREE.MeshStandardMaterial({
            color: 0x22c866, emissive: 0x22c866, emissiveIntensity: 2.5,
            metalness: 0.4, roughness: 0.3
          });
          const ring = new THREE.Mesh(new THREE.TorusGeometry(30, 1.2, 6, 18), ringMat);
          ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring);
          const tray = new THREE.Mesh(new THREE.CylinderGeometry(32, 32, 2, 12), mat(0x14452a, 0.8));
          tray.position.y = y + 2; g.add(tray);
          const leafMat = new THREE.MeshStandardMaterial({ color: 0x3ab54a, roughness: 0.9, emissive: 0x0a3a1a, emissiveIntensity: 0.4 });
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(3, 6, 5), leafMat);
            leaf.position.set(Math.cos(a) * 26, y + 5, Math.sin(a) * 26);
            g.add(leaf);
          }
        }
        const magentaLED = new THREE.MeshStandardMaterial({
          color: 0xff4adf, emissive: 0xff4adf, emissiveIntensity: 4.5,
          metalness: 0.3, roughness: 0.2
        });
        s.growLights.push(magentaLED);
        const topLED = new THREE.Mesh(new THREE.TorusGeometry(24, 2, 8, 24), magentaLED);
        topLED.rotation.x = Math.PI / 2; topLED.position.y = towerH + 8; g.add(topLED);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xff4adf, emissive: 0xff4adf, emissiveIntensity: 6 }));
        beacon.position.y = towerH + 18; g.add(beacon);
        scene.add(g);
        clickable.push({ object: g, type: "verticalFarm", name: "Vertical Farm " + (i + 1) });
        s.verticalFarms.push({ g, beacon, topLED });
      }
      buildInfoBoard(cx, cz + 320,
        "Vertical Farming Tower",
        "24-Level Hydroponic Sky Farm",
        [
          { t: "Hydroponics", d: "Nutrient Film" },
          { t: "Grow LEDs", d: "Magenta Spectrum" },
          { t: "Water Save", d: "92% Less" },
          { t: "Yield", d: "+340%" },
          { t: "AI Dosing", d: "Realtime" },
          { t: "Climate", d: "Auto" }
        ], 0x2a8a4a);
    }

    function buildSmartHome(cx, cz, name, color, rot = 0) {
      const g = new THREE.Group(); g.position.set(cx, 5, cz); g.rotation.y = rot;
      const base = new THREE.Mesh(new THREE.BoxGeometry(160, 4, 160), mat(0x3a4a3e, 0.9)); base.position.y = 2; g.add(base);
      const bodyMat = mat(color, 0.5, 0.35);
      const body = new THREE.Mesh(new THREE.BoxGeometry(120, 70, 110), bodyMat); body.position.y = 39; g.add(body);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(90, 40, 4), mat(0x8a3a3a, 0.6, 0.3));
      roof.rotation.y = Math.PI / 4; roof.position.y = 94; g.add(roof);
      const door = new THREE.Mesh(new THREE.BoxGeometry(22, 40, 3), mat(0x4a2a1a, 0.7));
      door.position.set(0, 25, 57); g.add(door);
      const winMat = new THREE.MeshStandardMaterial({ color: 0x9adfff, emissive: 0x66aaff, emissiveIntensity: 1.6, transparent: true, opacity: 0.85 });
      for (const wx of [-38, 38]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(24, 22, 2), winMat);
        win.position.set(wx, 45, 57); g.add(win);
      }
      const solar = new THREE.Mesh(new THREE.BoxGeometry(110, 2, 90),
        new THREE.MeshStandardMaterial({ color: 0x082c4b, roughness: 0.2, metalness: 0.8, emissive: 0x0a3a5a, emissiveIntensity: 0.8 }));
      solar.rotation.x = -0.15; solar.position.y = 84; g.add(solar);
      const c = document.createElement("canvas"); c.width = 512; c.height = 128;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#0a1e10"; ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = "#22c866"; ctx.lineWidth = 6; ctx.strokeRect(8, 8, 496, 112);
      ctx.fillStyle = "#6aff9d"; ctx.font = "bold 60px system-ui, Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(name, 256, 60);
      ctx.fillStyle = "#7fe3ff"; ctx.font = "500 24px system-ui, Arial";
      ctx.fillText("SMART HOME", 256, 100);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(70, 17),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      sign.position.set(0, 88, 60); g.add(sign);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 18, 6), mat(0x222222, 0.5, 0.5));
      pole.position.set(0, 78, 60); g.add(pole);
      scene.add(g);
      clickable.push({ object: g, type: "smartHome", name: name });
      s.smartHomeSigns.push(sign);
      return g;
    }

    const streetBulbMats = []; s.streetBulbMats = streetBulbMats;
    function sl(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 11, 5), darkMaterial); pole.position.y = 5.5; g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.22, 0.22), darkMaterial); arm.position.set(1.5, 10, 0); g.add(arm);
      const bMat = new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffd36a, emissiveIntensity: 1.8 });
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), bMat); b.position.set(3, 9.8, 0); g.add(b);
      scene.add(g); streetBulbMats.push(bMat);
    }
    roadZs.forEach((z) => { for (let x = -ROAD_HALF_LEN + 100; x <= ROAD_HALF_LEN - 100; x += 400) { sl(x, z + ROAD_HALF + 18); sl(x, z - ROAD_HALF - 18); } });

    const trafficLights = []; s.trafficLights = trafficLights;
    function tl(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 9, 5), darkMaterial); pole.position.y = 4.5; g.add(pole);
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5, 1.4), darkMaterial); box.position.y = 7.5; g.add(box);
      const light = (color, y) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10),
          new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0 }));
        m.position.set(0, y, 0.75); g.add(m);
        const halo = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
        halo.position.set(0, y, 0.75); g.add(halo);
        return { core: m, halo };
      };
      const r = light(0xff2222, 8.8), yL = light(0xffcc22, 7.5), gr = light(0x22ff66, 6.2);
      const pl = new THREE.PointLight(0xffcc22, 0, 14);
      pl.position.set(0, 8, 0.8); g.add(pl);
      scene.add(g);
      trafficLights.push({ r, y: yL, gr, pl, phase: Math.random() * 10 });
    }
    roadXs.forEach((x) => roadZs.forEach((z) => tl(x, z)));

    const intersectionLights = []; s.intersectionLights = intersectionLights;
    const INTERSECTION_LIGHT_OFFSET = 70;
    function makeIntersectionLight(x, z, road) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 11, 5), darkMaterial); pole.position.y = 5.5; g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(3, 0.25, 0.25), darkMaterial); arm.position.set(1.5, 10.5, 0); g.add(arm);
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.8, 5.5, 1.6), darkMaterial); box.position.set(3, 10.5, 0); g.add(box);
      const light = (color, y) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12),
          new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0 }));
        m.position.set(3, y, 0.9); g.add(m);
        const halo = new THREE.Mesh(new THREE.SphereGeometry(1.35, 12, 12),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
        halo.position.set(3, y, 0.9); g.add(halo);
        return { core: m, halo };
      };
      const r = light(0xff2222, 12.2), yL = light(0xffcc22, 10.5), gr = light(0x22ff66, 8.8);
      scene.add(g);
      intersectionLights.push({ r, y: yL, gr, road });
    }
    makeIntersectionLight(-INTERSECTION_LIGHT_OFFSET, -INTERSECTION_LIGHT_OFFSET, 1);
    makeIntersectionLight(INTERSECTION_LIGHT_OFFSET, INTERSECTION_LIGHT_OFFSET, 2);
    makeIntersectionLight(INTERSECTION_LIGHT_OFFSET, -INTERSECTION_LIGHT_OFFSET, 3);
    makeIntersectionLight(-INTERSECTION_LIGHT_OFFSET, INTERSECTION_LIGHT_OFFSET, 4);

    const controller = new THREE.Group(); s.controller = controller;
    controller.position.set(0, 5, 0);
    const controllerBase = new THREE.Mesh(new THREE.CylinderGeometry(55, 62, 3, 24), mat(0x142f3b, 0.28, 0.4)); controllerBase.position.y = 1.5; controller.add(controllerBase);
    const controllerRing = new THREE.Mesh(new THREE.TorusGeometry(53, 1.2, 8, 36), new THREE.MeshStandardMaterial({ color: 0x32dfff, emissive: 0x18cfff, emissiveIntensity: 2.5 }));
    controllerRing.rotation.x = Math.PI / 2; controllerRing.position.y = 3.2; controller.add(controllerRing); s.controllerRing = controllerRing;
    const controllerRing2 = new THREE.Mesh(new THREE.TorusGeometry(44, 0.8, 8, 36), new THREE.MeshStandardMaterial({ color: 0x22bfff, emissive: 0x0a9fdf, emissiveIntensity: 2.0 }));
    controllerRing2.rotation.x = Math.PI / 2; controllerRing2.position.y = 5; controller.add(controllerRing2); s.controllerRing2 = controllerRing2;
    const controllerTower = new THREE.Mesh(new THREE.BoxGeometry(22, 40, 22), mat(0x185a72, 0.25, 0.35)); controllerTower.position.y = 22; controller.add(controllerTower);
    const controllerUpper = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 18), new THREE.MeshStandardMaterial({ color: 0x0a3345, emissive: 0x1a7a9a, emissiveIntensity: 1.8 })); controllerUpper.position.y = 44; controller.add(controllerUpper);
    [{ x: 0, y: 22, z: 12, ry: 0 }, { x: 0, y: 22, z: -12, ry: Math.PI }, { x: 12, y: 22, z: 0, ry: Math.PI / 2 }, { x: -12, y: 22, z: 0, ry: -Math.PI / 2 }].forEach((sp) => {
      const m = new THREE.MeshStandardMaterial({ color: 0x03141b, emissive: 0x21cfff, emissiveIntensity: 2.6 });
      const sMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 7.5, 0.4), m); sMesh.position.set(sp.x, sp.y, sp.z); sMesh.rotation.y = sp.ry; controller.add(sMesh);
    });
    const radar = new THREE.Mesh(new THREE.TorusGeometry(8, 0.5, 8, 32), new THREE.MeshStandardMaterial({ color: 0x61e7ff, emissive: 0x23dfff, emissiveIntensity: 2.5 }));
    radar.rotation.x = Math.PI / 2; radar.position.y = 53; controller.add(radar); s.radar = radar;
    const controllerSig = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0x66e5ff, emissive: 0x33dfff, emissiveIntensity: 3.5 })); controllerSig.position.y = 68; controller.add(controllerSig); s.controllerSig = controllerSig;
    scene.add(controller);
    clickable.push({ object: controller, type: "trafficController", name: "AI Traffic Controller" });

    /* ===== SMART SECURITY GATES ===== */
    const securityGates = []; s.securityGates = securityGates;
    const gateBodyMat   = new THREE.MeshStandardMaterial({ color: 0x2a3640, roughness: 0.45, metalness: 0.55 });
    const gateStripeMat = new THREE.MeshStandardMaterial({ color: 0xff8a1f, emissive: 0xff8a1f, emissiveIntensity: 1.6, roughness: 0.4 });
    const gateHazardMat = new THREE.MeshStandardMaterial({ color: 0x111417, roughness: 0.7 });
    const gateLampRedMat   = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 2.5 });
    const gateLampAmberMat = new THREE.MeshStandardMaterial({ color: 0xffaa22, emissive: 0xffaa22, emissiveIntensity: 2.5 });
    const gateLampGreenMat = new THREE.MeshStandardMaterial({ color: 0x22ff66, emissive: 0x22ff66, emissiveIntensity: 2.5 });

    function buildSecurityGate(def) {
      const g = new THREE.Group();
      let worldX, worldZ, armAxis;
      if (def.axis === "z") { worldX = def.offset; worldZ = def.stop; armAxis = "x"; }
      else { worldX = def.stop; worldZ = def.offset; armAxis = "z"; }
      g.position.set(worldX, 5, worldZ); scene.add(g);

      const box = new THREE.Mesh(new THREE.BoxGeometry(18, BARRIER_POLE_HEIGHT, 14), gateBodyMat); box.position.y = BARRIER_POLE_HEIGHT / 2; g.add(box);
      const boxCap = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 16), gateHazardMat); boxCap.position.y = BARRIER_POLE_HEIGHT + 1.5; g.add(boxCap);
      const stripeBand = new THREE.Mesh(new THREE.BoxGeometry(19, 2, 15), gateStripeMat); stripeBand.position.y = BARRIER_POLE_HEIGHT * 0.65; g.add(stripeBand);
      const lampRed = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 12), gateLampRedMat.clone()); lampRed.position.set(0, BARRIER_POLE_HEIGHT + 6, 0); g.add(lampRed);
      const lampAmber = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 12), gateLampAmberMat.clone()); lampAmber.position.set(6, BARRIER_POLE_HEIGHT + 4, 0); g.add(lampAmber);
      const lampGreen = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 12), gateLampGreenMat.clone()); lampGreen.position.set(-6, BARRIER_POLE_HEIGHT + 4, 0); g.add(lampGreen);

      const hinge = new THREE.Group(); hinge.position.set(0, BARRIER_HINGE_Y, 0); g.add(hinge);
      const armGroup = new THREE.Group(); hinge.add(armGroup);
      const armLen = BARRIER_ARM_LENGTH;
      const armBar = new THREE.Mesh(new THREE.BoxGeometry(armLen, BARRIER_ARM_THICKNESS, BARRIER_ARM_THICKNESS), gateBodyMat); armBar.position.set(armLen / 2, 0, 0); armGroup.add(armBar);
      const stripeCount = 5;
      for (let i = 0; i < stripeCount; i++) {
        const st = new THREE.Mesh(new THREE.BoxGeometry(armLen / stripeCount - 2, BARRIER_ARM_THICKNESS + 0.4, BARRIER_ARM_THICKNESS + 0.4), i % 2 === 0 ? gateStripeMat : gateHazardMat);
        st.position.set((i + 0.5) * (armLen / stripeCount), 0, 0); armGroup.add(st);
      }
      const tipLamp = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 10), gateLampRedMat.clone()); tipLamp.position.set(armLen + 1.5, 0, 0); armGroup.add(tipLamp);
      if (armAxis === "z") { hinge.rotation.y = Math.PI / 2; }

      const stopLine = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, ROAD_W * 0.45), whiteLineMaterial);
      if (def.axis === "z") { stopLine.rotation.y = Math.PI / 2; stopLine.position.set(def.offset, 0.15, def.sign < 0 ? 6 : -6); }
      else { stopLine.position.set(def.sign < 0 ? -6 : 6, 0.15, def.offset); }
      g.add(stopLine);

      const chevMat = new THREE.MeshStandardMaterial({ color: 0xffaa22, emissive: 0xffaa22, emissiveIntensity: 1.4 });
      for (let i = 0; i < 4; i++) {
        const chev = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 6), chevMat);
        if (def.axis === "z") { chev.rotation.y = Math.PI / 2; chev.position.set(def.offset + (def.sign < 0 ? -8 : 8) - i * 6 * def.sign, 0.16, 0); }
        else { chev.position.set(0, 0.16, def.offset + (def.sign < 0 ? -8 : 8) - i * 6 * def.sign); }
        g.add(chev);
      }
      const cctvPole = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 30, 6), darkMaterial); cctvPole.position.set(18, 15, 0); g.add(cctvPole);
      const cctvArm = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 1), darkMaterial); cctvArm.position.set(22, 30, 0); g.add(cctvArm);
      const cctvBody = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 3), gateBodyMat); cctvBody.position.set(26, 29.5, 0); g.add(cctvBody);
      const cctvLens = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 10), new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 2.5 })); cctvLens.position.set(30, 29.5, 0); g.add(cctvLens);

      const signCanvas = document.createElement("canvas"); signCanvas.width = 1024; signCanvas.height = 256;
      const signCtx = signCanvas.getContext("2d");
      const signTex = new THREE.CanvasTexture(signCanvas); signTex.colorSpace = THREE.SRGBColorSpace;
      const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide });
      const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(70, 18), signMat); signMesh.position.set(0, BARRIER_POLE_HEIGHT + 20, 0); g.add(signMesh);
      const hitBox = new THREE.Mesh(new THREE.BoxGeometry(90, 70, 90), new THREE.MeshBasicMaterial({ visible: false })); hitBox.position.set(0, 35, 0); g.add(hitBox);

      const gateObj = { ...def, group: g, hinge, armGroup, lampRed, lampAmber, lampGreen, tipLamp, signCanvas, signCtx, signTex, signMesh, hitBox, status: "OPEN", aiState: "NORMAL", vehiclesDetected: 0, vehiclesWaiting: 0, density: "LOW", phase: "NORMAL" };
      securityGates.push(gateObj);
      clickable.push({ object: hitBox, type: "securityGate", name: gateObj.id + " · " + gateObj.label, gateRef: gateObj });
      return gateObj;
    }
    SECURITY_GATES_DEF.forEach((def) => buildSecurityGate(def));

    function redrawGateSign(gate, phaseText, statusText) {
      const ctx = gate.signCtx; const W = gate.signCanvas.width, H = gate.signCanvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(6,20,35,0.85)"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = statusText === "CLOSED" ? "#ff8a1f" : "#22cfff"; ctx.lineWidth = 8; ctx.strokeRect(6, 6, W - 12, H - 12);
      ctx.fillStyle = "#22cfff"; ctx.font = "bold 44px system-ui, Arial"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(gate.id + " · " + gate.label, 30, 60);
      ctx.fillStyle = statusText === "CLOSED" ? "#ff8a1f" : "#6aff9d"; ctx.font = "bold 56px system-ui, Arial";
      ctx.fillText("STATUS: " + statusText, 30, 150);
      ctx.fillStyle = "#7fe3ff"; ctx.font = "500 30px system-ui, Arial";
      ctx.fillText("AI CONTROL: ACTIVE · " + phaseText, 30, 210);
      gate.signTex.needsUpdate = true;
    }
    securityGates.forEach((g) => redrawGateSign(g, "NORMAL", "OPEN"));

    /* ===== GLB loader ===== */
    const loader = new GLTFLoader();
    function removeGroundFromGLB(model) {
      const toRemove = [];
      model.traverse((child) => {
        if (child.isMesh) {
          const name = (child.name || "").toLowerCase();
          if (name.includes("ground") || name.includes("floor") || name.includes("plane") || name.includes("terrain") || name.includes("grass") || name === "base" || name.includes("_base")) toRemove.push(child);
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
    function bld(file, size, pos, type, name, borderColor, stripGround = true, skipBorder = false) {
      const url = file.startsWith("/") ? file : "/" + file;
      loader.load(url, (g) => {
        const b = g.scene;
        prep(b, size, stripGround);
        b.position.set(pos[0], 5, pos[1]); scene.add(b);
        clickable.push({ object: b, type, name: name || type });
        if (!skipBorder) buildingBorder(pos[0], pos[1], size * 1.4, size * 1.4, borderColor || 0x22cfff);
      }, undefined, (err) => console.warn("GLB load failed:", url, err));
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
        const b = new THREE.Mesh(new THREE.SphereGeometry(4 + Math.random() * 3, 6, 5), mat(colors[Math.floor(Math.random() * colors.length)], 0.95));
        b.position.set((Math.random() - 0.5) * 6, 4 + Math.random() * 2, (Math.random() - 0.5) * 6); g.add(b);
      }
      scene.add(g);
    }
    function isOnRoad(x, z) {
      const clear = 130;
      for (const rz of roadZs) if (Math.abs(z - rz) < clear) return true;
      for (const rx of roadXs) if (Math.abs(x - rx) < clear) return true;
      return false;
    }
    function isInsideCity(x, z) { return Math.abs(x) < CITY_HALF - 200 && Math.abs(z) < CITY_HALF - 200; }

    const occupiedSpots = [
      { x: -600, z: -600, r: 260 }, { x: 600, z: -600, r: 250 }, { x: 600, z: 600, r: 300 },
      { x: 1800, z: -600, r: 400 }, { x: 600, z: 1800, r: 290 }, { x: 1800, z: 1750, r: 320 }, { x: 1800, z: 600, r: 290 },
      { x: 0, z: 0, r: 130 }, { x: -5400, z: 3600, r: 1200 }, { x: 3600, z: -3600, r: 600 },
      { x: -3600, z: -3600, r: 600 }, { x: 3600, z: 3600, r: 600 }, { x: -1800, z: 1800, r: 400 },
      { x: -600, z: 600, r: 500 }, { x: -1600, z: 800, r: 260 }, { x: -3900, z: -2400, r: 350 },
      { x: -3600, z: -800, r: 400 }, { x: -3600, z: 800, r: 350 }, { x: 900, z: 1400, r: 250 },
      { x: 2900, z: -2400, r: 400 }, { x: -900, z: -1500, r: 300 },
    ];
    function isOnBuilding(x, z) {
      for (const o of occupiedSpots) {
        const dx = x - o.x, dz = z - o.z;
        if (dx * dx + dz * dz < o.r * o.r) return true;
      }
      return false;
    }
    function isFree(x, z) { return isInsideCity(x, z) && !isOnRoad(x, z) && !isOnBuilding(x, z); }

    const TOWER_COLORS = [0x5b9bd5, 0x4a90e2, 0x7bb3e0, 0x6ba3d9, 0x82c0e8, 0x5090d0, 0xc0629b, 0xd475a8, 0xb84f8a, 0xe087b6, 0xf5a623, 0xf7b955, 0xe89b3e, 0xffc866, 0x6cd4a0, 0x4ec39a, 0x8adbb8, 0x5bc08a, 0x9b7ad9, 0xaa8ae0, 0x8a66c9, 0xbaa0e8, 0xe8635c, 0xd94f4a, 0xf0776b, 0x4a4a5c, 0x5a5a6e, 0x3d3d4e, 0x6a6a7e, 0xdde0e3, 0xc8ccd0, 0xb0b5bb, 0x22a5b8, 0x2bb8c9, 0x40c9d9];

    function tallTower(x, z, w, h, d, color) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const bMat = mat(color, 0.4, 0.55);
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bMat); body.position.y = h / 2; g.add(body);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 6, d * 0.95), mat(0x2a2a35, 0.5, 0.6)); cap.position.y = h + 3; g.add(cap);
      if (Math.random() > 0.4) {
        const antH = 30 + Math.random() * 40;
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, antH, 6), mat(0x9a9a9a, 0.4, 0.8)); ant.position.y = h + 6 + antH / 2; g.add(ant);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 4 })); beacon.position.y = h + 6 + antH; g.add(beacon);
      }
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, emissive: 0x66ccff, emissiveIntensity: 0.7, metalness: 0.6, roughness: 0.2 });
      for (let f = 1; f <= 4; f++) {
        const fy = (h / 5) * f;
        const line = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.6, d + 0.5), glassMat);
        line.position.y = fy; g.add(line);
      }
      const lightColor = [0xff6666, 0x66ff99, 0x66aaff, 0xffdd66][Math.floor(Math.random() * 4)];
      const spot = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), new THREE.MeshStandardMaterial({ color: lightColor, emissive: lightColor, emissiveIntensity: 3 }));
      spot.position.y = h + 8; g.add(spot);
      scene.add(g);
    }

    const solarPanelMat = new THREE.MeshStandardMaterial({ color: 0x082c4b, roughness: 0.18, metalness: 0.7, emissive: 0x063b62, emissiveIntensity: 0.7 });
    function solarPanelUnit(x, z, rotY = 0) {
      const g = new THREE.Group(); g.position.set(x, 5, z); g.rotation.y = rotY;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(28, 2, 20), mat(0x2a2a35, 0.5, 0.6)); frame.position.y = 3; g.add(frame);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(26, 0.6, 18), solarPanelMat); panel.position.y = 4.2; panel.rotation.x = -0.2; g.add(panel);
      for (const lx of [-10, 10]) for (const lz of [-7, 7]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 3, 6), mat(0x555a5e, 0.5, 0.7)); leg.position.set(lx, 1.5, lz); g.add(leg);
      }
      scene.add(g);
    }

    function buildSociety(centerX, centerZ) {
      const SOCIETY_W = 850, SOCIETY_D = 850;
      const HALF_W = SOCIETY_W / 2, HALF_D = SOCIETY_D / 2;
      const SOCIETY_GREEN = 0x2ecc71;
      const societyBorderMat = new THREE.MeshStandardMaterial({ color: SOCIETY_GREEN, emissive: SOCIETY_GREEN, emissiveIntensity: 2.4, metalness: 0.6, roughness: 0.25 });
      s.borderLights.push(societyBorderMat);
      const innerGround = new THREE.Mesh(new THREE.BoxGeometry(SOCIETY_W - 30, 0.6, SOCIETY_D - 30), mat(0xb8bcc0, 0.92)); innerGround.position.set(centerX, 4.85, centerZ); scene.add(innerGround);
      const grassPad = new THREE.Mesh(new THREE.BoxGeometry(SOCIETY_W + 50, 0.4, SOCIETY_D + 50), grassMaterial); grassPad.position.set(centerX, 4.6, centerZ); scene.add(grassPad);
      const WALL_H = 14, WALL_T = 6;
      const wallF = new THREE.Mesh(new THREE.BoxGeometry(SOCIETY_W + 12, WALL_H, WALL_T), societyBorderMat); wallF.position.set(centerX, 5 + WALL_H / 2, centerZ + HALF_D + 6); scene.add(wallF);
      const wallB = wallF.clone(); wallB.position.z = centerZ - HALF_D - 6; scene.add(wallB);
      const wallL = new THREE.Mesh(new THREE.BoxGeometry(WALL_T, WALL_H, SOCIETY_D + 12), societyBorderMat); wallL.position.set(centerX - HALF_W - 6, 5 + WALL_H / 2, centerZ); scene.add(wallL);
      const wallR = wallL.clone(); wallR.position.x = centerX + HALF_W + 6; scene.add(wallR);
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
        const cx = centerX + dx * (HALF_W + 6), cz = centerZ + dz * (HALF_D + 6);
        const p = new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 40, 12), societyBorderMat); p.position.set(cx, 25, cz); scene.add(p);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: SOCIETY_GREEN, emissiveIntensity: 3.5 })); cap.position.set(cx, 48, cz); scene.add(cap);
      }
      const gateLeft = new THREE.Mesh(new THREE.BoxGeometry(10, 30, 12), societyBorderMat); gateLeft.position.set(centerX - 50, 20, centerZ + HALF_D + 6); scene.add(gateLeft);
      const gateRight = gateLeft.clone(); gateRight.position.x = centerX + 50; scene.add(gateRight);
      const gateTop = new THREE.Mesh(new THREE.BoxGeometry(120, 8, 12), societyBorderMat); gateTop.position.set(centerX, 34, centerZ + HALF_D + 6); scene.add(gateTop);
      const towerRows = 4, towerCols = 3, innerMargin = 100;
      const usableW = SOCIETY_W - innerMargin * 2, usableD = SOCIETY_D - innerMargin * 2;
      for (let r = 0; r < towerRows; r++) for (let c = 0; c < towerCols; c++) {
        const tx = centerX - usableW / 2 + (c + 0.5) * (usableW / towerCols);
        const tz = centerZ - usableD / 2 + (r + 0.5) * (usableD / towerRows);
        const w = 28 + Math.random() * 14, d = 28 + Math.random() * 14, h = 180 + Math.random() * 180;
        tallTower(tx, tz, w, h, d, TOWER_COLORS[Math.floor(Math.random() * TOWER_COLORS.length)]);
      }
      for (let i = 0; i < 6; i++) solarPanelUnit(centerX - 250 + i * 100, centerZ + HALF_D - 60, 0);
      for (let i = 0; i < 6; i++) solarPanelUnit(centerX - 250 + i * 100, centerZ - HALF_D + 60, Math.PI);
      board("BSS SMART SOCIETY", centerX, 5, centerZ + HALF_D + 100, 280, 18, SOCIETY_GREEN);
    }
    const SOCIETY_X = -600, SOCIETY_Z = 600;
    buildSociety(SOCIETY_X, SOCIETY_Z);
    const societyGroup = new THREE.Group(); societyGroup.position.set(SOCIETY_X, 0, SOCIETY_Z);
    clickable.push({ object: societyGroup, type: "society", name: "BSS Smart Society" });

    bld("/commercial_building_concept.glb", 300, [-600, -600], "school", "American High School", 0x1a5490);
    bld("/low_poly_hospital.glb", 280, [600, -600], "hospital", "Smart Hospital", 0xc0392b);
    bld("/us_bank_tower.glb", 360, [600, 600], "bank", "State Bank", 0x8e44ad);
    buildingBorder(600, 600, 360 * 1.4 + 40, 360 * 1.4 + 40, 0xf39c12);
    buildingBorder(600, 600, 360 * 1.4 + 80, 360 * 1.4 + 80, 0x3498db);
    bld("/simple_farm_free.glb", 520, [1800, -600], "farm", "Smart Eco Farm", 0x27ae60);
    bld("/liverpool_street_station_south_entrance.glb", 420, [600, 1800], "newHall", "Liverpool Event Hall", 0xd4a017);
    bld("/gas_station.glb", 380, [1800, 1750], "carWash", "Gas Station · Car Wash", 0xc0392b);
    bld("/office.glb", 380, [1800, 600], "sewageCompany", "Sewage & Gas Co.", 0x2ecc71);
    bld("/brutalist_building.glb", 300, [2200, 600], "sewageCompany", "Old Office Building", 0x34495e);
    bld("/national_archives_research_center.glb", 480, [-1800, 1800], "cultureCenter", "Culture Center", 0xf39c12);
    bld("/power-suply-companey.glb", 380, [-1600, 800], "powerCompany", "City Power Supply Co.", 0xf1c40f);
    bld("/sci-fi_building_9.glb", 440, [-3900, -2400], "scifi9", "Sci-Fi Building 9", 0x66ff99);
    bld("/beautifultowerbuilding.glb", 520, [-3600, -800], "beautifulTower", "Beautiful Tower", 0x22cfff);
    bld("/sci-fi_building_10.glb", 440, [-3600, 800], "scifi10", "Sci-Fi Building 10", 0xff66dd);
    bld("/modernbuildings.glb", 480, [2900, 1200], "modernBuilding", "Modern Building Complex", 0x22cfff);
    bld("/low_poly_night_city_building_skyline.glb", 700, [2900, 2400], "skyline", "Downtown Skyline", 0xff66dd);
    bld("/great_hall.glb", 420, [-2900, 1600], "greatHall", "Great Hall", 0xffd15a);
    bld("/nearbank.glb", 240, [1000, -1200], "bank", "ATM Branch", 0xf1c40f);
    bld("/twobuildingsneedspace.glb", 300, [-2400, 2200], "modernBuilding", "Residential Pair", 0x6cd4a0);
    bld("/trash_pack.glb", 120, [1100, 1400], "wasteBin", "Trash Props", 0x2ecc71, true, true);
    bld("/modernbuildings.glb", 420, [-2900, 2400], "modernBuilding", "Modern West Block", 0x22cfff);
    bld("/commercial_building_concept.glb", 380, [2400, -1800], "commercial", "Commercial Hub", 0xf39c12);

    function resourceBorder(x, z, w, d, color = 0x00e0ff) {
      const bMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3.0, metalness: 0.7, roughness: 0.2 });
      s.borderLights.push(bMat);
      const front = new THREE.Mesh(new THREE.BoxGeometry(w + 12, 2, 5), bMat); front.position.set(x, 6.5, z + d / 2 + 6); scene.add(front);
      const back = front.clone(); back.position.z = z - d / 2 - 6; scene.add(back);
      const left = new THREE.Mesh(new THREE.BoxGeometry(5, 2, d + 12), bMat); left.position.set(x - w / 2 - 6, 6.5, z); scene.add(left);
      const right = left.clone(); right.position.x = x + w / 2 + 6; scene.add(right);
    }
    function buildDataCenter(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(220, 4, 220), mat(0x2a3846, 0.7, 0.3)); base.position.y = 2; g.add(base);
      const building = new THREE.Mesh(new THREE.BoxGeometry(180, 90, 180), mat(0x1a4a6a, 0.3, 0.5)); building.position.y = 49; g.add(building);
      const glass = new THREE.MeshStandardMaterial({ color: 0x2ac8ff, emissive: 0x2ac8ff, emissiveIntensity: 1.5, transparent: true, opacity: 0.65, metalness: 0.5, roughness: 0.15 });
      for (let f = 0; f < 3; f++) { const band = new THREE.Mesh(new THREE.BoxGeometry(182, 3, 182), glass); band.position.y = 20 + f * 25; g.add(band); }
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12), new THREE.MeshStandardMaterial({ color: 0x66e5ff, emissive: 0x33dfff, emissiveIntensity: 4.5 })); beacon.position.y = 100; g.add(beacon);
      scene.add(g); resourceBorder(x, z, 220, 220, 0x00e0ff); board("DATA CENTER", x, 5, z + 180, 200, 14, 0x00a8cc);
      clickable.push({ object: g, type: "dataCenter", name: "Smart Data Center" });
    }
    function buildTelecomTower(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(120, 3, 120), mat(0x2a2a3a, 0.8)); base.position.y = 1.5; g.add(base);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 5, 220, 6), mat(0xb0b8bc, 0.4, 0.7)); tower.position.y = 110; g.add(tower);
      for (let i = 0; i < 4; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(12, 0.8, 6, 16), new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff3333, emissiveIntensity: 3.5 })); ring.rotation.x = Math.PI / 2; ring.position.y = 60 + i * 40; g.add(ring); }
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 5 })); beacon.position.y = 230; g.add(beacon);
      scene.add(g); resourceBorder(x, z, 120, 120, 0xff4444); board("TELECOM TOWER", x, 5, z + 100, 220, 14, 0xcc2222);
      clickable.push({ object: g, type: "telecom", name: "Smart Telecom Tower" });
    }
    function buildWaterTower(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(90, 2, 90), mat(0x3a4a5a, 0.9)); base.position.y = 1; g.add(base);
      for (const lx of [-30, 30]) for (const lz of [-30, 30]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 120, 6), mat(0x8a9aa8, 0.4, 0.6)); leg.position.set(lx, 60, lz); g.add(leg); }
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(38, 38, 60, 16), mat(0x4a9ac8, 0.3, 0.5)); tank.position.y = 150; g.add(tank);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(40, 20, 16), mat(0x2a7aa8, 0.3, 0.5)); cap.position.y = 190; g.add(cap);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 10), new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 4 })); beacon.position.y = 205; g.add(beacon);
      scene.add(g); resourceBorder(x, z, 90, 90, 0x22cfff); board("WATER TOWER", x, 5, z + 90, 200, 14, 0x2a7aa8);
      clickable.push({ object: g, type: "waterTower", name: "Smart Water Tower" });
    }
    function buildEVStation(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(140, 1, 140), mat(0x2a3a2e, 0.9)); pad.position.y = 0.5; g.add(pad);
      for (let i = 0; i < 4; i++) {
        const px = (i - 1.5) * 32;
        const post = new THREE.Mesh(new THREE.BoxGeometry(8, 40, 8), mat(0x2ecc71, 0.4, 0.5)); post.position.set(px, 21, 0); g.add(post);
        const head = new THREE.Mesh(new THREE.BoxGeometry(14, 12, 14), new THREE.MeshStandardMaterial({ color: 0x0a2a1a, emissive: 0x2ecc71, emissiveIntensity: 2.5 })); head.position.set(px, 46, 0); g.add(head);
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(160, 2, 60), mat(0x0a3a1a, 0.5, 0.5)); roof.position.y = 68; g.add(roof);
      for (const rx of [-70, 70]) for (const rz of [-25, 25]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 68, 6), mat(0x4a5a4e, 0.5, 0.5)); leg.position.set(rx, 34, rz); g.add(leg); }
      scene.add(g); resourceBorder(x, z, 140, 140, 0x2ecc71); board("EV CHARGING", x, 5, z + 120, 200, 14, 0x2ecc71);
      clickable.push({ object: g, type: "ev", name: "EV Charging Station" });
    }
    function buildPoliceStation(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(180, 4, 180), mat(0x3a3a4a, 0.9)); base.position.y = 2; g.add(base);
      const building = new THREE.Mesh(new THREE.BoxGeometry(140, 70, 140), mat(0x2a3a6a, 0.4, 0.4)); building.position.y = 39; g.add(building);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(150, 4, 150), mat(0x1a2a4a, 0.5, 0.5)); roof.position.y = 76; g.add(roof);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 12), new THREE.MeshStandardMaterial({ color: 0x3388ff, emissive: 0x3388ff, emissiveIntensity: 4.5 })); beacon.position.y = 85; g.add(beacon);
      const red = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 10), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 5 })); red.position.set(-15, 82, 0); g.add(red);
      const blue = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 10), new THREE.MeshStandardMaterial({ color: 0x2266ff, emissive: 0x2266ff, emissiveIntensity: 5 })); blue.position.set(15, 82, 0); g.add(blue);
      scene.add(g); resourceBorder(x, z, 180, 180, 0x3388ff); board("POLICE STATION", x, 5, z + 160, 220, 14, 0x2a3a6a);
      clickable.push({ object: g, type: "police", name: "Smart Police Station" });
    }
    function buildFireStation(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(180, 4, 180), mat(0x4a2a2a, 0.9)); base.position.y = 2; g.add(base);
      const building = new THREE.Mesh(new THREE.BoxGeometry(150, 75, 130), mat(0xa02a2a, 0.4, 0.4)); building.position.y = 41; g.add(building);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(158, 4, 138), mat(0x6a1a1a, 0.5, 0.5)); roof.position.y = 81; g.add(roof);
      for (let i = 0; i < 3; i++) { const door = new THREE.Mesh(new THREE.BoxGeometry(28, 50, 4), new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff4444, emissiveIntensity: 1.5 })); door.position.set(-45 + i * 45, 30, 66); g.add(door); }
      scene.add(g); resourceBorder(x, z, 180, 180, 0xff4444); board("FIRE STATION", x, 5, z + 160, 220, 14, 0xa02a2a);
      clickable.push({ object: g, type: "fire", name: "Fire Station" });
    }
    function buildLibrary(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(200, 4, 200), mat(0x4a3a2a, 0.9)); base.position.y = 2; g.add(base);
      const building = new THREE.Mesh(new THREE.BoxGeometry(160, 80, 160), mat(0x8a6a3a, 0.5, 0.3)); building.position.y = 44; g.add(building);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(70, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xa88a4a, 0.4, 0.35)); dome.position.y = 84; g.add(dome);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffdd66, emissive: 0xffdd66, emissiveIntensity: 4 })); beacon.position.y = 158; g.add(beacon);
      scene.add(g); resourceBorder(x, z, 200, 200, 0xffdd66); board("SMART LIBRARY", x, 5, z + 180, 220, 14, 0x8a6a3a);
      clickable.push({ object: g, type: "library", name: "Smart Public Library" });
    }
    function buildHelipad(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(80, 80, 4, 32), mat(0x3a4a5a, 0.7, 0.4)); pad.position.y = 2; g.add(pad);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(60, 3, 8, 32), new THREE.MeshStandardMaterial({ color: 0xffdd22, emissive: 0xffdd22, emissiveIntensity: 3.5 })); ring.rotation.x = Math.PI / 2; ring.position.y = 4.5; g.add(ring);
      const hMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffdd22, emissiveIntensity: 2.0 });
      const bar1 = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 50), hMat); bar1.position.y = 5; g.add(bar1);
      const bar2 = bar1.clone(); bar2.position.z = -18; g.add(bar2);
      const bar3 = bar1.clone(); bar3.position.z = 18; g.add(bar3);
      const cross = new THREE.Mesh(new THREE.BoxGeometry(50, 1, 8), hMat); cross.position.y = 5; g.add(cross);
      scene.add(g); resourceBorder(x, z, 160, 160, 0xffdd22); board("EMERGENCY HELIPAD", x, 5, z + 130, 260, 14, 0xccaa22);
      clickable.push({ object: g, type: "helipad", name: "Emergency Helipad" });
    }
    function buildSmartParking(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(240, 2, 240), mat(0x3a3a3a, 0.95)); pad.position.y = 1; g.add(pad);
      const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
      for (let i = 0; i < 5; i++) { const line = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 60), lineMat); line.position.set(-80 + i * 40, 2.3, 0); g.add(line); }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(250, 3, 250), new THREE.MeshStandardMaterial({ color: 0x2a3a5a, emissive: 0x3388ff, emissiveIntensity: 1.2, metalness: 0.5, roughness: 0.3, transparent: true, opacity: 0.8 })); roof.position.y = 90; g.add(roof);
      for (const cx of [-120, 120]) for (const cz of [-120, 120]) { const pillar = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 90, 8), mat(0x4a5a6a, 0.4, 0.5)); pillar.position.set(cx, 45, cz); g.add(pillar); }
      scene.add(g); resourceBorder(x, z, 240, 240, 0x3388ff); board("SMART PARKING", x, 5, z + 200, 220, 14, 0x2a3a5a);
      clickable.push({ object: g, type: "parking", name: "Smart Parking" });
    }
    function buildPublicGarden(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(110, 110, 2, 24), mat(0x3a8a3a, 0.95)); pad.position.y = 1; g.add(pad);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        tree(x + Math.cos(a) * 80, z + Math.sin(a) * 80, 0.6 + Math.random() * 0.3);
      }
      const fountain = new THREE.Mesh(new THREE.CylinderGeometry(20, 25, 8, 16), mat(0x9aa0a6, 0.5, 0.6)); fountain.position.set(0, 5, 0); g.add(fountain);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 2, 16), new THREE.MeshStandardMaterial({ color: 0x32dfff, emissive: 0x32dfff, emissiveIntensity: 2.5, transparent: true, opacity: 0.8 })); water.position.set(0, 10, 0); g.add(water);
      scene.add(g); resourceBorder(x, z, 220, 220, 0x22c866); board("PUBLIC GARDEN", x, 5, z + 150, 200, 14, 0x2a8a2a);
    }
    buildDataCenter(2900, 1000); buildTelecomTower(-2900, -300); buildWaterTower(2800, -1600);
    buildEVStation(-2700, 2500); buildPoliceStation(2400, -2900); buildFireStation(-2400, -2900);
    buildLibrary(2800, 2800); buildHelipad(-2800, -1500); buildSmartParking(-2800, 1200); buildPublicGarden(2000, 2800);

    buildVerticalFarm(2900, -2400, 6);
    const homeNames = ["SMART HOME 01","SMART HOME 02","SMART HOME 03","SMART HOME 04","SMART HOME 05","SMART HOME 06"];
    const homeColors = [0xd9c5a0, 0xc9a870, 0xe8d0b0, 0xb8a080, 0xd0b890, 0xc0a880];
    for (let i = 0; i < 6; i++) {
      buildSmartHome(-1400 + i * 200, -1500, homeNames[i], homeColors[i], (i % 2) * Math.PI);
    }
    buildInfoBoard(-900, -1900,
      "Smart Homes Community",
      "IoT · Solar · AI Living",
      [
        { t: "Solar Roof", d: "100% Renewable" },
        { t: "Smart Meter", d: "Live Usage" },
        { t: "AI Climate", d: "Auto Comfort" },
        { t: "Smart Lock", d: "Face + App" },
        { t: "Energy Class", d: "A+" },
        { t: "IoT Devices", d: "18 per Home" }
      ], 0x3a6a8a);

    const wcGroup = new THREE.Group(); wcGroup.position.set(900, 5, 1400); scene.add(wcGroup);
    const wcPad = new THREE.Mesh(new THREE.BoxGeometry(280, 0.8, 280), mat(0x2a3a2e, 0.95)); wcPad.position.y = 0.4; wcGroup.add(wcPad);
    const wcBorderMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 2.5, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(wcBorderMat);
    const wcF = new THREE.Mesh(new THREE.BoxGeometry(280, 1.5, 4), wcBorderMat); wcF.position.set(0, 1, 140); wcGroup.add(wcF);
    const wcB = wcF.clone(); wcB.position.z = -140; wcGroup.add(wcB);
    const wcL = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 280), wcBorderMat); wcL.position.set(-140, 1, 0); wcGroup.add(wcL);
    const wcR = wcL.clone(); wcR.position.x = 140; wcGroup.add(wcR);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const bin = new THREE.Group(); bin.position.set(-80 + c * 80, 0, -80 + r * 80);
      const body = new THREE.Mesh(new THREE.BoxGeometry(40, 26, 40), mat(0x2ecc71, 0.5, 0.5)); body.position.y = 13; bin.add(body);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(42, 2, 42), mat(0x1a1a1a, 0.6, 0.3)); lid.position.y = 27; bin.add(lid);
      wcGroup.add(bin);
    }
    board("WASTE COLLECTOR", 900, 5, 1600, 260, 16, 0x2ecc71);
    clickable.push({ object: wcGroup, type: "wasteCollector", name: "Waste Collector Point" });

    board("AMERICAN HIGH SCHOOL", -600, 5, -950, 200, 14, 0x1a5490);
    board("BSS SMART HOSPITAL", 600, 5, -950, 200, 14, 0xc0392b);
    board("SMART CITY STATE BANK", 600, 5, 950, 200, 14, 0x8e44ad);
    board("SMART ECO FARM", 1800, 5, -950, 200, 14, 0x27ae60);
    board("LIVERPOOL EVENT HALL", 600, 5, 2250, 280, 16, 0xd4a017);
    board("CAR WASH · GAS STATION", 1800, 5, 2200, 220, 16, 0xc0392b);
    board("SEWAGE & GAS CO.", 1800, 5, 300, 240, 16, 0x2ecc71);
    board("CULTURE CENTER", -1800, 5, 2400, 260, 18, 0xf39c12);
    board("CITY POWER SUPPLY CO.", -1600, 5, 400, 300, 16, 0xf1c40f);
    board("AI TRAFFIC CONTROLLER", 0, 5, 300, 190, 14);
    board("SCI-FI BUILDING 9", -3900, 5, -2080, 260, 16, 0x66ff99);
    board("BEAUTIFUL TOWER", -3600, 5, -480, 260, 16, 0x22cfff);
    board("SCI-FI BUILDING 10", -3600, 5, 1120, 260, 16, 0xff66dd);
    board("VERTICAL FARM TOWERS", 2900, 5, -2080, 320, 18, 0x2a8a4a);

    function shop(x, z, scale = 1.4, name) {
      loader.load("/dagashiya_shop_japanese_old_snack_shop.glb", (g) => {
        const sm = g.scene; prep(sm, 50 * scale); sm.position.set(x, 5, z); scene.add(sm);
        clickable.push({ object: sm, type: "shop", name: name || "Dagashiya Snack Shop" });
      }, undefined, () => {});
    }
    shop(-1000, -600, 1.4, "School Canteen");
    shop(1000, -600, 1.4, "Hospital Canteen");
    shop(1000, 600, 1.4, "Bank Shop");

    /* ===== POWER SUPPLY ZONE ===== */
    const powerZone = new THREE.Group(); powerZone.position.set(-5400, 0, 3600); scene.add(powerZone);
    board("POWER SUPPLY (OUT-OF-CITY)", -5400, 5, 4600, 460, 22, 0x0a4d5c);
    const powerBasePad = new THREE.Mesh(new THREE.BoxGeometry(2400, 0.8, 1800), mat(0x2a3238, 0.92)); powerBasePad.position.set(0, 4.3, 0); powerZone.add(powerBasePad);
    const powerLinkRoad = new THREE.Mesh(new THREE.BoxGeometry(1900, 0.45, 90), roadMaterial); powerLinkRoad.position.set(1250, 4.7, -1800); powerZone.add(powerLinkRoad);
    const powerLinkLine = new THREE.Mesh(new THREE.BoxGeometry(1900, 0.1, 2), yellowLineMaterial); powerLinkLine.position.set(1250, 5, -1800); powerZone.add(powerLinkLine);
    const powerPad = new THREE.Mesh(new THREE.BoxGeometry(1600, 1, 1300), mat(0x1d3a2e, 0.92)); powerPad.position.y = 4.2; powerZone.add(powerPad);
    const powerBorderMat = new THREE.MeshStandardMaterial({ color: 0x00e0ff, emissive: 0x00cfff, emissiveIntensity: 2.5, metalness: 0.7, roughness: 0.2 });
    s.borderLights.push(powerBorderMat);
    const pbF = new THREE.Mesh(new THREE.BoxGeometry(1600, 1.6, 5), powerBorderMat); pbF.position.set(0, 6.5, -650); powerZone.add(pbF);
    const pbB = pbF.clone(); pbB.position.z = 650; powerZone.add(pbB);
    const pbL = new THREE.Mesh(new THREE.BoxGeometry(5, 1.6, 1300), powerBorderMat); pbL.position.set(-800, 6.5, 0); powerZone.add(pbL);
    const pbR = pbL.clone(); pbR.position.x = 800; powerZone.add(pbR);
    for (const cx of [-800, 800]) for (const cz of [-650, 650]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.5, 32, 10), powerBorderMat); p.position.set(cx, 20, cz); powerZone.add(p);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(3.6, 10, 10), new THREE.MeshStandardMaterial({ color: 0x66e5ff, emissive: 0x33dfff, emissiveIntensity: 3 })); cap.position.set(cx, 38, cz); powerZone.add(cap);
    }
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
      for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(turbBladeGeo, turbTowerMat); b.position.y = 12.5; b.rotation.z = i * Math.PI * 2 / 3; blades.add(b); }
      g.add(blades); powerZone.add(g); turbines.push(blades);
    }
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) turbine(-650 + col * 200, -600 + row * 220, 1 + (row % 3) * 0.08);

    const solarPark = new THREE.Group(); solarPark.position.set(500, 0, 0); powerZone.add(solarPark);
    const solarGround = new THREE.Mesh(new THREE.BoxGeometry(650, 0.8, 1250), mat(0x2a4536, 0.92)); solarGround.position.y = 5; solarPark.add(solarGround);
    const solarPanelGeo = new THREE.BoxGeometry(1, 1, 1);
    function solarArray(x, z, w, d, rows, cols) {
      const g = new THREE.Group(); g.position.set(x, 8, z); g.rotation.x = -0.22;
      const pw = w / cols - 3, pd = d / rows - 3;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const p = new THREE.Mesh(solarPanelGeo, solarPanelMat);
        p.scale.set(pw, 0.5, pd);
        p.position.set((c - (cols - 1) / 2) * (w / cols), 0, (r - (rows - 1) / 2) * (d / rows)); g.add(p);
      }
      solarPark.add(g);
    }
    for (let i = 0; i < 5; i++) { solarArray(-160, -480 + i * 220, 280, 180, 2, 4); solarArray(160, -480 + i * 220, 280, 180, 2, 4); }
    const solarControl = new THREE.Mesh(new THREE.BoxGeometry(36, 58, 28), mat(0x15536a, 0.25, 0.35)); solarControl.position.set(0, 38, 0); solarPark.add(solarControl);
    const solarScreen = new THREE.Mesh(new THREE.BoxGeometry(22, 13, 0.6), new THREE.MeshStandardMaterial({ color: 0x04151d, emissive: 0x20d9ff, emissiveIntensity: 2.6 })); solarScreen.position.set(0, 42, -14.4); solarPark.add(solarScreen);

    const batteryRings = []; s.batteryRings = batteryRings;
    const batteryPositions = [[-500, 850], [-370, 850], [-240, 850], [-110, 850], [20, 850], [-500, 980], [-370, 980], [-240, 980], [-110, 980], [20, 980]];
    batteryPositions.forEach((pos, i) => {
      loader.load("/battery.glb", (g) => {
        const b = g.scene; prep(b, 60); b.position.set(pos[0], 6, pos[1]); b.rotation.y = Math.PI / 2;
        powerZone.add(b);
        const rMat = new THREE.MeshStandardMaterial({ color: 0x22ff9d, emissive: 0x22ff9d, emissiveIntensity: 2.0 });
        const r = new THREE.Mesh(new THREE.TorusGeometry(28, 0.8, 6, 16), rMat); r.rotation.x = Math.PI / 2; r.position.set(pos[0], 7, pos[1]); powerZone.add(r);
        batteryRings.push(rMat); clickable.push({ object: b, type: "battery", name: "Battery " + (i + 1) });
      }, undefined, () => {});
    });

    /* ===== FILTRATION SYSTEM ===== */
    const filtZone = new THREE.Group(); filtZone.position.set(3600, 0, -3600); scene.add(filtZone);
    board("FILTRATION SYSTEM", 3600, 5, -2700, 380, 18, 0x22cfff);
    const filtPad = new THREE.Mesh(new THREE.BoxGeometry(950, 1, 950), mat(0x1a2836, 0.95)); filtPad.position.y = 4.2; filtZone.add(filtPad);
    const filtBorderMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 2.5, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(filtBorderMat);
    const fzF = new THREE.Mesh(new THREE.BoxGeometry(950, 1.8, 6), filtBorderMat); fzF.position.set(0, 6.5, -475); filtZone.add(fzF);
    const fzB = fzF.clone(); fzB.position.z = 475; filtZone.add(fzB);
    const fzL = new THREE.Mesh(new THREE.BoxGeometry(6, 1.8, 950), filtBorderMat); fzL.position.set(-475, 6.5, 0); filtZone.add(fzL);
    const fzR = fzL.clone(); fzR.position.x = 475; filtZone.add(fzR);

    const filtBoxGroup = new THREE.Group(); filtBoxGroup.position.set(0, 5, 0); filtZone.add(filtBoxGroup);
    const filtBase = new THREE.Mesh(new THREE.BoxGeometry(260, 4, 260), mat(0x2c3e50, 0.7, 0.3)); filtBase.position.y = 2; filtBoxGroup.add(filtBase);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 0.5, metalness: 0.3, roughness: 0.15, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(260, 120, 3), glassMat); wallFront.position.set(0, 62, 130); filtBoxGroup.add(wallFront);
    const wallBack = wallFront.clone(); wallBack.position.z = -130; filtBoxGroup.add(wallBack);
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(3, 120, 260), glassMat); wallLeft.position.set(-130, 62, 0); filtBoxGroup.add(wallLeft);
    const wallRight = wallLeft.clone(); wallRight.position.x = 130; filtBoxGroup.add(wallRight);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x22cfff, emissiveIntensity: 0.3, metalness: 0.6, roughness: 0.25, transparent: true, opacity: 0.6 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(270, 3, 270), roofMat); roof.position.y = 124; filtBoxGroup.add(roof);
    loader.load("/skid_filtration_system.glb", (g) => { const m = g.scene; prep(m, 170); m.position.set(0, 6, 0); filtBoxGroup.add(m); clickable.push({ object: m, type: "filtrationMachine", name: "Filtration Machine" }); }, undefined, () => {});

    const tankGroup = new THREE.Group(); tankGroup.position.set(0, 5, 0); filtZone.add(tankGroup);
    s.filtrationStageMeshes = [];
    const TANK_GRID = 3, TANK_SPACING = 75;
    for (let i = 0; i < FILTRATION_STAGES.length; i++) {
      const row = Math.floor(i / TANK_GRID), col = i % TANK_GRID;
      const tx = (col - 1) * TANK_SPACING, tz = (row - 1) * TANK_SPACING;
      const tankColor = FILTRATION_STAGES[i].color;
      const tankMat = new THREE.MeshStandardMaterial({ color: tankColor, emissive: tankColor, emissiveIntensity: 0.4, metalness: 0.3, roughness: 0.3, transparent: true, opacity: 0.75 });
      const tankBody = new THREE.Mesh(new THREE.CylinderGeometry(22, 24, 40, 16), tankMat); tankBody.position.set(tx, 22, tz); tankGroup.add(tankBody);
      const tankCap = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), tankMat); tankCap.position.set(tx, 42, tz); tankGroup.add(tankCap);
      const waterMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 1.2, transparent: true, opacity: 0.75, metalness: 0.4, roughness: 0.1 });
      const waterFill = new THREE.Mesh(new THREE.CylinderGeometry(19, 19, 1, 16), waterMat); waterFill.position.set(tx, 8, tz); tankGroup.add(waterFill);
      s.filtrationStageMeshes.push({ tankBody, tankCap, waterFill, baseY: 8, stageIndex: i });
    }
    const flowMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 1.5, metalness: 0.6, roughness: 0.2 });
    s.filtrationFlowMeshes = [];
    for (let i = 0; i < FILTRATION_STAGES.length - 1; i++) {
      const a = s.filtrationStageMeshes[i], b = s.filtrationStageMeshes[i + 1];
      const ax = a.tankBody.position.x, az = a.tankBody.position.z;
      const bx = b.tankBody.position.x, bz = b.tankBody.position.z;
      const midX = (ax + bx) / 2, midZ = (az + bz) / 2;
      const dx = bx - ax, dz = bz - az, len = Math.sqrt(dx * dx + dz * dz);
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, len, 8), flowMat);
      pipe.position.set(midX, 14, midZ); pipe.rotation.z = Math.PI / 2; pipe.rotation.y = -Math.atan2(dz, dx); tankGroup.add(pipe);
      const flowDot = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x22cfff, emissiveIntensity: 4 })); flowDot.position.set(ax, 14, az); tankGroup.add(flowDot);
      s.filtrationFlowMeshes.push({ pipe, dot: flowDot, from: { x: ax, z: az }, to: { x: bx, z: bz }, phase: i * 0.11 });
    }
    const uvLight = new THREE.PointLight(0x9a6aff, 2, 250); uvLight.position.set(0, 60, 0); tankGroup.add(uvLight); s.filtrationUVLight = uvLight;
    const uvBulb = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 12), new THREE.MeshStandardMaterial({ color: 0x9a6aff, emissive: 0x9a6aff, emissiveIntensity: 5 })); uvBulb.position.set(0, 60, 0); tankGroup.add(uvBulb);

    const reservoirMat = new THREE.MeshStandardMaterial({ color: 0x0a4a6a, roughness: 0.3, metalness: 0.5, emissive: 0x0a2a4a, emissiveIntensity: 0.6 });
    const reservoir = new THREE.Mesh(new THREE.CylinderGeometry(50, 55, 40, 24), reservoirMat); reservoir.position.set(-320, 25, 0); filtZone.add(reservoir);
    const resWaterMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 1.6, transparent: true, opacity: 0.8, metalness: 0.4, roughness: 0.1 });
    const resWater = new THREE.Mesh(new THREE.CylinderGeometry(46, 46, 4, 24), resWaterMat); resWater.position.set(-320, 42, 0); filtZone.add(resWater);
    const resCap = new THREE.Mesh(new THREE.SphereGeometry(52, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), reservoirMat); resCap.position.set(-320, 45, 0); filtZone.add(resCap);
    s.filtrationCleanReservoir = { reservoir, resWater, resCap };

    const recyclePipeMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 1.5, metalness: 0.6, roughness: 0.25 });
    const recyclePipe = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 280, 10), recyclePipeMat);
    recyclePipe.rotation.z = Math.PI / 2; recyclePipe.rotation.y = 0.35; recyclePipe.position.set(-180, 14, -20); filtZone.add(recyclePipe);

    const waterParticles = []; s.waterParticles = waterParticles;
    for (let i = 0; i < 24; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(1.4, 6, 6), new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 2.5 }));
      p.position.set((Math.random() - 0.5) * 200, 20 + Math.random() * 80, (Math.random() - 0.5) * 200);
      filtBoxGroup.add(p);
      waterParticles.push({ mesh: p, speed: 0.4 + Math.random() * 0.6, baseY: 18 + Math.random() * 80 });
    }
    const pumpRings = []; s.filtrationPumpRings = pumpRings;
    for (let i = 0; i < 3; i++) {
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x22cfff, emissive: 0x22cfff, emissiveIntensity: 2.5, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(90 + i * 22, 1.2, 8, 48), ringMat);
      ring.rotation.x = Math.PI / 2; ring.position.set(0, 7 + i * 2, 0); ring.userData = { phase: i * 0.4, baseScale: 1 };
      filtZone.add(ring); pumpRings.push(ring);
    }

    /* ===== FERTILIZER SYSTEM ===== */
    const fertZone = new THREE.Group(); fertZone.position.set(-3600, 0, -3600); scene.add(fertZone);
    board("AI FERTILIZER SYSTEM", -3600, 5, -2700, 420, 22, 0x8e44ad);
    const fertPad = new THREE.Mesh(new THREE.BoxGeometry(950, 1, 950), mat(0x2a1e3a, 0.95)); fertPad.position.y = 4.2; fertZone.add(fertPad);
    const fertBorderMat = new THREE.MeshStandardMaterial({ color: 0xb266ff, emissive: 0xb266ff, emissiveIntensity: 2.2, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(fertBorderMat);
    const ftF = new THREE.Mesh(new THREE.BoxGeometry(950, 1.8, 6), fertBorderMat); ftF.position.set(0, 6.5, -475); fertZone.add(ftF);
    const ftB = ftF.clone(); ftB.position.z = 475; fertZone.add(ftB);
    const ftL = new THREE.Mesh(new THREE.BoxGeometry(6, 1.8, 950), fertBorderMat); ftL.position.set(-475, 6.5, 0); fertZone.add(ftL);
    const ftR = ftL.clone(); ftR.position.x = 475; fertZone.add(ftR);
    const fertOffice = new THREE.Mesh(new THREE.BoxGeometry(60, 80, 60), mat(0x4a2c6b, 0.3, 0.4)); fertOffice.position.set(0, 45, 0); fertZone.add(fertOffice);
    const fertOfficeUpper = new THREE.Mesh(new THREE.BoxGeometry(50, 24, 50), new THREE.MeshStandardMaterial({ color: 0x2a1e3a, emissive: 0x8e44ad, emissiveIntensity: 1.5, metalness: 0.5, roughness: 0.15 })); fertOfficeUpper.position.set(0, 97, 0); fertZone.add(fertOfficeUpper);
    const fertBeacon = new THREE.Mesh(new THREE.SphereGeometry(5, 14, 14), new THREE.MeshStandardMaterial({ color: 0xb266ff, emissive: 0xb266ff, emissiveIntensity: 3.5 })); fertBeacon.position.set(0, 118, 0); fertZone.add(fertBeacon);
    for (const cx of [-200, -100, 100, 200]) {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(22, 26, 60, 16), mat(0x5a3e7d, 0.4, 0.35)); tank.position.set(cx, 30, -350); fertZone.add(tank);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7a5a9d, 0.3, 0.5)); cap.position.set(cx, 60, -350); fertZone.add(cap);
      const light = new THREE.Mesh(new THREE.SphereGeometry(2.5, 10, 10), new THREE.MeshStandardMaterial({ color: 0xb266ff, emissive: 0xb266ff, emissiveIntensity: 3 })); light.position.set(cx, 72, -350); fertZone.add(light);
    }

    /* ===== WASTE MANAGEMENT ===== */
    const wasteZone = new THREE.Group(); wasteZone.position.set(3600, 0, 3600); scene.add(wasteZone);
    board("WASTE MANAGEMENT", 3600, 5, 4500, 380, 18, 0x2ecc71);
    const wastePad = new THREE.Mesh(new THREE.BoxGeometry(950, 1, 950), mat(0x2a3a2e, 0.95)); wastePad.position.y = 4.2; wasteZone.add(wastePad);
    const wasteBorderMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 2.2, metalness: 0.6, roughness: 0.2 });
    s.borderLights.push(wasteBorderMat);
    const wbF = new THREE.Mesh(new THREE.BoxGeometry(950, 1.4, 5), wasteBorderMat); wbF.position.set(0, 6.5, -475); wasteZone.add(wbF);
    const wbB = wbF.clone(); wbB.position.z = 475; wasteZone.add(wbB);
    const wbL = new THREE.Mesh(new THREE.BoxGeometry(5, 1.4, 950), wasteBorderMat); wbL.position.set(-475, 6.5, 0); wasteZone.add(wbL);
    const wbR = wbL.clone(); wbR.position.x = 475; wasteZone.add(wbR);
    function wasteDumpster(x, z) {
      const g = new THREE.Group(); g.position.set(x, 5, z);
      const body = new THREE.Mesh(new THREE.BoxGeometry(38, 22, 26), mat(0x2ecc71, 0.5, 0.5)); body.position.y = 11; g.add(body);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 28), mat(0x1a1a1a, 0.6, 0.3)); lid.position.set(0, 23, -3); lid.rotation.x = -0.15; g.add(lid);
      const glowMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 2.5 });
      const glow = new THREE.Mesh(new THREE.BoxGeometry(38, 1.5, 26.5), glowMat); glow.position.y = 22; g.add(glow);
      wasteZone.add(g); clickable.push({ object: g, type: "wasteBin", name: "Waste Container" });
    }
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) wasteDumpster(-280 + col * 190, -300 + row * 220);
    const recycleMachine = new THREE.Mesh(new THREE.BoxGeometry(120, 100, 120), mat(0x1a8a4e, 0.4, 0.5)); recycleMachine.position.set(0, 55, 0); wasteZone.add(recycleMachine);
    const recycleTop = new THREE.Mesh(new THREE.BoxGeometry(100, 20, 100), new THREE.MeshStandardMaterial({ color: 0x0a5a2e, emissive: 0x2ecc71, emissiveIntensity: 1.5, metalness: 0.5, roughness: 0.2 })); recycleTop.position.set(0, 115, 0); wasteZone.add(recycleTop);
    const recycleRing = new THREE.Mesh(new THREE.TorusGeometry(80, 2, 8, 32), new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 2.5 })); recycleRing.rotation.x = Math.PI / 2; recycleRing.position.set(0, 10, 0); wasteZone.add(recycleRing);

    /* ===== TRUCKS ===== */
    function buildTruck(c1, c2, label, txtColor) {
      const truck = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(100, 68, 44), mat(c1, 0.4, 0.3)); box.position.y = 45; truck.add(box);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(38, 44, 44), mat(c2, 0.4, 0.4)); cabin.position.set(65, 35, 0); truck.add(cabin);
      const win = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 34), new THREE.MeshStandardMaterial({ color: 0x8be8ff, transparent: true, opacity: 0.7, roughness: 0.1, metalness: 0.3 })); win.position.set(84, 42, 0); truck.add(win);
      const wm = mat(0x0c1012, 0.6, 0.1);
      const wg = new THREE.CylinderGeometry(12, 12, 8, 12);
      for (const wx of [-36, 36, 60]) for (const wz of [-20, 20]) { const w = new THREE.Mesh(wg, wm); w.rotation.x = Math.PI / 2; w.position.set(wx, 12, wz); truck.add(w); }
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
      const warn = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 10), new THREE.MeshStandardMaterial({ color: 0xff8a00, emissive: 0xff8a00, emissiveIntensity: 3 })); warn.position.set(0, 82, 0); truck.add(warn);
      return { truck, warn };
    }
    const g1 = buildTruck(0x3498db, 0x2980b9, "WASTE|MANAGEMENT", "#3498db");
    const garbageTruck = g1.truck; scene.add(garbageTruck); s.trucks.garbage = garbageTruck; s.garbageWarn = g1.warn;
    const g2 = buildTruck(0xb266ff, 0x7a3b9d, "AI FERTILIZER", "#8e44ad");
    const fertTruck1 = g2.truck; scene.add(fertTruck1); s.trucks.fert1 = fertTruck1; s.fertWarn1 = g2.warn;
    const g3 = buildTruck(0xd8b3ff, 0x8e44ad, "AI FERTILIZER", "#8e44ad");
    const fertTruck2 = g3.truck; scene.add(fertTruck2); s.trucks.fert2 = fertTruck2; s.fertWarn2 = g3.warn;

    /* ===== CITY CARS ===== */
    const cityCars = []; s.cityCars = cityCars;
    const carColors = [0x287ca3, 0xc83f49, 0xe1a72e, 0x5b72c9, 0x2f9d65, 0xd8d8d8, 0xd97b2a, 0x8b3ad9, 0x16a085, 0x8e44ad, 0xf39c12, 0xe74c3c, 0x1abc9c, 0x3498db, 0xe91e63, 0x9b59b6, 0xff5722, 0x00bcd4, 0x795548, 0x607d8b, 0xff9800, 0x3f51b5];
    const V_LEN = 26, V_WID = 10, V_HGT = 5.5;
    const carBodyGeo = new THREE.BoxGeometry(V_LEN, V_HGT, V_WID);
    const carHoodGeo = new THREE.BoxGeometry(V_LEN * 0.25, V_HGT * 0.55, V_WID * 0.95);
    const carCabinGeo = new THREE.BoxGeometry(V_LEN * 0.42, V_HGT * 0.85, V_WID * 0.88);
    const carWheelGeo = new THREE.CylinderGeometry(2.4, 2.4, 1.6, 10);
    const carWheelHubGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.7, 8);
    const carLightGeo = new THREE.BoxGeometry(1.5, 1.6, 1.9);
    const carGlassMat = new THREE.MeshStandardMaterial({ color: 0x1a3a4a, emissive: 0x0a2535, emissiveIntensity: 0.6, roughness: 0.12, metalness: 0.5 });
    const wheelMat = mat(0x0c1012, 0.6, 0.1);
    const hubMat = mat(0xa0a8ac, 0.3, 0.7);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8e0, emissiveIntensity: 3.0 });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff1e1e, emissive: 0xff1010, emissiveIntensity: 3.0 });

    function makeCar(colorHex, style = "sedan") {
      const g = new THREE.Group();
      const bMat = mat(colorHex, 0.35, 0.5);
      const roofColor = [0x1a1a1a, 0x2a2a2a, 0x3a3a3a][Math.floor(Math.random() * 3)];
      if (style === "suv") {
        const body = new THREE.Mesh(new THREE.BoxGeometry(V_LEN * 1.1, V_HGT * 1.1, V_WID * 1.05), bMat); body.position.y = 4.4; g.add(body);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(V_LEN * 0.6, V_HGT * 1.1, V_WID * 0.92), carGlassMat); cabin.position.set(-1, 10, 0); g.add(cabin);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(V_LEN * 0.55, 0.5, V_WID * 0.7), mat(roofColor, 0.5, 0.4)); roof.position.set(-1, 13.5, 0); g.add(roof);
      } else if (style === "sport") {
        const body = new THREE.Mesh(new THREE.BoxGeometry(V_LEN * 1.05, V_HGT * 0.85, V_WID * 1.05), bMat); body.position.y = 3.8; g.add(body);
        const hood = new THREE.Mesh(new THREE.BoxGeometry(V_LEN * 0.35, V_HGT * 0.4, V_WID * 0.98), bMat); hood.position.set(V_LEN * 0.4, 4, 0); g.add(hood);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(V_LEN * 0.35, V_HGT * 0.7, V_WID * 0.85), carGlassMat); cabin.position.set(-3, 8, 0); g.add(cabin);
        const spoiler = new THREE.Mesh(new THREE.BoxGeometry(V_LEN * 0.25, 0.6, V_WID * 1.05), mat(roofColor, 0.4, 0.5)); spoiler.position.set(-V_LEN * 0.42, 7.5, 0); g.add(spoiler);
      } else {
        const body = new THREE.Mesh(carBodyGeo, bMat); body.position.y = 4.2; g.add(body);
        const hood = new THREE.Mesh(carHoodGeo, bMat); hood.position.set(V_LEN * 0.36, 4, 0); g.add(hood);
        const trunk = new THREE.Mesh(carHoodGeo, bMat); trunk.position.set(-V_LEN * 0.36, 4, 0); g.add(trunk);
        const cabin = new THREE.Mesh(carCabinGeo, carGlassMat); cabin.position.set(-1, 8.8, 0); g.add(cabin);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(V_LEN * 0.35, 0.4, V_WID * 0.6), mat(roofColor, 0.5, 0.3)); roof.position.set(-1, 12, 0); g.add(roof);
      }
      for (const wp of [[V_LEN * 0.32, V_WID * 0.48], [V_LEN * 0.32, -V_WID * 0.48], [-V_LEN * 0.32, V_WID * 0.48], [-V_LEN * 0.32, -V_WID * 0.48]]) {
        const w = new THREE.Mesh(carWheelGeo, wheelMat); w.rotation.x = Math.PI / 2; w.position.set(wp[0], 2.8, wp[1]); g.add(w);
        const h = new THREE.Mesh(carWheelHubGeo, hubMat); h.rotation.x = Math.PI / 2; h.position.set(wp[0], 2.8, wp[1]); g.add(h);
      }
      const tailLightL = new THREE.Mesh(carLightGeo, tailMat.clone()); tailLightL.position.set(-V_LEN * 0.49, 4.5, 3.2); g.add(tailLightL);
      const tailLightR = new THREE.Mesh(carLightGeo, tailMat.clone()); tailLightR.position.set(-V_LEN * 0.49, 4.5, -3.2); g.add(tailLightR);
      for (const z of [-3.2, 3.2]) { const l = new THREE.Mesh(carLightGeo, headMat); l.position.set(V_LEN * 0.49, 4.5, z); g.add(l); }
      g.userData.tailLights = [tailLightL.material, tailLightR.material];
      return g;
    }

    const LANE_OFFSET = 28;
    const outerRoutePoints = [{ x: -2400, z: -2400 }, { x: 2400, z: -2400 }, { x: 2400, z: 2400 }, { x: -2400, z: 2400 }];
    const midRoutePoints = [{ x: -1200, z: -1200 }, { x: 1200, z: -1200 }, { x: 1200, z: 1200 }, { x: -1200, z: 1200 }];
    const innerRoutePoints = [{ x: -900, z: -900 }, { x: 900, z: -900 }, { x: 900, z: 900 }, { x: -900, z: 900 }];

    function createRoutePath(points, laneOffset) {
      const segments = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        const dx = b.x - a.x, dz = b.z - a.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        const nx = dx / len, nz = dz / len;
        const perpX = -nz, perpZ = nx;
        segments.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z, nx, nz, perpX, perpZ, len, startX: a.x + perpX * laneOffset, startZ: a.z + perpZ * laneOffset, endX: b.x + perpX * laneOffset, endZ: b.z + perpZ * laneOffset });
      }
      return segments;
    }
    function getPointOnRoute(segments, progress) {
      const totalLen = segments.reduce((sum, s) => sum + s.len, 0);
      let dist = progress * totalLen;
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (dist <= seg.len) {
          const t = dist / seg.len;
          return { x: seg.startX + (seg.endX - seg.startX) * t, z: seg.startZ + (seg.endZ - seg.startZ) * t, angle: Math.atan2(seg.nz, seg.nx), seg };
        }
        dist -= seg.len;
      }
      const last = segments[segments.length - 1];
      return { x: last.endX, z: last.endZ, angle: Math.atan2(last.nz, last.nx), seg: last };
    }
    const outerSegmentsCW = createRoutePath(outerRoutePoints, -LANE_OFFSET);
    const outerSegmentsCCW = createRoutePath([...outerRoutePoints].reverse(), -LANE_OFFSET);
    const midSegmentsCW = createRoutePath(midRoutePoints, -LANE_OFFSET);
    const midSegmentsCCW = createRoutePath([...midRoutePoints].reverse(), -LANE_OFFSET);
    const innerSegmentsCW = createRoutePath(innerRoutePoints, -LANE_OFFSET);
    const innerSegmentsCCW = createRoutePath([...innerRoutePoints].reverse(), -LANE_OFFSET);

    function spawnCarOnRoute(segments, progress, direction, speed) {
      const styleRoll = Math.random();
      const style = styleRoll < 0.6 ? "sedan" : (styleRoll < 0.85 ? "suv" : "sport");
      const c = makeCar(carColors[Math.floor(Math.random() * carColors.length)], style);
      scene.add(c);
      const p = getPointOnRoute(segments, progress);
      c.position.set(p.x, CAR_Y, p.z);
      c.rotation.y = direction > 0 ? -p.angle : -p.angle + Math.PI;
      cityCars.push({ car: c, segments, progress, direction, speed, baseSpeed: speed });
    }
    for (let i = 0; i < 14; i++) spawnCarOnRoute(outerSegmentsCW, i / 14, 1, CITY_CAR_SPEED);
    for (let i = 0; i < 14; i++) spawnCarOnRoute(outerSegmentsCCW, i / 14 + 0.5, 1, CITY_CAR_SPEED);
    for (let i = 0; i < 10; i++) spawnCarOnRoute(midSegmentsCW, i / 10, 1, CITY_CAR_SPEED);
    for (let i = 0; i < 10; i++) spawnCarOnRoute(midSegmentsCCW, i / 10 + 0.5, 1, CITY_CAR_SPEED);
    for (let i = 0; i < 6; i++) spawnCarOnRoute(innerSegmentsCW, i / 6, 1, INNER_CAR_SPEED);
    for (let i = 0; i < 6; i++) spawnCarOnRoute(innerSegmentsCCW, i / 6 + 0.5, 1, INNER_CAR_SPEED);

    function updateCarMovement() {
      for (const d of cityCars) {
        d.progress += d.speed * d.direction;
        if (d.progress > 1) d.progress -= 1;
        if (d.progress < 0) d.progress += 1;
        const p = getPointOnRoute(d.segments, d.progress);
        d.car.position.set(p.x, CAR_Y, p.z); d.car.rotation.y = -p.angle; d.car.visible = true;
      }
    }

    /* ===== INTERSECTION CARS ===== */
    const intersectionCars = []; s.intersectionCars = intersectionCars;
    const ROAD_LANES = [
      { id: 1, dir: "north", axis: "z", sign: -1, xOffset: -30, startPos: -1000, endPos: 400, gateId: "SG-01" },
      { id: 2, dir: "south", axis: "z", sign:  1, xOffset:  30, startPos:  1000, endPos: -400, gateId: "SG-02" },
      { id: 3, dir: "east",  axis: "x", sign:  1, zOffset:  30, startPos:  1000, endPos: -400, gateId: "SG-03" },
      { id: 4, dir: "west",  axis: "x", sign: -1, zOffset: -30, startPos: -1000, endPos: 400, gateId: "SG-04" },
    ];
    function spawnIntersectionCar(roadId, startPos, lane) {
      const styleRoll = Math.random();
      const style = styleRoll < 0.6 ? "sedan" : (styleRoll < 0.85 ? "suv" : "sport");
      const car = makeCar(carColors[Math.floor(Math.random() * carColors.length)], style);
      scene.add(car);
      const carObj = { car, roadId, axis: lane.axis, sign: lane.sign, xOffset: lane.xOffset || 0, zOffset: lane.zOffset || 0, pos: startPos, speed: INTERSECTION_BASE_SPEED, baseSpeed: INTERSECTION_BASE_SPEED, waiting: false, waitTimer: 0, gateId: lane.gateId };
      intersectionCars.push(carObj); updateIntersectionCarTransform(carObj);
    }
    function updateIntersectionCarTransform(c) {
      if (c.axis === "z") { c.car.position.set(c.xOffset, CAR_Y, c.pos); c.car.rotation.y = c.sign < 0 ? 0 : Math.PI; }
      else { c.car.position.set(c.pos, CAR_Y, c.zOffset); c.car.rotation.y = c.sign < 0 ? Math.PI : 0; }
    }
    for (let i = 0; i < 40; i++) {
      const roadId = (i % 4) + 1;
      const lane = ROAD_LANES[roadId - 1];
      const startPos = lane.startPos + (i * 40) * Math.sign(lane.endPos - lane.startPos);
      spawnIntersectionCar(roadId, startPos, lane);
    }
    function buildVehicleSnapshot() {
      const arr = [];
      for (const c of intersectionCars) {
        if (c.axis === "z") arr.push({ x: c.xOffset, z: c.pos, speed: c.speed });
        else arr.push({ x: c.pos, z: c.zOffset, speed: c.speed });
      }
      return arr;
    }
    function setBrakeLights(car, on) {
      const tl = car.userData.tailLights; if (!tl) return;
      for (const m of tl) m.emissiveIntensity = on ? 6 : 3;
    }
    function updateIntersectionCars(delta, aiSystem, securitySystem) {
      const laneGroups = {};
      for (const c of intersectionCars) { (laneGroups[c.roadId] = laneGroups[c.roadId] || []).push(c); }
      for (const rid of Object.keys(laneGroups)) {
        const list = laneGroups[rid];
        const gate = securitySystem ? securitySystem.getGate(list[0].gateId) : null;
        const gateStop = gate ? gate.stop : null;
        list.sort((a, b) => { if (!gateStop) return 0; return Math.abs(a.pos - gateStop) - Math.abs(b.pos - gateStop); });
        const MIN_GAP = 40;
        for (let i = 1; i < list.length; i++) {
          const leader = list[i - 1], follower = list[i], sign = follower.sign;
          if (sign < 0) { if (follower.pos < leader.pos + MIN_GAP) follower.pos = leader.pos + MIN_GAP; }
          else { if (follower.pos > leader.pos - MIN_GAP) follower.pos = leader.pos - MIN_GAP; }
        }
      }
      for (const c of intersectionCars) {
        const isGreen = aiSystem.isGreen(c.roadId);
        const isYellow = aiSystem.isYellowRoad(c.roadId);
        const gate = securitySystem ? securitySystem.getGate(c.gateId) : null;
        const gateStopPos = gate ? gate.stop : null;
        const gateClosed = gate ? securitySystem.isGateClosed(gate.id) : false;
        const stopLinePos = c.axis === "z" ? (c.sign < 0 ? 180 : -180) : (c.sign < 0 ? -180 : 180);
        const distToStop = Math.abs(c.pos - stopLinePos);
        let distToGate = Infinity, approachingGate = false;
        if (gateStopPos !== null) {
          const along = (c.sign < 0) ? (c.pos - gateStopPos) : (gateStopPos - c.pos);
          if (along > -40) { distToGate = along; approachingGate = true; }
        }
        let targetSpeed = c.baseSpeed, braking = false;
        if (gateClosed && approachingGate && distToGate < 90 && distToGate > 0) { targetSpeed = 0; braking = true; c.waiting = true; }
        else if (gateClosed && approachingGate && distToGate < 260) { targetSpeed = c.baseSpeed * 0.25; c.waiting = false; }
        else if (isGreen) { targetSpeed = c.baseSpeed; c.waiting = false; c.waitTimer = 0; }
        else if (isYellow) { targetSpeed = c.baseSpeed * 0.55; c.waiting = false; c.waitTimer = 0; }
        else {
          if (distToStop < 60 && c.waitTimer < 6) { targetSpeed = 0; c.waiting = true; c.waitTimer += delta; braking = true; }
          else if (distToStop < 180) { targetSpeed = c.baseSpeed * 0.25; c.waiting = false; c.waitTimer = 0; }
          else { targetSpeed = c.baseSpeed * 0.6; c.waiting = false; c.waitTimer = 0; }
        }
        c.speed = c.speed + (targetSpeed - c.speed) * Math.min(1, delta * 2.5);
        c.pos += c.sign * c.speed * delta * 20;
        const range = 1200;
        if (c.sign < 0 && c.pos < -range) { c.pos = range; c.waitTimer = 0; }
        else if (c.sign > 0 && c.pos > range) { c.pos = -range; c.waitTimer = 0; }
        setBrakeLights(c.car, braking); updateIntersectionCarTransform(c);
      }
    }

    /* ===== DUBAI CARS ===== */
    function makeDubaiLuxuryCar(colorHex) {
      const g = new THREE.Group();
      const bMat = mat(colorHex, 0.15, 0.9);
      const body = new THREE.Mesh(new THREE.BoxGeometry(48, 9, 20), bMat); body.position.y = 6; g.add(body);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(28, 8, 17), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.2, transparent: true, opacity: 0.85 })); roof.position.set(-2, 14, 0); g.add(roof);
      const wheelGeo = new THREE.CylinderGeometry(4, 4, 2.5, 16);
      for (const wx of [-14, 14]) for (const wz of [-9, 9]) { const w = new THREE.Mesh(wheelGeo, wheelMat); w.rotation.x = Math.PI / 2; w.position.set(wx, 4, wz); g.add(w); }
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.1 });
      const frontLight = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 4), goldMat); frontLight.position.set(24, 6, 5); g.add(frontLight);
      const frontLight2 = frontLight.clone(); frontLight2.position.z = -5; g.add(frontLight2);
      return g;
    }
    const dubaiCarPositions = [[900, 600, 0], [700, 400, Math.PI / 2], [-900, 900, Math.PI], [-700, 500, -Math.PI / 2]];
    dubaiCarPositions.forEach(([x, z, ry]) => {
      const dc = makeDubaiLuxuryCar(0xd4af37);
      dc.position.set(x, CAR_Y - 0.5, z); dc.rotation.y = ry; scene.add(dc); s.dubaiCars.push(dc);
    });

    /* ===== PEOPLE ===== */
    const people = []; s.people = people;
    const skinColors = [0xf2c9a0, 0xd9a373, 0xa06a3c, 0x6b4a2f, 0xffd8b8];
    const shirtColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0x1abc9c, 0xe67e22, 0x34495e, 0xc0392b, 0x16a085];
    const pantsColors = [0x2c3e50, 0x34495e, 0x1a252f, 0x4a4a4a];
    function makePerson() {
      const g = new THREE.Group();
      const skin = skinColors[Math.floor(Math.random() * skinColors.length)];
      const shirt = shirtColors[Math.floor(Math.random() * shirtColors.length)];
      const pants = pantsColors[Math.floor(Math.random() * pantsColors.length)];
      const skinMat = mat(skin, 0.9), shirtMat = mat(shirt, 0.85), pantsMat = mat(pants, 0.85);
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
        p.g.position.set(cx + Math.cos(angle) * r, 5, cz + Math.sin(angle) * r); p.g.rotation.y = angle;
        scene.add(p.g);
        people.push({ obj: p.g, legL: p.legL, legR: p.legR, armL: p.armL, armR: p.armR, cx, cz, r, angle, dir: Math.random() > 0.5 ? 1 : -1, speed: 0.005 + Math.random() * 0.008, phase: Math.random() * Math.PI * 2 });
      }
    }
    spawnPeople(-600, -600, 10, 180); spawnPeople(600, -600, 10, 180); spawnPeople(-600, 600, 16, 350);
    spawnPeople(600, 600, 8, 180); spawnPeople(1800, -600, 6, 240); spawnPeople(600, 1800, 10, 220);
    spawnPeople(0, 0, 5, 130); spawnPeople(-1800, 1800, 12, 200); spawnPeople(-3900, -2400, 4, 200);
    spawnPeople(-3600, -800, 4, 200); spawnPeople(-3600, 800, 4, 200); spawnPeople(2900, 1000, 5, 180);
    spawnPeople(-2900, -300, 4, 180); spawnPeople(2800, -1600, 4, 180);
    spawnPeople(-1400, -1500, 8, 400);

    const tourists = []; s.tourists = tourists;
    const touristShirtColors = [0xff6b6b, 0xffdd57, 0xff8fab, 0xa29bfe, 0x74b9ff, 0xfd79a8, 0x00cec9, 0xff9f43];
    function makeTourist() {
      const g = new THREE.Group();
      const skin = skinColors[Math.floor(Math.random() * skinColors.length)];
      const shirt = touristShirtColors[Math.floor(Math.random() * touristShirtColors.length)];
      const skinMat = mat(skin, 0.9), shirtMat = mat(shirt, 0.85), shortMat = mat(0xf5c84b, 0.85);
      const head = new THREE.Mesh(new THREE.SphereGeometry(1.8, 6, 5), skinMat); head.position.y = 9; g.add(head);
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 5, 1.8), shirtMat); body.position.y = 5.5; g.add(body);
      const legL = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), shortMat); legL.position.set(-0.7, 2, 0); g.add(legL);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), shortMat); legR.position.set(0.7, 2, 0); g.add(legR);
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.6, 0.8), shirtMat); armL.position.set(-2.1, 5.5, 0); g.add(armL);
      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.6, 0.8), shirtMat); armR.position.set(2.1, 5.5, 0); g.add(armR);
      const cam = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.8), mat(0x222222, 0.4, 0.7)); cam.position.set(0, 5.5, 1.5); g.add(cam);
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.4, 12), mat(0xf5c84b, 0.7)); hat.position.y = 11; g.add(hat);
      const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1, 12), mat(0xf5c84b, 0.7)); hatTop.position.y = 11.7; g.add(hatTop);
      return { g, legL, legR, armL, armR };
    }
    function spawnTourists(count) {
      for (let i = 0; i < count; i++) {
        const p = makeTourist();
        const angle = Math.random() * Math.PI * 2;
        const r = 200 + Math.random() * 600;
        p.g.position.set(-3600 + Math.cos(angle) * r, 5, -200 + Math.sin(angle) * r); p.g.rotation.y = angle;
        scene.add(p.g);
        tourists.push({ obj: p.g, legL: p.legL, legR: p.legR, armL: p.armL, armR: p.armR, cx: -3600, cz: -200, r, angle, dir: Math.random() > 0.5 ? 1 : -1, speed: 0.004 + Math.random() * 0.006, phase: Math.random() * Math.PI * 2 });
      }
    }
    spawnTourists(20);
    let touristMsgShown = false;
    setTimeout(() => { if (!touristMsgShown) { touristMsgShown = true; onTouristMessage?.("Tourist has been joined our city"); } }, 30000);

    for (let i = 0; i < 650; i++) {
      const x = (Math.random() - 0.5) * (CITY_HALF * 2 - 300);
      const z = (Math.random() - 0.5) * (CITY_HALF * 2 - 300);
      if (isFree(x, z)) tree(x, z, 0.8 + Math.random() * 0.6);
    }
    for (let i = 0; i < 280; i++) {
      const x = (Math.random() - 0.5) * (CITY_HALF * 2 - 300);
      const z = (Math.random() - 0.5) * (CITY_HALF * 2 - 300);
      if (isFree(x, z)) bush(x, z, 0.7 + Math.random() * 0.6);
    }
    function addLandscaping() {
      const grassPatchMat = new THREE.MeshStandardMaterial({ color: 0x3d7f45, roughness: 0.95 });
      const buildingPlots = [
        { x: -600, z: -600, w: 500, d: 500, trees: 6 }, { x: 600, z: -600, w: 480, d: 480, trees: 5 },
        { x: 600, z: 600, w: 520, d: 520, trees: 6 }, { x: 1800, z: -600, w: 700, d: 700, trees: 10 },
        { x: 600, z: 1800, w: 560, d: 560, trees: 6 }, { x: 1800, z: 1750, w: 600, d: 600, trees: 5 },
        { x: 1800, z: 600, w: 560, d: 560, trees: 6 }, { x: -1800, z: 1800, w: 620, d: 620, trees: 8 },
        { x: -1600, z: 800, w: 480, d: 480, trees: 5 }, { x: -3900, z: -2400, w: 700, d: 700, trees: 10 },
        { x: -3600, z: -800, w: 720, d: 720, trees: 10 }, { x: -3600, z: 800, w: 700, d: 700, trees: 10 },
      ];
      buildingPlots.forEach(plot => {
        const grass = new THREE.Mesh(new THREE.BoxGeometry(plot.w + 60, 0.35, plot.d + 60), grassPatchMat);
        grass.position.set(plot.x, 4.5, plot.z); scene.add(grass);
        for (let i = 0; i < plot.trees; i++) {
          const angle = (i / plot.trees) * Math.PI * 2;
          const rx = Math.cos(angle) * (plot.w / 2 + 40);
          const rz = Math.sin(angle) * (plot.d / 2 + 40);
          const tx = plot.x + rx, tz = plot.z + rz;
          if (!isOnRoad(tx, tz)) tree(tx, tz, 0.7 + Math.random() * 0.4);
        }
      });
    }
    addLandscaping();

    /* ===== SIMULATIONS ===== */
    const sim = createCitySimulation({ onTrafficUpdate, onSimTime, onCycleUpdate, onAiMessage, onAiReason });
    s.sim = sim;
    const aiSystem = createAITrafficSystem({ onTrafficUpdate: (data) => onAITrafficUpdate?.(data) });
    s.aiSystem = aiSystem;
    const securitySystem = createAISecuritySystem({
      onSecurityUpdate: (data) => {
        for (const g of securityGates) {
          const snap = data.gates.find((x) => x.id === g.id);
          if (!snap) continue;
          g.status = snap.status; g.aiState = snap.aiState;
          g.vehiclesDetected = snap.vehiclesDetected; g.vehiclesWaiting = snap.vehiclesWaiting; g.density = snap.density;
          redrawGateSign(g, data.phase, snap.status);
        }
        onSecurityUpdate?.(data); setSecurityHUD(data);
      },
    });
    s.securitySystem = securitySystem;

    const garbageRoute = [[-1200, -1200], [0, -1200], [1200, -1200], [1200, 0], [1200, 1200], [900, 1400], [600, 1800], [600, 2400], [1200, 2400], [2400, 2400], [2400, 1200], [2400, 0], [2400, -1200], [1200, -1200], [0, -1200], [-1200, -1200], [-2400, -1200], [-2400, -2400], [-1200, -2400], [0, -2400], [1200, -2400], [2400, -2400], [3300, -2400], [3300, 0], [3300, 2400], [2400, 2400], [1200, 2400], [0, 1200], [-1200, 0], [-1200, -1200]];
    const fertRoute1 = [[1800, -1200], [1200, -1200], [1200, 0], [1200, 1200], [0, 1200], [-1200, 1200], [-2400, 1200], [-2400, 0], [-2400, -1200], [-2400, -2400], [-3600, -2400], [-3600, -3600], [-2400, -3600], [-1200, -3600], [0, -3600], [1200, -3600], [1200, -2400], [1200, -1200], [1800, -1200]];
    const fertRoute2 = [[-3600, -3600], [-3600, -2400], [-3600, -1200], [-2400, -1200], [-1200, -1200], [-1200, 0], [-1200, 1200], [-1200, 2400], [-2400, 2400], [-3600, 2400], [-3600, 3600], [-2400, 3600], [-1200, 3600], [0, 3600], [1200, 3600], [1200, 2400], [1200, 1200], [1200, 0], [1200, -1200], [0, -1200], [-1200, -1200], [-2400, -1200], [-3600, -1200], [-3600, -2400], [-3600, -3600]];
    const garbageState = { idx: 0, prog: 0 }, fert1State = { idx: 0, prog: 0 }, fert2State = { idx: 0, prog: 0 };
    function moveTruck(truck, route, state, delta, speed) {
      const from = route[state.idx], to = route[(state.idx + 1) % route.length];
      state.prog += delta * speed;
      if (state.prog >= 1) { state.prog = 0; state.idx = (state.idx + 1) % route.length; }
      const x = from[0] + (to[0] - from[0]) * state.prog;
      const z = from[1] + (to[1] - from[1]) * state.prog;
      truck.position.set(x, CAR_Y, z);
      const dx = to[0] - from[0], dz = to[1] - from[1];
      if (Math.abs(dx) + Math.abs(dz) > 0.1) truck.rotation.y = -Math.atan2(dz, dx);
    }

    /* ===== CLICK HANDLER ===== */
    const onClick = (e) => {
      if (s.isLocked) return;
      if (e.target !== renderer.domElement) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      for (const item of clickable) {
        const hit = raycaster.intersectObject(item.object, true);
        if (hit.length) {
          if (item.type === "securityGate" && item.gateRef) {
            const g = item.gateRef;
            setSecurityPopup({ id: g.id, label: g.label, status: g.status, aiState: g.aiState, vehiclesDetected: g.vehiclesDetected, vehiclesWaiting: g.vehiclesWaiting, density: g.density });
            onPanel({ title: g.id + " · Smart Security Gate", type: "SECURITY", text: "AI barrier check-point." });
            return;
          }
          const info = BUILDING_INFO[item.type];
          if (info) setBuildingPopup(info);
          else setBuildingPopup({ title: item.name || "Location", type: "INFO", icon: "📍", desc: "Smart city location.", stats: [] });
          onPanel({ title: item.name || "Location", type: "INFO", text: "Details available." });
          return;
        }
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    const clock = new THREE.Clock();
    let fc = 0, rafId;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.elapsedTime; fc++;

      sim.tick(delta); aiSystem.tick(delta);
      const snap = buildVehicleSnapshot();
      securitySystem.tick(delta, snap);
      updateCarMovement();
      updateIntersectionCars(delta, aiSystem, securitySystem);

      for (const g of securityGates) {
        g.hinge.rotation.z = g.armAngle;
        const target = g.status === "CLOSED" ? BARRIER_CLOSED_ANGLE : BARRIER_OPEN_ANGLE;
        const moving = Math.abs(target - g.armAngle) > 0.01;
        if (moving || g.status === "CLOSED") {
          const blink = (Math.sin(t * 6) * 0.5 + 0.5);
          g.lampRed.material.emissiveIntensity = 3 + blink * 2;
          g.lampAmber.material.emissiveIntensity = 3 + (1 - blink) * 2;
          g.lampGreen.material.emissiveIntensity = 0.3;
          g.tipLamp.material.emissiveIntensity = 3 + blink * 3;
        } else {
          g.lampRed.material.emissiveIntensity = 0.4;
          g.lampAmber.material.emissiveIntensity = 0.4;
          g.lampGreen.material.emissiveIntensity = 3.5;
          g.tipLamp.material.emissiveIntensity = 0.5;
        }
      }

      for (const l of intersectionLights) {
        l.r.core.material.emissiveIntensity = 0;
        l.y.core.material.emissiveIntensity = 0;
        l.gr.core.material.emissiveIntensity = 0;
        l.r.halo.material.opacity = 0;
        l.y.halo.material.opacity = 0;
        l.gr.halo.material.opacity = 0;
        const blink = 0.6 + 0.4 * Math.sin(t * 8);
        if (aiSystem.isGreen(l.road)) {
          l.gr.core.material.emissiveIntensity = 7.5 * blink;
          l.gr.halo.material.opacity = 0.85 * blink;
        } else if (aiSystem.isYellowRoad(l.road)) {
          l.y.core.material.emissiveIntensity = 8.5 * blink;
          l.y.halo.material.opacity = 0.9 * blink;
        } else {
          l.r.core.material.emissiveIntensity = 7.5 * blink;
          l.r.halo.material.opacity = 0.85 * blink;
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
        p.legL.rotation.x = swing; p.legR.rotation.x = -swing;
        p.armL.rotation.x = -swing * 0.7; p.armR.rotation.x = swing * 0.7;
      }
      for (const p of tourists) {
        p.angle += p.speed * p.dir;
        if (p.angle > Math.PI * 2) p.angle -= Math.PI * 2;
        if (p.angle < 0) p.angle += Math.PI * 2;
        p.obj.position.x = p.cx + Math.cos(p.angle) * p.r;
        p.obj.position.z = p.cz + Math.sin(p.angle) * p.r;
        p.obj.rotation.y = p.angle + (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
        const swing = Math.sin(t * 6 + p.phase) * 0.5;
        p.legL.rotation.x = swing; p.legR.rotation.x = -swing;
        p.armL.rotation.x = -swing * 0.8; p.armR.rotation.x = swing * 0.8;
      }
      for (const wp of waterParticles) {
        wp.mesh.position.y += wp.speed * 0.4;
        if (wp.mesh.position.y > 105) { wp.mesh.position.y = 18; wp.mesh.position.x = (Math.random() - 0.5) * 180; wp.mesh.position.z = (Math.random() - 0.5) * 180; }
      }

      for (const l of trafficLights) {
        const cyc = (t + l.phase) % 12;
        const pulse = 0.7 + 0.3 * Math.sin(t * 6);
        l.r.core.material.emissiveIntensity = 0;
        l.y.core.material.emissiveIntensity = 0;
        l.gr.core.material.emissiveIntensity = 0;
        l.r.halo.material.opacity = 0;
        l.y.halo.material.opacity = 0;
        l.gr.halo.material.opacity = 0;
        l.pl.intensity = 0;
        if (cyc < 5) {
          l.r.core.material.emissiveIntensity = 8 * pulse;
          l.r.halo.material.opacity = 0.85 * pulse;
          l.pl.color.setHex(0xff2222); l.pl.intensity = 1.5 * pulse;
        } else if (cyc < 7) {
          l.y.core.material.emissiveIntensity = 9 * pulse;
          l.y.halo.material.opacity = 0.9 * pulse;
          l.pl.color.setHex(0xffcc22); l.pl.intensity = 2 * pulse;
        } else {
          l.gr.core.material.emissiveIntensity = 8 * pulse;
          l.gr.halo.material.opacity = 0.85 * pulse;
          l.pl.color.setHex(0x22ff66); l.pl.intensity = 1.5 * pulse;
        }
      }

      moveTruck(garbageTruck, garbageRoute, garbageState, delta, 0.18);
      moveTruck(fertTruck1, fertRoute1, fert1State, delta, 0.16);
      moveTruck(fertTruck2, fertRoute2, fert2State, delta, 0.15);
      const warnBlink = Math.floor(t * 2) % 2 === 0 ? 3 : 0.5;
      if (s.garbageWarn) s.garbageWarn.material.emissiveIntensity = warnBlink;
      if (s.fertWarn1) s.fertWarn1.material.emissiveIntensity = warnBlink;
      if (s.fertWarn2) s.fertWarn2.material.emissiveIntensity = warnBlink;
      if (fc % 3 === 0) for (const bl of turbines) bl.rotation.z = t * 2.4;
      radar.rotation.z = t * 1.7; controllerRing.rotation.z = t * 0.5;
      controllerRing2.rotation.z = -t * 0.4; controllerSig.scale.setScalar(1 + Math.sin(t * 4) * 0.15);

      for (const vf of s.verticalFarms) {
        vf.beacon.material.emissiveIntensity = 4.5 + Math.sin(t * 4) * 2.5;
        vf.topLED.rotation.z = t * 0.6;
      }
      for (const g of s.growLights) {
        g.emissiveIntensity = 4.0 + Math.sin(t * 3) * 1.2;
      }

      s.filtrationStageElapsed += delta;
      const currentStage = FILTRATION_STAGES[s.filtrationStageIndex];
      if (s.filtrationStageElapsed >= currentStage.duration) {
        s.filtrationStageElapsed = 0;
        s.filtrationStageIndex = (s.filtrationStageIndex + 1) % FILTRATION_STAGES.length;
        onFiltrationUpdate?.({ stageIndex: s.filtrationStageIndex, stage: FILTRATION_STAGES[s.filtrationStageIndex], allStages: FILTRATION_STAGES });
      } else if (fc % 4 === 0) {
        onFiltrationUpdate?.({ stageIndex: s.filtrationStageIndex, stage: currentStage, allStages: FILTRATION_STAGES, progress: s.filtrationStageElapsed / currentStage.duration });
      }
      for (let i = 0; i < s.filtrationStageMeshes.length; i++) {
        const sm = s.filtrationStageMeshes[i];
        const isActive = i === s.filtrationStageIndex;
        if (isActive) {
          sm.tankBody.material.emissiveIntensity = 1.2 + Math.sin(t * 4) * 0.6;
          sm.tankCap.material.emissiveIntensity = 1.2 + Math.sin(t * 4) * 0.6;
          sm.waterFill.material.emissiveIntensity = 2.0 + Math.sin(t * 5) * 0.8;
          const fillH = 30 + Math.sin(t * 2.5) * 10;
          sm.waterFill.scale.y = fillH; sm.waterFill.position.y = sm.baseY + fillH / 2;
        } else {
          sm.tankBody.material.emissiveIntensity = 0.25; sm.tankCap.material.emissiveIntensity = 0.25;
          sm.waterFill.material.emissiveIntensity = 0.5; sm.waterFill.scale.y = 8; sm.waterFill.position.y = sm.baseY + 4;
        }
      }
      for (const flow of s.filtrationFlowMeshes) {
        const phase = (t * 0.6 + flow.phase) % 1;
        const fx = flow.from.x + (flow.to.x - flow.from.x) * phase;
        const fz = flow.from.z + (flow.to.z - flow.from.z) * phase;
        flow.dot.position.set(fx, 14, fz);
        const active = s.filtrationStageIndex >= Math.floor(flow.phase * FILTRATION_STAGES.length);
        flow.dot.material.emissiveIntensity = active ? 4 : 1;
      }
      if (s.filtrationUVLight) {
        const uvActive = FILTRATION_STAGES[s.filtrationStageIndex]?.id === "uv";
        s.filtrationUVLight.intensity = uvActive ? 4 + Math.sin(t * 8) * 2 : 0.5;
      }
      if (s.filtrationCleanReservoir) {
        const stageId = FILTRATION_STAGES[s.filtrationStageIndex]?.id;
        const isFilling = stageId === "storage" || stageId === "recycling";
        const targetY = isFilling ? 52 : 42;
        s.filtrationCleanReservoir.resWater.position.y += (targetY - s.filtrationCleanReservoir.resWater.position.y) * Math.min(1, delta * 2);
        s.filtrationCleanReservoir.resWater.material.emissiveIntensity = isFilling ? 2.2 + Math.sin(t * 4) * 0.6 : 1.2;
      }
      for (const ring of s.filtrationPumpRings) {
        const phase = (t * 0.5 + ring.userData.phase) % 2;
        ring.scale.setScalar(1 + phase * 0.4);
        ring.material.opacity = Math.max(0, 0.7 - phase * 0.35);
      }

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

  return (
    <>
      <div ref={mountRef} style={{ position: "fixed", inset: 0 }} />

      {buildingPopup && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "linear-gradient(135deg, rgba(6,20,35,0.97), rgba(12,35,55,0.95))", border: "2px solid #22cfff", borderRadius: 20, padding: "22px 28px", color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif", boxShadow: "0 0 60px rgba(34,207,255,0.6)", zIndex: 9999, minWidth: 420, maxWidth: 540, backdropFilter: "blur(16px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 44 }}>{buildingPopup.icon}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#22cfff" }}>{buildingPopup.title}</div>
                <div style={{ fontSize: 10, color: "#7fe3ff", letterSpacing: 2, textTransform: "uppercase", marginTop: 3 }}>{buildingPopup.type}</div>
              </div>
            </div>
            <button onClick={() => setBuildingPopup(null)} style={{ background: "transparent", border: "none", color: "#7fe3ff", cursor: "pointer", fontSize: 20 }}>✕</button>
          </div>
          <div style={{ fontSize: 13, color: "#b8e8ff", marginBottom: 14, lineHeight: 1.6 }}>{buildingPopup.desc}</div>
          {buildingPopup.stats && buildingPopup.stats.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {buildingPopup.stats.map((stat, i) => (
                <div key={i} style={{ background: "rgba(34,207,255,0.1)", border: "1px solid rgba(34,207,255,0.3)", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#8fd8f0" }}>{stat[0]}</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{stat[1]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {securityPopup && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "linear-gradient(135deg, rgba(6,20,35,0.97), rgba(12,35,55,0.95))", border: "2px solid " + (securityPopup.status === "CLOSED" ? "#ff8a1f" : "#22cfff"), borderRadius: 20, padding: "22px 28px", color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif", boxShadow: "0 0 60px rgba(34,207,255,0.6)", zIndex: 9999, minWidth: 460, maxWidth: 560, backdropFilter: "blur(16px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 44 }}>🛡️</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#22cfff" }}>SMART SECURITY GATE</div>
                <div style={{ fontSize: 11, color: "#7fe3ff", letterSpacing: 2, textTransform: "uppercase", marginTop: 3 }}>{securityPopup.id} · {securityPopup.label}</div>
              </div>
            </div>
            <button onClick={() => setSecurityPopup(null)} style={{ background: "transparent", border: "none", color: "#7fe3ff", cursor: "pointer", fontSize: 20 }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div style={{ background: "rgba(34,207,255,0.1)", border: "1px solid rgba(34,207,255,0.3)", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#8fd8f0" }}>Status</span>
              <span style={{ color: securityPopup.status === "CLOSED" ? "#ff8a1f" : "#6aff9d", fontWeight: 700 }}>{securityPopup.status}</span>
            </div>
            <div style={{ background: "rgba(34,207,255,0.1)", border: "1px solid rgba(34,207,255,0.3)", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#8fd8f0" }}>AI Control</span>
              <span style={{ color: "#6aff9d", fontWeight: 700 }}>ACTIVE</span>
            </div>
            <div style={{ background: "rgba(34,207,255,0.1)", border: "1px solid rgba(34,207,255,0.3)", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#8fd8f0" }}>Security Level</span>
              <span style={{ color: securityPopup.aiState === "RESTRICTED" ? "#ff8a1f" : "#6aff9d", fontWeight: 700 }}>{securityPopup.aiState}</span>
            </div>
            <div style={{ background: "rgba(34,207,255,0.1)", border: "1px solid rgba(34,207,255,0.3)", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#8fd8f0" }}>Vehicles Detected</span>
              <span style={{ color: "#fff", fontWeight: 700 }}>{securityPopup.vehiclesDetected}</span>
            </div>
            <div style={{ background: "rgba(34,207,255,0.1)", border: "1px solid rgba(34,207,255,0.3)", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#8fd8f0" }}>Vehicles Waiting</span>
              <span style={{ color: "#fff", fontWeight: 700 }}>{securityPopup.vehiclesWaiting}</span>
            </div>
            <div style={{ background: "rgba(34,207,255,0.1)", border: "1px solid rgba(34,207,255,0.3)", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#8fd8f0" }}>Traffic Density</span>
              <span style={{ color: "#fff", fontWeight: 700 }}>{securityPopup.density}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { focusSecurityGate(securityPopup.id); setSecurityPopup(null); }} style={{ flex: 1, padding: "12px 18px", borderRadius: 12, background: "linear-gradient(135deg, #22cfff, #0a8fbf)", color: "#031a24", fontWeight: 800, letterSpacing: 1, border: "none", cursor: "pointer", fontSize: 13, textTransform: "uppercase" }}>🎥 View Checkpoint</button>
            <button onClick={() => setSecurityPopup(null)} style={{ padding: "12px 18px", borderRadius: 12, background: "transparent", border: "1px solid rgba(34,207,255,0.5)", color: "#7fe3ff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Close</button>
          </div>
        </div>
      )}

      {locationPopup && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, rgba(8, 20, 35, 0.95), rgba(15, 35, 55, 0.95))", border: "2px solid #22cfff", borderRadius: 16, padding: "18px 28px", color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif", boxShadow: "0 0 40px rgba(34, 207, 255, 0.5)", zIndex: 9998, minWidth: 420, maxWidth: 600, backdropFilter: "blur(12px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 32 }}>{locationPopup.icon}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#22cfff" }}>{locationPopup.label}</div>
              <div style={{ fontSize: 11, color: "#7fe3ff", letterSpacing: 1.5, textTransform: "uppercase" }}>{locationPopup.type}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#b8e8ff", marginBottom: 12, lineHeight: 1.5 }}>{locationPopup.desc}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {locationPopup.stats.map((stat, i) => (
              <div key={i} style={{ background: "rgba(34, 207, 255, 0.1)", border: "1px solid rgba(34, 207, 255, 0.3)", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#8fd8f0" }}>{stat[0]}</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>{stat[1]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {securityHUD && (
        <div style={{ position: "fixed", top: 24, right: 24, background: "linear-gradient(135deg, rgba(6,20,35,0.92), rgba(12,35,55,0.9))", border: "1px solid rgba(34,207,255,0.5)", borderRadius: 14, padding: "14px 18px", color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif", boxShadow: "0 0 30px rgba(34,207,255,0.35)", zIndex: 9997, minWidth: 260, backdropFilter: "blur(10px)", fontSize: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#7fe3ff", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>🛡️ AI TRAFFIC &amp; SECURITY</div>
          {securityHUD.gates.map((g) => (
            <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(34,207,255,0.12)" }}>
              <span style={{ color: "#b8e8ff" }}>{g.id}</span>
              <span style={{ color: g.status === "CLOSED" ? "#ff8a1f" : "#6aff9d", fontWeight: 700 }}>{g.status} · {g.vehiclesWaiting}q</span>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 10, color: "#7fe3ff", letterSpacing: 1.2 }}>PHASE: {securityHUD.phase} · AI CONTROL: ACTIVE</div>
        </div>
      )}
    </>
  );
});

export default SmartCity3D;
