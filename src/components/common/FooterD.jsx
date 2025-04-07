import React from "react";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const { isDark, currentTheme, themes } = useTheme();

  // Using the same color scheme as the header for consistency
  const footerClass = `${
    isDark ? themes.dark.cardBg : themes.light.cardBg
  } shadow-sm z-10 py-3 px-4`;

  return (
    <footer className={footerClass}>
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm">
            <span>
              © {new Date().getFullYear()} SchoolChat. {t("allRightsReserved")}
            </span>
          </div>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <a href="#" className="text-sm hover:underline">
              {t("termsOfService")}
            </a>
            <a href="#" className="text-sm hover:underline">
              {t("privacyPolicy")}
            </a>
            <a href="#" className="text-sm hover:underline">
              {t("support")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
