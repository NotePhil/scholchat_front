import React, { useState, useEffect, useRef } from "react";
import { courses } from "../components/assets/data/dummydata";
import {
  FaBook,
  FaUsers,
  FaGraduationCap,
  FaComments,
  FaMobile,
  FaBell,
} from "react-icons/fa";
import { AiFillStar } from "react-icons/ai";
import { NavLink } from "react-router-dom";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";

// Enhanced course data for SchoolChat theme
const schoolChatCourses = [
  {
    id: 1,
    title: "Communication Parents-École Moderne",
    description:
      "Maîtrisez les outils de communication numérique pour un suivi optimal",
    cover:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop",
    category: "Communication",
    subcategory: "Digital",
    lessons: 12,
    rating: 4.8,
    reviews: 156,
    instructor: "Marie Dubois",
    price: "Gratuit",
    duration: "3 semaines",
    level: "Débutant",
    icon: <FaComments />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    title: "Suivi Scolaire Numérique",
    description: "Optimisez le suivi des résultats et progrès de vos enfants",
    cover:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop",
    category: "Suivi",
    subcategory: "Éducatif",
    lessons: 15,
    rating: 4.9,
    reviews: 203,
    instructor: "Pierre Martin",
    price: "29€",
    duration: "4 semaines",
    level: "Intermédiaire",
    icon: <FaGraduationCap />,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 3,
    title: "Gestion des Notifications Intelligentes",
    description: "Restez informé sans être submergé par les alertes",
    cover:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
    category: "Gestion",
    subcategory: "Productivité",
    lessons: 8,
    rating: 4.7,
    reviews: 89,
    instructor: "Sophie Laurent",
    price: "Gratuit",
    duration: "2 semaines",
    level: "Tous niveaux",
    icon: <FaBell />,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: 4,
    title: "Application Mobile SchoolChat",
    description: "Maîtrisez toutes les fonctionnalités de l'app mobile",
    cover:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop",
    category: "Mobile",
    subcategory: "Application",
    lessons: 10,
    rating: 4.6,
    reviews: 124,
    instructor: "Lucas Moreau",
    price: "19€",
    duration: "2 semaines",
    level: "Débutant",
    icon: <FaMobile />,
    color: "from-orange-500 to-red-500",
  },
  {
    id: 5,
    title: "Collaboration Parents-Enseignants",
    description: "Créez un environnement collaboratif pour la réussite",
    cover:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=250&fit=crop",
    category: "Collaboration",
    subcategory: "Pédagogie",
    lessons: 14,
    rating: 4.9,
    reviews: 187,
    instructor: "Anne Rousseau",
    price: "39€",
    duration: "5 semaines",
    level: "Avancé",
    icon: <FaUsers />,
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: 6,
    title: "Tableaux de Bord et Analyses",
    description: "Exploitez les données pour un meilleur accompagnement",
    cover:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
    category: "Analyse",
    subcategory: "Données",
    lessons: 11,
    rating: 4.8,
    reviews: 95,
    instructor: "Thomas Bernard",
    price: "49€",
    duration: "3 semaines",
    level: "Intermédiaire",
    icon: <FaBook />,
    color: "from-cyan-500 to-blue-500",
  },
];

const AnimatedCounter = ({ end, duration = 2000 }) => {
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

  return <span ref={ref}>{count}</span>;
};

