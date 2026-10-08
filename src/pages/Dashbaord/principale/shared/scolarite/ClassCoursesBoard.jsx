import React, { useCallback, useEffect, useState } from "react";
import { Empty, Spin } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faBookOpen,
  faCalendarDays,
  faChevronRight,
  faClipboardList,
  faFileLines,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import { fmtDate, loadClassCourses } from "../../../../../utils/scolarite";

/**
 * Courses programmed in a class, as cards with their counts (chapitres,
 * exercices / devoirs, prochaine session). Every exercise / homework belongs to
 * a course. Clicking a card calls onOpenCourse({ coursId, titre, ... }).
 *
 * mode "learner": also shows how many items are still to do (learnerId).
 */
const Stat = ({ icon, value, label, color }) => (
  <span className="inline-flex items-center gap-1 text-xs text-gray-600">
    <FontAwesomeIcon icon={icon} style={{ fontSize: 11, color }} />
    <strong className="text-gray-800">{value ?? "—"}</strong> {label}
  </span>
);

const ClassCoursesBoard = ({ classe, mode = "learner", learnerId, onOpenCourse, headerAction }) => {
  const classeId = classe?.id;
  const [courses, setCourses] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!classeId) return;
    setLoading(true);
    setError("");
    try {
      const res = await loadClassCourses(classeId, mode === "learner" ? learnerId : undefined);
      setCourses(res.courses);
      setExercises(res.exercises);
    } catch {
      setError("Impossible de charger les cours de la classe.");
    } finally {
      setLoading(false);
    }
  }, [classeId, mode, learnerId]);

  useEffect(() => {
    load();
  }, [load]);

  const todoOf = (coursId) =>
    exercises.filter(
      (e) => String(e.coursId) === String(coursId) && (e.statut === "A_FAIRE" || e.statut === "EN_RETARD"),
    ).length;
  const toCorrectOf = (coursId) =>
    exercises
      .filter((e) => String(e.coursId) === String(coursId))
      .reduce(
        (n, e) =>
          n +
          (e.participations || []).filter((p) =>
            ["SOUMIS", "EN_ATTENTE_CORRECTION"].includes(String(p.etatSoumission || "").toUpperCase()),
          ).length,
        0,
      );

  const sorted = [...courses].sort((a, b) => {
    const da = a.prochaineSession ? new Date(a.prochaineSession).getTime() : Infinity;
    const db = b.prochaineSession ? new Date(b.prochaineSession).getTime() : Infinity;
    return da - db || String(a.titre).localeCompare(String(b.titre));
  });

  const card = (c) => {
    const nbEx = c.nbExercices;
    const nbDev = c.nbDevoirs;
    const todo = mode === "learner" ? todoOf(c.coursId) : 0;
    const toCorrect = mode === "professor" ? toCorrectOf(c.coursId) : 0;
    return (
      <button
        key={c.coursId}
        type="button"
        onClick={() => onOpenCourse?.(c)}
        className="text-left bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all p-4 flex flex-col gap-3"
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#eef2ff" }}
          >
            <FontAwesomeIcon icon={faBookOpen} style={{ color: "#4f46e5", fontSize: 17 }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-gray-900 leading-snug break-words">{c.titre}</p>
            <p className="text-xs text-gray-500 truncate">
              {c.matiere || "Cours programmé"}
            </p>
          </div>
          <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 mt-1" style={{ fontSize: 12 }} />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Stat icon={faClipboardList} value={c.nbChapitres} label="chapitres" color="#0891b2" />
          <Stat icon={faPenToSquare} value={nbEx} label={`exercice${nbEx > 1 ? "s" : ""}`} color="#2563eb" />
          <Stat icon={faFileLines} value={nbDev} label={`devoir${nbDev > 1 ? "s" : ""}`} color="#7c3aed" />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-gray-500">
            <FontAwesomeIcon icon={faCalendarDays} style={{ fontSize: 11 }} />
            {c.prochaineSession
              ? `Prochaine session : ${fmtDate(c.prochaineSession, true)}`
              : c.nbSessions
                ? `${c.nbSessions} session${c.nbSessions > 1 ? "s" : ""}, aucune à venir`
                : "Aucune session à venir"}
          </span>
          {todo > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-semibold">
              {todo} à faire
            </span>
          )}
          {toCorrect > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100 font-semibold">
              {toCorrect} à corriger
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Cours de la classe</h3>
          <p className="text-xs text-gray-500">
            {loading ? "Chargement…" : `${courses.length} cours programmé${courses.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {headerAction}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            title="Actualiser"
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faArrowsRotate} className={loading ? "animate-spin" : ""} style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 py-4">{error}</p>
      ) : sorted.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucun cours programmé dans cette classe pour le moment" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {sorted.map((c) => card(c))}
        </div>
      )}
    </div>
  );
};

export default ClassCoursesBoard;
