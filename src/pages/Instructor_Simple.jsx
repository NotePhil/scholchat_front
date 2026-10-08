import React from "react";
import { FaUsers, FaComments, FaGraduationCap, FaMobile } from "react-icons/fa";
import { useTranslation } from "../hooks/useTranslation";

const StatCard = ({ icon, title, desc, theme }) => {
  const getCardClasses = () => {
    switch (theme) {
      case "dark":
        return {
          cardBg: "bg-gray-800",
          cardBorder: "border-gray-700",
          text: "text-gray-200",
        };
      case "light":
        return {
          cardBg: "bg-white",
          cardBorder: "border-gray-200",
          text: "text-gray-800",
        };
      default:
        return {
          cardBg: "bg-gray-800",
          cardBorder: "border-gray-700",
          text: "text-gray-200",
        };
    }
  };

  const cardClasses = getCardClasses();

  return (
    <div className={`${cardClasses.cardBg} border ${cardClasses.cardBorder} rounded-3xl p-6 text-center hover:shadow-lg transition-shadow duration-300`}>
      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center">
        <div className="text-white text-2xl">{icon}</div>
      </div>

      <h4 className={`text-4xl font-bold mb-3 text-blue-500`}>
        {typeof title === "number" ? `${title}+` : title}
      </h4>
      <p className="text-gray-500 text-base font-medium">{desc}</p>
    </div>
  );
};

export const Instructor = ({ theme = "default" }) => {
  const { t } = useTranslation();

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

  const statsData = [
    {
      icon: <FaUsers />,
      title: 2840,
      desc: t("pages.instructor.stats.families"),
    },
    {
      icon: <FaComments />,
      title: 15600,
      desc: t("pages.instructor.stats.messages"),
    },
    {
      icon: <FaGraduationCap />,
      title: 450,
      desc: t("pages.instructor.stats.schools"),
    },
    {
      icon: <FaMobile />,
      title: 98,
      desc: t("pages.instructor.stats.satisfaction"),
    },
  ];

  return (
    <section className={`min-h-screen ${themeClasses.bg} py-20`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 sm:gap-3 bg-blue-100 dark:bg-blue-900 rounded-full px-4 sm:px-8 py-2 sm:py-3 mb-6 sm:mb-8">
            <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm sm:text-lg">
              {t("pages.instructor.badge")}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-4">
            <span className="text-blue-500">{t("pages.instructor.title.line1")}</span>
            <br />
            <span className="text-purple-500">{t("pages.instructor.title.line2")}</span>
          </h2>

          <p className={`text-sm sm:text-xl ${themeClasses.text} max-w-4xl mx-auto leading-relaxed px-4`}>
            {t("pages.instructor.subtitle")}
          </p>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-3xl p-8`}>
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-6 flex items-center justify-center">
              <FaComments className="text-white text-2xl" />
            </div>
            <h3 className={`text-lg sm:text-2xl font-bold mb-3 sm:mb-4 ${themeClasses.text}`}>
              {t("pages.instructor.features.communication.title")}
            </h3>
            <p className="text-gray-500 text-sm sm:text-lg mb-4 sm:mb-6">
              {t("pages.instructor.features.communication.desc")}
            </p>
            <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:shadow-lg transition-shadow w-full sm:w-auto">
              {t("pages.instructor.features.communication.cta")}
            </button>
          </div>

          <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-3xl p-8`}>
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6 flex items-center justify-center">
              <FaMobile className="text-white text-2xl" />
            </div>
            <h3 className={`text-lg sm:text-2xl font-bold mb-3 sm:mb-4 ${themeClasses.text}`}>
              {t("pages.instructor.features.mobile.title")}
            </h3>
            <p className="text-gray-500 text-sm sm:text-lg mb-4 sm:mb-6">
              {t("pages.instructor.features.mobile.desc")}
            </p>
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:shadow-lg transition-shadow w-full sm:w-auto">
              {t("pages.instructor.features.mobile.cta")}
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-3xl p-12 mb-20`}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-green-100 dark:bg-green-900 rounded-full px-4 sm:px-6 py-1.5 sm:py-2 mb-4 sm:mb-6">
              <span className="text-green-600 dark:text-green-400 font-semibold text-xs sm:text-base">
                {t("pages.instructor.stats.badge")}
              </span>
            </div>
            <h3 className={`text-xl sm:text-3xl font-bold mb-3 sm:mb-4 ${themeClasses.text} px-4`}>
              {t("pages.instructor.stats.title")}
            </h3>
            <p className="text-gray-500 text-sm sm:text-lg px-4">
              {t("pages.instructor.stats.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {statsData.map((stat, index) => (
              <StatCard
                key={index}
                icon={stat.icon}
                title={stat.title}
                desc={stat.desc}
                theme={theme}
              />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-3xl p-12 max-w-4xl mx-auto`}>
            <h3 className={`text-xl sm:text-3xl font-bold mb-3 sm:mb-4 ${themeClasses.text} px-4`}>
              {t("pages.instructor.cta.title")}
            </h3>
            <p className="text-gray-500 text-sm sm:text-lg mb-6 sm:mb-8 px-4">
              {t("pages.instructor.cta.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
              <button className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-sm sm:text-lg hover:shadow-lg transition-shadow w-full sm:w-auto">
                {t("pages.instructor.cta.startFree")}
              </button>
              <button className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-sm sm:text-lg text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-full sm:w-auto">
                {t("pages.instructor.cta.demo")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};