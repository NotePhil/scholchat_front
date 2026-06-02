import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Form, DatePicker, Select, Button, message, Spin, Badge, Modal, Popconfirm,
} from "antd";
import {
  Calendar, ClipboardList, Users, BookOpen, FileText,
  Trash2, Eye, RefreshCw, Plus, Send, Clock, CheckCircle,
  AlertCircle, ChevronRight, ArrowLeft, Filter, Search,
} from "lucide-react";
import {
  exerciseService,
  exerciseProgrammerService,
} from "../../../../../services/exerciseService";
import { classService } from "../../../../../services/ClassService";
import { userService } from "../../../../../services/userService";

const { Option } = Select;

const getUserId = () =>
  sessionStorage.getItem("userId") || localStorage.getItem("userId");

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const TYPE_CONFIG = {
  EXERCICE: { label: "Exercice libre", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: <BookOpen size={12} /> },
  DEVOIR:   { label: "Devoir",         color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", icon: <FileText size={12} /> },
};

const ETAT_CONFIG = {
  ACTIF:     { label: "Actif",     color: "#16a34a", bg: "#f0fdf4" },
  PUBLIE:    { label: "Publié",    color: "#2563eb", bg: "#eff6ff" },
  BROUILLON: { label: "Brouillon", color: "#d97706", bg: "#fffbeb" },
  INACTIF:   { label: "Inactif",   color: "#6b7280", bg: "#f9fafb" },
  EXPIRE:    { label: "Expiré",    color: "#991b1b", bg: "#fef2f2" },
};

// Returns effective display status: if end date passed and was active, show Expiré
const getEffectiveEtat = (prog) => {
  if ((prog.etat === "ACTIF" || prog.etat === "PUBLIE") && prog.dateFinExoEffectif) {
    if (new Date(prog.dateFinExoEffectif) < new Date()) return "EXPIRE";
  }
  return prog.etat;
};

const TypeBadge = ({ type }) => {
  const c = TYPE_CONFIG[type] || TYPE_CONFIG.EXERCICE;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      {c.icon} {c.label}
    </span>
  );
};

const EtatBadge = ({ etat }) => {
  const c = ETAT_CONFIG[etat] || ETAT_CONFIG.INACTIF;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: c.color, background: c.bg }}>
      {c.label}
    </span>
  );
};

