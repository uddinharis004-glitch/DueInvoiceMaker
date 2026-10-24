"use client";

import { useEffect, useRef, useState } from "react";

type ToastProps = {
  message: string;
  onDismiss?: () => void;
  tone?: "success" | "error" | "info";
};

export default function Toast({ message, onDismiss, tone = "success" }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      dismissRef.current?.();
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!visible) return null;

  const alertTone = tone === "error" ? "alert-error" : tone === "info" ? "alert-info" : "alert-success";

  return (
    <div className="toast toast-end toast-bottom z-50 w-full max-w-sm" role="status" aria-live="polite">
      <div className={`alert ${alertTone} shadow-lg`}>
        <span aria-hidden="true">{tone === "error" ? "!" : tone === "info" ? "i" : "✓"}</span>
        <span className="font-semibold">{message}</span>
        <button
          type="button"
          className="btn btn-circle btn-ghost btn-sm"
          aria-label="Dismiss notification"
          onClick={() => {
            setVisible(false);
            onDismiss?.();
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
