"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_BASE = "http://localhost:5000";

type LoginResponse = {
  token: string;
  expiresAt: number;
  user: {
    id: number;
    username: string;
    role: "staff" | "superadmin";
  };
};

const errorMessage = (err: unknown) => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || "Login failed";
  }

  return "Login failed";
};

export default function Login() {
  const [form, setForm] = useState({
    username: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = async () => {
    if (!form.username.trim() || !form.password) {
      setError("Enter your username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post<LoginResponse>(`${API_BASE}/api/login`, {
        username: form.username.trim(),
        password: form.password
      });

      localStorage.clear();
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("token_expiry", response.data.expiresAt.toString());
      localStorage.setItem("admin", JSON.stringify(response.data.user));

      router.push("/admin");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10 text-zinc-100">
      <section className="w-full max-w-sm rounded-md border border-zinc-800 bg-zinc-900 p-6 shadow-xl shadow-black/30">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Campaign Command
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">Admin Login</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Username</span>
            <input
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              className="field"
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter") void submit();
              }}
              className="field"
              autoComplete="current-password"
            />
          </label>

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </section>
    </main>
  );
}
