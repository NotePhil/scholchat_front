import React from "react";
import { FaBook, FaUsers, FaGraduationCap, FaComments, FaMobile, FaBell } from "react-icons/fa";
import { AiFillStar } from "react-icons/ai";
import { NavLink } from "react-router-dom";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";
import { useTranslation } from "../hooks/useTranslation";

const getSchoolChatCourses = (t) => [
  {
    id: 1,
    titleKey: "pages.courses.courses.course1.title",
    descriptionKey: "pages.courses.courses.course1.description",
    cover: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop",
    categoryKey: "pages.courses.courses.course1.category",
    subcategoryKey: "pages.courses.courses.course1.subcategory",
    lessons: 12,
    rating: 4.8,
    reviews: 156,
    instructorKey: "pages.courses.courses.course1.instructor",
    priceKey: "pages.courses.courses.course1.price",
    durationKey: "pages.courses.courses.course1.duration",
    levelKey: "pages.courses.courses.course1.level",
    icon: <FaComments />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    titleKey: "pages.courses.courses.course2.title",
    descriptionKey: "pages.courses.courses.course2.description",
    cover: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop",
    categoryKey: "pages.courses.courses.course2.category",
    subcategoryKey: "pages.courses.courses.course2.subcategory",
    lessons: 15,
    rating: 4.9,
    reviews: 203,
    instructorKey: "pages.courses.courses.course2.instructor",
    priceKey: "pages.courses.courses.course2.price",
    durationKey: "pages.courses.courses.course2.duration",
    levelKey: "pages.courses.courses.course2.level",
    icon: <FaGraduationCap />,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 3,
    titleKey: "pages.courses.courses.course3.title",
    descriptionKey: "pages.courses.courses.course3.description",
    cover: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
    categoryKey: "pages.courses.courses.course3.category",
    subcategoryKey: "pages.courses.courses.course3.subcategory",
    lessons: 8,
    rating: 4.7,
    reviews: 89,
    instructorKey: "pages.courses.courses.course3.instructor",
    priceKey: "pages.courses.courses.course3.price",
    durationKey: "pages.courses.courses.course3.duration",
    levelKey: "pages.courses.courses.course3.level",
    icon: <FaBell />,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: 4,
    titleKey: "pages.courses.courses.course4.title",
    descriptionKey: "pages.courses.courses.course4.description",
    cover: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop",
    categoryKey: "pages.courses.courses.course4.category",
    subcategoryKey: "pages.courses.courses.course4.subcategory",
    lessons: 10,
    rating: 4.6,
    reviews: 124,
    instructorKey: "pages.courses.courses.course4.instructor",
    priceKey: "pages.courses.courses.course4.price",
    durationKey: "pages.courses.courses.course4.duration",
    levelKey: "pages.courses.courses.course4.level",
    icon: <FaMobile />,
    color: "from-orange-500 to-red-500",
  },
  {
    id: 5,
    titleKey: "pages.courses.courses.course5.title",
    descriptionKey: "pages.courses.courses.course5.description",
    cover: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=250&fit=crop",
    categoryKey: "pages.courses.courses.course5.category",
    subcategoryKey: "pages.courses.courses.course5.subcategory",
    lessons: 14,
    rating: 4.9,
    reviews: 187,
    instructorKey: "pages.courses.courses.course5.instructor",
    priceKey: "pages.courses.courses.course5.price",
    durationKey: "pages.courses.courses.course5.duration",
    levelKey: "pages.courses.courses.course5.level",
    icon: <FaUsers />,
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: 6,
    titleKey: "pages.courses.courses.course6.title",
    descriptionKey: "pages.courses.courses.course6.description",
    cover: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
    categoryKey: "pages.courses.courses.course6.category",
    subcategoryKey: "pages.courses.courses.course6.subcategory",
    lessons: 11,
    rating: 4.8,
    reviews: 95,
    instructorKey: "pages.courses.courses.course6.instructor",
    priceKey: "pages.courses.courses.course6.price",
    durationKey: "pages.courses.courses.course6.duration",
    levelKey: "pages.courses.courses.course6.level",
    icon: <FaBook />,
    color: "from-cyan-500 to-blue-500",
  },
];

