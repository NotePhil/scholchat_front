// Notification → dedicated page routing, shared by every notification panel
// (modals/NotificationIcon, shared/Header).
//
// A click resolves a target { tab, data } (tab = a Principal.jsx renderContent
// key allowed for the role). The data is stored in redux ui.tabData (with a
// fresh `_nav` id, so a component already showing that tab sees a NEW object
// and reacts even for the same item), then the URL is changed to
// /schoolchat/Principal/<Dashboard>/<tab>. Each receiving component reads
// `tabData` and opens the item itself (see the "tabData" handling in
// ManageClassContent, StudentClassList, CoursProgrammeManagement,
// ProfessorCoursesContent, StudentDevoirsContent, ExerciseCorrectionsContent,
// ManageExercisesContent, MessagingInterface, ActivitiesContent,
// ManageEstablishmentContent, ProfessorsContent, SettingsContent).

import { useEffect, useRef } from "react";
import { message } from "antd";
import AccederService from "../services/accederService";
import { dashboardNameForRole } from "./authSession";

const PROFILE_TYPES = new Set([
  "PROFESSOR_ROLE_VALIDATED",
  "PROFESSOR_ROLE_REJECTED",
  "PROFESSOR_ROLE_DOCUMENTS_REQUIRED",
  "PROFESSOR_VERIFICATION_VALIDATED",
  "PROFESSOR_VERIFICATION_REJECTED",
  "PROFESSOR_VERIFICATION_DOCUMENTS_REQUIRED",
  "STUDENT_ROLE_APPROVED",
  "STUDENT_ROLE_VALIDATED",
  "STUDENT_ROLE_REJECTED",
  "ELEVE_ROLE_APPROUVE",
  "ROLE_ELEVE_APPROUVE",
  "ROLE_ELEVE_REFUSE",
  "ROLE_VALIDATED",
  "ROLE_APPROVED",
  "ROLE_REJECTED",
]);

const isProfileType = (type) =>
  PROFILE_TYPES.has(type) ||
  /^(PROFESSOR_ROLE_|STUDENT_ROLE_|ROLE_|PROFESSOR_VERIFICATION_)/.test(type);

/**
 * Own access-request confirmation ("envoyée" / "approuvée" / "rejetée") as
 * opposed to a moderator/admin being told about a new request.
 */
const isOwnAccessConfirmation = (notification) => {
  const title = (notification.title || "").toLowerCase();
  if (/nouvelle/.test(title)) return false;
  if (/envoy|approuv|accept|rejet|refus/.test(title)) return true;
  const me = localStorage.getItem("userId");
  return !!me && notification.actorId === me;
};

const accessOutcome = (notification) => {
  const title = (notification.title || "").toLowerCase();
  if (/approuv|accept/.test(title)) return "approved";
  if (/rejet|refus/.test(title)) return "rejected";
  return "pending";
};

/**
 * Maps a backend notification (NotificationService.java) to the dashboard tab
 * + data most relevant for the current role. Handles both the current contract
 * and legacy rows still in the database:
 *  - COURSE_SCHEDULED COURSE(coursId); legacy ACTIVITY_CREATED COURSE(classeId)
 *  - ASSIGNMENT_GIVEN EXERCISE(exerciseProgrammerId); legacy ASSIGNMENT(classeId)
 *  - MESSAGE_SENT MESSAGE(messageId, actorId = sender); legacy id null
 * Returns null when there is no sensible destination.
 */
