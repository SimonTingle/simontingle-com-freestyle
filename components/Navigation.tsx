"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SUPPORTED_LANGUAGES, detectUserLanguage, setUserLanguage } from "@/utils/translate";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");

  // Detect user language on mount
  useEffect(() => {
    const detected = detectUserLanguage();
    setCurrentLang(detected);
  }, []);

  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    setUserLanguage(lang);
    setLangOpen(false);
    // Trigger a custom event so other components can react to language change
    window.dispatchEvent(new CustomEvent("languageChange", { detail: { language: lang } }));
  };

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Projects", href: "#projects" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-slate-900/80 to-transparent backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-white">
          ST
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-white hover:text-blue-400 transition-colors font-medium"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Language Selector - Desktop */}
        <div className="hidden md:relative md:block">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 px-3 py-2 text-white hover:text-blue-400 transition-colors font-medium"
            aria-label="Select language"
          >
            <span className="text-lg">{SUPPORTED_LANGUAGES[currentLang as keyof typeof SUPPORTED_LANGUAGES]?.flag || "🌐"}</span>
            <span className="text-xs">▼</span>
          </button>
          <AnimatePresence>
            {langOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full right-0 mt-2 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden z-50"
              >
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code)}
                    className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
                      currentLang === code
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm">{lang.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-white p-2"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-sm md:hidden"
          >
            <div className="flex flex-col gap-4 p-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-blue-400 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
              {/* Language Selector - Mobile */}
              <div className="border-t border-slate-700 pt-4 mt-2">
                <p className="text-xs text-gray-400 mb-2">Language</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className={`px-3 py-2 rounded text-sm flex items-center gap-1 transition-colors ${
                        currentLang === code
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="text-xs">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
