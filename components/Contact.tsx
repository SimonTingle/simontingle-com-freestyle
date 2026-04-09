"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export function Contact() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission (integrate with email service like SendGrid, Resend, etc.)
    console.log({ email, message });
    setIsSubmitted(true);
    setEmail("");
    setMessage("");
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16 bg-slate-900/75 backdrop-blur-md border-t border-slate-700/50">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Let's Work Together
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Have an idea for a project? I'd love to hear about it.
            </p>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <label htmlFor="message" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                placeholder="Tell me about your project..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Send Message
            </motion.button>

            {isSubmitted && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-green-600 dark:text-green-400 font-semibold"
              >
                Thanks for reaching out! I'll get back to you soon.
              </motion.p>
            )}
          </form>

          {/* Alternative Contact Methods */}
          <div className="mt-12 pt-12 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Or reach out directly:
            </p>
            <div className="flex justify-center gap-6 flex-wrap">
              <a
                href="mailto:hello@simontingle.com"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
              >
                hello@simontingle.com
              </a>
              <a
                href="https://github.com/SimonTingle"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
              >
                GitHub
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
