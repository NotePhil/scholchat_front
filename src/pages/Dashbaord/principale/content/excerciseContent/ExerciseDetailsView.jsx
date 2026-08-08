import React, { useState, useEffect, useCallback } from "react";
import { Form, Spin, Popconfirm, message, Tag } from "antd";
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  SaveOutlined, CloseOutlined, CalendarOutlined,
  ReloadOutlined, SendOutlined, BookOutlined,
  GlobalOutlined, LockOutlined, FileTextOutlined,
  TagOutlined, ClockCircleOutlined, QuestionCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  exerciseService,
  exerciseProgrammerService,
} from "../../../../../services/exerciseService";
import { classService } from "../../../../../services/ClassService";
import { getUserId } from "./exerciseDetails/helpers";
import ExerciseInfoPanel from "./exerciseDetails/ExerciseInfoPanel";
import ProgramModal from "./exerciseDetails/ProgramModal";

/* ── Question type label map ─────────────────────────────────────────────── */
const TYPE_MAP = {
  REPONSE_COURTE:   { label: "Réponse courte",   color: "#4f46e5", bg: "#eef2ff" },
  CHOIX_MULTIPLE:   { label: "Choix multiple",   color: "#0891b2", bg: "#ecfeff" },
  VRAI_FAUX:        { label: "Vrai / Faux",       color: "#16a34a", bg: "#f0fdf4" },
  REPONSE_LONGUE:   { label: "Réponse longue",   color: "#d97706", bg: "#fffbeb" },
  CORRESPONDANCE:   { label: "Correspondance",   color: "#7c3aed", bg: "#f5f3ff" },
};

