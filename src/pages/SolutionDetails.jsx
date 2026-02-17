import React, { useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "../hooks/useTranslation";
import { 
  CheckCircle2, 
  ArrowLeft, 
  Star, 
  Users, 
  Shield, 
  Zap, 
  Globe, 
  Smartphone,
  ChevronRight,
  Play,
  Download,
  MessageSquare,
  BarChart,
  Lock,
  GraduationCap,
  BookOpen,
  Trophy
} from "lucide-react";

/**
 * SolutionDetails Component
 * Displays professional details for each education level / product.
 * Supports: Dark Mode, Translations, Mobile Responsiveness.
 */
const SolutionDetails = ({ theme }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Ensure scroll to top on enter
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Theme Definition
  const themeClasses = useMemo(() => {
    const isDark = theme === "dark";
    return {
      bg: isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900",
      itemBg: isDark ? "bg-gray-800" : "bg-white",
      border: isDark ? "border-gray-700" : "border-gray-200",
      subtext: isDark ? "text-gray-400" : "text-gray-600",
      cardBg: isDark ? "bg-gray-800/40" : "bg-white",
      accent: isDark ? "text-blue-400" : "text-blue-600",
      heroBg: "bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950",
      buttonPrimary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20",
      buttonSecondary: isDark ? "bg-gray-800 text-white border border-gray-700 hover:bg-gray-700" : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"
    };
  }, [theme]);

  // Configuration Mapper for different IDs
  const solutionConfig = useMemo(() => {
    const dataMap = {
      "nurseries": { icon: <MessageSquare />, img: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1200", badgeKey: "nursery" },
      "kindergarten": { icon: <GraduationCap />, img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200", badgeKey: "kindergarten" },
      "primary": { icon: <BookOpen />, img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200", badgeKey: "primary" },
      "middle": { icon: <BookOpen />, img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200", badgeKey: "middle" },
      "high": { icon: <Trophy />, img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200", badgeKey: "high" },
      "university": { icon: <Globe />, img: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200", badgeKey: "university" }
    };

    const active = dataMap[id] || dataMap["nurseries"];
    const baseNavKey = `pages.courses.items.${id}`;
    
    return {
      title: t(`${baseNavKey}.name`, active.badgeKey.toUpperCase()),
      badge: t(`pages.solutionDetails.badges.${active.badgeKey}`, active.badgeKey),
      description: t(`${baseNavKey}.desc`, "Professional School Management Solutions"),
      mainImg: active.img,
      features: [
        { 
          title: t(`pages.solutionDetails.features.${id}.f1.title`, t("pages.solutionDetails.features.nurseries.f1.title")), 
          desc: t(`pages.solutionDetails.features.${id}.f1.desc`, t("pages.solutionDetails.features.nurseries.f1.desc")), 
          icon: active.icon 
        },
        { 
          title: t(`pages.solutionDetails.features.${id}.f2.title`, t("pages.solutionDetails.features.nurseries.f2.title")), 
          desc: t(`pages.solutionDetails.features.${id}.f2.desc`, t("pages.solutionDetails.features.nurseries.f2.desc")), 
          icon: <Shield className="text-emerald-500" /> 
        },
        { 
          title: t(`pages.solutionDetails.features.${id}.f3.title`, t("pages.solutionDetails.features.nurseries.f3.title")), 
          desc: t(`pages.solutionDetails.features.${id}.f3.desc`, t("pages.solutionDetails.features.nurseries.f3.desc")), 
          icon: <BarChart className="text-amber-500" /> 
        }
      ]
    };
  }, [id, t]);

  const variants = {
    container: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } },
    itemInitial: { opacity: 0, y: 30 },
    itemAnimate: { opacity: 1, y: 0 }
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} transition-colors duration-500 pb-16`}>
      {/* Hero Header */}
      <section className={`relative pt-32 sm:pt-40 pb-20 sm:pb-32 overflow-hidden ${themeClasses.heroBg || 'bg-slate-950'} text-white`}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:30px_30px]"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 blur-[150px] -mr-64 -mt-64 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/20 blur-[120px] -ml-48 -mb-48 rounded-full"></div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-10 text-white/60 hover:text-white transition-all group font-black text-xs uppercase tracking-[0.2em]"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t("common.actions.back")}
          </motion.button>

          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div initial="hidden" animate="visible" variants={variants.container}>
              <motion.div variants={{hidden: variants.itemInitial, visible: variants.itemAnimate}} className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 mb-8">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest">{solutionConfig.badge}</span>
              </motion.div>
              
              <motion.h1 variants={{hidden: variants.itemInitial, visible: variants.itemAnimate}} className="text-4xl sm:text-6xl lg:text-7xl font-black mb-8 leading-[1.05] tracking-tight">
                {solutionConfig.title}
              </motion.h1>
              
              <motion.p variants={{hidden: variants.itemInitial, visible: variants.itemAnimate}} className="text-lg sm:text-xl text-white/70 mb-12 leading-relaxed max-w-xl">
                {solutionConfig.description}
              </motion.p>
              
              <motion.div variants={{hidden: variants.itemInitial, visible: variants.itemAnimate}} className="flex flex-col sm:flex-row gap-5">
                <button className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-wider hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3">
                  <Play className="w-5 h-5 fill-current" />
                  {t("pages.solutionDetails.demo")}
                </button>
                <button className="w-full sm:w-auto px-10 py-5 bg-white/5 backdrop-blur-md text-white border border-white/20 rounded-[2rem] font-black text-sm uppercase tracking-wider hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                  <Download className="w-5 h-5" />
                  {t("pages.solutionDetails.brochure")}
                </button>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative lg:mt-0"
            >
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-[0_60px_100px_-20px_rgba(0,0,0,0.6)] border-[12px] border-white/10 aspect-[4/3]">
                <img src={solutionConfig.mainImg} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </div>
              
              {/* Floating Stat Card */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-6 sm:-right-10 bottom-10 sm:bottom-16 p-6 sm:p-8 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white z-20 text-slate-900 flex items-center gap-6 scale-90 sm:scale-100"
              >
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                  <Star className="w-7 h-7 fill-current" />
                </div>
                <div>
                  <div className="text-3xl font-black mb-1">4.9/5</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t("pages.solutionDetails.rating")}</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Line */}
      <section className={`py-12 border-b ${themeClasses.border} overflow-hidden font-black`}>
        <div className="container mx-auto px-4 flex flex-wrap justify-center gap-10 sm:gap-24 opacity-30 grayscale hover:opacity-60 transition-opacity">
           {["Microsoft", "Google Education", "UNESCO", "AWS"].map(brand => (
             <span key={brand} className={`text-xl sm:text-2xl tracking-tighter ${themeClasses.text}`}>{brand}</span>
           ))}
        </div>
      </section>

      {/* Core Infrastructure Section */}
      <section className="py-24 sm:py-32 container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-20 sm:mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-3xl sm:text-5xl lg:text-6xl font-black mb-8 ${themeClasses.text} leading-tight tracking-tight`}
          >
            {t("pages.solutionDetails.infrastructure")}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-lg sm:text-xl ${themeClasses.subtext} max-w-3xl mx-auto leading-relaxed`}
          >
            {t("pages.solutionDetails.infrastructureDesc")}
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {solutionConfig.features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -12 }}
              className={`p-10 sm:p-12 rounded-[3rem] ${themeClasses.cardBg} border ${themeClasses.border} shadow-2xl relative overflow-hidden group transition-all duration-300`}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600/10 text-blue-600 rounded-3xl flex items-center justify-center mb-10 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                {React.cloneElement(f.icon, { className: "w-8 h-8 sm:w-10 sm:h-10" })}
              </div>
              <h3 className={`text-2xl sm:text-3xl font-black mb-5 ${themeClasses.text} tracking-tight`}>{f.title}</h3>
              <p className={`text-base sm:text-lg leading-relaxed ${themeClasses.subtext}`}>{f.desc}</p>
              <div className={`mt-10 flex items-center gap-3 text-blue-600 font-black text-xs sm:text-sm uppercase tracking-widest cursor-pointer group-hover:gap-5 transition-all`}>
                {t("pages.solutionDetails.learnMore")} 
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Massive CTA */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="bg-slate-950 rounded-[2rem] sm:rounded-[4rem] p-8 sm:p-16 text-center relative overflow-hidden shadow-2xl border border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.3)_0%,transparent_70%)] opacity-50"></div>
          <div className="relative z-10 max-w-4xl mx-auto">
             <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 animate-bounce shadow-xl shadow-blue-500/40">
                <Zap className="w-8 h-8 text-white fill-current" />
             </div>
             
             <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
                {t("pages.solutionDetails.cta.title")}
             </h2>
             
             <p className="text-lg sm:text-xl text-blue-100/60 mb-10 leading-relaxed font-medium">
                {t("pages.solutionDetails.cta.subtitle")}
             </p>
             
             <div className="flex flex-col items-center gap-8">
                <button className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-bold text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-600/40">
                   {t("pages.solutionDetails.cta.button")}
                </button>
                
                <div className="flex items-center gap-4">
                   <div className="flex -space-x-4">
                      {[12,14,18,22,25].map(i => (
                        <img key={i} src={`https://i.pravatar.cc/100?img=${i}`} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[4px] border-slate-950 shadow-lg" alt="" />
                      ))}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[4px] border-slate-950 bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">+2k</div>
                   </div>
                   <div className="text-left border-l-2 border-white/10 pl-4">
                      <div className="text-white font-bold text-xs sm:text-sm">Trust Built on Excellence</div>
                      <div className="text-blue-500 font-bold text-[9px] uppercase tracking-widest mt-1">Join the digital revolution</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SolutionDetails;
