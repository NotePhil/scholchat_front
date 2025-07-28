import React, { useState, useEffect } from "react";
import { Card, Space, Typography, Alert, Button, message, Spin } from "antd";
import { BookOutlined } from "@ant-design/icons";
import { classService } from "../../../services/ClassService";
import ManageClassList from "./ManageClassList";
import ManageClassDetailsView from "./ManageClassDetailsView";

const { Text, Title } = Typography;

const ManageClassContent = ({ onBack }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Auto-clear messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Load all data on mount
  useEffect(() => {
    fetchUserClasses();
  }, []);

  // Get user ID from localStorage/sessionStorage
  const getUserId = () => {
    // Try to get from localStorage first
    const userId =
      localStorage.getItem("userId") || sessionStorage.getItem("userId");

    if (!userId) {
      console.error("No user ID found in storage");
      setError("Erreur: Utilisateur non authentifié");
      return null;
    }

    console.log("Retrieved user ID:", userId);
    return userId;
  };

  const fetchUserClasses = async () => {
    try {
      setLoading(true);
      setError("");

      const userId = getUserId();
      if (!userId) {
        return;
      }

      // Use the new endpoint to get classes for the specific user
      const data = await classService.obtenirClassesUtilisateur(userId);
      setClasses(data || []);

      console.log("Fetched user classes:", data);
    } catch (error) {
      console.error("Error fetching user classes:", error);
      setError("Erreur lors du chargement de vos classes");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserClasses();
    setRefreshing(false);
    setSuccessMessage("Données actualisées avec succès");
  };

  const handleSelectClass = (classId) => {
    setSelectedClassId(classId);
    setError("");
    setSuccessMessage("");
  };

  const handleBackToList = () => {
    setSelectedClassId(null);
    setError("");
    setSuccessMessage("");
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <Card
        style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e1e4e8",
          overflow: "hidden",
        }}
      >
        {!selectedClassId ? (
          <div style={{ padding: "24px" }}>
            <div style={{ marginBottom: "24px" }}>
              <Space align="center" style={{ marginBottom: "16px" }}>
                <BookOutlined style={{ fontSize: "24px", color: "#4a6da7" }} />
                <Title level={2} style={{ margin: 0, color: "#2c3e50" }}>
                  Mes Classes
                </Title>
              </Space>
              <Text type="secondary" style={{ fontSize: "16px" }}>
                Gérez et supervisez les classes auxquelles vous avez accès
              </Text>
            </div>

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                style={{ marginBottom: "16px", borderRadius: "8px" }}
                onClose={() => setError("")}
              />
            )}

            {successMessage && (
              <Alert
                message={successMessage}
                type="success"
                showIcon
                closable
                style={{ marginBottom: "16px", borderRadius: "8px" }}
                onClose={() => setSuccessMessage("")}
              />
            )}

            <ManageClassList
              classes={classes}
              loading={loading}
              error={error}
              successMessage={successMessage}
              refreshing={refreshing}
              onSelectClass={handleSelectClass}
              onRefresh={handleRefresh}
              onBack={onBack}
            />
          </div>
        ) : (
          <ManageClassDetailsView
            classId={selectedClassId}
            onBack={handleBackToList}
            onRefresh={handleRefresh}
            onError={setError}
            onSuccess={setSuccessMessage}
          />
        )}
      </Card>
    </div>
  );
};

export default ManageClassContent;
