import React, { useState, useEffect, useRef } from "react";
import heroImg from "../components/assets/images/heronew.png";
import { About } from "./About";
import { Courses } from "./Courses";
import { Instructor } from "./Instructor";
import { Blog } from "./Blog";
import FunctionalitiesSection from "./FunctionalitiesSection";
import "../CSS/animations.css";

const AnimatedText = ({ texts, theme }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isWriting, setIsWriting] = useState(true);

  useEffect(() => {
    const currentFullText = texts[currentTextIndex];
    let timer;

    if (isWriting) {
      if (displayText.length < currentFullText.length) {
        timer = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, 150);
      } else {
        setIsWriting(false);
        timer = setTimeout(() => {
          setIsWriting(false);
        }, 2000);
      }
    } else {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 75);
      } else {
        setIsWriting(true);
        setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
      }
    }
    return () => clearTimeout(timer);
  }, [displayText, isWriting, currentTextIndex, texts]);

  const getTextGradient = () => {
    switch (theme) {
      case "dark":
        return "from-cyan-300 via-blue-400 to-purple-400";
      case "light":
        return "from-blue-600 via-purple-600 to-pink-600";
      default:
        return "from-cyan-300 via-blue-400 to-purple-400";
    }
  };

  return (
    <h1
      className={`text-4xl md:text-5xl lg:text-6xl font-bold min-h-[80px] md:min-h-[100px] lg:min-h-[120px] leading-tight bg-gradient-to-r ${getTextGradient()} bg-clip-text text-transparent drop-shadow-2xl transform hover:scale-105 transition-transform duration-700`}
    >
      {displayText}
      <span className="animate-blink text-cyan-400">|</span>
    </h1>
  );
};

