import React from "react";
import LearnerProgressionView from "./scolarite/LearnerProgressionView";

/**
 * Dashboard "Progression": for the learner (the student himself, or the
 * parent's selected child) — global cards (progression des cours, devoirs
 * rendus/total, moyenne /20, en retard) and one row per course.
 *
 * Source: GET /eleves/{id}/progression, with a client-side fallback on the
 * older endpoints (cours-programmes, /cours/{id}/progression, participations).
 */
const CourseProgressPanel = ({ learnerId, learnerName, themeColors = {}, onOpenCourses, onOpenDevoirs }) => (
  <LearnerProgressionView
    eleveId={learnerId}
    learnerName={learnerName}
    title={learnerName ? `Progression de ${learnerName}` : "Ma progression"}
    themeColors={themeColors}
    onOpenCourses={onOpenCourses}
    onOpenDevoirs={onOpenDevoirs}
  />
);

export default CourseProgressPanel;
