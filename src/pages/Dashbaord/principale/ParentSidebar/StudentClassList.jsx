import React, { useState, useEffect, useCallback } from "react";
import {
  Empty, Spin, Button, Input, Tag, message, Modal, Alert,
} from "antd";
import {
  BookOutlined,
  TeamOutlined,
  CalendarOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LockOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  BankOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { classService } from "../../../../services/ClassService";
import { coursProgrammerService } from "../../../../services/coursProgrammerService";
import AccederService from "../../../../services/accederService";
import CoursProgrammeManagement from "../content/InterfaceCours/CoursProgrammeManagement";
import ParentClassManagementModal from "./ParentClassManagementModal";
import AddChildModal from "./AddChildModal";

// ── helpers ────────────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  MATERNELLE: { label: "Maternelle", color: "#1976D2", bg: "#E3F2FD" },
  PRIMAIRE:   { label: "Primaire",   color: "#2E7D32", bg: "#E8F5E8" },
  COLLEGE:    { label: "Collège",    color: "#F57C00", bg: "#FFF3E0" },
  LYCEE:      { label: "Lycée",      color: "#D32F2F", bg: "#FFEBEE" },
  UNIVERSITE: { label: "Université", color: "#7B1FA2", bg: "#F3E5F5" },
  AUTRES:     { label: "Autre",      color: "#616161", bg: "#F5F5F5" },
};

const getLevelKey = (niveau = "") => {
  if (!niveau) return "AUTRES";
  const n = niveau.toLowerCase();
  if (n.includes("maternelle")) return "MATERNELLE";
  if (n.includes("primaire") || n.includes("cp") || n.includes("ce") || n.includes("cm")) return "PRIMAIRE";
  if (["6ème","5ème","4ème","3ème"].some(v => n.includes(v.toLowerCase()))) return "COLLEGE";
  if (["2nde","1ère","terminale"].some(v => n.includes(v.toLowerCase()))) return "LYCEE";
  if (["licence","master","doctorat"].some(v => n.includes(v.toLowerCase()))) return "UNIVERSITE";
  return "AUTRES";
};

const ACCESS = {
  APPROVED: { label: "Accès autorisé",   color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: <CheckCircleOutlined /> },
  PENDING:  { label: "En attente",       color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: <ClockCircleOutlined /> },
  REJECTED: { label: "Refusée",          color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: <LockOutlined /> },
};

// ── main component ─────────────────────────────────────────────────────────────

