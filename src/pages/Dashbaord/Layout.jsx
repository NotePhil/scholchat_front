import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { themes, colorSchemes } from "./theme";
import DashboardCharts from "./components/DashboardCharts";
import DashboardStats from "./components/DashboardStats";
import ProfessorPage from "./ProfessorPage";
import StudentPage from "./StudentPage";
import ParentPage from "./ParentPage";
import ClassesPage from "./ClassesPage";
import { scholchatService } from "../../services/ScholchatService";

const Layoute = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentTheme, setCurrentTheme] = useState("blue");
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({
    students: [],
    parents: [],
    professors: [],
    classes: [],
    establishments: [],
    users: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [students, parents, professors, classes, establishments, users] =
          await Promise.all([
            scholchatService.getAllStudents(),
            scholchatService.getAllParents(),
            scholchatService.getAllProfessors(),
            scholchatService.getAllClasses(),
            scholchatService.getAllEstablishments(),
            scholchatService.getAllUsers(),
          ]);

        setStats({
          students,
          parents,
          professors,
          classes,
          establishments,
          users,
        });

        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          return date.toLocaleString("default", { month: "short" });
        }).reverse();

        const chartData = last6Months.map((month) => ({
          month,
          students: students.filter(
            (s) =>
              new Date(s.dateCreation).toLocaleString("default", {
                month: "short",
              }) === month
          ).length,
          parents: parents.filter(
            (p) =>
              new Date(p.dateCreation).toLocaleString("default", {
                month: "short",
              }) === month
          ).length,
          professors: professors.filter(
            (p) =>
              new Date(p.dateCreation).toLocaleString("default", {
                month: "short",
              }) === month
          ).length,
        }));

        setChartData(chartData);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const getRecentActivity = () => {
    const allActivities = [
      ...stats.students.map((s) => ({
        type: "student",
        date: new Date(s.dateCreation),
        text: `New student ${s.prenom} ${s.nom} registered`,
      })),
      ...stats.parents.map((p) => ({
        type: "parent",
        date: new Date(p.dateCreation),
        text: `New parent ${p.prenom} ${p.nom} joined`,
      })),
      ...stats.professors.map((p) => ({
        type: "professor",
        date: new Date(p.dateCreation),
        text: `New professor ${p.prenom} ${p.nom} added`,
      })),
    ];

    return allActivities.sort((a, b) => b.date - a.date).slice(0, 5);
  };

  const renderContent = () => {
    // First render stats for all pages
    const statsSection = (
      <DashboardStats
        stats={stats}
        isDark={isDark}
        themes={themes}
        currentTheme={currentTheme}
        colorSchemes={colorSchemes}
        setActiveTab={setActiveTab}
        onViewAll={(tabName) => setActiveTab(tabName)}
      />
    );

    // Then render page-specific content
    let pageContent;
    switch (activeTab) {
      case "dashboard":
        pageContent = (
          <DashboardCharts
            chartData={chartData}
            recentActivities={getRecentActivity()}
            isDark={isDark}
            themes={themes}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
          />
        );
        break;
      case "students":
        pageContent = <StudentPage stats={stats.students} />;
        break;
      case "professors":
        pageContent = <ProfessorPage stats={stats.professors} />;
        break;
      case "parents":
        pageContent = <ParentPage stats={stats.parents} />;
        break;
      case "classes":
        pageContent = <ClassesPage stats={stats.classes} />;
        break;
      default:
        pageContent = null;
    }

    return (
      <>
        {statsSection}
        <div className="mt-8">{pageContent}</div>
      </>
    );
  };

  return (
    <div
      className={`flex h-screen ${
        isDark ? themes.dark.background : themes.light.background
      } transition-colors duration-300`}
    >
      <Sidebar
        showSidebar={showSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        currentTheme={currentTheme}
        themes={themes}
        colorSchemes={colorSchemes}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          isDark={isDark}
          setIsDark={setIsDark}
          currentTheme={currentTheme}
          setCurrentTheme={setCurrentTheme}
          themes={themes}
          colorSchemes={colorSchemes}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Layoute;
