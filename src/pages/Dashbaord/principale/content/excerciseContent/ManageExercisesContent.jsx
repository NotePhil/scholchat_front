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
import { classService } from "../../../../../services/ClassService";
import ExerciseList from "./ExerciseList";
import CreateExerciseForm from "./CreateExerciseForm";
import EditExerciseForm from "./EditExerciseForm";
import ExerciseDetailsView from "./ExerciseDetailsView";
import StudentExerciseView from "./StudentExerciseView";

const { Title, Text } = Typography;

const ManageExercisesContent = ({ onBack, setActiveTab }) => {
  const initClassId = localStorage.getItem("selectedClassId") || null;
  const [filterClassId, setFilterClassId] = useState(initClassId);
  const [filterClassName, setFilterClassName] = useState("");
  const [professorClasses, setProfessorClasses] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [participationMap, setParticipationMap] = useState({});
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [selectedExerciseProgrammerId, setSelectedExerciseProgrammerId] = useState(null);
  const [selectedExerciseData, setSelectedExerciseData] = useState(null);
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

  // Re-filter when class filter changes via dropdown — now pure client-side, no API call
  useEffect(() => {
    applyClassFilter(allExercises, filterClassId);
  }, [filterClassId, allExercises]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when parent switches child (childChanged event)
  useEffect(() => {
    const onChildChanged = () => {
      setAllExercises([]);
      setExercises([]);
      fetchExercises();
    };
    window.addEventListener("childChanged", onChildChanged);
    return () => window.removeEventListener("childChanged", onChildChanged);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load all data on mount
  useEffect(() => {
    if (initClassId) localStorage.removeItem("selectedClassId");
    fetchExercises();
  }, []);

  const loadProfessorClasses = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      const role = (localStorage.getItem("userRole") || "").toUpperCase().replace("ROLE_", "");
      if (role !== "PROFESSOR" && role !== "ADMIN" && role !== "TUTOR") return;
      const classes = await classService.obtenirClassesUtilisateur(userId);
      setProfessorClasses(classes || []);
      // Resolve class name for pre-selected filter
      if (initClassId && classes) {
        const cls = classes.find(c => String(c.id) === String(initClassId));
        if (cls) setFilterClassName(cls.nom || cls.name || cls.titre || `Classe ${cls.id}`);
      }
    } catch { /* non-blocking */ }
  };

  // Client-side class filter — no extra API call needed.
  const applyClassFilter = (data, classId) => {
    if (!classId) {
      setExercises(data);
      return;
    }
    const filtered = data.filter(e => {
      const ids = [
        ...(e.classesDiffusees || []).map(c => String(c.id || c)),
        ...(e.classeIds || e.classesIds || []).map(String),
      ];
      return ids.includes(String(classId));
    });
    setExercises(filtered.length > 0 ? filtered : data);
  };

  const handleClassFilterChange = (classId) => {
    const cls = professorClasses.find(c => String(c.id) === String(classId));
    setFilterClassId(classId || null);
    setFilterClassName(cls ? (cls.nom || cls.name || cls.titre || `Classe ${cls.id}`) : "");
  };

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

      const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      const authHeader = { Authorization: `Bearer ${token}` };
      let data = [];

      if (selectedRole === "PROFESSOR" || selectedRole === "TUTOR") {
        // Fetch in parallel — 3 requests total:
        //   1. GET /exercises/professeur/{id}              → professor's own exercises (full details)
        //   2. GET /exercises-programmer/professeur/{id}   → programmer records (exerciseProgrammerId)
        //   3. GET /classes/utilisateur/{id}               → professor's classes (for filter dropdown)
        // No per-class calls, no per-exercise enrichment calls.
        const [ownExercisesRes, progRecordsRes, classesRes] = await Promise.allSettled([
          exerciseService.getExercisesByProfesseur(userId).catch(() => []),
          exerciseProgrammerService.getExercisesProgrammesParProfesseur(userId).catch(() => []),
          classService.obtenirClassesUtilisateur(userId).catch(() => []),
        ]);

        const ownExercises  = ownExercisesRes.status  === "fulfilled" ? (ownExercisesRes.value  || []) : [];
        const progRecords   = progRecordsRes.status   === "fulfilled" ? (progRecordsRes.value   || []) : [];
        const classesData   = classesRes.status       === "fulfilled" ? (classesRes.value       || []) : [];

        // Populate class filter dropdown (replaces the separate loadProfessorClasses call)
        setProfessorClasses(classesData);
        if (initClassId && classesData.length > 0) {
          const cls = classesData.find(c => String(c.id) === String(initClassId));
          if (cls) setFilterClassName(cls.nom || cls.name || cls.titre || `Classe ${cls.id}`);
        }

        // Build exerciseId → latest exerciseProgrammerId map from programmer records.
        // ExerciseProgrammerResponseDTO now has `exerciseId` field (added to backend).
        const programmerByExId = new Map();
        progRecords.forEach(p => {
          const exId = p.exerciseId || p.exercise?.id;
          if (exId) programmerByExId.set(String(exId), p.id);
        });

        data = ownExercises
          .filter(ex => ex?.id)
          .map(ex => ({
            ...ex,
            id: String(ex.id),
            exerciseProgrammerId: programmerByExId.get(String(ex.id)) || null,
          }));
      } else if (selectedRole === "ADMIN") {
        data = await exerciseService.getExercisesAccessibles(userId);
      } else {
        // ── Students / Parents ────────────────────────────────────────────────
        // Fetch only exercises from the student's enrolled classes.
        // Each ExerciseProgrammerResponseDTO already has: id, nom, description,
        // niveau, etat, matieres, questions (stubs), classesDiffusees, participations.
        // We do NOT fetch /exercises/{id} here — questions with choixReponses are
        // loaded on-demand inside StudentExerciseView via /questions/exercise/{exerciseId}.
        try {
          const classesResp = await fetch(
            `${baseUrl}/acceder/utilisateurs/${userId}/classes`,
            { headers: authHeader }
          );
          if (!classesResp.ok) {
            data = [];
          } else {
            const classes = await classesResp.json();
            if (!classes || classes.length === 0) {
              data = [];
            } else {
              const classNameMap = {};
              classes.forEach(c => {
                classNameMap[String(c.id)] = c.nom || c.name || `Classe ${c.id}`;
              });

              const allMap = new Map(); // keyed by programmer record ID
              for (const cls of classes) {
                try {
                  const exoResp = await fetch(
                    `${baseUrl}/exercises-programmer/classe/${cls.id}`,
                    { headers: authHeader }
                  );
                  if (!exoResp.ok) continue;
                  const programmerRecords = await exoResp.json();

                  for (const prog of programmerRecords) {
                    if (allMap.has(prog.id)) continue; // already seen from another class

                    // ExerciseProgrammerResponseDTO fields we need:
                    // prog.id           = programmer record ID (for participations)
                    // prog.exerciseId   = base exercise ID (for /questions/exercise/{id})
                    const exerciseId = prog.exerciseId || prog.id; // fallback: demo data has id === exerciseId
                    const classeNom = cls.nom || cls.name || classNameMap[String(cls.id)] || "";

                    // participations embedded in the programmer record
                    // (participations: [{ utilisateurId, exerciseProgrammerId, etatSoumission, ... }])
                    const myParticipation = (prog.participations || []).find(
                      p => p.utilisateurId === userId
                    );

                    allMap.set(prog.id, {
                      // The programmer record ID is used as the card key
                      exerciseProgrammerId: prog.id,
                      // The base exercise ID is what /questions/exercise/{id} needs
                      exerciseId,
                      nom: prog.nom || "Sans titre",
                      description: prog.description || "",
                      niveau: prog.niveau,
                      etat: prog.etat,
                      restriction: prog.restriction,
                      matieres: prog.matieres || [],
                      nombreQuestions: (prog.questions || []).length,
                      classeNom,
                      typeAssignation: prog.typeAssignation,
                      dateExoPrevue: prog.dateExoPrevue,
                      dateDebutExoEffectif: prog.dateDebutExoEffectif,
                      dateFinExoEffectif: prog.dateFinExoEffectif,
                      // participation state for this student
                      myParticipation: myParticipation || null,
                      etatSoumission: myParticipation?.etatSoumission || null,
                    });
                  }
                } catch { /* ignore per-class errors */ }
              }

              // Filter out BROUILLON exercises and ones the student already opened
              // (EN_COURS means they started but didn't submit — keep them out of the list
              //  so only "À faire" and completed ones are shown; EN_COURS is re-enterable)
              data = Array.from(allMap.values()).filter(
                e => e.etat !== "BROUILLON"
              );
            }
          }
        } catch {
          data = [];
        }
      }

      const safeData = data || [];
      setAllExercises(safeData);
      await applyClassFilter(safeData, filterClassId);

      // Build participationMap from embedded participation data for students
      if (selectedRole !== "PROFESSOR" && selectedRole !== "ADMIN" && selectedRole !== "TUTOR") {
        const map = {};
        safeData.forEach(e => {
          if (e.exerciseProgrammerId && e.myParticipation) {
            map[e.exerciseProgrammerId] = e.myParticipation;
          }
        });
        setParticipationMap(map);
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
    if (!canCreateExercise) {
      const found = allExercises.find(
        (e) =>
          String(e.exerciseId) === String(exerciseId) ||
          String(e.exerciseProgrammerId) === String(exerciseProgrammerId)
      );
      setSelectedExerciseData(found || null);
      setCurrentView("take-exercise");
    } else {
      setSelectedExerciseData(null);
      setCurrentView("details");
    }
    setError("");
    setSuccessMessage("");
  };

  const handleBackToList = () => {
    setSelectedExerciseId(null);
    setSelectedExerciseProgrammerId(null);
    setSelectedExerciseData(null);
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

  // Student header stats — use embedded participation state
  const getStudentParticipation = (e) => {
    if (e.myParticipation) return e.myParticipation;
    if (e.exerciseProgrammerId && participationMap[e.exerciseProgrammerId])
      return participationMap[e.exerciseProgrammerId];
    return null;
  };
  const studentTotal = exercises.length;
  const studentDone = exercises.filter(e => {
    const p = getStudentParticipation(e);
    const s = p?.etatSoumission;
    return s === "SOUMIS" || s === "EN_ATTENTE_CORRECTION" || s === "CORRIGE" || s === "VALIDE";
  }).length;
  const studentCorrected = exercises.filter(e => {
    const p = getStudentParticipation(e);
    return p?.etatSoumission === "CORRIGE" || p?.etatSoumission === "VALIDE";
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
                    { label: "Total", value: allExercises.length, color: "#2d6a9f", icon: <BookOutlined /> },
                    { label: "Actifs", value: allExercises.filter(e => e.etat === "ACTIF").length, color: "#389e0d", icon: <CheckCircleOutlined /> },
                    { label: "Brouillons", value: allExercises.filter(e => e.etat === "BROUILLON").length, color: "#d48806", icon: <ClockCircleOutlined /> },
                    { label: "Publics", value: allExercises.filter(e => e.restriction === "PUBLIC").length, color: "#531dab", icon: <GlobalOutlined /> },
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

            {canCreateExercise && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {professorClasses.length > 0 && (
                  <div className="relative min-w-[160px]">
                    <select
                      value={filterClassId || ""}
                      onChange={(e) => handleClassFilterChange(e.target.value)}
                      className="w-full pl-3 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="">Toutes les classes</option>
                      {professorClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.nom || cls.name || cls.titre || `Classe ${cls.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {filterClassId && filterClassName && (
                  <Alert
                    message={`Classe : ${filterClassName}`}
                    type="info"
                    showIcon
                    closable
                    style={{ borderRadius: "8px", padding: "4px 12px", flex: 1 }}
                    onClose={() => handleClassFilterChange("")}
                  />
                )}
              </div>
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
              defaultClassId={filterClassId}
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
        {currentView === "take-exercise" && selectedExerciseData?.exerciseId && (
          <StudentExerciseView
            key={selectedExerciseData.exerciseProgrammerId || selectedExerciseData.exerciseId}
            exerciseId={selectedExerciseData.exerciseId}
            exerciseProgrammerId={selectedExerciseData.exerciseProgrammerId}
            exerciseName={selectedExerciseData.nom}
            exerciseDescription={selectedExerciseData.description}
            existingParticipation={selectedExerciseData.myParticipation || null}
            onBack={handleBackToList}
            onComplete={() => {
              fetchExercises();
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
