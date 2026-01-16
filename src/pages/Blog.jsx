import React from "react";
import { Calendar, ArrowRight } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

const getEducationalBlogPosts = (t) => [
  {
    id: 1,
    titleKey: "pages.blog.posts.post1.title",
    image: "https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    categoryKey: "pages.blog.posts.post1.category",
    authorKey: "pages.blog.posts.post1.author",
    dateKey: "pages.blog.posts.post1.date",
    excerptKey: "pages.blog.posts.post1.excerpt",
  },
  {
    id: 2,
    titleKey: "pages.blog.posts.post2.title",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    categoryKey: "pages.blog.posts.post2.category",
    authorKey: "pages.blog.posts.post2.author",
    dateKey: "pages.blog.posts.post2.date",
    excerptKey: "pages.blog.posts.post2.excerpt",
  },
  {
    id: 3,
    titleKey: "pages.blog.posts.post3.title",
    image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
    categoryKey: "pages.blog.posts.post3.category",
    authorKey: "pages.blog.posts.post3.author",
    dateKey: "pages.blog.posts.post3.date",
    excerptKey: "pages.blog.posts.post3.excerpt",
  },
  {
    id: 4,
    titleKey: "pages.blog.posts.post4.title",
    image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
    categoryKey: "pages.blog.posts.post4.category",
    authorKey: "pages.blog.posts.post4.author",
    dateKey: "pages.blog.posts.post4.date",
    excerptKey: "pages.blog.posts.post4.excerpt",
  },
  {
    id: 5,
    titleKey: "pages.blog.posts.post5.title",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    categoryKey: "pages.blog.posts.post5.category",
    authorKey: "pages.blog.posts.post5.author",
    dateKey: "pages.blog.posts.post5.date",
    excerptKey: "pages.blog.posts.post5.excerpt",
  },
  {
    id: 6,
    titleKey: "pages.blog.posts.post6.title",
    image: "https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    categoryKey: "pages.blog.posts.post6.category",
    authorKey: "pages.blog.posts.post6.author",
    dateKey: "pages.blog.posts.post6.date",
    excerptKey: "pages.blog.posts.post6.excerpt",
  },
];

export const Blog = ({ theme = "default" }) => {
  const { t } = useTranslation();
  const educationalBlogPosts = getEducationalBlogPosts(t);

  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          cardBorder: "border-gray-700",
        };
      case "light":
        return {
          bg: "bg-gray-50",
          text: "text-gray-800",
          cardBg: "bg-white",
          cardBorder: "border-gray-200",
        };
      default:
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          cardBg: "bg-gray-800",
          cardBorder: "border-gray-700",
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <section className={`min-h-screen ${themeClasses.bg} py-20 px-4 sm:px-6 lg:px-8`}>
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 sm:gap-3 bg-blue-100 dark:bg-blue-900 rounded-full px-4 sm:px-8 py-2 sm:py-3 mb-6 sm:mb-8">
            <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm sm:text-lg">
              📚 {t("pages.blog.badge")}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 px-4">
            <span className="text-blue-500">{t("pages.blog.title.line1")}</span>
            <br />
            <span className="text-purple-500">{t("pages.blog.title.line2")}</span>
          </h2>

          <p className={`text-sm sm:text-xl ${themeClasses.text} max-w-3xl mx-auto leading-relaxed px-4`}>
            {t("pages.blog.subtitle")}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-8 sm:mt-12">
            {[
              { number: 1200, suffix: "+", label: "Lecteurs", icon: "👨🎓" },
              { number: 45, suffix: "+", label: "Articles", icon: "📖" },
              { number: 96, suffix: "%", label: "Satisfaction", icon: "⭐" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{stat.icon}</div>
                <div className="text-xl sm:text-3xl font-bold text-blue-500">
                  {stat.number}{stat.suffix}
                </div>
                <div className="text-gray-500 text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {educationalBlogPosts.map((post) => (
            <article
              key={post.id}
              className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-3xl overflow-hidden hover:shadow-lg transition-shadow duration-300`}
            >
              {/* Image Container */}
              <div className="relative overflow-hidden aspect-video">
                <img
                  src={post.image}
                  alt={t(post.titleKey)}
                  className="w-full h-full object-cover"
                />

                {/* Category Badge */}
                <div className="absolute top-4 left-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {t(post.categoryKey)}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-8">
                <h3 className={`text-base sm:text-xl font-bold ${themeClasses.text} mb-3 sm:mb-4 leading-tight`}>
                  {t(post.titleKey)}
                </h3>

                <p className="text-gray-500 text-xs sm:text-base mb-4 sm:mb-6 leading-relaxed">
                  {t(post.excerptKey)}
                </p>

                {/* Author and Date */}
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs sm:text-sm font-bold">
                        {t(post.authorKey).split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <span className={`${themeClasses.text} text-xs sm:text-base font-medium`}>
                      {t(post.authorKey)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 text-gray-500 text-xs sm:text-sm">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{t(post.dateKey)}</span>
                  </div>
                </div>

                {/* Read More Button */}
                <button className="inline-flex items-center gap-2 mt-4 sm:mt-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-base font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors w-full sm:w-auto justify-center">
                  {t("pages.blog.readMore")}
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12 sm:mt-16 px-4">
          <button className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 sm:px-10 sm:py-4 rounded-2xl font-bold text-sm sm:text-lg hover:shadow-lg transition-shadow w-full sm:w-auto">
            <span className="flex items-center justify-center gap-2 sm:gap-3">
              {t("pages.blog.viewAll")}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};