import React, { useState } from "react";
import { Search, Filter, UserPlus, Mail } from "lucide-react";

const ParentsContent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // Sample parents data
  const parents = [
    {
      id: 1,
      name: "David Wilson",
      email: "david.wilson@example.com",
      children: ["Emma Wilson", "Jack Wilson"],
      phone: "+1 (555) 123-4567",
      status: "active",
      lastLogin: "Today, 11:20 AM",
    },
    {
      id: 2,
      name: "Sarah Miller",
      email: "sarah.miller@example.com",
      children: ["Oliver Miller"],
      phone: "+1 (555) 987-6543",
      status: "active",
      lastLogin: "Yesterday, 5:30 PM",
    },
    {
      id: 3,
      name: "James Taylor",
      email: "james.taylor@example.com",
      children: ["Sophia Taylor", "Noah Taylor"],
      phone: "+1 (555) 456-7890",
      status: "inactive",
      lastLogin: "Mar 29, 2025",
    },
    {
      id: 4,
      name: "Jennifer Garcia",
      email: "jennifer.g@example.com",
      children: ["Lucas Garcia"],
      phone: "+1 (555) 234-5678",
      status: "active",
      lastLogin: "Apr 5, 2025",
    },
  ];

  // Filter parents based on search term and filter
  const filteredParents = parents.filter((parent) => {
    const matchesSearch =
      parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.children.some((child) =>
        child.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (filter === "all") return matchesSearch;
    return matchesSearch && parent.status === filter;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Parents</h2>

        <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
          <UserPlus size={18} />
          <span>Add Parent</span>
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
              placeholder="Search parents or children..."
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
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Children
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
            {filteredParents.length > 0 ? (
              filteredParents.map((parent) => (
                <tr key={parent.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-medium">
                        {parent.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">
                          {parent.name}
                        </div>
                        <div className="text-gray-500 text-sm">
                          Last login: {parent.lastLogin}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {parent.children.map((child, index) => (
                        <div key={index} className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                          <span>{child}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{parent.email}</div>
                    <div className="text-sm text-gray-500">{parent.phone}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        parent.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {parent.status.charAt(0).toUpperCase() +
                        parent.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Mail size={18} />
                    </button>
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
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
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  No parents found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParentsContent;
