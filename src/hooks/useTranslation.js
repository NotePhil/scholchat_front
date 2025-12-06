import { useState, useEffect, useCallback } from "react";

// Import translation files
import enTranslations from "../locales/en.json";
import frTranslations from "../locales/fr.json";

const translations = {
  en: enTranslations,
  fr: frTranslations,
};

// Global state for language - Default to French
let globalLanguage = localStorage.getItem("language") || "fr";
let listeners = [];

const notifyListeners = () => {
  listeners.forEach((listener) => listener(globalLanguage));
};

export const useTranslation = () => {
  const [language, setLanguage] = useState(globalLanguage);

  useEffect(() => {
    const listener = (newLanguage) => {
      setLanguage(newLanguage);
    };
    listeners.push(listener);

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const t = useCallback(
    (key, params = {}) => {
      const keys = key.split(".");
      let value = translations[language];

      for (const k of keys) {
        value = value?.[k];
      }

      if (!value) return key;

      // Handle parameter interpolation
      if (typeof value === "string" && Object.keys(params).length > 0) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return params[paramKey] !== undefined ? params[paramKey] : match;
        });
      }

      return value;
    },
    [language]
  );

  const changeLanguage = useCallback((newLanguage) => {
    if (translations[newLanguage] && newLanguage !== globalLanguage) {
      globalLanguage = newLanguage;
      localStorage.setItem("language", newLanguage);
      notifyListeners();
    }
  }, []);

  return {
    t,
    language,
    changeLanguage,
    languages: Object.keys(translations),
  };
};
