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
    setBusy(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setBusy(false);

    if (!res.ok) {
      setError("Invalid username or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="login-card">
      <h1>Invoice Maker</h1>
      <p className="muted">Sign in to your private invoice system.</p>
      {error && <div className="login-error">{error}</div>}
      <form onSubmit={submit} className="grid">
        <label>
          Username
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Password
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        <button className="btn primary" disabled={busy}>{busy ? "Signing in..." : "Login"}</button>
      </form>
    </div>
  );
}
