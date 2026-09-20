"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, RoundedBox, Text } from "@react-three/drei";

interface CircuitBoardHeaderProps {
  displayText?: string;
}

type Point = [number, number];

const traces: Point[][] = [
  [[-4.1, 1.7], [-3.2, 1.7], [-2.7, 1.2], [-2.1, 1.2]],
  [[-4.1, 0.9], [-3.4, 0.9], [-3.0, 0.5], [-2.2, 0.5]],
  [[-4.1, -1.6], [-3.3, -1.6], [-2.8, -1.15], [-2.3, -1.15]],
  [[4.1, 1.55], [3.25, 1.55], [2.75, 1.05], [2.25, 1.05]],
  [[4.1, -0.6], [3.35, -0.6], [2.85, -0.15], [2.25, -0.15]],
  [[-1.5, -1.85], [-1.5, -1.25], [-1.15, -0.9], [-0.55, -0.9]],
  [[1.4, -1.85], [1.4, -1.25], [1.05, -0.9], [0.55, -0.9]],
];

function Trace({ points }: { points: Point[] }) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0.095, z)),
  );
  return (
    <group>
      <mesh geometry={new THREE.TubeGeometry(curve, 24, 0.026, 6, false)}>
        <meshStandardMaterial color="#66c7ff" emissive="#1688d4" emissiveIntensity={1.4} metalness={0.8} roughness={0.28} />
      </mesh>
      {points.slice(0, -1).map(([x, z], index) => (
        <mesh key={index} position={[x, 0.115, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.025, 12]} />
          <meshStandardMaterial color="#dff5ff" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function Chip({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[0.78, 0.12, 0.62]} radius={0.05} smoothness={3}>
        <meshStandardMaterial color="#05080b" metalness={0.75} roughness={0.32} />
      </RoundedBox>
      <mesh position={[0, 0.072, 0]}>
        <boxGeometry args={[0.4, 0.018, 0.3]} />
        <meshStandardMaterial color="#121d25" emissive="#07538a" emissiveIntensity={0.7} />
      </mesh>
      {[-0.24, -0.08, 0.08, 0.24].flatMap((x) => [
        <mesh key={`${x}-a`} position={[x, 0.015, 0.39]}><boxGeometry args={[0.055, 0.05, 0.24]} /><meshStandardMaterial color="#f7fbff" metalness={0.95} roughness={0.18} /></mesh>,
        <mesh key={`${x}-b`} position={[x, 0.015, -0.39]}><boxGeometry args={[0.055, 0.05, 0.24]} /><meshStandardMaterial color="#f7fbff" metalness={0.95} roughness={0.18} /></mesh>,
      ])}
    </group>
  );
}

function Resistor({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh><boxGeometry args={[0.58, 0.08, 0.2]} /><meshStandardMaterial color="#f4f7f8" roughness={0.4} /></mesh>
      <mesh position={[-0.13, 0.045, 0]}><boxGeometry args={[0.055, 0.018, 0.21]} /><meshStandardMaterial color="#1689d4" /></mesh>
      <mesh position={[0.08, 0.045, 0]}><boxGeometry args={[0.055, 0.018, 0.21]} /><meshStandardMaterial color="#0b1a27" /></mesh>
      <mesh position={[0.28, 0, 0]}><boxGeometry args={[0.18, 0.035, 0.08]} /><meshStandardMaterial color="#dceeff" metalness={0.85} /></mesh>
      <mesh position={[-0.28, 0, 0]}><boxGeometry args={[0.18, 0.035, 0.08]} /><meshStandardMaterial color="#dceeff" metalness={0.85} /></mesh>
    </group>
  );
}

function Display({ displayText }: { displayText: string }) {
  return (
    <group position={[0, 0.18, 0.15]}>
      <RoundedBox args={[4.8, 0.14, 1.65]} radius={0.08} smoothness={3}>
        <meshStandardMaterial color="#06090c" metalness={0.7} roughness={0.25} />
      </RoundedBox>
      <mesh position={[0, 0.085, 0]}>
        <boxGeometry args={[4.35, 0.025, 1.22]} />
        <meshStandardMaterial color="#071724" emissive="#063d68" emissiveIntensity={0.8} roughness={0.22} />
      </mesh>
      <Text position={[0, 0.12, 0.02]} rotation={[-Math.PI / 2, 0, 0]} font="/fonts/Geist_Bold.json" fontSize={0.65} maxWidth={4} color="#eaf8ff" anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor="#168bd2">
        {displayText.toUpperCase()}
      </Text>
      <mesh position={[-2.12, 0.12, -0.48]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.055, 12]} /><meshStandardMaterial color="#66c7ff" emissive="#168bd4" emissiveIntensity={2} /></mesh>
      <mesh position={[2.12, 0.12, -0.48]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.055, 12]} /><meshStandardMaterial color="#66c7ff" emissive="#168bd4" emissiveIntensity={2} /></mesh>
    </group>
  );
}

function PCBScene({ displayText }: { displayText: string }) {
  return (
    <group>
      <RoundedBox args={[9.2, 0.08, 4.4]} radius={0.12} smoothness={4}>
        <meshStandardMaterial color="#0a1016" roughness={0.64} metalness={0.32} />
      </RoundedBox>
      <mesh position={[0, 0.047, 0]}>
        <boxGeometry args={[8.95, 0.018, 4.15]} />
        <meshStandardMaterial color="#101b24" roughness={0.7} metalness={0.18} />
      </mesh>
      {traces.map((points, index) => <Trace key={index} points={points} />)}
      <Display displayText={displayText} />
      <Chip position={[-3.25, 0.14, 1.35]} scale={0.85} />
      <Chip position={[3.25, 0.14, 0.95]} scale={0.78} />
      <Chip position={[-2.95, 0.14, -1.45]} scale={0.72} />
      <Chip position={[2.95, 0.14, -1.15]} scale={0.68} />
      <Resistor position={[-1.85, 0.14, 1.82]} rotation={0.12} />
      <Resistor position={[1.85, 0.14, 1.72]} rotation={-0.12} />
      <Resistor position={[-0.95, 0.14, -1.55]} rotation={0.08} />
      <Resistor position={[0.95, 0.14, -1.55]} rotation={-0.08} />
      {[[ -4.25, 1.85], [4.25, 1.85], [-4.25, -1.85], [4.25, -1.85]].map(([x, z], index) => (
        <mesh key={index} position={[x, 0.1, z]} rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[0.12, 0.17, 16]} /><meshStandardMaterial color="#dff5ff" metalness={0.95} roughness={0.18} /></mesh>
      ))}
    </group>
  );
}

export default function CircuitBoardHeader({ displayText = "REGISTER" }: CircuitBoardHeaderProps) {
  return (
    <div style={{ width: "100%", height: "250px", position: "relative" }}>
      <Canvas orthographic camera={{ position: [0, 0, 10], zoom: 74 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.25} />
        <directionalLight position={[-3, 5, 6]} intensity={2.2} color="#ffffff" />
        <pointLight position={[0, 1, 4]} intensity={4} distance={10} color="#2b9fe8" />
        <PCBScene displayText={displayText} />
        <Environment preset="studio" />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
            </Canvas>
    </div>
  );
}

export { CircuitBoardHeader };
