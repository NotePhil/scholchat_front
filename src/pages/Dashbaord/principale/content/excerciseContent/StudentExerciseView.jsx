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
            // The programmer response has the exercise info
            if (progData.redacteurId) {
              // It's already an exercise response from class fetch
              exerciseData = progData;
              actualExerciseId = progData.id;
            }
            // Try to get questions from the source exercise
            if (progData.questions && progData.questions.length > 0) {
              questionsData = progData.questions;
            } else {
              questionsData = await questionReponseService.getQuestionsByExercise(actualExerciseId);
            }
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
          await participationExerciseService.updateParticipation({
            utilisateurId: userId,
            exerciseProgrammerId,
            dateFin: new Date().toISOString(),
            note: `${score}/${max}`,
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
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
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

    return (
      <div className="p-2 sm:p-6 max-w-3xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour aux exercices
        </button>

        {/* Already completed badge */}
        {alreadyCompleted && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-700 text-sm">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Exercice deja soumis - Vos reponses sont enregistrees</span>
          </div>
        )}

        {/* Score Card */}
        <div className={`rounded-2xl p-6 sm:p-8 mb-6 text-center ${percentage >= 70 ? "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200" : percentage >= 40 ? "bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200" : "bg-gradient-to-br from-red-50 to-rose-50 border border-red-200"}`}>
          <div className="mb-3">
            <Award className={`w-12 h-12 mx-auto ${percentage >= 70 ? "text-green-500" : percentage >= 40 ? "text-yellow-500" : "text-red-500"}`} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            {totalScore} / {maxScore}
          </h2>
          <p className="text-lg text-gray-600">{percentage}%</p>
          <p className="text-sm text-gray-500 mt-2">
            {percentage >= 70 ? "Excellent travail !" : percentage >= 40 ? "Peut mieux faire" : "A revoir"}
          </p>
          {manualReview.length > 0 && (
            <p className="text-xs text-amber-600 mt-3 bg-amber-50 rounded-lg px-3 py-1.5 inline-block">
              {manualReview.length} question(s) en attente de correction manuelle
            </p>
          )}
        </div>

        {/* Results per question */}
        <div className="space-y-3">
          {results.map((result, idx) => (
            <div key={result.questionId} className={`rounded-xl border p-4 ${result.isCorrect === true ? "bg-green-50 border-green-200" : result.isCorrect === false ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${result.isCorrect === true ? "bg-green-500 text-white" : result.isCorrect === false ? "bg-red-500 text-white" : "bg-gray-400 text-white"}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm mb-2">{result.question}</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Votre reponse :</span> {result.studentAnswer}
                    </p>
                    {result.canAutoCorrect && !result.isCorrect && (
                      <p className="text-green-700">
                        <span className="font-medium">Bonne reponse :</span> {result.correctAnswer}
                      </p>
                    )}
                    {!result.canAutoCorrect && result.isCorrect === null && (
                      <p className="text-amber-600 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> En attente de correction par le professeur
                      </p>
                    )}
                    {!result.canAutoCorrect && result.isCorrect !== null && (
                      <p className={`text-xs flex items-center gap-1 ${result.isCorrect ? "text-green-600" : "text-red-600"}`}>
                        {result.isCorrect ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Corrige par le professeur
                      </p>
                    )}
                    {result.note && (
                      <p className="text-xs text-indigo-600 font-medium">Note: {result.note}</p>
                    )}
                    {result.appreciation && (
                      <p className="text-xs text-gray-600 italic bg-gray-50 rounded px-2 py-1 mt-1">"{result.appreciation}"</p>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {result.isCorrect === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {result.isCorrect === false && <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="text-xs text-gray-500">{result.points}/{result.maxPoints} pts</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button onClick={onComplete || onBack} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
            Terminer
          </button>
        </div>
      </div>
    );
  }

  // Exercise taking view
  return (
    <div className="p-2 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{exercise?.nom}</h1>
          <p className="text-sm text-gray-500">{exercise?.description}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>{answeredCount}/{questions.length} repondu(s)</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
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

      {/* Questions - Mobile: one at a time, Desktop: all */}
      <div className="space-y-4">
        {questions.map((question, idx) => {
          const isCurrent = idx === currentQuestionIndex;
          const isAnswered = !!currentAnswers[question.id]?.value;

          return (
            <div
              key={question.id}
              className={`bg-white border rounded-xl p-4 sm:p-5 transition-all ${isCurrent ? "block" : "hidden sm:block"} ${isAnswered ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200"}`}
            >
              {/* Question header */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isAnswered ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">{question.intitule}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{question.typeQuestion}</span>
                    <span className="text-xs text-gray-500">{question.points || 1} pt(s)</span>
                  </div>
                </div>
              </div>

              {/* Answer input based on type */}
              {question.typeQuestion === "QCM" && (
                <div className="space-y-2 ml-11">
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
                <div className="flex gap-3 ml-11">
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
                <div className="ml-11">
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
                <div className="ml-11">
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
                <div className="ml-11">
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
