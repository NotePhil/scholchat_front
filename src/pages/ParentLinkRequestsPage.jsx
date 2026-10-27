import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setActiveTab } from "../store/slices/uiSlice";
import { dashboardNameForRole } from "../utils/authSession";
import { FOCUS_PARENT_LINKS_KEY } from "../services/parentLinkService";

/**
 * /schoolchat/demandes-suivi-parental — link of the e-mails « Votre parent … suit désormais votre scolarité » /
 * « … ne suit plus votre scolarité ». Logged in: Paramètres → « Suivi parental » (read-only list of the parents
 * who follow the student; the professor validates / removes follows). Otherwise: login first, then
 * the same card (returnToPage + a sessionStorage flag, both kept by the login).
 */
const ParentLinkRequestsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    try {
      sessionStorage.setItem(FOCUS_PARENT_LINKS_KEY, "1");
    } catch {
      // storage unavailable: the card is still shown in Paramètres
    }
    const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
    if (token) {
      dispatch(setActiveTab({ tab: "settings", data: { section: "suivi-parental", _nav: `${Date.now()}` } }));
      navigate(`/schoolchat/Principal/${dashboardNameForRole(localStorage.getItem("userRole"))}/settings`, {
        replace: true,
      });
      return;
    }
    localStorage.setItem("returnToPage", "/schoolchat/Principal/StudentDashboard/settings");
    navigate("/schoolchat/login", {
      replace: true,
      state: {
        message: "Connectez-vous pour consulter votre suivi parental.",
      },
    });
  }, [dispatch, navigate]);

  return null;
};

export default ParentLinkRequestsPage;
