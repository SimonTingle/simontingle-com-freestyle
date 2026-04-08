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

        {/* Hero: transparent space letting the 3D scene + balloons be the focus.
            Title sits at the top, tagline at the bottom — leaves the center clear for the balloon cluster. */}
        <section className="h-screen relative pointer-events-none">
          <div className="absolute top-28 left-0 right-0 text-center">
            <h1 className="text-6xl md:text-8xl font-bold text-white tracking-wider drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
              SIMON TINGLE
            </h1>
          </div>
          <div className="absolute bottom-20 left-0 right-0 text-center">
            <p className="text-lg md:text-xl text-orange-100/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] tracking-wide">
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
