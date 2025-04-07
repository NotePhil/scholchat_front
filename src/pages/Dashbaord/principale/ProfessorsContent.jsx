import React, { useState } from "react";
import { Search, Filter, UserPlus, Mail, Book } from "lucide-react";

const ProfessorsContent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // Sample professors data
  const professors = [
    {
      id: 1,
      name: "Dr. Richard Martinez",
      email: "r.martinez@example.com",
      department: "Mathematics",
      subjects: ["Algebra", "Calculus"],
      classes: ["10A", "11B", "12A"],
      phone: "+1 (555) 234-5678",
      status: "active",
      lastLogin: "Today, 8:45 AM",
    },
    {
      id: 2,
      name: "Prof. Elizabeth Chen",
      email: "e.chen@example.com",
      department: "Science",
      subjects: ["Physics", "Chemistry"],
      classes: ["9A", "10B", "11A"],
      phone: "+1 (555) 876-5432",
      status: "active",
      lastLogin: "Yesterday, 4:30 PM",
    },
    {
      id: 3,
      name: "Mr. Thomas Wilson",
      email: "t.wilson@example.com",
      department: "English",
      subjects: ["Literature", "Grammar"],
      classes: ["8A", "9B"],
      phone: "+1 (555) 345-6789",
      status: "inactive",
      lastLogin: "Apr 2, 2025",
    },
    {
      id: 4,
      name: "Ms. Sarah Johnson",
      email: "s.johnson@example.com",
      department: "History",
      subjects: ["World History", "Geography"],
      classes: ["10C", "11C"],
      phone: "+1 (555) 789-0123",
      status: "active",
      lastLogin: "Apr 5, 2025",
    },
  ];

  // Filter professors based on search term and filter
  const filteredProfessors = professors.filter((professor) => {
    const matchesSearch =
      professor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professor.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professor.subjects.some((subject) =>
        subject.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (filter === "all") return matchesSearch;
    if (filter === "department") {
      return (
        matchesSearch &&
        professor.department.toLowerCase() === searchTerm.toLowerCase()
      );
    }
    return matchesSearch && professor.status === filter;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Professors</h2>

        <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
          <UserPlus size={18} />
          <span>Add Professor</span>
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name, department or subject..."
              className="pl-10 pr-4 py-2 border rounded-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              className="border rounded-md px-3 py-2"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="department">By Department</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Professor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Classes
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProfessors.length > 0 ? (
              filteredProfessors.map((professor) => (
                <tr key={professor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 font-medium">
                        {professor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">
                          {professor.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {professor.subjects.join(", ")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {professor.department}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {professor.classes.map((cls, index) => (
                        <span
                          key={index}
                          className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800"
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">
                      {professor.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {professor.phone}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        professor.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {professor.status.charAt(0).toUpperCase() +
                        professor.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      className="text-blue-600 hover:text-blue-900 mr-2"
                      title="Send Message"
                    >
                      <Mail size={18} />
                    </button>
                    <button
                      className="text-purple-600 hover:text-purple-900 mr-2"
                      title="View Classes"
                    >
                      <Book size={18} />
                    </button>
                    <button className="text-blue-600 hover:text-blue-900 mr-2">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  No professors found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfessorsContent;
