'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

function SaturnScene() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.x += delta * 0.14
  })

  return (
    <group ref={groupRef} rotation={[0.2, 0, 0]}>
      <group scale={[1.78, 0.64, 1]}>
        <mesh>
          <torusGeometry args={[0.7, 0.045, 16, 128]} />
          <meshStandardMaterial color="#ffe0a0" roughness={0.42} metalness={0.42} transparent opacity={0.92} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.78, 0.028, 12, 128]} />
          <meshStandardMaterial color="#b87561" roughness={0.65} metalness={0.3} transparent opacity={0.7} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.88, 0.018, 10, 128]} />
          <meshStandardMaterial color="#f3c982" roughness={0.5} metalness={0.36} transparent opacity={0.62} />
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
