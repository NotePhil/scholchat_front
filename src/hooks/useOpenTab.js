import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { setActiveTab as setActiveTabAction } from "../store/slices/uiSlice";
import {
  currentDashboardName,
  toActiveTabPayload,
} from "../utils/notificationNavigation";

/**
 * openTab(tab, data): switch the dashboard to `tab` with redux tabData `data`
 * (same mechanism as the notification links, e.g. devoirs { exerciseProgrammerId }
 * or corrections-exercise { exerciseProgrammerId }).
 */
export const useOpenTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { normalizedUserRole } = useAuth();
  return useCallback(
    (tab, data = null) => {
      dispatch(setActiveTabAction(toActiveTabPayload({ tab, data })));
      navigate(`/schoolchat/Principal/${currentDashboardName(normalizedUserRole)}/${tab}`);
    },
    [dispatch, navigate, normalizedUserRole],
  );
};

export default useOpenTab;
