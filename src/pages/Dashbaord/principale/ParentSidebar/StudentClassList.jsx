import React, { useState, useEffect, useCallback, useRef } from "react";
import { Spin, Button, Input, message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { classService } from "../../../../services/ClassService";
import { coursProgrammerService } from "../../../../services/coursProgrammerService";
import AccederService from "../../../../services/accederService";
import CoursProgrammeManagement from "../content/InterfaceCours/CoursProgrammeManagement";
import ParentClassManagementModal from "./ParentClassManagementModal";
import AddChildModal from "./AddChildModal";
import JoinClassModal from "../../../../components/common/JoinClassModal";
import {
  openingDone,
  openingFailed,
  openingInfo,
  openingStart,
  selectParentChildForClasses,
  useMountedRef,
} from "../../../../utils/notificationNavigation";

// ── helpers ────────────────────────────────────────────────────────────────────
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faArrowsRotate,
  faBook,
  faBuildingColumns,
  faCalendarDays,
  faCircleCheck,
  faClock,
  faLock,
  faMagnifyingGlass,
  faPlus,
  faRightToBracket,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
const LEVEL_CONFIG = {
  MATERNELLE: {
    label: "Maternelle",
    color: "#1976D2",
    bg: "#E3F2FD",
  },
  PRIMAIRE: {
    label: "Primaire",
    color: "#2E7D32",
    bg: "#E8F5E8",
  },
  COLLEGE: {
    label: "Collège",
    color: "#F57C00",
    bg: "#FFF3E0",
  },
  LYCEE: {
    label: "Lycée",
    color: "#D32F2F",
    bg: "#FFEBEE",
  },
  UNIVERSITE: {
    label: "Université",
    color: "#7B1FA2",
    bg: "#F3E5F5",
  },
  AUTRES: {
    label: "Autre",
    color: "#616161",
    bg: "#F5F5F5",
  },
};
const getLevelKey = (niveau = "") => {
  if (!niveau) return "AUTRES";
  const n = niveau.toLowerCase();
  if (n.includes("maternelle")) return "MATERNELLE";
  if (
    n.includes("primaire") ||
    n.includes("cp") ||
    n.includes("ce") ||
    n.includes("cm")
  )
    return "PRIMAIRE";
  if (["6ème", "5ème", "4ème", "3ème"].some((v) => n.includes(v.toLowerCase())))
    return "COLLEGE";
  if (["2nde", "1ère", "terminale"].some((v) => n.includes(v.toLowerCase())))
    return "LYCEE";
  if (
    ["licence", "master", "doctorat"].some((v) => n.includes(v.toLowerCase()))
  )
    return "UNIVERSITE";
  return "AUTRES";
};
const ACCESS = {
  APPROVED: {
    label: "Accès autorisé",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    icon: <FontAwesomeIcon icon={faCircleCheck} />,
  },
  PENDING: {
    label: "En attente",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: <FontAwesomeIcon icon={faClock} />,
  },
  REJECTED: {
    label: "Refusée",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: <FontAwesomeIcon icon={faLock} />,
  },
};

// ── main component ─────────────────────────────────────────────────────────────

const StudentClassList = ({ isParentView = false, tabData = null }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const parentId = localStorage.getItem("userId");
  const userRole = (localStorage.getItem("userRole") || "").toUpperCase();
  const isParent = userRole.includes("PARENT");
  const [activeUserId, setActiveUserId] = useState(
    isParent ? localStorage.getItem("selectedChildId") || parentId : parentId,
  );
  const userId = activeUserId;
  const [userClasses, setUserClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [accessMap, setAccessMap] = useState({}); // classId -> APPROVED|PENDING|REJECTED
  const [courseCounts, setCourseCounts] = useState({}); // classId -> number
  const [memberCounts, setMemberCounts] = useState({}); // classId -> number
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // navigation
  const [selectedClass, setSelectedClass] = useState(null);
  const [showCourses, setShowCourses] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [searchCode, setSearchCode] = useState("");
  const [pendingMsg, setPendingMsg] = useState(null);
  // User whose classes are currently loaded (a notification may switch child)
  const [loadedUserId, setLoadedUserId] = useState(null);
  // Class to open from a notification: { classId, access, rid, expectedUser, refetched }
  const [navRequest, setNavRequest] = useState(null);
  const navRidRef = useRef(0);
  const mountedRef = useMountedRef();

  // "Rejoindre une classe" call-to-action from the dashboard: …/classes?join=1 opens the join flow.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("join") === "1") {
      setShowSearchModal(true);
      params.delete("join");
      const rest = params.toString();
      navigate(`${location.pathname}${rest ? `?${rest}` : ""}`, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  // ── child switch listener ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      const newId = isParent
        ? localStorage.getItem("selectedChildId") || parentId
        : parentId;
      setActiveUserId(newId);
    };
    window.addEventListener("childChanged", handler);
    window.addEventListener("childrenUpdated", handler);
    return () => {
      window.removeEventListener("childChanged", handler);
      window.removeEventListener("childrenUpdated", handler);
    };
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
      const active = (allData || []).filter((c) => c.etat === "ACTIF");
      setAllClasses(active);

      // 2. Build access map from approved list
      const map = {};
      (approvedData || []).forEach((c) => {
        map[c.id] = "APPROVED";
      });

      // 3. Pending/rejected requests — fetch per class (only for classes not already approved)
      const nonApproved = active.filter((c) => !map[c.id]);
      const reqResults = await Promise.allSettled(
        nonApproved.map((c) =>
          AccederService.obtenirDemandesAccesPourClasse(c.id),
        ),
      );
      reqResults.forEach((r, i) => {
        if (r.status !== "fulfilled") return;
        const reqs = (r.value || []).filter(
          (req) => req.utilisateurId === userId,
        );
        if (reqs.length === 0) return;
        const latest = reqs[reqs.length - 1];
        const classId = nonApproved[i].id;
        if (!map[classId]) {
          const etat = latest.etat || "";
          if (etat === "EN_ATTENTE") map[classId] = "PENDING";
          else if (etat === "APPROUVEE") map[classId] = "APPROVED";
          else if (etat === "REJETEE") map[classId] = "REJECTED";
          else map[classId] = etat || "PENDING";
        }
      });
      setAccessMap(map);

      // 4. User's classes = those in the map
      const myClasses = active.filter((c) => map[c.id]);
      setUserClasses(myClasses);

      // 5. Course counts per class using the class endpoint
      const countMap = {};
      await Promise.all(
        myClasses.map(async (c) => {
          try {
            const progs =
              await coursProgrammerService.obtenirProgrammationParClasse(c.id);
            countMap[c.id] = (progs || []).length;
          } catch {
            countMap[c.id] = 0;
          }
        }),
      );
      setCourseCounts(countMap);

      // 6. Member counts
      const memberMap = {};
      await Promise.all(
        myClasses.map(async (c) => {
          try {
            const members = await AccederService.obtenirUtilisateursAvecAcces(
              c.id,
            );
            memberMap[c.id] = (members || []).length;
          } catch {
            memberMap[c.id] = c.eleves?.length || 0;
          }
        }),
      );
      setMemberCounts(memberMap);
    } catch (e) {
      message.error("Erreur lors du chargement des classes");
    } finally {
      setLoading(false);
      setLoadedUserId(userId);
    }
  }, [userId]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  // ── open a class from a notification (tabData.classId) ────────────────────
  // A parent first switches to the child concerned. The request carries an id:
  // only a newer click supersedes it (no effect-cleanup flag, so re-renders
  // never cancel the in-flight child lookup).
  useEffect(() => {
    const classId = tabData?.classId;
    if (!classId) return;
    const rid = ++navRidRef.current;
    setShowCourses(false);
    setSelectedClass(null);
    openingStart("Ouverture de la classe…");
    (async () => {
      let expectedUser = null;
      if (isParent) {
        try {
          expectedUser = await selectParentChildForClasses([classId]);
        } catch {
          expectedUser = null;
        }
      }
      if (!mountedRef.current || rid !== navRidRef.current) return;
      setNavRequest({
        classId,
        access: tabData.access || null,
        rid,
        expectedUser,
        refetched: false,
      });
    })();
  }, [tabData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!navRequest || loading) return;
    if (navRequest.rid !== navRidRef.current) return;
    const forUser = navRequest.expectedUser || userId;
    // Wait for the (new) child's classes to be loaded
    if (forUser !== userId || loadedUserId !== userId) return;
    const classe =
      userClasses.find((c) => String(c.id) === String(navRequest.classId)) ||
      null;
    const status = classe ? accessMap[classe.id] : null;
    if (!classe && !navRequest.refetched) {
      // List may predate the notification (access just approved): reload once
      setNavRequest({ ...navRequest, refetched: true });
      fetchData();
      return;
    }
    setNavRequest(null);
    if (!classe) {
      openingFailed(
        navRequest.access === "rejected"
          ? "Votre demande d'accès à cette classe a été refusée."
          : "Cette classe n'existe plus ou ne vous est plus accessible.",
      );
      return;
    }
    if (status === "APPROVED") {
      openingDone();
      setSelectedClass(classe);
      setShowCourses(true);
    } else if (status === "PENDING") {
      openingDone();
      setPendingMsg(classe.nom);
    } else {
      openingInfo(
        `La demande d'accès à « ${classe.nom} » a été refusée.`,
      );
    }
  }, [navRequest, loading, loadedUserId, userId, userClasses, accessMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    message.success("Actualisé");
  };

  // ── search & join ──────────────────────────────────────────────────────────
  const handleClearSearch = () => {
    setSearchCode("");
    setSelectedClass(null);
  };
  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    handleClearSearch();
  };
  // The class was found by its code (public preview): open the access-request confirmation
  // (child choice for a parent) with the code pre-filled.
  const handlePreviewConfirmed = (preview) => {
    const known = allClasses.find((c) => c.id === preview.id);
    const classe = known || {
      id: preview.id,
      nom: preview.nom,
      niveau: preview.niveau,
      etablissement: preview.etablissementNom ? { nom: preview.etablissementNom } : null,
      codeActivation: preview.code,
    };
    setSearchCode(preview.code);
    setSelectedClass(classe);
    setShowSearchModal(false);
    setShowRequestModal(true);
  };
  const handleRequestAccess = async (classe, code, childId = null) => {
    try {
      await AccederService.demanderAcces({
        utilisateurId: isParentView ? parentId : userId,
        classeId: classe.id,
        codeActivation: code,
        estParent: isParentView,
        eleveAssocieId: isParentView ? childId : null,
      });
      message.success("Demande envoyée avec succès");
      setAccessMap((prev) => ({
        ...prev,
        [classe.id]: "PENDING",
      }));
      setUserClasses((prev) =>
        prev.some((c) => c.id === classe.id) ? prev : [...prev, classe],
      );
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

  // ── guard: parent with no child selected ──────────────────────────────────
  if (isParentView && isParent && userId === parentId) {
    return (
      <div className="w-full px-2 py-3">
        <div
          className="bg-white rounded-xl p-10 text-center"
          style={{
            border: "1px solid #e4eaf4",
          }}
        >
          <FontAwesomeIcon
            icon={faUserGroup}
            style={{
              fontSize: 48,
              color: "#d1d5db",
              marginBottom: 12,
            }}
          />
          <p className="text-base font-semibold text-gray-700 mb-1">
            Aucun enfant associé
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Vous n'avez pas encore d'enfant associé à votre compte. Ajoutez un
            enfant pour gérer ses classes.
          </p>
          <button
            onClick={() => setShowAddChild(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(135deg,#2563eb,#4f46e5)",
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
            Ajouter un enfant
          </button>
        </div>
        <AddChildModal
          isOpen={showAddChild}
          onClose={() => setShowAddChild(false)}
          onChildAdded={() => {
            setShowAddChild(false);
            message.success("Enfant ajouté avec succès");
          }}
        />
      </div>
    );
  }

  // ── if showing courses ─────────────────────────────────────────────────────
  if (showCourses && selectedClass) {
    return (
      <CoursProgrammeManagement
        selectedClass={selectedClass}
        onBack={() => {
          setShowCourses(false);
          setSelectedClass(null);
        }}
      />
    );
  }

  // ── filter ─────────────────────────────────────────────────────────────────
  const filtered = userClasses.filter(
    (c) =>
      !search ||
      c.nom?.toLowerCase().includes(search.toLowerCase()) ||
      c.niveau?.toLowerCase().includes(search.toLowerCase()),
  );
  const approvedCount = userClasses.filter(
    (c) => accessMap[c.id] === "APPROVED",
  ).length;
  const pendingCount = userClasses.filter(
    (c) => accessMap[c.id] === "PENDING",
  ).length;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full px-2 py-3">
      {/* ── Header ── */}
      <div
        className="mb-4 rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1d3557 0%, #457b9d 100%)",
        }}
      >
        <div className="px-4 py-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon
                  icon={faBook}
                  style={{
                    fontSize: 18,
                  }}
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold leading-tight">
                  {isParentView
                    ? `Classes de ${(localStorage.getItem("selectedChildName") || "").trim() || "votre enfant"}`
                    : "Mes Classes"}
                </h1>
                <p className="text-xs opacity-80">
                  {userClasses.length} classe
                  {userClasses.length !== 1 ? "s" : ""} disponible
                  {userClasses.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isParentView && (
                <button
                  onClick={() => setShowAddChild(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors border border-white/30"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    style={{
                      fontSize: 11,
                    }}
                  />
                  <span className="hidden sm:inline">Enfant</span>
                </button>
              )}
              {/* Primary action, always labelled and visible without scrolling (desktop and mobile) */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white text-[#1d3557] hover:bg-indigo-50 text-xs sm:text-sm font-bold shadow-md transition-colors"
              >
                <FontAwesomeIcon icon={faRightToBracket} />
                <span>Rejoindre une classe</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors border border-white/30"
              >
                <FontAwesomeIcon
                  icon={faArrowsRotate}
                  style={{
                    fontSize: 13,
                  }}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-2">
            {[
              {
                icon: <FontAwesomeIcon icon={faBook} />,
                val: userClasses.length,
                label: "total",
              },
              {
                icon: <FontAwesomeIcon icon={faCircleCheck} />,
                val: approvedCount,
                label: "actives",
              },
              {
                icon: <FontAwesomeIcon icon={faClock} />,
                val: pendingCount,
                label: "en attente",
              },
            ].map(({ icon, val, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5"
              >
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
            prefix={
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                style={{
                  color: "rgba(255,255,255,0.6)",
                }}
              />
            }
            placeholder="Filtrer mes classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        <div
          className="mb-3 px-4 py-3 rounded-xl flex items-center justify-between gap-3"
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
          }}
        >
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <FontAwesomeIcon icon={faClock} />
            <span>
              Votre demande pour <strong>{pendingMsg}</strong> est en cours de
              traitement.
            </span>
          </div>
          <button
            onClick={() => setPendingMsg(null)}
            className="text-amber-500 hover:text-amber-700 text-xs font-medium"
          >
            Fermer
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="bg-white rounded-xl p-10 text-center"
          style={{
            border: "1px solid #e4eaf4",
          }}
        >
          <FontAwesomeIcon
            icon={faBook}
            style={{
              fontSize: 48,
              color: "#d1d5db",
              marginBottom: 12,
            }}
          />
          <p className="text-base font-semibold text-gray-700 mb-1">
            {userClasses.length === 0
              ? "Aucune classe disponible"
              : "Aucune classe trouvée"}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            {userClasses.length === 0
              ? "Rejoignez une classe avec un code d'activation."
              : "Aucune classe ne correspond à votre recherche."}
          </p>
          <Button
            type="primary"
            icon={<FontAwesomeIcon icon={faRightToBracket} />}
            onClick={() => setShowSearchModal(true)}
            style={{
              borderRadius: 8,
            }}
          >
            Rejoindre une classe
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((classe) => {
            const status = accessMap[classe.id];
            const isApproved = status === "APPROVED";
            const isPending = status === "PENDING";
            const levelKey = getLevelKey(classe.niveau);
            const levelCfg = LEVEL_CONFIG[levelKey];
            const accessCfg = ACCESS[status];
            const courseCount = courseCounts[classe.id] ?? "—";
            const memberCount =
              memberCounts[classe.id] ?? (classe.eleves?.length || 0);
            return (
              <div
                key={classe.id}
                className="bg-white rounded-xl overflow-hidden transition-shadow hover:shadow-md"
                style={{
                  border: isApproved
                    ? "1px solid #bfdbfe"
                    : "1px solid #e4eaf4",
                }}
              >
                {/* Card top accent */}
                <div
                  className="h-1.5 w-full"
                  style={{
                    background: isApproved
                      ? "linear-gradient(90deg,#2563eb,#4f46e5)"
                      : "#e5e7eb",
                  }}
                />

                <div className="p-4">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight truncate mb-0.5">
                        {classe.nom}
                      </h3>
                      {classe.etablissement?.nom && (
                        <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                          <FontAwesomeIcon
                            icon={faBuildingColumns}
                            style={{
                              fontSize: 10,
                            }}
                          />
                          {classe.etablissement.nom}
                        </p>
                      )}
                    </div>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{
                        color: levelCfg.color,
                        background: levelCfg.bg,
                      }}
                    >
                      {classe.niveau || levelCfg.label}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{
                          background: "#eff6ff",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faBook}
                          style={{
                            fontSize: 11,
                            color: "#2563eb",
                          }}
                        />
                      </div>
                      <span>
                        <strong className="text-gray-700">{courseCount}</strong>{" "}
                        cours
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{
                          background: "#f0fdf4",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faUserGroup}
                          style={{
                            fontSize: 11,
                            color: "#16a34a",
                          }}
                        />
                      </div>
                      <span>
                        <strong className="text-gray-700">{memberCount}</strong>{" "}
                        membres
                      </span>
                    </div>
                    {classe.dateCreation && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                        <FontAwesomeIcon
                          icon={faCalendarDays}
                          style={{
                            fontSize: 10,
                          }}
                        />
                        {new Date(classe.dateCreation).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "short",
                          },
                        )}
                      </div>
                    )}
                  </div>

                  {/* Access badge */}
                  {accessCfg && (
                    <div
                      className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        color: accessCfg.color,
                        background: accessCfg.bg,
                        border: `1px solid ${accessCfg.border}`,
                      }}
                    >
                      {accessCfg.icon} {accessCfg.label}
                    </div>
                  )}

                  {/* Action button */}
                  <div className="pt-3 border-t border-gray-50">
                    {isApproved ? (
                      <button
                        onClick={() => handleEnterClass(classe)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                        style={{
                          background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                        }}
                      >
                        Entrer dans la classe{" "}
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          style={{
                            fontSize: 12,
                          }}
                        />
                      </button>
                    ) : isPending ? (
                      <button
                        onClick={() => setPendingMsg(classe.nom)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          background: "#fffbeb",
                          color: "#d97706",
                          border: "1px solid #fde68a",
                        }}
                      >
                        <FontAwesomeIcon icon={faClock} /> Demande en attente
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowSearchModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        <FontAwesomeIcon icon={faLock} /> Demander l'accès
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Join modal: code → class preview → confirmation ── */}
      <JoinClassModal
        open={showSearchModal}
        onClose={handleCloseSearchModal}
        type={isParentView ? "parent" : "eleve"}
        onContinue={handlePreviewConfirmed}
        initialCode={searchCode}
      />

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
          isParentView={isParentView}
          parentId={parentId}
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
