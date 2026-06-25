"use client";

import axios from "axios";
import { type ChangeEvent, useState } from "react";
const API_BASE = "https://campaign-9kiq.onrender.com";

export default function Join() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    ward: "",
    category: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    if (name === "phone") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }

    setForm({ ...form, [name]: value });
  };

  const submit = async () => {
    setError("");

    if (form.phone.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    if (!form.name || !form.ward || !form.category) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API_BASE}/api/supporters`, form);

      alert("Welcome to the movement!");
      setForm({ name: "", phone: "", ward: "", category: "" });
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || "Error submitting"
        : "Error submitting";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-6 text-zinc-100 sm:py-10">
      <section className="w-full max-w-md rounded-md border border-zinc-800 bg-zinc-900 p-4 shadow-xl shadow-black/30 sm:p-6">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 sm:tracking-[0.22em]">
            Supporter Registration
          </p>
          <h1 className="mt-2 break-words text-2xl font-bold text-white sm:text-3xl">
            Join the Movement
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Support the campaign for change in Kasarani.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Full Name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="field"
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">
              Phone (10 digits)
            </span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={10}
              className="field"
              autoComplete="tel"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Ward</span>
            <input
              name="ward"
              value={form.ward}
              onChange={handleChange}
              className="field"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Category</span>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="field"
            >
              <option value="">Select Category</option>
              <option value="youth">Youth</option>
              <option value="farmer">Farmer</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
          </label>

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Join Now"}
          </button>
        </div>
      </section>
    </main>
  );
}
