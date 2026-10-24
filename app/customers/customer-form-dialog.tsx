"use client";

import { useEffect, useId, useRef } from "react";
import AddressAutocomplete from "./address-autocomplete";

export type CustomerFormValue = {
  name: string;
  company_name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  notes: string;
};

type CustomerFormDialogProps = {
  open: boolean;
  editing: boolean;
  value: CustomerFormValue;
  busy: boolean;
  onChange: (value: CustomerFormValue) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function CustomerFormDialog({ open, editing, value, busy, onChange, onClose, onSubmit }: CustomerFormDialogProps) {
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
      <div className="modal-box w-11/12 max-w-3xl p-0">
        <div className="border-b border-base-300 px-5 py-4 sm:px-6">
          <h2 id={titleId} className="text-xl font-bold">{editing ? "Edit customer" : "Add new customer"}</h2>
          <p className="mt-1 text-sm text-base-content/60">Save contact and billing details for future invoices.</p>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-grid px-5 py-5 sm:px-6">
            <label>Name<input autoFocus className="input" value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} required /></label>
            <label>Company<input className="input" value={value.company_name} onChange={(event) => onChange({ ...value, company_name: event.target.value })} /></label>
            <label className="full">Street<AddressAutocomplete value={value.street} onChange={(street) => onChange({ ...value, street })} onSelect={(address) => onChange({ ...value, street: address.street, city: address.city, state: address.state, zip: address.zip })} /></label>
            <label>City<input className="input" value={value.city} onChange={(event) => onChange({ ...value, city: event.target.value })} /></label>
            <label>State<input className="input" value={value.state} onChange={(event) => onChange({ ...value, state: event.target.value })} /></label>
            <label>ZIP<input className="input" inputMode="numeric" value={value.zip} onChange={(event) => onChange({ ...value, zip: event.target.value })} /></label>
            <label>Phone<input className="input" type="tel" value={value.phone} onChange={(event) => onChange({ ...value, phone: event.target.value })} /></label>
            <label>Email<input className="input" type="email" value={value.email} onChange={(event) => onChange({ ...value, email: event.target.value })} /></label>
            <label className="full">Notes<textarea className="textarea" value={value.notes} onChange={(event) => onChange({ ...value, notes: event.target.value })} /></label>
          </div>
          <div className="modal-action m-0 border-t border-base-300 px-5 py-4 sm:px-6">
            <button type="button" className="btn" disabled={busy} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" aria-hidden="true" />}
              {busy ? "Saving…" : editing ? "Update customer" : "Save customer"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop"><button type="submit" disabled={busy}>Close</button></form>
    </dialog>
  );
}
