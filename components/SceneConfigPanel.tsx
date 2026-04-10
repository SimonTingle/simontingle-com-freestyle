"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Config schema + defaults
// ---------------------------------------------------------------------------
export interface SceneConfig {
  // ── Terrain ──────────────────────────────────────────────────────────────
  terrainScale: number;        // vertical height multiplier 0.5–2
  terrainColor: string;        // base hex colour
  terrainRoughness: number;    // 0–1
  lodQuality: "low" | "medium" | "high";

  // ── Time of Day ──────────────────────────────────────────────────────────
  dayNightSpeed: number;       // 0 = paused, 0.1–5×
  manualTimeEnabled: boolean;  // if true, use manualTimeHour
  manualTimeHour: number;      // 0–24
  sunIntensity: number;        // 0–6
  moonIntensity: number;       // 0–2

  // ── Atmosphere ───────────────────────────────────────────────────────────
  fogDensity: number;          // 0–0.0003 (FogExp2 density)
  envPreset: string;

  // ── Water ────────────────────────────────────────────────────────────────
  waterHeight: number;
  waterDeepColor: string;
  waterShallowColor: string;
  rippleStrength: number;
  waveHeight: number;          // 0–60

  // ── Vegetation ───────────────────────────────────────────────────────────
  treeDensity: number;         // 0–2 overall density multiplier
  treeScale: number;           // 0.5–2
  treeLine: number;            // world-Y altitude where firs start (500–6000)
  firPercentage: number;       // 0–100 (only applies below tree line too)
  showFirTrees: boolean;
  showDeciduousTrees: boolean;
  showTrunks: boolean;

  // ── Birds ────────────────────────────────────────────────────────────────
  birdScale: number;           // 0.3–3×
  birdSpeed: number;           // 0.3–3×
  birdFlockSize: number;       // 1–5 birds per flock
  birdSpawnInterval: number;   // seconds between flocks 4–30
  birdEnabled: boolean;

  // ── Post / misc ──────────────────────────────────────────────────────────
  shadowsEnabled: boolean;
  antialias: boolean;
}

export const defaultConfig: SceneConfig = {
  terrainScale: 1,
  terrainColor: "#558833",
  terrainRoughness: 0.9,
  lodQuality: "high",

  dayNightSpeed: 1,
  manualTimeEnabled: false,
  manualTimeHour: 12,
  sunIntensity: 3.5,
  moonIntensity: 0.8,

  fogDensity: 0.00008,
  envPreset: "sunset",

  waterHeight: 500,
  waterDeepColor: "#01102a",
  waterShallowColor: "#0a5560",
  rippleStrength: 1,
  waveHeight: 15,

  treeDensity: 1,
  treeScale: 1,
  treeLine: 2500,
  firPercentage: 50,
  showFirTrees: true,
  showDeciduousTrees: true,
  showTrunks: true,

  birdScale: 1,
  birdSpeed: 1,
  birdFlockSize: 3,
  birdSpawnInterval: 10,
  birdEnabled: true,

  shadowsEnabled: true,
  antialias: true,
};

