import React, { useState, useEffect } from "react";
import { Space, Typography, Alert, Button, message, Spin, Input, Modal } from "antd";
import { BookOutlined, SearchOutlined, KeyOutlined, CheckCircleOutlined, ClockCircleOutlined, LockOutlined } from "@ant-design/icons";
import { classService } from "../../../../../services/ClassService";
import AccederService from "../../../../../services/accederService";
import ManageClassList from "../../class-management/ManageClassList";
import ManageClassDetailsView from "../../class-management/ManageClassDetailsView";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { useSelector } from "react-redux";

const { Text, Title } = Typography;

const ManageClassContent = ({ onBack, tabData, setActiveTab }) => {
  const { t } = useTranslation();
  const isMobile = useSelector((state) => state.ui.isMobile);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(tabData?.classId || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Search all classes state
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchDone, setGlobalSearchDone] = useState(false);
  const [myClassIds, setMyClassIds] = useState(new Set());
  const [accessStatusMap, setAccessStatusMap] = useState({});

  // Access request modal state
  const [accessModal, setAccessModal] = useState({ open: false, classe: null });
  const [activationCode, setActivationCode] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);

  const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");

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
      if (!userId) {
        return;
      }

      // Admin sees ALL classes, gestionnaire sees classes in their establishments, others see their own
      const selectedRole = (localStorage.getItem("userRole") || "").toUpperCase();
      let data;
      if (selectedRole.includes("ADMIN")) {
        data = await classService.obtenirToutesLesClasses();
      } else if (selectedRole.includes("GESTIONNAIRE")) {
        // Get all classes then filter by gestionnaire's establishments
        const allClasses = await classService.obtenirToutesLesClasses();
        try {
          const token = localStorage.getItem("accessToken");
          const etabResp = await fetch(`${process.env.REACT_APP_API_BASE_URL}/etablissements`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (etabResp.ok) {
            const allEtabs = await etabResp.json();
            const myEtabIds = allEtabs.filter(e => e.gestionnaireId === userId).map(e => e.id);
            data = (allClasses || []).filter(c => myEtabIds.includes(c.etablissementId));
          } else {
            data = [];
          }
        } catch (e) {
          data = [];
        }
      } else {
        data = await classService.obtenirClassesUtilisateur(userId);
      }
      setClasses(data || []);

      console.log("Fetched user classes:", data);
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

  // Search ALL classes by name
  const handleGlobalSearch = async () => {
    if (!globalSearch.trim()) return;
    try {
      setGlobalSearchLoading(true);
      setGlobalSearchDone(false);
      const all = await classService.obtenirToutesLesClasses();
      const term = globalSearch.toLowerCase();
      const results = (all || []).filter(
        (c) =>
          c.nom?.toLowerCase().includes(term) ||
          c.niveau?.toLowerCase().includes(term)
      );

      // Check access status for each result
      const statusMap = {};
      const myIds = new Set(classes.map((c) => c.id));
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
      setGlobalSearchResults(results);
      setGlobalSearchDone(true);
    } catch (err) {
      message.error("Erreur lors de la recherche");
    } finally {
      setGlobalSearchLoading(false);
    }
  };

  // Submit access request
  const handleRequestAccess = async () => {
    if (!activationCode.trim()) {
      message.error("Veuillez entrer le code d'activation de la classe");
      return;
    }
    try {
      setRequestLoading(true);
      await AccederService.demanderAcces({
        utilisateurId: userId,
        classeId: accessModal.classe.id,
        codeActivation: activationCode.trim(),
      });
      message.success("Demande d'accès envoyée ! En attente d'approbation.");
      setAccessStatusMap((prev) => ({ ...prev, [accessModal.classe.id]: "EN_ATTENTE" }));
      setAccessModal({ open: false, classe: null });
      setActivationCode("");
    } catch (err) {
      message.error(err.message || "Erreur lors de la demande d'accès");
    } finally {
      setRequestLoading(false);
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
      // Store the class ID in localStorage for the exercise management page
      localStorage.setItem("selectedClassId", classId);
      setActiveTab("manage-exercises");
    } else {
      message.warning("Navigation non disponible");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div>
        {!selectedClassId ? (
          <div style={{ padding: "24px" }}>
            <div style={{ marginBottom: "24px" }}>
              <Space align="center" style={{ marginBottom: "16px" }}>
                <BookOutlined style={{ fontSize: "24px", color: "#4a6da7" }} />
                <Title level={2} style={{ margin: 0, color: "#2c3e50" }}>
                  {t('classes.manage.title', "Mes Classes")}
                </Title>
              </Space>
            </div>

            {/* SEARCH ALL CLASSES SECTION */}
            <div style={{
              background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
              border: "1px solid #667eea30",
              borderRadius: 12,
              padding: isMobile ? "12px" : "20px",
              marginBottom: 24,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <SearchOutlined style={{ color: "#667eea", fontSize: 18 }} />
                <Text strong style={{ color: "#2c3e50", fontSize: isMobile ? 14 : 16 }}>
                  Rechercher une classe par nom
                </Text>
                {isMobile && (
                  <span style={{ fontSize: 11, color: "#667eea", background: "#667eea15", borderRadius: 10, padding: "2px 8px", fontWeight: 600 }}>
                    Toutes les classes
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                <Input
                  placeholder="Nom de la classe, niveau..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onPressEnter={handleGlobalSearch}
                  prefix={<SearchOutlined style={{ color: "#aaa" }} />}
                  style={{ flex: 1, borderRadius: 8 }}
                  size={isMobile ? "middle" : "large"}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleGlobalSearch}
                  loading={globalSearchLoading}
                  size={isMobile ? "middle" : "large"}
                  style={{ borderRadius: 8, background: "#667eea", borderColor: "#667eea", whiteSpace: "nowrap" }}
                >
                  {!isMobile && "Rechercher"}
                </Button>
              </div>

              {/* Search Results */}
              {globalSearchDone && (
                <div style={{ marginTop: 16 }}>
                  {globalSearchResults.length === 0 ? (
                    <Text type="secondary">Aucune classe trouvée pour « {globalSearch} »</Text>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {globalSearchResults.length} classe(s) trouvée(s)
                      </Text>
                      {globalSearchResults.map((c) => {
                        const status = accessStatusMap[c.id];
                        const isApproved = status === "APPROVED";
                        const isPending = status === "EN_ATTENTE";
                        return (
                          <div
                            key={c.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: "white",
                              border: "1px solid #e8e8e8",
                              borderRadius: 10,
                              padding: isMobile ? "10px 12px" : "12px 16px",
                              gap: 12,
                              flexWrap: isMobile ? "wrap" : "nowrap",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: isMobile ? 13 : 15, color: "#2c3e50", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {c.nom}
                              </div>
                              <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>
                                {c.niveau}{c.etablissement?.nom ? ` • ${c.etablissement.nom}` : ""}
                              </div>
                            </div>
                            <div style={{ flexShrink: 0 }}>
                              {isApproved ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f0fff4", color: "#38a169", border: "1px solid #c6f6d5", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
                                  <CheckCircleOutlined /> Accès accordé
                                </span>
                              ) : isPending ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
                                  <ClockCircleOutlined /> En attente
                                </span>
                              ) : (
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<KeyOutlined />}
                                  onClick={() => {
                                    setAccessModal({ open: true, classe: c });
                                    setActivationCode("");
                                  }}
                                  style={{ borderRadius: 20, background: "#667eea", borderColor: "#667eea", fontSize: 12 }}
                                >
                                  Demander l'accès
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

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

            <ManageClassList
              classes={classes}
              loading={loading}
              error={error}
              successMessage={successMessage}
              refreshing={refreshing}
              onSelectClass={handleSelectClass}
              onRefresh={handleRefresh}
              onBack={onBack}
              onNavigateToCreate={setActiveTab ? () => setActiveTab("create-class") : undefined}
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
            onNavigateToCourseCreation={handleNavigateToCourseCreation}
            onNavigateToExerciseManagement={handleNavigateToExerciseManagement}
          />
        )}
      </div>

      {/* Access Request Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <KeyOutlined style={{ color: "#667eea" }} />
            <span>Demande d'accès — {accessModal.classe?.nom}</span>
          </div>
        }
        open={accessModal.open}
        onCancel={() => { setAccessModal({ open: false, classe: null }); setActivationCode(""); }}
        footer={null}
        width={isMobile ? "95%" : 480}
        centered
      >
        {accessModal.classe && (
          <div>
            <div style={{ background: "#f8f9fa", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontWeight: 600, color: "#2c3e50" }}>{accessModal.classe.nom}</div>
              <div style={{ fontSize: 13, color: "#718096", marginTop: 4 }}>
                Niveau : {accessModal.classe.niveau}
                {accessModal.classe.etablissement?.nom && ` • ${accessModal.classe.etablissement.nom}`}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Code d'activation de la classe *
              </Text>
              <Input
                placeholder="Entrez le code fourni par le modérateur..."
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                onPressEnter={handleRequestAccess}
                prefix={<LockOutlined style={{ color: "#aaa" }} />}
                size="large"
                style={{ borderRadius: 8 }}
              />
              <Text type="secondary" style={{ fontSize: 12, marginTop: 6, display: "block" }}>
                Demandez le code d'activation au modérateur ou à l'établissement.
              </Text>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button
                onClick={() => { setAccessModal({ open: false, classe: null }); setActivationCode(""); }}
                style={{ borderRadius: 8 }}
              >
                Annuler
              </Button>
              <Button
                type="primary"
                loading={requestLoading}
                onClick={handleRequestAccess}
                icon={<KeyOutlined />}
                style={{ borderRadius: 8, background: "#667eea", borderColor: "#667eea" }}
              >
                Envoyer la demande
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageClassContent;
