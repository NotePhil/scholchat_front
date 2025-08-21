import React from "react";
import {
  Calendar,
  Clock,
  PlayCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

const CoursProgrammerStats = ({ scheduledCourses }) => {
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
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-slate-600 text-sm font-medium mb-2">
                {stat.label}
              </p>
              <div className="flex items-center space-x-2">
                <p className={`text-3xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
                {totalScheduled > 0 && (
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${stat.bgColor} ${stat.textColor}`}
                  >
                    {Math.round((stat.value / totalScheduled) * 100)}%
                  </div>
                )}
              </div>
            </div>
            <div
              className={`p-3 ${stat.iconBg} rounded-xl group-hover:scale-110 transition-transform duration-200`}
            >
              <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
          </div>

          {/* Progress bar */}
          {totalScheduled > 0 && (
            <div className="mt-4">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r ${stat.color} h-2 rounded-full transition-all duration-500 ease-out`}
                  style={{
                    width: `${Math.min(
                      (stat.value / totalScheduled) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CoursProgrammerStats;
