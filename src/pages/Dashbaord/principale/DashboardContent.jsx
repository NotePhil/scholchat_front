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
  Area,
  AreaChart,
} from "recharts";
import {
  BookOpen,
  Users,
  GraduationCap,
  School,
  TrendingUp,
  Award,
  FileText,
  Clock,
  Target,
  Activity,
  Plus,
  CheckCircle,
  AlertCircle,
  Calendar,
  BarChart3,
  UserCheck,
  UserX,
  Mail,
  Phone,
} from "lucide-react";
import { scholchatService } from "../../../services/ScholchatService";
import ClassService from "../../../services/ClassService";
import establishmentService from "../../../services/EstablishmentService";
import { coursService } from "../../../services/CoursService";

// MatiereService (inline since you provided it)
import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

const matiereApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

matiereApi.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("cmr.notep.business.business.token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class MatiereService {
  async getAllMatieres() {
    try {
      const response = await matiereApi.get("/matieres");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createMatiere(matiereData) {
    try {
      if (!matiereData.nom) {
        throw new Error("Subject name is required");
      }
      const response = await matiereApi.post("/matieres", matiereData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMatiereByName(nom) {
    try {
      if (!nom) {
        throw new Error("Subject name is required");
      }
      const response = await matiereApi.get(`/matieres/${nom}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      const errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        "An error occurred";
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error("Network error. Please check your connection.");
    } else {
      throw new Error("Request setup error: " + error.message);
    }
  }
}

const matiereService = new MatiereService();

const DashboardContent = ({ isDark, currentTheme, themes, colorSchemes }) => {
  const [dashboardData, setDashboardData] = useState({
    users: [],
    professors: [],
    parents: [],
    students: [],
    classes: [],
    establishments: [],
    courses: [],
    matieres: [],
    loading: true,
    error: null,
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProfessors: 0,
    totalParents: 0,
    totalStudents: 0,
    totalClasses: 0,
    totalEstablishments: 0,
    totalCourses: 0,
    totalMatieres: 0,
    totalExercises: 0,
    pendingProfessors: 0,
    activeProfessors: 0,
    activeClasses: 0,
    pendingClasses: 0,
    averageProgress: 68.2,
    completionRate: 78.5,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setDashboardData((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch all data in parallel
      const [
        users,
        professors,
        parents,
        students,
        classes,
        establishments,
        pendingProfessors,
        matieres,
      ] = await Promise.allSettled([
        scholchatService.getAllUsers(),
        scholchatService.getAllProfessors(),
        scholchatService.getAllParents(),
        scholchatService.getAllStudents(),
        scholchatService.getAllClasses(),
        scholchatService.getAllEstablishments(),
        scholchatService.getPendingProfessors(),
        matiereService.getAllMatieres(),
      ]);

      // Extract successful results
      const successfulResults = {
        users: users.status === "fulfilled" ? users.value || [] : [],
        professors:
          professors.status === "fulfilled" ? professors.value || [] : [],
        parents: parents.status === "fulfilled" ? parents.value || [] : [],
        students: students.status === "fulfilled" ? students.value || [] : [],
        classes: classes.status === "fulfilled" ? classes.value || [] : [],
        establishments:
          establishments.status === "fulfilled"
            ? establishments.value || []
            : [],
        pendingProfessors:
          pendingProfessors.status === "fulfilled"
            ? pendingProfessors.value || []
            : [],
        matieres: matieres.status === "fulfilled" ? matieres.value || [] : [],
        courses: [], // Mock data for now
      };

      // Calculate statistics
      const calculatedStats = {
        totalUsers: successfulResults.users.length,
        totalProfessors: successfulResults.professors.length,
        totalParents: successfulResults.parents.length,
        totalStudents: successfulResults.students.length,
        totalClasses: successfulResults.classes.length,
        totalEstablishments: successfulResults.establishments.length,
        totalMatieres: successfulResults.matieres.length,
        totalCourses: Math.floor(successfulResults.matieres.length * 16.3), // Estimated
        totalExercises: Math.floor(successfulResults.matieres.length * 121.3), // Estimated
        pendingProfessors: successfulResults.pendingProfessors.length,
        activeProfessors: successfulResults.professors.filter(
          (p) => p.etat === "ACTIVE"
        ).length,
        activeClasses: successfulResults.classes.filter(
          (c) => c.etat === "ACTIF"
        ).length,
        pendingClasses: successfulResults.classes.filter(
          (c) => c.etat === "EN_ATTENTE_APPROBATION"
        ).length,
        averageProgress: 68.2,
        completionRate: 78.5,
      };

      setDashboardData({
        ...successfulResults,
        loading: false,
        error: null,
      });

      setStats(calculatedStats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setDashboardData((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load dashboard data",
      }));
    }
  };

  // Prepare chart data
  const courseDistributionData = dashboardData.matieres.map(
    (matiere, index) => ({
      name: matiere.nom || `Matière ${index + 1}`,
      courses: Math.floor(Math.random() * 50) + 10,
      color: [
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#EC4899",
        "#14B8A6",
        "#F97316",
      ][index % 8],
    })
  );

  const studentProgressData = dashboardData.classes
    .slice(0, 8)
    .map((classe) => ({
      class: classe.nom || "Classe",
      progress: Math.floor(Math.random() * 30) + 70,
      students: Math.floor(Math.random() * 15) + 20,
    }));

  const monthlyTrendsData = [
    {
      month: "Jan",
      courses: Math.floor(stats.totalCourses * 0.1),
      exercises: Math.floor(stats.totalExercises * 0.08),
      completions: Math.floor(stats.totalStudents * 2.3),
    },
    {
      month: "Fév",
      courses: Math.floor(stats.totalCourses * 0.15),
      exercises: Math.floor(stats.totalExercises * 0.12),
      completions: Math.floor(stats.totalStudents * 3.1),
    },
    {
      month: "Mar",
      courses: Math.floor(stats.totalCourses * 0.2),
      exercises: Math.floor(stats.totalExercises * 0.18),
      completions: Math.floor(stats.totalStudents * 2.8),
    },
    {
      month: "Avr",
      courses: Math.floor(stats.totalCourses * 0.25),
      exercises: Math.floor(stats.totalExercises * 0.22),
      completions: Math.floor(stats.totalStudents * 3.5),
    },
    {
      month: "Mai",
      courses: Math.floor(stats.totalCourses * 0.3),
      exercises: Math.floor(stats.totalExercises * 0.28),
      completions: Math.floor(stats.totalStudents * 4.2),
    },
    {
      month: "Juin",
      courses: stats.totalCourses,
      exercises: stats.totalExercises,
      completions: Math.floor(stats.totalStudents * 4.8),
    },
  ];

  const exerciseCompletionData = [
    { name: "Terminés", value: 78.5, color: "#10B981" },
    { name: "En Cours", value: 15.3, color: "#F59E0B" },
    { name: "Non Commencés", value: 6.2, color: "#EF4444" },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} truncate`}>
            {title}
          </p>
          <p className={`text-lg sm:text-2xl lg:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mt-1 sm:mt-2`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1 truncate`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-full ${color} flex-shrink-0`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-3 sm:mt-4 text-xs sm:text-sm">
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
          <span className="text-green-600 font-medium">{trend}</span>
          <span className="text-gray-500 ml-1">ce mois</span>
        </div>
      )}
    </div>
  );

  const RecentActivity = () => {
    const recentActivities = [
      {
        id: 1,
        type: "course_created",
        title: "Nouveau cours: Algèbre Linéaire",
        user: dashboardData.professors[0]?.nom || "Prof. Martin",
        time: "Il y a 2h",
        icon: BookOpen,
        color: "text-blue-600",
      },
      {
        id: 2,
        type: "exercise_completed",
        title: `Exercice complété par ${Math.floor(
          Math.random() * 30 + 15
        )} élèves`,
        user: dashboardData.classes[0]?.nom || "Classe 3ème A",
        time: "Il y a 3h",
        icon: CheckCircle,
        color: "text-green-600",
      },
      {
        id: 3,
        type: "class_created",
        title: "Nouvelle classe créée",
        user: "Admin",
        time: "Il y a 5h",
        icon: Users,
        color: "text-purple-600",
      },
      {
        id: 4,
        type: "progress_milestone",
        title: "Progression atteint 80%",
        user: "Système",
        time: "Il y a 1j",
        icon: Award,
        color: "text-yellow-600",
      },
      {
        id: 5,
        type: "subject_updated",
        title: "Matière mise à jour",
        user: dashboardData.professors[1]?.nom || "Prof. Dubois",
        time: "Il y a 2j",
        icon: FileText,
        color: "text-indigo-600",
      },
    ];

    return (
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-4 sm:p-6`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Activités Récentes
          </h3>
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <div className="space-y-3 sm:space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-full flex items-center justify-center`}>
                <activity.icon
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${activity.color}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} leading-tight`}>
                  {activity.title}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{activity.user}</p>
              </div>
              <div className="flex-shrink-0 text-xs text-gray-400">
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };



  if (dashboardData.loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Chargement du tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{dashboardData.error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6">
            <div className="mb-3 sm:mb-0">
              <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Tableau de Bord Éducatif
              </h1>
              <p className={`text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                Gestion des cours, exercices et progression des élèves
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm sm:text-base self-start sm:self-auto"
            >
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Cours Disponibles"
            value={stats.totalCourses}
            icon={BookOpen}
            color="bg-blue-500"
            trend="+12%"
            subtitle={`${stats.totalMatieres} matières`}
          />
          <StatCard
            title="Exercices"
            value={stats.totalExercises}
            icon={Target}
            color="bg-green-500"
            trend="+18%"
            subtitle={`${stats.completionRate}% terminés`}
          />
          <StatCard
            title="Classes Actives"
            value={stats.activeClasses}
            icon={Users}
            color="bg-purple-500"
            trend="+8%"
            subtitle={`${stats.totalStudents} élèves`}
          />
          <StatCard
            title="Progression Moy."
            value={`${stats.averageProgress}%`}
            icon={BarChart3}
            color="bg-orange-500"
            trend="+5%"
            subtitle="Toutes classes"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Course Distribution */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-4 sm:p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm sm:text-base lg:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Répartition des Cours par Matière
              </h3>
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={courseDistributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    fill="#8884d8"
                    dataKey="courses"
                    label={({ name, percent }) =>
                      `${name.substring(0, 8)}... ${(percent * 100).toFixed(
                        0
                      )}%`
                    }
                  >
                    {courseDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Student Progress by Class */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-4 sm:p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm sm:text-base lg:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Progression des Élèves par Classe
              </h3>
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="class"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="progress"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    name="Progression (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Activity Trends */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-4 sm:p-6 mb-6 sm:mb-8`}>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className={`text-sm sm:text-base lg:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Activité Éducative Mensuelle
            </h3>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="courses"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="Cours créés"
                />
                <Area
                  type="monotone"
                  dataKey="exercises"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                  name="Exercices ajoutés"
                />
                <Area
                  type="monotone"
                  dataKey="completions"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.6}
                  name="Completions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Exercise Completion Status */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-4 sm:p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm sm:text-base lg:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                État des Exercices
              </h3>
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={exerciseCompletionData}
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                  >
                    {exerciseCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activities */}
          <RecentActivity />
        </div>

        {/* Footer Stats */}
      </div>
    </div>
  );
};

export default DashboardContent;
