import React from "react";
import heroImg from "../components/assets/images/heronew.png";
import { About } from "./About";
import { Courses } from "./Courses";
import { Instructor } from "./Instructor";
import { Blog } from "./Blog";
import FunctionalitiesSection from "./FunctionalitiesSection";

export const HomeContent = ({ theme }) => {
  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          badgeBg: "bg-blue-900",
          badgeText: "text-blue-400",
        };
      case "light":
        return {
          bg: "bg-gray-50",
          text: "text-gray-800",
          badgeBg: "bg-blue-100",
          badgeText: "text-blue-600",
        };
      default:
        return {
          bg: "bg-gray-900",
          text: "text-gray-200",
          badgeBg: "bg-blue-900",
          badgeText: "text-blue-400",
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <section className={`min-h-screen ${themeClasses.bg}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center space-y-16">
          <div className="w-full text-center max-w-6xl mx-auto">
            <div className={`inline-flex items-center gap-2 ${themeClasses.badgeBg} rounded-full px-6 py-2 mb-6`}>
              <span className={`${themeClasses.badgeText} font-semibold text-sm`}>
                Educational Platform
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-blue-500">Academic success starts with good communication</span>
            </h1>

            <p className={`text-sm sm:text-base md:text-xl ${themeClasses.text} max-w-4xl mx-auto leading-relaxed mb-8`}>
              Facilitate communication for better educational support
            </p>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-12">
              {[
                { number: "98%", label: "Success", icon: "🏆" },
                { number: "5000+", label: "Families", icon: "👨👩👧👦" },
                { number: "24/7", label: "Support", icon: "💬" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl mb-2">{stat.icon}</div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-500">{stat.number}</div>
                  <div className="text-gray-500 text-xs sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 sm:px-6 md:px-8 sm:py-3 md:py-4 rounded-xl font-bold text-sm sm:text-base md:text-lg hover:shadow-lg transition-shadow w-full sm:w-auto max-w-xs sm:max-w-none">
              Discover
            </button>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-8">
              {["Innovation", "Technological", "Excellence", "Guaranteed"].map((badge, i) => (
                <span
                  key={i}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full max-w-4xl mx-auto">
            <div className="relative">
              <img
                src={heroImg}
                alt="SchoolChat Hero"
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Home = ({ theme }) => {
  return (
    <div>
      <HomeContent theme={theme} />
      <About theme={theme} />
      <FunctionalitiesSection theme={theme} />
      <Instructor theme={theme} />
      <Courses theme={theme} />
      <Blog theme={theme} />
    </div>
  );
};

export { Home };
export default Home;