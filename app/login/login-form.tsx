"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setError("Invalid username or password.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-card card p-6 shadow-lg sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-field bg-primary text-xl font-black text-primary-content">D</div>
        <div><h1 className="m-0 text-2xl font-bold tracking-tight">Invoice Maker</h1><p className="mt-1 text-sm text-base-content/55">Private business workspace</p></div>
      </div>
      {error && <div role="alert" className="alert alert-error alert-soft mb-4 text-sm">{error}</div>}
      <form onSubmit={submit} className="grid">
        <label>
          Username
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Password
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        <button type="submit" className="btn btn-primary mt-1" disabled={busy}>
          {busy && <span className="loading loading-spinner loading-sm" aria-hidden="true" />}
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
