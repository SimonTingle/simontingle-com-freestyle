import { MountainLakeScene } from "@/components/MountainLakeScene";
import { About } from "@/components/About";
import { ProjectShowcase } from "@/components/ProjectShowcase";
import { Contact } from "@/components/Contact";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      {/* Fixed full-page 3D background scene */}
      <MountainLakeScene />

      {/* Content layer */}
      <div className="relative z-10 min-h-screen">
        <Navigation />

        {/* Hero: transparent space letting the 3D scene + balloons be the focus */}
        <section className="h-screen flex items-end justify-center pb-24 pointer-events-none">
          <div className="text-center pointer-events-auto">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
              Simon Tingle
            </h1>
            <p className="text-xl md:text-2xl text-blue-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              Building interactive experiences with code
            </p>
          </div>
        </section>

        <section id="about">
          <About />
        </section>
        <section id="projects">
          <ProjectShowcase />
        </section>
        <section id="contact">
          <Contact />
        </section>
        <Footer />
      </div>
    </>
  );
}
