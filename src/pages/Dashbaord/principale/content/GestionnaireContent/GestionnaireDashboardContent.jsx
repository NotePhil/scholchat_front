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

const GestionnaireDashboardContent = ({ isDark, currentTheme, themes, colorSchemes, setActiveTab }) => {
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
      
      // Filter establishments managed by current gestionnaire
      const gestionnaireEstablishments = allEstablishments.filter(e => {
        const gestionnaireId = e.gestionnaire?.id?.toString();
        const currentUserId = userId?.toString();
        return gestionnaireId === currentUserId;
      });
      
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
        error: "Erreur lors du chargement des données",
      }));
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

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle, filterValue, navigateTab }) => (
    <div 
      onClick={() => {
        if (navigateTab) setActiveTab(navigateTab);
        if (filterValue) setFilterStatus(filterValue);
      }}
      className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} group relative overflow-hidden rounded-2xl shadow-sm border p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 rounded-full ${color}`}></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {title}
          </p>
          <p className={`text-4xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} mt-2`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'} mt-2`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-${color.split('-')[1]}-500/20 group-hover:scale-110 transition-transform`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4 text-sm font-semibold text-green-500">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>{trend}</span>
          <span className="text-gray-400 ml-1 font-normal italic">ce mois</span>
        </div>
      )}
    </div>
  );

  const RecentActivity = () => {
    // Generate some dynamic activity based on actual data
    const recentActivities = [
      {
        id: 1,
        type: "establishment_created",
        title: "Dernier établissement",
        user: dashboardData.establishments[0]?.nom || "Aucun établissement",
        time: "Actualisé",
        icon: School,
        color: "text-blue-600",
      },
      {
        id: 2,
        type: "class_approved",
        title: "Dernière classe active",
        user: dashboardData.classes.find(c => c.etat === 'ACTIF')?.nom || "Aucune classe active",
        time: "Vérifié",
        icon: CheckCircle,
        color: "text-green-600",
      },
      {
        id: 3,
        type: "class_pending",
        title: "Classes à approuver",
        user: `${stats.pendingClasses} classe(s) en attente`,
        time: "Action requise",
        icon: Clock,
        color: "text-yellow-600",
      },
      {
        id: 4,
        type: "students_enrolled",
        title: "Impact Total",
        user: `${stats.totalStudents} élèves supervisés`,
        time: "Global",
        icon: Users,
        color: "text-purple-600",
      },
    ];

    return (
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border p-6`}>
        <div className="flex items-center justify-between mb-8">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Vue d'ensemble rapide
          </h3>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Activity className="h-5 w-5" />
          </div>
        </div>
        <div className="space-y-6">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center group cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-xl transition-colors">
              <div className={`flex-shrink-0 w-12 h-12 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <activity.icon className={`h-6 w-6 ${activity.color}`} />
              </div>
              <div className="flex-1 ml-4 min-w-0">
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                  {activity.title}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1 truncate`}>
                  {activity.user}
                </p>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-1 rounded">
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
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className={`mt-6 font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Chargement de votre espace personnel...
          </p>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100`}>
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Une erreur est survenue</h2>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>{dashboardData.error}</p>
          <button
            onClick={fetchDashboardData}
            className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transform active:scale-95 transition-all shadow-lg shadow-blue-200"
          >
            Réessayer le chargement
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Premium Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-10">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
                <Activity className="w-3 h-3 mr-2" />
                Tableau de bord live
              </div>
              <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'} tracking-tight`}>
                Hello, Gestionnaire 👋
              </h1>
              <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-500'} mt-1 font-medium`}>
                Gérez vos {stats.totalEstablishments} établissements et supervisez vos classes en temps réel.
              </p>
            </div>
            <div className="mt-6 md:mt-0">
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:shadow-md transition-all flex items-center space-x-3 disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin text-blue-600' : 'text-gray-400'}`} />
                <span>Actualiser les données</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Établissements"
            value={stats.totalEstablishments}
            icon={School}
            color="bg-blue-600"
            subtitle={`${stats.activeEstablishments} établissements actifs`}
            navigateTab="manage-establishment"
          />
          <StatCard
            title="Classes"
            value={stats.totalClasses}
            icon={Building2}
            color="bg-emerald-600"
            subtitle={`${stats.activeClasses} classes déjà activées`}
            navigateTab="manage-class"
          />
          <StatCard
            title="Élèves inscrits"
            value={stats.totalStudents}
            icon={Users}
            color="bg-indigo-600"
            trend="+12%"
            subtitle="Nombre total d'élèves"
          />
          <StatCard
            title="À Approuver"
            value={stats.pendingClasses}
            icon={Clock}
            color="bg-amber-500"
            subtitle="Classes nécessitant votre attention"
            navigateTab="manage-class"
            filterValue="EN_ATTENTE_APPROBATION"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Distribution Chart */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl shadow-sm border p-8`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Distribution des Classes
                </h3>
                <p className="text-sm text-gray-500 mt-1">Nombre de classes par établissement</p>
              </div>
              <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={establishmentDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f1f5f9'} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="classes" 
                    fill="#3b82f6" 
                    radius={[8, 8, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Chart */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl shadow-sm border p-8`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  État du Réseau
                </h3>
                <p className="text-sm text-gray-500 mt-1">Proportion des classes actives vs en attente</p>
              </div>
              <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {classStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {classStatusData.map((s) => (
                  <div key={s.name} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: s.color}}></div>
                    <span className="text-sm font-medium text-gray-600">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentActivity />
          
          {/* Quick Actions Panel */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl shadow-sm border p-8`}>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-8`}>
              Actions Prioritaires
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveTab('create-establishment')}
                className="group p-5 bg-blue-50 hover:bg-blue-600 rounded-2xl transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 bg-white text-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <School className="h-6 w-6" />
                </div>
                <span className="text-blue-900 group-hover:text-white font-bold block">Nouvel Établissement</span>
                <span className="text-blue-600 group-hover:text-blue-100 text-xs mt-1 block">Ajouter une structure</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('create-class')}
                className="group p-5 bg-emerald-50 hover:bg-emerald-600 rounded-2xl transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 bg-white text-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Building2 className="h-6 w-6" />
                </div>
                <span className="text-emerald-900 group-hover:text-white font-bold block">Créer une Classe</span>
                <span className="text-emerald-600 group-hover:text-emerald-100 text-xs mt-1 block">Lancer un programme</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('manage-class')}
                className="group p-5 bg-indigo-50 hover:bg-indigo-600 rounded-2xl transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6" />
                </div>
                <span className="text-indigo-900 group-hover:text-white font-bold block">Gérer les Élèves</span>
                <span className="text-indigo-600 group-hover:text-indigo-100 text-xs mt-1 block">Superviser les inscrits</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('manage-class')}
                className="group p-5 bg-amber-50 hover:bg-amber-600 rounded-2xl transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 bg-white text-amber-600 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform relative">
                  <AlertCircle className="h-6 w-6" />
                  {stats.pendingClasses > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <span className="text-amber-900 group-hover:text-white font-bold block">Approbations</span>
                <span className="text-amber-600 group-hover:text-amber-100 text-xs mt-1 block">{stats.pendingClasses} classe(s) en attente</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionnaireDashboardContent;
