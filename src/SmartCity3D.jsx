import React, { useState, useEffect, useRef, Suspense, forwardRef, useImperativeHandle } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, useGLTF, ContactShadows, Sky, Text, Sparkles, useTexture } from '@react-three/drei'
import * as THREE from 'three'

/* ═══════════════════════════════════════════════════════════
   GLOBAL STATE
   ═══════════════════════════════════════════════════════════ */
const state = {
  timeOfDay: 'day',
  trafficDensity: 'medium',
  streetLightsOn: false,
  emergencyAlarm: false,
  focus: null,
  alert: null,
}
const subscribers = new Set()
const setState = (update) => {
  Object.assign(state, update)
  subscribers.forEach(cb => cb({ ...state }))
}
const useStore = (selector) => {
  const [snap, setSnap] = useState({ ...state })
  useEffect(() => {
    const cb = (s) => setSnap(s)
    subscribers.add(cb)
    return () => subscribers.delete(cb)
  }, [])
  return selector ? selector(snap) : snap
}

/* ═══════════════════════════════════════════════════════════
   BUILDING BORDER — glowing edges around any GLB
   ═══════════════════════════════════════════════════════════ */
function BuildingBorder({ width = 4, depth = 4, height = 8, color = "#22cfff", position = [0, 0, 0] }) {
  const timeOfDay = useStore(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const glow = isNight ? 6 : 3
  const halfW = width / 2
  const halfD = depth / 2

  return (
    <group position={position}>
      {/* 4 base border lines */}
      <mesh position={[0, 0.15, halfD + 0.1]}>
        <boxGeometry args={[width + 0.4, 0.15, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} />
      </mesh>
      <mesh position={[0, 0.15, -halfD - 0.1]}>
        <boxGeometry args={[width + 0.4, 0.15, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} />
      </mesh>
      <mesh position={[-halfW - 0.1, 0.15, 0]}>
        <boxGeometry args={[0.1, 0.15, depth + 0.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} />
      </mesh>
      <mesh position={[halfW + 0.1, 0.15, 0]}>
        <boxGeometry args={[0.1, 0.15, depth + 0.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} />
      </mesh>

      {/* Corner posts with glowing caps */}
      {[
        [-halfW - 0.1, halfD + 0.1], [halfW + 0.1, halfD + 0.1],
        [-halfW - 0.1, -halfD - 0.1], [halfW + 0.1, -halfD - 0.1]
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} />
          </mesh>
          <mesh position={[0, 2.15, 0]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={isNight ? 8 : 5} />
          </mesh>
          {isNight && <pointLight position={[0, 2.3, 0]} color={color} intensity={0.5} distance={5} />}
        </group>
      ))}

      {/* Top border */}
      <mesh position={[0, height + 0.3, 0]}>
        <boxGeometry args={[width + 0.4, 0.08, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow * 0.6} />
      </mesh>
      <mesh position={[0, height + 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[width + 0.4, 0.08, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow * 0.6} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   BOARD — sign above building
   ═══════════════════════════════════════════════════════════ */
function Board({ text, position = [0, 0, 0], color = "#22cfff", width = 6, height = 1.2 }) {
  const canvasRef = useRef()
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1024, 256)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 8
    ctx.strokeRect(10, 10, 1004, 236)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 72px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 512, 128)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    setTexture(tex)
  }, [text, color])

  if (!texture) return null

  return (
    <group position={position}>
      {/* Board backing */}
      <mesh>
        <boxGeometry args={[width, height, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* Text plane */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[width - 0.2, height - 0.2]} />
        <meshBasicMaterial map={texture} transparent />
      </mesh>
      {/* Support poles */}
      <mesh position={[-width / 2 + 0.3, -height / 2 - 1.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 3, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[width / 2 - 0.3, -height / 2 - 1.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 3, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   GLB BUILDING — load any GLTF/GLB with auto-scale + border + board
   ═══════════════════════════════════════════════════════════ */
function GLBBuilding({ 
  url, 
  size = 300, 
  position = [0, 0, 0], 
  name = "Building", 
  borderColor = "#22cfff",
  boardColor = "#22cfff",
  yOffset = 0
}) {
  const setFocus = useStore(s => s.setFocus)
  const groupRef = useRef()
  const [model, setModel] = useState(null)
  const [error, setError] = useState(false)
  const [dimensions, setDimensions] = useState({ w: 3, d: 3, h: 8 })

  useEffect(() => {
    const loader = new THREE.GLTFLoader ? new THREE.GLTFLoader() : null
    // Use drei's useGLTF loading pattern
    import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      const gltfLoader = new GLTFLoader()
      gltfLoader.load(
        url,
        (gltf) => {
          const scene = gltf.scene
          // Compute bounding box
          const box = new THREE.Box3().setFromObject(scene)
          const sizeVec = new THREE.Vector3()
          box.getSize(sizeVec)
          const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z)
          const scale = size / Math.max(maxDim, 0.001)
          scene.scale.setScalar(scale)

          // Recompute box after scaling, center and bottom-align
          const box2 = new THREE.Box3().setFromObject(scene)
          const center = new THREE.Vector3()
          box2.getCenter(center)
          scene.position.x -= center.x
          scene.position.z -= center.z
          scene.position.y -= box2.min.y

          // Compute actual dimensions
          const finalSize = new THREE.Vector3()
          box2.getSize(finalSize)
          setDimensions({ w: finalSize.x * scale, d: finalSize.z * scale, h: finalSize.y * scale })

          setModel(scene)
        },
        undefined,
        (err) => {
          console.warn('GLB load failed:', url, err)
          setError(true)
        }
      )
    })
  }, [url, size])

  const handleClick = () => {
    setFocus({
      x: position[0] + 15,
      y: position[1] + 10,
      z: position[2] + 15,
      lookAt: { x: position[0], y: position[1], z: position[2] }
    })
  }

  if (error) {
    // Fallback if GLB missing
    return (
      <group position={position}>
        <mesh onClick={handleClick} castShadow>
          <boxGeometry args={[size / 100, size / 100 * 2, size / 100]} />
          <meshStandardMaterial color={borderColor} />
        </mesh>
        <BuildingBorder width={size / 100} depth={size / 100} height={size / 50} color={borderColor} />
        <Board text={name} position={[0, size / 50 + 2, 0]} color={boardColor} />
      </group>
    )
  }

  if (!model) return null

  return (
    <group ref={groupRef} position={[position[0], position[1] + yOffset, position[2]]}>
      <primitive object={model} onClick={handleClick} castShadow receiveShadow />
      <BuildingBorder 
        width={Math.max(dimensions.w, 3)} 
        depth={Math.max(dimensions.d, 3)} 
        height={dimensions.h} 
        color={borderColor} 
      />
      <Board 
        text={name} 
        position={[0, dimensions.h + 3, 0]} 
        color={boardColor} 
      />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   STREET LIGHT
   ═══════════════════════════════════════════════════════════ */
function StreetLight({ position = [0, 0, 0] }) {
  const timeOfDay = useStore(s => s.timeOfDay)
  const streetLightsOn = useStore(s => s.streetLightsOn)
  const isOn = streetLightsOn || timeOfDay === 'night'

  return (
    <group position={position}>
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 6, 8]} />
        <meshStandardMaterial color="#666" />
      </mesh>
      <mesh position={[0, 6, 0.5]} castShadow>
        <boxGeometry args={[0.4, 0.2, 0.6]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[0, 6, 0.8]} castShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial 
          color={isOn ? "#ffffcc" : "#666"} 
          emissive={isOn ? "#ffff99" : "#000"} 
          emissiveIntensity={isOn ? 1 : 0} 
        />
      </mesh>
      {isOn && <pointLight position={[0, 6, 0.8]} intensity={0.8} distance={15} color="#ffffcc" />}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   STREET LIGHT SYSTEM
   ═══════════════════════════════════════════════════════════ */
function StreetLightSystem() {
  const positions = []
  // Along main roads
  for (let x = -45; x <= 45; x += 10) {
    positions.push([x, 0, 0])
    positions.push([x, 0, 25])
    positions.push([x, 0, -25])
  }
  for (let z = -45; z <= 45; z += 10) {
    positions.push([0, 0, z])
    positions.push([25, 0, z])
    positions.push([-25, 0, z])
  }
  return (
    <group>
      {positions.map((pos, i) => <StreetLight key={i} position={pos} />)}
    </group>
  )
}
/* ═══════════════════════════════════════════════════════════
   ROAD SYSTEM — proper markings + glow edges
   ═══════════════════════════════════════════════════════════ */
function RoadSystem() {
  const ROAD_W = 6
  const ROAD_LEN = 100
  const roadZs = [-25, 0, 25]
  const roadXs = [-25, 0, 25]

  const roadMat = <meshStandardMaterial color="#2a2a2a" roughness={0.9} metalness={0.1} />
  const yellowMat = <meshStandardMaterial color="#f5c84b" emissive="#f5c84b" emissiveIntensity={0.4} />
  const whiteMat = <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />

  return (
    <group>
      {/* East-West Roads */}
      {roadZs.map((z, i) => (
        <group key={`e${i}`}>
          <mesh position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[ROAD_LEN, ROAD_W]} />
            {roadMat}
          </mesh>
          {/* Yellow center lines */}
          <mesh position={[0, 0.025, z - 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[ROAD_LEN, 0.15]} />
            {yellowMat}
          </mesh>
          <mesh position={[0, 0.025, z + 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[ROAD_LEN, 0.15]} />
            {yellowMat}
          </mesh>
          {/* White dashed side lines */}
          {Array.from({ length: 40 }).map((_, k) => (
            <mesh key={k} position={[-45 + k * 2.3, 0.03, z - ROAD_W / 2 + 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.2, 0.12]} />
              {whiteMat}
            </mesh>
          ))}
          {Array.from({ length: 40 }).map((_, k) => (
            <mesh key={`b${k}`} position={[-45 + k * 2.3, 0.03, z + ROAD_W / 2 - 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.2, 0.12]} />
              {whiteMat}
            </mesh>
          ))}
        </group>
      ))}

      {/* North-South Roads */}
      {roadXs.map((x, i) => (
        <group key={`n${i}`}>
          <mesh position={[x, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[ROAD_W, ROAD_LEN]} />
            {roadMat}
          </mesh>
          <mesh position={[x - 0.4, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, ROAD_LEN]} />
            {yellowMat}
          </mesh>
          <mesh position={[x + 0.4, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, ROAD_LEN]} />
            {yellowMat}
          </mesh>
          {Array.from({ length: 40 }).map((_, k) => (
            <mesh key={k} position={[x - ROAD_W / 2 + 0.3, 0.03, -45 + k * 2.3]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.12, 1.2]} />
              {whiteMat}
            </mesh>
          ))}
          {Array.from({ length: 40 }).map((_, k) => (
            <mesh key={`r${k}`} position={[x + ROAD_W / 2 - 0.3, 0.03, -45 + k * 2.3]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.12, 1.2]} />
              {whiteMat}
            </mesh>
          ))}
        </group>
      ))}

      {/* Crosswalks at intersections */}
      {[
        [0, 0], [0, 25], [0, -25], [25, 0], [-25, 0],
        [25, 25], [25, -25], [-25, 25], [-25, -25]
      ].map(([x, z], idx) => (
        <group key={idx} position={[x, 0.03, z]}>
          {Array.from({ length: 8 }).map((_, k) => (
            <mesh key={k} position={[k * 0.6 - 2.1, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.4, 1.5]} />
              {whiteMat}
            </mesh>
          ))}
        </group>
      ))}

      {/* Sidewalks */}
      {roadZs.map((z, i) => (
        <group key={`sw${i}`}>
          <mesh position={[0, 0.15, z - ROAD_W / 2 - 1]} receiveShadow>
            <boxGeometry args={[ROAD_LEN, 0.3, 2]} />
            <meshStandardMaterial color="#8a8f94" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.15, z + ROAD_W / 2 + 1]} receiveShadow>
            <boxGeometry args={[ROAD_LEN, 0.3, 2]} />
            <meshStandardMaterial color="#8a8f94" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Road glow edges (cyan) */}
      {roadZs.map((z, i) => (
        <group key={`glow${i}`}>
          <mesh position={[0, 0.05, z - ROAD_W / 2 - 2.1]}>
            <boxGeometry args={[ROAD_LEN, 0.08, 0.1]} />
            <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0, 0.05, z + ROAD_W / 2 + 2.1]}>
            <boxGeometry args={[ROAD_LEN, 0.08, 0.1]} />
            <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   AI TRAFFIC CONTROLLER TOWER
   ═══════════════════════════════════════════════════════════ */
function AITrafficTower() {
  const setFocus = useStore(s => s.setFocus)
  const timeOfDay = useStore(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const ringRef = useRef()
  const ring2Ref = useRef()
  const radarRef = useRef()
  const sigRef = useRef()

  useFrame((_, dt) => {
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.5
    if (ring2Ref.current) ring2Ref.current.rotation.z -= dt * 0.4
    if (radarRef.current) radarRef.current.rotation.z += dt * 1.7
    if (sigRef.current) {
      const s = 1 + Math.sin(Date.now() * 0.004) * 0.2
      sigRef.current.scale.setScalar(s)
    }
  })

  return (
    <group 
      position={[0, 0, 0]} 
      onClick={() => setFocus({ x: 10, y: 10, z: 10, lookAt: { x: 0, y: 0, z: 0 } })}
    >
      {/* Base */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[4, 4.5, 1, 32]} />
        <meshStandardMaterial color="#142f3b" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Rotating rings */}
      <mesh ref={ringRef} position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.8, 0.12, 10, 48]} />
        <meshStandardMaterial color="#32dfff" emissive="#18cfff" emissiveIntensity={3} />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3, 0.1, 10, 48]} />
        <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2.5} />
      </mesh>

      {/* Corner beacons */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 3.5, 1.5, Math.sin(angle) * 3.5]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={isNight ? 6 : 4} />
          </mesh>
        )
      })}

      {/* Tower body */}
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.5, 5, 10]} />
        <meshStandardMaterial color="#185a72" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Upper observatory */}
      <mesh position={[0, 7, 0]} castShadow>
        <cylinderGeometry args={[1.6, 1.4, 1.2, 12]} />
        <meshStandardMaterial color="#0a3345" emissive="#1a7a9a" emissiveIntensity={2} />
      </mesh>

      {/* Glowing windows */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2
        return (
          <mesh 
            key={i} 
            position={[Math.cos(angle) * 1.5, 7, Math.sin(angle) * 1.5]} 
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.5, 0.7, 0.06]} />
            <meshStandardMaterial color="#03141b" emissive="#21cfff" emissiveIntensity={isNight ? 5 : 3} />
          </mesh>
        )
      })}

      {/* Radar dish */}
      <mesh ref={radarRef} position={[0, 8.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.08, 10, 32]} />
        <meshStandardMaterial color="#61e7ff" emissive="#23dfff" emissiveIntensity={3} />
      </mesh>

      {/* Signal sphere */}
      <mesh ref={sigRef} position={[0, 9.5, 0]}>
        <sphereGeometry args={[0.4, 20, 20]} />
        <meshStandardMaterial color="#66e5ff" emissive="#33dfff" emissiveIntensity={5} />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 11, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 3.5, 6]} />
        <meshStandardMaterial color="#99a0a6" metalness={0.6} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   TRAFFIC LIGHTS — 4 poles with blinking
   ═══════════════════════════════════════════════════════════ */
