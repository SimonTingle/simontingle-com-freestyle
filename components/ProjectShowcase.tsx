"use client";

import { projects } from "@/lib/projects";
import { ProjectCard } from "./ProjectCard";
import { motion } from "framer-motion";

export function ProjectShowcase() {
  return (
    <section className="py-20 px-4 md:px-8 lg:px-16 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Selected Projects
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            A collection of interactive applications and creative web experiences
          </p>
        </motion.div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
