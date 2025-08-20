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
  Users,
  GraduationCap,
  BookOpen,
  School,
  TrendingUp,
  UserCheck,
  MessageCircle,
  Clock,
  Mail,
  Calendar,
  Star,
  Award,
  Target,
  Activity,
  Bell,
  User,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

const StudentParentStats = ({
  stats,
  isDark = false,
  themes,
  currentTheme,
  userRole = "parent", // Default to parent for demo
  currentUser,
  childId,
}) => {
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
  const [studentStats, setStudentStats] = useState({
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    <div
      className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} p-6 hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${themeColors.textSecondary}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${themeColors.textPrimary} mt-2`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={`text-sm ${themeColors.textSecondary} mt-1`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4 text-sm">
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-green-600 font-medium">{trend}</span>
          <span className={`${themeColors.textSecondary} ml-1`}>ce mois</span>
        </div>
      )}
    </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className={`text-3xl font-bold ${themeColors.textPrimary}`}>
                {userRole === "student"
                  ? "Mon Tableau de Bord"
                  : userRole === "parent"
                  ? "Suivi Scolaire"
                  : userRole === "teacher"
                  ? "Tableau de Bord Enseignant"
                  : "Tableau de Bord"}
              </h1>
              <p className={`${themeColors.textSecondary} mt-1`}>
                {userRole === "student"
                  ? "Suivez vos progrès et activités scolaires"
                  : userRole === "parent"
                  ? "Suivez les progrès scolaires de votre enfant"
                  : userRole === "teacher"
                  ? "Gérez vos classes et suivez les progrès"
                  : "Tableau de bord utilisateur"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {userRole === "parent" && <StudentSelector />}
              <div className="relative">
                <Bell
                  className={`h-6 w-6 ${themeColors.textSecondary} hover:${themeColors.textPrimary} cursor-pointer transition-colors`}
                />
                {localStats.unreadMessages > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {localStats.unreadMessages}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Chart */}
          <div
            className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} p-6 lg:col-span-2`}
          >
            <h3
              className={`text-lg font-semibold ${themeColors.textPrimary} mb-4`}
            >
              Performance par Matière
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#374151" : "#E5E7EB"}
                />
                <XAxis
                  dataKey="subject"
                  tick={{ fill: isDark ? "#D1D5DB" : "#6B7280", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: isDark ? "#D1D5DB" : "#6B7280", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
                    borderRadius: "8px",
                    color: isDark ? "#F9FAFB" : "#111827",
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
            className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} p-6`}
          >
            <h3
              className={`text-lg font-semibold ${themeColors.textPrimary} mb-6`}
            >
              Indicateurs de Progrès
            </h3>
            <div className="space-y-6">
              <div className="text-center">
                <ProgressRing percentage={localStats.attendanceRate} />
                <p
                  className={`text-sm font-medium ${themeColors.textPrimary} mt-2`}
                >
                  Assiduité
                </p>
                <p className={`text-xs ${themeColors.textSecondary}`}>
                  Cette période
                </p>
              </div>

              <div className="text-center">
                <ProgressRing
                  percentage={Math.round(
                    (localStats.completedActivities /
                      localStats.totalActivities) *
                      100
                  )}
                />
                <p
                  className={`text-sm font-medium ${themeColors.textPrimary} mt-2`}
                >
                  Activités
                </p>
                <p className={`text-xs ${themeColors.textSecondary}`}>
                  Complétées
                </p>
              </div>

              <div className="text-center">
                <ProgressRing percentage={localStats.averageGrade} />
                <p
                  className={`text-sm font-medium ${themeColors.textPrimary} mt-2`}
                >
                  Performance
                </p>
                <p className={`text-xs ${themeColors.textSecondary}`}>
                  Moyenne générale
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Attendance Trend */}
          <div
            className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} p-6`}
          >
            <h3
              className={`text-lg font-semibold ${themeColors.textPrimary} mb-4`}
            >
              Évolution de l'Assiduité
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#374151" : "#E5E7EB"}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: isDark ? "#D1D5DB" : "#6B7280", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: isDark ? "#D1D5DB" : "#6B7280", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
                    borderRadius: "8px",
                    color: isDark ? "#F9FAFB" : "#111827",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Distribution */}
          <div
            className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} p-6`}
          >
            <h3
              className={`text-lg font-semibold ${themeColors.textPrimary} mb-4`}
            >
              Répartition des Activités
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={activityDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
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
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div
            className={`${themeColors.cardBg} rounded-xl shadow-sm border ${themeColors.border} p-6`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3
                className={`text-lg font-semibold ${themeColors.textPrimary}`}
              >
                Activité Récente
              </h3>
              <button className="text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors">
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
