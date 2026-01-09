import React from "react";
import {
  BookOpen,
  Mail,
  ClipboardList,
  UserCheck,
  Target,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

const FunctionalitiesSection = ({ theme = "default" }) => {
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

  const functionalities = [
    {
      icon: BookOpen,
      title: t("pages.functionalities.features.textbook.title"),
      description: t("pages.functionalities.features.textbook.desc"),
      color: "from-blue-500 to-blue-600",
      bgColor: theme === "dark" ? "bg-blue-900/30" : "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      icon: Mail,
      title: t("pages.functionalities.features.messaging.title"),
      description: t("pages.functionalities.features.messaging.desc"),
      color: "from-purple-500 to-purple-600",
      bgColor: theme === "dark" ? "bg-purple-900/30" : "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      icon: ClipboardList,
      title: t("pages.functionalities.features.homework.title"),
      description: t("pages.functionalities.features.homework.desc"),
      color: "from-emerald-500 to-emerald-600",
      bgColor: theme === "dark" ? "bg-emerald-900/30" : "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      icon: UserCheck,
      title: t("pages.functionalities.features.attendance.title"),
      description: t("pages.functionalities.features.attendance.desc"),
      color: "from-orange-500 to-orange-600",
      bgColor: theme === "dark" ? "bg-orange-900/30" : "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      icon: Target,
      title: t("pages.functionalities.features.goals.title"),
      description: t("pages.functionalities.features.goals.desc"),
      color: "from-rose-500 to-rose-600",
      bgColor: theme === "dark" ? "bg-rose-900/30" : "bg-rose-50",
      textColor: "text-rose-600",
    },
    {
      icon: Calendar,
      title: t("pages.functionalities.features.schedule.title"),
      description: t("pages.functionalities.features.schedule.desc"),
      color: "from-indigo-500 to-indigo-600",
      bgColor: theme === "dark" ? "bg-indigo-900/30" : "bg-indigo-50",
      textColor: "text-indigo-600",
    },
  ];

  return (
    <section className={`min-h-screen ${themeClasses.bg} py-20`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-blue-100 dark:bg-blue-900 rounded-full px-8 py-3 mb-8">
            <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
              🚀 {t("pages.functionalities.badge")}
            </span>
          </div>

          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-3xl mb-8 mx-auto flex items-center justify-center">
            <Target className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-blue-500">{t("pages.functionalities.title")}</span>
          </h2>

          <p className={`text-xl max-w-3xl mx-auto leading-relaxed mb-6 ${themeClasses.text}`}>
            ✨ {t("pages.functionalities.subtitle")} ⚡
          </p>

          <div className="w-32 h-1 mx-auto rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"></div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {functionalities.map((func, index) => {
            const IconComponent = func.icon;
            return (
              <div
                key={index}
                className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-3xl p-8 hover:shadow-lg transition-shadow duration-300`}
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${func.color} rounded-3xl mb-6 flex items-center justify-center`}>
                  <IconComponent className="w-10 h-10 text-white" />
                </div>

                <h3 className={`text-2xl font-bold mb-4 ${themeClasses.text}`}>
                  {func.title}
                </h3>

                <p className="text-gray-500 text-base leading-relaxed mb-6">
                  {func.description}
                </p>

                <div className="flex items-center font-medium text-blue-500 hover:text-blue-400 transition-colors cursor-pointer">
                  <span>{t("pages.functionalities.learnMore")}</span>
                  <ChevronRight className="w-5 h-5 ml-2" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FunctionalitiesSection;