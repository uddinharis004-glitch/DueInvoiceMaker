"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { AddressSuggestion } from "@/lib/address-autocomplete";

type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
};

export default function AddressAutocomplete({ value, onChange, onSelect }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (value.trim().length < 3 || unavailable) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/address-autocomplete?q=${encodeURIComponent(value.trim())}`, { signal: controller.signal })
        .then(async (response) => {
          if (response.status === 503) {
            setUnavailable(true);
            return { suggestions: [] };
          }
          if (!response.ok) throw new Error("Address suggestions could not be loaded.");
          return response.json();
        })
        .then((data) => {
          const nextSuggestions = data.suggestions ?? [];
          setSuggestions(nextSuggestions);
          setActiveIndex(-1);
          setOpen(true);
        })
        .catch((error) => {
          if (error instanceof Error && error.name !== "AbortError") {
            setSuggestions([]);
            setOpen(false);
          }
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [unavailable, value]);

  function choose(suggestion: AddressSuggestion) {
    onSelect(suggestion);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => current <= 0 ? suggestions.length - 1 : current - 1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        className="input pr-10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => { if (suggestions.length) setOpen(true); }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        autoComplete="off"
      />
      {loading && <span className="loading loading-spinner loading-sm absolute right-3 top-3 text-primary" aria-label="Finding addresses" />}
      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-lg">
          {suggestions.length ? (
            <ul id={listboxId} className="list max-h-64 overflow-y-auto p-1" role="listbox" aria-label="Address suggestions">
              {suggestions.map((suggestion, index) => (
                <li
                  id={`${listboxId}-${index}`}
                  key={suggestion.id}
                  className={`list-row cursor-pointer px-3 py-2 text-sm ${index === activeIndex ? "bg-base-200" : "hover:bg-base-200"}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(suggestion)}
                >
                  <span>{suggestion.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-3 text-sm text-base-content/60" role="status">No matching address found. You can continue typing manually.</p>
          )}
          <p className="border-t border-base-300 px-3 py-2 text-right text-xs text-base-content/55">
            Powered by <a className="link" href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a>
          </p>
        </div>
      )}
      <p className="mt-1 text-xs font-normal text-base-content/55">
        {unavailable ? "Address suggestions are not configured yet; manual entry still works." : "Start typing an address to fill City, State, and ZIP."}
      </p>
    </div>
  );
}
