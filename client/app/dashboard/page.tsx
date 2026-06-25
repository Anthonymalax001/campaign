"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const API_BASE = "http://localhost:5000";

type AdminUser = {
  id: number;
  username: string;
  role: "staff" | "superadmin";
};

type Supporter = {
  id: number;
  name: string;
  phone: string;
  ward: string;
  category: string;
  created_at?: string;
};

type Issue = {
  id: number;
  title: string;
  description: string;
  ward: string;
  created_at?: string;
};

type WardCount = {
  ward: string;
  count: number;
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`
});

const errorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || fallback;
  }

  return fallback;
};

export default function Dashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedWard, setSelectedWard] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const logout = useCallback(() => {
    localStorage.clear();
    router.push("/login");
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const expiry = localStorage.getItem("token_expiry");
    const stored = localStorage.getItem("admin");

    if (!token || !expiry || !stored || Date.now() > Number(expiry)) {
      logout();
      return;
    }

    try {
      const parsedAdmin = JSON.parse(stored) as AdminUser;
      queueMicrotask(() => setAdmin(parsedAdmin));
    } catch {
      logout();
    }
  }, [logout]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [supportersRes, issuesRes] = await Promise.all([
        axios.get<Supporter[]>(`${API_BASE}/api/supporters`, {
          headers: authHeaders()
        }),
        axios.get<Issue[]>(`${API_BASE}/api/issues`, {
          headers: authHeaders()
        })
      ]);

      setSupporters(supportersRes.data);
      setIssues(issuesRes.data);
    } catch (err) {
      setError(errorMessage(err, "Unable to load dashboard data"));
      if (axios.isAxiosError(err) && err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (admin) queueMicrotask(() => void fetchData());
  }, [admin, fetchData]);

  const supportersChartData = useMemo<WardCount[]>(() => {
    const grouped = supporters.reduce<Record<string, number>>((acc, supporter) => {
      acc[supporter.ward] = (acc[supporter.ward] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([ward, count]) => ({ ward, count }))
      .sort((a, b) => b.count - a.count);
  }, [supporters]);

  const issueChartData = useMemo<WardCount[]>(() => {
    const grouped = issues.reduce<Record<string, number>>((acc, issue) => {
      acc[issue.ward] = (acc[issue.ward] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([ward, count]) => ({ ward, count }))
      .sort((a, b) => b.count - a.count);
  }, [issues]);

  const hotspots = supportersChartData.slice(0, 3);

  const wards = useMemo(
    () => Array.from(new Set(supporters.map((supporter) => supporter.ward))).sort(),
    [supporters]
  );

  const filteredSupporters =
    selectedWard === "ALL"
      ? supporters
      : supporters.filter((supporter) => supporter.ward === selectedWard);

  const filteredIssues =
    selectedWard === "ALL"
      ? issues
      : issues.filter((issue) => issue.ward === selectedWard);

  const handleSendSMS = () => {
    if (filteredSupporters.length === 0) {
      alert("No supporters in this ward");
      return;
    }

    const label = selectedWard === "ALL" ? "all wards" : selectedWard;
    alert(`SMS will be sent to ${filteredSupporters.length} supporters in ${label}`);
  };

  const copyContacts = async () => {
    const data = filteredSupporters
      .map((supporter) => `${supporter.name} - ${supporter.phone} - ${supporter.ward}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(data);
      alert("Supporters copied.");
    } catch {
      alert("Unable to copy contacts.");
    }
  };

  if (!admin) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-zinc-950 p-4 text-zinc-100 sm:p-6">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="break-words text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 sm:text-sm sm:tracking-[0.2em]">
              Field Intelligence
            </p>
            <h1 className="mt-2 break-words text-2xl font-bold text-white sm:text-3xl">
              Campaign Dashboard
            </h1>
            <p className="mt-1 break-words text-sm text-zinc-400">
              {admin.username} / {admin.role}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="w-full rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-cyan-400 hover:text-cyan-200 sm:w-auto"
            >
              Admin Console
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 sm:w-auto"
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="break-words rounded-md border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <Metric label="Supporters" value={supporters.length} tone="cyan" />
          <Metric label="Issues" value={issues.length} tone="rose" />
          <Metric label="Selected Ward" value={selectedWard === "ALL" ? "All" : selectedWard} tone="amber" />
          <Metric label="Target Contacts" value={filteredSupporters.length} tone="emerald" />
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-5">
          <div className="min-w-0 rounded-md border border-zinc-800 bg-zinc-900/80 p-3 shadow-xl shadow-black/20 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:tracking-[0.18em]">
                  Supporter Map
                </p>
                <h2 className="mt-1 break-words text-lg font-semibold text-white sm:text-xl">
                  Supporters by Ward
                </h2>
              </div>

              <select
                className="field sm:max-w-xs"
                value={selectedWard}
                onChange={(event) => setSelectedWard(event.target.value)}
              >
                <option value="ALL">All Wards</option>
                {wards.map((ward) => (
                  <option key={ward} value={ward}>
                    {ward}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-64 min-w-0 overflow-hidden sm:h-80">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  Loading chart...
                </div>
              ) : supportersChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  No supporter data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supportersChartData}>
                    <CartesianGrid stroke="#27272a" vertical={false} />
                    <XAxis dataKey="ward" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: 6,
                        color: "#fafafa"
                      }}
                    />
                    <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="min-w-0 rounded-md border border-zinc-800 bg-zinc-900/80 p-3 shadow-xl shadow-black/20 sm:p-5">
            <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:tracking-[0.18em]">
              Hotspots
            </p>
            <h2 className="mt-1 break-words text-lg font-semibold text-white sm:text-xl">
              Top Wards
            </h2>

            <div className="mt-4 divide-y divide-zinc-800">
              {hotspots.length === 0 ? (
                <p className="py-5 text-sm text-zinc-500">No data yet.</p>
              ) : (
                hotspots.map((hotspot, index) => (
                  <div key={hotspot.ward} className="flex min-w-0 items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-white">
                        {index + 1}. {hotspot.ward}
                      </p>
                      <p className="text-sm text-zinc-500">Supporter concentration</p>
                    </div>
                    <span className="rounded-md bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-200">
                      {hotspot.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <div className="min-w-0 rounded-md border border-zinc-800 bg-zinc-900/80 p-3 shadow-xl shadow-black/20 sm:p-5">
            <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:tracking-[0.18em]">
              Campaign Actions
            </p>
            <h2 className="mt-1 break-words text-lg font-semibold text-white sm:text-xl">
              Ward Outreach
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Targeting {filteredSupporters.length} supporters and {filteredIssues.length} issues.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
              <button type="button" onClick={handleSendSMS} className="primary-button w-full sm:w-auto">
                Send SMS
              </button>
              <button type="button" onClick={copyContacts} className="secondary-button w-full sm:w-auto">
                Copy Contacts
              </button>
            </div>
          </div>

          <div className="min-w-0 rounded-md border border-zinc-800 bg-zinc-900/80 p-3 shadow-xl shadow-black/20 sm:p-5">
            <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:tracking-[0.18em]">
              Issue Load
            </p>
            <h2 className="mt-1 break-words text-lg font-semibold text-white sm:text-xl">
              Issues by Ward
            </h2>

            <div className="mt-4 h-56 min-w-0 overflow-hidden">
              {issueChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  No issue data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={issueChartData}>
                    <CartesianGrid stroke="#27272a" vertical={false} />
                    <XAxis dataKey="ward" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: 6,
                        color: "#fafafa"
                      }}
                    />
                    <Bar dataKey="count" fill="#fb7185" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-md border border-zinc-800 bg-zinc-900/80 p-3 shadow-xl shadow-black/20 sm:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:tracking-[0.18em]">
                Contact List
              </p>
              <h2 className="mt-1 break-words text-lg font-semibold text-white sm:text-xl">
                Supporters ({selectedWard})
              </h2>
            </div>
            <p className="text-sm text-zinc-500">{filteredSupporters.length} records</p>
          </div>

          {filteredSupporters.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
              No supporters found.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredSupporters.map((supporter) => (
                <div
                  key={supporter.id}
                  className="grid min-w-0 gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(120px,160px)_minmax(120px,160px)]"
                >
                  <p className="break-words font-semibold text-white">{supporter.name}</p>
                  <p className="break-words text-zinc-400">{supporter.phone}</p>
                  <p className="break-words text-zinc-500">{supporter.ward}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  tone
}: {
  label: string;
  value: number | string;
  tone: "cyan" | "amber" | "emerald" | "rose";
}) {
  const tones = {
    cyan: "border-cyan-400/30 text-cyan-200",
    amber: "border-amber-400/30 text-amber-200",
    emerald: "border-emerald-400/30 text-emerald-200",
    rose: "border-rose-400/30 text-rose-200"
  };

  return (
    <div className={`rounded-md border bg-zinc-900 p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
