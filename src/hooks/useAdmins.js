import { useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  setSearchTerm,
  setFilterStatus,
  setViewMode,
  clearError,
  clearSuccess,
} from "../store/slices/adminSlice";

export const useAdmins = () => {
  const dispatch = useDispatch();
  const adminState = useSelector((state) => state.admin);
  const { user, userRole, userRoles } = useSelector((state) => state.auth);

  // Load admins on component mount
  const loadAdmins = useCallback(() => {
    dispatch(fetchAdmins());
  }, [dispatch]);

  const handleCreateAdmin = useCallback(
    (adminData) => {
      return dispatch(createAdmin(adminData)).unwrap();
    },
    [dispatch]
  );

  const handleUpdateAdmin = useCallback(
    ({ id, data }) => {
      return dispatch(updateAdmin({ id, data })).unwrap();
    },
    [dispatch]
  );

  const handleDeleteAdmin = useCallback(
    (adminId) => {
      return dispatch(deleteAdmin(adminId)).unwrap();
    },
    [dispatch]
  );

  const handleSearchChange = useCallback(
    (searchTerm) => {
      dispatch(setSearchTerm(searchTerm));
    },
    [dispatch]
  );

  const handleFilterChange = useCallback(
    (filterStatus) => {
      dispatch(setFilterStatus(filterStatus));
    },
    [dispatch]
  );

  const handleViewModeChange = useCallback(
    (viewMode) => {
      dispatch(setViewMode(viewMode));
    },
    [dispatch]
  );

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleClearSuccess = useCallback(() => {
    dispatch(clearSuccess());
  }, [dispatch]);

  // Check if user can manage admins (only admins should be able to manage other admins)
  const canManageAdmins = useMemo(() => {
    const allowedRoles = [
      "ROLE_ADMIN",
      "ROLE_SUPER_ADMIN",
      "admin",
      "super_admin",
    ];

    // Vérifier le rôle unique
    if (userRole && allowedRoles.includes(userRole.toLowerCase())) {
      return true;
    }

    // Vérifier le tableau de rôles
    if (userRoles && userRoles.length > 0) {
      return userRoles.some((role) =>
        allowedRoles.includes(role.toLowerCase())
      );
    }

    return false;
  }, [userRole, userRoles]);

  return {
    ...adminState,
    loadAdmins,
    handleCreateAdmin,
    handleUpdateAdmin,
    handleDeleteAdmin,
    handleSearchChange,
    handleFilterChange,
    handleViewModeChange,
    handleClearError,
    handleClearSuccess,
    canManageAdmins,
    currentUser: user,
  };
};
