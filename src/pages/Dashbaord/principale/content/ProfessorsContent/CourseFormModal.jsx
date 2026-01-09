import React from "react";
import CreateCourseFormModal from "./CreateCourseFormModal";
import EditCourseFormModal from "./EditCourseFormModal";

const CourseFormModal = ({
  modalMode,
  selectedCourse,
  subjects,
  showCreateModal,
  setShowCreateModal,
  setSuccess,
  setError,
  loadCourses,
  setLoading,
}) => {
  if (modalMode === "create") {
    return (
      <CreateCourseFormModal
        subjects={subjects}
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        setSuccess={setSuccess}
        setError={setError}
        loadCourses={loadCourses}
        setLoading={setLoading}
      />
    );
  } else {
    return (
      <EditCourseFormModal
        selectedCourse={selectedCourse}
        subjects={subjects}
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        setSuccess={setSuccess}
        setError={setError}
        loadCourses={loadCourses}
        setLoading={setLoading}
      />
    );
  }
};

export default CourseFormModal;
