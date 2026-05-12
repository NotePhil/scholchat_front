import React, { useState, useEffect, useCallback } from "react";
import {
  Button, Form, Tabs, Alert, Spin, Popconfirm, message, Badge,
} from "antd";
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  SaveOutlined, CloseOutlined, CalendarOutlined,
  QuestionCircleOutlined, CheckSquareOutlined,
  ReloadOutlined, SendOutlined,
} from "@ant-design/icons";
import {
  exerciseService,
  questionReponseService,
  exerciseProgrammerService,
} from "../../../../../services/exerciseService";
import { classService } from "../../../../../services/ClassService";
import { getUserId, statusTag } from "./exerciseDetails/helpers";
import ExerciseInfoPanel from "./exerciseDetails/ExerciseInfoPanel";
import QuestionsPanel from "./exerciseDetails/QuestionsPanel";
import ProgrammationsPanel from "./exerciseDetails/ProgrammationsPanel";
import CorrectionsPanel from "./exerciseDetails/CorrectionsPanel";
import ProgramModal from "./exerciseDetails/ProgramModal";

const ExerciseDetailsView = ({
  exerciseId,
  onBack,
  onUpdate,
  onDelete,
  onEdit,
  onTakeExercise,
}) => {
  const [exercise, setExercise] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [programmations, setProgrammations] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [progsLoading, setProgsLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingProgId, setDeletingProgId] = useState(null);
  const [programLoading, setProgramLoading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [selectedProgrammationId, setSelectedProgrammationId] = useState(null);
  const [activeTab, setActiveTab] = useState("questions");

  const [form] = Form.useForm();
  const [programForm] = Form.useForm();

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchExercise = useCallback(async () => {
    try {
      setLoading(true);
      const data = await exerciseService.getExerciseById(exerciseId);
      setExercise(data);
      form.setFieldsValue({
        nom: data.nom || "",
        description: data.description || "",
        niveau: data.niveau || "",
        restriction: data.restriction || "PRIVE",
        etat: data.etat || "BROUILLON",
      });
    } catch {
      message.error("Impossible de charger l'exercice");
    } finally {
      setLoading(false);
    }
  }, [exerciseId, form]);

  const fetchQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    try {
      const data = await questionReponseService.getQuestionsByExercise(exerciseId);
      setQuestions(data || []);
    } catch {
      message.warning("Impossible de charger les questions");
    } finally {
      setQuestionsLoading(false);
    }
  }, [exerciseId]);

  const fetchProgrammations = useCallback(async () => {
    setProgsLoading(true);
    try {
      const data = await exerciseProgrammerService.getExercisesProgrammesParExercise(exerciseId);
      setProgrammations(data || []);
      if (data?.length > 0 && !selectedProgrammationId) {
        setSelectedProgrammationId(data[0].id);
      }
    } catch {
      message.warning("Impossible de charger les programmations");
    } finally {
      setProgsLoading(false);
    }
  }, [exerciseId]);

  const fetchClasses = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    setClassesLoading(true);
    try {
      const data = await classService.obtenirClassesUtilisateur(userId);
      setClasses(data || []);
    } catch {
      // non-blocking
    } finally {
      setClassesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!exerciseId) return;
    fetchExercise();
    fetchQuestions();
    fetchProgrammations();
    fetchClasses();
  }, [exerciseId]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      await onUpdate(exerciseId, values);
      setExercise(prev => ({ ...prev, ...values }));
      setEditing(false);
      message.success("Exercice mis à jour");
    } catch {
      message.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    form.setFieldsValue({
      nom: exercise.nom, description: exercise.description,
      niveau: exercise.niveau, restriction: exercise.restriction, etat: exercise.etat,
    });
  };

  const handleDelete = async () => {
    try {
      await onDelete(exerciseId);
      message.success("Exercice supprimé");
      onBack();
    } catch {
      message.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteProg = async (progId) => {
    setDeletingProgId(progId);
    try {
      await exerciseProgrammerService.supprimerExerciseProgramme(progId);
      message.success("Programmation supprimée");
      await fetchProgrammations();
      await fetchExercise();
    } catch {
      message.error("Erreur lors de la suppression");
    } finally {
      setDeletingProgId(null);
    }
  };

  const handleProgram = async (values) => {
    const userId = getUserId();
    if (!userId) { message.error("Utilisateur non connecté"); return; }
    setProgramLoading(true);
    try {
      const payload = {
        exerciseId,
        programmeParId: userId,
        typeAssignation: values.typeAssignation,
        dateExoPrevue: values.dateExoPrevue.toISOString(),
        dateDebutExoEffectif: values.dateDebutExoEffectif.toISOString(),
        dateFinExoEffectif: values.dateFinExoEffectif.toISOString(),
        classeIds: values.classeIds || [],
        etat: "ACTIF",
      };

      if (values.diffuseImmediately !== false) {
        await exerciseProgrammerService.programmerEtDiffuserExercise(payload);
        message.success("Exercice programmé et diffusé !");
      } else {
        await exerciseProgrammerService.programmerExercise(payload);
        message.success("Exercice programmé");
      }

      setShowProgramModal(false);
      programForm.resetFields();
      await fetchProgrammations();
      await fetchExercise();
    } catch (e) {
      message.error(e.message || "Erreur lors de la programmation");
    } finally {
      setProgramLoading(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchExercise(), fetchQuestions(), fetchProgrammations()]);
    message.success("Actualisé");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <Spin size="large" />
        <p className="mt-3 text-gray-500 text-sm">Chargement de l'exercice...</p>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="p-6">
        <Alert
          type="error"
          message="Impossible de charger l'exercice"
          action={<Button onClick={onBack}>Retour</Button>}
        />
      </div>
    );
  }

  const isProfessor = !onTakeExercise;

  const tabItems = [
    {
      key: "questions",
      label: (
        <span className="flex items-center gap-1.5">
          <QuestionCircleOutlined />
          Questions
          <Badge count={questions.length} size="small"
            style={{ backgroundColor: "#e6f4ff", color: "#1677ff", boxShadow: "none", fontWeight: 600 }} />
        </span>
      ),
      children: (
        <QuestionsPanel
          exerciseId={exerciseId}
          questions={questions}
          loading={questionsLoading}
          onEditExercise={onEdit}
          onRefresh={fetchQuestions}
        />
      ),
    },
    ...(isProfessor ? [
      {
        key: "programmations",
        label: (
          <span className="flex items-center gap-1.5">
            <CalendarOutlined />
            Programmations
            <Badge count={programmations.length} size="small"
              style={{ backgroundColor: "#f6ffed", color: "#389e0d", boxShadow: "none", fontWeight: 600 }} />
          </span>
        ),
        children: (
          <ProgrammationsPanel
            programmations={programmations}
            loading={progsLoading}
            deletingId={deletingProgId}
            onDelete={handleDeleteProg}
            onOpenProgramModal={() => setShowProgramModal(true)}
            onSelectProgrammation={(id) => {
              setSelectedProgrammationId(id);
              setActiveTab("corrections");
            }}
            selectedProgrammationId={selectedProgrammationId}
          />
        ),
      },
      {
        key: "corrections",
        label: (
          <span className="flex items-center gap-1.5">
            <CheckSquareOutlined />
            Corrections
            {programmations.length > 0 && (
              <Badge
                count="●"
                size="small"
                style={{ backgroundColor: "transparent", color: "#d46b08", boxShadow: "none", fontSize: 10 }}
              />
            )}
          </span>
        ),
        children: (
          <CorrectionsPanel
            exerciseId={exerciseId}
            programmations={programmations}
          />
        ),
      },
    ] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-5">

      {/* ── Top header bar ── */}
      <div className="flex items-center gap-3 mb-5">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} type="text" size="middle" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 m-0 truncate">{exercise.nom}</h2>
            {statusTag(exercise.etat)}
          </div>
          <p className="text-xs text-gray-400 m-0 mt-0.5">
            {exercise.niveau} · {exercise.restriction === "PUBLIC" ? "Public" : "Privé"}
            {exercise.matieres?.length > 0 && ` · ${exercise.matieres.map(m => m.nom).join(", ")}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} size="middle" title="Actualiser" />
          {isProfessor && !editing && (
            <>
              <Button
                icon={<SendOutlined />}
                type="primary"
                onClick={() => setShowProgramModal(true)}
                size="middle"
              >
                <span className="hidden sm:inline">Programmer</span>
              </Button>
              <Button icon={<EditOutlined />} onClick={() => setEditing(true)} size="middle">
                <span className="hidden sm:inline">Modifier</span>
              </Button>
              <Popconfirm
                title="Supprimer cet exercice ?"
                description="Cette action est irréversible."
                onConfirm={handleDelete}
                okText="Supprimer"
                cancelText="Annuler"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} size="middle">
                  <span className="hidden sm:inline">Supprimer</span>
                </Button>
              </Popconfirm>
            </>
          )}
          {editing && (
            <>
              <Button icon={<CloseOutlined />} onClick={handleCancelEdit} size="middle">Annuler</Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} size="middle">
                Sauvegarder
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Two-column layout: info left, tabs right ── */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* Left — Exercise info card */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#e8edf5" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "#e8edf5", background: "#f8faff" }}>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Informations
              </span>
            </div>
            <div className="px-4 py-2">
              <ExerciseInfoPanel exercise={exercise} editing={editing} form={form} />
            </div>
          </div>

          {/* Student CTA */}
          {!isProfessor && questions.length > 0 && (
            <button
              onClick={() => onTakeExercise(exerciseId)}
              className="mt-4 w-full py-3 rounded-xl font-semibold text-white text-sm transition-all"
              style={{ background: "linear-gradient(135deg, #1677ff, #0958d9)" }}
            >
              ▶ Passer l'exercice
            </button>
          )}
        </div>

        {/* Right — Tabs */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#e8edf5" }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems.map(t => ({ ...t, children: <div className="p-4">{t.children}</div> }))}
              className="exercise-detail-tabs"
              tabBarStyle={{ padding: "0 16px", marginBottom: 0 }}
            />
          </div>
        </div>
      </div>

      {/* ── Program Modal ── */}
      <ProgramModal
        open={showProgramModal}
        onCancel={() => { setShowProgramModal(false); programForm.resetFields(); }}
        onFinish={handleProgram}
        loading={programLoading}
        classes={classes}
        classesLoading={classesLoading}
        form={programForm}
      />
    </div>
  );
};

export default ExerciseDetailsView;
