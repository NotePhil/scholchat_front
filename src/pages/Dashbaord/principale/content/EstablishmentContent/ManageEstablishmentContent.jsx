import React, { useState, useEffect } from "react";
import { Building } from "lucide-react";
import EstablishmentService from "../../../../../services/EstablishmentService";
import ManageEstablishmentList from "../../establishment-management/ManageEstablishmentList";
import ManageEstablishmentDetailsView from "../../establishment-management/ManageEstablishmentDetailsView";
import CreateEstablishmentContent from "./CreateEstablishmentContent";

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
      <div
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
              <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                <Building style={{ fontSize: "24px", color: "#4a6da7", marginRight: "8px" }} />
                <h2 style={{ margin: 0, color: "#2c3e50" }}>
                  Gérer les Établissements
                </h2>
              </div>
              <p style={{ color: "#666", fontSize: "16px" }}>
                Gérez et supervisez tous les établissements du système
              </p>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: "#fee",
                  border: "1px solid #fcc",
                  color: "#c33",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span>{error}</span>
                <button
                  onClick={() => setError("")}
                  style={{ background: "none", border: "none", color: "#c33", cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
            )}

            {successMessage && (
              <div
                style={{
                  backgroundColor: "#efe",
                  border: "1px solid #cfc",
                  color: "#3c3",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span>{successMessage}</span>
                <button
                  onClick={() => setSuccessMessage("")}
                  style={{ background: "none", border: "none", color: "#3c3", cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
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
      </div>
    </div>
  );
};

export default ManageEstablishmentContent;
