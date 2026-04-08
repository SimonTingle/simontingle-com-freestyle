"use client";

import { motion } from "framer-motion";

export function About() {
  const skills = [
    "React",
    "TypeScript",
    "Next.js",
    "Three.js",
    "Web Audio API",
    "Node.js",
    "TailwindCSS",
    "Framer Motion",
  ];

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16 bg-slate-900/75 backdrop-blur-md border-t border-slate-700/50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
            About Me
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                I'm a creative developer passionate about building interactive,
                music-driven, and engaging web experiences. I specialize in full-stack
                development with a focus on creative coding, audio processing, and
                immersive user interfaces.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                My projects span music production tools, energy management apps,
                and experimental web technologies. I love exploring the intersection
                of technology and creativity.
              </p>

              {/* CTA */}
              <div className="flex gap-4">
                <a
                  href="#contact"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Get in Touch
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold rounded-lg transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>

            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Tech Stack
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
  );
}
