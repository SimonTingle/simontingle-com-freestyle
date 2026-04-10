"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import type { SceneConfig } from "./SceneConfigPanel";

export const procedureralTerrainWindSystem = {
  time: 0,
  baseStrength: 1.5,
  update(deltaTime: number) {
    this.time += deltaTime;
    const gust1 = Math.sin(this.time * 0.3) * 0.6;
    const gust2 = Math.sin(this.time * 0.15 + 1.2) * 0.4;
    const gust3 = Math.sin(this.time * 0.07 + 2.4) * 0.3;
    this.baseStrength = Math.max(0.5, 1.5 + gust1 + gust2 + gust3);
  },
  getStrength(): number {
    return this.baseStrength;
  },
};

interface ProceduralTerrainSceneProps {
  config: SceneConfig;
}

// Matching reference: 1024×1024 heightmap, worldSize 40000
const WORLD_WIDTH = 1024;
const WORLD_DEPTH = 1024;
const WORLD_SIZE = 40000;
const ELEVATION_SCALE = 35;
const WATER_LEVEL = 500;
const TREE_LINE = 2500;
const SHORE_BUFFER = 10;
const TREE_DENSITY = 0.15;
const MAX_TREES = 30000;

export function ProceduralTerrainScene({ config }: ProceduralTerrainSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // ─── RENDERER ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: config.antialias ?? true, powerPreference: "high-performance" });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = config.shadowsEnabled ?? true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // ─── SCENE ───────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, config.fogDensity ?? 0.00015);

    // ─── CAMERA ──────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 10, 100000);
    camera.position.set(0, 8000, 12000);
    camera.lookAt(0, 0, 0);

    // ─── LIGHTING ────────────────────────────────────────────────────────────
    // Bug 5 fix: add ambient + sun + moon matching reference
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, config.sunIntensity ?? 2.5);
    sunLight.castShadow = config.shadowsEnabled ?? true;
    configureShadowLight(sunLight);
    scene.add(sunLight);

    const moonLight = new THREE.DirectionalLight(0x6666ff, config.moonIntensity ?? 0.8);
    moonLight.castShadow = config.shadowsEnabled ?? true;
    configureShadowLight(moonLight);
    scene.add(moonLight);

    function configureShadowLight(light: THREE.DirectionalLight) {
      const d = 22000;
      light.shadow.camera.left = -d;
      light.shadow.camera.right = d;
      light.shadow.camera.top = d;
      light.shadow.camera.bottom = -d;
      light.shadow.camera.far = 30000;
      light.shadow.bias = -0.0005;
      light.shadow.mapSize.width = 2048;
      light.shadow.mapSize.height = 2048;
    }

    // ─── HEIGHTMAP ───────────────────────────────────────────────────────────
    // Bug 1 fix: match reference exactly — 1024×1024, 4 octaves, quality×1.75
    function generateHeight(width: number, height: number): Uint8Array {
      const size = width * height;
      const data = new Uint8Array(size);
      const perlin = new ImprovedNoise();
      const z = Math.random() * 100;
      let quality = 1;
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < size; i++) {
          const x = i % width;
          const y = ~~(i / width);
          data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);
        }
        quality *= 5;
      }
      return data;
    }

    const heightData = generateHeight(WORLD_WIDTH, WORLD_DEPTH);

    const heightTexture = new THREE.DataTexture(
      heightData,
      WORLD_WIDTH,
      WORLD_DEPTH,
      THREE.RedFormat,
      THREE.UnsignedByteType
    );
    heightTexture.magFilter = THREE.LinearFilter;
    heightTexture.needsUpdate = true;

    // ─── TERRAIN GEOMETRY (LOD STRIPS) ──────────────────────────────────────
    const elevationScale = ELEVATION_SCALE * (config.terrainScale ?? 1);

    // Bilinearly sample heightData at any world (X, Z) position.
    // Because all LOD strips call this with the exact boundary Z value, adjacent
    // strips produce identical heights at their shared edge → zero cracks.
    function sampleHeight(worldX: number, worldZ: number): number {
      const u = ((worldX / WORLD_SIZE) + 0.5) * (WORLD_WIDTH - 1);
      const v = ((worldZ / WORLD_SIZE) + 0.5) * (WORLD_DEPTH - 1);
      const u0 = Math.max(0, Math.min(WORLD_WIDTH - 2, Math.floor(u)));
      const v0 = Math.max(0, Math.min(WORLD_DEPTH - 2, Math.floor(v)));
      const fu = u - u0, fv = v - v0;
      const h00 = heightData[v0 * WORLD_WIDTH + u0];
      const h10 = heightData[v0 * WORLD_WIDTH + (u0 + 1)];
      const h01 = heightData[(v0 + 1) * WORLD_WIDTH + u0];
      const h11 = heightData[(v0 + 1) * WORLD_WIDTH + (u0 + 1)];
      return ((h00 * (1 - fu) + h10 * fu) * (1 - fv) + (h01 * (1 - fu) + h11 * fu) * fv) * elevationScale;
    }

    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.terrainColor ?? "#558833"),
      roughness: config.terrainRoughness ?? 0.9,
      metalness: 0.1,
      flatShading: true,
    });

    // Build one Z-strip of terrain. All strips share xSegs=256 so their X-axis
    // vertex positions align at every boundary — this is what prevents seams.
    // Only zSegs varies: high near camera, low in the fog-shrouded background.
    function createTerrainStrip(zMin: number, zMax: number, xSegs: number, zSegs: number): THREE.Mesh {
      const depth = zMax - zMin;
      const centerZ = (zMin + zMax) / 2;
      const geo = new THREE.PlaneGeometry(WORLD_SIZE, depth, xSegs, zSegs);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length; i += 3) {
        const worldX = pos[i];
        const worldZ = pos[i + 2] + centerZ;   // shift from local to world Z
        pos[i + 2] = worldZ;
        pos[i + 1] = sampleHeight(worldX, worldZ);
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, terrainMaterial);
      m.receiveShadow = true;
      m.castShadow = true;
      scene.add(m);
      return m;
    }

    // LOD quality presets: [near zSegs, mid zSegs, far zSegs]
    // X segments fixed at 256 across all presets so strip X-edges align (no cracks).
    const lodPresets = {
      low:    [64,  24,  8],
      medium: [128, 48, 12],
      high:   [256, 80, 20],
    };
    const [nearZ, midZ, farZ] = lodPresets[config.lodQuality ?? "high"];

    const terrainMeshes = [
      createTerrainStrip(0,       18000, 256, nearZ),
      createTerrainStrip(-12000,      0, 256, midZ),
      createTerrainStrip(-20000, -12000, 256, farZ),
    ];

    // ─── WATER ───────────────────────────────────────────────────────────────
    // Bug 2 fix: proper THREE.ShaderMaterial copied from reference
    const waterLevel = config.waterHeight ?? WATER_LEVEL;
    // Water is a flat procedural surface — 128×128 segments is plenty for wave resolution.
    const waterGeometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 127, 127);
    waterGeometry.rotateX(-Math.PI / 2);

    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWaterLevel: { value: waterLevel },
        uWaveHeight: { value: config.waveHeight ?? 15.0 },
        uWaterHaze: { value: 1500.0 },
        uElevationScale: { value: elevationScale },
        uHeightTexture: { value: heightTexture },
        uWaterColorDeep: { value: new THREE.Color(0x001838) },
        uWaterColorShallow: { value: new THREE.Color(0x33aaff) },
        uCameraPosition: { value: camera.position },
        uHazeColor: { value: scene.background as THREE.Color },
        uDistanceHazeDensity: { value: 0.0001 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uWaterLevel;
        uniform float uWaveHeight;

        varying float vWaveFactor;
        varying vec3 vWorldPosition;
        varying vec2 vUv;

        void main() {
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          vUv = uv;

          float wave = sin(vWorldPosition.x * 0.005 + uTime * 0.5)
                     * cos(vWorldPosition.z * 0.005 + uTime * 0.3)
                     * uWaveHeight;
          vec3 displacedPosition = position;
          displacedPosition.y = uWaterLevel + wave;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
          vWaveFactor = wave / uWaveHeight;
        }
      `,
      fragmentShader: `
        uniform float uWaterLevel;
        uniform float uElevationScale;
        uniform sampler2D uHeightTexture;
        uniform vec3 uWaterColorDeep;
        uniform vec3 uWaterColorShallow;
        uniform float uWaterHaze;
        uniform vec3 uCameraPosition;
        uniform vec3 uHazeColor;
        uniform float uDistanceHazeDensity;

        varying vec3 vWorldPosition;
        varying float vWaveFactor;
        varying vec2 vUv;

        void main() {
          float heightSample = texture2D(uHeightTexture, vUv).r * 255.0;
          float terrainY = heightSample * uElevationScale;
          float depth = max(0.0, uWaterLevel - terrainY);
          float normalizedDepth = clamp(depth / uWaterHaze, 0.0, 1.0);

          vec3 finalColor = mix(uWaterColorShallow, uWaterColorDeep, normalizedDepth);
          float opacity = 0.9 - abs(vWaveFactor) * 0.05;
          finalColor += vec3(0.1) * (1.0 - abs(vWaveFactor));

          float dist = distance(vWorldPosition, uCameraPosition);
          float visibility = exp(-dist * uDistanceHazeDensity * 10.0);
          visibility = clamp(visibility, 0.0, 1.0);
          finalColor = mix(uHazeColor, finalColor, visibility);
          opacity *= visibility * 0.5 + 0.5;

          gl_FragColor = vec4(finalColor, opacity);
        }
      `,
      transparent: true,
      lights: false,
      depthWrite: false,
    });

    const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.receiveShadow = true;
    waterMesh.renderOrder = 100;
    scene.add(waterMesh);

    // ─── VEGETATION ──────────────────────────────────────────────────────────
    // Bug 4 fix: add trunks, fix worldY formula, match reference density/placement
    const windShaderInjection = (shader: any) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uWindSpeed = { value: 1.5 };
      shader.vertexShader = `
        uniform float uTime;
        uniform float uWindSpeed;
        ${shader.vertexShader}
      `;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        float heightFactor = max(0.0, position.y / 100.0);
        float sway = sin(uTime * uWindSpeed + (transformed.x * 0.01) + (transformed.z * 0.01));
        float sway2 = cos(uTime * uWindSpeed * 0.8 + (transformed.x * 0.02));
        transformed.x += sway * heightFactor * 10.0;
        transformed.z += sway2 * heightFactor * 5.0;
        `
      );
    };

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4238, roughness: 0.8 });

    // Fir canopy + trunk
    const firCanopyGeo = new THREE.ConeGeometry(40, 150, 32);
    firCanopyGeo.translate(0, 75, 0);
    const firMat = new THREE.MeshStandardMaterial({ color: 0x1a472a, roughness: 0.9 });
    firMat.onBeforeCompile = windShaderInjection;
    const firTrees = new THREE.InstancedMesh(firCanopyGeo, firMat, MAX_TREES);
    firTrees.castShadow = true;
    firTrees.receiveShadow = true;
    scene.add(firTrees);

    const firTrunkGeo = new THREE.CylinderGeometry(8, 8, 40, 8);
    firTrunkGeo.translate(0, 20, 0);
    const firTrunks = new THREE.InstancedMesh(firTrunkGeo, trunkMat, MAX_TREES);
    firTrunks.castShadow = true;
    scene.add(firTrunks);

    // Deciduous canopy + trunk
    const leavesGeo = new THREE.IcosahedronGeometry(50, 2);
    leavesGeo.translate(0, 80, 0);
    const deciduousMat = new THREE.MeshStandardMaterial({ color: 0x5a7741, roughness: 0.8 });
    deciduousMat.onBeforeCompile = windShaderInjection;
    const deciduousTrees = new THREE.InstancedMesh(leavesGeo, deciduousMat, MAX_TREES);
    deciduousTrees.castShadow = true;
    deciduousTrees.receiveShadow = true;
    scene.add(deciduousTrees);

    const decTrunkGeo = new THREE.CylinderGeometry(10, 10, 50, 8);
    decTrunkGeo.translate(0, 25, 0);
    const deciduousTrunks = new THREE.InstancedMesh(decTrunkGeo, trunkMat, MAX_TREES);
    deciduousTrunks.castShadow = true;
    scene.add(deciduousTrunks);

    // Generate tree data (matching reference generateVegetationData)
    interface TreeDatum { x: number; z: number; h: number; scale: number; rotation: number }
    const treeData: TreeDatum[] = [];
    const halfWorldSize = WORLD_SIZE / 2;
    const step = WORLD_SIZE / (WORLD_WIDTH - 1);
    const treeDensity = config.treeDensity ?? TREE_DENSITY;

    for (let i = 0; i < WORLD_WIDTH * WORLD_DEPTH; i++) {
      if (Math.random() > (1.0 - treeDensity * 0.15)) {
        const xIndex = i % WORLD_WIDTH;
        const zIndex = ~~(i / WORLD_WIDTH);
        treeData.push({
          x: xIndex * step - halfWorldSize,
          z: zIndex * step - halfWorldSize,
          h: heightData[i],
          scale: 0.8 + Math.random() * 0.6,
          rotation: Math.random() * Math.PI * 2,
        });
      }
    }

    // Place trees (matching reference updateVegetationPlacement)
    const dummy = new THREE.Object3D();
    let firIdx = 0, decIdx = 0, firTrunkIdx = 0, decTrunkIdx = 0;

    const TREE_CULL_DIST_SQ = 20000 * 20000;
    const treeScale = config.treeScale ?? 1;
    const treeLine = config.treeLine ?? TREE_LINE;
    const firPct = (config.firPercentage ?? 50) / 100;  // 0-1
    const showFir = config.showFirTrees ?? true;
    const showDec = config.showDeciduousTrees ?? true;
    const showTrunks = config.showTrunks ?? true;

    for (const t of treeData) {
      const worldY = t.h * elevationScale;
      if (worldY < waterLevel + SHORE_BUFFER) continue;

      const dx = t.x, dy = worldY - 8000, dz = t.z - 12000;
      if (dx * dx + dy * dy + dz * dz > TREE_CULL_DIST_SQ) continue;

      // Trees above tree line are always fir; below tree line, use firPercentage
      const isFir = worldY > treeLine ? true : Math.random() < firPct;
      if (isFir && !showFir) continue;
      if (!isFir && !showDec) continue;

      const scale = t.scale * treeScale;
      dummy.position.set(t.x, worldY, t.z);
      dummy.rotation.set(0, t.rotation, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      if (isFir) {
        if (firIdx < MAX_TREES) firTrees.setMatrixAt(firIdx++, dummy.matrix);
        if (showTrunks && firTrunkIdx < MAX_TREES) firTrunks.setMatrixAt(firTrunkIdx++, dummy.matrix);
      } else {
        if (decIdx < MAX_TREES) deciduousTrees.setMatrixAt(decIdx++, dummy.matrix);
        if (showTrunks && decTrunkIdx < MAX_TREES) deciduousTrunks.setMatrixAt(decTrunkIdx++, dummy.matrix);
      }
    }

    // Hide unused instances
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    while (firIdx < MAX_TREES) firTrees.setMatrixAt(firIdx++, dummy.matrix);
    while (decIdx < MAX_TREES) deciduousTrees.setMatrixAt(decIdx++, dummy.matrix);
    while (firTrunkIdx < MAX_TREES) firTrunks.setMatrixAt(firTrunkIdx++, dummy.matrix);
    while (decTrunkIdx < MAX_TREES) deciduousTrunks.setMatrixAt(decTrunkIdx++, dummy.matrix);

    firTrees.instanceMatrix.needsUpdate = true;
    deciduousTrees.instanceMatrix.needsUpdate = true;
    firTrunks.instanceMatrix.needsUpdate = true;
    deciduousTrunks.instanceMatrix.needsUpdate = true;

    // ─── BIRDS (BOID SYSTEM) ─────────────────────────────────────────────────
    const MAX_BIRDS = 40;  // Total instance slots — supports several concurrent flocks of 1–5 birds

    // Bird geometry — gull silhouette, simple W shape (MUCH LARGER for visibility)
    function createBirdGeo(): THREE.BufferGeometry {
      const W = 600; // half-wingspan (10x larger for better visibility)
      const positions = new Float32Array([
        // Left wing tip
        -W, 40, 0,
        // Left wing root
        -30, 0, 25,
        // Center front
        0, 0, 125,
        // Right wing root
        30, 0, 25,
        // Right wing tip
        W, 40, 0,
        // Center back
        0, -10, -125,
      ]);

      // Simple indices for two big triangles (left wing+center, right wing+center, body)
      const indices = new Uint32Array([
        // Front left wing
        0, 1, 2,
        // Front right wing
        2, 3, 4,
        // Back triangle (body)
        1, 5, 3,
      ]);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.computeVertexNormals();

      // Wing flutter attribute: 0 for body, 1 for tips
      const wingFactor = new Float32Array([
        1, 0.5, 0,  // left wing tip, left root, center
        0, 1, 0,    // center, right tip, right root (flipped for back)
      ]);
      geo.setAttribute("wingFactor", new THREE.BufferAttribute(wingFactor, 1));

      return geo;
    }

    const birdGeo = createBirdGeo();

    // Bright white birds — always render on top, no depth testing
    const birdMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,  // Bright white
      side: THREE.DoubleSide,
      wireframe: false,
      fog: false,  // Don't apply fog to birds
      depthTest: false,  // Always render on top (no depth culling)
      depthWrite: false,  // Don't write to depth buffer
    });

    const birdMesh = new THREE.InstancedMesh(birdGeo, birdMat, MAX_BIRDS);
    birdMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    birdMesh.count = 0;  // Start with 0 birds, increment as we spawn flocks
    birdMesh.renderOrder = 1000;  // Render on top of everything
    birdMesh.frustumCulled = false;  // Never cull, always render
    // Hide all initially
    const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < MAX_BIRDS; i++) birdMesh.setMatrixAt(i, zeroMatrix);
    birdMesh.instanceMatrix.needsUpdate = true;
    scene.add(birdMesh);


    // ── Boid Class ────────────────────────────────────────────────────────────
    // All speed/force values are tuned for a 60fps baseline and scaled by
    // (delta * 60) inside move(), so movement is frame-rate independent.
    //
    // Smoothing strategy:
    //   • Low weights on separation / cohesion so boids don't jitter from
    //     close-neighbor corrections.
    //   • targetVelocity accumulates forces, then velocity LERPs toward it
    //     each frame (low-pass filter) — removes high-frequency direction
    //     noise from wind + steering without killing responsiveness.
    class Boid {
      position = new THREE.Vector3();
      velocity = new THREE.Vector3();
      targetVelocity = new THREE.Vector3();
      acceleration = new THREE.Vector3();
      neighborhoodRadius = 2000; // large enough to keep the wedge formation cohesive
      maxSpeed = 45;
      maxSteerForce = 0.8;     // lower clamp = gentler corrections
      turnSmoothness = 0.05;   // very smooth turns

      run(boids: Boid[], delta: number) {
        // Flocking behavior
        this.separation(boids);
        this.alignment(boids);
        this.cohesion(boids);
        this.move(delta);
      }

      separation(boids: Boid[]) {
        const steer = new THREE.Vector3();
        let count = 0;
        for (const boid of boids) {
          const distance = this.position.distanceTo(boid.position);
          if (distance > 0 && distance < this.neighborhoodRadius) {
            const diff = new THREE.Vector3().subVectors(this.position, boid.position);
            diff.normalize();
            diff.divideScalar(distance);
            steer.add(diff);
            count++;
          }
        }
        if (count > 0) steer.divideScalar(count);
        if (steer.length() > this.maxSteerForce) {
          steer.normalize().multiplyScalar(this.maxSteerForce);
        }
        this.acceleration.add(steer.multiplyScalar(0.4));  // was 1.5
      }

      alignment(boids: Boid[]) {
        const avg = new THREE.Vector3();
        let count = 0;
        for (const boid of boids) {
          const distance = this.position.distanceTo(boid.position);
          if (distance > 0 && distance < this.neighborhoodRadius) {
            avg.add(boid.velocity);
            count++;
          }
        }
        if (count > 0) {
          avg.divideScalar(count);
          if (avg.length() > this.maxSteerForce) {
            avg.normalize().multiplyScalar(this.maxSteerForce);
          }
        }
        this.acceleration.add(avg.multiplyScalar(0.8));  // keep strong — makes flocks cohesive
      }

      cohesion(boids: Boid[]) {
        const steer = new THREE.Vector3();
        const avg = new THREE.Vector3();
        let count = 0;
        for (const boid of boids) {
          const distance = this.position.distanceTo(boid.position);
          if (distance > 0 && distance < this.neighborhoodRadius) {
            avg.add(boid.position);
            count++;
          }
        }
        if (count > 0) {
          avg.divideScalar(count);
          steer.subVectors(avg, this.position);
          if (steer.length() > this.maxSteerForce) {
            steer.normalize().multiplyScalar(this.maxSteerForce);
          }
        }
        this.acceleration.add(steer.multiplyScalar(0.3));  // was 1.0
      }

      move(delta: number) {
        // Scale per-frame math by (delta * 60) so motion is frame-rate
        // independent. At 60fps the scale is 1.0.
        const dt = Math.min(delta, 0.1) * 60;

        // Accumulate steering into the TARGET velocity (not the live one).
        this.targetVelocity.add(this.acceleration.multiplyScalar(dt));
        const tLen = this.targetVelocity.length();
        if (tLen > this.maxSpeed) {
          this.targetVelocity.multiplyScalar(this.maxSpeed / tLen);
        }

        // Low-pass filter: live velocity slowly chases the target. This is
        // what eliminates visible zigzag — any high-frequency wobble in the
        // target averages out over ~15 frames (≈¼ s at 60fps).
        const k = Math.min(this.turnSmoothness * dt, 1);
        this.velocity.lerp(this.targetVelocity, k);

        this.position.addScaledVector(this.velocity, dt);
        this.acceleration.set(0, 0, 0);
      }
    }

    // ── Flock instance with Boids ──────────────────────────────────────────────
    // NOTE: we keep an ARRAY of flocks so multiple can be in the air at once.
    // Each flock remembers which direction it's travelling and where it
    // spawned, so we can detect when it has fully crossed the visible area.
    interface BoidFlock {
      boids: Boid[];
      goal: THREE.Vector3;
      direction: 1 | -1;      // +1 = flying right (+X), -1 = flying left (-X)
      spawnX: number;          // |x| where flock originated
      spawnTime: number;       // elapsed time when spawned
    }

    const MAX_FLOCKS = 5;
    const flocks: BoidFlock[] = [];
    let nextFlockSpawn = 2;   // Initial spawn after 2 seconds

    // Spawn distance must be large enough to keep birds off-camera at start,
    // but small enough that the crossing doesn't take forever. The goal is
    // placed WAY past the opposite edge so goal-steering never relaxes
    // mid-screen and birds keep driving toward the far side.
    const BIRD_SPAWN_X = 18000;
    const BIRD_GOAL_X = 60000;   // effectively "keep going forever"
    const BIRD_OFFSCREEN_X = BIRD_SPAWN_X + 2000; // removal threshold past opposite edge

    function spawnNewFlock(time: number) {
      if (flocks.length >= MAX_FLOCKS) {
        const interval = config.birdSpawnInterval ?? 10;
        nextFlockSpawn = time + interval * 0.4 + Math.random() * interval * 0.3;
        return;
      }

      const flockSize = Math.max(1, Math.round(config.birdFlockSize ?? 3));
      const boids: Boid[] = [];
      const speedMult = config.birdSpeed ?? 1;

      const goRight = Math.random() > 0.5;
      const direction: 1 | -1 = goRight ? 1 : -1;
      const startX = -direction * BIRD_SPAWN_X;
      const startZ = (Math.random() - 0.5) * WORLD_SIZE * 0.15;
      const startY = 3000 + Math.random() * 1500;

      const goalX = direction * BIRD_GOAL_X;
      const goalZ = startZ + (Math.random() - 0.5) * 2000;
      const goalY = startY + (Math.random() - 0.5) * 500;

      for (let i = 0; i < flockSize; i++) {
        const boid = new Boid();
        boid.maxSpeed = 45 * speedMult;
        const rank = i;
        const side = (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2);
        boid.position.set(
          startX - direction * rank * 1200,
          startY + (Math.random() - 0.5) * 200,
          startZ + side * 1400
        );
        boid.velocity.set(
          direction * 35 * speedMult,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.5
        );
        boid.targetVelocity.copy(boid.velocity);
        boids.push(boid);
      }

      flocks.push({
        boids,
        goal: new THREE.Vector3(goalX, goalY, goalZ),
        direction,
        spawnX: BIRD_SPAWN_X,
        spawnTime: time,
      });

      const interval = config.birdSpawnInterval ?? 10;
      nextFlockSpawn = time + interval * 0.7 + Math.random() * interval * 0.6;
    }

    const birdQ = new THREE.Quaternion();
    const birdScaleVal = config.birdScale ?? 1;
    const birdS = new THREE.Vector3(birdScaleVal, birdScaleVal, birdScaleVal);
    const fwdVec = new THREE.Vector3(0, 0, 1);
    const birdMx = new THREE.Matrix4();

    const toGoalVec = new THREE.Vector3();
    const windVec = new THREE.Vector3();
    const dirVec = new THREE.Vector3();

    function updateBirds(time: number, delta: number, windStr: number) {
      if (!(config.birdEnabled ?? true)) {
        birdMesh.count = 0;
        return;
      }
      // Spawn a new flock whenever the timer elapses (respects MAX_FLOCKS inside).
      if (time >= nextFlockSpawn) {
        spawnNewFlock(time);
      }

      // Walk flocks in reverse so we can splice cleanly while iterating.
      for (let f = flocks.length - 1; f >= 0; f--) {
        const flock = flocks[f];

        // Flock has finished its journey once EVERY boid has crossed past
        // the opposite edge. This is the only removal criterion besides a
        // safety timeout — no more "|x| < 24000" check that was killing them
        // mid-flight.
        let allOffScreen = true;
        for (const boid of flock.boids) {
          if (flock.direction === 1) {
            if (boid.position.x < BIRD_OFFSCREEN_X) { allOffScreen = false; break; }
          } else {
            if (boid.position.x > -BIRD_OFFSCREEN_X) { allOffScreen = false; break; }
          }
        }

        // Safety timeout — in the worst case (wind pushing against travel
        // direction) a flock should still be gone after 90 seconds.
        if (allOffScreen || (time - flock.spawnTime) > 90) {
          flocks.splice(f, 1);
          continue;
        }

        // Update boids in this flock
        for (const boid of flock.boids) {
          // Always steer toward goal — goal is far past the opposite edge so
          // this never relaxes and birds keep driving forward. Gentle pull
          // so the flock glides rather than jerking toward the goal.
          toGoalVec.subVectors(flock.goal, boid.position).normalize().multiplyScalar(0.25);
          boid.acceleration.add(toGoalVec);

          // VERY gentle wind perturbation — previous magnitudes of 8/4/8
          // were the main source of visible wobble. These are small enough
          // that the velocity low-pass filter smooths them into a slow drift.
          windVec.set(
            Math.sin(time * 0.2 + boid.position.x * 0.0003) * 1.2,
            Math.sin(time * 0.35 + boid.position.y * 0.0003) * 0.4,
            Math.cos(time * 0.18 + boid.position.z * 0.0003) * 1.2
          );
          boid.acceleration.add(windVec);

          boid.run(flock.boids, delta);
        }
      }

      // Write every boid across every flock into the shared instanced mesh.
      let instIdx = 0;
      for (const flock of flocks) {
        for (const boid of flock.boids) {
          if (instIdx >= MAX_BIRDS) break;
          dirVec.copy(boid.velocity);
          if (dirVec.lengthSq() > 1e-6) dirVec.normalize();
          else dirVec.set(flock.direction, 0, 0);
          birdQ.setFromUnitVectors(fwdVec, dirVec);
          birdMx.compose(boid.position, birdQ, birdS);
          birdMesh.setMatrixAt(instIdx, birdMx);
          instIdx++;
        }
        if (instIdx >= MAX_BIRDS) break;
      }

      birdMesh.count = instIdx;
      if (instIdx > 0) birdMesh.instanceMatrix.needsUpdate = true;
    }

    // ─── ANIMATION LOOP ───────────────────────────────────────────────────────
    let animationId: number;
    const clock = new THREE.Clock();
    // Use the visitor's local clock — no permission required
    const now = new Date();
    let timeOfDay = now.getHours() + now.getMinutes() / 60;

    // Sky presets: each defines day/night/sunset colours
    const skyPresets: Record<string, { day: number; night: number; sunset: number }> = {
      sunset:    { day: 0x87ceeb, night: 0x020210, sunset: 0xff4500 },
      dawn:      { day: 0xffe5b4, night: 0x1a0f1a, sunset: 0xff9933 },
      noon:      { day: 0x00bfff, night: 0x0a0a1a, sunset: 0xffcc00 },
      night:     { day: 0x1a2a4a, night: 0x000000, sunset: 0x1a0a2a },
      overcast:  { day: 0xb0c4de, night: 0x2f3a4a, sunset: 0x9966aa },
      storm:     { day: 0x4a5f7f, night: 0x0a0a1a, sunset: 0x663344 },
    };

    // Sky transitions: 2-hour dawn (5-7 AM) and dusk (17-19/5-7 PM) windows
    // Between these windows, full day or full night.
    function getTimeBasedTransition(hour: number): { dayMix: number; inDawn: boolean; inDusk: boolean } {
      const DAWN_START = 5.0;    // 5:00 AM
      const DAWN_END = 7.0;      // 7:00 AM
      const DUSK_START = 17.0;   // 5:00 PM
      const DUSK_END = 19.0;     // 7:00 PM

      if (hour >= DAWN_START && hour < DAWN_END) {
        // In dawn window: lerp from night (0) to day (1)
        const progress = (hour - DAWN_START) / (DAWN_END - DAWN_START);
        return { dayMix: progress, inDawn: true, inDusk: false };
      } else if (hour >= DAWN_END && hour < DUSK_START) {
        // Full day
        return { dayMix: 1.0, inDawn: false, inDusk: false };
      } else if (hour >= DUSK_START && hour < DUSK_END) {
        // In dusk window: lerp from day (1) to night (0)
        const progress = (hour - DUSK_START) / (DUSK_END - DUSK_START);
        return { dayMix: 1.0 - progress, inDawn: false, inDusk: true };
      } else {
        // Full night (19:00-5:00)
        return { dayMix: 0.0, inDawn: false, inDusk: false };
      }
    }

    // Bug 5 fix: full day/night cycle with sky + moon matching reference updateCelestialBodies
    function updateCelestialBodies() {
      const theta = (timeOfDay / 24) * Math.PI * 2 - Math.PI / 2;
      const distance = 10000;

      const sunX = Math.cos(theta) * distance;
      const sunY = Math.sin(theta) * distance;
      const sunZ = Math.cos(theta * 0.5) * 2000;

      sunLight.position.set(sunX, sunY, sunZ);
      moonLight.position.set(-sunX, -sunY, -sunZ);

      const normSunY = sunY / distance;
      const normMoonY = -normSunY;

      const sunFactor = THREE.MathUtils.smoothstep(normSunY, -0.25, 0.1);
      const moonFactor = THREE.MathUtils.smoothstep(normMoonY, -0.25, 0.1);

      sunLight.intensity = sunFactor * (config.sunIntensity ?? 2.5);
      moonLight.intensity = moonFactor * (config.moonIntensity ?? 0.8);

      // Get sky colours from preset (default to sunset if not found)
      const preset = skyPresets[config.envPreset ?? "sunset"] || skyPresets.sunset;
      const dayColor = new THREE.Color(preset.day);
      const nightColor = new THREE.Color(preset.night);
      const sunsetColor = new THREE.Color(preset.sunset);

      // Use time-based 2-hour transitions instead of sun position
      const transition = getTimeBasedTransition(timeOfDay);
      const dayMix = transition.dayMix;

      // Blend night ↔ day based on 2-hour windows
      (scene.background as THREE.Color).lerpColors(nightColor, dayColor, dayMix);

      // Add subtle sunset colour during dusk transition
      if (transition.inDusk) {
        const duskIntensity = 1.0 - dayMix; // Stronger at start of dusk, weaker at end
        (scene.background as THREE.Color).lerp(sunsetColor, duskIntensity * 0.2);
      }

      (scene.fog as THREE.FogExp2).color.copy(scene.background as THREE.Color);
      (scene.fog as THREE.FogExp2).density = config.fogDensity ?? 0.00008;

      const ambientIntensity = 0.05 + 0.45 * dayMix + 0.1 * moonFactor;
      ambientLight.intensity = ambientIntensity;

      if (normSunY > -0.1) {
        sunLight.castShadow = true;
        moonLight.castShadow = false;
      } else if (normMoonY > -0.1) {
        sunLight.castShadow = false;
        moonLight.castShadow = true;
      }
    }

    // Debug timers
    let lastFpsLog = 0;
    let lastBirdLog = 0;
    let frameCount = 0;

    function animate() {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      frameCount++;

      // Time of day: manual override or auto-advance
      if (config.manualTimeEnabled) {
        timeOfDay = config.manualTimeHour ?? 12;
      } else {
        const dayNightSpeed = config.dayNightSpeed ?? 1.0;
        timeOfDay += (delta * 2.0 * dayNightSpeed) / 3600;
        if (timeOfDay >= 24) timeOfDay -= 24;
      }

      updateCelestialBodies();

      // Update water uniforms
      waterMaterial.uniforms.uTime.value = time;
      waterMaterial.uniforms.uWaterLevel.value = config.waterHeight ?? WATER_LEVEL;
      waterMaterial.uniforms.uWaveHeight.value = config.waveHeight ?? 15;
      waterMaterial.uniforms.uCameraPosition.value = camera.position;
      waterMaterial.uniforms.uHazeColor.value = scene.background;

      // Update wind
      procedureralTerrainWindSystem.update(delta);
      const windStrength = procedureralTerrainWindSystem.getStrength();

      if ((firMat as any).userData.shader) {
        (firMat as any).userData.shader.uniforms.uTime.value = time;
        (firMat as any).userData.shader.uniforms.uWindSpeed.value = windStrength;
      }
      if ((deciduousMat as any).userData.shader) {
        (deciduousMat as any).userData.shader.uniforms.uTime.value = time;
        (deciduousMat as any).userData.shader.uniforms.uWindSpeed.value = windStrength;
      }

      // Update birds
      updateBirds(time, delta, windStrength);

      // Debug: log birds every 30 seconds
      if (time - lastBirdLog >= 30) {
        let birdCount = 0;
        for (const fl of flocks) birdCount += fl.boids.length;
        console.log(`🐦 Boid flocks: ${flocks.length} (${birdCount} birds)`);
        lastBirdLog = time;
      }

      // Debug: log FPS every 20 seconds
      if (time - lastFpsLog >= 20) {
        const fps = Math.round(frameCount / 20);
        console.log(`📊 FPS: ${fps}`);
        frameCount = 0;
        lastFpsLog = time;
      }

      renderer.render(scene, camera);
    }

    animate();

    // ─── RESIZE ───────────────────────────────────────────────────────────────
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onWindowResize);

    // ─── CLEANUP ──────────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", onWindowResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [config]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 0 }}
    />
  );
}
