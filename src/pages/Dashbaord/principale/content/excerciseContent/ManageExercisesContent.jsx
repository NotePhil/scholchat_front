import React, { useState, useEffect } from "react";
import {
  Card,
  Space,
  Typography,
  Alert,
  Button,
  message,
  Spin,
} from "antd";
import {
  BookOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { exerciseService } from "../../../../../services/exerciseService";
import { exerciseProgrammerService } from "../../../../../services/exerciseService";
import ExerciseList from "./ExerciseList";
import CreateExerciseForm from "./CreateExerciseForm";
import EditExerciseForm from "./EditExerciseForm";
import ExerciseDetailsView from "./ExerciseDetailsView";

const { Title, Text } = Typography;

const ManageExercisesContent = ({ onBack }) => {
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [currentView, setCurrentView] = useState("list"); // list, create, details, edit
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
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError("");

      // Get current user info from multiple possible storage locations
      const userId =
        sessionStorage.getItem("userId") ||
        localStorage.getItem("userId") ||
        sessionStorage.getItem("user_id") ||
        localStorage.getItem("user_id");

      const userRole =
        sessionStorage.getItem("userRole") || localStorage.getItem("userRole");

      const userRolesStr =
        sessionStorage.getItem("userRoles") ||
        localStorage.getItem("userRoles");
      const userRoles = userRolesStr ? JSON.parse(userRolesStr) : [];

      if (!userId) {
        throw new Error("Utilisateur non connecté. Veuillez vous reconnecter.");
      }

      let data = [];

      if (userRole === "professor" || userRoles.includes("ROLE_PROFESSOR")) {
        // Professors see their own exercises
        data = await exerciseService.getExercisesByProfesseur(userId);
      } else if (userRole === "admin" || userRoles.includes("ROLE_ADMIN")) {
        // Admins see all exercises
        data = await exerciseService.getExercisesAccessibles(userId);
      } else {
        // Students and parents see accessible exercises
        data = await exerciseService.getExercisesAccessibles(userId);
      }

      setExercises(data || []);
      console.log("Fetched exercises:", data);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      const errorMsg =
        error.message || "Erreur lors du chargement des exercices";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExercises();
    setRefreshing(false);
    setSuccessMessage("Données actualisées avec succès");
    message.success("Données actualisées avec succès");
  };

  const handleSelectExercise = (exerciseId) => {
    setSelectedExerciseId(exerciseId);
    setCurrentView("details");
    setError("");
    setSuccessMessage("");
  };

  const handleBackToList = () => {
    setSelectedExerciseId(null);
    setEditingExerciseId(null);
    setCurrentView("list");
    setError("");
    setSuccessMessage("");
  };

  const handleShowCreateForm = () => {
    setCurrentView("create");
    setError("");
    setSuccessMessage("");
  };

  const handleShowEditForm = (exerciseId) => {
    setEditingExerciseId(exerciseId);
    setSelectedExerciseId(null);
    setCurrentView("edit");
    setError("");
    setSuccessMessage("");
  };

  const handleCreateExercise = async (exerciseData) => {
    try {
      const newExercise = await exerciseService.createExercise(exerciseData);
      setSuccessMessage("Exercice créé avec succès");
      message.success("Exercice créé avec succès");
      setCurrentView("list");
      await fetchExercises();
      return newExercise;
    } catch (error) {
      console.error("Error creating exercise:", error);
      const errorMsg =
        error.message || "Erreur lors de la création de l'exercice";
      setError(errorMsg);
      message.error(errorMsg);
      throw error;
    }
  };

  const handleUpdateExercise = async (exerciseId, updatedData) => {
    try {
      await exerciseService.updateExercise(exerciseId, updatedData);
      setSuccessMessage("Exercice mis à jour avec succès");
      message.success("Exercice mis à jour avec succès");
      await fetchExercises(); // Refresh the list
    } catch (error) {
      console.error("Error updating exercise:", error);
      const errorMsg =
        error.message || "Erreur lors de la mise à jour de l'exercice";
      setError(errorMsg);
      message.error(errorMsg);
      throw error;
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    try {
      await exerciseService.deleteExercise(exerciseId);
      setSuccessMessage("Exercice supprimé avec succès");
      message.success("Exercice supprimé avec succès");
      await fetchExercises(); // Refresh the list
    } catch (error) {
      console.error("Error deleting exercise:", error);
      const errorMsg =
        error.message || "Erreur lors de la suppression de l'exercice";
      setError(errorMsg);
      message.error(errorMsg);
      throw error;
    }
  };

  // Check user permissions
  const userRole =
    sessionStorage.getItem("userRole") || localStorage.getItem("userRole");
  const userRolesStr =
    sessionStorage.getItem("userRoles") || localStorage.getItem("userRoles");
  const userRoles = userRolesStr ? JSON.parse(userRolesStr) : [];

  const canCreateExercise =
    userRole === "professor" ||
    userRole === "admin" ||
    userRoles.includes("ROLE_PROFESSOR") ||
    userRoles.includes("ROLE_ADMIN");

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* List View */}
        {currentView === "list" && (
          <div className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                {onBack && (
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={onBack}
                    type="text"
                    size="middle"
                  />
                )}
                <Space align="center">
                  <BookOutlined
                    className="text-xl sm:text-2xl"
                    style={{ color: "#4a6da7" }}
                  />
                  <Title level={2} className="m-0 text-lg sm:text-2xl">
                    Gestion des Exercices
                  </Title>
                </Space>
              </div>
              <Text
                type="secondary"
                className="text-sm sm:text-base block pl-0 sm:pl-10"
              >
                Créez, gérez et programmez des exercices pour vos classes
              </Text>
            </div>

            {successMessage && (
              <Alert
                message={successMessage}
                type="success"
                showIcon
                closable
                className="mb-4"
                style={{ borderRadius: "8px" }}
                onClose={() => setSuccessMessage("")}
              />
            )}

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                className="mb-4"
                style={{ borderRadius: "8px" }}
                onClose={() => setError("")}
              />
            )}

            {loading && !refreshing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Spin size="large" />
                <Text className="mt-4 text-sm sm:text-base">
                  Chargement des exercices...
                </Text>
              </div>
            ) : (
              <ExerciseList
                exercises={exercises}
                loading={loading}
                error={error}
                successMessage={successMessage}
                refreshing={refreshing}
                onSelectExercise={handleSelectExercise}
                onRefresh={handleRefresh}
                onDelete={handleDeleteExercise}
                onBack={onBack}
                onCreateExercise={
                  canCreateExercise ? handleShowCreateForm : null
                }
                canCreate={canCreateExercise}
              />
            )}
          </div>
        )}

        {/* Create View */}
        {currentView === "create" && (
          <div className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToList}
                  type="text"
                  size="middle"
                />
                <Space align="center">
                  <PlusOutlined
                    className="text-xl sm:text-2xl"
                    style={{ color: "#4a6da7" }}
                  />
                  <Title level={2} className="m-0 text-lg sm:text-2xl">
                    Créer un Exercice
                  </Title>
                </Space>
              </div>
            </div>

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                className="mb-4"
                style={{ borderRadius: "8px" }}
                onClose={() => setError("")}
              />
            )}

            <CreateExerciseForm
              onSubmit={handleCreateExercise}
              onCancel={handleBackToList}
              onError={setError}
              onSuccess={setSuccessMessage}
            />
          </div>
        )}

        {/* Details View */}
        {currentView === "details" && selectedExerciseId && (
          <ExerciseDetailsView
            exerciseId={selectedExerciseId}
            onBack={handleBackToList}
            onRefresh={handleRefresh}
            onError={setError}
            onSuccess={setSuccessMessage}
            onUpdate={handleUpdateExercise}
            onDelete={handleDeleteExercise}
            onEdit={handleShowEditForm}
          />
        )}

        {/* Edit View */}
        {currentView === "edit" && editingExerciseId && (
          <div className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToList}
                  type="text"
                  size="middle"
                />
                <Space align="center">
                  <BookOutlined
                    className="text-xl sm:text-2xl"
                    style={{ color: "#4a6da7" }}
                  />
                  <Title level={2} className="m-0 text-lg sm:text-2xl">
                    Modifier l'Exercice
                  </Title>
                </Space>
              </div>
            </div>

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                className="mb-4"
                style={{ borderRadius: "8px" }}
                onClose={() => setError("")}
              />
            )}

            <EditExerciseForm
              exerciseId={editingExerciseId}
              onSubmit={handleUpdateExercise}
              onCancel={handleBackToList}
              onError={setError}
              onSuccess={setSuccessMessage}
              onBackToDetails={handleSelectExercise}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageExercisesContent;
