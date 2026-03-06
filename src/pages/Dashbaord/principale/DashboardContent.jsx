import React, { useState, useEffect } from "react";
import { useTranslation } from '../../../hooks/useTranslation';
import { useSelector } from 'react-redux';
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

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const matiereApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

matiereApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
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
      const errorMessage = "An error occurred";
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
  const { t, changeLanguage } = useTranslation();
  const currentLanguage = useSelector((state) => state.ui.currentLanguage);
  
  // Sync Redux language with translation hook
  useEffect(() => {
    if (currentLanguage) {
      changeLanguage(currentLanguage);
    }
  }, [currentLanguage, changeLanguage]);
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
        error: t('dashboard.errors.loadFailed'),
      }));
    }
  };

  // Prepare chart data
  const courseDistributionData = dashboardData.matieres.map(
    (matiere, index) => ({
      name: matiere.nom || `${t('dashboard.charts.subject')} ${index + 1}`,
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
      class: classe.nom || t('dashboard.charts.class'),
      progress: Math.floor(Math.random() * 30) + 70,
      students: Math.floor(Math.random() * 15) + 20,
    }));

  const monthlyTrendsData = [
    {
      month: t('dashboard.months.jan'),
      courses: Math.floor(stats.totalCourses * 0.1),
      exercises: Math.floor(stats.totalExercises * 0.08),
      completions: Math.floor(stats.totalStudents * 2.3),
    },
    {
      month: t('dashboard.months.feb'),
      courses: Math.floor(stats.totalCourses * 0.15),
      exercises: Math.floor(stats.totalExercises * 0.12),
      completions: Math.floor(stats.totalStudents * 3.1),
    },
    {
      month: t('dashboard.months.mar'),
      courses: Math.floor(stats.totalCourses * 0.2),
      exercises: Math.floor(stats.totalExercises * 0.18),
      completions: Math.floor(stats.totalStudents * 2.8),
    },
    {
      month: t('dashboard.months.apr'),
      courses: Math.floor(stats.totalCourses * 0.25),
      exercises: Math.floor(stats.totalExercises * 0.22),
      completions: Math.floor(stats.totalStudents * 3.5),
    },
    {
      month: t('dashboard.months.may'),
      courses: Math.floor(stats.totalCourses * 0.3),
      exercises: Math.floor(stats.totalExercises * 0.28),
      completions: Math.floor(stats.totalStudents * 4.2),
    },
    {
      month: t('dashboard.months.jun'),
      courses: stats.totalCourses,
      exercises: stats.totalExercises,
      completions: Math.floor(stats.totalStudents * 4.8),
    },
  ];

  const exerciseCompletionData = [
    { name: t('dashboard.completion.completed'), value: 78.5, color: "#10B981" },
    { name: t('dashboard.completion.inProgress'), value: 15.3, color: "#6366F1" },
    { name: t('dashboard.completion.notStarted'), value: 6.2, color: "#F43F5E" },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative overflow-hidden ${isDark ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-md rounded-2xl shadow-xl border ${isDark ? 'border-white/5' : 'border-white/20'} p-5 sm:p-6 group transition-all duration-300`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${color.replace('bg-', 'bg-')}/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`}></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1 min-w-0 pr-4">
          <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
            {title}
          </p>
          <p className={`text-2xl sm:text-3xl lg:text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'} leading-none`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-2 flex items-center gap-1`}>
              <span className="w-1 h-1 rounded-full bg-blue-500"></span>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-${color.split('-')[1]}-500/30 transform group-hover:rotate-12 transition-transform duration-300`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center mt-6 pt-4 border-t border-gray-100/10 text-xs sm:text-sm relative z-10">
          <div className="flex items-center bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full mr-2">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span className="font-bold">{trend}</span>
          </div>
          <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} italic`}>{t('dashboard.stats.thisMonth')}</span>
        </div>
      )}
    </motion.div>
  );

  const RecentActivity = () => {
    const recentActivities = [
      {
        id: 1,
        type: "course_created",
        title: t('dashboard.activities.newCourse'),
        user: dashboardData.professors[0]?.nom || "Prof. Martin",
        time: t('dashboard.activities.hoursAgo', { count: 2 }),
        icon: BookOpen,
        color: "text-blue-600",
      },
      {
        id: 2,
        type: "exercise_completed",
        title: t('dashboard.activities.exerciseCompleted', { count: Math.floor(Math.random() * 30 + 15) }),
        user: dashboardData.classes[0]?.nom || "Classe 3ème A",
        time: t('dashboard.activities.hoursAgo', { count: 3 }),
        icon: CheckCircle,
        color: "text-green-600",
      },
      {
        id: 3,
        type: "class_created",
        title: t('dashboard.activities.newClass'),
        user: "Admin",
        time: t('dashboard.activities.hoursAgo', { count: 5 }),
        icon: Users,
        color: "text-purple-600",
      },
      {
        id: 4,
        type: "progress_milestone",
        title: t('dashboard.activities.progressReached'),
        user: t('dashboard.activities.system'),
        time: t('dashboard.activities.daysAgo', { count: 1 }),
        icon: Award,
        color: "text-yellow-600",
      },
      {
        id: 5,
        type: "subject_updated",
        title: t('dashboard.activities.subjectUpdated'),
        user: dashboardData.professors[1]?.nom || "Prof. Dubois",
        time: t('dashboard.activities.daysAgo', { count: 2 }),
        icon: FileText,
        color: "text-indigo-600",
      },
    ];

    return (
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-4 sm:p-6`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('dashboard.recentActivities')}
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
            {t('dashboard.loading')}
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
            {t('dashboard.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header - Premium Makeover */}
      <div className={`${isDark ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-xl border-b ${isDark ? 'border-white/5' : 'border-gray-200'} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-6 sm:py-8 gap-4">
            <div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 mb-2"
              >
                <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/40">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('dashboard.title')}
                </h1>
              </motion.div>
              <p className={`text-sm sm:text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-2`}>
                <Calendar className="w-4 h-4 text-blue-500" />
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchDashboardData}
                className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center space-x-2 font-bold transform hover:-translate-y-1 active:translate-y-0"
              >
                <TrendingUp className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span>{t('dashboard.refresh')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatCard
            title={t('dashboard.stats.availableCourses')}
            value={stats.totalCourses}
            icon={BookOpen}
            color="bg-blue-500"
            trend="+12%"
            subtitle={t('dashboard.stats.subjects', { count: stats.totalMatieres })}
          />
          <StatCard
            title={t('dashboard.stats.exercises')}
            value={stats.totalExercises}
            icon={Target}
            color="bg-green-500"
            trend="+18%"
            subtitle={t('dashboard.stats.completed', { percent: stats.completionRate })}
          />
          <StatCard
            title={t('dashboard.stats.activeClasses')}
            value={stats.activeClasses}
            icon={Users}
            color="bg-purple-500"
            trend="+8%"
            subtitle={t('dashboard.stats.students', { count: stats.totalStudents })}
          />
          <StatCard
            title={t('dashboard.stats.avgProgress')}
            value={`${stats.averageProgress}%`}
            icon={BarChart3}
            color="bg-orange-500"
            trend="+5%"
            subtitle={t('dashboard.stats.allClasses')}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Course Distribution */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-4 sm:p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm sm:text-base lg:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('dashboard.charts.courseDistribution')}
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
                {t('dashboard.charts.studentProgress')}
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
                    name={t('dashboard.charts.progressPercent')}
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
              {t('dashboard.charts.monthlyActivity')}
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
                  name={t('dashboard.charts.coursesCreated')}
                />
                <Area
                  type="monotone"
                  dataKey="exercises"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                  name={t('dashboard.charts.exercisesAdded')}
                />
                <Area
                  type="monotone"
                  dataKey="completions"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.6}
                  name={t('dashboard.charts.completions')}
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
                {t('dashboard.charts.exerciseStatus')}
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
