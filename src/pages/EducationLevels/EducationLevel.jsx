import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../hooks/useTranslation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faAward,
  faBookOpen,
  faCalendarDays,
  faChartBar,
  faCircleCheck,
  faClock,
  faGraduationCap,
  faMessage,
  faMobileScreen,
  faRocket,
  faShield,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
/**
 * Professional Education Level Page Component
 * Fully responsive, translation-ready, dark mode compatible
 */
const EducationLevel = ({ level, theme }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Theme configuration
  const themeClasses = useMemo(() => {
    const isDark = theme === "dark";
    return {
      bg: isDark ? "bg-gray-900" : "bg-white",
      text: isDark ? "text-gray-100" : "text-gray-900",
      cardBg: isDark ? "bg-gray-800/50" : "bg-white",
      border: isDark ? "border-gray-700" : "border-gray-200",
      subtext: isDark ? "text-gray-400" : "text-gray-600",
      accent: isDark ? "bg-blue-900/30" : "bg-blue-50",
      hoverBg: isDark ? "hover:bg-gray-750" : "hover:bg-gray-50",
    };
  }, [theme]);

  // Image configuration for each level
  const levelImages = {
    nursery:
      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&h=600&fit=crop",
    kindergarten:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",
    primarySchool:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=600&fit=crop",
    highSchool:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop",
    university:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=600&fit=crop",
  };
  const features = [
    {
      icon: <FontAwesomeIcon icon={faUsers} className="w-5 h-5" />,
      title: t(
        `pages.educationLevels.${level}.features.parentCommunication.title`,
        "Parent Communication",
      ),
      description: t(
        `pages.educationLevels.${level}.features.parentCommunication.description`,
        "Connect with parents in real-time",
      ),
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: <FontAwesomeIcon icon={faBookOpen} className="w-5 h-5" />,
      title: t(
        `pages.educationLevels.${level}.features.academicTracking.title`,
        "Academic Tracking",
      ),
      description: t(
        `pages.educationLevels.${level}.features.academicTracking.description`,
        "Monitor student progress",
      ),
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: <FontAwesomeIcon icon={faCalendarDays} className="w-5 h-5" />,
      title: t(
        `pages.educationLevels.${level}.features.attendance.title`,
        "Attendance Management",
      ),
      description: t(
        `pages.educationLevels.${level}.features.attendance.description`,
        "Track attendance efficiently",
      ),
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: <FontAwesomeIcon icon={faChartBar} className="w-5 h-5" />,
      title: t(
        `pages.educationLevels.${level}.features.analytics.title`,
        "Analytics & Reports",
      ),
      description: t(
        `pages.educationLevels.${level}.features.analytics.description`,
        "Data-driven insights",
      ),
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: <FontAwesomeIcon icon={faMessage} className="w-5 h-5" />,
      title: t(
        `pages.educationLevels.${level}.features.messaging.title`,
        "Instant Messaging",
      ),
      description: t(
        `pages.educationLevels.${level}.features.messaging.description`,
        "Secure communication platform",
      ),
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      icon: <FontAwesomeIcon icon={faShield} className="w-5 h-5" />,
      title: t(
        `pages.educationLevels.${level}.features.security.title`,
        "Security & Safety",
      ),
      description: t(
        `pages.educationLevels.${level}.features.security.description`,
        "Enterprise-grade security",
      ),
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];
  const benefits = t(`pages.educationLevels.${level}.benefits`, {
    returnObjects: true,
  });
  const benefitsArray = Array.isArray(benefits) ? benefits : [];
  return (
    <div className={`min-h-screen ${themeClasses.bg} pt-16`}>
      {/* Hero Section - Fixed responsive design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
              }}
              className="order-2 lg:order-1"
            >
              <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase mb-4">
                {t(`pages.educationLevels.${level}.badge`, "Education")}
              </div>
              <h1
                className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-4 lg:mb-6 ${themeClasses.text} leading-tight`}
              >
                {t(
                  `pages.educationLevels.${level}.title`,
                  "Education Platform",
                )}
              </h1>
              <p
                className={`text-base sm:text-lg lg:text-xl mb-6 lg:mb-8 ${themeClasses.subtext} leading-relaxed`}
              >
                {t(
                  `pages.educationLevels.${level}.subtitle`,
                  "Comprehensive digital solution for modern education",
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <motion.button
                  whileHover={{
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  onClick={() => navigate("/schoolchat/login")}
                  className="group flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base lg:text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all w-full sm:w-auto"
                >
                  <FontAwesomeIcon
                    icon={faRocket}
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <span>
                    {t("pages.educationLevels.cta.getStarted", "Get Started")}
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  onClick={() => navigate("/schoolchat/contact")}
                  className={`group flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 ${themeClasses.cardBg} ${themeClasses.text} border-2 ${themeClasses.border} rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base lg:text-lg shadow-md hover:shadow-lg transition-all w-full sm:w-auto`}
                >
                  <span>
                    {t("pages.educationLevels.cta.learnMore", "Learn More")}
                  </span>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
                  />
                </motion.button>
              </div>
            </motion.div>

            {/* Right Image - Properly constrained and responsive */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                delay: 0.2,
              }}
              className="order-1 lg:order-2"
            >
              <div
                className={`relative rounded-2xl lg:rounded-3xl overflow-hidden ${themeClasses.cardBg} border ${themeClasses.border} shadow-2xl max-w-2xl mx-auto`}
              >
                <div className="aspect-video w-full">
                  <img
                    src={levelImages[level] || levelImages.nursery}
                    alt={t(`pages.educationLevels.${level}.title`, "Education")}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
                {/* Floating badge */}
                <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faGraduationCap}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      SchoolChat
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section - Responsive Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
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
          className="text-center mb-10 lg:mb-16"
        >
          <h2
            className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-3 lg:mb-6 ${themeClasses.text}`}
          >
            {t(`pages.educationLevels.${level}.featuresTitle`, "Key Features")}
          </h2>
          <p
            className={`text-base sm:text-lg lg:text-xl max-w-3xl mx-auto ${themeClasses.subtext}`}
          >
            {t(
              `pages.educationLevels.${level}.featuresSubtitle`,
              "Everything you need for success",
            )}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
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
                delay: index * 0.1,
              }}
              whileHover={{
                y: -5,
              }}
              className={`p-5 sm:p-6 lg:p-8 rounded-xl lg:rounded-2xl ${themeClasses.cardBg} border ${themeClasses.border} shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 ${feature.color}`}
              >
                {feature.icon}
              </div>
              <h3
                className={`text-lg sm:text-xl font-bold mb-2 sm:mb-3 ${themeClasses.text}`}
              >
                {feature.title}
              </h3>
              <p
                className={`${themeClasses.subtext} text-sm sm:text-base leading-relaxed`}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits Section - Responsive and compact */}
      <div className={`${themeClasses.cardBg} border-y ${themeClasses.border}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{
                opacity: 0,
                x: -20,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
              }}
            >
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-3 lg:mb-6 ${themeClasses.text}`}
              >
                {t(
                  `pages.educationLevels.${level}.benefitsTitle`,
                  "Why Choose Us",
                )}
              </h2>
              <p
                className={`text-base sm:text-lg mb-6 lg:mb-8 ${themeClasses.subtext}`}
              >
                {t(
                  `pages.educationLevels.${level}.benefitsSubtitle`,
                  "Built for modern education",
                )}
              </p>

              <div className="space-y-3 sm:space-y-4">
                {benefitsArray.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{
                      opacity: 0,
                      x: -20,
                    }}
                    whileInView={{
                      opacity: 1,
                      x: 0,
                    }}
                    viewport={{
                      once: true,
                    }}
                    transition={{
                      delay: index * 0.1,
                    }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                      <FontAwesomeIcon
                        icon={faCircleCheck}
                        className="w-4 h-4 text-green-500"
                      />
                    </div>
                    <p
                      className={`${themeClasses.text} text-sm sm:text-base lg:text-lg`}
                    >
                      {benefit}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Stats Grid - Compact and responsive */}
            <motion.div
              initial={{
                opacity: 0,
                x: 20,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
              }}
              className="grid grid-cols-2 gap-3 sm:gap-4"
            >
              {[
                {
                  icon: (
                    <FontAwesomeIcon
                      icon={faClock}
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                  ),
                  label: t("pages.educationLevels.stats.realTime", "Real-Time"),
                  color: "blue",
                },
                {
                  icon: (
                    <FontAwesomeIcon
                      icon={faAward}
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                  ),
                  label: t(
                    "pages.educationLevels.stats.certified",
                    "Certified",
                  ),
                  color: "yellow",
                },
                {
                  icon: (
                    <FontAwesomeIcon
                      icon={faMobileScreen}
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                  ),
                  label: t(
                    "pages.educationLevels.stats.mobileReady",
                    "Mobile Ready",
                  ),
                  color: "green",
                },
                {
                  icon: (
                    <FontAwesomeIcon
                      icon={faShield}
                      className="w-5 h-5 sm:w-6 sm:h- 6"
                    />
                  ),
                  label: t("pages.educationLevels.stats.secure", "Secure"),
                  color: "red",
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{
                    scale: 1.05,
                  }}
                  className={`p-4 sm:p-6 rounded-xl lg:rounded-2xl ${themeClasses.accent} border ${themeClasses.border} text-center`}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-${stat.color}-500/20 text-${stat.color}-500 flex items-center justify-center mb-2 sm:mb-3 mx-auto`}
                  >
                    {stat.icon}
                  </div>
                  <p
                    className={`font-bold ${themeClasses.text} text-xs sm:text-sm`}
                  >
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section - Compact and responsive */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
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
          className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-10 lg:p-16 text-center"
        >
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl lg:text-4xl font-black text-white mb-3 sm:mb-6">
              {t(
                `pages.educationLevels.${level}.ctaTitle`,
                "Transform Your Institution",
              )}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-blue-100 mb-5 sm:mb-8 max-w-2xl mx-auto">
              {t(
                `pages.educationLevels.${level}.ctaSubtitle`,
                "Join leading institutions worldwide",
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <motion.button
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={() => navigate("/schoolchat/login")}
                className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base lg:text-lg shadow-xl hover:bg-blue-50 transition-all w-full sm:w-auto"
              >
                <FontAwesomeIcon
                  icon={faRocket}
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
                <span>
                  {t("pages.educationLevels.cta.getStarted", "Get Started")}
                </span>
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={() => navigate("/schoolchat/functionalities")}
                className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-blue-500/10 text-white border-2 border-white/20 hover:bg-white/10 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base lg:text-lg backdrop-blur-sm transition-all w-full sm:w-auto"
              >
                <span>
                  {t("pages.educationLevels.cta.learnMore", "Learn More")}
                </span>
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
              </motion.button>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-white/10 rounded-full blur-3xl" />
        </motion.div>
      </div>
    </div>
  );
};
export default EducationLevel;
