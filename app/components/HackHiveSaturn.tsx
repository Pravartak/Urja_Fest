'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

function SaturnScene() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.z += delta * 0.08
    groupRef.current.rotation.y += delta * 0.12
  })

  return (
    <group ref={groupRef} rotation={[0.28, -0.45, -0.2]}>
      <group scale={[1.7, 0.72, 1]}>
        <mesh rotation={[0.15, 0, 0]}>
          <torusGeometry args={[0.68, 0.07, 12, 96]} />
          <meshStandardMaterial color="#f2ca78" roughness={0.62} metalness={0.28} transparent opacity={0.9} />
        </mesh>
        <mesh rotation={[0.15, 0, 0]}>
          <torusGeometry args={[0.84, 0.025, 10, 96]} />
          <meshStandardMaterial color="#d98d68" roughness={0.7} metalness={0.2} transparent opacity={0.72} />
        </mesh>
      </group>
    </group>
  )
}

export default function HackHiveSaturn() {
  return (
    <span className="hackhive-saturn" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 2.4], fov: 38 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={1.6} />
        <directionalLight position={[2, 2, 3]} intensity={3.5} color="#fff0ca" />
        <pointLight position={[-2, -1, 2]} intensity={2} color="#a970ff" />
        <SaturnScene />
      </Canvas>
    </span>
  )
}
