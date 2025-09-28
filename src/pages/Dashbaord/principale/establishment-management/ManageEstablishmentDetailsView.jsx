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
  Switch,
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
  Badge,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  BankOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
  BookOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  CheckOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import EstablishmentService from "../../../../services/EstablishmentService";
import { classService } from "../../../../services/ClassService";
import { scholchatService } from "../../../../services/ScholchatService";
import UserViewModal from "../modals/UserViewModal";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;

const ManageEstablishmentDetailsView = ({
  establishmentId,
  onBack,
  onRefresh,
  onError,
  onSuccess,
  onUpdate,
  onDelete,
}) => {
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [form] = Form.useForm();

  // New states for classes and professors
  const [classes, setClasses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [professorsLoading, setProfessorsLoading] = useState(false);

  // Modal states
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [isProfessorModalOpen, setIsProfessorModalOpen] = useState(false);

  useEffect(() => {
    if (establishmentId) {
      fetchEstablishmentDetails();
      fetchEstablishmentClasses();
      fetchEstablishmentProfessors();
    }
  }, [establishmentId]);

  const fetchEstablishmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EstablishmentService.getEstablishmentById(
        establishmentId
      );
      setEstablishment(data);

      // Set form values
      form.setFieldsValue({
        nom: data.nom || "",
        localisation: data.localisation || "",
        pays: data.pays || "",
        email: data.email || "",
        telephone: data.telephone || "",
        optionEnvoiMailVersClasse: data.optionEnvoiMailVersClasse || false,
        optionTokenGeneral: data.optionTokenGeneral || false,
        codeUnique: data.codeUnique || false,
      });
    } catch (error) {
      console.error("Error fetching establishment details:", error);
      setError("Erreur lors du chargement des détails de l'établissement");
    } finally {
      setLoading(false);
    }
  };

  const fetchEstablishmentClasses = async () => {
    try {
      setClassesLoading(true);
      // Fetch all classes and filter by establishment
      const allClasses = await classService.obtenirToutesLesClasses();
      const establishmentClasses = allClasses.filter(
        (classe) =>
          classe.etablissement && classe.etablissement.id === establishmentId
      );
      setClasses(establishmentClasses);
    } catch (error) {
      console.error("Error fetching establishment classes:", error);
      message.error("Erreur lors du chargement des classes");
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchEstablishmentProfessors = async () => {
    try {
      setProfessorsLoading(true);
      // Fetch all professors and filter by those who moderate classes in this establishment
      const allClasses = await classService.obtenirToutesLesClasses();
      const establishmentClasses = allClasses.filter(
        (classe) =>
          classe.etablissement && classe.etablissement.id === establishmentId
      );

      // Get unique professors who moderate classes in this establishment
      const professorIds = new Set();
      const professorsList = [];

      establishmentClasses.forEach((classe) => {
        if (
          classe.moderator &&
          classe.moderator.id &&
          !professorIds.has(classe.moderator.id)
        ) {
          professorIds.add(classe.moderator.id);
          professorsList.push({
            ...classe.moderator,
            moderatedClassesInEstablishment: establishmentClasses.filter(
              (c) => c.moderator && c.moderator.id === classe.moderator.id
            ).length,
          });
        }
      });

      setProfessors(professorsList);
    } catch (error) {
      console.error("Error fetching establishment professors:", error);
      message.error("Erreur lors du chargement des professeurs");
    } finally {
      setProfessorsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchEstablishmentDetails(),
      fetchEstablishmentClasses(),
      fetchEstablishmentProfessors(),
    ]);
    setRefreshing(false);
    setSuccessMessage("Données actualisées avec succès");
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
    // Reset form to original values
    form.setFieldsValue({
      nom: establishment.nom || "",
      localisation: establishment.localisation || "",
      pays: establishment.pays || "",
      email: establishment.email || "",
      telephone: establishment.telephone || "",
      optionEnvoiMailVersClasse:
        establishment.optionEnvoiMailVersClasse || false,
      optionTokenGeneral: establishment.optionTokenGeneral || false,
      codeUnique: establishment.codeUnique || false,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setActionLoading("save");
      setError(null);

      const values = await form.validateFields();

      // Validate data
      const validation = EstablishmentService.validateEstablishment(values);
      if (!validation.isValid) {
        setError(validation.errors.join(", "));
        return;
      }

      await onUpdate(establishmentId, values);
      setEstablishment({ ...establishment, ...values });
      setEditing(false);
      setSuccessMessage("Établissement mis à jour avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error saving establishment:", error);
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
      setActionLoading(null);
    }
  };

  const handleDelete = () => {
    confirm({
      title: "Supprimer l'établissement",
      icon: <ExclamationCircleOutlined />,
      content: `Êtes-vous sûr de vouloir supprimer l'établissement "${establishment?.nom}" ? Cette action est irréversible.`,
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          setActionLoading("delete");
          await onDelete(establishmentId);
          onBack(); // Go back to list after successful deletion
        } catch (error) {
          console.error("Error deleting establishment:", error);
          setError("Erreur lors de la suppression");
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Class actions
  const handleApproveClass = async (classId) => {
    try {
      setActionLoading(`approve-${classId}`);
      await classService.approuverClasse(classId);
      message.success("Classe approuvée avec succès");
      fetchEstablishmentClasses();
    } catch (error) {
      console.error("Error approving class:", error);
      message.error("Erreur lors de l'approbation de la classe");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClass = async (classId) => {
    try {
      setActionLoading(`reject-${classId}`);
      await classService.rejeterClasse(classId, "Rejetée par l'établissement");
      message.success("Classe rejetée avec succès");
      fetchEstablishmentClasses();
    } catch (error) {
      console.error("Error rejecting class:", error);
      message.error("Erreur lors du rejet de la classe");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClass = async (classId) => {
    confirm({
      title: "Supprimer la classe",
      content: "Êtes-vous sûr de vouloir supprimer cette classe ?",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          setActionLoading(`delete-${classId}`);
          await classService.supprimerClasse(classId);
          message.success("Classe supprimée avec succès");
          fetchEstablishmentClasses();
        } catch (error) {
          console.error("Error deleting class:", error);
          message.error("Erreur lors de la suppression de la classe");
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Professor actions
  const handleViewProfessor = async (professorId) => {
    try {
      // Fetch the complete professor data
      const professorData = await scholchatService.getProfessorById(
        professorId
      );
      setSelectedProfessor(professorData);
      setIsProfessorModalOpen(true);
    } catch (error) {
      console.error("Error fetching professor details:", error);
      message.error("Erreur lors du chargement des détails du professeur");
    }
  };

  const handleCloseProfessorModal = () => {
    setIsProfessorModalOpen(false);
    setSelectedProfessor(null);
  };

  const handleProfessorModalSuccess = () => {
    // Refresh the professors list after successful action
    fetchEstablishmentProfessors();
    handleCloseProfessorModal();
  };

  const handleDeleteProfessor = async (professorId) => {
    confirm({
      title: "Supprimer le professeur",
      content: "Êtes-vous sûr de vouloir supprimer ce professeur ?",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          setActionLoading(`delete-prof-${professorId}`);
          await scholchatService.deleteProfessor(professorId);
          message.success("Professeur supprimé avec succès");
          fetchEstablishmentProfessors();
        } catch (error) {
          console.error("Error deleting professor:", error);
          message.error("Erreur lors de la suppression du professeur");
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const getStatusTag = (establishment) => {
    // Assuming we determine status based on data completeness
    const hasRequiredInfo =
      establishment.nom && establishment.localisation && establishment.pays;
    return (
      <Tag color={hasRequiredInfo ? "success" : "warning"}>
        {hasRequiredInfo ? "Actif" : "Incomplet"}
      </Tag>
    );
  };

  const getClassStatusTag = (status) => {
    switch (status) {
      case "ACTIF":
        return <Tag color="green">Actif</Tag>;
      case "EN_ATTENTE_APPROBATION":
        return <Tag color="orange">En attente</Tag>;
      case "INACTIF":
        return <Tag color="red">Inactif</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const getProfessorStatusTag = (status) => {
    switch (status) {
      case "ACTIVE":
        return <Tag color="green">Actif</Tag>;
      case "AWAITING_VALIDATION":
        return <Tag color="orange">En attente</Tag>;
      case "INACTIVE":
        return <Tag color="red">Inactif</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  // Table columns for classes
  const classColumns = [
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Niveau",
      dataIndex: "niveau",
      key: "niveau",
    },
    {
      title: "Code d'activation",
      dataIndex: "codeActivation",
      key: "codeActivation",
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: "Statut",
      dataIndex: "etat",
      key: "etat",
      render: (status) => getClassStatusTag(status),
    },
    {
      title: "Date de création",
      dataIndex: "dateCreation",
      key: "dateCreation",
      render: (date) => new Date(date).toLocaleDateString("fr-FR"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => message.info(`Voir classe ${record.nom}`)}
            />
          </Tooltip>
          {record.etat === "EN_ATTENTE_APPROBATION" && (
            <>
              <Tooltip title="Approuver">
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  loading={actionLoading === `approve-${record.id}`}
                  onClick={() => handleApproveClass(record.id)}
                  style={{ color: "#52c41a" }}
                />
              </Tooltip>
              <Tooltip title="Rejeter">
                <Button
                  type="text"
                  size="small"
                  icon={<StopOutlined />}
                  loading={actionLoading === `reject-${record.id}`}
                  onClick={() => handleRejectClass(record.id)}
                  style={{ color: "#ff4d4f" }}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Supprimer la classe"
              description="Êtes-vous sûr de vouloir supprimer cette classe ?"
              onConfirm={() => handleDeleteClass(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                loading={actionLoading === `delete-${record.id}`}
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Table columns for professors
  const professorColumns = [
    {
      title: "Nom",
      key: "name",
      render: (_, record) => (
        <div>
          <Text strong>
            {record.nom} {record.prenom}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.email}
          </Text>
        </div>
      ),
    },
    {
      title: "Téléphone",
      dataIndex: "telephone",
      key: "telephone",
    },
    {
      title: "Classes modérées",
      dataIndex: "moderatedClassesInEstablishment",
      key: "moderatedClasses",
      render: (count) => (
        <Badge count={count} showZero style={{ backgroundColor: "#1890ff" }} />
      ),
    },
    {
      title: "Statut",
      dataIndex: "etat",
      key: "etat",
      render: (status) => getProfessorStatusTag(status),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewProfessor(record.id)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Supprimer le professeur"
              description="Êtes-vous sûr de vouloir supprimer ce professeur ?"
              onConfirm={() => handleDeleteProfessor(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                loading={actionLoading === `delete-prof-${record.id}`}
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
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
        <span className="ml-3">
          Chargement des détails de l'établissement...
        </span>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="p-6">
        <Alert
          message="Impossible de charger les détails de l'établissement"
          description={error || "Une erreur est survenue lors du chargement"}
          type="error"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={handleRefresh}>
                Réessayer
              </Button>
              <Button size="small" type="primary" onClick={onBack}>
                Retour à la liste
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header - Made Responsive */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex items-center gap-3">
            <Button icon={<ArrowLeftOutlined />} onClick={onBack} type="text" />
            <div>
              <h2 className="text-2xl font-bold m-0">
                Gestion de l'établissement
              </h2>
              <p className="text-gray-500 m-0">{establishment.nom}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={refreshing}
              type="default"
            >
              Actualiser
            </Button>

            {editing ? (
              <>
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                >
                  Sauvegarder
                </Button>
              </>
            ) : (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  type="primary"
                >
                  Modifier
                </Button>
                <Popconfirm
                  title="Êtes-vous sûr de vouloir supprimer cet établissement ?"
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
                  >
                    Supprimer
                  </Button>
                </Popconfirm>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert
          message={successMessage}
          type="success"
          showIcon
          closable
          className="mb-4"
        />
      )}

      {/* Error Message */}
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

      {/* Establishment Information */}
      <Card title="Informations de l'établissement" className="mb-6">
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Nom">
                {establishment.nom || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Localisation">
                <Space>
                  <EnvironmentOutlined style={{ color: "#52c41a" }} />
                  <Text>{establishment.localisation || "N/A"}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Pays">
                <Space>
                  <GlobalOutlined style={{ color: "#1890ff" }} />
                  <Text>{establishment.pays || "N/A"}</Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Email">
                {establishment.email ? (
                  <Space>
                    <MailOutlined style={{ color: "#faad14" }} />
                    <Text copyable>{establishment.email}</Text>
                  </Space>
                ) : (
                  <Text type="secondary">N/A</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Téléphone">
                {establishment.telephone ? (
                  <Space>
                    <PhoneOutlined style={{ color: "#13c2c2" }} />
                    <Text copyable>{establishment.telephone}</Text>
                  </Space>
                ) : (
                  <Text type="secondary">N/A</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                {getStatusTag(establishment)}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* Configuration Options */}
      {editing ? (
        /* Edit Form */
        <Card title="Modifier les informations" className="mb-6">
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      <BankOutlined />
                      <span>Informations Générales</span>
                    </Space>
                  }
                  size="small"
                >
                  <Form.Item
                    name="nom"
                    label="Nom de l'établissement"
                    rules={[
                      { required: true, message: "Le nom est requis" },
                      {
                        min: 2,
                        message: "Le nom doit contenir au moins 2 caractères",
                      },
                    ]}
                  >
                    <Input
                      prefix={<BankOutlined />}
                      placeholder="Nom de l'établissement"
                    />
                  </Form.Item>

                  <Form.Item
                    name="localisation"
                    label="Localisation"
                    rules={[
                      {
                        required: true,
                        message: "La localisation est requise",
                      },
                    ]}
                  >
                    <Input
                      prefix={<EnvironmentOutlined />}
                      placeholder="Adresse ou localisation"
                    />
                  </Form.Item>

                  <Form.Item
                    name="pays"
                    label="Pays"
                    rules={[{ required: true, message: "Le pays est requis" }]}
                  >
                    <Input prefix={<GlobalOutlined />} placeholder="Pays" />
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      <MailOutlined />
                      <span>Contact & Options</span>
                    </Space>
                  }
                  size="small"
                >
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { type: "email", message: "Format email invalide" },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="contact@etablissement.com"
                    />
                  </Form.Item>

                  <Form.Item name="telephone" label="Téléphone">
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </Form.Item>

                  <Divider orientation="left">
                    <Space>
                      <SettingOutlined />
                      <span>Options</span>
                    </Space>
                  </Divider>

                  <Form.Item
                    name="optionEnvoiMailVersClasse"
                    valuePropName="checked"
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Envoi d'email vers les classes</span>
                      <Switch />
                    </div>
                  </Form.Item>

                  <Form.Item name="optionTokenGeneral" valuePropName="checked">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Token général</span>
                      <Switch />
                    </div>
                  </Form.Item>

                  <Form.Item name="codeUnique" valuePropName="checked">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Code unique</span>
                      <Switch />
                    </div>
                  </Form.Item>
                </Card>
              </Col>
            </Row>
          </Form>
        </Card>
      ) : (
        /* Configuration Options Card */
        <Card title="Options de Configuration" className="mb-6">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={8}>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <Text>Envoi d'email vers les classes</Text>
                <Tag
                  color={
                    establishment.optionEnvoiMailVersClasse
                      ? "green"
                      : "default"
                  }
                >
                  {establishment.optionEnvoiMailVersClasse
                    ? "Activé"
                    : "Désactivé"}
                </Tag>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <Text>Token général</Text>
                <Tag
                  color={establishment.optionTokenGeneral ? "blue" : "default"}
                >
                  {establishment.optionTokenGeneral ? "Activé" : "Désactivé"}
                </Tag>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <Text>Code unique</Text>
                <Tag color={establishment.codeUnique ? "purple" : "default"}>
                  {establishment.codeUnique ? "Activé" : "Désactivé"}
                </Tag>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Data Tabs */}
      {!editing && (
        <Card>
          <Tabs defaultActiveKey="1">
            <TabPane
              tab={
                <span>
                  <TeamOutlined />
                  Classes ({classes.length})
                </span>
              }
              key="1"
            >
              <Table
                columns={classColumns}
                dataSource={classes}
                rowKey="id"
                loading={classesLoading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} sur ${total} classes`,
                }}
                scroll={{ x: 800 }}
                locale={{
                  emptyText: (
                    <Empty
                      description="Aucune classe dans cet établissement"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <UserOutlined />
                  Professeurs ({professors.length})
                </span>
              }
              key="2"
            >
              <Table
                columns={professorColumns}
                dataSource={professors}
                rowKey="id"
                loading={professorsLoading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} sur ${total} professeurs`,
                }}
                scroll={{ x: 800 }}
                locale={{
                  emptyText: (
                    <Empty
                      description="Aucun professeur dans cet établissement"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <InfoCircleOutlined />
                  Informations Système
                </span>
              }
              key="3"
            >
              <Descriptions
                column={{ xs: 1, sm: 2, md: 3 }}
                bordered
                size="small"
              >
                <Descriptions.Item label="ID">
                  <Text code>{establishment.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Date de création">
                  <Text>
                    {establishment.dateCreation
                      ? new Date(establishment.dateCreation).toLocaleDateString(
                          "fr-FR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : establishment.creationDate
                      ? new Date(establishment.creationDate).toLocaleDateString(
                          "fr-FR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "N/A"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Dernière modification">
                  <Text>
                    {establishment.dateModification
                      ? new Date(
                          establishment.dateModification
                        ).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : establishment.lastModified
                      ? new Date(establishment.lastModified).toLocaleDateString(
                          "fr-FR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "N/A"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Code Unique" span={3}>
                  <Text code>{establishment.codeUnique || "Non défini"}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Total Classes" span={1}>
                  <Badge
                    count={classes.length}
                    showZero
                    style={{ backgroundColor: "#52c41a" }}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Classes Actives" span={1}>
                  <Badge
                    count={classes.filter((c) => c.etat === "ACTIF").length}
                    showZero
                    style={{ backgroundColor: "#1890ff" }}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Classes en Attente" span={1}>
                  <Badge
                    count={
                      classes.filter((c) => c.etat === "EN_ATTENTE_APPROBATION")
                        .length
                    }
                    showZero
                    style={{ backgroundColor: "#faad14" }}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Total Professeurs" span={3}>
                  <Badge
                    count={professors.length}
                    showZero
                    style={{ backgroundColor: "#13c2c2" }}
                  />
                </Descriptions.Item>
              </Descriptions>
            </TabPane>
          </Tabs>
        </Card>
      )}

      {/* Professor Modal */}
      {isProfessorModalOpen && selectedProfessor && (
        <UserViewModal
          user={selectedProfessor}
          onClose={handleCloseProfessorModal}
          onSuccess={handleProfessorModalSuccess}
        />
      )}
    </div>
  );
};

export default ManageEstablishmentDetailsView;