export const Courses = ({ theme = "default" }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
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

  // Theme-based styles
  const getThemeStyles = () => {
    switch (theme) {
      case "dark":
        return {
          background: `
            radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, #0f0f23 0%, #1a0b3d 25%, #2563eb 50%, #7c3aed 75%, #0f0f23 100%),
            radial-gradient(ellipse at top, #1e1b4b 0%, transparent 70%),
            radial-gradient(ellipse at bottom, #312e81 0%, transparent 70%)
          `,
          textColor: "text-gray-200",
          cardBg: "bg-gray-800/80",
          cardBorder: "border-gray-700",
          cardHoverBorder: "border-gray-600",
          titleGradient: "from-cyan-300 via-blue-400 to-purple-400",
          badgeBg:
            "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20",
          badgeBorder: "border-white/20",
          badgeText: "text-white",
          statsText: "text-gray-300",
          ctaBg: "bg-black/40",
          ctaBorder: "border-white/20",
        };
      case "light":
        return {
          background: `
            radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
            linear-gradient(135deg, #f8fafc 0%, #f1f5f9 25%, #f8fafc 50%, #eef2ff 75%, #f8fafc 100%),
            radial-gradient(ellipse at top, #bfdbfe 0%, transparent 70%),
            radial-gradient(ellipse at bottom, #c7d2fe 0%, transparent 70%)
          `,
          textColor: "text-gray-800",
          cardBg: "bg-white/80",
          cardBorder: "border-gray-200",
          cardHoverBorder: "border-gray-300",
          titleGradient: "from-blue-500 via-purple-500 to-pink-500",
          badgeBg:
            "bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20",
          badgeBorder: "border-gray-300/20",
          badgeText: "text-gray-800",
          statsText: "text-gray-600",
          ctaBg: "bg-white/90",
          ctaBorder: "border-gray-200/30",
        };
      default:
        return {
          background: `
            radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, #0f0f23 0%, #1a0b3d 25%, #2563eb 50%, #7c3aed 75%, #0f0f23 100%),
            radial-gradient(ellipse at top, #1e1b4b 0%, transparent 70%),
            radial-gradient(ellipse at bottom, #312e81 0%, transparent 70%)
          `,
          textColor: "text-gray-200",
          cardBg: "bg-black/20",
          cardBorder: "border-white/20",
          cardHoverBorder: "border-white/40",
          titleGradient: "from-cyan-300 via-blue-400 to-purple-400",
          badgeBg:
            "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20",
          badgeBorder: "border-white/20",
          badgeText: "text-white",
          statsText: "text-gray-300",
          ctaBg: "bg-black/20",
          ctaBorder: "border-white/20",
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <section
      ref={sectionRef}
      className="min-h-screen relative overflow-hidden py-20"
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

      <div className="relative z-10 container mx-auto px-4 sm:px-5 md:px-6 lg:px-8">
        {/* Enhanced Header Section */}
        <div
          className={`text-center mb-20 transform transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* Magical Badge */}
          <div
            className={`inline-flex items-center gap-3 ${
              themeStyles.badgeBg
            } backdrop-blur-xl border ${
              themeStyles.badgeBorder
            } rounded-full px-8 py-3 mb-8 hover:scale-105 transition-all duration-500 shadow-2xl ${
              theme === "dark"
                ? "shadow-blue-500/25"
                : theme === "light"
                ? "shadow-blue-400/25"
                : "shadow-blue-500/25"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${
                theme === "dark"
                  ? "bg-gradient-to-r from-blue-400 to-purple-400"
                  : theme === "light"
                  ? "bg-gradient-to-r from-blue-500 to-purple-500"
                  : "bg-gradient-to-r from-blue-400 to-purple-400"
              }`}
            ></div>
            <span className={`${themeStyles.badgeText} font-semibold text-lg`}>
              📚 Formations SchoolChat
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

          <h1
            className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r ${themeStyles.titleGradient} bg-clip-text text-transparent drop-shadow-2xl`}
          >
            Découvrez Nos Formations
            <br />
            <span
              className={`bg-gradient-to-r ${
                theme === "dark"
                  ? "from-purple-400 via-pink-400 to-red-400"
                  : theme === "light"
                  ? "from-purple-500 via-pink-500 to-red-500"
                  : "from-purple-400 via-pink-400 to-red-400"
              } bg-clip-text text-transparent`}
            >
              SchoolChat Pro
            </span>
          </h1>

          <p
            className={`text-xl md:text-2xl ${themeStyles.textColor} mt-8 leading-relaxed font-light max-w-4xl mx-auto`}
          >
            🚀 Maîtrisez la communication éducative moderne et optimisez le
            suivi scolaire de vos enfants ✨
          </p>

          {/* Animated Stats */}
          <div className="flex justify-center gap-8 md:gap-12 mt-12">
            {[
              { number: 1500, suffix: "+", label: "Étudiants", icon: "👨‍🎓" },
              { number: 25, suffix: "+", label: "Cours", icon: "📖" },
              { number: 98, suffix: "%", label: "Satisfaction", icon: "⭐" },
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
                  className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${themeStyles.titleGradient} bg-clip-text text-transparent group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300`}
                >
                  <AnimatedCounter end={stat.number} />
                  {stat.suffix}
                </div>
                <div className={`${themeStyles.statsText} text-sm font-medium`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Courses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {schoolChatCourses.map((course, index) => (
            <div
              key={course.id}
              className={`group relative transform transition-all duration-700 hover:scale-105 hover:-translate-y-4 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onMouseEnter={() => setHoveredCard(course.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Multiple Glow Effects */}
              <div
                className={`absolute -inset-4 bg-gradient-to-r ${course.color} rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-all duration-500`}
              ></div>
              <div
                className={`absolute -inset-2 bg-gradient-to-r ${
                  theme === "dark"
                    ? "from-white/10 to-white/5"
                    : theme === "light"
                    ? "from-black/5 to-black/2"
                    : "from-white/10 to-white/5"
                } rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500`}
              ></div>

              {/* Main Card */}
              <div
                className={`relative z-20 ${themeStyles.cardBg} backdrop-blur-2xl border ${themeStyles.cardBorder} rounded-3xl shadow-2xl overflow-hidden group-hover:${themeStyles.cardHoverBorder} transition-all duration-500`}
              >
                {/* Background Pattern */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    theme === "dark"
                      ? "from-white/5 to-transparent"
                      : theme === "light"
                      ? "from-black/5 to-transparent"
                      : "from-white/5 to-transparent"
                  }`}
                ></div>

                {/* Image Section */}
                <div className="relative overflow-hidden h-48 rounded-t-3xl">
                  <img
                    src={course.cover}
                    alt={course.title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                  />

                  {/* Overlay Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${
                      theme === "dark"
                        ? "from-black/50 via-transparent to-transparent"
                        : theme === "light"
                        ? "from-white/30 via-transparent to-transparent"
                        : "from-black/50 via-transparent to-transparent"
                    }`}
                  ></div>

                  {/* Category Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span
                      className={`text-xs bg-gradient-to-r ${course.color} px-3 py-1.5 text-white rounded-full font-semibold shadow-lg backdrop-blur-sm`}
                    >
                      {course.category}
                    </span>
                    <span
                      className={`text-xs ${
                        theme === "dark"
                          ? "bg-white/20"
                          : theme === "light"
                          ? "bg-black/10"
                          : "bg-white/20"
                      } backdrop-blur-sm px-3 py-1.5 ${
                        theme === "dark"
                          ? "text-white"
                          : theme === "light"
                          ? "text-gray-800"
                          : "text-white"
                      } rounded-full font-semibold shadow-lg`}
                    >
                      {course.subcategory}
                    </span>
                  </div>

                  {/* Level Badge */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`text-xs ${
                        theme === "dark"
                          ? "bg-black/50 text-white"
                          : theme === "light"
                          ? "bg-white/80 text-gray-800"
                          : "bg-black/50 text-white"
                      } backdrop-blur-sm px-3 py-1.5 rounded-full font-semibold`}
                    >
                      {course.level}
                    </span>
                  </div>

                  {/* Floating Icon */}
                  <div
                    className={`absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r ${course.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <span className="text-white text-lg">{course.icon}</span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="relative p-4 sm:p-5 md:p-6">
                  {/* Course Stats */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex items-center ${
                          theme === "dark"
                            ? "text-gray-300"
                            : theme === "light"
                            ? "text-gray-600"
                            : "text-gray-300"
                        }`}
                      >
                        <FaBook className="text-cyan-400 mr-2" />
                        <span className="text-sm font-medium">
                          {course.lessons} leçons
                        </span>
                      </div>
                      <div
                        className={`flex items-center ${
                          theme === "dark"
                            ? "text-gray-300"
                            : theme === "light"
                            ? "text-gray-600"
                            : "text-gray-300"
                        }`}
                      >
                        <AiFillStar className="text-yellow-400 mr-1" />
                        <span className="text-sm font-medium">
                          {course.rating} ({course.reviews})
                        </span>
                      </div>
                    </div>
                    <div
                      className={`text-sm ${
                        theme === "dark"
                          ? "text-gray-300"
                          : theme === "light"
                          ? "text-gray-600"
                          : "text-gray-300"
                      } font-medium`}
                    >
                      {course.duration}
                    </div>
                  </div>

                  {/* Title and Description */}
                  <h3
                    className={`text-xl font-bold ${
                      theme === "dark"
                        ? "text-white"
                        : theme === "light"
                        ? "text-gray-900"
                        : "text-white"
                    } mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r ${
                      theme === "dark"
                        ? "group-hover:from-cyan-400 group-hover:to-purple-400"
                        : theme === "light"
                        ? "group-hover:from-blue-500 group-hover:to-purple-500"
                        : "group-hover:from-cyan-400 group-hover:to-purple-400"
                    } group-hover:bg-clip-text transition-all duration-300`}
                  >
                    {course.title}
                  </h3>

                  <p
                    className={`${
                      theme === "dark"
                        ? "text-gray-300"
                        : theme === "light"
                        ? "text-gray-600"
                        : "text-gray-300"
                    } text-sm leading-relaxed mb-4 line-clamp-2`}
                  >
                    {course.description}
                  </p>

                  {/* Instructor */}
                  <div className="flex items-center mb-6">
                    <div
                      className={`w-10 h-10 bg-gradient-to-r ${
                        theme === "dark"
                          ? "from-cyan-400 to-purple-500"
                          : theme === "light"
                          ? "from-cyan-500 to-purple-600"
                          : "from-cyan-400 to-purple-500"
                      } rounded-full flex items-center justify-center mr-3`}
                    >
                      <span className="text-white font-bold text-sm">
                        {course.instructor
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <div
                        className={`${
                          theme === "dark"
                            ? "text-white"
                            : theme === "light"
                            ? "text-gray-900"
                            : "text-white"
                        } text-sm font-medium`}
                      >
                        {course.instructor}
                      </div>
                      <div
                        className={`${
                          theme === "dark"
                            ? "text-gray-400"
                            : theme === "light"
                            ? "text-gray-500"
                            : "text-gray-400"
                        } text-xs`}
                      >
                        Formateur Expert
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    className={`flex items-center justify-between pt-4 border-t ${
                      theme === "dark"
                        ? "border-white/10"
                        : theme === "light"
                        ? "border-gray-200"
                        : "border-white/10"
                    }`}
                  >
                    <div className="flex items-center">
                      <span
                        className={`text-lg font-bold bg-gradient-to-r ${course.color} bg-clip-text text-transparent`}
                      >
                        {course.price}
                      </span>
                    </div>

                    <NavLink
                      to="/"
                      className={`group/btn inline-flex items-center gap-2 bg-gradient-to-r ${
                        theme === "dark"
                          ? "from-cyan-500 to-purple-500"
                          : theme === "light"
                          ? "from-cyan-600 to-purple-600"
                          : "from-cyan-500 to-purple-500"
                      } text-white px-4 py-2 rounded-xl font-semibold text-sm hover:scale-105 ${
                        theme === "dark"
                          ? "hover:shadow-cyan-500/25"
                          : theme === "light"
                          ? "hover:shadow-cyan-400/25"
                          : "hover:shadow-cyan-500/25"
                      } transition-all duration-300`}
                    >
                      Commencer
                      <HiOutlineArrowNarrowRight className="group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </NavLink>
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                {hoveredCard === course.id && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      theme === "dark"
                        ? "from-cyan-500/5 via-purple-500/5 to-pink-500/5"
                        : theme === "light"
                        ? "from-cyan-400/5 via-purple-400/5 to-pink-400/5"
                        : "from-cyan-500/5 via-purple-500/5 to-pink-500/5"
                    } rounded-3xl pointer-events-none transition-opacity duration-300`}
                  ></div>
                )}
              </div>

              {/* Floating Achievement Badge */}
              {index === 0 && (
                <div
                  className={`absolute -bottom-4 -right-4 bg-gradient-to-br ${
                    theme === "dark"
                      ? "from-emerald-500/20 to-cyan-500/20"
                      : theme === "light"
                      ? "from-emerald-400/20 to-cyan-400/20"
                      : "from-emerald-500/20 to-cyan-500/20"
                  } backdrop-blur-xl border ${
                    theme === "dark"
                      ? "border-white/20"
                      : theme === "light"
                      ? "border-gray-200/30"
                      : "border-white/20"
                  } rounded-2xl p-3 group-hover:scale-110 transition-all duration-500 shadow-xl ${
                    theme === "dark"
                      ? "shadow-emerald-500/25"
                      : theme === "light"
                      ? "shadow-emerald-400/25"
                      : "shadow-emerald-500/25"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 bg-gradient-to-br ${
                        theme === "dark"
                          ? "from-emerald-400 to-cyan-500"
                          : theme === "light"
                          ? "from-emerald-500 to-cyan-600"
                          : "from-emerald-400 to-cyan-500"
                      } rounded-lg flex items-center justify-center`}
                    >
                      <span className="text-white text-sm">🏆</span>
                    </div>
                    <div>
                      <div
                        className={`text-sm font-bold bg-gradient-to-r ${
                          theme === "dark"
                            ? "from-emerald-400 to-cyan-400"
                            : theme === "light"
                            ? "from-emerald-500 to-cyan-500"
                            : "from-emerald-400 to-cyan-400"
                        } bg-clip-text text-transparent`}
                      >
                        Populaire
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Call-to-Action Section */}
        <div
          className={`text-center mt-12 md:mt-16 transform transition-all duration-1000 delay-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div
            className={`${themeStyles.ctaBg} backdrop-blur-xl md:backdrop-blur-2xl border ${themeStyles.ctaBorder} rounded-2xl md:rounded-3xl p-4 md:p-8 max-w-4xl mx-auto shadow-xl md:shadow-2xl`}
          >
            <h3
              className={`text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${
                theme === "dark"
                  ? "from-cyan-400 via-purple-400 to-pink-400"
                  : theme === "light"
                  ? "from-blue-500 via-purple-500 to-pink-500"
                  : "from-cyan-400 via-purple-400 to-pink-400"
              } bg-clip-text text-transparent mb-3 md:mb-4`}
            >
              Prêt à transformer votre communication scolaire ?
            </h3>
            <p
              className={`${
                theme === "dark"
                  ? "text-gray-300"
                  : theme === "light"
                  ? "text-gray-600"
                  : "text-gray-300"
              } text-sm md:text-lg mb-4 md:mb-6`}
            >
              Rejoignez plus de 1500 familles qui ont révolutionné leur suivi
              scolaire avec SchoolChat
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-2 md:gap-4">
              <button
                className={`group relative bg-gradient-to-r ${
                  theme === "dark"
                    ? "from-cyan-500 via-purple-500 to-pink-500 hover:shadow-cyan-500/50"
                    : theme === "light"
                    ? "from-cyan-600 via-purple-600 to-pink-600 hover:shadow-cyan-400/50"
                    : "from-cyan-500 via-purple-500 to-pink-500 hover:shadow-cyan-500/50"
                } text-white px-4 py-2 md:px-8 md:py-3 rounded-lg md:rounded-xl font-semibold text-sm md:text-base hover:scale-105 hover:-translate-y-1 transition-all duration-500 shadow-md md:shadow-lg overflow-hidden`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${
                    theme === "dark"
                      ? "from-purple-600 via-pink-600 to-red-600"
                      : theme === "light"
                      ? "from-purple-700 via-pink-700 to-red-700"
                      : "from-purple-600 via-pink-600 to-red-600"
                  } translate-y-full group-hover:translate-y-0 transition-transform duration-500`}
                ></div>
                <span className="relative flex items-center justify-center gap-1 md:gap-2">
                  🚀 Commencer gratuitement
                </span>
              </button>

              <button
                className={`group ${
                  theme === "dark"
                    ? "bg-white/10 border-white/20 hover:bg-white/20"
                    : theme === "light"
                    ? "bg-black/10 border-gray-200 hover:bg-black/20"
                    : "bg-white/10 border-white/20 hover:bg-white/20"
                } backdrop-blur-sm border px-4 py-2 md:px-8 md:py-3 rounded-lg md:rounded-xl font-semibold text-sm md:text-base hover:scale-105 transition-all duration-300 ${
                  theme === "dark"
                    ? "text-white"
                    : theme === "light"
                    ? "text-gray-800"
                    : "text-white"
                }`}
              >
                📞 Démonstration
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Floating Elements */}
      <div
        className={`absolute top-32 right-16 w-2 h-2 rounded-full animate-pulse hidden lg:block ${
          theme === "dark"
            ? "bg-cyan-400"
            : theme === "light"
            ? "bg-cyan-500"
            : "bg-cyan-400"
        }`}
      ></div>
      <div
        className={`absolute bottom-48 left-12 w-3 h-3 rounded-full animate-pulse hidden lg:block ${
          theme === "dark"
            ? "bg-purple-400"
            : theme === "light"
            ? "bg-purple-500"
            : "bg-purple-400"
        }`}
      ></div>
      <div
        className={`absolute top-2/3 right-1/4 w-1 h-1 rounded-full animate-pulse hidden lg:block ${
          theme === "dark"
            ? "bg-emerald-400"
            : theme === "light"
            ? "bg-emerald-500"
            : "bg-emerald-400"
        }`}
      ></div>
    </section>
  );
};