export const HomeContent = ({ theme }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const texts = [
    "La réussite scolaire commence par une bonne communication",
    "Simplifier les échanges pour la réussite de vos enfants",
    "Un lien direct pour mieux accompagner vos enfants",
  ];

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
        radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
        linear-gradient(135deg, #0a0a18 0%, #12092b 25%, #1e3a8a 50%, #5b21b6 75%, #0a0a18 100%),
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

  const getBadgeGradient = () => {
    switch (theme) {
      case "dark":
        return "from-cyan-500/20 via-blue-500/20 to-purple-500/20";
      case "light":
        return "from-cyan-400/20 via-blue-400/20 to-purple-400/20";
      default:
        return "from-cyan-500/20 via-blue-500/20 to-purple-500/20";
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
    <section
      ref={sectionRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: getBackground(),
      }}
    >
      {/* Animated Particles */}
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
        <div
          className={`absolute top-1/3 right-1/3 w-28 h-28 rounded-full blur-xl animate-pulse ${
            theme === "dark"
              ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10"
              : theme === "light"
              ? "bg-gradient-to-br from-purple-200/30 to-pink-200/30"
              : "bg-gradient-to-br from-purple-500/10 to-pink-500/10"
          }`}
          style={{ animationDuration: "7s" }}
        ></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
        <div className="flex flex-col items-center space-y-12 md:space-y-16">
          {/* Enhanced Text Content */}
          <div
            className={`w-full text-center max-w-6xl mx-auto transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            {/* Magical Badge */}
            <div
              className={`inline-flex items-center gap-3 backdrop-blur-xl border rounded-full px-8 py-3 mb-8 hover:scale-105 transition-all duration-500 shadow-2xl ${
                theme === "dark"
                  ? `bg-gradient-to-r ${getBadgeGradient()} border-white/20 shadow-blue-500/25`
                  : theme === "light"
                  ? `bg-gradient-to-r ${getBadgeGradient()} border-gray-300/20 shadow-blue-400/25`
                  : `bg-gradient-to-r ${getBadgeGradient()} border-white/20 shadow-blue-500/25`
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full animate-pulse ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-cyan-400 to-purple-400"
                    : theme === "light"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500"
                    : "bg-gradient-to-r from-cyan-400 to-purple-400"
                }`}
              ></div>
              <span
                className={`font-semibold text-lg ${
                  theme === "dark"
                    ? "text-white"
                    : theme === "light"
                    ? "text-gray-800"
                    : "text-white"
                }`}
              >
                🌟 Plateforme Éducative Révolutionnaire
              </span>
              <div
                className={`w-3 h-3 rounded-full animate-pulse ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-purple-400 to-pink-400"
                    : theme === "light"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : "bg-gradient-to-r from-purple-400 to-pink-400"
                }`}
              ></div>
            </div>

            <AnimatedText texts={texts} theme={theme} />

            <p
              className={`text-xl md:text-2xl mt-8 leading-relaxed font-light max-w-4xl mx-auto ${
                theme === "dark"
                  ? "text-gray-200"
                  : theme === "light"
                  ? "text-gray-700"
                  : "text-gray-200"
              }`}
            >
              ✨ Facilitez la communication pour un meilleur accompagnement
              éducatif ⚡
            </p>

            {/* Animated Stats */}
            <div className="flex justify-center gap-8 md:gap-12 mt-12">
              {[
                { number: "98%", label: "Réussite", icon: "🏆" },
                { number: "10K+", label: "Familles", icon: "👨‍👩‍👧‍👦" },
                { number: "24/7", label: "Support", icon: "💬" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="text-center group cursor-pointer transform hover:scale-110 transition-all duration-300"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <div className="text-3xl mb-2 group-hover:scale-125 transition-transform duration-300">
                    {stat.icon}
                  </div>
                  <div
                    className={`text-2xl md:text-3xl font-bold bg-clip-text text-transparent group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-gradient-to-r from-cyan-400 to-purple-400"
                        : theme === "light"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500"
                        : "bg-gradient-to-r from-cyan-400 to-purple-400"
                    }`}
                  >
                    {stat.number}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      theme === "dark"
                        ? "text-gray-300"
                        : theme === "light"
                        ? "text-gray-600"
                        : "text-gray-300"
                    }`}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Image Content */}
          <div
            className={`relative w-full flex justify-center transform transition-all duration-1000 delay-300 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="relative w-full max-w-2xl group">
              {/* Multiple Glow Effects */}
              <div
                className={`absolute -inset-8 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700 animate-pulse ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20"
                    : theme === "light"
                    ? "bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20"
                    : "bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20"
                }`}
              ></div>
              <div
                className={`absolute -inset-4 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-700 ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-emerald-500/15"
                    : theme === "light"
                    ? "bg-gradient-to-r from-blue-400/15 via-purple-400/15 to-emerald-400/15"
                    : "bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-emerald-500/15"
                }`}
              ></div>

              {/* Main Container */}
              <div
                className={`relative z-20 backdrop-blur-2xl border rounded-3xl shadow-2xl p-8 group-hover:scale-105 group-hover:-translate-y-4 transition-all duration-700 ${
                  theme === "dark"
                    ? "bg-black/20 border-white/20 shadow-cyan-500/25"
                    : theme === "light"
                    ? "bg-white/90 border-gray-200/30 shadow-cyan-400/25"
                    : "bg-black/20 border-white/20 shadow-cyan-500/25"
                }`}
              >
                {/* Background Pattern */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br rounded-3xl ${
                    theme === "dark"
                      ? "from-white/5 to-transparent"
                      : theme === "light"
                      ? "from-black/5 to-transparent"
                      : "from-white/5 to-transparent"
                  }`}
                ></div>

                {/* Floating Elements Around Image */}
                <div
                  className={`absolute -top-4 -left-4 w-8 h-8 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-bounce ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500"
                      : theme === "light"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600"
                      : "bg-gradient-to-r from-cyan-400 to-blue-500"
                  }`}
                ></div>
                <div
                  className={`absolute -top-2 -right-6 w-6 h-6 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-purple-400 to-pink-500"
                      : theme === "light"
                      ? "bg-gradient-to-r from-purple-500 to-pink-600"
                      : "bg-gradient-to-r from-purple-400 to-pink-500"
                  }`}
                ></div>
                <div
                  className={`absolute -bottom-6 -left-2 w-10 h-10 rounded-full opacity-15 group-hover:opacity-35 transition-opacity duration-500 animate-bounce ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-emerald-400 to-cyan-500"
                      : theme === "light"
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-600"
                      : "bg-gradient-to-r from-emerald-400 to-cyan-500"
                  }`}
                  style={{ animationDelay: "1s" }}
                ></div>
                <div
                  className={`absolute -bottom-4 -right-4 w-7 h-7 rounded-full opacity-25 group-hover:opacity-45 transition-opacity duration-500 animate-pulse ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-pink-400 to-red-500"
                      : theme === "light"
                      ? "bg-gradient-to-r from-pink-500 to-red-600"
                      : "bg-gradient-to-r from-pink-400 to-red-500"
                  }`}
                  style={{ animationDelay: "0.5s" }}
                ></div>

                {/* Image with Enhanced Effects */}
                <div className="relative">
                  <img
                    src={heroImg}
                    alt="Hero"
                    className="w-full max-w-lg mx-auto object-contain smooth-float filter group-hover:brightness-110 transition-all duration-500"
                  />

                  {/* Image Overlay Effects */}
                  <div
                    className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      theme === "dark"
                        ? "bg-gradient-to-t from-purple-600/10 via-transparent to-cyan-600/10"
                        : theme === "light"
                        ? "bg-gradient-to-t from-purple-400/10 via-transparent to-cyan-400/10"
                        : "bg-gradient-to-t from-purple-600/10 via-transparent to-cyan-600/10"
                    }`}
                  ></div>
                </div>
              </div>

              {/* Floating Achievement Badges */}
              <div
                className={`absolute -bottom-8 -left-8 backdrop-blur-xl border rounded-2xl p-4 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 shadow-xl ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-white/20 shadow-emerald-500/25"
                    : theme === "light"
                    ? "bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border-gray-200/30 shadow-emerald-400/25"
                    : "bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-white/20 shadow-emerald-500/25"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                      theme === "dark"
                        ? "bg-gradient-to-br from-emerald-400 to-cyan-500"
                        : theme === "light"
                        ? "bg-gradient-to-br from-emerald-500 to-cyan-600"
                        : "bg-gradient-to-br from-emerald-400 to-cyan-500"
                    }`}
                  >
                    <span className="text-white text-xl">🚀</span>
                  </div>
                  <div>
                    <div
                      className={`font-bold text-lg bg-clip-text text-transparent ${
                        theme === "dark"
                          ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                          : theme === "light"
                          ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                          : "bg-gradient-to-r from-emerald-400 to-cyan-400"
                      }`}
                    >
                      Innovation
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        theme === "dark"
                          ? "text-gray-300"
                          : theme === "light"
                          ? "text-gray-600"
                          : "text-gray-300"
                      }`}
                    >
                      Technologique
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`absolute -top-8 -right-8 backdrop-blur-xl border rounded-2xl p-4 group-hover:scale-110 group-hover:translate-y-2 transition-all duration-500 shadow-xl ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-white/20 shadow-purple-500/25"
                    : theme === "light"
                    ? "bg-gradient-to-br from-purple-400/20 to-pink-400/20 border-gray-200/30 shadow-purple-400/25"
                    : "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-white/20 shadow-purple-500/25"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                      theme === "dark"
                        ? "bg-gradient-to-br from-purple-400 to-pink-500"
                        : theme === "light"
                        ? "bg-gradient-to-br from-purple-500 to-pink-600"
                        : "bg-gradient-to-br from-purple-400 to-pink-500"
                    }`}
                  >
                    <span className="text-white text-xl">⭐</span>
                  </div>
                  <div>
                    <div
                      className={`font-bold text-lg bg-clip-text text-transparent ${
                        theme === "dark"
                          ? "bg-gradient-to-r from-purple-400 to-pink-400"
                          : theme === "light"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500"
                          : "bg-gradient-to-r from-purple-400 to-pink-400"
                      }`}
                    >
                      Excellence
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        theme === "dark"
                          ? "text-gray-300"
                          : theme === "light"
                          ? "text-gray-600"
                          : "text-gray-300"
                      }`}
                    >
                      Garantie
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call-to-Action Button */}
          <div
            className={`transform transition-all duration-1000 delay-500 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <button
              className={`group relative text-white px-10 py-4 rounded-2xl font-bold text-lg hover:scale-110 hover:-translate-y-2 transition-all duration-500 shadow-2xl overflow-hidden ${
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
              <span className="relative flex items-center gap-3">
                🌟 Découvrir la plateforme
                <span className="group-hover:translate-x-2 group-hover:scale-125 transition-all duration-300">
                  →
                </span>
              </span>
              <div
                className={`absolute -inset-1 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500 -z-10 ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                    : theme === "light"
                    ? "bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600"
                    : "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* Additional Floating Elements */}
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
    </section>
  );
};

export const Home = ({ theme }) => {
  return (
    <>
      <div className={theme === "dark" ? "bg-gray-900" : "bg-white"}>
        <HomeContent theme={theme} />
        <FunctionalitiesSection theme={theme} />
        <About theme={theme} />
        <Courses theme={theme} />
        <Instructor theme={theme} />
        <Blog theme={theme} />
      </div>
    </>
  );
};

export default Home;
