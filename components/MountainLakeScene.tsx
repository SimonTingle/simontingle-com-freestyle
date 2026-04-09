"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, ThreeEvent, extend } from "@react-three/fiber";
import { Html, Environment, shaderMaterial, useEnvironment } from "@react-three/drei";
import {
  BufferGeometry,
  BufferAttribute,
  Color,
  Group,
  Vector3,
  Plane,
  ShaderMaterial,
  Texture,
} from "three";
import { useRouter } from "next/navigation";
import {
  SceneConfigPanel,
  SceneConfig,
  defaultConfig,
} from "./SceneConfigPanel";

// ---------------------------------------------------------------------------
// Water shader
// Uniforms driven by SceneConfig: deep/shallow colour, ripple strength.
// Up to 8 simultaneous click-ripples via ring-buffer.
// ---------------------------------------------------------------------------
const WaterShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uRippleOrigins: new Float32Array(16).fill(0),
    uRippleStartTimes: new Float32Array(8).fill(-999),
    uWaterDeepColor: new Color("#01102a"),
    uWaterShallowColor: new Color("#0a5560"),
    uRippleStrength: 1.0,
  },
  /* ---- VERTEX ---- */
  /*glsl*/`
    uniform float uTime;
    uniform float uRippleOrigins[16];
    uniform float uRippleStartTimes[8];
    uniform float uRippleStrength;

    varying vec3  vWorldPos;
    varying vec3  vNormal;
    varying float vFresnel;

    void main() {
      vec3 pos = position;

      // Gentle always-on micro-waves
      float wave1 = sin(pos.x * 0.4 + uTime * 0.9)  * cos(pos.z * 0.35 + uTime * 0.7)  * 0.06;
      float wave2 = sin(pos.x * 0.8 - uTime * 1.2)  * sin(pos.z * 0.60 + uTime * 0.5)  * 0.04;
      pos.y += wave1 + wave2;

      // Click ripples
      for (int i = 0; i < 8; i++) {
        float startT = uRippleStartTimes[i];
        if (startT < -100.0) continue;
        float age  = uTime - startT;
        if (age < 0.0 || age > 5.0) continue;

        float ox   = uRippleOrigins[i * 2];
        float oz   = uRippleOrigins[i * 2 + 1];
        float dist = distance(vec2(pos.x, pos.z), vec2(ox, oz));

        float waveFront = dist - age * 6.0;
        float osc       = sin(waveFront * 1.8) * 0.35;
        float dFade     = exp(-dist * 0.10) * smoothstep(22.0, 2.0, dist);
        float tFade     = exp(-age  * 0.90) * smoothstep(5.0, 0.5, age);
        float frontFade = exp(-waveFront * waveFront * 0.08);

        pos.y += osc * dFade * tFade * frontFade * uRippleStrength;
      }

      vec4 worldPos4 = modelMatrix * vec4(pos, 1.0);
      vWorldPos      = worldPos4.xyz;
      vNormal        = normalMatrix * normal;

      vec3 viewDir = normalize(cameraPosition - worldPos4.xyz);
      vFresnel     = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 3.5);

      gl_Position = projectionMatrix * viewMatrix * worldPos4;
    }
  `,
  /* ---- FRAGMENT ---- */
  /*glsl*/`
    varying vec3  vWorldPos;
    varying vec3  vNormal;
    varying float vFresnel;

    uniform float uTime;
    uniform vec3  uWaterDeepColor;
    uniform vec3  uWaterShallowColor;

    void main() {
      vec3 waterCol = mix(uWaterDeepColor, uWaterShallowColor, vFresnel * 0.6);

      vec3 sunDir  = normalize(vec3(-0.6, 0.5, -0.5));
      vec3 viewDir = normalize(cameraPosition - vWorldPos);
      vec3 halfDir = normalize(sunDir + viewDir);
      float spec   = pow(max(dot(normalize(vNormal), halfDir), 0.0), 180.0);
      vec3 specCol = vec3(1.0, 0.85, 0.6) * spec * 1.4;

      vec3 skyCol  = vec3(0.12, 0.14, 0.32);
      vec3 col     = waterCol + specCol + skyCol * vFresnel * 0.25;
      float alpha  = mix(0.82, 0.97, vFresnel * 0.4 + 0.6);

      gl_FragColor = vec4(col, alpha);
    }
  `
);

