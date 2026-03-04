import React, { useState, useEffect } from "react";
import { useTranslation } from '../../../../../hooks/useTranslation';
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
} from "recharts";
import {
  Building2,
  Users,
  GraduationCap,
  School,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  BarChart3,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import establishmentService from "../../../../../services/EstablishmentService";
import ClassService from "../../../../../services/ClassService";

const GestionnaireDashboardContent = ({ isDark, currentTheme, themes, colorSchemes }) => {
  const { t } = useTranslation();
  const currentLanguage = useSelector((state) => state.ui.currentLanguage);
  
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    establishments: [],
    classes: [],
    loading: true,
    error: null,
  });

  const [stats, setStats] = useState({
    totalEstablishments: 0,
    totalClasses: 0,
    totalStudents: 0,
    activeEstablishments: 0,
    pendingClasses: 0,
    activeClasses: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setDashboardData((prev) => ({ ...prev, loading: true, error: null }));

      // Get current user ID
      const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
      console.log("Current userId:", userId);
      
      const [establishments, classes] = await Promise.allSettled([
        establishmentService.getAllEstablishments().catch(err => {
          console.error("Establishments error:", err);
          return [];
        }),
        ClassService.getAllClasses().catch(err => {
          console.error("Classes error:", err);
          return [];
        }),
      ]);

      let allEstablishments = establishments.status === "fulfilled" ? establishments.value || [] : [];
      let allClasses = classes.status === "fulfilled" ? classes.value || [] : [];
      
      console.log("All establishments:", allEstablishments);
      console.log("Sample establishment gestionnaire:", allEstablishments[0]?.gestionnaire);
      
      // Filter establishments managed by current gestionnaire
      // Compare both as strings to handle type mismatches
      const gestionnaireEstablishments = allEstablishments.filter(e => {
        const gestionnaireId = e.gestionnaire?.id?.toString();
        const currentUserId = userId?.toString();
        console.log(`Comparing: ${gestionnaireId} === ${currentUserId}`);
        return gestionnaireId === currentUserId;
      });
      
      console.log("Filtered gestionnaire establishments:", gestionnaireEstablishments);
      
      // Get IDs of gestionnaire's establishments
      const establishmentIds = gestionnaireEstablishments.map(e => e.id);
      
      // Filter classes that belong to gestionnaire's establishments
      const gestionnaireClasses = allClasses.filter(c => 
        establishmentIds.includes(c.etablissement?.id)
      );

      const successfulResults = {
        establishments: gestionnaireEstablishments,
        classes: gestionnaireClasses,
      };

      const totalStudents = successfulResults.classes.reduce((sum, classe) => {
        return sum + (classe.eleves?.length || 0);
      }, 0);

      const calculatedStats = {
        totalEstablishments: successfulResults.establishments.length,
        totalClasses: successfulResults.classes.length,
        totalStudents: totalStudents,
        activeEstablishments: successfulResults.establishments.filter(
          (e) => e.etat === "ACTIF" || !e.etat
        ).length,
        pendingClasses: successfulResults.classes.filter(
          (c) => c.etat === "EN_ATTENTE_APPROBATION"
        ).length,
        activeClasses: successfulResults.classes.filter(
          (c) => c.etat === "ACTIF"
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
        error: null,
      }));
      setStats({
        totalEstablishments: 0,
        totalClasses: 0,
        totalStudents: 0,
        activeEstablishments: 0,
        pendingClasses: 0,
        activeClasses: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const establishmentDistributionData = dashboardData.establishments.map((establishment, index) => ({
    name: establishment.nom || `Établissement ${index + 1}`,
    classes: dashboardData.classes.filter(c => c.etablissement?.id === establishment.id).length,
    color: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"][index % 6],
  }));

  const classStatusData = [
    { name: "Actives", value: stats.activeClasses, color: "#10B981" },
    { name: "En attente", value: stats.pendingClasses, color: "#F59E0B" },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle, filterValue }) => (
    <div 
      onClick={() => filterValue && setFilterStatus(filterValue)}
      className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6 hover:shadow-md transition-all ${
        filterValue ? 'cursor-pointer' : ''
      } ${
        filterStatus === filterValue ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mt-2`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
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
          <span className="text-gray-500 ml-1">ce mois</span>
        </div>
      )}
    </div>
  );

  const RecentActivity = () => {
    const recentActivities = [
      {
        id: 1,
        type: "establishment_created",
        title: "Nouvel établissement créé",
        user: dashboardData.establishments[0]?.nom || "Établissement",
        time: "Il y a 2 heures",
        icon: School,
        color: "text-blue-600",
      },
      {
        id: 2,
        type: "class_approved",
        title: "Classe approuvée",
        user: dashboardData.classes[0]?.nom || "Classe",
        time: "Il y a 5 heures",
        icon: CheckCircle,
        color: "text-green-600",
      },
      {
        id: 3,
        type: "class_pending",
        title: "Classe en attente d'approbation",
        user: dashboardData.classes[1]?.nom || "Classe",
        time: "Il y a 1 jour",
        icon: Clock,
        color: "text-yellow-600",
      },
      {
        id: 4,
        type: "students_enrolled",
        title: `${Math.floor(Math.random() * 20 + 10)} nouveaux élèves inscrits`,
        user: "Système",
        time: "Il y a 2 jours",
        icon: Users,
        color: "text-purple-600",
      },
    ];

    return (
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Activités Récentes
          </h3>
          <Activity className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-10 h-10 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-full flex items-center justify-center`}>
                <activity.icon className={`h-4 w-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {activity.title}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{activity.user}</p>
              </div>
              <div className="text-xs text-gray-400">{activity.time}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (dashboardData.loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Chargement du tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{dashboardData.error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Tableau de Bord Gestionnaire
              </h1>
              <p className={`text-base ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                Vue d'ensemble de vos établissements et classes
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Établissements"
            value={stats.totalEstablishments}
            icon={School}
            color="bg-blue-500"
            trend="+5%"
            subtitle={`${stats.activeEstablishments} actifs`}
            filterValue="all"
          />
          <StatCard
            title="Classes"
            value={stats.totalClasses}
            icon={Building2}
            color="bg-green-500"
            trend="+12%"
            subtitle={`${stats.activeClasses} actives`}
            filterValue="ACTIF"
          />
          <StatCard
            title="Élèves"
            value={stats.totalStudents}
            icon={Users}
            color="bg-purple-500"
            trend="+8%"
            subtitle="Total inscrits"
          />
          <StatCard
            title="En attente"
            value={stats.pendingClasses}
            icon={Clock}
            color="bg-orange-500"
            subtitle="Classes à approuver"
            filterValue="EN_ATTENTE_APPROBATION"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Classes par Établissement
              </h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={establishmentDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="classes" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Classes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Statut des Classes
              </h3>
              <GraduationCap className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {classStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity />
          
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-6`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Actions Rapides
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center space-x-3">
                <School className="h-5 w-5 text-blue-600" />
                <span className="text-blue-900 font-medium">Créer un établissement</span>
              </button>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center space-x-3">
                <Building2 className="h-5 w-5 text-green-600" />
                <span className="text-green-900 font-medium">Créer une classe</span>
              </button>
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center space-x-3">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-purple-900 font-medium">Gérer les élèves</span>
              </button>
              <button className="w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="text-orange-900 font-medium">Approuver les classes ({stats.pendingClasses})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionnaireDashboardContent;
