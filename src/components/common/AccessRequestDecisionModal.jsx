import React, { useEffect, useState } from "react";
import { Modal, Input, Alert } from "antd";
import { accessRequestLabel, isChildAccessRequest } from "../../utils/accessRequestLabel";

/**
 * Confirmation before approving / rejecting a class access request.
 * mode "approve" | "reject"; the reject mode keeps the reason input inside the modal
 * (required). onConfirm(reason) may return a promise: the modal stays open (button spinner) until
 * it settles. On rejection the error message is shown inside the modal and the modal stays open;
 * on success the caller closes the modal (and only then shows its success message).
 */
const errorText = (err) =>
  err?.response?.data?.message || err?.message || "Une erreur est survenue. Veuillez réessayer.";

const AccessRequestDecisionModal = ({ open, mode, request, classeNom, loading = false, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isReject = mode === "reject";
  const busy = loading || submitting;

  useEffect(() => {
    if (open) {
      setReason("");
      setTouched(false);
      setError(null);
      setSubmitting(false);
    }
  }, [open, mode, request]);

  const label = request ? accessRequestLabel(request) : "";
  const forChild = isChildAccessRequest(request);
  const reasonMissing = isReject && !reason.trim();

  const handleOk = async () => {
    if (busy) return;
    if (reasonMissing) {
      setTouched(true);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm?.(isReject ? reason.trim() : undefined);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isReject ? "Refuser la demande d'accès" : "Accepter la demande d'accès"}
      okText={isReject ? "Refuser" : "Accepter"}
      cancelText="Annuler"
      okButtonProps={{ danger: isReject, loading: busy }}
      cancelButtonProps={{ disabled: busy }}
      onOk={handleOk}
      onCancel={busy ? undefined : onCancel}
      maskClosable={!busy}
      closable={!busy}
      destroyOnClose
    >
      <p style={{ marginBottom: 12 }}>
        {isReject ? "Refuser" : "Accepter"} la demande de <strong>{label}</strong>
        {classeNom ? (
          <>
            {" "}
            pour la classe <strong>{classeNom}</strong>
          </>
        ) : null}{" "}
        ?
      </p>
      {!isReject && (
        <p style={{ color: "#64748b", fontSize: 13 }}>
          {forChild
            ? "L'enfant rejoindra la classe et le parent sera notifié."
            : "Le demandeur rejoindra la classe et sera notifié."}
        </p>
      )}
      {isReject && (
        <>
          <label htmlFor="access-reject-reason" style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>
            Motif du refus <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <Input.TextArea
            id="access-reject-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Expliquez la raison du refus…"
            status={touched && reasonMissing ? "error" : undefined}
            disabled={busy}
            maxLength={500}
            showCount
          />
          {touched && reasonMissing && (
            <p style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>Le motif du refus est requis.</p>
          )}
        </>
      )}
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          style={{ marginTop: 12 }}
        />
      )}
    </Modal>
  );
};

export default AccessRequestDecisionModal;
