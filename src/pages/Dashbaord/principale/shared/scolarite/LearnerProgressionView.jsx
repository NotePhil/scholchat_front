import React, { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faBookOpen,
  faCircleExclamation,
  faFileLines,
  faSpinner,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import {
  fmtDate,
  fmtNote20,
  loadLearnerProgression,
} from "../../../../../utils/scolarite";

const barColor = (pct) => (pct >= 100 ? "#16a34a" : pct >= 50 ? "#2563eb" : pct > 0 ? "#f59e0b" : "#cbd5e1");

const Bar = ({ pct, color }) => (
  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
    <div
      className="h-2 rounded-full transition-all duration-500"
      style={{ width: `${Math.max(0, Math.min(100, pct || 0))}%`, background: color || barColor(pct || 0) }}
    />
  </div>
);

const GlobalCard = ({ icon, label, value, hint, tone }) => (
  <div className={`rounded-xl border p-3 sm:p-4 ${tone.box}`}>
    <div className="flex items-center gap-2 mb-1">
      <FontAwesomeIcon icon={icon} className={tone.icon} style={{ fontSize: 14 }} />
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </div>
    <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
    {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
  </div>
);

/**
 * Learner progression: global cards (progression des cours, devoirs rendus,
 * moyenne /20, en retard), one row per course (chapitres lus, exercices faits,
 * moyenne) and the overdue homework. classeId limits it to one class.
 */
const LearnerProgressionView = ({
  eleveId,
  classeId,
  learnerName,
  title,
  themeColors = {},
  onOpenCourses,
  onOpenDevoirs,
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!eleveId) return;
    setLoading(true);
    setError("");
    try {
      setData(await loadLearnerProgression(eleveId, classeId));
    } catch {
      setError("Impossible de charger la progression.");
    } finally {
      setLoading(false);
    }
  }, [eleveId, classeId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!eleveId) return null;
  const card = `${themeColors.cardBg || "bg-white"} rounded-xl shadow-sm border ${themeColors.border || "border-gray-200"}`;
  const text = themeColors.text || "text-gray-800";
  const heading =
    title || (learnerName ? `Progression de ${learnerName}` : classeId ? "Progression dans la classe" : "Ma progression");

  if (loading) {
    return (
      <div className={`${card} p-6 mb-4 flex items-center justify-center gap-2 text-sm text-gray-500`}>
        <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Chargement de la progression…
      </div>
    );
  }
  if (error || !data) {
    return <div className={`${card} p-4 mb-4 text-sm text-red-600`}>{error || "Progression indisponible."}</div>;
  }

  const g = data.global;
  const rendusPct = g.devoirsTotal ? Math.round((g.devoirsRendus / g.devoirsTotal) * 100) : null;

  return (
    <div className="mb-4 sm:mb-8 space-y-4">
      <div className={`${card} p-4 sm:p-6`}>
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className={`text-base font-semibold ${text} flex items-center gap-2`}>
            <FontAwesomeIcon icon={faArrowTrendUp} className="text-blue-500" />
            {heading}
          </h3>
          {g.derniereActivite && (
            <span className="text-xs text-gray-500">Dernière activité : {fmtDate(g.derniereActivite, true)}</span>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <GlobalCard
            icon={faBookOpen}
            label="Progression des cours"
            value={g.progressionCours === null ? "—" : `${Math.round(g.progressionCours)}%`}
            hint={(() => {
              // the "Exercices généraux" row (coursId null) is not a course
              const n = data.cours.filter((c) => c.coursId).length;
              return `${n} cours suivi${n > 1 ? "s" : ""}`;
            })()}
            tone={{ box: "bg-blue-50 border-blue-100", icon: "text-blue-600" }}
          />
          <GlobalCard
            icon={faFileLines}
            label="Devoirs rendus"
            value={`${g.devoirsRendus}/${g.devoirsTotal}`}
            hint={rendusPct === null ? "Aucun devoir" : `${rendusPct}% rendus`}
            tone={{ box: "bg-emerald-50 border-emerald-100", icon: "text-emerald-600" }}
          />
          <GlobalCard
            icon={faTrophy}
            label="Moyenne"
            value={fmtNote20(g.moyenne)}
            hint="Sur les copies corrigées"
            tone={{ box: "bg-purple-50 border-purple-100", icon: "text-purple-600" }}
          />
          <GlobalCard
            icon={faCircleExclamation}
            label="En retard"
            value={g.enRetard}
            hint={g.enRetard ? "Devoirs non rendus à temps" : "Rien en retard"}
            tone={
              g.enRetard
                ? { box: "bg-red-50 border-red-100", icon: "text-red-600" }
                : { box: "bg-gray-50 border-gray-100", icon: "text-gray-400" }
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${card} p-4 sm:p-6 lg:col-span-2`}>
          <h4 className={`text-sm font-semibold ${text} mb-3`}>Par cours</h4>
          {data.cours.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">Aucun cours programmé pour le moment.</p>
              {onOpenCourses && (
                <button onClick={onOpenCourses} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">
                  Voir les cours
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-4">
              {data.cours
                .slice()
                .sort((a, b) => b.pourcentage - a.pourcentage || String(a.titre).localeCompare(String(b.titre)))
                .map((c, i) => {
                  const exPct = c.exercicesTotal ? (c.exercicesFaits / c.exercicesTotal) * 100 : 0;
                  return (
                    <li key={`${c.coursId ?? "general"}-${c.classeNom ?? ""}-${i}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-sm font-medium ${text} truncate`}>{c.titre}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          Moyenne <strong className="text-gray-800">{fmtNote20(c.moyenne)}</strong>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                        {c.coursId ? (
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                            <span>Chapitres lus</span>
                            <span>
                              {c.chapitresLus}/{c.chapitresTotal}{" "}
                              <strong style={{ color: barColor(c.pourcentage) }}>{Math.round(c.pourcentage)}%</strong>
                            </span>
                          </div>
                          <Bar pct={c.pourcentage} />
                        </div>
                        ) : (
                          <div className="text-xs text-gray-400 self-center">Exercices sans cours rattaché</div>
                        )}
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                            <span>Exercices faits</span>
                            <span>
                              {c.exercicesFaits}/{c.exercicesTotal}
                            </span>
                          </div>
                          <Bar pct={exPct} color="#7c3aed" />
                        </div>
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        <div className={`${card} p-4 sm:p-6`}>
          <h4 className={`text-sm font-semibold ${text} mb-3 flex items-center gap-2`}>
            <FontAwesomeIcon icon={faCircleExclamation} className="text-red-500" />
            Devoirs en retard
          </h4>
          {data.devoirsEnRetard.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun devoir en retard.</p>
          ) : (
            <ul className="space-y-2">
              {data.devoirsEnRetard.slice(0, 6).map((d) => (
                <li key={d.id} className="px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-sm font-medium text-gray-800 truncate">{d.titre}</p>
                  <p className="text-xs text-red-600">
                    {d.coursTitre ? `${d.coursTitre} · ` : ""}échéance {fmtDate(d.dateFin, true)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {onOpenDevoirs && (
            <button
              onClick={onOpenDevoirs}
              className="w-full mt-3 px-3 py-2 rounded-lg text-sm font-semibold text-blue-700 border border-blue-200 hover:bg-blue-50"
            >
              Voir les devoirs et corrections
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnerProgressionView;