const QuestionTypeBadge = ({ type }) => {
  const cfg = TYPE_MAP[type] || { label: type, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
};

/* ── Main component ──────────────────────────────────────────────────────── */
const ExerciseDetailsView = ({
  exerciseId,
  onBack,
  onUpdate,
  onDelete,
  onEdit,
  onTakeExercise,
}) => {
  const [exercise, setExercise] = useState(null);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [programLoading, setProgramLoading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);

  const [form] = Form.useForm();
  const [programForm] = Form.useForm();

  /* ── fetch ── */
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

  const fetchClasses = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    setClassesLoading(true);
    try {
      const data = await classService.obtenirClassesUtilisateur(userId);
      setClasses(data || []);
    } catch { /* non-blocking */ }
    finally { setClassesLoading(false); }
  }, []);

  useEffect(() => {
    if (!exerciseId) return;
    fetchExercise();
    fetchClasses();
  }, [exerciseId]);

  /* ── actions ── */
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
    } catch (e) {
      message.error(e.message || "Erreur lors de la programmation");
    } finally {
      setProgramLoading(false);
    }
  };

  /* ── loading / error states ── */
  if (loading) {
    return (
      <div className="full-bleed-page">
        <div className="w-full px-4 py-12 flex flex-col items-center justify-center">
          <Spin size="large" />
          <p className="mt-4 text-slate-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="full-bleed-page">
        <div className="w-full px-4 py-6">
          <button onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white mb-4"
            style={{ background: "#1e3a5f" }}>
            <ArrowLeftOutlined /> Retour
          </button>
          <p className="text-red-500">Impossible de charger l'exercice.</p>
        </div>
      </div>
    );
  }

  const isProfessor = !onTakeExercise;
  const questions = exercise.questions || [];

  /* etat badge config */
  const etatCfg = {
    ACTIF:     { label: "Actif",     bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
    PUBLIE:    { label: "Publié",    bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
    BROUILLON: { label: "Brouillon", bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    INACTIF:   { label: "Inactif",   bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  };
  const etat = etatCfg[exercise.etat] || { label: exercise.etat, bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };

  return (
    <div className="full-bleed-page">
      <div className="w-full">

        {/* ── Compact hero banner ── */}
        <div className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 60%, #4f8ec9 100%)" }}>
          {/* subtle decorative circle */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 pointer-events-none"
            style={{ background: "#fff" }} />

          <div className="relative px-3 sm:px-6 py-3 sm:py-4">
            {/* Row 1: back + refresh */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-semibold transition-all hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                <ArrowLeftOutlined style={{ fontSize: 13 }} />
                Retour
              </button>
              <div className="flex-1" />
              <button
                onClick={fetchExercise}
                className="p-1.5 rounded-lg text-white transition-all hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
                title="Actualiser"
              >
                <ReloadOutlined style={{ fontSize: 13 }} />
              </button>
            </div>

            {/* Row 2: title + meta */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-white font-bold text-base sm:text-xl leading-tight m-0 truncate">
                    {exercise.nom}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                    style={{ background: etat.bg, color: etat.color, border: `1px solid ${etat.border}` }}>
                    {etat.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {exercise.niveau && (
                    <span className="flex items-center gap-1 text-blue-100 text-xs">
                      <BookOutlined style={{ fontSize: 10 }} />{exercise.niveau}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-blue-100 text-xs">
                    {exercise.restriction === "PUBLIC"
                      ? <><GlobalOutlined style={{ fontSize: 10 }} />Public</>
                      : <><LockOutlined style={{ fontSize: 10 }} />Privé</>}
                  </span>
                  {exercise.dateCreation && (
                    <span className="flex items-center gap-1 text-blue-100 text-xs">
                      <ClockCircleOutlined style={{ fontSize: 10 }} />
                      {new Date(exercise.dateCreation).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                  {exercise.matieres?.length > 0 && (
                    <span className="flex items-center gap-1 text-blue-100 text-xs">
                      <TagOutlined style={{ fontSize: 10 }} />
                      {exercise.matieres.map(m => m.nom).join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {isProfessor && !editing && (
                <>
                  <button
                    onClick={() => setShowProgramModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                  >
                    <SendOutlined style={{ fontSize: 12 }} />Programmer
                  </button>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:bg-white/25"
                    style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}
                  >
                    <EditOutlined style={{ fontSize: 12 }} />Modifier
                  </button>
                  <Popconfirm
                    title="Supprimer cet exercice ?"
                    description="Cette action est irréversible."
                    onConfirm={handleDelete}
                    okText="Supprimer" cancelText="Annuler"
                    okButtonProps={{ danger: true }}
                  >
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:bg-red-500/30"
                      style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.35)" }}
                    >
                      <DeleteOutlined style={{ fontSize: 12 }} />
                      <span className="hidden sm:inline">Supprimer</span>
                    </button>
                  </Popconfirm>
                </>
              )}
              {editing && (
                <>
                  <button onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:bg-white/20"
                    style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}>
                    <CloseOutlined style={{ fontSize: 12 }} />Annuler
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
                    <SaveOutlined style={{ fontSize: 12 }} />
                    {saving ? "Sauvegarde..." : "Sauvegarder"}
                  </button>
                </>
              )}
              {!isProfessor && questions.length > 0 && (
                <button
                  onClick={() => onTakeExercise(exerciseId)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                  ▶ Passer l'exercice
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-3 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">

            {/* ── Left: Info card ── */}
            <div className="lg:w-72 xl:w-80 flex-shrink-0 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"
                  style={{ background: "#f8faff" }}>
                  <FileTextOutlined style={{ color: "#4f46e5", fontSize: 13 }} />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Informations
                  </span>
                </div>
                <div className="px-4 py-3">
                  <ExerciseInfoPanel exercise={exercise} editing={editing} form={form} />
                </div>
              </div>

              {/* Cours liés */}
              {exercise.coursLies?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"
                    style={{ background: "#f8faff" }}>
                    <BookOutlined style={{ color: "#0891b2", fontSize: 13 }} />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Cours liés
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {exercise.coursLies.map(c => (
                      <div key={c.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{c.titre || c.nom}</p>
                        {c.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{c.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Questions ── */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Questions header */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"
                  style={{ background: "#f8faff" }}>
                  <div className="flex items-center gap-2">
                    <QuestionCircleOutlined style={{ color: "#4f46e5", fontSize: 14 }} />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Questions
                    </span>
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                      style={{ background: "#e0e7ff", color: "#4f46e5" }}>
                      {questions.length}
                    </span>
                  </div>
                  {isProfessor && (
                    <button
                      onClick={() => onEdit && onEdit(exerciseId)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:bg-indigo-50"
                      style={{ color: "#4f46e5", border: "1px solid #e0e7ff" }}
                    >
                      <EditOutlined style={{ fontSize: 11 }} />
                      Gérer
                    </button>
                  )}
                </div>

                {/* Questions list */}
                {questions.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <QuestionCircleOutlined style={{ fontSize: 32, color: "#cbd5e1" }} />
                    <p className="text-slate-400 text-sm mt-3">Aucune question pour cet exercice</p>
                    {isProfessor && (
                      <button
                        onClick={() => onEdit && onEdit(exerciseId)}
                        className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                      >
                        Ajouter des questions
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition-colors">
                        {/* Number bubble */}
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                          style={{ background: "#e0e7ff", color: "#4f46e5" }}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 leading-snug mb-1.5">
                            {q.intitule}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <QuestionTypeBadge type={q.typeQuestion} />
                            {q.points !== undefined && q.points !== null && (
                              <span className="text-xs text-slate-400 font-medium">
                                {q.points} pt{q.points !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          {/* Choices preview for MCQ */}
                          {q.typeQuestion === "CHOIX_MULTIPLE" && q.reponses?.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {q.reponses.map((r, ri) => (
                                <div key={ri} className="flex items-center gap-2 text-xs text-slate-600">
                                  <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${r.estCorrecte ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                                    {r.estCorrecte ? <CheckCircleOutlined style={{ fontSize: 10 }} /> : "○"}
                                  </span>
                                  {r.contenu}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer count */}
                {questions.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-slate-50 flex items-center justify-between"
                    style={{ background: "#fafbff" }}>
                    <span className="text-xs text-slate-400">
                      {questions.length} question{questions.length !== 1 ? "s" : ""}
                    </span>
                    {isProfessor && (
                      <button
                        onClick={() => onEdit && onEdit(exerciseId)}
                        className="text-xs font-semibold transition-all hover:underline"
                        style={{ color: "#4f46e5" }}
                      >
                        + Ajouter / modifier
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
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
