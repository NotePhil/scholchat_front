import React, { useEffect, useState } from "react";
import axios from "axios";
import { applyAuthInterceptors } from "../../../../../utils/axiosConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCircleCheck,
  faCircleExclamation,
  faCircleXmark,
  faClock,
  faSpinner,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Read-only copy of a submitted devoir (the student's own, or the parent's
 * selected child): overall grade + appreciation, total points, and for each
 * question the submitted answer with the teacher's verdict, "x/y pts" and
 * comment once corrected.
 */

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
applyAuthInterceptors(api);

const TYPE_LABELS = {
  QCM: "QCM",
  VRAI_FAUX: "Vrai / Faux",
  REPONSE_COURTE: "Réponse courte",
  REPONSE_LONGUE: "Réponse longue",
  DEVELOPPEMENT: "Développement",
  TROU: "Texte à trous",
};

const fmtNum = (n) =>
  Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);

/** Points earned on one question: explicit numeric note, else full/zero from the verdict. */
export const questionEarned = (question, answer) => {
  if (!answer) return null;
  const max = question.points || 1;
  const raw = answer.note != null ? String(answer.note).trim() : "";
  if (raw) {
    const n = parseFloat(raw.split("/")[0].replace(",", "."));
    if (!Number.isNaN(n)) return Math.min(n, max);
  }
  if (answer.estCorrecte === true) return max;
  if (answer.estCorrecte === false) return 0;
  return null;
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

const StudentExerciseResultView = ({
  exerciseId,
  exerciseName,
  learnerId,
  learnerName,
  participation,
  onBack,
}) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [qs, mine] = await Promise.all([
          api.get(`/questions/exercise/${exerciseId}`).then((r) => r.data),
          api
            .get(`/reponses/utilisateur/${learnerId}`)
            .then((r) => r.data)
            .catch(() => []),
        ]);
        if (cancelled) return;
        const ids = new Set((qs || []).map((q) => q.id));
        const byQuestion = {};
        (mine || []).forEach((r) => {
          if (r.questionId && ids.has(r.questionId))
            byQuestion[r.questionId] = r;
        });
        setQuestions(qs || []);
        setAnswers(byQuestion);
      } catch {
        if (!cancelled) setError("Impossible de charger la copie.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (exerciseId && learnerId) load();
    return () => {
      cancelled = true;
    };
  }, [exerciseId, learnerId]);

  const etat = participation?.etatSoumission;
  const graded = etat === "CORRIGE" || etat === "VALIDE";
  const maxPoints = questions.reduce((s, q) => s + (q.points || 1), 0);
  const earnedList = questions.map((q) => questionEarned(q, answers[q.id]));
  const hasScores = graded && earnedList.some((e) => e !== null);
  const earnedTotal = earnedList.reduce((s, e) => s + (e || 0), 0);
  const correctCount = questions.filter(
    (q) => answers[q.id]?.estCorrecte === true,
  ).length;

  const answerText = (q, raw) => {
    if (!raw) return raw;
    const c = (q.choixReponses || []).find((x) => x.id === raw);
    return c?.texte ?? raw;
  };

  return (
    <div className="w-full px-2 py-3">
      <div
        className="flex items-center gap-3 mb-4 px-3 py-2.5 rounded-xl"
        style={{
          background: "linear-gradient(135deg, #1d3557 0%, #457b9d 100%)",
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 bg-white/15 hover:bg-white/25 transition-colors"
          aria-label="Retour"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-sm leading-tight truncate">
            {exerciseName || "Devoir"}
          </h1>
          <p className="text-blue-100 text-xs opacity-80 truncate">
            {learnerName ? `Copie de ${learnerName}` : "Ma copie"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <FontAwesomeIcon
            icon={faSpinner}
            className="w-8 h-8 text-indigo-600 animate-spin"
          />
          <p className="text-sm text-gray-500">Chargement de la copie…</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <FontAwesomeIcon icon={faCircleExclamation} />
              {error}
            </div>
          )}

          {/* Summary */}
          {graded ? (
            <div
              className="mb-4 p-4 rounded-xl"
              style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}
            >
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {participation?.note && (
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faTrophy}
                      style={{ color: "#7c3aed" }}
                    />
                    <span className="text-xs text-purple-600">Note</span>
                    <span className="text-xl font-bold text-purple-700">
                      {participation.note}
                    </span>
                  </div>
                )}
                {hasScores && (
                  <div className="text-sm text-purple-700">
                    <strong>
                      {fmtNum(earnedTotal)}/{fmtNum(maxPoints)}
                    </strong>{" "}
                    pts · {correctCount}/{questions.length} réponse
                    {questions.length > 1 ? "s" : ""} correcte
                    {correctCount > 1 ? "s" : ""}
                  </div>
                )}
              </div>
              {participation?.appreciation && (
                <p className="mt-2 text-sm text-purple-600 italic">
                  “{participation.appreciation}”
                </p>
              )}
            </div>
          ) : (
            <div
              className="mb-4 px-3 py-2 rounded-lg flex items-center gap-2"
              style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}
            >
              <FontAwesomeIcon icon={faClock} style={{ color: "#c2410c" }} />
              <span className="text-xs text-orange-700">
                En attente de correction du professeur
              </span>
            </div>
          )}
          {fmtDate(participation?.dateFin || participation?.dateSoumission) && (
            <p className="text-xs text-gray-400 mb-3">
              Soumis le{" "}
              {fmtDate(participation?.dateFin || participation?.dateSoumission)}
            </p>
          )}

          {questions.length === 0 && !error && (
            <p className="text-sm text-gray-500 text-center py-8">
              Aucune question pour ce devoir.
            </p>
          )}

          <div className="space-y-3">
            {questions.map((q, i) => {
              const r = answers[q.id];
              const text = answerText(q, r?.reponseUtilisateur);
              const max = q.points || 1;
              const earned = earnedList[i];
              const verdict =
                graded &&
                r &&
                r.estCorrecte !== null &&
                r.estCorrecte !== undefined
                  ? r.estCorrecte
                  : null;
              const border =
                verdict === true
                  ? "#86efac"
                  : verdict === false
                    ? "#fca5a5"
                    : "#e4eaf4";
              return (
                <div
                  key={q.id}
                  className="bg-white rounded-xl p-4"
                  style={{ border: `1px solid ${border}` }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {q.intitule}
                      </p>
                      <span className="text-xs text-gray-400">
                        {TYPE_LABELS[q.typeQuestion] || q.typeQuestion} · {max}{" "}
                        pt{max > 1 ? "s" : ""}
                      </span>
                    </div>
                    {graded && earned !== null && (
                      <span
                        className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${verdict === false ? "bg-red-50 text-red-700" : verdict === true ? "bg-green-50 text-green-700" : "bg-purple-50 text-purple-700"}`}
                      >
                        {fmtNum(earned)}/{fmtNum(max)} pt{max > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    Réponse
                  </p>
                  <div className="px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-800 whitespace-pre-wrap">
                    {text || (
                      <span className="text-gray-400 italic">
                        Aucune réponse
                      </span>
                    )}
                  </div>

                  {graded ? (
                    <div className="mt-2 space-y-1">
                      {verdict !== null && (
                        <p
                          className={`text-xs font-semibold flex items-center gap-1 ${verdict ? "text-green-700" : "text-red-700"}`}
                        >
                          <FontAwesomeIcon
                            icon={verdict ? faCircleCheck : faCircleXmark}
                          />
                          {verdict ? "Correcte" : "Incorrecte"}
                        </p>
                      )}
                      {r?.appreciation && (
                        <p className="text-xs text-gray-500 italic">
                          “{r.appreciation}”
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-orange-600">
                      En attente de correction
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentExerciseResultView;
