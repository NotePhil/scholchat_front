import React, { useState, useEffect } from "react";
import { Typography, Alert, Button, message, Spin, Input, Modal } from "antd";
import { SearchOutlined, KeyOutlined, CheckCircleOutlined, ClockCircleOutlined, LockOutlined, UsergroupAddOutlined, SendOutlined } from "@ant-design/icons";
import { classService } from "../../../../../services/ClassService";
import AccederService from "../../../../../services/accederService";
import ManageClassList from "../../class-management/ManageClassList";
import ManageClassDetailsView from "../../class-management/ManageClassDetailsView";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { useSelector } from "react-redux";

const { Text } = Typography;

const ManageClassContent = ({ onBack, tabData, setActiveTab }) => {
  const { t } = useTranslation();
  const isMobile = useSelector((state) => state.ui.isMobile);
  const [classes, setClasses] = useState([]);                // access-only (member)
  const [publicationClasses, setPublicationClasses] = useState([]); // pub rights only
  const [assignedModeratorClasses, setAssignedModeratorClasses] = useState([]); // moderator but not creator
  const [moderatedClasses, setModeratedClasses] = useState([]);     // created by user
  const [selectedClassId, setSelectedClassId] = useState(tabData?.classId || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Join class modal state (replaces the top search bar)
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinSearch, setJoinSearch] = useState("");
  const [joinSearchResults, setJoinSearchResults] = useState([]);
  const [joinSearchLoading, setJoinSearchLoading] = useState(false);
  const [joinSearchDone, setJoinSearchDone] = useState(false);
  const [myClassIds, setMyClassIds] = useState(new Set());
  const [accessStatusMap, setAccessStatusMap] = useState({});

  // Inline access request state (no separate modal)
  const [expandedAccessId, setExpandedAccessId] = useState(null); // which class row is expanded
  const [activationCodes, setActivationCodes] = useState({}); // { [classId]: code }
  const [requestLoadingId, setRequestLoadingId] = useState(null); // which class is submitting

  const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
  const currentUserRole = (localStorage.getItem("userRole") || "").toUpperCase().replace("ROLE_", "");
  const isAdmin = currentUserRole === "ADMIN" || currentUserRole === "ADMINISTRATEUR";

  // Update selected class if tabData changes (e.g. from notification)
  useEffect(() => {
    if (tabData?.classId) {
      setSelectedClassId(tabData.classId);
    }
  }, [tabData]);

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

  // Load all data on mount
  useEffect(() => {
    fetchUserClasses();
  }, []);

  // Get user ID from localStorage/sessionStorage
  const getUserId = () => {
    // Try to get from localStorage first
    const userId =
      localStorage.getItem("userId") || sessionStorage.getItem("userId");

    if (!userId) {
      console.error("No user ID found in storage");
      setError(t('classes.manage.errorAuth', "Erreur: Utilisateur non authentifié"));
      return null;
    }

    console.log("Retrieved user ID:", userId);
    return userId;
  };

  const fetchUserClasses = async () => {
    try {
      setLoading(true);
      setError("");

      const userId = getUserId();
      if (!userId) return;

      const selectedRole = (localStorage.getItem("userRole") || "").toUpperCase();

      if (selectedRole.includes("ADMIN")) {
        const data = await classService.obtenirToutesLesClasses();
        setClasses(data || []);
        setPublicationClasses([]);
      } else if (selectedRole.includes("GESTIONNAIRE")) {
        const allClasses = await classService.obtenirToutesLesClasses();
        try {
          const token = localStorage.getItem("accessToken");
          const etabResp = await fetch(`${process.env.REACT_APP_API_BASE_URL}/etablissements`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (etabResp.ok) {
            const allEtabs = await etabResp.json();
            const myEtabIds = allEtabs.filter(e => e.gestionnaireId === userId).map(e => e.id);
            setClasses((allClasses || []).filter(c => myEtabIds.includes(c.etablissementId)));
          } else {
            setClasses([]);
          }
        } catch (e) {
          setClasses([]);
        }
        setPublicationClasses([]);
      } else {
        // Fetch both sources in parallel:
        // 1. New endpoint: classes with peutModerer flag (created vs granted rights)
        // 2. Acceder endpoint: all classes user has access to (includes members)
        const [detailResult, accResult] = await Promise.allSettled([
          classService.axiosRequest(`/droits-publication/utilisateurs/${userId}/classes-avec-droits`, { method: "get" }),
          classService.axiosRequest(`/acceder/utilisateurs/${userId}/classes`, { method: "get" }),
        ]);

        // Classes with publication rights detail: [{ classe, peutPublier, peutModerer }]
        const detailList = detailResult.status === "fulfilled" && Array.isArray(detailResult.value)
          ? detailResult.value : [];

        // All accessible classes (members + rights)
        const accClasses = accResult.status === "fulfilled" && Array.isArray(accResult.value)
          ? accResult.value : [];

        // Split publication-rights classes into 3 buckets:
        // 1. Created by user (estCreateur=true, peutModerer=true)
        // 2. Moderated but not created (peutModerer=true, estCreateur=false)
        // 3. Publication rights only (peutModerer=false)
        const moderated = detailList
          .filter(d => d.peutModerer && d.estCreateur)
          .map(d => ({ ...d.classe, _classRole: "created" }));

        const assignedModerator = detailList
          .filter(d => d.peutModerer && !d.estCreateur)
          .map(d => ({ ...d.classe, _classRole: "assigned-moderator" }));

        const granted = detailList
          .filter(d => !d.peutModerer)
          .map(d => ({ ...d.classe, _classRole: "publication" }));

        // Build set of all IDs that have publication rights
        const pubIds = new Set(detailList.map(d => d.classe?.id).filter(Boolean));

        // Access-only: in acceder but NOT in publication rights
        const accessOnly = accClasses
          .filter(c => !pubIds.has(c.id))
          .map(c => ({ ...c, _classRole: "access" }));

        setModeratedClasses(moderated);
        setAssignedModeratorClasses(assignedModerator);
        setPublicationClasses(granted);
        setClasses(accessOnly);
      }

      console.log("Fetched user classes done");
    } catch (error) {
      console.error("Error fetching user classes:", error);
      setError(t('classes.manage.errorLoad', "Erreur lors du chargement de vos classes"));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserClasses();
    setRefreshing(false);
    setSuccessMessage(t('classes.manage.successRefresh', "Données actualisées avec succès"));
  };

  const handleClearJoinSearch = () => {
    setJoinSearch("");
    setJoinSearchResults([]);
    setJoinSearchDone(false);
    setAccessStatusMap({});
    setMyClassIds(new Set());
  };

  const handleCloseJoinModal = () => {
    setJoinModalOpen(false);
    handleClearJoinSearch();
  };

  // Search ALL classes by name, level, or activation code
  const handleJoinSearch = async () => {
    if (!joinSearch.trim()) return;
    try {
      setJoinSearchLoading(true);
      setJoinSearchDone(false);
      const all = await classService.obtenirToutesLesClasses();
      const term = joinSearch.toLowerCase().trim();
      const results = (all || []).filter(
        (c) =>
          c.nom?.toLowerCase().includes(term) ||
          c.niveau?.toLowerCase().includes(term) ||
          c.codeActivation?.toLowerCase().includes(term)
      );

      // Check access status for each result
      const statusMap = {};
      const myIds = new Set([...classes, ...publicationClasses, ...assignedModeratorClasses, ...moderatedClasses].map((c) => c.id));
      setMyClassIds(myIds);

      await Promise.all(
        results.map(async (c) => {
          if (myIds.has(c.id)) {
            statusMap[c.id] = "APPROVED";
          } else {
            try {
              const requests = await AccederService.obtenirDemandesAccesPourClasse(c.id);
              const myRequest = (requests || []).find(
                (r) => r.utilisateurId === userId
              );
              statusMap[c.id] = myRequest ? myRequest.etat : "NONE";
            } catch {
              statusMap[c.id] = "NONE";
            }
          }
        })
      );

      setAccessStatusMap(statusMap);
      setJoinSearchResults(results);
      setJoinSearchDone(true);
    } catch (err) {
      message.error("Erreur lors de la recherche");
    } finally {
      setJoinSearchLoading(false);
    }
  };

  // Submit inline access request for a specific class
  const handleRequestAccess = async (cls) => {
    const code = (activationCodes[cls.id] || "").trim();
    if (!code) {
      message.error("Veuillez entrer le code d'activation de la classe");
      return;
    }
    try {
      setRequestLoadingId(cls.id);
      await AccederService.demanderAcces({
        utilisateurId: userId,
        classeId: cls.id,
        codeActivation: code,
      });
      message.success("Demande d'accès envoyée ! En attente d'approbation.");
      setAccessStatusMap((prev) => ({ ...prev, [cls.id]: "EN_ATTENTE" }));
      setExpandedAccessId(null);
      setActivationCodes((prev) => { const n = { ...prev }; delete n[cls.id]; return n; });
    } catch (err) {
      message.error(err.message || "Erreur lors de la demande d'accès");
    } finally {
      setRequestLoadingId(null);
    }
  };

  const handleSelectClass = (classId) => {
    setSelectedClassId(classId);
    setError("");
    setSuccessMessage("");
  };

  const handleBackToList = () => {
    setSelectedClassId(null);
    setError("");
    setSuccessMessage("");
  };

  // Navigation handlers for course and exercise management
  const handleNavigateToCourseCreation = (classId) => {
    console.log("Navigating to course creation for class:", classId);
    if (setActiveTab) {
      // Store the class ID in localStorage for the course creation page
      localStorage.setItem("selectedClassId", classId);
      setActiveTab("create-course");
    } else {
      message.warning("Navigation non disponible");
    }
  };

  const handleNavigateToExerciseManagement = (classId) => {
    console.log("Navigating to exercise management for class:", classId);
    if (setActiveTab) {
      localStorage.setItem("selectedClassId", classId);
      setActiveTab("manage-exercises");
    } else {
      message.warning("Navigation non disponible");
    }
  };

  const handleNavigateToCoursManagement = (classId) => {
    console.log("Navigating to cours management for class:", classId);
    if (setActiveTab) {
      localStorage.setItem("selectedClassId", classId);
      setActiveTab("schedule-course");
    } else {
      message.warning("Navigation non disponible");
    }
  };

  return (
    <div className="full-bleed-page">
      <div>
        {!selectedClassId ? (
          <div className="w-full px-3 sm:px-6 py-3 sm:py-6">

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

            {/* ── JOIN ANOTHER CLASS BANNER ── */}
            <div
              className="mb-5 flex items-center justify-between gap-4 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <UsergroupAddOutlined style={{ color: "#4f46e5", fontSize: 18 }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-indigo-900 leading-tight">
                    Rejoindre une autre classe
                  </p>
                  <p className="text-xs text-indigo-500 mt-0.5 hidden sm:block">
                    Recherchez une classe par nom, niveau ou code et demandez l'accès.
                  </p>
                </div>
              </div>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => setJoinModalOpen(true)}
                style={{
                  borderRadius: 8,
                  background: "#4f46e5",
                  borderColor: "#4f46e5",
                  flexShrink: 0,
                }}
              >
                {isMobile ? "Rechercher" : "Demander l'accès"}
              </Button>
            </div>

            <ManageClassList
              classes={classes}
              publicationClasses={publicationClasses}
              assignedModeratorClasses={assignedModeratorClasses}
              moderatedClasses={moderatedClasses}
              loading={loading}
              error={error}
              successMessage={successMessage}
              refreshing={refreshing}
              onSelectClass={handleSelectClass}
              onRefresh={handleRefresh}
              onBack={onBack}
              onNavigateToCreate={setActiveTab ? () => setActiveTab("create-class") : undefined}
              currentUserId={userId}
              currentUserRole={localStorage.getItem("userRole") || ""}
              externalSearch=""
            />
          </div>
        ) : (
          <ManageClassDetailsView
            classId={selectedClassId}
            onBack={handleBackToList}
            initialTab={tabData?.subTab}
            onRefresh={handleRefresh}
            onError={setError}
            onSuccess={setSuccessMessage}
            onNavigateToCourseCreation={isAdmin ? undefined : handleNavigateToCourseCreation}
            onNavigateToExerciseManagement={isAdmin ? undefined : handleNavigateToExerciseManagement}
            onNavigateToCoursManagement={isAdmin ? undefined : handleNavigateToCoursManagement}
          />
        )}
      </div>

      {/* ── JOIN CLASS MODAL ── */}
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
                Recherchez par nom, niveau ou code d'activation
              </div>
            </div>
          </div>
        }
        open={joinModalOpen}
        onCancel={handleCloseJoinModal}
        footer={null}
        width={isMobile ? "95%" : 560}
        centered
        styles={{ body: { paddingTop: 8 } }}
      >
        {/* Search bar inside modal */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Input
            size="large"
            placeholder="Nom, niveau ou code de la classe..."
            value={joinSearch}
            onChange={e => { setJoinSearch(e.target.value); if (!e.target.value) handleClearJoinSearch(); }}
            onPressEnter={handleJoinSearch}
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            suffix={
              joinSearch ? (
                <span
                  onClick={handleClearJoinSearch}
                  style={{ cursor: "pointer", color: "#94a3b8", fontSize: 13 }}
                >✕</span>
              ) : null
            }
            style={{ borderRadius: 10 }}
            autoFocus
          />
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            loading={joinSearchLoading}
            onClick={handleJoinSearch}
            style={{ borderRadius: 10, background: "#4f46e5", borderColor: "#4f46e5", flexShrink: 0 }}
          >
            Rechercher
          </Button>
        </div>

        {/* Loading spinner */}
        {joinSearchLoading && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <Spin size="large" />
            <p style={{ marginTop: 12, color: "#94a3b8", fontSize: 13 }}>
              Recherche en cours…
            </p>
          </div>
        )}

        {/* No results */}
        {!joinSearchLoading && joinSearchDone && joinSearchResults.length === 0 && (
          <Alert
            style={{ borderRadius: 8 }}
            type="info"
            showIcon
            message="Aucune classe trouvée avec ce nom, niveau ou code."
          />
        )}

        {/* Results list */}
        {!joinSearchLoading && joinSearchDone && joinSearchResults.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 4px" }}>
              {joinSearchResults.length} résultat{joinSearchResults.length > 1 ? "s" : ""} trouvé{joinSearchResults.length > 1 ? "s" : ""}
            </p>
            {joinSearchResults.map(cls => {
              const status = accessStatusMap[cls.id];
              const hasAccess = myClassIds.has(cls.id) || status === "APPROVED";
              const isPending = status === "EN_ATTENTE";
              const isExpanded = expandedAccessId === cls.id;

              return (
                <div
                  key={cls.id}
                  style={{
                    borderRadius: 10,
                    border: isExpanded ? "1px solid #c7d2fe" : "1px solid #e2e8f0",
                    background: isExpanded ? "#f5f3ff" : "#f8fafc",
                    overflow: "hidden",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                >
                  {/* Class row */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 14px",
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cls.nom}
                      </p>
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>
                        {cls.niveau}{cls.etablissement?.nom ? ` • ${cls.etablissement.nom}` : ""}
                      </p>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {hasAccess ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 11, fontWeight: 600, color: "#15803d",
                            background: "#f0fdf4", border: "1px solid #bbf7d0",
                            padding: "3px 10px", borderRadius: 20
                          }}>
                            <CheckCircleOutlined /> Accès accordé
                          </span>
                          <Button
                            size="small"
                            onClick={() => { handleSelectClass(cls.id); handleCloseJoinModal(); }}
                            style={{ borderRadius: 6 }}
                          >
                            Gérer
                          </Button>
                        </div>
                      ) : isPending ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 11, fontWeight: 600, color: "#92400e",
                          background: "#fffbeb", border: "1px solid #fde68a",
                          padding: "3px 10px", borderRadius: 20
                        }}>
                          <ClockCircleOutlined /> En attente
                        </span>
                      ) : !isExpanded ? (
                        <Button
                          size="small"
                          type="primary"
                          icon={<LockOutlined />}
                          onClick={() => {
                            setExpandedAccessId(cls.id);
                            setActivationCodes(prev => ({ ...prev, [cls.id]: "" }));
                          }}
                          style={{ borderRadius: 6, background: "#4f46e5", borderColor: "#4f46e5" }}
                        >
                          Demander l'accès
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          onClick={() => setExpandedAccessId(null)}
                          style={{ borderRadius: 6, color: "#64748b" }}
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Inline access request panel — expands below the row */}
                  {isExpanded && (
                    <div style={{
                      borderTop: "1px solid #c7d2fe",
                      padding: "14px 14px 16px",
                      background: "#fff",
                    }}>
                      <Text strong style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 8 }}>
                        Code d'activation de la classe *
                      </Text>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Input
                          placeholder="Entrez le code fourni par le modérateur…"
                          value={activationCodes[cls.id] || ""}
                          onChange={e => setActivationCodes(prev => ({ ...prev, [cls.id]: e.target.value }))}
                          onPressEnter={() => handleRequestAccess(cls)}
                          prefix={<LockOutlined style={{ color: "#a5b4fc" }} />}
                          style={{ borderRadius: 8, flex: 1 }}
                          autoFocus
                        />
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          loading={requestLoadingId === cls.id}
                          onClick={() => handleRequestAccess(cls)}
                          style={{ borderRadius: 8, background: "#4f46e5", borderColor: "#4f46e5", flexShrink: 0 }}
                        >
                          Envoyer
                        </Button>
                      </div>
                      <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: "block" }}>
                        Demandez le code d'activation au modérateur ou à l'établissement.
                      </Text>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state before search */}
        {!joinSearchLoading && !joinSearchDone && (
          <div style={{ textAlign: "center", padding: "24px 0 8px", color: "#94a3b8" }}>
            <UsergroupAddOutlined style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 13 }}>
              Entrez un nom, un niveau ou un code pour trouver une classe.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageClassContent;