export const getNotificationTarget = (notification, role) => {
  const type = (notification.type || "").toUpperCase();
  const entity = (notification.relatedEntityType || "").toUpperCase();
  const id = notification.relatedEntityId || null;
  const actorId = notification.actorId || null;
  const isLearner = role === "student" || role === "parent";
  const isAdmin = role === "admin";
  const isGest = role === "gestionnaire";
  const isProf = role === "professor" || role === "tutor";

  // Class page: learner class view (its scheduled courses) or the
  // management detail (admin / professor / gestionnaire).
  const classTarget = (subTab = "overview", extra = {}) => {
    if (isLearner) {
      return id ? { tab: "classes", data: { classId: id, ...extra } } : { tab: "classes" };
    }
    return id
      ? { tab: "manage-class", data: { classId: id, subTab } }
      : { tab: "manage-class" };
  };
  const courseTarget = (live = false) => {
    if (isGest) return null;
    if (!id) return { tab: "cours" };
    if (isLearner || live) return { tab: "cours", data: { courseId: id, live } };
    return { tab: "courses", data: { courseId: id } };
  };
  const learnerDevoir = (view) =>
    id
      ? { tab: "devoirs", data: { exerciseProgrammerId: id, view } }
      : { tab: "devoirs" };

  if (isProfileType(type)) return { tab: "settings", data: { section: "profils" } };

  switch (type) {
    // A parent's request for a child was decided: « Mes enfants » (child selected when approved).
    // relatedEntityType CLASS / relatedEntityId = classeId; the child id may come in actorId.
    case "CHILD_ACCESS_APPROVED":
    case "CHILD_ACCESS_REJECTED":
      if (role !== "parent") return id ? classTarget("overview") : null;
      return {
        tab: "my-children",
        data: {
          classId: id,
          childId: actorId,
          outcome: type === "CHILD_ACCESS_APPROVED" ? "approved" : "rejected",
        },
      };

    case "MESSAGE_SENT":
    case "NEW_MESSAGE":
      return actorId || id
        ? { tab: "messages", data: { partnerId: actorId, messageId: id } }
        : { tab: "messages" };

    case "ACCESS_REQUEST":
    case "DEMANDE_ACCES":
      if (isLearner) return classTarget("overview", { access: accessOutcome(notification) });
      if (isOwnAccessConfirmation(notification)) {
        // A professor who asked to join someone else's class
        return accessOutcome(notification) === "approved"
          ? classTarget("overview")
          : { tab: "manage-class" };
      }
      return classTarget("access-requests");

    case "CLASS_VALIDATED":
    case "CLASS_REJECTED":
    case "CLASS_JOIN":
    case "CLASS_CREATED":
    case "CLASSE_ADHESION_DEMANDE":
      return classTarget("overview");

    case "ETABLISSEMENT_CREATED":
      if (!isGest && !isAdmin) return null;
      return id
        ? { tab: "manage-establishment", data: { establishmentId: id } }
        : { tab: "manage-establishment" };

    case "COURSE_SCHEDULED":
    case "COURS_PROGRAMME":
    case "NEW_COURSE":
    case "NOUVEAU_COURS":
      return courseTarget(false);

    case "LIVE_SESSION_STARTED":
    case "SESSION_STARTED":
      return courseTarget(true);

    case "ACTIVITY_CREATED":
    case "NEW_ACTIVITY":
    case "EVENT_UPDATED":
      // Legacy "course scheduled" rows: ACTIVITY_CREATED / COURSE(classeId)
      if (entity === "COURSE") {
        if (isGest) return null;
        if (isLearner) return classTarget();
        // The class "Cours" sub-tab does not exist for admins
        return classTarget(isAdmin ? "overview" : "courses");
      }
      return id ? { tab: "activities", data: { activityId: id } } : { tab: "activities" };

    case "ASSIGNMENT_GIVEN":
    case "EXERCISE_ASSIGNED":
    case "NOUVEL_EXERCICE":
    case "DEVOIR_ASSIGNED":
    case "NOUVEAU_DEVOIR":
      if (isGest) return null;
      if (entity === "EXERCISE") {
        return isLearner
          ? learnerDevoir("auto")
          : { tab: "corrections-exercise", data: id ? { exerciseProgrammerId: id } : null };
      }
      // Legacy rows: ASSIGNMENT(classeId)
      if (isLearner) return id ? { tab: "devoirs", data: { classId: id } } : { tab: "devoirs" };
      return { tab: "manage-exercises" };

    case "DEVOIR_SOUMIS":
      if (isLearner) return learnerDevoir("result");
      if (!(isProf || isAdmin)) return null;
      return id
        ? { tab: "corrections-exercise", data: { exerciseProgrammerId: id, studentId: actorId } }
        : { tab: "corrections-exercise" };

    case "CORRECTION_DISPONIBLE":
      if (isLearner) return learnerDevoir("result");
      return isGest ? null : { tab: "corrections-exercise", data: id ? { exerciseProgrammerId: id } : null };

    case "EXERCISE_CREATED":
      if (isGest) return null;
      if (isLearner) return { tab: "devoirs" };
      return id
        ? { tab: "manage-exercises", data: { exerciseId: id } }
        : { tab: "manage-exercises" };

    case "PROFESSOR_CREATED":
      if (!isAdmin) return null;
      return id ? { tab: "professors", data: { professorId: id } } : { tab: "professors" };
    case "STUDENT_CREATED":
      return isAdmin ? { tab: "students" } : null;
    case "PARENT_CREATED":
      return isAdmin ? { tab: "parents" } : null;

    case "OFFRE_EXPIRATION_BIENTOT":
    case "OFFRE_EXPIREE":
    case "SUPPRESSION_IMMINENTE":
      if (isAdmin) return { tab: "manage-offers" };
      if (entity === "ETABLISSEMENT") {
        if (!isGest) return null;
        return id
          ? { tab: "manage-establishment", data: { establishmentId: id } }
          : { tab: "manage-establishment" };
      }
      return isLearner ? null : classTarget("overview");

    default:
      if (entity === "MESSAGE") return { tab: "messages", data: actorId ? { partnerId: actorId } : null };
      if (entity === "CLASS" || entity === "CLASSE") return classTarget("overview");
      if (entity === "EVENT") return { tab: "activities", data: id ? { activityId: id } : null };
      if (entity === "COURSE") return courseTarget(false);
      if (entity === "ETABLISSEMENT" && (isGest || isAdmin))
        return { tab: "manage-establishment", data: id ? { establishmentId: id } : null };
      if (entity === "EXERCISE" || entity === "ASSIGNMENT")
        return isGest ? null : { tab: isLearner ? "devoirs" : "manage-exercises" };
      return null;
  }
};

