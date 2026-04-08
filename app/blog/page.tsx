"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  slug: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Building a DJ Mixer in the Browser",
    excerpt:
      "A technical deep-dive into building a full-featured DJ mixing application using React and the Web Audio API. We'll explore dual turntables, real-time audio processing, and performance optimization.",
    date: "2025-04-08",
    readTime: "12 min read",
    tags: ["web-audio-api", "react", "javascript"],
    slug: "building-dj-mixer",
  },
  {
    id: "2",
    title: "React + Three.js: Performance Gotchas",
    excerpt:
      "Tips and tricks for optimizing 3D scenes in React using Three.js and React Three Fiber. Learn how to avoid common performance pitfalls and build smooth 60fps experiences.",
    date: "2025-04-01",
    readTime: "10 min read",
    tags: ["three.js", "react", "performance"],
    slug: "react-threejs-performance",
  },
  {
    id: "3",
    title: "Audio Processing with Web Audio API",
    excerpt:
      "Exploring the Web Audio API for creative audio applications. From basic waveform visualization to advanced frequency analysis and real-time effects processing.",
    date: "2025-03-25",
    readTime: "15 min read",
    tags: ["web-audio-api", "javascript", "music"],
    slug: "web-audio-api-guide",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Navigation />
      <main className="flex-1 pt-20 pb-0">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Blog
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Thoughts on creative coding, web development, and digital experiences
            </p>
          </motion.div>

          {/* Blog Posts */}
          <div className="space-y-12">
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="pb-12 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <div className="space-y-3 mb-4">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
                >
                  Read More →
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
