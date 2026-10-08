import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCircleCheck,
  faEnvelope,
  faRocket,
  faBuilding,
  faGraduationCap,
  faUsers,
  faShieldHalved,
  faArrowTrendUp,
  faBookOpen,
} from "@fortawesome/free-solid-svg-icons";
import { asIconComponent } from "../utils/faIconAdapter";
const BookOpen = asIconComponent(faBookOpen);
const Building2 = asIconComponent(faBuilding);
const GraduationCap = asIconComponent(faGraduationCap);
const ShieldCheck = asIconComponent(faShieldHalved);
const TrendingUp = asIconComponent(faArrowTrendUp);
const Users = asIconComponent(faUsers);
const FunctionalityDetails = ({ theme }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          accentBg: "bg-blue-900/30",
          border: "border-gray-700",
          subtext: "text-gray-400",
        };
      case "light":
        return {
          bg: "bg-gray-50",
          text: "text-gray-800",
          cardBg: "bg-white",
          accentBg: "bg-blue-50",
          border: "border-gray-200",
          subtext: "text-gray-600",
        };
      default:
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          accentBg: "bg-blue-900/30",
          border: "border-gray-700",
          subtext: "text-gray-400",
        };
    }
  };
  const themeClasses = getThemeClasses();

  // Map IDs to Icons and Colors
  const iconMap = {
    schoolAdmin: {
      icon: Building2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    studentSuccess: {
      icon: GraduationCap,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    parentEngagement: {
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    securePlatform: {
      icon: ShieldCheck,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    analytics: {
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    curriculum: {
      icon: BookOpen,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
  };
  const featureConfig = iconMap[id];
  if (!featureConfig) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${themeClasses.bg} ${themeClasses.text}`}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {t("pages.functionalities.details.notFound.title")}
          </h2>
          <button
            onClick={() => navigate("/schoolchat/functionalities")}
            className="text-blue-500 hover:underline flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              style={{
                fontSize: 20,
              }}
            />{" "}
            {t("pages.functionalities.details.notFound.goBack")}
          </button>
        </div>
      </div>
    );
  }
  const IconComponent = featureConfig.icon;
  const translationBase = `pages.functionalities.details.${id}`;
  const benefits = t(`${translationBase}.benefits`, {
    returnObjects: true,
  });
  // Handle case where benefits might not be an array returned immediately or issue with key
  const benefitsList = Array.isArray(benefits)
    ? benefits
    : Object.values(benefits || {});
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      className={`min-h-screen pt-24 pb-12 ${themeClasses.bg} ${themeClasses.text}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.button
          initial={{
            x: -20,
            opacity: 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          onClick={() => navigate("/schoolchat/functionalities")}
          className={`group flex items-center gap-2 mb-8 px-4 py-2 rounded-full ${themeClasses.cardBg} border ${themeClasses.border} hover:border-blue-500 transition-all`}
        >
          <FontAwesomeIcon
            icon={faArrowLeft}
            className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
          />
          <span className="font-medium">
            {t("pages.functionalities.details.backButton")}
          </span>
        </motion.button>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Icon & Title */}
          <motion.div
            initial={{
              y: 20,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            transition={{
              delay: 0.1,
            }}
          >
            <div
              className={`inline-flex p-6 rounded-3xl ${featureConfig.bg} mb-8`}
            >
              <IconComponent className={`w-16 h-16 ${featureConfig.color}`} />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {t(`${translationBase}.title`)}
            </h1>

            <div
              className={`text-xl leading-relaxed ${themeClasses.subtext} mb-8`}
            >
              {t(`pages.functionalities.features.${id}.desc`)}
            </div>

            <div className="hidden lg:block">
              <div
                className={`p-8 rounded-3xl ${themeClasses.cardBg} border ${themeClasses.border} shadow-lg`}
              >
                <h3 className="text-xl font-bold mb-4">
                  {t("pages.functionalities.details.whyChoose.title")}
                </h3>
                <p className={`${themeClasses.subtext}`}>
                  {t("pages.functionalities.details.whyChoose.description")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Detailed Content */}
          <motion.div
            initial={{
              y: 20,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            transition={{
              delay: 0.2,
            }}
            className="space-y-8"
          >
            {/* Long Description */}
            <div
              className={`p-8 rounded-3xl ${themeClasses.cardBg} border ${themeClasses.border} shadow-lg`}
            >
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                {t("pages.functionalities.details.overview")}
              </h3>
              <p className={`text-lg leading-relaxed ${themeClasses.subtext}`}>
                {t(`${translationBase}.longDesc`)}
              </p>
            </div>

            {/* Benefits List */}
            <div
              className={`p-8 rounded-3xl ${themeClasses.cardBg} border ${themeClasses.border} shadow-lg`}
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                {t("pages.functionalities.details.keyBenefits")}
              </h3>
              <ul className="space-y-4">
                {benefitsList.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{
                      x: 20,
                      opacity: 0,
                    }}
                    animate={{
                      x: 0,
                      opacity: 1,
                    }}
                    transition={{
                      delay: 0.3 + index * 0.1,
                    }}
                    className="flex items-start gap-4"
                  >
                    <div
                      className={`mt-1 p-1 rounded-full ${featureConfig.bg}`}
                    >
                      <FontAwesomeIcon
                        icon={faCircleCheck}
                        className={`w-5 h-5 ${featureConfig.color}`}
                      />
                    </div>
                    <span className="text-base sm:text-lg opacity-90 break-words flex-1">
                      {benefit}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              className="flex flex-col sm:flex-row gap-5 pt-8"
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.6,
                duration: 0.5,
              }}
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgb(59 130 246 / 0.5)",
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={() => navigate("/schoolchat/login")}
                className="group relative flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/30 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -translate-x-full skew-x-12"></div>
                <FontAwesomeIcon
                  icon={faRocket}
                  className="w-5 h-5 group-hover:rotate-12 transition-transform"
                />
                <span>{t("pages.functionalities.cta.getStarted")}</span>
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.05,
                  backgroundColor: theme === "dark" ? "#1f2937" : "#f9fafb",
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={() => navigate("/schoolchat/contact")}
                className={`group flex-1 flex items-center justify-center gap-3 py-4 ${theme === "dark" ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-white text-gray-700 hover:bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-lg shadow-md transition-all`}
              >
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform"
                />
                <span>{t("pages.functionalities.cta.contactSales")}</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
export default FunctionalityDetails;
