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

      if (authState.userRole) {
        const normalizedUserRole = authState.userRole.toUpperCase();
        if (
          roleVariants.some(
            (variant) =>
              normalizedUserRole === variant ||
              normalizedUserRole === variant.replace("ROLE_", "") ||
              normalizedUserRole.includes(variant)
          )
        ) {
          return true;
        }
      }

      if (authState.userRoles && authState.userRoles.length > 0) {
        return authState.userRoles.some((role) => {
          const normalizedArrayRole = String(role).toUpperCase();
          return roleVariants.some(
            (variant) =>
              normalizedArrayRole === variant ||
              normalizedArrayRole === variant.replace("ROLE_", "") ||
              normalizedArrayRole.includes(variant)
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

  const isAdmin = useMemo(() => {
    return hasAnyRole([
      "ADMIN",
      "ROLE_ADMIN",
      "SUPER_ADMIN",
      "ROLE_SUPER_ADMIN",
    ]);
  }, [hasAnyRole]);

  const isProfessor = useMemo(() => {
    return hasAnyRole([
      "PROFESSOR",
      "ROLE_PROFESSOR",
      "PROFESSEUR",
      "ROLE_PROFESSEUR",
      "REPETITEUR",
      "ROLE_REPETITEUR",
    ]);
  }, [hasAnyRole]);

  const isParent = useMemo(() => {
    return hasAnyRole(["PARENT", "ROLE_PARENT"]);
  }, [hasAnyRole]);

  const isStudent = useMemo(() => {
    return hasAnyRole(["STUDENT", "ROLE_STUDENT", "ELEVE", "ROLE_ELEVE"]);
  }, [hasAnyRole]);

  const isParentOrStudent = useMemo(() => {
    return isParent || isStudent;
  }, [isParent, isStudent]);

  // Clean display name for the role
  const displayRole = useMemo(() => {
    if (!authState.userRole) {
      if (authState.userRoles && authState.userRoles.length > 0) {
        const firstRole = authState.userRoles[0];
        return getCleanRoleName(firstRole);
      }
      return null;
    }

    return getCleanRoleName(authState.userRole);
  }, [authState.userRole, authState.userRoles]);

  // Helper function to get clean role name
  const getCleanRoleName = (role) => {
    if (!role) return null;

    const cleanRole = role.toUpperCase().replace("ROLE_", "");

    const roleDisplayMap = {
      ADMIN: "Admin",
      SUPER_ADMIN: "Super Admin",
      PROFESSOR: "Professor",
      PROFESSEUR: "Professor",
      REPETITEUR: "Professor",
      PARENT: "Parent",
      PARENTS: "Parent",
      STUDENT: "Student",
      ELEVE: "Student",
      USER: "User",
    };

    return (
      roleDisplayMap[cleanRole] ||
      cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1).toLowerCase()
    );
  };

  const normalizedUserRole = useMemo(() => {
    if (!authState.userRole) {
      if (authState.userRoles && authState.userRoles.length > 0) {
        const firstRole = authState.userRoles[0]
          .toLowerCase()
          .replace("role_", "");
        const roleMap = {
          professeur: "professor",
          eleve: "student",
          repetiteur: "professor",
        };
        return roleMap[firstRole] || firstRole;
      }
      return null;
    }

    const role = authState.userRole.toLowerCase().replace("role_", "");
    const roleMap = {
      professeur: "professor",
      eleve: "student",
      repetiteur: "professor",
    };

    return roleMap[role] || role;
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
    isParentOrStudent,
    displayRole,
    normalizedUserRole,
    userRole: authState.userRole,
    userRoles: authState.userRoles || [],
  };
};
