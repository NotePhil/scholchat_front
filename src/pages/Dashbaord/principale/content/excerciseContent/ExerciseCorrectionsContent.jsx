import React, { useState, useEffect, useCallback } from "react";
import { Select, Spin, Button, Input, message, Badge } from "antd";
import {
  ClipboardCheck, User, CheckCircle, Clock, ChevronDown,
  ChevronUp, Save, AlertCircle, BookOpen, FileText,
  RefreshCw, Award, Users,
} from "lucide-react";
import {
  exerciseProgrammerService,
  questionReponseService,
  repondreService,
  participationExerciseService,
} from "../../../../../services/exerciseService";
import { classService } from "../../../../../services/ClassService";
import { userService } from "../../../../../services/userService";

const getUserId = () =>
  sessionStorage.getItem("userId") || localStorage.getItem("userId");

const ETAT_COLORS = {
  EN_COURS:              { color: "#d97706", bg: "#fffbeb", label: "En cours" },
  SOUMIS:                { color: "#2563eb", bg: "#eff6ff", label: "Soumis" },
  EN_ATTENTE_CORRECTION: { color: "#c2410c", bg: "#fff7ed", label: "À corriger" },
  CORRIGE:               { color: "#7c3aed", bg: "#f5f3ff", label: "Corrigé" },
  VALIDE:                { color: "#16a34a", bg: "#f0fdf4", label: "Validé" },
};

