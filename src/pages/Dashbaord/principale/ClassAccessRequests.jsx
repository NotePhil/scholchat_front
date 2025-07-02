import React, { useState, useEffect } from "react";
import { Table, Tag, Button, Space, Spin, message, Empty, Tabs } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import AccederService from "../../../services/accederService";

const { TabPane } = Tabs;

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

      // Fetch both requests and approved members in parallel
      const [requests, members] = await Promise.all([
        AccederService.obtenirDemandesAccesPourClasse(classId),
        AccederService.obtenirUtilisateursAvecAcces(classId),
      ]);

      console.log("Fetched requests:", requests);
      console.log("Fetched members:", members);

      // Process requests to ensure all fields are properly defined
      const processedRequests = (requests || []).map((request) => ({
        ...request,
        id: request.id || "",
        utilisateurNom: request.utilisateurNom || "",
        utilisateurPrenom: request.utilisateurPrenom || "",
        utilisateurEmail: request.utilisateurEmail || "",
        codeActivation: request.codeActivation || "",
        etat: request.etat || "",
        dateDemande: request.dateDemande || "",
      }));

      // Separate requests by status
      const pending = processedRequests.filter(
        (req) => req.etat === "EN_ATTENTE"
      );

      setPendingRequests(pending);
      setApprovedMembers(members || []);
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

  const handleApproveAccessRequest = async (requestId) => {
    try {
      setActionLoading(`approve-${requestId}`);
      console.log("Approving request with ID:", requestId);

      const response = await AccederService.validerDemandeAcces(requestId);
      console.log("Approval response:", response);

      message.success("Access request approved successfully");
      if (onSuccess) {
        onSuccess("Access request approved successfully");
      }

      // Refresh data after approval
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
      console.log("Rejecting request with ID:", requestId);

      const response = await AccederService.rejeterDemandeAcces(
        requestId,
        "Rejected by administrator"
      );
      console.log("Rejection response:", response);

      message.success("Access request rejected successfully");
      if (onSuccess) {
        onSuccess("Access request rejected successfully");
      }

      // Refresh data after rejection
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
      console.log("Removing member with ID:", userId);

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
        icon = <ExclamationCircleOutlined />;
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

  const pendingRequestColumns = [
    {
      title: "Name",
      dataIndex: "utilisateurNom",
      key: "name",
      render: (text, record) => {
        const name = `${record.utilisateurNom || ""} ${
          record.utilisateurPrenom || ""
        }`.trim();
        return name || "N/A";
      },
    },
    {
      title: "Email",
      dataIndex: "utilisateurEmail",
      key: "email",
      render: (email) => email || "N/A",
    },
    {
      title: "Activation Code",
      dataIndex: "codeActivation",
      key: "code",
      render: (code) => code || "N/A",
    },
    {
      title: "Request Date",
      dataIndex: "dateDemande",
      key: "date",
      render: (date) => (date ? new Date(date).toLocaleString() : "N/A"),
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
          >
            Approve
          </Button>
          <Button
            danger
            onClick={() => handleRejectAccessRequest(record.id)}
            loading={actionLoading === `reject-${record.id}`}
            style={{ borderRadius: "8px" }}
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
        return name || "N/A";
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => email || "N/A",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag color="geekblue">{type || "N/A"}</Tag>,
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
          scroll={{ x: 800 }}
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
          scroll={{ x: 800 }}
        />
      </TabPane>
    </Tabs>
  );
};

export default ClassAccessRequests;
