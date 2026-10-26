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
    (key, defaultValue, params = {}) => {
      // If the second argument is an object, then there's no defaultValue
      let finalParams = params;
      let finalDefaultValue = defaultValue;

      if (typeof defaultValue === "object" && defaultValue !== null) {
        finalParams = defaultValue;
        finalDefaultValue = key; // Use the key as the default value if nothing else is provided
      }

      const keys = key.split(".");
      let value = translations[language];

      for (const k of keys) {
        value = value?.[k];
      }

      if (!value) value = finalDefaultValue || key;

      // Handle parameter interpolation
      if (typeof value === "string") {
        // First replace {{param}} (double braces), then {param} (single braces)
        let result = value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
          return finalParams[paramKey] !== undefined ? finalParams[paramKey] : match;
        });
        result = result.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return finalParams[paramKey] !== undefined ? finalParams[paramKey] : match;
        });
        return result;
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
