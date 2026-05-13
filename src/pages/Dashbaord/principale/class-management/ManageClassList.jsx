import React, { useState, useMemo, useEffect } from "react";
import {
  GraduationCap, Search, Edit, Plus, Calendar,
  CheckCircle, XCircle, AlertCircle, Loader, Settings,
  ChevronLeft, ChevronRight, RefreshCw, X, Zap, Bell,
  Trophy, Filter,
} from "lucide-react";
import AccederService from "../../../../services/accederService";
import ClassEditModal from "./ClassEditPage";

/* ── Status helpers ─────────────────────────────────────────────────────── */
const EtatClasse = { ACTIF: "ACTIF", EN_ATTENTE_APPROBATION: "EN_ATTENTE_APPROBATION", INACTIF: "INACTIF" };

const STATUS_CFG = {
  ACTIF:                   { label: "Actif",      bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", dot: "bg-green-500" },
  EN_ATTENTE_APPROBATION:  { label: "En attente", bg: "#fffbeb", color: "#d97706", border: "#fde68a", dot: "bg-amber-500 animate-pulse" },
  INACTIF:                 { label: "Inactif",    bg: "#fef2f2", color: "#dc2626", border: "#fecaca", dot: "bg-red-500" },
};

const StatusBadge = ({ etat }) => {
  const cfg = STATUS_CFG[etat] || { label: etat, bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", dot: "bg-gray-400" };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

/* ── Main component ─────────────────────────────────────────────────────── */
const ManageClassList = ({
  classes = [],
  loading = false,
  error,
  successMessage,
  refreshing = false,
  onSelectClass = () => {},
  onRefresh = () => {},
  onBack,
  onNavigateToCreate,
  userRole = "professeur",
}) => {
  const [currentPage, setCurrentPage]   = useState(1);
  const [pageSize, setPageSize]         = useState(12);
  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [niveauFilter, setNiveauFilter] = useState("all");
  const [sortBy, setSortBy]             = useState("dateCreation");
  const [sortOrder, setSortOrder]       = useState("desc");
  const [pendingRequests, setPendingRequests] = useState({});
  const [editingClass, setEditingClass] = useState(null);
  const [loadingRequests, setLoadingRequests] = useState(false);

  /* ── Load pending access requests ── */
  const loadPendingRequests = async () => {
    if (!classes.length) return;
    setLoadingRequests(true);
    const map = {};
    await Promise.all(
      classes.map(async (cls) => {
        try {
          const reqs = await AccederService.obtenirDemandesAccesPourClasse(cls.id);
          map[cls.id] = (reqs || []).filter(r => r.etat === "EN_ATTENTE").length;
        } catch { map[cls.id] = 0; }
      })
    );
    setPendingRequests(map);
    setLoadingRequests(false);
  };

  useEffect(() => { if (classes.length) loadPendingRequests(); }, [classes]);
  useEffect(() => { if (refreshing) loadPendingRequests(); }, [refreshing]);

  /* ── Derived stats ── */
  const totalClasses    = classes.length;
  const activeClasses   = classes.filter(c => c.etat === EtatClasse.ACTIF).length;
  const pendingClasses  = classes.filter(c => c.etat === EtatClasse.EN_ATTENTE_APPROBATION).length;
  const totalAccessReqs = Object.values(pendingRequests).reduce((s, n) => s + n, 0);
  const totalPending    = totalAccessReqs + pendingClasses;

  /* ── Unique niveaux ── */
  const uniqueNiveaux = [...new Set(classes.map(c => c.niveau).filter(Boolean))];

  /* ── Filter + sort ── */
  const filtered = useMemo(() => {
    let list = classes.filter(c => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || c.nom?.toLowerCase().includes(q) || c.niveau?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || c.etat === statusFilter;
      const matchNiveau = niveauFilter === "all" || c.niveau === niveauFilter;
      return matchSearch && matchStatus && matchNiveau;
    });

    list.sort((a, b) => {
      const ap = pendingRequests[a.id] || 0;
      const bp = pendingRequests[b.id] || 0;
      if (ap > 0 && bp === 0) return -1;
      if (ap === 0 && bp > 0) return 1;
      if (ap !== bp) return bp - ap;
      let av = a[sortBy], bv = b[sortBy];
      if (sortBy === "dateCreation") { av = new Date(av); bv = new Date(bv); }
      else if (sortBy === "eleveCount") { av = a.eleves?.length || 0; bv = b.eleves?.length || 0; }
      return sortOrder === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [classes, searchTerm, statusFilter, niveauFilter, sortBy, sortOrder, pendingRequests]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage    = Math.min(currentPage, totalPages);
  const paginated   = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const clearFilters = () => {
    setSearchTerm(""); setStatusFilter("all"); setNiveauFilter("all");
    setSortBy("dateCreation"); setSortOrder("desc"); setCurrentPage(1);
  };

  const handleRefresh = async () => { await onRefresh(); await loadPendingRequests(); };

  /* ── Loading state ── */
  if (loading && classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin" />
          <div className="w-12 h-12 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"
            style={{ clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)" }} />
        </div>
        <p className="mt-4 text-slate-500 text-sm font-medium">Chargement des classes...</p>
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden mb-4 sm:mb-6 rounded-2xl"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 60%, #4f8ec9 100%)" }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 pointer-events-none" style={{ background: "#fff" }} />
        <div className="relative px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.35)" }}>
                <GraduationCap size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-bold text-base sm:text-xl leading-tight">Gestion des Classes</h1>
                <p className="text-blue-100 text-xs mt-0.5">Gérez et supervisez toutes les classes de votre établissement</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={handleRefresh} disabled={refreshing || loadingRequests}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-semibold transition-all hover:bg-white/20 disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <RefreshCw size={14} className={refreshing || loadingRequests ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{refreshing ? "Actualisation..." : "Actualiser"}</span>
              </button>
              {onNavigateToCreate && (
                <button onClick={onNavigateToCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                  <Plus size={14} />
                  <span className="hidden sm:inline">Créer une Classe</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats cards — hidden on mobile ── */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[
          { icon: <GraduationCap size={16} />, value: totalClasses,  label: "Total Classes",       color: "#2d6a9f", bg: "#eff6ff", ring: "ring-blue-500",  filter: "all" },
          { icon: <Trophy size={16} />,        value: activeClasses,  label: "Classes Actives",     color: "#16a34a", bg: "#f0fdf4", ring: "ring-green-500", filter: EtatClasse.ACTIF },
          { icon: <Bell size={16} />,          value: loadingRequests ? "…" : totalPending, label: "Demandes en Attente", color: "#d97706", bg: "#fffbeb", ring: "ring-amber-500", filter: EtatClasse.EN_ATTENTE_APPROBATION },
        ].map(({ icon, value, label, color, bg, ring, filter }) => (
          <div key={label} onClick={() => setStatusFilter(filter)}
            className={`bg-white border border-slate-100 rounded-xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer ${statusFilter === filter ? `ring-2 ${ring}` : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-xs font-medium mb-1 truncate">{label}</p>
                <p className="text-2xl sm:text-3xl font-bold leading-none" style={{ color }}>{value}</p>
              </div>
              <div className="p-2 rounded-lg flex-shrink-0" style={{ background: bg, color }}>
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white border border-slate-100 rounded-xl p-3 sm:p-4 shadow-sm mb-4 sm:mb-6">
        {/* Row 1: search */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Rechercher une classe par nom ou niveau..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
            />
          </div>
          {(searchTerm || statusFilter !== "all" || niveauFilter !== "all") && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0">
              <X size={13} /> Effacer
            </button>
          )}
        </div>
        {/* Row 2: filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[110px]">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-7 pr-5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer outline-none">
              <option value="all">Tous les statuts</option>
              <option value={EtatClasse.ACTIF}>Actif</option>
              <option value={EtatClasse.EN_ATTENTE_APPROBATION}>En attente</option>
              <option value={EtatClasse.INACTIF}>Inactif</option>
            </select>
          </div>
          <div className="relative flex-1 min-w-[110px]">
            <select value={niveauFilter} onChange={e => { setNiveauFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer outline-none">
              <option value="all">Tous les niveaux</option>
              {uniqueNiveaux.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 flex-shrink-0">
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer outline-none">
              {[6, 12, 18, 24].map(s => <option key={s} value={s}>{s} / page</option>)}
            </select>
          </div>
        </div>
        {filtered.length > 0 && (
          <p className="text-xs text-slate-400 mt-2">
            <span className="font-semibold text-slate-600">{filtered.length}</span> classe{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ── Class grid ── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-10 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">Aucune classe trouvée</h3>
          <p className="text-sm text-slate-400">
            {searchTerm || statusFilter !== "all" || niveauFilter !== "all"
              ? "Essayez de modifier vos filtres."
              : "Vous n'avez pas encore de classes."}
          </p>
          {onNavigateToCreate && (
            <button onClick={onNavigateToCreate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              <Plus size={15} /> Créer une classe
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {paginated.map((cls) => {
              const pending = pendingRequests[cls.id] || 0;
              const studentCount = cls.eleves?.length || 0;
              return (
                <div key={cls.id}
                  className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group">

                  {/* Card top band */}
                  <div className="h-1.5 w-full"
                    style={{ background: cls.etat === EtatClasse.ACTIF ? "linear-gradient(90deg,#16a34a,#4ade80)" : cls.etat === EtatClasse.EN_ATTENTE_APPROBATION ? "linear-gradient(90deg,#d97706,#fbbf24)" : "linear-gradient(90deg,#dc2626,#f87171)" }} />

                  <div className="p-4 sm:p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                          <GraduationCap size={18} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">{cls.nom}</h3>
                          {cls.niveau && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: "#e0f7fa", color: "#00838f", border: "1px solid #b2ebf2" }}>
                              {cls.niveau}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <StatusBadge etat={cls.etat} />
                        {pending > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                            <Zap size={9} /> {pending}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {cls.dateCreation
                          ? new Date(cls.dateCreation).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                        {studentCount} élève{studentCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Établissement */}
                    {cls.etablissement?.nom && (
                      <p className="text-xs text-slate-400 mb-3 truncate">
                        🏫 {cls.etablissement.nom}
                        {cls.etablissement.localisation ? ` — ${cls.etablissement.localisation}` : ""}
                      </p>
                    )}

                    {/* Pending requests notice */}
                    {pending > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 text-xs font-semibold"
                        style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                        <Bell size={12} />
                        {pending} demande{pending > 1 ? "s" : ""} d'accès en attente
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                      <button onClick={() => onSelectClass(cls.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg,#1e3a5f,#2d6a9f)" }}>
                        <Settings size={13} /> Gérer
                      </button>
                      <button onClick={() => setEditingClass(cls)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                        <Edit size={13} /> Modifier
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {filtered.length} classe{filtered.length !== 1 ? "s" : ""} · page {safePage}/{totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button disabled={safePage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                    acc.push(p); return acc;
                  }, [])
                  .map((p, idx) => p === "…"
                    ? <span key={`e-${idx}`} className="px-1 text-xs text-slate-400">…</span>
                    : <button key={p} onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === safePage ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                        {p}
                      </button>
                  )}
                <button disabled={safePage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Edit modal ── */}
      {editingClass && (
        <ClassEditModal
          classe={editingClass}
          onClose={() => setEditingClass(null)}
          onSave={async () => { await onRefresh(); setEditingClass(null); }}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default ManageClassList;
