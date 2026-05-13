import React, { useState, useEffect } from "react";
import {
  Card,
  Space,
  Typography,
  Alert,
  Button,
  message,
  Spin,
  Tag,
  Divider,
} from "antd";
import {
  BookOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  ReadOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { exerciseService, participationExerciseService } from "../../../../../services/exerciseService";
import { exerciseProgrammerService } from "../../../../../services/exerciseService";
import ExerciseList from "./ExerciseList";
import CreateExerciseForm from "./CreateExerciseForm";
import EditExerciseForm from "./EditExerciseForm";
import ExerciseDetailsView from "./ExerciseDetailsView";
import StudentExerciseView from "./StudentExerciseView";

const { Title, Text } = Typography;

const ManageExercisesContent = ({ onBack, setActiveTab }) => {
  const selectedClassId = localStorage.getItem("selectedClassId") || null;
  const [exercises, setExercises] = useState([]);
  const [participationMap, setParticipationMap] = useState({});
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [selectedExerciseProgrammerId, setSelectedExerciseProgrammerId] = useState(null);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [currentView, setCurrentView] = useState("list"); // list, create, details, edit, take-exercise
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

      // Get current user info - for parents, use selected child ID
      const parentIdExo = localStorage.getItem("userId");
      const isParentRoleExo = (localStorage.getItem("userRole") || "").toUpperCase().includes("PARENT");
      const userId = isParentRoleExo
        ? (localStorage.getItem("selectedChildId") || parentIdExo)
        : (sessionStorage.getItem("userId") || parentIdExo);

      // Use SELECTED role only (not JWT roles array) for multi-role users
      const selectedRole = (localStorage.getItem("userRole") || "").toUpperCase().replace("ROLE_", "");

      if (!userId) {
        throw new Error("Utilisateur non connecté. Veuillez vous reconnecter.");
      }

      let data = [];

      if (selectedRole === "PROFESSOR" || selectedRole === "TUTOR") {
        data = await exerciseService.getExercisesByProfesseur(userId);
      } else if (selectedRole === "ADMIN") {
        data = await exerciseService.getExercisesAccessibles(userId);
      } else {
        // Students and parents: get accessible exercises + exercises programmed for their classes
        const [accessibleExercises, classExercises] = await Promise.allSettled([
          exerciseService.getExercisesAccessibles(userId),
          // Fetch exercises from user's classes
          (async () => {
            try {
              const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
              const baseUrl = process.env.REACT_APP_API_BASE_URL;
              // Get user's classes first
              const classesResp = await fetch(`${baseUrl}/acceder/utilisateurs/${userId}/classes`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (!classesResp.ok) return [];
              const classes = await classesResp.json();
              // Get exercises programmed for each class
              const allExercises = [];
              for (const cls of classes) {
                try {
                  const exoResp = await fetch(`${baseUrl}/exercises-programmer/classe/${cls.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (exoResp.ok) {
                    const exos = await exoResp.json();
                    allExercises.push(...exos);
                  }
                } catch (e) { /* ignore */ }
              }
              return allExercises;
            } catch (e) { return []; }
          })(),
        ]);

        const accessible = accessibleExercises.status === "fulfilled" ? accessibleExercises.value || [] : [];
        const fromClasses = classExercises.status === "fulfilled" ? classExercises.value || [] : [];

        // Merge and deduplicate by ID
        const allMap = new Map();
        accessible.forEach(e => allMap.set(e.id, e));
        fromClasses.forEach(e => { if (!allMap.has(e.id)) allMap.set(e.id, e); });
        data = Array.from(allMap.values());
        
        // Filter out BROUILLON exercises for students/parents
        data = data.filter(e => e.etat !== "BROUILLON");
      }

      setExercises(data || []);
      console.log("Fetched exercises:", data);

      // For students: load participations to compute accurate header stats
      if (selectedRole !== "PROFESSOR" && selectedRole !== "ADMIN" && selectedRole !== "TUTOR") {
        try {
          const participations = await participationExerciseService.getParticipationsByUtilisateur(userId);
          const map = {};
          (participations || []).forEach(p => { map[p.exerciseProgrammerId] = p; });
          setParticipationMap(map);
        } catch { /* non-blocking */ }
      }
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

  const handleSelectExercise = (exerciseId, exerciseProgrammerId) => {
    setSelectedExerciseId(exerciseId);
    setSelectedExerciseProgrammerId(exerciseProgrammerId || null);
    // Students/parents go directly to take-exercise view
    if (!canCreateExercise) {
      setCurrentView("take-exercise");
    } else {
      setCurrentView("details");
    }
    setError("");
    setSuccessMessage("");
  };

  const handleBackToList = () => {
    setSelectedExerciseId(null);
    setSelectedExerciseProgrammerId(null);
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

  const handleTakeExercise = (exerciseId) => {
    setSelectedExerciseId(exerciseId);
    setCurrentView("take-exercise");
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

  // Check user permissions based on SELECTED role only
  const selectedRoleForPerms = (localStorage.getItem("userRole") || "").toUpperCase().replace("ROLE_", "");
  const canCreateExercise = selectedRoleForPerms === "PROFESSOR" || selectedRoleForPerms === "ADMIN" || selectedRoleForPerms === "TUTOR";

  // Student header stats derived from participationMap
  const getStudentParticipation = (e) => {
    if (e.exerciseProgrammerId && participationMap[e.exerciseProgrammerId])
      return participationMap[e.exerciseProgrammerId];
    if (participationMap[e.id])
      return participationMap[e.id];
    return null;
  };
  const studentTotal = exercises.length;
  const studentDone = exercises.filter(e => {
    const p = getStudentParticipation(e);
    return p && (p.etatSoumission === "CORRIGE" || p.etatSoumission === "VALIDE" || p.etatSoumission === "SOUMIS" || p.etatSoumission === "EN_ATTENTE_CORRECTION");
  }).length;
  const studentCorrected = exercises.filter(e => {
    const p = getStudentParticipation(e);
    return p && (p.etatSoumission === "CORRIGE" || p.etatSoumission === "VALIDE");
  }).length;
  const studentTodo = studentTotal - studentDone;

  return (
    <div className="full-bleed-page">
      <div className="w-full px-3 sm:px-6 py-3 sm:py-4">
      {/* List View */}
      {currentView === "list" && (
          <div>
            {/* ── Student header ── */}
            {!canCreateExercise ? (
              <div
                className="mb-4 rounded-xl p-4"
                style={{
                  background: "linear-gradient(135deg, #1d3557 0%, #457b9d 100%)",
                  color: "#fff",
                }}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  {onBack && (
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={onBack}
                      type="text"
                      size="middle"
                      style={{ color: "#fff" }}
                    />
                  )}
                  <ReadOutlined style={{ fontSize: 22 }} />
                  <span className="text-base font-bold">Mes Exercices</span>
                </div>
                <p className="text-xs opacity-80 mb-3 pl-1">
                  Retrouvez ici tous les exercices disponibles pour votre niveau.
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
                    <BookOutlined />
                    <span className="text-sm font-semibold">{studentTotal}</span>
                    <span className="text-xs opacity-80">exercice{studentTotal !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
                    <CheckCircleOutlined />
                    <span className="text-sm font-semibold">{studentDone}</span>
                    <span className="text-xs opacity-80">soumis</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
                    <TrophyOutlined />
                    <span className="text-sm font-semibold">{studentCorrected}</span>
                    <span className="text-xs opacity-80">corrigé{studentCorrected !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
                    <ClockCircleOutlined />
                    <span className="text-sm font-semibold">{studentTodo}</span>
                    <span className="text-xs opacity-80">à faire</span>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Professor / Admin header ── */
              <div
                className="mb-4 rounded-xl overflow-hidden"
                style={{ border: "1px solid #e8edf5" }}
              >
                {/* Top band */}
                <div
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  style={{
                    background: "linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 100%)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {onBack && (
                      <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={onBack}
                        type="text"
                        size="middle"
                        style={{ color: "#fff", flexShrink: 0 }}
                      />
                    )}
                    <div
                      className="flex items-center justify-center rounded-lg"
                      style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", flexShrink: 0 }}
                    >
                      <BookOutlined style={{ fontSize: 18, color: "#fff" }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-bold text-base leading-tight truncate">
                        Gestion des Exercices
                      </div>
                      <div className="text-blue-100 text-xs opacity-90">
                        Créez, gérez et programmez des exercices pour vos classes
                      </div>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleShowCreateForm}
                    size="middle"
                    style={{
                      background: "#fff",
                      color: "#1a3a5c",
                      border: "none",
                      fontWeight: 600,
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                  >
                    Nouvel exercice
                  </Button>
                </div>
                {/* Stats strip — hidden on mobile */}
                <div
                  className="hidden sm:grid sm:grid-cols-4 divide-x"
                  style={{ background: "#f8faff", borderTop: "1px solid #e8edf5" }}
                >
                  {[
                    { label: "Total", value: exercises.length, color: "#2d6a9f", icon: <BookOutlined /> },
                    { label: "Actifs", value: exercises.filter(e => e.etat === "ACTIF").length, color: "#389e0d", icon: <CheckCircleOutlined /> },
                    { label: "Brouillons", value: exercises.filter(e => e.etat === "BROUILLON").length, color: "#d48806", icon: <ClockCircleOutlined /> },
                    { label: "Publics", value: exercises.filter(e => e.restriction === "PUBLIC").length, color: "#531dab", icon: <GlobalOutlined /> },
                  ].map(({ label, value, color, icon }) => (
                    <div key={label} className="flex items-center gap-2 px-4 py-3">
                      <div
                        className="flex items-center justify-center rounded-lg"
                        style={{ width: 32, height: 32, background: `${color}18`, flexShrink: 0 }}
                      >
                        <span style={{ color, fontSize: 14 }}>{icon}</span>
                      </div>
                      <div>
                        <div className="font-bold text-base leading-none" style={{ color }}>{value}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedClassId && canCreateExercise && (
              <Alert
                message={`Exercices de la classe sélectionnée`}
                description={`Classe ID: ${selectedClassId} — Les nouveaux exercices créés seront associés à cette classe.`}
                type="info"
                showIcon
                closable
                className="mb-4"
                style={{ borderRadius: "8px" }}
                onClose={() => localStorage.removeItem("selectedClassId")}
              />
            )}

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
                participationMap={participationMap}
              />
            )}
          </div>
        )}

        {/* Create View */}
        {currentView === "create" && (
          <div>
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
              defaultClassId={selectedClassId}
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
            onTakeExercise={!canCreateExercise ? handleTakeExercise : null}
          />
        )}

        {/* Student Take Exercise View */}
        {currentView === "take-exercise" && selectedExerciseId && (
          <StudentExerciseView
            exerciseId={selectedExerciseId}
            exerciseProgrammerId={selectedExerciseProgrammerId}
            onBack={handleBackToList}
            onComplete={() => {
              setSuccessMessage("Exercice soumis avec succès !");
              handleBackToList();
            }}
          />
        )}

        {/* Edit View */}
        {currentView === "edit" && editingExerciseId && (
          <div>
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
