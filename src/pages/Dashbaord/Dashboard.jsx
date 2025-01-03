// src/pages/Dashboard/Dashboard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSidebar, setShowSidebar] = useState(true);
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", icon: Menu },
    { name: "Establishments", icon: Building2 },
    { name: "Students", icon: Users },
    { name: "Parents", icon: UserPlus },
    { name: "Classes", icon: BookOpen },
    { name: "Messages", icon: Mail },
    { name: "Settings", icon: Settings },
  ];

  const stats = [
    { label: "Total Students", value: "2,345", change: "+15%" },
    { label: "Total Parents", value: "1,892", change: "+10%" },
    { label: "Active Classes", value: "48", change: "+5%" },
    { label: "Messages", value: "156", change: "+25%" },
  ];

  const handleLogout = () => {
    navigate("/login");
  };

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

        <div className="absolute bottom-0 w-64 p-6">
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-600 hover:text-gray-800 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="mx-4">Logout</span>
          </button>
        </div>
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
                  3
                </span>
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-gray-500 text-sm">{stat.label}</h3>
                <div className="flex items-baseline mt-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </span>
                  <span className="ml-2 text-sm text-green-600">
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center p-3 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium">
                        New student registered
                      </p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Recent Messages</h2>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center p-3 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium">
                        New message from parent
                      </p>
                      <p className="text-xs text-gray-500">5 minutes ago</p>
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
};

export default Dashboard;
