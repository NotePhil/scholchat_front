import React, { useState, useEffect } from "react";
import { Users, BookOpen, UserPlus, ClipboardList } from "lucide-react";
import { scholchatService } from "../../../services/ScholchatService";
import UserTable from "./tables/UserTable";
import UserModal from "./modals/UserModal";
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
  const [modalType, setModalType] = useState("create");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

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
          scholchatService.getAllUsers(),
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
        response = await scholchatService.getAllUsers();
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
    } finally {
      setLoading(false);
    }
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
    setModalType("view");
    setIsModalOpen(true);
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
          break;
        case "edit":
          await methods.update(id, userData);
          break;
        case "delete":
          await methods.delete(id);
          break;
        default:
          throw new Error("Invalid modal type");
      }

      // Refresh data
      await Promise.all([fetchUsers(activeTab), fetchStats()]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error submitting user:", error);
      // You might want to add error state handling here
    }
  };

  const filteredUsers = users.filter((user) => {
    if (activeTab === "all") return true;
    return user.type === activeTab;
  });

  return (
    <div className="admin-dashboard">
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
    </div>
  );
};

export default AdminDashboard;
