import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BookOpen,
  TrendingUp,
  MessageCircle,
  Award,
  Target,
  Bell,
  User,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Calendar,
  Clock,
  RefreshCw,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import parentService from "../../../../services/parentService";
import AccederService from "../../../../services/accederService";
import { coursProgrammerService } from "../../../../services/coursProgrammerService";

const StudentParentStats = ({
  isDark = false,
  themes,
  currentTheme,
  userRole = "parent",
  setActiveTab,
}) => {
  const isMobile = useSelector((state) => state.ui.isMobile);
  const userId = localStorage.getItem("userId");

  // Real data states
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Child-specific data
  const [childClasses, setChildClasses] = useState([]);
  const [childCourses, setChildCourses] = useState([]);
  const [childNotifications, setChildNotifications] = useState([]);

  // For student role - fetch own data
  const [ownClasses, setOwnClasses] = useState([]);
  const [ownCourses, setOwnCourses] = useState([]);

  // Load children for parent, or own data for student
  const loadInitialData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    try {
      if (userRole === "parent") {
        const childrenData = await parentService.getChildren(userId);
        setChildren(childrenData);
        if (childrenData.length > 0) {
          setSelectedChild(childrenData[0]);
        }
      } else {
        // Student - load own data
        const [classes, courses] = await Promise.allSettled([
          AccederService.obtenirClassesAccessibles(userId),
          coursProgrammerService.obtenirProgrammationParParticipant(userId),
        ]);
        setOwnClasses(classes.status === "fulfilled" ? classes.value || [] : []);
        setOwnCourses(courses.status === "fulfilled" ? courses.value || [] : []);
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  }, [userId, userRole]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load data for selected child
  const loadChildData = useCallback(async (child) => {
    if (!child?.id) return;

    try {
      const [classes, courses, notifications] = await Promise.allSettled([
        AccederService.obtenirClassesAccessibles(child.id),
        coursProgrammerService.obtenirProgrammationParParticipant(child.id),
        parentService.getMyNotifications(),
      ]);

      setChildClasses(classes.status === "fulfilled" ? classes.value || [] : []);
      setChildCourses(courses.status === "fulfilled" ? courses.value || [] : []);
      setChildNotifications(notifications.status === "fulfilled" ? notifications.value || [] : []);
    } catch (err) {
      console.error("Error loading child data:", err);
    }
  }, []);

  // When selected child changes, reload their data
  useEffect(() => {
    if (selectedChild && userRole === "parent") {
      loadChildData(selectedChild);
    }
  }, [selectedChild, loadChildData, userRole]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (userRole === "parent" && selectedChild) {
      await loadChildData(selectedChild);
    } else {
      await loadInitialData();
    }
    setRefreshing(false);
  };

  // Compute stats based on role
  const currentClasses = userRole === "parent" ? childClasses : ownClasses;
  const currentCourses = userRole === "parent" ? childCourses : ownCourses;
  const currentNotifications = childNotifications;

  const upcomingCourses = currentCourses.filter((c) => {
    const courseDate = new Date(c.dateCoursPrevue);
    return courseDate > new Date() && c.etatCoursProgramme === "PLANIFIE";
  });

  const completedCourses = currentCourses.filter(
    (c) => c.etatCoursProgramme === "TERMINE"
  );

  const inProgressCourses = currentCourses.filter(
    (c) => c.etatCoursProgramme === "EN_COURS"
  );

  const unreadNotifications = currentNotifications.filter((n) => !n.read);

  // Chart data - courses by class
  const coursesByClassData = currentClasses.map((classe) => ({
    name: classe.nom?.length > 12 ? classe.nom.substring(0, 12) + "..." : classe.nom || "Classe",
    courses: currentCourses.filter((c) =>
      c.classesIds?.includes(classe.id) || c.classeId === classe.id
    ).length,
  }));

  // Course status distribution
  const courseStatusData = [
    { name: "Terminés", value: completedCourses.length, color: "#10B981" },
    { name: "En cours", value: inProgressCourses.length, color: "#3B82F6" },
    { name: "Planifiés", value: upcomingCourses.length, color: "#F59E0B" },
  ].filter((d) => d.value > 0);

  const getThemeColors = () => {
    if (isDark) {
      return {
        cardBg: themes?.dark?.cardBg || "bg-gray-800",
        textPrimary: "text-white",
        textSecondary: "text-gray-300",
        border: "border-gray-700",
      };
    }
    return {
      cardBg: themes?.light?.cardBg || "bg-white",
      textPrimary: "text-gray-900",
      textSecondary: "text-gray-600",
      border: "border-gray-200",
    };
  };

  const themeColors = getThemeColors();

  const StatCard = ({ title, value, icon: Icon, color, subtitle, onClick }) => (
    <motion.div
      whileHover={isMobile ? {} : { y: -5, scale: 1.02 }}
      onClick={onClick}
      className={`${isDark ? "bg-gray-800/80 border-white/5" : "bg-white/80 border-white/20"} backdrop-blur-xl rounded-2xl shadow-xl border ${isMobile ? "p-3" : "p-5 sm:p-6"} group transition-all duration-300 relative overflow-hidden ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 ${color}/10 rounded-full blur-2xl -mr-12 -mt-12`}></div>

      <div className={`flex ${isMobile ? "flex-col gap-2" : "items-center justify-between"} relative z-10`}>
        <div className={`flex items-center ${isMobile ? "justify-between" : ""}`}>
          <div className={`${isMobile ? "p-2 rounded-xl" : "p-4 rounded-2xl"} ${color} shadow-lg transition-transform duration-300 ${isMobile ? "order-2" : ""}`}>
            <Icon className={`${isMobile ? "h-4 w-4" : "h-6 w-6"} text-white`} />
          </div>
          {isMobile && (
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"} order-1`}>
              {title}
            </p>
          )}
        </div>
        <div className={`flex-1 min-w-0 ${isMobile ? "" : "pr-4"}`}>
          {!isMobile && (
            <p className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-500"} mb-1`}>
              {title}
            </p>
          )}
          <p className={`${isMobile ? "text-xl" : "text-2xl sm:text-3xl"} font-black ${isDark ? "text-white" : "text-slate-900"} leading-none`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={`text-[10px] sm:text-xs ${isDark ? "text-gray-400" : "text-gray-500"} ${isMobile ? "mt-1" : "mt-2"} flex items-center gap-1 font-medium`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );

  const StudentSelector = () => {
    if (children.length === 0) {
      return (
        <div className={`px-4 py-2 rounded-lg border ${themeColors.border} ${themeColors.cardBg}`}>
          <p className={`text-sm ${themeColors.textSecondary}`}>Aucun enfant associé</p>
        </div>
      );
    }

    return (
      <div className="relative">
        <button
          onClick={() => setShowStudentDropdown(!showStudentDropdown)}
          className={`flex items-center space-x-3 px-4 py-2 rounded-lg border ${themeColors.border} ${themeColors.cardBg} hover:shadow-md transition-all duration-200`}
        >
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm`}>
            {(selectedChild?.prenom || "E")[0].toUpperCase()}
          </div>
          <div className="text-left">
            <p className={`font-medium ${themeColors.textPrimary}`}>
              {selectedChild?.prenom} {selectedChild?.nom}
            </p>
            <p className={`text-xs ${themeColors.textSecondary}`}>
              {selectedChild?.niveau || selectedChild?.email || ""}
              {childClasses.length > 0 && ` - ${childClasses.length} classe${childClasses.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <ChevronDown
            className={`h-4 w-4 ${themeColors.textSecondary} transition-transform ${showStudentDropdown ? "rotate-180" : ""}`}
          />
        </button>

        {showStudentDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowStudentDropdown(false)}
            />
            <div
              className={`absolute top-full mt-2 w-full ${themeColors.cardBg} rounded-lg border ${themeColors.border} shadow-lg z-20 max-h-60 overflow-y-auto`}
            >
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => {
                    setSelectedChild(child);
                    setShowStudentDropdown(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    selectedChild?.id === child.id
                      ? isDark ? "bg-gray-700" : "bg-blue-50"
                      : isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm`}>
                    {(child.prenom || "E")[0].toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${themeColors.textPrimary}`}>
                      {child.prenom} {child.nom}
                    </p>
                    <p className={`text-xs ${themeColors.textSecondary}`}>
                      {child.niveau || child.email || ""}
                    </p>
                  </div>
                  {selectedChild?.id === child.id && (
                    <CheckCircle className="h-4 w-4 text-blue-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const UpcomingCoursesList = () => {
    const displayCourses = upcomingCourses.slice(0, 5);

    if (displayCourses.length === 0) {
      return (
        <div className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} ${isMobile ? "p-3" : "p-6"}`}>
          <h3 className={`${isMobile ? "text-sm" : "text-lg"} font-semibold ${themeColors.textPrimary} mb-3`}>
            Cours à Venir
          </h3>
          <div className="text-center py-6">
            <Calendar className={`h-10 w-10 mx-auto mb-2 ${themeColors.textSecondary} opacity-40`} />
            <p className={`text-sm ${themeColors.textSecondary}`}>
              Aucun cours planifié pour le moment
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} ${isMobile ? "p-3" : "p-6"}`}>
        <div className={`flex justify-between items-center ${isMobile ? "mb-3" : "mb-4"}`}>
          <h3 className={`${isMobile ? "text-sm" : "text-lg"} font-semibold ${themeColors.textPrimary}`}>
            Cours à Venir
          </h3>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab("cours")}
              className="text-blue-500 hover:text-blue-600 text-xs sm:text-sm font-medium"
            >
              Voir tout
            </button>
          )}
        </div>
        <div className="space-y-3">
          {displayCourses.map((course) => {
            const courseDate = new Date(course.dateCoursPrevue);
            return (
              <div
                key={course.id}
                className={`flex items-center space-x-3 p-3 rounded-lg ${isDark ? "bg-gray-700/50" : "bg-gray-50"} transition-colors`}
              >
                <div className={`p-2 rounded-full ${isDark ? "bg-gray-600" : "bg-blue-100"}`}>
                  <BookOpen className={`h-4 w-4 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${themeColors.textPrimary} truncate`}>
                    {course.coursNom || course.description || "Cours programmé"}
                  </p>
                  <p className={`text-xs ${themeColors.textSecondary}`}>
                    {course.lieu || ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-medium ${themeColors.textPrimary}`}>
                    {courseDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                  <p className={`text-[10px] ${themeColors.textSecondary}`}>
                    {courseDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const ClassesList = () => {
    if (currentClasses.length === 0) {
      return (
        <div className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} ${isMobile ? "p-3" : "p-6"}`}>
          <h3 className={`${isMobile ? "text-sm" : "text-lg"} font-semibold ${themeColors.textPrimary} mb-3`}>
            Classes
          </h3>
          <div className="text-center py-6">
            <Users className={`h-10 w-10 mx-auto mb-2 ${themeColors.textSecondary} opacity-40`} />
            <p className={`text-sm ${themeColors.textSecondary}`}>
              {userRole === "parent"
                ? "Cet enfant n'est inscrit dans aucune classe"
                : "Vous n'êtes inscrit dans aucune classe"}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} ${isMobile ? "p-3" : "p-6"}`}>
        <div className={`flex justify-between items-center ${isMobile ? "mb-3" : "mb-4"}`}>
          <h3 className={`${isMobile ? "text-sm" : "text-lg"} font-semibold ${themeColors.textPrimary}`}>
            Classes ({currentClasses.length})
          </h3>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab("classes")}
              className="text-blue-500 hover:text-blue-600 text-xs sm:text-sm font-medium"
            >
              Gérer
            </button>
          )}
        </div>
        <div className="space-y-2">
          {currentClasses.map((classe) => {
            const classCourseCount = currentCourses.filter(
              (c) => c.classesIds?.includes(classe.id) || c.classeId === classe.id
            ).length;

            return (
              <div
                key={classe.id}
                className={`flex items-center space-x-3 p-3 rounded-lg ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"} transition-colors`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {(classe.nom || "C")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${themeColors.textPrimary} truncate`}>
                    {classe.nom}
                  </p>
                  <p className={`text-xs ${themeColors.textSecondary}`}>
                    {classe.niveau || ""} {classCourseCount > 0 ? `- ${classCourseCount} cours` : ""}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                  classe.etat === "ACTIF"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {classe.etat === "ACTIF" ? "Actif" : classe.etat}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const NotificationsList = () => {
    if (userRole !== "parent") return null;

    const displayNotifications = currentNotifications.slice(0, 5);

    if (displayNotifications.length === 0) {
      return (
        <div className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} ${isMobile ? "p-3" : "p-6"}`}>
          <h3 className={`${isMobile ? "text-sm" : "text-lg"} font-semibold ${themeColors.textPrimary} mb-3`}>
            Notifications
          </h3>
          <div className="text-center py-6">
            <Bell className={`h-10 w-10 mx-auto mb-2 ${themeColors.textSecondary} opacity-40`} />
            <p className={`text-sm ${themeColors.textSecondary}`}>
              Aucune notification
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} ${isMobile ? "p-3" : "p-6"}`}>
        <div className={`flex justify-between items-center ${isMobile ? "mb-3" : "mb-4"}`}>
          <h3 className={`${isMobile ? "text-sm" : "text-lg"} font-semibold ${themeColors.textPrimary}`}>
            Notifications
            {unreadNotifications.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadNotifications.length}
              </span>
            )}
          </h3>
        </div>
        <div className="space-y-2">
          {displayNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start space-x-3 p-3 rounded-lg ${
                !notif.read
                  ? isDark ? "bg-blue-900/20" : "bg-blue-50"
                  : isDark ? "bg-gray-700/30" : ""
              } transition-colors`}
            >
              <div className={`p-1.5 rounded-full flex-shrink-0 ${
                !notif.read
                  ? "bg-blue-100 text-blue-600"
                  : isDark ? "bg-gray-600 text-gray-400" : "bg-gray-100 text-gray-500"
              }`}>
                <Bell className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${themeColors.textPrimary} truncate`}>
                  {notif.title || "Notification"}
                </p>
                <p className={`text-xs ${themeColors.textSecondary} truncate`}>
                  {notif.message}
                </p>
              </div>
              <p className={`text-[10px] ${themeColors.textSecondary} flex-shrink-0`}>
                {notif.createdAt
                  ? new Date(notif.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                  : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} flex items-center justify-center`}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className={`mt-4 font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            Chargement des données...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} flex items-center justify-center`}>
        <div className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} p-8 max-w-md w-full text-center`}>
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className={`font-semibold ${themeColors.textPrimary} mb-2`}>
            Erreur de chargement
          </h3>
          <p className={`text-sm ${themeColors.textSecondary} mb-4`}>{error}</p>
          <button
            onClick={loadInitialData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
      {/* Header */}
      <div className={`${themeColors.cardBg} shadow-sm border-b ${themeColors.border}`}>
        <div className={`max-w-7xl mx-auto ${isMobile ? "px-3" : "px-4 sm:px-6 lg:px-8"}`}>
          <div className={`flex ${isMobile ? "flex-col gap-3 py-3" : "justify-between items-center py-6"}`}>
            <div>
              <h1 className={`${isMobile ? "text-lg" : "text-3xl"} font-bold ${themeColors.textPrimary}`}>
                {userRole === "student"
                  ? "Mon Tableau de Bord"
                  : "Suivi Scolaire"}
              </h1>
              <p className={`${themeColors.textSecondary} ${isMobile ? "text-xs mt-0.5" : "mt-1"}`}>
                {userRole === "student"
                  ? "Suivez vos progrès et activités scolaires"
                  : selectedChild
                  ? `Suivi de ${selectedChild.prenom} ${selectedChild.nom || ""}`
                  : "Sélectionnez un enfant pour voir ses données"}
              </p>
            </div>
            <div className={`flex items-center ${isMobile ? "gap-2" : "space-x-4"}`}>
              {userRole === "parent" && <StudentSelector />}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`${isMobile ? "p-2" : "p-2.5"} rounded-lg border ${themeColors.border} ${themeColors.cardBg} hover:shadow-md transition-all`}
              >
                <RefreshCw className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} ${themeColors.textSecondary} ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto ${isMobile ? "px-3 py-3" : "px-4 sm:px-6 lg:px-8 py-8"}`}>
        {/* No children message for parent */}
        {userRole === "parent" && children.length === 0 && (
          <div className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} p-8 text-center`}>
            <Users className={`h-16 w-16 mx-auto mb-4 ${themeColors.textSecondary} opacity-40`} />
            <h3 className={`text-xl font-semibold ${themeColors.textPrimary} mb-2`}>
              Aucun enfant associé
            </h3>
            <p className={`${themeColors.textSecondary} mb-4`}>
              Pour suivre la scolarité de vos enfants, veuillez d'abord demander
              l'accès à leurs classes via un code d'activation.
            </p>
            {setActiveTab && (
              <button
                onClick={() => setActiveTab("classes")}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Accéder aux Classes
              </button>
            )}
          </div>
        )}

        {/* Stats Cards */}
        {(userRole !== "parent" || children.length > 0) && (
          <>
            <div className={`grid ${isMobile ? "grid-cols-2 gap-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"} mb-4 sm:mb-8`}>
              <StatCard
                title="Classes"
                value={currentClasses.length}
                icon={BookOpen}
                color="bg-blue-500"
                subtitle={`${currentClasses.filter((c) => c.etat === "ACTIF").length} active${currentClasses.filter((c) => c.etat === "ACTIF").length > 1 ? "s" : ""}`}
                onClick={setActiveTab ? () => setActiveTab("classes") : undefined}
              />
              <StatCard
                title="Cours Programmés"
                value={currentCourses.length}
                icon={Calendar}
                color="bg-green-500"
                subtitle={`${upcomingCourses.length} à venir`}
                onClick={setActiveTab ? () => setActiveTab("cours") : undefined}
              />
              <StatCard
                title="Cours Terminés"
                value={completedCourses.length}
                icon={CheckCircle}
                color="bg-purple-500"
                subtitle={currentCourses.length > 0
                  ? `${Math.round((completedCourses.length / currentCourses.length) * 100)}% du total`
                  : "Aucun cours"
                }
              />
              {userRole === "parent" ? (
                <StatCard
                  title="Notifications"
                  value={unreadNotifications.length}
                  icon={Bell}
                  color="bg-orange-500"
                  subtitle={`${currentNotifications.length} au total`}
                />
              ) : (
                <StatCard
                  title="En Cours"
                  value={inProgressCourses.length}
                  icon={Clock}
                  color="bg-orange-500"
                  subtitle="Cours en cours"
                />
              )}
            </div>

            {/* Charts Row */}
            {currentCourses.length > 0 && (
              <div className={`grid grid-cols-1 ${isMobile ? "gap-3" : "lg:grid-cols-2 gap-6"} mb-4 sm:mb-8`}>
                {/* Courses by Class */}
                {coursesByClassData.length > 0 && (
                  <div className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} ${isMobile ? "p-3" : "p-6"}`}>
                    <h3 className={`${isMobile ? "text-sm" : "text-lg"} font-semibold ${themeColors.textPrimary} mb-3`}>
                      Cours par Classe
                    </h3>
                    <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
                      <BarChart data={coursesByClassData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: isDark ? "#D1D5DB" : "#6B7280", fontSize: isMobile ? 9 : 12 }}
                        />
                        <YAxis
                          tick={{ fill: isDark ? "#D1D5DB" : "#6B7280", fontSize: isMobile ? 9 : 12 }}
                          width={isMobile ? 28 : 40}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                            border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
                            borderRadius: "8px",
                            color: isDark ? "#F9FAFB" : "#111827",
                          }}
                        />
                        <Bar dataKey="courses" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Cours" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Course Status Distribution */}
                {courseStatusData.length > 0 && (
                  <div className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} ${isMobile ? "p-3" : "p-6"}`}>
                    <h3 className={`${isMobile ? "text-sm" : "text-lg"} font-semibold ${themeColors.textPrimary} mb-3`}>
                      État des Cours
                    </h3>
                    <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
                      <PieChart>
                        <Pie
                          data={courseStatusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobile ? 60 : 80}
                          fill="#8884d8"
                          dataKey="value"
                          label={isMobile ? false : ({ name, value }) => `${name} (${value})`}
                        >
                          {courseStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                            border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className={`flex justify-center ${isMobile ? "gap-3 mt-1" : "gap-4 mt-2"}`}>
                      {courseStatusData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className={`${isMobile ? "text-[10px]" : "text-xs"} font-medium ${themeColors.textSecondary}`}>
                            {entry.name} ({entry.value})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom section - Classes, Upcoming Courses, Notifications */}
            <div className={`grid grid-cols-1 ${isMobile ? "gap-3" : "lg:grid-cols-3 gap-6"}`}>
              <ClassesList />
              <UpcomingCoursesList />
              <NotificationsList />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentParentStats;
