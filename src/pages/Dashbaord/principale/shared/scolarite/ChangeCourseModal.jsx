import React, { useEffect, useState } from "react";
import { Alert, Modal, Select, message } from "antd";
import scolariteService from "../../../../../services/scolariteService";
import {
  GENERAL_COURSE_KEY,
  loadCommonCourseOptions,
} from "../../../../../utils/scolarite";

/**
 * Change (or clear) the course of a programmed exercise.
 * prog: { id, titre|nom, coursId, classes|classesDiffusees:[{id}] }; classIds overrides the classes.
 * The spinner stays until the PATCH settles; errors stay inside the modal.
 */
const ChangeCourseModal = ({ open, prog, classIds, onClose, onChanged }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(GENERAL_COURSE_KEY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const ids = classIds || (prog?.classes || prog?.classesDiffusees || []).map((c) => c.id);
  const idsKey = ids.join(",");

  useEffect(() => {
    if (!open || !prog) return;
    setError(null);
    setValue(prog.coursId || GENERAL_COURSE_KEY);
    setLoading(true);
    loadCommonCourseOptions(idsKey ? idsKey.split(",") : [])
      .then(setOptions)
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [open, prog, idsKey]);

  const handleOk = async () => {
    if (!prog) return;
    setSaving(true);
    setError(null);
    try {
      const coursId = value === GENERAL_COURSE_KEY ? null : value;
      const updated = await scolariteService.changerCoursExerciseProgramme(prog.id, coursId);
      const titre =
        coursId === null ? null : options.find((o) => String(o.coursId) === String(coursId))?.titre || null;
      onClose?.();
      message.success(coursId ? `Exercice rattaché au cours « ${titre || "sélectionné"} »` : "Exercice classé dans « Exercices généraux »");
      onChanged?.({ ...(updated || {}), id: prog.id, coursId, coursTitre: updated?.coursTitre ?? titre });
    } catch (e) {
      setError(e.message || "Impossible de modifier le cours");
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
      okButtonProps={{ loading: saving, disabled: loading }}
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
        onChange={setValue}
        loading={loading}
        disabled={saving}
        showSearch
        optionFilterProp="label"
        options={[
          ...options.map((c) => ({ value: c.coursId, label: c.matiere ? `${c.titre} — ${c.matiere}` : c.titre })),
          { value: GENERAL_COURSE_KEY, label: "Exercice général (sans cours)" },
        ]}
      />
      {!loading && options.length === 0 && (
        <p className="text-xs text-gray-400 mt-2">Aucun cours programmé dans la classe de cet exercice.</p>
      )}
      {error && <Alert type="error" showIcon title={error} style={{ marginTop: 12 }} />}
    </Modal>
  );
};

export default ChangeCourseModal;
