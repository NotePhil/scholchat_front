import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowTrendUp,
  faBookOpen,
  faCalendarDays,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";
import ClassCoursesBoard from "./ClassCoursesBoard";
import ClassCourseDetail from "./ClassCourseDetail";
import LearnerProgressionView from "./LearnerProgressionView";
import CoursProgrammeManagement from "../../content/InterfaceCours/CoursProgrammeManagement";
import { getLearnerViewer } from "../../../../../utils/scolarite";

const TABS = [
  { key: "cours", label: "Cours", icon: faBookOpen },
  { key: "seances", label: "Séances", icon: faCalendarDays },
  { key: "progression", label: "Progression", icon: faArrowTrendUp },
];

/**
 * A learner's (or parent's, for the selected child) class page:
 *  - Cours: programmed courses → a course (content + its exercises / devoirs)
 *  - Séances: the scheduled sessions (live join)
 *  - Progression: progression in this class
 */
const LearnerClassSpace = ({ classe, onBack }) => {
  const viewer = useMemo(() => getLearnerViewer(), []);
  const [tab, setTab] = useState("cours");
  const [course, setCourse] = useState(null);

  if (tab === "seances") {
    return <CoursProgrammeManagement selectedClass={classe} onBack={() => setTab("cours")} />;
  }

  return (
    <div className="w-full px-2 py-3">
      {!course && (
        <div className="bg-white rounded-xl shadow mb-3 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 hover:bg-white/20 rounded-lg" aria-label="Retour">
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <FontAwesomeIcon icon={faGraduationCap} />
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate">{classe?.nom}</h1>
              <p className="text-xs text-blue-100 truncate">
                {[classe?.niveau, viewer.isParentView ? `Suivi de ${viewer.childName || "votre enfant"}` : null]
                  .filter(Boolean)
                  .join(" · ") || "Espace de classe"}
              </p>
            </div>
          </div>
          <div className="flex border-t border-gray-100 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 ${tab === t.key ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                <FontAwesomeIcon icon={t.icon} style={{ fontSize: 12 }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "cours" &&
        (course ? (
          <ClassCourseDetail classe={classe} course={course} mode="learner" onBack={() => setCourse(null)} />
        ) : (
          <ClassCoursesBoard classe={classe} mode="learner" learnerId={viewer.learnerId} onOpenCourse={setCourse} />
        ))}

      {tab === "progression" && (
        <LearnerProgressionView
          eleveId={viewer.learnerId}
          classeId={classe?.id}
          title={viewer.isParentView ? `Progression de ${viewer.childName || "votre enfant"} dans la classe` : "Ma progression dans la classe"}
        />
      )}
    </div>
  );
};

export default LearnerClassSpace;
