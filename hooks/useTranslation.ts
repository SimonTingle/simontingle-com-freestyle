import { useEffect, useState } from "react";
import { translateText, detectUserLanguage } from "@/utils/translate";

/**
 * Hook for translating text dynamically
 * Usage: const translated = useTranslation("Hello world");
 */
export function useTranslation(text: string, sourceLang: string = "en") {
  const [translated, setTranslated] = useState(text);
  const [currentLang, setCurrentLang] = useState(detectUserLanguage());
  const [isLoading, setIsLoading] = useState(false);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLang(event.detail.language);
    };

    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener);
    };
  }, []);

  // Translate when language or text changes
  useEffect(() => {
    if (currentLang === sourceLang) {
      setTranslated(text);
      return;
    }

    setIsLoading(true);
    translateText(text, currentLang, sourceLang)
      .then((result) => {
        setTranslated(result);
      })
      .catch((error) => {
        console.error("Translation error:", error);
        setTranslated(text);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [text, currentLang, sourceLang]);

  return { translated, currentLang, isLoading };
}

/**
 * Hook to get current language
 */
export function useCurrentLanguage() {
  const [currentLang, setCurrentLang] = useState(detectUserLanguage());

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLang(event.detail.language);
    };

    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener);
    };
  }, []);

  return currentLang;
}
