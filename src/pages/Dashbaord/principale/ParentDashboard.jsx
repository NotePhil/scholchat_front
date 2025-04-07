import React, { useState, useEffect } from "react";
import { Users, Award, Calendar, Bell } from "lucide-react";
import { scholchatService } from "../../../services/ScholchatService";
import StatsCard from "../components/common/StatsCard";

const ParentDashboard = ({ isDark, currentTheme, colorSchemes }) => {
  const [stats, setStats] = useState({
    children: 0,
    averageGrade: "A-",
    meetings: 0,
    notifications: 0,
  });

  const [childrenData, setChildrenData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch parent-specific data
        const childrenRes = await scholchatService.getParentChildren();

        setStats({
          children: childrenRes.length,
          averageGrade: calculateAverageGrade(childrenRes),
          meetings: countUpcomingMeetings(childrenRes),
          notifications: countUnreadNotifications(childrenRes),
        });

        setChildrenData(childrenRes);
      } catch (error) {
        console.error("Error fetching parent data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateAverageGrade = (children) => {
    // Implementation for calculating average grade
    return "A-";
  };

  const countUpcomingMeetings = (children) => {
    // Implementation for counting meetings
    return 1;
  };

  const countUnreadNotifications = (children) => {
    // Implementation for counting notifications
    return 3;
  };

  return (
    <div className="parent-dashboard">
      <h2 className="text-xl font-semibold mb-6">Parent Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Children"
          icon={Users}
          count={stats.children}
          description="Enrolled"
          colorScheme={colorSchemes[currentTheme]}
        />
        <StatsCard
          title="Average Grade"
          icon={Award}
          count={stats.averageGrade}
          description="Family average"
          colorScheme={colorSchemes[currentTheme]}
        />
        <StatsCard
          title="Meetings"
          icon={Calendar}
          count={stats.meetings}
          description="Upcoming"
          colorScheme={colorSchemes[currentTheme]}
        />
        <StatsCard
          title="Notifications"
          icon={Bell}
          count={stats.notifications}
          description="Unread"
          colorScheme={colorSchemes[currentTheme]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Children Overview</h3>
          {loading ? (
            <p>Loading children data...</p>
          ) : childrenData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Classes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {childrenData.map((child) => (
                    <tr key={child.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {child.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {child.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {child.gradeLevel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {child.classes?.join(", ")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          {child.performance || "Good"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No children data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
