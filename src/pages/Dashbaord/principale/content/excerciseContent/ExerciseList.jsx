import React, { useState, useEffect } from "react";
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
  Badge,
} from "antd";
import { participationExerciseService } from "../../../../../services/exerciseService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faBook,
  faCalendarDays,
  faCircleCheck,
  faCirclePlay,
  faClock,
  faEye,
  faMagnifyingGlass,
  faPenToSquare,
  faPlus,
  faTag,
  faTrash,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
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
  participationMap: participationMapProp,
}) => {
  const [searchText, setSearchText] = useState("");
  const [filterNiveau, setFilterNiveau] = useState(null);
  const [filterEtat, setFilterEtat] = useState(null);
  const [filterRestriction, setFilterRestriction] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentPage, setStudentPage] = useState(1);
  const [professorPage, setProfessorPage] = useState(1);
  const [participationMapLocal, setParticipationMapLocal] = useState({});
  useEffect(() => {
    if (canCreate || participationMapProp) return; // skip if prop provided or professor
    const userId =
      localStorage.getItem("selectedChildId") || localStorage.getItem("userId");
    if (!userId) return;
    participationExerciseService
      .getParticipationsByUtilisateur(userId)
      .then((data) => {
        const map = {};
        (data || []).forEach((p) => {
          map[p.exerciseProgrammerId] = p;
        });
        setParticipationMapLocal(map);
      })
      .catch(() => {});
  }, [canCreate, participationMapProp, exercises]);
  const participationMap = participationMapProp || participationMapLocal;

  // Find participation for an exercise — tries all possible ID mappings
  const getParticipation = (exercise) => {
    // Class-fetched exerciseProgrammer objects carry exerciseProgrammerId explicitly
    if (
      exercise.exerciseProgrammerId &&
      participationMap[exercise.exerciseProgrammerId]
    )
      return participationMap[exercise.exerciseProgrammerId];
    // For class-fetched objects where id IS the exerciseProgrammerId
    if (participationMap[exercise.id]) return participationMap[exercise.id];
    return null;
  };
  const SUBMISSION_CONFIG = {
    EN_COURS: {
      label: "En cours",
      color: "#d97706",
      bg: "#fffbeb",
      icon: <FontAwesomeIcon icon={faClock} />,
    },
    SOUMIS: {
      label: "Soumis",
      color: "#2563eb",
      bg: "#eff6ff",
      icon: <FontAwesomeIcon icon={faCircleCheck} />,
    },
    EN_ATTENTE_CORRECTION: {
      label: "En attente",
      color: "#c2410c",
      bg: "#fff7ed",
      icon: <FontAwesomeIcon icon={faClock} />,
    },
    CORRIGE: {
      label: "Corrigé",
      color: "#7c3aed",
      bg: "#f5f3ff",
      icon: <FontAwesomeIcon icon={faTrophy} />,
    },
    VALIDE: {
      label: "Validé",
      color: "#16a34a",
      bg: "#f0fdf4",
      icon: <FontAwesomeIcon icon={faCircleCheck} />,
    },
  };
  const SubmissionBadge = ({ etat }) => {
    const c = SUBMISSION_CONFIG[etat];
    if (!c) return null;
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{
          color: c.color,
          background: c.bg,
          border: `1px solid ${c.color}30`,
        }}
      >
        {c.icon} {c.label}
      </span>
    );
  };
  const getStatusTag = (status) => {
    const map = {
      ACTIF: {
        color: "#389e0d",
        bg: "#f6ffed",
        border: "#b7eb8f",
        label: "Actif",
        icon: <FontAwesomeIcon icon={faCircleCheck} />,
      },
      BROUILLON: {
        color: "#d48806",
        bg: "#fffbe6",
        border: "#ffe58f",
        label: "Brouillon",
        icon: <FontAwesomeIcon icon={faClock} />,
      },
      INACTIF: {
        color: "#cf1322",
        bg: "#fff1f0",
        border: "#ffa39e",
        label: "Inactif",
        icon: null,
      },
    };
    const s = map[status];
    if (!s) return <Tag>{status}</Tag>;
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          color: s.color,
          background: s.bg,
          border: `1px solid ${s.border}`,
        }}
      >
        {s.icon} {s.label}
      </span>
    );
  };
  const getRestrictionTag = (restriction) => {
    if (restriction === "PUBLIC")
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            color: "#1d4ed8",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
        >
          Public
        </span>
      );
    if (restriction === "PRIVE")
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            color: "#6d28d9",
            background: "#f5f3ff",
            border: "1px solid #ddd6fe",
          }}
        >
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
      title: (
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Nom
        </span>
      ),
      dataIndex: "nom",
      key: "nom",
      width: "32%",
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div className="font-semibold text-sm text-gray-900 truncate">
            {text}
          </div>
          {record.description && (
            <div className="text-xs text-gray-400 truncate mt-0.5">
              {record.description.substring(0, 65)}
              {record.description.length > 65 ? "…" : ""}
            </div>
          )}
          {record.matieres?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {record.matieres.slice(0, 2).map((m) => (
                <span
                  key={m.id || m}
                  className="inline-block px-1.5 py-0.5 rounded text-xs"
                  style={{
                    background: "#f3e8ff",
                    color: "#7c3aed",
                  }}
                >
                  {m.nom || m}
                </span>
              ))}
              {record.matieres.length > 2 && (
                <span className="text-xs text-gray-400">
                  +{record.matieres.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => (a.nom || "").localeCompare(b.nom || ""),
    },
    {
      title: (
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Niveau
        </span>
      ),
      dataIndex: "niveau",
      key: "niveau",
      width: 110,
      responsive: ["sm"],
      filters: [
        {
          text: "6ème",
          value: "6ème",
        },
        {
          text: "5ème",
          value: "5ème",
        },
        {
          text: "4ème",
          value: "4ème",
        },
        {
          text: "3ème",
          value: "3ème",
        },
        {
          text: "2nde",
          value: "2nde",
        },
        {
          text: "1ère",
          value: "1ère",
        },
        {
          text: "Terminale",
          value: "Terminale",
        },
        {
          text: "Licence 1",
          value: "Licence 1",
        },
        {
          text: "Licence 2",
          value: "Licence 2",
        },
        {
          text: "Licence 3",
          value: "Licence 3",
        },
      ],
      onFilter: (value, record) => record.niveau === value,
      render: (niveau) => (
        <span
          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: "#e0f7fa",
            color: "#00838f",
            border: "1px solid #b2ebf2",
          }}
        >
          {niveau || "N/A"}
        </span>
      ),
    },
    {
      title: (
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Statut
        </span>
      ),
      dataIndex: "etat",
      key: "etat",
      width: 110,
      responsive: ["md"],
      filters: [
        {
          text: "Actif",
          value: "ACTIF",
        },
        {
          text: "Brouillon",
          value: "BROUILLON",
        },
        {
          text: "Inactif",
          value: "INACTIF",
        },
      ],
      onFilter: (value, record) => record.etat === value,
      render: (etat) => getStatusTag(etat),
    },
    {
      title: (
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Visibilité
        </span>
      ),
      dataIndex: "restriction",
      key: "restriction",
      width: 100,
      responsive: ["lg"],
      filters: [
        {
          text: "Public",
          value: "PUBLIC",
        },
        {
          text: "Privé",
          value: "PRIVE",
        },
      ],
      onFilter: (value, record) => record.restriction === value,
      render: (restriction) => getRestrictionTag(restriction),
    },
    {
      title: (
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Date
        </span>
      ),
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
      title: (
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Actions
        </span>
      ),
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Voir les détails">
            <Button
              type="text"
              size="small"
              icon={
                <FontAwesomeIcon
                  icon={faEye}
                  style={{
                    color: "#2d6a9f",
                  }}
                />
              }
              onClick={() => onSelectExercise(record.id)}
              style={{
                borderRadius: 6,
              }}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              type="text"
              size="small"
              icon={
                <FontAwesomeIcon
                  icon={faPenToSquare}
                  style={{
                    color: "#595959",
                  }}
                />
              }
              onClick={() => onSelectExercise(record.id)}
              style={{
                borderRadius: 6,
              }}
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
                okButtonProps={{
                  danger: true,
                }}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<FontAwesomeIcon icon={faTrash} />}
                  danger
                  style={{
                    borderRadius: 6,
                  }}
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
    const PAGE_SIZE = 6;

    // Categorise each exercise by submission status.
    // EN_COURS = student opened but did NOT submit → hide from list (they must re-enter via the card).
    // We keep EN_COURS visible as "À faire" so students can continue; only SOUMIS/CORRIGE are filtered.
    const categorised = exercises
      .filter((e) => e.etat !== "BROUILLON")
      .map((e) => {
        // Use embedded participation when available (from programmer record), else fall back to participationMap
        const p = e.myParticipation || getParticipation(e);
        const s = p?.etatSoumission;
        const isGraded = s === "CORRIGE" || s === "VALIDE";
        // EN_COURS counts as not-submitted so the student can still do the exercise
        const isSubmitted =
          s === "SOUMIS" || s === "EN_ATTENTE_CORRECTION" || isGraded;
        return {
          exercise: e,
          participation: p,
          submissionEtat: s,
          isGraded,
          isSubmitted,
          isPending: s === "EN_ATTENTE_CORRECTION",
          isEnCours: s === "EN_COURS",
        };
      });
    const STATUS_TABS = [
      {
        key: "all",
        label: "Tous",
        count: categorised.length,
      },
      {
        key: "todo",
        label: "À faire",
        count: categorised.filter((c) => !c.isSubmitted).length,
      },
      {
        key: "soumis",
        label: "Soumis",
        count: categorised.filter((c) => c.isSubmitted && !c.isGraded).length,
      },
      {
        key: "corriges",
        label: "Corrigés",
        count: categorised.filter((c) => c.isGraded).length,
      },
    ];
    const afterStatus = categorised.filter(({ isSubmitted, isGraded }) => {
      if (statusFilter === "todo") return !isSubmitted;
      if (statusFilter === "soumis") return isSubmitted && !isGraded;
      if (statusFilter === "corriges") return isGraded;
      return true;
    });
    const afterSearch = afterStatus.filter(({ exercise }) => {
      const matchSearch =
        !searchText ||
        exercise.nom?.toLowerCase().includes(searchText.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(searchText.toLowerCase());
      const matchNiveau = !filterNiveau || exercise.niveau === filterNiveau;
      return matchSearch && matchNiveau;
    });
    const totalPages = Math.max(1, Math.ceil(afterSearch.length / PAGE_SIZE));
    const safePage = Math.min(studentPage, totalPages);
    const paginated = afterSearch.slice(
      (safePage - 1) * PAGE_SIZE,
      safePage * PAGE_SIZE,
    );
    const handleStatusFilter = (key) => {
      setStatusFilter(key);
      setStudentPage(1);
    };
    const handleSearch = (val) => {
      setSearchText(val);
      setStudentPage(1);
    };
    const handleNiveau = (val) => {
      setFilterNiveau(val);
      setStudentPage(1);
    };
    return (
      <div className="w-full">
        {/* ── Filters bar ── */}
        <div
          className="mb-3 rounded-xl overflow-hidden"
          style={{
            border: "1px solid #e4eaf4",
          }}
        >
          {/* Status tabs */}
          <div className="flex border-b border-gray-100 bg-white overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${statusFilter === tab.key ? "border-indigo-600 text-indigo-700 bg-indigo-50/60" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${statusFilter === tab.key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          {/* Search + niveau + refresh */}
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-gray-50">
            <Search
              placeholder="Rechercher..."
              allowClear
              size="small"
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 160,
                maxWidth: 300,
              }}
            />
            <Select
              placeholder="Niveau"
              allowClear
              size="small"
              value={filterNiveau}
              onChange={handleNiveau}
              style={{
                minWidth: 100,
              }}
            >
              {[
                "6ème",
                "5ème",
                "4ème",
                "3ème",
                "2nde",
                "1ère",
                "Terminale",
              ].map((n) => (
                <Option key={n} value={n}>
                  {n}
                </Option>
              ))}
            </Select>
            <Button
              icon={<FontAwesomeIcon icon={faArrowsRotate} />}
              onClick={onRefresh}
              loading={refreshing}
              size="small"
            >
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
          </div>
        </div>

        {/* ── Cards ── */}
        {paginated.length === 0 ? (
          <Empty
            description="Aucun exercice dans cette catégorie"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {paginated.map(
              ({
                exercise,
                participation,
                submissionEtat,
                isGraded,
                isSubmitted,
                isPending,
                isEnCours,
              }) => {
                const questionCount = exercise.nombreQuestions ?? 0;
                const isActive = exercise.etat === "ACTIF";
                // Use exerciseProgrammerId as the card key (unique per programmer record)
                const cardKey =
                  exercise.exerciseProgrammerId || exercise.exerciseId;
                return (
                  <Col xs={24} sm={12} lg={8} key={cardKey}>
                    <Card
                      hoverable
                      style={{
                        borderRadius: 12,
                        border: isGraded
                          ? "1px solid #ddd6fe"
                          : isPending
                            ? "1px solid #fed7aa"
                            : isSubmitted
                              ? "1px solid #bfdbfe"
                              : isActive
                                ? "1px solid #d6e4ff"
                                : "1px solid #f0f0f0",
                        height: "100%",
                      }}
                      bodyStyle={{
                        padding: 16,
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Tag color="cyan" className="text-xs m-0">
                          {exercise.niveau || "N/A"}
                        </Tag>
                        {isSubmitted ? (
                          <SubmissionBadge etat={submissionEtat} />
                        ) : isEnCours ? (
                          <SubmissionBadge etat="EN_COURS" />
                        ) : (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <FontAwesomeIcon icon={faCalendarDays} />
                            {exercise.dateExoPrevue
                              ? new Date(
                                  exercise.dateExoPrevue,
                                ).toLocaleDateString("fr-FR")
                              : "—"}
                          </span>
                        )}
                      </div>
                      <Text
                        strong
                        className="text-sm sm:text-base block mb-1"
                        style={{
                          lineHeight: 1.4,
                        }}
                      >
                        {exercise.nom || "Sans titre"}
                      </Text>
                      {exercise.classeNom && (
                        <div className="flex items-center gap-1 mb-1">
                          <FontAwesomeIcon
                            icon={faBook}
                            style={{
                              fontSize: 11,
                              color: "#6366f1",
                            }}
                          />
                          <span className="text-xs text-indigo-600 font-semibold truncate">
                            {exercise.classeNom}
                          </span>
                        </div>
                      )}
                      {(exercise.dateExoPrevue ||
                        exercise.dateFinExoEffectif) && (
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {exercise.dateExoPrevue && (
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                              <FontAwesomeIcon
                                icon={faCalendarDays}
                                style={{
                                  fontSize: 10,
                                }}
                              />
                              Prévu:{" "}
                              {new Date(exercise.dateExoPrevue).toLocaleString(
                                "fr-FR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          )}
                          {exercise.dateFinExoEffectif && (
                            <span className="text-[11px] text-red-400 flex items-center gap-1">
                              <FontAwesomeIcon
                                icon={faClock}
                                style={{
                                  fontSize: 10,
                                }}
                              />
                              Fin:{" "}
                              {new Date(
                                exercise.dateFinExoEffectif,
                              ).toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      )}
                      {exercise.description && (
                        <Text
                          type="secondary"
                          className="text-xs block mb-3"
                          style={{
                            lineHeight: 1.5,
                          }}
                        >
                          {exercise.description.length > 80
                            ? exercise.description.substring(0, 80) + "…"
                            : exercise.description}
                        </Text>
                      )}
                      {isGraded && participation?.note && (
                        <div
                          className="mb-2 px-2 py-1.5 rounded-lg flex items-center gap-2"
                          style={{
                            background: "#f5f3ff",
                            border: "1px solid #ddd6fe",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faTrophy}
                            style={{
                              color: "#7c3aed",
                              fontSize: 13,
                            }}
                          />
                          <span className="text-xs font-semibold text-purple-700">
                            {participation.note}
                          </span>
                          {participation.appreciation && (
                            <span className="text-xs text-purple-500 italic truncate">
                              "{participation.appreciation}"
                            </span>
                          )}
                        </div>
                      )}
                      {isPending && (
                        <div
                          className="mb-2 px-2 py-1.5 rounded-lg flex items-center gap-2"
                          style={{
                            background: "#fff7ed",
                            border: "1px solid #fed7aa",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faClock}
                            style={{
                              color: "#c2410c",
                              fontSize: 13,
                            }}
                          />
                          <span className="text-xs text-orange-700">
                            En attente de correction du professeur
                          </span>
                        </div>
                      )}
                      {exercise.matieres?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {exercise.matieres.slice(0, 3).map((m) => (
                            <Tag
                              key={m.id || m}
                              color="purple"
                              className="text-xs m-0"
                            >
                              <FontAwesomeIcon icon={faTag} className="mr-1" />
                              {m.nom || m}
                            </Tag>
                          ))}
                          {exercise.matieres.length > 3 && (
                            <Tag className="text-xs m-0">
                              +{exercise.matieres.length - 3}
                            </Tag>
                          )}
                        </div>
                      )}
                      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {questionCount > 0
                            ? `${questionCount} question${questionCount > 1 ? "s" : ""}`
                            : "Questions"}
                        </span>
                        {/* Only show action button for non-submitted exercises */}
                        {!isSubmitted && (
                          <Button
                            type="primary"
                            size="small"
                            icon={<FontAwesomeIcon icon={faCirclePlay} />}
                            onClick={() =>
                              onSelectExercise(
                                exercise.exerciseId,
                                exercise.exerciseProgrammerId,
                              )
                            }
                            style={{
                              borderRadius: 8,
                            }}
                          >
                            {isEnCours ? "Continuer" : "Commencer"}
                          </Button>
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              },
            )}
          </Row>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {afterSearch.length} exercice{afterSearch.length !== 1 ? "s" : ""}{" "}
              · page {safePage}/{totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="small"
                disabled={safePage === 1}
                onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                style={{
                  borderRadius: 6,
                }}
              >
                ‹
              </Button>
              {Array.from(
                {
                  length: totalPages,
                },
                (_, i) => i + 1,
              )
                .filter(
                  (p) =>
                    p === 1 || p === totalPages || Math.abs(p - safePage) <= 1,
                )
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "…" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-gray-400 text-xs"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      size="small"
                      type={p === safePage ? "primary" : "default"}
                      onClick={() => setStudentPage(p)}
                      style={{
                        borderRadius: 6,
                        minWidth: 28,
                      }}
                    >
                      {p}
                    </Button>
                  ),
                )}
              <Button
                size="small"
                disabled={safePage === totalPages}
                onClick={() =>
                  setStudentPage((p) => Math.min(totalPages, p + 1))
                }
                style={{
                  borderRadius: 6,
                }}
              >
                ›
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Professor / Admin table view ────────────────────────────────────────────
  const PROF_PAGE_SIZE = 8;
  const profTotalPages = Math.max(
    1,
    Math.ceil(filteredExercises.length / PROF_PAGE_SIZE),
  );
  const safeProfPage = Math.min(professorPage, profTotalPages);
  const paginatedProfExercises = filteredExercises.slice(
    (safeProfPage - 1) * PROF_PAGE_SIZE,
    safeProfPage * PROF_PAGE_SIZE,
  );
  return (
    <div className="w-full">
      {/* ── Compact filter bar ── */}
      <div className="bg-white border border-slate-100 rounded-xl p-3 mb-4 shadow-sm">
        {/* Row 1: Search + Refresh */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              style={{
                fontSize: 13,
              }}
            />
            <input
              placeholder="Rechercher un exercice..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
            />
          </div>
          <Button
            icon={<FontAwesomeIcon icon={faArrowsRotate} />}
            onClick={onRefresh}
            loading={refreshing}
            size="middle"
            style={{
              borderRadius: 8,
              flexShrink: 0,
            }}
          >
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </div>
        {/* Row 2: Niveau + Statut + Visibilité */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            placeholder="Niveau"
            allowClear
            size="small"
            value={filterNiveau}
            onChange={setFilterNiveau}
            style={{
              flex: 1,
              minWidth: 90,
            }}
          >
            {[
              "6ème",
              "5ème",
              "4ème",
              "3ème",
              "2nde",
              "1ère",
              "Terminale",
              "Licence 1",
              "Licence 2",
              "Licence 3",
            ].map((n) => (
              <Option key={n} value={n}>
                {n}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Statut"
            allowClear
            size="small"
            value={filterEtat}
            onChange={setFilterEtat}
            style={{
              flex: 1,
              minWidth: 90,
            }}
          >
            <Option value="ACTIF">Actif</Option>
            <Option value="BROUILLON">Brouillon</Option>
            <Option value="INACTIF">Inactif</Option>
          </Select>
          <Select
            placeholder="Visibilité"
            allowClear
            size="small"
            value={filterRestriction}
            onChange={setFilterRestriction}
            style={{
              flex: 1,
              minWidth: 90,
            }}
          >
            <Option value="PUBLIC">Public</Option>
            <Option value="PRIVE">Privé</Option>
          </Select>
        </div>
        {filteredExercises.length > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            <span className="font-semibold text-slate-700">
              {filteredExercises.length}
            </span>{" "}
            exercice{filteredExercises.length !== 1 ? "s" : ""} trouvé
            {filteredExercises.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ── Mobile: card view ── */}
      <div className="sm:hidden">
        {paginatedProfExercises.length === 0 ? (
          <Empty
            description="Aucun exercice trouvé"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="space-y-3">
            {paginatedProfExercises.map((record) => (
              <div
                key={record.id}
                className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {record.nom}
                    </p>
                    {record.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                        {record.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      type="text"
                      size="small"
                      icon={
                        <FontAwesomeIcon
                          icon={faEye}
                          style={{
                            color: "#2d6a9f",
                          }}
                        />
                      }
                      onClick={() => onSelectExercise(record.id)}
                      style={{
                        borderRadius: 6,
                      }}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={
                        <FontAwesomeIcon
                          icon={faPenToSquare}
                          style={{
                            color: "#595959",
                          }}
                        />
                      }
                      onClick={() => onSelectExercise(record.id)}
                      style={{
                        borderRadius: 6,
                      }}
                    />
                    {canCreate && (
                      <Popconfirm
                        title="Supprimer l'exercice"
                        description={`Supprimer "${record.nom}" ?`}
                        onConfirm={() => onDelete(record.id)}
                        okText="Oui"
                        cancelText="Non"
                        okButtonProps={{
                          danger: true,
                        }}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<FontAwesomeIcon icon={faTrash} />}
                          danger
                          style={{
                            borderRadius: 6,
                          }}
                        />
                      </Popconfirm>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {record.niveau && (
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: "#e0f7fa",
                        color: "#00838f",
                        border: "1px solid #b2ebf2",
                      }}
                    >
                      {record.niveau}
                    </span>
                  )}
                  {getStatusTag(record.etat)}
                  {getRestrictionTag(record.restriction)}
                  {record.dateCreation && (
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(record.dateCreation).toLocaleDateString(
                        "fr-FR",
                      )}
                    </span>
                  )}
                </div>
                {record.matieres?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {record.matieres.slice(0, 3).map((m) => (
                      <span
                        key={m.id || m}
                        className="inline-block px-1.5 py-0.5 rounded text-xs"
                        style={{
                          background: "#f3e8ff",
                          color: "#7c3aed",
                        }}
                      >
                        {m.nom || m}
                      </span>
                    ))}
                    {record.matieres.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{record.matieres.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Mobile pagination */}
        {profTotalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {filteredExercises.length} exercice
              {filteredExercises.length !== 1 ? "s" : ""} · page {safeProfPage}/
              {profTotalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="small"
                disabled={safeProfPage === 1}
                onClick={() => setProfessorPage((p) => Math.max(1, p - 1))}
                style={{
                  borderRadius: 6,
                }}
              >
                ‹
              </Button>
              {Array.from(
                {
                  length: profTotalPages,
                },
                (_, i) => i + 1,
              )
                .filter(
                  (p) =>
                    p === 1 ||
                    p === profTotalPages ||
                    Math.abs(p - safeProfPage) <= 1,
                )
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "…" ? (
                    <span
                      key={`e-${idx}`}
                      className="px-1 text-gray-400 text-xs"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      size="small"
                      type={p === safeProfPage ? "primary" : "default"}
                      onClick={() => setProfessorPage(p)}
                      style={{
                        borderRadius: 6,
                        minWidth: 28,
                      }}
                    >
                      {p}
                    </Button>
                  ),
                )}
              <Button
                size="small"
                disabled={safeProfPage === profTotalPages}
                onClick={() =>
                  setProfessorPage((p) => Math.min(profTotalPages, p + 1))
                }
                style={{
                  borderRadius: 6,
                }}
              >
                ›
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop: table view ── */}
      <div
        className="hidden sm:block rounded-xl overflow-hidden"
        style={{
          border: "1px solid #e4eaf4",
          background: "#fff",
        }}
      >
        <Table
          columns={columns}
          dataSource={filteredExercises}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => (
              <span className="text-xs text-gray-500">
                {range[0]}–{range[1]} sur {total} exercice{total > 1 ? "s" : ""}
              </span>
            ),
            pageSizeOptions: ["10", "20", "50"],
          }}
          scroll={{
            x: 780,
          }}
          rowClassName={(_, idx) => (idx % 2 === 0 ? "" : "bg-slate-50/60")}
          locale={{
            emptyText: (
              <Empty
                description={
                  <div className="py-6">
                    <p className="text-sm text-gray-500 mb-3">
                      Aucun exercice trouvé
                    </p>
                    {canCreate && onCreateExercise && (
                      <Button
                        type="primary"
                        icon={<FontAwesomeIcon icon={faPlus} />}
                        onClick={onCreateExercise}
                        style={{
                          borderRadius: 8,
                        }}
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
