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
  Radio,
} from "antd";
import { SaveOutlined, CloseOutlined, BookOutlined, PlusOutlined, CloseCircleOutlined, DeleteOutlined } from "@ant-design/icons";
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
    intitule: "", 
    typeQuestion: "QCM", 
    points: 1,
    choixReponses: [{ texte: "", estCorrect: false, ordreAffichage: 1 }],
    reponseAttendueVraiFaux: false,
    reponseAttendueCourte: "",
    reponseAttendueLongue: ""
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
  }, []);

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

  const resetCurrentQuestion = (typeQuestion = "QCM") => {
    const isAssociationOrClassement = typeQuestion === "ASSOCIATION" || typeQuestion === "CLASSEMENT";
    setCurrentQuestion({
      intitule: "",
      typeQuestion,
      points: 1,
      choixReponses: [{ texte: "", estCorrect: isAssociationOrClassement, ordreAffichage: 1 }],
      reponseAttendueVraiFaux: false,
      reponseAttendueCourte: "",
      reponseAttendueLongue: ""
    });
  };

  const handleTypeQuestionChange = (value) => {
    resetCurrentQuestion(value);
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
    setCurrentQuestion({
      ...currentQuestion,
      choixReponses: updatedChoix.map((c, i) => ({ ...c, ordreAffichage: i + 1 }))
    });
  };

  const handleChoixChange = (index, field, value) => {
    const updatedChoix = [...currentQuestion.choixReponses];
    updatedChoix[index] = { ...updatedChoix[index], [field]: value };
    setCurrentQuestion({ ...currentQuestion, choixReponses: updatedChoix });
  };

  const validateQuestion = () => {
    if (!currentQuestion.intitule.trim()) {
      message.warning("L'intitulé de la question est requis");
      return false;
    }

    const type = currentQuestion.typeQuestion;
    
    if (type === "QCM" || type === "ASSOCIATION" || type === "CLASSEMENT") {
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
    } else if (type === "REPONSE_COURTE" || type === "TROU") {
      if (!currentQuestion.reponseAttendueCourte.trim()) {
        message.warning("La réponse attendue est requise");
        return false;
      }
    } else if (type === "REPONSE_LONGUE" || type === "DEVELOPPEMENT") {
      if (!currentQuestion.reponseAttendueLongue.trim()) {
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

    if (type === "QCM" || type === "ASSOCIATION" || type === "CLASSEMENT") {
      payload.choixReponses = question.choixReponses;
    } else if (type === "VRAI_FAUX") {
      payload.reponseAttendueVraiFaux = question.reponseAttendueVraiFaux;
    } else if (type === "REPONSE_COURTE") {
      payload.reponseAttendueCourte = question.reponseAttendueCourte;
    } else if (type === "REPONSE_LONGUE") {
      payload.reponseAttendueLongue = question.reponseAttendueLongue;
    } else if (type === "TROU" || type === "DEVELOPPEMENT") {
      payload.reponseAttendueLongue = question.reponseAttendueLongue;
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
    setCurrentQuestion(questions[index]);
    setEditingQuestionIndex(index);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
    if (editingQuestionIndex === index) {
      resetCurrentQuestion();
      setEditingQuestionIndex(null);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError("");

      const userId =
        sessionStorage.getItem("userId") ||
        localStorage.getItem("userId") ||
        sessionStorage.getItem("user_id") ||
        localStorage.getItem("user_id");

      if (!userId) {
        throw new Error("Utilisateur non connecté. Veuillez vous reconnecter.");
      }

      const exerciseData = {
        nom: values.nom,
        description: values.description,
        niveau: values.niveau,
        restriction: values.restriction || "PRIVE",
        redacteurId: userId,
        etat: "BROUILLON",
      };

      const createdExercise = await onSubmit(exerciseData);
      
      if (createdExercise?.id) {
        // Associate matieres
        if (values.matiereIds && values.matiereIds.length > 0) {
          for (const matiereId of values.matiereIds) {
            try {
              await exerciseService.lierExerciseAMatiere(createdExercise.id, matiereId);
            } catch (err) {
              console.error("Error associating matiere:", err);
            }
          }
        }

        // Create questions
        if (questions.length > 0) {
          for (const question of questions) {
            try {
              const payload = buildQuestionPayload(question);
              await questionReponseService.createQuestion(createdExercise.id, payload);
            } catch (err) {
              console.error("Error creating question:", err);
            }
          }
          message.success(`Exercice créé avec ${questions.length} question(s)`);
        }
      }
      
      form.resetFields();
      setQuestions([]);
      resetCurrentQuestion();
      onSuccess?.("Exercice créé avec succès");
    } catch (error) {
      console.error("Error creating exercise:", error);
      const errorMessage =
        error.message || "Erreur lors de la création de l'exercice";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
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

    if (type === "QCM" || type === "ASSOCIATION" || type === "CLASSEMENT") {
      return (
        <div>
          <div className="mb-2">
            <Text strong className="text-xs sm:text-sm">
              {type === "QCM" ? "Choix de réponses (cochez la/les bonne(s) réponse(s))" : 
               type === "ASSOCIATION" ? "Paires à associer" : 
               "Éléments à classer (dans l'ordre)"}
            </Text>
          </div>
          {currentQuestion.choixReponses.map((choix, index) => (
            <div key={index} className="flex gap-2 mb-2 items-center">
              {type === "QCM" && (
                <input
                  type="checkbox"
                  checked={choix.estCorrect}
                  onChange={(e) => handleChoixChange(index, "estCorrect", e.target.checked)}
                />
              )}
              <Input
                placeholder={`${type === "ASSOCIATION" ? "Ex: France - Paris" : type === "CLASSEMENT" ? `${index + 1}. ` : ""}Choix ${index + 1}`}
                value={choix.texte}
                onChange={(e) => handleChoixChange(index, "texte", e.target.value)}
                style={{ flex: 1 }}
              />
              {currentQuestion.choixReponses.length > 2 && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveChoix(index)}
                />
              )}
            </div>
          ))}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddChoix}
            size="small"
            className="mt-2"
          >
            Ajouter un choix
          </Button>
        </div>
      );
    }

    if (type === "VRAI_FAUX") {
      return (
        <div>
          <div className="mb-2">
            <Text strong className="text-xs sm:text-sm">Réponse correcte</Text>
          </div>
          <Radio.Group
            value={currentQuestion.reponseAttendueVraiFaux}
            onChange={(e) => setCurrentQuestion({ ...currentQuestion, reponseAttendueVraiFaux: e.target.value })}
          >
            <Radio value={true}>Vrai</Radio>
            <Radio value={false}>Faux</Radio>
          </Radio.Group>
        </div>
      );
    }

    if (type === "REPONSE_COURTE" || type === "TROU") {
      return (
        <div>
          <div className="mb-2">
            <Text strong className="text-xs sm:text-sm">
              {type === "TROU" ? "Mot/Expression manquant(e)" : "Réponse attendue"}
            </Text>
          </div>
          <Input
            placeholder={type === "TROU" ? "Ex: Soleil" : "Ex: H2O"}
            value={currentQuestion.reponseAttendueCourte}
            onChange={(e) => setCurrentQuestion({ ...currentQuestion, reponseAttendueCourte: e.target.value })}
          />
        </div>
      );
    }

    if (type === "REPONSE_LONGUE" || type === "DEVELOPPEMENT") {
      return (
        <div>
          <div className="mb-2">
            <Text strong className="text-xs sm:text-sm">
              Réponse attendue (modèle de correction)
            </Text>
          </div>
          <TextArea
            rows={4}
            placeholder="Décrivez la réponse attendue..."
            value={currentQuestion.reponseAttendueLongue}
            onChange={(e) => setCurrentQuestion({ ...currentQuestion, reponseAttendueLongue: e.target.value })}
          />
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
            <span className="text-lg sm:text-2xl">
              Créer un Nouvel Exercice
            </span>
          </Title>
          <Text type="secondary" className="text-sm sm:text-base">
            Remplissez les informations de base pour créer un nouvel exercice
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
                  initialValue="PRIVE"
                >
                  <Select>
                    {restrictionOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="matiereIds"
                  label="Matières associées"
                  tooltip="Sélectionnez une ou plusieurs matières pour cet exercice"
                >
                  <Select
                    mode="multiple"
                    placeholder="Sélectionnez les matières"
                    loading={loadingMatieres}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    notFoundContent={
                      loadingMatieres ? (
                        <Spin size="small" />
                      ) : (
                        "Aucune matière disponible"
                      )
                    }
                  >
                    {matieres.map((matiere) => (
                      <Option key={matiere.id} value={matiere.id}>
                        {matiere.nom}{" "}
                        {matiere.description && `- ${matiere.description}`}
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
                  Questions ajoutées (cliquez pour modifier):
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
              disabled={loading}
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
              loading={loading}
              icon={<SaveOutlined />}
              block
              className="sm:w-auto"
            >
              Créer l'Exercice
            </Button>
          </div>
        </Form>
      </Card>

      <Card className="mt-4 sm:mt-6" size="small">
        <Title level={5} className="text-sm sm:text-base mb-3">
          Conseils pour créer un bon exercice
        </Title>
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
