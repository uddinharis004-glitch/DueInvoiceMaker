"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { filterCustomerChoices, RECENT_CUSTOMER_LIMIT } from "@/lib/customer-selection";
import type { Customer } from "@/lib/types";

type CustomerSelectDialogProps = {
  open: boolean;
  customers: Customer[];
  selectedId: string;
  onSelect: (customerId: string) => void;
  onClose: () => void;
};

export default function CustomerSelectDialog({ open, customers, selectedId, onSelect, onClose }: CustomerSelectDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setQuery("");
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const choices = useMemo(
    () => filterCustomerChoices(customers, query, query.trim() ? 50 : RECENT_CUSTOMER_LIMIT),
    [customers, query],
  );

  return (
    <dialog ref={dialogRef} className="modal" aria-labelledby={titleId} onClose={onClose}>
      <div className="modal-box flex max-h-[min(42rem,calc(100dvh-2rem))] w-11/12 max-w-2xl flex-col p-0">
        <div className="border-b border-base-300 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-xl font-bold">Select customer</h2>
              <p className="mt-1 text-sm text-base-content/60">Search saved customers or choose a recent one.</p>
            </div>
            <form method="dialog"><button type="submit" className="btn btn-ghost btn-sm" aria-label="Close customer selection">Close</button></form>
          </div>
          <label className="mt-4">
            <span className="sr-only">Search customers</span>
            <input autoFocus className="input" type="search" placeholder="Search name, company, email or phone" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
        </div>

        <div className="min-h-0 overflow-y-auto px-3 py-3 sm:px-4">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-base-content/55">{query.trim() ? "Search results" : "Recent customers"}</p>
          {choices.length ? (
            <ul className="list" aria-label={query.trim() ? "Matching customers" : "Recent customers"}>
              {choices.map((customer) => {
                const selected = customer.id === selectedId;
                return (
                  <li key={customer.id} className="list-row p-0">
                    <button
                      type="button"
                      className={`btn h-auto min-h-16 w-full justify-between px-4 py-3 text-left ${selected ? "border-primary bg-primary/10" : "btn-ghost"}`}
                      aria-pressed={selected}
                      onClick={() => onSelect(customer.id)}
                    >
                      <span className="min-w-0">
                        <strong className="block truncate">{customer.name}</strong>
                        <span className="block truncate text-xs font-normal text-base-content/60">{customer.company_name || customer.email || customer.phone || "No additional contact details"}</span>
                      </span>
                      {selected && <span className="badge badge-primary badge-soft shrink-0">Selected</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-10 text-center" role="status">
              <h3 className="font-semibold">No matching customers</h3>
              <p className="mt-1 text-sm text-base-content/55">Try searching with a different name or contact detail.</p>
            </div>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button type="submit">Close</button></form>
    </dialog>
  );
}
