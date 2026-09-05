import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "../../../hooks/useTranslation";
import { useSelector } from "react-redux";
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
  AreaChart,
  Area,
} from "recharts";
import { scholchatService } from "../../../services/ScholchatService";
import axios from "axios";

// ─── Inline MatiereService ────────────────────────────────────────────────────
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faArrowsRotate,
  faCalendarDays,
  faHeartPulse,
  faBookOpen,
  faCircleCheck,
  faUsers,
  faAward,
  faFileLines,
  faBullseye,
  faChartBar,
  faGraduationCap,
  faClock,
  faLayerGroup,
  faSchool,
} from "@fortawesome/free-solid-svg-icons";
import { asIconComponent } from "../../../utils/faIconAdapter";
const Activity = asIconComponent(faHeartPulse);
const Award = asIconComponent(faAward);
const BarChart3 = asIconComponent(faChartBar);
const BookOpen = asIconComponent(faBookOpen);
const CheckCircle = asIconComponent(faCircleCheck);
const Clock = asIconComponent(faClock);
const FileText = asIconComponent(faFileLines);
const GraduationCap = asIconComponent(faGraduationCap);
const Layers = asIconComponent(faLayerGroup);
const School = asIconComponent(faSchool);
const Target = asIconComponent(faBullseye);
const TrendingUp = asIconComponent(faArrowTrendUp);
const Users = asIconComponent(faUsers);
const matiereApi = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
matiereApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("authToken") || localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const matiereService = {
  async getAllMatieres() {
    try {
      return (await matiereApi.get("/matieres")).data;
    } catch {
      return [];
    }
  },
};

