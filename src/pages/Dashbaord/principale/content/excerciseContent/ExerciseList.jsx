import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Tooltip,
  Popconfirm,
  Empty,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  BookOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Search } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const ExerciseList = ({
  exercises,
  loading,
  refreshing,
  onSelectExercise,
  onRefresh,
  onDelete,
  onCreateExercise,
  canCreate,
}) => {
  const [searchText, setSearchText] = useState("");
  const [filterNiveau, setFilterNiveau] = useState(null);
  const [filterEtat, setFilterEtat] = useState(null);
  const [filterRestriction, setFilterRestriction] = useState(null);

  const getStatusTag = (status) => {
    switch (status) {
      case "ACTIF":
        return (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Actif
          </Tag>
        );
      case "BROUILLON":
        return (
          <Tag color="orange" icon={<ClockCircleOutlined />}>
            Brouillon
          </Tag>
        );
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

  // Filter exercises based on search and filters
  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch =
      !searchText ||
      exercise.nom?.toLowerCase().includes(searchText.toLowerCase()) ||
      exercise.description?.toLowerCase().includes(searchText.toLowerCase());

    const matchesNiveau = !filterNiveau || exercise.niveau === filterNiveau;
    const matchesEtat = !filterEtat || exercise.etat === filterEtat;
    const matchesRestriction =
      !filterRestriction || exercise.restriction === filterRestriction;

    return matchesSearch && matchesNiveau && matchesEtat && matchesRestriction;
  });

  // Statistics
  const stats = {
    total: exercises.length,
    actif: exercises.filter((e) => e.etat === "ACTIF").length,
    brouillon: exercises.filter((e) => e.etat === "BROUILLON").length,
    public: exercises.filter((e) => e.restriction === "PUBLIC").length,
  };

  const columns = [
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
      width: "30%",
      ellipsis: true,
      render: (text, record) => (
        <div className="max-w-full">
          <Text strong className="text-xs sm:text-sm block truncate">
            {text}
          </Text>
          <Text type="secondary" className="text-xs block truncate">
            {record.description?.substring(0, 60)}
            {record.description?.length > 60 ? "..." : ""}
          </Text>
          {record.matieres && record.matieres.length > 0 && (
            <div className="mt-1">
              <Space size="small" wrap>
                {record.matieres.slice(0, 2).map((matiere) => (
                  <Tag
                    key={matiere.id || matiere}
                    color="purple"
                    className="text-xs"
                  >
                    {matiere.nom || matiere}
                  </Tag>
                ))}
                {record.matieres.length > 2 && (
                  <Tag className="text-xs">+{record.matieres.length - 2}</Tag>
                )}
              </Space>
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => (a.nom || "").localeCompare(b.nom || ""),
    },
    {
      title: "Niveau",
      dataIndex: "niveau",
      key: "niveau",
      width: 120,
      responsive: ["sm"],
      filters: [
        { text: "6ème", value: "6ème" },
        { text: "5ème", value: "5ème" },
        { text: "4ème", value: "4ème" },
        { text: "3ème", value: "3ème" },
        { text: "2nde", value: "2nde" },
        { text: "1ère", value: "1ère" },
        { text: "Terminale", value: "Terminale" },
        { text: "Licence 1", value: "Licence 1" },
        { text: "Licence 2", value: "Licence 2" },
        { text: "Licence 3", value: "Licence 3" },
      ],
      onFilter: (value, record) => record.niveau === value,
      render: (niveau) => (
        <Tag color="cyan" className="text-xs">
          {niveau || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Statut",
      dataIndex: "etat",
      key: "etat",
      width: 110,
      responsive: ["md"],
      filters: [
        { text: "Actif", value: "ACTIF" },
        { text: "Brouillon", value: "BROUILLON" },
        { text: "Inactif", value: "INACTIF" },
      ],
      onFilter: (value, record) => record.etat === value,
      render: (etat) => getStatusTag(etat),
    },
    {
      title: "Visibilité",
      dataIndex: "restriction",
      key: "restriction",
      width: 100,
      responsive: ["lg"],
      filters: [
        { text: "Public", value: "PUBLIC" },
        { text: "Privé", value: "PRIVE" },
      ],
      onFilter: (value, record) => record.restriction === value,
      render: (restriction) => getRestrictionTag(restriction),
    },
    {
      title: "Date",
      dataIndex: "dateCreation",
      key: "dateCreation",
      width: 120,
      responsive: ["lg"],
      render: (date) => (
        <Text type="secondary" className="text-xs">
          {date ? new Date(date).toLocaleDateString("fr-FR") : "N/A"}
        </Text>
      ),
      sorter: (a, b) => {
        const dateA = a.dateCreation ? new Date(a.dateCreation) : new Date(0);
        const dateB = b.dateCreation ? new Date(b.dateCreation) : new Date(0);
        return dateA - dateB;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir les détails">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onSelectExercise(record.id)}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onSelectExercise(record.id)}
            />
          </Tooltip>
          {canCreate && (
            <Tooltip title="Supprimer">
              <Popconfirm
                title="Supprimer l'exercice"
                description={`Êtes-vous sûr de vouloir supprimer "${record.nom}" ?`}
                onConfirm={() => onDelete(record.id)}
                okText="Oui"
                cancelText="Non"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Statistics Cards */}
      <Row
        gutter={[8, 8]}
        className="mb-4 sm:mb-6"
        style={{ marginBottom: "16px" }}
      >
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title={
                <span className="text-xs sm:text-sm">Total Exercices</span>
              }
              value={stats.total}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#1890ff", fontSize: "20px" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title={<span className="text-xs sm:text-sm">Actifs</span>}
              value={stats.actif}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a", fontSize: "20px" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title={<span className="text-xs sm:text-sm">Brouillons</span>}
              value={stats.brouillon}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14", fontSize: "20px" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title={<span className="text-xs sm:text-sm">Publics</span>}
              value={stats.public}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#722ed1", fontSize: "20px" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card size="small" className="mb-4">
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} sm={24} md={8}>
            <Search
              placeholder="Rechercher..."
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="Niveau"
              allowClear
              style={{ width: "100%" }}
              size="middle"
              value={filterNiveau}
              onChange={setFilterNiveau}
            >
              <Option value="6ème">6ème</Option>
              <Option value="5ème">5ème</Option>
              <Option value="4ème">4ème</Option>
              <Option value="3ème">3ème</Option>
              <Option value="2nde">2nde</Option>
              <Option value="1ère">1ère</Option>
              <Option value="Terminale">Terminale</Option>
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="Statut"
              allowClear
              style={{ width: "100%" }}
              size="middle"
              value={filterEtat}
              onChange={setFilterEtat}
            >
              <Option value="ACTIF">Actif</Option>
              <Option value="BROUILLON">Brouillon</Option>
              <Option value="INACTIF">Inactif</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Visibilité"
              allowClear
              style={{ width: "100%" }}
              size="middle"
              value={filterRestriction}
              onChange={setFilterRestriction}
            >
              <Option value="PUBLIC">Public</Option>
              <Option value="PRIVE">Privé</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Space style={{ width: "100%" }} className="flex flex-wrap">
              <Button
                icon={<ReloadOutlined />}
                onClick={onRefresh}
                loading={refreshing}
                size="middle"
              >
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
              {canCreate && onCreateExercise && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={onCreateExercise}
                  size="middle"
                >
                  <span className="hidden sm:inline">Nouveau</span>
                  <span className="sm:hidden">+</span>
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Exercises Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredExercises}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: window.innerWidth > 768,
            showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total}`,
            pageSizeOptions: ["10", "20", "50"],
            responsive: true,
            simple: window.innerWidth < 768,
          }}
          scroll={{ x: 800 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  <div className="py-4">
                    <p className="text-xs sm:text-sm">Aucun exercice trouvé</p>
                    {canCreate && onCreateExercise && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={onCreateExercise}
                        className="mt-2"
                        size="middle"
                      >
                        Créer votre premier exercice
                      </Button>
                    )}
                  </div>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default ExerciseList;
