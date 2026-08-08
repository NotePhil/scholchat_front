import React from "react";
import { FaStar, FaUserFriends, FaBook } from "react-icons/fa";
import { useTranslation } from "../hooks/useTranslation";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export const CoursesContent = ({ theme }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Courses data moved inside component for translation
  const coursesCard = [
    {
      id: 1,
      key: "nurseries",
      cover: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80",
    },
    {
      id: 2,
      key: "kindergarten",
      cover: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
    },
    {
      id: 3,
      key: "primary",
      cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80",
    },
    {
      id: 4,
      key: "middle",
      cover: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
    },
    {
      id: 5,
      key: "high",
      cover: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
    },
    {
      id: 6,
      key: "university",
      cover: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80",
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
          highlight: "bg-indigo-900/50 text-indigo-200",
        };
      case "light":
        return {
          bg: "bg-gray-50",
          text: "text-gray-800",
          cardBg: "bg-white",
          cardBorder: "border-gray-100",
          highlight: "bg-indigo-50 text-indigo-700",
        };
      default:
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          cardBorder: "border-gray-700",
          highlight: "bg-indigo-900/50 text-indigo-200",
        };
    }
  };

  const themeClasses = getThemeClasses();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
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
    <section className={`py-20 ${themeClasses.bg} min-h-screen`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-600 rounded-full text-sm font-semibold tracking-wide uppercase mb-4">
            {t("pages.courses.badge")}
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${themeClasses.text}`}>
            {t("pages.courses.title")}
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${themeClasses.text} opacity-70`}>
            {t("pages.courses.subtitle")}
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
        >
          {coursesCard.map((val, index) => {
            const coursesName = t(`pages.courses.items.${val.key}.name`);
            const desc = t(`pages.courses.items.${val.key}.desc`);
            
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -10 }}
                className={`${themeClasses.cardBg} rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border ${themeClasses.cardBorder} group`}
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 transition-opacity duration-300 opacity-60 group-hover:opacity-40"></div>
                  {val.cover && (
                      <img
                          src={val.cover}
                          alt=""
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                  )}
                  <div className="absolute bottom-4 left-4 z-20">
                      <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-lg">
                          {coursesName}
                      </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex text-amber-400 text-sm">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${themeClasses.text} opacity-60`}>(5.0)</span>
                  </div>

                  <h3 className={`text-xl font-bold mb-3 group-hover:text-indigo-500 transition-colors duration-200 line-clamp-1 ${themeClasses.text}`}>
                    {desc}
                  </h3>
                  
                  <div className="h-12 mb-4">
                      <p className={`text-sm ${themeClasses.text} opacity-70 line-clamp-2`}>
                          {t("pages.courses.cardDesc", { name: coursesName })}
                      </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className={`flex items-center space-x-4 text-sm opacity-60 ${themeClasses.text}`}>
                       <span className="flex items-center space-x-1"><FaUserFriends /> <span>1.2k+</span></span>
                       <span className="flex items-center space-x-1"><FaBook /> <span>{val.totalTime || '12+'}</span></span>
                    </div>
                    <button 
                      onClick={() => navigate(`/schoolchat/solution/${val.key}`)}
                      className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300"
                    >
                      {t("pages.courses.details")}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export const Courses = ({ theme }) => {
  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
    >
       <CoursesContent theme={theme} />
    </motion.div>
  );
};

export default Courses;