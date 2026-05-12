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
  Badge,
  Progress,
  Divider,
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
  PlayCircleOutlined,
  CalendarOutlined,
  TagOutlined,
  FilterOutlined,
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
    const map = {
      ACTIF:     { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f", label: "Actif",     icon: <CheckCircleOutlined /> },
      BROUILLON: { color: "#d48806", bg: "#fffbe6", border: "#ffe58f", label: "Brouillon", icon: <ClockCircleOutlined /> },
      INACTIF:   { color: "#cf1322", bg: "#fff1f0", border: "#ffa39e", label: "Inactif",   icon: null },
    };
    const s = map[status];
    if (!s) return <Tag>{status}</Tag>;
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
      >
        {s.icon} {s.label}
      </span>
    );
  };

  const getRestrictionTag = (restriction) => {
    if (restriction === "PUBLIC")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ color: "#1d4ed8", background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          Public
        </span>
      );
    if (restriction === "PRIVE")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ color: "#6d28d9", background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
          Privé
        </span>
      );
    return <Tag>{restriction}</Tag>;
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
      title: <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom</span>,
      dataIndex: "nom",
      key: "nom",
      width: "32%",
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div className="font-semibold text-sm text-gray-900 truncate">{text}</div>
          {record.description && (
            <div className="text-xs text-gray-400 truncate mt-0.5">
              {record.description.substring(0, 65)}{record.description.length > 65 ? "…" : ""}
            </div>
          )}
          {record.matieres?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {record.matieres.slice(0, 2).map((m) => (
                <span
                  key={m.id || m}
                  className="inline-block px-1.5 py-0.5 rounded text-xs"
                  style={{ background: "#f3e8ff", color: "#7c3aed" }}
                >
                  {m.nom || m}
                </span>
              ))}
              {record.matieres.length > 2 && (
                <span className="text-xs text-gray-400">+{record.matieres.length - 2}</span>
              )}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => (a.nom || "").localeCompare(b.nom || ""),
    },
    {
      title: <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Niveau</span>,
      dataIndex: "niveau",
      key: "niveau",
      width: 110,
      responsive: ["sm"],
      filters: [
        { text: "6ème", value: "6ème" }, { text: "5ème", value: "5ème" },
        { text: "4ème", value: "4ème" }, { text: "3ème", value: "3ème" },
        { text: "2nde", value: "2nde" }, { text: "1ère", value: "1ère" },
        { text: "Terminale", value: "Terminale" },
        { text: "Licence 1", value: "Licence 1" }, { text: "Licence 2", value: "Licence 2" }, { text: "Licence 3", value: "Licence 3" },
      ],
      onFilter: (value, record) => record.niveau === value,
      render: (niveau) => (
        <span
          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: "#e0f7fa", color: "#00838f", border: "1px solid #b2ebf2" }}
        >
          {niveau || "N/A"}
        </span>
      ),
    },
    {
      title: <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</span>,
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
      title: <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Visibilité</span>,
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
      title: <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</span>,
      dataIndex: "dateCreation",
      key: "dateCreation",
      width: 110,
      responsive: ["lg"],
      render: (date) => (
        <span className="text-xs text-gray-400">
          {date ? new Date(date).toLocaleDateString("fr-FR") : "—"}
        </span>
      ),
      sorter: (a, b) => {
        const dateA = a.dateCreation ? new Date(a.dateCreation) : new Date(0);
        const dateB = b.dateCreation ? new Date(b.dateCreation) : new Date(0);
        return dateA - dateB;
      },
    },
    {
      title: <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</span>,
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Voir les détails">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: "#2d6a9f" }} />}
              onClick={() => onSelectExercise(record.id)}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: "#595959" }} />}
              onClick={() => onSelectExercise(record.id)}
              style={{ borderRadius: 6 }}
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
                  style={{ borderRadius: 6 }}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // ── Student card view ──────────────────────────────────────────────────────
  if (!canCreate) {
    const typeColors = {
      QCM: "blue",
      VRAI_FAUX: "cyan",
      REPONSE_COURTE: "green",
      REPONSE_LONGUE: "purple",
      DEVELOPPEMENT: "purple",
      TROU: "orange",
    };

    const typeLabels = {
      QCM: "QCM",
      VRAI_FAUX: "Vrai / Faux",
      REPONSE_COURTE: "Réponse courte",
      REPONSE_LONGUE: "Réponse longue",
      DEVELOPPEMENT: "Développement",
      TROU: "Texte à trous",
    };

    return (
      <div className="w-full">
        {/* Search + refresh */}
        <Card size="small" className="mb-4">
          <Row gutter={[8, 8]} align="middle">
            <Col xs={24} sm={16} md={18}>
              <Search
                placeholder="Rechercher un exercice..."
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col xs={12} sm={4} md={3}>
              <Select
                placeholder="Niveau"
                allowClear
                style={{ width: "100%" }}
                size="middle"
                value={filterNiveau}
                onChange={setFilterNiveau}
              >
                {["6ème","5ème","4ème","3ème","2nde","1ère","Terminale"].map(n => (
                  <Option key={n} value={n}>{n}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={4} md={3}>
              <Button
                icon={<ReloadOutlined />}
                onClick={onRefresh}
                loading={refreshing}
                size="middle"
                style={{ width: "100%" }}
              >
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Exercise cards */}
        {filteredExercises.length === 0 ? (
          <Empty description="Aucun exercice disponible" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredExercises.map((exercise) => {
              const questionCount = exercise.questions?.length ?? exercise.nombreQuestions ?? 0;
              const types = [...new Set((exercise.questions || []).map(q => q.typeQuestion).filter(Boolean))];
              const isActive = exercise.etat === "ACTIF";

              return (
                <Col xs={24} sm={12} lg={8} key={exercise.id}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: isActive ? "1px solid #d6e4ff" : "1px solid #f0f0f0",
                      height: "100%",
                    }}
                    bodyStyle={{ padding: 16, display: "flex", flexDirection: "column", height: "100%" }}
                  >
                    {/* Top: niveau + date */}
                    <div className="flex items-center justify-between mb-2">
                      <Tag color="cyan" className="text-xs m-0">{exercise.niveau || "N/A"}</Tag>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CalendarOutlined />
                        {exercise.dateCreation ? new Date(exercise.dateCreation).toLocaleDateString("fr-FR") : "—"}
                      </span>
                    </div>

                    {/* Title */}
                    <Text strong className="text-sm sm:text-base block mb-1" style={{ lineHeight: 1.4 }}>
                      {exercise.nom}
                    </Text>

                    {/* Description */}
                    {exercise.description && (
                      <Text type="secondary" className="text-xs block mb-3" style={{ lineHeight: 1.5 }}>
                        {exercise.description.length > 80
                          ? exercise.description.substring(0, 80) + "…"
                          : exercise.description}
                      </Text>
                    )}

                    {/* Matieres */}
                    {exercise.matieres?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {exercise.matieres.slice(0, 3).map((m) => (
                          <Tag key={m.id || m} color="purple" className="text-xs m-0">
                            <TagOutlined className="mr-1" />{m.nom || m}
                          </Tag>
                        ))}
                        {exercise.matieres.length > 3 && (
                          <Tag className="text-xs m-0">+{exercise.matieres.length - 3}</Tag>
                        )}
                      </div>
                    )}

                    {/* Question types */}
                    {types.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {types.map((t) => (
                          <Tag key={t} color={typeColors[t] || "default"} className="text-xs m-0">
                            {typeLabels[t] || t}
                          </Tag>
                        ))}
                      </div>
                    )}

                    {/* Footer: question count + CTA */}
                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {questionCount > 0 ? `${questionCount} question${questionCount > 1 ? "s" : ""}` : "Questions à venir"}
                      </span>
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlayCircleOutlined />}
                        onClick={() => onSelectExercise(exercise.id)}
                        style={{ borderRadius: 8 }}
                      >
                        Commencer
                      </Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    );
  }

  // ── Professor / Admin table view ────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Filters bar */}
      <div
        className="flex flex-wrap items-center gap-3 mb-4 px-4 py-3 rounded-xl"
        style={{ background: "#f4f7fb", border: "1px solid #e4eaf4" }}
      >
        <FilterOutlined style={{ color: "#2d6a9f", fontSize: 15 }} />
        <Input.Search
          placeholder="Rechercher un exercice..."
          allowClear
          size="middle"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 280, borderRadius: 8 }}
        />
        <Select
          placeholder="Niveau"
          allowClear
          size="middle"
          value={filterNiveau}
          onChange={setFilterNiveau}
          style={{ minWidth: 110 }}
        >
          {["6ème","5ème","4ème","3ème","2nde","1ère","Terminale","Licence 1","Licence 2","Licence 3"].map(n => (
            <Option key={n} value={n}>{n}</Option>
          ))}
        </Select>
        <Select
          placeholder="Statut"
          allowClear
          size="middle"
          value={filterEtat}
          onChange={setFilterEtat}
          style={{ minWidth: 110 }}
        >
          <Option value="ACTIF">Actif</Option>
          <Option value="BROUILLON">Brouillon</Option>
          <Option value="INACTIF">Inactif</Option>
        </Select>
        <Select
          placeholder="Visibilité"
          allowClear
          size="middle"
          value={filterRestriction}
          onChange={setFilterRestriction}
          style={{ minWidth: 110 }}
        >
          <Option value="PUBLIC">Public</Option>
          <Option value="PRIVE">Privé</Option>
        </Select>
        <Button
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={refreshing}
          size="middle"
          style={{ marginLeft: "auto", borderRadius: 8 }}
        >
          Actualiser
        </Button>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid #e4eaf4", background: "#fff" }}
      >
        <Table
          columns={columns}
          dataSource={filteredExercises}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: window.innerWidth > 768,
            showTotal: (total, range) =>
              <span className="text-xs text-gray-500">{range[0]}–{range[1]} sur {total} exercice{total > 1 ? "s" : ""}</span>,
            pageSizeOptions: ["10", "20", "50"],
            responsive: true,
            simple: window.innerWidth < 768,
          }}
          scroll={{ x: 780 }}
          rowClassName={(_, idx) => idx % 2 === 0 ? "" : "bg-slate-50/60"}
          locale={{
            emptyText: (
              <Empty
                description={
                  <div className="py-6">
                    <p className="text-sm text-gray-500 mb-3">Aucun exercice trouvé</p>
                    {canCreate && onCreateExercise && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={onCreateExercise}
                        style={{ borderRadius: 8 }}
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
          size="middle"
        />
      </div>
    </div>
  );
};

export default ExerciseList;
