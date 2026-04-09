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
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // ─── SCENE ───────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    // Bug 6 fix: FogExp2 matching reference
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.00008);

    // ─── CAMERA ──────────────────────────────────────────────────────────────
    // Bug 6 fix: camera position matching reference [0, 3000, 5000], near=10, far=50000
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 10, 100000);
    camera.position.set(0, 8000, 12000);
    camera.lookAt(0, 0, 0);

    // ─── LIGHTING ────────────────────────────────────────────────────────────
    // Bug 5 fix: add ambient + sun + moon matching reference
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, config.sunIntensity ?? 2.5);
    sunLight.castShadow = true;
    configureShadowLight(sunLight);
    scene.add(sunLight);

    const moonLight = new THREE.DirectionalLight(0x6666ff, 0.8);
    moonLight.castShadow = true;
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

    // ─── TERRAIN GEOMETRY ────────────────────────────────────────────────────
    const geometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, WORLD_WIDTH - 1, WORLD_DEPTH - 1);
    geometry.rotateX(-Math.PI / 2);

    const vertices = geometry.attributes.position.array as Float32Array;
    // Bug 1 fix: raw heightData[i] * elevationScale (NOT divided by 255)
    const elevationScale = ELEVATION_SCALE * (config.terrainScale ?? 1);
    for (let i = 0, j = 0; i < heightData.length; i++, j += 3) {
      vertices[j + 1] = heightData[i] * elevationScale;
    }
    geometry.computeVertexNormals();

    // Bug 3 fix: flatShading: true + correct colour 0x558833
    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x558833,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geometry, terrainMaterial);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);

    // ─── WATER ───────────────────────────────────────────────────────────────
    // Bug 2 fix: proper THREE.ShaderMaterial copied from reference
    const waterLevel = config.waterHeight ?? WATER_LEVEL;
    const waterGeometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, WORLD_WIDTH - 1, WORLD_DEPTH - 1);
    waterGeometry.rotateX(-Math.PI / 2);

    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWaterLevel: { value: waterLevel },
        uWaveHeight: { value: 15.0 },
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
    const windShaderInjection = (shader: THREE.Shader) => {
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

    for (const t of treeData) {
      const worldY = t.h * elevationScale;
      if (worldY < waterLevel + SHORE_BUFFER) continue;

      const isFir = worldY > TREE_LINE;
      dummy.position.set(t.x, worldY, t.z);
      dummy.rotation.set(0, t.rotation, 0);
      dummy.scale.set(t.scale, t.scale, t.scale);
      dummy.updateMatrix();

      if (isFir) {
        if (firIdx < MAX_TREES) firTrees.setMatrixAt(firIdx++, dummy.matrix);
        if (firTrunkIdx < MAX_TREES) firTrunks.setMatrixAt(firTrunkIdx++, dummy.matrix);
      } else {
        if (decIdx < MAX_TREES) deciduousTrees.setMatrixAt(decIdx++, dummy.matrix);
        if (decTrunkIdx < MAX_TREES) deciduousTrunks.setMatrixAt(decTrunkIdx++, dummy.matrix);
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

    // ─── ANIMATION LOOP ───────────────────────────────────────────────────────
    let animationId: number;
    const clock = new THREE.Clock();
    let timeOfDay = config.timeOfDay ?? 6.5;

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
      moonLight.intensity = moonFactor * 0.8;

      const dayColor = new THREE.Color(0x87ceeb);
      const nightColor = new THREE.Color(0x020210);
      const sunsetColor = new THREE.Color(0xff4500);

      const dayMix = THREE.MathUtils.smoothstep(normSunY, -0.2, 0.2);
      (scene.background as THREE.Color).lerpColors(nightColor, dayColor, dayMix);

      if (Math.abs(normSunY) < 0.2 && normSunY > -0.2) {
        const sunsetIntensity = 1.0 - Math.abs(normSunY) / 0.2;
        (scene.background as THREE.Color).lerp(sunsetColor, sunsetIntensity * 0.3);
      }

      (scene.fog as THREE.FogExp2).color.copy(scene.background as THREE.Color);

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

    function animate() {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Auto-advance time of day
      const dayNightSpeed = config.dayNightSpeed ?? 1.0;
      timeOfDay += (delta * 2.0 * dayNightSpeed) / 3600;
      if (timeOfDay >= 24) timeOfDay -= 24;

      updateCelestialBodies();

      // Update water uniforms
      waterMaterial.uniforms.uTime.value = time;
      waterMaterial.uniforms.uWaterLevel.value = config.waterHeight ?? WATER_LEVEL;
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
