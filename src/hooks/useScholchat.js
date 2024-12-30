import { useState, useCallback } from "react";
import { scholchatService } from "../services/ScholchatService";

export const useScholchat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeRequest = async (requestFn, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestFn(...args);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // User operations
  const createUser = useCallback(
    (userData) =>
      executeRequest(
        scholchatService.createUser.bind(scholchatService),
        userData
      ),
    []
  );

  // Professor operations
  const createProfessor = useCallback(
    (professorData) =>
      executeRequest(
        scholchatService.createProfessor.bind(scholchatService),
        professorData
      ),
    []
  );

  // Parent operations
  const createParent = useCallback(
    (parentData) =>
      executeRequest(
        scholchatService.createParent.bind(scholchatService),
        parentData
      ),
    []
  );

  // Student operations
  const createStudent = useCallback(
    (studentData) =>
      executeRequest(
        scholchatService.createStudent.bind(scholchatService),
        studentData
      ),
    []
  );

  // Tutor operations
  const createTutor = useCallback(
    (tutorData) =>
      executeRequest(
        scholchatService.createTutor.bind(scholchatService),
        tutorData
      ),
    []
  );

  // Class operations
  const createClass = useCallback(
    (classData) =>
      executeRequest(
        scholchatService.createClass.bind(scholchatService),
        classData
      ),
    []
  );

  // Establishment operations
  const createEstablishment = useCallback(
    (establishmentData) =>
      executeRequest(
        scholchatService.createEstablishment.bind(scholchatService),
        establishmentData
      ),
    []
  );

  // Get operations
  const getAllUsers = useCallback(
    () => executeRequest(scholchatService.getAllUsers.bind(scholchatService)),
    []
  );

  const getAllProfessors = useCallback(
    () =>
      executeRequest(scholchatService.getAllProfessors.bind(scholchatService)),
    []
  );

  const getAllParents = useCallback(
    () => executeRequest(scholchatService.getAllParents.bind(scholchatService)),
    []
  );

  const getAllStudents = useCallback(
    () =>
      executeRequest(scholchatService.getAllStudents.bind(scholchatService)),
    []
  );

  const getAllTutors = useCallback(
    () => executeRequest(scholchatService.getAllTutors.bind(scholchatService)),
    []
  );

  const getAllClasses = useCallback(
    () => executeRequest(scholchatService.getAllClasses.bind(scholchatService)),
    []
  );

  const getAllEstablishments = useCallback(
    () =>
      executeRequest(
        scholchatService.getAllEstablishments.bind(scholchatService)
      ),
    []
  );

  return {
    loading,
    error,
    // Create operations
    createUser,
    createProfessor,
    createParent,
    createStudent,
    createTutor,
    createClass,
    createEstablishment,
    // Get operations
    getAllUsers,
    getAllProfessors,
    getAllParents,
    getAllStudents,
    getAllTutors,
    getAllClasses,
    getAllEstablishments,
    // Direct service access for other operations
    service: scholchatService,
  };
};
