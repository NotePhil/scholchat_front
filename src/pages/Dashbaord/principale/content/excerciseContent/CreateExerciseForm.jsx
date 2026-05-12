import React, { useState, useEffect } from "react";
import {
  Form, Input, Select, Button, Alert, Divider, Typography,
  Row, Col, message, Spin, InputNumber, Tooltip,
} from "antd";
import {
  SaveOutlined, ArrowLeftOutlined, BookOutlined, PlusOutlined,
  DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined,
  InfoCircleOutlined, EyeOutlined, LockOutlined,
  CheckSquareOutlined, AlignLeftOutlined, OrderedListOutlined,
  LinkOutlined, FontSizeOutlined, FileTextOutlined, EditOutlined,
} from "@ant-design/icons";
import { matiereService } from "../../../../../services/MatiereService";
import { questionReponseService, exerciseService } from "../../../../../services/exerciseService";

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const QUESTION_TYPES = [
  { value: "QCM",           label: "QCM",              desc: "Choix multiple",      icon: <CheckSquareOutlined /> },
  { value: "VRAI_FAUX",     label: "Vrai / Faux",      desc: "Deux options",        icon: <AlignLeftOutlined /> },
  { value: "REPONSE_COURTE",label: "Réponse courte",   desc: "Texte court",         icon: <FontSizeOutlined /> },
  { value: "REPONSE_LONGUE",label: "Réponse longue",   desc: "Texte développé",     icon: <FileTextOutlined /> },
  { value: "DEVELOPPEMENT", label: "Développement",    desc: "Rédaction libre",     icon: <EditOutlined /> },
  { value: "ASSOCIATION",   label: "Association",      desc: "Relier les éléments", icon: <LinkOutlined /> },
  { value: "CLASSEMENT",    label: "Classement",       desc: "Ordonner",            icon: <OrderedListOutlined /> },
  { value: "TROU",          label: "Texte à trous",    desc: "Compléter",           icon: <AlignLeftOutlined /> },
];

const NIVEAUX = [
  { group: "Primaire",    items: ["CP","CE1","CE2","CM1","CM2"] },
  { group: "Collège",     items: ["6ème","5ème","4ème","3ème"] },
  { group: "Lycée",       items: ["2nde","1ère","Terminale"] },
  { group: "Université",  items: ["Licence 1","Licence 2","Licence 3","Master 1","Master 2"] },
];

const sectionStyle = {
  background: "#fff",
  border: "1px solid #e4eaf4",
  borderRadius: 12,
  padding: "20px 24px",
  marginBottom: 20,
};

const sectionHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 18,
  paddingBottom: 12,
  borderBottom: "1px solid #f0f4fb",
};

const iconBoxStyle = (color) => ({
  width: 34, height: 34, borderRadius: 8,
  background: `${color}18`,
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0,
});

