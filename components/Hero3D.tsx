"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Plane } from "@react-three/drei";
import { Mesh, BufferGeometry, BufferAttribute, LOD, InstancedMesh, ConeGeometry, CylinderGeometry, MeshStandardMaterial, Matrix4, Vector3 } from "three";
import { motion } from "framer-motion";

interface WindContextType {
  windStrength: number;
}

const WindContext = React.createContext<WindContextType>({ windStrength: 0.5 });

function Trees({ windStrength = 0.5 }) {
  const treesRef = useRef<InstancedMesh>(null);
  const trunkRef = useRef<InstancedMesh>(null);

  // Generate tree positions on the rolling hills
  const treePositions = useMemo(() => {
    const positions: Array<{ x: number; z: number; scale: number }> = [];
    const spacing = 2;

    for (let x = -15; x < 15; x += spacing) {
      for (let z = -15; z < 15; z += spacing) {
        // Add some randomness to avoid grid pattern
        const randX = x + (Math.random() - 0.5) * 1.5;
        const randZ = z + (Math.random() - 0.5) * 1.5;

        // Only place trees in certain areas (creates natural looking forests)
        if ((Math.sin(randX * 0.3) + Math.cos(randZ * 0.3)) * 0.5 + 0.5 > 0.3) {
          const scale = 0.8 + Math.random() * 0.4;
          positions.push({ x: randX, z: randZ, scale });
        }
      }
    }
    return positions;
  }, []);

  useEffect(() => {
    if (treesRef.current && trunkRef.current) {
      const dummy = new Matrix4();

      treePositions.forEach((pos, i) => {
        // Foliage (cone)
        dummy.identity();
        dummy.translate(pos.x, 2 + pos.scale, pos.z);
        dummy.scale(new Vector3(pos.scale, pos.scale * 1.2, pos.scale));
        treesRef.current?.setMatrixAt(i, dummy);

        // Trunk (cylinder)
        dummy.identity();
        dummy.translate(pos.x, 0.8, pos.z);
        dummy.scale(new Vector3(pos.scale * 0.3, 1.5, pos.scale * 0.3));
        trunkRef.current?.setMatrixAt(i, dummy);
      });

      treesRef.current.instanceMatrix.needsUpdate = true;
      trunkRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [treePositions]);

  useFrame(({ clock, camera }) => {
    if (treesRef.current) {
      const dummy = new Matrix4();
      const time = clock.getElapsedTime();
      const cameraPos = camera.position;

      treePositions.forEach((pos, i) => {
        // Calculate distance from camera to tree
        const distX = pos.x - cameraPos.x;
        const distZ = pos.z - cameraPos.z;
        const distanceFromCamera = Math.sqrt(distX * distX + distZ * distZ);

        // Only apply wind effect to trees within 50 units of camera
        let xPos = pos.x;
        let zPos = pos.z;

        if (distanceFromCamera <= 50) {
          const windOffset = Math.sin(time * 1.5 + pos.x * 0.5) * windStrength * 0.3;
          const tiltOffset = Math.cos(time * 1.2 + pos.z * 0.3) * windStrength * 0.2;
          xPos += windOffset * 0.5;
          zPos += tiltOffset * 0.3;
        }

        dummy.identity();
        dummy.translate(xPos, 2 + pos.scale, zPos);
        dummy.scale(new Vector3(pos.scale, pos.scale * 1.2, pos.scale));
        treesRef.current?.setMatrixAt(i, dummy);
      });

      treesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Tree foliage */}
      <instancedMesh ref={treesRef} args={[new ConeGeometry(1, 2, 8), undefined, treePositions.length]}>
        <meshStandardMaterial color="#2d5016" roughness={0.9} />
      </instancedMesh>

      {/* Tree trunks */}
      <instancedMesh ref={trunkRef} args={[new CylinderGeometry(0.3, 0.4, 1.5, 8), undefined, treePositions.length]}>
        <meshStandardMaterial color="#5a4a3a" roughness={0.95} />
      </instancedMesh>
    </>
  );
}

function RollingHills() {
  const lodRef = useRef<LOD>(null);

  // Function to generate terrain geometry at specified resolution
  const generateTerrainGeometry = (widthSegments: number, heightSegments: number) => {
    const width = 30;
    const height = 30;

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
  };

  // Generate LOD geometries with memoization
  const { lod0, lod1, lod2, lod3 } = useMemo(() => {
    return {
      lod0: generateTerrainGeometry(120, 120), // Ultra high detail - near
      lod1: generateTerrainGeometry(60, 60),   // High detail - medium
      lod2: generateTerrainGeometry(30, 30),   // Medium detail - far
      lod3: generateTerrainGeometry(12, 12),   // Low detail - very far
    };
  }, []);

  // Configure LOD distances
  useEffect(() => {
    if (lodRef.current) {
      // Clear existing LOD levels
      while (lodRef.current.levels.length > 0) {
        lodRef.current.levels.pop();
      }

      // Add LOD levels with distance thresholds
      const children = lodRef.current.children as Mesh[];
      if (children.length >= 4) {
        lodRef.current.addLevel(children[0], 0);   // Ultra high detail: 0-5 units
        lodRef.current.addLevel(children[1], 8);   // High detail: 8-20 units
        lodRef.current.addLevel(children[2], 25);  // Medium detail: 25-50 units
        lodRef.current.addLevel(children[3], 50);  // Low detail: 50+ units
      }
    }
  }, []);

  useFrame(({ clock, camera }) => {
    if (lodRef.current) {
      // Rotate the terrain
      lodRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.3 - 0.5;
      lodRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.05) * 0.1;

      // Update LOD distances based on camera
      // The LOD system automatically switches meshes based on distance from camera
    }
  });

  return (
    <lod ref={lodRef}>
      {/* Ultra high detail - visible from 0 to 5 units */}
      <mesh geometry={lod0}>
        <meshPhongMaterial
          color="#3b82f6"
          specular="#1e40af"
          shininess={100}
          wireframe={false}
        />
      </mesh>

      {/* High detail - visible from 5 to 15 units */}
      <mesh geometry={lod1}>
        <meshPhongMaterial
          color="#3b82f6"
          specular="#1e40af"
          shininess={100}
          wireframe={false}
        />
      </mesh>

      {/* Medium detail - visible from 15 to 30 units */}
      <mesh geometry={lod2}>
        <meshPhongMaterial
          color="#3b82f6"
          specular="#1e40af"
          shininess={100}
          wireframe={false}
        />
      </mesh>

      {/* Low detail - visible from 30+ units */}
      <mesh geometry={lod3}>
        <meshPhongMaterial
          color="#3b82f6"
          specular="#1e40af"
          shininess={100}
          wireframe={false}
        />
      </mesh>
    </lod>
  );
}

export function Hero3D() {
  const [windStrength, setWindStrength] = useState(0.5);

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
        <Trees windStrength={windStrength} />
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
        style={{ filter: 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-center"
          style={{ filter: 'none', textShadow: 'none', boxShadow: 'none' }}
        >
          <h1
            className="text-6xl md:text-7xl font-bold text-white mb-4"
            style={{
              WebkitFontSmoothing: 'antialiased',
              textShadow: 'none',
              filter: 'none',
              WebkitTextStroke: '0px'
            }}
          >
            Simon Tingle
          </h1>
          <p
            className="text-xl md:text-2xl text-blue-200"
            style={{
              WebkitFontSmoothing: 'antialiased',
              textShadow: 'none',
              filter: 'none',
              WebkitTextStroke: '0px'
            }}
          >
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
