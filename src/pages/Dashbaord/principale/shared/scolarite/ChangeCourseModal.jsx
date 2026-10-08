import React, { useEffect, useState } from "react";
import { Alert, Modal, Select, message } from "antd";
import scolariteService from "../../../../../services/scolariteService";
import { loadCommonCourseOptions } from "../../../../../utils/scolarite";
import NoCourseNotice from "./NoCourseNotice";

/**
 * Change the course of a programmed exercise. A course is required: there is no
 * "without course" option (the backend answers 400 COURS_REQUIS).
 * prog: { id, titre|nom, coursId, classes|classesDiffusees:[{id}] }; classIds overrides the classes.
 * The spinner stays until the PATCH settles; errors stay inside the modal.
 */
const ChangeCourseModal = ({ open, prog, classIds, onClose, onChanged }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const ids = classIds || (prog?.classes || prog?.classesDiffusees || []).map((c) => c.id);
  const idsKey = ids.join(",");

  useEffect(() => {
    if (!open || !prog) return;
    setError(null);
    setValue(prog.coursId || undefined);
    setLoading(true);
    loadCommonCourseOptions(idsKey ? idsKey.split(",") : [])
      .then(setOptions)
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [open, prog, idsKey]);

  const handleOk = async () => {
    if (!prog) return;
    if (!value) {
      setError(
        options.length === 0
          ? "Aucun cours programmé dans cette classe — programmez d'abord un cours."
          : "Choisissez le cours auquel rattacher cet exercice.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const coursId = value;
      const updated = await scolariteService.changerCoursExerciseProgramme(prog.id, coursId);
      const titre = options.find((o) => String(o.coursId) === String(coursId))?.titre || null;
      onClose?.();
      message.success(`Exercice rattaché au cours « ${titre || "sélectionné"} »`);
      onChanged?.({ ...(updated || {}), id: prog.id, coursId, coursTitre: updated?.coursTitre ?? titre });
    } catch (e) {
      setError(
        e.code === "COURS_REQUIS"
          ? e.message || "Choisissez le cours auquel rattacher cet exercice."
          : e.message || "Impossible de modifier le cours",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Changer le cours de l'exercice"
      okText="Enregistrer"
      cancelText="Annuler"
      onOk={handleOk}
      onCancel={saving ? undefined : onClose}
      okButtonProps={{ loading: saving, disabled: loading || !value }}
      cancelButtonProps={{ disabled: saving }}
      maskClosable={!saving}
      closable={!saving}
      destroyOnHidden
    >
      <p className="text-sm text-gray-600 mb-3">
        <strong>{prog?.titre || prog?.nom || "Exercice"}</strong>
      </p>
      <Select
        style={{ width: "100%" }}
        value={value}
        onChange={(v) => {
          setValue(v);
          setError(null);
        }}
        loading={loading}
        disabled={saving || (!loading && options.length === 0)}
        placeholder="Choisissez le cours"
        showSearch
        optionFilterProp="label"
        options={options.map((c) => ({ value: c.coursId, label: c.matiere ? `${c.titre} — ${c.matiere}` : c.titre }))}
      />
      {!loading && options.length === 0 && (
        <p className="mt-2">
          <NoCourseNotice classeId={ids.length === 1 ? ids[0] : undefined} onNavigate={onClose} />
        </p>
      )}
      {error && <Alert type="error" showIcon title={error} style={{ marginTop: 12 }} />}
    </Modal>
  );
};

export default ChangeCourseModal;
