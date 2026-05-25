import React, { useState, useEffect } from "react";
import { Typography, Alert, Button, message, Spin, Input, Modal } from "antd";
import { SearchOutlined, KeyOutlined, CheckCircleOutlined, ClockCircleOutlined, LockOutlined, UsergroupAddOutlined, SendOutlined } from "@ant-design/icons";
import { classService } from "../../../../../services/ClassService";
import AccederService from "../../../../../services/accederService";
import ManageClassList from "../../class-management/ManageClassList";
import ManageClassDetailsView from "../../class-management/ManageClassDetailsView";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { useSelector } from "react-redux";
import ParentClassManagementModal from "../../ParentSidebar/ParentClassManagementModal";

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

  // Join class modal state
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinSearch, setJoinSearch] = useState("");
  const [joinSearchLoading, setJoinSearchLoading] = useState(false);
  const [joinFoundClass, setJoinFoundClass] = useState(null);   // single result
  const [joinDetailsOpen, setJoinDetailsOpen] = useState(false); // details modal
  const [joinSearchDone, setJoinSearchDone] = useState(false);

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
    setJoinFoundClass(null);
    setJoinSearchDone(false);
  };

  const handleCloseJoinModal = () => {
    setJoinModalOpen(false);
    handleClearJoinSearch();
  };

  // Search by exact activation code only (same as student flow)
  const handleJoinSearch = async () => {
    const code = joinSearch.trim();
    if (!code) return;
    try {
      setJoinSearchLoading(true);
      setJoinSearchDone(false);
      setJoinFoundClass(null);
      const all = await classService.obtenirToutesLesClasses();
      // Exact match on activation code only
      const found = (all || []).find(
        (c) => c.codeActivation === code
      );
      setJoinFoundClass(found || null);
      setJoinSearchDone(true);
      if (found) {
        // Close search modal and open details modal
        setJoinModalOpen(false);
        setJoinDetailsOpen(true);
      }
    } catch (err) {
      message.error("Erreur lors de la recherche");
    } finally {
      setJoinSearchLoading(false);
    }
  };

  // Submit access request (called from ParentClassManagementModal)
  const handleRequestAccess = async (cls, activationCode) => {
    try {
      await AccederService.demanderAcces({
        utilisateurId: userId,
        classeId: cls.id,
        codeActivation: activationCode,
      });
      message.success("Demande d'accès envoyée ! En attente d'approbation.");
      setJoinDetailsOpen(false);
      handleClearJoinSearch();
      return true;
    } catch (err) {
      throw err;
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
      setActiveTab("create-course");
    } else {
      message.warning("Navigation non disponible");
    }
  };

  const handleNavigateToExerciseManagement = (classId) => {
    console.log("Navigating to exercise programmer for class:", classId);
    if (setActiveTab) {
      setActiveTab("schedule-exercise", { classId });
    } else {
      message.warning("Navigation non disponible");
    }
  };

  const handleNavigateToCoursManagement = (classId) => {
    console.log("Navigating to cours management for class:", classId);
    if (setActiveTab) {
      setActiveTab("schedule-course", { classId });
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

      {/* ── JOIN CLASS MODAL (search by exact code) ── */}
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
        open={joinModalOpen}
        onCancel={handleCloseJoinModal}
        footer={null}
        width={isMobile ? "95%" : 480}
        centered
        styles={{ body: { paddingTop: 8 } }}
      >
        {/* Search bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Input
            size="large"
            placeholder="Code d'activation de la classe..."
            value={joinSearch}
            onChange={e => { setJoinSearch(e.target.value); if (!e.target.value) handleClearJoinSearch(); }}
            onPressEnter={handleJoinSearch}
            prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
            suffix={
              joinSearch ? (
                <span onClick={handleClearJoinSearch} style={{ cursor: "pointer", color: "#94a3b8", fontSize: 13 }}>✕</span>
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

        {/* Loading */}
        {joinSearchLoading && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <Spin size="large" />
            <p style={{ marginTop: 12, color: "#94a3b8", fontSize: 13 }}>Recherche en cours…</p>
          </div>
        )}

        {/* Not found */}
        {!joinSearchLoading && joinSearchDone && !joinFoundClass && (
          <Alert
            style={{ borderRadius: 8 }}
            type="error"
            showIcon
            message="Aucune classe trouvée avec ce code. Vérifiez le code et réessayez."
          />
        )}

        {/* Empty state */}
        {!joinSearchLoading && !joinSearchDone && (
          <div style={{ textAlign: "center", padding: "24px 0 8px", color: "#94a3b8" }}>
            <LockOutlined style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 13 }}>
              Entrez le code exact fourni par le modérateur de la classe.
            </p>
          </div>
        )}
      </Modal>

      {/* ── CLASS DETAILS + JOIN REQUEST MODAL ── */}
      {joinFoundClass && (
        <ParentClassManagementModal
          open={joinDetailsOpen}
          onClose={() => { setJoinDetailsOpen(false); setJoinModalOpen(true); }}
          classe={joinFoundClass}
          hasAccess={false}
          onRequestAccess={handleRequestAccess}
          isRequestMode={true}
          activationCode={joinSearch}
          isCodeReadOnly={true}
        />
      )}
    </div>
  );
};

export default ManageClassContent;
