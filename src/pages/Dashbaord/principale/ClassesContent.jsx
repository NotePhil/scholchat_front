import React, { useState } from "react";
import { Search, Filter, Plus, Users, BookOpen, Calendar } from "lucide-react";

const ClassesContent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // Sample classes data
  const classes = [
    {
      id: 1,
      name: "10A - Mathematics",
      subject: "Mathematics",
      grade: "10",
      section: "A",
      professor: "Dr. Richard Martinez",
      students: 28,
      schedule: "Mon, Wed, Fri 9:00 - 10:30 AM",
      room: "B-103",
      status: "active",
    },
    {
      id: 2,
      name: "9B - Science",
      subject: "Science",
      grade: "9",
      section: "B",
      professor: "Prof. Elizabeth Chen",
      students: 25,
      schedule: "Tue, Thu 10:45 - 12:15 PM",
      room: "Lab-201",
      status: "active",
    },
    {
      id: 3,
      name: "11A - Literature",
      subject: "English",
      grade: "11",
      section: "A",
      professor: "Mr. Thomas Wilson",
      students: 22,
      schedule: "Mon, Wed 1:00 - 2:30 PM",
      room: "A-205",
      status: "inactive",
    },
    {
      id: 4,
      name: "10C - History",
      subject: "History",
      grade: "10",
      section: "C",
      professor: "Ms. Sarah Johnson",
      students: 26,
      schedule: "Tue, Thu 2:45 - 4:15 PM",
      room: "C-107",
      status: "active",
    },
    {
      id: 5,
      name: "12A - Advanced Mathematics",
      subject: "Mathematics",
      grade: "12",
      section: "A",
      professor: "Dr. Richard Martinez",
      students: 20,
      schedule: "Mon, Wed, Fri 11:00 - 12:30 PM",
      room: "B-205",
      status: "active",
    },
  ];

  // Filter classes based on search term and status filter
  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.professor.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === "all" || cls.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Classes Management</h1>
        <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={18} className="mr-2" />
          Add New Class
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search classes..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-600" />
          <select
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Classes</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <div
            key={cls.id}
            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
          >
            <div
              className={`p-4 ${
                cls.status === "active" ? "bg-blue-50" : "bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{cls.name}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    cls.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {cls.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-gray-600 mt-1">
                {cls.subject} • Grade {cls.grade}-{cls.section}
              </p>
              <p className="text-sm text-gray-500 mt-2">{cls.professor}</p>
            </div>

            <div className="p-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Users size={16} className="mr-1" />
                  <span>{cls.students} students</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <BookOpen size={16} className="mr-1" />
                  <span>{cls.room}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center text-sm text-gray-600">
                <Calendar size={16} className="mr-1" />
                <span>{cls.schedule}</span>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50 transition">
                  View
                </button>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                  Manage
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No classes found matching your criteria
        </div>
      )}
    </div>
  );
};

export default ClassesContent;
