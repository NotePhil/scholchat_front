import React from "react";
import { FaUser, FaCalendarAlt, FaComment } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useTranslation } from "../hooks/useTranslation";

export const BlogContent = ({ theme }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Blog data moved inside component for translation
  const blog = [
    {
        id: 1,
        key: "item1",
        type: "Admin",
        date: "Jan 10, 2024",
        com: "5",
        cover: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80",
    },
    {
        id: 2,
        key: "item2",
        type: "Teacher",
        date: "Jan 15, 2024",
        com: "12",
        cover: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
    },
    {
        id: 3,
        key: "item3",
        type: "Parent",
        date: "Jan 20, 2024",
        com: "8",
        cover: "https://images.unsplash.com/photo-1503676382389-4809596d5290?w=800&q=80",
    },
    {
        id: 4,
        key: "item4",
        type: "Admin",
        date: "Jan 25, 2024",
        com: "15",
        cover: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
    },
    {
        id: 5,
        key: "item5",
        type: "Teacher",
        date: "Feb 1, 2024",
        com: "10",
        cover: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    },
    {
        id: 6,
        key: "item6",
        type: "Parent",
        date: "Feb 5, 2024",
        com: "7",
        cover: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&q=80",
    },
  ];

  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          dateBg: "bg-blue-600 text-white",
        };
      case "light":
        return {
          bg: "bg-gray-50",
          text: "text-gray-800",
          cardBg: "bg-white",
          dateBg: "bg-blue-500 text-white",
        };
      default:
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          dateBg: "bg-blue-600 text-white",
        };
    }
  };

  const themeClasses = getThemeClasses();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const articleVariants = {
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
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
            <div className="inline-block px-4 py-1.5 bg-pink-100 text-pink-600 rounded-full text-sm font-semibold tracking-wide uppercase mb-4">
              {t("pages.blog.badge")}
            </div>
            <h1 className={`text-4xl lg:text-5xl font-bold mb-4 ${themeClasses.text}`}>
              {t("pages.blog.title")}
            </h1>
            <p className={`text-lg max-w-2xl mx-auto ${themeClasses.text} opacity-70`}>
              {t("pages.blog.subtitle")}
            </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {blog.map((val, index) => {
             const title = t(`pages.blog.items.${val.key}.title`);
             const desc = t(`pages.blog.items.${val.key}.desc`);

             return (
                <motion.article
                  key={index}
                  variants={articleVariants}
                  whileHover={{ y: -8 }}
                  className={`rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${themeClasses.cardBg} group h-full flex flex-col`}
                >
                  <div className="relative h-64 overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10 duration-300"></div>
                    <img
                        src={val.cover}
                        alt={title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className={`absolute top-4 left-4 z-20 px-4 py-2 rounded-lg text-sm font-bold shadow-md ${themeClasses.dateBg}`}>
                       {val.date}
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col">
                    <div className={`flex items-center space-x-4 mb-4 text-xs font-semibold opacity-60 tracking-wider ${themeClasses.text}`}>
                       <div className="flex items-center space-x-1">
                          <FaUser className="text-pink-500" />
                          <span className="uppercase">{val.type}</span>
                       </div>
                       <div className="flex items-center space-x-1">
                          <FaComment className="text-blue-500" />
                          <span>{val.com} {t("pages.blog.comments")}</span>
                       </div>
                    </div>

                    <h3 className={`text-xl font-bold mb-3 leading-tight group-hover:text-pink-500 transition-colors duration-200 line-clamp-2 ${themeClasses.text}`}>
                       {title}
                    </h3>
                    
                    <p className={`text-sm opacity-70 mb-4 line-clamp-3 leading-relaxed flex-grow ${themeClasses.text}`}>
                       {desc}
                    </p>

                    <div className="pt-4 mt-auto border-t border-gray-100 dark:border-gray-700/50">
                        <button 
                          onClick={() => navigate(`/schoolchat/blog/${val.id}`)}
                          className="text-sm font-bold text-pink-500 hover:text-pink-600 uppercase tracking-widest transition-colors flex items-center gap-2 group/btn"
                        >
                            {t("pages.blog.readStory")} <span className="transform group-hover/btn:translate-x-1 transition-transform">→</span>
                        </button>
                    </div>
                  </div>
                </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export const Blog = ({ theme }) => {
  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <BlogContent theme={theme} />
    </motion.div>
  );
};

export default Blog;