import React, { useState, useEffect, useCallback } from "react";
import EstablishmentService from "../../../../../services/EstablishmentService";
import ManageEstablishmentList from "../../establishment-management/ManageEstablishmentList";
import ManageEstablishmentDetailsView from "../../establishment-management/ManageEstablishmentDetailsView";
import CreateEstablishmentContent from "./CreateEstablishmentContent";

const ManageEstablishmentContent = ({ onBack, setActiveTab }) => {
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

      let data = await EstablishmentService.getAllEstablishments();

      // Gestionnaires only see their own establishments
      const selectedRole = (localStorage.getItem("userRole") || "").toUpperCase();
      if (selectedRole.includes("GESTIONNAIRE")) {
        const userId = localStorage.getItem("userId");
        data = (data || []).filter(e =>
          e.gestionnaireId === userId ||
          (e.gestionnaire && e.gestionnaire.id === userId) ||
          e.gestionnaire_id === userId
        );
      }

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

  const handleBackToList = useCallback(() => {
    setSelectedEstablishmentId(null);
    setEditingEstablishment(null);
    setError("");
    setSuccessMessage("");
  }, []);

  const handleEditEstablishment = useCallback((establishment) => {
    setEditingEstablishment(establishment);
    setSelectedEstablishmentId(null);
    setError("");
    setSuccessMessage("");
  }, []);

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
    <>
      {!selectedEstablishmentId && !editingEstablishment ? (
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
            onNavigateToCreate={setActiveTab ? () => setActiveTab("create-establishment") : undefined}
          />
        ) : editingEstablishment ? (
          <CreateEstablishmentContent
            editingEstablishment={editingEstablishment}
            onNavigateToManage={handleBackToList}
            setActiveTab={handleBackToList}
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
    </>
  );
};

export default ManageEstablishmentContent;
