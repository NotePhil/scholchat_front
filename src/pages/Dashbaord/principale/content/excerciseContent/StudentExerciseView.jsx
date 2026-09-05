import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { applyAuthInterceptors } from "../../../../../utils/axiosConfig";

/**
 * ImageLightbox — fullscreen popup for a question image, opened on click
 * instead of navigating to a new tab.
 */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowUpRightFromSquare,
  faChevronLeft,
  faChevronRight,
  faCircleExclamation,
  faFileLines,
  faPaperPlane,
  faSpinner,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
const ImageLightbox = ({ url, onClose }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
      </button>
      <img
        src={url}
        alt=""
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

/**
 * QuestionMediaPreview — renders a question's attached image/PDF.
 * The presigned S3 URL is already embedded in the question by the backend
 * (no /media/{id}/download-url round trip needed). Images are only decoded
 * once they scroll into view via IntersectionObserver, same discipline as
 * the activity feed's LazyMedia component. Clicking an image opens it in an
 * in-page lightbox rather than a new browser tab; PDFs still open in a new
 * tab since there is nothing to preview inline.
 */
const QuestionMediaPreview = ({ medias }) => {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  if (!medias || medias.length === 0) return null;
  return (
    <div ref={containerRef} className="ml-9 mb-3 flex flex-wrap gap-2">
      {medias.map((media) => {
        const isImage =
          media.mediaType === "IMAGE" ||
          (media.contentType || "").startsWith("image/");
        if (isImage) {
          return (
            <button
              key={media.id}
              type="button"
              onClick={() =>
                media.presignedUrl && setLightboxUrl(media.presignedUrl)
              }
              className="block w-28 h-28 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-zoom-in"
            >
              {visible && media.presignedUrl ? (
                <img
                  src={media.presignedUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full animate-pulse bg-gray-200" />
              )}
            </button>
          );
        }
        return (
          <a
            key={media.id}
            href={media.presignedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs text-gray-700"
          >
            <FontAwesomeIcon
              icon={faFileLines}
              className="w-4 h-4 text-red-500 flex-shrink-0"
            />
            <span className="max-w-[140px] truncate">{media.fileName}</span>
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              className="w-3 h-3 text-gray-400 flex-shrink-0"
            />
          </a>
        );
      })}
      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
};

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
  onBack,
  onComplete,
}) => {
  const [questions, setQuestions] = useState([]);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Guard: load only once per exerciseId
  const loadedRef = useRef(null);
  useEffect(() => {
    if (!exerciseId || loadedRef.current === exerciseId) return;
    loadedRef.current = exerciseId;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const qs = await fetchQuestions(exerciseId);
        setQuestions(qs || []);
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
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    const payload = {
      utilisateurId: userId,
      exerciseProgrammerId,
      etatSoumission: "EN_COURS",
    };
    if (existingParticipation) {
      // Participation already exists — use PUT to keep it as EN_COURS
      updateParticipation(payload).catch(() => {});
    } else {
      // First time opening — create with POST
      startParticipation({
        ...payload,
        dateDebut: new Date().toISOString(),
      }).catch(() => {});
    }
  }, [exerciseProgrammerId, loading, questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswerChange = (questionId, value) => {
    setCurrentAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
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
    setSubmitting(true);
    setError("");
    const userId = localStorage.getItem("userId");
    try {
      // Submit each answer to POST /reponses
      for (const question of questions) {
        const rawValue = currentAnswers[question.id];

        // For QCM the stored value is the choice ID; resolve the text for storage
        let reponseUtilisateur = rawValue;
        if (question.typeQuestion === "QCM") {
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
      setError("Erreur lors de la soumission. Veuillez réessayer.");
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
          background: "linear-gradient(135deg, #1d3557 0%, #457b9d 100%)",
        }}
      >
        <button
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
                  <p className="font-medium text-gray-900 text-sm">
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

              <QuestionMediaPreview medias={question.medias} />

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
