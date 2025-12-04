import React, { useState, useEffect } from "react";
import { Card, Space, Typography, Alert, Button, message, Spin } from "antd";
import { BuildOutlined } from "@ant-design/icons"; // This is correct
import EstablishmentService from "../../../../../services/EstablishmentService";
import ManageEstablishmentList from "../../establishment-management/ManageEstablishmentList";
import ManageEstablishmentDetailsView from "../../establishment-management/ManageEstablishmentDetailsView";
import CreateEstablishmentContent from "./CreateEstablishmentContent";

const { Text, Title } = Typography;

const ManageEstablishmentContent = ({ onBack }) => {
  const [establishments, setEstablishments] = useState([]);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState(null);
  const [editingEstablishment, setEditingEstablishment] = useState(null);
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
    fetchEstablishments();
  }, []);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
      setError("");

      // Check if user is authenticated
      if (!EstablishmentService.isAuthenticated()) {
        setError("Erreur: Authentification requise");
        return;
      }

      const data = await EstablishmentService.getAllEstablishments();
      setEstablishments(data || []);

      console.log("Fetched establishments:", data);
    } catch (error) {
      console.error("Error fetching establishments:", error);
      setError("Erreur lors du chargement des établissements");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEstablishments();
    setRefreshing(false);
    setSuccessMessage("Données actualisées avec succès");
  };

  const handleSelectEstablishment = (establishmentId) => {
    setSelectedEstablishmentId(establishmentId);
    setError("");
    setSuccessMessage("");
  };

  const handleBackToList = () => {
    setSelectedEstablishmentId(null);
    setEditingEstablishment(null);
    setError("");
    setSuccessMessage("");
  };

  const handleEditEstablishment = (establishment) => {
    setEditingEstablishment(establishment);
    setSelectedEstablishmentId(null);
    setError("");
    setSuccessMessage("");
  };

  const handleDeleteEstablishment = async (establishmentId) => {
    try {
      await EstablishmentService.deleteEstablishment(establishmentId);
      setSuccessMessage("Établissement supprimé avec succès");
      await fetchEstablishments(); // Refresh the list
    } catch (error) {
      console.error("Error deleting establishment:", error);
      setError("Erreur lors de la suppression de l'établissement");
    }
  };

  const handleUpdateEstablishment = async (establishmentId, updatedData) => {
    try {
      await EstablishmentService.updateEstablishment(
        establishmentId,
        updatedData
      );
      setSuccessMessage("Établissement mis à jour avec succès");
      await fetchEstablishments(); // Refresh the list
    } catch (error) {
      console.error("Error updating establishment:", error);
      setError("Erreur lors de la mise à jour de l'établissement");
    }
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
        {!selectedEstablishmentId && !editingEstablishment ? (
          <div style={{ padding: "24px" }}>
            <div style={{ marginBottom: "24px" }}>
              <Space align="center" style={{ marginBottom: "16px" }}>
                <BuildOutlined style={{ fontSize: "24px", color: "#4a6da7" }} />
                <Title level={2} style={{ margin: 0, color: "#2c3e50" }}>
                  Gérer les Établissements
                </Title>
              </Space>
              <Text type="secondary" style={{ fontSize: "16px" }}>
                Gérez et supervisez tous les établissements du système
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

            <ManageEstablishmentList
              establishments={establishments}
              loading={loading}
              error={error}
              successMessage={successMessage}
              refreshing={refreshing}
              onSelectEstablishment={handleSelectEstablishment}
              onEditEstablishment={handleEditEstablishment}
              onRefresh={handleRefresh}
              onDelete={handleDeleteEstablishment}
              onBack={onBack}
            />
          </div>
        ) : editingEstablishment ? (
          <CreateEstablishmentContent
            editingEstablishment={editingEstablishment}
            onNavigateToManage={handleBackToList}
            setActiveTab={() => handleBackToList()}
          />
        ) : (
          <ManageEstablishmentDetailsView
            establishmentId={selectedEstablishmentId}
            onBack={handleBackToList}
            onRefresh={handleRefresh}
            onError={setError}
            onSuccess={setSuccessMessage}
            onUpdate={handleUpdateEstablishment}
            onDelete={handleDeleteEstablishment}
            onEdit={handleEditEstablishment}
          />
        )}
      </Card>
    </div>
  );
};

export default ManageEstablishmentContent;
