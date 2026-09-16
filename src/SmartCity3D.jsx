import React, { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, useGLTF, ContactShadows, Sky, Text, Sparkles } from '@react-three/drei'
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
  menuOpen: false,
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
   CITY DIMENSIONS — BIGGER
   ═══════════════════════════════════════════════════════════ */
const CITY = {
  HALF: 200,           // was 100
  ROAD_W: 8,           // wider roads
  ROAD_LEN: 380,
  ROAD_Z: [-75, -25, 25, 75],
  ROAD_X: [-75, -25, 25, 75],
}

/* ═══════════════════════════════════════════════════════════
   BUILDING BORDER
   ═══════════════════════════════════════════════════════════ */
function BuildingBorder({ width = 4, depth = 4, height = 8, color = "#22cfff", position = [0, 0, 0] }) {
  const timeOfDay = useStore(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const glow = isNight ? 6 : 3
  const halfW = width / 2
  const halfD = depth / 2

  return (
    <group position={position}>
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
   BOARD — big billboard sign above building
   ═══════════════════════════════════════════════════════════ */
function Board({ text, position = [0, 0, 0], color = "#22cfff", width = 10, height = 2.5, rotation = [0, 0, 0] }) {
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 2048, 512)
    grad.addColorStop(0, color)
    grad.addColorStop(1, '#0a1018')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 2048, 512)
    // Border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 16
    ctx.strokeRect(20, 20, 2008, 472)
    // Inner glow border
    ctx.strokeStyle = color
    ctx.lineWidth = 8
    ctx.strokeRect(40, 40, 1968, 432)
    // Text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 140px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 20
    ctx.fillText(text, 1024, 256)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    setTexture(tex)
  }, [text, color])

  if (!texture) return null

  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[width + 0.4, height + 0.4, 0.3]} />
        <meshStandardMaterial color="#0a0a0a" emissive={color} emissiveIntensity={0.8} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Text face */}
      <mesh position={[0, 0, 0.17]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent />
      </mesh>
      {/* Poles */}
      <mesh position={[-width / 2 + 0.5, -height / 2 - 2, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
        <meshStandardMaterial color="#333" metalness={0.7} />
      </mesh>
      <mesh position={[width / 2 - 0.5, -height / 2 - 2, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
        <meshStandardMaterial color="#333" metalness={0.7} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   GLB BUILDING
   ═══════════════════════════════════════════════════════════ */
function GLBBuilding({ 
  url, size = 15, position = [0, 0, 0], 
  name = "Building", borderColor = "#22cfff", 
  boardColor = "#22cfff", yOffset = 0,
  fallbackColor, boardRotation = [0, 0, 0]
}) {
  const setFocus = useStore(s => s.setFocus)
  const [dimensions, setDimensions] = useState({ w: 5, d: 5, h: 10 })

  let gltf = null
  try {
    gltf = useGLTF(url)
  } catch (e) {
    // fallback
  }

  const model = React.useMemo(() => {
    if (!gltf || !gltf.scene) return null
    const cloned = gltf.scene.clone(true)
    
    const box = new THREE.Box3().setFromObject(cloned)
    const sizeVec = new THREE.Vector3()
    box.getSize(sizeVec)
    const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z)
    const scale = size / Math.max(maxDim, 0.001)
    cloned.scale.setScalar(scale)

    const box2 = new THREE.Box3().setFromObject(cloned)
    const center = new THREE.Vector3()
    box2.getCenter(center)
    cloned.position.x -= center.x
    cloned.position.z -= center.z
    cloned.position.y -= box2.min.y

    const finalSize = new THREE.Vector3()
    box2.getSize(finalSize)
    setDimensions({
      w: Math.max(finalSize.x * scale * 1.2, 6),
      d: Math.max(finalSize.z * scale * 1.2, 6),
      h: Math.max(finalSize.y * scale, 10)
    })

    return cloned
  }, [gltf, size])

  const handleClick = () => {
    setFocus({
      x: position[0] + 25,
      y: position[1] + dimensions.h + 5,
      z: position[2] + 25,
      lookAt: { x: position[0], y: position[1], z: position[2] }
    })
  }

  if (!model) {
    const fbColor = fallbackColor || borderColor
    const w = size / 3
    const h = size / 2
    return (
      <group position={[position[0], position[1] + yOffset, position[2]]}>
        <mesh onClick={handleClick} castShadow>
          <boxGeometry args={[w, h, w]} />
          <meshStandardMaterial color={fbColor} roughness={0.6} metalness={0.3} />
        </mesh>
        <BuildingBorder width={w} depth={w} height={h} color={borderColor} />
        <Board text={name} position={[0, h + 5, 0]} color={boardColor} rotation={boardRotation} />
      </group>
    )
  }

  return (
    <group position={[position[0], position[1] + yOffset, position[2]]}>
      <primitive object={model} onClick={handleClick} castShadow receiveShadow />
      <BuildingBorder 
        width={dimensions.w} 
        depth={dimensions.d} 
        height={dimensions.h} 
        color={borderColor} 
      />
      <Board text={name} position={[0, dimensions.h + 6, 0]} color={boardColor} rotation={boardRotation} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   ENHANCED BUILDING (from old project) — small houses
   ═══════════════════════════════════════════════════════════ */
function EnhancedBuilding({ 
  position = [0, 0, 0], 
  height = 8, 
  color = "#a67c52", 
  name = "Building",
  hasTurbine = false,
  hasSolar = true
}) {
  const setFocus = useStore(s => s.setFocus)
  const timeOfDay = useStore(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const borderColor = hasTurbine ? "#22cfff" : "#ffcc22"

  return (
    <group position={position} onClick={() => setFocus({ x: position[0] + 15, y: position[1] + height + 5, z: position[2] + 15, lookAt: { x: position[0], y: position[1], z: position[2] } })}>
      {/* Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[5, height, 5]} />
        <meshStandardMaterial color={color} roughness={0.75} metalness={0.15} />
      </mesh>
      
      {/* Windows */}
      {Array.from({ length: Math.floor(height / 3) }).map((_, floor) => {
        const y = (floor * 3) - height / 2 + 2
        return (
          <group key={floor}>
            <mesh position={[0, y, 2.51]} castShadow>
              <boxGeometry args={[4, 1.8, 0.05]} />
              <meshStandardMaterial 
                color={isNight ? "#ffffcc" : "#87CEEB"} 
                transparent 
                opacity={isNight ? 0.95 : 0.75}
                emissive={isNight ? "#ffff99" : "#000000"}
                emissiveIntensity={isNight ? 0.8 : 0}
              />
            </mesh>
            <mesh position={[0, y, -2.51]} castShadow>
              <boxGeometry args={[4, 1.8, 0.05]} />
              <meshStandardMaterial 
                color={isNight ? "#ffffcc" : "#87CEEB"} 
                transparent 
                opacity={isNight ? 0.95 : 0.75}
                emissive={isNight ? "#ffff99" : "#000000"}
                emissiveIntensity={isNight ? 0.8 : 0}
              />
            </mesh>
          </group>
        )
      })}
      
      {/* Roof */}
      <mesh position={[0, height / 2 + 0.5, 0]} castShadow>
        <boxGeometry args={[5.4, 1, 5.4]} />
        <meshStandardMaterial color="#34495e" />
      </mesh>

      {/* Solar panels */}
      {hasSolar && (
        <mesh position={[0, height / 2 + 1.2, 0]}>
          <boxGeometry args={[4, 0.1, 4]} />
          <meshStandardMaterial color="#082c4b" emissive="#063b62" emissiveIntensity={1} metalness={0.7} />
        </mesh>
      )}

      {/* Wind turbine */}
      {hasTurbine && <WindTurbine position={[0, height / 2 + 1, 0]} scale={0.6} />}

      {/* Border */}
      <BuildingBorder width={5} depth={5} height={height} color={borderColor} />

      {/* Name */}
      <Board text={name} position={[0, height + 4, 0]} color={borderColor} width={7} height={1.6} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   WIND TURBINE — used by houses & power zone
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
        <meshStandardMaterial 
          color={isOn ? "#ffffcc" : "#666"} 
          emissive={isOn ? "#ffff99" : "#000"} 
          emissiveIntensity={isOn ? 2 : 0} 
        />
      </mesh>
      {isOn && <pointLight position={[2, 5.7, 0]} intensity={0.9} distance={18} color="#ffffcc" />}
    </group>
  )
}
/* ═══════════════════════════════════════════════════════════
   ROAD SYSTEM — bigger, better markings
   ═══════════════════════════════════════════════════════════ */
function RoadSystem() {
  const { HALF, ROAD_W, ROAD_LEN, ROAD_Z, ROAD_X } = CITY

  const roadMat = <meshStandardMaterial color="#2a2a2a" roughness={0.92} metalness={0.05} />
  const yellowMat = <meshStandardMaterial color="#f5c84b" emissive="#f5c84b" emissiveIntensity={0.6} />
  const whiteMat = <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
  const sidewalkMat = <meshStandardMaterial color="#a8a8a8" roughness={0.9} />
  const curbMat = <meshStandardMaterial color="#6a6a6a" roughness={0.85} />

  return (
    <group>
      {/* ═══ EAST-WEST ROADS ═══ */}
      {ROAD_Z.map((z, i) => (
        <group key={`ew${i}`}>
          {/* Main road surface */}
          <mesh position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[ROAD_LEN, ROAD_W]} />
            {roadMat}
          </mesh>

          {/* Double yellow center lines */}
          <mesh position={[0, 0.025, z - 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[ROAD_LEN, 0.2]} />
            {yellowMat}
          </mesh>
          <mesh position={[0, 0.025, z + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[ROAD_LEN, 0.2]} />
            {yellowMat}
          </mesh>

          {/* Dashed lane divider lines (both sides) */}
          {Array.from({ length: 60 }).map((_, k) => (
            <React.Fragment key={`ew-${i}-d1-${k}`}>
              <mesh position={[-ROAD_LEN / 2 + 3 + k * 3.2, 0.03, z - ROAD_W / 4]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.5, 0.15]} />
                {whiteMat}
              </mesh>
              <mesh position={[-ROAD_LEN / 2 + 3 + k * 3.2, 0.03, z + ROAD_W / 4]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.5, 0.15]} />
                {whiteMat}
              </mesh>
            </React.Fragment>
          ))}

          {/* Solid white edge lines */}
          <mesh position={[0, 0.03, z - ROAD_W / 2 + 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[ROAD_LEN, 0.15]} />
            {whiteMat}
          </mesh>
          <mesh position={[0, 0.03, z + ROAD_W / 2 - 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[ROAD_LEN, 0.15]} />
            {whiteMat}
          </mesh>

          {/* Sidewalks on both sides */}
          <mesh position={[0, 0.2, z - ROAD_W / 2 - 1.5]} receiveShadow>
            <boxGeometry args={[ROAD_LEN, 0.4, 3]} />
            {sidewalkMat}
          </mesh>
          <mesh position={[0, 0.2, z + ROAD_W / 2 + 1.5]} receiveShadow>
            <boxGeometry args={[ROAD_LEN, 0.4, 3]} />
            {sidewalkMat}
          </mesh>

          {/* Curbs */}
          <mesh position={[0, 0.25, z - ROAD_W / 2 - 0.15]}>
            <boxGeometry args={[ROAD_LEN, 0.5, 0.3]} />
            {curbMat}
          </mesh>
          <mesh position={[0, 0.25, z + ROAD_W / 2 + 0.15]}>
            <boxGeometry args={[ROAD_LEN, 0.5, 0.3]} />
            {curbMat}
          </mesh>

          {/* Glow edges */}
          <mesh position={[0, 0.05, z - ROAD_W / 2 - 3.1]}>
            <boxGeometry args={[ROAD_LEN, 0.08, 0.12]} />
            <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2.5} />
          </mesh>
          <mesh position={[0, 0.05, z + ROAD_W / 2 + 3.1]}>
            <boxGeometry args={[ROAD_LEN, 0.08, 0.12]} />
            <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}

      {/* ═══ NORTH-SOUTH ROADS ═══ */}
      {ROAD_X.map((x, i) => (
        <group key={`ns${i}`}>
          <mesh position={[x, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[ROAD_W, ROAD_LEN]} />
            {roadMat}
          </mesh>

          {/* Double yellow center */}
          <mesh position={[x - 0.5, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, ROAD_LEN]} />
            {yellowMat}
          </mesh>
          <mesh position={[x + 0.5, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, ROAD_LEN]} />
            {yellowMat}
          </mesh>

          {/* Dashed dividers */}
          {Array.from({ length: 60 }).map((_, k) => (
            <React.Fragment key={`ns-${i}-d-${k}`}>
              <mesh position={[x - ROAD_W / 4, 0.03, -ROAD_LEN / 2 + 3 + k * 3.2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.15, 1.5]} />
                {whiteMat}
              </mesh>
              <mesh position={[x + ROAD_W / 4, 0.03, -ROAD_LEN / 2 + 3 + k * 3.2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.15, 1.5]} />
                {whiteMat}
              </mesh>
            </React.Fragment>
          ))}

          {/* Edges */}
          <mesh position={[x - ROAD_W / 2 + 0.4, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, ROAD_LEN]} />
            {whiteMat}
          </mesh>
          <mesh position={[x + ROAD_W / 2 - 0.4, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, ROAD_LEN]} />
            {whiteMat}
          </mesh>

          {/* Sidewalks */}
          <mesh position={[x - ROAD_W / 2 - 1.5, 0.2, 0]} receiveShadow>
            <boxGeometry args={[3, 0.4, ROAD_LEN]} />
            {sidewalkMat}
          </mesh>
          <mesh position={[x + ROAD_W / 2 + 1.5, 0.2, 0]} receiveShadow>
            <boxGeometry args={[3, 0.4, ROAD_LEN]} />
            {sidewalkMat}
          </mesh>

          {/* Curbs */}
          <mesh position={[x - ROAD_W / 2 - 0.15, 0.25, 0]}>
            <boxGeometry args={[0.3, 0.5, ROAD_LEN]} />
            {curbMat}
          </mesh>
          <mesh position={[x + ROAD_W / 2 + 0.15, 0.25, 0]}>
            <boxGeometry args={[0.3, 0.5, ROAD_LEN]} />
            {curbMat}
          </mesh>

          {/* Glow */}
          <mesh position={[x - ROAD_W / 2 - 3.1, 0.05, 0]}>
            <boxGeometry args={[0.12, 0.08, ROAD_LEN]} />
            <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2.5} />
          </mesh>
          <mesh position={[x + ROAD_W / 2 + 3.1, 0.05, 0]}>
            <boxGeometry args={[0.12, 0.08, ROAD_LEN]} />
            <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}

      {/* ═══ CROSSWALKS at all intersections ═══ */}
      {ROAD_X.map(x =>
        ROAD_Z.map(z => (
          <group key={`cw-${x}-${z}`} position={[x, 0.04, z]}>
            {/* Horizontal stripes */}
            {Array.from({ length: 12 }).map((_, k) => (
              <mesh key={`h${k}`} position={[-ROAD_W / 2 + 0.6 + k * 0.6, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.35, ROAD_W - 0.5]} />
                {whiteMat}
              </mesh>
            ))}
            {/* Vertical stripes */}
            {Array.from({ length: 12 }).map((_, k) => (
              <mesh key={`v${k}`} position={[0, 0, -ROAD_W / 2 + 0.6 + k * 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[ROAD_W - 0.5, 0.35]} />
                {whiteMat}
              </mesh>
            ))}
          </group>
        ))
      )}

      {/* ═══ CITY BOUNDARY WALL ═══ */}
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

  // Along east-west roads
  ROAD_Z.forEach(z => {
    for (let x = -ROAD_LEN / 2 + 20; x <= ROAD_LEN / 2 - 20; x += 30) {
      positions.push([x, 0, z - ROAD_W / 2 - 4])
      positions.push([x, 0, z + ROAD_W / 2 + 4])
    }
  })

  // Along north-south roads
  ROAD_X.forEach(x => {
    for (let z = -ROAD_LEN / 2 + 20; z <= ROAD_LEN / 2 - 20; z += 30) {
      // Skip if near intersection (avoid clutter)
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
      {positions.map((pos, i) => <StreetLight key={i} position={pos} />)}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   AI TRAFFIC TOWER
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
    <group position={[0, 0, 0]} onClick={() => setFocus({ x: 20, y: 20, z: 20, lookAt: { x: 0, y: 0, z: 0 } })}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[8, 9, 2, 32]} />
        <meshStandardMaterial color="#142f3b" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh ref={ringRef} position={[0, 2.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[7.5, 0.25, 10, 48]} />
        <meshStandardMaterial color="#32dfff" emissive="#18cfff" emissiveIntensity={3} />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[6, 0.2, 10, 48]} />
        <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2.5} />
      </mesh>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 7, 3, Math.sin(angle) * 7]}>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={isNight ? 6 : 4} />
          </mesh>
        )
      })}
      <mesh position={[0, 8, 0]} castShadow>
        <cylinderGeometry args={[2.4, 3, 10, 10]} />
        <meshStandardMaterial color="#185a72" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 14, 0]} castShadow>
        <cylinderGeometry args={[3.2, 2.8, 2.4, 12]} />
        <meshStandardMaterial color="#0a3345" emissive="#1a7a9a" emissiveIntensity={2} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 3, 14, Math.sin(angle) * 3]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[1, 1.4, 0.12]} />
            <meshStandardMaterial color="#03141b" emissive="#21cfff" emissiveIntensity={isNight ? 5 : 3} />
          </mesh>
        )
      })}
      <mesh ref={radarRef} position={[0, 17, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.4, 0.16, 10, 32]} />
        <meshStandardMaterial color="#61e7ff" emissive="#23dfff" emissiveIntensity={3} />
      </mesh>
      <mesh ref={sigRef} position={[0, 19, 0]}>
        <sphereGeometry args={[0.8, 20, 20]} />
        <meshStandardMaterial color="#66e5ff" emissive="#33dfff" emissiveIntensity={5} />
      </mesh>
      <mesh position={[0, 22, 0]}>
        <cylinderGeometry args={[0.1, 0.16, 7, 6]} />
        <meshStandardMaterial color="#99a0a6" metalness={0.6} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   AI TRAFFIC SYSTEM
   ═══════════════════════════════════════════════════════════ */
const trafficSystemState = {
  phase: 0,
  inYellow: false,
  inAllRed: false,
}

function AITrafficSystem() {
  const elapsedRef = useRef(0)
  const PHASE_DURATION = 8
  const YELLOW = 2.5
  const ALL_RED = 0.8

  useFrame((_, dt) => {
    elapsedRef.current += dt
    const e = elapsedRef.current

    if (trafficSystemState.inAllRed) {
      if (e >= ALL_RED) {
        trafficSystemState.inAllRed = false
        trafficSystemState.phase = trafficSystemState.phase === 0 ? 1 : 0
        elapsedRef.current = 0
      }
    } else if (trafficSystemState.inYellow) {
      if (e >= YELLOW) {
        trafficSystemState.inYellow = false
        trafficSystemState.inAllRed = true
        elapsedRef.current = 0
      }
    } else if (e >= PHASE_DURATION) {
      trafficSystemState.inYellow = true
      elapsedRef.current = 0
    }
  })

  return null
}

/* ═══════════════════════════════════════════════════════════
   TRAFFIC LIGHT POLE
   ═══════════════════════════════════════════════════════════ */
function TrafficLightPole({ position, roadId }) {
  const redRef = useRef()
  const yellowRef = useRef()
  const greenRef = useRef()

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
  // 4 poles at the central intersection only
  const offset = CITY.ROAD_W / 2 + 3
  return (
    <group>
      <TrafficLightPole position={[-offset, 0, -offset]} roadId={1} />
      <TrafficLightPole position={[offset, 0, offset]} roadId={2} />
      <TrafficLightPole position={[offset, 0, -offset]} roadId={3} />
      <TrafficLightPole position={[-offset, 0, offset]} roadId={4} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   CAR — bigger and better
   ═══════════════════════════════════════════════════════════ */
function Car({ lane, startPos }) {
  const carRef = useRef()
  const [pos, setPos] = useState(startPos)
  const timeOfDay = useStore(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const colorRef = useRef(null)
  const speedRef = useRef(12 + Math.random() * 6)

  if (!colorRef.current) {
    const colors = ["#287ca3", "#c83f49", "#e1a72e", "#5b72c9", "#2f9d65", "#d8d8d8", "#d97b2a", "#8b3ad9", "#16a085", "#8e44ad", "#f39c12", "#e74c3c"]
    colorRef.current = colors[Math.floor(Math.random() * colors.length)]
  }

  useFrame((_, dt) => {
    if (!carRef.current) return
    const s = trafficSystemState
    const nsGreen = s.phase === 0 && !s.inYellow && !s.inAllRed
    const ewGreen = s.phase === 1 && !s.inYellow && !s.inAllRed
    const yellow = s.inYellow

    const roadId = lane.road
    const isNs = roadId === 1 || roadId === 2
    const isEw = roadId === 3 || roadId === 4

    const stopLine = 20
    let distToStop = 0
    if (lane.axis === 'z') {
      distToStop = Math.abs(pos - (lane.dir > 0 ? -stopLine : stopLine))
    } else {
      distToStop = Math.abs(pos - (lane.dir > 0 ? -stopLine : stopLine))
    }

    let shouldStop = false
    if (distToStop < 20) {
      if (isNs && !nsGreen && !yellow) shouldStop = true
      if (isEw && !ewGreen && !yellow) shouldStop = true
    }

    let currentSpeed = speedRef.current
    if (shouldStop && distToStop < 20) currentSpeed = Math.max(0, currentSpeed * (distToStop / 20))

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
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[3.4, 0.7, 1.5]} />
        <meshStandardMaterial color={colorRef.current} metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Hood */}
      <mesh castShadow position={[1.2, 0.35, 0]}>
        <boxGeometry args={[1, 0.4, 1.4]} />
        <meshStandardMaterial color={colorRef.current} metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Cabin */}
      <mesh castShadow position={[-0.2, 0.65, 0]}>
        <boxGeometry args={[1.6, 0.6, 1.1]} />
        <meshStandardMaterial color="#1a3a4a" emissive="#0a2535" emissiveIntensity={0.8} metalness={0.6} roughness={0.15} />
      </mesh>
      {/* Roof */}
      <mesh position={[-0.2, 0.96, 0]}>
        <boxGeometry args={[1.4, 0.08, 0.9]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {/* Wheels */}
      {[[-1.1, 0.8], [-1.1, -0.8], [1.1, 0.8], [1.1, -0.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.18, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 10]} />
          <meshStandardMaterial color="#0c1012" />
        </mesh>
      ))}
      {/* Headlights */}
      <mesh position={[1.7, 0.4, 0.45]}>
        <boxGeometry args={[0.06, 0.2, 0.25]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff8e0" emissiveIntensity={isNight ? 6 : 2} />
      </mesh>
      <mesh position={[1.7, 0.4, -0.45]}>
        <boxGeometry args={[0.06, 0.2, 0.25]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff8e0" emissiveIntensity={isNight ? 6 : 2} />
      </mesh>
      {/* Tail lights */}
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
   TRAFFIC SYSTEM — 16 lanes (all roads)
   ═══════════════════════════════════════════════════════════ */
function TrafficSystem() {
  const trafficDensity = useStore(s => s.trafficDensity)
  const carsPerLane = trafficDensity === 'low' ? 4 : trafficDensity === 'medium' ? 6 : 10
  const { ROAD_Z, ROAD_X, ROAD_LEN } = CITY

  const lanes = []

  // East-West lanes (on every ROAD_Z)
  ROAD_Z.forEach((z, i) => {
    // East-bound (dir +1)
    lanes.push({ id: `EW-E-${i}-1`, axis: 'x', dir: 1, fixed: z - 1.5, road: 3, start: -ROAD_LEN / 2, end: ROAD_LEN / 2 })
    lanes.push({ id: `EW-E-${i}-2`, axis: 'x', dir: 1, fixed: z - 4, road: 3, start: -ROAD_LEN / 2, end: ROAD_LEN / 2 })
    // West-bound (dir -1)
    lanes.push({ id: `EW-W-${i}-1`, axis: 'x', dir: -1, fixed: z + 1.5, road: 4, start: ROAD_LEN / 2, end: -ROAD_LEN / 2 })
    lanes.push({ id: `EW-W-${i}-2`, axis: 'x', dir: -1, fixed: z + 4, road: 4, start: ROAD_LEN / 2, end: -ROAD_LEN / 2 })
  })

  // North-South lanes (on every ROAD_X)
  ROAD_X.forEach((x, i) => {
    // North-bound (dir +1) — moving +Z
    lanes.push({ id: `NS-N-${i}-1`, axis: 'z', dir: 1, fixed: x - 1.5, road: 1, start: -ROAD_LEN / 2, end: ROAD_LEN / 2 })
    lanes.push({ id: `NS-N-${i}-2`, axis: 'z', dir: 1, fixed: x - 4, road: 1, start: -ROAD_LEN / 2, end: ROAD_LEN / 2 })
    // South-bound (dir -1) — moving -Z
    lanes.push({ id: `NS-S-${i}-1`, axis: 'z', dir: -1, fixed: x + 1.5, road: 2, start: ROAD_LEN / 2, end: -ROAD_LEN / 2 })
    lanes.push({ id: `NS-S-${i}-2`, axis: 'z', dir: -1, fixed: x + 4, road: 2, start: ROAD_LEN / 2, end: -ROAD_LEN / 2 })
  })

  return (
    <group>
      {lanes.map(lane => (
        Array.from({ length: carsPerLane }).map((_, i) => {
          const gap = Math.abs(lane.end - lane.start) / carsPerLane
          const startPos = lane.dir > 0 ? lane.start + gap * i + Math.random() * 8 : lane.start - gap * i - Math.random() * 8
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
    const skins = ["#f2c9a0", "#d9a373", "#a06a3c", "#6b4a2f", "#ffd8b8"]
    const shirts = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#1abc9c", "#e67e22"]
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
function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
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

  for (let i = 0; i < 200; i++) {
    const x = (Math.random() - 0.5) * HALF * 1.8
    const z = (Math.random() - 0.5) * HALF * 1.8

    // Skip roads
    let skip = false
    ROAD_Z.forEach(rz => { if (Math.abs(z - rz) < ROAD_W / 2 + 6) skip = true })
    ROAD_X.forEach(rx => { if (Math.abs(x - rx) < ROAD_W / 2 + 6) skip = true })
    // Skip center
    if (Math.sqrt(x * x + z * z) < 20) skip = true
    // Skip building zones (approximate)
    const bldZones = [
      [-100, -100], [100, -100], [100, 100], [-100, 100],
      [-150, 100], [100, -150], [-150, -100], [150, 0],
      [-180, 0], [0, -180], [180, 0], [0, 180],
    ]
    bldZones.forEach(([bx, bz]) => { if (Math.sqrt((x - bx) ** 2 + (z - bz) ** 2) < 25) skip = true })

    if (skip) continue
    positions.push([x, 0, z])
  }

  return (
    <group>
      {positions.map((pos, i) => (
        <Tree key={i} position={pos} scale={0.7 + Math.random() * 0.6} />
      ))}
    </group>
  )
}
/* ═══════════════════════════════════════════════════════════
   POWER ZONE
   ═══════════════════════════════════════════════════════════ */
function SolarPanelUnit({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[4, 0.15, 2.6]} />
        <meshStandardMaterial color="#082c4b" emissive="#063b62" emissiveIntensity={1.2} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[4.2, 0.2, 2.8]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      <mesh position={[-1.6, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 6]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh position={[1.6, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 6]} />
        <meshStandardMaterial color="#555" />
      </mesh>
    </group>
  )
}

function PowerZone({ position = [-140, 0, 140] }) {
  const timeOfDay = useStore(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'

  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 50]} />
        <meshStandardMaterial color="#1d3a2e" roughness={0.95} />
      </mesh>

      <BuildingBorder width={60} depth={50} height={0.2} color="#ffcc22" />

      {/* Wind turbines grid 3×3 */}
      {[0, 1, 2].map(row =>
        [0, 1, 2].map(col => (
          <WindTurbine 
            key={`${row}-${col}`}
            position={[-20 + col * 20, 0, -15 + row * 15]} 
            scale={1.2 + (row % 2) * 0.15}
          />
        ))
      )}

      {/* Solar panels */}
      <group position={[0, 0, 22]}>
        {[-20, -15, -10, -5, 0, 5, 10, 15, 20].map((x, i) => (
          <SolarPanelUnit key={i} position={[x, 0, 0]} />
        ))}
      </group>

      {/* Battery banks */}
      {[-22, -17, -12, -7, -2, 3, 8, 13, 18].map((x, i) => (
        <group key={i} position={[x, 0, -25]}>
          <mesh position={[0, 1.8, 0]} castShadow>
            <boxGeometry args={[3, 3.6, 3]} />
            <meshStandardMaterial color="#2a5a4a" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2, 0.1, 6, 16]} />
            <meshStandardMaterial color="#22ff9d" emissive="#22ff9d" emissiveIntensity={isNight ? 6 : 4} />
          </mesh>
        </group>
      ))}

      <Board text="POWER SUPPLY ZONE" position={[0, 22, 0]} color="#ffcc22" width={16} height={3} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   FILTRATION ZONE
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
  const progressRef = useRef([0, 0.33, 0.66])

  useFrame((_, dt) => {
    for (let i = 0; i < 3; i++) {
      progressRef.current[i] = (progressRef.current[i] + dt * 0.6) % 1
      const d = dotsRef.current[i]
      if (!d) continue
      const x = from[0] + (to[0] - from[0]) * progressRef.current[i]
      const z = from[2] + (to[2] - from[2]) * progressRef.current[i]
      const y = 2 + Math.sin(progressRef.current[i] * Math.PI) * 1.2
      d.position.set(x, y, z)
    }
  })

  return (
    <group>
      {[0, 1, 2].map(i => (
        <mesh key={i} ref={el => dotsRef.current[i] = el} visible={active}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={5} />
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
    const scale = 1 + Math.sin(Date.now() * 0.003 + stageIndex) * 0.25
    waterRef.current.scale.y = scale
  })

  return (
    <group position={position}>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[1.4, 1.5, 3.6, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 1.8 : 0.5} metalness={0.3} roughness={0.3} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 3.6, 0]} castShadow>
        <sphereGeometry args={[1.4, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 1.8 : 0.5} metalness={0.3} roughness={0.3} transparent opacity={0.85} />
      </mesh>
      <mesh ref={waterRef} position={[0, 1.6, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 2, 20]} />
        <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={active ? 4 : 1.2} transparent opacity={0.75} />
      </mesh>
      {active && isNight && <pointLight position={[0, 2, 0]} color="#22cfff" intensity={0.6} distance={6} />}
      <Text position={[0, 4.6, 0]} fontSize={0.6} color="#fff" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000">
        {stageIndex + 1}
      </Text>
    </group>
  )
}

function FiltrationZone({ position = [140, 0, -140] }) {
  const [stageIdx, setStageIdx] = useState(0)
  const elapsedRef = useRef(0)

  useFrame((_, dt) => {
    elapsedRef.current += dt
    if (elapsedRef.current >= 4) {
      elapsedRef.current = 0
      setStageIdx(prev => (prev + 1) % FILTRATION_STAGES.length)
    }
  })

  // 3x3 grid of tanks with larger spacing
  const tankPositions = []
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      tankPositions.push([-12 + c * 12, 0, -12 + r * 12])
    }
  }

  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[55, 55]} />
        <meshStandardMaterial color="#1a2836" roughness={0.95} />
      </mesh>

      <BuildingBorder width={55} depth={55} height={0.2} color="#22cfff" />

      {/* Skid filtration GLB */}
      <GLBBuilding 
        url="/skid_filtration_system.glb"
        size={20}
        position={[20, 0, -15]}
        name="Skid Filtration"
        borderColor="#22cfff"
        boardColor="#22cfff"
      />

      {tankPositions.map((pos, i) => (
        <FiltrationTank 
          key={i}
          position={pos}
          color={FILTRATION_STAGES[i].color}
          stageIndex={i}
          active={i === stageIdx}
        />
      ))}

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
      <group position={[-20, 0, 0]}>
        <mesh position={[0, 2.5, 0]} castShadow>
          <cylinderGeometry args={[3.5, 4, 5, 32]} />
          <meshStandardMaterial color="#0a4a6a" emissive="#0a2a4a" emissiveIntensity={1} metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 5, 0]}>
          <cylinderGeometry args={[3.2, 3.2, 0.3, 32]} />
          <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2.5} transparent opacity={0.85} />
        </mesh>
      </group>

      <Board text="FILTRATION SYSTEM" position={[0, 20, 0]} color="#22cfff" width={16} height={3} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   FOOD ZONE
   ═══════════════════════════════════════════════════════════ */
function FoodZone({ position = [-140, 0, -140] }) {
  const timeOfDay = useStore(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const droneRef = useRef()

  useFrame(() => {
    if (!droneRef.current) return
    const t = Date.now() * 0.0005
    droneRef.current.position.x = Math.cos(t) * 15
    droneRef.current.position.z = Math.sin(t) * 15
    droneRef.current.position.y = 12 + Math.sin(t * 3) * 1
  })

  const Crop = ({ position }) => (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <coneGeometry args={[0.3, 1.2, 6]} />
        <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )

  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[55, 55]} />
        <meshStandardMaterial color="#1a2e1e" roughness={0.95} />
      </mesh>

      <BuildingBorder width={55} depth={55} height={0.2} color="#2ecc71" />

      {/* 3x3 farming plots */}
      {[0, 1, 2].map(r =>
        [0, 1, 2].map(c => {
          const px = -15 + c * 15
          const pz = -15 + r * 15
          return (
            <group key={`${r}-${c}`} position={[px, 0, pz]}>
              <mesh position={[0, 0.2, 0]} receiveShadow>
                <boxGeometry args={[11, 0.4, 11]} />
                <meshStandardMaterial color="#4a2f1a" />
              </mesh>
              <mesh position={[0, 0.45, 0]}>
                <boxGeometry args={[11.3, 0.12, 11.3]} />
                <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={1.8} />
              </mesh>
              {Array.from({ length: 16 }).map((_, i) => {
                const cx = -4 + (i % 4) * 2.6
                const cz = -4 + Math.floor(i / 4) * 2.6
                return <Crop key={i} position={[cx, 0, cz]} />
              })}
              {/* Sprinkler */}
              <mesh position={[0, 1.2, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 1.5, 8]} />
                <meshStandardMaterial color="#9aa0a6" />
              </mesh>
              <mesh position={[0, 2, 0]}>
                <sphereGeometry args={[0.22, 12, 12]} />
                <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2.5} />
              </mesh>
            </group>
          )
        })
      )}

      {/* Processing plant */}
      <group position={[20, 0, -15]}>
        <mesh position={[0, 5, 0]} castShadow>
          <boxGeometry args={[10, 10, 8]} />
          <meshStandardMaterial color="#1a8a4e" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 10.3, 0]}>
          <boxGeometry args={[10.4, 0.6, 8.4]} />
          <meshStandardMaterial color="#0a3a1a" />
        </mesh>
        <mesh position={[0, 12, 0]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={isNight ? 6 : 4} />
        </mesh>
        <Board text="PROCESSING" position={[0, 14, 0]} color="#2ecc71" width={10} height={2} />
      </group>

      {/* Drone */}
      <group ref={droneRef}>
        <mesh>
          <boxGeometry args={[1.2, 0.2, 1.2]} />
          <meshStandardMaterial color="#2c3e50" />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={3} />
        </mesh>
        {[[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.15, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.08, 12]} />
            <meshStandardMaterial color="#aaa" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>

      <Board text="AI FOOD PRODUCTION" position={[0, 22, 0]} color="#2ecc71" width={18} height={3} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   WASTE ZONE
   ═══════════════════════════════════════════════════════════ */
function WasteZone({ position = [140, 0, 140] }) {
  const timeOfDay = useStore(s => s.timeOfDay)
  const isNight = timeOfDay === 'night'
  const flameRef = useRef()
  const flameRef2 = useRef()

  useFrame(() => {
    if (flameRef.current) {
      const s = 1 + Math.sin(Date.now() * 0.008) * 0.35
      flameRef.current.scale.y = s
    }
    if (flameRef2.current) {
      const s = 1 + Math.cos(Date.now() * 0.008) * 0.35
      flameRef2.current.scale.y = s
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[55, 55]} />
        <meshStandardMaterial color="#2a3a2e" roughness={0.95} />
      </mesh>

      <BuildingBorder width={55} depth={55} height={0.2} color="#2ecc71" />

      {/* 3x3 smart bins */}
      {[0, 1, 2].map(r =>
        [0, 1, 2].map(c => {
          const colors = ['#2ecc71', '#3498db', '#e74c3c', '#f39c12']
          const col = colors[(r * 3 + c) % 4]
          return (
            <group key={`${r}-${c}`} position={[-15 + c * 15, 0, -15 + r * 15]}>
              <mesh position={[0, 1.2, 0]} castShadow>
                <cylinderGeometry args={[1, 1.15, 2.4, 16]} />
                <meshStandardMaterial color={col} metalness={0.4} roughness={0.5} />
              </mesh>
              <mesh position={[0, 2.5, 0]}>
                <cylinderGeometry args={[1.05, 1.05, 0.2, 16]} />
                <meshStandardMaterial color="#1a1a1a" />
              </mesh>
              <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.1, 0.06, 6, 20]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={isNight ? 6 : 4} />
              </mesh>
            </group>
          )
        })
      )}

      {/* Recycling plant */}
      <group position={[-18, 0, 18]}>
        <mesh position={[0, 3, 0]} castShadow>
          <boxGeometry args={[7, 6, 7]} />
          <meshStandardMaterial color="#2ecc71" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 6.5, 0]}>
          <sphereGeometry args={[0.6, 12, 12]} />
          <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={isNight ? 6 : 4} />
        </mesh>
      </group>

      {/* Biogas digester with flame */}
      <group position={[18, 0, 18]}>
        <mesh position={[0, 3, 0]} castShadow>
          <sphereGeometry args={[3, 16, 12]} />
          <meshStandardMaterial color="#4a7a3a" metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh ref={flameRef} position={[0, 8, 0]}>
          <coneGeometry args={[0.8, 3, 8]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={5} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Composting pits */}
      {[-18, -9, 0, 9, 18].map((x, i) => (
        <mesh key={i} position={[x, 0.8, -22]} castShadow>
          <cylinderGeometry args={[1.8, 1.8, 1.5, 16]} />
          <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
        </mesh>
      ))}

      {/* Incinerator */}
      <group position={[20, 0, -18]}>
        <mesh position={[0, 4, 0]} castShadow>
          <cylinderGeometry args={[2.4, 2.4, 8, 16]} />
          <meshStandardMaterial color="#8a3a3a" metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh position={[0, 10, 0]} castShadow>
          <cylinderGeometry args={[0.8, 0.9, 5, 12]} />
          <meshStandardMaterial color="#5a5a5a" />
        </mesh>
        <mesh ref={flameRef2} position={[0, 13, 0]}>
          <coneGeometry args={[0.5, 1.5, 8]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={4} transparent opacity={0.85} />
        </mesh>
      </group>

      <Board text="WASTE MANAGEMENT" position={[0, 22, 0]} color="#2ecc71" width={18} height={3} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   PARK
   ═══════════════════════════════════════════════════════════ */
function Park({ position, size = 30 }) {
  const treePositions = []
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    treePositions.push([Math.cos(angle) * (size / 2 - 3), Math.sin(angle) * (size / 2 - 3)])
  }
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#3a8a4a" roughness={0.95} />
      </mesh>
      {/* Fountain */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[2, 2.5, 2, 16]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.5} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 1, 16]} />
        <meshStandardMaterial color="#22cfff" emissive="#22cfff" emissiveIntensity={2} transparent opacity={0.85} />
      </mesh>
      {treePositions.map(([x, z], i) => (
        <Tree key={i} position={[x, 0, z]} scale={0.9} />
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   PARKING LOT
   ═══════════════════════════════════════════════════════════ */
function ParkingLot({ position, rows = 3, cols = 5 }) {
  const carColors = ['#287ca3', '#c83f49', '#e1a72e', '#5b72c9', '#2f9d65', '#d8d8d8']
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[cols * 4, rows * 6]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.95} />
      </mesh>
      {/* Lines */}
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <mesh key={`l${i}`} position={[-cols * 2 + i * 4, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.15, rows * 6]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
      ))}
      {/* Cars */}
      {Array.from({ length: rows * cols }).map((_, i) => {
        if (Math.random() < 0.4) return null
        const r = Math.floor(i / cols)
        const c = i % cols
        return (
          <mesh 
            key={i} 
            position={[-cols * 2 + c * 4 + 2, 0.5, -rows * 3 + r * 6 + 3]}
            castShadow
          >
            <boxGeometry args={[3, 1, 2]} />
            <meshStandardMaterial color={carColors[i % carColors.length]} />
          </mesh>
        )
      })}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   RESIDENTIAL DISTRICT — old houses
   ═══════════════════════════════════════════════════════════ */
function ResidentialDistrict({ position = [140, 0, 0] }) {
  const houses = [
    // Row 1 (near center)
    { pos: [-20, 0, -30], h: 8, color: '#a67c52', name: 'House A1', turbine: true },
    { pos: [-8, 0, -30], h: 10, color: '#b5651d', name: 'House A2', turbine: false },
    { pos: [4, 0, -30], h: 8, color: '#c19a6b', name: 'House A3', turbine: true },
    { pos: [16, 0, -30], h: 12, color: '#8b4513', name: 'House A4', turbine: true },
    // Row 2
    { pos: [-20, 0, -15], h: 10, color: '#a0522d', name: 'House B1', turbine: false },
    { pos: [-8, 0, -15], h: 12, color: '#cd853f', name: 'House B2', turbine: true },
    { pos: [4, 0, -15], h: 8, color: '#a67c52', name: 'House B3', turbine: true },
    { pos: [16, 0, -15], h: 8, color: '#b5651d', name: 'House B4', turbine: false },
    // Row 3
    { pos: [-20, 0, 0], h: 11, color: '#c19a6b', name: 'House C1', turbine: true },
    { pos: [-8, 0, 0], h: 8, color: '#8b4513', name: 'House C2', turbine: true },
    { pos: [4, 0, 0], h: 10, color: '#a0522d', name: 'House C3', turbine: false },
    { pos: [16, 0, 0], h: 9, color: '#cd853f', name: 'House C4', turbine: true },
    // Row 4
    { pos: [-20, 0, 15], h: 8, color: '#a67c52', name: 'House D1', turbine: true },
    { pos: [-8, 0, 15], h: 11, color: '#b5651d', name: 'House D2', turbine: false },
    { pos: [4, 0, 15], h: 8, color: '#c19a6b', name: 'House D3', turbine: true },
    { pos: [16, 0, 15], h: 12, color: '#8b4513', name: 'House D4', turbine: true },
    // Row 5
    { pos: [-20, 0, 30], h: 9, color: '#a0522d', name: 'House E1', turbine: false },
    { pos: [-8, 0, 30], h: 8, color: '#cd853f', name: 'House E2', turbine: true },
    { pos: [4, 0, 30], h: 10, color: '#a67c52', name: 'House E3', turbine: true },
    { pos: [16, 0, 30], h: 8, color: '#b5651d', name: 'House E4', turbine: false },
  ]

  return (
    <group position={position}>
      {/* Ground pad */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 90]} />
        <meshStandardMaterial color="#3d7f45" roughness={0.95} />
      </mesh>
      {houses.map((h, i) => (
        <EnhancedBuilding 
          key={i}
          position={h.pos}
          height={h.h}
          color={h.color}
          name={h.name}
          hasTurbine={h.turbine}
          hasSolar={true}
        />
      ))}
      <Board text="RESIDENTIAL DISTRICT" position={[0, 40, 0]} color="#a67c52" width={18} height={3} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════
   GROUND
   ═══════════════════════════════════════════════════════════ */
function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#4d8f50" roughness={0.98} />
      </mesh>
      <RoadSystem />
      <StreetLightSystem />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.35} width={250} blur={2} far={40} />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   CITY BUILDINGS — all GLBs + houses + zones + extras
   ═══════════════════════════════════════════════════════════ */
function CityBuildings() {
  return (
    <group>
      {/* ═══ GLB BUILDINGS ═══ */}
      <GLBBuilding 
        url="/american_high_school.glb" 
        size={22} 
        position={[-100, 0, -100]} 
        name="Beacon School System" 
        borderColor="#1a5490" 
        boardColor="#1a5490"
      />
      <GLBBuilding 
        url="/low_poly_hospital.glb" 
        size={22} 
        position={[100, 0, -100]} 
        name="Smart City Hospital" 
        borderColor="#c0392b" 
        boardColor="#c0392b"
      />
      <GLBBuilding 
        url="/us_bank_tower.glb" 
        size={26} 
        position={[100, 0, 100]} 
        name="Smart City State Bank" 
        borderColor="#8e44ad" 
        boardColor="#8e44ad"
      />
      <GLBBuilding 
        url="/simple_farm_free.glb" 
        size={28} 
        position={[-150, 0, -100]} 
        name="Smart Eco Farm" 
        borderColor="#27ae60" 
        boardColor="#27ae60"
      />
      <GLBBuilding 
        url="/liverpool_street_station_south_entrance.glb" 
        size={24} 
        position={[100, 0, 180]} 
        name="Liverpool Event Hall" 
        borderColor="#d4a017" 
        boardColor="#d4a017"
      />
      <GLBBuilding 
        url="/gas_station.glb" 
        size={20} 
        position={[180, 0, 100]} 
        name="Gas Station · Car Wash" 
        borderColor="#e74c3c" 
        boardColor="#e74c3c"
      />
      <GLBBuilding 
        url="/office.glb" 
        size={22} 
        position={[180, 0, -100]} 
        name="Sewage & Gas Co." 
        borderColor="#2ecc71" 
        boardColor="#2ecc71"
      />
      <GLBBuilding 
        url="/national_archives_research_center.glb" 
        size={28} 
        position={[-150, 0, 100]} 
        name="Culture Center" 
        borderColor="#f39c12" 
        boardColor="#f39c12"
      />
      <GLBBuilding 
        url="/power-suply-companey.glb" 
        size={22} 
        position={[-150, 0, 0]} 
        name="City Power Supply Co." 
        borderColor="#f1c40f" 
        boardColor="#f1c40f"
      />
      <GLBBuilding 
        url="/sci-fi_building_9.glb" 
        size={26} 
        position={[-180, 0, -140]} 
        name="Sci-Fi Building 9" 
        borderColor="#66ff99" 
        boardColor="#66ff99"
      />
      <GLBBuilding 
        url="/beautifultowerbuilding.glb" 
        size={30} 
        position={[-180, 0, 0]} 
        name="Beautiful Tower" 
        borderColor="#22cfff" 
        boardColor="#22cfff"
      />
      <GLBBuilding 
        url="/sci-fi_building_10.glb" 
        size={26} 
        position={[-180, 0, 140]} 
        name="Sci-Fi Building 10" 
        borderColor="#ff66dd" 
        boardColor="#ff66dd"
      />

      {/* ═══ RESIDENTIAL DISTRICT ═══ */}
      <ResidentialDistrict position={[150, 0, 0]} />

      {/* ═══ SYSTEM ZONES ═══ */}
      <PowerZone position={[-180, 0, 180]} />
      <FiltrationZone position={[180, 0, -180]} />
      <FoodZone position={[-180, 0, -180]} />
      <WasteZone position={[180, 0, 180]} />

      {/* ═══ PARKS ═══ */}
      <Park position={[-60, 0, 60]} size={25} />
      <Park position={[60, 0, -60]} size={25} />
      <Park position={[-250, 0, 0]} size={30} />
      <Park position={[250, 0, 0]} size={30} />

      {/* ═══ PARKING LOTS ═══ */}
      <ParkingLot position={[-100, 0, 100]} rows={3} cols={5} />
      <ParkingLot position={[100, 0, -180]} rows={3} cols={5} />
      <ParkingLot position={[-240, 0, -100]} rows={2} cols={4} />

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
        position={timeOfDay === 'night' ? [-10, 30, 10] : [30, 50, 20]} 
        intensity={timeOfDay === 'night' ? 0.6 : 1.3} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={400}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
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
   MENU — slide-out panel on left
   ═══════════════════════════════════════════════════════════ */
function Menu() {
  const menuOpen = useStore(s => s.menuOpen)
  const [tab, setTab] = useState('locations')
  const timeOfDay = useStore(s => s.timeOfDay)
  const setTimeOfDay = (t) => setState({ timeOfDay: t })
  const trafficDensity = useStore(s => s.trafficDensity)
  const setTrafficDensity = (d) => setState({ trafficDensity: d })
  const streetLightsOn = useStore(s => s.streetLightsOn)
  const setStreetLightsOn = (v) => setState({ streetLightsOn: v })
  const setFocus = (f) => setState({ focus: f })

  useEffect(() => {
    if (timeOfDay === 'night' && !streetLightsOn) setStreetLightsOn(true)
  }, [timeOfDay])

  const locations = {
    'school': { name: '🏫 Beacon School', pos: { x: -80, y: 20, z: -80, lookAt: { x: -100, y: 0, z: -100 } } },
    'hospital': { name: '🏥 Smart Hospital', pos: { x: 120, y: 20, z: -80, lookAt: { x: 100, y: 0, z: -100 } } },
    'bank': { name: '🏦 State Bank', pos: { x: 120, y: 20, z: 120, lookAt: { x: 100, y: 0, z: 100 } } },
    'farm': { name: '🌾 Smart Farm', pos: { x: -130, y: 20, z: -80, lookAt: { x: -150, y: 0, z: -100 } } },
    'event': { name: '🎪 Event Hall', pos: { x: 120, y: 20, z: 200, lookAt: { x: 100, y: 0, z: 180 } } },
    'gas': { name: '⛽ Gas Station', pos: { x: 200, y: 20, z: 120, lookAt: { x: 180, y: 0, z: 100 } } },
    'office': { name: '🏭 Sewage Co.', pos: { x: 200, y: 20, z: -80, lookAt: { x: 180, y: 0, z: -100 } } },
    'culture': { name: '🏛 Culture Center', pos: { x: -130, y: 20, z: 120, lookAt: { x: -150, y: 0, z: 100 } } },
    'powerCo': { name: '🔌 Power Company', pos: { x: -130, y: 20, z: 20, lookAt: { x: -150, y: 0, z: 0 } } },
    'scifi9': { name: '🛸 Sci-Fi 9', pos: { x: -160, y: 20, z: -120, lookAt: { x: -180, y: 0, z: -140 } } },
    'tower': { name: '🗼 Beautiful Tower', pos: { x: -160, y: 25, z: 20, lookAt: { x: -180, y: 0, z: 0 } } },
    'scifi10': { name: '🚀 Sci-Fi 10', pos: { x: -160, y: 20, z: 160, lookAt: { x: -180, y: 0, z: 140 } } },
    'traffic': { name: '🚦 AI Traffic Tower', pos: { x: 20, y: 25, z: 20, lookAt: { x: 0, y: 0, z: 0 } } },
    'power': { name: '⚡ Power Zone', pos: { x: -160, y: 25, z: 200, lookAt: { x: -180, y: 0, z: 180 } } },
    'filtration': { name: '💧 Filtration Zone', pos: { x: 200, y: 20, z: -160, lookAt: { x: 180, y: 0, z: -180 } } },
    'food': { name: '🍎 Food Zone', pos: { x: -160, y: 20, z: -160, lookAt: { x: -180, y: 0, z: -180 } } },
    'waste': { name: '♻️ Waste Zone', pos: { x: 200, y: 20, z: 200, lookAt: { x: 180, y: 0, z: 180 } } },
    'residential': { name: '🏘 Residential District', pos: { x: 200, y: 25, z: 20, lookAt: { x: 150, y: 0, z: 0 } } },
    'park1': { name: '🌳 Central Park', pos: { x: -40, y: 20, z: 80, lookAt: { x: -60, y: 0, z: 60 } } },
  }

  const goToLocation = (key) => {
    const loc = locations[key]
    if (loc) {
      setFocus(loc.pos)
      setState({ menuOpen: false })
    }
  }

  if (!menuOpen) {
    // Small menu button
    return (
      <button
        onClick={() => setState({ menuOpen: true })}
        style={{
          position: 'absolute', left: 16, top: 70, zIndex: 100,
          width: 44, height: 44, borderRadius: 10,
          background: 'rgba(5,10,18,0.9)', border: '1px solid rgba(34,207,255,0.5)',
          color: '#22cfff', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        ☰
      </button>
    )
  }

  return (
    <div style={{
      position: 'absolute', left: 0, top: 0, bottom: 0, width: 340,
      background: 'rgba(5,10,18,0.96)',
      borderRight: '2px solid rgba(34,207,255,0.4)',
      zIndex: 200, display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(14px)',
      boxShadow: '8px 0 32px rgba(0,0,0,0.6)',
      animation: 'slideIn 0.25s ease-out',
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(34,207,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#22cfff', letterSpacing: 1.5 }}>
            🏙 BSS WORLD
          </div>
          <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>
            Smart City Menu
          </div>
        </div>
        <button
          onClick={() => setState({ menuOpen: false })}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,80,80,0.15)',
            border: '1px solid rgba(255,100,100,0.5)',
            color: '#ff8a8a', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(34,207,255,0.15)' }}>
        {[
          { id: 'locations', label: '🏛 Places' },
          { id: 'controls', label: '🎛 Controls' },
          { id: 'info', label: 'ℹ Info' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '12px 8px',
              background: tab === t.id ? 'rgba(34,207,255,0.12)' : 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #22cfff' : '2px solid transparent',
              color: tab === t.id ? '#22cfff' : '#8fd8f0',
              fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, fontFamily: 'system-ui', color: '#e8f7ff' }}>

        {tab === 'locations' && (
          <>
            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
              🏛 Buildings
            </div>
            {['school', 'hospital', 'bank', 'farm', 'event', 'gas', 'office', 'culture', 'powerCo', 'scifi9', 'tower', 'scifi10'].map(k => (
              <MenuButton key={k} onClick={() => goToLocation(k)} label={locations[k].name} />
            ))}

            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 }}>
              ⚡ System Zones
            </div>
            {['traffic', 'power', 'filtration', 'food', 'waste'].map(k => (
              <MenuButton key={k} onClick={() => goToLocation(k)} label={locations[k].name} color="#ffcc22" />
            ))}

            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 }}>
              🏘 Other Areas
            </div>
            {['residential', 'park1'].map(k => (
              <MenuButton key={k} onClick={() => goToLocation(k)} label={locations[k].name} color="#2ecc71" />
            ))}
          </>
        )}

        {tab === 'controls' && (
          <>
            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              🌅 Time of Day
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {[
                { v: 'day', label: '☀️ Day' },
                { v: 'evening', label: '🌆 Eve' },
                { v: 'night', label: '🌙 Night' },
              ].map(t => (
                <button
                  key={t.v}
                  onClick={() => setTimeOfDay(t.v)}
                  style={{
                    flex: 1, padding: '10px 6px', borderRadius: 8,
                    background: timeOfDay === t.v ? 'rgba(34,207,255,0.25)' : 'rgba(34,207,255,0.05)',
                    border: timeOfDay === t.v ? '1.5px solid #22cfff' : '1.5px solid rgba(34,207,255,0.2)',
                    color: timeOfDay === t.v ? '#22cfff' : '#8fd8f0',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              🚗 Traffic Density
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {[
                { v: 'low', label: '🟢 Low' },
                { v: 'medium', label: '🟡 Med' },
                { v: 'high', label: '🔴 High' },
              ].map(t => (
                <button
                  key={t.v}
                  onClick={() => setTrafficDensity(t.v)}
                  style={{
                    flex: 1, padding: '10px 6px', borderRadius: 8,
                    background: trafficDensity === t.v ? 'rgba(34,207,255,0.25)' : 'rgba(34,207,255,0.05)',
                    border: trafficDensity === t.v ? '1.5px solid #22cfff' : '1.5px solid rgba(34,207,255,0.2)',
                    color: trafficDensity === t.v ? '#22cfff' : '#8fd8f0',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              💡 Street Lights
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              <button
                onClick={() => setStreetLightsOn(true)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  background: streetLightsOn ? 'rgba(46,204,113,0.3)' : 'rgba(46,204,113,0.06)',
                  border: '1.5px solid rgba(46,204,113,0.5)',
                  color: '#2ecc71', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ON
              </button>
              <button
                onClick={() => setStreetLightsOn(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  background: !streetLightsOn ? 'rgba(231,76,60,0.3)' : 'rgba(231,76,60,0.06)',
                  border: '1.5px solid rgba(231,76,60,0.5)',
                  color: '#e74c3c', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                OFF
              </button>
            </div>

            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              📷 Camera
            </div>
            <MenuButton 
              onClick={() => { setFocus({ x: 250, y: 200, z: 250, lookAt: { x: 0, y: 0, z: 0 } }); setState({ menuOpen: false }) }} 
              label="🌐 Overview" 
            />
            <MenuButton 
              onClick={() => { setFocus({ x: 0, y: 350, z: 100, lookAt: { x: 0, y: 0, z: 0 } }); setState({ menuOpen: false }) }} 
              label="🛰 Top Down" 
            />
          </>
        )}

        {tab === 'info' && (
          <>
            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
              About
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: '#b8e8ff', marginBottom: 16 }}>
              BSS World is a 3D smart city simulation with AI traffic control,
              renewable energy systems, water filtration, food production, and waste management.
            </div>
            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
              Features
            </div>
            <InfoLine icon="🚦" label="AI Traffic Control — Adaptive signals" />
            <InfoLine icon="⚡" label="Power Zone — Wind + Solar + Battery" />
            <InfoLine icon="💧" label="Filtration — 9-stage water flow" />
            <InfoLine icon="🍎" label="Food Production — Drones + fields" />
            <InfoLine icon="♻️" label="Waste — Recycling + Biogas" />
            <InfoLine icon="🏫" label="12 GLB Buildings" />
            <InfoLine icon="🏘" label="20+ Residential Houses" />
            <InfoLine icon="🌳" label="Parks + Parking Lots" />
            <div style={{ fontSize: 10, color: '#7fe3ff', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 }}>
              Controls
            </div>
            <div style={{ fontSize: 11, color: '#8fd8f0', lineHeight: 1.7 }}>
              • <strong>Drag</strong> to rotate<br />
              • <strong>Scroll</strong> to zoom<br />
              • <strong>Click buildings</strong> to focus<br />
              • <strong>Right-click drag</strong> to pan
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(34,207,255,0.15)',
        fontSize: 10,
        color: '#7fe3ff',
        textAlign: 'center',
        letterSpacing: 0.5,
      }}>
        © BSS WORLD • Smart City Simulation
      </div>
    </div>
  )
}

function MenuButton({ onClick, label, color = '#22cfff' }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 12px',
        marginBottom: 6,
        borderRadius: 8,
        background: 'rgba(34,207,255,0.06)',
        border: `1px solid ${color}30`,
        color: '#e8f7ff',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        e.target.style.background = `${color}25`
        e.target.style.borderColor = color
      }}
      onMouseLeave={e => {
        e.target.style.background = 'rgba(34,207,255,0.06)'
        e.target.style.borderColor = `${color}30`
      }}
    >
      {label}
    </button>
  )
}

function InfoLine({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 11, color: '#b8e8ff' }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span>{label}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TOP HUD — status pill + emergency banner
   ═══════════════════════════════════════════════════════════ */
function TopHUD() {
  const timeOfDay = useStore(s => s.timeOfDay)
  const trafficDensity = useStore(s => s.trafficDensity)
  const emergencyAlarm = useStore(s => s.emergencyAlarm)

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 16,
        zIndex: 50, pointerEvents: 'none',
      }}>
        <div style={{
          background: 'rgba(5,10,18,0.85)',
          border: '1px solid rgba(34,207,255,0.4)',
          borderRadius: 999, padding: '10px 22px',
          color: '#b8e8ff', fontSize: 12, fontFamily: 'system-ui',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: timeOfDay === 'night' ? '#8f8fff' : timeOfDay === 'evening' ? '#ff9944' : '#ffdd44',
            boxShadow: `0 0 10px ${timeOfDay === 'night' ? '#8f8fff' : timeOfDay === 'evening' ? '#ff9944' : '#ffdd44'}`,
          }} />
          <span style={{ fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {timeOfDay}
          </span>
          <span style={{ color: '#4a7a8a' }}>·</span>
          <span>🚗 {trafficDensity}</span>
        </div>
      </div>

      {emergencyAlarm && (
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 70,
          zIndex: 100,
          background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
          color: '#fff', padding: '14px 28px', borderRadius: 12,
          fontSize: 14, fontWeight: 700, fontFamily: 'system-ui',
          animation: 'pulse 0.5s infinite',
          boxShadow: '0 8px 32px rgba(231,76,60,0.5)',
        }}>
          🚨 EMERGENCY ALARM 🚨
        </div>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   CAMERA CONTROLLER
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
   MAIN APP
   ═══════════════════════════════════════════════════════════ */
export default function SmartCity3D() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#050a14' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; }
      `}</style>

      <TopHUD />
      <Menu />

      <Canvas 
        shadows 
        camera={{ position: [180, 150, 180], fov: 55, near: 0.5, far: 2000 }}
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
          minDistance={10}
          maxDistance={500}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 2, 0]}
        />
        <CameraController />
      </Canvas>

      {/* Bottom hint */}
      <div style={{
        position: 'absolute', left: 16, bottom: 16, zIndex: 50,
        background: 'rgba(5,10,18,0.85)',
        border: '1px solid rgba(34,207,255,0.3)',
        borderRadius: 10, padding: '10px 16px',
        color: '#b8e8ff', fontSize: 11, fontFamily: 'system-ui',
        backdropFilter: 'blur(10px)',
        maxWidth: 400,
      }}>
        🎮 <strong>Drag</strong> rotate · <strong>Scroll</strong> zoom · <strong>Click buildings</strong> focus · <strong>☰ Menu</strong> left
      </div>
    </div>
  )
}