const trafficSystemState = {
  phase: 0,      // 0 = NS green, 1 = EW green
  inYellow: false,
  inAllRed: false,
  phaseTime: 0,
}
const trafficSystemListeners = new Set()
const emitTrafficUpdate = () => {
  trafficSystemListeners.forEach(cb => cb({ ...trafficSystemState }))
}

function AITrafficSystem() {
  const elapsedRef = useRef(0)
  const PHASE_DURATION = 8
  const YELLOW = 2.5
  const ALL_RED = 0.8
  const [tick, setTick] = useState(0)

  useFrame((_, dt) => {
    elapsedRef.current += dt
    const e = elapsedRef.current

    if (trafficSystemState.inAllRed) {
      if (e >= ALL_RED) {
        trafficSystemState.inAllRed = false
        trafficSystemState.phase = trafficSystemState.phase === 0 ? 1 : 0
        elapsedRef.current = 0
        emitTrafficUpdate()
      }
    } else if (trafficSystemState.inYellow) {
      if (e >= YELLOW) {
        trafficSystemState.inYellow = false
        trafficSystemState.inAllRed = true
        elapsedRef.current = 0
        emitTrafficUpdate()
      }
    } else if (e >= PHASE_DURATION) {
      trafficSystemState.inYellow = true
      elapsedRef.current = 0
      emitTrafficUpdate()
    }
  })

  // Force re-render for UI
  useEffect(() => {
    const cb = () => setTick(t => t + 1)
    trafficSystemListeners.add(cb)
    return () => trafficSystemListeners.delete(cb)
  }, [])

  return null
}

