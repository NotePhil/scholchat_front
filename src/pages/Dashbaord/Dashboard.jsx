import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Building2,
  Users,
  UserPlus,
  BookOpen,
  Mail,
  Bell,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";
import { scholchatService } from "../../services/ScholchatService";

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: [],
    parents: [],
    professors: [],
    classes: [],
    establishments: [],
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);

  const menuItems = [
    { name: "Dashboard", icon: Menu },
    { name: "Establishments", icon: Building2 },
    { name: "Students", icon: Users },
    { name: "Parents", icon: UserPlus },
    { name: "Classes", icon: BookOpen },
    { name: "Messages", icon: Mail },
    { name: "Settings", icon: Settings },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [students, parents, professors, classes, establishments] =
          await Promise.all([
            scholchatService.getAllStudents(),
            scholchatService.getAllParents(),
            scholchatService.getAllProfessors(),
            scholchatService.getAllClasses(),
            scholchatService.getAllEstablishments(),
          ]);

        setStats({
          students,
          parents,
          professors,
          classes,
          establishments,
        });

        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          return date.toLocaleString("default", { month: "short" });
        }).reverse();

        const chartData = last6Months.map((month) => ({
          month,
          students: students.filter(
            (s) =>
              new Date(s.dateCreation).toLocaleString("default", {
                month: "short",
              }) === month
          ).length,
          parents: parents.filter(
            (p) =>
              new Date(p.dateCreation).toLocaleString("default", {
                month: "short",
              }) === month
          ).length,
          professors: professors.filter(
            (p) =>
              new Date(p.dateCreation).toLocaleString("default", {
                month: "short",
              }) === month
          ).length,
        }));

        setChartData(chartData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRecentActivity = () => {
    const allActivities = [
      ...stats.students.map((s) => ({
        type: "student",
        date: new Date(s.dateCreation),
        text: `New student ${s.prenom} ${s.nom} registered`,
      })),
      ...stats.parents.map((p) => ({
        type: "parent",
        date: new Date(p.dateCreation),
        text: `New parent ${p.prenom} ${p.nom} joined`,
      })),
      ...stats.professors.map((p) => ({
        type: "professor",
        date: new Date(p.dateCreation),
        text: `New professor ${p.prenom} ${p.nom} added`,
      })),
    ];

    return allActivities.sort((a, b) => b.date - a.date).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-white w-64 min-h-screen ${
          showSidebar ? "block" : "hidden"
        } md:block shadow-lg`}
      >
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold text-blue-600">ScholChat</h1>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => (
            <div
              key={item.name}
              onClick={() => setActiveTab(item.name.toLowerCase())}
              className={`flex items-center px-6 py-3 cursor-pointer ${
                activeTab === item.name.toLowerCase()
                  ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="mx-4">{item.name}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {getRecentActivity().length}
                </span>
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-500 text-sm">Students</h3>
                <Users className="w-4 h-4 text-gray-500" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold">
                  {stats.students.length}
                </div>
                <p className="text-xs text-gray-500">
                  Active:{" "}
                  {stats.students.filter((s) => s.etat === "active").length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-500 text-sm">Parents</h3>
                <UserPlus className="w-4 h-4 text-gray-500" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold">{stats.parents.length}</div>
                <p className="text-xs text-gray-500">
                  Active:{" "}
                  {stats.parents.filter((p) => p.etat === "active").length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-500 text-sm">Professors</h3>
                <BookOpen className="w-4 h-4 text-gray-500" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold">
                  {stats.professors.length}
                </div>
                <p className="text-xs text-gray-500">
                  Active:{" "}
                  {stats.professors.filter((p) => p.etat === "active").length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-500 text-sm">Classes</h3>
                <Building2 className="w-4 h-4 text-gray-500" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold">{stats.classes.length}</div>
                <p className="text-xs text-gray-500">
                  Active:{" "}
                  {stats.classes.filter((c) => c.etat === "ACTIF").length}
                </p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Growth Trends</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="students"
                      stroke="#3b82f6"
                      name="Students"
                    />
                    <Line
                      type="monotone"
                      dataKey="parents"
                      stroke="#10b981"
                      name="Parents"
                    />
                    <Line
                      type="monotone"
                      dataKey="professors"
                      stroke="#f59e0b"
                      name="Professors"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Recent Activities</h2>
              <div className="space-y-4">
                {getRecentActivity().map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center p-3 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {activity.type === "student" && (
                        <Users className="w-5 h-5 text-blue-600" />
                      )}
                      {activity.type === "parent" && (
                        <UserPlus className="w-5 h-5 text-green-600" />
                      )}
                      {activity.type === "professor" && (
                        <BookOpen className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium">{activity.text}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
