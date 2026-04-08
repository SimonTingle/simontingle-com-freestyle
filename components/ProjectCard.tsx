"use client";

import { Project } from "@/lib/projects";
import Link from "next/link";
import { motion } from "framer-motion";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const isPlaceholder = project.liveUrl === "#";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl ${
        isPlaceholder ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800"
      }`}
    >
      {/* Project Image */}
      <div className={`relative w-full h-64 overflow-hidden bg-gradient-to-br ${project.color || "from-gray-300 to-gray-400"}`}>
        {!isPlaceholder ? (
          <img
            src={project.image}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500 text-sm">Coming soon</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {project.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          {project.description}
        </p>

        {/* Tech badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tech.map((tech) => (
            <span
              key={tech}
              className="inline-block px-3 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Links */}
        {!isPlaceholder && (
          <div className="flex gap-3">
            <Link
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-center text-sm"
            >
              Live Demo
            </Link>
            {project.githubUrl && (
              <Link
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors text-center text-sm"
              >
                GitHub
              </Link>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
