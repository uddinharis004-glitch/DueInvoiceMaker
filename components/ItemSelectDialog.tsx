"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { filterItemChoices, RECENT_ITEM_LIMIT } from "@/lib/item-selection";
import type { Item } from "@/lib/types";
import { money } from "@/lib/utils";

type ItemSelectDialogProps = {
  open: boolean;
  items: Item[];
  onSelect: (itemId: string) => void;
  onClose: () => void;
};

export default function ItemSelectDialog({ open, items, onSelect, onClose }: ItemSelectDialogProps) {
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
    () => filterItemChoices(items, query, query.trim() ? 50 : RECENT_ITEM_LIMIT),
    [items, query],
  );

  return (
    <dialog ref={dialogRef} className="modal" aria-labelledby={titleId} onClose={onClose}>
      <div className="modal-box flex max-h-[min(46rem,calc(100dvh-2rem))] w-11/12 max-w-2xl flex-col p-0">
        <div className="border-b border-base-300 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-xl font-bold">Select item or service</h2>
              <p className="mt-1 text-sm text-base-content/60">Search your catalog or choose from 10 recent items.</p>
            </div>
            <form method="dialog"><button type="submit" className="btn btn-ghost btn-sm" aria-label="Close item selection">Close</button></form>
          </div>
          <label className="mt-4">
            <span className="sr-only">Search items</span>
            <input autoFocus className="input" type="search" placeholder="Search name, description or SKU" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
        </div>

        <div className="min-h-0 overflow-y-auto px-3 py-3 sm:px-4">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-base-content/55">{query.trim() ? "Search results" : "Recent items"}</p>
          {choices.length ? (
            <ul className="list" aria-label={query.trim() ? "Matching items" : "Recent items"}>
              {choices.map((item) => (
                <li key={item.id} className="list-row p-0">
                  <button type="button" className="btn btn-ghost h-auto min-h-16 w-full justify-between px-4 py-3 text-left" onClick={() => onSelect(item.id)}>
                    <span className="min-w-0">
                      <strong className="block truncate">{item.name}</strong>
                      <span className="block truncate text-xs font-normal text-base-content/60">{item.description || item.sku || "Saved catalog item"}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{money(item.default_price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-10 text-center" role="status">
              <h3 className="font-semibold">{query.trim() ? "No matching items" : "No saved items"}</h3>
              <p className="mt-1 text-sm text-base-content/55">{query.trim() ? "Try searching with a different name, description, or SKU." : "Add items from the Items page before creating an invoice."}</p>
            </div>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button type="submit">Close</button></form>
    </dialog>
  );
}
