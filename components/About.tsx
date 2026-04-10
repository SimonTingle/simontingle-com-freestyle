"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/hooks/useI18n";

const glowingButtonStyle = `
  @keyframes textGlow {
    0%, 100% {
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.5),
                   0 0 20px rgba(255, 255, 255, 0.3);
    }
    50% {
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.8),
                   0 0 40px rgba(255, 255, 255, 0.5);
    }
  }
  @keyframes textGlowGray {
    0%, 100% {
      text-shadow: 0 0 10px rgba(156, 163, 175, 0.5),
                   0 0 20px rgba(156, 163, 175, 0.3);
    }
    50% {
      text-shadow: 0 0 20px rgba(156, 163, 175, 0.8),
                   0 0 40px rgba(156, 163, 175, 0.5);
    }
  }
  .github-button-glow {
    animation: textGlow 2s ease-in-out infinite;
  }
  .github-button-glow:hover {
    color: #9ca3af;
    animation: textGlowGray 2s ease-in-out infinite;
  }
  .linkedin-button {
    background-color: #0A66C2;
    border-color: #0A66C2;
  }
  .linkedin-button:hover {
    background-color: #084B93;
    border-color: #084B93;
  }
`;

export function About() {
  const aboutTitle = useI18n("about.title");
  const aboutP1 = useI18n("about.description.p1");
  const aboutP2 = useI18n("about.description.p2");
  const getInTouchBtn = useI18n("about.cta.getInTouch");
  const githubBtn = useI18n("about.cta.github");
  const techStackTitle = useI18n("about.techStack");

  const skills = [
    "React",
    "TypeScript",
    "Next.js",
    "Three.js",
    "Web Audio API",
    "Node.js",
    "TailwindCSS",
    "Framer Motion",
    "Terraform",
    "AWS Cloud",
    "Python",
  ];

  return (
    <>
      <style>{glowingButtonStyle}</style>
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-slate-900/75 backdrop-blur-md border-t border-slate-700/50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8"
            style={{
              textShadow: '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3)'
            }}
          >
            {aboutTitle.translated}
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Text */}
            <div>
              <p className="text-lg text-gray-600 dark:text-gray-100 mb-4">
                {aboutP1.translated}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-100 mb-6">
                {aboutP2.translated}
              </p>

              {/* CTA */}
              <div className="flex gap-4">
                <a
                  href="#contact"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {getInTouchBtn.translated}
                </a>
                <a
                  href="https://github.com/SimonTingle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border-2 border-gray-400 dark:border-gray-500 text-white hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold rounded-lg transition-colors github-button-glow dark:text-white"
                >
                  {githubBtn.translated}
                </a>
                <a
                  href="https://www.linkedin.com/in/simontingle/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-2 border-2 rounded transition-colors linkedin-button flex items-center justify-center font-bold text-white"
                >
                  LinkedIn
                </a>
              </div>
            </div>

            {/* Skills */}
            <motion.div
              className="self-start"
              style={{ marginTop: '-80px' }}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h3
                className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
                style={{
                  textShadow: '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3)'
                }}
              >
                {techStackTitle.translated}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {skills.map((skill) => (
                  <div
                    key={skill}
                    className="px-4 py-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-gray-900 dark:text-blue-200 font-semibold text-center"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
    </>
  );
}
