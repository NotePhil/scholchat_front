import React, { useState, useEffect, useCallback } from "react";
import { Empty, Tag, Button, Spin } from "antd";
import {
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { participationExerciseService } from "../../../../../services/exerciseService";
import StudentExerciseView from "./StudentExerciseView";

// ── helpers ────────────────────────────────────────────────────────────────────

const getUserId = () => {
  const isParent = (localStorage.getItem("userRole") || "").toUpperCase().includes("PARENT");
  return isParent
    ? (localStorage.getItem("selectedChildId") || localStorage.getItem("userId"))
    : (localStorage.getItem("userId"));
};

const getToken = () =>
  localStorage.getItem("accessToken") || localStorage.getItem("authToken");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const isOverdue = (dateFinStr) =>
  dateFinStr && new Date(dateFinStr) < new Date();

// ── status config ──────────────────────────────────────────────────────────────

const STATUS = {
  EN_COURS:              { label: "En cours",      color: "#d97706", bg: "#fffbeb", icon: <ClockCircleOutlined /> },
  SOUMIS:                { label: "Soumis",        color: "#2563eb", bg: "#eff6ff", icon: <CheckCircleOutlined /> },
  EN_ATTENTE_CORRECTION: { label: "En attente",    color: "#c2410c", bg: "#fff7ed", icon: <ClockCircleOutlined /> },
  CORRIGE:               { label: "Corrigé",       color: "#7c3aed", bg: "#f5f3ff", icon: <TrophyOutlined /> },
  VALIDE:                { label: "Validé",        color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircleOutlined /> },
};

const StatusBadge = ({ etat }) => {
  const c = STATUS[etat];
  if (!c) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}30` }}>
      {c.icon} {c.label}
    </span>
  );
};

// ── filter tabs ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "all",      label: "Tous" },
  { key: "todo",     label: "À rendre" },
  { key: "soumis",   label: "Soumis" },
  { key: "corriges", label: "Corrigés" },
];

// ── main component ─────────────────────────────────────────────────────────────

const StudentDevoirsContent = () => {
  const [devoirs, setDevoirs] = useState([]);       // exerciseProgrammer objects (DEVOIR)
  const [participationMap, setParticipationMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedDevoir, setSelectedDevoir] = useState(null); // { exerciseId, exerciseProgrammerId }

  const load = useCallback(async () => {
    const userId = getUserId();
    const token = getToken();
    if (!userId || !token) return;

    setLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Get student's classes
      const classesResp = await fetch(`${baseUrl}/acceder/utilisateurs/${userId}/classes`, { headers });
      const classes = classesResp.ok ? await classesResp.json() : [];

      // 2. For each class, fetch programmed exercises and keep only DEVOIR type
      const all = [];
      await Promise.all(classes.map(async (cls) => {
        try {
          const r = await fetch(`${baseUrl}/exercises-programmer/classe/${cls.id}`, { headers });
          if (!r.ok) return;
          const items = await r.json();
          items
            .filter(ep => ep.typeAssignation === "DEVOIR")
            .forEach(ep => {
              if (!all.find(x => x.id === ep.id)) all.push(ep);
            });
        } catch { /* ignore */ }
      }));

      const DEVOIR_STATUS_ORDER = { EN_COURS: 0, PLANIFIE: 1, ANNULE: 2 };
      all.sort((a, b) => {
        const oa = DEVOIR_STATUS_ORDER[a.etatExoProgramme] ?? 3;
        const ob = DEVOIR_STATUS_ORDER[b.etatExoProgramme] ?? 3;
        return oa !== ob ? oa - ob : new Date(b.dateExoPrevue) - new Date(a.dateExoPrevue);
      });
      setDevoirs(all);

      // 3. Load participations
      const participations = await participationExerciseService
        .getParticipationsByUtilisateur(userId).catch(() => []);
      const map = {};
      (participations || []).forEach(p => { map[p.exerciseProgrammerId] = p; });
      setParticipationMap(map);
    } catch { /* non-blocking */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Re-fetch when parent switches child
  useEffect(() => {
    const onChildChanged = () => load();
    window.addEventListener("childChanged", onChildChanged);
    return () => window.removeEventListener("childChanged", onChildChanged);
  }, [load]);

  // ── if a devoir is selected, show the exercise view ──────────────────────────
  if (selectedDevoir) {
    return (
      <StudentExerciseView
        exerciseId={selectedDevoir.exerciseId}
        exerciseProgrammerId={selectedDevoir.exerciseProgrammerId}
        onBack={() => { setSelectedDevoir(null); load(); }}
        onComplete={() => { setSelectedDevoir(null); load(); }}
      />
    );
  }

  // ── categorise ────────────────────────────────────────────────────────────────
  const categorised = devoirs.map(ep => {
    const p = participationMap[ep.id];
    const etat = p?.etatSoumission;
    const isSubmitted = !!etat;
    const isGraded = etat === "CORRIGE" || etat === "VALIDE";
    const isPending = etat === "EN_ATTENTE_CORRECTION";
    const overdue = !isSubmitted && isOverdue(ep.dateFinExoEffectif);
    return { ep, p, etat, isSubmitted, isGraded, isPending, overdue };
  });

  const filtered = categorised.filter(({ isSubmitted, isGraded }) => {
    if (activeFilter === "todo")     return !isSubmitted;
    if (activeFilter === "soumis")   return isSubmitted && !isGraded;
    if (activeFilter === "corriges") return isGraded;
    return true;
  });

  const counts = {
    all:      categorised.length,
    todo:     categorised.filter(c => !c.isSubmitted).length,
    soumis:   categorised.filter(c => c.isSubmitted && !c.isGraded).length,
    corriges: categorised.filter(c => c.isGraded).length,
  };

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full px-2 py-3">

      {/* Header */}
      <div className="mb-4 rounded-xl p-4"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)", color: "#fff" }}>
        <div className="flex items-center gap-3 mb-1.5">
          <FileTextOutlined style={{ fontSize: 22 }} />
          <span className="text-base font-bold">Mes Devoirs</span>
          <button onClick={load} className="ml-auto p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors">
            <ReloadOutlined style={{ fontSize: 13 }} />
          </button>
        </div>
        <p className="text-xs opacity-80 mb-3">
          Retrouvez ici tous les devoirs assignés par vos professeurs.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { icon: <BookOutlined />,         val: counts.all,      label: `devoir${counts.all !== 1 ? "s" : ""}` },
            { icon: <ClockCircleOutlined />,   val: counts.todo,     label: "à rendre" },
            { icon: <CheckCircleOutlined />,   val: counts.soumis,   label: "soumis" },
            { icon: <TrophyOutlined />,        val: counts.corriges, label: `corrigé${counts.corriges !== 1 ? "s" : ""}` },
          ].map(({ icon, val, label }) => (
            <div key={label} className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
              {icon}
              <span className="text-sm font-semibold">{val}</span>
              <span className="text-xs opacity-80">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid #e4eaf4" }}>
        <div className="flex border-b border-gray-100 bg-white overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeFilter === tab.key
                  ? "border-blue-600 text-blue-700 bg-blue-50/60"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                activeFilter === tab.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
              }`}>{counts[tab.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><Spin size="large" /></div>
      ) : filtered.length === 0 ? (
        <Empty
          description={activeFilter === "all" ? "Aucun devoir assigné" : "Aucun devoir dans cette catégorie"}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(({ ep, p, etat, isSubmitted, isGraded, isPending, overdue }) => {
            const exerciseId = ep.exerciseId || ep.sourceExerciseId || ep.exercise?.id || null;
            return (
              <div key={ep.id}
                className="bg-white rounded-xl overflow-hidden transition-shadow hover:shadow-md"
                style={{
                  border: isGraded ? "1px solid #ddd6fe"
                    : isPending  ? "1px solid #fed7aa"
                    : isSubmitted ? "1px solid #bfdbfe"
                    : overdue    ? "1px solid #fca5a5"
                    : "1px solid #e4eaf4",
                }}>

                {/* Top bar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50"
                  style={{
                    background: isGraded ? "#f5f3ff"
                      : isPending  ? "#fff7ed"
                      : isSubmitted ? "#eff6ff"
                      : overdue    ? "#fef2f2"
                      : "#f8faff",
                  }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag color="blue" className="m-0 text-xs">Devoir</Tag>
                    {ep.niveau && <Tag color="cyan" className="m-0 text-xs">{ep.niveau}</Tag>}
                    {overdue && !isSubmitted && (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        En retard
                      </span>
                    )}
                  </div>
                  {etat ? <StatusBadge etat={etat} /> : (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <CalendarOutlined /> {fmtDate(ep.dateFinExoEffectif)}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="px-4 py-3">
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">
                    {ep.nom || ep.nomExercise || "Devoir"}
                  </p>
                  {ep.description && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{ep.description}</p>
                  )}

                  {/* Dates */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <CalendarOutlined /> Prévu : {fmtDate(ep.dateExoPrevue)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockCircleOutlined /> À rendre avant : {fmtDate(ep.dateFinExoEffectif)}
                    </span>
                  </div>

                  {/* Grade if corrected */}
                  {isGraded && p?.note && (
                    <div className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
                      style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                      <TrophyOutlined style={{ color: "#7c3aed", fontSize: 13 }} />
                      <span className="text-xs font-semibold text-purple-700">{p.note}</span>
                      {p.appreciation && (
                        <span className="text-xs text-purple-500 italic truncate">"{p.appreciation}"</span>
                      )}
                    </div>
                  )}

                  {/* Pending */}
                  {isPending && (
                    <div className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
                      style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
                      <ClockCircleOutlined style={{ color: "#c2410c", fontSize: 13 }} />
                      <span className="text-xs text-orange-700">En attente de correction du professeur</span>
                    </div>
                  )}

                  {/* Action */}
                  <div className="flex justify-end">
                    <Button
                      type={isSubmitted ? "default" : "primary"}
                      size="small"
                      icon={isSubmitted ? <EyeOutlined /> : <PlayCircleOutlined />}
                      onClick={() => setSelectedDevoir({ exerciseId, exerciseProgrammerId: ep.id })}
                      style={{ borderRadius: 8 }}
                      danger={overdue && !isSubmitted}
                    >
                      {isGraded ? "Voir correction" : isPending ? "Voir réponses" : isSubmitted ? "Voir" : "Rendre le devoir"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentDevoirsContent;
