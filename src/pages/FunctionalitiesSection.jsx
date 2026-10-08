import React from "react";
import { useTranslation } from "../hooks/useTranslation";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faArrowTrendUp,
  faBookOpen,
  faBuilding,
  faGraduationCap,
  faShieldHalved,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
const FunctionalitiesSection = ({ theme }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          cardBorder: "border-gray-700",
          sectionTitle: "text-white",
          subtext: "text-gray-400",
          iconBg: "bg-gray-700",
        };
      case "light":
        return {
          bg: "bg-gray-50",
          text: "text-gray-800",
          cardBg: "bg-white",
          cardBorder: "border-gray-200",
          sectionTitle: "text-gray-900",
          subtext: "text-gray-600",
          iconBg: "bg-gray-100",
        };
      default:
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          cardBorder: "border-gray-700",
          sectionTitle: "text-white",
          subtext: "text-gray-400",
          iconBg: "bg-gray-700",
        };
    }
  };
  const themeClasses = getThemeClasses();
  const features = [
    {
      id: "schoolAdmin",
      icon: (
        <FontAwesomeIcon icon={faBuilding} className="w-8 h-8 text-blue-500" />
      ),
      title: t("pages.functionalities.features.schoolAdmin.title"),
      description: t("pages.functionalities.features.schoolAdmin.desc"),
      color: "blue",
    },
    {
      id: "studentSuccess",
      icon: (
        <FontAwesomeIcon
          icon={faGraduationCap}
          className="w-8 h-8 text-green-500"
        />
      ),
      title: t("pages.functionalities.features.studentSuccess.title"),
      description: t("pages.functionalities.features.studentSuccess.desc"),
      color: "green",
    },
    {
      id: "parentEngagement",
      icon: (
        <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-purple-500" />
      ),
      title: t("pages.functionalities.features.parentEngagement.title"),
      description: t("pages.functionalities.features.parentEngagement.desc"),
      color: "purple",
    },
    {
      id: "securePlatform",
      icon: (
        <FontAwesomeIcon
          icon={faShieldHalved}
          className="w-8 h-8 text-red-500"
        />
      ),
      title: t("pages.functionalities.features.securePlatform.title"),
      description: t("pages.functionalities.features.securePlatform.desc"),
      color: "red",
    },
    {
      id: "analytics",
      icon: (
        <FontAwesomeIcon
          icon={faArrowTrendUp}
          className="w-8 h-8 text-amber-500"
        />
      ),
      title: t("pages.functionalities.features.analytics.title"),
      description: t("pages.functionalities.features.analytics.desc"),
      color: "amber",
    },
    {
      id: "curriculum",
      icon: (
        <FontAwesomeIcon icon={faBookOpen} className="w-8 h-8 text-teal-500" />
      ),
      title: t("pages.functionalities.features.curriculum.title"),
      description: t("pages.functionalities.features.curriculum.desc"),
      color: "teal",
    },
  ];
  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -20,
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
      }}
      className={`py-20 ${themeClasses.bg} min-h-screen`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-20"
          initial={{
            opacity: 0,
            y: -20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.6,
          }}
        >
          <div className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold tracking-wide uppercase mb-6">
            {t("pages.functionalities.badge")}
          </div>
          <h2
            className={`text-4xl md:text-5xl font-bold mb-6 ${themeClasses.sectionTitle}`}
          >
            {t("pages.functionalities.title")}
          </h2>
          <p className={`text-xl max-w-3xl mx-auto ${themeClasses.subtext}`}>
            {t("pages.functionalities.subtitle")}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            margin: "-50px",
          }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{
                y: -5,
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              className={`p-8 rounded-3xl ${themeClasses.cardBg} border ${themeClasses.cardBorder} shadow-lg transition-all duration-300 group cursor-pointer`}
              onClick={() =>
                navigate(`/schoolchat/functionality/${feature.id}`)
              }
            >
              <div
                className={`w-16 h-16 rounded-2xl ${themeClasses.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner`}
              >
                {feature.icon}
              </div>

              <h3
                className={`text-2xl font-bold mb-4 ${themeClasses.text} group-hover:text-blue-500 transition-colors`}
              >
                {feature.title}
              </h3>

              <p className={`mb-6 leading-relaxed ${themeClasses.subtext}`}>
                {feature.description}
              </p>

              <div className="flex items-center text-blue-500 font-semibold group/link hover:text-blue-600">
                <span>{t("pages.functionalities.learnMore")}</span>
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="w-4 h-4 ml-2 transform group-hover/link:translate-x-1 transition-transform"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};
export default FunctionalitiesSection;
