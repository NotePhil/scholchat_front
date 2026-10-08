/**
 * Shared helpers for the class → courses → exercises views, the learner
 * progression and the class statistics. Every builder here is a client-side
 * fallback used when the dedicated backend endpoint is not available yet.
 */
import { exerciseProgrammerService } from "../services/exerciseProgrammerService";
import { coursProgrammerService } from "../services/coursProgrammerService";
import { coursService } from "../services/CoursService";
import scolariteService from "../services/scolariteService";
import AccederService from "../services/accederService";

export const GENERAL_COURSE_KEY = "__GENERAL__";
export const GENERAL_COURSE_LABEL = "Exercices généraux";

// ── formatting ────────────────────────────────────────────────────────────────

export const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/** "16/20" → 16 ; "7/10" → 14 ; "15" / 15 → 15 (already on 20). */
export const markOn20 = (note) => {
  if (note === null || note === undefined || note === "") return null;
  if (typeof note === "number") return Number.isFinite(note) ? note : null;
  const [a, b] = String(note).replace(",", ".").split("/");
  const earned = parseFloat(a);
  const max = b !== undefined ? parseFloat(b) : 20;
  if (Number.isNaN(earned) || !max) return null;
  return (earned / max) * 20;
};

export const round1 = (v) => (v === null || v === undefined ? null : Math.round(v * 10) / 10);

export const fmtNote20 = (v) => {
  const n = num(v);
  return n === null ? "—" : `${round1(n)}/20`;
};

export const fmtPct = (v) => {
  const n = num(v);
  return n === null ? "—" : `${Math.round(n)}%`;
};

export const fmtDate = (d, withTime = false) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

export const average = (values) => {
  const list = values.map(num).filter((v) => v !== null);
  return list.length ? list.reduce((s, v) => s + v, 0) / list.length : null;
};

// ── learner status of a programmed exercise ──────────────────────────────────

export const SUBMITTED_STATES = ["SOUMIS", "EN_ATTENTE_CORRECTION", "CORRIGE", "VALIDE", "RENDU"];
export const GRADED_STATES = ["CORRIGE", "VALIDE"];

/** Learner-facing status: A_FAIRE | RENDU | CORRIGE | EN_RETARD. */
export const learnerStatus = ({ statut, etatSoumission, dateFin }) => {
  const s = String(statut || "").toUpperCase();
  if (s.includes("CORRIG") || s === "VALIDE" || s === "NOTE") return "CORRIGE";
  if (s.includes("RETARD")) return "EN_RETARD";
  if (s.includes("RENDU") || s.includes("SOUMIS") || s.includes("ATTENTE_CORRECTION")) return "RENDU";
  const e = String(etatSoumission || "").toUpperCase();
  if (GRADED_STATES.includes(e)) return "CORRIGE";
  if (SUBMITTED_STATES.includes(e)) return "RENDU";
  if (dateFin && new Date(dateFin) < new Date()) return "EN_RETARD";
  return "A_FAIRE";
};

