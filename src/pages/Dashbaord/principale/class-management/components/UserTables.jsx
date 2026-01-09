// components/UserTables.jsx - UPDATED WITH DATE DE CRÉATION FOR ALL USER TYPES
import React, { useState, useEffect } from "react";
import { Table, Tag, Button, Space, Popconfirm, Tooltip, message } from "antd";
import {
  EyeOutlined,
  UserDeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { scholchatService } from "../../../../../services/ScholchatService";

const UserTables = ({
  users,
  loading,
  userType,
  onViewUser,
  onRemoveAccess,
  onDeleteUser, // Handler for deleting users from system
  onApproveRequest,
  onRejectRequest,
  currentTab,
  classId,
}) => {
  useEffect(() => {
    console.log(`UserTables - ${userType}:`, users);
    console.log(`Nombre d'${userType}:`, users.length);
  }, [users, userType]);

  const [tableLoading, setTableLoading] = useState(false);

  const handleDeleteUser = async (userId, userType) => {
    try {
      setTableLoading(true);

      switch (userType) {
        case "professeurs":
          await scholchatService.deleteProfessor(userId);
          message.success("Professeur supprimé avec succès");
          break;
        case "eleves":
          await scholchatService.deleteStudent(userId);
          message.success("Étudiant supprimé avec succès");
          break;
        case "parents":
          await scholchatService.deleteParent(userId);
          message.success("Parent supprimé avec succès");
          break;
        case "utilisateurs":
          // For utilisateurs, we'll use the onDeleteUser prop since they may need special handling
          if (onDeleteUser) {
            await onDeleteUser({ id: userId, type: "utilisateur" });
          } else {
            // Fallback - try to delete as a general user (you may need to implement this endpoint)
            message.warning(
              "Suppression non implémentée pour ce type d'utilisateur"
            );
          }
          break;
        default:
          throw new Error("Type d'utilisateur non reconnu");
      }

      // Trigger refresh of data in parent component
      if (window.location) {
        window.location.reload();
      }
    } catch (error) {
      console.error(`Error deleting ${userType}:`, error);
      message.error(`Erreur lors de la suppression de l'utilisateur`);
    } finally {
      setTableLoading(false);
    }
  };

  const getColumns = (type) => {
    // Vérifier si les données sont valides
    if (!users || !Array.isArray(users)) {
      console.warn(`Aucune donnée valide pour ${type}`);
      return [];
    }

    const baseColumns = [
      {
        title: "Nom",
        dataIndex: "nom",
        key: "nom",
        render: (text, record) => {
          // Gérer les cas où les données pourraient être incomplètes
          if (!record) return "N/A";
          return (
            `${record.prenom || ""} ${text || ""}`.trim() || "Non renseigné"
          );
        },
        sorter: (a, b) => {
          const nameA = `${a.prenom || ""} ${a.nom || ""}`.trim().toLowerCase();
          const nameB = `${b.prenom || ""} ${b.nom || ""}`.trim().toLowerCase();
          return nameA.localeCompare(nameB);
        },
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
      },
      {
        title: "Téléphone",
        dataIndex: "telephone",
        key: "telephone",
      },
    ];

    // Add specific columns based on user type
    if (type === "professeurs") {
      baseColumns.push(
        {
          title: "Établissement",
          dataIndex: "nomEtablissement",
          key: "nomEtablissement",
        },
        {
          title: "Matricule",
          dataIndex: "matriculeProfesseur",
          key: "matriculeProfesseur",
        },
        {
          title: "Date de création",
          dataIndex: "creationDate",
          key: "creationDate",
          render: (date, record) => {
            // Try different possible date field names for professors
            const dateValue =
              date ||
              record?.dateCreation ||
              record?.dateInscription ||
              record?.dateAjout;
            if (!dateValue) return "N/A";
            return new Date(dateValue).toLocaleDateString("fr-FR");
          },
          sorter: (a, b) => {
            const dateA =
              a.creationDate ||
              a.dateCreation ||
              a.dateInscription ||
              a.dateAjout;
            const dateB =
              b.creationDate ||
              b.dateCreation ||
              b.dateInscription ||
              b.dateAjout;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return new Date(dateA) - new Date(dateB);
          },
        }
      );
    } else if (type === "eleves") {
      baseColumns.push(
        {
          title: "Niveau",
          dataIndex: "niveau",
          key: "niveau",
        },
        {
          title: "Date de création",
          dataIndex: "creationDate",
          key: "creationDate",
          render: (date, record) => {
            // Try different possible date field names for students
            const dateValue =
              date ||
              record?.dateCreation ||
              record?.dateInscription ||
              record?.dateAjout;
            if (!dateValue) return "N/A";
            return new Date(dateValue).toLocaleDateString("fr-FR");
          },
          sorter: (a, b) => {
            const dateA =
              a.creationDate ||
              a.dateCreation ||
              a.dateInscription ||
              a.dateAjout;
            const dateB =
              b.creationDate ||
              b.dateCreation ||
              b.dateInscription ||
              b.dateAjout;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return new Date(dateA) - new Date(dateB);
          },
        }
      );
    } else if (type === "parents") {
      baseColumns.push(
        {
          title: "Adresse",
          dataIndex: "adresse",
          key: "adresse",
        },
        {
          title: "Date de création",
          dataIndex: "creationDate",
          key: "creationDate",
          render: (date, record) => {
            // Try different possible date field names for parents
            const dateValue =
              date ||
              record?.dateCreation ||
              record?.dateInscription ||
              record?.dateAjout;
            if (!dateValue) return "N/A";
            return new Date(dateValue).toLocaleDateString("fr-FR");
          },
          sorter: (a, b) => {
            const dateA =
              a.creationDate ||
              a.dateCreation ||
              a.dateInscription ||
              a.dateAjout;
            const dateB =
              b.creationDate ||
              b.dateCreation ||
              b.dateInscription ||
              b.dateAjout;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return new Date(dateA) - new Date(dateB);
          },
        }
      );
    } else if (type === "utilisateurs") {
      // Columns specific to utilisateurs (unchanged from your original code)
      baseColumns.push(
        {
          title: "Adresse",
          dataIndex: "adresse",
          key: "adresse",
        },
        {
          title: "Type",
          dataIndex: "type",
          key: "type",
          render: (type) => (
            <Tag color="purple">
              {type === "utilisateur" ? "Utilisateur" : type}
            </Tag>
          ),
        },
        {
          title: "Admin",
          dataIndex: "admin",
          key: "admin",
          render: (isAdmin) => (
            <Tag color={isAdmin ? "gold" : "default"}>
              {isAdmin ? "Oui" : "Non"}
            </Tag>
          ),
        },
        {
          title: "Date de création",
          dataIndex: "creationDate",
          key: "creationDate",
          render: (date, record) => {
            // Try different possible date field names for utilisateurs
            const dateValue =
              date ||
              record?.dateCreation ||
              record?.dateInscription ||
              record?.dateAjout;
            if (!dateValue) return "N/A";
            return new Date(dateValue).toLocaleDateString("fr-FR");
          },
          sorter: (a, b) => {
            const dateA =
              a.creationDate ||
              a.dateCreation ||
              a.dateInscription ||
              a.dateAjout;
            const dateB =
              b.creationDate ||
              b.dateCreation ||
              b.dateInscription ||
              b.dateAjout;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return new Date(dateA) - new Date(dateB);
          },
        }
      );
    }

    // Add status column for all types except access requests
    if (type !== "access-requests") {
      baseColumns.push({
        title: "Statut",
        dataIndex: "etat",
        key: "etat",
        render: (etat) => {
          const isActive = etat === "ACTIVE" || etat === "ACTIF";
          return (
            <Tag color={isActive ? "green" : "red"}>
              {isActive ? "Actif" : "Inactif"}
            </Tag>
          );
        },
        filters: [
          { text: "Actif", value: "ACTIVE" },
          { text: "Inactif", value: "INACTIVE" },
        ],
        onFilter: (value, record) => {
          const isActive = record.etat === "ACTIVE" || record.etat === "ACTIF";
          return value === "ACTIVE" ? isActive : !isActive;
        },
      });
    }

    const actionColumn = {
      title: "Actions",
      key: "actions",
      width: type === "access-requests" ? 150 : 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir les détails">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => onViewUser(record)}
            />
          </Tooltip>

          {type === "access-requests" ? (
            <>
              <Tooltip title="Approuver la demande">
                <Button
                  icon={<CheckOutlined />}
                  size="small"
                  type="primary"
                  onClick={() => onApproveRequest(record)}
                />
              </Tooltip>
              <Tooltip title="Rejeter la demande">
                <Button
                  icon={<CloseOutlined />}
                  size="small"
                  danger
                  onClick={() => onRejectRequest(record)}
                />
              </Tooltip>
            </>
          ) : (
            <>
              <Popconfirm
                title={`Retirer l'accès de cet utilisateur ?`}
                description="Cette action retirera l'accès de l'utilisateur à cette classe."
                onConfirm={() => onRemoveAccess(record)}
                okText="Oui"
                cancelText="Non"
              >
                <Tooltip title="Retirer l'accès à la classe">
                  <Button icon={<UserDeleteOutlined />} size="small" danger />
                </Tooltip>
              </Popconfirm>

              {/* Show delete button for all user types including utilisateurs */}
              <Popconfirm
                title={`Supprimer définitivement cet utilisateur ?`}
                description="Cette action supprimera complètement l'utilisateur du système. Cette action est irréversible."
                onConfirm={() => handleDeleteUser(record.id, type)}
                okText="Supprimer"
                cancelText="Annuler"
                okType="danger"
              >
                <Tooltip title="Supprimer l'utilisateur du système">
                  <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                    type="primary"
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    };

    // Add specific columns for access requests
    if (type === "access-requests") {
      baseColumns.push(
        {
          title: "Date Demande",
          dataIndex: "dateDemande",
          key: "dateDemande",
          render: (date) => new Date(date).toLocaleDateString("fr-FR"),
          sorter: (a, b) => new Date(a.dateDemande) - new Date(b.dateDemande),
        },
        {
          title: "Type",
          dataIndex: "typeUtilisateur",
          key: "typeUtilisateur",
          render: (type) => (
            <Tag
              color={
                type === "PROFESSEUR"
                  ? "blue"
                  : type === "ELEVE"
                  ? "green"
                  : type === "PARENT"
                  ? "orange"
                  : "purple" // Color for general utilisateur
              }
            >
              {type === "PROFESSEUR"
                ? "Professeur"
                : type === "ELEVE"
                ? "Élève"
                : type === "PARENT"
                ? "Parent"
                : type === "UTILISATEUR"
                ? "Utilisateur"
                : type}
            </Tag>
          ),
          filters: [
            { text: "Professeur", value: "PROFESSEUR" },
            { text: "Élève", value: "ELEVE" },
            { text: "Parent", value: "PARENT" },
            { text: "Utilisateur", value: "UTILISATEUR" },
          ],
          onFilter: (value, record) => record.typeUtilisateur === value,
        },
        {
          title: "Statut Demande",
          dataIndex: "etat",
          key: "etat",
          render: (etat) => (
            <Tag color={etat === "EN_ATTENTE" ? "orange" : "default"}>
              {etat === "EN_ATTENTE" ? "En attente" : etat}
            </Tag>
          ),
        }
      );
    }

    return [...baseColumns, actionColumn];
  };

  const getTableTitle = () => {
    const titles = {
      professeurs: "Professeurs ayant accès à la classe",
      eleves: "Élèves ayant accès à la classe",
      parents: "Parents ayant accès à la classe",
      utilisateurs: "Utilisateurs ayant accès à la classe",
      "access-requests": "Demandes d'accès en attente d'approbation",
    };
    return titles[userType] || "Utilisateurs";
  };

  const getEmptyText = () => {
    const emptyTexts = {
      professeurs: "Aucun professeur n'a accès à cette classe",
      eleves: "Aucun élève n'a accès à cette classe",
      parents: "Aucun parent n'a accès à cette classe",
      utilisateurs: "Aucun utilisateur n'a accès à cette classe",
      "access-requests": "Aucune demande d'accès en attente",
    };
    return emptyTexts[userType] || `Aucun ${userType} trouvé`;
  };

  return (
    <div className="user-table-container">
      <Table
        title={() => (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: "bold", fontSize: "16px" }}>
              {getTableTitle()}
            </span>
            <Tag color="blue" style={{ fontSize: "12px" }}>
              {users.length}{" "}
              {userType === "access-requests" ? "demande(s)" : "utilisateur(s)"}
            </Tag>
          </div>
        )}
        columns={getColumns(userType)}
        dataSource={users}
        loading={loading || tableLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} sur ${total} ${
              userType === "access-requests" ? "demandes" : "utilisateurs"
            }`,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
        scroll={{ x: 800 }}
        rowKey="id"
        locale={{
          emptyText: getEmptyText(),
        }}
        size="middle"
        bordered
        style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      />
    </div>
  );
};

export default UserTables;
