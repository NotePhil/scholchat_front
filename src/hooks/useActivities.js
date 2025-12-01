import { useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchActivities,
  createEvent,
  addReaction,
  addComment,
  shareActivity,
  joinEvent,
  setActiveFilter,
  setShowCreateForm,
  setCurrentUser,
  clearError,
  clearSuccess,
} from "../store/slices/activitiesSlice";

export const useActivities = () => {
  const dispatch = useDispatch();
  const activitiesState = useSelector((state) => state.activities);
  const { user, userRole, userRoles } = useSelector((state) => state.auth);

  // Initialiser l'utilisateur courant si nécessaire
  useEffect(() => {
    if (user && !activitiesState.currentUser) {
      dispatch(
        setCurrentUser({
          ...user,
          role: userRole,
          roles: userRoles,
        })
      );
    }
  }, [user, userRole, userRoles, activitiesState.currentUser, dispatch]);

  const loadActivities = useCallback(() => {
    dispatch(fetchActivities());
  }, [dispatch]);

  const handleCreateEvent = useCallback(
    (eventData) => {
      return dispatch(createEvent(eventData)).unwrap();
    },
    [dispatch]
  );

  const handleReaction = useCallback(
    (activityId, reactionType) => {
      return dispatch(addReaction({ activityId, reactionType })).unwrap();
    },
    [dispatch]
  );

  const handleComment = useCallback(
    (activityId, comment) => {
      return dispatch(addComment({ activityId, comment })).unwrap();
    },
    [dispatch]
  );

  const handleShare = useCallback(
    (activityId) => {
      dispatch(shareActivity(activityId));
    },
    [dispatch]
  );

  const handleJoinEvent = useCallback(
    (eventId) => {
      dispatch(joinEvent(eventId));
    },
    [dispatch]
  );

  const handleFilterChange = useCallback(
    (filter) => {
      dispatch(setActiveFilter(filter));
    },
    [dispatch]
  );

  const handleShowCreateForm = useCallback(
    (show) => {
      dispatch(setShowCreateForm(show));
    },
    [dispatch]
  );

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleClearSuccess = useCallback(() => {
    dispatch(clearSuccess());
  }, [dispatch]);

  const canCreateActivity = useMemo(() => {
    const allowedRoles = [
      "ROLE_ADMIN",
      "ROLE_PROFESSOR", 
      "ROLE_PROFESSEUR",
      "admin",
      "professor",
      "professeur",
    ];

    // Vérifier le rôle unique
    if (userRole) {
      const normalizedRole = userRole.toLowerCase();
      if (allowedRoles.some(role => role.toLowerCase() === normalizedRole)) {
        return true;
      }
    }

    // Vérifier le tableau de rôles
    if (userRoles && userRoles.length > 0) {
      return userRoles.some((role) => {
        const normalizedRole = role.toLowerCase();
        return allowedRoles.some(allowedRole => allowedRole.toLowerCase() === normalizedRole);
      });
    }

    // Vérifier dans currentUser
    if (activitiesState.currentUser?.role) {
      const normalizedRole = activitiesState.currentUser.role.toLowerCase();
      return allowedRoles.some(role => role.toLowerCase() === normalizedRole);
    }

    return false;
  }, [userRole, userRoles, activitiesState.currentUser]);

  return {
    ...activitiesState,
    loadActivities,
    handleCreateEvent,
    handleReaction,
    handleComment,
    handleShare,
    handleJoinEvent,
    handleFilterChange,
    handleShowCreateForm,
    handleClearError,
    handleClearSuccess,
    canCreateActivity,
    currentUser: activitiesState.currentUser || user,
  };
};
