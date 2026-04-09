"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Config schema + defaults
// ---------------------------------------------------------------------------
export interface SceneConfig {
  waterHeight: number;
  waterDeepColor: string;
  waterShallowColor: string;
  rippleStrength: number;
  fogNear: number;
  envPreset: string;
  sunIntensity: number;
  balloonScale: number;
  balloonSpeed: number;
}

export const defaultConfig: SceneConfig = {
  waterHeight: -2,
  waterDeepColor: "#01102a",
  waterShallowColor: "#0a5560",
  rippleStrength: 1,
  fogNear: 25,
  envPreset: "sunset",
  sunIntensity: 3.5,
  balloonScale: 1,
  balloonSpeed: 1,
};

// ---------------------------------------------------------------------------
// Small reusable UI primitives
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

// ---------------------------------------------------------------------------
// Environment preset picker
// ---------------------------------------------------------------------------
const ENV_OPTIONS = [
  { id: "sunset",    label: "Sunset",     icon: "🌅" },
  { id: "dawn",      label: "Dawn",       icon: "🌄" },
  { id: "night",     label: "Night",      icon: "🌙" },
  { id: "forest",    label: "Forest",     icon: "🌲" },
  { id: "city",      label: "City",       icon: "🏙️"  },
  { id: "warehouse", label: "Industrial", icon: "🏭" },
] as const;

// ---------------------------------------------------------------------------
// Gear icon SVG
// ---------------------------------------------------------------------------
function GearIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main panel component
// ---------------------------------------------------------------------------
interface Props {
  config: SceneConfig;
  onChange: (patch: Partial<SceneConfig>) => void;
  onReset: () => void;
}

export function SceneConfigPanel({ config, onChange, onReset }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">

      {/* Slide-up panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-72 bg-slate-950/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.7)] overflow-hidden pointer-events-auto"
          >
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 pointer-events-auto">
              <span className="text-white text-sm font-semibold tracking-wide">Scene Config</span>
              <button
                onClick={onReset}
                className="text-slate-500 hover:text-slate-300 text-[11px] transition-colors pointer-events-auto"
              >
                ↺ Reset
              </button>
            </div>

            {/* Scrollable body */}
            <div className="px-4 py-4 flex flex-col gap-5 max-h-[72vh] overflow-y-auto pointer-events-auto">

              {/* ── ENVIRONMENT ── */}
              <div className="flex flex-col gap-3 pointer-events-auto">
                <SectionHeader>🌍 Environment</SectionHeader>

                <Row label="Time of day">
                  <div className="grid grid-cols-3 gap-1.5 mt-0.5 pointer-events-auto">
                    {ENV_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => onChange({ envPreset: opt.id })}
                        className={`flex flex-col items-center py-1.5 rounded-lg text-[10px] border transition-all leading-none gap-1 pointer-events-auto ${
                          config.envPreset === opt.id
                            ? "bg-blue-600/35 border-blue-500/80 text-white"
                            : "bg-slate-800/50 border-slate-700/40 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-sm">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Row>

                <Slider label="Sun intensity" value={config.sunIntensity}
                  min={0} max={6} step={0.1} fmt={(v) => v.toFixed(1)}
                  onChange={(v) => onChange({ sunIntensity: v })}
                />
              </div>

              {/* ── WATER ── */}
              <div className="flex flex-col gap-3 pointer-events-auto">
                <SectionHeader>🌊 Water</SectionHeader>

                <Slider label="Water height" value={config.waterHeight}
                  min={-6} max={1} step={0.1}
                  fmt={(v) => (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
                  onChange={(v) => onChange({ waterHeight: v })}
                />

                <Swatches
                  label="Deep colour"
                  value={config.waterDeepColor}
                  palette={["#01102a", "#0a0a2a", "#0a1a10", "#1a0808", "#1a1030", "#000a1a"]}
                  onChange={(c) => onChange({ waterDeepColor: c })}
                />
                <Swatches
                  label="Shallow colour"
                  value={config.waterShallowColor}
                  palette={["#0a5560", "#1060a0", "#108040", "#607030", "#606080", "#2a8080"]}
                  onChange={(c) => onChange({ waterShallowColor: c })}
                />

                <Slider label="Ripple strength" value={config.rippleStrength}
                  min={0} max={2} step={0.05} fmt={(v) => v.toFixed(2)}
                  onChange={(v) => onChange({ rippleStrength: v })}
                />
              </div>

              {/* ── ATMOSPHERE ── */}
              <div className="flex flex-col gap-3 pointer-events-auto">
                <SectionHeader>🌫️ Atmosphere</SectionHeader>

                <Slider label="Fog distance" value={config.fogNear}
                  min={5} max={60} step={1} fmt={(v) => `${Math.round(v)} u`}
                  onChange={(v) => onChange({ fogNear: v })}
                />
              </div>

              {/* ── BALLOONS ── */}
              <div className="flex flex-col gap-3 pointer-events-auto">
                <SectionHeader>🎈 Balloons</SectionHeader>

                <Slider label="Size" value={config.balloonScale}
                  min={0.3} max={2.5} step={0.05} fmt={(v) => `${v.toFixed(2)}×`}
                  onChange={(v) => onChange({ balloonScale: v })}
                />
                <Slider label="Float speed" value={config.balloonSpeed}
                  min={0.1} max={3} step={0.05} fmt={(v) => `${v.toFixed(2)}×`}
                  onChange={(v) => onChange({ balloonSpeed: v })}
                />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border transition-colors pointer-events-auto ${
          open
            ? "bg-blue-600 border-blue-400 text-white"
            : "bg-slate-950/80 backdrop-blur-md border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-500"
        }`}
        aria-label="Toggle scene config"
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
