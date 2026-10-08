import React, { useState, useEffect, useCallback, useRef } from "react";
import { Empty, Tag, Spin } from "antd";
import StudentExerciseView from "./StudentExerciseView";
import StudentExerciseResultView from "./StudentExerciseResultView";
import { exerciseProgrammerService } from "../../../../../services/exerciseProgrammerService";
import {
  openingDone,
  openingFailed,
  openingInfo,
  openingStart,
  selectParentChildForClasses,
  useMountedRef,
} from "../../../../../utils/notificationNavigation";

// ── helpers ────────────────────────────────────────────────────────────────────
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faBook,
  faCalendarDays,
  faCircleCheck,
  faCirclePlay,
  faClock,
  faEye,
  faFileLines,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
const getUserId = () => {
  const isParent = (localStorage.getItem("userRole") || "")
    .toUpperCase()
    .includes("PARENT");
  return isParent
    ? localStorage.getItem("selectedChildId") || localStorage.getItem("userId")
    : localStorage.getItem("userId");
};
/**
 * Who is looking: the student, or a parent following the selected child.
 * A minor child has no account of their own, so the parent hands in the
 * homework for them; an adult child answers from their own login and the
 * parent only follows the copies and marks.
 */
const getViewer = () => {
  const isParent = (localStorage.getItem("userRole") || "")
    .toUpperCase()
    .includes("PARENT");
  const childId = localStorage.getItem("selectedChildId");
  if (!isParent || !childId) {
    return { isParentView: false, childName: "", canAnswer: true };
  }
  const childName = (localStorage.getItem("selectedChildName") || "").trim();
  const hasAccount = localStorage.getItem("selectedChildHasAccount") === "true";
  return { isParentView: true, childName, canAnswer: !hasAccount };
};
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") || localStorage.getItem("authToken")}`,
});
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const isOverdue = (dateFinStr) =>
  dateFinStr && new Date(dateFinStr) < new Date();

// ── status config ──────────────────────────────────────────────────────────────

