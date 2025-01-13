// DashboardCharts.jsx
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, UserPlus, BookOpen } from "lucide-react";

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

const RecentActivities = ({
  activities,
  isDark,
  currentTheme,
  colorSchemes,
}) => (
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
          {activity.type === "student" && (
            <Users
              className="w-6 h-6"
              style={{ color: colorSchemes[currentTheme].primary }}
            />
          )}
          {activity.type === "parent" && (
            <UserPlus
              className="w-6 h-6"
              style={{ color: colorSchemes[currentTheme].primary }}
            />
          )}
          {activity.type === "professor" && (
            <BookOpen
              className="w-6 h-6"
              style={{ color: colorSchemes[currentTheme].primary }}
            />
          )}
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

const DashboardCharts = ({
  chartData,
  recentActivities,
  isDark,
  themes,
  currentTheme,
  colorSchemes,
}) => {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Growth Chart */}
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
          Growth Trends
        </h2>
        <GrowthChart
          data={chartData}
          isDark={isDark}
          themes={themes}
          currentTheme={currentTheme}
          colorSchemes={colorSchemes}
        />
      </div>

      {/* Recent Activities */}
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
        />
      </div>
    </div>
  );
};

export default DashboardCharts;
