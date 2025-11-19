import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  setCredentials,
  setLastLocation,
  logout as logoutAction,
  updateUserProfile,
} from "../store/slices/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth);

  const login = useCallback(
    (authData) => {
      const { token, user, userRole, userRoles } = authData;

      console.log("useAuth login called with:", {
        token,
        user,
        userRole,
        userRoles,
      });

      localStorage.setItem("accessToken", token);
      if (userRole) localStorage.setItem("userRole", userRole);
      if (userRoles)
        localStorage.setItem("userRoles", JSON.stringify(userRoles));
      if (user?.email) localStorage.setItem("userEmail", user.email);
      if (user?.username) localStorage.setItem("username", user.username);

      dispatch(setCredentials(authData));
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
    navigate("/schoolchat/login");
  }, [dispatch, navigate]);

  const updateLocation = useCallback(
    (location) => {
      dispatch(setLastLocation(location));
    },
    [dispatch]
  );

  const updateProfile = useCallback(
    (profileData) => {
      dispatch(updateUserProfile(profileData));
    },
    [dispatch]
  );

  const hasRole = useCallback(
    (roleToCheck) => {
      if (!roleToCheck) return false;
      if (
        !authState.userRole &&
        (!authState.userRoles || authState.userRoles.length === 0)
      ) {
        return false;
      }

      const normalizedRole = roleToCheck.toUpperCase();
      const roleVariants = [
        normalizedRole,
        `ROLE_${normalizedRole}`,
        normalizedRole.replace("ROLE_", ""),
      ];

      // Check primary role
      if (authState.userRole) {
        const normalizedUserRole = authState.userRole.toUpperCase();
        if (
          roleVariants.some(
            (variant) =>
              normalizedUserRole === variant ||
              normalizedUserRole === `ROLE_${variant}` ||
              normalizedUserRole === variant.replace("ROLE_", "")
          )
        ) {
          return true;
        }
      }

      // Check roles array
      if (authState.userRoles && authState.userRoles.length > 0) {
        return authState.userRoles.some((role) => {
          const normalizedArrayRole = String(role).toUpperCase();
          return roleVariants.some(
            (variant) =>
              normalizedArrayRole === variant ||
              normalizedArrayRole === `ROLE_${variant}` ||
              normalizedArrayRole === variant.replace("ROLE_", "")
          );
        });
      }

      return false;
    },
    [authState.userRole, authState.userRoles]
  );

  const hasAnyRole = useCallback(
    (rolesToCheck) => {
      if (!rolesToCheck || rolesToCheck.length === 0) return false;
      return rolesToCheck.some((role) => hasRole(role));
    },
    [hasRole]
  );

  const hasAllRoles = useCallback(
    (rolesToCheck) => {
      if (!rolesToCheck || rolesToCheck.length === 0) return false;
      return rolesToCheck.every((role) => hasRole(role));
    },
    [hasRole]
  );

  // Check roles based on backend format: ROLE_ADMIN, ROLE_PROFESSOR, etc.
  const isAdmin = useMemo(() => {
    return hasRole("ADMIN");
  }, [hasRole]);

  const isProfessor = useMemo(() => {
    return hasRole("PROFESSOR");
  }, [hasRole]);

  const isParent = useMemo(() => {
    return hasRole("PARENT");
  }, [hasRole]);

  const isStudent = useMemo(() => {
    return hasRole("STUDENT");
  }, [hasRole]);

  const isTutor = useMemo(() => {
    return hasRole("TUTOR");
  }, [hasRole]);

  const isParentOrStudent = useMemo(() => {
    return isParent || isStudent;
  }, [isParent, isStudent]);

  // Helper function to get clean display name from ROLE_* format
  const getCleanRoleName = useCallback((role) => {
    if (!role) return null;

    // Remove ROLE_ prefix and normalize
    const cleanRole = role.toUpperCase().replace("ROLE_", "");

    // Map to display names
    const roleDisplayMap = {
      ADMIN: "Admin",
      PROFESSOR: "Professor",
      PARENT: "Parent",
      STUDENT: "Student",
      TUTOR: "Tutor",
      USER: "User",
    };

    return (
      roleDisplayMap[cleanRole] ||
      cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1).toLowerCase()
    );
  }, []);

  // Clean display name for the role
  const displayRole = useMemo(() => {
    if (!authState.userRole) {
      if (authState.userRoles && authState.userRoles.length > 0) {
        return getCleanRoleName(authState.userRoles[0]);
      }
      return null;
    }

    return getCleanRoleName(authState.userRole);
  }, [authState.userRole, authState.userRoles, getCleanRoleName]);

  // Normalized role for internal use (lowercase without ROLE_ prefix)
  const normalizedUserRole = useMemo(() => {
    if (!authState.userRole) {
      if (authState.userRoles && authState.userRoles.length > 0) {
        return authState.userRoles[0].toLowerCase().replace("role_", "");
      }
      return null;
    }

    return authState.userRole.toLowerCase().replace("role_", "");
  }, [authState.userRole, authState.userRoles]);

  return {
    ...authState,
    login,
    logout,
    updateLocation,
    updateProfile,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isProfessor,
    isParent,
    isStudent,
    isTutor,
    isParentOrStudent,
    displayRole, // "Admin", "Professor", "Parent", "Student"
    normalizedUserRole, // "admin", "professor", "parent", "student"
    userRole: authState.userRole, // "ROLE_ADMIN", "ROLE_PROFESSOR", etc.
    userRoles: authState.userRoles || [],
  };
};
