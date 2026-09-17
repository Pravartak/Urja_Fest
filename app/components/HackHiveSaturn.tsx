"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function SaturnScene() {
	const groupRef = useRef<THREE.Group>(null);
	const [isTargetHovered, setIsTargetHovered] = useState(false);

	const baseRotX = 1.7;
	const hoverTiltX = 0;

	const baseRotY = 0.3;
	const hoverTiltY = -0.1;

	useEffect(() => {
		const handleCustomEvent = (e: Event) => {
			const event = e as CustomEvent<{ isHovered: boolean }>;
			setIsTargetHovered(event.detail.isHovered);
		};

		window.addEventListener("targetHover", handleCustomEvent);

		return () => window.removeEventListener("targetHover", handleCustomEvent);
	}, []);

	useFrame((_, delta) => {
		if (!groupRef.current) return;
		groupRef.current.rotation.z += delta * 0.1;

		const targetX = isTargetHovered ? hoverTiltX + baseRotX : baseRotX;
		groupRef.current.rotation.x = THREE.MathUtils.lerp(
			groupRef.current.rotation.x,
			targetX,
			delta * 6,
		);

		const targetY = isTargetHovered ? hoverTiltY + baseRotY : baseRotY;
		groupRef.current.rotation.y = THREE.MathUtils.lerp(
			groupRef.current.rotation.y,
			targetY,
			delta * 6,
		);
	});

	return (
		<group
			ref={groupRef}
			rotation={[baseRotX, baseRotY, 0]}
			scale={[1.5, 1.5, 0.5]}>
			<mesh>
				<torusGeometry args={[0.7, 0.045, 16, 128]} />
				<meshStandardMaterial
					color="#ffe0a0"
					roughness={0.42}
					metalness={0.42}
					transparent
					opacity={0.92}
				/>
			</mesh>
			<mesh>
				<torusGeometry args={[0.78, 0.028, 12, 128]} />
				<meshStandardMaterial
					color="#b87561"
					roughness={0.65}
					metalness={0.3}
					transparent
					opacity={0.7}
				/>
			</mesh>
			<mesh>
				<torusGeometry args={[0.88, 0.018, 10, 128]} />
				<meshStandardMaterial
					color="#f3c982"
					roughness={0.5}
					metalness={0.36}
					transparent
					opacity={0.62}
				/>
			</mesh>
		</group>
	);
}

export default function HackHiveSaturn() {
	return (
		<span className="hackhive-saturn" aria-hidden="true">
			<Canvas
				camera={{ position: [0, 0, 2.4], fov: 38 }}
				dpr={[1, 2]}
				gl={{ alpha: true, antialias: true }}>
				<ambientLight intensity={1.6} />
				<directionalLight
					position={[2, 2, 3]}
					intensity={3.5}
					color="#fff0ca"
				/>
				<pointLight position={[-2, -1, 2]} intensity={2} color="#a970ff" />
				<SaturnScene />
			</Canvas>
		</span>
	);
}
