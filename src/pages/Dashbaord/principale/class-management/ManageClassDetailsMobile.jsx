import React, { useState } from "react";
import {
  ArrowLeft,
  Users,
  Settings,
  Shield,
  History,
  CheckCircle,
  XCircle,
  GraduationCap,
  Calendar,
  ChevronRight,
  ChevronDown,
  UserPlus,
  RefreshCw,
  Check,
  X,
  User,
  FileText,
  School,
  Activity,
  Copy,
  Crown,
  Trash2,
  Clock,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ManageClassDetailsMobile = ({
  classDetails,
  users,
  statistics,
  loading,
  onBack,
  onRefresh,
  handleApproveRequest,
  handleRejectRequest,
  handleRemoveAccess,
  handleViewUser,
  handleApprove,
  handleReject,
  handleSelfApprove,
  canSelfManage,
  isPending,
  actionLoading,
  onAssignModerator,
  onManageRights,
  onViewHistory,
  onDelete,
  moderatorsWithRights,
  handleModeratorRemove
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [memberFilter, setMemberFilter] = useState("all");
  const [codeCopied, setCodeCopied] = useState(false);

  const isClassPending = classDetails?.etat === "EN_ATTENTE_APPROBATION" ||
                         classDetails?.etat === "EN_ATTENTE" ||
                         classDetails?.etat === "PENDING";

  const tabs = [
    { id: "overview", label: "Infos", icon: GraduationCap },
    { id: "professeurs", label: `Profs (${statistics.professeurs})`, icon: User },
    { id: "eleves", label: `Élèves (${statistics.eleves})`, icon: Users },
    { id: "parents", label: `Parents (${statistics.parents})`, icon: Users },
    { id: "utilisateurs", label: `Autres (${statistics.utilisateurs})`, icon: User },
    { id: "requests", label: `Demandes (${statistics.accessRequests})`, icon: Clock },
    { id: "settings", label: "Gestion", icon: Settings }
  ];

  const currentModerator = classDetails?.moderator ||
    (moderatorsWithRights?.length > 0 ? moderatorsWithRights[0] : null);

  const getStatusConfig = (etat) => {
    const config = {
      ACTIF: { color: "bg-green-100 text-green-700", text: "Actif" },
      ACTIVE: { color: "bg-green-100 text-green-700", text: "Actif" },
      INACTIF: { color: "bg-red-100 text-red-700", text: "Inactif" },
      INACTIVE: { color: "bg-red-100 text-red-700", text: "Inactif" },
      EN_ATTENTE_APPROBATION: { color: "bg-orange-100 text-orange-700", text: "En attente" },
      EN_ATTENTE: { color: "bg-orange-100 text-orange-700", text: "En attente" },
      PENDING: { color: "bg-orange-100 text-orange-700", text: "En attente" },
    };
    return config[etat] || { color: "bg-gray-100 text-gray-600", text: etat };
  };

  const getPublicationLabel = (droit) => {
    const labels = {
      TOUS: "Tous peuvent publier",
      MODERATEUR_SEULEMENT: "Modérateur seulement",
      PARENTS_ET_MODERATEUR: "Parents et modérateur",
      PROFESSEURS_SEULEMENT: "Professeurs seulement",
    };
    return labels[droit] || droit || "Professeurs seulement";
  };

  const handleCopyCode = () => {
    const code = classDetails?.codeActivation || classDetails?.id?.substring(0, 6).toUpperCase();
    if (code) {
      navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const statusConfig = getStatusConfig(classDetails?.etat);

  const StatBox = ({ label, value, color }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center flex-1">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-lg font-black ${color}`}>{value}</span>
    </div>
  );

  const InfoRow = ({ label, value, icon: Icon, colorClass = "text-blue-600", bgClass = "bg-blue-50 dark:bg-blue-900/20", extra }) => (
    <div className="flex items-center justify-between py-3 gap-2">
      <div className="flex items-center space-x-3 shrink-0">
        <div className={`p-2 ${bgClass} ${colorClass} rounded-xl`}>
          <Icon size={16} />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0 justify-end">
        <span className="text-xs font-black dark:text-white text-right truncate max-w-[150px]">{value || "\u2014"}</span>
        {extra}
      </div>
    </div>
  );

  const UserCard = ({ user, showRemove = true }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl flex items-center shadow-sm border border-gray-100 dark:border-white/5">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center font-bold text-blue-600 shrink-0">
          {user.prenom?.charAt(0) || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold dark:text-white truncate">{user.prenom} {user.nom}</h4>
          <p className="text-[10px] text-gray-400 font-bold truncate">{user.email || ""}</p>
          {user.typeUtilisateur && (
            <span className="text-[8px] bg-blue-600/10 text-blue-600 px-2 py-0.5 rounded font-black uppercase tracking-widest inline-block mt-1">
              {user.typeUtilisateur}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <button onClick={() => handleViewUser(user)} className="p-2 text-blue-500 rounded-xl hover:bg-blue-50">
          <Eye size={16} />
        </button>
        {showRemove && handleRemoveAccess && (
          <button onClick={() => handleRemoveAccess(user)} className="p-2 text-red-400 rounded-xl hover:bg-red-50">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );

  const EmptyState = ({ message }) => (
    <div className="py-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
        <Users size={24} className="text-gray-300" />
      </div>
      <p className="text-sm font-bold text-gray-400">{message}</p>
    </div>
  );

  const renderUserList = (userList, emptyMessage) => {
    if (!userList || userList.length === 0) {
      return <EmptyState message={emptyMessage} />;
    }
    return (
      <div className="space-y-3">
        {userList.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 min-w-0">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 shrink-0">
              <ArrowLeft size={22} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-black dark:text-white leading-tight truncate">
                {classDetails?.nom || "Détails Classe"}
              </h1>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                  {statusConfig.text}
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  {statistics.eleves + statistics.professeurs + statistics.parents + statistics.utilisateurs} participants
                </span>
              </div>
            </div>
          </div>
          <button onClick={onRefresh} className="p-2.5 bg-gray-100 dark:bg-slate-800 rounded-2xl text-blue-600 shrink-0">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Self-approval info banner */}
        {canSelfManage && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-start space-x-2">
              <Crown size={14} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                Vous etes le createur. Classe independante avec paiement valide - vous pouvez l'approuver vous-meme.
              </p>
            </div>
          </div>
        )}

        {/* Action Bar for Pending */}
        {isPending && (
          <div className="flex space-x-2 mb-3">
            {canSelfManage ? (
              <>
                <button
                  onClick={handleSelfApprove}
                  disabled={actionLoading === "self-approve"}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-green-500 text-white rounded-2xl font-black text-[10px] shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {actionLoading === "self-approve" ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Crown size={14} />
                  )}
                  <span>APPROUVER MA CLASSE</span>
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading === "self-reject"}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-red-500 text-white rounded-2xl font-black text-[10px] shadow-lg shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Crown size={14} />
                  <span>REJETER</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading === "approve"}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-green-500 text-white rounded-2xl font-black text-[10px] shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {actionLoading === "approve" ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>APPROUVER</span>
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading === "reject"}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-red-500 text-white rounded-2xl font-black text-[10px] shadow-lg shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {actionLoading === "reject" ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <X size={14} />
                  )}
                  <span>REJETER</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-[10px] font-black transition-all whitespace-nowrap ${
                activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-white dark:bg-slate-800 text-gray-500 border border-gray-100 dark:border-white/5"
              }`}
            >
              <tab.icon size={12} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Stat Grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Professeurs" value={statistics.professeurs} color="text-purple-600" />
                <StatBox label="Eleves" value={statistics.eleves} color="text-blue-600" />
                <StatBox label="Parents" value={statistics.parents} color="text-orange-600" />
                <StatBox label="Demandes" value={statistics.accessRequests} color="text-red-600" />
              </div>

              {/* Class Info Card */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-[28px] shadow-sm border border-gray-100 dark:border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-gray-400">Informations de la classe</h3>
                <div className="divide-y divide-gray-50 dark:divide-white/5">
                  <InfoRow label="Nom" value={classDetails?.nom} icon={User} />
                  <InfoRow label="Niveau" value={classDetails?.niveau} icon={GraduationCap} colorClass="text-purple-500" bgClass="bg-purple-50" />
                  <InfoRow
                    label="Code"
                    value={classDetails?.codeActivation || classDetails?.id?.substring(0, 6).toUpperCase()}
                    icon={Shield}
                    colorClass="text-indigo-500"
                    bgClass="bg-indigo-50"
                    extra={
                      <button onClick={handleCopyCode} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                        {codeCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                      </button>
                    }
                  />
                  <InfoRow
                    label="Cree le"
                    value={classDetails?.dateCreation ? new Date(classDetails.dateCreation).toLocaleDateString('fr-FR') : "Non disponible"}
                    icon={Calendar}
                    colorClass="text-amber-500"
                    bgClass="bg-amber-50"
                  />
                  <div className="flex items-center justify-between py-3 gap-2">
                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
                        <Activity size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Statut</span>
                    </div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${statusConfig.color}`}>
                      {statusConfig.text}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 gap-2">
                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                        <FileText size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Publication</span>
                    </div>
                    <span className="text-[10px] font-black dark:text-white text-right bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full max-w-[160px] truncate">
                      {getPublicationLabel(classDetails?.droitPublication)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 gap-2">
                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="p-2 bg-teal-50 text-teal-500 rounded-xl">
                        <School size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Etablissement</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 justify-end">
                      <span className="text-xs font-black dark:text-white text-right truncate max-w-[120px]">
                        {classDetails?.etablissement?.nom || "Non assigne"}
                      </span>
                      {!classDetails?.etablissement?.nom && (
                        <span className="text-[8px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Independante
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Moderator Section */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-[28px] shadow-sm border border-gray-100 dark:border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Moderateur</h3>
                  {currentModerator && (moderatorsWithRights?.length > 0 || classDetails?.moderator) && (
                    <button
                      onClick={handleModeratorRemove}
                      disabled={actionLoading === "removeModerator"}
                      className="text-[9px] font-black text-red-500 uppercase tracking-tighter disabled:opacity-50"
                    >
                      {actionLoading === "removeModerator" ? "..." : "Retirer"}
                    </button>
                  )}
                </div>

                {currentModerator ? (
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/20 shrink-0">
                      {currentModerator.prenom?.charAt(0) || "M"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm dark:text-white truncate">{currentModerator.prenom} {currentModerator.nom}</h4>
                      <p className="text-[10px] text-gray-400 font-bold truncate">{currentModerator.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => handleViewUser(currentModerator)}
                          className="text-[10px] font-black text-blue-600 flex items-center"
                        >
                          VOIR PROFIL <ChevronRight size={12} className="ml-1" />
                        </button>
                        {!isClassPending && (
                          <button
                            onClick={onAssignModerator}
                            className="text-[10px] font-black text-purple-600 flex items-center"
                          >
                            CHANGER <UserPlus size={12} className="ml-1" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl">
                    <UserPlus size={24} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-[10px] font-bold text-gray-400 mb-2">AUCUN MODERATEUR ASSIGNE</p>
                    <button
                      onClick={onAssignModerator}
                      disabled={isClassPending}
                      className="text-[10px] font-black text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                      {isClassPending ? "Approuvez d'abord la classe" : "ASSIGNER MAINTENANT"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Professors Tab */}
          {activeTab === "professeurs" && (
            <motion.div key="professeurs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-base font-black dark:text-white">Professeurs</h2>
                <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-3 py-1 rounded-full">{statistics.professeurs}</span>
              </div>
              {renderUserList(users.professeurs, "Aucun professeur dans cette classe")}
            </motion.div>
          )}

          {/* Students Tab */}
          {activeTab === "eleves" && (
            <motion.div key="eleves" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-base font-black dark:text-white">Eleves</h2>
                <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full">{statistics.eleves}</span>
              </div>
              {renderUserList(users.eleves, "Aucun eleve dans cette classe")}
            </motion.div>
          )}

          {/* Parents Tab */}
          {activeTab === "parents" && (
            <motion.div key="parents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-base font-black dark:text-white">Parents</h2>
                <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-3 py-1 rounded-full">{statistics.parents}</span>
              </div>
              {renderUserList(users.parents, "Aucun parent dans cette classe")}
            </motion.div>
          )}

          {/* Utilisateurs Tab */}
          {activeTab === "utilisateurs" && (
            <motion.div key="utilisateurs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-base font-black dark:text-white">Utilisateurs</h2>
                <span className="text-[10px] font-black bg-gray-200 text-gray-600 px-3 py-1 rounded-full">{statistics.utilisateurs}</span>
              </div>
              {renderUserList(users.utilisateurs, "Aucun utilisateur dans cette classe")}
            </motion.div>
          )}

          {/* Access Requests Tab */}
          {activeTab === "requests" && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center px-1 mb-4">
                <h2 className="text-base font-black dark:text-white">Demandes d'acces</h2>
                <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl">
                  {users.accessRequests?.length || 0} EN ATTENTE
                </span>
              </div>

              {(!users.accessRequests || users.accessRequests.length === 0) ? (
                <EmptyState message="Aucune demande d'acces en attente" />
              ) : (
                users.accessRequests.map((req) => (
                  <div key={req.id} className="bg-white dark:bg-slate-800 p-5 rounded-[28px] shadow-sm border border-gray-100 dark:border-white/5">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-black text-lg shrink-0">
                        {req.nom?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-sm dark:text-white truncate">{req.prenom} {req.nom}</h4>
                        <p className="text-[10px] text-gray-500 font-bold truncate">{req.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[8px] bg-blue-600/10 text-blue-600 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                            {req.typeUtilisateur || "INCONNU"}
                          </span>
                          {req.dateDemande && (
                            <span className="text-[8px] text-gray-400 font-bold">
                              {new Date(req.dateDemande).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleApproveRequest(req)}
                        className="py-3 bg-green-500 text-white rounded-2xl font-black text-[10px] shadow-lg shadow-green-500/10 active:scale-95 transition-all"
                      >
                        APPROUVER
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req)}
                        className="py-3 bg-gray-100 dark:bg-slate-700 text-red-500 rounded-2xl font-black text-[10px] active:scale-95 transition-all"
                      >
                        REJETER
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* Settings/Management Tab */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <section className="bg-white dark:bg-slate-800 rounded-[28px] shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-slate-800/50">
                  <h3 className="text-xs font-black dark:text-white uppercase tracking-widest text-blue-600">Actions</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {[
                    {
                      label: "Assigner Moderateur",
                      icon: UserPlus,
                      color: "text-purple-500",
                      bg: "bg-purple-50",
                      action: onAssignModerator,
                      disabled: isClassPending,
                      disabledText: "Approuvez d'abord"
                    },
                    {
                      label: "Droits de Publication",
                      icon: FileText,
                      color: "text-emerald-500",
                      bg: "bg-emerald-50",
                      action: onManageRights,
                      disabled: isClassPending,
                      disabledText: "Approuvez d'abord"
                    },
                    {
                      label: "Historique d'Activation",
                      icon: History,
                      color: "text-blue-500",
                      bg: "bg-blue-50",
                      action: onViewHistory,
                      disabled: false,
                      loading: actionLoading === "history"
                    },
                    {
                      label: "Supprimer la Classe",
                      icon: XCircle,
                      color: "text-red-500",
                      bg: "bg-red-50",
                      action: onDelete,
                      disabled: false,
                      loading: actionLoading === "delete"
                    }
                  ].map((opt, i) => (
                    <button
                      key={i}
                      onClick={opt.disabled ? undefined : opt.action}
                      disabled={opt.disabled || opt.loading}
                      className={`w-full p-5 flex items-center justify-between transition-colors ${
                        opt.disabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-gray-50 dark:hover:bg-slate-700/50 active:scale-[0.99]"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 ${opt.bg} ${opt.color} rounded-2xl`}>
                          {opt.loading ? (
                            <RefreshCw size={18} className="animate-spin" />
                          ) : (
                            <opt.icon size={18} />
                          )}
                        </div>
                        <div className="text-left">
                          <span className="font-black text-sm dark:text-white block">{opt.label}</span>
                          {opt.disabled && opt.disabledText && (
                            <span className="text-[9px] text-orange-500 font-bold">{opt.disabledText}</span>
                          )}
                        </div>
                      </div>
                      {!opt.disabled && <ChevronRight size={18} className="text-gray-300" />}
                    </button>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ManageClassDetailsMobile;
