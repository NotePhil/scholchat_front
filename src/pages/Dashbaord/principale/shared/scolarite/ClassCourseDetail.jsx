import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Empty, Segmented, Spin, Tag, Tooltip } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsRotate,
  faBookOpen,
  faCalendarDays,
  faCheckDouble,
  faCirclePlay,
  faClock,
  faEye,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import CourseDetailsView from "../../content/InterfaceCours/CourseDetailsView";
import StudentExerciseView from "../../content/excerciseContent/StudentExerciseView";
import StudentExerciseResultView from "../../content/excerciseContent/StudentExerciseResultView";
import ChangeCourseModal from "./ChangeCourseModal";
import scolariteService from "../../../../../services/scolariteService";
import { exerciseProgrammerService } from "../../../../../services/exerciseProgrammerService";
import { useOpenTab } from "../../../../../hooks/useOpenTab";
import {
  STATUS_META,
  TYPE_META,
  exerciseFigures,
  fmtDate,
  fmtNote20,
  getLearnerViewer,
  loadClassExercises,
  normalizeProg,
  num,
} from "../../../../../utils/scolarite";

export const StatusPill = ({ statut }) => {
  const m = STATUS_META[statut];
  if (!m) return null;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      {m.label}
    </span>
  );
};

const LEARNER_FILTERS = [
  { value: "ALL", label: "Tous" },
  { value: "A_FAIRE", label: "À faire" },
  { value: "RENDU", label: "Rendus" },
  { value: "CORRIGE", label: "Corrigés" },
  { value: "EN_RETARD", label: "En retard" },
];

/**
 * A course of a class: its content and the programmed exercises / devoirs linked to it.
 *  - learner (or parent): status, note, Faire / Voir la copie (inline)
 *  - professor: rendus/attendus, à corriger, moyenne, link to corrections, change course
 */
