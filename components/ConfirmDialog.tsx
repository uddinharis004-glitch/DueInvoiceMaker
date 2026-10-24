"use client";

import { useEffect, useId, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(event) => { if (busy) event.preventDefault(); }}
      onClose={onClose}
    >
      <div className="modal-box max-w-md">
        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-error/10 text-error" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5" /></svg>
        </div>
        <h2 id={titleId} className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-sm text-base-content/65">{description}</p>
        <div className="modal-action">
          <button type="button" className="btn" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-error" disabled={busy} onClick={onConfirm}>
            {busy && <span className="loading loading-spinner loading-sm" aria-hidden="true" />}
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button type="submit" disabled={busy}>Close</button></form>
    </dialog>
  );
}
