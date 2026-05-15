import React, { useState, useMemo } from "react";
import { Spin, Button, Tag, Select } from "antd";
import {
  ReloadOutlined,
  PlusCircleOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { Edit } from "lucide-react";
import { classService } from "../../../../services/ClassService";
import { message, Modal, Input, Form } from "antd";

const { Option } = Select;

const ManageClassList = ({
  classes = [],
  loading = false,
  error = "",
  successMessage = "",
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

  // Edit modal state
  const [editingClass, setEditingClass] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();

  // Use external search when provided, fall back to internal
  const activeSearch = externalSearch || searchTerm;

  // Only the class CREATOR or an admin can modify class info
  const isCreatorOrAdmin = (cls) => {
    const role = (currentUserRole || "").toUpperCase();
    if (role.includes("ADMIN")) return true;
    if (!currentUserId) return false;
    return (
      cls.createurId === currentUserId ||
      cls.utilisateurId === currentUserId ||
      cls.createur_id === currentUserId
    );
  };

  const hasActiveFilter = statusFilter !== "all" || niveauFilter !== "all" || searchTerm;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setNiveauFilter("all");
  };

  // Unique levels for filter dropdown
  const niveaux = useMemo(() => {
    const set = new Set((classes || []).map((c) => c.niveau).filter(Boolean));
    return Array.from(set).sort();
  }, [classes]);

  const filtered = useMemo(() => {
    const q = activeSearch.toLowerCase();
    return (classes || []).filter((cls) => {
      const matchSearch =
        !q ||
        cls.nom?.toLowerCase().includes(q) ||
        cls.niveau?.toLowerCase().includes(q) ||
        cls.codeActivation?.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" || cls.etat === statusFilter;
      const matchNiveau =
        niveauFilter === "all" || cls.niveau === niveauFilter;
      return matchSearch && matchStatus && matchNiveau;
    });
  }, [classes, activeSearch, statusFilter, niveauFilter]);

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
      if (err?.errorFields) return; // validation error
      message.error(err?.message || "Erreur lors de la modification");
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spin size="large" tip="Chargement des classes..." />
      </div>
    );
  }

  return (
    <div className="manage-class-list">
      {/* Header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              size="small"
              style={{ borderRadius: 8 }}
            >
              Retour
            </Button>
          )}
          <h2 className="text-base font-semibold text-slate-800 m-0">
            Mes classes
            {filtered.length !== classes.length && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({filtered.length} / {classes.length})
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={onRefresh}
            size="small"
            loading={refreshing}
            style={{ borderRadius: 8 }}
          >
            Actualiser
          </Button>
          {onNavigateToCreate && (
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={onNavigateToCreate}
              size="small"
              style={{
                borderRadius: 8,
                background: "#4f46e5",
                borderColor: "#4f46e5",
              }}
            >
              Créer une classe
            </Button>
          )}
        </div>
      </div>

      {/* Internal filters — hidden when external search is active */}
      {!externalSearch && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Filtrer mes classes par nom ou niveau..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <Select
            size="small"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ minWidth: 130, borderRadius: 8 }}
          >
            <Option value="all">Tous les statuts</Option>
            <Option value="ACTIVE">Actif</Option>
            <Option value="INACTIVE">Inactif</Option>
            <Option value="ARCHIVEE">Archivé</Option>
          </Select>
          {niveaux.length > 0 && (
            <Select
              size="small"
              value={niveauFilter}
              onChange={setNiveauFilter}
              style={{ minWidth: 120, borderRadius: 8 }}
            >
              <Option value="all">Tous les niveaux</Option>
              {niveaux.map((n) => (
                <Option key={n} value={n}>
                  {n}
                </Option>
              ))}
            </Select>
          )}
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 bg-white"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOutlined style={{ fontSize: 48, color: "#cbd5e1", marginBottom: 16 }} />
          {classes.length === 0 ? (
            <>
              <p className="text-slate-500 text-base font-medium mb-1">
                Vous n'avez pas encore de classe
              </p>
              <p className="text-slate-400 text-sm mb-4">
                Créez votre première classe ou rejoignez-en une via la recherche ci-dessus.
              </p>
              {onNavigateToCreate && (
                <Button
                  type="primary"
                  icon={<PlusCircleOutlined />}
                  onClick={onNavigateToCreate}
                  style={{
                    borderRadius: 8,
                    background: "#4f46e5",
                    borderColor: "#4f46e5",
                  }}
                >
                  Créer une classe
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-slate-500 text-base font-medium mb-1">
                Aucune classe trouvée
              </p>
              <p className="text-slate-400 text-sm mb-4">
                {activeSearch || statusFilter !== "all" || niveauFilter !== "all"
                  ? "Essayez de modifier vos filtres ou votre recherche."
                  : "Aucune classe disponible."}
              </p>
              {(activeSearch || hasActiveFilter) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cls) => (
            <div
              key={cls.id}
              className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3"
            >
              {/* Class header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-800 truncate">
                    {cls.nom}
                  </h3>
                  {cls.niveau && (
                    <p className="text-xs text-slate-500 mt-0.5">{cls.niveau}</p>
                  )}
                </div>
                <Tag
                  color={
                    cls.etat === "ACTIVE" || cls.etat === "ACTIF"
                      ? "green"
                      : cls.etat === "ARCHIVEE"
                      ? "orange"
                      : "default"
                  }
                  style={{ fontSize: 11, borderRadius: 6 }}
                >
                  {cls.etat === "ACTIVE" || cls.etat === "ACTIF"
                    ? "Actif"
                    : cls.etat === "ARCHIVEE"
                    ? "Archivé"
                    : "Inactif"}
                </Tag>
              </div>

              {/* Meta info */}
              <div className="space-y-1">
                {cls.etablissement?.nom && (
                  <p className="text-xs text-slate-500 truncate">
                    {cls.etablissement.nom}
                  </p>
                )}
                {cls.codeActivation && (
                  <p className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                    Code : {cls.codeActivation}
                  </p>
                )}
                {cls.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {cls.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto pt-1 border-t border-slate-50">
                <Button
                  type="primary"
                  size="small"
                  onClick={() => onSelectClass(cls.id)}
                  style={{
                    borderRadius: 6,
                    flex: 1,
                    background: "#4f46e5",
                    borderColor: "#4f46e5",
                  }}
                >
                  Gérer
                </Button>

                {isCreatorOrAdmin(cls) && (
                  <Button
                    size="small"
                    icon={<Edit size={13} />}
                    onClick={() => {
                      setEditingClass(cls);
                      editForm.setFieldsValue({
                        nom: cls.nom,
                        niveau: cls.niveau,
                        description: cls.description,
                        codeActivation: cls.codeActivation,
                      });
                    }}
                    style={{ borderRadius: 6 }}
                  >
                    Modifier
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Class Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <EditOutlined style={{ color: "#4f46e5" }} />
            <span>Modifier la classe — {editingClass?.nom}</span>
          </div>
        }
        open={!!editingClass}
        onCancel={() => {
          setEditingClass(null);
          editForm.resetFields();
        }}
        onOk={handleEditSubmit}
        okText="Enregistrer"
        cancelText="Annuler"
        confirmLoading={editLoading}
        okButtonProps={{
          style: { background: "#4f46e5", borderColor: "#4f46e5", borderRadius: 8 },
        }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={480}
        centered
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nom"
            label="Nom de la classe"
            rules={[{ required: true, message: "Le nom est obligatoire" }]}
          >
            <Input placeholder="Nom de la classe" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="niveau" label="Niveau">
            <Input placeholder="Ex: 3ème, Terminale..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea
              placeholder="Description de la classe..."
              rows={3}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          <Form.Item name="codeActivation" label="Code d'activation">
            <Input
              placeholder="Code d'activation"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageClassList;
