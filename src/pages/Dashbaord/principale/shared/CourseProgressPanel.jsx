import React, { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faBookOpen,
  faFileLines,
  faSpinner,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Dashboard "Progression par cours": for the learner (the student himself, or
 * the parent's selected child — minor or adult), each course scheduled in
 * their classes with chapters read / total and %, plus a homework summary
 * (handed in, corrected, average mark on 20).
 *
 * Endpoints: GET /cours-programmes/accessible/{id} (which courses),
 * GET /cours/accessibles/{id} (titles), GET /cours/{coursId}/progression/{id},
 * GET /participations-exercises/utilisateur/{id} (homework marks).
 */

const api = async (path) => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("authToken");
  const r = await fetch(`${process.env.REACT_APP_API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
};

/** "16/20" → 16 ; "7/10" → 14 ; "15" → 15 (already on 20). */
const markOn20 = (note) => {
  if (!note) return null;
  const [a, b] = String(note).replace(",", ".").split("/");
  const earned = parseFloat(a);
  const max = b !== undefined ? parseFloat(b) : 20;
  if (Number.isNaN(earned) || !max) return null;
  return (earned / max) * 20;
};

const barColor = (pct) =>
  pct >= 100
    ? "#16a34a"
    : pct >= 50
      ? "#2563eb"
      : pct > 0
        ? "#f59e0b"
        : "#cbd5e1";

const CourseProgressPanel = ({
  learnerId,
  learnerName,
  themeColors = {},
  onOpenCourses,
  onOpenDevoirs,
}) => {
  const [rows, setRows] = useState([]);
  const [homework, setHomework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!learnerId) return;
    setLoading(true);
    setError("");
    try {
      const [scheduled, details, parts] = await Promise.all([
        api(`/cours-programmes/accessible/${learnerId}`).catch(() => []),
        api(`/cours/accessibles/${learnerId}`).catch(() => []),
        api(`/participations-exercises/utilisateur/${learnerId}`).catch(
          () => [],
        ),
      ]);
      const titles = new Map((details || []).map((c) => [c.id, c.titre]));
      const coursIds = [
        ...new Set((scheduled || []).map((s) => s.coursId).filter(Boolean)),
      ];
      const progress = await Promise.all(
        coursIds.map((id) =>
          api(`/cours/${id}/progression/${learnerId}`)
            .then((p) => ({ id, p }))
            .catch(() => ({ id, p: null })),
        ),
      );
      setRows(
        progress
          .map(({ id, p }) => ({
            id,
            titre: titles.get(id) || "Cours",
            done: p?.chapitresCompletes ?? 0,
            total: p?.totalChapitres ?? 0,
            pct: Math.round(p?.pourcentage ?? 0),
          }))
          .sort((a, b) => b.pct - a.pct || a.titre.localeCompare(b.titre)),
      );
      const list = parts || [];
      const submitted = list.filter((p) =>
        ["SOUMIS", "EN_ATTENTE_CORRECTION", "CORRIGE", "VALIDE"].includes(
          p.etatSoumission,
        ),
      );
      const graded = list.filter((p) =>
        ["CORRIGE", "VALIDE"].includes(p.etatSoumission),
      );
      const marks = graded
        .map((p) => markOn20(p.note))
        .filter((m) => m !== null);
      setHomework({
        submitted: submitted.length,
        graded: graded.length,
        pending: submitted.length - graded.length,
        average: marks.length
          ? Math.round((marks.reduce((s, m) => s + m, 0) / marks.length) * 10) /
            10
          : null,
      });
    } catch {
      setError("Impossible de charger la progression.");
    } finally {
      setLoading(false);
    }
  }, [learnerId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!learnerId) return null;
  const card = `${themeColors.cardBg || "bg-white"} rounded-xl shadow-sm border ${themeColors.border || "border-gray-200"}`;
  const text = themeColors.text || "text-gray-800";
  const avg =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length)
      : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 sm:mb-8">
      {/* Per-course progression */}
      <div className={`${card} p-4 sm:p-6 lg:col-span-2`}>
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3
            className={`text-base font-semibold ${text} flex items-center gap-2`}
          >
            <FontAwesomeIcon icon={faArrowTrendUp} className="text-blue-500" />
            {learnerName
              ? `Progression de ${learnerName} par cours`
              : "Ma progression par cours"}
          </h3>
          {rows.length > 0 && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Moyenne {avg}%
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-6 justify-center">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            Chargement de la progression…
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : rows.length === 0 ? (
          <div className="text-center py-6">
            <FontAwesomeIcon
              icon={faBookOpen}
              className="text-gray-300 mb-2"
              style={{ fontSize: 32 }}
            />
            <p className="text-sm text-gray-500">
              Aucun cours programmé pour le moment.
            </p>
            {onOpenCourses && (
              <button
                onClick={onOpenCourses}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
              >
                Voir les cours
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.id}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-sm font-medium ${text} truncate`}>
                    {r.titre}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {r.total > 0
                      ? `${r.done}/${r.total} chapitre${r.total > 1 ? "s" : ""} · `
                      : ""}
                    <strong style={{ color: barColor(r.pct) }}>{r.pct}%</strong>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, r.pct)}%`,
                      background: barColor(r.pct),
                    }}
                  />
                </div>
                {r.total === 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Pas encore de chapitre publié
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Homework summary */}
      <div className={`${card} p-4 sm:p-6`}>
        <h3
          className={`text-base font-semibold ${text} flex items-center gap-2 mb-4`}
        >
          <FontAwesomeIcon icon={faFileLines} className="text-purple-500" />
          Devoirs
        </h3>
        {loading || !homework ? (
          <div className="flex justify-center py-6 text-gray-400">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50">
              <FontAwesomeIcon icon={faTrophy} className="text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">Moyenne des devoirs</p>
                <p className="text-lg font-bold text-purple-700">
                  {homework.average !== null ? `${homework.average}/20` : "—"}
                </p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Rendus</span>
              <strong className={text}>{homework.submitted}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Corrigés</span>
              <strong className="text-green-600">{homework.graded}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">En attente de correction</span>
              <strong className="text-orange-600">{homework.pending}</strong>
            </div>
            {onOpenDevoirs && (
              <button
                onClick={onOpenDevoirs}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm font-semibold text-blue-700 border border-blue-200 hover:bg-blue-50"
              >
                Voir les devoirs et corrections
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseProgressPanel;