let navCounter = 0;

/** Redux setActiveTab payload for a target; `_nav` makes every click unique. */
export const toActiveTabPayload = (target) => ({
  tab: target.tab,
  data: { ...(target.data || {}), _nav: `${Date.now()}-${++navCounter}` },
});

/** Dashboard segment of the current URL, else the role's dashboard. */
export const currentDashboardName = (role) => {
  const match = window.location.pathname.match(
    /\/schoolchat\/Principal\/([\w]+Dashboard)/,
  );
  return match ? match[1] : dashboardNameForRole(role);
};

// ── Feedback while a target opens ───────────────────────────────────────────

const OPEN_KEY = "notification-open";

/** Global "Ouverture…" loader, closed by openingDone / openingFailed. */
export const openingStart = (label = "Ouverture…") => {
  message.loading({ content: label, key: OPEN_KEY, duration: 0 });
};
export const openingDone = () => {
  message.destroy(OPEN_KEY);
};
export const openingFailed = (
  content = "Cet élément n'existe plus ou ne vous est plus accessible.",
) => {
  message.warning({ content, key: OPEN_KEY, duration: 4 });
};
export const openingInfo = (content) => {
  message.info({ content, key: OPEN_KEY, duration: 4 });
};

/** true while the component is mounted — use instead of effect-cleanup flags. */
export const useMountedRef = () => {
  const ref = useRef(true);
  useEffect(() => {
    ref.current = true;
    return () => {
      ref.current = false;
    };
  }, []);
  return ref;
};

// ── Parent: pick the child concerned by a class ─────────────────────────────

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") || localStorage.getItem("authToken")}`,
});

const selectChild = (child) => {
  localStorage.removeItem("childClasses");
  localStorage.removeItem("childCourses");
  localStorage.setItem("selectedChildId", child.id);
  localStorage.setItem(
    "selectedChildName",
    `${child.prenom || ""} ${child.nom || ""}`,
  );
  localStorage.setItem("selectedChildNiveau", child.niveau || "");
  localStorage.setItem("selectedChildHasAccount", child.email ? "true" : "false");
  window.dispatchEvent(new Event("childChanged"));
};

/**
 * For a parent: makes the child concerned by one of `classIds` the selected
 * child (member of the class, else author of an access request to it).
 * Returns the child id that is selected afterwards (unchanged when none
 * matches), or null for a non-parent / no child.
 */
export const selectParentChildForClasses = async (classIds) => {
  const role = (localStorage.getItem("userRole") || "").toUpperCase();
  if (!role.includes("PARENT")) return null;
  const currentId = localStorage.getItem("selectedChildId");
  const ids = new Set((classIds || []).filter(Boolean).map(String));
  if (ids.size === 0) return currentId;
  let kids = [];
  try {
    const parentId = localStorage.getItem("userId");
    const resp = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/parents/${parentId}/enfants`,
      { headers: authHeaders() },
    );
    kids = resp.ok ? (await resp.json()) || [] : [];
  } catch {
    kids = [];
  }
  if (kids.length === 0) return currentId;
  // Current child first: no switch when it is already the right one
  const ordered = [...kids].sort(
    (a, b) => (b.id === currentId) - (a.id === currentId),
  );
  const memberships = await Promise.all(
    ordered.map((kid) =>
      AccederService.obtenirClassesAccessibles(kid.id).catch(() => []),
    ),
  );
  let match = ordered.find((kid, i) =>
    (memberships[i] || []).some((c) => ids.has(String(c.id))),
  );
  if (!match) {
    // Not a member (yet): the child an access request was made for
    const requests = (
      await Promise.all(
        [...ids].map((cid) =>
          AccederService.obtenirDemandesAccesPourClasse(cid).catch(() => []),
        ),
      )
    ).flat();
    match = ordered.find((kid) =>
      (requests || []).some(
        (r) => r && (r.utilisateurId === kid.id || r.eleveAssocieId === kid.id),
      ),
    );
  }
  if (match && match.id !== currentId) selectChild(match);
  return match ? match.id : currentId;
};
