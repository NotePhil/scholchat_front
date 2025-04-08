import React from "react";
import { Edit, Trash, Eye } from "lucide-react";

const UserTable = ({ users, loading, onEdit, onDelete, onView }) => {
  const getRoleBadge = (type) => {
    const colors = {
      admin: "bg-purple-100 text-purple-800",
      professor: "bg-blue-100 text-blue-800",
      professeur: "bg-blue-100 text-blue-800",
      parent: "bg-green-100 text-green-800",
      student: "bg-yellow-100 text-yellow-800",
      eleve: "bg-yellow-100 text-yellow-800",
      repetiteur: "bg-orange-100 text-orange-800",
    };

    const lowerType = (type || "").toLowerCase();
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[lowerType] || "bg-gray-100 text-gray-800"
        }`}
      >
        {type?.charAt(0).toUpperCase() + type?.slice(1) || "Unknown"}
      </span>
    );
  };

  const getVerificationBadge = (status) => {
    const colors = {
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      PENDING: "bg-yellow-100 text-yellow-800",
    };

    const statusText = {
      APPROVED: "Approved",
      REJECTED: "Rejected",
      PENDING: "Not Verified",
    };

    const verificationStatus = status || "PENDING";

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[verificationStatus] || "bg-gray-100 text-gray-800"
        }`}
      >
        {statusText[verificationStatus] || "Unknown"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading users...</div>
    );
  }

  if (users.length === 0) {
    return <div className="p-8 text-center text-gray-500">No users found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Verification
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {user.nom?.charAt(0)}
                    {user.prenom?.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user.nom} {user.prenom}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.telephone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getRoleBadge(user.type)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.etat === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.etat}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getVerificationBadge(user.verificationStatus)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onView(user)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onEdit(user)}
                  className="text-yellow-600 hover:text-yellow-900 mr-3"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(user)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
