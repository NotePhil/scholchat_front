import React, { useState, useEffect } from "react";
import { Space, Typography, Alert, Button, message, Spin } from "antd";
import { BookOutlined } from "@ant-design/icons";
import { classService } from "../../../../../services/ClassService";
import ManageClassList from "../../class-management/ManageClassList";
import ManageClassDetailsView from "../../class-management/ManageClassDetailsView";
import { useTranslation } from "../../../../../hooks/useTranslation";

const { Text, Title } = Typography;

const ManageClassContent = ({ onBack, tabData, setActiveTab }) => {
  const { t } = useTranslation();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(tabData?.classId || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Update selected class if tabData changes (e.g. from notification)
  useEffect(() => {
    if (tabData?.classId) {
      setSelectedClassId(tabData.classId);
    }
  }, [tabData]);

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
      setError(t('classes.manage.errorAuth', "Erreur: Utilisateur non authentifié"));
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
      setError(t('classes.manage.errorLoad', "Erreur lors du chargement de vos classes"));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserClasses();
    setRefreshing(false);
    setSuccessMessage(t('classes.manage.successRefresh', "Données actualisées avec succès"));
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
    <div className="p-4 sm:p-6">
      <div>
        {!selectedClassId ? (
          <div style={{ padding: "24px" }}>
            <div style={{ marginBottom: "24px" }}>
              <Space align="center" style={{ marginBottom: "16px" }}>
                <BookOutlined style={{ fontSize: "24px", color: "#4a6da7" }} />
                <Title level={2} style={{ margin: 0, color: "#2c3e50" }}>
                  {t('classes.manage.title', "Mes Classes")}
                </Title>
              </Space>
              <Text type="secondary" style={{ fontSize: "16px" }}>
                {t('classes.manage.subtitle', "Gérez et supervisez les classes auxquelles vous avez accès")}
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
              onNavigateToCreate={setActiveTab ? () => setActiveTab("create-class") : undefined}
            />
          </div>
        ) : (
          <ManageClassDetailsView
            classId={selectedClassId}
            onBack={handleBackToList}
            initialTab={tabData?.subTab}
            onRefresh={handleRefresh}
            onError={setError}
            onSuccess={setSuccessMessage}
          />
        )}
      </div>
    </div>
  );
};

export default ManageClassContent;