const StudentClassList = ({ isParentView = false }) => {
  const parentId   = localStorage.getItem("userId");
  const userRole   = (localStorage.getItem("userRole") || "").toUpperCase();
  const isParent   = userRole.includes("PARENT");

  const [activeUserId, setActiveUserId] = useState(
    isParent ? (localStorage.getItem("selectedChildId") || parentId) : parentId
  );
  const userId = activeUserId;

  const [userClasses,     setUserClasses]     = useState([]);
  const [allClasses,      setAllClasses]      = useState([]);
  const [accessMap,       setAccessMap]       = useState({});   // classId -> APPROVED|PENDING|REJECTED
  const [courseCounts,    setCourseCounts]    = useState({});   // classId -> number
  const [memberCounts,    setMemberCounts]    = useState({});   // classId -> number
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [search,          setSearch]          = useState("");

  // navigation
  const [selectedClass,       setSelectedClass]       = useState(null);
  const [showCourses,         setShowCourses]         = useState(false);
  const [showRequestModal,    setShowRequestModal]    = useState(false);
  const [showSearchModal,     setShowSearchModal]     = useState(false);
  const [showAddChild,        setShowAddChild]        = useState(false);
  const [searchCode,          setSearchCode]          = useState("");
  const [searchLoading,       setSearchLoading]       = useState(false);
  const [searchDone,          setSearchDone]          = useState(false);
  const [pendingMsg,          setPendingMsg]          = useState(null);

  // ── child switch listener ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      const newId = isParent
        ? (localStorage.getItem("selectedChildId") || parentId)
        : parentId;
      setActiveUserId(newId);
    };
    window.addEventListener("childChanged", handler);
    return () => window.removeEventListener("childChanged", handler);
  }, [isParent, parentId]);

  // ── data fetch ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. All active classes + user's accessible classes
      const [allData, approvedData] = await Promise.all([
        classService.obtenirToutesLesClasses(),
        AccederService.obtenirClassesAccessibles(userId),
      ]);
      const active = (allData || []).filter(c => c.etat === "ACTIF");
      setAllClasses(active);

      // 2. Build access map from approved list
      const map = {};
      (approvedData || []).forEach(c => { map[c.id] = "APPROVED"; });

      // 3. Pending/rejected requests — fetch per class (only for classes not already approved)
      const nonApproved = active.filter(c => !map[c.id]);
      const reqResults = await Promise.allSettled(
        nonApproved.map(c => AccederService.obtenirDemandesAccesPourClasse(c.id))
      );
      reqResults.forEach((r, i) => {
        if (r.status !== "fulfilled") return;
        const reqs = (r.value || []).filter(req => req.utilisateurId === userId);
        if (reqs.length === 0) return;
        const latest = reqs[reqs.length - 1];
        const classId = nonApproved[i].id;
        if (!map[classId]) map[classId] = latest.etat || "PENDING";
      });

      setAccessMap(map);

      // 4. User's classes = those in the map
      const myClasses = active.filter(c => map[c.id]);
      setUserClasses(myClasses);

      // 5. Course counts per class using the class endpoint
      const countMap = {};
      await Promise.all(myClasses.map(async c => {
        try {
          const progs = await coursProgrammerService.obtenirProgrammationParClasse(c.id);
          countMap[c.id] = (progs || []).length;
        } catch {
          countMap[c.id] = 0;
        }
      }));
      setCourseCounts(countMap);

      // 6. Member counts
      const memberMap = {};
      await Promise.all(myClasses.map(async c => {
        try {
          const members = await AccederService.obtenirUtilisateursAvecAcces(c.id);
          memberMap[c.id] = (members || []).length;
        } catch {
          memberMap[c.id] = c.eleves?.length || 0;
        }
      }));
      setMemberCounts(memberMap);

    } catch (e) {
      message.error("Erreur lors du chargement des classes");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    message.success("Actualisé");
  };

  // ── search & join ──────────────────────────────────────────────────────────
  const handleClearSearch = () => {
    setSearchCode("");
    setSearchDone(false);
    setSelectedClass(null);
  };

  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    handleClearSearch();
  };

  const handleSearchJoin = async () => {
    const code = searchCode.trim();
    if (!code) { message.warning("Entrez le code d'activation de la classe"); return; }
    try {
      setSearchLoading(true);
      setSearchDone(false);
      setSelectedClass(null);
      // Exact match on activation code only
      const found = allClasses.find(c => c.codeActivation === code);
      setSearchDone(true);
      if (found) {
        setSelectedClass(found);
        setShowSearchModal(false);
        setShowRequestModal(true);
      }
    } catch (e) {
      message.error("Erreur lors de la recherche");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRequestAccess = async (classe, code) => {
    try {
      await AccederService.demanderAcces({
        utilisateurId: userId,
        classeId: classe.id,
        codeActivation: code,
      });
      message.success("Demande envoyée avec succès");
      setAccessMap(prev => ({ ...prev, [classe.id]: "PENDING" }));
      setUserClasses(prev => prev.some(c => c.id === classe.id) ? prev : [...prev, classe]);
      setShowRequestModal(false);
      handleClearSearch();
      return true;
    } catch (e) {
      // Extract the API error message and re-throw so the modal can display it
      const apiMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Erreur lors de la demande d'accès";
      const enriched = new Error(apiMessage);
      enriched.response = e?.response;
      throw enriched;
    }
  };

  // ── navigate into class ────────────────────────────────────────────────────
  const handleEnterClass = (classe) => {
    const status = accessMap[classe.id];
    if (status === "APPROVED") {
      setSelectedClass(classe);
      setShowCourses(true);
    } else if (status === "PENDING") {
      setPendingMsg(classe.nom);
    }
  };

  // ── if showing courses ─────────────────────────────────────────────────────
  if (showCourses && selectedClass) {
    return (
      <CoursProgrammeManagement
        selectedClass={selectedClass}
        onBack={() => { setShowCourses(false); setSelectedClass(null); }}
      />
    );
  }

  // ── filter ─────────────────────────────────────────────────────────────────
  const filtered = userClasses.filter(c =>
    !search ||
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.niveau?.toLowerCase().includes(search.toLowerCase())
  );

  const approvedCount = userClasses.filter(c => accessMap[c.id] === "APPROVED").length;
  const pendingCount  = userClasses.filter(c => accessMap[c.id] === "PENDING").length;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full px-2 py-3">

      {/* ── Header ── */}
      <div className="mb-4 rounded-xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1d3557 0%, #457b9d 100%)" }}>
        <div className="px-4 py-4 text-white">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <BookOutlined style={{ fontSize: 18 }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold leading-tight">Mes Classes</h1>
                <p className="text-xs opacity-80">
                  {userClasses.length} classe{userClasses.length !== 1 ? "s" : ""} disponible{userClasses.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isParentView && (
                <button
                  onClick={() => setShowAddChild(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors border border-white/30"
                >
                  <PlusOutlined style={{ fontSize: 11 }} />
                  <span className="hidden sm:inline">Enfant</span>
                </button>
              )}
              <button
                onClick={() => setShowSearchModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors border border-white/30"
              >
                <SearchOutlined style={{ fontSize: 11 }} />
                <span className="hidden sm:inline">Rejoindre</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors border border-white/30"
              >
                <ReloadOutlined style={{ fontSize: 13 }} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-2">
            {[
              { icon: <BookOutlined />,         val: userClasses.length, label: "total" },
              { icon: <CheckCircleOutlined />,   val: approvedCount,      label: "actives" },
              { icon: <ClockCircleOutlined />,   val: pendingCount,       label: "en attente" },
            ].map(({ icon, val, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
                {icon}
                <span className="text-sm font-semibold">{val}</span>
                <span className="text-xs opacity-80">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 py-2 bg-white/10 border-t border-white/10">
          <Input
            prefix={<SearchOutlined style={{ color: "rgba(255,255,255,0.6)" }} />}
            placeholder="Filtrer mes classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            size="small"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 8,
              color: "#fff",
            }}
          />
        </div>
      </div>

      {/* ── Pending message ── */}
      {pendingMsg && (
        <div className="mb-3 px-4 py-3 rounded-xl flex items-center justify-between gap-3"
          style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <ClockCircleOutlined />
            <span>Votre demande pour <strong>{pendingMsg}</strong> est en cours de traitement.</span>
          </div>
          <button onClick={() => setPendingMsg(null)} className="text-amber-500 hover:text-amber-700 text-xs font-medium">
            Fermer
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex justify-center py-16"><Spin size="large" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center" style={{ border: "1px solid #e4eaf4" }}>
          <BookOutlined style={{ fontSize: 48, color: "#d1d5db", marginBottom: 12 }} />
          <p className="text-base font-semibold text-gray-700 mb-1">
            {userClasses.length === 0 ? "Aucune classe disponible" : "Aucune classe trouvée"}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            {userClasses.length === 0
              ? "Rejoignez une classe avec un code d'activation."
              : "Aucune classe ne correspond à votre recherche."}
          </p>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => setShowSearchModal(true)}
            style={{ borderRadius: 8 }}
          >
            Rejoindre une classe
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(classe => {
            const status    = accessMap[classe.id];
            const isApproved = status === "APPROVED";
            const isPending  = status === "PENDING";
            const levelKey  = getLevelKey(classe.niveau);
            const levelCfg  = LEVEL_CONFIG[levelKey];
            const accessCfg = ACCESS[status];
            const courseCount  = courseCounts[classe.id] ?? "—";
            const memberCount  = memberCounts[classe.id] ?? (classe.eleves?.length || 0);

            return (
              <div key={classe.id}
                className="bg-white rounded-xl overflow-hidden transition-shadow hover:shadow-md"
                style={{ border: isApproved ? "1px solid #bfdbfe" : "1px solid #e4eaf4" }}>

                {/* Card top accent */}
                <div className="h-1.5 w-full"
                  style={{ background: isApproved ? "linear-gradient(90deg,#2563eb,#4f46e5)" : "#e5e7eb" }} />

                <div className="p-4">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight truncate mb-0.5">
                        {classe.nom}
                      </h3>
                      {classe.etablissement?.nom && (
                        <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                          <BankOutlined style={{ fontSize: 10 }} />
                          {classe.etablissement.nom}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{ color: levelCfg.color, background: levelCfg.bg }}>
                      {classe.niveau || levelCfg.label}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: "#eff6ff" }}>
                        <BookOutlined style={{ fontSize: 11, color: "#2563eb" }} />
                      </div>
                      <span><strong className="text-gray-700">{courseCount}</strong> cours</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: "#f0fdf4" }}>
                        <TeamOutlined style={{ fontSize: 11, color: "#16a34a" }} />
                      </div>
                      <span><strong className="text-gray-700">{memberCount}</strong> membres</span>
                    </div>
                    {classe.dateCreation && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                        <CalendarOutlined style={{ fontSize: 10 }} />
                        {new Date(classe.dateCreation).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      </div>
                    )}
                  </div>

                  {/* Access badge */}
                  {accessCfg && (
                    <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ color: accessCfg.color, background: accessCfg.bg, border: `1px solid ${accessCfg.border}` }}>
                      {accessCfg.icon} {accessCfg.label}
                    </div>
                  )}

                  {/* Action button */}
                  <div className="pt-3 border-t border-gray-50">
                    {isApproved ? (
                      <button
                        onClick={() => handleEnterClass(classe)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                        style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
                      >
                        Entrer dans la classe <ArrowRightOutlined style={{ fontSize: 12 }} />
                      </button>
                    ) : isPending ? (
                      <button
                        onClick={() => setPendingMsg(classe.nom)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}
                      >
                        <ClockCircleOutlined /> Demande en attente
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowSearchModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}
                      >
                        <LockOutlined /> Demander l'accès
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Search / Join modal (Ant Design, same as professor side) ── */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <UsergroupAddOutlined style={{ color: "#4f46e5", fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
                Rejoindre une classe
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>
                Entrez le code exact de la classe
              </div>
            </div>
          </div>
        }
        open={showSearchModal}
        onCancel={handleCloseSearchModal}
        footer={null}
        width={480}
        centered
        styles={{ body: { paddingTop: 8 } }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Input
            size="large"
            placeholder="Code d'activation de la classe..."
            value={searchCode}
            onChange={e => { setSearchCode(e.target.value); if (!e.target.value) handleClearSearch(); }}
            onPressEnter={handleSearchJoin}
            prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
            suffix={
              searchCode ? (
                <span onClick={handleClearSearch} style={{ cursor: "pointer", color: "#94a3b8", fontSize: 13 }}>✕</span>
              ) : null
            }
            style={{ borderRadius: 10 }}
            autoFocus
          />
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            loading={searchLoading}
            onClick={handleSearchJoin}
            style={{ borderRadius: 10, background: "#4f46e5", borderColor: "#4f46e5", flexShrink: 0 }}
          >
            Rechercher
          </Button>
        </div>

        {searchLoading && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <Spin size="large" />
            <p style={{ marginTop: 12, color: "#94a3b8", fontSize: 13 }}>Recherche en cours…</p>
          </div>
        )}

        {!searchLoading && searchDone && !selectedClass && (
          <Alert
            style={{ borderRadius: 8 }}
            type="error"
            showIcon
            message="Aucune classe trouvée avec ce code. Vérifiez le code et réessayez."
          />
        )}

        {!searchLoading && !searchDone && (
          <div style={{ textAlign: "center", padding: "24px 0 8px", color: "#94a3b8" }}>
            <LockOutlined style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 13 }}>
              Entrez le code exact fourni par le modérateur de la classe.
            </p>
          </div>
        )}
      </Modal>

      {/* ── Request access modal — code pre-filled and locked ── */}
      {selectedClass && (
        <ParentClassManagementModal
          open={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedClass(null);
            setShowSearchModal(true);
          }}
          classe={selectedClass}
          hasAccess={false}
          isRequestMode={true}
          onRequestAccess={handleRequestAccess}
          activationCode={searchCode}
          isCodeReadOnly={true}
        />
      )}

      {/* ── Add child modal (parent only) ── */}
      {isParentView && (
        <AddChildModal
          isOpen={showAddChild}
          onClose={() => setShowAddChild(false)}
          onChildAdded={() => message.success("Enfant ajouté avec succès")}
        />
      )}
    </div>
  );
};

export default StudentClassList;
