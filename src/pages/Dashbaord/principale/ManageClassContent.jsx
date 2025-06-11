import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Tag,
  Popconfirm,
  Space,
  Card,
  Row,
  Col,
  Descriptions,
  Alert,
  Spin,
  Empty,
  List,
  Avatar,
  Divider,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  HistoryOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  EyeOutlined,
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  SettingOutlined,
  BookOutlined,
  BankOutlined,
} from "@ant-design/icons";
import {
  classService,
  DroitPublication,
  EtatClasse,
} from "../../../services/ClassService";
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const ManageClassContent = ({ onBack }) => {
  // States pour la liste des classes
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal states
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [moderatorModalVisible, setModeratorModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [publicationRightsModalVisible, setPublicationRightsModalVisible] =
    useState(false);

  // Form and data states
  const [form] = Form.useForm();
  const [history, setHistory] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedPublicationRight, setSelectedPublicationRight] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // Auto-clear messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Charger toutes les classes au début
  useEffect(() => {
    fetchAllClasses();
    fetchProfessors();
  }, []);

  // Charger les détails quand une classe est sélectionnée
  useEffect(() => {
    if (selectedClassId) {
      fetchClassDetails(selectedClassId);
    }
  }, [selectedClassId]);

  const fetchAllClasses = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await classService.obtenirToutesLesClasses();
      setClasses(data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setError("Erreur lors du chargement de la liste des classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassDetails = async (classId) => {
    try {
      setLoading(true);
      setError("");
      const data = await classService.obtenirClasseParId(classId);
      setClassData(data);
      setSelectedPublicationRight(
        data.droitPublication || DroitPublication.PROFESSEURS_SEULEMENT
      );
    } catch (error) {
      console.error("Error fetching class details:", error);
      setError("Erreur lors du chargement des détails de la classe");
      setClassData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessors = async () => {
    try {
      const data = await classService.obtenirProfesseurs();
      setProfessors(data || []);
    } catch (error) {
      console.error("Error fetching professors:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllClasses();
    if (selectedClassId) {
      await fetchClassDetails(selectedClassId);
    }
    setRefreshing(false);
    setSuccessMessage("Données actualisées avec succès");
  };

  const handleSelectClass = (classId) => {
    setSelectedClassId(classId);
    setError("");
    setSuccessMessage("");
  };

  const handleBackToList = () => {
    setSelectedClassId(null);
    setClassData(null);
    setError("");
    setSuccessMessage("");
  };

  const handleApprove = async () => {
    if (!selectedClassId) return;

    try {
      setActionLoading("approve");
      await classService.approuverClasse(selectedClassId);
      setSuccessMessage("Classe approuvée avec succès");
      await fetchClassDetails(selectedClassId);
      await fetchAllClasses(); // Refresh la liste aussi
    } catch (error) {
      console.error("Error approving class:", error);
      setError("Erreur lors de l'approbation de la classe");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedClassId || !rejectReason.trim()) {
      setError("Veuillez fournir une raison pour le rejet");
      return;
    }

    try {
      setActionLoading("reject");
      await classService.rejeterClasse(selectedClassId, rejectReason);
      setSuccessMessage("Classe rejetée avec succès");
      setRejectModalVisible(false);
      setRejectReason("");
      await fetchClassDetails(selectedClassId);
      await fetchAllClasses();
    } catch (error) {
      console.error("Error rejecting class:", error);
      setError("Erreur lors du rejet de la classe");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedClassId) return;

    try {
      setActionLoading("delete");
      await classService.supprimerClasse(selectedClassId);
      message.success("Classe supprimée avec succès");
      handleBackToList();
      await fetchAllClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
      setError("Erreur lors de la suppression de la classe");
      setActionLoading(null);
    }
  };

  const fetchActivationHistory = async () => {
    if (!selectedClassId) return;

    try {
      setActionLoading("history");
      const data = await classService.obtenirHistoriqueActivation(
        selectedClassId
      );
      setHistory(data || []);
      setHistoryModalVisible(true);
    } catch (error) {
      console.error("Error fetching activation history:", error);
      setError("Erreur lors du chargement de l'historique");
    } finally {
      setActionLoading(null);
    }
  };

  const handleModeratorAssign = async (values) => {
    if (!selectedClassId) return;

    try {
      setActionLoading("moderator");
      await classService.assignerModerateur(
        selectedClassId,
        values.moderatorId
      );
      setSuccessMessage("Modérateur assigné avec succès");
      setModeratorModalVisible(false);
      form.resetFields();
      await fetchClassDetails(selectedClassId);
    } catch (error) {
      console.error("Error assigning moderator:", error);
      setError("Erreur lors de l'assignation du modérateur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleModeratorRemove = async () => {
    if (!selectedClassId) return;

    try {
      setActionLoading("removeModerator");
      await classService.retirerModerateur(selectedClassId);
      setSuccessMessage("Modérateur retiré avec succès");
      await fetchClassDetails(selectedClassId);
    } catch (error) {
      console.error("Error removing moderator:", error);
      setError("Erreur lors du retrait du modérateur");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublicationRightsUpdate = async () => {
    if (!selectedClassId || !selectedPublicationRight) {
      setError("Veuillez sélectionner un droit de publication");
      return;
    }

    try {
      setActionLoading("publicationRights");
      await classService.modifierDroitPublication(
        selectedClassId,
        selectedPublicationRight
      );
      setSuccessMessage("Droits de publication mis à jour avec succès");
      setPublicationRightsModalVisible(false);
      await fetchClassDetails(selectedClassId);
    } catch (error) {
      console.error("Error updating publication rights:", error);
      setError("Erreur lors de la mise à jour des droits de publication");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (etat) => {
    switch (etat) {
      case EtatClasse.ACTIF:
        return "success";
      case EtatClasse.EN_ATTENTE_APPROBATION:
        return "warning";
      case EtatClasse.INACTIF:
        return "error";
      default:
        return "default";
    }
  };

  const getPublicationRightLabel = (droit) => {
    switch (droit) {
      case DroitPublication.PROFESSEURS_SEULEMENT:
        return "Professeurs seulement";
      case DroitPublication.TOUS:
        return "Tous";
      case DroitPublication.MODERATEUR_SEULEMENT:
        return "Modérateur seulement";
      case DroitPublication.PARENTS_ET_MODERATEUR:
        return "Parents et Modérateur";
      default:
        return "Non défini";
    }
  };

  const historyColumns = [
    {
      title: "Date",
      dataIndex: "dateActivation",
      key: "dateActivation",
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "Professeur",
      dataIndex: "professeur",
      key: "professeur",
      render: (prof) => (prof ? `${prof.nom} ${prof.prenom}` : "N/A"),
    },
    {
      title: "État",
      dataIndex: "isActive",
      key: "isActive",
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Activé" : "Désactivé"}
        </Tag>
      ),
    },
  ];

  // Loading state global
  if (loading && !classes.length) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
        <span className="ml-3">Chargement des classes...</span>
      </div>
    );
  }

  // Si aucune classe sélectionnée, afficher la liste
  if (!selectedClassId) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                type="text"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold m-0">Gestion des Classes</h2>
              <p className="text-gray-500 m-0">
                Sélectionnez une classe à gérer ({classes.length} classe
                {classes.length !== 1 ? "s" : ""})
              </p>
            </div>
          </div>

          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
            type="default"
          >
            Actualiser
          </Button>
        </div>

        {/* Success/Error Messages */}
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
            className="mb-4"
          />
        )}

        {/* Liste des classes */}
        <Card title="Classes disponibles">
          {classes.length === 0 ? (
            <Empty
              description="Aucune classe trouvée"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={classes}
              renderItem={(classe) => (
                <List.Item
                  className="hover:bg-gray-50 cursor-pointer rounded-lg p-4"
                  onClick={() => handleSelectClass(classe.id)}
                  actions={[
                    <Button
                      type="primary"
                      icon={<SettingOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectClass(classe.id);
                      }}
                    >
                      Gérer
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<BookOutlined />} />}
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{classe.nom}</span>
                        <Tag color={getStatusColor(classe.etat)}>
                          {classService.getEtatDisplayName
                            ? classService.getEtatDisplayName(classe.etat)
                            : classe.etat}
                        </Tag>
                      </div>
                    }
                    description={
                      <div className="space-y-1">
                        <div className="flex items-center gap-4 text-sm">
                          <span>
                            <BankOutlined /> {classe.niveau}
                          </span>
                          <span>
                            <TeamOutlined /> {classe.eleves?.length || 0} élèves
                          </span>
                          <span>
                            <UserOutlined /> {classe.parents?.length || 0}{" "}
                            parents
                          </span>
                        </div>
                        {classe.dateCreation && (
                          <div className="text-xs text-gray-500">
                            <CalendarOutlined /> Créée le{" "}
                            {new Date(classe.dateCreation).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    );
  }

  // Si une classe est sélectionnée mais en cours de chargement
  if (loading && selectedClassId) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
        <span className="ml-3">Chargement des détails de la classe...</span>
      </div>
    );
  }

  // Si erreur lors du chargement des détails
  if (!classData && selectedClassId) {
    return (
      <div className="p-6">
        <Alert
          message="Impossible de charger les détails de la classe"
          description={error || "Une erreur est survenue lors du chargement"}
          type="error"
          showIcon
          action={
            <Space>
              <Button
                size="small"
                onClick={() => fetchClassDetails(selectedClassId)}
              >
                Réessayer
              </Button>
              <Button size="small" type="primary" onClick={handleBackToList}>
                Retour à la liste
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  // Interface de gestion d'une classe spécifique
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToList}
            type="text"
          />
          <div>
            <h2 className="text-2xl font-bold m-0">Gestion de la classe</h2>
            <p className="text-gray-500 m-0">{classData.nom}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
            type="default"
          >
            Actualiser
          </Button>

          {classService.estEnAttenteApprobation &&
            classService.estEnAttenteApprobation(classData) && (
              <>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleApprove}
                  loading={actionLoading === "approve"}
                >
                  Approuver
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => setRejectModalVisible(true)}
                  loading={actionLoading === "reject"}
                >
                  Rejeter
                </Button>
              </>
            )}

          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cette classe ?"
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
          className="mb-4"
        />
      )}

      {/* Action Buttons */}
      <div className="mb-6">
        <Space wrap>
          <Button
            icon={<HistoryOutlined />}
            onClick={fetchActivationHistory}
            loading={actionLoading === "history"}
          >
            Historique d'activation
          </Button>

          <Button
            icon={<FileTextOutlined />}
            onClick={() => setPublicationRightsModalVisible(true)}
          >
            Droits de publication
          </Button>

          <Button
            type="dashed"
            icon={<UserAddOutlined />}
            onClick={() => setModeratorModalVisible(true)}
            disabled={!professors.length}
          >
            Assigner un modérateur
          </Button>

          {classData.moderator && (
            <Button
              danger
              icon={<UserDeleteOutlined />}
              onClick={handleModeratorRemove}
              loading={actionLoading === "removeModerator"}
            >
              Retirer le modérateur
            </Button>
          )}
        </Space>
      </div>

      {/* Class Information */}
      <Card title="Informations de la classe" className="mb-6">
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Nom">{classData.nom}</Descriptions.Item>
              <Descriptions.Item label="Niveau">
                {classData.niveau}
              </Descriptions.Item>
              <Descriptions.Item label="État">
                <Tag color={getStatusColor(classData.etat)}>
                  {classService.getEtatDisplayName
                    ? classService.getEtatDisplayName(classData.etat)
                    : classData.etat}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Date de création">
                {classData.dateCreation
                  ? new Date(classData.dateCreation).toLocaleString()
                  : "Non définie"}
              </Descriptions.Item>
              <Descriptions.Item label="Droits de publication">
                {getPublicationRightLabel(classData.droitPublication)}
              </Descriptions.Item>
              <Descriptions.Item label="Modérateur">
                {classData.moderator
                  ? `${classData.moderator.nom} ${classData.moderator.prenom}`
                  : "Non assigné"}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* Data Tabs */}
      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Élèves ({classData.eleves?.length || 0})
              </span>
            }
            key="1"
          >
            {!classData.eleves || classData.eleves.length === 0 ? (
              <Empty
                description="Aucun élève dans cette classe"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                columns={[
                  { title: "Nom", dataIndex: "nom", key: "nom" },
                  { title: "Prénom", dataIndex: "prenom", key: "prenom" },
                  { title: "Email", dataIndex: "email", key: "email" },
                  { title: "Niveau", dataIndex: "niveau", key: "niveau" },
                ]}
                dataSource={classData.eleves}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            )}
          </TabPane>

          <TabPane
            tab={
              <span>
                <UserOutlined />
                Parents ({classData.parents?.length || 0})
              </span>
            }
            key="2"
          >
            {!classData.parents || classData.parents.length === 0 ? (
              <Empty
                description="Aucun parent dans cette classe"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                columns={[
                  { title: "Nom", dataIndex: "nom", key: "nom" },
                  { title: "Prénom", dataIndex: "prenom", key: "prenom" },
                  { title: "Email", dataIndex: "email", key: "email" },
                  {
                    title: "Téléphone",
                    dataIndex: "telephone",
                    key: "telephone",
                  },
                ]}
                dataSource={classData.parents}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* Modals */}

      {/* Activation History Modal */}
      <Modal
        title="Historique d'activation"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={800}
      >
        {history.length === 0 ? (
          <Empty description="Aucun historique disponible" />
        ) : (
          <Table
            columns={historyColumns}
            dataSource={history}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}
      </Modal>

      {/* Assign Moderator Modal */}
      <Modal
        title="Assigner un modérateur"
        open={moderatorModalVisible}
        onCancel={() => {
          setModeratorModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={actionLoading === "moderator"}
      >
        <Form form={form} layout="vertical" onFinish={handleModeratorAssign}>
          <Form.Item
            name="moderatorId"
            label="Sélectionner un professeur"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner un professeur!",
              },
            ]}
          >
            <Select placeholder="Choisir un professeur" showSearch>
              {professors.map((prof) => (
                <Option key={prof.id} value={prof.id}>
                  {prof.nom} {prof.prenom} - {prof.email}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Class Modal */}
      <Modal
        title="Rejeter la classe"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason("");
        }}
        onOk={handleReject}
        okText="Rejeter"
        okButtonProps={{ danger: true }}
        confirmLoading={actionLoading === "reject"}
      >
        <p>Veuillez fournir une raison pour le rejet de cette classe :</p>
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Entrez la raison du rejet..."
        />
      </Modal>

      {/* Publication Rights Modal */}
      <Modal
        title="Modifier les droits de publication"
        open={publicationRightsModalVisible}
        onCancel={() => setPublicationRightsModalVisible(false)}
        onOk={handlePublicationRightsUpdate}
        okText="Mettre à jour"
        confirmLoading={actionLoading === "publicationRights"}
      >
        <p className="mb-4">
          Sélectionnez qui peut publier du contenu dans cette classe :
        </p>
        <Select
          style={{ width: "100%" }}
          value={selectedPublicationRight}
          onChange={(value) => setSelectedPublicationRight(value)}
          placeholder="Sélectionner les droits de publication"
        >
          <Option value={DroitPublication.PROFESSEURS_SEULEMENT}>
            Professeurs seulement
          </Option>
          <Option value={DroitPublication.TOUS}>Tous</Option>
          <Option value={DroitPublication.MODERATEUR_SEULEMENT}>
            Modérateur seulement
          </Option>
          <Option value={DroitPublication.PARENTS_ET_MODERATEUR}>
            Parents et modérateur
          </Option>
        </Select>
      </Modal>
    </div>
  );
};

export default ManageClassContent;
