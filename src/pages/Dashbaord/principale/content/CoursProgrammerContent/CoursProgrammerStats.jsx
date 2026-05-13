import React from "react";
import {
  Calendar,
  Clock,
  PlayCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

const CoursProgrammerStats = ({ scheduledCourses, filterStatus, setFilterStatus }) => {
  const totalScheduled = scheduledCourses.length;
  const planifie = scheduledCourses.filter(
    (c) => c.etatCoursProgramme === "PLANIFIE"
  ).length;
  const enCours = scheduledCourses.filter(
    (c) => c.etatCoursProgramme === "EN_COURS"
  ).length;
  const termine = scheduledCourses.filter(
    (c) => c.etatCoursProgramme === "TERMINE"
  ).length;
  const annule = scheduledCourses.filter(
    (c) => c.etatCoursProgramme === "ANNULE"
  ).length;

  const stats = [
    {
      label: "Total Programmé",
      value: totalScheduled,
      color: "from-slate-500 to-slate-600",
      icon: Calendar,
      textColor: "text-slate-900",
      bgColor: "bg-slate-50",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      filterValue: "all",
      ringColor: "ring-slate-500",
    },
    {
      label: "Planifiés",
      value: planifie,
      color: "from-blue-500 to-blue-600",
      icon: Clock,
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      filterValue: "PLANIFIE",
      ringColor: "ring-blue-500",
    },
    {
      label: "En Cours",
      value: enCours,
      color: "from-green-500 to-green-600",
      icon: PlayCircle,
      textColor: "text-green-600",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      filterValue: "EN_COURS",
      ringColor: "ring-green-500",
    },
    {
      label: "Terminés",
      value: termine,
      color: "from-gray-500 to-gray-600",
      icon: CheckCircle,
      textColor: "text-gray-600",
      bgColor: "bg-gray-50",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
      filterValue: "TERMINE",
      ringColor: "ring-gray-500",
    },
    {
      label: "Annulés",
      value: annule,
      color: "from-red-500 to-red-600",
      icon: XCircle,
      textColor: "text-red-600",
      bgColor: "bg-red-50",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      filterValue: "ANNULE",
      ringColor: "ring-red-500",
    },
  ];

  return (
    <div className="hidden sm:grid sm:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          onClick={() => setFilterStatus(stat.filterValue)}
          className={`bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer ${
            filterStatus === stat.filterValue ? `ring-2 ${stat.ringColor}` : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-slate-500 text-[11px] sm:text-xs font-medium mb-1 truncate">
                {stat.label}
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                <p className={`text-xl sm:text-2xl font-bold leading-none ${stat.textColor}`}>
                  {stat.value}
                </p>
                {totalScheduled > 0 && (
                  <span className={`text-[10px] font-semibold px-1 py-0.5 rounded-full ${stat.bgColor} ${stat.textColor}`}>
                    {Math.round((stat.value / totalScheduled) * 100)}%
                  </span>
                )}
              </div>
            </div>
            <div className={`p-1.5 sm:p-2 ${stat.iconBg} rounded-lg group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
              <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.iconColor}`} />
            </div>
          </div>

          {totalScheduled > 0 && (
            <div className="mt-2">
              <div className="w-full bg-slate-100 rounded-full h-1">
                <div
                  className={`bg-gradient-to-r ${stat.color} h-1 rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${Math.min((stat.value / totalScheduled) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CoursProgrammerStats;
