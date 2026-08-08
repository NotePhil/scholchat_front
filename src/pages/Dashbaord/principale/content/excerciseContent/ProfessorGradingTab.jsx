import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  AlertCircle,
  User,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import {
  questionReponseService,
  repondreService,
  participationExerciseService,
} from "../../../../../services/exerciseService";

const ProfessorGradingTab = ({ exerciseId, exerciseProgrammerId }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [savingGrade, setSavingGrade] = useState(null);
  const [gradeInputs, setGradeInputs] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (exerciseId) loadData();
  }, [exerciseId, exerciseProgrammerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [questionsData, answersData] = await Promise.all([
        questionReponseService.getQuestionsByExercise(exerciseId),
        repondreService.getReponsesByExercise(exerciseId),
      ]);

      let participationsData = [];
      if (exerciseProgrammerId) {
        try {
          participationsData = await participationExerciseService.getParticipationsByExercise(exerciseProgrammerId);
        } catch (e) {
          console.warn("Could not load participations:", e);
        }
      }

      setQuestions(questionsData || []);
      setAnswers(answersData || []);
      setParticipations(participationsData || []);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des donnees");
    } finally {
      setLoading(false);
    }
  };

  // Group answers by student
  const studentMap = {};
  answers.forEach((answer) => {
    const uid = answer.utilisateurId;
    if (!studentMap[uid]) {
      studentMap[uid] = {
        id: uid,
        nom: answer.utilisateurNom || "",
        prenom: answer.utilisateurPrenom || "",
        email: answer.utilisateurEmail || "",
        answers: [],
      };
    }
    studentMap[uid].answers.push(answer);
  });

  // Merge participation data
  participations.forEach((p) => {
    if (studentMap[p.utilisateurId]) {
      studentMap[p.utilisateurId].participation = p;
    } else {
      studentMap[p.utilisateurId] = {
        id: p.utilisateurId,
        nom: p.utilisateurNom || "",
        prenom: p.utilisateurPrenom || "",
        answers: [],
        participation: p,
      };
    }
  });

  const students = Object.values(studentMap);

  // Stats
  const totalStudents = students.length;
  const studentsWithAnswers = students.filter((s) => s.answers.length > 0).length;
  const totalQuestions = questions.length;
  const maxPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

  const getStudentScore = (student) => {
    let score = 0;
    let graded = 0;
    student.answers.forEach((a) => {
      if (a.estCorrecte === true) {
        const question = questions.find((q) => q.id === a.questionId);
        score += question?.points || 1;
        graded++;
      } else if (a.estCorrecte === false) {
        graded++;
      }
    });
    return { score, graded, total: student.answers.length };
  };

  const averageScore = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + getStudentScore(s).score, 0) / students.length * 10) / 10
    : 0;

  const handleGradeChange = (studentId, questionId, field, value) => {
    setGradeInputs((prev) => ({
      ...prev,
      [`${studentId}-${questionId}`]: {
        ...prev[`${studentId}-${questionId}`],
        [field]: value,
      },
    }));
  };

  const handleSaveGrade = async (studentId, questionId) => {
    const key = `${studentId}-${questionId}`;
    const input = gradeInputs[key];
    if (!input) return;

    setSavingGrade(key);
    try {
      await repondreService.updateReponse({
        utilisateurId: studentId,
        questionId: questionId,
        estCorrecte: input.estCorrecte,
        note: input.note,
        appreciation: input.appreciation,
      });

      setSuccessMessage("Note sauvegardee");
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadData(); // Refresh
    } catch (err) {
      setError("Erreur lors de la sauvegarde: " + err.message);
    } finally {
      setSavingGrade(null);
    }
  };

  const handleSaveOverallGrade = async (student) => {
    if (!exerciseProgrammerId) return;
    const { score } = getStudentScore(student);
    const key = `overall-${student.id}`;
    const input = gradeInputs[key] || {};

    setSavingGrade(key);
    try {
      await participationExerciseService.updateParticipation({
        utilisateurId: student.id,
        exerciseProgrammerId,
        note: input.note || `${score}/${maxPoints}`,
        appreciation: input.appreciation || "",
      });

      setSuccessMessage("Note globale sauvegardee");
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadData();
    } catch (err) {
      setError("Erreur: " + err.message);
    } finally {
      setSavingGrade(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600 text-sm">Chargement des resultats...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Aucune soumission pour le moment</p>
        <p className="text-gray-400 text-sm">Les resultats apparaitront ici apres que les eleves aient soumis leurs reponses.</p>
      </div>
    );
  }

  return (
    <div>
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {successMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="hidden md:grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-blue-700">{totalStudents}</p>
          <p className="text-xs text-blue-600">Participants</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-green-700">{studentsWithAnswers}</p>
          <p className="text-xs text-green-600">Ont repondu</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <BarChart3 className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-purple-700">{averageScore}</p>
          <p className="text-xs text-purple-600">Moy. / {maxPoints}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <Award className="w-5 h-5 text-amber-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-amber-700">{totalQuestions}</p>
          <p className="text-xs text-amber-600">Questions</p>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {students.map((student) => {
          const { score, graded } = getStudentScore(student);
          const isExpanded = expandedStudent === student.id;
          const percentage = maxPoints > 0 ? Math.round((score / maxPoints) * 100) : 0;

          return (
            <div key={student.id} className="border rounded-xl overflow-hidden bg-white">
              {/* Student Header */}
              <button
                onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {student.prenom} {student.nom}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${percentage >= 70 ? "bg-green-100 text-green-700" : percentage >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {score}/{maxPoints}
                  </div>
                  <span className="text-xs text-gray-400">{student.answers.length}/{totalQuestions}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Expanded - Student answers detail */}
              {isExpanded && (
                <div className="border-t bg-gray-50 p-4">
                  {/* Overall grade input */}
                  {exerciseProgrammerId && (
                    <div className="mb-4 p-3 bg-white border rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Note globale</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="text"
                          placeholder={`${score}/${maxPoints}`}
                          value={gradeInputs[`overall-${student.id}`]?.note || ""}
                          onChange={(e) => handleGradeChange(student.id, "overall", "note", e.target.value)}
                          className="px-3 py-1.5 border rounded-lg text-sm w-24"
                        />
                        <input
                          type="text"
                          placeholder="Appreciation..."
                          value={gradeInputs[`overall-${student.id}`]?.appreciation || ""}
                          onChange={(e) => handleGradeChange(student.id, "overall", "appreciation", e.target.value)}
                          className="px-3 py-1.5 border rounded-lg text-sm flex-1 min-w-[150px]"
                        />
                        <button
                          onClick={() => handleSaveOverallGrade(student)}
                          disabled={savingGrade === `overall-${student.id}`}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {savingGrade === `overall-${student.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Sauver
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Per-question answers */}
                  <div className="space-y-3">
                    {questions.map((question, qIdx) => {
                      const answer = student.answers.find((a) => a.questionId === question.id);
                      const gradeKey = `${student.id}-${question.id}`;
                      const needsManualGrade = answer && answer.estCorrecte === null;
                      const correctChoice = (question.choixReponses || []).find((c) => c.estCorrect);

                      return (
                        <div key={question.id} className={`p-3 rounded-lg border ${answer?.estCorrecte === true ? "bg-green-50 border-green-200" : answer?.estCorrecte === false ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
                          <div className="flex items-start gap-2 mb-2">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{qIdx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{question.intitule}</p>
                              <span className="text-xs text-gray-500">{question.typeQuestion} - {question.points || 1} pt(s)</span>
                            </div>
                            {answer?.estCorrecte === true && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                            {answer?.estCorrecte === false && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                            {needsManualGrade && <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                          </div>

                          {answer ? (
                            <div className="ml-8 space-y-2">
                              <p className="text-sm"><span className="font-medium text-gray-600">Reponse :</span> <span className="text-gray-900">{answer.reponseUtilisateur}</span></p>
                              {correctChoice && (
                                <p className="text-sm text-green-700"><span className="font-medium">Bonne reponse :</span> {correctChoice.texte}</p>
                              )}
                              {!correctChoice && question.reponse && (
                                <p className="text-sm text-green-700"><span className="font-medium">Reponse attendue :</span> {question.reponse}</p>
                              )}

                              {/* Manual grading for open-ended */}
                              {needsManualGrade && (
                                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                  <p className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" /> Correction manuelle requise
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <select
                                      value={gradeInputs[gradeKey]?.estCorrecte ?? ""}
                                      onChange={(e) => handleGradeChange(student.id, question.id, "estCorrecte", e.target.value === "true" ? true : e.target.value === "false" ? false : null)}
                                      className="px-2 py-1 border rounded text-xs"
                                    >
                                      <option value="">--</option>
                                      <option value="true">Correct</option>
                                      <option value="false">Incorrect</option>
                                    </select>
                                    <input
                                      type="text"
                                      placeholder="Note"
                                      value={gradeInputs[gradeKey]?.note || ""}
                                      onChange={(e) => handleGradeChange(student.id, question.id, "note", e.target.value)}
                                      className="px-2 py-1 border rounded text-xs w-16"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Commentaire..."
                                      value={gradeInputs[gradeKey]?.appreciation || ""}
                                      onChange={(e) => handleGradeChange(student.id, question.id, "appreciation", e.target.value)}
                                      className="px-2 py-1 border rounded text-xs flex-1 min-w-[100px]"
                                    />
                                    <button
                                      onClick={() => handleSaveGrade(student.id, question.id)}
                                      disabled={savingGrade === gradeKey}
                                      className="px-2 py-1 bg-indigo-600 text-white rounded text-xs flex items-center gap-1 hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                      {savingGrade === gradeKey ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {answer.note && (
                                <p className="text-xs text-gray-500">Note: {answer.note}</p>
                              )}
                              {answer.appreciation && (
                                <p className="text-xs text-gray-500 italic">"{answer.appreciation}"</p>
                              )}
                            </div>
                          ) : (
                            <p className="ml-8 text-sm text-gray-400 italic">Pas de reponse</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfessorGradingTab;