extend({ WaterShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    waterShaderMaterial: JSX.IntrinsicElements["shaderMaterial"] & {
      uTime?: number;
      uRippleOrigins?: Float32Array;
      uRippleStartTimes?: Float32Array;
      uWaterDeepColor?: Color;
      uWaterShallowColor?: Color;
      uRippleStrength?: number;
    };
  }
}

// ---------------------------------------------------------------------------
// Lake  (config-driven: position, colours, ripple strength)
// ---------------------------------------------------------------------------
const MAX_RIPPLES = 8;

interface LakeProps {
  waterHeight: number;
  waterDeepColor: string;
  waterShallowColor: string;
  rippleStrength: number;
}

function Lake({ waterHeight, waterDeepColor, waterShallowColor, rippleStrength }: LakeProps) {
  const matRef = useRef<ShaderMaterial & {
    uTime: number;
    uRippleOrigins: Float32Array;
    uRippleStartTimes: Float32Array;
    uWaterDeepColor: Color;
    uWaterShallowColor: Color;
    uRippleStrength: number;
  }>(null);

  const rippleOrigins    = useRef(new Float32Array(16).fill(0));
  const rippleStartTimes = useRef(new Float32Array(8).fill(-999));
  const rippleHead       = useRef(0);
  const deepColorObj     = useRef(new Color(waterDeepColor));
  const shallowColorObj  = useRef(new Color(waterShallowColor));

  useFrame((state) => {
    if (!matRef.current) return;
    const t = state.clock.getElapsedTime();
    matRef.current.uTime = t;

    // Sync colours (cheap .set() avoids allocations)
    deepColorObj.current.set(waterDeepColor);
    shallowColorObj.current.set(waterShallowColor);
    matRef.current.uWaterDeepColor    = deepColorObj.current;
    matRef.current.uWaterShallowColor = shallowColorObj.current;
    matRef.current.uRippleStrength    = rippleStrength;

    // Sync ripple buffers
    matRef.current.uRippleOrigins    = rippleOrigins.current;
    matRef.current.uRippleStartTimes = rippleStartTimes.current;

    // Expire old ripples
    for (let i = 0; i < MAX_RIPPLES; i++) {
      if (rippleStartTimes.current[i] > -100 && t - rippleStartTimes.current[i] > 5.5) {
        rippleStartTimes.current[i] = -999;
      }
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const t   = matRef.current?.uTime ?? 0;
    const idx = rippleHead.current % MAX_RIPPLES;
    rippleOrigins.current[idx * 2]     = e.point.x;
    rippleOrigins.current[idx * 2 + 1] = e.point.z;
    rippleStartTimes.current[idx]      = t;
    rippleHead.current++;
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, waterHeight, -20]}
      onPointerDown={handlePointerDown}
    >
      <planeGeometry args={[90, 240, 200, 200]} />
      {/* @ts-expect-error custom material */}
      <waterShaderMaterial ref={matRef} transparent depthWrite={false} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Mountains (static geometry, vertex colours)
// ---------------------------------------------------------------------------
function fbm(x: number, z: number): number {
  let value = 0, amp = 1, freq = 0.08;
  for (let i = 0; i < 6; i++) {
    value += amp * (
      Math.sin(x * freq + Math.cos(z * freq * 0.7) * 1.3) * Math.cos(z * freq * 0.95) +
      Math.sin(x * freq * 1.7 + z * freq * 1.1) * 0.5
    );
    amp *= 0.5; freq *= 2.05;
  }
  return value;
}

function ridgeHeight(x: number, z: number, cx: number, maxH: number, w: number): number {
  const dist = Math.abs(x - cx);
  let f = Math.max(0, 1 - dist / w);
  f = f * f * (3 - 2 * f);
  const n = fbm(x, z);
  return f * (maxH + (Math.abs(n) * 1.2 + n * 0.3) * 5);
}

function Mountains() {
  const { geometry } = useMemo(() => {
    const W = 160, D = 240, WS = 140, DS = 180;
    const vc = (WS + 1) * (DS + 1);
    const positions = new Float32Array(vc * 3);
    const colors    = new Float32Array(vc * 3);

    const darkValley = new Color("#1a0d08");
    const midSlope   = new Color("#5a2a14");
    const litRock    = new Color("#c85820");
    const peakGlow   = new Color("#ffaa55");

    let idx = 0;
    for (let z = 0; z <= DS; z++) {
      for (let x = 0; x <= WS; x++) {
        const u = x / WS, v = z / DS;
        const wx = u * W - W / 2;
        const wz = v * D - D * 0.85;

        const lR  = ridgeHeight(wx, wz, -26, 16, 24);
        const rR  = ridgeHeight(wx, wz,  26, 16, 24);
        const bM  = Math.max(0, (-wz - 80) / 60);
        const bR  = bM * (8 + Math.abs(fbm(wx * 0.5, wz * 0.3)) * 5);
        let h     = Math.max(lR, rR, bR);
        h = (Math.abs(wx) < 12 && Math.abs(h) < 0.5) ? -2 : h - 1.5;

        positions[idx * 3] = wx; positions[idx * 3 + 1] = h; positions[idx * 3 + 2] = wz;

        const nh = Math.min(1, Math.max(0, (h + 2) / 18));
        const c  = new Color();
        if      (nh < 0.15) c.copy(darkValley);
        else if (nh < 0.45) c.copy(darkValley).lerp(midSlope,  (nh - 0.15) / 0.3);
        else if (nh < 0.75) c.copy(midSlope).lerp(litRock,     (nh - 0.45) / 0.3);
        else                c.copy(litRock).lerp(peakGlow,     (nh - 0.75) / 0.25);

        colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
        idx++;
      }
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.setAttribute("color",    new BufferAttribute(colors,    3));

    const indices: number[] = [];
    for (let z = 0; z < DS; z++) for (let x = 0; x < WS; x++) {
      const a = z*(WS+1)+x, b=a+1, c=(z+1)*(WS+1)+x, d=c+1;
      indices.push(a,c,b,b,c,d);
    }
    geo.setIndex(new BufferAttribute(new Uint32Array(indices), 1));
    geo.computeVertexNormals();
    return { geometry: geo };
  }, []);

  return <mesh geometry={geometry}><meshStandardMaterial vertexColors roughness={0.95} metalness={0.02} /></mesh>;
}

// ---------------------------------------------------------------------------
// Balloon  (config-driven: scale multiplier + float speed multiplier)
// ---------------------------------------------------------------------------
interface BalloonProps {
  position: [number, number, number];
  color: string;
  label: string;
  onClick: () => void;
  envMap?: Texture;
  scaleMultiplier?: number;
  speedMultiplier?: number;
}

function Balloon({ position, color, label, onClick, envMap, scaleMultiplier = 1, speedMultiplier = 1 }: BalloonProps) {
  const groupRef              = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  const { camera, gl } = useThree();
  const origin     = useMemo(() => new Vector3(...position), [position]);
  const dragPlane  = useRef(new Plane());
  const dragOffset = useRef(new Vector3());
  const dragStart  = useRef(new Vector3());
  const tmpHit     = useRef(new Vector3());
  const tmpDir     = useRef(new Vector3());
  const hasDragged = useRef(false);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // If dragging, don't animate — just stay put
    if (dragging) return;

    // When released, spring back to origin with bob/sway
    const t    = state.clock.getElapsedTime() * speedMultiplier;
    const bob  = Math.sin(t * 1.1 + origin.x * 2) * 0.3;
    const sway = Math.cos(t * 0.7 + origin.y)     * 0.12;

    // Strong spring constant for elastic return
    const k    = Math.min(1, delta * 3.8);
    const p    = groupRef.current.position;
    p.x += (origin.x + sway - p.x) * k;
    p.y += (origin.y + bob  - p.y) * k;
    p.z += (origin.z        - p.z) * k;
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!groupRef.current) return;
    e.stopPropagation();
    gl.domElement.setPointerCapture(e.pointerId);
    camera.getWorldDirection(tmpDir.current);
    tmpDir.current.negate();
    dragPlane.current.setFromNormalAndCoplanarPoint(tmpDir.current, groupRef.current.position);
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
    <group
      ref={groupRef}
      position={position}
    >
      {/* Body — this mesh handles all pointer events */}
      <mesh
        scale={hovered && !dragging ? 1.06 : 1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = dragging ? "grabbing" : "grab"; }}
        onPointerOut={()  => { if (!dragging) { setHovered(false); document.body.style.cursor = "auto"; } }}
      >
        <sphereGeometry args={[s, 64, 64]} />
        <meshPhysicalMaterial
          color={color} roughness={0.02} metalness={0.35}
          clearcoat={1} clearcoatRoughness={0.01} reflectivity={1}
          envMap={envMap ?? null} envMapIntensity={envMap ? 3.2 : 2.4}
          emissive={color} emissiveIntensity={hovered ? 0.35 : 0.1}
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
      {/* Label — explicitly disable pointer events so it doesn't block drag */}
      <Html position={[0, s + 0.9, 0]} center distanceFactor={8} pointerEvents="none">
        <div className="pointer-events-none select-none text-white font-bold text-lg whitespace-nowrap drop-shadow-[0_2px_10px_rgba(0,0,0,1)] tracking-wider uppercase">
          {label}
        </div>
      </Html>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Desert env wrapper (loads Poly Haven HDR for balloon reflections)
// ---------------------------------------------------------------------------
interface ClusterProps {
  balloons: Omit<BalloonProps, "envMap">[];
}

function BalloonCluster({ balloons }: ClusterProps) {
  const desertEnv = useEnvironment({
    files: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloppenheim_06_1k.hdr",
  }) as Texture;

  return (
    <>{balloons.map((b) => <Balloon key={b.label} {...b} envMap={desertEnv} />)}</>
  );
}

// ---------------------------------------------------------------------------
// Scene root
// ---------------------------------------------------------------------------
export function MountainLakeScene() {
  const router   = useRouter();
  const [config, setConfig] = useState<SceneConfig>(defaultConfig);

  const patch = (p: Partial<SceneConfig>) => setConfig((c) => ({ ...c, ...p }));
  const reset = () => setConfig(defaultConfig);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const balloons: Omit<BalloonProps, "envMap">[] = [
    { position: [-4.5, 5.5, -6.0], color: "#3b82f6", label: "About",    scaleMultiplier: config.balloonScale, speedMultiplier: config.balloonSpeed, onClick: () => scrollTo("about")    },
    { position: [ 4.5, 5.5, -6.5], color: "#a855f7", label: "Projects", scaleMultiplier: config.balloonScale, speedMultiplier: config.balloonSpeed, onClick: () => scrollTo("projects") },
    { position: [ 0.0, 6.5, -7.0], color: "#06b6d4", label: "Blog",     scaleMultiplier: config.balloonScale, speedMultiplier: config.balloonSpeed, onClick: () => router.push("/blog") },
    { position: [ 0.0, 2.8, -5.4], color: "#ec4899", label: "Contact",  scaleMultiplier: config.balloonScale, speedMultiplier: config.balloonSpeed, onClick: () => scrollTo("contact")  },
  ];

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 3.5, 14], fov: 62 }} dpr={[1, 1.5]} gl={{ antialias: true, toneMappingExposure: 1.15 }} style={{ pointerEvents: "auto" }}>

          <Environment preset={config.envPreset as Parameters<typeof Environment>[0]["preset"]} background blur={0.02} />
          <fog attach="fog" args={["#2a140a", config.fogNear, 140]} />

          <directionalLight position={[-40, 10, -60]} intensity={config.sunIntensity} color="#ff8040" />
          <directionalLight position={[ 20, 15,  20]} intensity={0.4}                color="#4a5aa8" />
          <ambientLight intensity={0.2} color="#3a2518" />
          <pointLight position={[0, 8, -5]} intensity={0.8} color="#ffcc88" distance={18} />

          <Mountains />

          <Lake
            waterHeight={config.waterHeight}
            waterDeepColor={config.waterDeepColor}
            waterShallowColor={config.waterShallowColor}
            rippleStrength={config.rippleStrength}
          />

          <Suspense fallback={<>{balloons.map((b) => <Balloon key={b.label} {...b} />)}</>}>
            <BalloonCluster balloons={balloons} />
          </Suspense>

        </Canvas>
      </div>

      {/* Config panel lives OUTSIDE the pointer-events-none wrapper */}
      <SceneConfigPanel config={config} onChange={patch} onReset={reset} />
    </>
  );
}
