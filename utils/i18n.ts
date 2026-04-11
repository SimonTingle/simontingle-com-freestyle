/**
 * Comprehensive i18n (Internationalization) System
 * Features:
 * - JSON-based translations (one per language)
 * - Multi-level fallbacks (missing key → English → key name)
 * - Error handling & logging
 * - Translation caching
 * - Type-safe translation keys (TypeScript)
 */

import { SUPPORTED_LANGUAGES } from "./translate";

type TranslationKey = string; // e.g., "hero.title", "about.description.p1"

interface TranslationCache {
  [language: string]: { [key: string]: string };
}

const DEFAULT_LANGUAGE = "en";
const cache: TranslationCache = {};
let loadingPromises: { [language: string]: Promise<void> | undefined } = {};

/**
 * Load a language JSON file with error handling
 */
async function loadLanguage(language: string): Promise<{ [key: string]: string }> {
  // Return from cache if already loaded
  if (cache[language]) {
    return cache[language];
  }

  // Return cached promise if already loading
  if (loadingPromises[language]) {
    await loadingPromises[language];
    return cache[language];
  }

  // Load the language JSON
  loadingPromises[language] = (async () => {
    try {
      const response = await fetch(`/locales/${language}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load language: ${response.status}`);
      }
      const translations = await response.json();
      cache[language] = translations;
    } catch (error) {
      console.error(`[i18n] Error loading language "${language}":`, error);

      // Failsafe: If not English, try to load English as fallback
      if (language !== DEFAULT_LANGUAGE && !cache[DEFAULT_LANGUAGE]) {
        try {
          const response = await fetch(`/locales/${DEFAULT_LANGUAGE}.json`);
          if (response.ok) {
            const translations = await response.json();
            cache[language] = translations;
            console.warn(`[i18n] Loaded English as fallback for "${language}"`);
          }
        } catch (fallbackError) {
          console.error(`[i18n] Critical: Could not load fallback English`, fallbackError);
          // Return empty object - translations will fall back to key names
          cache[language] = {};
        }
      } else if (language === DEFAULT_LANGUAGE) {
        // If English fails, return empty object
        cache[language] = {};
      }
    }
  })();

  await loadingPromises[language];
  return cache[language] || {};
}

/**
 * Get translation for a key with multi-level fallbacks
 * Fallback hierarchy:
 * 1. Exact language
 * 2. English (if language != English)
 * 3. Key name itself (last resort)
 */
export async function t(key: TranslationKey, language: string = DEFAULT_LANGUAGE): Promise<string> {
  // Validate inputs
  if (!key || typeof key !== "string") {
    console.warn(`[i18n] Invalid key:`, key);
    return key || "UNKNOWN_KEY";
  }

  // Normalize language code (e.g., "en-US" → "en")
  const normalizedLang = (language || DEFAULT_LANGUAGE).split("-")[0];

  try {
    // Level 1: Try to get translation from requested language
    const translations = await loadLanguage(normalizedLang);
    if (translations[key]) {
      return translations[key];
    }

    // Level 2: Fallback to English if requested language is not English
    if (normalizedLang !== DEFAULT_LANGUAGE) {
      const englishTranslations = await loadLanguage(DEFAULT_LANGUAGE);
      if (englishTranslations[key]) {
        console.warn(`[i18n] Missing key "${key}" in "${normalizedLang}", using English fallback`);
        return englishTranslations[key];
      }
    }

    // Level 3: Ultimate fallback - return the key name formatted
    console.warn(`[i18n] Missing key in all languages: "${key}"`);
    return formatKeyAsText(key);
  } catch (error) {
    console.error(`[i18n] Error getting translation for key "${key}":`, error);
    return formatKeyAsText(key);
  }
}

/**
 * Format a key as readable text when translation is missing
 * e.g., "hero.title" → "Hero Title"
 */
function formatKeyAsText(key: string): string {
  return key
    .split(".")
    .pop() // Get last part: "hero.title" → "title"
    ?.split(/(?=[A-Z])|[-_]/) // Split camelCase and separators
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || key;
}

/**
 * Batch load a language (for initialization)
 */
export async function preloadLanguage(language: string): Promise<void> {
  await loadLanguage(language);
}

/**
 * Get all translations for a language
 */
export async function getAllTranslations(language: string): Promise<{ [key: string]: string }> {
  return await loadLanguage(language);
}

/**
 * Clear cache (useful for testing or language updates)
 */
export function clearTranslationCache(): void {
  Object.keys(cache).forEach((key) => {
    delete cache[key];
  });
  loadingPromises = {};
  console.log("[i18n] Translation cache cleared");
}

/**
 * Validate translations (check for missing keys)
 * Returns array of missing keys if any
 */
export async function validateTranslations(language: string): Promise<{
  isValid: boolean;
  missingKeys: string[];
  extraKeys: string[];
}> {
  try {
    const englishTranslations = await loadLanguage(DEFAULT_LANGUAGE);
    const languageTranslations = await loadLanguage(language);

    const englishKeys = Object.keys(englishTranslations);
    const languageKeys = Object.keys(languageTranslations);

    const missingKeys = englishKeys.filter((key) => !languageKeys.includes(key));
    const extraKeys = languageKeys.filter((key) => !englishKeys.includes(key));

    const isValid = missingKeys.length === 0;

    if (!isValid) {
      console.warn(`[i18n] Validation failed for "${language}":`, {
        missingKeys,
        extraKeys,
      });
    }

    return { isValid, missingKeys, extraKeys };
  } catch (error) {
    console.error(`[i18n] Validation error for "${language}":`, error);
    return { isValid: false, missingKeys: [], extraKeys: [] };
  }
}

/**
 * Log translation statistics
 */
export async function logTranslationStats(): Promise<void> {
  try {
    const stats: { [language: string]: { total: number; loaded: boolean } } = {};

    for (const langCode of Object.keys(SUPPORTED_LANGUAGES)) {
      const translations = await loadLanguage(langCode);
      stats[langCode] = {
        total: Object.keys(translations).length,
        loaded: !!cache[langCode],
      };
    }

    console.table(stats);
  } catch (error) {
    console.error("[i18n] Error logging stats:", error);
  }
}

/**
 * Development helper: Find all missing translation keys
 */
export async function findMissingKeys(): Promise<string[]> {
  const missing: string[] = [];

  for (const langCode of Object.keys(SUPPORTED_LANGUAGES)) {
    const validation = await validateTranslations(langCode);
    if (!validation.isValid) {
      missing.push(`${langCode}: ${validation.missingKeys.join(", ")}`);
    }
  }

  return missing;
}
