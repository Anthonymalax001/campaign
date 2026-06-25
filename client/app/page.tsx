"use client";

import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

const API_BASE = "https://campaign-9kiq.onrender.com";

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
};

type GalleryPhoto = {
  id: number;
  image: string;
  caption: string | null;
};

const imageUrl = (path: string | null) => (path ? `${API_BASE}${path}` : "");

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

export default function Home() {
  const router = useRouter();

  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [updateLimit, setUpdateLimit] = useState(6);
  const [eventLimit, setEventLimit] = useState(6);
  const [galleryLimit, setGalleryLimit] = useState(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [updatesRes, eventsRes, galleryRes] = await Promise.all([
          axios.get<CampaignUpdate[]>(`${API_BASE}/api/updates?limit=100`),
          axios.get<CampaignEvent[]>(`${API_BASE}/api/events?limit=100`),
          axios.get<GalleryPhoto[]>(`${API_BASE}/api/gallery?limit=100`)
        ]);

        setUpdates(updatesRes.data);
        setEvents(eventsRes.data);
        setGallery(galleryRes.data);
      } catch {
        setError("Live campaign content is temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-50 text-zinc-950">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
  <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
    <div className="grid items-center gap-10 lg:grid-cols-2">

      {/* LEFT SIDE */}
      <div>
        <div className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
          Kasarani Constituency 2027
        </div>

        <h1 className="mt-6 text-4xl font-black leading-tight text-zinc-900 sm:text-5xl lg:text-6xl">
          Hon. Jeremy Muriira Thiangiti
        </h1>

        <p className="mt-3 text-xl font-semibold text-emerald-700">
          J.M. Thiangiti
        </p>

        <div className="mt-4 inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
          2027 Member of Parliament Aspirant • Kasarani Constituency
        </div>

        <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
          Leadership That Listens. Development That Delivers.
          Building a stronger, safer and more prosperous
          Kasarani for every family.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
            Youth Empowerment
          </span>

          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
            Job Creation
          </span>

          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
            Better Security
          </span>

          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
            Infrastructure
          </span>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/join")}
            className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-emerald-700"
          >
            Join Movement
          </button>

          <button
            type="button"
            onClick={() => router.push("/report")}
            className="rounded-xl border border-zinc-300 bg-white px-6 py-3 font-bold text-zinc-800 transition hover:bg-zinc-50"
          >
            Share Community Issue
          </button>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex justify-center">
        <div className="relative max-w-md">

          <div className="absolute -inset-6 rounded-full bg-emerald-200 opacity-40 blur-3xl"></div>

          <Image
            src="/jm-thiangiti.jpg"
            alt="J.M Thiangiti"
            width={520}
            height={650}
            priority
            className="relative rounded-3xl object-cover shadow-2xl"
          />
        </div>
      </div>

    </div>
  </div>
</section>
      {error && (
        <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        </div>
      )}

      <Section
        eyebrow="Schedule"
        title="Upcoming Events"
        action={
          eventLimit < events.length ? (
            <LoadMore onClick={() => setEventLimit((limit) => limit + 6)} />
          ) : null
        }
      >
        {loading ? (
          <LoadingGrid />
        ) : events.length === 0 ? (
          <EmptyState>No upcoming events posted.</EmptyState>
        ) : (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, eventLimit).map((event) => (
              <article
                key={event.id}
                className="min-w-0 rounded-md border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <p className="break-words text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                  {formatDate(event.event_date)}
                </p>
                <h3 className="mt-3 break-words text-base font-bold text-zinc-950 sm:text-lg">
                  {event.title}
                </h3>
                <p className="mt-2 break-words text-sm text-zinc-600">{event.location}</p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        eyebrow="Newsroom"
        title="Campaign Updates"
        action={
          updateLimit < updates.length ? (
            <LoadMore onClick={() => setUpdateLimit((limit) => limit + 6)} />
          ) : null
        }
      >
        {loading ? (
          <LoadingGrid />
        ) : updates.length === 0 ? (
          <EmptyState>No campaign updates posted.</EmptyState>
        ) : (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {updates.slice(0, updateLimit).map((update) => (
              <article
                key={update.id}
                className="min-w-0 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm"
              >
                {update.image ? (
                  <img
                    src={imageUrl(update.image)}
                    alt={update.title}
                    className="h-44 w-full object-cover sm:h-48"
                  />
                ) : (
                  <div className="h-44 bg-gradient-to-br from-emerald-900 to-zinc-900 sm:h-48" />
                )}
                <div className="p-4 sm:p-5">
                  <p className="break-words text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    {new Date(update.created_at).toLocaleDateString()}
                  </p>
                  <h3 className="mt-3 break-words text-base font-bold text-zinc-950 sm:text-lg">
                    {update.title}
                  </h3>
                  <p className="mt-2 line-clamp-4 break-words text-sm leading-6 text-zinc-600">
                    {update.content}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        eyebrow="Field Moments"
        title="Kasarani In Action"
        action={
          galleryLimit < gallery.length ? (
            <LoadMore onClick={() => setGalleryLimit((limit) => limit + 8)} />
          ) : null
        }
      >
        {loading ? (
          <LoadingGallery />
        ) : gallery.length === 0 ? (
          <EmptyState>No rally photos posted.</EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
            {gallery.slice(0, galleryLimit).map((photo) => (
              <figure
                key={photo.id}
                className="group relative aspect-[4/3] overflow-hidden rounded-md bg-zinc-900"
              >
                <img
                  src={imageUrl(photo.image)}
                  alt={photo.caption || "Campaign rally"}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                {photo.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 break-words bg-zinc-950/75 px-2 py-2 text-xs font-medium text-white opacity-100 transition sm:px-3 md:opacity-0 md:group-hover:opacity-100">
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </Section>

      <section className="bg-zinc-950 px-4 py-10 text-center text-white sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold sm:text-2xl">Ready to Shape the Future of Kasarani?</h2>
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => router.push("/join")}
            className="w-full max-w-xs rounded-md bg-emerald-400 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-300 sm:w-auto"
          >
            Support Campaign
          </button>
        </div>
      </section>
    </main>
  );
}

function Section({
  eyebrow,
  title,
  action,
  children
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 sm:tracking-[0.2em]">
            {eyebrow}
          </p>
          <h2 className="mt-2 break-words text-2xl font-black text-zinc-950 sm:text-3xl">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function LoadMore({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-bold text-zinc-900 transition hover:border-emerald-500 hover:text-emerald-700 sm:w-fit"
    >
      Load More
    </button>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-44 animate-pulse rounded-md border border-zinc-200 bg-zinc-100"
        />
      ))}
    </div>
  );
}

function LoadingGallery() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="aspect-[4/3] animate-pulse rounded-md bg-zinc-100"
        />
      ))}
    </div>
  );
}
