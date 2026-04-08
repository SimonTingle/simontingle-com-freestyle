"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Plane } from "@react-three/drei";
import { Mesh, BufferGeometry, BufferAttribute } from "three";
import { motion } from "framer-motion";

function RollingHills() {
  const meshRef = useRef<Mesh>(null);

  // Generate procedural rolling hills geometry
  const geometry = useMemo(() => {
    const width = 30;
    const height = 30;
    const widthSegments = 60;
    const heightSegments = 60;

    const positions = new Float32Array(
      (widthSegments + 1) * (heightSegments + 1) * 3
    );

    let index = 0;
    for (let y = 0; y <= heightSegments; y++) {
      for (let x = 0; x <= widthSegments; x++) {
        const u = x / widthSegments;
        const v = y / heightSegments;

        // Procedural noise-like hills using sine/cosine
        const zValue =
          Math.sin(u * Math.PI * 4) * Math.cos(v * Math.PI * 4) * 2 +
          Math.sin(u * Math.PI * 2) * 1.5 +
          Math.cos(v * Math.PI * 2) * 1.5 +
          Math.sin((u + v) * Math.PI * 3) * 0.8;

        positions[index * 3] = u * width - width / 2;
        positions[index * 3 + 1] = zValue;
        positions[index * 3 + 2] = v * height - height / 2;

        index++;
      }
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.computeVertexNormals();

    // Generate indices for faces
    const indices: number[] = [];
    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = y * (widthSegments + 1) + x;
        const b = y * (widthSegments + 1) + x + 1;
        const c = (y + 1) * (widthSegments + 1) + x;
        const d = (y + 1) * (widthSegments + 1) + x + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geo.setIndex(new BufferAttribute(new Uint32Array(indices), 1));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.3 - 0.5;
      meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.05) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshPhongMaterial
        color="#3b82f6"
        specular="#1e40af"
        shininess={100}
        wireframe={false}
      />
    </mesh>
  );
}

export function Hero3D() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 8, 15], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1} />
        <pointLight position={[-10, 10, 10]} intensity={0.5} color="#ff00ff" />
        <RollingHills />
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.5}
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>

      {/* Overlay text */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">
            Simon Tingle
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 drop-shadow-md">
            Building interactive experiences with code
          </p>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </motion.div>
    </div>
  );
}
