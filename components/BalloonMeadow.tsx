"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Group, Plane, Vector3 } from "three";
import { procedureralTerrainWindSystem } from "./ProceduralTerrainScene";

interface BalloonMeadowProps {
  position: [number, number, number];
  color: string;
  label: string;
  onClick: () => void;
  scaleMultiplier?: number;
  speedMultiplier?: number;
  windInfluence?: number; // How much wind affects the balloon (0-1)
}

/**
 * Meadow version of balloon that responds to wind forces
 * Drifts with wind but elastically returns to origin
 */
export function BalloonMeadow({
  position,
  color,
  label,
  onClick,
  scaleMultiplier = 1,
  speedMultiplier = 1,
  windInfluence = 0.8,
}: BalloonMeadowProps) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  const { camera, gl } = useThree();
  const origin = useMemo(() => new Vector3(...position), [position]);
  const dragPlane = useRef(new Plane());
  const dragOffset = useRef(new Vector3());
  const dragStart = useRef(new Vector3());
  const tmpHit = useRef(new Vector3());
  const tmpDir = useRef(new Vector3());
  const hasDragged = useRef(false);

  // Current wind-affected offset from origin
  const windOffset = useRef(new Vector3());

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // If dragging, don't animate
    if (dragging) return;

    // Get current wind from the wind system
    const windStrength = procedureralTerrainWindSystem.getStrength();
    const windDir = procedureralTerrainWindSystem.getDirection();

    // Calculate wind push (proportional to height above ground and wind strength)
    const heightFactor = Math.max(0, (position[1] - (-3)) / 20); // normalized height
    const windForce = windStrength * windInfluence * heightFactor;

    // Wind offset drifts balloon in wind direction
    windOffset.current.copy(windDir).multiplyScalar(windForce * 3);

    // Target position = origin + wind offset + gentle bob/sway
    const t = state.clock.getElapsedTime() * speedMultiplier;
    const bob = Math.sin(t * 1.1 + origin.x * 2) * 0.3;
    const sway = Math.cos(t * 0.7 + origin.y) * 0.12;

    const targetX = origin.x + sway + windOffset.current.x;
    const targetY = origin.y + bob + windOffset.current.y;
    const targetZ = origin.z + windOffset.current.z;

    // Spring back elastically
    const k = Math.min(1, delta * 3.2);
    const p = groupRef.current.position;
    p.x += (targetX - p.x) * k;
    p.y += (targetY - p.y) * k;
    p.z += (targetZ - p.z) * k;
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!groupRef.current) return;
    e.stopPropagation();
    gl.domElement.setPointerCapture(e.pointerId);
    camera.getWorldDirection(tmpDir.current);
    tmpDir.current.negate();
    dragPlane.current.setFromNormalAndCoplanarPoint(
      tmpDir.current,
      groupRef.current.position
    );
    if (e.ray.intersectPlane(dragPlane.current, dragStart.current))
      dragOffset.current.copy(groupRef.current.position).sub(dragStart.current);
    else dragOffset.current.set(0, 0, 0);
    hasDragged.current = false;
    setDragging(true);
    document.body.style.cursor = "grabbing";
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging || !groupRef.current) return;
    e.stopPropagation();
    const hit = e.ray.intersectPlane(dragPlane.current, tmpHit.current);
    if (!hit) return;
    if (!hasDragged.current && dragStart.current.distanceTo(tmpHit.current) > 0.1)
      hasDragged.current = true;
    groupRef.current.position.copy(tmpHit.current).add(dragOffset.current);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    e.stopPropagation();
    gl.domElement.releasePointerCapture(e.pointerId);
    setDragging(false);
    document.body.style.cursor = hovered ? "grab" : "auto";
    if (!hasDragged.current) onClick();
  };

  const s = 1.65 * scaleMultiplier;

  return (
    <group ref={groupRef} position={position}>
      {/* Body — handles pointer events */}
      <mesh
        scale={hovered && !dragging ? 1.06 : 1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = dragging ? "grabbing" : "grab";
        }}
        onPointerOut={() => {
          if (!dragging) {
            setHovered(false);
            document.body.style.cursor = "auto";
          }
        }}
      >
        <sphereGeometry args={[s, 64, 64]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.02}
          metalness={0.35}
          clearcoat={1}
          clearcoatRoughness={0.01}
          reflectivity={1}
          envMapIntensity={2.4}
          emissive={color}
          emissiveIntensity={hovered ? 0.35 : 0.1}
        />
      </mesh>

      {/* Knot */}
      <mesh position={[0, -(s + 0.15), 0]}>
        <coneGeometry args={[s * 0.18, s * 0.33, 8]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
      </mesh>

      {/* String */}
      <mesh position={[0, -(s + 0.15 + s * 0.97), 0]}>
        <cylinderGeometry args={[0.022, 0.022, s * 1.94, 6]} />
        <meshBasicMaterial color="#e2e8f0" />
      </mesh>

      {/* Label */}
      <Html position={[0, s + 0.9, 0]} center distanceFactor={8} pointerEvents="none">
        <div className="pointer-events-none select-none text-white font-bold text-lg whitespace-nowrap drop-shadow-[0_2px_10px_rgba(0,0,0,1)] tracking-wider uppercase">
          {label}
        </div>
      </Html>
    </group>
  );
}
