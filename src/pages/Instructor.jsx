import React, { useState, useEffect, useRef } from "react";
import {
  FaGraduationCap,
  FaUsers,
  FaComments,
  FaMobile,
  FaChartLine,
  FaBell,
  FaRocket,
  FaMagic,
  FaInfinity,
} from "react-icons/fa";
import { GiEvilBook, GiWorld } from "react-icons/gi";
import { AiOutlineCheck } from "react-icons/ai";
import { useTranslation } from "../hooks/useTranslation";

const AnimatedCounter = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
};

export const InstructorCard = ({
  icon,
  title,
  desc,
  color,
  gradient,
  delay = 0,
  theme = "default",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getCardBg = () => {
    switch (theme) {
      case "dark":
        return "bg-black/40";
      case "light":
        return "bg-white/90";
      default:
        return "bg-black/40";
    }
  };

  const getCardBorder = () => {
    switch (theme) {
      case "dark":
        return "border-white/20";
      case "light":
        return "border-gray-200/30";
      default:
        return "border-white/20";
    }
  };

  const getTextColor = () => {
    switch (theme) {
      case "dark":
        return "text-gray-200";
      case "light":
        return "text-gray-800";
      default:
        return "text-gray-200";
    }
  };

  return (
    <div
      className={`group relative transform transition-all duration-700 hover:scale-105 hover:-translate-y-4 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow Effects */}
      <div
        className={`absolute -inset-4 bg-gradient-to-r ${gradient} rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-all duration-500`}
      ></div>
      <div
        className={`absolute -inset-2 bg-gradient-to-r ${
          theme === "light"
            ? "from-black/10 to-black/5"
            : "from-white/10 to-white/5"
        } rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500`}
      ></div>

      {/* Main Card */}
      <div
        className={`relative z-20 ${getCardBg()} backdrop-blur-2xl border ${getCardBorder()} rounded-3xl p-6 text-center shadow-2xl group-hover:border-white/40 transition-all duration-500 min-h-[200px] flex flex-col justify-center`}
      >
        {/* Background Pattern */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            theme === "light"
              ? "from-black/5 to-transparent"
              : "from-white/5 to-transparent"
          } rounded-3xl`}
        ></div>

        {/* Icon Container */}
        <div
          className={`relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r ${gradient} rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
        >
          <div className="text-white text-2xl group-hover:scale-125 transition-transform duration-300">
            {icon}
          </div>

          {/* Icon Glow */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500 -z-10`}
          ></div>
        </div>

        {/* Content */}
        <div className="relative">
          <h4
            className={`text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}
          >
            {typeof title === "number" ? (
              <AnimatedCounter end={title} suffix="+" />
            ) : (
              title
            )}
          </h4>
          <p
            className={`text-sm md:text-base font-medium group-hover:text-white transition-colors duration-300 ${
              theme === "light" ? "text-gray-600" : "text-gray-300"
            }`}
          >
            {desc}
          </p>
        </div>

        {/* Hover Effect Overlay */}
        {isHovered && (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${
              gradient.replace("to-", "to-").split(" ")[1]
            }/5 rounded-3xl pointer-events-none transition-opacity duration-300`}
          ></div>
        )}

        {/* Floating Particles */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-pulse transition-all duration-500"></div>
        <div
          className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-pulse transition-all duration-500"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>
    </div>
  );
};

