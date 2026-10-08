import React, { useEffect, useState } from "react";
import { Modal, Input } from "antd";
import { accessRequestLabel, isChildAccessRequest } from "../../utils/accessRequestLabel";

/**
 * Confirmation before approving / rejecting a class access request.
 * mode "approve" | "reject"; the reject mode keeps the reason input inside the modal
 * (required). onConfirm(reason) may return a promise: the modal stays open (loading) until it settles.
 */
const AccessRequestDecisionModal = ({ open, mode, request, classeNom, loading = false, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const isReject = mode === "reject";

  useEffect(() => {
    if (open) {
      setReason("");
      setTouched(false);
    }
  }, [open, mode, request]);

  const label = request ? accessRequestLabel(request) : "";
  const forChild = isChildAccessRequest(request);
  const reasonMissing = isReject && !reason.trim();

  const handleOk = () => {
    if (reasonMissing) {
      setTouched(true);
      return;
    }
    onConfirm?.(isReject ? reason.trim() : undefined);
  };

  return (
    <Modal
      open={open}
      title={isReject ? "Refuser la demande d'accès" : "Accepter la demande d'accès"}
      okText={isReject ? "Refuser" : "Accepter"}
      cancelText="Annuler"
      okButtonProps={{ danger: isReject, loading }}
      cancelButtonProps={{ disabled: loading }}
      onOk={handleOk}
      onCancel={loading ? undefined : onCancel}
      maskClosable={!loading}
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
            disabled={loading}
            maxLength={500}
            showCount
          />
          {touched && reasonMissing && (
            <p style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>Le motif du refus est requis.</p>
          )}
        </>
      )}
    </Modal>
  );
};

export default AccessRequestDecisionModal;
