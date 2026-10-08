import { createAuthenticatedAxios } from "../utils/axiosConfig";

/**
 * Class → courses → exercises, learner progression and class statistics.
 *
 * Every read returns `null` when the endpoint is missing / fails so callers can
 * fall back to the older endpoints (the backend is rolled out progressively).
 * Writes throw an Error whose message is the API `{ code, message }` message
 * (the `code` is kept on `error.code`).
 */
const api = createAuthenticatedAxios();

const toError = (error, fallback) => {
  const data = error?.response?.data;
  const err = new Error(
    (data && typeof data === "object" && (data.message || data.error)) ||
      error?.message ||
      fallback,
  );
  err.code = data && typeof data === "object" ? data.code : undefined;
  err.status = error?.response?.status;
  err.response = error?.response;
  return err;
};

/** Unwrap arrays possibly wrapped in a page / envelope object. */
const asList = (data) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const k of ["content", "items", "data", "results", "cours", "classes"]) {
      if (Array.isArray(data[k])) return data[k];
    }
  }
  return null;
};

const safeGet = async (url, config) => {
  try {
    const r = await api.get(url, config);
    return r.data;
  } catch (e) {
    if (e?.response?.status && ![404, 405, 501].includes(e.response.status)) {
      console.warn(`[scolarite] GET ${url} failed (${e.response.status})`);
    }
    return null;
  }
};

const scolariteService = {
  /** [{coursId, titre, matiere, nbChapitres, nbSessions, prochaineSession, nbExercices, nbDevoirs}] | null */
  async getCoursProgrammesResume(classeId) {
    if (!classeId) return null;
    return asList(await safeGet(`/classes/${classeId}/cours-programmes/resume`));
  },

  /** Programmed exercises of a course in a class (+ the learner's status/note when eleveId). | null */
  async getCoursExercices(classeId, coursId, eleveId) {
    if (!classeId || !coursId) return null;
    return asList(
      await safeGet(`/classes/${classeId}/cours/${coursId}/exercices`, {
        params: eleveId ? { eleveId } : undefined,
      }),
    );
  },

  /** [{classeId, nom, niveau, nbCours, nbDevoirsAFaire, moyenne}] | null */
  async getClassesResume(eleveId) {
    if (!eleveId) return null;
    return asList(await safeGet(`/utilisateurs/${eleveId}/classes/resume`));
  },

  /** {global, cours:[…], devoirsEnRetard:[…]} | null */
  async getProgression(eleveId, classeId) {
    if (!eleveId) return null;
    const data = await safeGet(`/eleves/${eleveId}/progression`, {
      params: classeId ? { classeId } : undefined,
    });
    return data && typeof data === "object" && !Array.isArray(data) ? data : null;
  },

  /** {effectif, cours:[…], eleves:[…]} | null */
  async getStatistiquesClasse(classeId) {
    if (!classeId) return null;
    const data = await safeGet(`/classes/${classeId}/statistiques`);
    return data && typeof data === "object" && !Array.isArray(data) ? data : null;
  },

  /**
   * Change the course of a programmed exercise. The course is required (400 COURS_REQUIS) and must be
   * programmed in the exercise's class (400 COURS_NON_PROGRAMME_DANS_CLASSE).
   */
  async changerCoursExerciseProgramme(exerciseProgrammerId, coursId) {
    if (!exerciseProgrammerId) throw new Error("Exercice programmé introuvable");
    try {
      const r = await api.patch(
        `/exercises-programmer/${exerciseProgrammerId}/cours`,
        { coursId: coursId || null },
        { params: coursId ? { coursId } : undefined },
      );
      return r.data;
    } catch (e) {
      throw toError(e, "Impossible de modifier le cours de l'exercice");
    }
  },
};

export default scolariteService;
export { scolariteService, asList };