export const Courses = ({ theme = "default" }) => {
  const { t } = useTranslation();
  const schoolChatCourses = getSchoolChatCourses(t);

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
    <section className={`min-h-screen ${themeClasses.bg} py-20`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 bg-blue-100 dark:bg-blue-900 rounded-full px-8 py-3 mb-8">
            <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
              {t("pages.courses.badge")}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-blue-500">{t("pages.courses.title.line1")}</span>
            <br />
            <span className="text-purple-500">{t("pages.courses.title.line2")}</span>
          </h1>

          <p className={`text-xl ${themeClasses.text} mt-8 leading-relaxed max-w-4xl mx-auto`}>
            {t("pages.courses.subtitle")}
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-12 mt-12">
            {[
              { number: 1500, suffix: "+", labelKey: "pages.courses.stats.students", icon: "👨🎓" },
              { number: 25, suffix: "+", labelKey: "pages.courses.stats.courses", icon: "📖" },
              { number: 98, suffix: "%", labelKey: "pages.courses.stats.satisfaction", icon: "⭐" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-blue-500">
                  {stat.number}{stat.suffix}
                </div>
                <div className="text-gray-500 text-sm">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {schoolChatCourses.map((course) => (
            <div
              key={course.id}
              className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300`}
            >
              {/* Image Section */}
              <div className="relative overflow-hidden h-48">
                <img
                  src={course.cover}
                  alt={t(course.titleKey)}
                  className="w-full h-full object-cover"
                />

                {/* Category Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`text-xs bg-gradient-to-r ${course.color} px-3 py-1.5 text-white rounded-full font-semibold`}>
                    {t(course.categoryKey)}
                  </span>
                  <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 text-white rounded-full font-semibold">
                    {t(course.subcategoryKey)}
                  </span>
                </div>

                {/* Level Badge */}
                <div className="absolute top-4 right-4">
                  <span className="text-xs bg-black/50 text-white backdrop-blur-sm px-3 py-1.5 rounded-full font-semibold">
                    {t(course.levelKey)}
                  </span>
                </div>

                {/* Floating Icon */}
                <div className={`absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r ${course.color} rounded-xl flex items-center justify-center`}>
                  <span className="text-white text-lg">{course.icon}</span>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6">
                {/* Course Stats */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-500">
                      <FaBook className="text-cyan-400 mr-2" />
                      <span className="text-sm font-medium">
                        {course.lessons} {t("pages.courses.card.lessons")}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <AiFillStar className="text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">
                        {course.rating} ({course.reviews})
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {t(course.durationKey)}
                  </div>
                </div>

                {/* Title and Description */}
                <h3 className={`text-xl font-bold ${themeClasses.text} mb-3`}>
                  {t(course.titleKey)}
                </h3>

                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  {t(course.descriptionKey)}
                </p>

                {/* Instructor */}
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">
                      {t(course.instructorKey).split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <div className={`${themeClasses.text} text-sm font-medium`}>
                      {t(course.instructorKey)}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {t("pages.courses.card.instructor")}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <span className={`text-lg font-bold bg-gradient-to-r ${course.color} bg-clip-text text-transparent`}>
                      {t(course.priceKey)}
                    </span>
                  </div>

                  <NavLink
                    to="/"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:shadow-lg transition-shadow"
                  >
                    {t("pages.courses.card.cta")}
                    <HiOutlineArrowNarrowRight />
                  </NavLink>
                </div>
              </div>

              {/* Popular Badge for first course */}
              {course.id === 1 && (
                <div className="absolute -bottom-4 -right-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-2xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">🏆</span>
                    </div>
                    <div className="text-sm font-bold text-green-600">
                      {t("pages.courses.badgePopular")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Call-to-Action Section */}
        <div className="text-center mt-16">
          <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-3xl p-8 max-w-4xl mx-auto`}>
            <h3 className="text-3xl font-bold text-blue-500 mb-4">
              {t("pages.courses.cta.title")}
            </h3>
            <p className="text-gray-500 text-lg mb-6">
              {t("pages.courses.cta.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow">
                {t("pages.courses.cta.button1")}
              </button>

              <button className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-8 py-3 rounded-xl font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                {t("pages.courses.cta.button2")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};