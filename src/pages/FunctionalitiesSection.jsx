import React, { useState, useEffect, useRef } from "react";
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
  const [activeCard, setActiveCard] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const getThemeStyles = () => {
    switch (theme) {
      case "dark":
        return {
          background: `
            radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e1b4b 75%, #0f172a 100%),
            radial-gradient(ellipse at top left, #1e40af 0%, transparent 50%),
            radial-gradient(ellipse at bottom right, #7c3aed 0%, transparent 50%)
          `,
          textColor: "text-gray-200",
          cardBg: "bg-gray-800/80",
          cardBorder: "border-gray-700",
          cardHoverBorder: "border-gray-600",
          titleGradient: "from-cyan-300 via-blue-400 to-purple-400",
        };
      case "light":
        return {
          background: `
            radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
            linear-gradient(135deg, #f8fafc 0%, #f1f5f9 25%, #f8fafc 50%, #eef2ff 75%, #f8fafc 100%),
            radial-gradient(ellipse at top left, #bfdbfe 0%, transparent 50%),
            radial-gradient(ellipse at bottom right, #c7d2fe 0%, transparent 50%)
          `,
          textColor: "text-gray-800",
          cardBg: "bg-white/80",
          cardBorder: "border-gray-200",
          cardHoverBorder: "border-gray-300",
          titleGradient: "from-blue-500 via-purple-500 to-pink-500",
        };
      default:
        return {
          background: `
            radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e1b4b 75%, #0f172a 100%),
            radial-gradient(ellipse at top left, #1e40af 0%, transparent 50%),
            radial-gradient(ellipse at bottom right, #7c3aed 0%, transparent 50%)
          `,
          textColor: "text-gray-200",
          cardBg: "bg-black/20",
          cardBorder: "border-white/20",
          cardHoverBorder: "border-white/40",
          titleGradient: "from-cyan-300 via-blue-400 to-purple-400",
        };
    }
  };

  const themeStyles = getThemeStyles();

  const functionalities = [
    {
      icon: BookOpen,
      title: t("pages.functionalities.features.textbook.title"),
      description: t("pages.functionalities.features.textbook.desc"),
      color: "from-blue-500 to-blue-600",
      bgColor: theme === "dark" ? "bg-blue-900/30" : "bg-blue-50",
      textColor: "text-blue-600",
      glowColor: "shadow-blue-500/25",
    },
    {
      icon: Mail,
      title: t("pages.functionalities.features.messaging.title"),
      description: t("pages.functionalities.features.messaging.desc"),
      color: "from-purple-500 to-purple-600",
      bgColor: theme === "dark" ? "bg-purple-900/30" : "bg-purple-50",
      textColor: "text-purple-600",
      glowColor: "shadow-purple-500/25",
    },
    {
      icon: ClipboardList,
      title: t("pages.functionalities.features.homework.title"),
      description: t("pages.functionalities.features.homework.desc"),
      color: "from-emerald-500 to-emerald-600",
      bgColor: theme === "dark" ? "bg-emerald-900/30" : "bg-emerald-50",
      textColor: "text-emerald-600",
      glowColor: "shadow-emerald-500/25",
    },
    {
      icon: UserCheck,
      title: t("pages.functionalities.features.attendance.title"),
      description: t("pages.functionalities.features.attendance.desc"),
      color: "from-orange-500 to-orange-600",
      bgColor: theme === "dark" ? "bg-orange-900/30" : "bg-orange-50",
      textColor: "text-orange-600",
      glowColor: "shadow-orange-500/25",
    },
    {
      icon: Target,
      title: t("pages.functionalities.features.goals.title"),
      description: t("pages.functionalities.features.goals.desc"),
      color: "from-rose-500 to-rose-600",
      bgColor: theme === "dark" ? "bg-rose-900/30" : "bg-rose-50",
      textColor: "text-rose-600",
      glowColor: "shadow-rose-500/25",
    },
    {
      icon: Calendar,
      title: t("pages.functionalities.features.schedule.title"),
      description: t("pages.functionalities.features.schedule.desc"),
      color: "from-indigo-500 to-indigo-600",
      bgColor: theme === "dark" ? "bg-indigo-900/30" : "bg-indigo-50",
      textColor: "text-indigo-600",
      glowColor: "shadow-indigo-500/25",
    },
  ];

  return (
    <>
      <style>{`
        @keyframes magicFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-8px) rotate(2deg);
          }
          66% {
            transform: translateY(-4px) rotate(-1deg);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.6),
              0 0 40px rgba(59, 130, 246, 0.3);
          }
        }

        @keyframes iconBounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0) scale(1);
          }
          40% {
            transform: translateY(-12px) scale(1.1);
          }
          60% {
            transform: translateY(-6px) scale(1.05);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .magic-icon {
          animation: magicFloat 3s ease-in-out infinite;
        }

        .magic-icon:hover {
          animation: iconBounce 0.6s ease-in-out;
        }

        .sparkle-effect::before {
          content: "✨";
          position: absolute;
          top: -5px;
          right: -5px;
          animation: sparkle 2s ease-in-out infinite;
          font-size: 12px;
        }

        .sparkle-effect::after {
          content: "⭐";
          position: absolute;
          bottom: -5px;
          left: -5px;
          animation: sparkle 2s ease-in-out infinite 0.5s;
          font-size: 10px;
        }

        .glow-effect {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .shimmer-text {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.8),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }

        .fade-in-up {
          animation: fadeInUp 0.8s ease forwards;
        }

        .slide-in-left {
          animation: slideInLeft 0.8s ease forwards;
        }

        .slide-in-right {
          animation: slideInRight 0.8s ease forwards;
        }

        .bounce {
          animation: iconBounce 2s infinite;
        }

        /* Mobile-specific styles */
        @media (max-width: 640px) {
          .mobile-text-sm {
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
          }
          .mobile-text-md {
            font-size: 1rem !important;
            line-height: 1.5rem !important;
          }
          .mobile-text-lg {
            font-size: 1.125rem !important;
            line-height: 1.75rem !important;
          }
          .mobile-text-xl {
            font-size: 1.25rem !important;
            line-height: 1.75rem !important;
          }
          .mobile-text-2xl {
            font-size: 1.5rem !important;
            line-height: 2rem !important;
          }
          .mobile-text-3xl {
            font-size: 1.75rem !important;
            line-height: 2.25rem !important;
          }
          .mobile-px-sm {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }
          .mobile-py-sm {
            padding-top: 0.75rem !important;
            padding-bottom: 0.75rem !important;
          }
          .mobile-p-sm {
            padding: 0.75rem !important;
          }
          .mobile-mb-sm {
            margin-bottom: 0.75rem !important;
          }
          .mobile-gap-sm {
            gap: 0.75rem !important;
          }
          .mobile-w-sm {
            width: 2.5rem !important;
            height: 2.5rem !important;
          }
          .mobile-icon-sm {
            width: 1.25rem !important;
            height: 1.25rem !important;
          }
          .mobile-badge-text {
            font-size: 0.75rem !important;
          }
          .mobile-badge-px {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
          }
          .mobile-badge-py {
            padding-top: 0.25rem !important;
            padding-bottom: 0.25rem !important;
          }
        }
      `}</style>

      <section
        ref={sectionRef}
        className="relative min-h-screen overflow-hidden py-12 sm:py-20"
        style={{
          background: themeStyles.background,
        }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full opacity-40 ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-cyan-400 to-purple-500"
                    : theme === "light"
                    ? "bg-gradient-to-r from-blue-400 to-purple-400"
                    : "bg-gradient-to-r from-cyan-400 to-purple-500"
                }`}
              ></div>
            </div>
          ))}
        </div>

        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-bounce ${
              theme === "dark"
                ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10"
                : theme === "light"
                ? "bg-gradient-to-br from-blue-200/30 to-purple-200/30"
                : "bg-gradient-to-br from-blue-500/10 to-purple-500/10"
            }`}
            style={{ animationDuration: "8s" }}
          ></div>
          <div
            className={`absolute top-40 right-20 w-24 h-24 rounded-lg blur-xl animate-spin ${
              theme === "dark"
                ? "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10"
                : theme === "light"
                ? "bg-gradient-to-br from-emerald-200/30 to-cyan-200/30"
                : "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10"
            }`}
            style={{ animationDuration: "25s" }}
          ></div>
          <div
            className={`absolute bottom-40 left-1/4 w-40 h-40 rounded-full blur-xl animate-pulse ${
              theme === "dark"
                ? "bg-gradient-to-br from-pink-500/10 to-purple-500/10"
                : theme === "light"
                ? "bg-gradient-to-br from-pink-200/30 to-purple-200/30"
                : "bg-gradient-to-br from-pink-500/10 to-purple-500/10"
            }`}
            style={{ animationDuration: "6s" }}
          ></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Header */}
          <div
            className={`text-center mb-8 sm:mb-16 transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            {/* Magical Badge */}
            <div
              className={`inline-flex items-center gap-2 sm:gap-3 backdrop-blur-xl border rounded-full mobile-badge-px mobile-badge-py sm:px-8 sm:py-3 mb-4 sm:mb-8 hover:scale-105 transition-all duration-500 shadow-2xl ${
                theme === "dark"
                  ? "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border-white/20 shadow-blue-500/25"
                  : theme === "light"
                  ? "bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 border-gray-300/20 shadow-blue-400/25"
                  : "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border-white/20 shadow-blue-500/25"
              }`}
            >
              <div
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full animate-pulse ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-blue-400 to-purple-400"
                    : theme === "light"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500"
                    : "bg-gradient-to-r from-blue-400 to-purple-400"
                }`}
              ></div>
              <span
                className={`font-semibold mobile-badge-text sm:text-lg ${
                  theme === "dark"
                    ? "text-white"
                    : theme === "light"
                    ? "text-gray-800"
                    : "text-white"
                }`}
              >
                🚀 {t("pages.functionalities.badge")}
              </span>
              <div
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full animate-pulse ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-purple-400 to-pink-400"
                    : theme === "light"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : "bg-gradient-to-r from-purple-400 to-pink-400"
                }`}
              ></div>
            </div>

            <div
              className={`relative inline-flex items-center justify-center mobile-w-sm sm:w-20 sm:h-20 rounded-3xl mb-4 sm:mb-8 shadow-2xl glow-effect sparkle-effect ${
                theme === "dark"
                  ? "bg-gradient-to-br from-cyan-500 to-purple-600"
                  : theme === "light"
                  ? "bg-gradient-to-br from-cyan-400 to-purple-500"
                  : "bg-gradient-to-br from-cyan-500 to-purple-600"
              }`}
            >
              <Target className="mobile-icon-sm sm:w-10 sm:h-10 text-white magic-icon" />
            </div>

            <h2
              className={`mobile-text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent mb-3 sm:mb-6 shimmer-text drop-shadow-2xl ${
                theme === "dark"
                  ? "bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400"
                  : theme === "light"
                  ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                  : "bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400"
              }`}
            >
              {t("pages.functionalities.title")}
            </h2>

            <p
              className={`mobile-text-md sm:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed mb-3 sm:mb-6 font-light ${
                theme === "dark"
                  ? "text-gray-200"
                  : theme === "light"
                  ? "text-gray-700"
                  : "text-gray-200"
              }`}
            >
              ✨ {t("pages.functionalities.subtitle")} ⚡
            </p>

            <div
              className={`w-16 sm:w-32 h-1 mx-auto rounded-full opacity-80 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
                  : theme === "light"
                  ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                  : "bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
              }`}
            ></div>
          </div>

          {/* Responsive Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {functionalities.map((func, index) => {
              const IconComponent = func.icon;
              return (
                <div
                  key={index}
                  className={`magic-card group relative backdrop-blur-2xl rounded-xl sm:rounded-3xl mobile-p-sm sm:p-6 lg:p-8 transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 ${
                    func.glowColor
                  } shadow-lg hover:shadow-xl ${
                    isVisible ? "fade-in-up" : ""
                  } ${themeStyles.cardBg} border ${
                    themeStyles.cardBorder
                  } hover:${themeStyles.cardHoverBorder}`}
                  style={{
                    transitionDelay: `${index * 150}ms`,
                    animationDelay: `${index * 150}ms`,
                  }}
                  onMouseEnter={() => setActiveCard(index)}
                  onMouseLeave={() => setActiveCard(null)}
                >
                  {/* Magical background overlay */}
                  <div
                    className={`absolute inset-0 rounded-xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      theme === "dark"
                        ? "bg-gradient-to-br from-white/10 to-white/5"
                        : theme === "light"
                        ? "bg-gradient-to-br from-black/5 to-black/2"
                        : "bg-gradient-to-br from-white/10 to-white/5"
                    }`}
                  ></div>

                  {/* Sparkle effects on hover */}
                  <div
                    className={`absolute -top-2 -right-2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                      theme === "dark"
                        ? "bg-yellow-400"
                        : theme === "light"
                        ? "bg-yellow-500"
                        : "bg-yellow-400"
                    }`}
                    style={{ animation: "sparkle 1s ease-in-out infinite" }}
                  ></div>
                  <div
                    className={`absolute -bottom-2 -left-2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                      theme === "dark"
                        ? "bg-pink-400"
                        : theme === "light"
                        ? "bg-pink-500"
                        : "bg-pink-400"
                    }`}
                    style={{
                      animation: "sparkle 1s ease-in-out infinite 0.5s",
                    }}
                  ></div>

                  {/* Glowing border effect */}
                  <div
                    className={`absolute -inset-1 bg-gradient-to-r ${func.color} rounded-xl sm:rounded-3xl blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10`}
                  ></div>

                  <div className="relative z-10">
                    <div
                      className={`relative inline-flex items-center justify-center mobile-w-sm sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-3xl mobile-mb-sm sm:mb-6 shadow-xl sparkle-effect bg-gradient-to-br ${func.color}`}
                    >
                      <IconComponent
                        className="mobile-icon-sm sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white magic-icon bounce"
                        style={{ animationDelay: `${index * 0.3}s` }}
                      />
                    </div>

                    <h3
                      className={`mobile-text-lg sm:text-xl lg:text-2xl font-bold mobile-mb-sm sm:mb-3 lg:mb-4 group-hover:${
                        theme === "dark"
                          ? "text-gray-100"
                          : theme === "light"
                          ? "text-gray-900"
                          : "text-gray-100"
                      } transition-colors duration-300 ${
                        themeStyles.textColor
                      }`}
                    >
                      {func.title}
                    </h3>

                    <p
                      className={`mobile-text-sm sm:text-base leading-relaxed mobile-mb-sm sm:mb-4 lg:mb-6 group-hover:${
                        theme === "dark"
                          ? "text-gray-200"
                          : theme === "light"
                          ? "text-gray-800"
                          : "text-gray-200"
                      } transition-colors duration-300 ${
                        theme === "dark"
                          ? "text-gray-300"
                          : theme === "light"
                          ? "text-gray-600"
                          : "text-gray-300"
                      }`}
                    >
                      {func.description}
                    </p>

                    <div
                      className={`flex items-center font-medium mobile-text-sm sm:text-sm lg:text-base transition-all duration-300 ${
                        theme === "dark"
                          ? "text-cyan-400 group-hover:text-cyan-300"
                          : theme === "light"
                          ? "text-blue-600 group-hover:text-blue-500"
                          : "text-cyan-400 group-hover:text-cyan-300"
                      }`}
                    >
                      <span>{t("pages.functionalities.learnMore")}</span>
                      <ChevronRight
                        className={`mobile-icon-sm sm:w-4 sm:h-4 lg:w-5 lg:h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300 ${
                          theme === "dark"
                            ? "text-cyan-400"
                            : theme === "light"
                            ? "text-blue-600"
                            : "text-cyan-400"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Gradient overlay on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${func.color} rounded-xl sm:rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced Floating Elements */}
        <div
          className={`absolute top-20 right-10 w-2 h-2 rounded-full animate-pulse hidden lg:block ${
            theme === "dark"
              ? "bg-cyan-400"
              : theme === "light"
              ? "bg-cyan-500"
              : "bg-cyan-400"
          }`}
        ></div>
        <div
          className={`absolute bottom-32 left-20 w-3 h-3 rounded-full animate-pulse hidden lg:block ${
            theme === "dark"
              ? "bg-purple-400"
              : theme === "light"
              ? "bg-purple-500"
              : "bg-purple-400"
          }`}
        ></div>
        <div
          className={`absolute top-1/3 right-1/4 w-1 h-1 rounded-full animate-pulse hidden lg:block ${
            theme === "dark"
              ? "bg-emerald-400"
              : theme === "light"
              ? "bg-emerald-500"
              : "bg-emerald-400"
          }`}
        ></div>
        <div
          className={`absolute top-2/3 left-10 w-2 h-2 rounded-full animate-pulse hidden lg:block ${
            theme === "dark"
              ? "bg-rose-400"
              : theme === "light"
              ? "bg-rose-500"
              : "bg-rose-400"
          }`}
        ></div>
        <div
          className={`absolute bottom-20 right-1/3 w-4 h-4 rounded-full opacity-30 hidden lg:block ${
            theme === "dark"
              ? "bg-yellow-400"
              : theme === "light"
              ? "bg-yellow-500"
              : "bg-yellow-400"
          }`}
          style={{ animation: "magicFloat 4s ease-in-out infinite" }}
        ></div>
      </section>
    </>
  );
};

export default FunctionalitiesSection;
