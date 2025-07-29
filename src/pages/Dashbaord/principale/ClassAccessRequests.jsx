import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  message,
  Empty,
  Tabs,
  Typography,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  DeleteOutlined,
  UserOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import AccederService from "../../../services/accederService";

const { TabPane } = Tabs;
const { Text } = Typography;

const ClassAccessRequests = ({
  classId,
  onError,
  onSuccess,
  onRefreshMembers,
}) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedMembers, setApprovedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    if (classId) {
      fetchAccessData();
    }
  }, [classId]);

  const fetchAccessData = async () => {
    try {
      setLoading(true);
      setError(null);

      const requests = await AccederService.obtenirDemandesAccesPourClasse(
        classId
      );
      const membersResponse = await fetch(
        `http://localhost:8486/scholchat/acceder/classes/utilisateurs?classeIds=${classId}`
      );

      if (!membersResponse.ok) {
        throw new Error("Failed to fetch approved members");
      }

      const members = await membersResponse.json();

      const processedRequests = (requests || [])
        .filter((request) => request.etat === "EN_ATTENTE")
        .map((request) => ({
          ...request,
          id: request.id || "",
          nom: request.utilisateurNom || "",
          prenom: request.utilisateurPrenom || "",
          email: request.utilisateurEmail || "",
          codeActivation: request.codeActivation || "",
          etat: request.etat || "EN_ATTENTE",
          dateDemande: request.dateDemande || "",
          type: request.type || "REQUESTER",
        }));

      const processedMembers = (members || []).map((member) => ({
        id: member.id || member.utilisateurId || "",
        nom: member.nom || member.utilisateurNom || "",
        prenom: member.prenom || member.utilisateurPrenom || "",
        email: member.email || member.utilisateurEmail || "",
        type: member.type || member.role || "MEMBER",
        etat: "APPROUVEE",
        dateApproval: member.dateApproval || member.dateDemande || "",
      }));

      setPendingRequests(processedRequests);
      setApprovedMembers(processedMembers);
    } catch (err) {
      console.error("Error fetching access data:", err);
      setError(err.message || "Failed to load access data");
      if (onError) {
        onError(err.message || "Failed to load access data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler functions moved before they're used in column definitions
  const handleApproveAccessRequest = async (requestId) => {
    try {
      setActionLoading(`approve-${requestId}`);
      await AccederService.validerDemandeAcces(requestId);
      message.success("Access request approved successfully");
      if (onSuccess) {
        onSuccess("Access request approved successfully");
      }
      await fetchAccessData();
      if (onRefreshMembers) {
        await onRefreshMembers();
      }
    } catch (err) {
      console.error("Error approving access request:", err);
      message.error(err.message || "Failed to approve access request");
      if (onError) {
        onError(err.message || "Failed to approve access request");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectAccessRequest = async (requestId) => {
    try {
      setActionLoading(`reject-${requestId}`);
      await AccederService.rejeterDemandeAcces(
        requestId,
        "Rejected by administrator"
      );
      message.success("Access request rejected successfully");
      if (onSuccess) {
        onSuccess("Access request rejected successfully");
      }
      await fetchAccessData();
    } catch (err) {
      console.error("Error rejecting access request:", err);
      message.error(err.message || "Failed to reject access request");
      if (onError) {
        onError(err.message || "Failed to reject access request");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      setActionLoading(`remove-${userId}`);
      await AccederService.retirerAcces(userId, classId);
      message.success("Member removed successfully");
      if (onSuccess) {
        onSuccess("Member removed successfully");
      }
      await fetchAccessData();
      if (onRefreshMembers) {
        await onRefreshMembers();
      }
    } catch (err) {
      console.error("Error removing member:", err);
      message.error(err.message || "Failed to remove member");
      if (onError) {
        onError(err.message || "Failed to remove member");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const renderStatusTag = (etat) => {
    let color, icon, text;
    switch (etat) {
      case "APPROUVEE":
        color = "#52c41a";
        icon = <CheckOutlined />;
        text = "Approved";
        break;
      case "EN_ATTENTE":
        color = "#faad14";
        icon = <ClockCircleOutlined />;
        text = "Pending";
        break;
      case "REJETEE":
        color = "#f5222d";
        icon = <CloseOutlined />;
        text = "Rejected";
        break;
      default:
        color = "#d9d9d9";
        text = etat || "Unknown";
    }

    return (
      <Tag
        icon={icon}
        color={color}
        style={{
          fontWeight: 600,
          fontSize: "12px",
          padding: "4px 12px",
          borderRadius: "16px",
          border: "none",
        }}
      >
        {text}
      </Tag>
    );
  };

  const renderRoleTag = (type) => {
    let color, icon, text;
    switch ((type || "").toLowerCase()) {
      case "admin":
      case "administrator":
        color = "red";
        icon = <TeamOutlined />;
        text = "Admin";
        break;
      case "enseignant":
      case "teacher":
      case "professor":
        color = "blue";
        icon = <UserOutlined />;
        text = "Teacher";
        break;
      case "eleve":
      case "student":
        color = "green";
        icon = <SolutionOutlined />;
        text = "Student";
        break;
      case "parent":
        color = "orange";
        icon = <SafetyCertificateOutlined />;
        text = "Parent";
        break;
      case "utilisateur":
        color = "gray";
        icon = <UserOutlined />;
        text = "User";
        break;
      default:
        color = "gray";
        icon = <UserOutlined />;
        text = type || "Member";
    }

    return (
      <Tag
        icon={icon}
        color={color}
        style={{
          fontWeight: 600,
          fontSize: "12px",
          padding: "4px 12px",
          borderRadius: "16px",
          border: "none",
        }}
      >
        {text}
      </Tag>
    );
  };

  const pendingRequestColumns = [
    {
      title: "Name",
      dataIndex: "nom",
      key: "name",
      render: (text, record) => {
        const name = `${record.nom || ""} ${record.prenom || ""}`.trim();
        return name || <Text type="secondary">N/A</Text>;
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => email || <Text type="secondary">N/A</Text>,
    },
    {
      title: "Role",
      dataIndex: "type",
      key: "type",
      render: (type) => renderRoleTag(type),
    },
    {
      title: "Status",
      dataIndex: "etat",
      key: "status",
      render: (etat) => renderStatusTag(etat),
    },
    {
      title: "Activation Code",
      dataIndex: "codeActivation",
      key: "code",
      render: (code) => code || <Text type="secondary">N/A</Text>,
    },
    {
      title: "Request Date",
      dataIndex: "dateDemande",
      key: "date",
      render: (date) =>
        date ? (
          new Date(date).toLocaleString()
        ) : (
          <Text type="secondary">N/A</Text>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => handleApproveAccessRequest(record.id)}
            loading={actionLoading === `approve-${record.id}`}
            style={{
              borderRadius: "8px",
              background: "#52c41a",
              borderColor: "#52c41a",
            }}
            icon={<CheckOutlined />}
          >
            Approve
          </Button>
          <Button
            danger
            onClick={() => handleRejectAccessRequest(record.id)}
            loading={actionLoading === `reject-${record.id}`}
            style={{ borderRadius: "8px" }}
            icon={<CloseOutlined />}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const memberColumns = [
    {
      title: "Name",
      dataIndex: "nom",
      key: "name",
      render: (text, record) => {
        const name = `${record.nom || ""} ${record.prenom || ""}`.trim();
        return name || <Text type="secondary">N/A</Text>;
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => email || <Text type="secondary">N/A</Text>,
    },
    {
      title: "Role",
      dataIndex: "type",
      key: "type",
      render: (type) => renderRoleTag(type),
    },
    {
      title: "Join Date",
      dataIndex: "dateApproval",
      key: "date",
      render: (date) =>
        date ? (
          new Date(date).toLocaleString()
        ) : (
          <Text type="secondary">N/A</Text>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveMember(record.id)}
          loading={actionLoading === `remove-${record.id}`}
          style={{ borderRadius: "8px" }}
        >
          Remove
        </Button>
      ),
    },
  ];

  if (error) {
    return (
      <Empty
        description={
          <span style={{ color: "#ff4d4f" }}>
            Error loading access data: {error}
          </span>
        }
      />
    );
  }

  return (
    <Tabs
      defaultActiveKey="pending"
      activeKey={activeTab}
      onChange={setActiveTab}
      style={{ background: "#fff", padding: "16px", borderRadius: "8px" }}
    >
      <TabPane
        tab={
          <span>
            <ExclamationCircleOutlined />
            Pending Requests ({pendingRequests.length})
          </span>
        }
        key="pending"
      >
        <Table
          columns={pendingRequestColumns}
          dataSource={pendingRequests}
          loading={loading}
          rowKey="id"
          locale={{
            emptyText: (
              <Empty
                description="No pending requests found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} requests`,
          }}
        />
      </TabPane>
      <TabPane
        tab={
          <span>
            <TeamOutlined />
            Approved Members ({approvedMembers.length})
          </span>
        }
        key="members"
      >
        <Table
          columns={memberColumns}
          dataSource={approvedMembers}
          loading={loading}
          rowKey="id"
          locale={{
            emptyText: (
              <Empty
                description="No approved members found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} members`,
          }}
        />
      </TabPane>
    </Tabs>
  );
};

export default ClassAccessRequests;