// ─── Colour palette for charts ────────────────────────────────────────────────
const CHART_COLORS = [
  "#3B82F6",
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#06B6D4",
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  trend,
  subtitle,
  isDark,
}) => (
  <motion.div
    whileHover={{
      y: -4,
      scale: 1.01,
    }}
    transition={{
      type: "spring",
      stiffness: 300,
      damping: 20,
    }}
    className={`relative overflow-hidden rounded-2xl p-5 shadow-lg border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
  >
    {/* gradient blob */}
    <div
      className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 blur-2xl pointer-events-none"
      style={{
        background: gradient,
      }}
    />
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p
          className={`text-xs font-semibold uppercase tracking-widest mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          {title}
        </p>
        <p
          className={`text-3xl font-black leading-none ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {subtitle && (
          <p
            className={`text-xs mt-1.5 flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
            {subtitle}
          </p>
        )}
      </div>
      <div
        className="p-3 rounded-xl shadow-md flex-shrink-0"
        style={{
          background: gradient,
        }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    {trend && (
      <div
        className={`mt-4 pt-3 border-t flex items-center gap-2 ${isDark ? "border-slate-700" : "border-slate-100"}`}
      >
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
          <FontAwesomeIcon icon={faArrowTrendUp} className="w-3 h-3" /> {trend}
        </span>
        <span
          className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          ce mois
        </span>
      </div>
    )}
  </motion.div>
);

// ─── Chart card wrapper ───────────────────────────────────────────────────────
const ChartCard = ({ title, icon: Icon, children, isDark, className = "" }) => (
  <div
    className={`rounded-2xl border shadow-sm p-5 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"} ${className}`}
  >
    <div className="flex items-center justify-between mb-4">
      <h3
        className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}
      >
        {title}
      </h3>
      <Icon className="w-4 h-4 text-slate-400" />
    </div>
    {children}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const DashboardContent = ({ isDark, currentTheme, themes, colorSchemes }) => {
  const { t, changeLanguage } = useTranslation();
  const currentLanguage = useSelector((state) => state.ui.currentLanguage);
  useEffect(() => {
    if (currentLanguage) changeLanguage(currentLanguage);
  }, [currentLanguage]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalExercises: 0,
    activeClasses: 0,
    averageProgress: 0,
    totalMatieres: 0,
    totalStudents: 0,
    totalProfessors: 0,
    pendingProfessors: 0,
    completionRate: 0,
  });
  const [matieres, setMatieres] = useState([]);
  const [classes, setClasses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profRes, classRes, matRes, pendRes] = await Promise.allSettled([
        scholchatService.getAllProfessors(),
        scholchatService.getAllClasses(),
        matiereService.getAllMatieres(),
        scholchatService.getPendingProfessors(),
      ]);
      const profs = profRes.status === "fulfilled" ? profRes.value || [] : [];
      const cls = classRes.status === "fulfilled" ? classRes.value || [] : [];
      const mats = matRes.status === "fulfilled" ? matRes.value || [] : [];
      const pending = pendRes.status === "fulfilled" ? pendRes.value || [] : [];
      setProfessors(profs);
      setClasses(cls);
      setMatieres(mats);
      setStats({
        totalCourses: 0,
        totalExercises: 0,
        activeClasses: cls.filter((c) => c.etat === "ACTIF").length,
        averageProgress: 0,
        totalMatieres: mats.length,
        totalStudents: 0,
        totalProfessors: profs.length,
        pendingProfessors: pending.length,
        completionRate: 0,
      });
    } catch (e) {
      setError("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // ── Chart data ──────────────────────────────────────────────────────────────
  const pieData = matieres.slice(0, 10).map((m, i) => ({
    name: m.nom || `Matière ${i + 1}`,
    value: Math.floor(Math.random() * 40) + 10,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  const barData = classes.slice(0, 8).map((c) => ({
    name: c.nom
      ? c.nom.length > 10
        ? c.nom.slice(0, 10) + "…"
        : c.nom
      : "Classe",
    progression: Math.floor(Math.random() * 35) + 60,
  }));
  const areaData = [
    {
      mois: "Jan",
      cours: 4,
      exercices: 8,
    },
    {
      mois: "Fév",
      cours: 7,
      exercices: 14,
    },
    {
      mois: "Mar",
      cours: 5,
      exercices: 11,
    },
    {
      mois: "Avr",
      cours: 9,
      exercices: 18,
    },
    {
      mois: "Mai",
      cours: 12,
      exercices: 22,
    },
    {
      mois: "Jun",
      cours: stats.totalCourses || 10,
      exercices: stats.totalExercises || 20,
    },
  ];
  const statusData = [
    {
      name: "Terminés",
      value: stats.completionRate || 0,
      color: "#10B981",
    },
    {
      name: "En cours",
      value: 15,
      color: "#6366F1",
    },
    {
      name: "Non démarrés",
      value: 6,
      color: "#F43F5E",
    },
  ];

  // ── Recent activity (static placeholders enriched with real data) ───────────
  const recentItems = [
    {
      icon: BookOpen,
      color: "text-blue-600",
      bg: "bg-blue-50",
      label: "Nouveau cours publié",
      sub: professors[0]
        ? `${professors[0].prenom} ${professors[0].nom}`
        : "Professeur",
      time: "Il y a 2h",
    },
    {
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      label: "Exercices complétés",
      sub: classes[0]?.nom || "Classe 3ème A",
      time: "Il y a 3h",
    },
    {
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
      label: "Nouvelle classe créée",
      sub: "Admin",
      time: "Il y a 5h",
    },
    {
      icon: Award,
      color: "text-amber-600",
      bg: "bg-amber-50",
      label: "Jalon de progression atteint",
      sub: "Système",
      time: "Hier",
    },
    {
      icon: FileText,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      label: "Matière mise à jour",
      sub: professors[1]
        ? `${professors[1].prenom} ${professors[1].nom}`
        : "Professeur",
      time: "Il y a 2j",
    },
  ];

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-900" : "bg-slate-50"}`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p
            className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            Chargement du tableau de bord…
          </p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-900" : "bg-slate-50"}`}
      >
        <div className="text-center space-y-4">
          <p className={`${isDark ? "text-slate-300" : "text-slate-600"}`}>
            {error}
          </p>
          <button
            onClick={fetchData}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div
        className={`sticky top-0 z-30 border-b backdrop-blur-xl ${isDark ? "bg-slate-900/90 border-slate-700" : "bg-white/90 border-slate-200"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
                <FontAwesomeIcon
                  icon={faHeartPulse}
                  className="w-5 h-5 text-white"
                />
              </div>
              <div>
                <h1
                  className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Tableau de Bord
                </h1>
                <p
                  className={`text-xs flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  <FontAwesomeIcon icon={faCalendarDays} className="w-3 h-3" />
                  {new Date().toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200"
            >
              <FontAwesomeIcon icon={faArrowsRotate} className="w-4 h-4" />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <StatCard
            title="Cours disponibles"
            value={stats.totalCourses}
            icon={BookOpen}
            gradient="linear-gradient(135deg,#3b82f6,#6366f1)"
            trend="+12%"
            subtitle={`${stats.totalMatieres} matières`}
            isDark={isDark}
          />
          <StatCard
            title="Exercices"
            value={stats.totalExercises}
            icon={Target}
            gradient="linear-gradient(135deg,#10b981,#059669)"
            trend="+18%"
            subtitle={`${stats.completionRate}% complété`}
            isDark={isDark}
          />
          <StatCard
            title="Classes actives"
            value={stats.activeClasses}
            icon={Users}
            gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)"
            trend="+8%"
            subtitle={`${stats.totalStudents} élèves`}
            isDark={isDark}
          />
          <StatCard
            title="Progression moyenne"
            value={`${stats.averageProgress}%`}
            icon={BarChart3}
            gradient="linear-gradient(135deg,#f59e0b,#d97706)"
            trend="+5%"
            subtitle="Toutes les classes"
            isDark={isDark}
          />
        </div>

        {/* ── Secondary KPIs ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
          {[
            {
              label: "Professeurs",
              value: stats.totalProfessors,
              icon: GraduationCap,
              color: "#3b82f6",
            },
            {
              label: "En attente valid.",
              value: stats.pendingProfessors,
              icon: Clock,
              color: "#f59e0b",
            },
            {
              label: "Matières",
              value: stats.totalMatieres,
              icon: Layers,
              color: "#8b5cf6",
            },
            {
              label: "Établissements",
              value: 0,
              icon: School,
              color: "#10b981",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-2xl border p-4 flex items-center gap-3 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"} shadow-sm`}
            >
              <div
                className="p-2.5 rounded-xl flex-shrink-0"
                style={{
                  background: item.color + "20",
                }}
              >
                <item.icon
                  className="w-4 h-4"
                  style={{
                    color: item.color,
                  }}
                />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wider truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {item.label}
                </p>
                <p
                  className={`text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Distribution des cours (pie) */}
          <ChartCard
            title="Distribution des Cours"
            icon={BarChart3}
            isDark={isDark}
          >
            {pieData.length === 0 ? (
              <div
                className={`h-64 flex items-center justify-center text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                Aucune matière disponible
              </div>
            ) : (
              <>
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        outerRadius="70%"
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                          fontSize: "12px",
                        }}
                        formatter={(v, n) => [v, n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                  {pieData.slice(0, 6).map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          background: d.color,
                        }}
                      />
                      <span
                        className={`text-[11px] truncate max-w-[80px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {d.name}
                      </span>
                    </div>
                  ))}
                  {pieData.length > 6 && (
                    <span
                      className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      +{pieData.length - 6} autres
                    </span>
                  )}
                </div>
              </>
            )}
          </ChartCard>

          {/* Progression des élèves (bar) */}
          <ChartCard
            title="Progression des Élèves"
            icon={TrendingUp}
            isDark={isDark}
          >
            {barData.length === 0 ? (
              <div
                className={`h-64 flex items-center justify-center text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                Aucune classe disponible
              </div>
            ) : (
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barSize={20}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? "#334155" : "#f1f5f9"}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 11,
                        fill: isDark ? "#94a3b8" : "#64748b",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: isDark ? "#94a3b8" : "#64748b",
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                        fontSize: "12px",
                        background: isDark ? "#1e293b" : "#fff",
                        color: isDark ? "#f1f5f9" : "#0f172a",
                      }}
                      cursor={{
                        fill: isDark
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(0,0,0,0.04)",
                      }}
                    />
                    <Bar
                      dataKey="progression"
                      name="Progression %"
                      radius={[6, 6, 0, 0]}
                      fill="url(#barGrad)"
                    />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>

        {/* ── Area chart (monthly trends) ────────────────────────────────────── */}
        <ChartCard title="Tendances Mensuelles" icon={Activity} isDark={isDark}>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="gradCours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradExo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#334155" : "#f1f5f9"}
                />
                <XAxis
                  dataKey="mois"
                  tick={{
                    fontSize: 11,
                    fill: isDark ? "#94a3b8" : "#64748b",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: isDark ? "#94a3b8" : "#64748b",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                    fontSize: "12px",
                    background: isDark ? "#1e293b" : "#fff",
                    color: isDark ? "#f1f5f9" : "#0f172a",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cours"
                  name="Cours"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#gradCours)"
                />
                <Area
                  type="monotone"
                  dataKey="exercices"
                  name="Exercices"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#gradExo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* ── Bottom row: status pie + recent activity ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Exercise status donut */}
          <ChartCard title="Statut des Exercices" icon={Target} isDark={isDark}>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="70%"
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                      fontSize: "12px",
                    }}
                    formatter={(v) => [`${v}%`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-1">
              {statusData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: d.color,
                      }}
                    />
                    <span
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {d.name}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                  >
                    {d.value}%
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Recent activity — spans 2 cols */}
          <div
            className={`lg:col-span-2 rounded-2xl border shadow-sm p-5 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                Activités Récentes
              </h3>
              <FontAwesomeIcon
                icon={faHeartPulse}
                className="w-4 h-4 text-slate-400"
              />
            </div>
            <div className="space-y-3">
              {recentItems.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.bg}`}
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-slate-800"}`}
                    >
                      {item.label}
                    </p>
                    <p
                      className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {item.sub}
                    </p>
                  </div>
                  <span
                    className={`text-xs flex-shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardContent;
