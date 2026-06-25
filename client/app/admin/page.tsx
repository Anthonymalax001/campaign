"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
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

type CampaignUpdate = {
  id: number;
  title: string;
  content: string;
  image: string | null;
  created_at: string;
};

type CampaignEvent = {
  id: number;
  title: string;
  location: string;
  event_date: string;
  created_at?: string;
};

type GalleryPhoto = {
  id: number;
  image: string;
  caption: string | null;
  created_at: string;
};

type AdminAccount = {
  id: number;
  username: string;
  role: string;
  created_at: string;
};

type Panel = "updates" | "events" | "gallery" | "admins";

const emptyUpdate = { title: "", content: "" };
const emptyEvent = { title: "", location: "", event_date: "" };
const emptyAdmin = { username: "", password: "", role: "staff" };

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`
});

const imageUrl = (path: string | null) => (path ? `${API_BASE}${path}` : "");

const errorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || fallback;
  }

  return fallback;
};

const toDateTimeLocal = (value: string) => {
  if (!value) return "";

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

export default function Admin() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [activePanel, setActivePanel] = useState<Panel>("updates");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);

  const [updateForm, setUpdateForm] = useState(emptyUpdate);
  const [editingUpdateId, setEditingUpdateId] = useState<number | null>(null);
  const [updateImage, setUpdateImage] = useState<File | null>(null);
  const [removeUpdateImage, setRemoveUpdateImage] = useState(false);

  const [eventForm, setEventForm] = useState(emptyEvent);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryImage, setGalleryImage] = useState<File | null>(null);

  const [newAdmin, setNewAdmin] = useState(emptyAdmin);

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

  const fetchData = useCallback(
    async (currentAdmin: AdminUser) => {
      setLoading(true);
      setError("");

      try {
        const [updatesRes, eventsRes, galleryRes] = await Promise.all([
          axios.get<CampaignUpdate[]>(`${API_BASE}/api/updates?limit=100`),
          axios.get<CampaignEvent[]>(`${API_BASE}/api/events?scope=all&limit=100`, {
            headers: authHeaders()
          }),
          axios.get<GalleryPhoto[]>(`${API_BASE}/api/gallery?limit=100`)
        ]);

        setUpdates(updatesRes.data);
        setEvents(eventsRes.data);
        setGallery(galleryRes.data);

        if (currentAdmin.role === "superadmin") {
          const adminsRes = await axios.get<AdminAccount[]>(`${API_BASE}/api/admins`, {
            headers: authHeaders()
          });
          setAdmins(adminsRes.data);
        } else {
          setAdmins([]);
        }
      } catch (err) {
        const message = errorMessage(err, "Unable to load admin data");
        setError(message);
        if (axios.isAxiosError(err) && err.response?.status === 401) logout();
      } finally {
        setLoading(false);
      }
    },
    [logout]
  );

  useEffect(() => {
    if (admin) queueMicrotask(() => void fetchData(admin));
  }, [admin, fetchData]);

  const flash = (message: string) => {
    setNotice(message);
    setError("");
    window.setTimeout(() => setNotice(""), 3500);
  };

  const resetUpdateForm = () => {
    setUpdateForm(emptyUpdate);
    setEditingUpdateId(null);
    setUpdateImage(null);
    setRemoveUpdateImage(false);
  };

  const resetEventForm = () => {
    setEventForm(emptyEvent);
    setEditingEventId(null);
  };

  const saveUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!updateForm.title.trim() || !updateForm.content.trim()) {
      setError("Add a title and content before saving the update.");
      return;
    }

    const formData = new FormData();
    formData.append("title", updateForm.title.trim());
    formData.append("content", updateForm.content.trim());
    formData.append("removeImage", String(removeUpdateImage));
    if (updateImage) formData.append("image", updateImage);

    try {
      if (editingUpdateId) {
        await axios.put(`${API_BASE}/api/updates/${editingUpdateId}`, formData, {
          headers: authHeaders()
        });
        flash("Update saved.");
      } else {
        await axios.post(`${API_BASE}/api/updates`, formData, {
          headers: authHeaders()
        });
        flash("Update published.");
      }

      resetUpdateForm();
      if (admin) await fetchData(admin);
    } catch (err) {
      setError(errorMessage(err, "Unable to save update"));
    }
  };

  const editUpdate = (update: CampaignUpdate) => {
    setActivePanel("updates");
    setEditingUpdateId(update.id);
    setUpdateForm({ title: update.title, content: update.content });
    setUpdateImage(null);
    setRemoveUpdateImage(false);
  };

  const deleteUpdate = async (id: number) => {
    if (!isSuperadmin || !window.confirm("Delete this update?")) return;

    try {
      await axios.delete(`${API_BASE}/api/updates/${id}`, {
        headers: authHeaders()
      });
      flash("Update deleted.");
      if (admin) await fetchData(admin);
    } catch (err) {
      setError(errorMessage(err, "Unable to delete update"));
    }
  };

  const saveEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!eventForm.title.trim() || !eventForm.location.trim() || !eventForm.event_date) {
      setError("Add a title, location, and date before saving the event.");
      return;
    }

    try {
      if (editingEventId) {
        await axios.put(
          `${API_BASE}/api/events/${editingEventId}`,
          {
            title: eventForm.title.trim(),
            location: eventForm.location.trim(),
            event_date: eventForm.event_date
          },
          { headers: authHeaders() }
        );
        flash("Event saved.");
      } else {
        await axios.post(
          `${API_BASE}/api/events`,
          {
            title: eventForm.title.trim(),
            location: eventForm.location.trim(),
            event_date: eventForm.event_date
          },
          { headers: authHeaders() }
        );
        flash("Event created.");
      }

      resetEventForm();
      if (admin) await fetchData(admin);
    } catch (err) {
      setError(errorMessage(err, "Unable to save event"));
    }
  };

  const editEvent = (campaignEvent: CampaignEvent) => {
    setActivePanel("events");
    setEditingEventId(campaignEvent.id);
    setEventForm({
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
      if (admin) await fetchData(admin);
    } catch (err) {
      setError(errorMessage(err, "Unable to delete event"));
    }
  };

  const uploadGalleryPhoto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!galleryImage) {
      setError("Choose a gallery image before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("caption", galleryCaption.trim());
    formData.append("image", galleryImage);

    try {
      await axios.post(`${API_BASE}/api/gallery`, formData, {
        headers: authHeaders()
      });
      setGalleryCaption("");
      setGalleryImage(null);
      flash("Gallery photo uploaded.");
      if (admin) await fetchData(admin);
    } catch (err) {
      setError(errorMessage(err, "Unable to upload gallery photo"));
    }
  };

  const deleteGalleryPhoto = async (id: number) => {
    if (!isSuperadmin || !window.confirm("Delete this gallery photo?")) return;

    try {
      await axios.delete(`${API_BASE}/api/gallery/${id}`, {
        headers: authHeaders()
      });
      flash("Gallery photo deleted.");
      if (admin) await fetchData(admin);
    } catch (err) {
      setError(errorMessage(err, "Unable to delete gallery photo"));
    }
  };

  const createAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isSuperadmin) return;

    if (!newAdmin.username.trim() || !newAdmin.password.trim()) {
      setError("Add a username and password before creating an admin.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/api/admins`,
        {
          username: newAdmin.username.trim(),
          password: newAdmin.password,
          role: newAdmin.role
        },
        { headers: authHeaders() }
      );
      setNewAdmin(emptyAdmin);
      flash("Admin account created.");
      if (admin) await fetchData(admin);
    } catch (err) {
      setError(errorMessage(err, "Unable to create admin"));
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="break-words text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 sm:text-sm sm:tracking-[0.2em]">
              Campaign Command
            </p>
            <h1 className="mt-2 break-words text-2xl font-bold text-white sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 break-words text-sm text-zinc-400">
              {admin.username} / {admin.role}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="w-full rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-cyan-400 hover:text-cyan-200 sm:w-auto"
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400 hover:text-emerald-200 sm:w-auto"
            >
              Homepage
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

        <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <Metric label="Updates" value={updates.length} tone="cyan" />
          <Metric label="Events" value={events.length} tone="amber" />
          <Metric label="Gallery Photos" value={gallery.length} tone="emerald" />
          <Metric label="Role" value={isSuperadmin ? "Superadmin" : "Staff"} tone="rose" />
        </section>

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

        <nav className="-mx-3 flex min-w-0 gap-2 overflow-x-auto border-b border-zinc-800 px-3 pb-2 sm:mx-0 sm:px-0">
          <Tab active={activePanel === "updates"} onClick={() => setActivePanel("updates")}>
            Updates
          </Tab>
          <Tab active={activePanel === "events"} onClick={() => setActivePanel("events")}>
            Events
          </Tab>
          <Tab active={activePanel === "gallery"} onClick={() => setActivePanel("gallery")}>
            Gallery
          </Tab>
          {isSuperadmin && (
            <Tab active={activePanel === "admins"} onClick={() => setActivePanel("admins")}>
              Admins
            </Tab>
          )}
        </nav>

        {loading ? (
          <PanelShell title="Loading" eyebrow="Syncing">
            <p className="text-sm text-zinc-400">Fetching campaign records...</p>
          </PanelShell>
        ) : (
          <>
            {activePanel === "updates" && (
              <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-5">
                <PanelShell
                  title={editingUpdateId ? "Edit Update" : "Create Update"}
                  eyebrow="Campaign Updates"
                >
                  <form onSubmit={saveUpdate} className="space-y-4">
                    <Field label="Title">
                      <input
                        value={updateForm.title}
                        onChange={(event) =>
                          setUpdateForm({ ...updateForm, title: event.target.value })
                        }
                        className="field"
                        placeholder="Town hall recap"
                      />
                    </Field>

                    <Field label="Content">
                      <textarea
                        value={updateForm.content}
                        onChange={(event) =>
                          setUpdateForm({ ...updateForm, content: event.target.value })
                        }
                        className="field min-h-36 resize-y"
                        placeholder="Write the campaign update..."
                      />
                    </Field>

                    <Field label="Image">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setUpdateImage(event.target.files?.[0] || null)}
                        className="file-field"
                      />
                    </Field>

                    {editingUpdateId && (
                      <label className="flex items-center gap-3 text-sm text-zinc-300">
                        <input
                          type="checkbox"
                          checked={removeUpdateImage}
                          onChange={(event) => setRemoveUpdateImage(event.target.checked)}
                          className="h-4 w-4 accent-cyan-400"
                        />
                        Remove current image
                      </label>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                      <button type="submit" className="primary-button w-full sm:w-auto">
                        {editingUpdateId ? "Save Update" : "Post Update"}
                      </button>
                      {editingUpdateId && (
                        <button type="button" onClick={resetUpdateForm} className="secondary-button w-full sm:w-auto">
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </PanelShell>

                <PanelShell title="Published Updates" eyebrow={`${updates.length} total`}>
                  <div className="divide-y divide-zinc-800">
                    {updates.length === 0 ? (
                      <EmptyState>No updates yet.</EmptyState>
                    ) : (
                      updates.map((update) => (
                        <article key={update.id} className="grid min-w-0 gap-4 py-4 md:grid-cols-[120px_minmax(0,1fr)]">
                          <div className="h-40 overflow-hidden rounded-md bg-zinc-800 sm:h-32 md:h-28">
                            {update.image ? (
                              <img
                                src={imageUrl(update.image)}
                                alt={update.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 break-words">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <h3 className="break-words font-semibold text-white">{update.title}</h3>
                                <p className="mt-1 line-clamp-3 text-sm text-zinc-400">
                                  {update.content}
                                </p>
                                <p className="mt-2 text-xs text-zinc-500">
                                  {formatDate(update.created_at)}
                                </p>
                              </div>
                              <RowActions>
                                <button type="button" onClick={() => editUpdate(update)} className="mini-button">
                                  Edit
                                </button>
                                {isSuperadmin && (
                                  <button
                                    type="button"
                                    onClick={() => deleteUpdate(update.id)}
                                    className="danger-button"
                                  >
                                    Delete
                                  </button>
                                )}
                              </RowActions>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </PanelShell>
              </section>
            )}

            {activePanel === "events" && (
              <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-5">
                <PanelShell title={editingEventId ? "Edit Event" : "Create Event"} eyebrow="Rallies">
                  <form onSubmit={saveEvent} className="space-y-4">
                    <Field label="Title">
                      <input
                        value={eventForm.title}
                        onChange={(event) =>
                          setEventForm({ ...eventForm, title: event.target.value })
                        }
                        className="field"
                        placeholder="Mwingi Rally"
                      />
                    </Field>

                    <Field label="Location">
                      <input
                        value={eventForm.location}
                        onChange={(event) =>
                          setEventForm({ ...eventForm, location: event.target.value })
                        }
                        className="field"
                        placeholder="Mwingi Town"
                      />
                    </Field>

                    <Field label="Date and time">
                      <input
                        type="datetime-local"
                        value={eventForm.event_date}
                        onChange={(event) =>
                          setEventForm({ ...eventForm, event_date: event.target.value })
                        }
                        className="field"
                      />
                    </Field>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                      <button type="submit" className="primary-button w-full sm:w-auto">
                        {editingEventId ? "Save Event" : "Create Event"}
                      </button>
                      {editingEventId && (
                        <button type="button" onClick={resetEventForm} className="secondary-button w-full sm:w-auto">
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </PanelShell>

                <PanelShell title="Event Schedule" eyebrow={`${events.length} total`}>
                  <div className="divide-y divide-zinc-800">
                    {events.length === 0 ? (
                      <EmptyState>No events yet.</EmptyState>
                    ) : (
                      events.map((campaignEvent) => (
                        <article
                          key={campaignEvent.id}
                          className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 break-words">
                            <h3 className="break-words font-semibold text-white">{campaignEvent.title}</h3>
                            <p className="break-words text-sm text-zinc-400">{campaignEvent.location}</p>
                            <p className="mt-1 text-xs text-amber-200">
                              {formatDate(campaignEvent.event_date)}
                            </p>
                          </div>
                          <RowActions>
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
                          </RowActions>
                        </article>
                      ))
                    )}
                  </div>
                </PanelShell>
              </section>
            )}

            {activePanel === "gallery" && (
              <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-5">
                <PanelShell title="Upload Photo" eyebrow="Rally Gallery">
                  <form onSubmit={uploadGalleryPhoto} className="space-y-4">
                    <Field label="Caption">
                      <input
                        value={galleryCaption}
                        onChange={(event) => setGalleryCaption(event.target.value)}
                        className="field"
                        placeholder="Youth forum in Kitui Central"
                      />
                    </Field>

                    <Field label="Photo">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setGalleryImage(event.target.files?.[0] || null)}
                        className="file-field"
                      />
                    </Field>

                    <button type="submit" className="primary-button w-full sm:w-auto">
                      Upload Photo
                    </button>
                  </form>
                </PanelShell>

                <PanelShell title="Gallery Photos" eyebrow={`${gallery.length} total`}>
                  {gallery.length === 0 ? (
                    <EmptyState>No rally photos yet.</EmptyState>
                  ) : (
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {gallery.map((photo) => (
                        <figure key={photo.id} className="min-w-0 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
                          <img
                            src={imageUrl(photo.image)}
                            alt={photo.caption || "Rally gallery photo"}
                            className="h-40 w-full object-cover"
                          />
                          <figcaption className="flex min-h-16 flex-col gap-3 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                            <span className="min-w-0 break-words text-sm text-zinc-300">
                              {photo.caption || "No caption"}
                            </span>
                            {isSuperadmin && (
                              <button
                                type="button"
                                onClick={() => deleteGalleryPhoto(photo.id)}
                                className="danger-button w-full shrink-0 sm:w-auto"
                              >
                                Delete
                              </button>
                            )}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </PanelShell>
              </section>
            )}

            {activePanel === "admins" && isSuperadmin && (
              <section className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-5">
                <PanelShell title="Create Admin" eyebrow="Superadmin">
                  <form onSubmit={createAdmin} className="space-y-4">
                    <Field label="Username">
                      <input
                        value={newAdmin.username}
                        onChange={(event) =>
                          setNewAdmin({ ...newAdmin, username: event.target.value })
                        }
                        className="field"
                        placeholder="campaign.staff"
                      />
                    </Field>

                    <Field label="Password">
                      <input
                        type="password"
                        value={newAdmin.password}
                        onChange={(event) =>
                          setNewAdmin({ ...newAdmin, password: event.target.value })
                        }
                        className="field"
                        placeholder="Temporary password"
                      />
                    </Field>

                    <Field label="Role">
                      <select
                        value={newAdmin.role}
                        onChange={(event) =>
                          setNewAdmin({ ...newAdmin, role: event.target.value })
                        }
                        className="field"
                      >
                        <option value="staff">Staff</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </Field>

                    <button type="submit" className="primary-button w-full sm:w-auto">
                      Create Admin
                    </button>
                  </form>
                </PanelShell>

                <PanelShell title="Admin Accounts" eyebrow={`${admins.length} total`}>
                  <div className="divide-y divide-zinc-800">
                    {admins.length === 0 ? (
                      <EmptyState>No admins found.</EmptyState>
                    ) : (
                      admins.map((account) => (
                        <div
                          key={account.id}
                          className="flex min-w-0 flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="break-words font-semibold text-white">{account.username}</p>
                            <p className="break-words text-sm text-zinc-400">{account.role}</p>
                          </div>
                          <p className="text-xs text-zinc-500">
                            {formatDate(account.created_at)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </PanelShell>
              </section>
            )}
          </>
        )}
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
    <div className={`min-w-0 rounded-md border bg-zinc-900 p-4 ${tones[tone]}`}>
      <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-3 break-words text-xl font-bold text-white sm:text-2xl">{value}</p>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-cyan-400 text-zinc-950"
          : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function PanelShell({
  title,
  eyebrow,
  children
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-md border border-zinc-800 bg-zinc-900/80 p-3 shadow-xl shadow-black/20 sm:p-5">
      <div className="mb-4 min-w-0">
        <p className="break-words text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:tracking-[0.18em]">
          {eyebrow}
        </p>
        <h2 className="mt-1 break-words text-lg font-semibold text-white sm:text-xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">{children}</div>;
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}
