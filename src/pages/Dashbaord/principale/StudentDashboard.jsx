import React, { useState, useEffect } from "react";
import { Book, Clock, CheckSquare, Users } from "lucide-react";
import { scholchatService } from "../../../services/ScholchatService";
import StatsCard from "../components/common/StatsCard";

const StudentDashboard = ({ isDark, currentTheme, colorSchemes }) => {
  const [stats, setStats] = useState({
    courses: 0,
    assignmentsDue: 0,
    averageGrade: "B+",
    studyHours: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch student-specific data
        const [coursesRes, assignmentsRes] = await Promise.all([
          scholchatService.getStudentCourses(),
          scholchatService.getStudentAssignments(),
        ]);

        setStats({
          courses: coursesRes.length,
          assignmentsDue: assignmentsRes.filter((a) => !a.completed).length,
          averageGrade: calculateAverageGrade(assignmentsRes),
          studyHours: calculateStudyHours(assignmentsRes),
        });

        setRecentActivities(
          generateRecentActivities(coursesRes, assignmentsRes)
        );
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateAverageGrade = (assignments) => {
    // Implementation for calculating average grade
    return "B+";
  };

  const calculateStudyHours = (assignments) => {
    // Implementation for calculating study hours
    return 24;
  };

  const generateRecentActivities = (courses, assignments) => {
    // Generate recent activities based on data
    return [
      {
        type: "assignment",
        title: "Math Homework",
        date: "Today",
        status: "pending",
      },
      { type: "grade", title: "Physics Test", date: "Yesterday", score: "A-" },
      { type: "announcement", title: "School Event", date: "Apr 10" },
    ];
  };

  return (
    <div className="student-dashboard">
      <h2 className="text-xl font-semibold mb-6">Student Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Courses"
          icon={Book}
          count={stats.courses}
          description="Currently enrolled"
          colorScheme={colorSchemes[currentTheme]}
        />
        <StatsCard
          title="Assignments Due"
          icon={CheckSquare}
          count={stats.assignmentsDue}
          description="To be completed"
          colorScheme={colorSchemes[currentTheme]}
        />
        <StatsCard
          title="Average Grade"
          icon={Users}
          count={stats.averageGrade}
          description="Current performance"
          colorScheme={colorSchemes[currentTheme]}
        />
        <StatsCard
          title="Study Hours"
          icon={Clock}
          count={stats.studyHours}
          description="This week"
          colorScheme={colorSchemes[currentTheme]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Assignments</h3>
          {loading ? (
            <p>Loading assignments...</p>
          ) : (
            <ul className="space-y-3">
              {recentActivities
                .filter((activity) => activity.type === "assignment")
                .map((assignment, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-gray-500">
                        Due {assignment.date}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      {assignment.status}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Grades</h3>
          {loading ? (
            <p>Loading grades...</p>
          ) : (
            <ul className="space-y-3">
              {recentActivities
                .filter((activity) => activity.type === "grade")
                .map((grade, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">{grade.title}</p>
                      <p className="text-sm text-gray-500">
                        Received {grade.date}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {grade.score}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
