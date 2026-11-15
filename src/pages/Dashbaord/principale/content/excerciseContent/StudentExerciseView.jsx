import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { applyAuthInterceptors } from "../../../../../utils/axiosConfig";
import QuestionMediaList from "../../../../../components/common/QuestionMediaList";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { parseServerDate } from "../../../../../utils/dateUtils";
import {
  faArrowDown,
  faArrowLeft,
  faArrowUp,
  faChevronLeft,
  faChevronRight,
  faCircleExclamation,
  faPaperPlane,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
// ─── Minimal API client ───────────────────────────────────────────────────────
const createApi = () => {
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  applyAuthInterceptors(instance);
  return instance;
};
const api = createApi();

// ─── API helpers (only what this component needs) ────────────────────────────

/** GET /questions/exercise/{exerciseId} — full questions with choixReponses */
const fetchQuestions = (exerciseId) =>
  api.get(`/questions/exercise/${exerciseId}`).then((r) => r.data);

/** POST /reponses — submit one answer */
const submitAnswer = (payload) =>
  api.post("/reponses", payload).then((r) => r.data);

/** POST /participations-exercises — register / start participation */
const startParticipation = (payload) =>
  api.post("/participations-exercises", payload).then((r) => r.data);

/** PUT /participations-exercises — update participation on submit */
const updateParticipation = (payload) =>
  api.put("/participations-exercises", payload).then((r) => r.data);

// ─── Ordering (CLASSEMENT) / matching (ASSOCIATION) helpers ──────────────────

/** Separator of an ordering answer — same format as the mobile app and the corrections. */
const ORDER_SEPARATOR = " \u2192 ";
const PAIR_SPLIT_RE = /\s*(?:\u2192|\u21d2|->|=>)\s*/;
const DEADLINE_CODE = "DATE_LIMITE_DEPASSEE";
const DEADLINE_MESSAGE =
  "La date limite de cet exercice est dépassée : il ne peut plus être rendu.";

/** Non-empty choices of a question, in the order set by the professor. */
const orderedChoices = (question) =>
  [...(question?.choixReponses || [])]
    .sort((a, b) => (a.ordreAffichage || 0) - (b.ordreAffichage || 0))
    .filter((c) => c.texte && String(c.texte).trim());

/** Shuffled copy; with 2+ items the result never keeps the original order. */
const shuffleDifferent = (items) => {
  const out = [...items];
  if (out.length < 2) return out;
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.every((item, i) => item === items[i])) out.push(out.shift());
  return out;
};

const orderingAnswer = (items) =>
  items.map((c) => String(c.texte).trim()).join(ORDER_SEPARATOR);

/**
 * Pairs of a matching question ("France → Paris" per choice), or null when a
 * choice is not written as a pair (the student then answers in free text).
 */
const parsePairs = (question) => {
  const choices = orderedChoices(question);
  if (choices.length === 0) return null;
  const pairs = [];
  for (const c of choices) {
    const parts = String(c.texte).split(PAIR_SPLIT_RE);
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) return null;
    pairs.push({ left: parts[0].trim(), right: parts[1].trim() });
  }
  return pairs;
};

const associationAnswer = (lefts, picks) =>
  lefts.every((_, i) => picks[i])
    ? lefts.map((left, i) => `${left}${ORDER_SEPARATOR}${picks[i]}`).join(", ")
    : undefined;

/** Server message when the deadline has passed, else null. */
const deadlineErrorMessage = (err) => {
  const data = err?.response?.data;
  if (data?.code !== DEADLINE_CODE) return null;
  return data.message || DEADLINE_MESSAGE;
};

// ─────────────────────────────────────────────────────────────────────────────

