// Translation API utility (uses Next.js API route to avoid CORS issues)
const TRANSLATION_API = "/api/translate";

// Cache for translations to avoid repeated API calls
const translationCache = new Map<string, string>();

// Supported languages with flags
export const SUPPORTED_LANGUAGES = {
  en: { name: "English", flag: "🇬🇧", code: "en" },
  es: { name: "Español", flag: "🇪🇸", code: "es" },
  fr: { name: "Français", flag: "🇫🇷", code: "fr" },
  de: { name: "Deutsch", flag: "🇩🇪", code: "de" },
  it: { name: "Italiano", flag: "🇮🇹", code: "it" },
  pt: { name: "Português", flag: "🇵🇹", code: "pt" },
  ja: { name: "日本語", flag: "🇯🇵", code: "ja" },
  zh: { name: "中文", flag: "🇨🇳", code: "zh" },
};

// Detect user's language from browser
export function detectUserLanguage(): string {
  // Check localStorage first
  const saved = typeof window !== "undefined" ? localStorage.getItem("userLanguage") : null;
  if (saved && saved in SUPPORTED_LANGUAGES) {
    return saved;
  }

  // Get from browser
  const browserLang = typeof navigator !== "undefined" ? navigator.language.split("-")[0] : "en";

  // Return if supported, otherwise default to English
  return browserLang in SUPPORTED_LANGUAGES ? browserLang : "en";
}

// Save language preference
export function setUserLanguage(lang: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("userLanguage", lang);
  }
}

// Translate text using LibreTranslate
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = "en"
): Promise<string> {
  // If source and target are the same, return original
  if (sourceLang === targetLang) {
    return text;
  }

  // For now, return original text (translation API is unreliable)
  // In the future, can integrate with a reliable paid API
  return text;
}

// Translate multiple texts at once
export async function translateTexts(
  texts: string[],
  targetLang: string,
  sourceLang: string = "en"
): Promise<string[]> {
  return Promise.all(texts.map((text) => translateText(text, targetLang, sourceLang)));
}
