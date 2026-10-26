import React from "react";
import { useNavigate, useParams } from "react-router-dom";

/**
 * Shown when a class has no programmed course: an exercise / homework must be
 * attached to a course, so the teacher has to program one first. The link
 * opens the course programming tab filtered on that class.
 */
const NoCourseNotice = ({ classeId, classeNom, onNavigate }) => {
  const navigate = useNavigate();
  const { dashboardType } = useParams();

  const goToCourseProgramming = () => {
    onNavigate?.();
    const dashboard = dashboardType || "ProfessorDashboard";
    const search = classeId ? `?${new URLSearchParams({ classId: classeId }).toString()}` : "";
    navigate(`/schoolchat/Principal/${dashboard}/schedule-course${search}`);
  };

  return (
    <span className="text-xs text-amber-700">
      {classeNom ? `${classeNom} : ` : ""}Aucun cours programmé dans cette classe — programmez d'abord un cours.{" "}
      <button
        type="button"
        onClick={goToCourseProgramming}
        className="font-semibold underline text-amber-800 bg-transparent border-0 p-0 cursor-pointer"
      >
        Programmer un cours
      </button>
    </span>
  );
};

export default NoCourseNotice;
