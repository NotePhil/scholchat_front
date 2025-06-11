import React, { useState, useEffect } from "react";
import {
  Form,
  message,
  Modal,
  Input,
  Select,
  Button,
  Tag,
  Divider,
  Typography,
  Card,
  Space,
  Alert,
  Spin,
  Table,
  Tabs,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  HistoryOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  BookOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { classService } from "../../../services/ClassService";
import { rejectionServiceClass } from "../../../services/RejectionServiceClass";
import { scholchatService } from "../../../services/ScholchatService";
import ManageClassList from "./ManageClassList";
import ManageClassDetails from "./ManageClassDetails";

const { Text, Title } = Typography;
const { Option } = Select;
const { confirm } = Modal;
const { TabPane } = Tabs;

const ManageClassContent = ({ onBack }) => {
  // States for class list and details
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
  const [rejectionMotifs, setRejectionMotifs] = useState([]);

  // Form and data states
  const [form] = Form.useForm();
  const [history, setHistory] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [rejectReason, setRejectReason] = useState({
    codeErreur: "",
    motifSupplementaire: "",
  });
  const [selectedPublicationRight, setSelectedPublicationRight] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // New states for class members
  const [classProfessors, setClassProfessors] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [classParents, setClassParents] = useState([]);
  const [professorsLoading, setProfessorsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [parentsLoading, setParentsLoading] = useState(false);

  // Pagination states
  const [professorsPagination, setProfessorsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [studentsPagination, setStudentsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [parentsPagination, setParentsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

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

  // Load all classes, professors and rejection motifs on mount
  useEffect(() => {
    fetchAllClasses();
    fetchProfessors();
    fetchRejectionMotifs();
  }, []);

  // Load class details when selected
  useEffect(() => {
    if (selectedClassId) {
      fetchClassDetails(selectedClassId);
      fetchClassMembers(selectedClassId);
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
        data.droitPublication || "PROFESSEURS_SEULEMENT"
      );
    } catch (error) {
      console.error("Error fetching class details:", error);
      setError("Erreur lors du chargement des détails de la classe");
      setClassData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassMembers = async (classId) => {
    await Promise.all([
      fetchClassProfessors(classId),
      fetchClassStudents(classId),
      fetchClassParents(classId),
    ]);
  };

  const fetchClassProfessors = async (classId) => {
    try {
      setProfessorsLoading(true);
      const allProfessors = await scholchatService.getAllProfessors();
      // Filter professors by class (you may need to adjust this based on your data structure)
      const classProfessors = allProfessors.filter(
        (prof) => prof.classes && prof.classes.some((cls) => cls.id === classId)
      );
      setClassProfessors(classProfessors);
      setProfessorsPagination((prev) => ({
        ...prev,
        total: classProfessors.length,
      }));
    } catch (error) {
      console.error("Error fetching class professors:", error);
      setError("Erreur lors du chargement des professeurs");
    } finally {
      setProfessorsLoading(false);
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      setStudentsLoading(true);
      const allStudents = await scholchatService.getAllStudents();
      // Filter students by class
      const classStudents = allStudents.filter(
        (student) =>
          student.classes && student.classes.some((cls) => cls.id === classId)
      );
      setClassStudents(classStudents);
      setStudentsPagination((prev) => ({
        ...prev,
        total: classStudents.length,
      }));
    } catch (error) {
      console.error("Error fetching class students:", error);
      setError("Erreur lors du chargement des étudiants");
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchClassParents = async (classId) => {
    try {
      setParentsLoading(true);
      const allParents = await scholchatService.getAllParents();
      // Filter parents by class
      const classParents = allParents.filter(
        (parent) =>
          parent.classes && parent.classes.some((cls) => cls.id === classId)
      );
      setClassParents(classParents);
      setParentsPagination((prev) => ({
        ...prev,
        total: classParents.length,
      }));
    } catch (error) {
      console.error("Error fetching class parents:", error);
      setError("Erreur lors du chargement des parents");
    } finally {
      setParentsLoading(false);
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

  const fetchRejectionMotifs = async () => {
    try {
      const motifs = await rejectionServiceClass.getAllClassRejectionMotifs();
      setRejectionMotifs(motifs || []);
    } catch (error) {
      console.error("Error fetching rejection motifs:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllClasses();
    if (selectedClassId) {
      await fetchClassDetails(selectedClassId);
      await fetchClassMembers(selectedClassId);
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
      await fetchAllClasses();
    } catch (error) {
      console.error("Error approving class:", error);
      setError("Erreur lors de l'approbation de la classe");
    } finally {
      setActionLoading(null);
    }
  };

  const showRejectConfirm = () => {
    confirm({
      title: "Confirmer le rejet de la classe",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Êtes-vous sûr de vouloir rejeter cette classe ?</p>
          <Form layout="vertical">
            <Form.Item label="Motif de rejet" required>
              <Select
                placeholder="Sélectionner un motif"
                onChange={(value) =>
                  setRejectReason({ ...rejectReason, codeErreur: value })
                }
              >
                {rejectionMotifs.map((motif) => (
                  <Option key={motif.code} value={motif.code}>
                    {motif.descriptif}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Commentaire supplémentaire">
              <Input.TextArea
                rows={3}
                placeholder="Détails supplémentaires (optionnel)"
                onChange={(e) =>
                  setRejectReason({
                    ...rejectReason,
                    motifSupplementaire: e.target.value,
                  })
                }
              />
            </Form.Item>
          </Form>
        </div>
      ),
      okText: "Confirmer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: handleReject,
      onCancel: () => {
        setRejectReason({ codeErreur: "", motifSupplementaire: "" });
      },
    });
  };

  const handleReject = async () => {
    if (!selectedClassId || !rejectReason.codeErreur) {
      setError("Veuillez sélectionner un motif de rejet");
      return;
    }

    try {
      setActionLoading("reject");
      await rejectionServiceClass.rejectClass(selectedClassId, rejectReason);
      setSuccessMessage("Classe rejetée avec succès");
      setRejectReason({ codeErreur: "", motifSupplementaire: "" });
      await fetchClassDetails(selectedClassId);
      await fetchAllClasses();
    } catch (error) {
      console.error("Error rejecting class:", error);
      setError("Erreur lors du rejet de la classe");
    } finally {
      setActionLoading(null);
    }
  };

  const showDeleteConfirm = () => {
    confirm({
      title: "Confirmer la suppression de la classe",
      icon: <ExclamationCircleOutlined />,
      content:
        "Êtes-vous sûr de vouloir supprimer définitivement cette classe ? Cette action est irréversible.",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: handleDelete,
    });
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

  // Handle member deletion
  const handleDeleteProfessor = async (professorId) => {
    try {
      await scholchatService.deleteProfessor(professorId);
      setSuccessMessage("Professeur supprimé avec succès");
      await fetchClassProfessors(selectedClassId);
    } catch (error) {
      console.error("Error deleting professor:", error);
      setError("Erreur lors de la suppression du professeur");
    }
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      await scholchatService.deleteStudent(studentId);
      setSuccessMessage("Étudiant supprimé avec succès");
      await fetchClassStudents(selectedClassId);
    } catch (error) {
      console.error("Error deleting student:", error);
      setError("Erreur lors de la suppression de l'étudiant");
    }
  };

  const handleDeleteParent = async (parentId) => {
    try {
      await scholchatService.deleteParent(parentId);
      setSuccessMessage("Parent supprimé avec succès");
      await fetchClassParents(selectedClassId);
    } catch (error) {
      console.error("Error deleting parent:", error);
      setError("Erreur lors de la suppression du parent");
    }
  };

  const renderStatusTag = (etat) => {
    let color, icon, text;
    switch (etat) {
      case "ACTIF":
        color = "#52c41a";
        icon = <CheckOutlined />;
        text = "Actif";
        break;
      case "EN_ATTENTE_APPROBATION":
        color = "#faad14";
        icon = <ClockCircleOutlined />;
        text = "En attente";
        break;
      case "INACTIF":
        color = "#f5222d";
        icon = <CloseOutlined />;
        text = "Inactif";
        break;
      default:
        color = "#d9d9d9";
        text = etat;
    }

    return (
      <Tag
        icon={icon}
        color={color}
        style={{
          fontWeight: 600,
          fontSize: "12px",
          padding: "4px 12px",
          borderRadius: "16px",
          border: "none",
        }}
      >
        {text}
      </Tag>
    );
  };

  // Streamlined action buttons
  const renderActionButtons = () => {
    if (!classData) return null;

    return (
      <Card
        size="small"
        style={{
          marginBottom: 20,
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
          border: "1px solid #e1e4e8",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <Space wrap size={[8, 8]} style={{ width: "100%" }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
            style={{ borderRadius: "8px" }}
          >
            Actualiser
          </Button>

          {classData.etat === "EN_ATTENTE_APPROBATION" && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleApprove}
                loading={actionLoading === "approve"}
                style={{ borderRadius: "8px" }}
              >
                Approuver
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={showRejectConfirm}
                loading={actionLoading === "reject"}
                style={{ borderRadius: "8px" }}
              >
                Rejeter
              </Button>
            </>
          )}

          <Button
            icon={<HistoryOutlined />}
            onClick={fetchActivationHistory}
            loading={actionLoading === "history"}
            style={{ borderRadius: "8px" }}
          >
            Historique
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={showDeleteConfirm}
            loading={actionLoading === "delete"}
            style={{ borderRadius: "8px" }}
          >
            Supprimer
          </Button>
        </Space>
      </Card>
    );
  };

  // Table columns for professors
  const professorColumns = [
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
      render: (text, record) => `${record.nom} ${record.prenom}`,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Téléphone",
      dataIndex: "telephone",
      key: "telephone",
    },
    {
      title: "Établissement",
      dataIndex: "nomEtablissement",
      key: "nomEtablissement",
    },
    {
      title: "Matricule",
      dataIndex: "matriculeProfesseur",
      key: "matriculeProfesseur",
    },
    {
      title: "État",
      dataIndex: "etat",
      key: "etat",
      render: (etat) => renderStatusTag(etat),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce professeur ?"
            onConfirm={() => handleDeleteProfessor(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Table columns for students
  const studentColumns = [
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
      render: (text, record) => `${record.nom} ${record.prenom}`,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Téléphone",
      dataIndex: "telephone",
      key: "telephone",
    },
    {
      title: "Niveau",
      dataIndex: "niveau",
      key: "niveau",
    },
    {
      title: "État",
      dataIndex: "etat",
      key: "etat",
      render: (etat) => renderStatusTag(etat),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cet étudiant ?"
            onConfirm={() => handleDeleteStudent(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Table columns for parents
  const parentColumns = [
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
      render: (text, record) => `${record.nom} ${record.prenom}`,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Téléphone",
      dataIndex: "telephone",
      key: "telephone",
    },
    {
      title: "Adresse",
      dataIndex: "adresse",
      key: "adresse",
    },
    {
      title: "État",
      dataIndex: "etat",
      key: "etat",
      render: (etat) => renderStatusTag(etat),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce parent ?"
            onConfirm={() => handleDeleteParent(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderClassMembersTabs = () => {
    return (
      <Card
        style={{
          marginTop: 20,
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <Tabs defaultActiveKey="professors" size="large">
          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Professeurs ({classProfessors.length})
              </span>
            }
            key="professors"
          >
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ borderRadius: "8px" }}
              >
                Ajouter Professeur
              </Button>
            </div>
            <Table
              columns={professorColumns}
              dataSource={classProfessors}
              loading={professorsLoading}
              rowKey="id"
              pagination={{
                current: professorsPagination.current,
                pageSize: professorsPagination.pageSize,
                total: professorsPagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} professeurs`,
                onChange: (page, pageSize) => {
                  setProfessorsPagination({
                    ...professorsPagination,
                    current: page,
                    pageSize: pageSize,
                  });
                },
              }}
              scroll={{ x: 800 }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <BookOutlined />
                Étudiants ({classStudents.length})
              </span>
            }
            key="students"
          >
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ borderRadius: "8px" }}
              >
                Ajouter Étudiant
              </Button>
            </div>
            <Table
              columns={studentColumns}
              dataSource={classStudents}
              loading={studentsLoading}
              rowKey="id"
              pagination={{
                current: studentsPagination.current,
                pageSize: studentsPagination.pageSize,
                total: studentsPagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} étudiants`,
                onChange: (page, pageSize) => {
                  setStudentsPagination({
                    ...studentsPagination,
                    current: page,
                    pageSize: pageSize,
                  });
                },
              }}
              scroll={{ x: 800 }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <UserAddOutlined />
                Parents ({classParents.length})
              </span>
            }
            key="parents"
          >
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ borderRadius: "8px" }}
              >
                Ajouter Parent
              </Button>
            </div>
            <Table
              columns={parentColumns}
              dataSource={classParents}
              loading={parentsLoading}
              rowKey="id"
              pagination={{
                current: parentsPagination.current,
                pageSize: parentsPagination.pageSize,
                total: parentsPagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} parents`,
                onChange: (page, pageSize) => {
                  setParentsPagination({
                    ...parentsPagination,
                    current: page,
                    pageSize: pageSize,
                  });
                },
              }}
              scroll={{ x: 800 }}
            />
          </TabPane>
        </Tabs>
      </Card>
    );
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <Card
        style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e1e4e8",
          overflow: "hidden",
        }}
      >
        {!selectedClassId ? (
          <div style={{ padding: "24px" }}>
            <div style={{ marginBottom: "24px" }}>
              <Space align="center" style={{ marginBottom: "16px" }}>
                <BookOutlined style={{ fontSize: "24px", color: "#4a6da7" }} />
                <Title level={2} style={{ margin: 0, color: "#2c3e50" }}>
                  Gestion des Classes
                </Title>
              </Space>
              <Text type="secondary" style={{ fontSize: "16px" }}>
                Gérez et supervisez toutes les classes de votre établissement
              </Text>
            </div>

            {/* Alert Messages */}
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                style={{ marginBottom: "16px", borderRadius: "8px" }}
                onClose={() => setError("")}
              />
            )}

            {successMessage && (
              <Alert
                message={successMessage}
                type="success"
                showIcon
                closable
                style={{ marginBottom: "16px", borderRadius: "8px" }}
                onClose={() => setSuccessMessage("")}
              />
            )}

            <ManageClassList
              classes={classes}
              loading={loading}
              error={error}
              successMessage={successMessage}
              refreshing={refreshing}
              onSelectClass={handleSelectClass}
              onRefresh={handleRefresh}
              onBack={onBack}
            />
          </div>
        ) : (
          <div style={{ padding: "24px" }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
                paddingBottom: "16px",
                borderBottom: "2px solid #f0f2f5",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToList}
                  style={{
                    marginRight: "16px",
                    borderRadius: "8px",
                    background: "#f8f9fa",
                    borderColor: "#e1e4e8",
                  }}
                />
                <div>
                  <Title level={3} style={{ margin: 0, color: "#2c3e50" }}>
                    <BookOutlined
                      style={{ marginRight: "8px", color: "#4a6da7" }}
                    />
                    Gestion de la classe
                  </Title>
                  <Text strong style={{ fontSize: "18px", color: "#4a6da7" }}>
                    {classData?.nom}
                  </Text>
                </div>
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {classData?.etat && renderStatusTag(classData.etat)}
                <div
                  style={{
                    padding: "8px 16px",
                    background:
                      "linear-gradient(135deg, #4a6da7 0%, #3a5069 100%)",
                    borderRadius: "20px",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                >
                  <TeamOutlined style={{ marginRight: "6px" }} />
                  {classData?.nombreEtudiants || 0} étudiants
                </div>
              </div>
            </div>

            {/* Alert Messages */}
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                style={{ marginBottom: "16px", borderRadius: "8px" }}
                onClose={() => setError("")}
              />
            )}

            {successMessage && (
              <Alert
                message={successMessage}
                type="success"
                showIcon
                closable
                style={{ marginBottom: "16px", borderRadius: "8px" }}
                onClose={() => setSuccessMessage("")}
              />
            )}

            {/* Loading Spinner */}
            {loading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "40px",
                }}
              >
                <Spin size="large" />
              </div>
            )}

            {/* Streamlined Action buttons */}
            {!loading && renderActionButtons()}

            {/* Class Details Card */}
            {!loading && classData && (
              <Card
                style={{
                  marginBottom: 20,
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <div style={{ padding: "16px" }}>
                  <Title
                    level={4}
                    style={{ marginBottom: "16px", color: "#2c3e50" }}
                  >
                    Informations de la classe
                  </Title>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <Text strong>Nom:</Text>
                      <div>{classData.nom}</div>
                    </div>
                    <div>
                      <Text strong>Description:</Text>
                      <div>{classData.description || "N/A"}</div>
                    </div>
                    <div>
                      <Text strong>Établissement:</Text>
                      <div>{classData.nomEtablissement || "N/A"}</div>
                    </div>
                    <div>
                      <Text strong>Niveau:</Text>
                      <div>{classData.niveau || "N/A"}</div>
                    </div>
                    <div>
                      <Text strong>Modérateur:</Text>
                      <div>
                        {classData.moderator
                          ? `${classData.moderator.nom} ${classData.moderator.prenom}`
                          : "Aucun"}
                      </div>
                    </div>
                    <div>
                      <Text strong>Droits de publication:</Text>
                      <div>
                        {classData.droitPublication || "PROFESSEURS_SEULEMENT"}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Class Members Tables */}
            {!loading && classData && renderClassMembersTabs()}

            {/* Modals */}
            {/* History Modal */}
            <Modal
              title="Historique d'activation"
              visible={historyModalVisible}
              onCancel={() => setHistoryModalVisible(false)}
              footer={null}
              width={800}
            >
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {history.length === 0 ? (
                  <Text type="secondary">Aucun historique disponible</Text>
                ) : (
                  history.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid #f0f0f0",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text strong>{item.action}</Text>
                        <Text type="secondary">{item.date}</Text>
                      </div>
                      <Text>{item.description}</Text>
                    </div>
                  ))
                )}
              </div>
            </Modal>

            {/* Moderator Assignment Modal */}
            <Modal
              title="Assigner un modérateur"
              visible={moderatorModalVisible}
              onCancel={() => setModeratorModalVisible(false)}
              footer={null}
            >
              <Form
                form={form}
                onFinish={handleModeratorAssign}
                layout="vertical"
              >
                <Form.Item
                  name="moderatorId"
                  label="Sélectionner un professeur"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner un professeur",
                    },
                  ]}
                >
                  <Select placeholder="Choisir un professeur">
                    {professors.map((prof) => (
                      <Option key={prof.id} value={prof.id}>
                        {prof.nom} {prof.prenom} - {prof.email}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={actionLoading === "moderator"}
                    >
                      Assigner
                    </Button>
                    <Button onClick={() => setModeratorModalVisible(false)}>
                      Annuler
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>

            {/* Publication Rights Modal */}
            <Modal
              title="Modifier les droits de publication"
              visible={publicationRightsModalVisible}
              onCancel={() => setPublicationRightsModalVisible(false)}
              footer={null}
            >
              <Form layout="vertical">
                <Form.Item label="Droits de publication">
                  <Select
                    value={selectedPublicationRight}
                    onChange={setSelectedPublicationRight}
                    placeholder="Sélectionner les droits"
                  >
                    <Option value="PROFESSEURS_SEULEMENT">
                      Professeurs seulement
                    </Option>
                    <Option value="TOUS">Tous les membres</Option>
                    <Option value="MODERATEUR_SEULEMENT">
                      Modérateur seulement
                    </Option>
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      onClick={handlePublicationRightsUpdate}
                      loading={actionLoading === "publicationRights"}
                    >
                      Mettre à jour
                    </Button>
                    <Button
                      onClick={() => setPublicationRightsModalVisible(false)}
                    >
                      Annuler
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ManageClassContent;
