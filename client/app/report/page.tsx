"use client";

import axios from "axios";
import { type ChangeEvent, useState } from "react";

export default function Report() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    ward: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const submit = async () => {
    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/issues", form);
      alert("Issue submitted successfully!");
      setForm({ title: "", description: "", ward: "" });
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || "Error submitting issue"
        : "Error submitting issue";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-6 text-zinc-100 sm:py-10">
      <section className="w-full max-w-md rounded-md border border-zinc-800 bg-zinc-900 p-4 shadow-xl shadow-black/30 sm:p-6">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300 sm:tracking-[0.22em]">
            Community Issues
          </p>
          <h1 className="mt-2 break-words text-2xl font-bold text-white sm:text-3xl">
            Report an Issue
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Tell us what needs attention in your area.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Issue Title</span>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="field"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">
              Description
            </span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="field min-h-36 resize-y"
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

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Issue"}
          </button>
        </div>
      </section>
    </main>
  );
}
