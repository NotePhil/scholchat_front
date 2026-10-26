import React, { useState, useEffect } from "react";
import parentService from "../../../../services/parentService";
import accederService from "../../../../services/accederService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faCircleExclamation,
  faEnvelope,
  faGraduationCap,
  faHashtag,
  faLocationDot,
  faPhone,
  faSchool,
  faShield,
  faUser,
  faUsers,
  faXmark,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import { asIconComponent } from "../../../../utils/faIconAdapter";
const Calendar = asIconComponent(faCalendarDays);
const Mail = asIconComponent(faEnvelope);
const MapPin = asIconComponent(faLocationDot);
const Phone = asIconComponent(faPhone);
const StatusBadge = ({ status }) => {
  const cfg = {
    ACTIVE: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
      label: "Actif",
    },
    INACTIVE: {
      cls: "bg-red-50 text-red-700 border-red-200",
      dot: "bg-red-500",
      label: "Inactif",
    },
    PENDING: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500 animate-pulse",
      label: "En attente",
    },
    AWAITING_VALIDATION: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500 animate-pulse",
      label: "En attente",
    },
  };
  const c = cfg[status] || {
    cls: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    label: status || "—",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${c.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};
const InfoRow = ({ icon: Icon, iconBg, iconColor, label, value }) => (
  <div className="flex items-start gap-3">
    <div className={`p-2 rounded-lg flex-shrink-0 ${iconBg}`}>
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-sm text-slate-900 break-all">{value || "—"}</p>
    </div>
  </div>
);
const UserViewModalParentStudent = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [enfants, setEnfants] = useState([]);
  const [childClasses, setChildClasses] = useState({});
  const [parentClasses, setParentClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user]);
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [children, classes] = await Promise.all([
        parentService.getChildren(user.id),
        accederService.obtenirClassesAccessibles(user.id).catch(() => []),
      ]);
      const safeChildren = Array.isArray(children) ? children : [];
      const safeClasses = Array.isArray(classes) ? classes : [];
      setEnfants(safeChildren);
      setParentClasses(safeClasses);

      // Fetch classes for each child
      const classMap = {};
      await Promise.all(
        safeChildren.map(async (child) => {
          try {
            const cc = await accederService.obtenirClassesAccessibles(child.id);
            classMap[child.id] = Array.isArray(cc) ? cc : [];
          } catch {
            classMap[child.id] = [];
          }
        }),
      );
      setChildClasses(classMap);
    } catch (err) {
      setError("Impossible de charger les données du parent.");
    } finally {
      setLoading(false);
    }
  };
  const initials =
    `${user?.prenom?.charAt(0) || ""}${user?.nom?.charAt(0) || ""}`.toUpperCase();
  const tabs = [
    {
      id: "info",
      label: "Informations",
    },
    {
      id: "children",
      label: `Enfants (${enfants.length})`,
    },
    {
      id: "classes",
      label: `Classes (${parentClasses.length})`,
    },
  ];
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* ── Header ── */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-lg">{initials}</span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {user?.prenom} {user?.nom}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <FontAwesomeIcon icon={faUser} className="w-3 h-3" /> Parent
                  </span>
                  <StatusBadge status={user?.etat} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <FontAwesomeIcon
                icon={faXmark}
                style={{
                  fontSize: 20,
                }}
              />
            </button>
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="flex-shrink-0 mt-0.5"
                style={{
                  fontSize: 15,
                }}
              />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200 -mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="relative w-10 h-10">
                <div className="w-10 h-10 border-4 border-blue-200 rounded-full animate-spin" />
                <div
                  className="w-10 h-10 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
                  style={{
                    clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* ── Info Tab ── */}
              {activeTab === "info" && (
                <div className="space-y-6">
                  {/* Contact card */}
                  <div className="bg-slate-50 rounded-xl p-4 sm:p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faShield}
                        className="w-4 h-4 text-blue-600"
                      />
                      Informations personnelles
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoRow
                        icon={Mail}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                        label="Email"
                        value={user?.email}
                      />
                      <InfoRow
                        icon={Phone}
                        iconBg="bg-green-50"
                        iconColor="text-green-600"
                        label="Téléphone"
                        value={user?.telephone}
                      />
                      <InfoRow
                        icon={MapPin}
                        iconBg="bg-purple-50"
                        iconColor="text-purple-600"
                        label="Adresse"
                        value={user?.adresse}
                      />
                      <InfoRow
                        icon={Calendar}
                        iconBg="bg-amber-50"
                        iconColor="text-amber-600"
                        label="Date d'inscription"
                        value={
                          user?.creationDate
                            ? new Date(user.creationDate).toLocaleDateString(
                                "fr-FR",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )
                            : null
                        }
                      />
                    </div>
                  </div>

                  {/* Stats summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                      <FontAwesomeIcon
                        icon={faUsers}
                        className="w-5 h-5 text-blue-600 mx-auto mb-1"
                      />
                      <p className="text-lg font-bold text-blue-700">
                        {enfants.length}
                      </p>
                      <p className="text-xs text-blue-600">Enfants</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
                      <FontAwesomeIcon
                        icon={faSchool}
                        className="w-5 h-5 text-indigo-600 mx-auto mb-1"
                      />
                      <p className="text-lg font-bold text-indigo-700">
                        {parentClasses.length}
                      </p>
                      <p className="text-xs text-indigo-600">Classes</p>
                    </div>
                    <div
                      className={`rounded-xl p-3 text-center border ${user?.etat === "ACTIVE" ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}
                    >
                      <FontAwesomeIcon
                        icon={faGraduationCap}
                        className={`w-5 h-5 mx-auto mb-1 ${user?.etat === "ACTIVE" ? "text-emerald-600" : "text-red-600"}`}
                      />
                      <p
                        className={`text-lg font-bold ${user?.etat === "ACTIVE" ? "text-emerald-700" : "text-red-700"}`}
                      >
                        {user?.etat === "ACTIVE" ? "Actif" : "Inactif"}
                      </p>
                      <p
                        className={`text-xs ${user?.etat === "ACTIVE" ? "text-emerald-600" : "text-red-600"}`}
                      >
                        Statut
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Children Tab ── */}
              {activeTab === "children" && (
                <div className="space-y-3">
                  {enfants.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FontAwesomeIcon
                          icon={faUsers}
                          className="w-8 h-8 text-slate-400"
                        />
                      </div>
                      <p className="text-slate-600 font-medium">
                        Aucun enfant enregistré
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        Ce parent n'a pas encore d'enfants associés.
                      </p>
                    </div>
                  ) : (
                    enfants.map((child) => {
                      const classes = childClasses[child.id] || [];
                      return (
                        <div
                          key={child.id}
                          className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow">
                              <span className="text-white font-semibold text-sm">
                                {child.prenom?.charAt(0)}
                                {child.nom?.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-semibold text-slate-900 text-sm">
                                  {child.prenom} {child.nom}
                                </h4>
                                <StatusBadge status={child.etat} />
                              </div>

                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
                                {child.email && (
                                  <span className="flex items-center gap-1">
                                    <FontAwesomeIcon
                                      icon={faEnvelope}
                                      className="w-3 h-3 text-slate-400"
                                    />
                                    <span className="truncate">
                                      {child.email}
                                    </span>
                                  </span>
                                )}
                                {child.telephone && (
                                  <span className="flex items-center gap-1">
                                    <FontAwesomeIcon
                                      icon={faPhone}
                                      className="w-3 h-3 text-slate-400"
                                    />
                                    {child.telephone}
                                  </span>
                                )}
                              </div>

                              {/* Child's classes */}
                              {classes.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {classes.map((cls) => (
                                    <span
                                      key={cls.id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-medium"
                                    >
                                      <FontAwesomeIcon
                                        icon={faBookOpen}
                                        className="w-3 h-3"
                                      />
                                      {cls.nom}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ── Classes Tab ── */}
              {activeTab === "classes" && (
                <div className="space-y-3">
                  {parentClasses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FontAwesomeIcon
                          icon={faSchool}
                          className="w-8 h-8 text-slate-400"
                        />
                      </div>
                      <p className="text-slate-600 font-medium">
                        Aucune classe associée
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        Ce parent n'a accès à aucune classe pour l'instant.
                      </p>
                    </div>
                  ) : (
                    parentClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                              <FontAwesomeIcon
                                icon={faSchool}
                                className="w-4 h-4 text-blue-600"
                              />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 text-sm">
                                {cls.nom}
                              </h4>
                              {cls.niveau && (
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                  <FontAwesomeIcon
                                    icon={faGraduationCap}
                                    className="w-3 h-3"
                                  />{" "}
                                  {cls.niveau}
                                </p>
                              )}
                              {cls.codeActivation && (
                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                  <FontAwesomeIcon
                                    icon={faHashtag}
                                    className="w-3 h-3"
                                  />{" "}
                                  {cls.codeActivation}
                                </p>
                              )}
                              {cls.etablissement && (
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                  <FontAwesomeIcon
                                    icon={faLocationDot}
                                    className="w-3 h-3 text-slate-400"
                                  />
                                  {cls.etablissement.nom} —{" "}
                                  {cls.etablissement.localisation}
                                </p>
                              )}
                            </div>
                          </div>
                          {cls.etat && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${cls.etat === "ACTIF" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                            >
                              {cls.etat}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default UserViewModalParentStudent;
