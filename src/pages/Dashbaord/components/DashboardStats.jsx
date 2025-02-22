import React from "react";
import { Users, UserPlus, BookOpen, Building2, ArrowRight } from "lucide-react";

const StatCard = ({
  title,
  icon: Icon,
  count,
  activeCount,
  tabName,
  isDark,
  themes,
  currentTheme,
  colorSchemes,
  setActiveTab,
  onViewAll,
  showViewAll = true,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-8 transition-all duration-500 ease-in-out transform hover:-translate-y-1 hover:shadow-2xl group ${
        isDark
          ? "bg-gradient-to-br from-gray-800/40 to-gray-900/40"
          : "bg-gradient-to-br from-gray-50 to-gray-100/50"
      }`}
      style={{
        backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.8)",
      }}
    >
      {/* Hover overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-all duration-500"
        style={{
          backgroundColor: colorSchemes[currentTheme].primary,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h3
            className={`text-xl font-semibold transition-colors duration-300 ${
              isDark ? "text-gray-100" : "text-gray-700"
            }`}
          >
            {title}
          </h3>
          <div
            className={`p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
            style={{
              boxShadow: `0 4px 12px ${colorSchemes[currentTheme].primary}20`,
            }}
          >
            <Icon
              className="w-10 h-10 transition-colors duration-300"
              style={{ color: colorSchemes[currentTheme].primary }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div
            className="text-5xl font-bold tracking-tight transition-colors duration-300"
            style={{ color: colorSchemes[currentTheme].primary }}
          >
            {count.toLocaleString()}
          </div>
          <div className="flex items-center space-x-3">
            <div
              className="h-3 w-3 rounded-full transition-colors duration-300 animate-pulse"
              style={{ backgroundColor: colorSchemes[currentTheme].primary }}
            />
            <p
              className={`text-base transition-colors duration-300 ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <span className="font-medium">
                {activeCount.toLocaleString()}
              </span>{" "}
              active
            </p>
          </div>
        </div>

        {/* View All Button */}
        {showViewAll && (
          <button
            className="mt-8 w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover:opacity-90 group-hover:scale-105"
            style={{
              backgroundColor: colorSchemes[currentTheme].primary,
              color: "white",
              boxShadow: `0 4px 12px ${colorSchemes[currentTheme].primary}40`,
            }}
            onClick={() => {
              if (onViewAll && typeof onViewAll === "function") {
                onViewAll(tabName.toLowerCase());
              }
              if (setActiveTab && typeof setActiveTab === "function") {
                setActiveTab(tabName.toLowerCase());
              }
            }}
          >
            <span>View Details</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

const DashboardStats = ({
  stats,
  isDark,
  themes,
  currentTheme,
  colorSchemes,
  setActiveTab,
  onViewAll,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
      <StatCard
        title="All Users"
        icon={Users}
        count={stats.users.length}
        activeCount={
          stats.users.filter((i) => i.etat === "active" || i.etat === "ACTIF")
            .length
        }
        tabName="users"
        isDark={isDark}
        themes={{}}
        currentTheme={currentTheme}
        colorSchemes={colorSchemes}
        setActiveTab={setActiveTab}
        onViewAll={onViewAll}
        showViewAll={false}
      />
      <StatCard
        title="Students"
        icon={Users}
        count={stats.students.length}
        activeCount={
          stats.students.filter(
            (i) => i.etat === "active" || i.etat === "ACTIF"
          ).length
        }
        tabName="students"
        isDark={isDark}
        themes={themes}
        currentTheme={currentTheme}
        colorSchemes={colorSchemes}
        setActiveTab={setActiveTab}
        onViewAll={onViewAll}
      />
      <StatCard
        title="Parents"
        icon={UserPlus}
        count={stats.parents.length}
        activeCount={
          stats.parents.filter((i) => i.etat === "active" || i.etat === "ACTIF")
            .length
        }
        tabName="parents"
        isDark={isDark}
        themes={themes}
        currentTheme={currentTheme}
        colorSchemes={colorSchemes}
        setActiveTab={setActiveTab}
        onViewAll={onViewAll}
      />
      <StatCard
        title="Professors"
        icon={BookOpen}
        count={stats.professors.length}
        activeCount={
          stats.professors.filter(
            (i) => i.etat === "active" || i.etat === "ACTIF"
          ).length
        }
        tabName="professors"
        isDark={isDark}
        themes={themes}
        currentTheme={currentTheme}
        colorSchemes={colorSchemes}
        setActiveTab={setActiveTab}
        onViewAll={onViewAll}
      />
      <StatCard
        title="Classes"
        icon={Building2}
        count={stats.classes.length}
        activeCount={
          stats.classes.filter((i) => i.etat === "active" || i.etat === "ACTIF")
            .length
        }
        tabName="classes"
        isDark={isDark}
        themes={themes}
        currentTheme={currentTheme}
        colorSchemes={colorSchemes}
        setActiveTab={setActiveTab}
        onViewAll={onViewAll}
      />
    </div>
  );
};

export default DashboardStats;
