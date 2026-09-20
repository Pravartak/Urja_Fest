"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  Html,
  OrbitControls,
  RoundedBox,
  Text,
} from "@react-three/drei";

/* =========================================================
   Types
========================================================= */

interface CircuitBoardHeaderProps {
  displayText?: string;
}

/* =========================================================
   PCB BASE - Realistic Circuit Board
========================================================= */

function PCB() {
  return (
    <group>
      {/* Main board base - Dark substrate */}
      <RoundedBox
        args={[9, 0.32, 5.2]}
        radius={0.2}
        smoothness={4}
        position={[0, -0.4, 0]}
      >
        <meshStandardMaterial
          color="#0a0e12"
          roughness={0.78}
          metalness={0.2}
        />
      </RoundedBox>

      {/* PCB rim - Light blue accent */}
      <RoundedBox
        args={[9.1, 0.12, 5.3]}
        radius={0.22}
        smoothness={4}
        position={[0, -0.08, 0]}
      >
        <meshStandardMaterial
          color="#add8ff"
          roughness={0.6}
          metalness={0.4}
        />
      </RoundedBox>

      {/* Copper layer - Main surface */}
      <RoundedBox
        args={[8.8, 0.06, 5.0]}
        radius={0.18}
        smoothness={4}
        position={[0, 0.02, 0]}
      >
        <meshStandardMaterial
          color="#0f1923"
          emissive="#0a3d5c"
          emissiveIntensity={0.4}
          roughness={0.65}
          metalness={0.35}
        />
      </RoundedBox>

      {/* Mounting holes */}
      {[
        [-3.8, -0.2, -2.0],
        [3.8, -0.2, -2.0],
        [-3.8, -0.2, 2.0],
        [3.8, -0.2, 2.0],
      ].map((pos, i) => (
        <mesh key={`hole-${i}`} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.18, 0.18, 0.35, 12]} />
          <meshStandardMaterial color="#050a0d" metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================
   CIRCUIT TRACE - Multiple layer traces
========================================================= */

interface TraceProps {
  points: [number, number][];
  width?: number;
  glowColor?: string;
}

function Trace({ points, width = 0.022, glowColor = "#147fcc" }: TraceProps) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0.05, z))
  );

  const geometry = new THREE.TubeGeometry(
    curve,
    Math.max(12, points.length * 6),
    width,
    6,
    false
  );

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#1db8ff"
          emissive={glowColor}
          emissiveIntensity={2}
          metalness={0.5}
          roughness={0.35}
          toneMapped={false}
        />
      </mesh>

      {/* Via connections at endpoints */}
      {[points[0], points[points.length - 1]].map((point, idx) => (
        <mesh key={`via-${idx}`} position={[point[0], 0.07, point[1]]}>
          <cylinderGeometry args={[0.035, 0.035, 0.04, 8]} />
          <meshStandardMaterial
            color="#add8ff"
            emissive="#87ceeb"
            emissiveIntensity={2}
            metalness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================
   CIRCUIT TRACES - Organized layout
========================================================= */

function CircuitTraces() {
  const mainTraces: [number, number][][] = [
    // Top-left vertical trace
    [
      [-4.0, -2.0],
      [-4.0, -1.0],
      [-3.5, -0.5],
      [-2.8, 0.2],
    ],
    // Top-right vertical trace
    [
      [4.0, -2.0],
      [4.0, -1.0],
      [3.5, -0.5],
      [2.8, 0.2],
    ],
    // Bottom left diagonal
    [
      [-4.2, 1.8],
      [-3.2, 1.5],
      [-2.0, 1.2],
      [-1.0, 0.5],
    ],
    // Bottom right diagonal
    [
      [4.2, 1.8],
      [3.2, 1.5],
      [2.0, 1.2],
      [1.0, 0.5],
    ],
    // Center cross horizontal
    [
      [-2.5, 0.0],
      [-1.0, 0.1],
      [1.0, 0.1],
      [2.5, 0.0],
    ],
    // Center vertical connector
    [
      [0.0, -1.5],
      [-0.2, -0.5],
      [-0.1, 0.5],
      [0.1, 1.5],
    ],
    // Additional complex trace
    [
      [-3.0, 1.8],
      [-2.0, 1.5],
      [-1.0, 1.0],
      [0.5, 0.8],
      [2.0, 0.5],
    ],
  ];

  return (
    <group>
      {mainTraces.map((points, index) => (
        <Trace 
          key={index} 
          points={points}
          glowColor={index % 2 === 0 ? "#0878c9" : "#147fcc"}
        />
      ))}
    </group>
  );
}

/* =========================================================
   CHIP
========================================================= */

interface ChipProps {
  position: [number, number, number];
  scale?: number;
}

function Chip({ position, scale = 1 }: ChipProps) {
  return (
    <group position={position} scale={scale}>
      {/* Chip body */}
      <RoundedBox
        args={[0.8, 0.15, 0.7]}
        radius={0.06}
        smoothness={3}
      >
        <meshStandardMaterial
          color="#111b20"
          roughness={0.55}
          metalness={0.65}
        />
      </RoundedBox>

      {/* Chip center */}
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.42, 0.035, 0.32]} />
        <meshStandardMaterial
          color="#061015"
          emissive="#064d78"
          emissiveIntensity={1}
        />
      </mesh>

      {/* Pins */}
      {[-0.24, -0.08, 0.08, 0.24].map((x) => (
        <group key={`x-${x}`}>
          <mesh position={[x, 0.02, 0.42]}>
            <boxGeometry args={[0.06, 0.07, 0.28]} />
            <meshStandardMaterial
              color="#ffffff"
              metalness={0.9}
              roughness={0.25}
            />
          </mesh>

          <mesh position={[x, 0.02, -0.42]}>
            <boxGeometry args={[0.06, 0.07, 0.28]} />
            <meshStandardMaterial
              color="#ffffff"
              metalness={0.9}
              roughness={0.25}
            />
          </mesh>
        </group>
      ))}

      {[-0.22, -0.07, 0.08, 0.23].map((z) => (
        <group key={`z-${z}`}>
          <mesh position={[0.47, 0.02, z]}>
            <boxGeometry args={[0.28, 0.07, 0.06]} />
            <meshStandardMaterial
              color="#ffffff"
              metalness={0.9}
              roughness={0.25}
            />
          </mesh>

          <mesh position={[-0.47, 0.02, z]}>
            <boxGeometry args={[0.28, 0.07, 0.06]} />
            <meshStandardMaterial
              color="#ffffff"
              metalness={0.9}
              roughness={0.25}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* =========================================================
   LED
========================================================= */

function LED({
  position,
  color = "#29bfff",
}: {
  position: [number, number, number];
  color?: string;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;

    const pulse =
      1.5 + Math.sin(clock.getElapsedTime() * 4.5) * 0.7;

    const material = ref.current.material as THREE.MeshStandardMaterial;

    material.emissiveIntensity = pulse;
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.075, 12, 12]} />

      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        toneMapped={false}
      />
    </mesh>
  );
}

/* =========================================================
   DISPLAY
========================================================= */

function Display({ text }: { text: string }) {
  return (
    <group position={[0, 0.12, 0]}>
      {/* Display housing */}
      <RoundedBox
        args={[3.9, 0.22, 1.55]}
        radius={0.12}
        smoothness={5}
      >
        <meshStandardMaterial
          color="#10191e"
          roughness={0.35}
          metalness={0.75}
        />
      </RoundedBox>

      {/* Blue outer frame */}
      <RoundedBox
        args={[3.55, 0.08, 1.2]}
        radius={0.08}
        smoothness={4}
        position={[0, 0.13, 0]}
      >
        <meshStandardMaterial
          color="#06344e"
          emissive="#0879b8"
          emissiveIntensity={1.3}
          roughness={0.35}
          metalness={0.5}
        />
      </RoundedBox>

      {/* Screen */}
      <RoundedBox
        args={[3.35, 0.045, 1.02]}
        radius={0.06}
        smoothness={4}
        position={[0, 0.18, 0]}
      >
        <meshStandardMaterial
          color="#02090d"
          emissive="#062d45"
          emissiveIntensity={1.2}
          roughness={0.35}
        />
      </RoundedBox>

      {/* Display text */}
      <Html
        center
        position={[0, 0.3, 0]}
        distanceFactor={5}
        zIndexRange={[10, 0]}
      >
        <div className="whitespace-nowrap font-mono text-[26px] font-bold tracking-[0.18em] text-[#b9efff] drop-shadow-[0_0_8px_#087fc4]">
          {text.toUpperCase()}
        </div>
      </Html>

      {/* Tiny display LEDs */}
      <LED position={[-1.55, 0.25, -0.55]} />
      <LED position={[1.55, 0.25, -0.55]} color="#167fff" />
    </group>
  );
}

/* =========================================================
   RESISTOR
========================================================= */

function Resistor({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Body */}
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, 0.55, 10]} />
        <meshStandardMaterial
          color="#f5fbff"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Leads */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 6]} />
        <meshStandardMaterial
          color="#add8ff"
          metalness={0.8}
        />
      </mesh>

      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 6]} />
        <meshStandardMaterial
          color="#add8ff"
          metalness={0.8}
        />
      </mesh>

      {/* Bands */}
      {[-0.13, 0, 0.13].map((y, index) => (
        <mesh key={index} position={[0, y, 0]}>
          <torusGeometry args={[0.122, 0.018, 6, 12]} />
          <meshStandardMaterial
            color="#168bd0"
            emissive="#0872ae"
            emissiveIntensity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================
   BOARD CONTENT
========================================================= */

function BoardContents({ displayText }: { displayText: string }) {
  return (
    <group position={[0, 0.14, 0]}>
      <CircuitTraces />

      {/* Chips */}
      <Chip position={[-2.9, 0, 1.35]} scale={0.8} />
      <Chip position={[2.9, 0, 1.35]} scale={0.8} />
      <Chip position={[-2.9, 0, -1.25]} scale={0.72} />
      <Chip position={[2.9, 0, -1.25]} scale={0.72} />

      {/* Resistors */}
      <Resistor
        position={[-1.8, 0.02, 1.8]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      <Resistor
        position={[1.75, 0.02, 1.75]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* LEDs */}
      <LED position={[-3.65, 0.08, -0.4]} />
      <LED position={[3.65, 0.08, -0.35]} color="#218cff" />

      {/* Main display */}
      <Display text={displayText} />
    </group>
  );
}

/* =========================================================
   WHOLE BOARD
========================================================= */

function CircuitBoard({ displayText }: { displayText: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ pointer }) => {
    if (!groupRef.current) return;

    const targetRotationY = pointer.x * 0.08;
    const targetRotationX = -pointer.y * 0.05;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotationY,
      0.05
    );

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotationX,
      0.05
    );
  });

  return (
    <group ref={groupRef} rotation={[-0.08, 0, 0]}>
      <PCB />

      <Float
        speed={1.2}
        rotationIntensity={0.05}
        floatIntensity={0.12}
      >
        <BoardContents displayText={displayText} />
      </Float>
    </group>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CircuitBoardHeader({
  displayText = "REGISTER",
}: CircuitBoardHeaderProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "430px",
        position: "relative",
      }}
    >
      <Canvas
        camera={{
          position: [0, 5.7, 7.5],
          fov: 42,
        }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <ambientLight intensity={0.35} />

        <directionalLight
          position={[3, 6, 4]}
          intensity={2}
        />

        <pointLight
          position={[0, 2, 1]}
          color="#149ee8"
          intensity={25}
          distance={8}
        />

        <CircuitBoard displayText={displayText} />

        <Environment preset="night" />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
}