export const STATUS_META = {
  A_FAIRE: { label: "À faire", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  RENDU: { label: "Rendu", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  CORRIGE: { label: "Corrigé", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  EN_RETARD: { label: "En retard", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

export const TYPE_META = {
  DEVOIR: { label: "Devoir", color: "purple" },
  EXERCICE: { label: "Exercice", color: "blue" },
};

const pick = (o, ...keys) => {
  for (const k of keys) {
    if (o && o[k] !== undefined && o[k] !== null) return o[k];
  }
  return undefined;
};

/**
 * Normalise a programmed exercise coming either from
 * /exercises-programmer/classe/{id} (ExerciseProgrammerResponseDTO) or from
 * /classes/{c}/cours/{k}/exercices (course listing, field names may differ).
 */
export const normalizeProg = (raw, learnerId) => {
  if (!raw) return null;
  const id = pick(raw, "exerciseProgrammerId", "id");
  const participations = Array.isArray(raw.participations) ? raw.participations : [];
  const mine =
    raw.participation ||
    raw.maParticipation ||
    (learnerId
      ? participations.find((p) => String(p.utilisateurId) === String(learnerId))
      : null) ||
    null;
  const dateFin = pick(raw, "dateFinExoEffectif", "dateFin", "dateLimite", "echeance");
  const questions = Array.isArray(raw.questions) ? raw.questions : [];
  const pointsFromQuestions = questions.reduce((s, q) => s + (num(q.points ?? q.bareme) || 0), 0);
  const etatSoumission = pick(raw, "etatSoumission") || mine?.etatSoumission || null;
  const note = pick(raw, "note") ?? mine?.note ?? null;
  return {
    raw,
    id,
    exerciseId: pick(raw, "exerciseId"),
    titre: pick(raw, "titre", "nom", "exerciseNom") || "Exercice",
    description: raw.description || "",
    type: String(pick(raw, "typeAssignation", "type") || "EXERCICE").toUpperCase(),
    datePrevue: pick(raw, "dateExoPrevue", "datePrevue"),
    dateDebut: pick(raw, "dateDebutExoEffectif", "dateDebut"),
    dateFin,
    points: num(pick(raw, "points", "totalPoints", "bareme")) ?? (pointsFromQuestions || null),
    nbQuestions: num(pick(raw, "nbQuestions")) ?? (questions.length || null),
    coursId: pick(raw, "coursId") || null,
    coursTitre: pick(raw, "coursTitre") || null,
    classes: raw.classesDiffusees || [],
    participations,
    myParticipation: mine
      ? { ...mine, etatSoumission: mine.etatSoumission || etatSoumission, note: mine.note ?? note }
      : etatSoumission || note !== null
        ? { etatSoumission, note, appreciation: raw.appreciation }
        : null,
    etatSoumission,
    note,
    noteOn20: markOn20(note),
    statut: learnerStatus({ statut: pick(raw, "statut", "statutParticipation", "statutEleve"), etatSoumission, dateFin }),
    etat: raw.etat,
  };
};

/** Teacher-side figures of one programmed exercise from its embedded participations. */
export const exerciseFigures = (prog, attendus) => {
  const parts = prog.participations || [];
  const submitted = parts.filter((p) => SUBMITTED_STATES.includes(String(p.etatSoumission || "").toUpperCase()));
  const graded = submitted.filter((p) => GRADED_STATES.includes(String(p.etatSoumission || "").toUpperCase()));
  const marks = graded.map((p) => markOn20(p.note)).filter((m) => m !== null);
  return {
    exerciseProgrammerId: prog.id,
    titre: prog.titre,
    rendus: submitted.length,
    attendus: attendus ?? null,
    enAttenteCorrection: submitted.length - graded.length,
    moyenne: marks.length ? marks.reduce((s, m) => s + m, 0) / marks.length : null,
    min: marks.length ? Math.min(...marks) : null,
    max: marks.length ? Math.max(...marks) : null,
  };
};

export const courseKey = (coursId) => (coursId ? String(coursId) : GENERAL_COURSE_KEY);

// ── loaders with fallbacks ───────────────────────────────────────────────────

/** Programmed exercises of a class, normalised (empty list on error). */
export const loadClassExercises = async (classeId, learnerId) => {
  try {
    const list = await exerciseProgrammerService.getExercisesProgrammesParClasse(classeId);
    return (list || []).map((p) => normalizeProg(p, learnerId)).filter(Boolean);
  } catch {
    return [];
  }
};

const courseTitleCache = new Map();
export const loadCourseTitles = async (ids) => {
  const missing = [...new Set(ids.filter((id) => id && !courseTitleCache.has(String(id))))];
  await Promise.all(
    missing.map(async (id) => {
      try {
        const c = await coursService.getCoursById(id);
        courseTitleCache.set(String(id), {
          titre: c?.titre || "Cours",
          matiere: c?.matieres?.[0]?.nom || c?.matiere?.nom || c?.matiereNom || null,
          nbChapitres: Array.isArray(c?.chapitres) ? c.chapitres.length : null,
        });
      } catch {
        courseTitleCache.set(String(id), { titre: "Cours", matiere: null, nbChapitres: null });
      }
    }),
  );
  return (id) => courseTitleCache.get(String(id)) || { titre: "Cours", matiere: null, nbChapitres: null };
};

/** Normalise a resume row of /classes/{id}/cours-programmes/resume. */
export const normalizeResumeRow = (r) => ({
  coursId: r.coursId ?? r.id,
  titre: r.titre || r.coursTitre || "Cours",
  matiere: typeof r.matiere === "object" && r.matiere ? r.matiere.nom : r.matiere || null,
  nbChapitres: num(r.nbChapitres),
  nbSessions: num(r.nbSessions),
  prochaineSession: r.prochaineSession || null,
  nbExercices: num(r.nbExercices) ?? 0,
  nbDevoirs: num(r.nbDevoirs) ?? 0,
});

/**
 * Courses programmed in a class with their counts. Uses the resume endpoint,
 * else rebuilds it from the class sessions + programmed exercises.
 * Returns { courses, exercises } (exercises: normalised class exercises).
 */
export const loadClassCourses = async (classeId, learnerId) => {
  const [resume, exercises] = await Promise.all([
    scolariteService.getCoursProgrammesResume(classeId),
    loadClassExercises(classeId, learnerId),
  ]);
  if (resume) {
    return { courses: resume.map(normalizeResumeRow), exercises, fromApi: true };
  }
  let sessions = [];
  try {
    sessions = (await coursProgrammerService.obtenirProgrammationParClasse(classeId)) || [];
  } catch {
    sessions = [];
  }
  const ids = [...new Set(sessions.map((s) => s.coursId).filter(Boolean))];
  const titleOf = await loadCourseTitles(ids);
  const now = new Date();
  const courses = ids.map((id) => {
    const own = sessions.filter((s) => s.coursId === id);
    const next = own
      .filter((s) => s.etatCoursProgramme !== "ANNULE" && s.dateCoursPrevue && new Date(s.dateCoursPrevue) >= now)
      .sort((a, b) => new Date(a.dateCoursPrevue) - new Date(b.dateCoursPrevue))[0];
    const exos = exercises.filter((e) => String(e.coursId) === String(id));
    const meta = titleOf(id);
    return {
      coursId: id,
      titre: meta.titre,
      matiere: meta.matiere,
      nbChapitres: meta.nbChapitres,
      nbSessions: own.length,
      prochaineSession: next?.dateCoursPrevue || null,
      nbExercices: exos.filter((e) => e.type !== "DEVOIR").length,
      nbDevoirs: exos.filter((e) => e.type === "DEVOIR").length,
    };
  });
  return { courses, exercises, fromApi: false };
};

/** Learner progression (global + per course + overdue), with a client-side fallback. */
export const loadLearnerProgression = async (eleveId, classeId) => {
  const data = await scolariteService.getProgression(eleveId, classeId);
  if (data) {
    const g = data.global || {};
    return {
      fromApi: true,
      global: {
        progressionCours: num(g.progressionCours),
        devoirsRendus: num(g.devoirsRendus) ?? 0,
        devoirsTotal: num(g.devoirsTotal) ?? 0,
        moyenne: num(g.moyenne),
        enRetard: num(g.enRetard ?? g.devoirsEnRetard) ?? (data.devoirsEnRetard || []).length,
        derniereActivite: g.derniereActivite || g.dernierActivite || null,
      },
      cours: (data.cours || []).map((c) => ({
        coursId: c.coursId,
        titre: c.titre || "Cours",
        classeNom: c.classeNom || null,
        chapitresLus: num(c.chapitresLus) ?? 0,
        chapitresTotal: num(c.chapitresTotal) ?? 0,
        pourcentage: num(c.pourcentage) ?? 0,
        exercicesFaits: num(c.exercicesFaits) ?? 0,
        exercicesTotal: num(c.exercicesTotal) ?? 0,
        moyenne: num(c.moyenne),
        derniereActivite: c.derniereActivite || null,
      })),
      devoirsEnRetard: (data.devoirsEnRetard || []).map((d) => normalizeProg(d, eleveId)),
    };
  }
  return buildProgressionFallback(eleveId, classeId);
};

const buildProgressionFallback = async (eleveId, classeId) => {
  let classIds = classeId ? [classeId] : [];
  if (!classeId) {
    try {
      const classes = await AccederService.obtenirClassesAccessibles(eleveId);
      classIds = (classes || []).map((c) => c.id);
    } catch {
      classIds = [];
    }
  }
  const [sessionLists, exerciseLists] = await Promise.all([
    Promise.all(
      classIds.map((id) => coursProgrammerService.obtenirProgrammationParClasse(id).catch(() => [])),
    ),
    Promise.all(classIds.map((id) => loadClassExercises(id, eleveId))),
  ]);
  const seen = new Set();
  const exercises = exerciseLists.flat().filter((e) => (seen.has(e.id) ? false : seen.add(e.id)));
  const coursIds = [...new Set(sessionLists.flat().map((s) => s?.coursId).filter(Boolean))];
  const titleOf = await loadCourseTitles(coursIds);
  const progress = await Promise.all(
    coursIds.map((id) => coursService.getProgression(id, eleveId).catch(() => null)),
  );
  const cours = coursIds.map((id, i) => {
    const p = progress[i] || {};
    const exos = exercises.filter((e) => String(e.coursId) === String(id));
    const done = exos.filter((e) => e.statut === "RENDU" || e.statut === "CORRIGE");
    return {
      coursId: id,
      titre: titleOf(id).titre,
      chapitresLus: num(p.chapitresCompletes) ?? 0,
      chapitresTotal: num(p.totalChapitres) ?? 0,
      pourcentage: num(p.pourcentage) ?? 0,
      exercicesFaits: done.length,
      exercicesTotal: exos.length,
      moyenne: average(exos.map((e) => (e.statut === "CORRIGE" ? e.noteOn20 : null))),
      derniereActivite: null,
    };
  });
  const devoirs = exercises.filter((e) => e.type === "DEVOIR");
  const rendus = devoirs.filter((e) => e.statut === "RENDU" || e.statut === "CORRIGE");
  const enRetard = devoirs.filter((e) => e.statut === "EN_RETARD");
  return {
    fromApi: false,
    global: {
      progressionCours: cours.length ? average(cours.map((c) => c.pourcentage)) : null,
      devoirsRendus: rendus.length,
      devoirsTotal: devoirs.length,
      moyenne: average(exercises.map((e) => (e.statut === "CORRIGE" ? e.noteOn20 : null))),
      enRetard: enRetard.length,
      derniereActivite: null,
    },
    cours,
    devoirsEnRetard: enRetard,
  };
};

/**
 * Class statistics with a fallback rebuilt from the programmed exercises
 * (participations) and the class learners (`eleves`: [{id, nom, prenom}]).
 */
export const loadClassStatistics = async (classeId, eleves = []) => {
  const data = await scolariteService.getStatistiquesClasse(classeId);
  if (data) {
    return {
      fromApi: true,
      effectif: num(data.effectif) ?? eleves.length,
      cours: (data.cours || []).map((c) => ({
        coursId: c.coursId ?? null,
        titre: c.titre || (c.coursId ? "Cours" : GENERAL_COURSE_LABEL),
        progressionMoyenne: num(c.progressionMoyenne),
        exercices: (c.exercices || []).map((e) => ({
          exerciseProgrammerId: e.exerciseProgrammerId ?? e.id,
          titre: e.titre || e.nom || "Exercice",
          rendus: num(e.rendus) ?? 0,
          attendus: num(e.attendus),
          enAttenteCorrection: num(e.enAttenteCorrection) ?? 0,
          moyenne: num(e.moyenne),
          min: num(e.min),
          max: num(e.max),
        })),
      })),
      eleves: (data.eleves || []).map((s) => ({
        eleveId: s.eleveId ?? s.id,
        nom: s.nom || "",
        prenom: s.prenom || "",
        progressionMoyenne: num(s.progressionMoyenne),
        devoirsRendus: num(s.devoirsRendus) ?? 0,
        devoirsTotal: num(s.devoirsTotal) ?? 0,
        moyenne: num(s.moyenne),
        enRetard: num(s.enRetard) ?? 0,
      })),
    };
  }
  const { courses, exercises } = await loadClassCourses(classeId);
  const effectif = eleves.length;
  const groups = [
    ...courses.map((c) => ({ coursId: c.coursId, titre: c.titre })),
    { coursId: null, titre: GENERAL_COURSE_LABEL },
  ];
  const cours = groups
    .map((g) => ({
      coursId: g.coursId,
      titre: g.titre,
      progressionMoyenne: null,
      exercices: exercises
        .filter((e) => (g.coursId ? String(e.coursId) === String(g.coursId) : !e.coursId))
        .map((e) => exerciseFigures(e, effectif || null)),
    }))
    .filter((g) => g.coursId || g.exercices.length);
  const now = new Date();
  const devoirs = exercises.filter((e) => e.type === "DEVOIR");
  const stats = eleves.map((s) => {
    const mine = devoirs.map((d) =>
      (d.participations || []).find((p) => String(p.utilisateurId) === String(s.id)),
    );
    const rendus = mine.filter((p) => p && SUBMITTED_STATES.includes(String(p.etatSoumission || "").toUpperCase()));
    const late = devoirs.filter(
      (d, i) => !(mine[i] && SUBMITTED_STATES.includes(String(mine[i].etatSoumission || "").toUpperCase())) &&
        d.dateFin && new Date(d.dateFin) < now,
    );
    const allMarks = exercises
      .map((e) => (e.participations || []).find((p) => String(p.utilisateurId) === String(s.id)))
      .filter((p) => p && GRADED_STATES.includes(String(p.etatSoumission || "").toUpperCase()))
      .map((p) => markOn20(p.note));
    return {
      eleveId: s.id,
      nom: s.nom || "",
      prenom: s.prenom || "",
      progressionMoyenne: null,
      devoirsRendus: rendus.length,
      devoirsTotal: devoirs.length,
      moyenne: average(allMarks),
      enRetard: late.length,
    };
  });
  return { fromApi: false, effectif, cours, eleves: stats };
};

/** Course options of one class: [{coursId, titre, matiere}] (resume endpoint, else sessions). */
export const loadClassCourseOptions = async (classeId) => {
  const resume = await scolariteService.getCoursProgrammesResume(classeId);
  if (resume) return resume.map(normalizeResumeRow);
  let sessions = [];
  try {
    sessions = (await coursProgrammerService.obtenirProgrammationParClasse(classeId)) || [];
  } catch {
    sessions = [];
  }
  const ids = [...new Set(sessions.filter((s) => s.etatCoursProgramme !== "ANNULE").map((s) => s.coursId).filter(Boolean))];
  const titleOf = await loadCourseTitles(ids);
  return ids.map((id) => ({ coursId: id, ...titleOf(id) }));
};

/** Courses programmed in EVERY given class (an exercise diffused in several classes). */
export const loadCommonCourseOptions = async (classIds = []) => {
  const ids = [...new Set(classIds.filter(Boolean))];
  if (!ids.length) return [];
  const lists = await Promise.all(ids.map((id) => loadClassCourseOptions(id).catch(() => [])));
  const [first, ...rest] = lists;
  return (first || []).filter((c) =>
    rest.every((l) => l.some((o) => String(o.coursId) === String(c.coursId))),
  );
};

/**
 * Who is looking: the learner, or a parent following the selected child.
 * A minor child (no own account) hands in through the parent; an adult child answers himself.
 */
export const getLearnerViewer = () => {
  const isParent = (localStorage.getItem("userRole") || "").toUpperCase().includes("PARENT");
  const childId = localStorage.getItem("selectedChildId");
  if (!isParent || !childId) {
    return { learnerId: localStorage.getItem("userId"), isParentView: false, childName: "", canAnswer: true };
  }
  const childName = (localStorage.getItem("selectedChildName") || "").trim();
  const hasAccount = localStorage.getItem("selectedChildHasAccount") === "true";
  return { learnerId: childId, isParentView: true, childName, canAnswer: !hasAccount };
};