const STATUS = {
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
const StatusBadge = ({ etat }) => {
  const c = STATUS[etat];
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

// ── filter tabs ────────────────────────────────────────────────────────────────

const TABS = [
  {
    key: "all",
    label: "Tous",
  },
  {
    key: "todo",
    label: "À rendre",
  },
  {
    key: "soumis",
    label: "Soumis",
  },
  {
    key: "corriges",
    label: "Corrigés",
  },
];

// ── main component ─────────────────────────────────────────────────────────────

const StudentDevoirsContent = ({ tabData = null }) => {
  // Each item: ExerciseProgrammerResponseDTO enriched with myParticipation
  const [devoirs, setDevoirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedDevoir, setSelectedDevoir] = useState(null);
  const [resultDevoir, setResultDevoir] = useState(null);
  const [viewer, setViewer] = useState(getViewer);
  // Legacy notification (ASSIGNMENT / classeId): list filtered to that class
  const [classFilter, setClassFilter] = useState(null); // { id, nom }
  const load = useCallback(async () => {
    setViewer(getViewer());
    const userId = getUserId();
    if (!userId) return;
    setLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      const headers = getAuthHeaders();

      // 1. Get student's enrolled classes
      const classesResp = await fetch(
        `${baseUrl}/acceder/utilisateurs/${userId}/classes`,
        {
          headers,
        },
      );
      const classes = classesResp.ok ? await classesResp.json() : [];

      // 2. For each class, fetch exerciseProgrammer records filtered to DEVOIR.
      //    ExerciseProgrammerResponseDTO already embeds:
      //      - questions[]       (stubs, used for count)
      //      - participations[]  (all students' participations — we pick ours)
      //      - exerciseId        (base exercise ID, needed by StudentExerciseView)
      const seen = new Set();
      const all = [];
      await Promise.all(
        classes.map(async (cls) => {
          try {
            const r = await fetch(
              `${baseUrl}/exercises-programmer/classe/${cls.id}`,
              {
                headers,
              },
            );
            if (!r.ok) return;
            const records = await r.json();
            for (const prog of records) {
              if (seen.has(prog.id)) continue;
              if (prog.typeAssignation !== "DEVOIR") continue;
              seen.add(prog.id);
              if (!prog.exerciseId) {
                console.error(
                  "[StudentDevoirsContent] programmer record missing exerciseId — skipping devoir, questions could not be resolved:",
                  prog,
                );
                continue;
              }

              // Pick this student's participation from the embedded list
              const myParticipation =
                (prog.participations || []).find(
                  (p) => p.utilisateurId === userId,
                ) || null;
              all.push({
                ...prog,
                _classIds: [
                  ...new Set([
                    cls.id,
                    ...(prog.classesDiffusees || []).map((c) => c.id),
                  ]),
                ],
                myParticipation,
                exerciseId: prog.exerciseId,
                // prog.id is the programmer record ID — StudentExerciseView needs it
                // under this name to register/update participation.
                exerciseProgrammerId: prog.id,
              });
            }
          } catch {
            /* ignore per-class errors */
          }
        }),
      );

      // Sort: not yet submitted first (by due date ascending), then submitted/graded
      all.sort((a, b) => {
        const aSubmitted =
          !!a.myParticipation?.etatSoumission &&
          a.myParticipation.etatSoumission !== "EN_COURS";
        const bSubmitted =
          !!b.myParticipation?.etatSoumission &&
          b.myParticipation.etatSoumission !== "EN_COURS";
        if (aSubmitted !== bSubmitted) return aSubmitted ? 1 : -1;
        return new Date(a.dateFinExoEffectif) - new Date(b.dateFinExoEffectif);
      });
      setDevoirs(all);
    } catch {
      /* non-blocking */
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // Re-fetch when parent switches child
  useEffect(() => {
    const onChildChanged = () => load();
    window.addEventListener("childChanged", onChildChanged);
    return () => window.removeEventListener("childChanged", onChildChanged);
  }, [load]);

  // ── open a devoir from a notification ─────────────────────────────────────
  // tabData.exerciseProgrammerId: fetched by id, then the attempt page when not
  // yet handed in, else the copy / correction (view "result" forces the copy).
  // A parent is first switched to the child of the devoir's classes.
  // Request id + mounted ref: re-renders never cancel the in-flight load.
  const navRidRef = useRef(0);
  const mountedRef = useMountedRef();
  useEffect(() => {
    if (!tabData) return;
    const progId = tabData.exerciseProgrammerId;
    if (!progId) {
      if (tabData.classId) {
        setSelectedDevoir(null);
        setResultDevoir(null);
        setActiveFilter("all");
        setClassFilter({ id: tabData.classId, nom: null });
        // Parent: show the child of that class (reloads on switch)
        selectParentChildForClasses([tabData.classId]).catch(() => null);
      }
      return;
    }
    const rid = ++navRidRef.current;
    setClassFilter(null);
    openingStart("Ouverture du devoir…");
    (async () => {
      let prog = null;
      try {
        prog = await exerciseProgrammerService.getExerciseProgrammeById(progId);
      } catch {
        prog = null;
      }
      if (!mountedRef.current || rid !== navRidRef.current) return;
      if (!prog || !prog.exerciseId) {
        openingFailed("Ce devoir n'existe plus ou ne vous est plus accessible.");
        return;
      }
      await selectParentChildForClasses(
        (prog.classesDiffusees || []).map((c) => c.id),
      ).catch(() => null);
      if (!mountedRef.current || rid !== navRidRef.current) return;
      const learnerId = getUserId();
      const currentViewer = getViewer();
      setViewer(currentViewer);
      const myParticipation =
        (prog.participations || []).find(
          (p) => p.utilisateurId === learnerId,
        ) || null;
      const etat = myParticipation?.etatSoumission || null;
      const submitted = !!etat && etat !== "EN_COURS";
      if (submitted) {
        openingDone();
        setSelectedDevoir(null);
        setResultDevoir({
          exerciseId: prog.exerciseId,
          nom: prog.nom,
          myParticipation,
        });
        return;
      }
      if (!currentViewer.canAnswer) {
        openingInfo(
          `Ce devoir est à rendre par ${currentViewer.childName || "l'élève"} depuis son compte.`,
        );
        setSelectedDevoir(null);
        setResultDevoir(null);
        return;
      }
      if (tabData.view === "result") {
        openingInfo("Ce devoir n'a pas encore été rendu.");
      } else {
        openingDone();
      }
      setResultDevoir(null);
      setSelectedDevoir({
        exerciseId: prog.exerciseId,
        exerciseProgrammerId: prog.id,
        nom: prog.nom,
        description: prog.description,
        myParticipation,
      });
    })();
  }, [tabData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── open devoir for submission ─────────────────────────────────────────────

  if (resultDevoir) {
    return (
      <StudentExerciseResultView
        exerciseId={resultDevoir.exerciseId}
        exerciseName={resultDevoir.nom}
        learnerId={getUserId()}
        learnerName={viewer.isParentView ? viewer.childName : ""}
        participation={resultDevoir.myParticipation}
        onBack={() => setResultDevoir(null)}
      />
    );
  }

  if (selectedDevoir) {
    return (
      <StudentExerciseView
        learnerId={getUserId()}
        learnerName={viewer.isParentView ? viewer.childName : ""}
        exerciseId={selectedDevoir.exerciseId}
        exerciseProgrammerId={selectedDevoir.exerciseProgrammerId}
        exerciseName={selectedDevoir.nom}
        exerciseDescription={selectedDevoir.description}
        existingParticipation={selectedDevoir.myParticipation}
        onBack={() => {
          setSelectedDevoir(null);
          load();
        }}
        onComplete={() => {
          setSelectedDevoir(null);
          load();
        }}
      />
    );
  }

  // ── categorise ────────────────────────────────────────────────────────────

  const categorised = devoirs.map((ep) => {
    const etat = ep.myParticipation?.etatSoumission || null;
    // EN_COURS = student opened but hasn't submitted → still "À rendre"
    const isSubmitted =
      etat === "SOUMIS" ||
      etat === "EN_ATTENTE_CORRECTION" ||
      etat === "CORRIGE" ||
      etat === "VALIDE";
    const isGraded = etat === "CORRIGE" || etat === "VALIDE";
    const isPending = etat === "EN_ATTENTE_CORRECTION";
    const overdue = !isSubmitted && isOverdue(ep.dateFinExoEffectif);
    return {
      ep,
      etat,
      isSubmitted,
      isGraded,
      isPending,
      overdue,
    };
  });
  const inClass = classFilter
    ? categorised.filter(({ ep }) =>
        (ep._classIds || []).some((id) => String(id) === String(classFilter.id)),
      )
    : categorised;
  const filtered = inClass.filter(({ isSubmitted, isGraded }) => {
    if (activeFilter === "todo") return !isSubmitted;
    if (activeFilter === "soumis") return isSubmitted && !isGraded;
    if (activeFilter === "corriges") return isGraded;
    return true;
  });
  const counts = {
    all: inClass.length,
    todo: inClass.filter((c) => !c.isSubmitted).length,
    soumis: inClass.filter((c) => c.isSubmitted && !c.isGraded).length,
    corriges: inClass.filter((c) => c.isGraded).length,
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full px-2 py-3">
      {/* Header */}
      <div
        className="mb-4 rounded-xl p-4"
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)",
          color: "#fff",
        }}
      >
        <div className="flex items-center gap-3 mb-1.5">
          <FontAwesomeIcon
            icon={faFileLines}
            style={{
              fontSize: 22,
            }}
          />
          <span className="text-base font-bold">
            {viewer.isParentView
              ? `Devoirs${viewer.childName ? ` de ${viewer.childName}` : ""}`
              : "Mes Devoirs"}
          </span>
          <button
            onClick={load}
            className="ml-auto p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              style={{
                fontSize: 13,
              }}
            />
          </button>
        </div>
        <p className="text-xs opacity-80 mb-3">
          {!viewer.isParentView
            ? "Retrouvez ici tous les devoirs assignés par vos professeurs."
            : viewer.canAnswer
              ? "Votre enfant n'a pas de compte personnel : vous rendez ses devoirs à sa place et suivez ses notes et corrections."
              : "Votre enfant a son propre compte et rend ses devoirs lui-même. Vous suivez ici ses notes et corrections."}
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            {
              icon: <FontAwesomeIcon icon={faBook} />,
              val: counts.all,
              label: `devoir${counts.all !== 1 ? "s" : ""}`,
            },
            {
              icon: <FontAwesomeIcon icon={faClock} />,
              val: counts.todo,
              label: "à rendre",
            },
            {
              icon: <FontAwesomeIcon icon={faCircleCheck} />,
              val: counts.soumis,
              label: "soumis",
            },
            {
              icon: <FontAwesomeIcon icon={faTrophy} />,
              val: counts.corriges,
              label: `corrigé${counts.corriges !== 1 ? "s" : ""}`,
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

      {/* Class filter (opened from a homework notification) */}
      {classFilter && (
        <div className="mb-3 px-4 py-2.5 rounded-xl flex items-center justify-between gap-3 bg-blue-50 border border-blue-100">
          <span className="text-sm text-blue-800">
            Devoirs de la classe{" "}
            <strong>
              {devoirs
                .flatMap((d) => d.classesDiffusees || [])
                .find((c) => String(c.id) === String(classFilter.id))?.nom ||
                "sélectionnée"}
            </strong>
          </span>
          <button
            onClick={() => setClassFilter(null)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Tous les devoirs
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div
        className="mb-4 rounded-xl overflow-hidden"
        style={{
          border: "1px solid #e4eaf4",
        }}
      >
        <div className="flex border-b border-gray-100 bg-white overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeFilter === tab.key ? "border-blue-600 text-blue-700 bg-blue-50/60" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${activeFilter === tab.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          description={
            activeFilter === "all"
              ? "Aucun devoir assigné"
              : "Aucun devoir dans cette catégorie"
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(
            ({ ep, etat, isSubmitted, isGraded, isPending, overdue }) => {
              const questionCount = (ep.questions || []).length;
              return (
                <div
                  key={ep.id}
                  className="bg-white rounded-xl overflow-hidden transition-shadow hover:shadow-md"
                  style={{
                    border: isGraded
                      ? "1px solid #ddd6fe"
                      : isPending
                        ? "1px solid #fed7aa"
                        : isSubmitted
                          ? "1px solid #bfdbfe"
                          : overdue
                            ? "1px solid #fca5a5"
                            : "1px solid #e4eaf4",
                  }}
                >
                  {/* Top bar */}
                  <div
                    className="flex items-center justify-between px-4 py-2 border-b border-gray-50"
                    style={{
                      background: isGraded
                        ? "#f5f3ff"
                        : isPending
                          ? "#fff7ed"
                          : isSubmitted
                            ? "#eff6ff"
                            : overdue
                              ? "#fef2f2"
                              : "#f8faff",
                    }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag color="blue" className="m-0 text-xs">
                        Devoir
                      </Tag>
                      {ep.niveau && (
                        <Tag color="cyan" className="m-0 text-xs">
                          {ep.niveau}
                        </Tag>
                      )}
                      {overdue && (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          En retard
                        </span>
                      )}
                    </div>
                    {etat ? (
                      <StatusBadge etat={etat} />
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <FontAwesomeIcon icon={faCalendarDays} />{" "}
                        {fmtDate(ep.dateFinExoEffectif)}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3">
                    <p className="font-semibold text-gray-900 text-sm mb-0.5">
                      {ep.nom || "Devoir"}
                    </p>
                    {ep.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {ep.description}
                      </p>
                    )}

                    {/* Dates */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faCalendarDays} /> Prévu :{" "}
                        {fmtDate(ep.dateExoPrevue)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} /> À rendre avant :{" "}
                        {fmtDate(ep.dateFinExoEffectif)}
                      </span>
                    </div>

                    {/* Subjects */}
                    {ep.matieres?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {ep.matieres.slice(0, 3).map((m) => (
                          <span
                            key={m.id}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "#f3e8ff",
                              color: "#7c3aed",
                              border: "1px solid #ddd6fe",
                            }}
                          >
                            {m.nom}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Grade */}
                    {isGraded && ep.myParticipation?.note && (
                      <div
                        className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
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
                          {ep.myParticipation.note}
                        </span>
                        {ep.myParticipation.appreciation && (
                          <span className="text-xs text-purple-500 italic truncate">
                            "{ep.myParticipation.appreciation}"
                          </span>
                        )}
                      </div>
                    )}

                    {/* Waiting for correction */}
                    {isPending && (
                      <div
                        className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
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

                    {/* Footer: question count + action */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <span className="text-xs text-gray-400">
                        {questionCount > 0
                          ? `${questionCount} question${questionCount > 1 ? "s" : ""}`
                          : ""}
                      </span>

                      {/* Submitted: open the copy (per-question marks once corrected) */}
                      {isSubmitted && (
                        <button
                          onClick={() =>
                            setResultDevoir({
                              exerciseId: ep.exerciseId,
                              nom: ep.nom,
                              myParticipation: ep.myParticipation,
                            })
                          }
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border border-blue-200 text-blue-700 bg-white hover:bg-blue-50"
                        >
                          <FontAwesomeIcon icon={faEye} />
                          {isGraded
                            ? "Voir la correction"
                            : viewer.isParentView
                              ? "Voir la copie"
                              : "Voir ma copie"}
                        </button>
                      )}

                      {/* Adult child: answers from their own account */}
                      {!isSubmitted && !viewer.canAnswer && (
                        <span className="text-xs text-gray-500 italic">
                          À rendre par {viewer.childName || "l'élève"}
                        </span>
                      )}

                      {/* Only show button if not yet submitted */}
                      {!isSubmitted && viewer.canAnswer && (
                        <button
                          onClick={() =>
                            setSelectedDevoir({
                              exerciseId: ep.exerciseId,
                              exerciseProgrammerId: ep.id,
                              nom: ep.nom,
                              description: ep.description,
                              myParticipation: ep.myParticipation,
                            })
                          }
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${overdue ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                        >
                          <FontAwesomeIcon icon={faCirclePlay} />
                          {viewer.isParentView
                            ? "Rendre pour l'enfant"
                            : "Rendre le devoir"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
};
export default StudentDevoirsContent;
