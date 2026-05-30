import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Send,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Target,
} from "lucide-react";
import {
  exerciseService,
  questionReponseService,
  repondreService,
  participationExerciseService,
} from "../../../../../services/exerciseService";

const StudentExerciseView = ({ exerciseId, exerciseProgrammerId, onBack, onComplete }) => {
  const [exercise, setExercise] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [previousAnswers, setPreviousAnswers] = useState([]);
  const [results, setResults] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [startTime] = useState(new Date().toISOString());

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  const loadExercise = async () => {
    try {
      setLoading(true);
      setError("");

      let exerciseData = null;
      let questionsData = [];
      let actualExerciseId = exerciseId;

      // Try to load as exercise first
      try {
        exerciseData = await exerciseService.getExerciseById(exerciseId);
        questionsData = await questionReponseService.getQuestionsByExercise(exerciseId);
      } catch (e) {
        // If not found, it might be a programmer ID - try to get the source exercise
        try {
          const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
          const progResp = await fetch(`${process.env.REACT_APP_API_BASE_URL}/exercises-programmer/${exerciseId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (progResp.ok) {
            const progData = await progResp.json();
            // exerciseId field in programmer object points to base exercise
            const baseId = progData.exerciseId || progData.exercise?.id;
            if (baseId) {
              actualExerciseId = baseId;
              try {
                exerciseData = await exerciseService.getExerciseById(baseId);
              } catch { exerciseData = progData.exercise || progData; }
            } else {
              exerciseData = progData;
              actualExerciseId = progData.id;
            }
            // Always fetch questions from base exercise to get choixReponses
            questionsData = await questionReponseService.getQuestionsByExercise(actualExerciseId);
          }
        } catch (e2) {
          console.warn("Could not load as programmer either:", e2);
        }
      }

      if (!exerciseData) {
        throw new Error("Exercice introuvable");
      }

      setExercise(exerciseData);
      setQuestions(questionsData || []);

      // Check if already completed
      const userId = localStorage.getItem("userId");
      const isParentRole = (localStorage.getItem("userRole") || "").toUpperCase().includes("PARENT");
      const effectiveUserId = isParentRole ? (localStorage.getItem("selectedChildId") || userId) : userId;

      try {
        const prevAnswers = await repondreService.getReponsesByUtilisateur(effectiveUserId);
        const exerciseQuestionIds = (questionsData || []).map(q => q.id);
        const answersForThisExercise = (prevAnswers || []).filter(a => exerciseQuestionIds.includes(a.questionId));
        if (answersForThisExercise.length > 0) {
          setAlreadyCompleted(true);
          setPreviousAnswers(answersForThisExercise);
          // Build results from previous answers
          const prevResults = (questionsData || []).map(q => {
            const ans = answersForThisExercise.find(a => a.questionId === q.id);
            return {
              questionId: q.id,
              question: q.intitule,
              type: q.typeQuestion,
              studentAnswer: ans?.reponseUtilisateur || "",
              isCorrect: ans?.estCorrecte,
              correctAnswer: q.reponse || "",
              canAutoCorrect: q.typeQuestion === "QCM" || q.typeQuestion === "VRAI_FAUX",
              points: ans?.estCorrecte ? (q.points || 1) : 0,
              maxPoints: q.points || 1,
              note: ans?.note,
              appreciation: ans?.appreciation,
            };
          });
          setResults(prevResults);
          setTotalScore(prevResults.reduce((s, r) => s + r.points, 0));
          setMaxScore(prevResults.reduce((s, r) => s + r.maxPoints, 0));
          setSubmitted(true);
          return; // Don't register new participation
        }
      } catch (e) {
        console.warn("Could not check previous answers:", e);
      }

      // Register participation if not already completed
      if (effectiveUserId && exerciseProgrammerId) {
        try {
          await participationExerciseService.participerExercise({
            utilisateurId: effectiveUserId,
            exerciseProgrammerId,
            dateDebut: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Could not register participation:", e);
        }
      }
    } catch (err) {
      setError(err.message || "Erreur lors du chargement de l'exercice");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value, type) => {
    setCurrentAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], value, type },
    }));
  };

  const autoCorrect = (question, answer) => {
    if (!answer?.value) return { isCorrect: false, correctAnswer: "" };

    const type = question.typeQuestion;

    if (type === "QCM") {
      const correctChoice = (question.choixReponses || []).find((c) => c.estCorrect);
      const isCorrect = correctChoice && answer.value === correctChoice.id;
      return {
        isCorrect,
        correctAnswer: correctChoice?.texte || question.reponse || "",
        canAutoCorrect: true,
      };
    }

    if (type === "VRAI_FAUX") {
      const expected = (question.reponse || "").toLowerCase().trim();
      const given = answer.value.toLowerCase().trim();
      const isCorrect = expected === given ||
        (expected === "vrai" && given === "vrai") ||
        (expected === "faux" && given === "faux");
      return { isCorrect, correctAnswer: question.reponse || "", canAutoCorrect: true };
    }

    // Open-ended questions cannot be auto-corrected
    return { isCorrect: null, correctAnswer: question.reponse || "", canAutoCorrect: false };
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const unanswered = questions.filter((q) => !currentAnswers[q.id]?.value);
    if (unanswered.length > 0) {
      setError(`Vous n'avez pas repondu a ${unanswered.length} question(s). Veuillez repondre a toutes les questions.`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const parentIdCheck = localStorage.getItem("userId");
      const isParentRoleCheck = (localStorage.getItem("userRole") || "").toUpperCase().includes("PARENT");
      const userId = isParentRoleCheck ? (localStorage.getItem("selectedChildId") || parentIdCheck) : parentIdCheck;
      const exerciseResults = [];
      let score = 0;
      let max = 0;

      for (const question of questions) {
        const answer = currentAnswers[question.id];
        const points = question.points || 1;
        max += points;

        const correction = autoCorrect(question, answer);

        // Get the text answer for submission
        let reponseText = answer?.value || "";
        if (question.typeQuestion === "QCM") {
          const selectedChoice = (question.choixReponses || []).find((c) => c.id === answer?.value);
          reponseText = selectedChoice?.texte || answer?.value || "";
        }

        // Submit to backend
        try {
          await repondreService.repondreQuestion({
            utilisateurId: userId,
            questionId: question.id,
            reponseUtilisateur: reponseText,
            estCorrecte: correction.canAutoCorrect ? correction.isCorrect : null,
            note: correction.canAutoCorrect && correction.isCorrect ? String(points) : correction.canAutoCorrect ? "0" : null,
          });
        } catch (e) {
          console.warn("Error submitting answer for question:", question.id, e);
        }

        if (correction.canAutoCorrect && correction.isCorrect) {
          score += points;
        }

        exerciseResults.push({
          questionId: question.id,
          question: question.intitule,
          type: question.typeQuestion,
          studentAnswer: reponseText,
          isCorrect: correction.isCorrect,
          correctAnswer: correction.correctAnswer,
          canAutoCorrect: correction.canAutoCorrect,
          points: correction.canAutoCorrect && correction.isCorrect ? points : 0,
          maxPoints: points,
        });
      }

      // Update participation with final score
      if (userId && exerciseProgrammerId) {
        try {
          const allAutoCorrect = exerciseResults.every(r => r.canAutoCorrect);
          const etatSoumission = allAutoCorrect ? "CORRIGE" : "EN_ATTENTE_CORRECTION";
          await participationExerciseService.updateParticipation({
            utilisateurId: userId,
            exerciseProgrammerId,
            dateFin: new Date().toISOString(),
            note: `${score}/${max}`,
            etatSoumission,
          });
        } catch (e) {
          console.warn("Could not update participation:", e);
        }
      }

      setResults(exerciseResults);
      setTotalScore(score);
      setMaxScore(max);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(currentAnswers).filter((k) => currentAnswers[k]?.value).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const currentQuestion = questions[currentQuestionIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-600">Chargement de l'exercice...</span>
      </div>
    );
  }

  if (error && !exercise) {
    return (
      <div className="w-full px-2 py-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">{error}</p>
            <button onClick={onBack} className="mt-2 text-red-600 underline text-sm">Retour</button>
          </div>
        </div>
      </div>
    );
  }

  // Results view after submission
  if (submitted) {
    const autoGraded = results.filter((r) => r.canAutoCorrect);
    const manualReview = results.filter((r) => !r.canAutoCorrect);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const allGraded = results.every(r => r.isCorrect !== null);
    const hasPendingManual = results.some(r => !r.canAutoCorrect && r.isCorrect === null);

    return (
      <div className="w-full px-2 py-3">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm text-gray-600 font-medium">Retour aux exercices</span>
        </div>

        {/* Already completed badge */}
        {alreadyCompleted && (
          <div className="mb-3 p-3 rounded-xl flex items-center gap-2 text-sm"
            style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" }}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Exercice déjà soumis — vos réponses sont enregistrées</span>
          </div>
        )}

        {/* Pending correction banner */}
        {hasPendingManual && (
          <div className="mb-3 p-3 rounded-xl flex items-center gap-2 text-sm"
            style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#c2410c" }}>
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>Certaines questions sont en attente de correction par votre professeur.</span>
          </div>
        )}

        {/* Score Card */}
        <div className={`rounded-2xl p-5 mb-4 text-center ${
          hasPendingManual ? "bg-amber-50 border border-amber-200"
          : percentage >= 70 ? "bg-green-50 border border-green-200"
          : percentage >= 40 ? "bg-yellow-50 border border-yellow-200"
          : "bg-red-50 border border-red-200"
        }`}>
          <Award className={`w-10 h-10 mx-auto mb-2 ${
            hasPendingManual ? "text-amber-500"
            : percentage >= 70 ? "text-green-500"
            : percentage >= 40 ? "text-yellow-500" : "text-red-500"
          }`} />
          <h2 className="text-2xl font-bold text-gray-900">{totalScore} / {maxScore}</h2>
          <p className="text-gray-500 text-sm mt-1">{percentage}%</p>
          {hasPendingManual && (
            <p className="text-xs text-amber-600 mt-2">
              Score partiel — {manualReview.length} question(s) en attente de correction
            </p>
          )}
        </div>

        {/* Results per question */}
        <div className="space-y-3">
          {results.map((result, idx) => {
            const isPending = !result.canAutoCorrect && result.isCorrect === null;
            const isGraded = !result.canAutoCorrect && result.isCorrect !== null;

            return (
              <div key={result.questionId} className={`rounded-xl border overflow-hidden ${
                result.isCorrect === true ? "border-green-200"
                : result.isCorrect === false ? "border-red-200"
                : isPending ? "border-amber-200" : "border-gray-200"
              }`}>
                {/* Question header */}
                <div className={`flex items-center gap-2 px-3 py-2 ${
                  result.isCorrect === true ? "bg-green-50"
                  : result.isCorrect === false ? "bg-red-50"
                  : isPending ? "bg-amber-50" : "bg-gray-50"
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    result.isCorrect === true ? "bg-green-500 text-white"
                    : result.isCorrect === false ? "bg-red-500 text-white"
                    : "bg-gray-300 text-gray-700"
                  }`}>{idx + 1}</div>
                  <p className="font-medium text-gray-900 text-sm flex-1">{result.question}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/70 text-gray-500 flex-shrink-0">
                    {result.points}/{result.maxPoints} pt{result.maxPoints > 1 ? "s" : ""}
                  </span>
                  {result.isCorrect === true && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  {result.isCorrect === false && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  {isPending && <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                </div>

                {/* Answer details */}
                <div className="px-3 py-2 space-y-1.5 bg-white">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-gray-500 w-28 flex-shrink-0 pt-0.5">Votre réponse</span>
                    <span className={`text-sm px-2 py-0.5 rounded flex-1 ${
                      result.isCorrect === true ? "bg-green-50 text-green-800"
                      : result.isCorrect === false ? "bg-red-50 text-red-800"
                      : "bg-gray-50 text-gray-800"
                    }`}>{result.studentAnswer || <span className="italic text-gray-400">Aucune réponse</span>}</span>
                  </div>

                  {/* Correct answer for auto-graded wrong answers */}
                  {result.canAutoCorrect && result.isCorrect === false && result.correctAnswer && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-green-700 w-28 flex-shrink-0 pt-0.5">Bonne réponse</span>
                      <span className="text-sm bg-green-50 text-green-800 px-2 py-0.5 rounded flex-1">{result.correctAnswer}</span>
                    </div>
                  )}

                  {/* Pending */}
                  {isPending && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                      <Clock className="w-3 h-3" /> En attente de correction par le professeur
                    </div>
                  )}

                  {/* Professor correction */}
                  {isGraded && (
                    <div className="p-2 rounded-lg space-y-1" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                      <p className="text-xs font-semibold text-purple-700">Correction du professeur</p>
                      {result.note && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Note :</span>
                          <span className="text-xs font-bold text-purple-700">{result.note}</span>
                        </div>
                      )}
                      {result.appreciation && (
                        <p className="text-xs text-gray-600 italic">"{result.appreciation}"</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 text-center">
          <button onClick={onComplete || onBack}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors text-sm">
            Terminer
          </button>
        </div>
      </div>
    );
  }

  // Exercise taking view
  return (
    <div className="w-full px-2 py-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{exercise?.nom}</h1>
          {exercise?.description && <p className="text-xs text-gray-500 truncate">{exercise.description}</p>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
          <span>{answeredCount}/{questions.length} répondu(s)</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Question Navigation - Mobile */}
      <div className="flex items-center justify-between mb-4 sm:hidden">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="p-2 rounded-lg bg-gray-100 disabled:opacity-40"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-gray-700">
          Question {currentQuestionIndex + 1} / {questions.length}
        </span>
        <button
          onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
          disabled={currentQuestionIndex === questions.length - 1}
          className="p-2 rounded-lg bg-gray-100 disabled:opacity-40"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Questions grid — 2 cols on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {questions.map((question, idx) => {
          const isCurrent = idx === currentQuestionIndex;
          const isAnswered = !!currentAnswers[question.id]?.value;

          return (
            <div
              key={question.id}
              className={`bg-white border rounded-xl p-3 transition-all ${isCurrent ? "block" : "hidden sm:block"} ${isAnswered ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200"}`}
            >
              {/* Question header */}
              <div className="flex items-start gap-2 mb-3">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isAnswered ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{question.intitule}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">{question.typeQuestion}</span>
                    <span className="text-xs text-gray-400">{question.points || 1} pt(s)</span>
                  </div>
                </div>
              </div>

              {/* Answer input based on type */}
              {question.typeQuestion === "QCM" && (
                <div className="space-y-1.5 ml-9">
                  {(question.choixReponses || [])
                    .sort((a, b) => (a.ordreAffichage || 0) - (b.ordreAffichage || 0))
                    .map((choice) => (
                      <label
                        key={choice.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${currentAnswers[question.id]?.value === choice.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"}`}
                      >
                        <input
                          type="radio"
                          name={`q-${question.id}`}
                          value={choice.id}
                          checked={currentAnswers[question.id]?.value === choice.id}
                          onChange={() => handleAnswerChange(question.id, choice.id, "QCM")}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm text-gray-700">{choice.texte}</span>
                      </label>
                    ))}
                </div>
              )}

              {question.typeQuestion === "VRAI_FAUX" && (
                <div className="flex gap-2 ml-9">
                  {["Vrai", "Faux"].map((option) => (
                    <label
                      key={option}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${currentAnswers[question.id]?.value === option ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        value={option}
                        checked={currentAnswers[question.id]?.value === option}
                        onChange={() => handleAnswerChange(question.id, option, "VRAI_FAUX")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-sm font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.typeQuestion === "REPONSE_COURTE" && (
                <div className="ml-9">
                  <input
                    type="text"
                    value={currentAnswers[question.id]?.value || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value, "REPONSE_COURTE")}
                    placeholder="Votre reponse..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              )}

              {(question.typeQuestion === "REPONSE_LONGUE" || question.typeQuestion === "DEVELOPPEMENT") && (
                <div className="ml-9">
                  <textarea
                    value={currentAnswers[question.id]?.value || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value, question.typeQuestion)}
                    placeholder="Redigez votre reponse..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                  />
                </div>
              )}

              {question.typeQuestion === "TROU" && (
                <div className="ml-9">
                  <input
                    type="text"
                    value={currentAnswers[question.id]?.value || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value, "TROU")}
                    placeholder="Completez le texte..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile navigation between questions */}
      <div className="flex items-center justify-between mt-4 sm:hidden">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 rounded-lg bg-gray-100 text-sm disabled:opacity-40"
        >
          Precedent
        </button>
        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            className="px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-medium"
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount < questions.length}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Envoi..." : "Soumettre"}
          </button>
        )}
      </div>

      {/* Desktop submit button */}
      <div className="hidden sm:flex justify-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting || answeredCount === 0}
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Soumission en cours...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Soumettre ({answeredCount}/{questions.length})
            </>
          )}
        </button>
      </div>

      {/* Question dots navigation */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestionIndex(idx)}
            className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${currentAnswers[q.id]?.value ? "bg-indigo-500 text-white" : idx === currentQuestionIndex ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500" : "bg-gray-100 text-gray-500"}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StudentExerciseView;
