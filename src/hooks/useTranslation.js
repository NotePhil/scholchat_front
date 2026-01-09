import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setLanguage } from "../store/slices/uiSlice";

// Import translation files
import enTranslations from "../locales/en.json";
import frTranslations from "../locales/fr.json";

const translations = {
  en: enTranslations,
  fr: frTranslations,
};

export const useTranslation = () => {
  const dispatch = useDispatch();
  const language = useSelector((state) => state.ui?.currentLanguage || 'fr');

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
    if (translations[newLanguage]) {
      dispatch(setLanguage(newLanguage));
      localStorage.setItem("language", newLanguage);
    }
  }, [dispatch]);

  return {
    t,
    language,
    changeLanguage,
    languages: Object.keys(translations),
  };
};
