import React, { useState, useEffect } from "react";
import { Navigate, useNavigate, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { themes, colorSchemes } from "./theme";
import DashboardCharts from "./components/DashboardCharts";
import DashboardStats from "./components/DashboardStats";
import ActivityFeed from "./components/StudentDashboard/ActivityFeed";
import ProfessorPage from "./ProfessorPage";
import StudentPage from "./StudentPage";
import ParentPage from "./ParentPage";
import ClassesPage from "./ClassesPage";
import ProfessorDashboard from "./components/ProfessorDashboard/ProfessorDashboard";
import StudentDashboard from "./components/StudentDashboard/StudentDashboard";
import ParentDashboard from "./components/ParentDashboard/ParentDashboard";
import EmailDashboard from "./components/StudentDashboard/EmailDashboard";
import { scholchatService } from "../../services/ScholchatService";
import StudentParentStats from "./principale/StudentParentStats";
const Layoute = () => {
  // State management
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentTheme, setCurrentTheme] = useState("blue");
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    students: [],
    parents: [],
    professors: [],
    classes: [],
    establishments: [],
    users: [],
  });

  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");

  // Redirect if no user role is found
  useEffect(() => {
    if (!userRole) {
      navigate("/login");
    }
  }, [userRole, navigate]);

  // Initialize the active tab and restore from localStorage for admin
  useEffect(() => {
    if (userRole === "admin") {
      const savedTab = localStorage.getItem("activeAdminTab");
      if (savedTab) {
        setActiveTab(savedTab);
      }
    } else {
      setActiveTab("activity");
    }
  }, [userRole]);

  // Save active tab for admin users
  useEffect(() => {
    if (userRole === "admin") {
      localStorage.setItem("activeAdminTab", activeTab);
    }
  }, [activeTab, userRole]);

  // Fetch data based on user role
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let promises = [];
        switch (userRole) {
          case "admin":
            promises = [
              scholchatService.getAllStudents(),
              scholchatService.getAllParents(),
              scholchatService.getAllProfessors(),
              scholchatService.getAllClasses(),
              scholchatService.getAllEstablishments(),
              scholchatService.getAllUsers(),
            ];
            break;
          case "professor":
          case "repetiteur":
            promises = [
              scholchatService.getAllStudents(),
              scholchatService.getAllParents(),
              scholchatService.getAllProfessors(),
              scholchatService.getAllClasses(),
            ];
            break;
          case "student":
            promises = [scholchatService.getAllClasses()];
            break;
          case "parent":
            promises = [
              scholchatService.getAllStudents(),
              scholchatService.getAllClasses(),
            ];
            break;
          default:
            throw new Error("Invalid user role");
        }

        const results = await Promise.all(promises);
        updateStatsBasedOnRole(results);

        if (userRole === "admin") {
          generateChartData(results);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (userRole) {
      fetchData();
    }
  }, [userRole]);

  const updateStatsBasedOnRole = (results) => {
    switch (userRole) {
      case "admin":
        setStats({
          students: results[0],
          parents: results[1],
          professors: results[2],
          classes: results[3],
          establishments: results[4],
          users: results[5],
        });
        break;
      case "professor":
      case "repetiteur":
        setStats({
          students: results[0],
          parents: results[1],
          professors: results[2],
          classes: results[3],
          establishments: [],
          users: [],
        });
        break;
      case "student":
        setStats({
          students: [],
          parents: [],
          professors: [],
          classes: results[0],
          establishments: [],
          users: [],
        });
        break;
      case "parent":
        setStats({
          students: results[0],
          parents: [],
          professors: [],
          classes: results[1],
          establishments: [],
          users: [],
        });
        break;
    }
  };

  const generateChartData = (results = null) => {
    const studentsData = results ? results[0] : stats.students;
    const parentsData = results ? results[1] : stats.parents;
    const professorsData = results ? results[2] : stats.professors;

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString("default", { month: "short" });
    }).reverse();

    const newChartData = last6Months.map((month) => ({
      month,
      students: studentsData.filter(
        (s) =>
          new Date(s.dateCreation).toLocaleString("default", {
            month: "short",
          }) === month
      ).length,
      parents: parentsData.filter(
        (p) =>
          new Date(p.dateCreation).toLocaleString("default", {
            month: "short",
          }) === month
      ).length,
      professors: professorsData.filter(
        (p) =>
          new Date(p.dateCreation).toLocaleString("default", {
            month: "short",
          }) === month
      ).length,
    }));

    setChartData(newChartData);
  };

  const getRecentActivity = () => {
    const allActivities = [];

    // Only show all activities for admin
    if (userRole === "admin") {
      if (stats.students && stats.students.length) {
        allActivities.push(
          ...stats.students.map((s) => ({
            type: "student",
            date: new Date(s.dateCreation),
            text: `New student ${s.prenom} ${s.nom} registered`,
          }))
        );
      }
      if (stats.parents && stats.parents.length) {
        allActivities.push(
          ...stats.parents.map((p) => ({
            type: "parent",
            date: new Date(p.dateCreation),
            text: `New parent ${p.prenom} ${p.nom} joined`,
          }))
        );
      }
      if (stats.professors && stats.professors.length) {
        allActivities.push(
          ...stats.professors.map((p) => ({
            type: "professor",
            date: new Date(p.dateCreation),
            text: `New professor ${p.prenom} ${p.nom} added`,
          }))
        );
      }
    }

    return allActivities.sort((a, b) => b.date - a.date).slice(0, 5);
  };

  // This function renders content based ONLY on the activeTab state for admin users
  const renderAdminContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardCharts
            chartData={chartData}
            recentActivities={getRecentActivity()}
            isDark={isDark}
            themes={themes}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
            userRole={userRole}
          />
        );
      case "students":
        return <StudentPage stats={stats.students} userRole={userRole} />;
      case "professors":
        return <ProfessorPage stats={stats.professors} userRole={userRole} />;
      case "parents":
        return <ParentPage stats={stats.parents} userRole={userRole} />;
      case "classes":
        return <ClassesPage stats={stats.classes} userRole={userRole} />;
      default:
        return (
          <DashboardCharts
            chartData={chartData}
            recentActivities={getRecentActivity()}
            isDark={isDark}
            themes={themes}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
            userRole={userRole}
          />
        );
    }
  };

  // Non-admin users still use React Router
  const renderRouterContent = () => {
    return (
      <Routes>
        <Route
          path="/"
          element={
            <ActivityFeed
              userRole={userRole}
              isDark={isDark}
              themes={themes}
              currentTheme={currentTheme}
              colorSchemes={colorSchemes}
            />
          }
        />
        <Route
          path="/professors"
          element={
            <ProfessorPage stats={stats.professors} userRole={userRole} />
          }
        />
        <Route
          path="/students"
          element={<StudentPage stats={stats.students} userRole={userRole} />}
        />
        <Route
          path="/parents"
          element={<ParentPage stats={stats.parents} userRole={userRole} />}
        />
        <Route
          path="/classes"
          element={<ClassesPage stats={stats.classes} userRole={userRole} />}
        />
        <Route path="/professor-dashboard" element={<ProfessorDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route
          path="/email"
          element={
            <EmailDashboard
              isDark={isDark}
              currentTheme={currentTheme}
              colorSchemes={colorSchemes}
            />
          }
        />
      </Routes>
    );
  };

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return <div className="text-red-500 text-center p-4">Error: {error}</div>;
    }

    // For admin, use state-based navigation ONLY (completely decoupled from router)
    if (userRole === "admin") {
      return renderAdminContent();
    }

    // For other users, use the router-based approach
    return renderRouterContent();
  };

  // If no user role is found, redirect to login
  if (!userRole) {
    return <Navigate to="/login" />;
  }

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
        userRole={userRole}
        navigate={navigate}
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
          {/* Only render DashboardStats for admin users */}
          {userRole === "admin" ? (
            <DashboardStats
              stats={stats}
              isDark={isDark}
              themes={themes}
              currentTheme={currentTheme}
              colorSchemes={colorSchemes}
              setActiveTab={setActiveTab}
              onViewAll={(tabName) => setActiveTab(tabName)}
              userRole={userRole}
            />
          ) : (
            (userRole === "parent" || userRole === "student") && (
              <StudentParentStats
                stats={stats}
                isDark={isDark}
                themes={themes}
                currentTheme={currentTheme}
                userRole={userRole}
              />
            )
          )}
          <div className={`${userRole === "admin" ? "mt-8" : ""}`}>
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layoute;
