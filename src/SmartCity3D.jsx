import React, { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, ContactShadows, Sky } from '@react-three/drei'
import * as THREE from 'three'

/* ═══════════════════════════════════════════════════════════
   GLOBAL STATE
   ═══════════════════════════════════════════════════════════ */
const S = {
  timeOfDay: 'day',
  trafficDensity: 'medium',
  streetLightsOn: false,
  focus: null,
  menuOpen: false,
  infoPopup: null,
  aiLog: [],
}
const subs = new Set()
const setS = (u) => { Object.assign(S, u); subs.forEach(c => c({ ...S })) }
const useS = (sel) => {
  const [s, set] = useState({ ...S })
  useEffect(() => { const c = (v) => set(v); subs.add(c); return () => subs.delete(c) }, [])
  return sel ? sel(s) : s
}
const addLog = (msg, type = 'info') => {
  setS({ aiLog: [{ msg, type, t: Date.now() }, ...S.aiLog].slice(0, 8) })
}

/* ═══════════════════════════════════════════════════════════
   AI TRAFFIC STATE
   ═══════════════════════════════════════════════════════════ */
const TS = { phase: 0, inYellow: false, inAllRed: false, elapsed: 0 }
const PHASE_DURATION = 10
const YELLOW_DURATION = 3
const ALL_RED_DURATION = 1

/* ═══════════════════════════════════════════════════════════
   LOCATIONS — with glb paths
   ═══════════════════════════════════════════════════════════ */
