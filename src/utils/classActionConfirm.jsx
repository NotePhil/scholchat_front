import React from "react";
import { Modal } from "antd";

/**
 * Shared confirmation wording for the class moderation actions (approve /
 * reject / delete) a gestionnaire or admin can trigger. The exact same
 * sentences live in scholchat_mobile/src/i18n/fr.ts under `classConfirm` —
 * keep both in sync.
 */
const classTarget = (className) =>
  className ? `la classe "${className}"` : "cette classe";

export const CLASS_CONFIRM_LABELS = {
  confirm: "Confirmer",
  cancel: "Annuler",
  irreversible: "Cette action est irréversible.",
};

export const getClassActionTexts = (action, className) => {
  const target = classTarget(className);
  switch (action) {
    case "approve":
      return {
        title: "Approuver la classe",
        message: `Approuver ${target} ? La classe deviendra active et le professeur sera notifié.`,
        success: "Classe approuvée avec succès.",
        error: "Erreur lors de l'approbation de la classe.",
        danger: false,
      };
    case "reject":
      return {
        title: "Rejeter la classe",
        message: `Rejeter ${target} ? La classe ne sera pas activée et le professeur sera notifié du rejet.`,
        success: "Classe rejetée avec succès.",
        error: "Erreur lors du rejet de la classe.",
        danger: true,
      };
    case "delete":
      return {
        title: "Supprimer la classe",
        message: `Supprimer ${target} ? La classe et ses données associées seront définitivement supprimées.`,
        warning: CLASS_CONFIRM_LABELS.irreversible,
        success: "Classe supprimée avec succès.",
        error: "Erreur lors de la suppression de la classe.",
        danger: true,
      };
    default:
      throw new Error(`Unknown class action: ${action}`);
  }
};

/**
 * Opens an antd confirmation modal for a class action. `onConfirm` runs when
 * the user clicks "Confirmer": while its promise is pending the button shows a
 * spinner and further clicks are ignored (antd behaviour for async onOk).
 * `onConfirm` is expected to handle its own success/error feedback; errors are
 * swallowed here so the modal always closes.
 */
export const confirmClassAction = ({ action, className, onConfirm }) => {
  const texts = getClassActionTexts(action, className);
  let running = false;
  return Modal.confirm({
    title: texts.title,
    centered: true,
    content: (
      <div>
        <p style={{ margin: 0 }}>{texts.message}</p>
        {texts.warning && (
          <p style={{ margin: "8px 0 0", color: "#dc2626", fontWeight: 600 }}>
            {texts.warning}
          </p>
        )}
      </div>
    ),
    okText: CLASS_CONFIRM_LABELS.confirm,
    cancelText: CLASS_CONFIRM_LABELS.cancel,
    okButtonProps: { danger: texts.danger },
    okType: texts.danger ? "danger" : "primary",
    onOk: async () => {
      if (running) return;
      running = true;
      try {
        await onConfirm();
      } catch (error) {
        console.error(`Class action "${action}" failed:`, error);
      } finally {
        running = false;
      }
    },
  });
};