const EtatBadge = ({ etat }) => {
  const c = ETAT_COLORS[etat] || { color: "#6b7280", bg: "#f9fafb", label: etat };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}30` }}>
      {c.label}
    </span>
  );
};

// ── Single programmation correction view ──────────────────────────────────────
const ProgrammationCorrections = ({ prog }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [gradeInputs, setGradeInputs] = useState({});
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(new Set());
  const [studentPage, setStudentPage] = useState(1);
  const [questionPages, setQuestionPages] = useState({});
  const STUDENT_PAGE_SIZE = 5;
  const QUESTION_PAGE_SIZE = 3;

  useEffect(() => { loadData(); }, [prog.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch fresh programmation detail (contains full questions via summary + exerciseId via redacteurId)
      const [freshProg, freshParticipations] = await Promise.all([
        exerciseProgrammerService.getExerciseProgrammeById(prog.id).catch(() => prog),
        participationExerciseService.getParticipationsByExercise(prog.id).catch(() => prog.participations || []),
      ]);

      // 2. Questions — fetch full questions using exerciseId from fresh prog
      //    ExerciseProgrammer model has exerciseId field
      const exerciseId = freshProg.exerciseId;
      let resolvedQuestions = [];
      if (exerciseId) {
        resolvedQuestions = await questionReponseService
          .getQuestionsByExercise(exerciseId).catch(() => freshProg.questions || []);
      } else {
        resolvedQuestions = freshProg.questions || [];
      }

      // 3. Answers — fetch per participant
      const allAnswers = [];
      const participantIds = [...new Set(freshParticipations.map(p => p.utilisateurId))];
      if (participantIds.length > 0) {
        const qIds = new Set(resolvedQuestions.map(q => q.id));
        await Promise.all(
          participantIds.map(async (uid) => {
            const userAnswers = await repondreService
              .getReponsesByUtilisateur(uid).catch(() => []);
            userAnswers
              .filter(a => qIds.size === 0 || qIds.has(a.questionId))
              .forEach(a => allAnswers.push(a));
          })
        );
      }

      setQuestions(resolvedQuestions);
      setAnswers(allAnswers);
      setParticipations(freshParticipations);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Build student map
  const studentMap = {};
  answers.forEach(a => {
    if (!studentMap[a.utilisateurId]) {
      studentMap[a.utilisateurId] = { id: a.utilisateurId, nom: a.utilisateurNom || "", prenom: a.utilisateurPrenom || "", answers: [] };
    }
    studentMap[a.utilisateurId].answers.push(a);
  });
  participations.forEach(p => {
    if (!studentMap[p.utilisateurId]) {
      studentMap[p.utilisateurId] = { id: p.utilisateurId, nom: p.utilisateurNom || "", prenom: p.utilisateurPrenom || "", answers: [] };
    }
    studentMap[p.utilisateurId].participation = p;
  });
  const students = Object.values(studentMap);
  const maxPoints = questions.reduce((s, q) => s + (q.points || 1), 0);

  const getScore = (student) =>
    student.answers.reduce((s, a) => {
      if (a.estCorrecte === true) { const q = questions.find(q => q.id === a.questionId); return s + (q?.points || 1); }
      return s;
    }, 0);

  const setInput = (key, field, value) =>
    setGradeInputs(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const saveGrade = async (studentId, questionId) => {
    const key = `${studentId}-${questionId}`;
    const input = gradeInputs[key];
    if (!input) return;
    setSaving(key);
    try {
      await repondreService.updateReponse({ utilisateurId: studentId, questionId, ...input });
      setSaved(prev => new Set([...prev, key]));
      await loadData();
    } catch { message.error("Erreur lors de la sauvegarde"); }
    finally { setSaving(null); }
  };

  const saveOverall = async (student) => {
    const key = `overall-${student.id}`;
    const input = gradeInputs[key] || {};
    setSaving(key);
    try {
      await participationExerciseService.updateParticipation({
        utilisateurId: student.id,
        exerciseProgrammerId: prog.id,
        note: input.note || `${getScore(student)}/${maxPoints}`,
        appreciation: input.appreciation || "",
        etatSoumission: "CORRIGE",
      });
      setSaved(prev => new Set([...prev, key]));
      message.success("Note globale sauvegardée");
      await loadData();
    } catch { message.error("Erreur lors de la sauvegarde"); }
    finally { setSaving(null); }
  };

  if (loading) return <div className="flex justify-center py-8"><Spin /></div>;

  if (students.length === 0) {
    return (
      <div className="text-center py-10">
        <Users size={36} className="text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Aucune soumission pour cette programmation</p>
      </div>
    );
  }

  const pending = students.filter(s => s.participation?.etatSoumission === "EN_ATTENTE_CORRECTION").length;
  const totalStudentPages = Math.ceil(students.length / STUDENT_PAGE_SIZE);
  const paginatedStudents = students.slice((studentPage - 1) * STUDENT_PAGE_SIZE, studentPage * STUDENT_PAGE_SIZE);

  const getQuestionPage = (studentId) => questionPages[studentId] || 1;
  const setQuestionPage = (studentId, page) =>
    setQuestionPages(prev => ({ ...prev, [studentId]: page }));
  const totalQuestionPages = (studentId) => Math.ceil(questions.length / QUESTION_PAGE_SIZE);
  const paginatedQuestions = (studentId) => {
    const page = getQuestionPage(studentId);
    return questions.slice((page - 1) * QUESTION_PAGE_SIZE, page * QUESTION_PAGE_SIZE);
  };

  return (
    <div>
      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Participants", value: students.length, color: "#2563eb", bg: "#eff6ff" },
          { label: "À corriger", value: pending, color: "#c2410c", bg: "#fff7ed" },
          { label: "Corrigés", value: students.filter(s => s.participation?.etatSoumission === "CORRIGE").length, color: "#7c3aed", bg: "#f5f3ff" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg, border: `1px solid ${color}20` }}>
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Students */}
      <div className="space-y-2">
        {paginatedStudents.map(student => {
          const score = getScore(student);
          const pct = maxPoints > 0 ? Math.round((score / maxPoints) * 100) : 0;
          const isExpanded = expandedStudent === student.id;
          const etat = student.participation?.etatSoumission;

          return (
            <div key={student.id} className="rounded-xl border overflow-hidden bg-white"
              style={{ borderColor: "#e8edf5" }}>
              <button
                onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#eff6ff" }}>
                    <User size={16} style={{ color: "#2563eb" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {student.prenom} {student.nom}
                    </p>
                    {etat && <EtatBadge etat={etat} />}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${pct >= 70 ? "bg-green-100 text-green-700" : pct >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {score}/{maxPoints}
                  </span>
                  <span className="text-xs text-gray-400">{student.answers.length}/{questions.length}</span>
                  {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t bg-gray-50 p-4 space-y-3">
                  {/* Overall grade */}
                  <div className="p-3 bg-white rounded-xl border" style={{ borderColor: "#e8edf5" }}>
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Award size={14} className="text-amber-500" /> Note globale
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input size="small" placeholder={`${score}/${maxPoints}`}
                        value={gradeInputs[`overall-${student.id}`]?.note || ""}
                        onChange={e => setInput(`overall-${student.id}`, "note", e.target.value)}
                        style={{ width: 90 }} />
                      <Input size="small" placeholder="Appréciation générale..."
                        value={gradeInputs[`overall-${student.id}`]?.appreciation || ""}
                        onChange={e => setInput(`overall-${student.id}`, "appreciation", e.target.value)}
                        style={{ flex: 1, minWidth: 160 }} />
                      <Button size="small" type="primary" icon={<Save size={12} />}
                        loading={saving === `overall-${student.id}`}
                        onClick={() => saveOverall(student)}>
                        {saved.has(`overall-${student.id}`) ? "Sauvegardé ✓" : "Sauvegarder"}
                      </Button>
                    </div>
                    {student.participation?.note && (
                      <p className="text-xs text-gray-400 mt-1">
                        Actuel : {student.participation.note}
                        {student.participation.appreciation && ` — "${student.participation.appreciation}"`}
                      </p>
                    )}
                  </div>

                  {/* Per-question with pagination */}
                  {paginatedQuestions(student.id).map((q, idx) => {
                    const globalIdx = (getQuestionPage(student.id) - 1) * QUESTION_PAGE_SIZE + idx;
                    const answer = student.answers.find(a => a.questionId === q.id);
                    const gradeKey = `${student.id}-${q.id}`;
                    const isAutoType = ["QCM", "VRAI_FAUX"].includes(q.typeQuestion);
                    const correctChoices = (q.choixReponses || []).filter(c => c.estCorrect);
                    const expectedAnswer = correctChoices.length > 0
                      ? correctChoices.map(c => c.texte).join(" / ")
                      : q.reponse || null;
                    const needsGrading = !isAutoType && answer && answer.estCorrecte === null;
                    const alreadyGraded = answer && answer.estCorrecte !== null;

                    let borderColor = "#e5e7eb";
                    if (answer?.estCorrecte === true) borderColor = "#86efac";
                    if (answer?.estCorrecte === false) borderColor = "#fca5a5";
                    if (needsGrading) borderColor = "#fcd34d";

                    return (
                      <div key={q.id} className="rounded-xl border bg-white overflow-hidden"
                        style={{ borderColor }}>
                        {/* Question header */}
                        <div className="flex items-center gap-2 px-3 py-2 border-b"
                          style={{ borderColor, background: needsGrading ? "#fffbeb" : alreadyGraded && answer.estCorrecte ? "#f0fdf4" : alreadyGraded ? "#fef2f2" : "#f9fafb" }}>
                          <span className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0">{globalIdx + 1}</span>
                          <p className="text-sm font-semibold text-gray-900 flex-1">{q.intitule}</p>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 flex-shrink-0">
                            {q.points || 1} pt{(q.points || 1) > 1 ? "s" : ""}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ background: "#e0e7ff", color: "#4338ca" }}>
                            {q.typeQuestion}
                          </span>
                          {answer?.estCorrecte === true && <CheckCircle size={15} className="text-green-500 flex-shrink-0" />}
                          {answer?.estCorrecte === false && <AlertCircle size={15} className="text-red-500 flex-shrink-0" />}
                          {needsGrading && <Clock size={15} className="text-amber-500 flex-shrink-0" />}
                        </div>

                        <div className="px-3 py-2 space-y-2">
                          {/* Expected answer — always shown */}
                          {expectedAnswer ? (
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-semibold text-green-700 w-28 flex-shrink-0 pt-0.5">Réponse attendue</span>
                              <span className="text-sm text-green-800 bg-green-50 border border-green-200 px-2 py-1 rounded flex-1">{expectedAnswer}</span>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-semibold text-gray-400 w-28 flex-shrink-0 pt-0.5">Réponse attendue</span>
                              <span className="text-xs text-gray-400 italic">Non définie</span>
                            </div>
                          )}

                          {/* Student answer */}
                          {answer ? (
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-semibold text-gray-500 w-28 flex-shrink-0 pt-0.5">Réponse élève</span>
                              <span className={`text-sm px-2 py-0.5 rounded flex-1 ${
                                answer.estCorrecte === true ? "bg-green-50 text-green-800" :
                                answer.estCorrecte === false ? "bg-red-50 text-red-800" :
                                "bg-gray-50 text-gray-800"
                              }`}>{answer.reponseUtilisateur}</span>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Aucune réponse soumise</p>
                          )}

                          {/* Existing grade/comment */}
                          {answer?.note && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-500 w-28 flex-shrink-0">Note actuelle</span>
                              <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded">{answer.note}</span>
                              {answer.appreciation && <span className="text-xs text-gray-500 italic">"{answer.appreciation}"</span>}
                            </div>
                          )}

                          {/* Manual grading panel — open questions only */}
                          {!isAutoType && answer && (
                            <div className="pt-1 border-t border-dashed border-gray-200">
                              <p className="text-xs font-semibold text-orange-700 mb-1.5">
                                {needsGrading ? "⚠ Correction manuelle requise" : "✎ Modifier la correction"}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Correct / Incorrect buttons */}
                                <button
                                  onClick={() => setInput(gradeKey, "estCorrecte", true)}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                                    gradeInputs[gradeKey]?.estCorrecte === true
                                      ? "bg-green-500 text-white border-green-500"
                                      : "bg-white text-green-700 border-green-300 hover:bg-green-50"
                                  }`}>
                                  ✓ Correct
                                </button>
                                <button
                                  onClick={() => setInput(gradeKey, "estCorrecte", false)}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                                    gradeInputs[gradeKey]?.estCorrecte === false
                                      ? "bg-red-500 text-white border-red-500"
                                      : "bg-white text-red-700 border-red-300 hover:bg-red-50"
                                  }`}>
                                  ✕ Incorrect
                                </button>
                                <Input size="small" placeholder={`Note (/${q.points || 1})`}
                                  value={gradeInputs[gradeKey]?.note || ""}
                                  onChange={e => setInput(gradeKey, "note", e.target.value)}
                                  style={{ width: 90 }} />
                                <Input size="small" placeholder="Commentaire..."
                                  value={gradeInputs[gradeKey]?.appreciation || ""}
                                  onChange={e => setInput(gradeKey, "appreciation", e.target.value)}
                                  style={{ flex: 1, minWidth: 120 }} />
                                <Button size="small" type="primary"
                                  icon={<Save size={12} />}
                                  loading={saving === gradeKey}
                                  disabled={gradeInputs[gradeKey]?.estCorrecte === undefined && !gradeInputs[gradeKey]?.note}
                                  onClick={() => saveGrade(student.id, q.id)}>
                                  {saved.has(gradeKey) ? "Sauvegardé ✓" : "Sauver"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* Question pagination */}
                  {totalQuestionPages(student.id) > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setQuestionPage(student.id, Math.max(1, getQuestionPage(student.id) - 1))}
                        disabled={getQuestionPage(student.id) === 1}
                        className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                      >
                        ‹ Préc.
                      </button>
                      <span className="text-xs text-gray-500">
                        Q {(getQuestionPage(student.id) - 1) * QUESTION_PAGE_SIZE + 1}–{Math.min(getQuestionPage(student.id) * QUESTION_PAGE_SIZE, questions.length)} / {questions.length}
                      </span>
                      <button
                        onClick={() => setQuestionPage(student.id, Math.min(totalQuestionPages(student.id), getQuestionPage(student.id) + 1))}
                        disabled={getQuestionPage(student.id) === totalQuestionPages(student.id)}
                        className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                      >
                        Suiv. ›
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Student pagination */}
      {totalStudentPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => { setStudentPage(p => Math.max(1, p - 1)); setExpandedStudent(null); }}
            disabled={studentPage === 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            ‹ Précédent
          </button>
          <span className="text-xs text-gray-500">
            Page {studentPage} / {totalStudentPages} · {students.length} élève{students.length > 1 ? "s" : ""}
          </span>
          <button
            onClick={() => { setStudentPage(p => Math.min(totalStudentPages, p + 1)); setExpandedStudent(null); }}
            disabled={studentPage === totalStudentPages}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            Suivant ›
          </button>
        </div>
      )}
    </div>
  );
};

const PROG_PAGE_SIZE = 6;

const ProgList = ({ filtered, selectedProgId, setSelectedProgId, filterType, setFilterType, onRefresh, fmtDate }) => {
  const [page, setPage] = useState(1);
  const total = filtered.length;
  const totalPages = Math.ceil(total / PROG_PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PROG_PAGE_SIZE, page * PROG_PAGE_SIZE);

  // Reset to page 1 when filter changes
  React.useEffect(() => { setPage(1); }, [filterType]);

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <span className="font-semibold text-gray-800 text-sm">Programmations</span>
        <button onClick={onRefresh} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
          <RefreshCw size={13} />
        </button>
      </div>
      <div className="p-2 border-b border-gray-100">
        <Select value={filterType} onChange={setFilterType} size="small" style={{ width: "100%" }}>
          <Select.Option value="all">Tous les types</Select.Option>
          <Select.Option value="DEVOIR">Devoirs</Select.Option>
          <Select.Option value="EXERCICE">Exercices libres</Select.Option>
        </Select>
      </div>
      <div className="divide-y divide-gray-50">
        {paginated.map(prog => (
          <button key={prog.id}
            onClick={() => setSelectedProgId(prog.id)}
            className={`w-full text-left px-3 py-2.5 transition-colors ${
              selectedProgId === prog.id
                ? "bg-blue-50 border-l-2 border-blue-600"
                : "hover:bg-gray-50 border-l-2 border-transparent"
            }`}>
            <div className="flex items-center gap-1.5 mb-0.5">
              {prog.typeAssignation === "DEVOIR"
                ? <FileText size={12} className="text-purple-600 flex-shrink-0" />
                : <BookOpen size={12} className="text-blue-600 flex-shrink-0" />}
              <span className="text-sm font-medium text-gray-800 truncate">{prog.nom || "Exercice"}</span>
              {!prog.isOwn && (
                <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                  Autre prof.
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 ml-4">{fmtDate(prog.dateExoPrevue)}</div>
            {prog.classesDiffusees?.length > 0 && (
              <div className="text-xs text-gray-400 ml-4 truncate">
                {prog.classesDiffusees.map(c => c.nom).join(", ")}
              </div>
            )}
          </button>
        ))}
        {paginated.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-xs">Aucune programmation</div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors"
          >
            ‹ Préc.
          </button>
          <span className="text-xs text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors"
          >
            Suiv. ›
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const ExerciseCorrectionsContent = () => {
  const [programmations, setProgrammations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgId, setSelectedProgId] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [professorName, setProfessorName] = useState(null);

  const userId = getUserId();

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Fetch all accessible classes (publication rights + acceder)
      const allClasses = await classService.obtenirClassesUtilisateur(userId);
      const classIdsToFetch = (allClasses || []).map(c => c.id);

      // Fetch own programmations + all accessible class programmations in parallel
      const [ownResult, ...classResults] = await Promise.allSettled([
        exerciseProgrammerService.getExercisesProgrammesParProfesseur(userId),
        ...classIdsToFetch.map(cId =>
          exerciseProgrammerService.getExercisesProgrammesParClasse(cId)
        ),
      ]);

      const ownItems = ownResult.status === "fulfilled" ? (ownResult.value || []) : [];
      const classItems = classResults
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value || []);

      // Merge by programmer record ID — class items first
      const merged = new Map();
      [...classItems, ...ownItems].forEach(p => {
        if (p?.id) merged.set(String(p.id), {
          ...p,
          isOwn: String(p.programmeParId) === String(userId),
        });
      });

      const sorted = Array.from(merged.values())
        .sort((a, b) => new Date(b.dateExoPrevue) - new Date(a.dateExoPrevue));

      // Filter: only keep programmations that have at least one submission
      const withSubmissions = await Promise.all(
        sorted.map(async (prog) => {
          try {
            const participations = await participationExerciseService.getParticipationsByExercise(prog.id);
            return (participations && participations.length > 0) ? prog : null;
          } catch {
            return null;
          }
        })
      );
      const filtered = withSubmissions.filter(Boolean);

      setProgrammations(filtered);
      if (filtered.length > 0 && !selectedProgId) setSelectedProgId(filtered[0].id);
    } catch {
      message.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Resolve professor name when a non-own programmation is selected
  const selectedProg = programmations.find(p => p.id === selectedProgId);
  useEffect(() => {
    if (!selectedProg || selectedProg.isOwn || !selectedProg.programmeParId) {
      setProfessorName(null);
      return;
    }
    userService.getUserById(selectedProg.programmeParId)
      .then(user => {
        if (user) setProfessorName(`${user.prenom || ""} ${user.nom || ""}`.trim() || user.email || null);
        else setProfessorName(null);
      })
      .catch(() => setProfessorName(null));
  }, [selectedProg?.id, selectedProg?.isOwn]);

  const filtered = programmations.filter(p => {
    if (filterType === "DEVOIR") return p.typeAssignation === "DEVOIR";
    if (filterType === "EXERCICE") return p.typeAssignation === "EXERCICE";
    return true;
  });

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chargement des corrections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 py-3">

      {/* Header */}
      <div className="bg-white rounded-xl shadow overflow-hidden mb-3">
        <div className="relative bg-gradient-to-r from-purple-600 to-indigo-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          <div className="relative flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <ClipboardCheck size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white leading-tight truncate">Corrections des Exercices</h1>
              <p className="text-purple-100 text-xs">Corrigez les soumissions de vos élèves</p>
            </div>
          </div>
          <div className="relative flex items-center gap-4 sm:gap-5 flex-shrink-0">
            {[
              { label: "Total", value: programmations.length, color: "#c4b5fd" },
              { label: "Devoirs", value: programmations.filter(p => p.typeAssignation === "DEVOIR").length, color: "#fca5a5" },
              { label: "Libres", value: programmations.filter(p => p.typeAssignation !== "DEVOIR").length, color: "#93c5fd" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className="text-lg font-bold" style={{ color }}>{value}</div>
                <div className="text-xs text-purple-200">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {programmations.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <ClipboardCheck size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">Aucune programmation</h3>
          <p className="text-gray-400 text-sm">Programmez d'abord des exercices pour voir les corrections ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">

          {/* Left: programmation list */}
          <div className="lg:col-span-1">
            <ProgList
              filtered={filtered}
              selectedProgId={selectedProgId}
              setSelectedProgId={setSelectedProgId}
              filterType={filterType}
              setFilterType={setFilterType}
              onRefresh={load}
              fmtDate={fmtDate}
            />
          </div>

          {/* Right: corrections panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <ClipboardCheck size={16} className="text-purple-600" />
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-800 text-sm truncate">
                    {selectedProg?.nom || "Sélectionnez une programmation"}
                  </h2>
                  {selectedProg && (
                    <p className="text-xs text-gray-400">
                      {selectedProg.typeAssignation === "DEVOIR" ? "Devoir" : "Exercice libre"}
                      {selectedProg.classesDiffusees?.length > 0 && ` · ${selectedProg.classesDiffusees.map(c => c.nom).join(", ")}`}
                    </p>
                  )}
                </div>
              </div>
              {/* "Programmé par" banner for non-own programmations */}
              {selectedProg && !selectedProg.isOwn && (
                <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                  <Users size={14} className="text-amber-500 flex-shrink-0" />
                  <span className="text-xs text-amber-700 font-medium">
                    Programmé par{" "}
                    <span className="font-bold">{professorName || "un autre professeur"}</span>
                    {" "}— vous avez accès via la classe partagée
                  </span>
                </div>
              )}
              <div className="p-4">
                {selectedProg
                  ? <ProgrammationCorrections key={selectedProg.id} prog={selectedProg} />
                  : (
                    <div className="text-center py-10">
                      <ClipboardCheck size={32} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Sélectionnez une programmation à gauche</p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseCorrectionsContent;
