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
   PCB BASE
========================================================= */

function PCB() {
  return (
    <group>
      {/* Main board */}
      <RoundedBox
        args={[8.5, 0.28, 4.8]}
        radius={0.18}
        smoothness={4}
        position={[0, -0.35, 0]}
      >
        <meshStandardMaterial
          color="#050a0d"
          roughness={0.72}
          metalness={0.35}
        />
      </RoundedBox>

      {/* Thin blue board edge */}
      <RoundedBox
        args={[8.58, 0.08, 4.88]}
        radius={0.2}
        smoothness={4}
        position={[0, -0.18, 0]}
      >
        <meshStandardMaterial
          color="#0878c9"
          emissive="#0055aa"
          emissiveIntensity={0.8}
          roughness={0.5}
          metalness={0.65}
        />
      </RoundedBox>

      {/* Inner board surface */}
      <RoundedBox
        args={[8.25, 0.08, 4.55]}
        radius={0.16}
        smoothness={4}
        position={[0, -0.18, 0]}
      >
        <meshStandardMaterial
          color="#071217"
          roughness={0.8}
          metalness={0.25}
        />
      </RoundedBox>
    </group>
  );
}

/* =========================================================
   CIRCUIT TRACE
========================================================= */

interface TraceProps {
  points: [number, number][];
}

function Trace({ points }: TraceProps) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, -0.08, z))
  );

  const geometry = new THREE.TubeGeometry(
    curve,
    Math.max(8, points.length * 5),
    0.025,
    5,
    false
  );

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#168fe5"
          emissive="#087bd0"
          emissiveIntensity={1.8}
          metalness={0.4}
          roughness={0.4}
        />
      </mesh>

      {points.map(([x, z], index) => (
        <mesh key={index} position={[x, -0.015, z]}>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshStandardMaterial
            color="#9ee8ff"
            emissive="#37bfff"
            emissiveIntensity={4}
          />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================
   CIRCUIT TRACES
========================================================= */

function CircuitTraces() {
  const traces: [number, number][][] = [
    [
      [-3.8, -1.7],
      [-3.1, -1.7],
      [-2.7, -1.25],
      [-1.8, -1.25],
    ],

    [
      [-3.9, 1.3],
      [-3.2, 1.3],
      [-2.8, 0.85],
      [-2.1, 0.85],
    ],

    [
      [3.9, -1.5],
      [3.15, -1.5],
      [2.8, -1.1],
      [2.0, -1.1],
    ],

    [
      [3.95, 1.45],
      [3.25, 1.45],
      [2.8, 0.9],
      [2.0, 0.9],
    ],

    [
      [-1.8, 1.9],
      [-1.25, 1.9],
      [-0.9, 1.45],
      [0, 1.45],
    ],

    [
      [0.2, -1.9],
      [0.85, -1.9],
      [1.2, -1.5],
      [2.0, -1.5],
    ],
  ];

  return (
    <group>
      {traces.map((points, index) => (
        <Trace key={index} points={points} />
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
              color="#7b8b91"
              metalness={0.9}
              roughness={0.25}
            />
          </mesh>

          <mesh position={[x, 0.02, -0.42]}>
            <boxGeometry args={[0.06, 0.07, 0.28]} />
            <meshStandardMaterial
              color="#7b8b91"
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
              color="#7b8b91"
              metalness={0.9}
              roughness={0.25}
            />
          </mesh>

          <mesh position={[-0.47, 0.02, z]}>
            <boxGeometry args={[0.28, 0.07, 0.06]} />
            <meshStandardMaterial
              color="#7b8b91"
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
      <Text
        position={[0, 0.23, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.52}
        maxWidth={3}
        anchorX="center"
        anchorY="middle"
        color="#b9efff"
        outlineWidth={0.025}
        outlineColor="#087fc4"
      >
        {text.toUpperCase()}
      </Text>

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
          color="#aeb9bd"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Leads */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 6]} />
        <meshStandardMaterial
          color="#87969c"
          metalness={0.8}
        />
      </mesh>

      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 6]} />
        <meshStandardMaterial
          color="#87969c"
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
    <group>
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