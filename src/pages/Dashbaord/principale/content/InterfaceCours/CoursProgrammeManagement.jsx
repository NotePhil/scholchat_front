import React, { useState, useEffect } from "react";
import CourseDetailsView from "./CourseDetailsView";
import LiveSession from "../CoursProgrammerContent/LiveSession/LiveSession";

// ── Pagination ────────────────────────────────────────────────────────────────
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBookOpen,
  faCalendarDays,
  faChevronRight,
  faCircleCheck,
  faCircleDot,
  faCircleExclamation,
  faCirclePlay,
  faClock,
  faEye,
  faFilter,
  faGraduationCap,
  faLocationDot,
  faMagnifyingGlass,
  faPlus,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
const Pagination = ({ total, page, totalPages, onPage }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from(
    {
      length: totalPages,
    },
    (_, i) => i + 1,
  ).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  const withEllipsis = pages.reduce((acc, p, i, arr) => {
    if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
    acc.push(p);
    return acc;
  }, []);
  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
      <span className="text-xs text-gray-500">
        {total} élément{total !== 1 ? "s" : ""} · page {page}/{totalPages}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onPage((p) => Math.max(1, p - 1))}
          className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          ‹
        </button>
        {withEllipsis.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1 text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${p === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          disabled={page === totalPages}
          onClick={() => onPage((p) => Math.min(totalPages, p + 1))}
          className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  PLANIFIE: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <FontAwesomeIcon icon={faClock} className="w-3 h-3" />,
    label: "Planifié",
  },
  EN_COURS: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <FontAwesomeIcon icon={faCirclePlay} className="w-3 h-3" />,
    label: "En cours",
  },
  TERMINE: {
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />,
    label: "Terminé",
  },
  ANNULE: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3" />,
    label: "Annulé",
  },
};
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date non définie";
const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
const sortByCourseStatus = (arr) => {
  const ORDER = {
    EN_COURS: 0,
    PLANIFIE: 1,
    ANNULE: 2,
  };
  return [...arr].sort((a, b) => {
    const oa = ORDER[a.etatCoursProgramme] ?? 3;
    const ob = ORDER[b.etatCoursProgramme] ?? 3;
    return oa !== ob
      ? oa - ob
      : new Date(b.dateCoursPrevue) - new Date(a.dateCoursPrevue);
  });
};