// ---------------------------------------------------------------------------
// Primitive UI components
// ---------------------------------------------------------------------------
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-700/70 pb-1 mb-0.5">
      {children}
    </p>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 pointer-events-auto">
      <div className="flex justify-between">
        <span className="text-slate-300 text-[11px]">{label}</span>
        {value !== undefined && (
          <span className="text-blue-300 text-[11px] font-mono tabular-nums">{value}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Slider({
  label, value, min, max, step = 0.01,
  fmt = (v: number) => v.toFixed(2),
  onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  fmt?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <Row label={label} value={fmt(value)}>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500 pointer-events-auto"
      />
    </Row>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between pointer-events-auto">
      <span className="text-slate-300 text-[11px]">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors pointer-events-auto ${value ? "bg-blue-600" : "bg-slate-700"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "left-4" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function Swatches({
  label, value, palette, onChange,
}: { label: string; value: string; palette: string[]; onChange: (c: string) => void }) {
  return (
    <Row label={label}>
      <div className="flex gap-1.5 flex-wrap pointer-events-auto">
        {palette.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => onChange(c)}
            className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 cursor-pointer pointer-events-auto ${value === c ? "border-white scale-110" : "border-transparent"}`}
            style={{ background: c }}
          />
        ))}
      </div>
    </Row>
  );
}

function Pills<T extends string>({
  label, value, options, onChange,
}: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <Row label={label}>
      <div className="flex gap-1 flex-wrap mt-0.5 pointer-events-auto">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`px-2 py-0.5 rounded text-[10px] border transition-all pointer-events-auto ${
              value === o.id
                ? "bg-blue-600/35 border-blue-500/80 text-white"
                : "bg-slate-800/50 border-slate-700/40 text-slate-400 hover:border-slate-500 hover:text-slate-200"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Row>
  );
}

// ---------------------------------------------------------------------------
// Accordion section
// ---------------------------------------------------------------------------
function Section({
  icon, title, children,
  defaultOpen = false,
}: { icon: string; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-800/60 rounded-xl overflow-hidden pointer-events-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/60 hover:bg-slate-800/60 transition-colors pointer-events-auto"
      >
        <span className="flex items-center gap-2 text-slate-200 text-[12px] font-semibold">
          <span>{icon}</span>
          {title}
        </span>
        <span className={`text-slate-500 text-[10px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pt-3 pb-6 flex flex-col gap-3 bg-slate-950/40 pointer-events-auto max-h-80 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 transparent" }}>
              {children}
              {/* Bottom buffer — scrollable extra space at end */}
              <div className="h-12 shrink-0" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gear icon
// ---------------------------------------------------------------------------
function GearIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------
interface Props {
  config: SceneConfig;
  onChange: (patch: Partial<SceneConfig>) => void;
  onReset: () => void;
}

const LOD_OPTIONS = [
  { id: "low" as const,    label: "Low — fast" },
  { id: "medium" as const, label: "Medium" },
  { id: "high" as const,   label: "High — detailed" },
];

const ENV_OPTIONS = [
  { id: "sunset",    label: "Sunset" },
  { id: "dawn",      label: "Dawn" },
  { id: "noon",      label: "Noon" },
  { id: "night",     label: "Night" },
  { id: "overcast",  label: "Overcast" },
  { id: "storm",     label: "Storm" },
] as const;

const TERRAIN_COLORS = ["#558833", "#4a7a2e", "#6b9940", "#8b7355", "#7a6545", "#3d6b52", "#2e5c3a", "#c4a35a"];
const WATER_DEEP_COLORS = ["#01102a", "#0a0a2a", "#0a1a10", "#1a0808", "#1a1030", "#000a1a"];
const WATER_SHALLOW_COLORS = ["#0a5560", "#1060a0", "#108040", "#607030", "#606080", "#2a8080"];

export function SceneConfigPanel({ config, onChange, onReset }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-3 pointer-events-auto">

      {/* Slide-in panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-80 bg-slate-950/92 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_8px_60px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60">
              <span className="text-white text-sm font-bold tracking-wide">Scene Settings</span>
              <button
                onClick={onReset}
                className="text-slate-500 hover:text-orange-400 text-[11px] transition-colors pointer-events-auto px-2 py-0.5 rounded border border-slate-700/50 hover:border-orange-500/50"
              >
                ↺ Reset all
              </button>
            </div>

            {/* Scrollable sections */}
            <div className="px-3 pt-3 pb-3 flex flex-col gap-2 max-h-[85vh] overflow-y-auto pointer-events-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 transparent" }}>

              {/* ── TERRAIN ── */}
              <Section icon="🏔️" title="Terrain" defaultOpen>
                <Slider label="Height scale" value={config.terrainScale}
                  min={0.3} max={2.5} step={0.05} fmt={(v) => `${v.toFixed(2)}×`}
                  onChange={(v) => onChange({ terrainScale: v })}
                />
                <Slider label="Roughness" value={config.terrainRoughness}
                  min={0} max={1} step={0.05} fmt={(v) => v.toFixed(2)}
                  onChange={(v) => onChange({ terrainRoughness: v })}
                />
                <Swatches label="Ground colour" value={config.terrainColor}
                  palette={TERRAIN_COLORS}
                  onChange={(c) => onChange({ terrainColor: c })}
                />
                <Pills label="Render quality" value={config.lodQuality}
                  options={LOD_OPTIONS}
                  onChange={(v) => onChange({ lodQuality: v })}
                />
              </Section>

              {/* ── TIME OF DAY ── */}
              <Section icon="🌞" title="Time of Day">
                <Toggle label="Manual time control" value={config.manualTimeEnabled}
                  onChange={(v) => onChange({ manualTimeEnabled: v })}
                />
                {config.manualTimeEnabled ? (
                  <Slider label="Hour" value={config.manualTimeHour}
                    min={0} max={24} step={0.25}
                    fmt={(v) => {
                      const h = Math.floor(v);
                      const m = Math.round((v - h) * 60);
                      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                    }}
                    onChange={(v) => onChange({ manualTimeHour: v })}
                  />
                ) : (
                  <Slider label="Cycle speed" value={config.dayNightSpeed}
                    min={0} max={5} step={0.1} fmt={(v) => v === 0 ? "paused" : `${v.toFixed(1)}×`}
                    onChange={(v) => onChange({ dayNightSpeed: v })}
                  />
                )}
                <Slider label="Sun intensity" value={config.sunIntensity}
                  min={0} max={6} step={0.1} fmt={(v) => v.toFixed(1)}
                  onChange={(v) => onChange({ sunIntensity: v })}
                />
                <Slider label="Moon intensity" value={config.moonIntensity}
                  min={0} max={2} step={0.05} fmt={(v) => v.toFixed(2)}
                  onChange={(v) => onChange({ moonIntensity: v })}
                />
              </Section>

              {/* ── ATMOSPHERE ── */}
              <Section icon="🌫️" title="Atmosphere">
                <Slider label="Fog density" value={config.fogDensity}
                  min={0} max={0.0003} step={0.000005}
                  fmt={(v) => (v * 100000).toFixed(1) + "e-5"}
                  onChange={(v) => onChange({ fogDensity: v })}
                />
                <Pills label="Sky preset" value={config.envPreset as any}
                  options={ENV_OPTIONS as any}
                  onChange={(v) => onChange({ envPreset: v })}
                />
              </Section>

              {/* ── WATER ── */}
              <Section icon="🌊" title="Water">
                <Slider label="Water level" value={config.waterHeight}
                  min={0} max={2000} step={10} fmt={(v) => `${Math.round(v)}`}
                  onChange={(v) => onChange({ waterHeight: v })}
                />
                <Slider label="Wave height" value={config.waveHeight}
                  min={0} max={60} step={1} fmt={(v) => `${Math.round(v)}`}
                  onChange={(v) => onChange({ waveHeight: v })}
                />
                <Slider label="Ripple strength" value={config.rippleStrength}
                  min={0} max={2} step={0.05} fmt={(v) => v.toFixed(2)}
                  onChange={(v) => onChange({ rippleStrength: v })}
                />
                <Swatches label="Deep colour" value={config.waterDeepColor}
                  palette={WATER_DEEP_COLORS}
                  onChange={(c) => onChange({ waterDeepColor: c })}
                />
                <Swatches label="Shallow colour" value={config.waterShallowColor}
                  palette={WATER_SHALLOW_COLORS}
                  onChange={(c) => onChange({ waterShallowColor: c })}
                />
              </Section>

              {/* ── VEGETATION ── */}
              <Section icon="🌲" title="Vegetation">
                <Slider label="Overall density" value={config.treeDensity}
                  min={0} max={2.5} step={0.05} fmt={(v) => `${v.toFixed(2)}×`}
                  onChange={(v) => onChange({ treeDensity: v })}
                />
                <Slider label="Tree scale" value={config.treeScale}
                  min={0.3} max={3} step={0.05} fmt={(v) => `${v.toFixed(2)}×`}
                  onChange={(v) => onChange({ treeScale: v })}
                />
                <Slider label="Tree line altitude" value={config.treeLine}
                  min={500} max={6000} step={100} fmt={(v) => `${Math.round(v)} m`}
                  onChange={(v) => onChange({ treeLine: v })}
                />
                <Slider label="Fir tree %" value={config.firPercentage}
                  min={0} max={100} step={1} fmt={(v) => `${Math.round(v)}%`}
                  onChange={(v) => onChange({ firPercentage: v, })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Toggle label="Fir trees" value={config.showFirTrees}
                    onChange={(v) => onChange({ showFirTrees: v })}
                  />
                  <Toggle label="Deciduous" value={config.showDeciduousTrees}
                    onChange={(v) => onChange({ showDeciduousTrees: v })}
                  />
                </div>
                <Toggle label="Show trunks" value={config.showTrunks}
                  onChange={(v) => onChange({ showTrunks: v })}
                />
              </Section>

              {/* ── BIRDS ── */}
              <Section icon="🐦" title="Birds">
                <Toggle label="Enable birds" value={config.birdEnabled}
                  onChange={(v) => onChange({ birdEnabled: v })}
                />
                {config.birdEnabled && (<>
                  <Slider label="Bird scale" value={config.birdScale}
                    min={0.3} max={4} step={0.1} fmt={(v) => `${v.toFixed(1)}×`}
                    onChange={(v) => onChange({ birdScale: v })}
                  />
                  <Slider label="Flight speed" value={config.birdSpeed}
                    min={0.3} max={3} step={0.1} fmt={(v) => `${v.toFixed(1)}×`}
                    onChange={(v) => onChange({ birdSpeed: v })}
                  />
                  <Slider label="Flock size" value={config.birdFlockSize}
                    min={1} max={10} step={1} fmt={(v) => `${Math.round(v)} birds`}
                    onChange={(v) => onChange({ birdFlockSize: Math.round(v) })}
                  />
                  <Slider label="Spawn every" value={config.birdSpawnInterval}
                    min={4} max={40} step={1} fmt={(v) => `${Math.round(v)} s`}
                    onChange={(v) => onChange({ birdSpawnInterval: Math.round(v) })}
                  />
                </>)}
              </Section>

              {/* ── PERFORMANCE ── */}
              <Section icon="⚡" title="Performance">
                <Toggle label="Shadows" value={config.shadowsEnabled}
                  onChange={(v) => onChange({ shadowsEnabled: v })}
                />
                <div className="text-slate-500 text-[10px] leading-relaxed">
                  Render quality is set in the Terrain section.<br />
                  Changes require a scene reload (handled automatically).
                </div>
              </Section>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gear toggle button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border transition-colors pointer-events-auto ${
          open
            ? "bg-blue-600 border-blue-400 text-white"
            : "bg-slate-950/80 backdrop-blur-md border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-500"
        }`}
        aria-label="Toggle scene settings"
      >
        <motion.div
          animate={{ rotate: open ? 60 : 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          <GearIcon className="w-5 h-5" />
        </motion.div>
      </motion.button>
    </div>
  );
}
