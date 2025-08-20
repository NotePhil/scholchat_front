import React from "react";
import { Calendar, Clock, PlayCircle, CheckCircle } from "lucide-react";

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

  const stats = [
    {
      label: "Total Programmé",
      value: totalScheduled,
      color: "from-blue-500 to-blue-600",
      icon: Calendar,
      textColor: "text-slate-900",
    },
    {
      label: "Planifiés",
      value: planifie,
      color: "from-blue-500 to-blue-600",
      icon: Clock,
      textColor: "text-blue-600",
    },
    {
      label: "En Cours",
      value: enCours,
      color: "from-green-500 to-green-600",
      icon: PlayCircle,
      textColor: "text-green-600",
    },
    {
      label: "Terminés",
      value: termine,
      color: "from-gray-500 to-gray-600",
      icon: CheckCircle,
      textColor: "text-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.textColor} mt-1`}>
                {stat.value}
              </p>
            </div>
            <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-xl`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CoursProgrammerStats;