const ClassCourseDetail = ({ classe, course, mode = "learner", eleves = [], onBack }) => {
  const classeId = classe?.id;
  const coursId = course?.coursId || null;
  const viewer = useMemo(() => getLearnerViewer(), []);
  const learnerId = mode === "learner" ? viewer.learnerId : undefined;
  const openTab = useOpenTab();

  const [section, setSection] = useState("exercices");
  const [items, setItems] = useState([]);
  const [figures, setFigures] = useState({}); // exerciseProgrammerId -> figures (professor)
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [doing, setDoing] = useState(null); // { prog, view: "do" | "result" }
  const [courseProg, setCourseProg] = useState(null);

  const load = useCallback(async () => {
    if (!classeId) return;
    setLoading(true);
    try {
      const [classList, apiList, stats] = await Promise.all([
        loadClassExercises(classeId, learnerId),
        coursId ? scolariteService.getCoursExercices(classeId, coursId, learnerId) : Promise.resolve(null),
        mode === "professor" ? scolariteService.getStatistiquesClasse(classeId) : Promise.resolve(null),
      ]);
      const own = classList.filter((e) => String(e.coursId) === String(coursId));
      let merged = own;
      if (apiList) {
        const byId = new Map(own.map((e) => [String(e.id), e]));
        merged = apiList
          .map((raw) => normalizeProg(raw, learnerId))
          .filter(Boolean)
          .map((a) => {
            const b = byId.get(String(a.id));
            if (!b) return a;
            return {
              ...b,
              ...Object.fromEntries(Object.entries(a).filter(([, v]) => v !== null && v !== undefined && v !== "")),
              exerciseId: a.exerciseId || b.exerciseId,
              participations: b.participations.length ? b.participations : a.participations,
              classes: b.classes.length ? b.classes : a.classes,
              // learner status: the course listing wins only when it carries the participation
              ...(a.myParticipation || a.raw?.statut
                ? {}
                : {
                    myParticipation: b.myParticipation,
                    statut: b.statut,
                    note: b.note,
                    noteOn20: b.noteOn20,
                    etatSoumission: b.etatSoumission,
                  }),
            };
          });
        // exercises only known by the class listing (API lagging) are kept too
        own.forEach((e) => {
          if (!merged.some((m) => String(m.id) === String(e.id))) merged.push(e);
        });
      }
      merged.sort((a, b) => new Date(a.dateFin || 0) - new Date(b.dateFin || 0));
      setItems(merged);

      if (mode === "professor") {
        const effectif = num(stats?.effectif) ?? (eleves.length || null);
        const fromApi = {};
        (stats?.cours || [])
          .filter((c) => c.coursId && String(c.coursId) === String(coursId))
          .forEach((c) =>
            (c.exercices || []).forEach((e) => {
              fromApi[String(e.exerciseProgrammerId ?? e.id)] = e;
            }),
          );
        const map = {};
        merged.forEach((e) => {
          const api = fromApi[String(e.id)];
          map[String(e.id)] = api
            ? {
                rendus: num(api.rendus) ?? 0,
                attendus: num(api.attendus) ?? effectif,
                enAttenteCorrection: num(api.enAttenteCorrection) ?? 0,
                moyenne: num(api.moyenne),
              }
            : exerciseFigures(e, effectif);
        });
        setFigures(map);
      }
    } finally {
      setLoading(false);
    }
  }, [classeId, coursId, learnerId, mode, eleves.length]);

  useEffect(() => {
    load();
  }, [load]);

  const openDoing = async (prog, view) => {
    let p = prog;
    if (!p.exerciseId) {
      try {
        const full = await exerciseProgrammerService.getExerciseProgrammeById(prog.id);
        p = { ...prog, exerciseId: full?.exerciseId, description: prog.description || full?.description };
      } catch {
        /* handled below */
      }
    }
    if (p.exerciseId) setDoing({ prog: p, view });
  };

  // ── inline attempt / copy (learner) ──
  if (doing) {
    const { prog, view } = doing;
    const back = () => {
      setDoing(null);
      load();
    };
    return view === "result" ? (
      <StudentExerciseResultView
        exerciseId={prog.exerciseId}
        exerciseName={prog.titre}
        learnerId={viewer.learnerId}
        learnerName={viewer.isParentView ? viewer.childName : ""}
        participation={prog.myParticipation}
        onBack={back}
      />
    ) : (
      <StudentExerciseView
        learnerId={viewer.learnerId}
        learnerName={viewer.isParentView ? viewer.childName : ""}
        exerciseId={prog.exerciseId}
        exerciseProgrammerId={prog.id}
        exerciseName={prog.titre}
        exerciseDescription={prog.description}
        existingParticipation={prog.myParticipation}
        onBack={back}
        onComplete={back}
      />
    );
  }

  if (section === "contenu" && coursId) {
    return <CourseDetailsView courseId={coursId} onBack={() => setSection("exercices")} />;
  }

  const counts = LEARNER_FILTERS.reduce((acc, f) => {
    acc[f.value] = f.value === "ALL" ? items.length : items.filter((e) => e.statut === f.value).length;
    return acc;
  }, {});
  const visible = mode === "learner" && filter !== "ALL" ? items.filter((e) => e.statut === filter) : items;

  const learnerActions = (e) => {
    if (e.statut === "RENDU" || e.statut === "CORRIGE") {
      return (
        <Button size="small" icon={<FontAwesomeIcon icon={faEye} />} onClick={() => openDoing(e, "result")}>
          {e.statut === "CORRIGE" ? "Voir la correction" : "Voir la copie"}
        </Button>
      );
    }
    if (!viewer.canAnswer) {
      return <span className="text-xs italic text-gray-500">À faire par {viewer.childName || "l'élève"}</span>;
    }
    return (
      <Button
        size="small"
        type="primary"
        danger={e.statut === "EN_RETARD"}
        icon={<FontAwesomeIcon icon={faCirclePlay} />}
        onClick={() => openDoing(e, "do")}
      >
        Faire
      </Button>
    );
  };

  const professorBlock = (e) => {
    const f = figures[String(e.id)] || {};
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-600">
          <strong className="text-gray-800">{f.rendus ?? 0}</strong>
          {f.attendus ? `/${f.attendus}` : ""} rendus
        </span>
        {f.enAttenteCorrection > 0 && (
          <Tag color="orange" className="m-0">
            {f.enAttenteCorrection} à corriger
          </Tag>
        )}
        <span className="text-xs text-gray-600">
          Moyenne <strong className="text-gray-800">{fmtNote20(f.moyenne)}</strong>
        </span>
        <Button
          size="small"
          icon={<FontAwesomeIcon icon={faCheckDouble} />}
          onClick={() => openTab("corrections-exercise", { exerciseProgrammerId: e.id })}
        >
          Corrections
        </Button>
        <Tooltip title="Rattacher à un autre cours">
          <Button size="small" type="text" onClick={() => setCourseProg(e)}>
            Changer de cours
          </Button>
        </Tooltip>
      </div>
    );
  };

  const renderItem = (e) => (
            <div key={e.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900 break-words">{e.titre}</span>
                  <Tag color={TYPE_META[e.type]?.color || "default"} className="m-0">
                    {TYPE_META[e.type]?.label || e.type}
                  </Tag>
                  {mode === "learner" && <StatusPill statut={e.statut} />}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                  {e.dateDebut && (
                    <span>
                      <FontAwesomeIcon icon={faCalendarDays} className="mr-1" />
                      Début {fmtDate(e.dateDebut, true)}
                    </span>
                  )}
                  <span className={e.statut === "EN_RETARD" && mode === "learner" ? "text-red-600 font-medium" : ""}>
                    <FontAwesomeIcon icon={faClock} className="mr-1" />
                    À rendre avant {fmtDate(e.dateFin, true)}
                  </span>
                  {e.points ? (
                    <span>
                      <FontAwesomeIcon icon={faPenToSquare} className="mr-1" />
                      {e.points} pts
                    </span>
                  ) : e.nbQuestions ? (
                    <span>
                      {e.nbQuestions} question{e.nbQuestions > 1 ? "s" : ""}
                    </span>
                  ) : null}
                  {mode === "learner" && e.statut === "CORRIGE" && (
                    <span className="text-purple-700 font-semibold">Note : {e.note ?? fmtNote20(e.noteOn20)}</span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">{mode === "learner" ? learnerActions(e) : professorBlock(e)}</div>
            </div>
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
        <div className="px-4 py-3 flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/20" aria-label="Retour">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <FontAwesomeIcon icon={faBookOpen} />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold truncate">{course?.titre || "Cours"}</h2>
            <p className="text-xs text-blue-100 truncate">
              {classe?.nom}
              {course?.matiere ? ` · ${course.matiere}` : ""}
              {course?.prochaineSession ? ` · prochaine session ${fmtDate(course.prochaineSession, true)}` : ""}
            </p>
          </div>
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/20" title="Actualiser">
            <FontAwesomeIcon icon={faArrowsRotate} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        {coursId && (
          <div className="px-4 py-2 border-t border-gray-100">
            <Segmented
              value={section}
              onChange={setSection}
              options={[
                { value: "exercices", label: "Exercices et devoirs" },
                { value: "contenu", label: "Contenu du cours" },
              ]}
            />
          </div>
        )}
      </div>

      {mode === "learner" && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-1">
          {LEARNER_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${filter === f.value ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
            >
              {f.label} <span className="opacity-75">({counts[f.value]})</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-8">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              items.length === 0 ? "Aucun exercice ni devoir lié à ce cours" : "Rien dans cette catégorie"
            }
          />
        </div>
      ) : (
        // Exercises (EXERCICE) and homework (DEVOIR) of the course, in two separate sections
        <div className="space-y-3">
          {[
            { key: "ex", title: "Exercices", empty: "Aucun exercice", list: visible.filter((e) => e.type !== "DEVOIR") },
            { key: "dv", title: "Devoirs", empty: "Aucun devoir", list: visible.filter((e) => e.type === "DEVOIR") },
          ].map((sec) => (
            <div key={sec.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <FontAwesomeIcon icon={sec.key === "ex" ? faBookOpen : faPenToSquare} className="text-gray-400" style={{ fontSize: 12 }} />
                <span className="text-sm font-semibold text-gray-800">{sec.title}</span>
                <span className="ml-auto text-xs text-gray-500">{sec.list.length}</span>
              </div>
              {sec.list.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400 m-0">{sec.empty}</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {sec.list.map((e) => renderItem(e))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ChangeCourseModal
        open={!!courseProg}
        prog={courseProg}
        classIds={courseProg?.classes?.length ? undefined : [classeId]}
        onClose={() => setCourseProg(null)}
        onChanged={() => load()}
      />
    </div>
  );
};

export default ClassCourseDetail;
