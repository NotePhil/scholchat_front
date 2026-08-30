import React, { useState, useEffect } from "react";
import {
  Form, Input, Select, Button, Alert, Spin, Typography, message,
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

const CreateExerciseForm = ({ onSubmit, onCancel, onError, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matieres, setMatieres] = useState([]);
  const [loadingMatieres, setLoadingMatieres] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(emptyQuestion());
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    (async () => {
      setLoadingMatieres(true);
      try { setMatieres((await matiereService.getAllMatieres()) || []); }
      catch { message.warning("Impossible de charger les matières"); }
      finally { setLoadingMatieres(false); }
    })();
  }, []);

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
    setQuestions(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) { setCurrentQuestion(emptyQuestion()); setEditingIndex(null); }
  };

  const handleCancelEdit = () => {
    setCurrentQuestion(emptyQuestion(currentQuestion.typeQuestion));
    setEditingIndex(null);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    setError("");
    try {
      const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
      if (!userId) throw new Error("Utilisateur non connecté.");

      const created = await onSubmit({
        nom: values.nom,
        description: values.description,
        niveau: values.niveau,
        restriction: values.restriction || "PRIVE",
        redacteurId: userId,
        etat: "BROUILLON",
      });

      let failedQuestions = 0;
      if (created?.id) {
        for (const mId of (values.matiereIds || []))
          try { await exerciseService.lierExerciseAMatiere(created.id, mId); } catch {}
        for (const q of questions) {
          try {
            await questionReponseService.createQuestion(created.id, buildQuestionPayload(q));
          } catch (qErr) {
            failedQuestions += 1;
            console.error("[CreateExerciseForm] failed to save question:", q, qErr);
          }
        }
      }

      form.resetFields();
      setQuestions([]);
      setCurrentQuestion(emptyQuestion());
      if (failedQuestions > 0) {
        onError?.(
          `Exercice créé, mais ${failedQuestions} question${failedQuestions > 1 ? "s n'ont" : " n'a"} pas pu être enregistrée${failedQuestions > 1 ? "s" : ""}. Modifiez l'exercice pour les ajouter à nouveau.`
        );
      } else {
        onSuccess?.("Exercice créé avec succès");
      }
    } catch (err) {
      const msg = err.message || "Erreur lors de la création";
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

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
        <div>
          <div className="text-white font-bold text-xl leading-tight">Créer un exercice</div>
          <div className="text-blue-100 text-sm opacity-90">Renseignez les informations et ajoutez vos questions</div>
        </div>
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
              <Form.Item name="restriction" label="Visibilité" rules={[{ required: true }]} initialValue="PRIVE">
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
                <div className="text-xs text-gray-400">Construisez les questions de votre exercice</div>
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

        {/* Tips */}
        <div className="rounded-xl px-5 py-4 mb-5" style={{ background: "#f0f7ff", border: "1px solid #bfdbfe" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <InfoCircleOutlined style={{ color: "#2563eb", fontSize: 14 }} />
            <span className="text-sm font-semibold text-blue-700">Conseils</span>
          </div>
          <ul className="text-xs text-blue-800 space-y-0.5 list-none pl-0 m-0">
            <li>① Choisissez le <strong>niveau</strong> correspondant à l'enum backend (Collège, Lycée…).</li>
            <li>② Dans le constructeur : sélectionnez le <strong>type</strong>, définissez les <strong>points</strong>, rédigez l'<strong>intitulé</strong> et les réponses, puis cliquez <strong>Ajouter</strong>.</li>
            <li>③ L'exercice est créé en état <strong>Brouillon</strong> — programmez-le ensuite pour le diffuser.</li>
          </ul>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 rounded-xl"
          style={{ background: "#f8faff", border: "1px solid #e4eaf4" }}>
          <Text className="text-xs text-gray-400 mr-auto hidden sm:block">
            {questions.length} question{questions.length !== 1 ? "s" : ""} ajoutée{questions.length !== 1 ? "s" : ""}
          </Text>
          <Button onClick={onCancel} disabled={loading} size="large" style={{ borderRadius: 10, minWidth: 120 }}>
            Annuler
          </Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} size="large"
            style={{ borderRadius: 10, minWidth: 160, background: "#1a3a5c", borderColor: "#1a3a5c", fontWeight: 600 }}>
            Créer l'exercice
          </Button>
        </div>
      </Form>
    </div>
    </div>
  );
};

export default CreateExerciseForm;
