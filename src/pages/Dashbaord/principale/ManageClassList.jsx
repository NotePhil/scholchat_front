import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Avatar,
  Tag,
  List,
  Badge,
  Spin,
  Empty,
  Alert,
  Divider,
  Pagination,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input as AntInput,
  DatePicker as AntDatePicker,
  Tooltip,
  Dropdown,
  Menu,
} from "antd";
import {
  BookOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  ReloadOutlined,
  SearchOutlined,
  ClearOutlined,
  ArrowLeftOutlined,
  TrophyOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckOutlined,
  PoweroffOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  CalendarOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { classService, EtatClasse } from "../../../services/ClassService";
import ClassModals from "./ClassModals";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { confirm } = Modal;

const ManageClassList = ({
  classes = [],
  loading = false,
  error,
  successMessage,
  refreshing = false,
  onSelectClass = () => {},
  onRefresh = () => {},
  onBack,
  onNavigateToCreate,
  userRole = "professeur",
}) => {
  // State for filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [niveauFilter, setNiveauFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [sortBy, setSortBy] = useState("dateCreation");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pendingRequests, setPendingRequests] = useState({});

  // Modal and action states
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(null);
  const [showDeactivationModal, setShowDeactivationModal] = useState(null);
  const [showAccessRequestModal, setShowAccessRequestModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [deactivationReason, setDeactivationReason] = useState("");
  const [deactivationComment, setDeactivationComment] = useState("");

  // Fetch pending access requests for classes
  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const classIds = classes.map((c) => c.id);
        if (classIds.length === 0) return;

        const response = await fetch(
          `http://localhost:8486/scholchat/acceder/classes/demandes?classeIds=${classIds.join(
            ","
          )}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pending requests");
        }

        const requests = await response.json();
        const requestsCount = {};

        requests.forEach((request) => {
          if (request.status === "PENDING") {
            requestsCount[request.classeId] =
              (requestsCount[request.classeId] || 0) + 1;
          }
        });

        setPendingRequests(requestsCount);
      } catch (error) {
        console.error("Error fetching pending requests:", error);
      }
    };

    fetchPendingRequests();

    // Set up polling for new requests
    const interval = setInterval(fetchPendingRequests, 300000); // Poll every 5 minutes

    return () => clearInterval(interval);
  }, [classes]);

  const getStatusColor = (etat) => {
    switch (etat) {
      case EtatClasse.ACTIF:
        return "green";
      case EtatClasse.EN_ATTENTE_APPROBATION:
        return "gold";
      case EtatClasse.INACTIF:
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (etat) => {
    return classService.getEtatDisplayName(etat);
  };

  const getStatusIcon = (etat) => {
    switch (etat) {
      case EtatClasse.ACTIF:
        return <CheckOutlined />;
      case EtatClasse.EN_ATTENTE_APPROBATION:
        return <ClockCircleOutlined />;
      case EtatClasse.INACTIF:
        return <PoweroffOutlined />;
      default:
        return <ExclamationCircleOutlined />;
    }
  };

  const sortedAndFilteredClasses = useMemo(() => {
    let filtered = classes.filter((classe) => {
      const matchesSearch =
        classe.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classe.niveau.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || classe.etat === statusFilter;
      const matchesNiveau =
        niveauFilter === "all" || classe.niveau === niveauFilter;

      const matchesDate =
        !dateRange ||
        !dateRange[0] ||
        !dateRange[1] ||
        (new Date(classe.dateCreation) >= dateRange[0].toDate() &&
          new Date(classe.dateCreation) <= dateRange[1].toDate());

      return matchesSearch && matchesStatus && matchesNiveau && matchesDate;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "dateCreation") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === "eleveCount") {
        aValue = a.eleves?.length || 0;
        bValue = b.eleves?.length || 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    classes,
    searchTerm,
    statusFilter,
    niveauFilter,
    dateRange,
    sortBy,
    sortOrder,
  ]);

  const paginatedClasses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedAndFilteredClasses.slice(startIndex, startIndex + pageSize);
  }, [sortedAndFilteredClasses, currentPage, pageSize]);

  const totalClasses = classes.length;
  const activeClasses = classes.filter(
    (c) => c.etat === EtatClasse.ACTIF
  ).length;
  const pendingClasses = classes.filter(
    (c) => c.etat === EtatClasse.EN_ATTENTE_APPROBATION
  ).length;
  const totalStudents = classes.reduce(
    (sum, c) => sum + (c.eleves?.length || 0),
    0
  );
  const totalParents = classes.reduce(
    (sum, c) => sum + (c.parents?.length || 0),
    0
  );

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setNiveauFilter("all");
    setDateRange(null);
    setSortBy("dateCreation");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const uniqueNiveaux = [...new Set(classes.map((c) => c.niveau))];

  // Action handlers
  const handleEdit = (classe) => {
    setEditingClass(classe);
  };

  const handleEditSave = async (updatedClass) => {
    try {
      setActionLoading("edit");
      await classService.modifierClasse(updatedClass.id, updatedClass);
      await onRefresh();
      setEditingClass(null);
    } catch (error) {
      console.error("Error updating class:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (classId) => {
    try {
      setActionLoading(classId);
      await classService.approuverClasse(classId);
      await onRefresh();
      setShowApprovalModal(null);
    } catch (error) {
      console.error("Error approving class:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (classId, motif) => {
    try {
      setActionLoading(classId);
      await classService.rejeterClasse(classId, motif);
      await onRefresh();
      setShowApprovalModal(null);
    } catch (error) {
      console.error("Error rejecting class:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivation = async (classId, motif, commentaire) => {
    try {
      setActionLoading(classId);
      console.log("Deactivating class:", { classId, motif, commentaire });
      await onRefresh();
      setShowDeactivationModal(null);
      setDeactivationReason("");
      setDeactivationComment("");
    } catch (error) {
      console.error("Error deactivating class:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccessRequest = async () => {
    try {
      setActionLoading("access-request");
      console.log("Processing access request with token:", accessToken);
      setShowAccessRequestModal(false);
      setAccessToken("");
    } catch (error) {
      console.error("Error processing access request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (classId) => {
    try {
      setActionLoading(classId);
      await classService.supprimerClasse(classId);
      await onRefresh();
      setShowDeleteModal(null);
    } catch (error) {
      console.error("Error deleting class:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageClass = (classe) => {
    if (onSelectClass) {
      onSelectClass(classe.id);
    }
  };

  const getClassActions = (classe) => {
    const actions = [
      {
        key: "view",
        label: "Voir les détails",
        icon: <EyeOutlined />,
        onClick: () => setSelectedClass(classe),
      },
      {
        key: "manage",
        label: "Gérer la classe",
        icon: <SettingOutlined />,
        onClick: () => handleManageClass(classe),
      },
      {
        key: "edit",
        label: "Modifier",
        icon: <EditOutlined />,
        onClick: () => handleEdit(classe),
      },
    ];

    if (
      userRole === "etablissement" &&
      classe.etat === EtatClasse.EN_ATTENTE_APPROBATION
    ) {
      actions.push({
        key: "approve",
        label: "Approuver",
        icon: <CheckOutlined />,
        onClick: () => setShowApprovalModal(classe),
      });
    }

    if (
      (userRole === "etablissement" || userRole === "administrateur") &&
      classe.etat === EtatClasse.ACTIF
    ) {
      actions.push({
        key: "deactivate",
        label: "Désactiver",
        icon: <PoweroffOutlined />,
        onClick: () => setShowDeactivationModal(classe),
      });
    }

    actions.push({
      key: "delete",
      label: "Supprimer",
      icon: <DeleteOutlined />,
      onClick: () => setShowDeleteModal(classe),
      danger: true,
    });

    return actions;
  };

  const sortMenu = (
    <Menu
      onClick={({ key }) => {
        const [sortField, order] = key.split("-");
        setSortBy(sortField);
        setSortOrder(order);
      }}
      items={[
        {
          key: "dateCreation-desc",
          label: "Date de création (récent)",
          icon: <CalendarOutlined />,
        },
        {
          key: "dateCreation-asc",
          label: "Date de création (ancien)",
          icon: <CalendarOutlined />,
        },
        {
          key: "nom-asc",
          label: "Nom (A-Z)",
          icon: <SortAscendingOutlined />,
        },
        {
          key: "nom-desc",
          label: "Nom (Z-A)",
          icon: <SortAscendingOutlined />,
        },
        {
          key: "eleveCount-desc",
          label: "Nombre d'élèves (desc)",
          icon: <TeamOutlined />,
        },
        {
          key: "eleveCount-asc",
          label: "Nombre d'élèves (asc)",
          icon: <TeamOutlined />,
        },
      ]}
    />
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "16px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header Section */}
        <Card
          style={{
            borderRadius: "20px",
            marginBottom: "24px",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: "none",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
          bodyStyle={{ padding: "32px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {onBack && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={onBack}
                  type="text"
                  size="large"
                  style={{
                    color: "#667eea",
                    borderRadius: "12px",
                    padding: "8px 16px",
                  }}
                />
              )}
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "16px",
                    padding: "16px",
                    color: "white",
                    fontSize: "24px",
                  }}
                >
                  <BookOutlined />
                </div>
                <div>
                  <Title
                    level={1}
                    style={{
                      margin: 0,
                      color: "#2d3748",
                      fontSize: "32px",
                      fontWeight: "700",
                    }}
                  >
                    Gestion des Classes
                  </Title>
                  <Text
                    style={{
                      fontSize: "16px",
                      color: "#718096",
                      marginTop: "4px",
                    }}
                  >
                    Gérez et supervisez toutes les classes de votre
                    établissement
                  </Text>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Button
                icon={<ReloadOutlined />}
                loading={refreshing}
                onClick={onRefresh}
                size="large"
                style={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                Actualiser
              </Button>
              {userRole === "professeur" && (
                <>
                  <Button
                    icon={<CheckOutlined />}
                    onClick={() => setShowAccessRequestModal(true)}
                    size="large"
                    style={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    Accès Token
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onNavigateToCreate}
                    size="large"
                    style={{
                      borderRadius: "12px",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
                    }}
                  >
                    Nouvelle Classe
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Messages */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{
              marginBottom: "24px",
              borderRadius: "16px",
              border: "none",
              boxShadow: "0 4px 16px rgba(245, 101, 101, 0.2)",
            }}
          />
        )}

        {successMessage && (
          <Alert
            message={successMessage}
            type="success"
            showIcon
            closable
            style={{
              marginBottom: "24px",
              borderRadius: "16px",
              border: "none",
              boxShadow: "0 4px 16px rgba(72, 187, 120, 0.2)",
            }}
          />
        )}

        {/* Statistics Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
          <Col xs={12} sm={6} md={6} lg={6}>
            <Card
              style={{
                borderRadius: "20px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                color: "white",
                textAlign: "center",
                minHeight: "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <div>
                <BookOutlined
                  style={{ fontSize: "32px", marginBottom: "12px" }}
                />
                <Title
                  level={2}
                  style={{ margin: 0, color: "white", fontSize: "28px" }}
                >
                  {totalClasses}
                </Title>
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "14px",
                  }}
                >
                  Total Classes
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={6} lg={6}>
            <Card
              style={{
                borderRadius: "20px",
                background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
                border: "none",
                color: "white",
                textAlign: "center",
                minHeight: "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <div>
                <TrophyOutlined
                  style={{ fontSize: "32px", marginBottom: "12px" }}
                />
                <Title
                  level={2}
                  style={{ margin: 0, color: "white", fontSize: "28px" }}
                >
                  {activeClasses}
                </Title>
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "14px",
                  }}
                >
                  Classes Actives
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={6} lg={6}>
            <Card
              style={{
                borderRadius: "20px",
                background: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
                border: "none",
                color: "white",
                textAlign: "center",
                minHeight: "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <div>
                <TeamOutlined
                  style={{ fontSize: "32px", marginBottom: "12px" }}
                />
                <Title
                  level={2}
                  style={{ margin: 0, color: "white", fontSize: "28px" }}
                >
                  {totalStudents}
                </Title>
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "14px",
                  }}
                >
                  Total Élèves
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={6} lg={6}>
            <Card
              style={{
                borderRadius: "20px",
                background: "linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)",
                border: "none",
                color: "white",
                textAlign: "center",
                minHeight: "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <div>
                <UserOutlined
                  style={{ fontSize: "32px", marginBottom: "12px" }}
                />
                <Title
                  level={2}
                  style={{ margin: 0, color: "white", fontSize: "28px" }}
                >
                  {totalParents}
                </Title>
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "14px",
                  }}
                >
                  Total Parents
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Card
          style={{
            borderRadius: "20px",
            marginBottom: "32px",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: "none",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8} lg={8}>
              <Input
                placeholder="Rechercher une classe..."
                prefix={<SearchOutlined style={{ color: "#667eea" }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="large"
                style={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
              />
            </Col>
            <Col xs={12} sm={6} md={4} lg={4}>
              <Select
                placeholder="Statut"
                value={statusFilter}
                onChange={setStatusFilter}
                size="large"
                style={{ width: "100%" }}
                suffixIcon={<FilterOutlined style={{ color: "#667eea" }} />}
              >
                <Option value="all">Tous les statuts</Option>
                <Option value={EtatClasse.ACTIF}>Actif</Option>
                <Option value={EtatClasse.EN_ATTENTE_APPROBATION}>
                  En attente
                </Option>
                <Option value={EtatClasse.INACTIF}>Inactif</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={4} lg={4}>
              <Select
                placeholder="Niveau"
                value={niveauFilter}
                onChange={setNiveauFilter}
                size="large"
                style={{ width: "100%" }}
                suffixIcon={<BookOutlined style={{ color: "#667eea" }} />}
              >
                <Option value="all">Tous les niveaux</Option>
                {uniqueNiveaux.map((niveau) => (
                  <Option key={niveau} value={niveau}>
                    {niveau}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={4} lg={4}>
              <RangePicker
                style={{ width: "100%" }}
                size="large"
                value={dateRange}
                onChange={setDateRange}
                placeholder={["Date début", "Date fin"]}
              />
            </Col>
            <Col xs={6} sm={3} md={2} lg={2}>
              <Dropdown overlay={sortMenu} trigger={["click"]}>
                <Button
                  icon={<SortAscendingOutlined />}
                  size="large"
                  style={{
                    width: "100%",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  Trier
                </Button>
              </Dropdown>
            </Col>
            <Col xs={6} sm={3} md={2} lg={2}>
              <Button
                icon={<ClearOutlined />}
                onClick={clearFilters}
                size="large"
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                Effacer
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Classes Grid */}
        <Card
          style={{
            borderRadius: "20px",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: "none",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
          bodyStyle={{ padding: "32px" }}
        >
          {loading && classes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <Spin size="large" />
            </div>
          ) : sortedAndFilteredClasses.length === 0 ? (
            <Empty
              image="/api/placeholder/400/300"
              description={
                <div>
                  <Title level={4} style={{ color: "#4a5568" }}>
                    Aucune classe trouvée
                  </Title>
                  <Text type="secondary">
                    Aucune classe ne correspond à vos critères de recherche
                  </Text>
                </div>
              }
              style={{ padding: "80px 0" }}
            />
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                  gap: "24px",
                  marginBottom: "32px",
                }}
              >
                {paginatedClasses.map((classe) => (
                  <Badge
                    key={classe.id}
                    count={pendingRequests[classe.id] || 0}
                    offset={[-10, 10]}
                    style={{
                      backgroundColor: "#ff4d4f",
                      boxShadow: "0 0 0 1px #fff",
                    }}
                  >
                    <Card
                      hoverable
                      style={{
                        borderRadius: "20px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                        transition: "all 0.3s ease",
                        overflow: "hidden",
                      }}
                      bodyStyle={{ padding: "24px" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 40px rgba(0, 0, 0, 0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 20px rgba(0, 0, 0, 0.08)";
                      }}
                    >
                      {/* Class Card Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "20px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: "8px",
                            }}
                          >
                            <div
                              style={{
                                background:
                                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                borderRadius: "12px",
                                padding: "12px",
                                color: "white",
                              }}
                            >
                              <BookOutlined style={{ fontSize: "20px" }} />
                            </div>
                            <div>
                              <Title
                                level={4}
                                style={{ margin: 0, color: "#2d3748" }}
                              >
                                {classe.nom}
                              </Title>
                              <Text
                                type="secondary"
                                style={{ fontSize: "14px" }}
                              >
                                {classe.niveau}
                              </Text>
                            </div>
                          </div>
                          <Tag
                            color={getStatusColor(classe.etat)}
                            icon={getStatusIcon(classe.etat)}
                            style={{
                              borderRadius: "8px",
                              padding: "4px 12px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            {getStatusText(classe.etat)}
                          </Tag>
                        </div>
                        <Dropdown
                          overlay={
                            <Menu
                              items={getClassActions(classe).map((action) => ({
                                key: action.key,
                                label: action.label,
                                icon: action.icon,
                                onClick: action.onClick,
                                danger: action.danger,
                              }))}
                            />
                          }
                          trigger={["click"]}
                          placement="bottomRight"
                        >
                          <Button
                            type="text"
                            icon={<MoreOutlined />}
                            style={{
                              borderRadius: "8px",
                              color: "#667eea",
                            }}
                          />
                        </Dropdown>
                      </div>

                      {/* Class Stats */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "16px",
                          marginBottom: "20px",
                        }}
                      >
                        <div
                          style={{
                            background:
                              "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                            borderRadius: "12px",
                            padding: "16px",
                            textAlign: "center",
                          }}
                        >
                          <TeamOutlined
                            style={{
                              fontSize: "20px",
                              color: "#667eea",
                              marginBottom: "8px",
                            }}
                          />
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: "600",
                              color: "#2d3748",
                            }}
                          >
                            {classe.eleves?.length || 0}
                          </div>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            Élèves
                          </Text>
                        </div>
                        <div
                          style={{
                            background:
                              "linear-gradient(135deg, #48bb7815 0%, #38a16915 100%)",
                            borderRadius: "12px",
                            padding: "16px",
                            textAlign: "center",
                          }}
                        >
                          <UserOutlined
                            style={{
                              fontSize: "20px",
                              color: "#48bb78",
                              marginBottom: "8px",
                            }}
                          />
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: "600",
                              color: "#2d3748",
                            }}
                          >
                            {classe.parents?.length || 0}
                          </div>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            Parents
                          </Text>
                        </div>
                      </div>

                      {/* Class Date */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "12px 16px",
                          background: "#f8fafc",
                          borderRadius: "12px",
                          marginBottom: "20px",
                        }}
                      >
                        <CalendarOutlined style={{ color: "#667eea" }} />
                        <Text type="secondary" style={{ fontSize: "14px" }}>
                          Créée le{" "}
                          {new Date(classe.dateCreation).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </Text>
                      </div>

                      {/* Action Buttons */}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <Button
                          type="primary"
                          icon={<EyeOutlined />}
                          onClick={() => setSelectedClass(classe)}
                          style={{
                            borderRadius: "10px",
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            flex: 1,
                            minWidth: "120px",
                          }}
                        >
                          Voir
                        </Button>
                        <Button
                          icon={<SettingOutlined />}
                          onClick={() => handleManageClass(classe)}
                          style={{
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            flex: 1,
                            minWidth: "120px",
                          }}
                        >
                          Gérer
                        </Button>
                      </div>
                    </Card>
                  </Badge>
                ))}
              </div>

              {/* Pagination */}
              {sortedAndFilteredClasses.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                    paddingTop: "24px",
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <Text type="secondary" style={{ fontSize: "14px" }}>
                    Affichage de {(currentPage - 1) * pageSize + 1} à{" "}
                    {Math.min(
                      currentPage * pageSize,
                      sortedAndFilteredClasses.length
                    )}{" "}
                    sur {sortedAndFilteredClasses.length} classes
                  </Text>
                  <Pagination
                    current={currentPage}
                    total={sortedAndFilteredClasses.length}
                    pageSize={pageSize}
                    onChange={(page) => setCurrentPage(page)}
                    onShowSizeChange={(current, size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    showSizeChanger
                    showQuickJumper
                    showTotal={false}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    itemRender={(page, type, originalElement) => {
                      if (type === "prev") {
                        return (
                          <Button style={{ borderRadius: "8px" }}>
                            Précédent
                          </Button>
                        );
                      }
                      if (type === "next") {
                        return (
                          <Button style={{ borderRadius: "8px" }}>
                            Suivant
                          </Button>
                        );
                      }
                      return originalElement;
                    }}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Modals */}
      <ClassModals
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        editingClass={editingClass}
        setEditingClass={setEditingClass}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        showApprovalModal={showApprovalModal}
        setShowApprovalModal={setShowApprovalModal}
        showDeactivationModal={showDeactivationModal}
        setShowDeactivationModal={setShowDeactivationModal}
        showAccessRequestModal={showAccessRequestModal}
        setShowAccessRequestModal={setShowAccessRequestModal}
        actionLoading={actionLoading}
        setActionLoading={setActionLoading}
        accessToken={accessToken}
        setAccessToken={setAccessToken}
        deactivationReason={deactivationReason}
        setDeactivationReason={setDeactivationReason}
        deactivationComment={deactivationComment}
        setDeactivationComment={setDeactivationComment}
        handleApprove={handleApprove}
        handleReject={handleReject}
        handleDeactivation={handleDeactivation}
        handleAccessRequest={handleAccessRequest}
        handleDelete={handleDelete}
        handleEditSave={handleEditSave}
        getStatusColor={getStatusColor}
      />
    </div>
  );
};

export default ManageClassList;
