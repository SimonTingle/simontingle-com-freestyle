"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  MeshReflectorMaterial,
  Float,
  Html,
  Environment,
} from "@react-three/drei";
import { BufferGeometry, BufferAttribute, Color } from "three";
import { useRouter } from "next/navigation";

// Fractal Brownian Motion using layered trig — gives rocky, ridged terrain
function fbm(x: number, z: number): number {
  let value = 0;
  let amp = 1;
  let freq = 0.08;
  for (let i = 0; i < 6; i++) {
    value +=
      amp *
      (Math.sin(x * freq + Math.cos(z * freq * 0.7) * 1.3) *
        Math.cos(z * freq * 0.95) +
        Math.sin(x * freq * 1.7 + z * freq * 1.1) * 0.5);
    amp *= 0.5;
    freq *= 2.05;
  }
  return value;
}

// Creates a ridge centered at centerX, falling off with distance
function ridgeHeight(
  x: number,
  z: number,
  centerX: number,
  maxHeight: number,
  width: number
): number {
  const dist = Math.abs(x - centerX);
  let falloff = Math.max(0, 1 - dist / width);
  // smoothstep
  falloff = falloff * falloff * (3 - 2 * falloff);

  const noise = fbm(x, z);
  const rocky = Math.abs(noise) * 1.2 + noise * 0.3;

  return falloff * (maxHeight + rocky * 5);
}

function Mountains() {
  const { geometry } = useMemo(() => {
    const width = 160;
    const depth = 240;
    const widthSegments = 140;
    const depthSegments = 180;

    const vertCount = (widthSegments + 1) * (depthSegments + 1);
    const positions = new Float32Array(vertCount * 3);
    const colors = new Float32Array(vertCount * 3);

    // Warm sunset palette for vertex colors
    const darkValley = new Color("#1a0d08"); // near-black in valleys
    const midSlope = new Color("#5a2a14"); // warm dark brown
    const litRock = new Color("#c85820"); // orange rim-lit rock
    const peakGlow = new Color("#ffaa55"); // bright sunset kiss on peaks

    let idx = 0;
    for (let z = 0; z <= depthSegments; z++) {
      for (let x = 0; x <= widthSegments; x++) {
        const u = x / widthSegments;
        const v = z / depthSegments;

        const worldX = u * width - width / 2;
        // Push geometry forward so mountains extend into distance behind camera look direction
        const worldZ = v * depth - depth * 0.85;

        // Two ridges flanking the central valley
        const leftRidge = ridgeHeight(worldX, worldZ, -26, 16, 24);
        const rightRidge = ridgeHeight(worldX, worldZ, 26, 16, 24);
        // Distant back ridge
        const backMask = Math.max(0, (-worldZ - 80) / 60);
        const backRidge = backMask * (8 + Math.abs(fbm(worldX * 0.5, worldZ * 0.3)) * 5);

        let height = Math.max(leftRidge, rightRidge, backRidge);
        // Dip the central valley floor below water level so water fills it
        if (Math.abs(worldX) < 12 && Math.abs(height) < 0.5) {
          height = -2;
        } else {
          height -= 1.5;
        }

        positions[idx * 3] = worldX;
        positions[idx * 3 + 1] = height;
        positions[idx * 3 + 2] = worldZ;

        // Vertex color based on height + east-facing slope (for warm rim light feel)
        const normalizedHeight = Math.min(1, Math.max(0, (height + 2) / 18));
        const c = new Color();
        if (normalizedHeight < 0.15) {
          c.copy(darkValley);
        } else if (normalizedHeight < 0.45) {
          c.copy(darkValley).lerp(midSlope, (normalizedHeight - 0.15) / 0.3);
        } else if (normalizedHeight < 0.75) {
          c.copy(midSlope).lerp(litRock, (normalizedHeight - 0.45) / 0.3);
        } else {
          c.copy(litRock).lerp(peakGlow, (normalizedHeight - 0.75) / 0.25);
        }

        colors[idx * 3] = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;

        idx++;
      }
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.setAttribute("color", new BufferAttribute(colors, 3));

    const indices: number[] = [];
    for (let z = 0; z < depthSegments; z++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = z * (widthSegments + 1) + x;
        const b = a + 1;
        const c = (z + 1) * (widthSegments + 1) + x;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    geo.setIndex(new BufferAttribute(new Uint32Array(indices), 1));
    geo.computeVertexNormals();

    return { geometry: geo };
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        roughness={0.95}
        metalness={0.02}
        flatShading={false}
      />
    </mesh>
  );
}

function Lake() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]}>
      <planeGeometry args={[90, 240]} />
      <MeshReflectorMaterial
        blur={[300, 80]}
        resolution={1024}
        mixBlur={0.9}
        mixStrength={60}
        roughness={0.3}
        depthScale={1.5}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.4}
        color="#0a5560"
        metalness={0.8}
        mirror={0.85}
      />
    </mesh>
  );
}

