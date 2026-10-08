import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { markNotificationAsRead } from "../store/slices/notificationsSlice";
import { setActiveTab as setActiveTabAction } from "../store/slices/uiSlice";
import {
  currentDashboardName,
  getNotificationTarget,
  toActiveTabPayload,
} from "../utils/notificationNavigation";
import { refreshParentAccessFlag } from "../utils/parentAccess";

/**
 * Click on a notification: mark it read, then open the item's dedicated page
 * (tab + redux tabData read by the target component). Shared by every
 * notification list so they all route the same way.
 * Returns openNotification(notification) → the target, or null when the type
 * has no destination for this role (it is still marked read).
 */
export const useNotificationNavigation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { normalizedUserRole } = useAuth();

  return useCallback(
    (notification) => {
      if (!notification) return null;
      if (!notification.read) {
        dispatch(markNotificationAsRead(notification.id));
      }
      const target = getNotificationTarget(notification, normalizedUserRole);
      // A child's class request was decided: the parent's access may have changed.
      if (/^CHILD_ACCESS_/.test(String(notification.type || "").toUpperCase())) {
        refreshParentAccessFlag();
      }
      if (!target) return null;
      dispatch(setActiveTabAction(toActiveTabPayload(target)));
      navigate(
        `/schoolchat/Principal/${currentDashboardName(normalizedUserRole)}/${target.tab}`,
      );
      return target;
    },
    [dispatch, navigate, normalizedUserRole],
  );
};
