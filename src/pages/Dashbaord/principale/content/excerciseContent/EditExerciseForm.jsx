import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Alert,
  Divider,
  Typography,
  Row,
  Col,
  message,
  Spin,
  Tag,
  Space,
  InputNumber,
} from "antd";
import { SaveOutlined, CloseOutlined, BookOutlined, PlusOutlined, CloseCircleOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { matiereService } from "../../../../../services/MatiereService";
import { questionReponseService, exerciseService } from "../../../../../services/exerciseService";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const EditExerciseForm = ({ exerciseId, onSubmit, onCancel, onError, onSuccess, onBackToDetails }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [matieres, setMatieres] = useState([]);
  const [loadingMatieres, setLoadingMatieres] = useState(false);
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({ 
    intitule: "", 
    typeQuestion: "QCM", 
    points: 1,
    choixReponses: [{ texte: "", estCorrect: false, ordreAffichage: 1 }],
    reponse: ""
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  const niveauxOptions = [
    {
      value: "PRIMAIRE",
      label: "Primaire",
      children: ["CP", "CE1", "CE2", "CM1", "CM2"],
    },
    {
      value: "COLLEGE",
      label: "Collège",
      children: ["6ème", "5ème", "4ème", "3ème"],
    },
    { value: "LYCEE", label: "Lycée", children: ["2nde", "1ère", "Terminale"] },
    {
      value: "UNIVERSITE",
      label: "Université",
      children: ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2"],
    },
  ];

  const restrictionOptions = [
    { value: "PUBLIC", label: "Public - Tous les utilisateurs" },
    { value: "PRIVE", label: "Privé - Seulement mes classes" },
  ];

  useEffect(() => {
    fetchMatieres();
    if (exerciseId) {
      loadExerciseData();
    }
  }, [exerciseId]);

  const fetchMatieres = async () => {
    try {
      setLoadingMatieres(true);
      const data = await matiereService.getAllMatieres();
      setMatieres(data || []);
    } catch (error) {
      console.error("Error loading matieres:", error);
      message.warning("Impossible de charger les matières");
      setMatieres([]);
    } finally {
      setLoadingMatieres(false);
    }
  };

  const loadExerciseData = async () => {
    try {
      setLoading(true);
      const exerciseData = await exerciseService.getExerciseById(exerciseId);
      const questionsData = await questionReponseService.getQuestionsByExercise(exerciseId);
      
      form.setFieldsValue({
        nom: exerciseData.nom || "",
        description: exerciseData.description || "",
        niveau: exerciseData.niveau || "",
        restriction: exerciseData.restriction || "PRIVE",
      });
      
      // Sort questions by ordreAffichage if they have choixReponses
      const sortedQuestions = (questionsData || []).map(q => {
        if (q.choixReponses && q.choixReponses.length > 0) {
          return {
            ...q,
            choixReponses: [...q.choixReponses].sort((a, b) => a.ordreAffichage - b.ordreAffichage)
          };
        }
        return q;
      });
      
      setQuestions(sortedQuestions);
    } catch (error) {
      console.error("Error loading exercise data:", error);
      setError("Erreur lors du chargement de l'exercice");
      onError?.("Erreur lors du chargement de l'exercice");
    } finally {
      setLoading(false);
    }
  };

  const resetCurrentQuestion = (typeQuestion = "QCM") => {
    const isAssociationOrClassement = typeQuestion === "ASSOCIATION" || typeQuestion === "CLASSEMENT";
    setCurrentQuestion({
      intitule: "",
      typeQuestion,
      points: 1,
      choixReponses: [{ texte: "", estCorrect: isAssociationOrClassement, ordreAffichage: 1 }],
      reponse: ""
    });
  };

  const handleTypeQuestionChange = (value) => {
    const isAssociationOrClassement = value === "ASSOCIATION" || value === "CLASSEMENT";
    setCurrentQuestion(prev => ({
      intitule: prev.intitule,
      typeQuestion: value,
      points: prev.points,
      choixReponses: [{ texte: "", estCorrect: isAssociationOrClassement, ordreAffichage: 1 }],
      reponse: ""
    }));
  };

  const handleAddChoix = () => {
    const type = currentQuestion.typeQuestion;
    const newChoix = {
      texte: "",
      estCorrect: type === "ASSOCIATION" || type === "CLASSEMENT" ? true : false,
      ordreAffichage: currentQuestion.choixReponses.length + 1
    };
    setCurrentQuestion({
      ...currentQuestion,
      choixReponses: [...currentQuestion.choixReponses, newChoix]
    });
  };

  const handleRemoveChoix = (index) => {
    const updatedChoix = currentQuestion.choixReponses.filter((_, i) => i !== index);
    // Recalculate ordreAffichage to maintain sequential order
    const reorderedChoix = updatedChoix.map((c, i) => ({ ...c, ordreAffichage: i + 1 }));
    setCurrentQuestion({
      ...currentQuestion,
      choixReponses: reorderedChoix
    });
  };

  const handleChoixChange = (index, field, value) => {
    const updatedChoix = [...currentQuestion.choixReponses];
    updatedChoix[index] = { ...updatedChoix[index], [field]: value };
    setCurrentQuestion({ ...currentQuestion, choixReponses: updatedChoix });
  };

  const handleMoveChoixUp = (index) => {
    if (index === 0) return;
    const updatedChoix = [...currentQuestion.choixReponses];
    [updatedChoix[index - 1], updatedChoix[index]] = [updatedChoix[index], updatedChoix[index - 1]];
    // Update ordreAffichage
    const reorderedChoix = updatedChoix.map((c, i) => ({ ...c, ordreAffichage: i + 1 }));
    setCurrentQuestion({ ...currentQuestion, choixReponses: reorderedChoix });
  };

  const handleMoveChoixDown = (index) => {
    if (index === currentQuestion.choixReponses.length - 1) return;
    const updatedChoix = [...currentQuestion.choixReponses];
    [updatedChoix[index], updatedChoix[index + 1]] = [updatedChoix[index + 1], updatedChoix[index]];
    // Update ordreAffichage
    const reorderedChoix = updatedChoix.map((c, i) => ({ ...c, ordreAffichage: i + 1 }));
    setCurrentQuestion({ ...currentQuestion, choixReponses: reorderedChoix });
  };

  const validateQuestion = () => {
    if (!currentQuestion.intitule.trim()) {
      message.warning("L'intitulé de la question est requis");
      return false;
    }

    const type = currentQuestion.typeQuestion;
    
    if (type === "QCM" || type === "ASSOCIATION" || type === "CLASSEMENT" || type === "VRAI_FAUX" || type === "TROU") {
      if (currentQuestion.choixReponses.length < 2) {
        message.warning("Au moins 2 choix sont requis");
        return false;
      }
      if (currentQuestion.choixReponses.some(c => !c.texte.trim())) {
        message.warning("Tous les choix doivent avoir un texte");
        return false;
      }
      if (type === "QCM" && !currentQuestion.choixReponses.some(c => c.estCorrect)) {
        message.warning("Au moins un choix doit être marqué comme correct");
        return false;
      }
    } else if (type === "REPONSE_COURTE" || type === "REPONSE_LONGUE" || type === "DEVELOPPEMENT") {
      if (!currentQuestion.reponse.trim()) {
        message.warning("La réponse attendue est requise");
        return false;
      }
    }

    return true;
  };

  const buildQuestionPayload = (question) => {
    const type = question.typeQuestion;
    const payload = {
      intitule: question.intitule,
      typeQuestion: type,
      points: question.points || 1
    };

    if (type === "QCM" || type === "ASSOCIATION" || type === "CLASSEMENT" || type === "VRAI_FAUX" || type === "TROU") {
      payload.choixReponses = question.choixReponses;
    } else if (type === "REPONSE_COURTE" || type === "REPONSE_LONGUE" || type === "DEVELOPPEMENT") {
      payload.reponse = question.reponse;
    }

    return payload;
  };

  const handleAddQuestion = () => {
    if (!validateQuestion()) return;

    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = { ...currentQuestion };
      setQuestions(updatedQuestions);
      setEditingQuestionIndex(null);
    } else {
      setQuestions([...questions, { ...currentQuestion }]);
    }
    
    resetCurrentQuestion(currentQuestion.typeQuestion);
    message.success("Question ajoutée");
  };

  const handleEditQuestion = (index) => {
    const question = questions[index];
    const type = question.typeQuestion;
    const isAssociationOrClassement = type === "ASSOCIATION" || type === "CLASSEMENT";
    
    setCurrentQuestion({
      ...question,
      choixReponses: question.choixReponses || [{ texte: "", estCorrect: isAssociationOrClassement, ordreAffichage: 1 }],
      reponse: question.reponse || ""
    });
    setEditingQuestionIndex(index);
  };

  const handleRemoveQuestion = (index) => {
    const question = questions[index];
    if (question.id) {
      // If question has an ID, delete it from backend
      questionReponseService.deleteQuestion(question.id)
        .then(() => {
          message.success("Question supprimée");
          setQuestions(questions.filter((_, i) => i !== index));
        })
        .catch(error => {
          console.error("Error deleting question:", error);
          message.error("Erreur lors de la suppression de la question");
        });
    } else {
      // If no ID, just remove from local state
      setQuestions(questions.filter((_, i) => i !== index));
    }
    
    if (editingQuestionIndex === index) {
      resetCurrentQuestion();
      setEditingQuestionIndex(null);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      setError("");

      const exerciseData = {
        nom: values.nom,
        description: values.description,
        niveau: values.niveau,
        restriction: values.restriction || "PRIVE",
      };

      await onSubmit(exerciseId, exerciseData);
      
      // Update questions
      const existingQuestions = questions.filter(q => q.id);
      const newQuestions = questions.filter(q => !q.id);
      
      // Update existing questions
      for (const question of existingQuestions) {
        try {
          const payload = buildQuestionPayload(question);
          await questionReponseService.updateQuestion(question.id, payload);
        } catch (err) {
          console.error("Error updating question:", err);
        }
      }
      
      // Create new questions
      for (const question of newQuestions) {
        try {
          const payload = buildQuestionPayload(question);
          await questionReponseService.createQuestion(exerciseId, payload);
        } catch (err) {
          console.error("Error creating question:", err);
        }
      }
      
      message.success("Exercice mis à jour avec succès");
      onSuccess?.("Exercice mis à jour avec succès");
      // Navigate back to details view after successful save
      if (onBackToDetails) {
        onBackToDetails(exerciseId);
      } else {
        onCancel();
      }
    } catch (error) {
      console.error("Error updating exercise:", error);
      const errorMessage = error.message || "Erreur lors de la mise à jour de l'exercice";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setQuestions([]);
    resetCurrentQuestion();
    setError("");
    onCancel();
  };

  const renderQuestionInputs = () => {
    const type = currentQuestion.typeQuestion;

    if (type === "QCM" || type === "ASSOCIATION" || type === "CLASSEMENT" || type === "VRAI_FAUX" || type === "TROU") {
      const choixReponses = currentQuestion.choixReponses || [];
      return (
        <div>
          <div className="mb-2">
            <Text strong className="text-xs sm:text-sm">
              {type === "QCM" ? "Choix de réponses (cochez la/les bonne(s) réponse(s))" : 
               type === "VRAI_FAUX" ? "Choix de réponses" :
               type === "ASSOCIATION" ? "Paires à associer" : 
               type === "TROU" ? "Mots/Expressions à compléter" :
               "Éléments à classer (dans l'ordre)"}
            </Text>
            {(type === "CLASSEMENT" || type === "ASSOCIATION" || type === "TROU") && (
              <Text type="secondary" className="text-xs block mt-1">
                Utilisez les flèches ↑↓ pour réorganiser l'ordre d'affichage
              </Text>
            )}
          </div>
          {choixReponses.map((choix, index) => (
            <div key={index} className="flex gap-2 mb-2 items-center">
              {/* Show order controls for all types except VRAI_FAUX */}
              {type !== "VRAI_FAUX" && (
                <div className="flex flex-col gap-1">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowUpOutlined />}
                    onClick={() => handleMoveChoixUp(index)}
                    disabled={index === 0}
                    style={{ padding: '0 4px', height: '20px' }}
                    title="Déplacer vers le haut"
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowDownOutlined />}
                    onClick={() => handleMoveChoixDown(index)}
                    disabled={index === choixReponses.length - 1}
                    style={{ padding: '0 4px', height: '20px' }}
                    title="Déplacer vers le bas"
                  />
                </div>
              )}
              {/* Show order number for CLASSEMENT and TROU */}
              {(type === "CLASSEMENT" || type === "TROU") && (
                <span className="text-gray-500 font-semibold" style={{ minWidth: '24px' }}>
                  {index + 1}.
                </span>
              )}
              {type === "QCM" && (
                <input
                  type="checkbox"
                  checked={choix.estCorrect}
                  onChange={(e) => handleChoixChange(index, "estCorrect", e.target.checked)}
                />
              )}
              <Input
                placeholder={`${type === "ASSOCIATION" ? "Ex: France - Paris" : type === "CLASSEMENT" ? "Élément" : type === "VRAI_FAUX" && index === 0 ? "Vrai" : type === "VRAI_FAUX" && index === 1 ? "Faux" : type === "TROU" ? "Mot/Expression" : ""}Choix ${index + 1}`}
                value={choix.texte}
                onChange={(e) => handleChoixChange(index, "texte", e.target.value)}
                style={{ flex: 1 }}
              />
              {choixReponses.length > 2 && type !== "VRAI_FAUX" && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveChoix(index)}
                  title="Supprimer ce choix"
                />
              )}
            </div>
          ))}
          {type !== "VRAI_FAUX" && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddChoix}
              size="small"
              className="mt-2"
            >
              Ajouter un choix
            </Button>
          )}
        </div>
      );
    }

    if (type === "REPONSE_COURTE" || type === "REPONSE_LONGUE" || type === "DEVELOPPEMENT") {
      return (
        <div>
          <div className="mb-2">
            <Text strong className="text-xs sm:text-sm">
              Réponse attendue (modèle de correction)
            </Text>
          </div>
          {type === "REPONSE_COURTE" ? (
            <Input
              placeholder="Ex: H2O"
              value={currentQuestion.reponse}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, reponse: e.target.value })}
            />
          ) : (
            <TextArea
              rows={4}
              placeholder="Décrivez la réponse attendue..."
              value={currentQuestion.reponse}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, reponse: e.target.value })}
            />
          )}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-96 p-4">
        <Spin size="large" />
        <Text className="mt-3 text-sm sm:text-base">
          Chargement de l'exercice...
        </Text>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
      <Card bordered={false} className="shadow-sm">
        <div className="mb-4 sm:mb-6">
          <Title level={3} className="flex items-center gap-2 mb-2">
            <BookOutlined className="text-blue-500" />
            <span className="text-lg sm:text-2xl">
              Modifier l'Exercice
            </span>
          </Title>
          <Text type="secondary" className="text-sm sm:text-base">
            Modifiez les informations de l'exercice et ses questions
          </Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError("")}
            className="mb-4 sm:mb-6"
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
          scrollToFirstError
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <span className="text-sm sm:text-base">
                    Informations de Base
                  </span>
                }
                size="small"
                className="h-full"
              >
                <Form.Item
                  name="nom"
                  label="Nom de l'exercice"
                  rules={[
                    { required: true, message: "Le nom est requis" },
                    {
                      min: 3,
                      message: "Le nom doit contenir au moins 3 caractères",
                    },
                    {
                      max: 200,
                      message: "Le nom ne peut pas dépasser 200 caractères",
                    },
                  ]}
                >
                  <Input
                    placeholder="Ex: Exercice de Mathématiques - Algèbre"
                    prefix={<BookOutlined />}
                    maxLength={200}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  name="niveau"
                  label="Niveau"
                  rules={[{ required: true, message: "Le niveau est requis" }]}
                >
                  <Select
                    placeholder="Sélectionnez le niveau"
                    showSearch
                    optionFilterProp="children"
                  >
                    {niveauxOptions.map((group) => (
                      <Select.OptGroup key={group.value} label={group.label}>
                        {group.children.map((niveau) => (
                          <Option key={niveau} value={niveau}>
                            {niveau}
                          </Option>
                        ))}
                      </Select.OptGroup>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="restriction"
                  label="Visibilité"
                  rules={[
                    { required: true, message: "La visibilité est requise" },
                  ]}
                >
                  <Select>
                    {restrictionOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={
                  <span className="text-sm sm:text-base">Description</span>
                }
                size="small"
                className="h-full"
              >
                <Form.Item
                  name="description"
                  label="Description détaillée"
                  rules={[
                    { required: true, message: "La description est requise" },
                    {
                      min: 10,
                      message:
                        "La description doit contenir au moins 10 caractères",
                    },
                    {
                      max: 1000,
                      message:
                        "La description ne peut pas dépasser 1000 caractères",
                    },
                  ]}
                >
                  <TextArea
                    rows={12}
                    placeholder="Décrivez l'exercice en détail..."
                    showCount
                    maxLength={1000}
                  />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Divider className="my-4 sm:my-6" />

          <Card
            title={
              <span className="text-sm sm:text-base">
                Questions ({questions.length})
              </span>
            }
            size="small"
          >
            {questions.length > 0 && (
              <div className="mb-4">
                <Text type="secondary" className="text-xs mb-2 block">
                  Questions (cliquez pour modifier):
                </Text>
                <Space size="small" wrap>
                  {questions.map((q, index) => (
                    <Tag
                      key={index}
                      color={editingQuestionIndex === index ? "blue" : "default"}
                      className="cursor-pointer px-3 py-1 rounded-full"
                      onClick={() => handleEditQuestion(index)}
                      closable
                      onClose={(e) => {
                        e.preventDefault();
                        handleRemoveQuestion(index);
                      }}
                      closeIcon={<CloseCircleOutlined />}
                    >
                      {q.intitule.substring(0, 40)}{q.intitule.length > 40 ? "..." : ""}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <div className="mb-2">
                  <Text strong className="text-xs sm:text-sm">
                    Intitulé de la question
                  </Text>
                </div>
                <TextArea
                  rows={3}
                  placeholder="Posez votre question ici..."
                  value={currentQuestion.intitule}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, intitule: e.target.value })}
                />
              </Col>
              <Col xs={24} sm={12}>
                <div className="mb-2">
                  <Text strong className="text-xs sm:text-sm">
                    Type de question
                  </Text>
                </div>
                <Select
                  style={{ width: "100%" }}
                  value={currentQuestion.typeQuestion}
                  onChange={handleTypeQuestionChange}
                >
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
                <div className="mb-2">
                  <Text strong className="text-xs sm:text-sm">
                    Points
                  </Text>
                </div>
                <InputNumber
                  min={0}
                  max={100}
                  step={0.5}
                  style={{ width: "100%" }}
                  value={currentQuestion.points}
                  onChange={(value) => setCurrentQuestion({ ...currentQuestion, points: value })}
                />
              </Col>
              <Col xs={24}>
                {renderQuestionInputs()}
              </Col>
              <Col xs={24}>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddQuestion}
                  block
                >
                  {editingQuestionIndex !== null ? "Mettre à jour la question" : "Ajouter la question"}
                </Button>
              </Col>
            </Row>
          </Card>

          <Divider className="my-4 sm:my-6" />

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button
              size="large"
              onClick={handleCancel}
              disabled={saving}
              icon={<CloseOutlined />}
              block
              className="sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={saving}
              icon={<SaveOutlined />}
              block
              className="sm:w-auto"
            >
              Enregistrer les Modifications
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default EditExerciseForm;
