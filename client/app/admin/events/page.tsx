"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useState
} from "react";

const API_BASE = "http://localhost:5000";

type AdminUser = {
  id: number;
  username: string;
  role: "staff" | "superadmin";
};

type CampaignEvent = {
  id: number;
  title: string;
  location: string;
  event_date: string;
};

const emptyEvent = { title: "", location: "", event_date: "" };

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`
});

const errorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || fallback;
  }

  return fallback;
};

const toDateTimeLocal = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });

export default function AdminEvents() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [form, setForm] = useState(emptyEvent);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const isSuperadmin = admin?.role === "superadmin";

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

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get<CampaignEvent[]>(
        `${API_BASE}/api/events?scope=all&limit=100`,
        { headers: authHeaders() }
      );
      setEvents(response.data);
    } catch (err) {
      setError(errorMessage(err, "Unable to load events"));
      if (axios.isAxiosError(err) && err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (admin) queueMicrotask(() => void fetchEvents());
  }, [admin, fetchEvents]);

  const flash = (message: string) => {
    setNotice(message);
    setError("");
    window.setTimeout(() => setNotice(""), 3500);
  };

  const resetForm = () => {
    setForm(emptyEvent);
    setEditingId(null);
  };

  const saveEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.location.trim() || !form.event_date) {
      setError("Add a title, location, and date before saving.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(
          `${API_BASE}/api/events/${editingId}`,
          {
            title: form.title.trim(),
            location: form.location.trim(),
            event_date: form.event_date
          },
          { headers: authHeaders() }
        );
        flash("Event saved.");
      } else {
        await axios.post(
          `${API_BASE}/api/events`,
          {
            title: form.title.trim(),
            location: form.location.trim(),
            event_date: form.event_date
          },
          { headers: authHeaders() }
        );
        flash("Event created.");
      }

      resetForm();
      await fetchEvents();
    } catch (err) {
      setError(errorMessage(err, "Unable to save event"));
    }
  };

  const editEvent = (campaignEvent: CampaignEvent) => {
    setEditingId(campaignEvent.id);
    setForm({
      title: campaignEvent.title,
      location: campaignEvent.location,
      event_date: toDateTimeLocal(campaignEvent.event_date)
    });
  };

  const deleteEvent = async (id: number) => {
    if (!isSuperadmin || !window.confirm("Delete this event?")) return;

    try {
      await axios.delete(`${API_BASE}/api/events/${id}`, {
        headers: authHeaders()
      });
      flash("Event deleted.");
      await fetchEvents();
    } catch (err) {
      setError(errorMessage(err, "Unable to delete event"));
    }
  };

  if (!admin) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-zinc-950 p-4 text-zinc-100 sm:p-6">
        <p>Loading admin session...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="break-words text-xs font-semibold uppercase tracking-[0.16em] text-amber-300 sm:text-sm sm:tracking-[0.2em]">
              Event Operations
            </p>
            <h1 className="mt-2 break-words text-2xl font-bold text-white sm:text-3xl">
              Campaign Events
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

        {(notice || error) && (
          <div
            className={`break-words rounded-md border px-4 py-3 text-sm ${
              error
                ? "border-rose-500/40 bg-rose-950/40 text-rose-100"
                : "border-emerald-500/40 bg-emerald-950/30 text-emerald-100"
            }`}
          >
            {error || notice}
          </div>
        )}

        <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-5">
          <div className="min-w-0 rounded-md border border-zinc-800 bg-zinc-900/80 p-3 shadow-xl shadow-black/20 sm:p-5">
            <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:tracking-[0.18em]">
              {editingId ? "Edit Event" : "New Event"}
            </p>
            <h2 className="mt-1 break-words text-lg font-semibold text-white sm:text-xl">
              {editingId ? "Update Schedule" : "Create Campaign Event"}
            </h2>

            <form onSubmit={saveEvent} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Title</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="field"
                  placeholder="Mwingi Rally"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Location</span>
                <input
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                  className="field"
                  placeholder="Mwingi Town"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Date and time
                </span>
                <input
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(event) => setForm({ ...form, event_date: event.target.value })}
                  className="field"
                />
              </label>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                <button type="submit" className="primary-button w-full sm:w-auto">
                  {editingId ? "Save Event" : "Create Event"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="secondary-button w-full sm:w-auto">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="min-w-0 rounded-md border border-zinc-800 bg-zinc-900/80 p-3 shadow-xl shadow-black/20 sm:p-5">
            <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:tracking-[0.18em]">
                  {events.length} total
                </p>
                <h2 className="mt-1 break-words text-lg font-semibold text-white sm:text-xl">
                  Event Schedule
                </h2>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-zinc-400">Loading events...</p>
            ) : events.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
                No events yet.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {events.map((campaignEvent) => (
                  <article
                    key={campaignEvent.id}
                    className="flex min-w-0 flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 break-words">
                      <h3 className="break-words font-semibold text-white">{campaignEvent.title}</h3>
                      <p className="break-words text-sm text-zinc-400">{campaignEvent.location}</p>
                      <p className="mt-1 text-xs text-amber-200">
                        {formatDate(campaignEvent.event_date)}
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                      <button
                        type="button"
                        onClick={() => editEvent(campaignEvent)}
                        className="mini-button"
                      >
                        Edit
                      </button>
                      {isSuperadmin && (
                        <button
                          type="button"
                          onClick={() => deleteEvent(campaignEvent.id)}
                          className="danger-button"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
