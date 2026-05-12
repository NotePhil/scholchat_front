import React, { useState, useEffect, useCallback } from "react";
import {
  Form, DatePicker, Select, Button, message, Spin, Badge, Modal, Popconfirm,
} from "antd";
import {
  Calendar, ClipboardList, Users, BookOpen, FileText,
  Trash2, Eye, RefreshCw, Plus, Send, Clock, CheckCircle,
  AlertCircle, ChevronRight,
} from "lucide-react";
import {
  exerciseService,
  exerciseProgrammerService,
} from "../../../../../services/exerciseService";
import { classService } from "../../../../../services/ClassService";

const { Option } = Select;

const getUserId = () =>
  sessionStorage.getItem("userId") || localStorage.getItem("userId");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

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
  const [exercises, setExercises] = useState([]);
  const [programmations, setProgrammations] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progsLoading, setProgsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [detailProg, setDetailProg] = useState(null);

  const [form] = Form.useForm();

  const userId = getUserId();

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

  const loadProgs = useCallback(async () => {
    if (!userId) return;
    setProgsLoading(true);
    try {
      const data = await exerciseProgrammerService.getExercisesProgrammesParProfesseur(userId);
      setProgrammations((data || []).sort((a, b) => new Date(b.dateExoPrevue) - new Date(a.dateExoPrevue)));
    } catch {
      message.warning("Impossible de charger les programmations");
    } finally {
      setProgsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    loadProgs();
  }, [load, loadProgs]);

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
    } catch (e) {
      message.error(e.message || "Erreur lors de la programmation");
    } finally {
      setSubmitting(false);
    }
  };

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

  const stats = {
    total: programmations.length,
    actif: programmations.filter(p => p.etat === "ACTIF" || p.etat === "PUBLIE").length,
    devoirs: programmations.filter(p => p.typeAssignation === "DEVOIR").length,
    exercices: programmations.filter(p => p.typeAssignation === "EXERCICE").length,
  };

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
              <p className="text-blue-100 text-xs">Assignez vos exercices aux classes avec dates et type</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">

        {/* ── Form ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Plus size={16} className="text-blue-600" />
              <h2 className="font-semibold text-gray-800 text-sm">Nouvelle programmation</h2>
            </div>
            <div className="p-4">
              <Form form={form} layout="vertical" onFinish={handleSubmit}>

                <Form.Item name="exerciseId" label={<span className="text-sm font-medium text-gray-700">Exercice</span>}
                  rules={[{ required: true, message: "Sélectionnez un exercice" }]}>
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

                <Form.Item name="typeAssignation" label={<span className="text-sm font-medium text-gray-700">Type d'assignation</span>}
                  initialValue="EXERCICE" rules={[{ required: true }]}>
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

                <Form.Item name="classeIds" label={<span className="text-sm font-medium text-gray-700">Classes</span>}
                  rules={[{ required: true, message: "Sélectionnez au moins une classe" }]}>
                  <Select mode="multiple" placeholder="Sélectionner les classes" size="large"
                    optionFilterProp="children">
                    {classes.map(c => (
                      <Option key={c.id} value={c.id}>
                        {c.nom}{c.niveau ? ` — ${c.niveau}` : ""}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <div className="grid grid-cols-1 gap-3">
                  <Form.Item name="dateExoPrevue" label={<span className="text-sm font-medium text-gray-700">Date prévue</span>}
                    rules={[{ required: true, message: "Requis" }]}>
                    <DatePicker style={{ width: "100%" }} showTime format="DD/MM/YYYY HH:mm" size="large" />
                  </Form.Item>
                  <Form.Item name="dateDebutExoEffectif" label={<span className="text-sm font-medium text-gray-700">Début effectif</span>}
                    rules={[{ required: true, message: "Requis" }]}>
                    <DatePicker style={{ width: "100%" }} showTime format="DD/MM/YYYY HH:mm" size="large" />
                  </Form.Item>
                  <Form.Item name="dateFinExoEffectif" label={<span className="text-sm font-medium text-gray-700">Fin effective</span>}
                    rules={[
                      { required: true, message: "Requis" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const start = getFieldValue("dateDebutExoEffectif");
                          if (!value || !start || value.isAfter(start)) return Promise.resolve();
                          return Promise.reject(new Error("Doit être après le début"));
                        },
                      }),
                    ]}>
                    <DatePicker style={{ width: "100%" }} showTime format="DD/MM/YYYY HH:mm" size="large" />
                  </Form.Item>
                </div>

                <Button type="primary" htmlType="submit" loading={submitting}
                  icon={<Send size={16} />} size="large" block
                  style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)", border: "none", borderRadius: 10, fontWeight: 600, marginTop: 8 }}>
                  Programmer et diffuser
                </Button>
              </Form>
            </div>
          </div>
        </div>

        {/* ── Programmations list ── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-blue-600" />
                <h2 className="font-semibold text-gray-800 text-sm">Programmations</h2>
                <Badge count={programmations.length} style={{ backgroundColor: "#dbeafe", color: "#2563eb", boxShadow: "none", fontWeight: 600 }} />
              </div>
              <button onClick={loadProgs} disabled={progsLoading}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                <RefreshCw size={14} className={progsLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {progsLoading ? (
              <div className="flex justify-center py-10"><Spin /></div>
            ) : programmations.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={36} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium text-sm">Aucune programmation</p>
                <p className="text-gray-400 text-xs mt-1">Utilisez le formulaire pour programmer votre premier exercice</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {programmations.map(prog => {
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
                              <EtatBadge etat={prog.etat} />
                              {isExpired && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                                  <AlertCircle size={10} /> Expiré
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
                          <button onClick={() => setDetailProg(prog)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                            <Eye size={15} />
                          </button>
                          <Popconfirm title="Supprimer cette programmation ?" onConfirm={() => handleDelete(prog.id)}
                            okText="Supprimer" cancelText="Annuler" okButtonProps={{ danger: true }}>
                            <button className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              disabled={deletingId === prog.id}>
                              {deletingId === prog.id
                                ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                : <Trash2 size={15} />}
                            </button>
                          </Popconfirm>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
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
              { label: "Exercice", value: detailProg.nom || "—" },
              { label: "Type", value: <TypeBadge type={detailProg.typeAssignation} /> },
              { label: "Statut", value: <EtatBadge etat={detailProg.etat} /> },
              { label: "Date prévue", value: fmtDateTime(detailProg.dateExoPrevue) },
              { label: "Début effectif", value: fmtDateTime(detailProg.dateDebutExoEffectif) },
              { label: "Fin effective", value: fmtDateTime(detailProg.dateFinExoEffectif) },
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExerciseProgrammerContent;