export const LOCATIONS = {
  school: {
    label: 'Beacon School System', icon: '🏫', pos: [-100, 0, -100],
    color: '#1a5490', glb: '/american_high_school.glb', size: 22,
    info: {
      title: '🏫 Beacon School System', sub: 'Smart Education Center',
      desc: 'American curriculum with AI-powered classrooms, robotics lab, and smart boards. 450 students enrolled with 32 teachers.',
      stats: [['👨‍🎓 Students', '450'], ['👩‍🏫 Teachers', '32'], ['📚 Classes', '18'], ['🤖 Robotics Lab', 'Active']],
      features: ['✅ AI-powered smart classrooms', '✅ Interactive smart boards', '✅ Robotics & coding lab', '✅ 24/7 AI security', '✅ Solar-powered campus'],
    },
  },
  hospital: {
    label: 'Smart City Hospital', icon: '🏥', pos: [100, 0, -100],
    color: '#c0392b', glb: '/low_poly_hospital.glb', size: 22,
    info: {
      title: '🏥 Smart City Hospital', sub: 'Advanced Healthcare',
      desc: 'AI-powered diagnosis, robotic surgery, 24/7 emergency services with 8 ICU beds and 32 patients under care.',
      stats: [['🏥 Patients', '32'], ['🚑 Ambulances', '2'], ['💊 ICU Beds', '8'], ['🩺 AI Diagnosis', 'Online']],
      features: ['✅ 24/7 emergency services', '✅ AI medical diagnosis', '✅ Robotic surgery', '✅ Smart patient monitoring', '✅ Helipad for emergencies'],
    },
  },
  bank: {
    label: 'Smart City State Bank', icon: '🏦', pos: [100, 0, 100],
    color: '#8e44ad', glb: '/us_bank_tower.glb', size: 26,
    info: {
      title: '🏦 Smart City State Bank', sub: 'Digital Financial Hub',
      desc: 'AI-powered banking with fraud detection, digital transactions, and 8 ATMs serving 1,240 transactions/hour.',
      stats: [['💰 Transactions', '1,240/hr'], ['🏧 ATMs', '8'], ['🔐 AI Security', 'Active'], ['📈 Uptime', '99.9%']],
      features: ['✅ AI fraud detection', '✅ Digital-only banking', '✅ 8 smart ATMs', '✅ Biometric security', '✅ 24/7 online services'],
    },
  },
  farm: {
    label: 'Smart Eco Farm', icon: '🌾', pos: [-150, 0, -100],
    color: '#27ae60', glb: '/simple_farm_free.glb', size: 28,
    info: {
      title: '🌾 Smart Eco Farm', sub: 'AI Agriculture',
      desc: 'IoT sensors monitor soil, drones map crops, AI optimizes irrigation. 94% crop health with automated harvesting.',
      stats: [['🌾 Crop Health', '94%'], ['💧 Soil Moisture', '68%'], ['🚁 Drones', '3'], ['🌡️ Temp', '24°C']],
      features: ['✅ IoT soil sensors', '✅ Drone crop monitoring', '✅ Drip irrigation', '✅ AI harvest prediction', '✅ Solar-powered operations'],
    },
  },
  event: {
    label: 'Liverpool Event Hall', icon: '🎪', pos: [100, 0, 180],
    color: '#d4a017', glb: '/liverpool_street_station_south_entrance.glb', size: 24,
    info: {
      title: '🎪 Liverpool Event Hall', sub: 'Modern Event Venue',
      desc: 'Multi-purpose hall with capacity 2,000, smart surround lighting, and 3 events today.',
      stats: [['🎪 Capacity', '2,000'], ['🎤 Events today', '3'], ['💡 Smart Lights', 'ON'], ['🎵 Sound', 'Surround']],
      features: ['✅ 2,000 person capacity', '✅ Smart surround lighting', '✅ 360° audio system', '✅ Live streaming setup', '✅ Green energy powered'],
    },
  },
  gas: {
    label: 'Gas Station · Car Wash', icon: '⛽', pos: [180, 0, 100],
    color: '#e74c3c', glb: '/gas_station.glb', size: 20,
    info: {
      title: '⛽ Gas Station · Car Wash', sub: 'Automotive Services',
      desc: 'Automated car wash, 4 EV chargers, 6 fuel pumps with 78% water recycling.',
      stats: [['🚗 Cars today', '87'], ['⚡ EV Chargers', '4'], ['⛽ Fuel Pumps', '6'], ['💧 Water recycle', '78%']],
      features: ['✅ Automated car wash', '✅ 4 fast EV chargers', '✅ 6 fuel pumps', '✅ Water recycling', '✅ 24/7 self-service'],
    },
  },
  office: {
    label: 'Sewage & Gas Co.', icon: '🏭', pos: [180, 0, -100],
    color: '#2ecc71', glb: '/office.glb', size: 22,
    info: {
      title: '🏭 Sewage & Gas Co.', sub: 'Industrial Treatment',
      desc: 'AI sewage treatment with biogas (2.1 MW), water recycling and 8M L/day processing.',
      stats: [['🏭 Processed', '8M L/day'], ['💨 Biogas', '2.1 MW'], ['♻️ Recycle', '75%'], ['🔬 Quality', 'Clean']],
      features: ['✅ AI sewage treatment', '✅ Biogas generation', '✅ 75% water recycling', '✅ Odor-free processing', '✅ Zero-waste target'],
    },
  },
  culture: {
    label: 'Culture Center', icon: '🏛', pos: [-150, 0, 100],
    color: '#f39c12', glb: '/national_archives_research_center.glb', size: 28,
    info: {
      title: '🏛 Culture Center', sub: 'Cultural Heritage Hub',
      desc: 'Museums, art galleries, VR tours, and 45 exhibits celebrating local cultures.',
      stats: [['🎭 Visitors', '320'], ['🖼️ Exhibits', '45'], ['🎬 VR Tours', 'Online'], ['🎨 Workshops', '2']],
      features: ['✅ 45 cultural exhibits', '✅ VR heritage tours', '✅ Live cultural events', '✅ Art workshops', '✅ Digital archives'],
    },
  },
  powerCo: {
    label: 'City Power Supply Co.', icon: '🔌', pos: [-150, 0, 0],
    color: '#f1c40f', glb: '/power-suply-companey.glb', size: 22,
    info: {
      title: '🔌 City Power Supply Co.', sub: 'Grid Monitoring',
      desc: 'AI load balancing across the city with 68 MW load, 22% reserve, and 0 outages today.',
      stats: [['⚡ Load', '68 MW'], ['🔋 Reserve', '22%'], ['📊 Grid', 'Stable'], ['🔌 Outages', '0']],
      features: ['✅ AI load balancing', '✅ Real-time grid monitoring', '✅ 68 MW distribution', '✅ Smart metering', '✅ Auto-failover systems'],
    },
  },
  scifi9: {
    label: 'Sci-Fi Building 9', icon: '🛸', pos: [-180, 0, -140],
    color: '#66ff99', glb: '/sci-fi_building_9.glb', size: 26,
    info: {
      title: '🛸 Sci-Fi Building 9', sub: 'Futuristic R&D',
      desc: 'Advanced research facility with holographic labs, quantum computing, 12 active research programs.',
      stats: [['🧪 Labs', '12'], ['💻 Quantum', 'Online'], ['🔬 Research', '8'], ['⚡ Power', 'Stable']],
      features: ['✅ Quantum computing lab', '✅ Holographic displays', '✅ AI research center', '✅ Zero-gravity sims', '✅ Advanced materials lab'],
    },
  },
  tower: {
    label: 'Beautiful Tower', icon: '🗼', pos: [-180, 0, 0],
    color: '#22cfff', glb: '/beautifultowerbuilding.glb', size: 30,
    info: {
      title: '🗼 Beautiful Tower', sub: 'Iconic Landmark',
      desc: '320-meter iconic landmark with observation deck and smart show lighting. 180 visitors daily.',
      stats: [['🏙️ Height', '320 m'], ['👁️ Visitors', '180'], ['💡 Lights', 'Show'], ['📡 Antenna', 'Active']],
      features: ['✅ 320m height', '✅ Observation deck', '✅ Smart show lighting', '✅ Communication antenna', '✅ Panoramic city views'],
    },
  },
  scifi10: {
    label: 'Sci-Fi Building 10', icon: '🚀', pos: [-180, 0, 140],
    color: '#ff66dd', glb: '/sci-fi_building_10.glb', size: 26,
    info: {
      title: '🚀 Sci-Fi Building 10', sub: 'Space Technology',
      desc: 'Satellite control center linked to 6 satellites with AI mission planning, 2 active missions.',
      stats: [['🛰️ Satellites', '6'], ['🚀 Missions', '2'], ['📡 Signal', 'Strong'], ['🤖 AI', 'Online']],
      features: ['✅ 6 satellite links', '✅ AI mission planning', '✅ Deep space tracking', '✅ Rocket telemetry', '✅ Global uplink network'],
    },
  },
  filtration: {
    label: 'Filtration System', icon: '💧', pos: [180, 0, -180],
    color: '#22cfff', glb: '/skid_filtration_system.glb', size: 20,
    info: {
      title: '💧 Filtration System', sub: '9-Stage Water Purification',
      desc: 'Advanced 9-stage purification with 99.7% purity, processing 12M liters daily with 82% recycling.',
      stats: [['💧 Processed', '12M L/day'], ['🧪 Purity', '99.7%'], ['🔬 Sensors', '24'], ['♻️ Recycle', '82%']],
      features: ['✅ 9-stage filtration', '✅ 99.7% purity', '✅ UV purification', '✅ Real-time monitoring', '✅ 82% water recycling'],
    },
  },
  traffic: {
    label: 'AI Traffic Controller', icon: '🚦', pos: [0, 0, 0],
    color: '#22cfff', glb: null, size: 0,
    info: {
      title: '🚦 AI Traffic Controller', sub: 'Central Intelligence',
      desc: 'Manages 4-way intersection with adaptive signal timing. Real-time vehicle detection, queue monitoring, predictive algorithms.',
      stats: [['🚗 Vehicles', '160+'], ['📡 Sensors', '24'], ['⚡ Phases', '2'], ['🧠 AI Confidence', '98%']],
      features: ['✅ Adaptive signal timing', '✅ Real-time detection', '✅ Emergency priority', '✅ Pedestrian cycles', '✅ Multi-directional flow'],
    },
  },
  power: {
    label: 'Power Supply Zone', icon: '⚡', pos: [-180, 0, 180],
    color: '#ffcc22', glb: null, size: 0,
    info: {
      title: '⚡ Power Supply Zone', sub: 'Renewable Energy',
      desc: 'Combined solar (42 MW) + wind (28 MW) = 70 MW renewable output with battery storage.',
      stats: [['☀️ Solar', '42 MW'], ['💨 Wind', '28 MW'], ['🔋 Batteries', '78%'], ['⚡ Output', '70 MW']],
      features: ['✅ 9 wind turbines', '✅ 9 solar arrays', '✅ 9 battery banks', '✅ Smart grid sync', '✅ Zero-emission power'],
    },
  },
  food: {
    label: 'AI Food Production', icon: '🍎', pos: [-180, 0, -180],
    color: '#2ecc71', glb: null, size: 0,
    info: {
      title: '🍎 AI Food Production', sub: 'Smart Farming',
      desc: 'AI-managed farm with drone monitoring, automated irrigation, processing plant with 48 daily deliveries.',
      stats: [['🌾 Crop Health', '94%'], ['🚁 Drones', '3'], ['🍎 Processing', '48/day'], ['💧 Irrigation', 'Auto']],
      features: ['✅ Drone crop monitoring', '✅ AI irrigation system', '✅ 9 farming plots', '✅ Automated processing', '✅ Farm-to-city delivery'],
    },
  },
  waste: {
    label: 'Waste Management', icon: '♻️', pos: [180, 0, 180],
    color: '#2ecc71', glb: null, size: 0,
    info: {
      title: '♻️ Waste Management', sub: 'Circular Economy',
      desc: 'Smart segregation with recycling, biogas (4.2 MW), and composting. 68% of waste is recycled.',
      stats: [['♻️ Recycled', '68%'], ['⚡ Energy', '4.2 MW'], ['🗑️ Bins', '9'], ['📊 Efficiency', '95%']],
      features: ['✅ 9 smart bins', '✅ AI segregation', '✅ Biogas generation', '✅ Composting area', '✅ Waste-to-energy'],
    },
  },
}

