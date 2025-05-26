import React, { useState, useEffect, useRef } from "react";
import { Calendar, ArrowRight } from "lucide-react";

// Educational blog data
const educationalBlogPosts = [
  {
    id: 1,
    title: "L'excellence éducative : Entre tradition et innovation",
    image:
      "https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    category: "Éducation",
    author: "Aminata Diallo",
    date: "15 Nov 2024",
    excerpt:
      "Découvrez comment l'éducation moderne évolue avec les changements technologiques",
  },
  {
    id: 2,
    title: "Méthodes pédagogiques innovantes dans les écoles modernes",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    category: "Innovation",
    author: "Kwame Nkrumah",
    date: "28 Oct 2024",
    excerpt:
      "Nouvelles méthodologies qui transforment les expériences éducatives",
  },
  {
    id: 3,
    title: "Construire des communautés éducatives solides",
    image:
      "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
    category: "Communauté",
    author: "Fatoumata Bâ",
    date: "10 Oct 2024",
    excerpt:
      "Comment les environnements collaboratifs améliorent la réussite des élèves",
  },
  {
    id: 4,
    title: "L'impact des technologies numériques sur l'apprentissage",
    image:
      "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
    category: "Technologie",
    author: "Jean Koffi",
    date: "5 Oct 2024",
    excerpt:
      "Exploration des outils numériques qui révolutionnent l'enseignement",
  },
  {
    id: 5,
    title: "Stratégies pour engager les parents dans l'éducation",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    category: "Engagement",
    author: "Sophie Laurent",
    date: "22 Sep 2024",
    excerpt:
      "Techniques pour améliorer la participation des parents dans le parcours scolaire",
  },
  {
    id: 6,
    title: "Évaluation des compétences au 21ème siècle",
    image:
      "https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    category: "Pédagogie",
    author: "Thomas Bernard",
    date: "14 Sep 2024",
    excerpt:
      "Nouvelles approches pour évaluer les compétences des élèves aujourd'hui",
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
          observer.unobserve(entry.target);
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

export const Blog = ({ theme = "default" }) => {
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
          radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          linear-gradient(135deg, #0f0f23 0%, #1a0b3d 25%, #2563eb 50%, #7c3aed 75%, #0f0f23 100%),
          radial-gradient(ellipse at top, #1e1b4b 0%, transparent 70%),
          radial-gradient(ellipse at bottom, #312e81 0%, transparent 70%)
        `;
      case "light":
        return `
          radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
          linear-gradient(135deg, #f8fafc 0%, #f1f5f9 25%, #eef2ff 50%, #e0e7ff 75%, #f8fafc 100%),
          radial-gradient(ellipse at top, #ddd6fe 0%, transparent 70%),
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

  const getParticleColors = () => {
    switch (theme) {
      case "light":
        return "bg-gradient-to-r from-blue-400 to-purple-400";
      default:
        return "bg-gradient-to-r from-cyan-400 to-purple-500";
    }
  };

  const getFloatingShapeColors = () => {
    switch (theme) {
      case "light":
        return {
          shape1: "bg-gradient-to-br from-blue-200/40 to-purple-200/40",
          shape2: "bg-gradient-to-br from-pink-200/40 to-red-200/40",
          shape3: "bg-gradient-to-br from-emerald-200/40 to-cyan-200/40",
          shape4: "bg-gradient-to-br from-purple-200/40 to-pink-200/40",
        };
      default:
        return {
          shape1: "bg-gradient-to-br from-blue-500/10 to-purple-500/10",
          shape2: "bg-gradient-to-br from-pink-500/10 to-red-500/10",
          shape3: "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10",
          shape4: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
        };
    }
  };

  const getBadgeColors = () => {
    switch (theme) {
      case "light":
        return "bg-gradient-to-r from-cyan-400/30 via-blue-400/30 to-purple-400/30 border-gray-300/40";
      default:
        return "bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border-white/20";
    }
  };

  const getTextColors = () => {
    switch (theme) {
      case "light":
        return {
          primary: "text-gray-800",
          secondary: "text-gray-700",
          badge: "text-gray-800",
          card: {
            title: "text-gray-800",
            excerpt: "text-gray-600",
            author: "text-gray-800",
            date: "text-gray-600",
          },
        };
      default:
        return {
          primary: "text-white",
          secondary: "text-gray-200",
          badge: "text-white",
          card: {
            title: "text-white",
            excerpt: "text-gray-300",
            author: "text-white",
            date: "text-gray-300",
          },
        };
    }
  };

  const getCardColors = () => {
    switch (theme) {
      case "light":
        return {
          background: "bg-white/90",
          border: "border-gray-200/40",
          hoverBorder: "group-hover:border-gray-300/60",
        };
      default:
        return {
          background: "bg-black/20",
          border: "border-white/20",
          hoverBorder: "group-hover:border-white/40",
        };
    }
  };

  const floatingShapes = getFloatingShapeColors();
  const textColors = getTextColors();
  const cardColors = getCardColors();

  return (
    <section
      ref={sectionRef}
      className="min-h-screen relative overflow-hidden py-12 md:py-20 px-4 sm:px-6 lg:px-8"
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
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${getParticleColors()} rounded-full opacity-60`}
            ></div>
          </div>
        ))}
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-20 left-10 w-24 h-24 sm:w-32 sm:h-32 ${floatingShapes.shape1} rounded-full blur-xl animate-bounce`}
          style={{ animationDuration: "6s" }}
        ></div>
        <div
          className={`absolute top-40 right-10 sm:right-20 w-20 h-20 sm:w-24 sm:h-24 ${floatingShapes.shape2} rounded-lg blur-xl animate-spin`}
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className={`absolute bottom-40 left-1/4 w-32 h-32 sm:w-40 sm:h-40 ${floatingShapes.shape3} rounded-full blur-xl animate-pulse`}
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className={`absolute top-1/3 right-1/4 sm:right-1/3 w-24 h-24 sm:w-28 sm:h-28 ${floatingShapes.shape4} rounded-full blur-xl animate-pulse`}
          style={{ animationDuration: "7s" }}
        ></div>
      </div>

      <div className="relative z-10 container mx-auto">
        {/* Header Section */}
        <div
          className={`text-center mb-12 md:mb-16 lg:mb-20 transform transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div
            className={`inline-flex items-center gap-2 sm:gap-3 ${getBadgeColors()} backdrop-blur-xl rounded-full px-6 py-2 sm:px-8 sm:py-3 mb-6 sm:mb-8 hover:scale-105 transition-all duration-500 shadow-2xl shadow-blue-500/25`}
          >
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse"></div>
            <span
              className={`${textColors.badge} font-semibold text-sm sm:text-lg`}
            >
              📚 Blog Éducatif
            </span>
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl">
            Nous partageons nos
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Idées Éducatives
            </span>
          </h2>

          <p
            className={`text-base sm:text-xl ${textColors.secondary} max-w-3xl mx-auto leading-relaxed px-4`}
          >
            ✨ Vous n'êtes pas seul dans votre parcours, nous vous offrons notre
            soutien et notre guidance pour réussir ensemble ⚡
          </p>

          {/* Animated Stats */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 mt-8 sm:mt-12">
            {[
              { number: 1200, suffix: "+", label: "Lecteurs", icon: "👨‍🎓" },
              { number: 45, suffix: "+", label: "Articles", icon: "📖" },
              { number: 96, suffix: "%", label: "Satisfaction", icon: "⭐" },
            ].map((stat, i) => (
              <div
                key={i}
                className="text-center group cursor-pointer transform hover:scale-110 transition-all duration-300 px-2"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2 group-hover:scale-125 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">
                  <AnimatedCounter end={stat.number} />
                  {stat.suffix}
                </div>
                <div
                  className={`${textColors.secondary} text-xs sm:text-sm font-medium`}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {educationalBlogPosts.map((post, index) => (
            <article
              key={post.id}
              className={`group relative ${
                cardColors.background
              } backdrop-blur-2xl border ${cardColors.border} ${
                cardColors.hoverBorder
              } rounded-3xl overflow-hidden hover:transform hover:scale-105 hover:-translate-y-2 transition-all duration-700 shadow-2xl hover:shadow-cyan-500/25 ${
                isVisible ? "opacity-100" : "opacity-0 translate-y-10"
              }`}
              style={{
                transitionDelay: `${index * 0.1}s`,
              }}
            >
              {/* Multiple Glow Effects */}
              <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-700 opacity-0 group-hover:opacity-100"></div>
              <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-emerald-500/15 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-700 opacity-0 group-hover:opacity-100"></div>

              {/* Image Container */}
              <div className="relative overflow-hidden aspect-video">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Image Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Category Badge */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-sm">
                  {post.category}
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500 animate-pulse"></div>
              </div>

              {/* Content */}
              <div className="p-5 sm:p-6 md:p-8">
                <h3
                  className={`text-lg sm:text-xl font-bold ${textColors.card.title} mb-3 sm:mb-4 leading-tight group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500`}
                >
                  {post.title}
                </h3>

                <p
                  className={`${textColors.card.excerpt} text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed`}
                >
                  {post.excerpt}
                </p>

                {/* Author and Date */}
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t ${
                    theme === "light" ? "border-gray-200/50" : "border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs sm:text-sm font-bold">
                        {post.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <span
                      className={`${textColors.card.author} text-sm sm:text-base font-medium`}
                    >
                      {post.author}
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-1 sm:gap-2 ${textColors.card.date} text-xs sm:text-sm`}
                  >
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{post.date}</span>
                  </div>
                </div>

                {/* Read More Button */}
                <button
                  onClick={() =>
                    console.log(`Navigate to blog post ${post.id}`)
                  }
                  className={`inline-flex items-center gap-1 sm:gap-2 mt-4 sm:mt-6 ${
                    theme === "light"
                      ? "bg-gradient-to-r from-cyan-400/30 to-purple-400/30 hover:from-cyan-400/40 hover:to-purple-400/40 border-cyan-400/40 text-cyan-600"
                      : "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border-cyan-400/30 text-cyan-300"
                  } border px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 cursor-pointer backdrop-blur-sm text-sm sm:text-base`}
                >
                  Lire plus
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>

              {/* Decorative Elements */}
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-bounce backdrop-blur-sm"></div>
            </article>
          ))}
        </div>

        {/* View All Button */}
        <div
          className={`text-center mt-12 sm:mt-16 transform transition-all duration-1000 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <button
            onClick={() => console.log("Navigate to all blog posts")}
            className="group relative bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:scale-110 hover:-translate-y-2 transition-all duration-500 shadow-2xl hover:shadow-cyan-500/50 overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <span className="relative flex items-center gap-2 sm:gap-3">
              📖 Voir tous les articles
              <span className="group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
            </span>
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500 -z-10"></div>
          </button>
        </div>
      </div>

      {/* Additional Floating Elements */}
      <div
        className={`absolute top-32 right-8 sm:right-16 w-1.5 h-1.5 sm:w-2 sm:h-2 ${
          theme === "light" ? "bg-blue-400" : "bg-cyan-400"
        } rounded-full animate-pulse hidden sm:block opacity-60`}
      ></div>
      <div
        className={`absolute bottom-48 left-8 sm:left-12 w-2 h-2 sm:w-3 sm:h-3 ${
          theme === "light" ? "bg-indigo-400" : "bg-purple-400"
        } rounded-full animate-pulse hidden sm:block opacity-60`}
      ></div>
      <div
        className={`absolute top-2/3 right-1/4 w-1 h-1 ${
          theme === "light" ? "bg-teal-400" : "bg-emerald-400"
        } rounded-full animate-pulse hidden sm:block opacity-60`}
      ></div>
      <div
        className={`absolute top-1/3 left-8 sm:left-10 w-1.5 h-1.5 sm:w-2 sm:h-2 ${
          theme === "light" ? "bg-pink-400" : "bg-rose-400"
        } rounded-full animate-pulse hidden sm:block opacity-60`}
      ></div>
    </section>
  );
};