const StudentExerciseView = ({
  exerciseId,
  // base exercise ID (used for /questions/exercise/{id})
  exerciseProgrammerId,
  // programmer record ID (used for participations)
  exerciseName,
  exerciseDescription,
  existingParticipation,
  // participation record from the list (null = none yet)
  learnerId,
  // whose copy — defaults to the signed-in user; a parent passes their minor child
  learnerName,
  deadline,
  // dateFinExoEffectif of the programmed exercise, when the caller knows it
  onBack,
  onComplete,
}) => {
  const answeringUserId = learnerId || localStorage.getItem("userId");
  const [questions, setQuestions] = useState([]);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // CLASSEMENT: { [questionId]: choices in the student's current order }
  const [orderings, setOrderings] = useState({});
  // ASSOCIATION: { [questionId]: { lefts, rights (shuffled), picks: { index: right } } }
  const [associations, setAssociations] = useState({});

  // Guard: load only once per exerciseId
  const loadedRef = useRef(null);
  useEffect(() => {
    if (!exerciseId || loadedRef.current === exerciseId) return;
    loadedRef.current = exerciseId;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const qs = (await fetchQuestions(exerciseId)) || [];
        // Ordering questions: shuffled once, and that first order already is an answer.
        const initialOrders = {};
        const initialAssociations = {};
        const initialAnswers = {};
        qs.forEach((q) => {
          if (q.typeQuestion === "CLASSEMENT") {
            const items = orderedChoices(q);
            if (items.length === 0) return;
            const shuffled = shuffleDifferent(items);
            initialOrders[q.id] = shuffled;
            initialAnswers[q.id] = orderingAnswer(shuffled);
          } else if (q.typeQuestion === "ASSOCIATION") {
            const pairs = parsePairs(q);
            if (!pairs) return;
            initialAssociations[q.id] = {
              lefts: pairs.map((p) => p.left),
              rights: shuffleDifferent(pairs.map((p) => p.right)),
              picks: {},
            };
          }
        });
        setOrderings(initialOrders);
        setAssociations(initialAssociations);
        setCurrentAnswers(initialAnswers);
        setQuestions(qs);
      } catch (err) {
        setError(
          "Impossible de charger les questions. Vérifiez votre connexion.",
        );
        console.error("[StudentExerciseView] fetchQuestions error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [exerciseId]);

  // Register or update participation when questions are loaded
  useEffect(() => {
    if (!exerciseProgrammerId || loading || questions.length === 0) return;
    const userId = answeringUserId;
    if (!userId) return;
    const payload = {
      utilisateurId: userId,
      exerciseProgrammerId,
      etatSoumission: "EN_COURS",
    };
    // The server refuses to start an exercise whose deadline has passed: say so.
    const onStartError = (err) => {
      const message = deadlineErrorMessage(err);
      if (message) setError(message);
    };
    if (existingParticipation) {
      // Participation already exists — use PUT to keep it as EN_COURS
      updateParticipation(payload).catch(onStartError);
    } else {
      // First time opening — create with POST
      startParticipation({
        ...payload,
        dateDebut: new Date().toISOString(),
      }).catch(onStartError);
    }
  }, [exerciseProgrammerId, loading, questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswerChange = (questionId, value) => {
    setCurrentAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };
  const moveOrderingItem = (questionId, index, dir) => {
    const items = orderings[questionId] || [];
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setOrderings((prev) => ({ ...prev, [questionId]: next }));
    handleAnswerChange(questionId, orderingAnswer(next));
  };
  const pickAssociation = (questionId, index, right) => {
    const current = associations[questionId];
    if (!current) return;
    const picks = { ...current.picks, [index]: right };
    setAssociations((prev) => ({
      ...prev,
      [questionId]: { ...current, picks },
    }));
    handleAnswerChange(questionId, associationAnswer(current.lefts, picks));
  };
  const answeredCount = questions.filter(
    (q) => currentAnswers[q.id] !== undefined,
  ).length;
  const progress =
    questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const handleSubmit = async () => {
    const unanswered = questions.filter(
      (q) => currentAnswers[q.id] === undefined,
    );
    if (unanswered.length > 0) {
      setError(
        `Veuillez répondre à toutes les questions (${unanswered.length} sans réponse).`,
      );
      return;
    }
    // Past the deadline: nothing is sent (the server would refuse the copy anyway).
    const deadlineDate = parseServerDate(deadline);
    if (deadlineDate && deadlineDate.getTime() < Date.now()) {
      setError(DEADLINE_MESSAGE);
      return;
    }
    setSubmitting(true);
    setError("");
    const userId = answeringUserId;
    try {
      // Submit each answer to POST /reponses
      for (const question of questions) {
        const rawValue = currentAnswers[question.id];

        // For QCM / VRAI_FAUX the stored value is the choice ID; resolve the text for storage
        let reponseUtilisateur = rawValue;
        if (
          question.typeQuestion === "QCM" ||
          question.typeQuestion === "VRAI_FAUX"
        ) {
          const choice = (question.choixReponses || []).find(
            (c) => c.id === rawValue,
          );
          reponseUtilisateur = choice?.texte ?? rawValue;
        }
        await submitAnswer({
          utilisateurId: userId,
          questionId: question.id,
          reponseUtilisateur,
          // No auto-correction: professor handles grading
          estCorrecte: null,
          note: null,
          appreciation: null,
        });
      }

      // Update participation: mark as SOUMIS
      if (exerciseProgrammerId) {
        await updateParticipation({
          utilisateurId: userId,
          exerciseProgrammerId,
          etatSoumission: "SOUMIS",
          dateFin: new Date().toISOString(),
        });
      }
      if (onComplete) onComplete();
      else if (onBack) onBack();
    } catch (err) {
      console.error("[StudentExerciseView] submit error:", err);
      setError(
        deadlineErrorMessage(err) ||
          "Erreur lors de la soumission. Veuillez réessayer.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <FontAwesomeIcon
          icon={faSpinner}
          className="w-8 h-8 text-indigo-600 animate-spin"
        />
        <p className="text-sm text-gray-500">Chargement des questions…</p>
      </div>
    );
  }

  // ─── Header ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full px-2 py-3">
      {/* Header bar */}
      <div
        className="flex items-center gap-3 mb-4 px-3 py-2.5 rounded-xl"
        style={{
          background: "var(--gradient-hero)",
        }}
      >
        <button
          aria-label="Retour"
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-colors"
          style={{
            background: "rgba(255,255,255,0.15)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.25)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
          }
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-sm leading-tight truncate">
            {exerciseName || "Exercice"}
          </h1>
          {exerciseDescription && (
            <p className="text-blue-100 text-xs opacity-80 truncate">
              {exerciseDescription}
            </p>
          )}
        </div>
        <div
          className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold"
          style={{
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
          }}
        >
          {answeredCount}/{questions.length} rép.
        </div>
      </div>

      {learnerName && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          Vous répondez pour <strong>{learnerName}</strong> : la copie sera
          enregistrée à son nom et envoyée au professeur.
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-4 px-1">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>
            {answeredCount}/{questions.length} répondu(s)
          </span>
          <span className="font-medium text-indigo-600">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <FontAwesomeIcon
            icon={faCircleExclamation}
            className="w-4 h-4 flex-shrink-0 mt-0.5"
          />
          <span>{error}</span>
        </div>
      )}

      {/* Mobile question nav */}
      <div className="flex items-center justify-between mb-4 sm:hidden">
        <button
          aria-label="Précédent"
          onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
          disabled={currentQuestionIndex === 0}
          className="p-2 rounded-lg bg-gray-100 disabled:opacity-40"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-gray-700">
          Question {currentQuestionIndex + 1} / {questions.length}
        </span>
        <button
          aria-label="Suivant"
          onClick={() =>
            setCurrentQuestionIndex((i) =>
              Math.min(questions.length - 1, i + 1),
            )
          }
          disabled={currentQuestionIndex === questions.length - 1}
          className="p-2 rounded-lg bg-gray-100 disabled:opacity-40"
        >
          <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
        </button>
      </div>

      {/* Questions grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {questions.map((question, idx) => {
          const isCurrent = idx === currentQuestionIndex;
          const isAnswered = currentAnswers[question.id] !== undefined;
          return (
            <div
              key={question.id}
              className={`bg-white border rounded-xl p-3 transition-all ${isCurrent ? "block" : "hidden sm:block"} ${isAnswered ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200"}`}
            >
              {/* Question header */}
              <div className="flex items-start gap-2 mb-3">
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isAnswered ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-600"}`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm whitespace-pre-line break-words">
                    {question.intitule}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {question.typeQuestion}
                    </span>
                    <span className="text-xs text-gray-400">
                      {question.points || 1} pt(s)
                    </span>
                  </div>
                </div>
              </div>

              <QuestionMediaList medias={question.medias} className="ml-9 mb-3" />

              {/* ── QCM ── */}
              {question.typeQuestion === "QCM" && (
                <div className="space-y-1.5 ml-9">
                  {(question.choixReponses || [])
                    .sort(
                      (a, b) =>
                        (a.ordreAffichage || 0) - (b.ordreAffichage || 0),
                    )
                    .map((choice) => (
                      <label
                        key={choice.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${currentAnswers[question.id] === choice.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"}`}
                      >
                        <input
                          type="radio"
                          name={`q-${question.id}`}
                          value={choice.id}
                          checked={currentAnswers[question.id] === choice.id}
                          onChange={() =>
                            handleAnswerChange(question.id, choice.id)
                          }
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm text-gray-700">
                          {choice.texte}
                        </span>
                      </label>
                    ))}
                </div>
              )}

              {/* ── VRAI / FAUX ── */}
              {question.typeQuestion === "VRAI_FAUX" && (
                <div className="flex gap-2 ml-9">
                  {(question.choixReponses && question.choixReponses.length > 0
                    ? question.choixReponses
                        .sort(
                          (a, b) =>
                            (a.ordreAffichage || 0) - (b.ordreAffichage || 0),
                        )
                        .map((c) => ({
                          id: c.id,
                          label: c.texte,
                        }))
                    : [
                        {
                          id: "Vrai",
                          label: "Vrai",
                        },
                        {
                          id: "Faux",
                          label: "Faux",
                        },
                      ]
                  ).map((option) => (
                    <label
                      key={option.id}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${currentAnswers[question.id] === option.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        value={option.id}
                        checked={currentAnswers[question.id] === option.id}
                        onChange={() =>
                          handleAnswerChange(question.id, option.id)
                        }
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* ── REPONSE_COURTE ── */}
              {question.typeQuestion === "REPONSE_COURTE" && (
                <div className="ml-9">
                  <input
                    type="text"
                    value={currentAnswers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    placeholder="Votre réponse…"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              )}

              {/* ── REPONSE_LONGUE / DEVELOPPEMENT ── */}
              {(question.typeQuestion === "REPONSE_LONGUE" ||
                question.typeQuestion === "DEVELOPPEMENT") && (
                <div className="ml-9">
                  <textarea
                    value={currentAnswers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    placeholder="Rédigez votre réponse…"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                  />
                </div>
              )}

              {/* ── CLASSEMENT ── */}
              {question.typeQuestion === "CLASSEMENT" &&
                orderings[question.id] && (
                <div className="ml-9">
                  <p className="text-xs text-gray-500 mb-2">
                    Remettez les éléments dans le bon ordre à l'aide des
                    flèches.
                  </p>
                  <ol className="space-y-1.5 list-none p-0 m-0">
                    {(orderings[question.id] || []).map((item, pos, list) => (
                      <li
                        key={item.id ?? `${pos}-${item.texte}`}
                        className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                          {pos + 1}
                        </span>
                        <span className="flex-1 min-w-0 text-sm text-gray-700 break-words">
                          {item.texte}
                        </span>
                        <button
                          type="button"
                          aria-label="Monter"
                          title="Monter"
                          onClick={() =>
                            moveOrderingItem(question.id, pos, -1)
                          }
                          disabled={pos === 0}
                          className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <FontAwesomeIcon icon={faArrowUp} className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Descendre"
                          title="Descendre"
                          onClick={() => moveOrderingItem(question.id, pos, 1)}
                          disabled={pos === list.length - 1}
                          className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <FontAwesomeIcon
                            icon={faArrowDown}
                            className="w-4 h-4"
                          />
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* ── ASSOCIATION ── */}
              {/* (free text when the items cannot be laid out) */}
              {(question.typeQuestion === "ASSOCIATION" ||
                (question.typeQuestion === "CLASSEMENT" &&
                  !orderings[question.id])) &&
                (associations[question.id] ? (
                  <div className="ml-9 space-y-2">
                    <p className="text-xs text-gray-500">
                      Associez chaque élément à sa correspondance.
                    </p>
                    {associations[question.id].lefts.map((left, i) => (
                      <div
                        key={`${i}-${left}`}
                        className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2"
                      >
                        <span className="sm:w-2/5 text-sm font-medium text-gray-700 break-words">
                          {left}
                        </span>
                        <select
                          aria-label={`Correspondance de ${left}`}
                          value={associations[question.id].picks[i] || ""}
                          onChange={(e) =>
                            pickAssociation(question.id, i, e.target.value)
                          }
                          className="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Choisir…</option>
                          {associations[question.id].rights.map((right, j) => (
                            <option key={`${j}-${right}`} value={right}>
                              {right}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ml-9">
                    <textarea
                      value={currentAnswers[question.id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(question.id, e.target.value)
                      }
                      placeholder="Votre réponse…"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                    />
                  </div>
                ))}

              {/* ── TROU ── */}
              {question.typeQuestion === "TROU" && (
                <div className="ml-9">
                  <input
                    type="text"
                    value={currentAnswers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    placeholder="Complétez le texte…"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit — mobile */}
      <div className="sm:hidden mt-4 flex items-center justify-between gap-2">
        <button
          aria-label="Précédent"
          onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
          disabled={currentQuestionIndex === 0}
          className="p-2 rounded-lg bg-gray-100 disabled:opacity-40"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
        </button>
        {currentQuestionIndex === questions.length - 1 && (
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount < questions.length}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Envoi…" : "Soumettre"}
          </button>
        )}
        <button
          aria-label="Suivant"
          onClick={() =>
            setCurrentQuestionIndex((i) =>
              Math.min(questions.length - 1, i + 1),
            )
          }
          disabled={currentQuestionIndex === questions.length - 1}
          className="p-2 rounded-lg bg-gray-100 disabled:opacity-40"
        >
          <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
        </button>
      </div>

      {/* Submit — desktop */}
      <div className="hidden sm:flex justify-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting || answeredCount < questions.length}
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {submitting ? (
            <>
              <FontAwesomeIcon
                icon={faSpinner}
                className="w-5 h-5 animate-spin"
              />
              Soumission en cours…
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faPaperPlane} className="w-5 h-5" />
              Soumettre ({answeredCount}/{questions.length})
            </>
          )}
        </button>
      </div>

      {/* Dot navigation */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestionIndex(idx)}
            className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${currentAnswers[q.id] !== undefined ? "bg-indigo-500 text-white" : idx === currentQuestionIndex ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500" : "bg-gray-100 text-gray-500"}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
};
export default StudentExerciseView;