/* ═══════════════════════════════════════════════════════════
   BORDER
   ═══════════════════════════════════════════════════════════ */
function Border({ w = 4, d = 4, h = 8, color = '#22cfff' }) {
  const timeOfDay = useS(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const g = isNight ? 6 : 3

  return (
    <group>
      <mesh position={[0, 0.15, d / 2 + 0.1]}>
        <boxGeometry args={[w + 0.4, 0.15, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={g} />
      </mesh>
      <mesh position={[0, 0.15, -d / 2 - 0.1]}>
        <boxGeometry args={[w + 0.4, 0.15, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={g} />
      </mesh>
      <mesh position={[-w / 2 - 0.1, 0.15, 0]}>
        <boxGeometry args={[0.1, 0.15, d + 0.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={g} />
      </mesh>
      <mesh position={[w / 2 + 0.1, 0.15, 0]}>
        <boxGeometry args={[0.1, 0.15, d + 0.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={g} />
      </mesh>
      {[[-w / 2 - 0.1, d / 2 + 0.1], [w / 2 + 0.1, d / 2 + 0.1], [-w / 2 - 0.1, -d / 2 - 0.1], [w / 2 + 0.1, -d / 2 - 0.1]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={g} />
          </mesh>
          <mesh position={[0, 2.15, 0]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={isNight ? 8 : 5} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, h + 0.3, 0]}>
        <boxGeometry args={[w + 0.4, 0.08, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={g * 0.6} />
      </mesh>
      <mesh position={[0, h + 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[w + 0.4, 0.08, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={g * 0.6} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   BOARD
   ═══════════════════════════════════════════════════════════ */
function Board({ text, position = [0, 0, 0], color = '#22cfff', w = 10, h = 2.5, locKey = null }) {
  const [tex, setTex] = useState(null)

  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 256
    const ctx = c.getContext('2d')
    const grad = ctx.createLinearGradient(0, 0, 1024, 256)
    grad.addColorStop(0, color)
    grad.addColorStop(1, '#0a1018')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1024, 256)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 8
    ctx.strokeRect(10, 10, 1004, 236)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 70px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 512, 128)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    setTex(t)
  }, [text, color])

  if (!tex) return null

  const handleClick = (e) => {
    e.stopPropagation()
    if (locKey && LOCATIONS[locKey]) {
      setS({ infoPopup: { key: locKey, ...LOCATIONS[locKey].info } })
    }
  }

  return (
    <group position={position}>
      <mesh onClick={handleClick}>
        <boxGeometry args={[w + 0.4, h + 0.4, 0.3]} />
        <meshStandardMaterial color="#0a0a0a" emissive={color} emissiveIntensity={0.8} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.17]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent />
      </mesh>
      <mesh position={[-w / 2 + 0.5, -h / 2 - 2, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
        <meshStandardMaterial color="#333" metalness={0.7} />
      </mesh>
      <mesh position={[w / 2 - 0.5, -h / 2 - 2, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
        <meshStandardMaterial color="#333" metalness={0.7} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   GLB BUILDING — loads your .glb files
   ═══════════════════════════════════════════════════════════ */
function GLBBuilding({ url, size = 20, pos = [0, 0, 0], name = 'Building', color = '#22cfff', locKey }) {
  const [dims, setDims] = useState({ w: 6, d: 6, h: 10 })
  const gltf = useGLTF(url)

  const model = React.useMemo(() => {
    if (!gltf || !gltf.scene) return null
    const c = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(c)
    const sz = new THREE.Vector3()
    box.getSize(sz)
    const maxD = Math.max(sz.x, sz.y, sz.z)
    const sc = size / Math.max(maxD, 0.001)
    c.scale.setScalar(sc)
    const box2 = new THREE.Box3().setFromObject(c)
    const ctr = new THREE.Vector3()
    box2.getCenter(ctr)
    c.position.x -= ctr.x
    c.position.z -= ctr.z
    c.position.y -= box2.min.y
    const fs = new THREE.Vector3()
    box2.getSize(fs)
    setDims({ w: Math.max(fs.x * sc * 1.3, 6), d: Math.max(fs.z * sc * 1.3, 6), h: Math.max(fs.y * sc, 10) })
    return c
  }, [gltf, size])

  const handleClick = (e) => {
    e.stopPropagation()
    if (locKey && LOCATIONS[locKey]) {
      setS({ infoPopup: { key: locKey, ...LOCATIONS[locKey].info } })
    }
    setS({ focus: { x: pos[0] + 30, y: pos[1] + dims.h + 8, z: pos[2] + 30, lookAt: { x: pos[0], y: pos[1], z: pos[2] } } })
  }

  if (!model) return null

  return (
    <group position={pos}>
      <primitive object={model} onClick={handleClick} castShadow receiveShadow />
      <Border w={dims.w} d={dims.d} h={dims.h} color={color} />
      <Board text={name} position={[0, dims.h + 6, 0]} color={color} locKey={locKey} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   CITY BUILDINGS — sab GLB
   ═══════════════════════════════════════════════════════════ */
function CityBuildings() {
  return (
    <group>
      <GLBBuilding url="/american_high_school.glb" size={22} pos={[-100, 0, -100]} name="🏫 Beacon School" color="#1a5490" locKey="school" />
      <GLBBuilding url="/low_poly_hospital.glb" size={22} pos={[100, 0, -100]} name="🏥 Smart Hospital" color="#c0392b" locKey="hospital" />
      <GLBBuilding url="/us_bank_tower.glb" size={26} pos={[100, 0, 100]} name="🏦 State Bank" color="#8e44ad" locKey="bank" />
      <GLBBuilding url="/simple_farm_free.glb" size={28} pos={[-150, 0, -100]} name="🌾 Eco Farm" color="#27ae60" locKey="farm" />
      <GLBBuilding url="/liverpool_street_station_south_entrance.glb" size={24} pos={[100, 0, 180]} name="🎪 Event Hall" color="#d4a017" locKey="event" />
      <GLBBuilding url="/gas_station.glb" size={20} pos={[180, 0, 100]} name="⛽ Gas Station" color="#e74c3c" locKey="gas" />
      <GLBBuilding url="/office.glb" size={22} pos={[180, 0, -100]} name="🏭 Sewage & Gas" color="#2ecc71" locKey="office" />
      <GLBBuilding url="/national_archives_research_center.glb" size={28} pos={[-150, 0, 100]} name="🏛 Culture Center" color="#f39c12" locKey="culture" />
      <GLBBuilding url="/power-suply-companey.glb" size={22} pos={[-150, 0, 0]} name="🔌 Power Supply Co." color="#f1c40f" locKey="powerCo" />
      <GLBBuilding url="/sci-fi_building_9.glb" size={26} pos={[-180, 0, -140]} name="🛸 Sci-Fi Bldg 9" color="#66ff99" locKey="scifi9" />
      <GLBBuilding url="/beautifultowerbuilding.glb" size={30} pos={[-180, 0, 0]} name="🗼 Beautiful Tower" color="#22cfff" locKey="tower" />
      <GLBBuilding url="/sci-fi_building_10.glb" size={26} pos={[-180, 0, 140]} name="🚀 Sci-Fi Bldg 10" color="#ff66dd" locKey="scifi10" />
      <GLBBuilding url="/skid_filtration_system.glb" size={20} pos={[180, 0, -180]} name="💧 Filtration" color="#22cfff" locKey="filtration" />
    </group>
  )
}
