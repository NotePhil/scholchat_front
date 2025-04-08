import React, { useState, useEffect } from "react";
import { Users, BookOpen, UserPlus, ClipboardList } from "lucide-react";
import { scholchatService } from "../../../services/ScholchatService";
import { userService } from "../../../services/userService";
import UserTable from "./tables/UserTable";
import UserModal from "./modals/UserModal";
import UserViewModal from "./modals/UserViewModal";
import StatsCard from "../components/common/StatsCard";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProfessors: 0,
    totalParents: 0,
    totalStudents: 0,
    totalTutors: 0,
  });
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [notification, setNotification] = useState(null);

  // Role mapping configuration
  const roleConfig = {
    Professeur: {
      displayName: "Professeur",
      apiType: "Professeur",
      icon: BookOpen,
      fetchMethod: scholchatService.getAllProfessors,
      statsKey: "totalProfessors",
    },
    parent: {
      displayName: "Parent",
      apiType: "parent",
      icon: UserPlus,
      fetchMethod: scholchatService.getAllParents,
      statsKey: "totalParents",
    },
    eleve: {
      displayName: "Eleve",
      apiType: "eleve",
      icon: ClipboardList,
      fetchMethod: scholchatService.getAllStudents,
      statsKey: "totalStudents",
    },
    repetiteur: {
      displayName: "Repetiteur",
      apiType: "repetiteur",
      icon: BookOpen,
      fetchMethod: scholchatService.getAllTutors,
      statsKey: "totalTutors",
    },
    utilisateur: {
      displayName: "Utilisateur",
      apiType: "utilisateur",
      icon: Users,
      statsKey: "totalUsers",
    },
  };

  useEffect(() => {
    fetchStats();
    fetchUsers("all");
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, professorsRes, parentsRes, studentsRes, tutorsRes] =
        await Promise.all([
          userService.getAllUsers(),
          scholchatService.getAllProfessors(),
          scholchatService.getAllParents(),
          scholchatService.getAllStudents(),
          scholchatService.getAllTutors(),
        ]);

      setStats({
        totalUsers: usersRes.length,
        totalProfessors: professorsRes.length,
        totalParents: parentsRes.length,
        totalStudents: studentsRes.length,
        totalTutors: tutorsRes.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      showNotification("Error fetching statistics", "error");
    }
  };

  const normalizeUserRole = (user) => {
    // First check the type field, then role field, default to "utilisateur"
    const userType = user.type || user.role || "utilisateur";

    // Find the matching role configuration (case insensitive)
    const matchedRole = Object.values(roleConfig).find(
      (config) => config.apiType.toLowerCase() === userType.toLowerCase()
    );

    return matchedRole || roleConfig.utilisateur;
  };

  const fetchUsers = async (type) => {
    setLoading(true);
    try {
      let response;

      if (type === "all") {
        response = await userService.getAllUsers();
        response = response.map((user) => {
          const roleInfo = normalizeUserRole(user);
          return {
            ...user,
            type: roleInfo.apiType,
            role: roleInfo.displayName,
          };
        });
      } else {
        const roleInfo = roleConfig[type];
        if (!roleInfo || !roleInfo.fetchMethod) {
          throw new Error(`Invalid user type: ${type}`);
        }

        response = await roleInfo.fetchMethod();
        response = response.map((user) => ({
          ...user,
          type: roleInfo.apiType,
          role: roleInfo.displayName,
        }));
      }

      setUsers(response);
    } catch (error) {
      console.error("Error fetching users:", error);
      showNotification("Error fetching users", "error");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleTabChange = (type) => {
    setActiveTab(type);
    fetchUsers(type);
  };

  const handleCreate = () => {
    setCurrentUser(null);
    setModalType("create");
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setCurrentUser(user);
    setModalType("edit");
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    setCurrentUser(user);
    setModalType("delete");
    setIsModalOpen(true);
  };

  const handleView = (user) => {
    setCurrentUser(user);
    setIsViewModalOpen(true);
  };

  const handleApproveUser = async (user) => {
    try {
      // Check if user is a professor, as verification is currently only for professors
      if (user.type.toLowerCase() === "professeur") {
        // Call the verification service to approve the professor
        await scholchatService.verifyProfessor(user.id, { status: "APPROVED" });

        // Update the user in the local state
        updateUserInState(user.id, { verificationStatus: "APPROVED" });

        showNotification(`Successfully approved ${user.nom} ${user.prenom}`);
      } else {
        showNotification(
          "Verification is only available for professors",
          "warning"
        );
      }

      setIsViewModalOpen(false);
    } catch (error) {
      console.error("Error approving user:", error);
      showNotification("Error approving user", "error");
    }
  };

  const handleRejectUser = async (rejectionData) => {
    try {
      // Check if user is a professor, as verification is currently only for professors
      if (currentUser.type.toLowerCase() === "professeur") {
        // Call the verification service to reject the professor
        await scholchatService.verifyProfessor(currentUser.id, {
          status: "REJECTED",
          motifs: rejectionData.motifs,
        });

        // Format the rejection motifs for display
        const motifDescriptions = rejectionData.motifs
          .filter((motif) => typeof motif !== "string" && motif.descriptif)
          .map((motif) => motif.descriptif)
          .join("; ");

        // Update the user in the local state
        updateUserInState(currentUser.id, {
          verificationStatus: "REJECTED",
          motif: motifDescriptions,
        });

        showNotification(
          `Successfully rejected ${currentUser.nom} ${currentUser.prenom}`
        );
      } else {
        showNotification(
          "Verification is only available for professors",
          "warning"
        );
      }

      setIsViewModalOpen(false);
    } catch (error) {
      console.error("Error rejecting user:", error);
      showNotification("Error rejecting user", "error");
    }
  };

  const updateUserInState = (userId, updates) => {
    setUsers(
      users.map((user) => (user.id === userId ? { ...user, ...updates } : user))
    );
  };

  const handleSubmit = async (userData) => {
    try {
      const userType =
        modalType === "create" ? userData.type : currentUser.type;

      const apiMethods = {
        Professeur: {
          create: scholchatService.createProfessor,
          update: scholchatService.updateProfessor,
          delete: scholchatService.deleteProfessor,
        },
        parent: {
          create: scholchatService.createParent,
          update: scholchatService.updateParent,
          delete: scholchatService.deleteParent,
        },
        eleve: {
          create: scholchatService.createStudent,
          update: scholchatService.updateStudent,
          delete: scholchatService.deleteStudent,
        },
        repetiteur: {
          create: scholchatService.createTutor,
          update: scholchatService.updateTutor,
          delete: scholchatService.deleteTutor,
        },
        default: {
          create: scholchatService.createUser,
          update: scholchatService.updateUser,
          delete: scholchatService.deleteUser,
        },
      };

      const methods = apiMethods[userType] || apiMethods.default;
      const id = currentUser?.id;

      switch (modalType) {
        case "create":
          await methods.create(userData);
          showNotification("User created successfully");
          break;
        case "edit":
          await methods.update(id, userData);
          showNotification("User updated successfully");
          break;
        case "delete":
          await methods.delete(id);
          showNotification("User deleted successfully");
          break;
        default:
          throw new Error("Invalid modal type");
      }

      // Refresh data
      await Promise.all([fetchUsers(activeTab), fetchStats()]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error submitting user:", error);
      showNotification("Error processing user data", "error");
    }
  };

  const filteredUsers = users.filter((user) => {
    if (activeTab === "all") return true;
    return user.type.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="admin-dashboard">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
            notification.type === "error"
              ? "bg-red-100 text-red-800 border-l-4 border-red-500"
              : notification.type === "warning"
              ? "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500"
              : "bg-green-100 text-green-800 border-l-4 border-green-500"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {Object.entries(roleConfig).map(([key, config]) => {
          if (!config.icon) return null; // Skip if no icon (like utilisateur)

          return (
            <StatsCard
              key={key}
              title={
                config.displayName +
                (key === "Professeur" ? "s" : key === "eleve" ? "s" : "s")
              }
              icon={config.icon}
              count={stats[config.statsKey] || 0}
              activeCount={stats[config.statsKey] || 0}
              onClick={() => handleTabChange(key)}
              isActive={activeTab === key}
            />
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold">
            {activeTab === "all"
              ? "All Users"
              : roleConfig[activeTab]?.displayName + "s"}
          </h2>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New User
          </button>
        </div>

        <UserTable
          users={filteredUsers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      </div>

      {isModalOpen && (
        <UserModal
          user={currentUser}
          type={modalType}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {isViewModalOpen && (
        <UserViewModal
          user={currentUser}
          onClose={() => setIsViewModalOpen(false)}
          onApprove={handleApproveUser}
          onReject={handleRejectUser}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
