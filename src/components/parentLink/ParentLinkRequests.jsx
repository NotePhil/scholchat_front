import React, { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate, faEye, faSpinner, faUserShield } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "../../hooks/useTranslation";
import { fetchMyParentFollows, groupFollowsByParent } from "../../services/parentLinkService";

const formatDate = (value, language) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString(language === "en" ? "en-GB" : "fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

/**
 * « Suivi parental » of an adult student: READ-ONLY list of the parents who follow his schooling
 * (GET /eleves/{id}/suivi-parental, one item per parent and class → grouped by parent, with the followed classes
 * and since when). Each follow is validated per class by that class's professors or an administrator, who alone
 * can also remove it: the student has no action here. onCount(n) reports the number of following parents.
 */
const ParentLinkRequests = ({ onCount, isDark = false }) => {
  const { t, language } = useTranslation();
  const [follows, setFollows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = groupFollowsByParent(await fetchMyParentFollows());
      setFollows(list);
      onCount?.(list.length);
    } catch (e) {
      setError(e?.message || t("parentLink.loadError"));
    } finally {
      setLoading(false);
    }
  }, [onCount, t]);

  useEffect(() => {
    load();
  }, [load]);

  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const strong = isDark ? "text-slate-100" : "text-gray-900";

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className={`text-sm ${muted}`}>{t("parentLink.intro")}</p>
          <p className={`mt-1 text-xs ${muted}`}>{t("parentLink.help")}</p>
        </div>
        <button
          type="button"
          onClick={load}
          className={`p-2 rounded-lg ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}
          title={t("parentLink.refresh")}
          aria-label={t("parentLink.refresh")}
        >
          <FontAwesomeIcon icon={faArrowsRotate} className={`${muted} ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      {error && (
        <p className="mb-3 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {loading && follows.length === 0 ? (
        <div className="flex justify-center py-6">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl text-indigo-500" />
        </div>
      ) : follows.length === 0 ? (
        <p className={`text-sm italic ${muted}`}>{t("parentLink.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {follows.map((f) => {
            return (
              <li
                key={f.parentId}
                className={`rounded-xl border p-3 sm:p-4 ${isDark ? "border-slate-700" : "border-gray-200"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                      <FontAwesomeIcon icon={faUserShield} />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${strong}`}>{f.parentNom}</p>
                      {f.parentEmail && <p className={`text-xs truncate ${muted}`}>{f.parentEmail}</p>}
                      <ul className="mt-1 space-y-0.5">
                        {f.classes.map((k) => {
                          const date = formatDate(k.depuis, language);
                          return (
                            <li key={k.classeId || k.classeNom} className={`text-xs ${muted}`}>
                              <span className={`font-medium ${strong}`}>{k.classeNom || t("parentLink.classFallback")}</span>
                              {date ? ` · ${t("parentLink.since", { date })}` : ""}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-sky-50 text-sky-700 border-sky-200">
                    <FontAwesomeIcon icon={faEye} />
                    {t("parentLink.readOnly")}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ParentLinkRequests;
