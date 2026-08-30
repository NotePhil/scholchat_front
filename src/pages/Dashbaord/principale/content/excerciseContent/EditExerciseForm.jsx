import React, { useState, useEffect } from "react";
import {
  Form, Input, Select, Button, Alert, Spin, Typography, message, Badge,
} from "antd";
import {
  SaveOutlined, ArrowLeftOutlined, BookOutlined,
  InfoCircleOutlined, EyeOutlined, LockOutlined,
} from "@ant-design/icons";
import { matiereService } from "../../../../../services/MatiereService";
import { questionReponseService, exerciseService } from "../../../../../services/exerciseService";
import QuestionBuilder from "./exerciseForm/QuestionBuilder";
import {
  NIVEAU_OPTIONS, emptyQuestion, validateQuestion, buildQuestionPayload,
} from "./exerciseForm/constants";

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const EditExerciseForm = ({ exerciseId, onSubmit, onCancel, onError, onSuccess, onBackToDetails }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [matieres, setMatieres] = useState([]);
  const [loadingMatieres, setLoadingMatieres] = useState(false);
  const [originalMatiereIds, setOriginalMatiereIds] = useState([]);

  // Questions state — each item may have an `id` if it already exists in the backend
  const [questions, setQuestions] = useState([]);
  const [removedIds, setRemovedIds] = useState([]); // IDs of questions deleted by the user
  const [currentQuestion, setCurrentQuestion] = useState(emptyQuestion());
  const [editingIndex, setEditingIndex] = useState(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingMatieres(true);
      try { setMatieres((await matiereService.getAllMatieres()) || []); }
      catch { message.warning("Impossible de charger les matières"); }
      finally { setLoadingMatieres(false); }
    })();

    if (exerciseId) loadExercise();
  }, [exerciseId]);

  const loadExercise = async () => {
    setLoading(true);
    try {
      const [exo, qs] = await Promise.all([
        exerciseService.getExerciseById(exerciseId),
        questionReponseService.getQuestionsByExercise(exerciseId),
      ]);

      const matiereIds = (exo.matieres || []).map(m => m.id);
      setOriginalMatiereIds(matiereIds);

      form.setFieldsValue({
        nom: exo.nom || "",
        description: exo.description || "",
        niveau: exo.niveau || "",
        restriction: exo.restriction || "PRIVE",
        matiereIds,
      });

      setQuestions(
        (qs || []).map(q => ({
          ...q,
          choixReponses: q.choixReponses
            ? [...q.choixReponses].sort((a, b) => a.ordreAffichage - b.ordreAffichage)
            : [],
          reponse: q.reponse || "",
        }))
      );
    } catch {
      setError("Erreur lors du chargement de l'exercice");
    } finally {
      setLoading(false);
    }
  };

  // ── Question actions ───────────────────────────────────────────────────────
  const handleAddQuestion = () => {
    if (!validateQuestion(currentQuestion, message)) return;
    if (editingIndex !== null) {
      const updated = [...questions];
      updated[editingIndex] = { ...currentQuestion };
      setQuestions(updated);
      setEditingIndex(null);
    } else {
      setQuestions(prev => [...prev, { ...currentQuestion }]);
    }
    setCurrentQuestion(emptyQuestion(currentQuestion.typeQuestion));
    message.success(editingIndex !== null ? "Question mise à jour" : "Question ajoutée");
  };

  const handleEditQuestion = (index) => {
    setCurrentQuestion({ ...questions[index] });
    setEditingIndex(index);
  };

  const handleRemoveQuestion = (index) => {
    const q = questions[index];
    if (q.id) setRemovedIds(prev => [...prev, q.id]);
    setQuestions(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) { setCurrentQuestion(emptyQuestion()); setEditingIndex(null); }
  };

  const handleCancelEdit = () => {
    setCurrentQuestion(emptyQuestion(currentQuestion.typeQuestion));
    setEditingIndex(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (values) => {
    setSaving(true);
    setError("");
    try {
      // 1. Update exercise metadata
      await onSubmit(exerciseId, {
        nom: values.nom,
        description: values.description,
        niveau: values.niveau,
        restriction: values.restriction || "PRIVE",
      });

      // 2. Sync matières — add new, remove old
      const newMatiereIds = values.matiereIds || [];
      const toAdd = newMatiereIds.filter(id => !originalMatiereIds.includes(id));
      const toRemove = originalMatiereIds.filter(id => !newMatiereIds.includes(id));
      await Promise.allSettled([
        ...toAdd.map(id => exerciseService.lierExerciseAMatiere(exerciseId, id)),
        ...toRemove.map(id => exerciseService.delierExerciseDeMatiere(exerciseId, id)),
      ]);

      // 3. Delete removed questions
      await Promise.allSettled(removedIds.map(id => questionReponseService.deleteQuestion(id)));

      // 4. Update existing questions / create new ones
      const questionResults = await Promise.allSettled(
        questions.map(q =>
          q.id
            ? questionReponseService.updateQuestion(q.id, buildQuestionPayload(q))
            : questionReponseService.createQuestion(exerciseId, buildQuestionPayload(q))
        )
      );
      const failedQuestions = questionResults.filter(r => r.status === "rejected");
      if (failedQuestions.length > 0) {
        failedQuestions.forEach(r => console.error("[EditExerciseForm] failed to save question:", r.reason));
        const failMsg = `Exercice mis à jour, mais ${failedQuestions.length} question${failedQuestions.length > 1 ? "s n'ont" : " n'a"} pas pu être enregistrée${failedQuestions.length > 1 ? "s" : ""}.`;
        message.warning(failMsg);
        onError?.(failMsg);
      } else {
        message.success("Exercice mis à jour avec succès");
        onSuccess?.("Exercice mis à jour avec succès");
      }
      if (onBackToDetails) onBackToDetails(exerciseId);
      else onCancel();
    } catch (err) {
      const msg = err.message || "Erreur lors de la mise à jour";
      setError(msg);
      onError?.(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <Spin size="large" />
        <Text className="mt-3 text-gray-500 text-sm">Chargement de l'exercice...</Text>
      </div>
    );
  }

  return (
    <div className="full-bleed-page">
      <div className="w-full px-3 sm:px-6 py-3 sm:py-4">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 px-6 py-5 rounded-2xl"
        style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 100%)" }}>
        <button type="button" onClick={onCancel}
          style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ArrowLeftOutlined style={{ fontSize: 16 }} />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BookOutlined style={{ fontSize: 20, color: "#fff" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-xl leading-tight">Modifier l'exercice</div>
          <div className="text-blue-100 text-sm opacity-90">
            Modifiez les informations et les questions
          </div>
        </div>
        <Badge
          count={`${questions.length} Q`}
          style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600, fontSize: 12 }}
        />
      </div>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError("")}
          className="mb-4" style={{ borderRadius: 10 }} />
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit} scrollToFirstError>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          {/* ── Left: Informations ── */}
          <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#e4eaf4" }}>
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b" style={{ borderColor: "#f0f4fb" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#dbeafe" }}>
                <InfoCircleOutlined style={{ color: "#2d6a9f", fontSize: 15 }} />
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">Informations générales</div>
                <div className="text-xs text-gray-400">Titre, niveau et visibilité</div>
              </div>
            </div>

            <Form.Item name="nom" label="Titre de l'exercice"
              rules={[{ required: true, message: "Le titre est requis" }, { min: 3 }, { max: 200 }]}>
              <Input placeholder="Ex : Équations du 2ᵉ degré" maxLength={200} showCount style={{ borderRadius: 8 }} />
            </Form.Item>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="niveau" label="Niveau" rules={[{ required: true, message: "Requis" }]}>
                <Select placeholder="Sélectionner" style={{ width: "100%" }}>
                  {NIVEAU_OPTIONS.map(n => <Option key={n.value} value={n.value}>{n.label}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="restriction" label="Visibilité" rules={[{ required: true }]}>
                <Select style={{ width: "100%" }}>
                  <Option value="PUBLIC"><EyeOutlined className="mr-1" />Public</Option>
                  <Option value="PRIVE"><LockOutlined className="mr-1" />Privé</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item name="matiereIds" label="Matières associées">
              <Select mode="multiple" placeholder="Sélectionner les matières"
                loading={loadingMatieres} allowClear showSearch optionFilterProp="children"
                notFoundContent={loadingMatieres ? <Spin size="small" /> : "Aucune matière"}>
                {matieres.map(m => <Option key={m.id} value={m.id}>{m.nom}</Option>)}
              </Select>
            </Form.Item>

            <Form.Item name="description" label="Description"
              rules={[{ required: true, message: "La description est requise" }, { min: 10 }, { max: 1000 }]}
              style={{ marginBottom: 0 }}>
              <TextArea rows={6} placeholder="Objectifs pédagogiques, consignes..."
                showCount maxLength={1000} style={{ borderRadius: 8, resize: "none" }} />
            </Form.Item>
          </div>

          {/* ── Right: Questions ── */}
          <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#e4eaf4" }}>
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b" style={{ borderColor: "#f0f4fb" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#ede9fe" }}>
                <span style={{ color: "#6d28d9", fontSize: 15, fontWeight: 700 }}>Q</span>
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">
                  Questions
                  {questions.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: "#ede9fe", color: "#6d28d9" }}>
                      {questions.length}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  Modifiez, ajoutez ou supprimez des questions
                </div>
              </div>
            </div>

            <QuestionBuilder
              questions={questions}
              currentQuestion={currentQuestion}
              editingIndex={editingIndex}
              onChange={setCurrentQuestion}
              onAdd={handleAddQuestion}
              onEdit={handleEditQuestion}
              onRemove={handleRemoveQuestion}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 rounded-xl"
          style={{ background: "#f8faff", border: "1px solid #e4eaf4" }}>
          <Text className="text-xs text-gray-400 mr-auto hidden sm:block">
            {questions.length} question{questions.length !== 1 ? "s" : ""}
            {removedIds.length > 0 && ` · ${removedIds.length} à supprimer`}
          </Text>
          <Button onClick={onCancel} disabled={saving} size="large" style={{ borderRadius: 10, minWidth: 120 }}>
            Annuler
          </Button>
          <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />} size="large"
            style={{ borderRadius: 10, minWidth: 180, background: "#1a3a5c", borderColor: "#1a3a5c", fontWeight: 600 }}>
            Enregistrer les modifications
          </Button>
        </div>
      </Form>
    </div>
    </div>
  );
};

export default EditExerciseForm;
