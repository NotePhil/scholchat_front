import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Users,
  BookOpen,
  Calendar,
  CheckCircle,
  XCircle,
  Mail,
  Building,
  Key,
  Info,
  Edit,
  AlertCircle,
  MoreVertical,
  Clock,
} from "lucide-react";

const ClassesContent = ({ onManageClass }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userRole, setUserRole] = useState("professor"); // Options: professor, administrator, establishment
  const [currentTab, setCurrentTab] = useState("active"); // active, inactive, pending

  // Sample classes data with expanded properties matching requirements
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
      establishment: "Lincoln High School",
      token: "LHS-10A-MATH-2025",
      createdAt: "2025-01-15",
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
      establishment: "Lincoln High School",
      token: "LHS-9B-SCI-2025",
      createdAt: "2025-02-01",
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
      establishment: "Lincoln High School",
      token: "LHS-11A-LIT-2025",
      createdAt: "2024-11-20",
      deactivationHistory: {
        date: "2025-03-10",
        motifRejet: "Autre",
        comment: "Class suspended due to restructuring",
      },
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
      establishment: null,
      token: "INDP-10C-HIST-2025",
      createdAt: "2025-02-15",
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
      status: "pending",
      establishment: "Edison Academy",
      token: null,
      createdAt: "2025-05-01",
    },
  ];

  // Sample establishments data
  const establishments = [
    {
      id: 1,
      name: "Lincoln High School",
      optionEnvoiMailNewClasse: true,
      optionTokenGeneral: true,
      codeUnique: "LHS2025",
    },
    {
      id: 2,
      name: "Edison Academy",
      optionEnvoiMailNewClasse: true,
      optionTokenGeneral: false,
    },
    {
      id: 3,
      name: "Washington Middle School",
      optionEnvoiMailNewClasse: false,
      optionTokenGeneral: false,
    },
  ];

  // New Class form state
  const [newClass, setNewClass] = useState({
    name: "",
    subject: "",
    grade: "",
    section: "",
    schedule: "",
    room: "",
    establishment: "",
    codeUnique: "",
  });

  // Token request state
  const [accessToken, setAccessToken] = useState("");

  // Filter classes based on search term, status filter and user role
  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cls.professor &&
        cls.professor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cls.establishment &&
        cls.establishment.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter based on tab selection
    let statusMatch = false;
    if (currentTab === "all") statusMatch = true;
    else if (currentTab === "active") statusMatch = cls.status === "active";
    else if (currentTab === "inactive") statusMatch = cls.status === "inactive";
    else if (currentTab === "pending") statusMatch = cls.status === "pending";

    // Filter based on user role
    let roleMatch = true;
    if (userRole === "professor") {
      // In a real app, filter by the current professor's ID
      roleMatch = true; // Simplified for demo
    } else if (userRole === "establishment") {
      // In a real app, filter by the current establishment's ID
      roleMatch = cls.establishment !== null; // Simplified for demo
    }
    // Administrators see all classes

    return matchesSearch && statusMatch && roleMatch;
  });

  // Handle form submission for creating a new class
  const handleCreateClass = (e) => {
    e.preventDefault();

    // Check if establishment is selected and requires a unique code
    const selectedEstablishment = establishments.find(
      (est) => est.name === newClass.establishment
    );

    if (selectedEstablishment) {
      if (selectedEstablishment.optionTokenGeneral && !newClass.codeUnique) {
        alert("This establishment requires a unique code!");
        return;
      }

      // If code is correct, save class and show token
      if (
        selectedEstablishment.optionTokenGeneral &&
        newClass.codeUnique === selectedEstablishment.codeUnique
      ) {
        // Save class with pending status
        setShowCreateModal(false);
        setShowTokenModal(true);

        // If configured, send email to establishment
        if (selectedEstablishment.optionEnvoiMailNewClasse) {
          console.log("Sending verification email to establishment");
        }
      } else if (!selectedEstablishment.optionTokenGeneral) {
        // No code needed, save class with pending status
        setShowCreateModal(false);
        setShowTokenModal(true);

        // If configured, send email to establishment
        if (selectedEstablishment.optionEnvoiMailNewClasse) {
          console.log("Sending verification email to establishment");
        }
      }
    } else {
      // No establishment selected, show payment modal
      setShowCreateModal(false);
      setShowPaymentModal(true);
    }

    // Reset form
    setNewClass({
      name: "",
      subject: "",
      grade: "",
      section: "",
      schedule: "",
      room: "",
      establishment: "",
      codeUnique: "",
    });
  };

  // Handle payment submission
  const handlePayment = (e) => {
    e.preventDefault();
    setShowPaymentModal(false);
    setShowTokenModal(true);
    // In a real app, this would process payment and create the class with active status
  };

  // Handle token access request
  const handleTokenAccess = () => {
    if (!accessToken.trim()) {
      alert("Please enter a valid token");
      return;
    }

    // Check if token exists
    const foundClass = classes.find((cls) => cls.token === accessToken);
    if (foundClass) {
      alert(
        `Access request sent to class "${foundClass.name}". The moderator will be notified.`
      );
      // In a real app, this would send a notification to the class moderator
    } else {
      alert("Invalid token. Please try again.");
    }

    setAccessToken("");
  };

  // Handle class approval/rejection (for establishment role)
  const handleClassApproval = (classId, approved) => {
    alert(`Class ${approved ? "approved" : "rejected"}`);
    // In a real app, this would update the class status and send notifications
  };

  // Handle class activation/deactivation
  const handleToggleClassStatus = (classId) => {
    alert(`Class status toggled`);
    // In a real app, this would update the class status
  };

  return (
    <div className="p-6">
      {/* Header with role selector (for demo purposes) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Classes Management</h1>
          <div className="mt-2">
            <select
              className="border rounded px-3 py-1 text-sm"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
            >
              <option value="professor">View as: Professor</option>
              <option value="administrator">View as: Administrator</option>
              <option value="establishment">View as: Establishment</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Token Access Button */}
          <button
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            onClick={() => setAccessToken("")}
          >
            <Key size={18} className="mr-2" />
            Access Class
          </button>

          {/* Create Class Button (only for professors and admins) */}
          {(userRole === "professor" || userRole === "administrator") && (
            <button
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} className="mr-2" />
              Create New Class
            </button>
          )}
        </div>
      </div>

      {/* Token Access Input */}
      <div className="bg-green-50 rounded-lg p-4 mb-6 flex items-center">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-green-800">Access a Class</h3>
          <p className="text-green-600 text-sm mb-3">
            Enter a valid class token to request access
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter class token..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              onClick={handleTokenAccess}
            >
              Request Access
            </button>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="bg-green-200 rounded-full p-3">
            <Key size={24} className="text-green-700" />
          </div>
        </div>
      </div>

      {/* Tabs and Search & Filter Controls */}
      <div className="border-b mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 font-medium ${
              currentTab === "all"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setCurrentTab("all")}
          >
            All Classes
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              currentTab === "active"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setCurrentTab("active")}
          >
            Active
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              currentTab === "inactive"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setCurrentTab("inactive")}
          >
            Inactive
          </button>

          {/* Show pending tab only for establishment or admin */}
          {(userRole === "establishment" || userRole === "administrator") && (
            <button
              className={`px-4 py-2 font-medium ${
                currentTab === "pending"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setCurrentTab("pending")}
            >
              Pending Approval
            </button>
          )}
        </div>
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
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <div
            key={cls.id}
            className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition ${
              cls.status === "pending" ? "border-yellow-300" : ""
            }`}
          >
            <div
              className={`p-4 ${
                cls.status === "active"
                  ? "bg-blue-50"
                  : cls.status === "pending"
                  ? "bg-yellow-50"
                  : "bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{cls.name}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    cls.status === "active"
                      ? "bg-green-100 text-green-800"
                      : cls.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {cls.status === "active"
                    ? "Active"
                    : cls.status === "pending"
                    ? "Pending"
                    : "Inactive"}
                </span>
              </div>

              <p className="text-gray-600 mt-1">
                {cls.subject} • Grade {cls.grade}-{cls.section}
              </p>

              <p className="text-sm text-gray-500 mt-2">{cls.professor}</p>

              {cls.establishment && (
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <Building size={14} className="mr-1" />
                  <span>{cls.establishment}</span>
                </div>
              )}

              {cls.deactivationHistory && (
                <div className="mt-2 text-xs text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  <span>Deactivated: {cls.deactivationHistory.motifRejet}</span>
                </div>
              )}
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

              <div className="mt-3 flex items-center text-sm text-gray-600">
                <Clock size={16} className="mr-1" />
                <span>Created: {cls.createdAt}</span>
              </div>

              {/* Action buttons based on role and class status */}
              <div className="mt-4 flex justify-end gap-2">
                {/* Professor actions */}
                {userRole === "professor" && (
                  <>
                    <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50 transition">
                      View
                    </button>
                    {cls.status === "active" && (
                      <button
                        onClick={() => onManageClass(cls.id)}
                        className="manage-button"
                      >
                        Manage
                      </button>
                    )}
                  </>
                )}

                {/* Establishment actions */}
                {userRole === "establishment" && cls.status === "pending" && (
                  <>
                    <button
                      className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50 transition"
                      onClick={() => handleClassApproval(cls.id, false)}
                    >
                      Reject
                    </button>
                    <button
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                      onClick={() => handleClassApproval(cls.id, true)}
                    >
                      Approve
                    </button>
                  </>
                )}

                {/* Establishment/Admin can activate/deactivate */}
                {(userRole === "establishment" ||
                  userRole === "administrator") &&
                  cls.status !== "pending" && (
                    <button
                      className={`px-3 py-1 text-sm rounded transition ${
                        cls.status === "active"
                          ? "border border-red-600 text-red-600 hover:bg-red-50"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                      onClick={() => handleToggleClassStatus(cls.id)}
                    >
                      {cls.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  )}

                {/* Admin actions */}
                {userRole === "administrator" && (
                  <>
                    <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50 transition">
                      <Edit size={14} />
                    </button>
                    {cls.status === "pending" && (
                      <>
                        <button
                          className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50 transition"
                          onClick={() => handleClassApproval(cls.id, false)}
                        >
                          Reject
                        </button>
                        <button
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                          onClick={() => handleClassApproval(cls.id, true)}
                        >
                          Approve
                        </button>
                      </>
                    )}
                  </>
                )}
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

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Class</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowCreateModal(false)}
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClass}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g. 10A - Mathematics"
                    value={newClass.name}
                    onChange={(e) =>
                      setNewClass({ ...newClass, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g. Mathematics"
                    value={newClass.subject}
                    onChange={(e) =>
                      setNewClass({ ...newClass, subject: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade & Section
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="w-1/2 border rounded-lg px-3 py-2"
                      placeholder="Grade"
                      value={newClass.grade}
                      onChange={(e) =>
                        setNewClass({ ...newClass, grade: e.target.value })
                      }
                      required
                    />
                    <input
                      type="text"
                      className="w-1/2 border rounded-lg px-3 py-2"
                      placeholder="Section"
                      value={newClass.section}
                      onChange={(e) =>
                        setNewClass({ ...newClass, section: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g. Mon, Wed 9:00-10:30"
                    value={newClass.schedule}
                    onChange={(e) =>
                      setNewClass({ ...newClass, schedule: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g. B-103"
                    value={newClass.room}
                    onChange={(e) =>
                      setNewClass({ ...newClass, room: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Establishment (Optional)
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={newClass.establishment}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        establishment: e.target.value,
                      })
                    }
                  >
                    <option value="">None (Independent Class)</option>
                    {establishments.map((est) => (
                      <option key={est.id} value={est.name}>
                        {est.name}
                      </option>
                    ))}
                  </select>

                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <Info size={14} className="mr-1" />
                    <span>
                      {newClass.establishment
                        ? "This class will need approval from the establishment"
                        : "Independent classes require payment for activation"}
                    </span>
                  </div>
                </div>

                {/* Show unique code field only if selected establishment requires it */}
                {newClass.establishment &&
                  establishments.find(
                    (est) =>
                      est.name === newClass.establishment &&
                      est.optionTokenGeneral
                  ) && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Establishment Code
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Enter the unique code provided by your establishment"
                        value={newClass.codeUnique}
                        onChange={(e) =>
                          setNewClass({
                            ...newClass,
                            codeUnique: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Token Display Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Class Created Successfully</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowTokenModal(false)}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>

              <h3 className="text-lg font-medium mb-2">Your class token is:</h3>
              <div className="bg-gray-100 p-4 rounded-lg text-xl font-mono mb-4">
                CLASS-12345-TOKEN
              </div>

              <p className="text-gray-600 text-sm mb-4">
                {newClass.establishment
                  ? "Your class is pending approval from the establishment. You can use this token once approved."
                  : "Your class is now active. Share this token with students and parents to provide access."}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                onClick={() => setShowTokenModal(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Complete Payment</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowPaymentModal(false)}
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handlePayment}>
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  Independent classes require a one-time payment for activation.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="MM/YY"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name on Card
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Pay & Activate Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivation Modal */}
      {userRole === "establishment" || userRole === "administrator" ? (
        <DeactivationModal />
      ) : null}
    </div>
  );
};

// DeactivationModal Component
const DeactivationModal = ({ isOpen, onClose, classInfo, onSubmit }) => {
  const [formData, setFormData] = useState({
    motifRejet: "Classe",
    commentaire: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Deactivate Class</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <XCircle size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              You are about to deactivate: <strong>{classInfo?.name}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Deactivation
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={formData.motifRejet}
                onChange={(e) =>
                  setFormData({ ...formData, motifRejet: e.target.value })
                }
                required
              >
                <option value="Classe">Class Issue</option>
                <option value="Photo">Photo Related</option>
                <option value="Autre">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comments
              </label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 min-h-24"
                placeholder="Provide additional information about the deactivation..."
                value={formData.commentaire}
                onChange={(e) =>
                  setFormData({ ...formData, commentaire: e.target.value })
                }
                required
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Confirm Deactivation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add a class activation history component
const ClassActivationHistory = ({ history }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="border-t mt-4 pt-4">
      <h4 className="text-sm font-medium mb-2">Activation History</h4>
      <div className="text-xs space-y-2">
        {history.map((item, idx) => (
          <div
            key={idx}
            className="bg-gray-50 p-2 rounded flex justify-between"
          >
            <div>
              <span
                className={`inline-block px-1.5 py-0.5 rounded ${
                  item.action === "activated"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {item.action === "activated" ? "Activated" : "Deactivated"}
              </span>
              {item.motifRejet && (
                <span className="ml-2 text-gray-600">
                  Reason: {item.motifRejet}
                </span>
              )}
            </div>
            <div className="text-gray-500">{item.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Add the ClassAccessRequestModal component
const ClassAccessRequestModal = ({ isOpen, onClose, classInfo }) => {
  const [role, setRole] = useState("student");
  const [childInfo, setChildInfo] = useState({
    name: "",
    age: "",
    isMinor: true,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Access Request</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <XCircle size={20} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-700">
            You are requesting access to: <strong>{classInfo?.name}</strong>
          </p>
          <p className="text-gray-500 text-sm mt-1">
            <span className="flex items-center">
              <Users size={14} className="mr-1" /> {classInfo?.professor}
            </span>
            {classInfo?.establishment && (
              <span className="flex items-center mt-1">
                <Building size={14} className="mr-1" />{" "}
                {classInfo?.establishment}
              </span>
            )}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Request as
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </div>

        {role === "parent" && (
          <div className="border-t pt-4 mt-4">
            <h3 className="text-md font-medium mb-2">Child Information</h3>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child's Name
              </label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Enter child's name"
                value={childInfo.name}
                onChange={(e) =>
                  setChildInfo({ ...childInfo, name: e.target.value })
                }
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child's Age
              </label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Enter child's age"
                value={childInfo.age}
                onChange={(e) => {
                  const age = parseInt(e.target.value);
                  setChildInfo({
                    ...childInfo,
                    age: e.target.value,
                    isMinor: age < 18,
                  });
                }}
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              {childInfo.isMinor
                ? "Your child is a minor. Parent access will be granted upon approval."
                : "Your child is an adult. They will need to confirm your access request."}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassesContent;
