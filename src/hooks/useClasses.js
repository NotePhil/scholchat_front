import { useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchClasses,
  fetchEstablishments,
  createClass,
  approveClass,
  rejectClass,
  activateClass,
  deactivateClass,
  requestClassAccess,
  getClassByToken,
  createEstablishment,
  setSearchTerm,
  setCurrentTab,
  setSelectedClass,
  clearError,
  clearSuccess,
  clearGeneratedToken,
} from "../store/slices/classSlice";

export const useClasses = () => {
  const dispatch = useDispatch();
  const classState = useSelector((state) => state.class);
  const { user } = useSelector((state) => state.auth);

  const loadClasses = useCallback(() => {
    dispatch(fetchClasses());
  }, [dispatch]);

  const loadEstablishments = useCallback(() => {
    dispatch(fetchEstablishments());
  }, [dispatch]);

  const handleCreateClass = useCallback(
    (classData) => {
      return dispatch(createClass(classData)).unwrap();
    },
    [dispatch]
  );

  const handleApproveClass = useCallback(
    (classId) => {
      return dispatch(approveClass(classId)).unwrap();
    },
    [dispatch]
  );

  const handleRejectClass = useCallback(
    ({ classId, reason }) => {
      return dispatch(rejectClass({ classId, reason })).unwrap();
    },
    [dispatch]
  );

  const handleActivateClass = useCallback(
    (classId) => {
      return dispatch(activateClass(classId)).unwrap();
    },
    [dispatch]
  );

  const handleDeactivateClass = useCallback(
    ({ classId, reason }) => {
      return dispatch(deactivateClass({ classId, reason })).unwrap();
    },
    [dispatch]
  );

  const handleRequestAccess = useCallback(
    ({ token, role }) => {
      return dispatch(requestClassAccess({ token, role })).unwrap();
    },
    [dispatch]
  );

  const handleGetClassByToken = useCallback(
    (token) => {
      return dispatch(getClassByToken(token)).unwrap();
    },
    [dispatch]
  );

  const handleCreateEstablishment = useCallback(
    (establishmentData) => {
      return dispatch(createEstablishment(establishmentData)).unwrap();
    },
    [dispatch]
  );

  const handleSearchChange = useCallback(
    (searchTerm) => {
      dispatch(setSearchTerm(searchTerm));
    },
    [dispatch]
  );

  const handleTabChange = useCallback(
    (tab) => {
      dispatch(setCurrentTab(tab));
    },
    [dispatch]
  );

  const handleSetSelectedClass = useCallback(
    (classData) => {
      dispatch(setSelectedClass(classData));
    },
    [dispatch]
  );

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleClearSuccess = useCallback(() => {
    dispatch(clearSuccess());
  }, [dispatch]);

  const handleClearToken = useCallback(() => {
    dispatch(clearGeneratedToken());
  }, [dispatch]);

  // Filter classes based on current state and user
  const filteredClasses = useMemo(() => {
    let filtered = classState.classes || [];

    // Apply search filter
    if (classState.searchTerm) {
      const search = classState.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cls) =>
          cls.nom?.toLowerCase().includes(search) ||
          cls.matiere?.toLowerCase().includes(search) ||
          cls.professeur?.nom?.toLowerCase().includes(search) ||
          cls.etablissement?.nom?.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (classState.currentTab !== "all") {
      const statusMap = {
        active: "ACTIF",
        inactive: "EN_ATTENTE_APPROBATION",
        pending: "EN_ATTENTE",
      };
      filtered = filtered.filter(
        (cls) => cls.statut === statusMap[classState.currentTab]
      );
    }

    // Apply role-based filter
    if (user) {
      if (user.role === "PROFESSEUR") {
        filtered = filtered.filter((cls) => cls.professeur?.id === user.id);
      } else if (user.role === "ETABLISSEMENT") {
        filtered = filtered.filter(
          (cls) => cls.etablissement?.id === user.etablissementId
        );
      }
    }

    return filtered;
  }, [classState.classes, classState.searchTerm, classState.currentTab, user]);

  // Check user permissions
  const canCreateClass = useMemo(() => {
    return ["PROFESSEUR", "ADMINISTRATEUR"].includes(user?.role);
  }, [user]);

  const canManageEstablishments = useMemo(() => {
    return user?.role === "ADMINISTRATEUR";
  }, [user]);

  const canApproveClasses = useMemo(() => {
    return ["ETABLISSEMENT", "ADMINISTRATEUR"].includes(user?.role);
  }, [user]);

  return {
    ...classState,
    filteredClasses,
    loadClasses,
    loadEstablishments,
    handleCreateClass,
    handleApproveClass,
    handleRejectClass,
    handleActivateClass,
    handleDeactivateClass,
    handleRequestAccess,
    handleGetClassByToken,
    handleCreateEstablishment,
    handleSearchChange,
    handleTabChange,
    handleSetSelectedClass,
    handleClearError,
    handleClearSuccess,
    handleClearToken,
    canCreateClass,
    canManageEstablishments,
    canApproveClasses,
    currentUser: user,
  };
};