function TrafficLightPole({ position, roadId }) {
  const timeOfDay = useStore(s => s.timeOfDay)
  const redRef = useRef()
  const yellowRef = useRef()
  const greenRef = useRef()
  const isNight = timeOfDay === 'night'

  useFrame(() => {
    const s = trafficSystemState
    const nsGreen = s.phase === 0 && !s.inYellow && !s.inAllRed
    const ewGreen = s.phase === 1 && !s.inYellow && !s.inAllRed
    const yellow = s.inYellow

    let isGreen = false
    if (roadId === 1 || roadId === 2) isGreen = nsGreen
    if (roadId === 3 || roadId === 4) isGreen = ewGreen

    const isRed = !isGreen && !yellow

    if (redRef.current) redRef.current.material.emissiveIntensity = isRed ? (Math.floor(Date.now() / 500) % 2 ? 6 : 3) : 0
    if (yellowRef.current) yellowRef.current.material.emissiveIntensity = yellow ? 8 : 0
    if (greenRef.current) greenRef.current.material.emissiveIntensity = isGreen ? 6 + Math.sin(Date.now() * 0.003) * 1.5 : 0
  })

  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 6, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Arm */}
      <mesh position={[0.8, 5.5, 0]} castShadow>
        <boxGeometry args={[1.6, 0.12, 0.12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Light box */}
      <mesh position={[1.6, 5.5, 0]} castShadow>
        <boxGeometry args={[0.5, 1.4, 0.5]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      {/* Red */}
      <mesh ref={redRef} position={[1.6, 5.9, 0.3]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff2222" emissiveIntensity={0} />
      </mesh>
      {/* Yellow */}
      <mesh ref={yellowRef} position={[1.6, 5.5, 0.3]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#ffcc22" emissive="#ffcc22" emissiveIntensity={0} />
      </mesh>
      {/* Green */}
      <mesh ref={greenRef} position={[1.6, 5.1, 0.3]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#22ff66" emissive="#22ff66" emissiveIntensity={0} />
      </mesh>
    </group>
  )
}

function TrafficLights() {
  return (
    <group>
      <TrafficLightPole position={[-4, 0, -4]} roadId={1} />
      <TrafficLightPole position={[4, 0, 4]} roadId={2} />
      <TrafficLightPole position={[4, 0, -4]} roadId={3} />
      <TrafficLightPole position={[-4, 0, 4]} roadId={4} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   CAR — on road, correct direction, headlights at night
   ═══════════════════════════════════════════════════════════ */
function Car({ lane, startPos }) {
  const carRef = useRef()
  const [pos, setPos] = useState(startPos)
  const timeOfDay = useStore(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const colorRef = useRef(null)
  if (!colorRef.current) {
    const colors = ["#287ca3", "#c83f49", "#e1a72e", "#5b72c9", "#2f9d65", "#d8d8d8", "#d97b2a", "#8b3ad9", "#16a085", "#8e44ad"]
    colorRef.current = colors[Math.floor(Math.random() * colors.length)]
  }

  const speed = useRef(8 + Math.random() * 4)

  useFrame((_, dt) => {
    if (!carRef.current) return
    // Check traffic light
    const s = trafficSystemState
    const nsGreen = s.phase === 0 && !s.inYellow && !s.inAllRed
    const ewGreen = s.phase === 1 && !s.inYellow && !s.inAllRed
    const yellow = s.inYellow
    const stopLine = 15

    let shouldStop = false
    const roadId = lane.road
    const isNs = roadId === 1 || roadId === 2
    const isEw = roadId === 3 || roadId === 4
    
    // If approaching intersection and light is not green for this road
    let distToStop = 0
    if (lane.axis === 'z') {
      distToStop = Math.abs(pos - (lane.dir > 0 ? -stopLine : stopLine))
    } else {
      distToStop = Math.abs(pos - (lane.dir > 0 ? -stopLine : stopLine))
    }

    if (distToStop < 15) {
      if (isNs && !nsGreen && !yellow) shouldStop = true
      if (isEw && !ewGreen && !yellow) shouldStop = true
    }

    let currentSpeed = shouldStop && distToStop < 8 ? 0 : speed.current
    if (shouldStop && distToStop < 15) currentSpeed = Math.max(0, currentSpeed * (distToStop / 15))

    const newPos = pos + currentSpeed * lane.dir * dt
    let wrapped = newPos
    if (lane.dir > 0 && newPos > lane.end) wrapped = lane.start
    if (lane.dir < 0 && newPos < lane.end) wrapped = lane.start
    setPos(wrapped)

    if (lane.axis === 'z') {
      carRef.current.position.set(lane.fixed, 0.35, wrapped)
      carRef.current.rotation.y = lane.dir > 0 ? -Math.PI / 2 : Math.PI / 2
    } else {
      carRef.current.position.set(wrapped, 0.35, lane.fixed)
      carRef.current.rotation.y = lane.dir > 0 ? 0 : Math.PI
    }
  })

  return (
    <group ref={carRef}>
      {/* Body */}
      <mesh castShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[2.8, 0.6, 1.2]} />
        <meshStandardMaterial color={colorRef.current} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Cabin */}
      <mesh castShadow position={[-0.1, 0.55, 0]}>
        <boxGeometry args={[1.3, 0.5, 0.85]} />
        <meshStandardMaterial color="#1a3a4a" emissive="#0a2535" emissiveIntensity={0.8} metalness={0.5} roughness={0.2} />
      </mesh>
      {/* Roof */}
      <mesh position={[-0.1, 0.82, 0]}>
        <boxGeometry args={[1.1, 0.06, 0.7]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {/* Wheels */}
      {[[-0.9, 0.65], [-0.9, -0.65], [0.9, 0.65], [0.9, -0.65]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.15, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 8]} />
          <meshStandardMaterial color="#0c1012" />
        </mesh>
      ))}
      {/* Headlights */}
      <mesh position={[1.4, 0.35, 0.35]}>
        <boxGeometry args={[0.05, 0.15, 0.2]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff8e0" emissiveIntensity={isNight ? 5 : 2} />
      </mesh>
      <mesh position={[1.4, 0.35, -0.35]}>
        <boxGeometry args={[0.05, 0.15, 0.2]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff8e0" emissiveIntensity={isNight ? 5 : 2} />
      </mesh>
      {/* Tail lights */}
      <mesh position={[-1.4, 0.35, 0.35]}>
        <boxGeometry args={[0.05, 0.15, 0.2]} />
        <meshStandardMaterial color="#ff1e1e" emissive="#ff1010" emissiveIntensity={3} />
      </mesh>
      <mesh position={[-1.4, 0.35, -0.35]}>
        <boxGeometry args={[0.05, 0.15, 0.2]} />
        <meshStandardMaterial color="#ff1e1e" emissive="#ff1010" emissiveIntensity={3} />
      </mesh>
      {/* Headlight glow at night */}
      {isNight && (
        <pointLight position={[3, 0.4, 0]} intensity={1} distance={15} color="#ffffcc" />
      )}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   TRAFFIC SYSTEM — spawn cars on 8 lanes
   ═══════════════════════════════════════════════════════════ */
function TrafficSystem() {
  const trafficDensity = useStore(s => s.trafficDensity)
  const carsPerLane = trafficDensity === 'low' ? 3 : trafficDensity === 'medium' ? 5 : 8

  const LANES = [
    // North-bound (+Z), left side of road
    { id: 'N1', axis: 'z', dir: 1, fixed: -1.5, road: 1, start: -45, end: 45 },
    { id: 'N2', axis: 'z', dir: 1, fixed: -4, road: 1, start: -45, end: 45 },
    // South-bound (-Z), right side
    { id: 'S1', axis: 'z', dir: -1, fixed: 1.5, road: 2, start: 45, end: -45 },
    { id: 'S2', axis: 'z', dir: -1, fixed: 4, road: 2, start: 45, end: -45 },
    // East-bound (+X), bottom side
    { id: 'E1', axis: 'x', dir: 1, fixed: 1.5, road: 3, start: -45, end: 45 },
    { id: 'E2', axis: 'x', dir: 1, fixed: 4, road: 3, start: -45, end: 45 },
    // West-bound (-X), top side
    { id: 'W1', axis: 'x', dir: -1, fixed: -1.5, road: 4, start: 45, end: -45 },
    { id: 'W2', axis: 'x', dir: -1, fixed: -4, road: 4, start: 45, end: -45 },
  ]

  return (
    <group>
      {LANES.map(lane => (
        Array.from({ length: carsPerLane }).map((_, i) => {
          const gap = Math.abs(lane.end - lane.start) / carsPerLane
          const startPos = lane.dir > 0 ? lane.start + gap * i + Math.random() * 5 : lane.start - gap * i - Math.random() * 5
          return <Car key={`${lane.id}-${i}`} lane={lane} startPos={startPos} />
        })
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   PEOPLE — walking pedestrians
   ═══════════════════════════════════════════════════════════ */
function Person({ cx = 0, cz = 0, radius = 8, speed = 0.5 }) {
  const ref = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2)
  const dirRef = useRef(Math.random() > 0.5 ? 1 : -1)
  const skinRef = useRef(null)
  const shirtRef = useRef(null)
  if (!skinRef.current) {
    const skins = ["#f2c9a0", "#d9a373", "#a06a3c", "#6b4a2f", "#ffd8b8"]
    const shirts = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#1abc9c"]
    skinRef.current = skins[Math.floor(Math.random() * skins.length)]
    shirtRef.current = shirts[Math.floor(Math.random() * shirts.length)]
  }

  useFrame((_, dt) => {
    if (!ref.current) return
    angleRef.current += speed * 0.02 * dirRef.current
    const x = cx + Math.cos(angleRef.current) * radius
    const z = cz + Math.sin(angleRef.current) * radius
    ref.current.position.set(x, 0, z)
    ref.current.rotation.y = angleRef.current + (dirRef.current > 0 ? Math.PI / 2 : -Math.PI / 2)
  })

  return (
    <group ref={ref}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.7, 8]} />
        <meshStandardMaterial color={shirtRef.current} />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color={skinRef.current} />
      </mesh>
      <mesh position={[-0.08, 0.35, 0]} castShadow>
        <boxGeometry args={[0.08, 0.4, 0.08]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      <mesh position={[0.08, 0.35, 0]} castShadow>
        <boxGeometry args={[0.08, 0.4, 0.08]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </group>
  )
}

function PeopleSystem() {
  return (
    <group>
      <Person cx={-10} cz={-10} radius={5} />
      <Person cx={10} cz={-10} radius={5} />
      <Person cx={-10} cz={10} radius={5} />
      <Person cx={10} cz={10} radius={5} />
      <Person cx={0} cz={20} radius={4} />
      <Person cx={20} cz={0} radius={4} />
      <Person cx={-20} cz={0} radius={4} />
      <Person cx={0} cz={-20} radius={4} />
      <Person cx={30} cz={30} radius={6} />
      <Person cx={-30} cz={-30} radius={6} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   TREES
   ═══════════════════════════════════════════════════════════ */
function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 6]} />
        <meshStandardMaterial color="#5a3d24" />
      </mesh>
      <mesh position={[0, 3, 0]} castShadow>
        <coneGeometry args={[1.5, 3, 7]} />
        <meshStandardMaterial color="#2d6e3d" />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[1, 2, 7]} />
        <meshStandardMaterial color="#3a8a4c" />
      </mesh>
    </group>
  )
}

function TreesSystem() {
  const positions = []
  // Random trees avoiding roads and center
  for (let i = 0; i < 60; i++) {
    const x = (Math.random() - 0.5) * 90
    const z = (Math.random() - 0.5) * 90
    // Skip roads
    if (Math.abs(x) < 6 || Math.abs(z) < 6) continue
    if (Math.abs(x - 25) < 6 || Math.abs(z - 25) < 6) continue
    if (Math.abs(x + 25) < 6 || Math.abs(z + 25) < 6) continue
    // Skip center
    if (Math.sqrt(x * x + z * z) < 8) continue
    positions.push([x, 0, z])
  }
  return (
    <group>
      {positions.map((pos, i) => (
        <Tree key={i} position={pos} scale={0.8 + Math.random() * 0.5} />
      ))}
    </group>
  )
}
/* ═══════════════════════════════════════════════════════════
   POWER ZONE — turbines + solar + batteries
   ═══════════════════════════════════════════════════════════ */
function WindTurbine({ position, scale = 1 }) {
  const bladesRef = useRef()
  useFrame(() => {
    if (bladesRef.current) bladesRef.current.rotation.z += 0.05
  })
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 8, 6]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.3} />
      </mesh>
      <group ref={bladesRef} position={[0, 8, 0]}>
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

function SolarPanelUnit({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[3, 0.1, 2]} />
        <meshStandardMaterial color="#082c4b" emissive="#063b62" emissiveIntensity={1} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[3.2, 0.15, 2.2]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </group>
  )
}

function PowerZone({ position = [-40, 0, 30] }) {
  const setFocus = useStore(s => s.setFocus)
  const timeOfDay = useStore(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'

  return (
    <group position={position}>
      {/* Ground pad */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 25]} />
        <meshStandardMaterial color="#1d3a2e" roughness={0.95} />
      </mesh>

      {/* Border */}
      <BuildingBorder width={30} depth={25} height={0.2} color="#ffcc22" />

      {/* Wind turbines grid */}
      {[0, 1, 2].map(row =>
        [0, 1, 2].map(col => (
          <WindTurbine 
            key={`${row}-${col}`}
            position={[-10 + col * 10, 0, -8 + row * 8]} 
            scale={1 + (row % 2) * 0.1}
          />
        ))
      )}

      {/* Solar panels */}
      <group position={[0, 0, 10]}>
        {[-8, -4, 0, 4, 8].map((x, i) => (
          <SolarPanelUnit key={i} position={[x, 0, 0]} rotation={[0, 0, 0]} />
        ))}
      </group>

      {/* Battery banks */}
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <group key={i} position={[x, 0, -12]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[2, 3, 2]} />
            <meshStandardMaterial color="#2a5a4a" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <torusGeometry args={[1.4, 0.06, 6, 16]} />
            <meshStandardMaterial color="#22ff9d" emissive="#22ff9d" emissiveIntensity={isNight ? 5 : 3} />
          </mesh>
        </group>
      ))}

      {/* Board */}
      <Board text="POWER SUPPLY" position={[0, 12, 0]} color="#ffcc22" width={8} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   FILTRATION ZONE — with skid GLB + animated flow
   ═══════════════════════════════════════════════════════════ */
const FILTRATION_STAGES = [
  { id: "wastewater", label: "Wastewater", color: "#6b4a2f" },
  { id: "primary", label: "Primary", color: "#8a7a4a" },
  { id: "biological", label: "Biological", color: "#4a8a5a" },
  { id: "aeration", label: "Aeration", color: "#4ac8e0" },
  { id: "clarification", label: "Clarification", color: "#6ab0d0" },
  { id: "advanced", label: "Advanced", color: "#3aa0d0" },
  { id: "uv", label: "UV", color: "#9a6aff" },
  { id: "storage", label: "Storage", color: "#22cfff" },
  { id: "recycling", label: "Recycling", color: "#2ecc71" },
]

function WaterFlow({ from, to, active }) {
  const dotsRef = useRef([])
  const [dots] = useState(() => Array.from({ length: 3 }).map((_, i) => ({ id: i, progress: Math.random() })))

  useFrame((_, dt) => {
    dotsRef.current.forEach((d, i) => {
      if (!d) return
      const p = (dots[i].progress + dt * 0.5) % 1
      dots[i].progress = p
      const x = from[0] + (to[0] - from[0]) * p
      const z = from[2] + (to[2] - from[2]) * p
      const y = 2 + Math.sin(p * Math.PI) * 0.5
      d.position.set(x, y, z)
    })
  })

  return (
    <group>
      {dots.map((dot, i) => (
        <mesh 
          key={dot.id} 
          ref={el => dotsRef.current[i] = el}
          visible={active}
        >
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={4} />
        </mesh>
      ))}
    </group>
  )
}

function FiltrationTank({ position, color, stageIndex, active }) {
  const waterRef = useRef()
  const timeOfDay = useStore(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'

  useFrame(() => {
    if (!waterRef.current || !active) return
    const scale = 1 + Math.sin(Date.now() * 0.002 + stageIndex) * 0.3
    waterRef.current.scale.y = scale
  })

  return (
    <group position={position}>
      {/* Tank body */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[1, 1.1, 2.5, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 1.5 : 0.4} metalness={0.3} roughness={0.3} transparent opacity={0.85} />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 1.5 : 0.4} metalness={0.3} roughness={0.3} transparent opacity={0.85} />
      </mesh>
      {/* Water inside */}
      <mesh ref={waterRef} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 1.5, 16]} />
        <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={active ? 3 : 1} transparent opacity={0.7} />
      </mesh>
      {/* Stage number */}
      <Text position={[0, 3.2, 0]} fontSize={0.4} color="#fff" anchorX="center">
        {stageIndex + 1}
      </Text>
    </group>
  )
}

function FiltrationZone({ position = [40, 0, -30] }) {
  const setFocus = useStore(s => s.setFocus)
  const [stageIdx, setStageIdx] = useState(0)
  const elapsedRef = useRef(0)

  useFrame((_, dt) => {
    elapsedRef.current += dt
    if (elapsedRef.current >= 4) {
      elapsedRef.current = 0
      setStageIdx(prev => (prev + 1) % FILTRATION_STAGES.length)
    }
  })

  // 3x3 grid of tanks
  const tankPositions = []
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      tankPositions.push([-6 + c * 6, 0, -6 + r * 6])
    }
  }

  return (
    <group position={position}>
      {/* Ground pad */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#1a2836" roughness={0.95} />
      </mesh>

      {/* Border */}
      <BuildingBorder width={26} depth={26} height={0.2} color="#22cfff" />

      {/* Skid filtration GLB */}
      <GLBBuilding 
        url="/skid_filtration_system.glb"
        size={10}
        position={[10, 0, 0]}
        name="Skid Filtration"
        borderColor="#22cfff"
        boardColor="#22cfff"
      />

      {/* 9 stage tanks */}
      {tankPositions.map((pos, i) => (
        <FiltrationTank 
          key={i}
          position={pos}
          color={FILTRATION_STAGES[i].color}
          stageIndex={i}
          active={i === stageIdx}
        />
      ))}

      {/* Water flow between tanks */}
      {tankPositions.slice(0, -1).map((pos, i) => {
        const next = tankPositions[i + 1]
        return (
          <WaterFlow 
            key={i}
            from={pos} 
            to={next} 
            active={i === stageIdx}
          />
        )
      })}

      {/* Big reservoir */}
      <mesh position={[-10, 1.5, 0]} castShadow>
        <cylinderGeometry args={[2, 2.2, 3, 24]} />
        <meshStandardMaterial color="#0a4a6a" emissive="#0a2a4a" emissiveIntensity={1} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-10, 3, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 0.2, 24]} />
        <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2} transparent opacity={0.8} />
      </mesh>

      {/* Board */}
      <Board text="FILTRATION" position={[0, 10, 0]} color="#22cfff" width={8} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   FOOD ZONE
   ═══════════════════════════════════════════════════════════ */
function FoodZone({ position = [-40, 0, -30] }) {
  const timeOfDay = useStore(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const droneRef = useRef()

  useFrame(() => {
    if (!droneRef.current) return
    const t = Date.now() * 0.0005
    droneRef.current.position.x = Math.cos(t) * 8
    droneRef.current.position.z = Math.sin(t) * 8
    droneRef.current.position.y = 8 + Math.sin(t * 3) * 0.5
  })

  // Crop plot
  const Crop = ({ position }) => (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <coneGeometry args={[0.2, 0.8, 6]} />
        <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )

  return (
    <group position={position}>
      {/* Ground pad */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#1a2e1e" roughness={0.95} />
      </mesh>

      {/* Border */}
      <BuildingBorder width={26} depth={26} height={0.2} color="#2ecc71" />

      {/* 3x3 farming plots */}
      {[0, 1, 2].map(r =>
        [0, 1, 2].map(c => {
          const px = -7 + c * 7
          const pz = -7 + r * 7
          return (
            <group key={`${r}-${c}`} position={[px, 0, pz]}>
              {/* Soil plot */}
              <mesh position={[0, 0.15, 0]} receiveShadow>
                <boxGeometry args={[5, 0.3, 5]} />
                <meshStandardMaterial color="#4a2f1a" />
              </mesh>
              {/* Green border */}
              <mesh position={[0, 0.35, 0]}>
                <boxGeometry args={[5.2, 0.1, 5.2]} />
                <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={1.5} />
              </mesh>
              {/* Crops */}
              {Array.from({ length: 9 }).map((_, i) => {
                const cx = -1.8 + (i % 3) * 1.8
                const cz = -1.8 + Math.floor(i / 3) * 1.8
                return <Crop key={i} position={[cx, 0, cz]} />
              })}
              {/* Sprinkler */}
              <mesh position={[0, 0.8, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.15, 1, 8]} />
                <meshStandardMaterial color="#9aa0a6" />
              </mesh>
              <mesh position={[0, 1.4, 0]}>
                <sphereGeometry args={[0.15, 12, 12]} />
                <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2} />
              </mesh>
            </group>
          )
        })
      )}

      {/* Processing plant */}
      <group position={[10, 0, 0]}>
        <mesh position={[0, 3, 0]} castShadow>
          <boxGeometry args={[5, 6, 4]} />
          <meshStandardMaterial color="#1a8a4e" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 6.2, 0]}>
          <boxGeometry args={[5.2, 0.4, 4.2]} />
          <meshStandardMaterial color="#0a3a1a" />
        </mesh>
        <mesh position={[0, 7.5, 0]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={isNight ? 6 : 4} />
        </mesh>
      </group>

      {/* Drone */}
      <group ref={droneRef}>
        <mesh>
          <boxGeometry args={[0.8, 0.15, 0.8]} />
          <meshStandardMaterial color="#2c3e50" />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={3} />
        </mesh>
        {/* Rotors */}
        {[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.1, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.05, 12]} />
            <meshStandardMaterial color="#aaa" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>

      {/* Board */}
      <Board text="AI FOOD" position={[0, 10, 0]} color="#2ecc71" width={6} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   WASTE ZONE
   ═══════════════════════════════════════════════════════════ */
function WasteZone({ position = [40, 0, 30] }) {
  const timeOfDay = useStore(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const flameRef = useRef()
  const flameRef2 = useRef()

  useFrame(() => {
    if (flameRef.current) {
      const s = 1 + Math.sin(Date.now() * 0.008) * 0.3
      flameRef.current.scale.y = s
    }
    if (flameRef2.current) {
      const s = 1 + Math.cos(Date.now() * 0.008) * 0.3
      flameRef2.current.scale.y = s
    }
  })

  return (
    <group position={position}>
      {/* Ground pad */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#2a3a2e" roughness={0.95} />
      </mesh>

      {/* Border */}
      <BuildingBorder width={26} depth={26} height={0.2} color="#2ecc71" />

      {/* 9 smart bins */}
      {[0, 1, 2].map(r =>
        [0, 1, 2].map(c => {
          const colors = ['#2ecc71', '#3498db', '#e74c3c', '#f39c12']
          const col = colors[(r * 3 + c) % 4]
          return (
            <group key={`${r}-${c}`} position={[-7 + c * 7, 0, -7 + r * 7]}>
              <mesh position={[0, 0.8, 0]} castShadow>
                <cylinderGeometry args={[0.7, 0.8, 1.6, 12]} />
                <meshStandardMaterial color={col} metalness={0.4} roughness={0.5} />
              </mesh>
              <mesh position={[0, 1.7, 0]}>
                <cylinderGeometry args={[0.75, 0.75, 0.15, 12]} />
                <meshStandardMaterial color="#1a1a1a" />
              </mesh>
              {/* LED ring */}
              <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.75, 0.04, 6, 20]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={isNight ? 5 : 3} />
              </mesh>
            </group>
          )
        })
      )}

      {/* Recycling machine */}
      <group position={[-8, 0, 10]}>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[4, 4, 4]} />
          <meshStandardMaterial color="#2ecc71" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 4.5, 0]}>
          <sphereGeometry args={[0.3, 12, 12]} />
          <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={isNight ? 6 : 4} />
        </mesh>
      </group>

      {/* Biogas digester with flame */}
      <group position={[8, 0, 10]}>
        <mesh position={[0, 2, 0]} castShadow>
          <sphereGeometry args={[2, 16, 12]} />
          <meshStandardMaterial color="#4a7a3a" metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh ref={flameRef} position={[0, 5, 0]}>
          <coneGeometry args={[0.4, 1.5, 8]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={5} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Composting + Incinerator */}
      {[-8, 0, 8].map((x, i) => (
        <mesh key={i} position={[x, 0.5, -10]} castShadow>
          <cylinderGeometry args={[1.2, 1.2, 1, 16]} />
          <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
        </mesh>
      ))}
      <group position={[10, 0, -8]}>
        <mesh position={[0, 2.5, 0]} castShadow>
          <cylinderGeometry args={[1.5, 1.5, 5, 16]} />
          <meshStandardMaterial color="#8a3a3a" metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh position={[0, 6.5, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.6, 3, 12]} />
          <meshStandardMaterial color="#5a5a5a" />
        </mesh>
        <mesh ref={flameRef2} position={[0, 8.5, 0]}>
          <coneGeometry args={[0.3, 1, 8]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={4} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Board */}
      <Board text="WASTE MGMT" position={[0, 12, 0]} color="#2ecc71" width={7} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   GROUND + SKY
   ═══════════════════════════════════════════════════════════ */
function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#4d8f50" roughness={0.98} />
      </mesh>
      <RoadSystem />
      <StreetLightSystem />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.35} width={100} blur={2} far={30} />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   CITY BUILDINGS — all GLBs
   ═══════════════════════════════════════════════════════════ */
function CityBuildings() {
  return (
    <group>
      {/* Core buildings */}
      <GLBBuilding 
        url="/american_high_school.glb" 
        size={10} 
        position={[-30, 0, -30]} 
        name="Beacon School" 
        borderColor="#1a5490" 
        boardColor="#1a5490"
      />
      <GLBBuilding 
        url="/low_poly_hospital.glb" 
        size={10} 
        position={[30, 0, -30]} 
        name="Smart Hospital" 
        borderColor="#c0392b" 
        boardColor="#c0392b"
      />
      <GLBBuilding 
        url="/us_bank_tower.glb" 
        size={12} 
        position={[30, 0, 30]} 
        name="State Bank" 
        borderColor="#8e44ad" 
        boardColor="#8e44ad"
      />
      <GLBBuilding 
        url="/simple_farm_free.glb" 
        size={14} 
        position={[-60, 0, -30]} 
        name="Smart Eco Farm" 
        borderColor="#27ae60" 
        boardColor="#27ae60"
      />
      <GLBBuilding 
        url="/liverpool_street_station_south_entrance.glb" 
        size={12} 
        position={[30, 0, 60]} 
        name="Event Hall" 
        borderColor="#d4a017" 
        boardColor="#d4a017"
      />
      <GLBBuilding 
        url="/gas_station.glb" 
        size={10} 
        position={[60, 0, 30]} 
        name="Gas Station" 
        borderColor="#e74c3c" 
        boardColor="#e74c3c"
      />
      <GLBBuilding 
        url="/office.glb" 
        size={11} 
        position={[60, 0, -30]} 
        name="Sewage Co." 
        borderColor="#2ecc71" 
        boardColor="#2ecc71"
      />
      <GLBBuilding 
        url="/national_archives_research_center.glb" 
        size={13} 
        position={[-60, 0, 30]} 
        name="Culture Center" 
        borderColor="#f39c12" 
        boardColor="#f39c12"
      />
      <GLBBuilding 
        url="/power-suply-companey.glb" 
        size={11} 
        position={[-60, 0, 0]} 
        name="Power Co." 
        borderColor="#f1c40f" 
        boardColor="#f1c40f"
      />
      <GLBBuilding 
        url="/sci-fi_building_9.glb" 
        size={13} 
        position={[-70, 0, -60]} 
        name="Sci-Fi 9" 
        borderColor="#66ff99" 
        boardColor="#66ff99"
      />
      <GLBBuilding 
        url="/beautifultowerbuilding.glb" 
        size={14} 
        position={[-70, 0, 0]} 
        name="Beautiful Tower" 
        borderColor="#22cfff" 
        boardColor="#22cfff"
      />
      <GLBBuilding 
        url="/sci-fi_building_10.glb" 
        size={13} 
        position={[-70, 0, 60]} 
        name="Sci-Fi 10" 
        borderColor="#ff66dd" 
        boardColor="#ff66dd"
      />

      {/* Systems */}
      <PowerZone position={[-80, 0, 80]} />
      <FiltrationZone position={[80, 0, -80]} />
      <FoodZone position={[-80, 0, -80]} />
      <WasteZone position={[80, 0, 80]} />

      {/* AI Traffic Tower */}
      <AITrafficTower />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   SCENE
   ═══════════════════════════════════════════════════════════ */
function Scene() {
  const timeOfDay = useStore(s => s.timeOfDay)
  const skyConfig = {
    day: { sunPosition: [100, 20, 100], inclination: 0, azimuth: 0.25 },
    evening: { sunPosition: [10, 5, 100], inclination: 0, azimuth: 0.25 },
    night: { sunPosition: [-100, -20, 100], inclination: 0, azimuth: 0.25 }
  }

  return (
    <>
      <color attach="background" args={[timeOfDay === 'night' ? '#050a14' : '#8fbcd4']} />
      <ambientLight intensity={timeOfDay === 'night' ? 0.4 : 0.7} />
      <directionalLight 
        position={timeOfDay === 'night' ? [-10, 20, 10] : [20, 30, 10]} 
        intensity={timeOfDay === 'night' ? 0.5 : 1.2} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <Sky {...skyConfig[timeOfDay]} />
      <Ground />
      <CityBuildings />
      <TrafficSystem />
      <TrafficLights />
      <PeopleSystem />
      <TreesSystem />
      <AITrafficSystem />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   HUD — overlay UI
   ═══════════════════════════════════════════════════════════ */
function HUD() {
  const timeOfDay = useStore(s => s.timeOfDay)
  const setTimeOfDay = useStore(s => s.setTimeOfDay)
  const trafficDensity = useStore(s => s.trafficDensity)
  const setTrafficDensity = useStore(s => s.setTrafficDensity)
  const streetLightsOn = useStore(s => s.streetLightsOn)
  const setStreetLightsOn = useStore(s => s.setStreetLightsOn)
  const setFocus = useStore(s => s.setFocus)
  const emergencyAlarm = useStore(s => s.emergencyAlarm)
  const [showPanel, setShowPanel] = useState(true)

  useEffect(() => {
    if (timeOfDay === 'night') setStreetLightsOn(true)
  }, [timeOfDay, setStreetLightsOn])

  const locations = {
    '🏫 Beacon School': { x: -15, y: 12, z: -15, lookAt: { x: -30, y: 0, z: -30 } },
    '🏥 Smart Hospital': { x: 45, y: 12, z: -15, lookAt: { x: 30, y: 0, z: -30 } },
    '🏦 State Bank': { x: 45, y: 12, z: 45, lookAt: { x: 30, y: 0, z: 30 } },
    '🌾 Smart Farm': { x: -45, y: 12, z: -15, lookAt: { x: -60, y: 0, z: -30 } },
    '🎪 Event Hall': { x: 45, y: 12, z: 75, lookAt: { x: 30, y: 0, z: 60 } },
    '🏛 Culture Center': { x: -45, y: 12, z: 45, lookAt: { x: -60, y: 0, z: 30 } },
    '🗼 Beautiful Tower': { x: -55, y: 15, z: 15, lookAt: { x: -70, y: 0, z: 0 } },
    '⚡ Power Zone': { x: -65, y: 15, z: 95, lookAt: { x: -80, y: 0, z: 80 } },
    '💧 Filtration': { x: 95, y: 12, z: -65, lookAt: { x: 80, y: 0, z: -80 } },
    '🍎 Food Zone': { x: -65, y: 12, z: -65, lookAt: { x: -80, y: 0, z: -80 } },
    '♻️ Waste Zone': { x: 95, y: 12, z: 95, lookAt: { x: 80, y: 0, z: 80 } },
    '🚦 Traffic Tower': { x: 15, y: 12, z: 15, lookAt: { x: 0, y: 0, z: 0 } },
  }

  return (
    <>
      {/* Title / brand */}
      <div style={{ position: 'absolute', left: 16, top: 16, zIndex: 50, fontFamily: 'system-ui', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2 }}>🏙 BSS WORLD</div>
        <div style={{ fontSize: 11, letterSpacing: 1.5, color: '#7fe3ff', textTransform: 'uppercase' }}>Smart City Control Center</div>
      </div>

      {/* Top status pill */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 16, zIndex: 50, display: 'flex', gap: 8 }}>
        <div style={{ background: 'rgba(5,10,18,0.85)', border: '1px solid rgba(34,207,255,0.4)', borderRadius: 999, padding: '8px 16px', color: '#b8e8ff', fontSize: 12, fontFamily: 'system-ui', backdropFilter: 'blur(10px)' }}>
          {timeOfDay === 'night' ? '🌙 Night' : timeOfDay === 'evening' ? '🌆 Evening' : '☀ Day'} • Traffic: {trafficDensity}
        </div>
      </div>

      {/* Emergency banner */}
      {emergencyAlarm && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 70, zIndex: 100, background: 'linear-gradient(135deg, #e74c3c, #c0392b)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: 'system-ui', animation: 'pulse 0.5s infinite' }}>
          🚨 EMERGENCY ALARM 🚨
        </div>
      )}

      {/* Settings gear */}
      <button
        onClick={() => setShowPanel(p => !p)}
        style={{ position: 'absolute', right: 20, top: 20, zIndex: 100, width: 48, height: 48, borderRadius: '50%', background: 'rgba(5,10,18,0.9)', border: '1px solid rgba(34,207,255,0.4)', color: '#22cfff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', transform: showPanel ? 'rotate(90deg)' : 'rotate(0)' }}
      >
        ⚙️
      </button>

      {/* Control panel */}
      {showPanel && (
        <div style={{ position: 'absolute', right: 80, top: 20, zIndex: 50, background: 'rgba(5,10,18,0.92)', border: '1px solid rgba(34,207,255,0.3)', borderRadius: 12, padding: 16, fontFamily: 'system-ui', color: '#e8f7ff', width: 240, backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#22cfff' }}>City Controls</div>
            <button onClick={() => setShowPanel(false)} style={{ background: 'none', border: 'none', color: '#ff8a8a', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>

          {/* Time of day */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Time of Day</div>
            <select 
              value={timeOfDay} 
              onChange={(e) => { setTimeOfDay(e.target.value); setStreetLightsOn(e.target.value === 'night') }}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: 'rgba(34,207,255,0.08)', border: '1px solid rgba(34,207,255,0.3)', color: '#e8f7ff', fontSize: 12, cursor: 'pointer' }}
            >
              <option value="day">☀️ Day</option>
              <option value="evening">🌆 Evening</option>
              <option value="night">🌙 Night</option>
            </select>
          </div>

          {/* Traffic density */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Traffic Density</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['low', 'medium', 'high'].map(d => (
                <button 
                  key={d}
                  onClick={() => setTrafficDensity(d)}
                  style={{ flex: 1, padding: '6px 4px', borderRadius: 6, background: trafficDensity === d ? 'rgba(34,207,255,0.25)' : 'rgba(34,207,255,0.05)', border: trafficDensity === d ? '1px solid #22cfff' : '1px solid rgba(34,207,255,0.2)', color: trafficDensity === d ? '#22cfff' : '#8fd8f0', fontSize: 10, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Street lights */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Street Lights</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button 
                onClick={() => setStreetLightsOn(true)}
                style={{ flex: 1, padding: '6px', borderRadius: 6, background: streetLightsOn ? 'rgba(46,204,113,0.3)' : 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.5)', color: '#2ecc71', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
              >
                ON
              </button>
              <button 
                onClick={() => setStreetLightsOn(false)}
                style={{ flex: 1, padding: '6px', borderRadius: 6, background: !streetLightsOn ? 'rgba(231,76,60,0.3)' : 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.5)', color: '#e74c3c', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
              >
                OFF
              </button>
            </div>
          </div>

          {/* Quick nav */}
          <div>
            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Quick Nav</div>
            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(locations).map(([name, pos]) => (
                <button 
                  key={name}
                  onClick={() => setFocus(pos)}
                  style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(34,207,255,0.06)', border: '1px solid rgba(34,207,255,0.2)', color: '#b8e8ff', fontSize: 11, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.target.style.background = 'rgba(34,207,255,0.15)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(34,207,255,0.06)'}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom hint */}
      <div style={{ position: 'absolute', left: 16, bottom: 16, zIndex: 50, background: 'rgba(5,10,18,0.85)', border: '1px solid rgba(34,207,255,0.3)', borderRadius: 10, padding: '10px 16px', color: '#b8e8ff', fontSize: 11, fontFamily: 'system-ui', backdropFilter: 'blur(10px)', maxWidth: 400 }}>
        🎮 <strong>Drag</strong> rotate • <strong>Scroll</strong> zoom • <strong>Click buildings</strong> to focus
        <br />
        🌟 Features: GLBs • AI Traffic • Filtration Flow • Boards • Night Lights
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   CAMERA CONTROLLER — smooth focus on click
   ═══════════════════════════════════════════════════════════ */
function CameraController() {
  const { camera } = useThree()
  const focus = useStore(s => s.focus)

  useFrame(() => {
    if (!focus) return
    const tgt = new THREE.Vector3(focus.x, focus.y, focus.z)
    camera.position.lerp(tgt, 0.06)
    camera.lookAt(focus.lookAt.x, focus.lookAt.y, focus.lookAt.z)
  })

  return null
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP — single file export default
   ═══════════════════════════════════════════════════════════ */
export default function SmartCity3D() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
      
      <HUD />

      <Canvas 
        shadows 
        camera={{ position: [80, 60, 80], fov: 55, near: 0.5, far: 1000 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <OrbitControls 
          makeDefault
          enablePan
          enableRotate
          enableZoom
          minDistance={5}
          maxDistance={250}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 2, 0]}
        />
        <CameraController />
      </Canvas>
    </div>
  )
}
