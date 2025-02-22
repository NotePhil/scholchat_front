import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import {
  Users,
  UserPlus,
  BookOpen,
  Clock,
  GraduationCap,
  Book,
} from "lucide-react";

// Admin/Professor Growth Chart
const GrowthChart = ({ data, isDark, themes, currentTheme, colorSchemes }) => (
  <div className="h-96">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          {Object.entries(colorSchemes[currentTheme].gradient).map(
            ([key, value], index) => (
              <linearGradient
                key={key}
                id={`gradient${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={colorSchemes[currentTheme].primary}
                  stopOpacity={0.4}
                />
                <stop
                  offset="100%"
                  stopColor={colorSchemes[currentTheme].primary}
                  stopOpacity={0}
                />
              </linearGradient>
            )
          )}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDark ? themes.dark.gridColor : themes.light.gridColor}
        />
        <XAxis
          dataKey="month"
          stroke={isDark ? "#9ca3af" : "#6b7280"}
          tick={{ fill: isDark ? "#9ca3af" : "#6b7280" }}
        />
        <YAxis
          stroke={isDark ? "#9ca3af" : "#6b7280"}
          tick={{ fill: isDark ? "#9ca3af" : "#6b7280" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark
              ? themes.dark.chartBg
              : themes.light.chartBg,
            border: "none",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        />
        <Area
          type="monotone"
          dataKey="students"
          stroke={colorSchemes[currentTheme].primary}
          fill={`url(#gradient0)`}
          strokeWidth={3}
        />
        <Area
          type="monotone"
          dataKey="parents"
          stroke={colorSchemes[currentTheme].accent}
          fill={`url(#gradient1)`}
          strokeWidth={3}
        />
        <Area
          type="monotone"
          dataKey="professors"
          stroke={colorSchemes[currentTheme].secondary}
          fill={`url(#gradient2)`}
          strokeWidth={3}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

// Student Performance Chart
const StudentPerformanceChart = ({
  isDark,
  themes,
  currentTheme,
  colorSchemes,
}) => {
  const data = [
    { subject: "Math", score: 85, average: 75 },
    { subject: "Science", score: 92, average: 78 },
    { subject: "History", score: 78, average: 72 },
    { subject: "English", score: 88, average: 76 },
    { subject: "Art", score: 95, average: 82 },
  ];

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="subject" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="score" fill={colorSchemes[currentTheme].primary} />
          <Bar dataKey="average" fill={colorSchemes[currentTheme].secondary} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Parent View Chart
const ParentViewChart = ({ isDark, themes, currentTheme, colorSchemes }) => {
  const data = [
    { week: "Week 1", attendance: 100, homework: 90 },
    { week: "Week 2", attendance: 100, homework: 85 },
    { week: "Week 3", attendance: 80, homework: 95 },
    { week: "Week 4", attendance: 100, homework: 88 },
  ];

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="attendance"
            stroke={colorSchemes[currentTheme].primary}
          />
          <Line
            type="monotone"
            dataKey="homework"
            stroke={colorSchemes[currentTheme].secondary}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const RecentActivities = ({
  activities,
  isDark,
  currentTheme,
  colorSchemes,
  userRole,
}) => {
  const getIcon = (type) => {
    switch (type) {
      case "student":
        return (
          <Users
            className="w-6 h-6"
            style={{ color: colorSchemes[currentTheme].primary }}
          />
        );
      case "parent":
        return (
          <UserPlus
            className="w-6 h-6"
            style={{ color: colorSchemes[currentTheme].primary }}
          />
        );
      case "professor":
        return (
          <BookOpen
            className="w-6 h-6"
            style={{ color: colorSchemes[currentTheme].primary }}
          />
        );
      case "attendance":
        return (
          <Clock
            className="w-6 h-6"
            style={{ color: colorSchemes[currentTheme].primary }}
          />
        );
      case "assignment":
        return (
          <Book
            className="w-6 h-6"
            style={{ color: colorSchemes[currentTheme].primary }}
          />
        );
      case "grade":
        return (
          <GraduationCap
            className="w-6 h-6"
            style={{ color: colorSchemes[currentTheme].primary }}
          />
        );
      default:
        return (
          <Users
            className="w-6 h-6"
            style={{ color: colorSchemes[currentTheme].primary }}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, i) => (
        <div
          key={i}
          className={`flex items-center p-4 ${
            isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"
          } rounded-lg transition-all duration-200 transform hover:scale-102`}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: colorSchemes[currentTheme].light,
            }}
          >
            {getIcon(activity.type)}
          </div>
          <div className="ml-4">
            <p
              className={`text-sm font-medium ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              {activity.text}
            </p>
            <p
              className={`text-xs mt-1 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {new Date(activity.date).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const DashboardCharts = ({
  chartData,
  recentActivities,
  isDark,
  themes,
  currentTheme,
  colorSchemes,
  userRole,
}) => {
  const renderChartSection = () => {
    switch (userRole) {
      case "admin":
      case "professor":
      case "repetiteur":
        return (
          <GrowthChart
            data={chartData}
            isDark={isDark}
            themes={themes}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
          />
        );
      case "student":
        return (
          <StudentPerformanceChart
            isDark={isDark}
            themes={themes}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
          />
        );
      case "parent":
        return (
          <ParentViewChart
            isDark={isDark}
            themes={themes}
            currentTheme={currentTheme}
            colorSchemes={colorSchemes}
          />
        );
      default:
        return null;
    }
  };

  const getChartTitle = () => {
    switch (userRole) {
      case "admin":
      case "professor":
      case "repetiteur":
        return "Growth Trends";
      case "student":
        return "Performance by Subject";
      case "parent":
        return "Student Progress";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div
        className={`${
          isDark ? themes.dark.cardBg : themes.light.cardBg
        } rounded-xl shadow-lg p-6 transition-colors duration-300`}
      >
        <h2
          className={`text-xl font-semibold mb-6 ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          {getChartTitle()}
        </h2>
        {renderChartSection()}
      </div>

      <div
        className={`${
          isDark ? themes.dark.cardBg : themes.light.cardBg
        } rounded-xl shadow-lg p-6 transition-colors duration-300`}
      >
        <h2
          className={`text-xl font-semibold mb-6 ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          Recent Activities
        </h2>
        <RecentActivities
          activities={recentActivities}
          isDark={isDark}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
          userRole={userRole}
        />
      </div>
    </div>
  );
};

export default DashboardCharts;
