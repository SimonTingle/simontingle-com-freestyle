import { useEffect, useState } from "react";
import { t, preloadLanguage, validateTranslations } from "@/utils/i18n";
import { detectUserLanguage, setUserLanguage, SUPPORTED_LANGUAGES } from "@/utils/translate";

interface UseI18nOptions {
  fallback?: string; // Fallback text if translation fails
}

/**
 * Hook for getting translations with React integration
 * Handles:
 * - Language detection
 * - Language switching
 * - Loading states
 * - Error handling
 * - Type-safe keys
 */
export function useI18n(key: string, options?: UseI18nOptions) {
  // Format key as readable fallback (e.g., "hero.title" → "Hero Title")
  const formatKeyFallback = () => {
    return key
      .split(".")
      .pop()
      ?.split(/(?=[A-Z])|[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || key;
  };

  const fallbackValue = options?.fallback || formatKeyFallback();
  const [translation, setTranslation] = useState<string>(fallbackValue);
  const [language, setLanguage] = useState<string>(detectUserLanguage());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Handle language changes via custom event
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setLanguage(event.detail.language);
    };

    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener);
    };
  }, []);

  // Fetch translation when language or key changes
  useEffect(() => {
    let isMounted = true;

    const fetchTranslation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Preload language if not already loaded
        await preloadLanguage(language);

        // Get the translation
        const translated = await t(key, language);

        if (isMounted) {
          setTranslation(translated);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[useI18n] Error loading translation for key "${key}":`, error);

        if (isMounted) {
          setError(error);
          // Fallback to key name if translation fails
          setTranslation(options?.fallback || formatKeyFallback());
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTranslation();

    return () => {
      isMounted = false;
    };
  }, [key, language, options?.fallback]);

  return {
    translated: translation,
    language,
    isLoading,
    error,
  };
}

/**
 * Hook to get current language
 */
export function useCurrentLanguage() {
  const [language, setLanguage] = useState<string>(detectUserLanguage());

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setLanguage(event.detail.language);
      // Save preference
      setUserLanguage(event.detail.language);
    };

    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener);
    };
  }, []);

  return language;
}

/**
 * Hook to validate translations (for development/debugging)
 */
export function useTranslationValidation(language: string) {
  const [validation, setValidation] = useState<{
    isValid: boolean;
    missingKeys: string[];
    extraKeys: string[];
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const validate = async () => {
      try {
        setIsChecking(true);
        const result = await validateTranslations(language);

        if (isMounted) {
          setValidation(result);
        }
      } catch (error) {
        console.error(`[useTranslationValidation] Error validating "${language}":`, error);
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    if (process.env.NODE_ENV === "development") {
      validate();
    }

    return () => {
      isMounted = false;
    };
  }, [language]);

  return { validation, isChecking };
}
