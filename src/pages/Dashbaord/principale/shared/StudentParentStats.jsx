import React, { useState, useEffect } from "react";
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
  LineChart,
  Line,
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";

const StudentParentStats = ({
  stats,
  isDark = false,
  themes,
  currentTheme,
  userRole = "parent",
  currentUser,
  childId,
}) => {
  const isMobile = useSelector((state) => state.ui.isMobile);
  // Mock students data for parent prototype
  const [parentStudents] = useState([
    {
      id: 1,
      prenom: "Enfant 1",
      nom: "",
      classe: "6ème A",
      age: 11,
      avatar: "👧",
    },
    {
      id: 2,
      prenom: "Enfant 2",
      nom: "",
      classe: "4ème B",
      age: 14,
      avatar: "👦",
    },
  ]);

  const [selectedStudent, setSelectedStudent] = useState(parentStudents[0]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Different stats for each student
  const [studentStats] = useState({
    1: {
      // First child's stats
      myClasses: 5,
      myTeachers: 7,
      unreadMessages: 2,
      upcomingEvents: 3,
      completedActivities: 12,
      totalActivities: 18,
      averageGrade: 78,
      attendanceRate: 96,
      lastLoginDays: 1,
      notifications: 3,
      performanceData: [
        { subject: "Maths", score: 75, target: 70 },
        { subject: "Sciences", score: 82, target: 80 },
        { subject: "Français", score: 88, target: 85 },
        { subject: "Histoire", score: 70, target: 75 },
        { subject: "Anglais", score: 85, target: 80 },
        { subject: "Sport", score: 92, target: 85 },
      ],
      attendanceData: [
        { month: "Sep", attendance: 98 },
        { month: "Oct", attendance: 94 },
        { month: "Nov", attendance: 96 },
        { month: "Déc", attendance: 92 },
        { month: "Jan", attendance: 98 },
        { month: "Fév", attendance: 95 },
      ],
      recentActivity: [
        {
          id: 1,
          type: "message",
          title: "Message de l'enseignant",
          description: "Félicitations pour les progrès en mathématiques...",
          time: "Il y a 1 heure",
          icon: MessageCircle,
          color: "text-blue-500",
        },
        {
          id: 2,
          type: "assignment",
          title: "Devoir rendu",
          description: "Exercices de sciences soumis avec succès",
          time: "Il y a 3 heures",
          icon: CheckCircle,
          color: "text-green-500",
        },
        {
          id: 3,
          type: "grade",
          title: "Nouvelle note",
          description: "Note de français: 16/20",
          time: "Il y a 2 jours",
          icon: Award,
          color: "text-purple-500",
        },
      ],
    },
    2: {
      // Second child's stats
      myClasses: 6,
      myTeachers: 8,
      unreadMessages: 5,
      upcomingEvents: 1,
      completedActivities: 18,
      totalActivities: 22,
      averageGrade: 85,
      attendanceRate: 89,
      lastLoginDays: 3,
      notifications: 7,
      performanceData: [
        { subject: "Maths", score: 92, target: 85 },
        { subject: "Sciences", score: 88, target: 85 },
        { subject: "Français", score: 80, target: 78 },
        { subject: "Histoire", score: 85, target: 80 },
        { subject: "Anglais", score: 90, target: 85 },
        { subject: "Sport", score: 78, target: 80 },
      ],
      attendanceData: [
        { month: "Sep", attendance: 92 },
        { month: "Oct", attendance: 88 },
        { month: "Nov", attendance: 85 },
        { month: "Déc", attendance: 90 },
        { month: "Jan", attendance: 87 },
        { month: "Fév", attendance: 92 },
      ],
      recentActivity: [
        {
          id: 1,
          type: "message",
          title: "Message de l'enseignant",
          description: "Convocation pour entretien d'orientation...",
          time: "Il y a 30 minutes",
          icon: MessageCircle,
          color: "text-blue-500",
        },
        {
          id: 2,
          type: "assignment",
          title: "Projet rendu",
          description: "Projet de physique-chimie terminé",
          time: "Il y a 1 jour",
          icon: CheckCircle,
          color: "text-green-500",
        },
        {
          id: 3,
          type: "grade",
          title: "Nouvelle note",
          description: "Note de mathématiques: 18/20",
          time: "Il y a 1 jour",
          icon: Award,
          color: "text-purple-500",
        },
      ],
    },
  });

  const [localStats, setLocalStats] = useState(
    studentStats[selectedStudent.id]
  );
  const [isLoading] = useState(false);
  const [error] = useState(null);

  const [performanceData, setPerformanceData] = useState(
    localStats.performanceData
  );
  const [attendanceData, setAttendanceData] = useState(
    localStats.attendanceData
  );
  const [recentActivity, setRecentActivity] = useState(
    localStats.recentActivity
  );

  // Update data when student selection changes
  useEffect(() => {
    const currentStudentStats = studentStats[selectedStudent.id];
    setLocalStats(currentStudentStats);
    setPerformanceData(currentStudentStats.performanceData);
    setAttendanceData(currentStudentStats.attendanceData);
    setRecentActivity(currentStudentStats.recentActivity);
  }, [selectedStudent, studentStats]);

  const activityDistribution = [
    {
      name: "Complétées",
      value: localStats.completedActivities,
      color: "#10B981",
    },
    {
      name: "En cours",
      value: localStats.totalActivities - localStats.completedActivities,
      color: "#F59E0B",
    },
  ];

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

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <motion.div
      whileHover={isMobile ? {} : { y: -5, scale: 1.02 }}
      className={`${isDark ? 'bg-gray-800/80 border-white/5' : 'bg-white/80 border-white/20'} backdrop-blur-xl rounded-2xl shadow-xl border ${isMobile ? 'p-3' : 'p-5 sm:p-6'} group transition-all duration-300 relative overflow-hidden`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 ${color.replace('bg-', 'bg-')}/10 rounded-full blur-2xl -mr-12 -mt-12`}></div>

      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'} relative z-10`}>
        <div className={`flex items-center ${isMobile ? 'justify-between' : ''}`}>
          <div className={`${isMobile ? 'p-2 rounded-xl' : 'p-4 rounded-2xl'} ${color} shadow-lg transition-transform duration-300 ${isMobile ? 'order-2' : ''}`}>
            <Icon className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-white`} />
          </div>
          {isMobile && (
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'} order-1`}>
              {title}
            </p>
          )}
        </div>
        <div className={`flex-1 min-w-0 ${isMobile ? '' : 'pr-4'}`}>
          {!isMobile && (
            <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
              {title}
            </p>
          )}
          <p className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} font-black ${isDark ? 'text-white' : 'text-slate-900'} leading-none`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={`text-[10px] sm:text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} ${isMobile ? 'mt-1' : 'mt-2'} flex items-center gap-1 font-medium`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {trend && !isMobile && (
        <div className="flex items-center mt-6 pt-4 border-t border-gray-100/10 text-xs relative z-10 font-bold">
          <div className="flex items-center bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full mr-2">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>{trend}</span>
          </div>
          <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} italic uppercase tracking-tighter`}>ce mois</span>
        </div>
      )}
    </motion.div>
  );

  const ActivityCard = ({ activity }) => (
    <div
      className={`flex items-center space-x-3 p-3 rounded-lg hover:${
        isDark ? "bg-gray-700" : "bg-gray-50"
      } transition-colors`}
    >
      <div
        className={`p-2 rounded-full ${isDark ? "bg-gray-600" : "bg-gray-100"}`}
      >
        <activity.icon className={`h-4 w-4 ${activity.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${themeColors.textPrimary} truncate`}
        >
          {activity.title}
        </p>
        <p className={`text-xs ${themeColors.textSecondary} truncate`}>
          {activity.description}
        </p>
      </div>
      <div className={`text-xs ${themeColors.textSecondary} whitespace-nowrap`}>
        {activity.time}
      </div>
    </div>
  );

  const ProgressRing = ({ percentage, size = 60, strokeWidth = 4 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isDark ? "#374151" : "#E5E7EB"}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#10B981"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300"
          />
        </svg>
        <span
          className={`absolute text-sm font-semibold ${themeColors.textPrimary}`}
        >
          {percentage}%
        </span>
      </div>
    );
  };

  const StudentSelector = () => (
    <div className="relative">
      <button
        onClick={() => setShowStudentDropdown(!showStudentDropdown)}
        className={`flex items-center space-x-3 px-4 py-2 rounded-lg border ${themeColors.border} ${themeColors.cardBg} hover:shadow-md transition-all duration-200`}
      >
        <User className={`h-5 w-5 ${themeColors.textSecondary}`} />
        <div className="text-left">
          <p className={`font-medium ${themeColors.textPrimary}`}>
            {selectedStudent.prenom}
          </p>
          <p className={`text-sm ${themeColors.textSecondary}`}>
            {selectedStudent.classe} • {selectedStudent.age} ans
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 ${
            themeColors.textSecondary
          } transition-transform ${showStudentDropdown ? "rotate-180" : ""}`}
        />
      </button>

      {showStudentDropdown && (
        <div
          className={`absolute top-full mt-2 w-full ${themeColors.cardBg} rounded-lg border ${themeColors.border} shadow-lg z-10`}
        >
          {parentStudents.map((student) => (
            <button
              key={student.id}
              onClick={() => {
                setSelectedStudent(student);
                setShowStudentDropdown(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 hover:${
                isDark ? "bg-gray-700" : "bg-gray-50"
              } transition-colors first:rounded-t-lg last:rounded-b-lg ${
                selectedStudent.id === student.id
                  ? isDark
                    ? "bg-gray-700"
                    : "bg-gray-50"
                  : ""
              }`}
            >
              <User className={`h-5 w-5 ${themeColors.textSecondary}`} />
              <div className="text-left">
                <p className={`font-medium ${themeColors.textPrimary}`}>
                  {student.prenom}
                </p>
                <p className={`text-sm ${themeColors.textSecondary}`}>
                  {student.classe} • {student.age} ans
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        } flex items-center justify-center`}
      >
        <div
          className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} p-8`}
        >
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className={themeColors.textPrimary}>
              Chargement des données...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        } flex items-center justify-center`}
      >
        <div
          className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} p-8`}
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className={`font-semibold ${themeColors.textPrimary}`}>
                Erreur de chargement
              </h3>
              <p className={`text-sm ${themeColors.textSecondary}`}>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      } transition-colors duration-300`}
    >
      {/* Header */}
      <div
        className={`${themeColors.cardBg} shadow-sm border-b ${themeColors.border}`}
      >
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-3' : 'px-4 sm:px-6 lg:px-8'}`}>
          <div className={`flex ${isMobile ? 'flex-col gap-3 py-3' : 'justify-between items-center py-6'}`}>
            <div>
              <h1 className={`${isMobile ? 'text-lg' : 'text-3xl'} font-bold ${themeColors.textPrimary}`}>
                {userRole === "student"
                  ? "Mon Tableau de Bord"
                  : userRole === "parent"
                  ? "Suivi Scolaire"
                  : userRole === "teacher"
                  ? "Tableau de Bord Enseignant"
                  : "Tableau de Bord"}
              </h1>
              <p className={`${themeColors.textSecondary} ${isMobile ? 'text-xs mt-0.5' : 'mt-1'}`}>
                {userRole === "student"
                  ? "Suivez vos progrès et activités scolaires"
                  : userRole === "parent"
                  ? "Suivez les progrès scolaires de votre enfant"
                  : userRole === "teacher"
                  ? "Gérez vos classes et suivez les progrès"
                  : "Tableau de bord utilisateur"}
              </p>
            </div>
            <div className={`flex items-center ${isMobile ? 'gap-2' : 'space-x-4'}`}>
              {userRole === "parent" && <StudentSelector />}
              <div className="relative">
                <Bell
                  className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} ${themeColors.textSecondary} hover:${themeColors.textPrimary} cursor-pointer transition-colors`}
                />
                {localStats.unreadMessages > 0 && (
                  <span className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full ${isMobile ? 'h-4 w-4 text-[10px]' : 'h-5 w-5'} flex items-center justify-center`}>
                    {localStats.unreadMessages}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-3 py-3' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        {/* Quick Stats Cards */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'} mb-4 sm:mb-8`}>
          <StatCard
            title={userRole === "teacher" ? "Mes Classes" : "Classes"}
            value={localStats.myClasses}
            icon={BookOpen}
            color="bg-blue-500"
            subtitle="Classes actives"
          />
          <StatCard
            title="Messages"
            value={localStats.unreadMessages}
            icon={MessageCircle}
            color="bg-green-500"
            subtitle="Non lus"
          />
          <StatCard
            title="Activités"
            value={`${localStats.completedActivities}/${localStats.totalActivities}`}
            icon={Target}
            color="bg-purple-500"
            subtitle="Complétées"
          />
          <StatCard
            title={userRole === "parent" ? "Moyenne" : "Ma Moyenne"}
            value={`${localStats.averageGrade}/100`}
            icon={Award}
            color="bg-orange-500"
            trend="+5%"
            subtitle="Cette période"
          />
        </div>

        {/* Progress Overview */}
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'lg:grid-cols-3 gap-6'} mb-4 sm:mb-8`}>
          {/* Performance Chart */}
          <div
            className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} ${isMobile ? 'p-3' : 'p-6'} lg:col-span-2`}
          >
            <h3
              className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold ${themeColors.textPrimary} mb-3`}
            >
              Performance par Matière
            </h3>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
              <BarChart data={performanceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#374151" : "#E5E7EB"}
                />
                <XAxis
                  dataKey="subject"
                  tick={{ fill: isDark ? "#D1D5DB" : "#6B7280", fontSize: isMobile ? 9 : 12 }}
                />
                <YAxis
                  tick={{ fill: isDark ? "#D1D5DB" : "#6B7280", fontSize: isMobile ? 9 : 12 }}
                  width={isMobile ? 28 : 40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
                    borderRadius: "8px",
                    color: isDark ? "#F9FAFB" : "#111827",
                    fontSize: isMobile ? 11 : 14,
                  }}
                />
                <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="target"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  opacity={0.6}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Progress Indicators */}
          <div
            className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} ${isMobile ? 'p-3' : 'p-6'}`}
          >
            <h3
              className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold ${themeColors.textPrimary} ${isMobile ? 'mb-3' : 'mb-6'}`}
            >
              Indicateurs de Progrès
            </h3>
            <div className={isMobile ? 'flex justify-around' : 'space-y-6'}>
              <div className="text-center">
                <ProgressRing percentage={localStats.attendanceRate} size={isMobile ? 48 : 60} strokeWidth={isMobile ? 3 : 4} />
                <p
                  className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ${themeColors.textPrimary} mt-1`}
                >
                  Assiduité
                </p>
              </div>

              <div className="text-center">
                <ProgressRing
                  percentage={Math.round(
                    (localStats.completedActivities /
                      localStats.totalActivities) *
                      100
                  )}
                  size={isMobile ? 48 : 60}
                  strokeWidth={isMobile ? 3 : 4}
                />
                <p
                  className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ${themeColors.textPrimary} mt-1`}
                >
                  Activités
                </p>
              </div>

              <div className="text-center">
                <ProgressRing percentage={localStats.averageGrade} size={isMobile ? 48 : 60} strokeWidth={isMobile ? 3 : 4} />
                <p
                  className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ${themeColors.textPrimary} mt-1`}
                >
                  Performance
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'lg:grid-cols-2 gap-6'} mb-4 sm:mb-8`}>
          {/* Attendance Trend */}
          <div
            className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} ${isMobile ? 'p-3' : 'p-6'}`}
          >
            <h3
              className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold ${themeColors.textPrimary} mb-3`}
            >
              Évolution de l'Assiduité
            </h3>
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
              <LineChart data={attendanceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#374151" : "#E5E7EB"}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: isDark ? "#D1D5DB" : "#6B7280", fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis
                  tick={{ fill: isDark ? "#D1D5DB" : "#6B7280", fontSize: isMobile ? 10 : 12 }}
                  width={isMobile ? 28 : 40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
                    borderRadius: "8px",
                    color: isDark ? "#F9FAFB" : "#111827",
                    fontSize: isMobile ? 11 : 14,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#10B981"
                  strokeWidth={isMobile ? 2 : 3}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: isMobile ? 3 : 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Distribution */}
          <div
            className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} ${isMobile ? 'p-3' : 'p-6'}`}
          >
            <h3
              className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold ${themeColors.textPrimary} mb-3`}
            >
              Répartition des Activités
            </h3>
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
              <PieChart>
                <Pie
                  data={activityDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  label={isMobile ? false : ({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {activityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
                    borderRadius: "8px",
                    color: isDark ? "#F9FAFB" : "#111827",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {isMobile && (
              <div className="flex justify-center gap-4 mt-1">
                {activityDistribution.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className={`text-[10px] ${themeColors.textSecondary}`}>{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div
            className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} ${isMobile ? 'p-3' : 'p-6'}`}
          >
            <div className={`flex justify-between items-center ${isMobile ? 'mb-3' : 'mb-6'}`}>
              <h3
                className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold ${themeColors.textPrimary}`}
              >
                Activité Récente
              </h3>
              <button className="text-blue-500 hover:text-blue-600 text-xs sm:text-sm font-medium transition-colors">
                Voir tout
              </button>
            </div>
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentParentStats;
