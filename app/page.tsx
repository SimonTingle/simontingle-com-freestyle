"use client";

import { useState } from "react";
import { ProceduralTerrainScene } from "@/components/ProceduralTerrainScene";
import { About } from "@/components/About";
import { ProjectShowcase } from "@/components/ProjectShowcase";
import { Contact } from "@/components/Contact";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SceneConfigPanel, defaultConfig, type SceneConfig } from "@/components/SceneConfigPanel";

export default function Home() {
  const [config, setConfig] = useState<SceneConfig>(defaultConfig);

  function handleChange(patch: Partial<SceneConfig>) {
    setConfig((prev) => ({ ...prev, ...patch }));
  }

  return (
    <>
      {/* Fixed background: Procedural terrain */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ProceduralTerrainScene config={config} />
      </div>

      {/* Config panel — fixed top-right */}
      <SceneConfigPanel config={config} onChange={handleChange} onReset={() => setConfig(defaultConfig)} />

      {/* Content layer: sections float semi-transparently over the scene */}
      <div className="relative z-10">
        <Navigation />

        {/* Hero section */}
        <section className="h-screen flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <h1 className="text-6xl md:text-8xl font-bold text-white tracking-wider drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
              SIMON TINGLE
            </h1>
            <p className="text-lg md:text-xl text-orange-100/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] tracking-wide mt-4">
              Building interactive experiences with code
            </p>
          </div>
        </section>

        <section id="about" className="pointer-events-auto">
          <About />
        </section>

        <section id="projects" className="pointer-events-auto">
          <ProjectShowcase />
        </section>

        <section id="contact" className="pointer-events-auto">
          <Contact />
        </section>

        <Footer />
      </div>
    </>
  );
}
