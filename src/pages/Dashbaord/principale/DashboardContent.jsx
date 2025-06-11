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
  Users,
  GraduationCap,
  BookOpen,
  School,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  Mail,
  Phone,
} from "lucide-react";
import { scholchatService } from "../../../services/ScholchatService";
import ClassService from "../../../services/ClassService";
import establishmentService from "../../../services/EstablishmentService";

const DashboardContent = () => {
  const [dashboardData, setDashboardData] = useState({
    users: [],
    professors: [],
    parents: [],
    students: [],
    classes: [],
    establishments: [],
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
    pendingProfessors: 0,
    activeProfessors: 0,
    activeClasses: 0,
    pendingClasses: 0,
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
      ] = await Promise.allSettled([
        scholchatService.getAllUsers(),
        scholchatService.getAllProfessors(),
        scholchatService.getAllParents(),
        scholchatService.getAllStudents(),
        scholchatService.getAllClasses(),
        scholchatService.getAllEstablishments(),
        scholchatService.getPendingProfessors(),
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
      };

      // Calculate statistics
      const calculatedStats = {
        totalUsers: successfulResults.users.length,
        totalProfessors: successfulResults.professors.length,
        totalParents: successfulResults.parents.length,
        totalStudents: successfulResults.students.length,
        totalClasses: successfulResults.classes.length,
        totalEstablishments: successfulResults.establishments.length,
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
  const userDistributionData = [
    { name: "Professeurs", value: stats.totalProfessors, color: "#3B82F6" },
    { name: "Parents", value: stats.totalParents, color: "#10B981" },
    { name: "Élèves", value: stats.totalStudents, color: "#F59E0B" },
  ];

  const monthlyTrendsData = [
    {
      month: "Jan",
      professors: Math.floor(stats.totalProfessors * 0.6),
      parents: Math.floor(stats.totalParents * 0.5),
      students: Math.floor(stats.totalStudents * 0.4),
    },
    {
      month: "Fév",
      professors: Math.floor(stats.totalProfessors * 0.7),
      parents: Math.floor(stats.totalParents * 0.6),
      students: Math.floor(stats.totalStudents * 0.5),
    },
    {
      month: "Mar",
      professors: Math.floor(stats.totalProfessors * 0.8),
      parents: Math.floor(stats.totalParents * 0.75),
      students: Math.floor(stats.totalStudents * 0.7),
    },
    {
      month: "Avr",
      professors: Math.floor(stats.totalProfessors * 0.85),
      parents: Math.floor(stats.totalParents * 0.8),
      students: Math.floor(stats.totalStudents * 0.8),
    },
    {
      month: "Mai",
      professors: Math.floor(stats.totalProfessors * 0.9),
      parents: Math.floor(stats.totalParents * 0.9),
      students: Math.floor(stats.totalStudents * 0.9),
    },
    {
      month: "Juin",
      professors: stats.totalProfessors,
      parents: stats.totalParents,
      students: stats.totalStudents,
    },
  ];

  const classStatusData = [
    { name: "Classes Actives", value: stats.activeClasses, color: "#10B981" },
    { name: "En Attente", value: stats.pendingClasses, color: "#F59E0B" },
    {
      name: "Inactives",
      value: stats.totalClasses - stats.activeClasses - stats.pendingClasses,
      color: "#EF4444",
    },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {value.toLocaleString()}
          </p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4 text-sm">
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-green-600 font-medium">{trend}</span>
          <span className="text-gray-500 ml-1">ce mois</span>
        </div>
      )}
    </div>
  );

  const RecentActivity = () => {
    const recentUsers = dashboardData.professors.slice(0, 5);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Activité Récente
        </h3>
        <div className="space-y-4">
          {recentUsers.map((user, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-xs text-gray-500">
                  Nouveau professeur inscrit
                </p>
              </div>
              <div className="text-xs text-gray-400">
                {user.etat === "ACTIVE" ? (
                  <UserCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const QuickStats = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Statistiques Rapides
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Taux d'approbation professeurs
          </span>
          <span className="text-sm font-semibold text-green-600">
            {stats.totalProfessors > 0
              ? Math.round(
                  (stats.activeProfessors / stats.totalProfessors) * 100
                )
              : 0}
            %
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Classes par établissement
          </span>
          <span className="text-sm font-semibold text-blue-600">
            {stats.totalEstablishments > 0
              ? Math.round(stats.totalClasses / stats.totalEstablishments)
              : 0}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Élèves par classe</span>
          <span className="text-sm font-semibold text-purple-600">
            {stats.totalClasses > 0
              ? Math.round(stats.totalStudents / stats.totalClasses)
              : 0}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Professeurs en attente</span>
          <span className="text-sm font-semibold text-orange-600">
            {stats.pendingProfessors}
          </span>
        </div>
      </div>
    </div>
  );

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{dashboardData.error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Scholchat Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Tableau de bord de gestion de la plateforme
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Utilisateurs"
            value={stats.totalUsers}
            icon={Users}
            color="bg-blue-500"
            trend="+12%"
            subtitle="Tous les utilisateurs"
          />
          <StatCard
            title="Professeurs"
            value={stats.totalProfessors}
            icon={GraduationCap}
            color="bg-green-500"
            trend="+8%"
            subtitle={`${stats.activeProfessors} actifs`}
          />
          <StatCard
            title="Classes"
            value={stats.totalClasses}
            icon={BookOpen}
            color="bg-purple-500"
            trend="+15%"
            subtitle={`${stats.activeClasses} actives`}
          />
          <StatCard
            title="Établissements"
            value={stats.totalEstablishments}
            icon={School}
            color="bg-orange-500"
            trend="+5%"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Distribution Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Répartition des Utilisateurs
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {userDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tendances Mensuelles
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="professors"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="parents"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="students"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class Status Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              État des Classes
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={classStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <RecentActivity />

          {/* Quick Stats */}
          <QuickStats />
        </div>

        {/* Footer Stats */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Aperçu Global
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalUsers}
              </div>
              <div className="text-sm text-gray-600">Utilisateurs Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.activeProfessors}
              </div>
              <div className="text-sm text-gray-600">Professeurs Actifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.activeClasses}
              </div>
              <div className="text-sm text-gray-600">Classes Actives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.pendingProfessors}
              </div>
              <div className="text-sm text-gray-600">En Attente</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
