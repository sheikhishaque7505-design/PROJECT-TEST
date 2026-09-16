import React, { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, useGLTF, ContactShadows, Sky, Text } from '@react-three/drei'
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
  cameraMode: null,
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
   AI TRAFFIC SYSTEM STATE
   ═══════════════════════════════════════════════════════════ */
const TS = {
  phase: 0,
  inYellow: false,
  inAllRed: false,
  elapsed: 0,
}
const PHASE_DURATION = 10
const YELLOW_DURATION = 3
const ALL_RED_DURATION = 1

/* ═══════════════════════════════════════════════════════════
   LOCATIONS DATA
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
   BUILDING BORDER
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
          {isNight && <pointLight position={[0, 2.3, 0]} color={color} intensity={0.5} distance={5} />}
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
   GLB BUILDING
   ═══════════════════════════════════════════════════════════ */
function GLBBuilding({ url, size = 20, pos = [0, 0, 0], name = 'Building', color = '#22cfff', locKey }) {
  const [dims, setDims] = useState({ w: 6, d: 6, h: 10 })
  let gltf = null
  try { gltf = useGLTF(url) } catch (e) { }

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

  if (!model) {
    const w = size / 3
    const h = size / 2
    return (
      <group position={pos}>
        <mesh onClick={handleClick} castShadow>
          <boxGeometry args={[w, h, w]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
        </mesh>
        <Border w={w} d={w} h={h} color={color} />
        <Board text={name} position={[0, h + 5, 0]} color={color} locKey={locKey} />
      </group>
    )
  }

  return (
    <group position={pos}>
      <primitive object={model} onClick={handleClick} castShadow receiveShadow />
      <Border w={dims.w} d={dims.d} h={dims.h} color={color} />
      <Board text={name} position={[0, dims.h + 6, 0]} color={color} locKey={locKey} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   HOUSE
   ═══════════════════════════════════════════════════════════ */
function House({ pos = [0, 0, 0], h = 8, color = '#a67c52', name = 'House', turbine = false }) {
  const timeOfDay = useS(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const bc = turbine ? '#22cfff' : '#ffcc22'

  const handleClick = (e) => {
    e.stopPropagation()
    setS({
      infoPopup: {
        title: `🏠 ${name}`,
        sub: 'Smart Residential House',
        desc: `Energy-efficient house with ${turbine ? 'wind turbine + ' : ''}solar panels and AI climate control.`,
        stats: [['🏠 Type', 'Residential'], ['☀️ Solar', 'Active'], ['💨 Turbine', turbine ? 'Active' : 'None'], ['🔋 Power', 'Connected']],
        features: ['✅ Smart energy metering', '✅ AI climate control', '✅ Auto day/night lighting', '✅ IoT home devices', '✅ Green energy powered'],
      },
    })
    setS({ focus: { x: pos[0] + 15, y: pos[1] + h + 5, z: pos[2] + 15, lookAt: { x: pos[0], y: pos[1], z: pos[2] } } })
  }

  return (
    <group position={pos}>
      <mesh castShadow receiveShadow onClick={handleClick}>
        <boxGeometry args={[5, h, 5]} />
        <meshStandardMaterial color={color} roughness={0.75} metalness={0.15} />
      </mesh>

      {Array.from({ length: Math.floor(h / 3) }).map((_, f) => {
        const y = (f * 3) - h / 2 + 2
        return (
          <group key={f}>
            <mesh position={[0, y, 2.51]}>
              <boxGeometry args={[4, 1.8, 0.05]} />
              <meshStandardMaterial color={isNight ? '#ffffcc' : '#87CEEB'} transparent opacity={isNight ? 0.95 : 0.75} emissive={isNight ? '#ffff99' : '#000000'} emissiveIntensity={isNight ? 0.8 : 0} />
            </mesh>
            <mesh position={[0, y, -2.51]}>
              <boxGeometry args={[4, 1.8, 0.05]} />
              <meshStandardMaterial color={isNight ? '#ffffcc' : '#87CEEB'} transparent opacity={isNight ? 0.95 : 0.75} emissive={isNight ? '#ffff99' : '#000000'} emissiveIntensity={isNight ? 0.8 : 0} />
            </mesh>
          </group>
        )
      })}

      <mesh position={[0, h / 2 + 0.5, 0]} castShadow>
        <boxGeometry args={[5.4, 1, 5.4]} />
        <meshStandardMaterial color="#34495e" />
      </mesh>

      <mesh position={[0, h / 2 + 1.2, 0]}>
        <boxGeometry args={[4, 0.1, 4]} />
        <meshStandardMaterial color="#082c4b" emissive="#063b62" emissiveIntensity={1} metalness={0.7} />
      </mesh>

      {turbine && <Turbine pos={[0, h / 2 + 1, 0]} scale={0.6} />}

      <Border w={5} d={5} h={h} color={bc} />
      <Board text={name} position={[0, h + 4, 0]} color={bc} w={7} h={1.6} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   WIND TURBINE
   ═══════════════════════════════════════════════════════════ */
function Turbine({ pos, scale = 1 }) {
  const ref = useRef()
  useFrame(() => { if (ref.current) ref.current.rotation.z += 0.05 })

  return (
    <group position={pos} scale={scale}>
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 8, 6]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.3} />
      </mesh>
      <group ref={ref} position={[0, 8, 0]}>
        {[0, 1, 2].map(i => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} castShadow>
            <boxGeometry args={[0.2, 3.5, 0.1]} />
            <meshStandardMaterial color="#f0f0f0" />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color="#2c3e50" />
        </mesh>
      </group>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   STREET LIGHT
   ═══════════════════════════════════════════════════════════ */
function StreetLight({ pos }) {
  const timeOfDay = useS(s => s.timeOfDay)
  const streetLightsOn = useS(s => s.streetLightsOn)
  const isOn = streetLightsOn || timeOfDay === 'night'

  return (
    <group position={pos}>
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 6, 8]} />
        <meshStandardMaterial color="#444" metalness={0.5} />
      </mesh>
      <mesh position={[1, 6, 0]} castShadow>
        <boxGeometry args={[2, 0.15, 0.15]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[2, 5.9, 0]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[2, 5.7, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color={isOn ? '#ffffcc' : '#666'} emissive={isOn ? '#ffff99' : '#000'} emissiveIntensity={isOn ? 2 : 0} />
      </mesh>
      {isOn && <pointLight position={[2, 5.7, 0]} intensity={0.9} distance={18} color="#ffffcc" />}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   CITY DIMENSIONS
   ═══════════════════════════════════════════════════════════ */
const CITY = {
  HALF: 200,
  ROAD_W: 8,
  ROAD_LEN: 380,
  ROAD_Z: [-75, -25, 25, 75],
  ROAD_X: [-75, -25, 25, 75],
}

/* ═══════════════════════════════════════════════════════════
   ROAD SYSTEM
   ═══════════════════════════════════════════════════════════ */
function Roads() {
  const { HALF, ROAD_W: RW, ROAD_LEN: RL, ROAD_Z: RZ, ROAD_X: RX } = CITY
  const road = <meshStandardMaterial color="#2a2a2a" roughness={0.92} metalness={0.05} />
  const yellow = <meshStandardMaterial color="#f5c84b" emissive="#f5c84b" emissiveIntensity={0.6} />
  const white = <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.4} />
  const sw = <meshStandardMaterial color="#a8a8a8" roughness={0.9} />
  const curb = <meshStandardMaterial color="#6a6a6a" roughness={0.85} />

  return (
    <group>
      {RZ.map((z, i) => (
        <group key={`ew${i}`}>
          <mesh position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[RL, RW]} />{road}
          </mesh>
          <mesh position={[0, 0.025, z - 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[RL, 0.2]} />{yellow}
          </mesh>
          <mesh position={[0, 0.025, z + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[RL, 0.2]} />{yellow}
          </mesh>
          {Array.from({ length: 60 }).map((_, k) => (
            <React.Fragment key={k}>
              <mesh position={[-RL / 2 + 3 + k * 3.2, 0.03, z - RW / 4]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.5, 0.15]} />{white}
              </mesh>
              <mesh position={[-RL / 2 + 3 + k * 3.2, 0.03, z + RW / 4]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.5, 0.15]} />{white}
              </mesh>
            </React.Fragment>
          ))}
          <mesh position={[0, 0.2, z - RW / 2 - 1.5]} receiveShadow>
            <boxGeometry args={[RL, 0.4, 3]} />{sw}
          </mesh>
          <mesh position={[0, 0.2, z + RW / 2 + 1.5]} receiveShadow>
            <boxGeometry args={[RL, 0.4, 3]} />{sw}
          </mesh>
          <mesh position={[0, 0.25, z - RW / 2 - 0.15]}>
            <boxGeometry args={[RL, 0.5, 0.3]} />{curb}
          </mesh>
          <mesh position={[0, 0.25, z + RW / 2 + 0.15]}>
            <boxGeometry args={[RL, 0.5, 0.3]} />{curb}
          </mesh>
        </group>
      ))}

      {RX.map((x, i) => (
        <group key={`ns${i}`}>
          <mesh position={[x, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[RW, RL]} />{road}
          </mesh>
          <mesh position={[x - 0.5, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, RL]} />{yellow}
          </mesh>
          <mesh position={[x + 0.5, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, RL]} />{yellow}
          </mesh>
          {Array.from({ length: 60 }).map((_, k) => (
            <React.Fragment key={k}>
              <mesh position={[x - RW / 4, 0.03, -RL / 2 + 3 + k * 3.2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.15, 1.5]} />{white}
              </mesh>
              <mesh position={[x + RW / 4, 0.03, -RL / 2 + 3 + k * 3.2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.15, 1.5]} />{white}
              </mesh>
            </React.Fragment>
          ))}
          <mesh position={[x - RW / 2 - 1.5, 0.2, 0]} receiveShadow>
            <boxGeometry args={[3, 0.4, RL]} />{sw}
          </mesh>
          <mesh position={[x + RW / 2 + 1.5, 0.2, 0]} receiveShadow>
            <boxGeometry args={[3, 0.4, RL]} />{sw}
          </mesh>
          <mesh position={[x - RW / 2 - 0.15, 0.25, 0]}>
            <boxGeometry args={[0.3, 0.5, RL]} />{curb}
          </mesh>
          <mesh position={[x + RW / 2 + 0.15, 0.25, 0]}>
            <boxGeometry args={[0.3, 0.5, RL]} />{curb}
          </mesh>
        </group>
      ))}

      {RX.map(x => RZ.map(z => (
        <group key={`cw-${x}-${z}`} position={[x, 0.04, z]}>
          {Array.from({ length: 12 }).map((_, k) => (
            <mesh key={`h${k}`} position={[-RW / 2 + 0.6 + k * 0.6, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.35, RW - 0.5]} />{white}
            </mesh>
          ))}
          {Array.from({ length: 12 }).map((_, k) => (
            <mesh key={`v${k}`} position={[0, 0, -RW / 2 + 0.6 + k * 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[RW - 0.5, 0.35]} />{white}
            </mesh>
          ))}
        </group>
      )))}

      {[
        { pos: [0, 5, HALF], rot: [0, 0, 0], len: HALF * 2 + 20 },
        { pos: [0, 5, -HALF], rot: [0, 0, 0], len: HALF * 2 + 20 },
        { pos: [HALF, 5, 0], rot: [0, Math.PI / 2, 0], len: HALF * 2 + 20 },
        { pos: [-HALF, 5, 0], rot: [0, Math.PI / 2, 0], len: HALF * 2 + 20 },
      ].map((w, i) => (
        <group key={`wall${i}`} position={w.pos} rotation={w.rot}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[w.len, 10, 3]} />
            <meshStandardMaterial color="#5a6670" roughness={0.9} metalness={0.1} />
          </mesh>
          <mesh position={[0, 5.2, 0]}>
            <boxGeometry args={[w.len, 0.5, 3.4]} />
            <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   STREET LIGHT SYSTEM
   ═══════════════════════════════════════════════════════════ */
function StreetLightSystem() {
  const positions = []
  const { ROAD_W, ROAD_LEN, ROAD_Z, ROAD_X } = CITY

  ROAD_Z.forEach(z => {
    for (let x = -ROAD_LEN / 2 + 20; x <= ROAD_LEN / 2 - 20; x += 30) {
      positions.push([x, 0, z - ROAD_W / 2 - 4])
      positions.push([x, 0, z + ROAD_W / 2 + 4])
    }
  })

  ROAD_X.forEach(x => {
    for (let z = -ROAD_LEN / 2 + 20; z <= ROAD_LEN / 2 - 20; z += 30) {
      let skip = false
      ROAD_Z.forEach(rz => { if (Math.abs(z - rz) < 10) skip = true })
      if (!skip) {
        positions.push([x - ROAD_W / 2 - 4, 0, z])
        positions.push([x + ROAD_W / 2 + 4, 0, z])
      }
    }
  })

  return (
    <group>
      {positions.map((pos, i) => <StreetLight key={i} pos={pos} />)}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   AI TRAFFIC SYSTEM
   ═══════════════════════════════════════════════════════════ */
function AITrafficSystem() {
  const lastLogRef = useRef(0)

  useFrame((_, dt) => {
    TS.elapsed += dt

    if (TS.inAllRed) {
      if (TS.elapsed >= ALL_RED_DURATION) {
        TS.inAllRed = false
        TS.phase = TS.phase === 0 ? 1 : 0
        TS.elapsed = 0
        addLog(`✅ Switched to ${TS.phase === 0 ? 'North-South' : 'East-West'} GREEN — Phase ${TS.phase + 1}`, 'phase')
      }
    } else if (TS.inYellow) {
      if (TS.elapsed >= YELLOW_DURATION) {
        TS.inYellow = false
        TS.inAllRed = true
        TS.elapsed = 0
        addLog('⚠️ Yellow → All-Red safety interval', 'warning')
      }
    } else if (TS.elapsed >= PHASE_DURATION) {
      TS.inYellow = true
      TS.elapsed = 0
      addLog(`⏱️ ${TS.phase === 0 ? 'NS' : 'EW'} phase ending — yellow`, 'info')
    }

    if (Date.now() - lastLogRef.current > 6000 && Math.random() < 0.4) {
      lastLogRef.current = Date.now()
      const decisions = [
        { msg: '🧠 AI detected heavy traffic — extending green phase by 2s', type: 'adaptive' },
        { msg: '📡 24 sensors reporting — queue analysis complete', type: 'info' },
        { msg: '✅ Signal optimization — 98% efficiency achieved', type: 'success' },
        { msg: '🚗 40+ vehicles detected in intersection zone', type: 'info' },
        { msg: '🎯 Traffic flow balanced across all 4 directions', type: 'success' },
        { msg: '📊 Real-time queue analysis — no congestion', type: 'info' },
        { msg: '🤖 AI managing 160+ vehicles with adaptive timing', type: 'adaptive' },
        { msg: '⚡ Emergency priority system — standby ready', type: 'info' },
      ]
      const d = decisions[Math.floor(Math.random() * decisions.length)]
      addLog(d.msg, d.type)
    }
  })

  return null
}

/* ═══════════════════════════════════════════════════════════
   TRAFFIC LIGHT POLE
   ═══════════════════════════════════════════════════════════ */
function TrafficLightPole({ pos, roadId }) {
  const redRef = useRef()
  const yellowRef = useRef()
  const greenRef = useRef()

  useFrame(() => {
    const nsGreen = TS.phase === 0 && !TS.inYellow && !TS.inAllRed
    const ewGreen = TS.phase === 1 && !TS.inYellow && !TS.inAllRed
    const isYellow = TS.inYellow

    let isGreen = false
    if (roadId === 1 || roadId === 2) isGreen = nsGreen
    if (roadId === 3 || roadId === 4) isGreen = ewGreen

    const isRed = !isGreen && !isYellow

    if (redRef.current) redRef.current.material.emissiveIntensity = isRed ? (Math.floor(Date.now() / 500) % 2 ? 8 : 4) : 0.2
    if (yellowRef.current) yellowRef.current.material.emissiveIntensity = isYellow ? 10 : 0.2
    if (greenRef.current) greenRef.current.material.emissiveIntensity = isGreen ? 8 + Math.sin(Date.now() * 0.005) * 2 : 0.2
  })

  return (
    <group position={pos}>
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.4} />
      </mesh>
      <mesh position={[1.2, 7.5, 0]} castShadow>
        <boxGeometry args={[2.4, 0.18, 0.18]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[2.4, 7.5, 0]} castShadow>
        <boxGeometry args={[0.7, 2, 0.7]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      <mesh ref={redRef} position={[2.4, 8.1, 0.42]}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff2222" emissiveIntensity={0} />
      </mesh>
      <mesh ref={yellowRef} position={[2.4, 7.5, 0.42]}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#ffcc22" emissive="#ffcc22" emissiveIntensity={0} />
      </mesh>
      <mesh ref={greenRef} position={[2.4, 6.9, 0.42]}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#22ff66" emissive="#22ff66" emissiveIntensity={0} />
      </mesh>
    </group>
  )
}

function TrafficLights() {
  const offset = CITY.ROAD_W / 2 + 3
  return (
    <group>
      <TrafficLightPole pos={[-offset, 0, -offset]} roadId={1} />
      <TrafficLightPole pos={[offset, 0, offset]} roadId={2} />
      <TrafficLightPole pos={[offset, 0, -offset]} roadId={3} />
      <TrafficLightPole pos={[-offset, 0, offset]} roadId={4} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   CAR
   ═══════════════════════════════════════════════════════════ */
function Car({ lane, startPos }) {
  const carRef = useRef()
  const posRef = useRef(startPos)
  const timeOfDay = useS(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const colorRef = useRef(null)
  const speedRef = useRef(15 + Math.random() * 5)

  if (!colorRef.current) {
    const colors = ['#287ca3', '#c83f49', '#e1a72e', '#5b72c9', '#2f9d65', '#d8d8d8', '#d97b2a', '#8b3ad9', '#16a085', '#8e44ad', '#f39c12', '#e74c3c']
    colorRef.current = colors[Math.floor(Math.random() * colors.length)]
  }

  useFrame((_, dt) => {
    if (!carRef.current) return

    const isNs = lane.road === 1 || lane.road === 2
    const isEw = lane.road === 3 || lane.road === 4

    const nsGreen = TS.phase === 0 && !TS.inYellow && !TS.inAllRed
    const ewGreen = TS.phase === 1 && !TS.inYellow && !TS.inAllRed
    const isGreen = (isNs && nsGreen) || (isEw && ewGreen)

    const distToCenter = Math.abs(posRef.current)

    let speed = speedRef.current
    if (!isGreen && distToCenter < 25) {
      if (distToCenter < 15) {
        speed = 0
      } else {
        speed = speedRef.current * ((distToCenter - 15) / 10)
      }
    }

    posRef.current += speed * lane.dir * dt

    const span = Math.abs(lane.end - lane.start)
    if (lane.dir > 0 && posRef.current > lane.end) {
      posRef.current = lane.start + (posRef.current - lane.end)
    } else if (lane.dir < 0 && posRef.current < lane.end) {
      posRef.current = lane.start - (lane.end - posRef.current)
    }

    if (lane.axis === 'z') {
      carRef.current.position.set(lane.fixed, 0.35, posRef.current)
      carRef.current.rotation.y = lane.dir > 0 ? -Math.PI / 2 : Math.PI / 2
    } else {
      carRef.current.position.set(posRef.current, 0.35, lane.fixed)
      carRef.current.rotation.y = lane.dir > 0 ? 0 : Math.PI
    }
  })

  return (
    <group ref={carRef}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[3.4, 0.7, 1.5]} />
        <meshStandardMaterial color={colorRef.current} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh castShadow position={[1.2, 0.35, 0]}>
        <boxGeometry args={[1, 0.4, 1.4]} />
        <meshStandardMaterial color={colorRef.current} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh castShadow position={[-0.2, 0.65, 0]}>
        <boxGeometry args={[1.6, 0.6, 1.1]} />
        <meshStandardMaterial color="#1a3a4a" emissive="#0a2535" emissiveIntensity={0.8} metalness={0.6} roughness={0.15} />
      </mesh>
      <mesh position={[-0.2, 0.96, 0]}>
        <boxGeometry args={[1.4, 0.08, 0.9]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {[[-1.1, 0.8], [-1.1, -0.8], [1.1, 0.8], [1.1, -0.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.18, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 10]} />
          <meshStandardMaterial color="#0c1012" />
        </mesh>
      ))}
      <mesh position={[1.7, 0.4, 0.45]}>
        <boxGeometry args={[0.06, 0.2, 0.25]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff8e0" emissiveIntensity={isNight ? 6 : 2} />
      </mesh>
      <mesh position={[1.7, 0.4, -0.45]}>
        <boxGeometry args={[0.06, 0.2, 0.25]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff8e0" emissiveIntensity={isNight ? 6 : 2} />
      </mesh>
      <mesh position={[-1.7, 0.4, 0.45]}>
        <boxGeometry args={[0.06, 0.2, 0.25]} />
        <meshStandardMaterial color="#ff1e1e" emissive="#ff1010" emissiveIntensity={3} />
      </mesh>
      <mesh position={[-1.7, 0.4, -0.45]}>
        <boxGeometry args={[0.06, 0.2, 0.25]} />
        <meshStandardMaterial color="#ff1e1e" emissive="#ff1010" emissiveIntensity={3} />
      </mesh>
      {isNight && <pointLight position={[4, 0.5, 0]} intensity={1.2} distance={18} color="#ffffcc" />}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   TRAFFIC SYSTEM
   ═══════════════════════════════════════════════════════════ */
function TrafficSystem() {
  const trafficDensity = useS(s => s.trafficDensity)
  const carsPerLane = trafficDensity === 'low' ? 3 : trafficDensity === 'medium' ? 4 : 6
  const { ROAD_Z, ROAD_X, ROAD_LEN } = CITY

  const lanes = []
  ROAD_Z.forEach((z, i) => {
    lanes.push({ id: `EW-E-${i}`, axis: 'x', dir: 1, fixed: z - 1.5, road: 3, start: -ROAD_LEN / 2, end: ROAD_LEN / 2 })
    lanes.push({ id: `EW-W-${i}`, axis: 'x', dir: -1, fixed: z + 1.5, road: 4, start: ROAD_LEN / 2, end: -ROAD_LEN / 2 })
  })
  ROAD_X.forEach((x, i) => {
    lanes.push({ id: `NS-N-${i}`, axis: 'z', dir: 1, fixed: x - 1.5, road: 1, start: -ROAD_LEN / 2, end: ROAD_LEN / 2 })
    lanes.push({ id: `NS-S-${i}`, axis: 'z', dir: -1, fixed: x + 1.5, road: 2, start: ROAD_LEN / 2, end: -ROAD_LEN / 2 })
  })

  return (
    <group>
      {lanes.map(lane => (
        Array.from({ length: carsPerLane }).map((_, i) => {
          const span = Math.abs(lane.end - lane.start)
          const gap = span / carsPerLane
          const startPos = lane.dir > 0 ? lane.start + gap * i : lane.start - gap * i
          return <Car key={`${lane.id}-${i}`} lane={lane} startPos={startPos} />
        })
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   PERSON
   ═══════════════════════════════════════════════════════════ */
function Person({ cx = 0, cz = 0, radius = 8, speed = 0.5 }) {
  const ref = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2)
  const dirRef = useRef(Math.random() > 0.5 ? 1 : -1)
  const colorRef = useRef(null)

  if (!colorRef.current) {
    const skins = ['#f2c9a0', '#d9a373', '#a06a3c', '#6b4a2f', '#ffd8b8']
    const shirts = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22']
    colorRef.current = {
      skin: skins[Math.floor(Math.random() * skins.length)],
      shirt: shirts[Math.floor(Math.random() * shirts.length)],
    }
  }

  useFrame(() => {
    if (!ref.current) return
    angleRef.current += speed * 0.02 * dirRef.current
    const x = cx + Math.cos(angleRef.current) * radius
    const z = cz + Math.sin(angleRef.current) * radius
    ref.current.position.set(x, 0, z)
    ref.current.rotation.y = angleRef.current + (dirRef.current > 0 ? Math.PI / 2 : -Math.PI / 2)
  })

  return (
    <group ref={ref}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.9, 8]} />
        <meshStandardMaterial color={colorRef.current.shirt} />
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={colorRef.current.skin} />
      </mesh>
      <mesh position={[-0.1, 0.45, 0]} castShadow>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      <mesh position={[0.1, 0.45, 0]} castShadow>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </group>
  )
}

function PeopleSystem() {
  const spots = [
    [-15, -15], [15, -15], [-15, 15], [15, 15],
    [0, 40], [40, 0], [-40, 0], [0, -40],
    [50, 50], [-50, -50], [-50, 50], [50, -50],
    [-80, 0], [80, 0], [0, -80], [0, 80],
    [100, -60], [-100, 60], [60, -100], [-60, 100],
  ]
  return (
    <group>
      {spots.map(([cx, cz], i) => (
        <Person key={i} cx={cx} cz={cz} radius={3 + Math.random() * 3} speed={0.5 + Math.random() * 0.4} />
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   TREE
   ═══════════════════════════════════════════════════════════ */
function Tree({ pos, scale = 1 }) {
  return (
    <group position={pos} scale={scale}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 2.4, 6]} />
        <meshStandardMaterial color="#5a3d24" />
      </mesh>
      <mesh position={[0, 3.6, 0]} castShadow>
        <coneGeometry args={[1.8, 3.6, 7]} />
        <meshStandardMaterial color="#2d6e3d" />
      </mesh>
      <mesh position={[0, 5.2, 0]} castShadow>
        <coneGeometry args={[1.2, 2.4, 7]} />
        <meshStandardMaterial color="#3a8a4c" />
      </mesh>
    </group>
  )
}

function TreesSystem() {
  const positions = []
  const { ROAD_Z, ROAD_X, ROAD_W, HALF } = CITY

  for (let i = 0; i < 150; i++) {
    const x = (Math.random() - 0.5) * HALF * 1.8
    const z = (Math.random() - 0.5) * HALF * 1.8
    let skip = false
    ROAD_Z.forEach(rz => { if (Math.abs(z - rz) < ROAD_W / 2 + 6) skip = true })
    ROAD_X.forEach(rx => { if (Math.abs(x - rx) < ROAD_W / 2 + 6) skip = true })
    if (Math.sqrt(x * x + z * z) < 20) skip = true
    if (skip) continue
    positions.push([x, 0, z])
  }

  return (
    <group>
      {positions.map((pos, i) => (
        <Tree key={i} pos={pos} scale={0.7 + Math.random() * 0.6} />
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   PARK
   ═══════════════════════════════════════════════════════════ */
function Park({ pos, size = 30 }) {
  const treePositions = []
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    treePositions.push([Math.cos(angle) * (size / 2 - 3), Math.sin(angle) * (size / 2 - 3)])
  }
  return (
    <group position={pos}>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#3a8a4a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[2, 2.5, 2, 16]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.5} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 1, 16]} />
        <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2} transparent opacity={0.85} />
      </mesh>
      {treePositions.map(([x, z], i) => (
        <Tree key={i} pos={[x, 0, z]} scale={0.9} />
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   SOLAR PANEL
   ═══════════════════════════════════════════════════════════ */
function SolarPanel({ pos, rotation = [0, 0, 0], scale = 1 }) {
  const timeOfDay = useS(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'

  return (
    <group position={pos} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.8, 0]} rotation={[-0.4, 0, 0]} castShadow>
        <boxGeometry args={[3, 0.1, 2]} />
        <meshStandardMaterial
          color="#1a3a5c"
          emissive={isNight ? '#0a1a2c' : '#1a4a7c'}
          emissiveIntensity={isNight ? 0.2 : 0.6}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[-1, 0.4, 0]} castShadow>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#666" metalness={0.6} />
      </mesh>
      <mesh position={[1, 0.4, 0]} castShadow>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#666" metalness={0.6} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   BATTERY BANK
   ═══════════════════════════════════════════════════════════ */
function BatteryBank({ pos }) {
  const timeOfDay = useS(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'

  return (
    <group position={pos}>
      {[0, 1, 2].map(i => (
        <group key={i} position={[i * 2.5 - 2.5, 0, 0]}>
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[2, 2, 1.5]} />
            <meshStandardMaterial color="#2c3e50" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1, 0.76]}>
            <boxGeometry args={[1.5, 1.5, 0.05]} />
            <meshStandardMaterial
              color="#22cfff"
              emissive="#22cfff"
              emissiveIntensity={isNight ? 3 : 1.5}
              transparent
              opacity={0.8}
            />
          </mesh>
          <mesh position={[0, 2.1, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
            <meshStandardMaterial color="#ffcc22" emissive="#ffcc22" emissiveIntensity={1} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   WIND TURBINE FARM
   ═══════════════════════════════════════════════════════════ */
function WindTurbineFarm({ pos }) {
  const turbines = [
    [0, 0], [15, 5], [-15, 5], [8, -12], [-8, -12],
    [22, -8], [-22, -8], [5, 18], [-5, 18],
  ]
  return (
    <group position={pos}>
      {turbines.map(([x, z], i) => (
        <Turbine key={i} pos={[x, 0, z]} scale={0.8 + Math.random() * 0.4} />
      ))}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#4a6a4a" roughness={0.95} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   POWER SUPPLY ZONE
   ═══════════════════════════════════════════════════════════ */
function PowerSupplyZone() {
  const timeOfDay = useS(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'

  return (
    <group position={[-180, 0, 180]}>
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3)
        const col = i % 3
        return (
          <SolarPanel
            key={`solar-${i}`}
            pos={[col * 8 - 8, 0, row * 6 - 6]}
            rotation={[0, 0, 0]}
            scale={0.8}
          />
        )
      })}

      <BatteryBank pos={[0, 0, 15]} />

      <group position={[15, 0, 0]}>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[6, 4, 5]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0, 4.2, 0]}>
          <boxGeometry args={[6.5, 0.4, 5.5]} />
          <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={isNight ? 4 : 2} />
        </mesh>
        <Board text="⚡ POWER ZONE" position={[0, 7, 0]} color="#ffcc22" w={8} h={2} locKey="power" />
      </group>

      <WindTurbineFarm pos={[-30, 0, -10]} />

      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#5a6a5a" roughness={0.95} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   FILTRATION SYSTEM
   ═══════════════════════════════════════════════════════════ */
function FiltrationSystem() {
  const timeOfDay = useS(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'

  return (
    <group position={[180, 0, -180]}>
      {[0, 1, 2].map(i => (
        <group key={i} position={[i * 6 - 6, 0, 0]}>
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[2, 2, 5, 16]} />
            <meshStandardMaterial color="#4a6a7a" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 5.1, 0]}>
            <cylinderGeometry args={[2.1, 2.1, 0.2, 16]} />
            <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={isNight ? 3 : 1.5} />
          </mesh>
          <mesh position={[0, 2, 2.05]}>
            <boxGeometry args={[3, 3.5, 0.1]} />
            <meshStandardMaterial color="#1a4a6a" transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 1, 3.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 18, 8]} />
        <meshStandardMaterial color="#6a7a8a" metalness={0.6} />
      </mesh>
      <mesh position={[0, 1, -3.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 18, 8]} />
        <meshStandardMaterial color="#6a7a8a" metalness={0.6} />
      </mesh>

      <group position={[12, 0, 0]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[6, 3, 5]} />
          <meshStandardMaterial color="#3a5a6a" metalness={0.3} roughness={0.6} />
        </mesh>
        <Board text="💧 FILTRATION" position={[0, 5.5, 0]} color="#22cfff" w={9} h={2} locKey="filtration" />
      </group>

      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial color="#5a5a6a" roughness={0.9} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   AI FOOD PRODUCTION
   ═══════════════════════════════════════════════════════════ */
function FoodProduction() {
  const timeOfDay = useS(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'

  const cropRows = []
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) {
      cropRows.push([j * 8 - 8, i * 4 - 10])
    }
  }

  return (
    <group position={[-180, 0, -180]}>
      {cropRows.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[6, 0.6, 3]} />
            <meshStandardMaterial color="#3a7a3a" roughness={0.9} />
          </mesh>
          {Array.from({ length: 4 }).map((_, k) => (
            <mesh key={k} position={[k * 1.5 - 2.25, 0.8, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.2, 0.8, 6]} />
              <meshStandardMaterial color="#4a9a4a" />
            </mesh>
          ))}
        </group>
      ))}

      <group position={[15, 0, 0]}>
        <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[8, 5, 6]} />
          <meshStandardMaterial color="#5a6a5a" metalness={0.3} roughness={0.7} />
        </mesh>
        <mesh position={[0, 5.2, 0]}>
          <boxGeometry args={[8.5, 0.4, 6.5]} />
          <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={isNight ? 3 : 1.5} />
        </mesh>
        <Board text="🍎 FOOD PRODUCTION" position={[0, 8, 0]} color="#2ecc71" w={11} h={2} locKey="food" />
      </group>

      <group position={[-15, 0, 10]}>
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3, 16]} />
          <meshStandardMaterial color="#2a4a2a" emissive="#2ecc71" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.5, 2.8, 16]} />
          <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={2} />
        </mesh>
      </group>

      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 50]} />
        <meshStandardMaterial color="#4a5a3a" roughness={0.95} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   WASTE MANAGEMENT
   ═══════════════════════════════════════════════════════════ */
function WasteManagement() {
  const timeOfDay = useS(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'

  return (
    <group position={[180, 0, 180]}>
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3)
        const col = i % 3
        const colors = ['#2ecc71', '#3498db', '#e74c3c']
        return (
          <group key={i} position={[col * 5 - 5, 0, row * 5 - 5]}>
            <mesh position={[0, 1, 0]} castShadow>
              <cylinderGeometry args={[0.8, 0.7, 2, 8]} />
              <meshStandardMaterial color={colors[i % 3]} metalness={0.3} roughness={0.6} />
            </mesh>
            <mesh position={[0, 2.1, 0]}>
              <cylinderGeometry args={[0.9, 0.9, 0.2, 8]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </group>
        )
      })}

      <group position={[0, 0, 15]}>
        <mesh position={[0, 3, 0]} castShadow>
          <boxGeometry args={[10, 6, 8]} />
          <meshStandardMaterial color="#4a5a4a" metalness={0.3} roughness={0.7} />
        </mesh>
        <mesh position={[0, 6.2, 0]}>
          <boxGeometry args={[10.5, 0.4, 8.5]} />
          <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={isNight ? 3 : 1.5} />
        </mesh>
        <mesh position={[3, 7, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.6, 4, 8]} />
          <meshStandardMaterial color="#5a5a5a" />
        </mesh>
        <Board text="♻️ WASTE MGMT" position={[0, 10, 0]} color="#2ecc71" w={10} h={2} locKey="waste" />
      </group>

      <group position={[-15, 0, 0]}>
        <mesh position={[0, 2, 0]} castShadow>
          <sphereGeometry args={[2.5, 16, 16]} />
          <meshStandardMaterial color="#4a6a4a" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 4.6, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
          <meshStandardMaterial color="#ffcc22" emissive="#ffcc22" emissiveIntensity={isNight ? 2 : 1} />
        </mesh>
      </group>

      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   INFO POPUP
   ═══════════════════════════════════════════════════════════ */
function InfoPopup() {
  const infoPopup = useS(s => s.infoPopup)
  if (!infoPopup) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)',
        border: '2px solid #22cfff',
        borderRadius: 16,
        padding: 28,
        maxWidth: 520,
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 0 40px rgba(34,207,255,0.3)',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, color: '#22cfff' }}>{infoPopup.title}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#88aacc' }}>{infoPopup.sub}</p>
          </div>
          <button
            onClick={() => setS({ infoPopup: null })}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid #22cfff',
              color: '#22cfff',
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >×</button>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#ccddee', marginBottom: 20 }}>{infoPopup.desc}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {infoPopup.stats.map(([label, value], i) => (
            <div key={i} style={{
              background: 'rgba(34,207,255,0.1)',
              border: '1px solid rgba(34,207,255,0.3)',
              borderRadius: 10,
              padding: '10px 14px',
            }}>
              <div style={{ fontSize: 11, color: '#88aacc' }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#22cfff', marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 10,
          padding: 16,
        }}>
          <div style={{ fontSize: 12, color: '#88aacc', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Features</div>
          {infoPopup.features.map((f, i) => (
            <div key={i} style={{ fontSize: 13, color: '#aaddff', padding: '4px 0', lineHeight: 1.5 }}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   AI LOG PANEL
   ═══════════════════════════════════════════════════════════ */
function AILogPanel() {
  const aiLog = useS(s => s.aiLog)

  const typeColors = {
    info: '#22cfff',
    warning: '#ffcc22',
    success: '#2ecc71',
    phase: '#ff66dd',
    adaptive: '#ff9933',
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      right: 16,
      width: 340,
      maxHeight: 280,
      background: 'rgba(5, 15, 30, 0.92)',
      border: '1px solid rgba(34,207,255,0.4)',
      borderRadius: 12,
      padding: 12,
      zIndex: 500,
      fontFamily: 'monospace',
      fontSize: 11,
      color: '#ccddee',
      overflow: 'hidden',
      boxShadow: '0 0 20px rgba(34,207,255,0.2)',
    }}>
      <div style={{
        fontSize: 11,
        color: '#22cfff',
        fontWeight: 700,
        marginBottom: 8,
        letterSpacing: 1,
        textTransform: 'uppercase',
        borderBottom: '1px solid rgba(34,207,255,0.2)',
        paddingBottom: 6,
      }}>
        🧠 AI Traffic Controller — Live Log
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 220 }}>
        {aiLog.length === 0 && (
          <div style={{ color: '#556677', fontStyle: 'italic', padding: 8 }}>Initializing AI systems...</div>
        )}
        {aiLog.map((entry, i) => (
          <div key={i} style={{
            padding: '4px 6px',
            marginBottom: 3,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.03)',
            borderLeft: `3px solid ${typeColors[entry.type] || '#22cfff'}`,
            color: i === 0 ? '#fff' : '#8899aa',
            fontSize: i === 0 ? 11 : 10,
          }}>
            {entry.msg}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   CONTROL PANEL
   ═══════════════════════════════════════════════════════════ */
function ControlPanel() {
  const timeOfDay = useS(s => s.timeOfDay)
  const trafficDensity = useS(s => s.trafficDensity)
  const streetLightsOn = useS(s => s.streetLightsOn)

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 16,
      background: 'rgba(5, 15, 30, 0.92)',
      border: '1px solid rgba(34,207,255,0.4)',
      borderRadius: 12,
      padding: 14,
      zIndex: 500,
      fontFamily: 'system-ui, sans-serif',
      fontSize: 12,
      color: '#ccddee',
      minWidth: 200,
      boxShadow: '0 0 20px rgba(34,207,255,0.2)',
    }}>
      <div style={{
        fontSize: 12,
        color: '#22cfff',
        fontWeight: 700,
        marginBottom: 10,
        letterSpacing: 1,
        textTransform: 'uppercase',
        borderBottom: '1px solid rgba(34,207,255,0.2)',
        paddingBottom: 6,
      }}>
        ⚙️ City Controls
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: '#88aacc', marginBottom: 4 }}>TIME OF DAY</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['day', 'night'].map(t => (
            <button
              key={t}
              onClick={() => setS({ timeOfDay: t })}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 6,
                border: timeOfDay === t ? '1px solid #22cfff' : '1px solid rgba(255,255,255,0.1)',
                background: timeOfDay === t ? 'rgba(34,207,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: timeOfDay === t ? '#22cfff' : '#8899aa',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >{t === 'day' ? '☀️ Day' : '🌙 Night'}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: '#88aacc', marginBottom: 4 }}>TRAFFIC DENSITY</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['low', 'medium', 'high'].map(d => (
            <button
              key={d}
              onClick={() => setS({ trafficDensity: d })}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: 6,
                border: trafficDensity === d ? '1px solid #22cfff' : '1px solid rgba(255,255,255,0.1)',
                background: trafficDensity === d ? 'rgba(34,207,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: trafficDensity === d ? '#22cfff' : '#8899aa',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >{d}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: '#88aacc', marginBottom: 4 }}>STREET LIGHTS</div>
        <button
          onClick={() => setS({ streetLightsOn: !streetLightsOn })}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 6,
            border: streetLightsOn ? '1px solid #ffcc22' : '1px solid rgba(255,255,255,0.1)',
            background: streetLightsOn ? 'rgba(255,204,34,0.2)' : 'rgba(255,255,255,0.05)',
            color: streetLightsOn ? '#ffcc22' : '#8899aa',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
          }}
        >{streetLightsOn ? '💡 Lights ON' : '💡 Lights OFF'}</button>
      </div>

      <div style={{
        padding: 8,
        borderRadius: 6,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(34,207,255,0.2)',
      }}>
        <div style={{ fontSize: 10, color: '#88aacc', marginBottom: 4 }}>TRAFFIC PHASE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: TS.inYellow ? '#ffcc22' : TS.inAllRed ? '#ff2222' : '#22ff66',
            boxShadow: `0 0 8px ${TS.inYellow ? '#ffcc22' : TS.inAllRed ? '#ff2222' : '#22ff66'}`,
          }} />
          <span style={{ fontSize: 11, color: '#ccddee' }}>
            {TS.inYellow ? 'Yellow' : TS.inAllRed ? 'All-Red' : TS.phase === 0 ? 'NS Green' : 'EW Green'}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MENU SYSTEM
   ═══════════════════════════════════════════════════════════ */
function Menu() {
  const menuOpen = useS(s => s.menuOpen)
  const timeOfDay = useS(s => s.timeOfDay)
  const trafficDensity = useS(s => s.trafficDensity)
  const streetLightsOn = useS(s => s.streetLightsOn)

  const close = () => setS({ menuOpen: false })

  const gotoLocation = (key) => {
    const loc = LOCATIONS[key]
    if (!loc) return
    setS({
      focus: {
        x: loc.pos[0] + 40,
        y: loc.pos[1] + 35,
        z: loc.pos[2] + 40,
        lookAt: { x: loc.pos[0], y: loc.pos[1] + 8, z: loc.pos[2] },
      },
      infoPopup: { key, ...loc.info },
      menuOpen: false,
    })
    addLog(`🧭 Navigated to ${loc.label}`, 'info')
  }

  const resetView = () => {
    setS({
      focus: { x: 120, y: 100, z: 120, lookAt: { x: 0, y: 0, z: 0 } },
      infoPopup: null,
      menuOpen: false,
    })
    addLog('🎥 Camera reset to city overview', 'info')
  }

  const categories = {
    '🏛 Landmarks': ['tower', 'culture', 'event', 'scifi9', 'scifi10'],
    '🏥 Services': ['school', 'hospital', 'bank', 'gas', 'office'],
    '🌱 Eco Systems': ['farm', 'powerCo', 'power', 'filtration', 'food', 'waste'],
    '🚦 Traffic': ['traffic'],
  }

  return (
    <>
      <button
        onClick={() => setS({ menuOpen: !menuOpen })}
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 900,
          width: 44,
          height: 44,
          borderRadius: 10,
          background: menuOpen ? 'rgba(34,207,255,0.3)' : 'rgba(5,15,30,0.92)',
          border: '1px solid rgba(34,207,255,0.5)',
          color: '#22cfff',
          cursor: 'pointer',
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(34,207,255,0.25)',
          transition: 'all 0.2s ease',
        }}
        title="Menu"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && (
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 800,
          }}
        />
      )}

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 320,
        maxWidth: '85vw',
        background: 'linear-gradient(160deg, #071322 0%, #0f2038 100%)',
        borderRight: '1px solid rgba(34,207,255,0.35)',
        boxShadow: menuOpen ? '4px 0 40px rgba(34,207,255,0.25)' : 'none',
        zIndex: 850,
        transform: menuOpen ? 'translateX(0)' : 'translateX(-105%)',
        transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#ccddee',
        overflowY: 'auto',
      }}>
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(34,207,255,0.2)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#22cfff', letterSpacing: 2 }}>
            SMART CITY
          </div>
          <div style={{ fontSize: 10, color: '#88aacc', letterSpacing: 1, marginTop: 3 }}>
            NAVIGATION MENU
          </div>
        </div>

        <div style={{ flex: 1, padding: '16px 0' }}>

          <div style={{ padding: '0 16px 12px' }}>
            <div style={{
              fontSize: 10, color: '#88aacc', letterSpacing: 1,
              textTransform: 'uppercase', marginBottom: 8, fontWeight: 700,
            }}>Quick Actions</div>
            <button
              onClick={resetView}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(34,207,255,0.3)',
                background: 'rgba(34,207,255,0.08)',
                color: '#22cfff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                textAlign: 'left',
                marginBottom: 6,
              }}
            >🎥 Reset Camera View</button>
          </div>

          <div style={{ padding: '0 16px 12px' }}>
            <div style={{
              fontSize: 10, color: '#88aacc', letterSpacing: 1,
              textTransform: 'uppercase', marginBottom: 8, fontWeight: 700,
            }}>View Settings</div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {['day', 'night'].map(t => (
                <button
                  key={t}
                  onClick={() => { setS({ timeOfDay: t }); addLog(`🌓 Switched to ${t} mode`, 'info') }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    border: timeOfDay === t ? '1px solid #22cfff' : '1px solid rgba(255,255,255,0.1)',
                    background: timeOfDay === t ? 'rgba(34,207,255,0.2)' : 'rgba(255,255,255,0.04)',
                    color: timeOfDay === t ? '#22cfff' : '#8899aa',
                    cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  }}
                >{t === 'day' ? '☀️ Day' : '🌙 Night'}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {['low', 'medium', 'high'].map(d => (
                <button
                  key={d}
                  onClick={() => { setS({ trafficDensity: d }); addLog(`🚗 Traffic density: ${d}`, 'info') }}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: 6,
                    border: trafficDensity === d ? '1px solid #22cfff' : '1px solid rgba(255,255,255,0.1)',
                    background: trafficDensity === d ? 'rgba(34,207,255,0.2)' : 'rgba(255,255,255,0.04)',
                    color: trafficDensity === d ? '#22cfff' : '#8899aa',
                    cursor: 'pointer', fontSize: 10, fontWeight: 600, textTransform: 'capitalize',
                  }}
                >{d}</button>
              ))}
            </div>

            <button
              onClick={() => { setS({ streetLightsOn: !streetLightsOn }); addLog(`💡 Street lights ${!streetLightsOn ? 'ON' : 'OFF'}`, 'info') }}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: 6,
                border: streetLightsOn ? '1px solid #ffcc22' : '1px solid rgba(255,255,255,0.1)',
                background: streetLightsOn ? 'rgba(255,204,34,0.18)' : 'rgba(255,255,255,0.04)',
                color: streetLightsOn ? '#ffcc22' : '#8899aa',
                cursor: 'pointer', fontSize: 11, fontWeight: 600,
              }}
            >{streetLightsOn ? '💡 Street Lights: ON' : '💡 Street Lights: OFF'}</button>
          </div>

          {Object.entries(categories).map(([cat, keys]) => (
            <div key={cat} style={{ padding: '0 16px 12px' }}>
              <div style={{
                fontSize: 10, color: '#88aacc', letterSpacing: 1,
                textTransform: 'uppercase', marginBottom: 8, fontWeight: 700,
              }}>{cat}</div>
              {keys.map(key => {
                const loc = LOCATIONS[key]
                if (!loc) return null
                return (
                  <button
                    key={key}
                    onClick={() => gotoLocation(key)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      marginBottom: 4,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#ccddee',
                      cursor: 'pointer',
                      fontSize: 12,
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(34,207,255,0.15)'
                      e.currentTarget.style.borderColor = 'rgba(34,207,255,0.5)'
                      e.currentTarget.style.color = '#22cfff'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.color = '#ccddee'
                    }}
                  >
                    <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{loc.icon}</span>
                    <span style={{ flex: 1, fontWeight: 500 }}>{loc.label}</span>
                    <span style={{ fontSize: 10, color: '#556677' }}>➜</span>
                  </button>
                )
              })}
            </div>
          ))}

        </div>

        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(34,207,255,0.15)',
          fontSize: 10,
          color: '#556677',
          flexShrink: 0,
        }}>
          Smart City · AI Urban Simulation · v1.0
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   CITY BUILDINGS
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

      <PowerSupplyZone />
      <FoodProduction />
      <WasteManagement />
      <FiltrationSystem />

      <House pos={[-50, 0, -50]} h={6} color="#c9a66b" name="Smart Home A" turbine />
      <House pos={[50, 0, -50]} h={7} color="#b08d5a" name="Smart Home B" />
      <House pos={[-50, 0, 50]} h={6} color="#d4b07a" name="Smart Home C" turbine />
      <House pos={[50, 0, 50]} h={8} color="#a67c52" name="Smart Home D" />
      <House pos={[-30, 0, 0]} h={5} color="#c9a66b" name="Smart Home E" />
      <House pos={[30, 0, 0]} h={6} color="#b08d5a" name="Smart Home F" turbine />

      <Park pos={[-70, 0, 0]} size={24} />
      <Park pos={[70, 0, 0]} size={24} />
      <Park pos={[0, 0, 70]} size={28} />
      <Park pos={[0, 0, -70]} size={28} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   CAMERA CONTROLLER
   ═══════════════════════════════════════════════════════════ */
function CameraController() {
  const { camera } = useThree()
  const focus = useS(s => s.focus)
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(() => {
    if (focus) {
      const target = new THREE.Vector3(focus.x, focus.y, focus.z)
      const lookAt = new THREE.Vector3(focus.lookAt.x, focus.lookAt.y, focus.lookAt.z)
      camera.position.lerp(target, 0.05)
      lookAtRef.current.lerp(lookAt, 0.05)
      camera.lookAt(lookAtRef.current)
    }
  })

  return null
}

/* ═══════════════════════════════════════════════════════════
   GROUND
   ═══════════════════════════════════════════════════════════ */
function Ground() {
  const timeOfDay = useS(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial
        color={isNight ? '#1a2a1a' : '#4a6a3a'}
        roughness={0.95}
      />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════════════
   SKY & LIGHTING
   ═══════════════════════════════════════════════════════════ */
function SkyAndLights() {
  const timeOfDay = useS(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={isNight ? [0, -1, 0] : [100, 50, 100]}
        inclination={isNight ? 0.9 : 0.5}
        azimuth={0.25}
      />
      <ambientLight intensity={isNight ? 0.15 : 0.5} color={isNight ? '#223344' : '#ffffff'} />
      <directionalLight
        position={isNight ? [-50, -50, -50] : [100, 80, 60]}
        intensity={isNight ? 0.1 : 1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <hemisphereLight
        args={[isNight ? '#1a2a3a' : '#87CEEB', isNight ? '#0a0a0a' : '#3a5a3a', isNight ? 0.2 : 0.6]}
      />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN SCENE
   ═══════════════════════════════════════════════════════════ */
function Scene() {
  return (
    <>
      <SkyAndLights />
      <CameraController />
      <Ground />
      <Roads />
      <CityBuildings />
      <StreetLightSystem />
      <TrafficLights />
      <AITrafficSystem />
      <TrafficSystem />
      <PeopleSystem />
      <TreesSystem />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.4}
        scale={400}
        blur={2}
        far={20}
      />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════ */
export default function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    addLog('🧠 AI Traffic Controller initialized', 'success')
    addLog('📡 24 sensors online — all systems operational', 'info')
    addLog('🚦 Adaptive signal timing active', 'phase')

    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#22cfff',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          width: 60,
          height: 60,
          border: '4px solid rgba(34,207,255,0.2)',
          borderTop: '4px solid #22cfff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 20,
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>SMART CITY</div>
        <div style={{ fontSize: 12, color: '#88aacc', marginTop: 8 }}>Initializing AI systems...</div>
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [120, 100, 120], fov: 50, near: 0.1, far: 1000 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onPointerMissed={() => setS({ focus: null, infoPopup: null })}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={20}
          maxDistance={400}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, 0]}
        />
      </Canvas>

      <Menu />
      <ControlPanel />
      <AILogPanel />
      <InfoPopup />

      <div style={{
        position: 'fixed',
        top: 16,
        left: 72,
        zIndex: 500,
        fontFamily: 'system-ui, sans-serif',
        color: '#fff',
        textShadow: '0 0 20px rgba(34,207,255,0.5)',
        pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, color: '#22cfff' }}>SMART CITY</div>
        <div style={{ fontSize: 11, color: '#88aacc', letterSpacing: 1, marginTop: 2 }}>AI-POWERED URBAN SIMULATION</div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 500,
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        color: '#556677',
        background: 'rgba(5,15,30,0.7)',
        padding: '6px 12px',
        borderRadius: 8,
        border: '1px solid rgba(34,207,255,0.2)',
      }}>
        🖱️ Drag to orbit · Scroll to zoom · Click buildings for info
      </div>
    </div>
  )
}