const CreateExerciseForm = ({ onSubmit, onCancel, onError, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matieres, setMatieres] = useState([]);
  const [loadingMatieres, setLoadingMatieres] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    intitule: "", typeQuestion: "QCM", points: 1,
    choixReponses: [
      { texte: "", estCorrect: false, ordreAffichage: 1 },
      { texte: "", estCorrect: false, ordreAffichage: 2 },
    ],
    reponse: "",
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  useEffect(() => { fetchMatieres(); }, []);

  const fetchMatieres = async () => {
    try {
      setLoadingMatieres(true);
      const data = await matiereService.getAllMatieres();
      setMatieres(data || []);
    } catch {
      message.warning("Impossible de charger les matières");
      setMatieres([]);
    } finally {
      setLoadingMatieres(false);
    }
  };

  const getDefaultChoix = (type) => {
    if (type === "VRAI_FAUX")
      return [{ texte: "Vrai", estCorrect: false, ordreAffichage: 1 }, { texte: "Faux", estCorrect: false, ordreAffichage: 2 }];
    const allCorrect = type === "ASSOCIATION" || type === "CLASSEMENT";
    return [
      { texte: "", estCorrect: allCorrect, ordreAffichage: 1 },
      { texte: "", estCorrect: allCorrect, ordreAffichage: 2 },
    ];
  };

  const resetCurrentQuestion = (type = "QCM") =>
    setCurrentQuestion({ intitule: "", typeQuestion: type, points: 1, choixReponses: getDefaultChoix(type), reponse: "" });

  const handleTypeChange = (value) =>
    setCurrentQuestion(prev => ({ intitule: prev.intitule, typeQuestion: value, points: prev.points, choixReponses: getDefaultChoix(value), reponse: "" }));

  const handleChoixChange = (index, field, value) => {
    const updated = [...currentQuestion.choixReponses];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentQuestion({ ...currentQuestion, choixReponses: updated });
  };

  const handleAddChoix = () => {
    const type = currentQuestion.typeQuestion;
    setCurrentQuestion({
      ...currentQuestion,
      choixReponses: [...currentQuestion.choixReponses, {
        texte: "", estCorrect: type === "ASSOCIATION" || type === "CLASSEMENT",
        ordreAffichage: currentQuestion.choixReponses.length + 1,
      }],
    });
  };

  const handleRemoveChoix = (index) => {
    const updated = currentQuestion.choixReponses.filter((_, i) => i !== index).map((c, i) => ({ ...c, ordreAffichage: i + 1 }));
    setCurrentQuestion({ ...currentQuestion, choixReponses: updated });
  };

  const moveChoix = (index, dir) => {
    const updated = [...currentQuestion.choixReponses];
    const target = index + dir;
    if (target < 0 || target >= updated.length) return;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setCurrentQuestion({ ...currentQuestion, choixReponses: updated.map((c, i) => ({ ...c, ordreAffichage: i + 1 })) });
  };

  const validateQuestion = () => {
    if (!currentQuestion.intitule.trim()) { message.warning("L'intitulé est requis"); return false; }
    const type = currentQuestion.typeQuestion;
    if (type === "VRAI_FAUX") {
      if (!currentQuestion.choixReponses.some(c => c.estCorrect)) { message.warning("Sélectionnez Vrai ou Faux"); return false; }
    } else if (["QCM","ASSOCIATION","CLASSEMENT","TROU"].includes(type)) {
      if (currentQuestion.choixReponses.length < 2) { message.warning("Au moins 2 choix requis"); return false; }
      if (currentQuestion.choixReponses.some(c => !c.texte.trim())) { message.warning("Tous les choix doivent avoir un texte"); return false; }
      if (type === "QCM" && !currentQuestion.choixReponses.some(c => c.estCorrect)) { message.warning("Cochez au moins une bonne réponse"); return false; }
    } else if (["REPONSE_COURTE","REPONSE_LONGUE","DEVELOPPEMENT"].includes(type)) {
      if (!currentQuestion.reponse.trim()) { message.warning("La réponse attendue est requise"); return false; }
    }
    return true;
  };

  const buildPayload = (q) => {
    const base = { intitule: q.intitule, typeQuestion: q.typeQuestion, points: q.points || 1 };
    if (["QCM","ASSOCIATION","CLASSEMENT","VRAI_FAUX","TROU"].includes(q.typeQuestion))
      return { ...base, choixReponses: q.choixReponses };
    return { ...base, reponse: q.reponse };
  };

  const handleAddQuestion = () => {
    if (!validateQuestion()) return;
    if (editingQuestionIndex !== null) {
      const updated = [...questions];
      updated[editingQuestionIndex] = { ...currentQuestion };
      setQuestions(updated);
      setEditingQuestionIndex(null);
    } else {
      setQuestions([...questions, { ...currentQuestion }]);
    }
    resetCurrentQuestion(currentQuestion.typeQuestion);
    message.success(editingQuestionIndex !== null ? "Question mise à jour" : "Question ajoutée");
  };

  const handleEditQuestion = (index) => { setCurrentQuestion(questions[index]); setEditingQuestionIndex(index); };
  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
    if (editingQuestionIndex === index) { resetCurrentQuestion(); setEditingQuestionIndex(null); }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true); setError("");
      const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
      if (!userId) throw new Error("Utilisateur non connecté.");
      const exerciseData = { nom: values.nom, description: values.description, niveau: values.niveau, restriction: values.restriction || "PRIVE", redacteurId: userId, etat: "BROUILLON" };
      const created = await onSubmit(exerciseData);
      if (created?.id) {
        for (const mId of (values.matiereIds || []))
          try { await exerciseService.lierExerciseAMatiere(created.id, mId); } catch {}
        for (const q of questions)
          try { await questionReponseService.createQuestion(created.id, buildPayload(q)); } catch {}
      }
      form.resetFields(); setQuestions([]); resetCurrentQuestion();
      onSuccess?.("Exercice créé avec succès");
    } catch (err) {
      const msg = err.message || "Erreur lors de la création";
      setError(msg); onError?.(msg);
    } finally { setLoading(false); }
  };

  const handleCancel = () => { form.resetFields(); setQuestions([]); resetCurrentQuestion(); setError(""); onCancel(); };

  const typeInfo = QUESTION_TYPES.find(t => t.value === currentQuestion.typeQuestion);

  const renderAnswerBuilder = () => {
    const type = currentQuestion.typeQuestion;
    const choix = currentQuestion.choixReponses || [];

    if (type === "VRAI_FAUX") return (
      <div>
        <Text className="text-xs text-gray-500 block mb-2">Cliquez sur la bonne réponse</Text>
        <div className="flex gap-3">
          {choix.map((c, i) => (
            <button key={i} type="button"
              onClick={() => setCurrentQuestion({ ...currentQuestion, choixReponses: choix.map((x, j) => ({ ...x, estCorrect: j === i })) })}
              className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${c.estCorrect ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}
            >
              {c.texte}
            </button>
          ))}
        </div>
      </div>
    );

    if (["QCM","ASSOCIATION","CLASSEMENT","TROU"].includes(type)) return (
      <div>
        <Text className="text-xs text-gray-500 block mb-3">
          {type === "QCM" ? "Cochez la/les bonne(s) réponse(s)" :
           type === "ASSOCIATION" ? "Saisissez les paires à associer" :
           type === "TROU" ? "Mots/expressions à compléter" :
           "Éléments dans l'ordre correct"}
        </Text>
        <div className="space-y-2">
          {choix.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => moveChoix(i, -1)} disabled={i === 0}
                  className="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30">
                  <ArrowUpOutlined style={{ fontSize: 10 }} />
                </button>
                <button type="button" onClick={() => moveChoix(i, 1)} disabled={i === choix.length - 1}
                  className="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30">
                  <ArrowDownOutlined style={{ fontSize: 10 }} />
                </button>
              </div>
              {type === "QCM" && (
                <input type="checkbox" checked={c.estCorrect}
                  onChange={e => handleChoixChange(i, "estCorrect", e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              )}
              {(type === "CLASSEMENT" || type === "TROU") && (
                <span className="text-xs font-bold text-gray-400 w-5 text-center">{i + 1}</span>
              )}
              <Input
                value={c.texte}
                onChange={e => handleChoixChange(i, "texte", e.target.value)}
                placeholder={type === "ASSOCIATION" ? "Ex: France → Paris" : type === "CLASSEMENT" ? `Élément ${i + 1}` : type === "TROU" ? "Mot à compléter" : `Option ${i + 1}`}
                style={{ flex: 1, borderRadius: 8 }}
              />
              {choix.length > 2 && (
                <button type="button" onClick={() => handleRemoveChoix(i)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                  <DeleteOutlined style={{ fontSize: 13 }} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={handleAddChoix}
          className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg border border-dashed border-indigo-300 hover:border-indigo-500 transition-colors">
          <PlusOutlined /> Ajouter un choix
        </button>
      </div>
    );

    if (["REPONSE_COURTE","REPONSE_LONGUE","DEVELOPPEMENT"].includes(type)) return (
      <div>
        <Text className="text-xs text-gray-500 block mb-2">Réponse modèle (pour la correction)</Text>
        {type === "REPONSE_COURTE"
          ? <Input value={currentQuestion.reponse} onChange={e => setCurrentQuestion({ ...currentQuestion, reponse: e.target.value })} placeholder="Ex: H₂O" style={{ borderRadius: 8 }} />
          : <TextArea rows={3} value={currentQuestion.reponse} onChange={e => setCurrentQuestion({ ...currentQuestion, reponse: e.target.value })} placeholder="Décrivez la réponse attendue..." style={{ borderRadius: 8, resize: "none" }} />
        }
      </div>
    );
    return null;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">

      {/* ── Page header (back + title only) ── */}
      <div
        className="flex items-center gap-3 mb-6 px-6 py-5 rounded-2xl"
        style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 100%)" }}
      >
        <button type="button" onClick={handleCancel}
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

      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError("")} className="mb-4" style={{ borderRadius: 10 }} />}

      <Form form={form} layout="vertical" onFinish={handleSubmit} scrollToFirstError>

        {/* ── Two cards side by side ── */}
        <Row gutter={[20, 20]} align="stretch" className="mb-5">

          {/* Card 1 : Informations générales */}
          <Col xs={24} lg={12}>
            <div style={{ ...sectionStyle, marginBottom: 0, height: "100%" }}>
              <div style={sectionHeaderStyle}>
                <div style={iconBoxStyle("#2d6a9f")}>
                  <InfoCircleOutlined style={{ color: "#2d6a9f", fontSize: 16 }} />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">Informations générales</div>
                  <div className="text-xs text-gray-400">Titre, niveau et visibilité de l'exercice</div>
                </div>
              </div>
              <Form.Item name="nom"
                label={<span className="text-sm font-medium text-gray-700">Titre de l'exercice</span>}
                rules={[{ required: true, message: "Le titre est requis" }, { min: 3 }, { max: 200 }]}>
                <Input placeholder="Ex : Équations du 2ᵉ degré" maxLength={200} showCount style={{ borderRadius: 8 }} />
              </Form.Item>
              <Row gutter={[12, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item name="niveau"
                    label={<span className="text-sm font-medium text-gray-700">Niveau</span>}
                    rules={[{ required: true, message: "Le niveau est requis" }]}>
                    <Select placeholder="Sélectionner" showSearch optionFilterProp="children" style={{ width: "100%" }}>
                      {NIVEAUX.map(g => (
                        <Select.OptGroup key={g.group} label={g.group}>
                          {g.items.map(n => <Option key={n} value={n}>{n}</Option>)}
                        </Select.OptGroup>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="restriction"
                    label={<span className="text-sm font-medium text-gray-700">Visibilité</span>}
                    rules={[{ required: true }]} initialValue="PRIVE">
                    <Select style={{ width: "100%" }}>
                      <Option value="PUBLIC"><EyeOutlined className="mr-1" />Public</Option>
                      <Option value="PRIVE"><LockOutlined className="mr-1" />Privé</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="matiereIds"
                label={<span className="text-sm font-medium text-gray-700">Matières associées</span>}>
                <Select mode="multiple" placeholder="Sélectionner les matières" loading={loadingMatieres}
                  allowClear showSearch optionFilterProp="children"
                  notFoundContent={loadingMatieres ? <Spin size="small" /> : "Aucune matière"}>
                  {matieres.map(m => <Option key={m.id} value={m.id}>{m.nom}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="description"
                label={<span className="text-sm font-medium text-gray-700">Description</span>}
                rules={[{ required: true, message: "La description est requise" }, { min: 10 }, { max: 1000 }]}
                style={{ marginBottom: 0 }}>
                <TextArea rows={5} placeholder="Objectifs pédagogiques, consignes..." showCount maxLength={1000}
                  style={{ borderRadius: 8, resize: "none" }} />
              </Form.Item>
            </div>
          </Col>

          {/* Card 2 : Questions */}
          <Col xs={24} lg={12}>
            <div style={{ ...sectionStyle, marginBottom: 0, height: "100%" }}>
              <div style={sectionHeaderStyle}>
                <div style={iconBoxStyle("#6d28d9")}>
                  <OrderedListOutlined style={{ color: "#6d28d9", fontSize: 16 }} />
                </div>
                <div className="flex-1">
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

              {/* Added questions list — scrollable, max 5 visible */}
              {questions.length > 0 && (
                <div className="mb-4">
                  <div
                    style={{
                      maxHeight: 210,
                      overflowY: "auto",
                      borderRadius: 10,
                      border: "1px solid #ede9fe",
                      background: "#faf9ff",
                    }}
                  >
                    {questions.map((q, i) => {
                      const t = QUESTION_TYPES.find(x => x.value === q.typeQuestion);
                      const isEditing = editingQuestionIndex === i;
                      return (
                        <div key={i}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all ${isEditing ? "bg-indigo-50" : "hover:bg-gray-50"} ${i < questions.length - 1 ? "border-b border-gray-100" : ""}`}
                          onClick={() => handleEditQuestion(i)}
                        >
                          <div className="flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0"
                            style={{ width: 24, height: 24, background: isEditing ? "#6d28d9" : "#e5e7eb", color: isEditing ? "#fff" : "#6b7280" }}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">{q.intitule}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              {t?.icon} {t?.label} · {q.points} pt{q.points > 1 ? "s" : ""}
                            </div>
                          </div>
                          <Tooltip title="Supprimer">
                            <button type="button" onClick={e => { e.stopPropagation(); handleRemoveQuestion(i); }}
                              className="p-1 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0">
                              <DeleteOutlined style={{ fontSize: 12 }} />
                            </button>
                          </Tooltip>
                        </div>
                      );
                    })}
                  </div>
                  {questions.length > 5 && (
                    <div className="text-xs text-gray-400 text-right mt-1">
                      {questions.length} questions — faites défiler pour voir toutes
                    </div>
                  )}
                </div>
              )}

              {/* Question builder */}
              <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 p-4">
                <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-3">
                  {editingQuestionIndex !== null ? `Modifier la question ${editingQuestionIndex + 1}` : "Nouvelle question"}
                </div>
                <Row gutter={[12, 0]} className="mb-3">
                  <Col xs={24} sm={15}>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Type de question</label>
                    <Select value={currentQuestion.typeQuestion} onChange={handleTypeChange} style={{ width: "100%" }}>
                      {QUESTION_TYPES.map(t => (
                        <Option key={t.value} value={t.value}>
                          <span className="flex items-center gap-2">{t.icon} {t.label} <span className="text-gray-400 text-xs">— {t.desc}</span></span>
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} sm={9}>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Points</label>
                    <InputNumber min={0.5} max={100} step={0.5} value={currentQuestion.points}
                      onChange={v => setCurrentQuestion({ ...currentQuestion, points: v })}
                      style={{ width: "100%" }} />
                  </Col>
                </Row>
                <div className="mb-3">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Intitulé de la question</label>
                  <TextArea rows={2} value={currentQuestion.intitule}
                    onChange={e => setCurrentQuestion({ ...currentQuestion, intitule: e.target.value })}
                    placeholder="Posez votre question ici…"
                    style={{ borderRadius: 8, resize: "none" }} />
                </div>
                <div className="mb-3">{renderAnswerBuilder()}</div>
                <div className="flex justify-end gap-2 flex-wrap">
                  {editingQuestionIndex !== null && (
                    <Button onClick={() => { resetCurrentQuestion(); setEditingQuestionIndex(null); }}
                      style={{ borderRadius: 8 }}>
                      Annuler
                    </Button>
                  )}
                  <Button type="primary" icon={editingQuestionIndex !== null ? <SaveOutlined /> : <PlusOutlined />}
                    onClick={handleAddQuestion}
                    style={{ borderRadius: 8, background: "#6d28d9", borderColor: "#6d28d9" }}>
                    {editingQuestionIndex !== null ? "Mettre à jour" : "Ajouter la question"}
                  </Button>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* ── Tips ── */}
        <div className="rounded-xl px-5 py-4 mb-5"
          style={{ background: "#f0f7ff", border: "1px solid #bfdbfe" }}>
          <div className="flex items-center gap-2 mb-2">
            <InfoCircleOutlined style={{ color: "#2563eb", fontSize: 14 }} />
            <span className="text-sm font-semibold text-blue-700">Conseils pour un bon exercice</span>
          </div>
          <ul className="text-xs text-blue-800 space-y-1 list-none pl-0 m-0">
            <li>① Choisissez un titre clair et le niveau adapté à vos élèves.</li>
            <li>② Rédigez une description avec les objectifs pédagogiques.</li>
            <li>③ Dans le constructeur de questions : sélectionnez d'abord le <strong>type</strong>, définissez les <strong>points</strong>, puis rédigez l'<strong>intitulé</strong> et les réponses.</li>
            <li>④ Cliquez sur <strong>Ajouter la question</strong> avant de passer à la suivante.</li>
            <li>⑤ Utilisez la visibilité <strong>Privé</strong> pour restreindre l'accès à vos classes.</li>
          </ul>
        </div>

        {/* ── Bottom action bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-5 py-4 rounded-xl"
          style={{ background: "#f8faff", border: "1px solid #e4eaf4" }}>
          <span className="text-xs text-gray-400 mr-auto hidden sm:block">
            {questions.length} question{questions.length !== 1 ? "s" : ""} ajoutée{questions.length !== 1 ? "s" : ""}
          </span>
          <Button onClick={handleCancel} disabled={loading} size="large"
            style={{ borderRadius: 10, minWidth: 120 }}>
            Annuler
          </Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} size="large"
            style={{ borderRadius: 10, minWidth: 160, background: "#1a3a5c", borderColor: "#1a3a5c", fontWeight: 600 }}>
            Créer l'exercice
          </Button>
        </div>

      </Form>
    </div>
  );
};

export default CreateExerciseForm;
