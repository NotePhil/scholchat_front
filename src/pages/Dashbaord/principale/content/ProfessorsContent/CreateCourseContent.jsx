import React, { useState, useEffect } from "react";
import { matiereService } from "../../../../../services/MatiereService";
import CreateCourseComponent from "./CreateCourseComponent";

/**
 * Standalone page for creating a new course.
 * Rendered as its own tab ("new-course") so it has a separate URL from the course list.
 */
const CreateCourseContent = ({ onBack }) => {
  const [subjects, setSubjects] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    matiereService
      .getAllMatieres()
      .then((data) => setSubjects(data || []))
      .catch(() => {});
  }, []);

  const loadCourses = async () => {
    // no-op: the list page will reload on its own when navigated back to
  };

  return (
    <div className="full-bleed-page">
      {/* ── Create form (full width, no artificial max-w cap) ── */}
      <div className="w-full px-4 sm:px-8 py-4">
        <CreateCourseComponent
          onBack={onBack}
          subjects={subjects}
          setSuccess={setSuccess}
          setError={setError}
          loadCourses={loadCourses}
          setLoading={setLoading}
        />
      </div>
    </div>
  );
};

export default CreateCourseContent;
