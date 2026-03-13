import React, { useState, useEffect } from "react";
import {
  Card, Form, Input, Select, Button, Alert, Divider, Typography,
  Row, Col, message, Spin, Tag, Space, InputNumber,
} from "antd";
import {
  SaveOutlined, CloseOutlined, BookOutlined, PlusOutlined,
  CloseCircleOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined,
} from "@ant-design/icons";
import { matiereService } from "../../../../../services/MatiereService";
import { questionReponseService, exerciseService } from "../../../../../services/exerciseService";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateExerciseForm = ({ onSubmit, onCancel, onError, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matieres, setMatieres] = useState([]);
  const [loadingMatieres, setLoadingMatieres] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    intitule: "", typeQuestion: "QCM", points: 1,
    choixReponses: [{ texte: "", estCorrect: false, ordreAffichage: 1 }, { texte: "", estCorrect: false, ordreAffichage: 2 }],
    reponse: ""
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  const niveauxOptions = [
    { value: "PRIMAIRE", label: "Primaire", children: ["CP", "CE1", "CE2", "CM1", "CM2"] },
    { value: "COLLEGE", label: "Collège", children: ["6ème", "5ème", "4ème", "3ème"] },
    { value: "LYCEE", label: "Lycée", children: ["2nde", "1ère", "Terminale"] },
    { value: "UNIVERSITE", label: "Université", children: ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2"] },
  ];

  const restrictionOptions = [
    { value: "PUBLIC", label: "Public - Tous les utilisateurs" },
    { value: "PRIVE", label: "Privé - Seulement mes classes" },
  ];

  useEffect(() => { fetchMatieres(); }, []);

  const fetchMatieres = async () => {
    try {
      setLoadingMatieres(true);
      const data = await matiereService.getAllMatieres();
      setMatieres(data || []);
    } catch (err) {
      message.warning("Impossible de charger les matières");
      setMatieres([]);
    } finally {
      setLoadingMatieres(false);
    }
  };

  const getDefaultChoix = (typeQuestion) => {
    if (typeQuestion === "VRAI_FAUX") {
      return [
        { texte: "Vrai", estCorrect: false, ordreAffichage: 1 },
        { texte: "Faux", estCorrect: false, ordreAffichage: 2 },
      ];
    }
    const allCorrect = typeQuestion === "ASSOCIATION" || typeQuestion === "CLASSEMENT";
    return [
      { texte: "", estCorrect: allCorrect, ordreAffichage: 1 },
      { texte: "", estCorrect: allCorrect, ordreAffichage: 2 },
    ];
  };

  const resetCurrentQuestion = (typeQuestion = "QCM") => {
    setCurrentQuestion({ intitule: "", typeQuestion, points: 1, choixReponses: getDefaultChoix(typeQuestion), reponse: "" });
  };

  const handleTypeQuestionChange = (value) => {
    setCurrentQuestion(prev => ({ intitule: prev.intitule, typeQuestion: value, points: prev.points, choixReponses: getDefaultChoix(value), reponse: "" }));
  };

  const handleAddChoix = () => {
    const type = currentQuestion.typeQuestion;
    const newChoix = {
      texte: "", estCorrect: type === "ASSOCIATION" || type === "CLASSEMENT",
      ordreAffichage: currentQuestion.choixReponses.length + 1
    };
    setCurrentQuestion({ ...currentQuestion, choixReponses: [...currentQuestion.choixReponses, newChoix] });
  };

  const handleRemoveChoix = (index) => {
    const updated = currentQuestion.choixReponses.filter((_, i) => i !== index).map((c, i) => ({ ...c, ordreAffichage: i + 1 }));
    setCurrentQuestion({ ...currentQuestion, choixReponses: updated });
  };

  const handleChoixChange = (index, field, value) => {
    const updated = [...currentQuestion.choixReponses];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentQuestion({ ...currentQuestion, choixReponses: updated });
  };

  const handleMoveChoixUp = (index) => {
    if (index === 0) return;
    const updated = [...currentQuestion.choixReponses];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setCurrentQuestion({ ...currentQuestion, choixReponses: updated.map((c, i) => ({ ...c, ordreAffichage: i + 1 })) });
  };

  const handleMoveChoixDown = (index) => {
    if (index === currentQuestion.choixReponses.length - 1) return;
    const updated = [...currentQuestion.choixReponses];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setCurrentQuestion({ ...currentQuestion, choixReponses: updated.map((c, i) => ({ ...c, ordreAffichage: i + 1 })) });
  };

  const validateQuestion = () => {
    if (!currentQuestion.intitule.trim()) { message.warning("L'intitulé de la question est requis"); return false; }
    const type = currentQuestion.typeQuestion;
    if (type === "VRAI_FAUX") {
      if (!currentQuestion.choixReponses.some(c => c.estCorrect)) { message.warning("Veuillez sélectionner Vrai ou Faux"); return false; }
    } else if (type === "QCM" || type === "ASSOCIATION" || type === "CLASSEMENT" || type === "TROU") {
      if (currentQuestion.choixReponses.length < 2) { message.warning("Au moins 2 choix sont requis"); return false; }
      if (currentQuestion.choixReponses.some(c => !c.texte.trim())) { message.warning("Tous les choix doivent avoir un texte"); return false; }
      if (type === "QCM" && !currentQuestion.choixReponses.some(c => c.estCorrect)) { message.warning("Au moins un choix doit être correct"); return false; }
    } else if (type === "REPONSE_COURTE" || type === "REPONSE_LONGUE" || type === "DEVELOPPEMENT") {
      if (!currentQuestion.reponse.trim()) { message.warning("La réponse attendue est requise"); return false; }
    }
    return true;
  };

  const buildQuestionPayload = (question) => {
    const type = question.typeQuestion;
    const payload = { intitule: question.intitule, typeQuestion: type, points: question.points || 1 };
    if (type === "QCM" || type === "ASSOCIATION" || type === "CLASSEMENT" || type === "VRAI_FAUX" || type === "TROU") {
      payload.choixReponses = question.choixReponses;
    } else {
      payload.reponse = question.reponse;
    }
    return payload;
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
    message.success("Question ajoutée");
  };

  const handleEditQuestion = (index) => {
    setCurrentQuestion(questions[index]);
    setEditingQuestionIndex(index);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
    if (editingQuestionIndex === index) { resetCurrentQuestion(); setEditingQuestionIndex(null); }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError("");
      const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
      if (!userId) throw new Error("Utilisateur non connecté. Veuillez vous reconnecter.");

      const exerciseData = { nom: values.nom, description: values.description, niveau: values.niveau, restriction: values.restriction || "PRIVE", redacteurId: userId, etat: "BROUILLON" };
      const createdExercise = await onSubmit(exerciseData);

      if (createdExercise?.id) {
        if (values.matiereIds?.length > 0) {
          for (const matiereId of values.matiereIds) {
            try { await exerciseService.lierExerciseAMatiere(createdExercise.id, matiereId); } catch (err) { console.error(err); }
          }
        }
        for (const question of questions) {
          try { await questionReponseService.createQuestion(createdExercise.id, buildQuestionPayload(question)); } catch (err) { console.error(err); }
        }
      }
      form.resetFields();
      setQuestions([]);
      resetCurrentQuestion();
      onSuccess?.("Exercice créé avec succès");
    } catch (err) {
      const msg = err.message || "Erreur lors de la création de l'exercice";
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => { form.resetFields(); setQuestions([]); resetCurrentQuestion(); setError(""); onCancel(); };

  const renderQuestionInputs = () => {
    const type = currentQuestion.typeQuestion;
    const choix = currentQuestion.choixReponses || [];

    if (type === "VRAI_FAUX") {
      return (
        <div>
          <Text strong className="text-xs sm:text-sm">Sélectionnez la bonne réponse :</Text>
          <div className="flex gap-3 mt-2">
            {choix.map((c, i) => (
              <button key={i} type="button"
                onClick={() => setCurrentQuestion({ ...currentQuestion, choixReponses: choix.map((x, j) => ({ ...x, estCorrect: j === i })) })}
                className={`flex-1 py-3 rounded-lg border-2 font-semibold transition-all ${c.estCorrect ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"}`}
              >
                {c.texte}
              </button>
            ))}
          </div>
          {!choix.some(c => c.estCorrect) && (
            <Text type="secondary" className="text-xs mt-1 block">Cliquez sur Vrai ou Faux pour sélectionner la bonne réponse</Text>
          )}
        </div>
      );
    }

    if (type === "QCM" || type === "ASSOCIATION" || type === "CLASSEMENT" || type === "TROU") {
      return (
        <div>
          <div className="mb-2">
            <Text strong className="text-xs sm:text-sm">
              {type === "QCM" ? "Choix de réponses (cochez la/les bonne(s) réponse(s))" :
               type === "ASSOCIATION" ? "Paires à associer" :
               type === "TROU" ? "Mots/Expressions à compléter" :
               "Éléments à classer (dans l'ordre)"}
            </Text>
            {(type === "CLASSEMENT" || type === "ASSOCIATION" || type === "TROU") && (
              <Text type="secondary" className="text-xs block mt-1">Utilisez les flèches ↑↓ pour réorganiser l'ordre d'affichage</Text>
            )}
          </div>
          {choix.map((c, index) => (
            <div key={index} className="flex gap-2 mb-2 items-center">
              <div className="flex flex-col gap-1">
                <Button type="text" size="small" icon={<ArrowUpOutlined />} onClick={() => handleMoveChoixUp(index)} disabled={index === 0} style={{ padding: "0 4px", height: "20px" }} />
                <Button type="text" size="small" icon={<ArrowDownOutlined />} onClick={() => handleMoveChoixDown(index)} disabled={index === choix.length - 1} style={{ padding: "0 4px", height: "20px" }} />
              </div>
              {(type === "CLASSEMENT" || type === "TROU") && (
                <span className="text-gray-500 font-semibold" style={{ minWidth: "24px" }}>{index + 1}.</span>
              )}
              {type === "QCM" && (
                <input type="checkbox" checked={c.estCorrect} onChange={(e) => handleChoixChange(index, "estCorrect", e.target.checked)} />
              )}
              <Input
                placeholder={type === "ASSOCIATION" ? "Ex: France - Paris" : type === "CLASSEMENT" ? "Élément" : type === "TROU" ? "Mot/Expression" : `Choix ${index + 1}`}
                value={c.texte}
                onChange={(e) => handleChoixChange(index, "texte", e.target.value)}
                style={{ flex: 1 }}
              />
              {choix.length > 2 && (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveChoix(index)} />
              )}
            </div>
          ))}
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddChoix} size="small" className="mt-2">
            Ajouter un choix
          </Button>
        </div>
      );
    }

    if (type === "REPONSE_COURTE" || type === "REPONSE_LONGUE" || type === "DEVELOPPEMENT") {
      return (
        <div>
          <div className="mb-2">
            <Text strong className="text-xs sm:text-sm">Réponse attendue (modèle de correction)</Text>
          </div>
          {type === "REPONSE_COURTE" ? (
            <Input placeholder="Ex: H2O" value={currentQuestion.reponse} onChange={(e) => setCurrentQuestion({ ...currentQuestion, reponse: e.target.value })} />
          ) : (
            <TextArea rows={4} placeholder="Décrivez la réponse attendue..." value={currentQuestion.reponse} onChange={(e) => setCurrentQuestion({ ...currentQuestion, reponse: e.target.value })} />
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
      <Card bordered={false} className="shadow-sm">
        <div className="mb-4 sm:mb-6">
          <Title level={3} className="flex items-center gap-2 mb-2">
            <BookOutlined className="text-blue-500" />
            <span className="text-lg sm:text-2xl">Créer un Nouvel Exercice</span>
          </Title>
          <Text type="secondary" className="text-sm sm:text-base">Remplissez les informations de base pour créer un nouvel exercice</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon closable onClose={() => setError("")} className="mb-4 sm:mb-6" />}

        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large" scrollToFirstError>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title={<span className="text-sm sm:text-base">Informations de Base</span>} size="small" className="h-full">
                <Form.Item name="nom" label="Nom de l'exercice" rules={[{ required: true, message: "Le nom est requis" }, { min: 3, message: "Au moins 3 caractères" }, { max: 200, message: "Max 200 caractères" }]}>
                  <Input placeholder="Ex: Exercice de Mathématiques" prefix={<BookOutlined />} maxLength={200} showCount />
                </Form.Item>
                <Form.Item name="niveau" label="Niveau" rules={[{ required: true, message: "Le niveau est requis" }]}>
                  <Select placeholder="Sélectionnez le niveau" showSearch optionFilterProp="children">
                    {niveauxOptions.map((group) => (
                      <Select.OptGroup key={group.value} label={group.label}>
                        {group.children.map((n) => <Option key={n} value={n}>{n}</Option>)}
                      </Select.OptGroup>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="restriction" label="Visibilité" rules={[{ required: true, message: "La visibilité est requise" }]} initialValue="PRIVE">
                  <Select>
                    {restrictionOptions.map((o) => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item name="matiereIds" label="Matières associées">
                  <Select mode="multiple" placeholder="Sélectionnez les matières" loading={loadingMatieres} allowClear showSearch optionFilterProp="children"
                    notFoundContent={loadingMatieres ? <Spin size="small" /> : "Aucune matière disponible"}>
                    {matieres.map((m) => <Option key={m.id} value={m.id}>{m.nom}{m.description && ` - ${m.description}`}</Option>)}
                  </Select>
                </Form.Item>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<span className="text-sm sm:text-base">Description</span>} size="small" className="h-full">
                <Form.Item name="description" label="Description détaillée" rules={[{ required: true, message: "La description est requise" }, { min: 10, message: "Au moins 10 caractères" }, { max: 1000, message: "Max 1000 caractères" }]}>
                  <TextArea rows={12} placeholder="Décrivez l'exercice en détail..." showCount maxLength={1000} />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Divider className="my-4 sm:my-6" />

          <Card title={<span className="text-sm sm:text-base">Questions ({questions.length})</span>} size="small">
            {questions.length > 0 && (
              <div className="mb-4">
                <Text type="secondary" className="text-xs mb-2 block">Questions ajoutées (cliquez pour modifier):</Text>
                <Space size="small" wrap>
                  {questions.map((q, index) => (
                    <Tag key={index} color={editingQuestionIndex === index ? "blue" : "default"}
                      className="cursor-pointer px-3 py-1 rounded-full"
                      onClick={() => handleEditQuestion(index)} closable
                      onClose={(e) => { e.preventDefault(); handleRemoveQuestion(index); }}
                      closeIcon={<CloseCircleOutlined />}>
                      {q.intitule.substring(0, 40)}{q.intitule.length > 40 ? "..." : ""}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <div className="mb-2"><Text strong className="text-xs sm:text-sm">Intitulé de la question</Text></div>
                <TextArea rows={3} placeholder="Posez votre question ici..." value={currentQuestion.intitule} onChange={(e) => setCurrentQuestion({ ...currentQuestion, intitule: e.target.value })} />
              </Col>
              <Col xs={24} sm={12}>
                <div className="mb-2"><Text strong className="text-xs sm:text-sm">Type de question</Text></div>
                <Select style={{ width: "100%" }} value={currentQuestion.typeQuestion} onChange={handleTypeQuestionChange}>
                  <Option value="QCM">Question à Choix Multiple (QCM)</Option>
                  <Option value="VRAI_FAUX">Vrai ou Faux</Option>
                  <Option value="REPONSE_COURTE">Réponse Courte</Option>
                  <Option value="REPONSE_LONGUE">Réponse Longue</Option>
                  <Option value="ASSOCIATION">Association</Option>
                  <Option value="CLASSEMENT">Classement</Option>
                  <Option value="TROU">Texte à Trous</Option>
                  <Option value="DEVELOPPEMENT">Développement</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12}>
                <div className="mb-2"><Text strong className="text-xs sm:text-sm">Points</Text></div>
                <InputNumber min={0} max={100} step={0.5} style={{ width: "100%" }} value={currentQuestion.points} onChange={(value) => setCurrentQuestion({ ...currentQuestion, points: value })} />
              </Col>
              <Col xs={24}>{renderQuestionInputs()}</Col>
              <Col xs={24}>
                <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddQuestion} block>
                  {editingQuestionIndex !== null ? "Mettre à jour la question" : "Ajouter la question"}
                </Button>
              </Col>
            </Row>
          </Card>

          <Divider className="my-4 sm:my-6" />

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button size="large" onClick={handleCancel} disabled={loading} icon={<CloseOutlined />} block className="sm:w-auto">Annuler</Button>
            <Button type="primary" size="large" htmlType="submit" loading={loading} icon={<SaveOutlined />} block className="sm:w-auto">Créer l'Exercice</Button>
          </div>
        </Form>
      </Card>

      <Card className="mt-4 sm:mt-6" size="small">
        <Title level={5} className="text-sm sm:text-base mb-3">Conseils pour créer un bon exercice</Title>
        <div className="space-y-2 text-xs sm:text-sm text-gray-600">
          <p>• Choisissez un nom clair et descriptif</p>
          <p>• Sélectionnez le niveau approprié pour vos étudiants</p>
          <p>• Rédigez une description complète avec les objectifs pédagogiques</p>
          <p>• Associez les matières pertinentes pour faciliter la recherche</p>
          <p>• Utilisez la visibilité "Privé" pour limiter l'accès à vos classes</p>
          <p>• Ajoutez des questions directement lors de la création de l'exercice</p>
        </div>
      </Card>
    </div>
  );
};

export default CreateExerciseForm;