export const Instructor = ({ theme = "default" }) => {
  const { t } = useTranslation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
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

  const getBackground = () => {
    switch (theme) {
      case "dark":
        return `
          radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e1b4b 75%, #0f172a 100%),
          radial-gradient(ellipse at top right, #1e40af 0%, transparent 50%),
          radial-gradient(ellipse at bottom left, #7c3aed 0%, transparent 50%)
        `;
      case "light":
        return `
          radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          linear-gradient(135deg, #f8fafc 0%, #f1f5f9 25%, #f8fafc 50%, #eef2ff 75%, #f8fafc 100%),
          radial-gradient(ellipse at top right, #bfdbfe 0%, transparent 50%),
          radial-gradient(ellipse at bottom left, #c7d2fe 0%, transparent 50%)
        `;
      default:
        return `
          radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e1b4b 75%, #0f172a 100%),
          radial-gradient(ellipse at top right, #1e40af 0%, transparent 50%),
          radial-gradient(ellipse at bottom left, #7c3aed 0%, transparent 50%)
        `;
    }
  };

  const getTextColor = () => {
    switch (theme) {
      case "dark":
        return "text-gray-200";
      case "light":
        return "text-gray-800";
      default:
        return "text-gray-200";
    }
  };

  const statsData = [
    {
      icon: <FaUsers />,
      title: 2840,
      desc: t("pages.instructor.stats.families"),
      gradient: "from-blue-500 to-cyan-500",
      delay: 0,
    },
    {
      icon: <FaComments />,
      title: 15600,
      desc: t("pages.instructor.stats.messages"),
      gradient: "from-purple-500 to-pink-500",
      delay: 100,
    },
    {
      icon: <FaGraduationCap />,
      title: 450,
      desc: t("pages.instructor.stats.schools"),
      gradient: "from-emerald-500 to-teal-500",
      delay: 200,
    },
    {
      icon: <FaMobile />,
      title: 98,
      desc: t("pages.instructor.stats.satisfaction"),
      gradient: "from-orange-500 to-red-500",
      delay: 300,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="min-h-screen relative overflow-hidden py-12 md:py-20"
      style={{
        background: getBackground(),
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
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
                theme === "light"
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
            theme === "light"
              ? "bg-gradient-to-br from-blue-200/30 to-purple-200/30"
              : "bg-gradient-to-br from-blue-500/10 to-purple-500/10"
          }`}
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className={`absolute top-40 right-20 w-24 h-24 rounded-lg blur-xl animate-spin ${
            theme === "light"
              ? "bg-gradient-to-br from-emerald-200/30 to-cyan-200/30"
              : "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10"
          }`}
          style={{ animationDuration: "25s" }}
        ></div>
        <div
          className={`absolute bottom-40 left-1/4 w-40 h-40 rounded-full blur-xl animate-pulse ${
            theme === "light"
              ? "bg-gradient-to-br from-pink-200/30 to-red-200/30"
              : "bg-gradient-to-br from-pink-500/10 to-purple-500/10"
          }`}
          style={{ animationDuration: "6s" }}
        ></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div
          className={`text-center mb-12 md:mb-20 transform transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* Magical Badge */}
          <div
            className={`inline-flex items-center gap-3 backdrop-blur-xl border rounded-full px-6 py-2 mb-6 md:mb-8 hover:scale-105 transition-all duration-500 shadow-lg ${
              theme === "light"
                ? "bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 border-gray-200/30 shadow-blue-400/25"
                : "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border-white/20 shadow-blue-500/25"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${
                theme === "light"
                  ? "bg-gradient-to-r from-blue-400 to-purple-400"
                  : "bg-gradient-to-r from-blue-400 to-purple-400"
              }`}
            ></div>
            <span
              className={`text-sm md:text-lg font-semibold ${
                theme === "light" ? "text-gray-800" : "text-white"
              }`}
            >
              🎯 {t("pages.instructor.badge")}
            </span>
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${
                theme === "light"
                  ? "bg-gradient-to-r from-purple-400 to-pink-400"
                  : "bg-gradient-to-r from-purple-400 to-pink-400"
              }`}
            ></div>
          </div>

          <h1
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl ${
              theme === "light" ? "text-shadow-sm" : ""
            }`}
          >
            {t("pages.instructor.title.line1")}
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              {t("pages.instructor.title.line2")}
            </span>
          </h1>

          <p
            className={`text-lg md:text-xl lg:text-2xl mt-6 md:mt-8 leading-relaxed font-light max-w-4xl mx-auto ${
              theme === "light" ? "text-gray-700" : "text-gray-200"
            }`}
          >
            🚀 {t("pages.instructor.subtitle")} ✨
          </p>
        </div>

        {/* Feature Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Learning Experience Card */}
          <div
            className={`group relative transform transition-all duration-1000 hover:scale-105 hover:-translate-y-4 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            {/* Glow Effects */}
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
            <div
              className={`absolute -inset-2 bg-gradient-to-r ${
                theme === "light"
                  ? "from-black/10 to-black/5"
                  : "from-white/10 to-white/5"
              } rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500`}
            ></div>

            {/* Main Card */}
            <div
              className={`relative z-20 ${
                theme === "light" ? "bg-white/90" : "bg-black/40"
              } backdrop-blur-2xl border ${
                theme === "light" ? "border-gray-200/30" : "border-white/20"
              } rounded-3xl overflow-hidden shadow-2xl group-hover:border-white/40 transition-all duration-500 h-72 md:h-80`}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop"
                  alt="Communication Moderne"
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />
                <div
                  className={`absolute inset-0 ${
                    theme === "light"
                      ? "bg-gradient-to-t from-black/60 via-black/40 to-black/20"
                      : "bg-gradient-to-t from-black/80 via-black/50 to-black/30"
                  }`}
                ></div>
              </div>

              {/* Content Overlay */}
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-6 md:p-8">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl mb-4 md:mb-6 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <FaComments className="text-white text-xl md:text-2xl" />
                </div>

                <h2
                  className={`text-2xl md:text-3xl font-bold mb-3 md:mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-all duration-300 ${
                    theme === "light" ? "text-white" : "text-white"
                  }`}
                >
                  {t("pages.instructor.features.communication.title")}
                </h2>

                <p
                  className={`mb-4 md:mb-6 text-sm md:text-lg leading-relaxed ${
                    theme === "light" ? "text-gray-200" : "text-gray-200"
                  }`}
                >
                  {t("pages.instructor.features.communication.desc")}
                </p>

                <button
                  className={`group/btn bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300`}
                >
                  <span className="flex items-center gap-2 text-sm md:text-base">
                    🚀 {t("pages.instructor.features.communication.cta")}
                  </span>
                </button>
              </div>

              {/* Floating Elements */}
              <div className="absolute top-4 right-4 w-2 h-2 md:w-3 md:h-3 bg-cyan-400 rounded-full opacity-60 animate-pulse"></div>
              <div
                className="absolute bottom-4 left-4 w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full opacity-60 animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>
          </div>

          {/* Mobile Experience Card */}
          <div
            className={`group relative transform transition-all duration-1000 delay-200 hover:scale-105 hover:-translate-y-4 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            {/* Glow Effects */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
            <div
              className={`absolute -inset-2 bg-gradient-to-r ${
                theme === "light"
                  ? "from-black/10 to-black/5"
                  : "from-white/10 to-white/5"
              } rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500`}
            ></div>

            {/* Main Card */}
            <div
              className={`relative z-20 ${
                theme === "light" ? "bg-white/90" : "bg-black/40"
              } backdrop-blur-2xl border ${
                theme === "light" ? "border-gray-200/30" : "border-white/20"
              } rounded-3xl overflow-hidden shadow-2xl group-hover:border-white/40 transition-all duration-500 h-72 md:h-80`}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop"
                  alt="Application Mobile"
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />
                <div
                  className={`absolute inset-0 ${
                    theme === "light"
                      ? "bg-gradient-to-t from-black/60 via-black/40 to-black/20"
                      : "bg-gradient-to-t from-black/80 via-black/50 to-black/30"
                  }`}
                ></div>
              </div>

              {/* Content Overlay */}
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-6 md:p-8">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl mb-4 md:mb-6 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <FaMobile className="text-white text-xl md:text-2xl" />
                </div>

                <h2
                  className={`text-2xl md:text-3xl font-bold mb-3 md:mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300 ${
                    theme === "light" ? "text-white" : "text-white"
                  }`}
                >
                  {t("pages.instructor.features.mobile.title")}
                </h2>

                <p
                  className={`mb-4 md:mb-6 text-sm md:text-lg leading-relaxed ${
                    theme === "light" ? "text-gray-200" : "text-gray-200"
                  }`}
                >
                  {t("pages.instructor.features.mobile.desc")}
                </p>

                <button
                  className={`group/btn bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300`}
                >
                  <span className="flex items-center gap-2 text-sm md:text-base">
                    📱 {t("pages.instructor.features.mobile.cta")}
                  </span>
                </button>
              </div>

              {/* Floating Elements */}
              <div className="absolute top-4 right-4 w-2 h-2 md:w-3 md:h-3 bg-purple-400 rounded-full opacity-60 animate-pulse"></div>
              <div
                className="absolute bottom-4 left-4 w-1.5 h-1.5 md:w-2 md:h-2 bg-pink-400 rounded-full opacity-60 animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div
          className={`transform transition-all duration-1000 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <div
              className={`inline-flex items-center gap-3 backdrop-blur-xl border rounded-full px-6 py-2 mb-6 md:mb-8 hover:scale-105 transition-all duration-500 shadow-lg ${
                theme === "light"
                  ? "bg-gradient-to-r from-emerald-400/20 via-cyan-400/20 to-blue-400/20 border-gray-200/30 shadow-emerald-400/25"
                  : "bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 border-white/20 shadow-emerald-500/25"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full animate-pulse ${
                  theme === "light"
                    ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                    : "bg-gradient-to-r from-emerald-400 to-cyan-400"
                }`}
              ></div>
              <span
                className={`text-sm md:text-lg font-semibold ${
                  theme === "light" ? "text-gray-800" : "text-white"
                }`}
              >
                📊 {t("pages.instructor.stats.badge")}
              </span>
              <div
                className={`w-3 h-3 rounded-full animate-pulse ${
                  theme === "light"
                    ? "bg-gradient-to-r from-cyan-400 to-blue-400"
                    : "bg-gradient-to-r from-cyan-400 to-blue-400"
                }`}
              ></div>
            </div>

            <h2
              className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-emerald-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl ${
                theme === "light" ? "text-shadow-sm" : ""
              }`}
            >
              {t("pages.instructor.stats.title")}
            </h2>

            <p
              className={`text-lg md:text-xl leading-relaxed font-light max-w-3xl mx-auto ${
                theme === "light" ? "text-gray-700" : "text-gray-200"
              }`}
            >
              ✨ {t("pages.instructor.stats.subtitle")} 🎯
            </p>
          </div>

          {/* Statistics Grid - Updated to use responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {statsData.map((stat, index) => (
              <InstructorCard
                key={index}
                icon={stat.icon}
                title={stat.title}
                desc={stat.desc}
                gradient={stat.gradient}
                delay={stat.delay}
                theme={theme}
              />
            ))}
          </div>
        </div>

        {/* Call-to-Action Section */}
        <div
          className={`text-center mt-12 md:mt-20 transform transition-all duration-1000 delay-600 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div
            className={`backdrop-blur-2xl border rounded-3xl p-6 md:p-8 max-w-4xl mx-auto shadow-2xl ${
              theme === "light"
                ? "bg-white/90 border-gray-200/30"
                : "bg-black/20 border-white/20"
            }`}
          >
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg animate-bounce">
                <span className="text-white text-lg md:text-xl">🎉</span>
              </div>
              <h3
                className={`text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent ${
                  theme === "light" ? "text-shadow-sm" : ""
                }`}
              >
                {t("pages.instructor.cta.title")}
              </h3>
              <div
                className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg animate-bounce"
                style={{ animationDelay: "0.5s" }}
              >
                <span className="text-white text-lg md:text-xl">🚀</span>
              </div>
            </div>

            <p
              className={`mb-6 md:mb-8 text-sm md:text-lg ${
                theme === "light" ? "text-gray-600" : "text-gray-300"
              }`}
            >
              {t("pages.instructor.cta.subtitle")}
            </p>

            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              <button
                className={`group relative bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold text-sm md:text-lg hover:scale-105 hover:-translate-y-1 transition-all duration-500 shadow-lg md:shadow-xl hover:shadow-emerald-500/50 overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <span className="relative flex items-center gap-2 md:gap-3">
                  🌟 {t("pages.instructor.cta.startFree")}
                </span>
              </button>

              <button
                className={`group ${
                  theme === "light"
                    ? "bg-black/10 border-gray-200/30 hover:bg-black/20"
                    : "bg-white/10 border-white/20 hover:bg-white/20"
                } backdrop-blur-sm border px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold text-sm md:text-lg hover:scale-105 transition-all duration-300 ${
                  theme === "light" ? "text-gray-800" : "text-white"
                }`}
              >
                📞 {t("pages.instructor.cta.demo")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Floating Elements */}
      <div className="absolute top-32 right-16 w-2 h-2 bg-emerald-400 rounded-full animate-pulse hidden lg:block"></div>
      <div className="absolute bottom-48 left-12 w-3 h-3 bg-cyan-400 rounded-full animate-pulse hidden lg:block"></div>
      <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-pulse hidden lg:block"></div>
      <div className="absolute bottom-32 right-20 w-2 h-2 bg-purple-400 rounded-full animate-pulse hidden lg:block"></div>
    </section>
  );
};
