"use client";

import { useState } from "react";
import { ProceduralTerrainScene } from "@/components/ProceduralTerrainScene";
import { About } from "@/components/About";
import { ProjectShowcase } from "@/components/ProjectShowcase";
import { Contact } from "@/components/Contact";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SceneConfigPanel, defaultConfig, type SceneConfig } from "@/components/SceneConfigPanel";
import { useI18n } from "@/hooks/useI18n";

export default function Home() {
  const heroTitle = useI18n("hero.title");
  const heroSubtitle = useI18n("hero.subtitle");
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
        <section className="relative h-[92vh] flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <h1
              className="text-6xl md:text-8xl font-bold text-white tracking-wider"
              style={{
                textShadow: '0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.15)'
              }}
            >
              {heroTitle.translated}
            </h1>
            <p
              className="text-lg md:text-xl text-orange-100/90 tracking-wide mt-4"
              style={{
                textShadow: '0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.15)'
              }}
            >
              {heroSubtitle.translated}
            </p>
          </div>

          {/* Scroll indicator: animated chevron + peek hint */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pb-6 pointer-events-none">
            {/* Animated chevron */}
            <svg
              className="w-5 h-5 text-white/40 hover:text-white/60 transition-colors duration-300 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            {/* Subtle fade-out gradient to About section below */}
            <div className="h-4 w-24 bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-30" />
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
