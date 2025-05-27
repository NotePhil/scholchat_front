import React, { useState, useEffect, useRef } from "react";
import {
  FaBookOpen,
  FaGraduationCap,
  FaUserFriends,
  FaChalkboardTeacher,
  FaArrowRight,
  FaStar,
  FaPlay,
  FaRocket,
  FaMagic,
  FaInfinity,
} from "react-icons/fa";
import { AiOutlineCheck } from "react-icons/ai";

export const About = ({ theme = "default" }) => {
  const cards = [
    {
      gradient: "from-cyan-400 via-blue-500 to-purple-600",
      shadowColor: "shadow-cyan-500/50",
      icon: <FaGraduationCap size={40} />,
      title: "Orientation académique",
      desc: "Conseils pour choisir votre parcours avec des experts de renommée mondiale",
      stats: "98% de réussite",
      bgPattern: "⚡",
    },
    {
      gradient: "from-pink-400 via-red-500 to-orange-500",
      shadowColor: "shadow-pink-500/50",
      icon: <FaUserFriends size={40} />,
      title: "Soutien psychologique",
      desc: "Un accompagnement personnalisé par des psychologues certifiés",
      stats: "24/7 disponible",
      bgPattern: "🎯",
    },
    {
      gradient: "from-purple-500 via-indigo-500 to-blue-600",
      shadowColor: "shadow-purple-500/50",
      icon: <FaChalkboardTeacher size={40} />,
      title: "Tutorat en ligne",
      desc: "Des cours particuliers avec les meilleurs professeurs du monde",
      stats: "1000+ tuteurs",
      bgPattern: "🚀",
    },
    {
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      shadowColor: "shadow-emerald-500/50",
      icon: <FaBookOpen size={40} />,
      title: "Ressources pédagogiques",
      desc: "Une bibliothèque numérique avec contenu interactif et IA",
      stats: "50k+ ressources",
      bgPattern: "✨",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [cards.length, isHovered]);

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

  const goToCard = (index) => {
    setCurrentIndex(index);
  };

  const getBackground = () => {
    switch (theme) {
      case "dark":
        return `
          radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          linear-gradient(135deg, #0f0f23 0%, #1a0b3d 25%, #2563eb 50%, #7c3aed 75%, #0f0f23 100%),
          radial-gradient(ellipse at top, #1e1b4b 0%, transparent 70%),
          radial-gradient(ellipse at bottom, #312e81 0%, transparent 70%)
        `;
      case "light":
        return `
          radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          linear-gradient(135deg, #f8fafc 0%, #f1f5f9 25%, #f8fafc 50%, #eef2ff 75%, #f8fafc 100%),
          radial-gradient(ellipse at top, #bfdbfe 0%, transparent 70%),
          radial-gradient(ellipse at bottom, #c7d2fe 0%, transparent 70%)
        `;
      default:
        return `
          radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          linear-gradient(135deg, #0f0f23 0%, #1a0b3d 25%, #2563eb 50%, #7c3aed 75%, #0f0f23 100%),
          radial-gradient(ellipse at top, #1e1b4b 0%, transparent 70%),
          radial-gradient(ellipse at bottom, #312e81 0%, transparent 70%)
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
        return "border-white/10";
      case "light":
        return "border-gray-200/30";
      default:
        return "border-white/10";
    }
  };

  return (
    <div
      ref={sectionRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: getBackground(),
      }}
    >
      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
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
              className={`w-2 h-2 rounded-full opacity-60 ${
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
          style={{ animationDuration: "6s" }}
        ></div>
        <div
          className={`absolute top-40 right-20 w-24 h-24 rounded-lg blur-xl animate-spin ${
            theme === "dark"
              ? "bg-gradient-to-br from-pink-500/10 to-red-500/10"
              : theme === "light"
              ? "bg-gradient-to-br from-pink-200/30 to-red-200/30"
              : "bg-gradient-to-br from-pink-500/10 to-red-500/10"
          }`}
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className={`absolute bottom-40 left-1/4 w-40 h-40 rounded-full blur-xl animate-pulse ${
            theme === "dark"
              ? "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10"
              : theme === "light"
              ? "bg-gradient-to-br from-emerald-200/30 to-cyan-200/30"
              : "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10"
          }`}
          style={{ animationDuration: "8s" }}
        ></div>
      </div>

      <section className="relative z-10 py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Hero Section with 3D Effect */}
          <div className="text-center mb-16 md:mb-24 relative">
            <div
              className={`absolute inset-0 blur-3xl ${
                theme === "dark"
                  ? "bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  : theme === "light"
                  ? "bg-gradient-to-r from-transparent via-black/5 to-transparent"
                  : "bg-gradient-to-r from-transparent via-white/5 to-transparent"
              }`}
            ></div>

            <div className="relative">
              <div
                className={`inline-flex items-center gap-3 backdrop-blur-xl border rounded-full px-4 md:px-8 py-1 md:py-3 mb-4 md:mb-8 hover:scale-105 transition-all duration-500 shadow-lg ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border-white/20 shadow-blue-500/25"
                    : theme === "light"
                    ? "bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20 border-gray-200/30 shadow-blue-400/25"
                    : "bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border-white/20 shadow-blue-500/25"
                }`}
              >
                <FaRocket
                  className={`text-cyan-400 animate-bounce`}
                  size={16}
                />
                <span
                  className={`text-xs md:text-base font-semibold ${
                    theme === "dark"
                      ? "text-white"
                      : theme === "light"
                      ? "text-gray-800"
                      : "text-white"
                  }`}
                >
                  Guide Étudiant Révolutionnaire
                </span>
                <FaInfinity
                  className={`text-purple-400 animate-spin`}
                  size={14}
                  style={{ animationDuration: "3s" }}
                />
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-8xl font-black mb-4 md:mb-8 leading-none">
                <span
                  className={`block bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl transform hover:scale-105 transition-transform duration-700 ${
                    theme === "light" ? "text-shadow-sm" : ""
                  }`}
                >
                  EXCELLENCE
                </span>
                <span
                  className={`block bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent drop-shadow-2xl transform hover:scale-105 transition-transform duration-700 ${
                    theme === "light" ? "text-shadow-sm" : ""
                  }`}
                >
                  ACADÉMIQUE
                </span>
                <span
                  className={`block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl transform hover:scale-105 transition-transform duration-700 ${
                    theme === "light" ? "text-shadow-sm" : ""
                  }`}
                >
                  GARANTIE
                </span>
              </h1>

              <div className="max-w-4xl mx-auto mb-6 md:mb-12">
                <p
                  className={`text-sm md:text-2xl leading-relaxed font-light ${
                    theme === "dark"
                      ? "text-gray-200"
                      : theme === "light"
                      ? "text-gray-700"
                      : "text-gray-200"
                  }`}
                >
                  🌟 Rejoignez la{" "}
                  <span
                    className={`font-bold ${
                      theme === "dark"
                        ? "text-cyan-400"
                        : theme === "light"
                        ? "text-blue-600"
                        : "text-cyan-400"
                    }`}
                  >
                    révolution éducative
                  </span>{" "}
                  qui transforme des milliers d'étudiants en{" "}
                  <span
                    className={`font-bold ${
                      theme === "dark"
                        ? "text-purple-400"
                        : theme === "light"
                        ? "text-purple-600"
                        : "text-purple-400"
                    }`}
                  >
                    leaders de demain
                  </span>{" "}
                  🚀
                </p>
              </div>

              {/* Animated Stats */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-6 lg:gap-12 mb-6 md:mb-12">
                {[
                  { number: "10K+", label: "Étudiants", icon: "👨‍🎓" },
                  { number: "98%", label: "Réussite", icon: "🏆" },
                  { number: "24/7", label: "Support", icon: "💬" },
                  { number: "50+", label: "Pays", icon: "🌍" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="text-center group cursor-pointer px-1"
                  >
                    <div className="text-2xl md:text-4xl mb-1 md:mb-2 group-hover:scale-125 transition-transform duration-300">
                      {stat.icon}
                    </div>
                    <div
                      className={`text-xl md:text-3xl font-bold ${
                        theme === "dark"
                          ? "text-white"
                          : theme === "light"
                          ? "text-gray-900"
                          : "text-white"
                      } group-hover:text-cyan-400 transition-colors duration-300`}
                    >
                      {stat.number}
                    </div>
                    <div
                      className={`text-xs md:text-sm ${
                        theme === "dark"
                          ? "text-gray-400"
                          : theme === "light"
                          ? "text-gray-600"
                          : "text-gray-400"
                      }`}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revolutionary Cards Section */}
          <div className="mb-16 md:mb-24">
            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
              {cards.map((card, index) => (
                <div
                  key={index}
                  className="group relative"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {/* Glow Effect */}
                  <div
                    className={`absolute -inset-1 bg-gradient-to-r ${card.gradient} rounded-3xl blur-xl opacity-25 group-hover:opacity-75 transition-all duration-1000 ${card.shadowColor} group-hover:shadow-2xl`}
                  ></div>

                  {/* Main Card */}
                  <div
                    className={`relative ${getCardBg()} backdrop-blur-2xl border ${getCardBorder()} rounded-3xl p-6 md:p-8 h-full group-hover:scale-105 group-hover:-translate-y-4 transition-all duration-700 overflow-hidden`}
                  >
                    {/* Background Pattern */}
                    <div
                      className={`absolute top-4 right-4 text-4xl md:text-6xl opacity-5 group-hover:opacity-10 transition-opacity duration-500 ${
                        theme === "light" ? "text-gray-900/10" : "text-white/10"
                      }`}
                    >
                      {card.bgPattern}
                    </div>

                    {/* Animated Border */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${card.gradient} rounded-3xl opacity-0 group-hover:opacity-20 transition-all duration-500`}
                    ></div>

                    <div className="relative z-10">
                      {/* Icon with Halo Effect */}
                      <div className="relative mb-4 md:mb-6">
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${card.gradient} rounded-2xl blur-lg opacity-50 group-hover:blur-xl group-hover:opacity-75 transition-all duration-500`}
                        ></div>
                        <div
                          className={`relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${card.gradient} rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl`}
                        >
                          <div className="text-white group-hover:scale-110 transition-transform duration-300">
                            {card.icon}
                          </div>
                        </div>
                      </div>

                      <h3
                        className={`text-xl md:text-2xl font-bold mb-3 md:mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-500 ${
                          theme === "dark"
                            ? "text-white"
                            : theme === "light"
                            ? "text-gray-900"
                            : "text-white"
                        }`}
                      >
                        {card.title}
                      </h3>

                      <p
                        className={`text-sm md:text-base mb-4 md:mb-6 leading-relaxed group-hover:text-white transition-colors duration-300 ${
                          theme === "dark"
                            ? "text-gray-300"
                            : theme === "light"
                            ? "text-gray-600"
                            : "text-gray-300"
                        }`}
                      >
                        {card.desc}
                      </p>

                      <div className="flex items-center justify-between">
                        <div
                          className={`px-3 py-1 md:px-4 md:py-2 bg-gradient-to-r ${card.gradient} rounded-full text-white text-xs md:text-sm font-bold shadow-lg`}
                        >
                          {card.stats}
                        </div>
                        <FaArrowRight
                          className={`group-hover:text-cyan-400 group-hover:translate-x-2 group-hover:scale-125 transition-all duration-300 ${
                            theme === "dark"
                              ? "text-gray-500"
                              : theme === "light"
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                          size={18}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Spectacular Carousel */}
            <div className="md:hidden">
              <div className="relative overflow-hidden rounded-3xl">
                <div
                  className="flex transition-all duration-1000 ease-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {cards.map((card, index) => (
                    <div
                      key={index}
                      className="w-full flex-shrink-0 relative p-2"
                    >
                      <div
                        className={`absolute -inset-1 bg-gradient-to-r ${card.gradient} rounded-3xl blur-xl opacity-50 ${card.shadowColor} shadow-2xl`}
                      ></div>

                      <div
                        className={`relative ${getCardBg()} backdrop-blur-2xl border ${getCardBorder()} rounded-3xl p-4 text-center overflow-hidden`}
                      >
                        <div
                          className={`absolute top-4 right-4 text-4xl opacity-10 ${
                            theme === "light"
                              ? "text-gray-900/10"
                              : "text-white/10"
                          }`}
                        >
                          {card.bgPattern}
                        </div>

                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10 rounded-3xl`}
                        ></div>

                        <div className="relative z-10">
                          <div
                            className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${card.gradient} rounded-3xl mb-4 shadow-2xl`}
                          >
                            <div className="text-white">{card.icon}</div>
                          </div>

                          <h3
                            className={`text-xl font-bold mb-3 ${
                              theme === "dark"
                                ? "text-white"
                                : theme === "light"
                                ? "text-gray-900"
                                : "text-white"
                            }`}
                          >
                            {card.title}
                          </h3>

                          <p
                            className={`text-sm mb-4 leading-relaxed ${
                              theme === "dark"
                                ? "text-gray-200"
                                : theme === "light"
                                ? "text-gray-700"
                                : "text-gray-200"
                            }`}
                          >
                            {card.desc}
                          </p>

                          <div
                            className={`inline-block px-4 py-2 bg-gradient-to-r ${card.gradient} rounded-full text-white font-bold text-sm shadow-2xl`}
                          >
                            {card.stats}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Dots */}
              <div className="flex justify-center mt-4 gap-2">
                {cards.map((card, index) => (
                  <button
                    key={index}
                    className={`relative transition-all duration-500 ${
                      currentIndex === index
                        ? "scale-125"
                        : "scale-100 hover:scale-110"
                    }`}
                    onClick={() => goToCard(index)}
                  >
                    <div
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        currentIndex === index
                          ? `bg-gradient-to-r ${card.gradient} shadow-lg ${card.shadowColor}`
                          : theme === "dark"
                          ? "bg-white/20 hover:bg-white/40"
                          : "bg-gray-900/20 hover:bg-gray-900/40"
                      }`}
                    ></div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AboutContent theme={theme} />
        </div>
      </section>
    </div>
  );
};

export const AboutContent = ({ theme }) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.3 }
    );

    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  const getCardBg = () => {
    switch (theme) {
      case "dark":
        return "bg-black/30";
      case "light":
        return "bg-white/90";
      default:
        return "bg-black/30";
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
    <section ref={contentRef} className="relative">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-20 items-center">
        {/* Left Side - Revolutionary Media */}
        <div
          className={`w-full lg:w-1/2 relative transition-all duration-1000 ${
            isInView ? "translate-x-0 opacity-100" : "-translate-x-20 opacity-0"
          }`}
        >
          <div className="group">
            {/* Glow Effect */}
            <div
              className={`absolute -inset-2 md:-inset-4 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-700 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20"
                  : theme === "light"
                  ? "bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20"
                  : "bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20"
              }`}
            ></div>

            {/* Main Container */}
            <div
              className={`relative ${getCardBg()} backdrop-blur-2xl border ${getCardBorder()} rounded-3xl p-4 md:p-8 group-hover:scale-105 transition-all duration-700 shadow-xl ${
                theme === "dark"
                  ? "shadow-purple-500/25"
                  : theme === "light"
                  ? "shadow-purple-400/25"
                  : "shadow-purple-500/25"
              }`}
            >
              <div
                className={`aspect-video rounded-2xl flex items-center justify-center relative overflow-hidden ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900"
                    : theme === "light"
                    ? "bg-gradient-to-br from-gray-100 via-blue-100 to-purple-100"
                    : "bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900"
                }`}
              >
                {!isVideoPlaying ? (
                  <>
                    {/* Video Thumbnail with Effects */}
                    <div className="absolute inset-0">
                      <div
                        className={`absolute inset-0 ${
                          theme === "dark"
                            ? "bg-gradient-to-br from-cyan-600/40 via-purple-600/40 to-pink-600/40"
                            : theme === "light"
                            ? "bg-gradient-to-br from-cyan-400/40 via-purple-400/40 to-pink-400/40"
                            : "bg-gradient-to-br from-cyan-600/40 via-purple-600/40 to-pink-600/40"
                        }`}
                      ></div>
                      <div
                        className={`absolute inset-0 ${
                          theme === "dark"
                            ? "bg-black/30"
                            : theme === "light"
                            ? "bg-white/30"
                            : "bg-black/30"
                        }`}
                      ></div>

                      {/* Animated Elements */}
                      <div
                        className={`absolute top-4 left-4 w-8 h-8 rounded-full animate-ping ${
                          theme === "dark"
                            ? "bg-cyan-400/20"
                            : theme === "light"
                            ? "bg-cyan-500/20"
                            : "bg-cyan-400/20"
                        }`}
                      ></div>
                      <div
                        className={`absolute bottom-4 right-4 w-6 h-6 rounded-full animate-pulse ${
                          theme === "dark"
                            ? "bg-purple-400/20"
                            : theme === "light"
                            ? "bg-purple-500/20"
                            : "bg-purple-400/20"
                        }`}
                      ></div>
                      <div
                        className={`absolute top-1/2 left-8 w-4 h-4 rounded-full animate-bounce ${
                          theme === "dark"
                            ? "bg-pink-400/20"
                            : theme === "light"
                            ? "bg-pink-500/20"
                            : "bg-pink-400/20"
                        }`}
                      ></div>
                    </div>

                    <button
                      onClick={() => setIsVideoPlaying(true)}
                      className={`relative z-10 group/play ${
                        theme === "dark"
                          ? "bg-white/10 backdrop-blur-xl border-2 border-white/30"
                          : theme === "light"
                          ? "bg-black/10 backdrop-blur-xl border-2 border-gray-300/30"
                          : "bg-white/10 backdrop-blur-xl border-2 border-white/30"
                      } rounded-full p-4 md:p-8 hover:scale-125 hover:rotate-6 transition-all duration-500 hover:bg-white/20 shadow-2xl hover:shadow-cyan-500/50`}
                    >
                      <FaPlay
                        className={`text-xl md:text-4xl ml-1 group-hover/play:text-cyan-400 transition-colors duration-300 ${
                          theme === "dark"
                            ? "text-white"
                            : theme === "light"
                            ? "text-gray-900"
                            : "text-white"
                        }`}
                      />
                      <div
                        className={`absolute inset-0 rounded-full animate-pulse ${
                          theme === "dark"
                            ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20"
                            : theme === "light"
                            ? "bg-gradient-to-r from-cyan-400/20 to-purple-400/20"
                            : "bg-gradient-to-r from-cyan-500/20 to-purple-500/20"
                        }`}
                      ></div>
                    </button>

                    {/* Play Button Pulse Effect */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className={`w-16 h-16 border-2 rounded-full animate-ping ${
                          theme === "dark"
                            ? "border-cyan-400/30"
                            : theme === "light"
                            ? "border-cyan-500/30"
                            : "border-cyan-400/30"
                        }`}
                      ></div>
                      <div
                        className={`absolute w-20 h-20 border rounded-full animate-pulse ${
                          theme === "dark"
                            ? "border-purple-400/20"
                            : theme === "light"
                            ? "border-purple-500/20"
                            : "border-purple-400/20"
                        }`}
                      ></div>
                    </div>
                  </>
                ) : (
                  <div
                    className={`w-full h-full flex items-center justify-center ${
                      theme === "dark"
                        ? "bg-gradient-to-br from-gray-800 to-black"
                        : theme === "light"
                        ? "bg-gradient-to-br from-gray-100 to-white"
                        : "bg-gradient-to-br from-gray-800 to-black"
                    }`}
                  >
                    <div className="text-center">
                      <FaMagic
                        className={`text-4xl md:text-6xl mb-3 animate-bounce mx-auto ${
                          theme === "dark"
                            ? "text-cyan-400"
                            : theme === "light"
                            ? "text-blue-600"
                            : "text-cyan-400"
                        }`}
                      />
                      <span
                        className={`text-lg md:text-2xl font-bold ${
                          theme === "dark"
                            ? "text-white"
                            : theme === "light"
                            ? "text-gray-900"
                            : "text-white"
                        }`}
                      >
                        Transformation en cours...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Stats Cards */}
            <div
              className={`absolute -bottom-4 -right-4 md:-bottom-12 md:-right-12 backdrop-blur-xl border rounded-xl p-3 md:p-6 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 shadow-xl ${
                theme === "dark"
                  ? "bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-white/20 shadow-emerald-500/25"
                  : theme === "light"
                  ? "bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border-gray-200/30 shadow-emerald-400/25"
                  : "bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-white/20 shadow-emerald-500/25"
              }`}
            >
              <div className="flex items-center gap-2 md:gap-4">
                <div
                  className={`w-10 h-10 md:w-16 md:h-16 ${
                    theme === "dark"
                      ? "bg-gradient-to-br from-emerald-400 to-cyan-500"
                      : theme === "light"
                      ? "bg-gradient-to-br from-emerald-500 to-cyan-600"
                      : "bg-gradient-to-br from-emerald-400 to-cyan-500"
                  } rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg`}
                >
                  <FaUserFriends className="text-white text-sm md:text-2xl" />
                </div>
                <div>
                  <div
                    className={`text-lg md:text-3xl font-bold ${
                      theme === "dark"
                        ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                        : theme === "light"
                        ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                        : "bg-gradient-to-r from-emerald-400 to-cyan-400"
                    } bg-clip-text text-transparent`}
                  >
                    10,000+
                  </div>
                  <div
                    className={`text-xs md:text-sm font-semibold ${
                      theme === "dark"
                        ? "text-gray-300"
                        : theme === "light"
                        ? "text-gray-600"
                        : "text-gray-300"
                    }`}
                  >
                    Étudiants transformés
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`absolute -top-4 -left-4 md:-top-8 md:-left-8 backdrop-blur-xl border rounded-lg p-2 md:p-4 group-hover:scale-110 group-hover:translate-y-2 transition-all duration-500 shadow-xl ${
                theme === "dark"
                  ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-white/20 shadow-purple-500/25"
                  : theme === "light"
                  ? "bg-gradient-to-br from-purple-400/20 to-pink-400/20 border-gray-200/30 shadow-purple-400/25"
                  : "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-white/20 shadow-purple-500/25"
              }`}
            >
              <div className="flex items-center gap-1 md:gap-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      size={10}
                      className="animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
                <span
                  className={`text-xs md:text-base font-bold ${
                    theme === "dark"
                      ? "text-white"
                      : theme === "light"
                      ? "text-gray-900"
                      : "text-white"
                  }`}
                >
                  4.9/5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Revolutionary Content */}
        <div
          className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${
            isInView ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0"
          }`}
        >
          <div className="space-y-4 md:space-y-10">
            <div>
              <div
                className={`inline-flex items-center gap-2 md:gap-3 backdrop-blur-xl border rounded-full px-3 py-1 md:px-6 md:py-3 mb-4 md:mb-8 hover:scale-105 transition-all duration-500 shadow-lg ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 border-white/20 shadow-emerald-500/25"
                    : theme === "light"
                    ? "bg-gradient-to-r from-emerald-400/20 via-cyan-400/20 to-blue-400/20 border-gray-200/30 shadow-emerald-400/25"
                    : "bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 border-white/20 shadow-emerald-500/25"
                }`}
              >
                <div
                  className={`w-2 h-2 md:w-3 md:h-3 rounded-full animate-pulse ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                      : theme === "light"
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                      : "bg-gradient-to-r from-emerald-400 to-cyan-400"
                  }`}
                ></div>
                <span
                  className={`text-xs md:text-base font-semibold ${
                    theme === "dark"
                      ? "text-white"
                      : theme === "light"
                      ? "text-gray-900"
                      : "text-white"
                  }`}
                >
                  Révolution Éducative
                </span>
                <FaRocket
                  className={`text-cyan-400 animate-bounce`}
                  size={12}
                />
              </div>

              <h2 className="text-2xl md:text-5xl lg:text-7xl font-black mb-4 md:mb-8 leading-tight">
                <span
                  className={`block bg-gradient-to-r from-emerald-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-xl hover:scale-105 transition-transform duration-500 ${
                    theme === "light" ? "text-shadow-sm" : ""
                  }`}
                >
                  TRANSFORMEZ
                </span>
                <span
                  className={`block bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent drop-shadow-xl hover:scale-105 transition-transform duration-500 ${
                    theme === "light" ? "text-shadow-sm" : ""
                  }`}
                >
                  VOTRE AVENIR
                </span>
              </h2>

              <p
                className={`text-sm md:text-xl leading-relaxed mb-4 md:mb-10 font-light ${
                  theme === "dark"
                    ? "text-gray-200"
                    : theme === "light"
                    ? "text-gray-700"
                    : "text-gray-200"
                }`}
              >
                🎯 Notre plateforme révolutionnaire utilise l'
                <span
                  className={`font-bold ${
                    theme === "dark"
                      ? "text-cyan-400"
                      : theme === "light"
                      ? "text-blue-600"
                      : "text-cyan-400"
                  }`}
                >
                  intelligence artificielle
                </span>{" "}
                et des{" "}
                <span
                  className={`font-bold ${
                    theme === "dark"
                      ? "text-purple-400"
                      : theme === "light"
                      ? "text-purple-600"
                      : "text-purple-400"
                  }`}
                >
                  méthodes d'apprentissage
                </span>{" "}
                de pointe pour garantir votre{" "}
                <span
                  className={`font-bold ${
                    theme === "dark"
                      ? "text-emerald-400"
                      : theme === "light"
                      ? "text-emerald-600"
                      : "text-emerald-400"
                  }`}
                >
                  succès académique absolu
                </span>{" "}
                ! ⚡
              </p>
            </div>

            {/* Revolutionary Features */}
            <div className="space-y-3 md:space-y-6">
              {[
                {
                  text: "🚀 Développez vos compétences avec l'IA et des experts mondiaux",
                  gradient: "from-cyan-400 to-blue-500",
                },
                {
                  text: "⚡ Accédez à 50k+ ressources interactives et exclusives",
                  gradient: "from-purple-400 to-pink-500",
                },
                {
                  text: "🎯 Bénéficiez d'un coaching personnalisé 24/7 par IA",
                  gradient: "from-emerald-400 to-cyan-500",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-3 md:gap-6 hover:scale-105 transition-all duration-500"
                >
                  <div
                    className={`w-5 h-5 md:w-8 md:h-8 bg-gradient-to-r ${feature.gradient} rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg`}
                  >
                    <AiOutlineCheck className="text-white text-xs md:text-lg font-bold" />
                  </div>
                  <span
                    className={`text-sm md:text-xl group-hover:text-white group-hover:font-semibold transition-all duration-300 ${
                      theme === "dark"
                        ? "text-gray-200"
                        : theme === "light"
                        ? "text-gray-700"
                        : "text-gray-200"
                    }`}
                  >
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Revolutionary CTA */}
            <div className="pt-4 md:pt-8">
              <button
                className={`group relative text-white px-6 py-3 md:px-12 md:py-6 rounded-lg md:rounded-2xl font-bold text-sm md:text-xl hover:scale-110 hover:-translate-y-2 transition-all duration-500 shadow-lg md:shadow-2xl overflow-hidden ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:shadow-cyan-500/50"
                    : theme === "light"
                    ? "bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:shadow-cyan-400/50"
                    : "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:shadow-cyan-500/50"
                }`}
              >
                <div
                  className={`absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-purple-600 via-pink-600 to-red-600"
                      : theme === "light"
                      ? "bg-gradient-to-r from-purple-700 via-pink-700 to-red-700"
                      : "bg-gradient-to-r from-purple-600 via-pink-600 to-red-600"
                  }`}
                ></div>
                <span className="relative flex items-center gap-2 md:gap-4">
                  <FaRocket className="text-sm md:text-2xl group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-xs md:text-base">
                    COMMENCER LA TRANSFORMATION
                  </span>
                  <FaArrowRight className="group-hover:translate-x-2 group-hover:scale-125 transition-all duration-300" />
                </span>

                {/* Button Glow Effect */}
                <div
                  className={`absolute -inset-1 rounded-lg md:rounded-2xl blur-md md:blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500 -z-10 ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                      : theme === "light"
                      ? "bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600"
                      : "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                  }`}
                ></div>
              </button>
            </div>

            {/* Enhanced Trust Indicators */}
            <div className="pt-6 md:pt-10 grid grid-cols-3 gap-2 md:gap-6">
              {[
                { icon: "🏆", label: "100% Garanti", desc: "Ou remboursé" },
                {
                  icon: "🔒",
                  label: "Ultra Sécurisé",
                  desc: "Données protégées",
                },
                {
                  icon: "🌟",
                  label: "Support VIP",
                  desc: "Assistance premium",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="text-center group hover:scale-110 transition-transform duration-300"
                >
                  <div className="text-xl md:text-4xl mb-1 md:mb-2 group-hover:scale-125 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <div
                    className={`text-xs md:text-lg font-bold group-hover:text-cyan-400 transition-colors duration-300 ${
                      theme === "dark"
                        ? "text-white"
                        : theme === "light"
                        ? "text-gray-900"
                        : "text-white"
                    }`}
                  >
                    {item.label}
                  </div>
                  <div
                    className={`text-xs ${
                      theme === "dark"
                        ? "text-gray-400"
                        : theme === "light"
                        ? "text-gray-600"
                        : "text-gray-400"
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