interface BalloonProps {
  position: [number, number, number];
  color: string;
  label: string;
  onClick: () => void;
}

function Balloon({ position, color, label, onClick }: BalloonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Float
      speed={1.3}
      rotationIntensity={0.15}
      floatIntensity={0.5}
      position={position}
    >
      <group
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        scale={hovered ? 1.12 : 1}
      >
        {/* Balloon body */}
        <mesh>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshPhysicalMaterial
            color={color}
            roughness={0.12}
            metalness={0.0}
            clearcoat={1}
            clearcoatRoughness={0.08}
            emissive={color}
            emissiveIntensity={hovered ? 0.5 : 0.2}
          />
        </mesh>
        {/* Knot */}
        <mesh position={[0, -0.6, 0]}>
          <coneGeometry args={[0.1, 0.18, 8]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
        {/* String */}
        <mesh position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 1.1, 6]} />
          <meshBasicMaterial color="#e2e8f0" />
        </mesh>
        {/* Label */}
        <Html position={[0, 0.9, 0]} center distanceFactor={8}>
          <div className="pointer-events-none select-none text-white font-bold text-base whitespace-nowrap drop-shadow-[0_2px_10px_rgba(0,0,0,1)] tracking-wider uppercase">
            {label}
          </div>
        </Html>
      </group>
    </Float>
  );
}

export function MountainLakeScene() {
  const router = useRouter();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // Balloons clustered in the center of the frame, above the water
  const balloons: BalloonProps[] = [
    {
      position: [-0.9, 5.3, -6],
      color: "#3b82f6", // blue — About
      label: "About",
      onClick: () => scrollTo("about"),
    },
    {
      position: [0.8, 5.6, -6.2],
      color: "#a855f7", // violet — Projects
      label: "Projects",
      onClick: () => scrollTo("projects"),
    },
    {
      position: [-0.2, 6.6, -6.5],
      color: "#06b6d4", // cyan — Blog
      label: "Blog",
      onClick: () => router.push("/blog"),
    },
    {
      position: [0.4, 4.5, -5.8],
      color: "#ec4899", // pink — Contact
      label: "Contact",
      onClick: () => scrollTo("contact"),
    },
  ];

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 3, 14], fov: 62 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, toneMappingExposure: 1.15 }}
      >
        {/* HDRI sunset environment — provides sky background AND image-based lighting */}
        <Environment preset="sunset" background blur={0.02} />

        {/* Warm atmospheric fog */}
        <fog attach="fog" args={["#2a140a", 25, 140]} />

        {/* Strong warm directional "sun" from behind left-side mountains for rim lighting */}
        <directionalLight
          position={[-40, 10, -60]}
          intensity={3.5}
          color="#ff8040"
        />

        {/* Cool fill from opposite side (twilight bounce) */}
        <directionalLight
          position={[20, 15, 20]}
          intensity={0.4}
          color="#4a5aa8"
        />

        {/* Subtle warm ambient */}
        <ambientLight intensity={0.2} color="#3a2518" />

        {/* Kiss of light on the balloons in the center */}
        <pointLight
          position={[0, 8, -5]}
          intensity={0.8}
          color="#ffcc88"
          distance={15}
        />

        {/* Scene */}
        <Mountains />
        <Lake />

        {/* Balloon cluster */}
        {balloons.map((b) => (
          <Balloon key={b.label} {...b} />
        ))}
      </Canvas>
    </div>
  );
}
