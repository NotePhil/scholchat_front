import React from "react";
import aboutImg from "../components/assets/images/about.jpg";
import aboutImgBanner from "../components/assets/images/about-banner.jpg";
import imgs from "../components/assets/images/join1.png";
import { AiOutlineCheck } from "react-icons/ai";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
export const AboutContent = ({ theme }) => {
  const { t } = useTranslation();
  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
        };
      case "light":
        return {
          bg: "bg-gray-50",
          text: "text-gray-800",
          cardBg: "bg-white",
        };
      default:
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
        };
    }
  };
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();
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
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };
  return (
    <>
      <section className={`py-16 ${themeClasses.bg} overflow-hidden`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              margin: "-100px",
            }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="relative">
              <img
                src={aboutImg}
                alt="about"
                className="rounded-2xl shadow-xl w-full object-cover transform hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500 rounded-full blur-2xl opacity-20"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className={`space-y-6 ${themeClasses.text}`}
            >
              <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold tracking-wide uppercase">
                {t("pages.about.badge")}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                {t("pages.about.title")}
              </h2>
              <p className="text-lg opacity-80 leading-relaxed">
                {t("pages.about.desc")}
              </p>
              <div className="space-y-4 pt-4">
                {[
                  t("pages.about.list.item1"),
                  t("pages.about.list.item2"),
                  t("pages.about.list.item3"),
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center space-x-3"
                    variants={itemVariants}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <AiOutlineCheck className="w-4 h-4" />
                    </span>
                    <span className="font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className={`py-16 ${themeClasses.bg} relative`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              margin: "-100px",
            }}
            variants={containerVariants}
          >
            <motion.div
              variants={itemVariants}
              className={`order-2 md:order-1 space-y-6 ${themeClasses.text}`}
            >
              <div className="inline-block px-4 py-1.5 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold tracking-wide uppercase">
                {t("pages.about.mission.badge")}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                {t("pages.about.mission.title")}
              </h2>
              <p className="text-lg opacity-80 leading-relaxed">
                {t("pages.about.mission.desc")}
              </p>

              <motion.div variants={itemVariants} className="pt-6">
                <motion.button
                  onClick={() => navigate("/schoolchat/courses")}
                  whileHover={{
                    scale: 1.05,
                    boxShadow:
                      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                  className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-bold overflow-hidden shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                  <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -translate-x-full skew-x-12"></div>
                  <FontAwesomeIcon
                    icon={faWandMagicSparkles}
                    className="w-5 h-5 text-blue-200 group-hover:rotate-12 transition-transform"
                  />
                  <span>{t("pages.about.mission.cta")}</span>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  />
                </motion.button>
              </motion.div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="order-1 md:order-2 relative"
            >
              <img
                src={aboutImgBanner}
                alt="mission"
                className="rounded-2xl shadow-xl w-full object-cover transform hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-2xl"></div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div
        className={`py-20 ${themeClasses.bg} border-t border-gray-100 dark:border-gray-800`}
      >
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
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
            className="max-w-4xl mx-auto"
          >
            <img src={imgs} alt="Join Us" className="w-full h-auto" />
          </motion.div>
        </div>
      </div>
    </>
  );
};
export const About = ({ theme }) => {
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
      className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <AboutContent theme={theme} />
    </motion.div>
  );
};
