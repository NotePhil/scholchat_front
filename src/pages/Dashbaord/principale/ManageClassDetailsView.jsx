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
  UserOutlined,
} from "@ant-design/icons";
import { classService } from "../../../services/ClassService";
import { rejectionServiceClass } from "../../../services/RejectionServiceClass";
import { scholchatService } from "../../../services/ScholchatService";
import UserViewModalParentStudent from "./modals/UserViewModalParentStudent";
import ClassAccessRequests from "./ClassAccessRequests";

const { Text, Title } = Typography;
const { Option } = Select;
const { confirm } = Modal;
const { TabPane } = Tabs;

const ManageClassDetailsView = ({
  classId,
  onBack,
  onRefresh,
  onError,
  onSuccess,
}) => {
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Modal states
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [moderatorModalVisible, setModeratorModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [publicationRightsModalVisible, setPublicationRightsModalVisible] =
    useState(false);
  const [rejectionMotifs, setRejectionMotifs] = useState([]);
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [parentModalVisible, setParentModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form and data states
  const [form] = Form.useForm();
  const [history, setHistory] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [rejectReason, setRejectReason] = useState({
    codeErreur: "",
    motifSupplementaire: "",
  });
  const [selectedPublicationRight, setSelectedPublicationRight] = useState("");

  // Class members states
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

  useEffect(() => {
    if (classId) {
      fetchClassDetails(classId);
      fetchClassMembers(classId);
      fetchProfessors();
      fetchRejectionMotifs();
    }
  }, [classId]);

  const fetchClassDetails = async (classId) => {
    try {
      setLoading(true);
      onError("");
      const data = await classService.obtenirClasseParId(classId);
      setClassData(data);
      setSelectedPublicationRight(
        data.droitPublication || "PROFESSEURS_SEULEMENT"
      );
    } catch (error) {
      console.error("Error fetching class details:", error);
      onError("Erreur lors du chargement des détails de la classe");
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
      onError("Erreur lors du chargement des professeurs");
    } finally {
      setProfessorsLoading(false);
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      setStudentsLoading(true);
      const allStudents = await scholchatService.getAllStudents();
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
      onError("Erreur lors du chargement des étudiants");
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchClassParents = async (classId) => {
    try {
      setParentsLoading(true);
      const allParents = await scholchatService.getAllParents();
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
      onError("Erreur lors du chargement des parents");
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

  const fetchActivationHistory = async () => {
    if (!classId) return;

    try {
      setActionLoading("history");
      const data = await classService.obtenirHistoriqueActivation(classId);
      setHistory(data || []);
      setHistoryModalVisible(true);
    } catch (error) {
      console.error("Error fetching activation history:", error);
      onError("Erreur lors du chargement de l'historique");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    if (!classId) return;

    try {
      setActionLoading("approve");
      await classService.approuverClasse(classId);
      onSuccess("Classe approuvée avec succès");
      await fetchClassDetails(classId);
    } catch (error) {
      console.error("Error approving class:", error);
      onError("Erreur lors de l'approbation de la classe");
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
          <Form layout="vertical" form={form}>
            <Form.Item
              label="Motifs de rejet"
              name="codesErreur"
              rules={[
                {
                  required: true,
                  message: "Veuillez sélectionner au moins un motif",
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Sélectionner un ou plusieurs motifs"
              >
                {rejectionMotifs.map((motif) => (
                  <Option key={motif.code} value={motif.code}>
                    {motif.descriptif}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Commentaire supplémentaire"
              name="motifSupplementaire"
            >
              <Input.TextArea
                rows={3}
                placeholder="Détails supplémentaires (optionnel)"
              />
            </Form.Item>
          </Form>
        </div>
      ),
      okText: "Confirmer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          const values = await form.validateFields();
          await handleReject(values); // Pass the form values to handleReject
        } catch (error) {
          console.error("Validation failed:", error);
          return Promise.reject(error);
        }
      },
      onCancel: () => {
        form.resetFields();
      },
    });
  };

  // Updated handleReject function to accept form values
  const handleReject = async (formValues) => {
    if (!classId) {
      onError("ID de classe manquant");
      return;
    }

    // Use form values if provided, otherwise fall back to state
    const rejectionData = formValues || rejectReason;

    if (!rejectionData.codesErreur || rejectionData.codesErreur.length === 0) {
      onError("Veuillez sélectionner au moins un motif de rejet");
      return;
    }

    try {
      setActionLoading("reject");

      // Call the API with the rejection data
      await rejectionServiceClass.rejectClass(classId, {
        codesErreur: rejectionData.codesErreur,
        motifSupplementaire: rejectionData.motifSupplementaire || "",
      });

      onSuccess("Classe rejetée avec succès");

      // Reset form and state
      form.resetFields();
      setRejectReason({ codesErreur: [], motifSupplementaire: "" });

      // Refresh class details
      await fetchClassDetails(classId);
    } catch (error) {
      console.error("Error rejecting class:", error);
      onError("Erreur lors du rejet de la classe");
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
    if (!classId) return;

    try {
      setActionLoading("delete");
      await classService.supprimerClasse(classId);
      message.success("Classe supprimée avec succès");
      onBack();
    } catch (error) {
      console.error("Error deleting class:", error);
      onError("Erreur lors de la suppression de la classe");
      setActionLoading(null);
    }
  };

  const handleModeratorAssign = async (values) => {
    if (!classId) return;

    try {
      setActionLoading("moderator");
      await classService.assignerModerateur(classId, values.moderatorId);
      onSuccess("Modérateur assigné avec succès");
      setModeratorModalVisible(false);
      form.resetFields();
      await fetchClassDetails(classId);
    } catch (error) {
      console.error("Error assigning moderator:", error);
      onError("Erreur lors de l'assignation du modérateur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleModeratorRemove = async () => {
    if (!classId) return;

    try {
      setActionLoading("removeModerator");
      await classService.retirerModerateur(classId);
      onSuccess("Modérateur retiré avec succès");
      await fetchClassDetails(classId);
    } catch (error) {
      console.error("Error removing moderator:", error);
      onError("Erreur lors du retrait du modérateur");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublicationRightsUpdate = async () => {
    if (!classId || !selectedPublicationRight) {
      onError("Veuillez sélectionner un droit de publication");
      return;
    }

    try {
      setActionLoading("publicationRights");
      await classService.modifierDroitPublication(
        classId,
        selectedPublicationRight
      );
      onSuccess("Droits de publication mis à jour avec succès");
      setPublicationRightsModalVisible(false);
      await fetchClassDetails(classId);
    } catch (error) {
      console.error("Error updating publication rights:", error);
      onError("Erreur lors de la mise à jour des droits de publication");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProfessor = async (professorId) => {
    try {
      await scholchatService.deleteProfessor(professorId);
      onSuccess("Professeur supprimé avec succès");
      await fetchClassProfessors(classId);
    } catch (error) {
      console.error("Error deleting professor:", error);
      onError("Erreur lors de la suppression du professeur");
    }
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      await scholchatService.deleteStudent(studentId);
      onSuccess("Étudiant supprimé avec succès");
      await fetchClassStudents(classId);
    } catch (error) {
      console.error("Error deleting student:", error);
      onError("Erreur lors de la suppression de l'étudiant");
    }
  };

  const handleDeleteParent = async (parentId) => {
    try {
      await scholchatService.deleteParent(parentId);
      onSuccess("Parent supprimé avec succès");
      await fetchClassParents(classId);
    } catch (error) {
      console.error("Error deleting parent:", error);
      onError("Erreur lors de la suppression du parent");
    }
  };

  const renderStatusTag = (etat) => {
    let color, icon, text;
    switch (etat) {
      case "ACTIF":
      case "ACTIVE":
        color = "#52c41a";
        icon = <CheckOutlined />;
        text = "Actif";
        break;
      case "EN_ATTENTE_APPROBATION":
      case "PENDING":
        color = "#faad14";
        icon = <ClockCircleOutlined />;
        text = "En attente";
        break;
      case "INACTIF":
      case "INACTIVE":
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
            onClick={onRefresh}
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
                style={{
                  borderRadius: "8px",
                  background: "#52c41a",
                  borderColor: "#52c41a",
                }}
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

          <TabPane
            tab={
              <span>
                <ExclamationCircleOutlined />
                Demandes d'accès
              </span>
            }
            key="accessRequests"
          >
            <ClassAccessRequests
              classId={classId}
              onError={onError}
              onSuccess={onSuccess}
              onRefreshMembers={() => fetchClassMembers(classId)}
            />
          </TabPane>
        </Tabs>
      </Card>
    );
  };

  return (
    <div style={{ padding: "24px" }}>
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
            onClick={onBack}
            style={{
              marginRight: "16px",
              borderRadius: "8px",
              background: "#f8f9fa",
              borderColor: "#e1e4e8",
            }}
          />
          <div>
            <Title level={3} style={{ margin: 0, color: "#2c3e50" }}>
              <BookOutlined style={{ marginRight: "8px", color: "#4a6da7" }} />
              Gestion de la classe
            </Title>
            <Text strong style={{ fontSize: "18px", color: "#4a6da7" }}>
              {classData?.nom}
            </Text>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {classData?.etat && renderStatusTag(classData.etat)}
          <div
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, #4a6da7 0%, #3a5069 100%)",
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

      {!loading && renderActionButtons()}

      {!loading && classData && (
        <Card
          style={{
            marginBottom: 20,
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ padding: "16px" }}>
            <Title level={4} style={{ marginBottom: "16px", color: "#2c3e50" }}>
              Informations de la classe
            </Title>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
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

      {!loading && classData && renderClassMembersTabs()}

      {/* Modals */}
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
                key={item.id}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #f0f0f0",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text strong>
                    {item.active ? "Activation" : "Désactivation"} -{" "}
                    {item.etatClasse}
                  </Text>
                  <Text type="secondary">
                    {new Date(item.dateActivation).toLocaleString()}
                  </Text>
                </div>

                <div style={{ marginTop: 8 }}>
                  <Text>Utilisateur ID: {item.utilisateurId}</Text>
                </div>

                {item.dateDesactivation && (
                  <div style={{ marginTop: 8 }}>
                    <Text>Date de désactivation: </Text>
                    <Text>
                      {new Date(item.dateDesactivation).toLocaleString()}
                    </Text>
                  </div>
                )}

                {item.motifDesactivation && (
                  <div style={{ marginTop: 8 }}>
                    <Text>Motif: </Text>
                    <Text>{item.motifDesactivation}</Text>
                  </div>
                )}

                <div style={{ marginTop: 8 }}>
                  <Text>Statut: </Text>
                  <Tag color={item.active ? "green" : "red"}>
                    {item.active ? "Actif" : "Inactif"}
                  </Tag>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal
        title="Assigner un modérateur"
        visible={moderatorModalVisible}
        onCancel={() => setModeratorModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleModeratorAssign} layout="vertical">
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
              <Option value="MODERATEUR_SEULEMENT">Modérateur seulement</Option>
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
              <Button onClick={() => setPublicationRightsModalVisible(false)}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Student and Parent Modals */}
      {studentModalVisible && (
        <UserViewModalParentStudent
          user={selectedUser}
          onClose={() => setStudentModalVisible(false)}
          userType="student"
        />
      )}

      {parentModalVisible && (
        <UserViewModalParentStudent
          user={selectedUser}
          onClose={() => setParentModalVisible(false)}
          userType="parent"
        />
      )}
    </div>
  );
};

export default ManageClassDetailsView;