const ExerciseProgrammerContent = () => {
  const location = useLocation();

  // ── Data state ──
  const [exercises, setExercises] = useState([]);
  const [programmations, setProgrammations] = useState([]);
  const [classes, setClasses] = useState([]);

  // ── Loading state ──
  const [loading, setLoading] = useState(true);
  const [progsLoading, setProgsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ── UI state ──
  const [view, setView] = useState("list"); // "list" | "form"
  const [detailProg, setDetailProg] = useState(null);
  const [filterClassId, setFilterClassId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // "" | "ACTIF" | "EXPIRE" | "BROUILLON" | "INACTIF"
  const [filterType, setFilterType] = useState(""); // "" | "EXERCICE" | "DEVOIR"

  // ── Pagination ──
  const PAGE_SIZE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const [form] = Form.useForm();
  const userId = getUserId();

  // ── Load exercises and classes (for form dropdowns) ──
  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [exos, cls] = await Promise.all([
        exerciseService.getExercisesByProfesseur(userId),
        classService.obtenirClassesUtilisateur(userId),
      ]);
      setExercises(exos || []);
      setClasses(cls || []);
    } catch {
      message.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ── Load programmations ──
  const loadProgs = useCallback(async () => {
    if (!userId) return;
    setProgsLoading(true);
    try {
      // Fetch all accessible classes (publication rights + acceder)
      const allClasses = await classService.obtenirClassesUtilisateur(userId);
      const classIdsToFetch = (allClasses || []).map(c => c.id);

      // Fetch own programmations + all accessible class programmations in parallel
      const [ownResult, ...classResults] = await Promise.allSettled([
        exerciseProgrammerService.getExercisesProgrammesParProfesseur(userId),
        ...classIdsToFetch.map(cId =>
          exerciseProgrammerService.getExercisesProgrammesParClasse(cId)
        ),
      ]);

      const ownItems = ownResult.status === "fulfilled" ? (ownResult.value || []) : [];
      const classItems = classResults
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value || []);

      // Merge by programmer record ID — class items first so other professors' entries are included
      const merged = new Map();
      [...classItems, ...ownItems].forEach(p => {
        if (p?.id) merged.set(String(p.id), {
          ...p,
          // Flag: true if this professor programmed it
          isOwn: String(p.programmeParId) === String(userId),
        });
      });

      // Resolve professor names for non-own records
      const nonOwnIds = [...new Set(
        Array.from(merged.values())
          .filter(p => !p.isOwn && p.programmeParId)
          .map(p => String(p.programmeParId))
      )];
      const professorNames = {};
      await Promise.allSettled(
        nonOwnIds.map(async (profId) => {
          try {
            const user = await userService.getUserById(profId);
            if (user) {
              professorNames[profId] = `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email || profId;
            }
          } catch { /* ignore */ }
        })
      );

      // Attach professor name to each non-own record
      merged.forEach((p, key) => {
        if (!p.isOwn && p.programmeParId) {
          merged.set(key, { ...p, programmeParNom: professorNames[String(p.programmeParId)] || null });
        }
      });

      const sorted = Array.from(merged.values())
        .sort((a, b) => new Date(b.dateExoPrevue) - new Date(a.dateExoPrevue));

      setProgrammations(sorted);
    } catch {
      message.warning("Impossible de charger les programmations");
    } finally {
      setProgsLoading(false);
    }
  }, [userId]);

  // ── On mount: read classId from URL query param ──
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryClassId = searchParams.get("classId");
    if (queryClassId) setFilterClassId(queryClassId);
    load();
    loadProgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── When URL query param changes (already mounted, same tab) ──
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryClassId = searchParams.get("classId");
    if (queryClassId && queryClassId !== filterClassId) {
      setFilterClassId(queryClassId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // ── Submit form ──
  const handleSubmit = async (values) => {
    if (!userId) { message.error("Utilisateur non connecté"); return; }
    setSubmitting(true);
    try {
      const payload = {
        exerciseId: values.exerciseId,
        programmeParId: userId,
        typeAssignation: values.typeAssignation,
        dateExoPrevue: values.dateExoPrevue.toISOString(),
        dateDebutExoEffectif: values.dateDebutExoEffectif.toISOString(),
        dateFinExoEffectif: values.dateFinExoEffectif.toISOString(),
        classeIds: values.classeIds || [],
        etat: "ACTIF",
      };
      await exerciseProgrammerService.programmerEtDiffuserExercise(payload);
      message.success("Exercice programmé et diffusé avec succès !");
      form.resetFields();
      await loadProgs();
      setView("list");
    } catch (e) {
      message.error(e.message || "Erreur lors de la programmation");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await exerciseProgrammerService.supprimerExerciseProgramme(id);
      message.success("Programmation supprimée");
      setProgrammations(prev => prev.filter(p => p.id !== id));
    } catch {
      message.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Filtered list ──
  const filtered = programmations.filter(prog => {
    const matchClass = !filterClassId || (
      Array.isArray(prog.classesDiffusees) &&
      prog.classesDiffusees.some(c => String(c.id) === String(filterClassId))
    );
    const matchSearch = !searchTerm || (
      (prog.nom || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    const effectiveEtat = getEffectiveEtat(prog);
    const matchStatus = !filterStatus || effectiveEtat === filterStatus;
    const matchType = !filterType || prog.typeAssignation === filterType;
    return matchClass && matchSearch && matchStatus && matchType;
  });

  // Reset to page 1 when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = (setter) => (val) => {
    setter(val);
    setCurrentPage(1);
  };

  // ── Stats (always computed on full programmations, not filtered) ──
  const stats = {
    total: programmations.length,
    actif: programmations.filter(p => getEffectiveEtat(p) === "ACTIF" || getEffectiveEtat(p) === "PUBLIE").length,
    devoirs: programmations.filter(p => p.typeAssignation === "DEVOIR").length,
    exercices: programmations.filter(p => p.typeAssignation === "EXERCICE").length,
  };

  const selectedClassName = filterClassId
    ? (classes.find(c => String(c.id) === String(filterClassId))?.nom || "")
    : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // FORM VIEW
  // ════════════════════════════════════════════
  if (view === "form") {
    return (
      <div className="w-full px-2 py-3">
        {/* Header */}
        <div className="bg-white rounded-xl shadow overflow-hidden mb-4">
          <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex items-center gap-3">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            <button
              onClick={() => { setView("list"); form.resetFields(); }}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors flex-shrink-0"
            >
              <ArrowLeft size={15} /> Retour
            </button>
            <div className="relative flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Plus size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-white leading-tight">Nouvelle programmation</h1>
                <p className="text-purple-100 text-xs">Assignez un exercice à vos classes avec dates et type</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <ClipboardList size={16} className="text-purple-600" />
              <h2 className="font-semibold text-gray-800 text-sm">Détails de la programmation</h2>
            </div>
            <div className="p-5">
              <Form form={form} layout="vertical" onFinish={handleSubmit}>

                <Form.Item
                  name="exerciseId"
                  label={<span className="text-sm font-medium text-gray-700">Exercice</span>}
                  rules={[{ required: true, message: "Sélectionnez un exercice" }]}
                >
                  <Select placeholder="Choisir un exercice" showSearch optionFilterProp="children" size="large">
                    {exercises.map(e => (
                      <Option key={e.id} value={e.id}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{e.nom}</span>
                          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{e.niveau}</span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="typeAssignation"
                  label={<span className="text-sm font-medium text-gray-700">Type d'assignation</span>}
                  initialValue="EXERCICE"
                  rules={[{ required: true }]}
                >
                  <Select size="large">
                    <Option value="EXERCICE">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-blue-600" />
                        <div>
                          <div className="font-medium text-sm">Exercice libre</div>
                          <div className="text-xs text-gray-400">Auto-corrigé, résultat immédiat</div>
                        </div>
                      </div>
                    </Option>
                    <Option value="DEVOIR">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-purple-600" />
                        <div>
                          <div className="font-medium text-sm">Devoir</div>
                          <div className="text-xs text-gray-400">Correction manuelle du professeur</div>
                        </div>
                      </div>
                    </Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="classeIds"
                  label={<span className="text-sm font-medium text-gray-700">Classes</span>}
                  rules={[{ required: true, message: "Sélectionnez au moins une classe" }]}
                >
                  <Select mode="multiple" placeholder="Sélectionner les classes" size="large" optionFilterProp="children">
                    {classes.map(c => (
                      <Option key={c.id} value={c.id}>
                        {c.nom}{c.niveau ? ` — ${c.niveau}` : ""}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Form.Item
                    name="dateExoPrevue"
                    label={<span className="text-sm font-medium text-gray-700">Date prévue</span>}
                    rules={[{ required: true, message: "Requis" }]}
                  >
                    <DatePicker style={{ width: "100%" }} showTime format="DD/MM/YYYY HH:mm" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="dateDebutExoEffectif"
                    label={<span className="text-sm font-medium text-gray-700">Début effectif</span>}
                    rules={[{ required: true, message: "Requis" }]}
                  >
                    <DatePicker style={{ width: "100%" }} showTime format="DD/MM/YYYY HH:mm" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="dateFinExoEffectif"
                    label={<span className="text-sm font-medium text-gray-700">Fin effective</span>}
                    rules={[
                      { required: true, message: "Requis" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const start = getFieldValue("dateDebutExoEffectif");
                          if (!value || !start || value.isAfter(start)) return Promise.resolve();
                          return Promise.reject(new Error("Doit être après le début"));
                        },
                      }),
                    ]}
                  >
                    <DatePicker style={{ width: "100%" }} showTime format="DD/MM/YYYY HH:mm" size="large" />
                  </Form.Item>
                </div>

                <div className="flex gap-3 mt-2">
                  <Button
                    onClick={() => { setView("list"); form.resetFields(); }}
                    size="large"
                    style={{ borderRadius: 10, flex: 1 }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    icon={<Send size={16} />}
                    size="large"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)", border: "none", borderRadius: 10, fontWeight: 600, flex: 2 }}
                  >
                    Programmer et diffuser
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // LIST VIEW (default)
  // ════════════════════════════════════════════
  return (
    <div className="w-full px-2 py-3">

      {/* ── Header ── */}
      <div className="bg-white rounded-xl shadow overflow-hidden mb-3">
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          <div className="relative flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white leading-tight truncate">Programmer les Exercices</h1>
              <p className="text-blue-100 text-xs">
                {selectedClassName
                  ? `Classe : ${selectedClassName}`
                  : "Assignez vos exercices aux classes avec dates et type"}
              </p>
            </div>
          </div>
          <div className="relative flex items-center gap-4 sm:gap-5 flex-shrink-0">
            {[
              { label: "Total",   value: stats.total,     color: "#93c5fd" },
              { label: "Actifs",  value: stats.actif,     color: "#86efac" },
              { label: "Libres",  value: stats.exercices, color: "#67e8f9" },
              { label: "Devoirs", value: stats.devoirs,   color: "#c4b5fd" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className="text-lg font-bold" style={{ color }}>{value}</div>
                <div className="text-xs text-blue-200">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters + action bar ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 mb-3 flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Rechercher par nom d'exercice..."
              className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={loadProgs}
            disabled={progsLoading}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 flex-shrink-0"
            title="Actualiser"
          >
            <RefreshCw size={14} className={progsLoading ? "animate-spin" : ""} />
          </button>

          {/* New programmation button */}
          <button
            onClick={() => setView("form")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
          >
            <Plus size={15} />
            Programmer un exercice
          </button>
        </div>

        {/* Second row: class + status + type filters */}
        <div className="flex flex-wrap gap-2">
          {/* Class filter */}
          <div className="relative min-w-[160px]">
            <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
            <select
              value={filterClassId}
              onChange={e => handleFilterChange(setFilterClassId)(e.target.value)}
              className="w-full pl-7 pr-6 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">Toutes les classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          {/* Status filter */}
          <div className="relative min-w-[150px]">
            <CheckCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
            <select
              value={filterStatus}
              onChange={e => handleFilterChange(setFilterStatus)(e.target.value)}
              className="w-full pl-7 pr-6 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="PUBLIE">Publié</option>
              <option value="EXPIRE">Expiré</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="INACTIF">Inactif</option>
            </select>
            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          {/* Type filter */}
          <div className="relative min-w-[140px]">
            <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
            <select
              value={filterType}
              onChange={e => handleFilterChange(setFilterType)(e.target.value)}
              className="w-full pl-7 pr-6 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">Tous les types</option>
              <option value="EXERCICE">Exercice libre</option>
              <option value="DEVOIR">Devoir</option>
            </select>
            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
          </div>

          {/* Active filter chips */}
          {(filterStatus || filterType || filterClassId || searchTerm) && (
            <button
              onClick={() => {
                setFilterStatus("");
                setFilterType("");
                setFilterClassId("");
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors font-medium"
            >
              <AlertCircle size={12} /> Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* ── List ── */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800 text-sm">Programmations</h2>
            <Badge
              count={filtered.length}
              style={{ backgroundColor: "#dbeafe", color: "#2563eb", boxShadow: "none", fontWeight: 600 }}
            />
            {filtered.length !== programmations.length && (
              <span className="text-xs text-gray-400">sur {programmations.length}</span>
            )}
            {filterClassId && selectedClassName && (
              <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">
                {selectedClassName}
              </span>
            )}
            {filterStatus && (
              <EtatBadge etat={filterStatus} />
            )}
            {filterType && (
              <TypeBadge type={filterType} />
            )}
          </div>
        </div>

        {progsLoading ? (
          <div className="flex justify-center py-10"><Spin /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-medium text-sm">
              {filterClassId ? "Aucune programmation pour cette classe" : "Aucune programmation"}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Cliquez sur « Programmer un exercice » pour commencer
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {paged.map(prog => {
              const exo = exercises.find(e => e.id === prog.exerciseId) || {};
              const now = new Date();
              const fin = prog.dateFinExoEffectif ? new Date(prog.dateFinExoEffectif) : null;
              const isExpired = fin && fin < now;

              return (
                <div key={prog.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: prog.typeAssignation === "DEVOIR" ? "#f5f3ff" : "#eff6ff" }}>
                        {prog.typeAssignation === "DEVOIR"
                          ? <FileText size={18} style={{ color: "#7c3aed" }} />
                          : <BookOpen size={18} style={{ color: "#2563eb" }} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-900 text-sm truncate">
                            {prog.nom || exo.nom || "Exercice"}
                          </span>
                          <TypeBadge type={prog.typeAssignation} />
                          <EtatBadge etat={getEffectiveEtat(prog)} />
                          {/* Ownership banner */}
                          {prog.isOwn ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              <CheckCircle size={10} /> Votre programmation
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                              <Users size={10} /> Autre professeur
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {fmtDateTime(prog.dateDebutExoEffectif)}
                          </span>
                          <ChevronRight size={11} className="text-gray-300" />
                          <span>{fmtDateTime(prog.dateFinExoEffectif)}</span>
                        </div>
                        {prog.classesDiffusees?.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <Users size={11} className="text-gray-400" />
                            {prog.classesDiffusees.map(c => (
                              <span key={c.id} className="px-1.5 py-0.5 rounded text-xs bg-cyan-50 text-cyan-700 border border-cyan-100">
                                {c.nom}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setDetailProg(prog)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                      {/* Delete only for own programmations */}
                      {prog.isOwn && (
                        <Popconfirm
                          title="Supprimer cette programmation ?"
                          onConfirm={() => handleDelete(prog.id)}
                          okText="Supprimer"
                          cancelText="Annuler"
                          okButtonProps={{ danger: true }}
                        >
                          <button
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            disabled={deletingId === prog.id}
                          >
                            {deletingId === prog.id
                              ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                              : <Trash2 size={15} />}
                          </button>
                        </Popconfirm>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {!progsLoading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} · page {safePage}/{totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                ‹ Préc.
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} className="px-1.5 text-xs text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                        p === safePage
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-gray-200 hover:bg-white hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                Suiv. ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail modal ── */}
      <Modal
        open={!!detailProg}
        onCancel={() => setDetailProg(null)}
        footer={<Button onClick={() => setDetailProg(null)}>Fermer</Button>}
        title={
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <span>Détail de la programmation</span>
          </div>
        }
        width={520}
      >
        {detailProg && (
          <div className="space-y-3 pt-2">
            {[
              { label: "Exercice",       value: detailProg.nom || "—" },
              { label: "Type",           value: <TypeBadge type={detailProg.typeAssignation} /> },
              { label: "Statut",         value: <EtatBadge etat={getEffectiveEtat(detailProg)} /> },
              { label: "Date prévue",    value: fmtDateTime(detailProg.dateExoPrevue) },
              { label: "Début effectif", value: fmtDateTime(detailProg.dateDebutExoEffectif) },
              { label: "Fin effective",  value: fmtDateTime(detailProg.dateFinExoEffectif) },
              {
                label: "Classes",
                value: detailProg.classesDiffusees?.length > 0
                  ? detailProg.classesDiffusees.map(c => c.nom).join(", ")
                  : "Aucune",
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-32 flex-shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-gray-800">{value}</span>
              </div>
            ))}
            {/* Show professor name only for non-own programmations */}
            {!detailProg.isOwn && (
              <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-32 flex-shrink-0 pt-0.5">Programmé par</span>
                <span className="text-sm text-amber-700 font-medium flex items-center gap-1">
                  <Users size={13} className="text-amber-500" />
                  {detailProg.programmeParNom || "Autre professeur"}
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExerciseProgrammerContent;
