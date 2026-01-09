import React from "react";
import {
  FaBookOpen,
  FaGraduationCap,
  FaUserFriends,
  FaChalkboardTeacher,
  FaArrowRight,
  FaStar,
  FaPlay,
} from "react-icons/fa";
import { AiOutlineCheck } from "react-icons/ai";
import { useTranslation } from "../hooks/useTranslation";

export const About = ({ theme = "default" }) => {
  const { t } = useTranslation();
  
  const cards = [
    {
      icon: <FaGraduationCap size={40} />,
      title: t("pages.about.services.academic.title"),
      desc: t("pages.about.services.academic.desc"),
      stats: t("pages.about.services.academic.stats"),
    },
    {
      icon: <FaUserFriends size={40} />,
      title: t("pages.about.services.psychological.title"),
      desc: t("pages.about.services.psychological.desc"),
      stats: t("pages.about.services.psychological.stats"),
    },
    {
      icon: <FaChalkboardTeacher size={40} />,
      title: t("pages.about.services.tutoring.title"),
      desc: t("pages.about.services.tutoring.desc"),
      stats: t("pages.about.services.tutoring.stats"),
    },
    {
      icon: <FaBookOpen size={40} />,
      title: t("pages.about.services.resources.title"),
      desc: t("pages.about.services.resources.desc"),
      stats: t("pages.about.services.resources.stats"),
    },
  ];

  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          cardBorder: "border-gray-700",
        };
      case "light":
        return {
          bg: "bg-gray-50",
          text: "text-gray-800",
          cardBg: "bg-white",
          cardBorder: "border-gray-200",
        };
      default:
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          cardBorder: "border-gray-700",
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.bg} py-20`}>
      <section className="container mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-3 bg-blue-100 dark:bg-blue-900 rounded-full px-8 py-3 mb-8">
            <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
              {t("pages.about.badge")}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black mb-8 leading-none">
            <span className="block text-blue-500 mb-2">
              {t("pages.about.title.line1")}
            </span>
            <span className="block text-purple-500 mb-2">
              {t("pages.about.title.line2")}
            </span>
            <span className="block text-green-500">
              {t("pages.about.title.line3")}
            </span>
          </h1>

          <div className="max-w-4xl mx-auto mb-12">
            <p className={`text-xl leading-relaxed ${themeClasses.text}`}>
              {t("pages.about.subtitle")}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-12 mb-12">
            {[
              { number: "10K+", label: "Étudiants", icon: "👨🎓" },
              { number: "98%", label: "Réussite", icon: "🏆" },
              { number: "24/7", label: "Support", icon: "💬" },
              { number: "50+", label: "Pays", icon: "🌍" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className={`text-3xl font-bold ${themeClasses.text}`}>
                  {stat.number}
                </div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-24">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-3xl p-6 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full min-h-[400px]`}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 flex items-center justify-center flex-shrink-0">
                <div className="text-white">{card.icon}</div>
              </div>

              <h3 className={`text-base font-bold mb-3 ${themeClasses.text} leading-tight h-12 overflow-hidden`}>
                {card.title}
              </h3>

              <p className="text-gray-500 text-sm mb-4 leading-relaxed flex-grow line-clamp-4">
                {card.desc}
              </p>

              <div className="flex items-center justify-between mt-auto pt-2">
                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white text-xs font-bold">
                  {card.stats}
                </div>
                <FaArrowRight className="text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0" size={16} />
              </div>
            </div>
          ))}
        </div>

        <AboutContent theme={theme} />
      </section>
    </div>
  );
};

export const AboutContent = ({ theme }) => {
  const { t } = useTranslation();

  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          cardBorder: "border-gray-700",
        };
      case "light":
        return {
          text: "text-gray-800",
          cardBg: "bg-white",
          cardBorder: "border-gray-200",
        };
      default:
        return {
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          cardBorder: "border-gray-700",
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <section className="flex flex-col lg:flex-row gap-20 items-center">
      {/* Left Side - Media */}
      <div className="w-full lg:w-1/2 relative">
        <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-3xl p-8`}>
          <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-800 to-blue-900 flex items-center justify-center">
            <button className="bg-white/20 backdrop-blur-xl border-2 border-white/30 rounded-full p-8 hover:scale-110 transition-transform">
              <FaPlay className="text-4xl text-white ml-1" />
            </button>
          </div>
        </div>

        {/* Floating Stats */}
        <div className="absolute -bottom-12 -right-12 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-cyan-500 rounded-2xl flex items-center justify-center">
              <FaUserFriends className="text-white text-2xl" />
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">10,000+</div>
              <div className="text-sm text-gray-600">{t("pages.about.content.floatingStats")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Content */}
      <div className="w-full lg:w-1/2">
        <div className="space-y-10">
          <div>
            <div className="inline-flex items-center gap-3 bg-green-100 dark:bg-green-900 rounded-full px-6 py-3 mb-8">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full"></div>
              <span className={`font-semibold ${themeClasses.text}`}>
                {t("pages.about.content.badge")}
              </span>
            </div>

            <h2 className="text-5xl font-black mb-8 leading-tight">
              <span className="block text-green-500 mb-2">
                {t("pages.about.content.title.line1")}
              </span>
              <span className="block text-purple-500">
                {t("pages.about.content.title.line2")}
              </span>
            </h2>

            <p className={`text-xl leading-relaxed mb-10 ${themeClasses.text}`}>
              {t("pages.about.content.description")}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {[
              t("pages.about.content.features.feature1"),
              t("pages.about.content.features.feature2"),
              t("pages.about.content.features.feature3"),
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <AiOutlineCheck className="text-white text-lg font-bold" />
                </div>
                <span className={`text-xl ${themeClasses.text}`}>
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="pt-8">
            <button className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-12 py-6 rounded-2xl font-bold text-xl hover:shadow-lg transition-shadow">
              <span className="flex items-center gap-4">
                <span>{t("pages.about.content.cta")}</span>
                <FaArrowRight />
              </span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-10 grid grid-cols-3 gap-6">
            {[
              { icon: "🏆", labelKey: "pages.about.content.trust.guarantee.label", descKey: "pages.about.content.trust.guarantee.desc" },
              { icon: "🔒", labelKey: "pages.about.content.trust.security.label", descKey: "pages.about.content.trust.security.desc" },
              { icon: "🌟", labelKey: "pages.about.content.trust.support.label", descKey: "pages.about.content.trust.support.desc" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-2">{item.icon}</div>
                <div className={`text-lg font-bold ${themeClasses.text}`}>
                  {t(item.labelKey)}
                </div>
                <div className="text-gray-500 text-xs">
                  {t(item.descKey)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};