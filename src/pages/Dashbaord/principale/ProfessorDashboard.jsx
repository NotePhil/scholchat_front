// ProfessorDashboard.jsx
import React, { useState, useEffect } from "react";
import { Book, Users, ClipboardList, CheckSquare } from "lucide-react";
import { scholchatService } from "../../../services/ScholchatService";
import StatsCard from "../components/common/StatsCard";

const ProfessorDashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingAssignments: 0,
    recentSubmissions: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // These would be replaced with actual professor-specific API calls
      const classesRes = await scholchatService.getAllClasses();
      const studentsRes = await scholchatService.getAllStudents();

      setStats({
        totalClasses: classesRes.length,
        totalStudents: studentsRes.length,
        pendingAssignments: 5, // Example data
        recentSubmissions: 12, // Example data
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="professor-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Classes"
          icon={Book}
          count={stats.totalClasses}
          activeCount={stats.totalClasses}
        />
        <StatsCard
          title="Total Students"
          icon={Users}
          count={stats.totalStudents}
          activeCount={stats.totalStudents}
        />
        <StatsCard
          title="Pending Assignments"
          icon={ClipboardList}
          count={stats.pendingAssignments}
          activeCount={stats.pendingAssignments}
        />
        <StatsCard
          title="Recent Submissions"
          icon={CheckSquare}
          count={stats.recentSubmissions}
          activeCount={stats.recentSubmissions}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
          {/* Activity list would go here */}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Classes</h3>
          {/* Class schedule would go here */}
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboard;
