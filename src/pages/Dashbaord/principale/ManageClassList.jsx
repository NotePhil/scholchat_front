import React, { useState, useMemo } from "react";
import {
  List,
  Avatar,
  Button,
  Card,
  Empty,
  Alert,
  Space,
  Spin,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Badge,
  Pagination,
  Input,
  Select,
  DatePicker,
  Divider,
} from "antd";
import {
  BookOutlined,
  BankOutlined,
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Mock data generator for demonstration
const generateMockClasses = (count = 50) => {
  const niveaux = ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"];
  const etats = ["ACTIF", "EN_ATTENTE_APPROBATION", "INACTIF"];

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    nom: `Classe ${String.fromCharCode(65 + (index % 26))}${
      Math.floor(index / 26) + 1
    }`,
    niveau: niveaux[index % niveaux.length],
    etat: etats[index % etats.length],
    eleves: Array.from(
      { length: Math.floor(Math.random() * 35) + 15 },
      (_, i) => ({ id: i })
    ),
    parents: Array.from(
      { length: Math.floor(Math.random() * 25) + 10 },
      (_, i) => ({ id: i })
    ),
    dateCreation: new Date(
      Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
    ).toISOString(),
  }));
};

const ManageClassList = ({
  classes = generateMockClasses(50), // Default mock data
  loading = false,
  error,
  successMessage,
  refreshing = false,
  onSelectClass = (id) => console.log("Selected class:", id),
  onRefresh = () => console.log("Refreshing..."),
  onBack,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [niveauFilter, setNiveauFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  const getStatusColor = (etat) => {
    switch (etat) {
      case "ACTIF":
        return "success";
      case "EN_ATTENTE_APPROBATION":
        return "warning";
      case "INACTIF":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (etat) => {
    switch (etat) {
      case "ACTIF":
        return "Actif";
      case "EN_ATTENTE_APPROBATION":
        return "En attente";
      case "INACTIF":
        return "Inactif";
      default:
        return etat;
    }
  };

  const getStatusStyle = (etat) => {
    switch (etat) {
      case "ACTIF":
        return {
          backgroundColor: "#f6ffed",
          color: "#52c41a",
          borderColor: "#b7eb8f",
        };
      case "EN_ATTENTE_APPROBATION":
        return {
          backgroundColor: "#fffbe6",
          color: "#faad14",
          borderColor: "#ffe58f",
        };
      case "INACTIF":
        return {
          backgroundColor: "#fff2f0",
          color: "#ff4d4f",
          borderColor: "#ffccc7",
        };
      default:
        return {
          backgroundColor: "#fafafa",
          color: "#8c8c8c",
          borderColor: "#d9d9d9",
        };
    }
  };

  // Filter and search logic
  const filteredClasses = useMemo(() => {
    return classes.filter((classe) => {
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
  }, [classes, searchTerm, statusFilter, niveauFilter, dateRange]);

  // Pagination logic
  const paginatedClasses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredClasses.slice(startIndex, startIndex + pageSize);
  }, [filteredClasses, currentPage, pageSize]);

  // Statistics
  const totalClasses = classes.length;
  const activeClasses = classes.filter((c) => c.etat === "ACTIF").length;
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
    setCurrentPage(1);
  };

  const uniqueNiveaux = [...new Set(classes.map((c) => c.niveau))];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "24px",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "32px",
            marginBottom: "24px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            border: "1px solid #f0f0f0",
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={onBack}
                  type="text"
                  size="large"
                  style={{
                    borderRadius: "8px",
                    color: "#4a6da7",
                  }}
                />
              )}
              <div>
                <Title
                  level={1}
                  style={{
                    margin: 0,
                    color: "#4a6da7",
                    fontSize: "2.5rem",
                    fontWeight: 700,
                  }}
                >
                  Gestion des Classes
                </Title>
                <Text
                  style={{
                    fontSize: "16px",
                    color: "#8c8c8c",
                    fontWeight: 400,
                  }}
                >
                  Gérez et supervisez toutes vos classes en un seul endroit
                </Text>
              </div>
            </div>

            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={refreshing}
              size="large"
              style={{
                borderRadius: "8px",
                backgroundColor: "#4a6da7",
                borderColor: "#4a6da7",
                color: "white",
                fontWeight: 600,
                height: "48px",
                paddingLeft: "24px",
                paddingRight: "24px",
              }}
            >
              Actualiser
            </Button>
          </div>

          {/* Statistics Cards */}
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  borderRadius: "12px",
                  border: "1px solid #f0f0f0",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#4a6da7",
                    fontSize: "2rem",
                    marginBottom: "8px",
                  }}
                >
                  <BookOutlined />
                </div>
                <Statistic
                  title={
                    <span style={{ color: "#8c8c8c", fontWeight: 500 }}>
                      Total Classes
                    </span>
                  }
                  value={totalClasses}
                  valueStyle={{
                    color: "#262626",
                    fontWeight: "bold",
                    fontSize: "2rem",
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  borderRadius: "12px",
                  border: "1px solid #f0f0f0",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#4a6da7",
                    fontSize: "2rem",
                    marginBottom: "8px",
                  }}
                >
                  <TrophyOutlined />
                </div>
                <Statistic
                  title={
                    <span style={{ color: "#8c8c8c", fontWeight: 500 }}>
                      Classes Actives
                    </span>
                  }
                  value={activeClasses}
                  valueStyle={{
                    color: "#262626",
                    fontWeight: "bold",
                    fontSize: "2rem",
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  borderRadius: "12px",
                  border: "1px solid #f0f0f0",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#4a6da7",
                    fontSize: "2rem",
                    marginBottom: "8px",
                  }}
                >
                  <TeamOutlined />
                </div>
                <Statistic
                  title={
                    <span style={{ color: "#8c8c8c", fontWeight: 500 }}>
                      Total Élèves
                    </span>
                  }
                  value={totalStudents}
                  valueStyle={{
                    color: "#262626",
                    fontWeight: "bold",
                    fontSize: "2rem",
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  borderRadius: "12px",
                  border: "1px solid #f0f0f0",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#4a6da7",
                    fontSize: "2rem",
                    marginBottom: "8px",
                  }}
                >
                  <UserOutlined />
                </div>
                <Statistic
                  title={
                    <span style={{ color: "#8c8c8c", fontWeight: 500 }}>
                      Total Parents
                    </span>
                  }
                  value={totalParents}
                  valueStyle={{
                    color: "#262626",
                    fontWeight: "bold",
                    fontSize: "2rem",
                  }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert
            message={successMessage}
            type="success"
            showIcon
            closable
            style={{
              borderRadius: "8px",
              marginBottom: "24px",
              border: "1px solid #b7eb8f",
            }}
          />
        )}

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{
              borderRadius: "8px",
              marginBottom: "24px",
              border: "1px solid #ffccc7",
            }}
          />
        )}

        {/* Search and Filter Section */}
        <Card
          style={{
            borderRadius: "12px",
            border: "1px solid #f0f0f0",
            backgroundColor: "white",
            marginBottom: "24px",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Rechercher par nom ou niveau..."
                prefix={<SearchOutlined style={{ color: "#4a6da7" }} />}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                size="large"
                style={{
                  borderRadius: "8px",
                  borderColor: "#d9d9d9",
                }}
              />
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Select
                placeholder="Statut"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                size="large"
                style={{ width: "100%" }}
              >
                <Option value="all">Tous les statuts</Option>
                <Option value="ACTIF">Actif</Option>
                <Option value="EN_ATTENTE_APPROBATION">En attente</Option>
                <Option value="INACTIF">Inactif</Option>
              </Select>
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Select
                placeholder="Niveau"
                value={niveauFilter}
                onChange={(value) => {
                  setNiveauFilter(value);
                  setCurrentPage(1);
                }}
                size="large"
                style={{ width: "100%" }}
              >
                <Option value="all">Tous les niveaux</Option>
                {uniqueNiveaux.map((niveau) => (
                  <Option key={niveau} value={niveau}>
                    {niveau}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <RangePicker
                placeholder={["Date début", "Date fin"]}
                value={dateRange}
                onChange={(dates) => {
                  setDateRange(dates);
                  setCurrentPage(1);
                }}
                size="large"
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} sm={4} md={2}>
              <Button
                icon={<ClearOutlined />}
                onClick={clearFilters}
                size="large"
                style={{
                  borderRadius: "8px",
                  width: "100%",
                }}
              >
                Effacer
              </Button>
            </Col>
          </Row>

          <Divider style={{ margin: "16px 0 8px 0" }} />

          <div className="flex justify-between items-center">
            <Text style={{ color: "#8c8c8c" }}>
              {filteredClasses.length} classe(s) trouvée(s) sur {totalClasses}
            </Text>
            <div className="flex items-center gap-4">
              <Text style={{ color: "#8c8c8c" }}>Classes par page:</Text>
              <Select
                value={pageSize}
                onChange={(value) => {
                  setPageSize(value);
                  setCurrentPage(1);
                }}
                size="small"
                style={{ width: 80 }}
              >
                <Option value={5}>5</Option>
                <Option value={7}>7</Option>
                <Option value={10}>10</Option>
                <Option value={15}>15</Option>
                <Option value={20}>20</Option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Classes List */}
        <Card
          title={
            <Title
              level={2}
              style={{
                margin: 0,
                color: "#262626",
                fontSize: "1.5rem",
              }}
            >
              Classes Disponibles
            </Title>
          }
          style={{
            borderRadius: "12px",
            border: "1px solid #f0f0f0",
            backgroundColor: "white",
          }}
          headStyle={{
            borderBottom: "1px solid #f0f0f0",
            borderRadius: "12px 12px 0 0",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          {loading && classes.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "400px",
                gap: "16px",
              }}
            >
              <Spin size="large" style={{ color: "#4a6da7" }} />
              <Text style={{ fontSize: "16px", color: "#8c8c8c" }}>
                Chargement des classes...
              </Text>
            </div>
          ) : filteredClasses.length === 0 ? (
            <Empty
              description={
                <Text style={{ fontSize: "16px", color: "#8c8c8c" }}>
                  Aucune classe trouvée avec ces critères
                </Text>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: "60px 0" }}
            />
          ) : (
            <>
              <List
                dataSource={paginatedClasses}
                renderItem={(classe, index) => (
                  <List.Item
                    style={{
                      padding: "0",
                      marginBottom: "16px",
                      border: "none",
                      borderRadius: "12px",
                      backgroundColor: "white",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                      border: "1px solid #f0f0f0",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 24px rgba(74, 109, 167, 0.12)";
                      e.currentTarget.style.borderColor = "#4a6da7";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0, 0, 0, 0.06)";
                      e.currentTarget.style.borderColor = "#f0f0f0";
                    }}
                    onClick={() => onSelectClass(classe.id)}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        padding: "24px",
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4 flex-1">
                          <Badge
                            count={classe.eleves?.length || 0}
                            showZero
                            style={{ backgroundColor: "#4a6da7" }}
                          >
                            <Avatar
                              size={64}
                              style={{
                                backgroundColor: "#4a6da7",
                                color: "white",
                                fontSize: "24px",
                              }}
                              icon={<BookOutlined />}
                            />
                          </Badge>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Title
                                level={3}
                                style={{
                                  margin: 0,
                                  color: "#262626",
                                  fontSize: "1.25rem",
                                  fontWeight: 600,
                                }}
                              >
                                {classe.nom}
                              </Title>
                              <Tag
                                style={{
                                  borderRadius: "6px",
                                  padding: "4px 12px",
                                  fontWeight: 500,
                                  border: "1px solid",
                                  ...getStatusStyle(classe.etat),
                                }}
                              >
                                {getStatusText(classe.etat)}
                              </Tag>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: "16px",
                                marginBottom: "16px",
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <BankOutlined
                                  style={{ color: "#4a6da7", fontSize: "16px" }}
                                />
                                <Text strong style={{ color: "#595959" }}>
                                  {classe.niveau}
                                </Text>
                              </div>
                              <div className="flex items-center gap-2">
                                <TeamOutlined
                                  style={{ color: "#4a6da7", fontSize: "16px" }}
                                />
                                <Text style={{ color: "#595959" }}>
                                  {classe.eleves?.length || 0} élèves
                                </Text>
                              </div>
                              <div className="flex items-center gap-2">
                                <UserOutlined
                                  style={{ color: "#4a6da7", fontSize: "16px" }}
                                />
                                <Text style={{ color: "#595959" }}>
                                  {classe.parents?.length || 0} parents
                                </Text>
                              </div>
                            </div>

                            {classe.dateCreation && (
                              <div className="flex items-center gap-2">
                                <ClockCircleOutlined
                                  style={{ color: "#8c8c8c", fontSize: "14px" }}
                                />
                                <Text
                                  style={{ fontSize: "14px", color: "#8c8c8c" }}
                                >
                                  Créée le{" "}
                                  {new Date(
                                    classe.dateCreation
                                  ).toLocaleDateString("fr-FR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </Text>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          type="primary"
                          icon={<SettingOutlined />}
                          size="large"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClass(classe.id);
                          }}
                          style={{
                            borderRadius: "8px",
                            backgroundColor: "#4a6da7",
                            borderColor: "#4a6da7",
                            fontWeight: 600,
                            height: "48px",
                            paddingLeft: "20px",
                            paddingRight: "20px",
                          }}
                        >
                          Gérer
                        </Button>
                      </div>
                    </div>
                  </List.Item>
                )}
              />

              {/* Pagination */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "32px",
                  paddingTop: "24px",
                  borderTop: "1px solid #f0f0f0",
                }}
              >
                <Pagination
                  current={currentPage}
                  total={filteredClasses.length}
                  pageSize={pageSize}
                  onChange={(page) => setCurrentPage(page)}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} sur ${total} classes`
                  }
                  style={{
                    "& .ant-pagination-item-active": {
                      backgroundColor: "#4a6da7",
                      borderColor: "#4a6da7",
                    },
                  }}
                />
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ManageClassList;
