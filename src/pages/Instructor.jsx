import React from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import { useTranslation } from "../hooks/useTranslation";
import { motion } from "framer-motion";

export const InstructorContent = ({ theme }) => {
  const { t } = useTranslation();
  
  // Team data moved inside component to access translation hook
  const team = [
    {
      id: 1,
      cover: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
      name: "Sarah Johnson",
      work: t("pages.instructor.team.productManager"),
    },
    {
      id: 2,
      cover: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
      name: "Michael Chen",
      work: t("pages.instructor.team.leadDeveloper"),
    },
    {
      id: 3,
      cover: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
      name: "Emily Rodriguez",
      work: t("pages.instructor.team.uxDesigner"),
    },
    {
      id: 4,
      cover: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
      name: "David Thompson",
      work: t("pages.instructor.team.marketingDirector"),
    },
    {
      id: 5,
      cover: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&q=80",
      name: "Lisa Anderson",
      work: t("pages.instructor.team.customerSuccess"),
    },
    {
      id: 6,
      cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      name: "James Wilson",
      work: t("pages.instructor.team.headOfEngineering"),
    },
    {
      id: 7,
      cover: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
      name: "Maria Garcia",
      work: t("pages.instructor.team.contentStrategist"),
    },
    {
      id: 8,
      cover: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
      name: "Robert Lee",
      work: t("pages.instructor.team.salesManager"),
    },
  ];

  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          iconBg: "bg-gray-700 text-white hover:bg-blue-600",
        };
      case "light":
        return {
          bg: "bg-gray-50",
          text: "text-gray-800",
          cardBg: "bg-white",
          iconBg: "bg-gray-100 text-gray-600 hover:bg-blue-500 hover:text-white",
        };
      default:
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          iconBg: "bg-gray-700 text-white hover:bg-blue-600",
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
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <section className={`py-20 ${themeClasses.bg} relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
           className="text-center mb-16"
           initial={{ opacity: 0, y: -20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
        >
           <div className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold tracking-wide uppercase mb-4">
             {t("pages.instructor.badge")}
           </div>
           <h1 className={`text-4xl lg:text-5xl font-bold mb-4 ${themeClasses.text}`}>
             {t("pages.instructor.title")}
           </h1>
           <p className={`text-lg max-w-2xl mx-auto ${themeClasses.text} opacity-70`}>
             {t("pages.instructor.subtitle")}
           </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {team.map((val, index) => (
            <motion.div 
               key={index} 
               variants={cardVariants}
               whileHover={{ y: -10 }}
               className={`rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-center ${themeClasses.cardBg} border border-gray-100 dark:border-gray-700 group`}
            >
              <div className="relative w-32 h-32 mx-auto mb-6">
                 <div className="absolute inset-0 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                 <img 
                    src={val.cover} 
                    alt={val.name} 
                    className="w-full h-full object-cover rounded-full border-4 border-white dark:border-gray-700 relative z-10"
                 />
                 <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 z-20"></div>
              </div>
              
              <h2 className={`text-xl font-bold mb-2 group-hover:text-green-600 transition-colors ${themeClasses.text}`}>{val.name}</h2>
              <p className={`text-sm mb-6 ${themeClasses.text} opacity-60 uppercase tracking-wider font-semibold`}>{val.work}</p>

              <div className="flex justify-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                {[<FaFacebookF />, <FaTwitter />, <FaLinkedinIn />].map((icon, i) => (
                   <a key={i} href="#" className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${themeClasses.iconBg}`}>
                      {icon}
                   </a>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export const Instructor = ({ theme }) => {
  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
    >
       <InstructorContent theme={theme} />
    </motion.div>
  );
};

export default Instructor;