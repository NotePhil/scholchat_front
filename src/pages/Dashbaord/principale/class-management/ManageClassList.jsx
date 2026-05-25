import React, { useState, useMemo } from "react";
import { Spin, Button, Tag, Select } from "antd";
import {
  ReloadOutlined,
  PlusCircleOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  BookOutlined,
  CrownOutlined,
  TeamOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Edit } from "lucide-react";
import { classService } from "../../../../services/ClassService";
import { message, Modal, Input, Form } from "antd";

const { Option } = Select;

// Role config
const ROLES = {
  created:    { label: "Créée par moi",       color: "#4f46e5", bg: "#eef2ff", icon: <CrownOutlined /> },
  moderator:  { label: "Modérateur assigné",  color: "#0891b2", bg: "#ecfeff", icon: <UserOutlined /> },
  publication:{ label: "Droit de publication",color: "#7c3aed", bg: "#f5f3ff", icon: <EditOutlined /> },
  member:     { label: "Membre",              color: "#64748b", bg: "#f8fafc", icon: <TeamOutlined /> },
};

const RoleBadge = ({ role }) => {
  const cfg = ROLES[role] || ROLES.member;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}22` }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

const ClassCard = ({ cls, role, onSelectClass, onEdit, canEdit }) => {
  const grantedBy = (role === "publication" || role === "moderator") && cls.moderator
    ? `${cls.moderator.prenom || ""} ${cls.moderator.nom || ""}`.trim()
    : null;

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-800 truncate">{cls.nom}</h3>
          {cls.niveau && <p className="text-xs text-slate-500 mt-0.5">{cls.niveau}</p>}
        </div>
        <Tag
          color={cls.etat === "ACTIVE" || cls.etat === "ACTIF" ? "green" : cls.etat === "ARCHIVEE" ? "orange" : "default"}
          style={{ fontSize: 11, borderRadius: 6, flexShrink: 0 }}
        >
          {cls.etat === "ACTIVE" || cls.etat === "ACTIF" ? "Actif" : cls.etat === "ARCHIVEE" ? "Archivé" : "Inactif"}
        </Tag>
      </div>

      {/* Role badge */}
      <RoleBadge role={role} />

      {/* accesMajeur indicator */}
      <div className="flex items-center gap-1.5">
        {cls.accesMajeur ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}>
            <SafetyCertificateOutlined style={{ fontSize: 10 }} /> Classe Majeure
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0" }}>
            Accès standard
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="space-y-0.5">
        {grantedBy && (
          <p className="text-xs text-slate-400 truncate">Par : {grantedBy}</p>
        )}
        {cls.etablissement?.nom && (
          <p className="text-xs text-slate-400 truncate">{cls.etablissement.nom}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1 border-t border-slate-50">
        <Button
          type="primary"
          size="small"
          onClick={() => onSelectClass(cls.id)}
          style={{ borderRadius: 6, flex: 1, background: "#4f46e5", borderColor: "#4f46e5" }}
        >
          Gérer
        </Button>
        {canEdit && (
          <Button
            size="small"
            icon={<Edit size={13} />}
            onClick={() => onEdit(cls)}
            style={{ borderRadius: 6 }}
          >
            Modifier
          </Button>
        )}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const ManageClassList = ({
  classes = [],
  publicationClasses = [],
  assignedModeratorClasses = [],
  moderatedClasses = [],
  loading = false,
  refreshing = false,
  onSelectClass,
  onRefresh,
  onBack,
  onNavigateToCreate,
  currentUserId = "",
  currentUserRole = "",
  externalSearch = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [niveauFilter, setNiveauFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [editingClass, setEditingClass] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();

  const activeSearch = externalSearch || searchTerm;

  const isCreatorOrAdmin = (cls) => {
    const role = (currentUserRole || "").toUpperCase();
    if (role.includes("ADMIN")) return true;
    if (!currentUserId) return false;
    return cls.createurId === currentUserId || cls.creatorId === currentUserId || cls.createur_id === currentUserId;
  };

  // Merge all into flat list with role tag
  const allClasses = useMemo(() => [
    ...moderatedClasses.map(c => ({ ...c, _role: "created" })),
    ...assignedModeratorClasses.map(c => ({ ...c, _role: "moderator" })),
    ...publicationClasses.map(c => ({ ...c, _role: "publication" })),
    ...classes.map(c => ({ ...c, _role: "member" })),
  ], [moderatedClasses, assignedModeratorClasses, publicationClasses, classes]);

  const niveaux = useMemo(() => {
    const set = new Set(allClasses.map(c => c.niveau).filter(Boolean));
    return Array.from(set).sort();
  }, [allClasses]);

  const filtered = useMemo(() => {
    const q = activeSearch.toLowerCase();
    return allClasses.filter(cls => {
      const matchSearch = !q || cls.nom?.toLowerCase().includes(q) || cls.niveau?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || cls.etat === statusFilter;
      const matchNiveau = niveauFilter === "all" || cls.niveau === niveauFilter;
      const matchRole = roleFilter === "all" || cls._role === roleFilter;
      return matchSearch && matchStatus && matchNiveau && matchRole;
    });
  }, [allClasses, activeSearch, statusFilter, niveauFilter, roleFilter]);

  const hasActiveFilter = statusFilter !== "all" || niveauFilter !== "all" || roleFilter !== "all" || searchTerm;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setNiveauFilter("all");
    setRoleFilter("all");
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      await classService.modifierClasse(editingClass.id, values);
      message.success("Classe modifiée avec succès");
      setEditingClass(null);
      editForm.resetFields();
      if (onRefresh) onRefresh();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.message || "Erreur lors de la modification");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    editForm.setFieldsValue({ nom: cls.nom, niveau: cls.niveau, description: cls.description, codeActivation: cls.codeActivation });
  };

  if (loading) {
    return <div className="flex justify-center items-center py-16"><Spin size="large" /></div>;
  }

  return (
    <div className="manage-class-list">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button icon={<ArrowLeftOutlined />} onClick={onBack} size="small" style={{ borderRadius: 8 }}>
              Retour
            </Button>
          )}
          <h2 className="text-base font-semibold text-slate-800 m-0">
            Mes classes
            {filtered.length !== allClasses.length && (
              <span className="ml-2 text-sm font-normal text-slate-500">({filtered.length} / {allClasses.length})</span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<ReloadOutlined spin={refreshing} />} onClick={onRefresh} size="small" loading={refreshing} style={{ borderRadius: 8 }}>
            Actualiser
          </Button>
          {onNavigateToCreate && (
            <Button type="primary" icon={<PlusCircleOutlined />} onClick={onNavigateToCreate} size="small"
              style={{ borderRadius: 8, background: "#4f46e5", borderColor: "#4f46e5" }}>
              Créer une classe
            </Button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      {!externalSearch && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <input
            type="text"
            placeholder="Filtrer par nom ou niveau..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[180px] px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <Select size="small" value={roleFilter} onChange={setRoleFilter} style={{ minWidth: 160 }}>
            <Option value="all">Tous les rôles</Option>
            <Option value="created">Créée par moi</Option>
            <Option value="moderator">Modérateur assigné</Option>
            <Option value="publication">Droit de publication</Option>
            <Option value="member">Membre</Option>
          </Select>
          <Select size="small" value={statusFilter} onChange={setStatusFilter} style={{ minWidth: 130 }}>
            <Option value="all">Tous les statuts</Option>
            <Option value="ACTIF">Actif</Option>
            <Option value="INACTIF">Inactif</Option>
            <Option value="ARCHIVEE">Archivé</Option>
          </Select>
          {niveaux.length > 0 && (
            <Select size="small" value={niveauFilter} onChange={setNiveauFilter} style={{ minWidth: 120 }}>
              <Option value="all">Tous les niveaux</Option>
              {niveaux.map(n => <Option key={n} value={n}>{n}</Option>)}
            </Select>
          )}
          {hasActiveFilter && (
            <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 bg-white">
              Effacer
            </button>
          )}
        </div>
      )}

      {/* ── Grid ── */}
      {allClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOutlined style={{ fontSize: 48, color: "#cbd5e1", marginBottom: 16 }} />
          <p className="text-slate-500 text-base font-medium mb-1">Vous n'avez pas encore de classe</p>
          <p className="text-slate-400 text-sm mb-4">Créez votre première classe ou rejoignez-en une via le bouton ci-dessus.</p>
          {onNavigateToCreate && (
            <Button type="primary" icon={<PlusCircleOutlined />} onClick={onNavigateToCreate}
              style={{ borderRadius: 8, background: "#4f46e5", borderColor: "#4f46e5" }}>
              Créer une classe
            </Button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOutlined style={{ fontSize: 48, color: "#cbd5e1", marginBottom: 16 }} />
          <p className="text-slate-500 text-base font-medium mb-1">Aucune classe trouvée</p>
          {hasActiveFilter && (
            <button onClick={clearFilters} className="text-sm text-indigo-600 hover:underline mt-2">Réinitialiser les filtres</button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(cls => (
            <ClassCard
              key={cls.id}
              cls={cls}
              role={cls._role}
              onSelectClass={onSelectClass}
              onEdit={handleEdit}
              canEdit={isCreatorOrAdmin(cls)}
            />
          ))}
        </div>
      )}

      {/* ── Edit modal ── */}
      <Modal
        title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><EditOutlined style={{ color: "#4f46e5" }} /><span>Modifier — {editingClass?.nom}</span></div>}
        open={!!editingClass}
        onCancel={() => { setEditingClass(null); editForm.resetFields(); }}
        onOk={handleEditSubmit}
        okText="Enregistrer"
        cancelText="Annuler"
        confirmLoading={editLoading}
        okButtonProps={{ style: { background: "#4f46e5", borderColor: "#4f46e5", borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={480}
        centered
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="nom" label="Nom de la classe" rules={[{ required: true, message: "Le nom est obligatoire" }]}>
            <Input placeholder="Nom de la classe" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="niveau" label="Niveau">
            <Input placeholder="Ex: 3ème, Terminale..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Description de la classe..." rows={3} style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="codeActivation" label="Code d'activation">
            <Input placeholder="Code d'activation" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageClassList;