// ── Main component ────────────────────────────────────────────────────────────
const CoursProgrammeManagement = ({
  selectedClass,
  onBack,
  onScheduleCourse,
  userRole,
  tabData,
}) => {
  const [courses, setCourses] = useState([]); // enriched scheduled courses
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [page, setPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState(
    tabData?.courseId
      ? {
          coursId: tabData.courseId,
        }
      : null,
  );
  const [liveSession, setLiveSession] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
  });
  const PAGE_SIZE = 6;
  const userId = (() => {
    const isParent = (localStorage.getItem("userRole") || "")
      .toUpperCase()
      .includes("PARENT");
    return isParent
      ? localStorage.getItem("selectedChildId") ||
          localStorage.getItem("userId")
      : localStorage.getItem("userId");
  })();

  // ── Data loading ────────────────────────────────────────────────────────────
  // Strategy: 2 parallel requests, then join locally.
  //   1. GET /cours-programmes/by-classe/{id}  OR  /accessible/{userId}
  //   2. GET /cours/accessibles/{userId}  (batch course details — no per-course calls)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      setError("");
      setPage(1);
      try {
        const { coursProgrammerService } =
          await import("../../../../../services/coursProgrammerService");
        const { coursService } =
          await import("../../../../../services/CoursService");
        const [scheduledRes, detailsRes] = await Promise.allSettled([
          selectedClass
            ? coursProgrammerService.obtenirProgrammationParClasse(
                selectedClass.id,
              )
            : coursProgrammerService.obtenirProgrammationAccessible(userId),
          coursService.getCoursAccessibles(userId).catch(() => []),
        ]);
        if (cancelled) return;
        const scheduled =
          scheduledRes.status === "fulfilled" ? scheduledRes.value || [] : [];
        const detailsMap = new Map(
          (detailsRes.status === "fulfilled" ? detailsRes.value || [] : []).map(
            (c) => [c.id, c],
          ),
        );
        const enriched = scheduled.map((sc) => {
          const detail = detailsMap.get(sc.coursId) || {};
          return {
            ...sc,
            cours: {
              id: sc.coursId,
              titre: detail.titre || sc.description || "Cours sans titre",
              description: detail.description || "",
            },
          };
        });
        setCourses(sortByCourseStatus(enriched));
      } catch (err) {
        if (!cancelled) setError(`Erreur lors du chargement : ${err.message}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedClass, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  // ── Check live session on-demand (only when student clicks "Rejoindre") ────
  const handleJoinLive = async (course) => {
    const cId = course.cours?.id || course.coursId;
    try {
      const { default: liveSessionService } =
        await import("../../../../../services/LiveSessionService");
      const session = await liveSessionService.getActiveSession(cId);
      if (session) {
        setLiveSession({
          scheduledCourse: course,
          cours: course.cours,
          isModerator: false,
        });
      } else {
        setToast({
          show: true,
          message: "Aucune session active pour ce cours.",
        });
        setTimeout(
          () =>
            setToast({
              show: false,
              message: "",
            }),
          3000,
        );
      }
    } catch {
      setToast({
        show: true,
        message: "Impossible de vérifier la session.",
      });
      setTimeout(
        () =>
          setToast({
            show: false,
            message: "",
          }),
        3000,
      );
    }
  };
  const getClassName = (course) => {
    if (selectedClass) return selectedClass.nom;
    if (course.classes?.length > 0) return course.classes[0].nom || "";
    return "";
  };

  // ── Show course details ───────────────────────────────────────────────────
  if (selectedCourse) {
    return (
      <CourseDetailsView
        courseId={selectedCourse.coursId || selectedCourse.id}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  // ── Show live session ─────────────────────────────────────────────────────
  if (liveSession) {
    return (
      <LiveSession
        scheduledCourse={liveSession.scheduledCourse}
        cours={liveSession.cours}
        isModerator={false}
        onClose={() => setLiveSession(null)}
      />
    );
  }

  // ── Filter + paginate ─────────────────────────────────────────────────────
  const filtered = courses.filter((c) => {
    const titre = c.cours?.titre || "";
    const desc = c.cours?.description || "";
    const matchSearch =
      !searchTerm ||
      titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "TOUS" || c.etatCoursProgramme === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // Stats
  const stats = {
    planifie: courses.filter((c) => c.etatCoursProgramme === "PLANIFIE").length,
    enCours: courses.filter((c) => c.etatCoursProgramme === "EN_COURS").length,
    termine: courses.filter((c) => c.etatCoursProgramme === "TERMINE").length,
    total: courses.length,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full px-2 py-3">
      {/* Header */}
      <div className="bg-white rounded-xl shadow mb-3 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={onBack}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-bold flex items-center truncate">
                    <FontAwesomeIcon
                      icon={faGraduationCap}
                      className="w-4 h-4 mr-2 flex-shrink-0"
                    />
                    <span className="truncate">
                      {selectedClass?.nom || "Gestion des Cours"}
                    </span>
                  </h1>
                  {onScheduleCourse && (
                    <button
                      onClick={onScheduleCourse}
                      className="px-3 py-1 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-1 text-xs"
                    >
                      <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                      Programmer
                    </button>
                  )}
                </div>
                <p className="text-blue-100 text-xs truncate">
                  {selectedClass
                    ? `${selectedClass.niveau} · ${selectedClass.description || "Espace de classe"}`
                    : "Tous mes cours"}
                </p>
              </div>
            </div>
            <span className="text-blue-100 text-xs flex-shrink-0 hidden sm:block">
              {courses.length} cours
            </span>
          </div>
        </div>

        {/* Search + status filter */}
        <div className="px-3 py-2 bg-gray-50 border-t">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon
                icon={faFilter}
                className="w-3.5 h-3.5 text-gray-500 flex-shrink-0"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="TOUS">Tous les statuts</option>
                <option value="PLANIFIE">Planifiés</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminés</option>
                <option value="ANNULE">Annulés</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-2">
          <FontAwesomeIcon
            icon={faCircleExclamation}
            className="w-5 h-5 text-red-600 flex-shrink-0"
          />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center min-h-64 gap-3">
          <FontAwesomeIcon
            icon={faSpinner}
            className="w-8 h-8 animate-spin text-blue-600"
          />
          <span className="text-gray-600">Chargement des cours…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <FontAwesomeIcon
            icon={faBookOpen}
            className="w-12 h-12 text-gray-400 mx-auto mb-3"
          />
          <h3 className="text-base font-medium text-gray-900 mb-1">
            {courses.length === 0
              ? "Aucun cours disponible"
              : "Aucun cours trouvé"}
          </h3>
          <p className="text-sm text-gray-600">
            {courses.length === 0
              ? "Aucun cours n'a encore été programmé pour vous."
              : "Aucun cours ne correspond à vos critères de recherche."}
          </p>
        </div>
      ) : (
        <>
          {/* Course cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paged.map((course) => {
              const s =
                STATUS_STYLE[course.etatCoursProgramme] ||
                STATUS_STYLE["PLANIFIE"];
              const isLive = course.etatCoursProgramme === "EN_COURS";
              const className = getClassName(course);
              return (
                <div
                  key={course.id}
                  className={`bg-white rounded-xl shadow-lg transition-all duration-300 border-2 overflow-hidden ${isLive ? "border-green-400 shadow-green-100" : "border-gray-100 hover:shadow-xl"}`}
                >
                  {/* Live banner */}
                  {isLive && (
                    <div className="bg-green-500 px-4 py-1.5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <span className="text-white text-xs font-bold uppercase tracking-widest">
                        Session en direct
                      </span>
                    </div>
                  )}

                  {/* Card body — click to open details */}
                  <div
                    onClick={() => setSelectedCourse(course)}
                    className="p-3 sm:p-4 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-base text-gray-900 break-words">
                            {course.cours?.titre || "Titre non disponible"}
                          </h3>
                          <div
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${s.color}`}
                          >
                            <div className="flex items-center gap-1">
                              {s.icon}
                              <span>{s.label}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-500 text-xs line-clamp-2">
                          {course.cours?.description || ""}
                        </p>
                        {className && (
                          <p className="text-indigo-600 text-xs font-medium mt-1 flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={faGraduationCap}
                              className="w-3 h-3"
                            />
                            {className}
                          </p>
                        )}
                      </div>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon
                          icon={faCalendarDays}
                          className="w-3.5 h-3.5"
                        />
                        {fmtDate(course.dateCoursPrevue)}
                      </span>
                      {fmtTime(course.dateCoursPrevue) && (
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon
                            icon={faClock}
                            className="w-3.5 h-3.5"
                          />
                          {fmtTime(course.dateCoursPrevue)}
                        </span>
                      )}
                      {course.lieu && (
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon
                            icon={faLocationDot}
                            className="w-3.5 h-3.5"
                          />
                          {course.lieu}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                    {isLive ? (
                      <button
                        onClick={() => handleJoinLive(course)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors shadow"
                      >
                        <FontAwesomeIcon
                          icon={faCircleDot}
                          className="w-4 h-4 animate-pulse"
                        />
                        Rejoindre la session en direct
                      </button>
                    ) : course.etatCoursProgramme === "TERMINE" ? (
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm transition-colors"
                      >
                        <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                        Voir le contenu du cours
                      </button>
                    ) : course.etatCoursProgramme === "ANNULE" ? (
                      <div className="flex items-center gap-2 py-2 px-3 bg-red-50 rounded-xl">
                        <FontAwesomeIcon
                          icon={faCircleExclamation}
                          className="w-4 h-4 text-red-400 flex-shrink-0"
                        />
                        <span className="text-xs text-red-500 font-medium">
                          Ce cours a été annulé
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 rounded-xl">
                        <FontAwesomeIcon
                          icon={faClock}
                          className="w-4 h-4 text-blue-400 flex-shrink-0"
                        />
                        <span className="text-xs text-blue-600 font-medium">
                          En attente du démarrage par le professeur
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            total={filtered.length}
            page={safePage}
            totalPages={totalPages}
            onPage={setPage}
          />

          {/* Stats strip */}
          <div className="mt-6 bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FontAwesomeIcon
                icon={faBookOpen}
                className="w-4 h-4 text-indigo-600"
              />
              Statistiques des cours
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "Planifiés",
                  value: stats.planifie,
                  color: "blue",
                },
                {
                  label: "En cours",
                  value: stats.enCours,
                  color: "green",
                },
                {
                  label: "Terminés",
                  value: stats.termine,
                  color: "gray",
                },
                {
                  label: "Total",
                  value: stats.total,
                  color: "purple",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className={`text-center p-3 bg-${color}-50 rounded-lg`}
                >
                  <div className={`text-xl font-bold text-${color}-600 mb-0.5`}>
                    {value}
                  </div>
                  <div className="text-xs text-gray-600">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-10 right-10 z-[2000] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 bg-blue-600 text-white">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
export default CoursProgrammeManagement;
