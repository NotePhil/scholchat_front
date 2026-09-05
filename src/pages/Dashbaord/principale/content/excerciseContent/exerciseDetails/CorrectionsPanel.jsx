import React, { useState, useEffect } from "react";
import {
  Select,
  Spin,
  Empty,
  Tag,
  Button,
  Input,
  Typography,
  Space,
} from "antd";
import {
  questionReponseService,
  repondreService,
  participationExerciseService,
} from "../../../../../../services/exerciseService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faClock,
  faFloppyDisk,
  faTrophy,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const ETAT_COLORS = {
  EN_COURS: {
    color: "#d48806",
    bg: "#fffbe6",
    label: "En cours",
  },
  SOUMIS: {
    color: "#1677ff",
    bg: "#e6f4ff",
    label: "Soumis",
  },
  EN_ATTENTE_CORRECTION: {
    color: "#d46b08",
    bg: "#fff7e6",
    label: "En attente",
  },
  CORRIGE: {
    color: "#531dab",
    bg: "#f9f0ff",
    label: "Corrigé",
  },
  VALIDE: {
    color: "#389e0d",
    bg: "#f6ffed",
    label: "Validé",
  },
};
const EtatBadge = ({ etat }) => {
  const c = ETAT_COLORS[etat] || {
    color: "#8c8c8c",
    bg: "#fafafa",
    label: etat,
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.color}40`,
      }}
    >
      {c.label}
    </span>
  );
};
const CorrectionsPanel = ({ exerciseId, programmations }) => {
  const [selectedProgId, setSelectedProgId] = useState(
    programmations.length > 0 ? programmations[0].id : null,
  );
  const [questions, setQuestions] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [gradeInputs, setGradeInputs] = useState({});
  const [saving, setSaving] = useState(null);
  const [savedKeys, setSavedKeys] = useState(new Set());
  useEffect(() => {
    if (selectedProgId) loadData();
  }, [selectedProgId, exerciseId]);
  const loadData = async () => {
    setLoading(true);
    try {
      const [q, a, p] = await Promise.all([
        questionReponseService.getQuestionsByExercise(exerciseId),
        repondreService.getReponsesByExercise(exerciseId),
        participationExerciseService.getParticipationsByExercise(
          selectedProgId,
        ),
      ]);
      setQuestions(q || []);
      setAnswers(a || []);
      setParticipations(p || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Build student map
  const studentMap = {};
  answers.forEach((a) => {
    if (!studentMap[a.utilisateurId]) {
      studentMap[a.utilisateurId] = {
        id: a.utilisateurId,
        nom: a.utilisateurNom || "",
        prenom: a.utilisateurPrenom || "",
        answers: [],
      };
    }
    studentMap[a.utilisateurId].answers.push(a);
  });
  participations.forEach((p) => {
    if (!studentMap[p.utilisateurId]) {
      studentMap[p.utilisateurId] = {
        id: p.utilisateurId,
        nom: p.utilisateurNom || "",
        prenom: p.utilisateurPrenom || "",
        answers: [],
      };
    }
    studentMap[p.utilisateurId].participation = p;
  });
  const students = Object.values(studentMap);
  const maxPoints = questions.reduce((s, q) => s + (q.points || 1), 0);
  const getScore = (student) => {
    let score = 0;
    student.answers.forEach((a) => {
      if (a.estCorrecte === true) {
        const q = questions.find((q) => q.id === a.questionId);
        score += q?.points || 1;
      }
    });
    return score;
  };
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
    setSaving(key);
    try {
      await repondreService.updateReponse({
        utilisateurId: studentId,
        questionId,
        estCorrecte: input.estCorrecte,
        note: input.note,
        appreciation: input.appreciation,
      });
      setSavedKeys((prev) => new Set([...prev, key]));
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };
  const handleSaveOverall = async (student) => {
    if (!selectedProgId) return;
    const key = `overall-${student.id}`;
    const input = gradeInputs[key] || {};
    setSaving(key);
    try {
      await participationExerciseService.updateParticipation({
        utilisateurId: student.id,
        exerciseProgrammerId: selectedProgId,
        note: input.note || `${getScore(student)}/${maxPoints}`,
        appreciation: input.appreciation || "",
        etatSoumission: "CORRIGE",
      });
      setSavedKeys((prev) => new Set([...prev, key]));
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };
  if (programmations.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Aucune programmation — programmez d'abord l'exercice pour voir les soumissions"
      />
    );
  }
  return (
    <div>
      {/* Programmation selector */}
      {programmations.length > 1 && (
        <div className="mb-4 flex items-center gap-3">
          <Text className="text-sm text-gray-500 flex-shrink-0">
            Programmation :
          </Text>
          <Select
            value={selectedProgId}
            onChange={setSelectedProgId}
            style={{
              minWidth: 260,
            }}
            size="middle"
          >
            {programmations.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.typeAssignation === "DEVOIR" ? "📋 Devoir" : "📝 Exercice"} —{" "}
                {p.dateExoPrevue
                  ? new Date(p.dateExoPrevue).toLocaleDateString("fr-FR")
                  : "Sans date"}
                {p.classesDiffusees?.length > 0 &&
                  ` (${p.classesDiffusees.map((c) => c.nom).join(", ")})`}
              </Option>
            ))}
          </Select>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          {
            label: "Participants",
            value: students.length,
            color: "#1677ff",
            bg: "#e6f4ff",
          },
          {
            label: "Ont répondu",
            value: students.filter((s) => s.answers.length > 0).length,
            color: "#389e0d",
            bg: "#f6ffed",
          },
          {
            label: "En attente",
            value: participations.filter(
              (p) => p.etatSoumission === "EN_ATTENTE_CORRECTION",
            ).length,
            color: "#d46b08",
            bg: "#fff7e6",
          },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center"
            style={{
              background: bg,
              border: `1px solid ${color}30`,
            }}
          >
            <div
              className="text-xl font-bold"
              style={{
                color,
              }}
            >
              {value}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : students.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Aucune soumission pour le moment"
        />
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const score = getScore(student);
            const pct =
              maxPoints > 0 ? Math.round((score / maxPoints) * 100) : 0;
            const isExpanded = expandedStudent === student.id;
            const etat = student.participation?.etatSoumission;
            return (
              <div
                key={student.id}
                className="rounded-xl border overflow-hidden bg-white"
                style={{
                  border: "1px solid #e8edf5",
                }}
              >
                {/* Student row */}
                <button
                  onClick={() =>
                    setExpandedStudent(isExpanded ? null : student.id)
                  }
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "#e6f4ff",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faUser}
                        style={{
                          color: "#1677ff",
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {student.prenom} {student.nom}
                      </p>
                      {etat && <EtatBadge etat={etat} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${pct >= 70 ? "bg-green-100 text-green-700" : pct >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                    >
                      {score}/{maxPoints}
                    </span>
                    <span className="text-xs text-gray-400">
                      {student.answers.length}/{questions.length} rép.
                    </span>
                    <span className="text-gray-400 text-xs">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4 space-y-3">
                    {/* Overall grade */}
                    <div
                      className="p-3 bg-white rounded-lg border"
                      style={{
                        borderColor: "#e8edf5",
                      }}
                    >
                      <Text strong className="text-sm block mb-2">
                        <FontAwesomeIcon
                          icon={faTrophy}
                          className="mr-1 text-amber-500"
                        />
                        Note globale
                      </Text>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          placeholder={`${score}/${maxPoints}`}
                          value={
                            gradeInputs[`overall-${student.id}`]?.note || ""
                          }
                          onChange={(e) =>
                            handleGradeChange(
                              student.id,
                              "overall",
                              "note",
                              e.target.value,
                            )
                          }
                          style={{
                            width: 90,
                          }}
                          size="small"
                        />
                        <Input
                          placeholder="Appréciation générale..."
                          value={
                            gradeInputs[`overall-${student.id}`]
                              ?.appreciation || ""
                          }
                          onChange={(e) =>
                            handleGradeChange(
                              student.id,
                              "overall",
                              "appreciation",
                              e.target.value,
                            )
                          }
                          style={{
                            flex: 1,
                            minWidth: 160,
                          }}
                          size="small"
                        />
                        <Button
                          size="small"
                          type="primary"
                          icon={<FontAwesomeIcon icon={faFloppyDisk} />}
                          loading={saving === `overall-${student.id}`}
                          onClick={() => handleSaveOverall(student)}
                        >
                          {savedKeys.has(`overall-${student.id}`)
                            ? "Sauvegardé ✓"
                            : "Sauvegarder"}
                        </Button>
                      </div>
                      {student.participation?.note && (
                        <Text type="secondary" className="text-xs mt-1 block">
                          Note actuelle : {student.participation.note}
                          {student.participation.appreciation &&
                            ` — "${student.participation.appreciation}"`}
                        </Text>
                      )}
                    </div>

                    {/* Per-question */}
                    {questions.map((q, idx) => {
                      const answer = student.answers.find(
                        (a) => a.questionId === q.id,
                      );
                      const needsManual = answer && answer.estCorrecte === null;
                      const gradeKey = `${student.id}-${q.id}`;
                      const correctChoice = (q.choixReponses || []).find(
                        (c) => c.estCorrect,
                      );
                      return (
                        <div
                          key={q.id}
                          className={`p-3 rounded-lg border ${answer?.estCorrecte === true ? "bg-green-50 border-green-200" : answer?.estCorrecte === false ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {q.intitule}
                              </p>
                              <span className="text-xs text-gray-400">
                                {q.typeQuestion} · {q.points || 1} pt(s)
                              </span>
                            </div>
                            {answer?.estCorrecte === true && (
                              <FontAwesomeIcon
                                icon={faCircleCheck}
                                style={{
                                  color: "#52c41a",
                                  fontSize: 16,
                                }}
                              />
                            )}
                            {answer?.estCorrecte === false && (
                              <FontAwesomeIcon
                                icon={faCircleXmark}
                                style={{
                                  color: "#ff4d4f",
                                  fontSize: 16,
                                }}
                              />
                            )}
                            {needsManual && (
                              <FontAwesomeIcon
                                icon={faClock}
                                style={{
                                  color: "#fa8c16",
                                  fontSize: 16,
                                }}
                              />
                            )}
                          </div>

                          {answer ? (
                            <div className="ml-8 space-y-1">
                              <p className="text-sm">
                                <span className="font-medium text-gray-500">
                                  Réponse :{" "}
                                </span>
                                {answer.reponseUtilisateur}
                              </p>
                              {correctChoice && (
                                <p className="text-xs text-green-700">
                                  <span className="font-medium">
                                    Bonne réponse :{" "}
                                  </span>
                                  {correctChoice.texte}
                                </p>
                              )}
                              {!correctChoice && q.reponse && (
                                <p className="text-xs text-green-700">
                                  <span className="font-medium">
                                    Attendue :{" "}
                                  </span>
                                  {q.reponse}
                                </p>
                              )}

                              {needsManual && (
                                <div
                                  className="mt-2 p-2 rounded-lg"
                                  style={{
                                    background: "#fff7e6",
                                    border: "1px solid #ffd591",
                                  }}
                                >
                                  <Text
                                    className="text-xs font-medium block mb-2"
                                    style={{
                                      color: "#d46b08",
                                    }}
                                  >
                                    Correction manuelle requise
                                  </Text>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Select
                                      size="small"
                                      placeholder="Résultat"
                                      value={
                                        gradeInputs[gradeKey]?.estCorrecte ??
                                        undefined
                                      }
                                      onChange={(v) =>
                                        handleGradeChange(
                                          student.id,
                                          q.id,
                                          "estCorrecte",
                                          v,
                                        )
                                      }
                                      style={{
                                        width: 110,
                                      }}
                                    >
                                      <Option value={true}>✓ Correct</Option>
                                      <Option value={false}>✕ Incorrect</Option>
                                    </Select>
                                    <Input
                                      size="small"
                                      placeholder="Note"
                                      value={gradeInputs[gradeKey]?.note || ""}
                                      onChange={(e) =>
                                        handleGradeChange(
                                          student.id,
                                          q.id,
                                          "note",
                                          e.target.value,
                                        )
                                      }
                                      style={{
                                        width: 70,
                                      }}
                                    />
                                    <Input
                                      size="small"
                                      placeholder="Commentaire..."
                                      value={
                                        gradeInputs[gradeKey]?.appreciation ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleGradeChange(
                                          student.id,
                                          q.id,
                                          "appreciation",
                                          e.target.value,
                                        )
                                      }
                                      style={{
                                        flex: 1,
                                        minWidth: 120,
                                      }}
                                    />
                                    <Button
                                      size="small"
                                      type="primary"
                                      icon={
                                        <FontAwesomeIcon icon={faFloppyDisk} />
                                      }
                                      loading={saving === gradeKey}
                                      onClick={() =>
                                        handleSaveGrade(student.id, q.id)
                                      }
                                    >
                                      {savedKeys.has(gradeKey) ? "✓" : "Sauver"}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {answer.note && (
                                <Text type="secondary" className="text-xs">
                                  Note : {answer.note}
                                </Text>
                              )}
                              {answer.appreciation && (
                                <Text
                                  type="secondary"
                                  className="text-xs italic"
                                >
                                  "{answer.appreciation}"
                                </Text>
                              )}
                            </div>
                          ) : (
                            <p className="ml-8 text-sm text-gray-400 italic">
                              Pas de réponse
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default CorrectionsPanel;
