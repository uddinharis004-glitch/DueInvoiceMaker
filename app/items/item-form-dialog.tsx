"use client";

import { useEffect, useId, useRef } from "react";

export type ItemFormValue = {
  name: string;
  description: string;
  default_price: string;
  sku: string;
  taxable: boolean;
};

type ItemFormDialogProps = {
  open: boolean;
  editing: boolean;
  value: ItemFormValue;
  busy: boolean;
  onChange: (value: ItemFormValue) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function ItemFormDialog({ open, editing, value, busy, onChange, onClose, onSubmit }: ItemFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className="modal" aria-labelledby={titleId} onCancel={(event) => { if (busy) event.preventDefault(); }} onClose={onClose}>
      <div className="modal-box w-11/12 max-w-2xl p-0">
        <div className="border-b border-base-300 px-5 py-4 sm:px-6">
          <h2 id={titleId} className="text-xl font-bold">{editing ? "Edit item" : "Add new item"}</h2>
          <p className="mt-1 text-sm text-base-content/60">Save a product or service for faster invoice creation.</p>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-grid px-5 py-5 sm:px-6">
            <label className="full">Name<input autoFocus className="input" value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} required /></label>
            <label className="full">Description<textarea className="textarea" value={value.description} onChange={(event) => onChange({ ...value, description: event.target.value })} /></label>
            <label>Default price<input className="input" type="number" step="0.01" min="0" inputMode="decimal" value={value.default_price} onChange={(event) => onChange({ ...value, default_price: event.target.value })} required /></label>
            <label>SKU<input className="input" value={value.sku} onChange={(event) => onChange({ ...value, sku: event.target.value })} /></label>
            <label>Taxable<select className="select" value={String(value.taxable)} onChange={(event) => onChange({ ...value, taxable: event.target.value === "true" })}><option value="true">Yes</option><option value="false">No</option></select></label>
          </div>
          <div className="modal-action m-0 border-t border-base-300 px-5 py-4 sm:px-6">
            <button type="button" className="btn" disabled={busy} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" aria-hidden="true" />}
              {busy ? "Saving…" : editing ? "Update item" : "Save item"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop"><button type="submit" disabled={busy}>Close</button></form>
    </dialog>
  );
}
