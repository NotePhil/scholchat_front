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

  // Re-filter when class filter changes via dropdown
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await applyClassFilter(allExercises, filterClassId);
    };
    run();
    return () => { cancelled = true; };
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
    loadProfessorClasses();
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

  const applyClassFilter = async (data, classId) => {
    if (!classId) {
      setExercises(data);
      return;
    }
    try {
      // Load exercise-programmer records for this class — they carry exerciseId
      const programmers = await exerciseProgrammerService.getExercisesProgrammesParClasse(classId);
      const ids = new Set(
        (programmers || [])
          .map(p => p.exerciseId || p.exercise?.id)
          .filter(Boolean)
          .map(String)
      );
      // ids.size === 0 means no exercises programmed for this class yet
      setExercises(ids.size > 0 ? data.filter(e => ids.has(String(e.id))) : []);
    } catch {
      setExercises(data); // fallback: show all when API unreachable
    }
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
        // 1. Fetch exercises created directly by the professor
        const ownExercisesResult = await exerciseService.getExercisesByProfesseur(userId).catch(() => []);
        const ownExercises = Array.isArray(ownExercisesResult) ? ownExercisesResult : [];

        // 2. Also gather exercises from programmer records (to include exercises programmed
        //    by other professors in the same classes, and to attach exerciseProgrammerId)
        const allClasses = await classService.obtenirClassesUtilisateur(userId).catch(() => []);
        const classIdsToFetch = (allClasses || []).map(c => c.id);

        const [profProgrammed, ...classResults] = await Promise.allSettled([
          exerciseProgrammerService.getExercisesProgrammesParProfesseur(userId),
          ...classIdsToFetch.map(cId =>
            exerciseProgrammerService.getExercisesProgrammesParClasse(cId)
          ),
        ]);

        const profItems = profProgrammed.status === "fulfilled" ? (profProgrammed.value || []) : [];
        const classItems = classResults
          .filter(r => r.status === "fulfilled")
          .flatMap(r => r.value || []);

        // Build a map: exerciseId → exerciseProgrammerId (latest programmer record wins)
        const programmerByExId = new Map();
        [...classItems, ...profItems].forEach(p => {
          const exId = p.exerciseId || p.exercise?.id;
          if (exId) programmerByExId.set(String(exId), p.id);
        });

        // Start with own exercises as the base set
        const exerciseMap = new Map();
        ownExercises.forEach(ex => {
          if (ex?.id) {
            exerciseMap.set(String(ex.id), {
              ...ex,
              id: String(ex.id),
              exerciseProgrammerId: programmerByExId.get(String(ex.id)) || null,
            });
          }
        });

        // Also resolve any programmer records pointing to exercises NOT in ownExercises
        // (exercises programmed by other professors in the same classes)
        const allProgrammerRecords = new Map();
        [...classItems, ...profItems].forEach(p => {
          if (p?.id) allProgrammerRecords.set(String(p.id), p);
        });

        await Promise.allSettled(
          Array.from(allProgrammerRecords.values()).map(async (p) => {
            const baseExId = p.exerciseId || p.exercise?.id;
            if (!baseExId) return;
            const key = String(baseExId);
            if (exerciseMap.has(key)) {
              // Already have it from ownExercises — just ensure programmerId is set
              const existing = exerciseMap.get(key);
              if (!existing.exerciseProgrammerId) {
                exerciseMap.set(key, { ...existing, exerciseProgrammerId: p.id });
              }
              return;
            }
            try {
              let ex = p.exercise && p.exercise.nom ? p.exercise : await exerciseService.getExerciseById(baseExId);
              if (ex) {
                exerciseMap.set(key, {
                  ...ex,
                  id: key,
                  exerciseProgrammerId: p.id,
                  classeIds: p.classeIds || p.classesIds || [],
                  programmeurId: p.programmeParId,
                });
              }
            } catch { /* ignore missing exercises */ }
          })
        );

        data = Array.from(exerciseMap.values());
      } else if (selectedRole === "ADMIN") {
        data = await exerciseService.getExercisesAccessibles(userId);
      } else {
        // Students and parents: ONLY show exercises from their enrolled classes (not globally accessible ones)
        try {
          const classesResp = await fetch(`${baseUrl}/acceder/utilisateurs/${userId}/classes`, { headers: authHeader });
          if (!classesResp.ok) {
            data = []; // no classes → no exercises
          } else {
            const classes = await classesResp.json();
            if (!classes || classes.length === 0) {
              data = []; // no classes → no exercises
            } else {
              // Build a classId→name map for display
              const classNameMap = {};
              classes.forEach(c => { classNameMap[String(c.id)] = c.nom || c.name || `Classe ${c.id}`; });
              const allMap = new Map();
              for (const cls of classes) {
                try {
                  const exoResp = await fetch(`${baseUrl}/exercises-programmer/classe/${cls.id}`, { headers: authHeader });
                  if (exoResp.ok) {
                    const exos = await exoResp.json();
                    for (const e of exos) {
                      if (allMap.has(e.id)) continue;

                      const classIds = e.classeIds || e.classesIds || [];
                      const classeNom = classIds.map(id => classNameMap[String(id)]).filter(Boolean).join(", ") || cls.nom || cls.name || "";

                      // Resolve the base exercise ID from the programmer record
                      let baseExerciseId = e.exerciseId || e.exercise?.id;
                      let exerciseName = e.nom || e.exercise?.nom;
                      let exerciseObj = e.exercise || null;

                      // If we don't have the base exercise ID yet, fetch the programmer record detail
                      if (!baseExerciseId) {
                        try {
                          const detailResp = await fetch(`${baseUrl}/exercises-programmer/${e.id}`, { headers: authHeader });
                          if (detailResp.ok) {
                            const detail = await detailResp.json();
                            baseExerciseId = detail.exerciseId || detail.exercise?.id;
                            exerciseName = exerciseName || detail.nom || detail.exercise?.nom;
                            exerciseObj = exerciseObj || detail.exercise;
                          }
                        } catch { /* ignore */ }
                      }

                      // If we now have a base exercise ID, fetch full exercise details for nom/description
                      if (baseExerciseId && !exerciseName) {
                        try {
                          const exDetails = await exerciseService.getExerciseById(baseExerciseId);
                          if (exDetails) {
                            exerciseName = exDetails.nom;
                            exerciseObj = exDetails;
                          }
                        } catch { /* ignore */ }
                      }

                      console.log(`[Student fetchExercises] programmerRecord=${e.id} baseExerciseId=${baseExerciseId} nom=${exerciseName}`);

                      allMap.set(e.id, {
                        ...(exerciseObj || e),
                        // Ensure these critical fields are always set correctly:
                        id: baseExerciseId || e.id, // prefer base exercise ID as the card's id
                        exerciseId: baseExerciseId || e.id, // explicit base exercise ID
                        exerciseProgrammerId: e.id, // always the programmer record ID
                        nom: exerciseName || "Sans titre",
                        description: exerciseObj?.description || e.description || "",
                        niveau: exerciseObj?.niveau || e.niveau,
                        etat: e.etat || exerciseObj?.etat,
                        restriction: exerciseObj?.restriction || e.restriction,
                        dateExoPrevue: e.dateExoPrevue,
                        dateDebutExoEffectif: e.dateDebutExoEffectif,
                        dateFinExoEffectif: e.dateFinExoEffectif,
                        classeNom,
                        typeAssignation: e.typeAssignation,
                        matieres: exerciseObj?.matieres || e.matieres || [],
                        questions: exerciseObj?.questions,
                        nombreQuestions: exerciseObj?.nombreQuestions || exerciseObj?.questions?.length || e.nombreQuestions,
                      });
                    }
                  }
                } catch { /* ignore */ }
              }
              data = Array.from(allMap.values()).filter(e => e.etat !== "BROUILLON");
            }
          }
        } catch {
          data = [];
        }
      }

      const safeData = data || [];
      setAllExercises(safeData);
      await applyClassFilter(safeData, filterClassId);
      console.log(`[ManageExercises] Fetched ${safeData.length} exercises for role=${selectedRole}`, safeData);

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
      // Carry the already-loaded exercise data to avoid a re-fetch that may fail for students
      const found = allExercises.find(
        (e) => String(e.id) === String(exerciseId) || String(e.exerciseProgrammerId) === String(exerciseProgrammerId)
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
        {currentView === "take-exercise" && selectedExerciseId && (
          <StudentExerciseView
            key={selectedExerciseProgrammerId || selectedExerciseId}
            exerciseId={selectedExerciseId}
            exerciseProgrammerId={selectedExerciseProgrammerId}
            initialExerciseData={selectedExerciseData}
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
