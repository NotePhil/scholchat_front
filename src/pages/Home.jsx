import React from "react";
import { useNavigate } from "react-router-dom";
import heroImg from "../components/assets/images/heronew.png";
import { About } from "./About";
import { Courses } from "./Courses";
import { Instructor } from "./Instructor";
import { Blog } from "./Blog";
import FunctionalitiesSection from "./FunctionalitiesSection";
import { motion } from "framer-motion";
import { useTranslation } from "../hooks/useTranslation";
import { Rocket, PlayCircle } from "lucide-react";

export const HomeContent = ({ theme }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          itemBg: "bg-gray-800/50",
          badgeBg: "bg-blue-900/30",
          badgeText: "text-blue-400",
        };
      case "light":
        return {
          bg: "bg-gray-50",
          text: "text-gray-800",
          itemBg: "bg-white/60",
          badgeBg: "bg-blue-50",
          badgeText: "text-blue-600",
        };
      default:
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          itemBg: "bg-gray-800/50",
          badgeBg: "bg-blue-900/30",
          badgeText: "text-blue-400",
        };
    }
  };

  const themeClasses = getThemeClasses();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className={`min-h-screen relative overflow-hidden ${themeClasses.bg}`}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <motion.div 
          className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Text Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <motion.div variants={itemVariants}>
              <div className={`inline-flex items-center gap-2 ${themeClasses.badgeBg} backdrop-blur-sm border border-blue-200/20 rounded-full px-6 py-2 mb-8 shadow-sm`}>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className={`${themeClasses.badgeText} font-semibold text-sm tracking-wide uppercase`}>
                  {t("pages.home.badge")}
                </span>
              </div>
            </motion.div>

            <motion.h1 
              className="text-3xl sm:text-5xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-[1.1] tracking-tight break-words hyphens-auto"
              variants={itemVariants}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-x">
                {t("pages.home.animatedTexts.text1")}
              </span>
            </motion.h1>

            <motion.p 
              className={`text-base sm:text-xl ${themeClasses.text} opacity-90 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-8 sm:mb-10`}
              variants={itemVariants}
            >
              {t("pages.home.subtitle")}
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 mb-16"
              variants={itemVariants}
            >
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgb(59 130 246 / 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/schoolchat/login')}
                className="group relative w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/30 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -translate-x-full skew-x-12"></div>
                <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>{t("pages.home.cta")}</span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb' }}
                whileTap={{ scale: 0.95 }}
                className={`group w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 ${theme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'} border-2 border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-lg shadow-md transition-all`}
              >
                <PlayCircle className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                <span>{t("pages.home.cta") === "Découvrir" ? "Voir Démo" : "Watch Demo"}</span>
              </motion.button>
            </motion.div>

            <motion.div 
              className="grid grid-cols-3 gap-6 sm:gap-10 border-t border-gray-200/10 pt-10"
              variants={itemVariants}
            >
              {[
                { number: "98%", label: t("pages.home.stats.success"), icon: "🏆", color: "text-amber-500" },
                { number: "5k+", label: t("pages.home.stats.families"), icon: "👨👩👧", color: "text-blue-500" },
                { number: "24/7", label: t("pages.home.stats.support"), icon: "💬", color: "text-purple-500" },
              ].map((stat, i) => (
                <div key={i} className="text-center lg:text-left">
                  <div className={`text-2xl sm:text-3xl font-bold mb-1 ${stat.color}`}>{stat.number}</div>
                  <div className={`text-sm sm:text-base ${themeClasses.text} opacity-70`}>{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero Image */}
          <motion.div 
            className="w-full lg:w-1/2 relative"
            variants={itemVariants}
          >
            <div className="relative z-10">
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src={heroImg}
                  alt="SchoolChat Hero"
                  className="w-full h-auto rounded-3xl shadow-2xl ring-1 ring-black/5"
                />
              </motion.div>
              
              {/* Floating Badge 1 */}
              <motion.div 
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className={`absolute -left-16 top-16 ${themeClasses.itemBg} backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 hidden lg:block`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">🚀</div>
                  <div>
                    <div className="font-bold text-sm">{t("pages.home.floatingBadges.innovation")}</div>
                    <div className="text-xs opacity-70">{t("pages.home.floatingBadges.technological")}</div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Badge 2 */}
              <motion.div 
                animate={{ y: [-15, 15, -15] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className={`absolute -right-16 bottom-16 ${themeClasses.itemBg} backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 hidden lg:block`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">🎓</div>
                  <div>
                    <div className="font-bold text-sm">{t("pages.home.floatingBadges.excellence")}</div>
                    <div className="text-xs opacity-70">{t("pages.home.floatingBadges.guaranteed")}</div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Background Glow behind image */}
            <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full -z-10 transform scale-90" />
          </motion.div>
        </motion.div>
      </div>

       {/* Badges Slider (simplified as static for now but styled) */}
       <motion.div 
          className="w-full py-6 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent dark:via-gray-800/50 backdrop-blur-sm border-y border-gray-100/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
       >
          <div className="flex flex-wrap justify-center gap-4 sm:gap-12">
            {[
              t("pages.home.floatingBadges.innovation"),
              t("pages.home.floatingBadges.technological"),
              t("pages.home.floatingBadges.excellence"),
              t("pages.home.floatingBadges.guaranteed"),
              t("pages.home.floatingBadges.innovation"),
              t("pages.home.floatingBadges.excellence")
            ].map((badge, i) => (
              <span
                key={i}
                className="text-gray-400 dark:text-gray-500 text-sm font-semibold uppercase tracking-widest hover:text-blue-500 transition-colors cursor-default"
              >
                {badge}
              </span>
            ))}
          </div>
       </motion.div>
    </section>
  );
};

const Home = ({ theme }) => {
  return (
    <div className={`transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <HomeContent theme={theme} />
      <div className="relative z-10">
        <About theme={theme} />
        <FunctionalitiesSection theme={theme} />
        <Instructor theme={theme} />
        <Courses theme={theme} />
        <Blog theme={theme} />
      </div>
    </div>
  );
};

export { Home };
export default Home;
