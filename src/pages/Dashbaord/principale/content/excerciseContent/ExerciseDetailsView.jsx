import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Descriptions,
  Tag,
  Space,
  Spin,
  Alert,
  Form,
  Input,
  Modal,
  Typography,
  Divider,
  Row,
  Col,
  Tabs,
  Table,
  Empty,
  Popconfirm,
  Tooltip,
  message,
  Select,
  DatePicker,
  List,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  BookOutlined,
  UserOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  exerciseService,
  questionReponseService,
  exerciseProgrammerService,
} from "../../../../../services/exerciseService";
import { classService } from "../../../../../services/ClassService";
import ProfessorGradingTab from "./ProfessorGradingTab";

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;
const { TextArea } = Input;

const ExerciseDetailsView = ({
  exerciseId,
  onBack,
  onRefresh,
  onError,
  onSuccess,
  onUpdate,
  onDelete,
  onEdit,
  onTakeExercise,
}) => {
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [form] = Form.useForm();

  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [viewingQuestion, setViewingQuestion] = useState(null);

  const [showProgramForm, setShowProgramForm] = useState(false);
  const [programForm] = Form.useForm();
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [programmations, setProgrammations] = useState([]);
  const [programmationsLoading, setProgrammationsLoading] = useState(false);

  useEffect(() => {
    if (exerciseId) {
      fetchExerciseDetails();
      fetchExerciseQuestions();
      fetchUserAccessibleClasses();
      fetchExerciseProgrammations();
    }
  }, [exerciseId]);

  const fetchExerciseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await exerciseService.getExerciseById(exerciseId);
      console.log("Exercise details loaded:", data);
      setExercise(data);
      form.setFieldsValue({
        nom: data.nom || "",
        description: data.description || "",
        niveau: data.niveau || "",
        restriction: data.restriction || "PRIVE",
        etat: data.etat || "BROUILLON",
      });
    } catch (error) {
      console.error("Error fetching exercise details:", error);
      setError("Erreur lors du chargement des détails de l'exercice");
      onError?.("Erreur lors du chargement des détails de l'exercice");
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseQuestions = async () => {
    try {
      setQuestionsLoading(true);
      const data = await questionReponseService.getQuestionsByExercise(
        exerciseId
      );
      console.log("Questions loaded:", data);
      setQuestions(data || []);
    } catch (error) {
      console.error("Error fetching exercise questions:", error);
      message.error("Erreur lors du chargement des questions");
    } finally {
      setQuestionsLoading(false);
    }
  };

  const fetchUserAccessibleClasses = async () => {
    try {
      setClassesLoading(true);
      const userId =
        sessionStorage.getItem("userId") || localStorage.getItem("userId");

      if (!userId) {
        console.warn("No user ID found");
        message.warning(
          "Impossible de charger les classes: utilisateur non connecté"
        );
        return;
      }

      console.log("Fetching accessible classes for user:", userId);

      // Use the ClassService method to get classes the user has access to
      const data = await classService.obtenirClassesUtilisateur(userId);
      console.log("User accessible classes loaded:", data);
      setClasses(data || []);
    } catch (error) {
      console.error("Error fetching user accessible classes:", error);
      message.warning("Impossible de charger les classes accessibles");
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchExerciseProgrammations = async () => {
    try {
      setProgrammationsLoading(true);
      console.log("Fetching programmations for exercise:", exerciseId);

      const programmations =
        await exerciseProgrammerService.getExercisesProgrammesParExercise(
          exerciseId
        );
      console.log("Programmations for exercise:", programmations);

      setProgrammations(programmations || []);
    } catch (error) {
      console.error("Error fetching exercise programmations:", error);
      message.warning("Impossible de charger les programmations");
      setProgrammations([]);
    } finally {
      setProgrammationsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchExerciseDetails(),
      fetchExerciseQuestions(),
      fetchUserAccessibleClasses(),
      fetchExerciseProgrammations(),
    ]);
    setRefreshing(false);
    setSuccessMessage("Données actualisées avec succès");
    onSuccess?.("Données actualisées avec succès");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEdit = () => {
    setEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setError(null);
    form.setFieldsValue({
      nom: exercise.nom || "",
      description: exercise.description || "",
      niveau: exercise.niveau || "",
      restriction: exercise.restriction || "PRIVE",
      etat: exercise.etat || "BROUILLON",
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setActionLoading("save");
      setError(null);
      const values = await form.validateFields();
      await onUpdate(exerciseId, values);
      setExercise({ ...exercise, ...values });
      setEditing(false);
      setSuccessMessage("Exercice mis à jour avec succès");
      onSuccess?.("Exercice mis à jour avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error saving exercise:", error);
      setError("Erreur lors de la sauvegarde");
      onError?.("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
      setActionLoading(null);
    }
  };

  const handleDelete = () => {
    confirm({
      title: "Supprimer l'exercice",
      icon: <ExclamationCircleOutlined />,
      content: `Êtes-vous sûr de vouloir supprimer l'exercice "${exercise?.nom}" ? Cette action est irréversible.`,
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          setActionLoading("delete");
          await onDelete(exerciseId);
          message.success("Exercice supprimé avec succès");
          onBack();
        } catch (error) {
          console.error("Error deleting exercise:", error);
          setError("Erreur lors de la suppression");
          onError?.("Erreur lors de la suppression");
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleDeleteQuestion = async (questionId) => {
    confirm({
      title: "Supprimer la question",
      content: "Êtes-vous sûr de vouloir supprimer cette question ?",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          setActionLoading(`delete-question-${questionId}`);
          await questionReponseService.deleteQuestion(questionId);
          setSuccessMessage("Question supprimée avec succès");
          message.success("Question supprimée avec succès");
          await fetchExerciseQuestions();
        } catch (error) {
          console.error("Error deleting question:", error);
          message.error("Erreur lors de la suppression de la question");
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleEditQuestion = (question) => {
    if (onEdit) onEdit(exerciseId);
  };

  const handleViewQuestion = (question) => {
    setViewingQuestion(question);
  };

  const handleProgramExercise = async (values) => {
    try {
      setActionLoading("program");
      console.log("Starting programming with values:", values);

      const userId =
        sessionStorage.getItem("userId") || localStorage.getItem("userId");
      if (!userId) {
        throw new Error("Utilisateur non connecté");
      }

      if (
        !values.dateExoPrevue ||
        !values.dateDebutExoEffectif ||
        !values.dateFinExoEffectif
      ) {
        message.error("Les trois dates sont obligatoires");
        return;
      }

      const programmingData = {
        exerciseId: exerciseId,
        programmeParId: userId,
        dateExoPrevue: values.dateExoPrevue.toISOString(),
        dateDebutExoEffectif: values.dateDebutExoEffectif.toISOString(),
        dateFinExoEffectif: values.dateFinExoEffectif.toISOString(),
        classeIds: values.classeIds || [],
        etat: values.diffuseImmediately ? "ACTIF" : "BROUILLON",
      };

      console.log(
        "Programming data being sent:",
        JSON.stringify(programmingData, null, 2)
      );

      let response;
      if (values.diffuseImmediately) {
        response = await exerciseProgrammerService.programmerEtDiffuserExercise(
          programmingData
        );
        message.success("Exercice programmé et diffusé avec succès");
      } else {
        response = await exerciseProgrammerService.programmerExercise(
          programmingData
        );
        message.success("Exercice programmé avec succès");
      }

      console.log("Programming response:", response);

      setSuccessMessage(
        values.diffuseImmediately
          ? "Exercice programmé et diffusé avec succès"
          : "Exercice programmé avec succès"
      );
      setShowProgramForm(false);
      programForm.resetFields();

      await fetchExerciseProgrammations();
    } catch (error) {
      console.error("Error programming exercise:", error);
      setError(
        error.message || "Erreur lors de la programmation de l'exercice"
      );
      message.error(
        error.message || "Erreur lors de la programmation de l'exercice"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProgrammation = async (programmationId) => {
    confirm({
      title: "Supprimer la programmation",
      content: "Êtes-vous sûr de vouloir supprimer cette programmation ?",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          setActionLoading(`delete-prog-${programmationId}`);
          await exerciseProgrammerService.supprimerExerciseProgramme(
            programmationId
          );
          message.success("Programmation supprimée avec succès");
          await fetchExerciseProgrammations();
        } catch (error) {
          console.error("Error deleting programmation:", error);
          message.error("Erreur lors de la suppression de la programmation");
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "ACTIF":
        return <Tag color="green">Actif</Tag>;
      case "BROUILLON":
        return <Tag color="orange">Brouillon</Tag>;
      case "INACTIF":
        return <Tag color="red">Inactif</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const getRestrictionTag = (restriction) => {
    switch (restriction) {
      case "PUBLIC":
        return <Tag color="blue">Public</Tag>;
      case "PRIVE":
        return <Tag color="purple">Privé</Tag>;
      default:
        return <Tag color="default">{restriction}</Tag>;
    }
  };

  const questionColumns = [
    {
      title: "Intitulé",
      dataIndex: "intitule",
      key: "intitule",
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text strong className="text-xs sm:text-sm">{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Type",
      dataIndex: "typeQuestion",
      key: "typeQuestion",
      width: 130,
      responsive: ["md"],
      render: (type) => (
        <Tag color="blue" className="text-xs">{type}</Tag>
      ),
    },
    {
      title: "Points",
      dataIndex: "points",
      key: "points",
      width: 70,
      render: (points) => (
        <Tag color="green" className="text-xs">{points || 0} pt{points > 1 ? 's' : ''}</Tag>
      ),
    },
    {
      title: "Réponse / Choix",
      key: "reponseChoix",
      ellipsis: true,
      render: (_, record) => {
        const type = record.typeQuestion;
        if (record.choixReponses && record.choixReponses.length > 0) {
          const sorted = [...record.choixReponses].sort((a, b) => a.ordreAffichage - b.ordreAffichage);
          if (type === "QCM") {
            const correct = sorted.filter(c => c.estCorrect).map(c => c.texte).join(", ");
            return (
              <Tooltip title={`Bonne(s) réponse(s): ${correct}`}>
                <Space size={2} wrap>
                  {sorted.map((c) => (
                    <Tag key={c.id} color={c.estCorrect ? "green" : "default"} className="text-xs">
                      {c.texte}
                    </Tag>
                  ))}
                </Space>
              </Tooltip>
            );
          }
          if (type === "VRAI_FAUX") {
            const correct = sorted.find(c => c.estCorrect);
            return <Tag color="purple" className="text-xs">{correct?.texte || "N/A"}</Tag>;
          }
          if (type === "CLASSEMENT" || type === "ASSOCIATION" || type === "TROU") {
            return (
              <Tooltip title={sorted.map((c, i) => `${i + 1}. ${c.texte}`).join(" | ")}>
                <Text code className="text-xs">
                  {sorted.map(c => c.texte).join(" → ")}
                </Text>
              </Tooltip>
            );
          }
        }
        if (record.reponse) {
          return (
            <Tooltip title={record.reponse}>
              <Text code className="text-xs">{record.reponse}</Text>
            </Tooltip>
          );
        }
        return <Text type="secondary" className="text-xs">—</Text>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewQuestion(record)}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditQuestion(record)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Supprimer la question"
              description="Êtes-vous sûr ?"
              onConfirm={() => handleDeleteQuestion(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                loading={actionLoading === `delete-question-${record.id}`}
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const programmationColumns = [
    {
      title: "Date Prévue",
      dataIndex: "dateExoPrevue",
      key: "dateExoPrevue",
      render: (date) => (
        <Text className="text-xs sm:text-sm">
          {date ? new Date(date).toLocaleString("fr-FR") : "N/A"}
        </Text>
      ),
    },
    {
      title: "Début",
      dataIndex: "dateDebutExoEffectif",
      key: "dateDebutExoEffectif",
      responsive: ["md"],
      render: (date) => (
        <Text className="text-xs sm:text-sm">
          {date ? new Date(date).toLocaleString("fr-FR") : "N/A"}
        </Text>
      ),
    },
    {
      title: "Fin",
      dataIndex: "dateFinExoEffectif",
      key: "dateFinExoEffectif",
      responsive: ["md"],
      render: (date) => (
        <Text className="text-xs sm:text-sm">
          {date ? new Date(date).toLocaleString("fr-FR") : "N/A"}
        </Text>
      ),
    },
    {
      title: "Statut",
      dataIndex: "etat",
      key: "etat",
      width: 120,
      render: (etat) => getStatusTag(etat),
    },
    {
      title: "Classes",
      dataIndex: "classesDiffusees",
      key: "classesDiffusees",
      responsive: ["lg"],
      render: (classes) => (
        <Space size="small" wrap>
          {classes && classes.length > 0 ? (
            classes.map((classe) => (
              <Tag key={classe.id} color="cyan" className="text-xs">
                {classe.nom}
              </Tag>
            ))
          ) : (
            <Text type="secondary" className="text-xs">
              Aucune
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Supprimer"
              description="Êtes-vous sûr ?"
              onConfirm={() => handleDeleteProgrammation(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                loading={actionLoading === `delete-prog-${record.id}`}
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-96 p-4">
        <Spin size="large" />
        <Text className="mt-3 text-sm sm:text-base">
          Chargement des détails de l'exercice...
        </Text>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="p-4 sm:p-6">
        <Alert
          message="Impossible de charger les détails de l'exercice"
          description={error || "Une erreur est survenue lors du chargement"}
          type="error"
          showIcon
          action={
            <Space direction="vertical" className="w-full sm:w-auto">
              <Button size="small" onClick={handleRefresh} block>
                Réessayer
              </Button>
              <Button size="small" type="primary" onClick={onBack} block>
                Retour à la liste
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              type="text"
              size="middle"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold m-0 truncate">
                Gestion de l'exercice
              </h2>
              <p className="text-gray-500 m-0 text-sm sm:text-base truncate">
                {exercise.nom}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={refreshing}
              type="default"
              size="middle"
            >
              <span className="hidden sm:inline">Actualiser</span>
            </Button>

            {editing ? (
              <>
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancelEdit}
                  disabled={saving}
                  size="middle"
                >
                  <span className="hidden sm:inline">Annuler</span>
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                  size="middle"
                >
                  <span className="hidden sm:inline">Sauvegarder</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  type="primary"
                  size="middle"
                >
                  <span className="hidden sm:inline">Modifier</span>
                </Button>
                <Button
                  icon={<CalendarOutlined />}
                  onClick={() => setShowProgramForm(true)}
                  type="dashed"
                  size="middle"
                >
                  <span className="hidden sm:inline">Programmer</span>
                </Button>
                <Popconfirm
                  title="Êtes-vous sûr de vouloir supprimer cet exercice ?"
                  description="Cette action est irréversible."
                  onConfirm={handleDelete}
                  okText="Oui"
                  cancelText="Non"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={actionLoading === "delete"}
                    size="middle"
                  >
                    <span className="hidden sm:inline">Supprimer</span>
                  </Button>
                </Popconfirm>
              </>
            )}
          </div>
        </div>
      </div>

      {successMessage && (
        <Alert
          message={successMessage}
          type="success"
          showIcon
          closable
          className="mb-4"
        />
      )}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      <Card title="Informations de l'exercice" className="mb-4 sm:mb-6">
        {editing ? (
          <Form form={form} layout="vertical">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="nom"
                  label="Nom de l'exercice"
                  rules={[{ required: true, message: "Le nom est requis" }]}
                >
                  <Input prefix={<BookOutlined />} />
                </Form.Item>
                <Form.Item
                  name="niveau"
                  label="Niveau"
                  rules={[{ required: true, message: "Le niveau est requis" }]}
                >
                  <Select>
                    <Option value="6ème">6ème</Option>
                    <Option value="5ème">5ème</Option>
                    <Option value="4ème">4ème</Option>
                    <Option value="3ème">3ème</Option>
                    <Option value="2nde">2nde</Option>
                    <Option value="1ère">1ère</Option>
                    <Option value="Terminale">Terminale</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="restriction"
                  label="Visibilité"
                  rules={[
                    { required: true, message: "La visibilité est requise" },
                  ]}
                >
                  <Select>
                    <Option value="PUBLIC">Public</Option>
                    <Option value="PRIVE">Privé</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="etat" label="Statut">
                  <Select>
                    <Option value="BROUILLON">Brouillon</Option>
                    <Option value="ACTIF">Actif</Option>
                    <Option value="INACTIF">Inactif</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="description"
                  label="Description"
                  rules={[
                    { required: true, message: "La description est requise" },
                  ]}
                >
                  <TextArea rows={4} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Nom">
                  <Text className="text-xs sm:text-sm">
                    {exercise.nom || "N/A"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Niveau">
                  <Space>
                    <UserOutlined style={{ color: "#1890ff" }} />
                    <Text className="text-xs sm:text-sm">
                      {exercise.niveau || "N/A"}
                    </Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Statut">
                  {getStatusTag(exercise.etat)}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col xs={24} md={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Visibilité">
                  {getRestrictionTag(exercise.restriction)}
                </Descriptions.Item>
                <Descriptions.Item label="Date de création">
                  <Text className="text-xs sm:text-sm">
                    {exercise.dateCreation
                      ? new Date(exercise.dateCreation).toLocaleDateString(
                          "fr-FR"
                        )
                      : "N/A"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="ID">
                  <Text code className="text-xs">
                    {exercise.id}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col xs={24}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Description">
                  <Text className="text-xs sm:text-sm">
                    {exercise.description || "Aucune description"}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        )}
      </Card>

      {!editing && (
        <Card>
          <Tabs defaultActiveKey="questions" type="card">
            <Tabs.TabPane
              tab={
                <span className="text-xs sm:text-sm">
                  <QuestionCircleOutlined />
                  <span className="ml-1">Questions ({questions.length})</span>
                </span>
              }
              key="questions"
            >
              <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <Title level={5} className="m-0 text-sm sm:text-base">
                  Questions de l'exercice
                </Title>
                <Alert
                  message="Ajoutez des questions lors de la création de l'exercice"
                  type="info"
                  showIcon
                  className="text-xs"
                />
              </div>

              <Table
                columns={questionColumns}
                dataSource={questions}
                rowKey="id"
                loading={questionsLoading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} sur ${total} questions`,
                  responsive: true,
                }}
                scroll={{ x: 600 }}
                locale={{
                  emptyText: (
                    <Empty
                      description="Aucune question dans cet exercice. Ajoutez des questions lors de la création de l'exercice."
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
              />
            </Tabs.TabPane>

            <Tabs.TabPane
              tab={
                <span className="text-xs sm:text-sm">
                  <CalendarOutlined />
                  <span className="ml-1">
                    Programmations ({programmations.length})
                  </span>
                </span>
              }
              key="programmations"
            >
              <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <Title level={5} className="m-0 text-sm sm:text-base">
                  Programmations de l'exercice
                </Title>
                <Button
                  type="primary"
                  icon={<CalendarOutlined />}
                  onClick={() => setShowProgramForm(true)}
                  size="middle"
                >
                  <span className="hidden sm:inline">Programmer</span>
                  <span className="sm:hidden">+</span>
                </Button>
              </div>

              <Table
                columns={programmationColumns}
                dataSource={programmations}
                rowKey="id"
                loading={programmationsLoading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} sur ${total} programmations`,
                  responsive: true,
                }}
                scroll={{ x: 800 }}
                locale={{
                  emptyText: (
                    <Empty
                      description="Aucune programmation pour cet exercice"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button
                        type="primary"
                        icon={<CalendarOutlined />}
                        onClick={() => setShowProgramForm(true)}
                      >
                        Programmer l'Exercice
                      </Button>
                    </Empty>
                  ),
                }}
              />
            </Tabs.TabPane>

            {/* Grading Tab - Professor only */}
            {!onTakeExercise && programmations.length > 0 && (
              <Tabs.TabPane
                tab={
                  <span className="text-xs sm:text-sm">
                    <EyeOutlined />
                    <span className="ml-1">Résultats élèves</span>
                  </span>
                }
                key="grading"
              >
                <ProfessorGradingTab
                  exerciseId={exerciseId}
                  exerciseProgrammerId={programmations[0]?.id}
                />
              </Tabs.TabPane>
            )}
          </Tabs>

          {/* Take Exercise button - Student only */}
          {onTakeExercise && questions.length > 0 && (
            <div className="mt-4 text-center">
              <Button
                type="primary"
                size="large"
                icon={<BookOutlined />}
                onClick={() => onTakeExercise(exerciseId)}
                style={{ borderRadius: "8px", height: "48px", paddingInline: "32px" }}
              >
                Passer l'exercice
              </Button>
            </div>
          )}
        </Card>
      )}


      <Modal
        title="Programmer l'Exercice"
        open={showProgramForm}
        onCancel={() => {
          setShowProgramForm(false);
          programForm.resetFields();
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 700 }}
      >
        <Form
          form={programForm}
          layout="vertical"
          onFinish={handleProgramExercise}
        >
          <Alert
            message="Dates obligatoires"
            description="Les trois dates (prévue, début et fin) sont obligatoires pour programmer un exercice"
            type="info"
            showIcon
            className="mb-4"
          />

          <Form.Item
            name="dateExoPrevue"
            label="Date prévue pour l'exercice"
            rules={[
              { required: true, message: "La date prévue est obligatoire" },
            ]}
            tooltip="Date à laquelle l'exercice devrait être réalisé"
          >
            <DatePicker
              style={{ width: "100%" }}
              showTime
              format="DD/MM/YYYY HH:mm"
              placeholder="Sélectionnez la date prévue"
            />
          </Form.Item>

          <Form.Item
            name="dateDebutExoEffectif"
            label="Date de début effective"
            rules={[
              { required: true, message: "La date de début est obligatoire" },
            ]}
            tooltip="Date à partir de laquelle les étudiants peuvent commencer l'exercice"
          >
            <DatePicker
              style={{ width: "100%" }}
              showTime
              format="DD/MM/YYYY HH:mm"
              placeholder="Sélectionnez la date de début"
            />
          </Form.Item>

          <Form.Item
            name="dateFinExoEffectif"
            label="Date de fin effective"
            rules={[
              { required: true, message: "La date de fin est obligatoire" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startDate = getFieldValue("dateDebutExoEffectif");
                  if (!value || !startDate || value.isAfter(startDate)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("La date de fin doit être après la date de début")
                  );
                },
              }),
            ]}
            tooltip="Date limite pour soumettre l'exercice"
          >
            <DatePicker
              style={{ width: "100%" }}
              showTime
              format="DD/MM/YYYY HH:mm"
              placeholder="Sélectionnez la date de fin"
            />
          </Form.Item>

          <Divider />

          <Form.Item
            name="classeIds"
            label="Classes concernées"
            rules={[
              { required: true, message: "Sélectionnez au moins une classe" },
            ]}
            extra={
              classesLoading
                ? "Chargement des classes..."
                : `${classes.length} classe(s) disponible(s)`
            }
          >
            <Select
              mode="multiple"
              placeholder="Sélectionnez les classes"
              loading={classesLoading}
              optionFilterProp="children"
              notFoundContent={
                classesLoading ? (
                  <div className="text-center py-4">
                    <Spin size="small" />
                    <div className="mt-2 text-xs">Chargement...</div>
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Aucune classe accessible"
                  />
                )
              }
            >
              {classes.map((classe) => (
                <Option key={classe.id} value={classe.id}>
                  {classe.nom} - {classe.niveau}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="diffuseImmediately"
            valuePropName="checked"
            initialValue={false}
          >
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex-1">
                <Text strong className="text-xs sm:text-sm">
                  Diffuser immédiatement
                </Text>
                <br />
                <Text type="secondary" className="text-xs">
                  L'exercice sera disponible immédiatement pour les étudiants
                </Text>
              </div>
              <input type="checkbox" className="ml-2" />
            </div>
          </Form.Item>

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button
              onClick={() => {
                setShowProgramForm(false);
                programForm.resetFields();
              }}
              block
              className="sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={actionLoading === "program"}
              block
              className="sm:w-auto"
            >
              Programmer
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal de visualisation de question */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>Détail de la question</span>
            <Tag color="blue">{viewingQuestion?.typeQuestion}</Tag>
            <Tag color="green">{viewingQuestion?.points || 0} pt{viewingQuestion?.points > 1 ? 's' : ''}</Tag>
          </Space>
        }
        open={!!viewingQuestion}
        onCancel={() => setViewingQuestion(null)}
        footer={[
          <Button key="close" onClick={() => setViewingQuestion(null)}>
            Fermer
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setViewingQuestion(null);
              handleEditQuestion(viewingQuestion);
            }}
          >
            Modifier
          </Button>,
        ]}
        width="90%"
        style={{ maxWidth: 600 }}
      >
        {viewingQuestion && (() => {
          const type = viewingQuestion.typeQuestion;
          const sorted = viewingQuestion.choixReponses
            ? [...viewingQuestion.choixReponses].sort((a, b) => a.ordreAffichage - b.ordreAffichage)
            : [];

          return (
            <div>
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <Text type="secondary" className="text-xs">Intitulé</Text>
                <p className="mt-1 font-medium">{viewingQuestion.intitule}</p>
              </div>

              {/* QCM */}
              {type === "QCM" && sorted.length > 0 && (
                <div>
                  <Text strong className="text-sm">Choix de réponses :</Text>
                  <List
                    className="mt-2"
                    size="small"
                    dataSource={sorted}
                    renderItem={(c) => (
                      <List.Item>
                        <Space>
                          <Tag color={c.estCorrect ? "green" : "default"}>
                            {c.estCorrect ? "✓ Correct" : "✕"}
                          </Tag>
                          <Text>{c.texte}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              )}

              {/* VRAI_FAUX */}
              {type === "VRAI_FAUX" && sorted.length > 0 && (
                <div>
                  <Text strong className="text-sm">Réponse correcte :</Text>
                  <div className="mt-2">
                    {sorted.map(c => (
                      <Tag key={c.id} color={c.estCorrect ? "green" : "default"} className="mr-2">
                        {c.estCorrect ? "✓ " : ""}{c.texte}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {/* CLASSEMENT */}
              {type === "CLASSEMENT" && sorted.length > 0 && (
                <div>
                  <Text strong className="text-sm">Ordre correct :</Text>
                  <List
                    className="mt-2"
                    size="small"
                    dataSource={sorted}
                    renderItem={(c, i) => (
                      <List.Item>
                        <Space>
                          <Tag color="blue">{i + 1}</Tag>
                          <Text>{c.texte}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              )}

              {/* ASSOCIATION */}
              {type === "ASSOCIATION" && sorted.length > 0 && (
                <div>
                  <Text strong className="text-sm">Paires à associer :</Text>
                  <List
                    className="mt-2"
                    size="small"
                    dataSource={sorted}
                    renderItem={(c) => (
                      <List.Item>
                        <Tag color="cyan">{c.texte}</Tag>
                      </List.Item>
                    )}
                  />
                </div>
              )}

              {/* TROU */}
              {type === "TROU" && sorted.length > 0 && (
                <div>
                  <Text strong className="text-sm">Mots à compléter :</Text>
                  <List
                    className="mt-2"
                    size="small"
                    dataSource={sorted}
                    renderItem={(c, i) => (
                      <List.Item>
                        <Space>
                          <Tag color="orange">{i + 1}</Tag>
                          <Text>{c.texte}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              )}

              {/* REPONSE_COURTE / REPONSE_LONGUE / DEVELOPPEMENT */}
              {(type === "REPONSE_COURTE" || type === "REPONSE_LONGUE" || type === "DEVELOPPEMENT") && (
                <div>
                  <Text strong className="text-sm">Réponse attendue :</Text>
                  <div className="mt-2 p-3 bg-gray-50 rounded border-l-4 border-blue-400">
                    <Text>{viewingQuestion.reponse || <Text type="secondary">Aucune réponse définie</Text>}</Text>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default ExerciseDetailsView;
