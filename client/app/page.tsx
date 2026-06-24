"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const router = useRouter();

  const [updates, setUpdates] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);

  // 🔥 LIMIT CONTROL
  const [updateLimit, setUpdateLimit] = useState(6);
  const [eventLimit, setEventLimit] = useState(6);
  const [galleryLimit, setGalleryLimit] = useState(8);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const updatesRes = await axios.get("http://localhost:5000/api/updates");
    const eventsRes = await axios.get("http://localhost:5000/api/events");
    const galleryRes = await axios.get("http://localhost:5000/api/gallery");

    setUpdates(updatesRes.data);
    setEvents(eventsRes.data);
    setGallery(galleryRes.data);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">

          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Hon. Anthony Malawa
            </h1>

            <p className="text-lg italic mb-4">
              Transforming Kitui for a Better Future
            </p>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => router.push("/join")}
                className="bg-white text-blue-700 px-6 py-3 rounded-lg"
              >
                Join Movement
              </button>

              <button
                onClick={() => router.push("/report")}
                className="bg-blue-900 px-6 py-3 rounded-lg"
              >
                Report Issue
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <Image
              src="/candidate.jpg"
              alt="Candidate"
              width={250}
              height={250}
              className="rounded-full"
            />
          </div>

        </div>
      </div>

      {/* EVENTS */}
      <Section title="Upcoming Events">
        <div className="grid md:grid-cols-3 gap-4">
          {events.slice(0, eventLimit).map((e) => (
            <Card key={e.id}>
              <h3 className="font-bold">{e.title}</h3>
              <p>📍 {e.location}</p>
              <p className="text-blue-600">
                {new Date(e.event_date).toLocaleString()}
              </p>
            </Card>
          ))}
        </div>

        {eventLimit < events.length && (
          <LoadMore onClick={() => setEventLimit(eventLimit + 6)} />
        )}
      </Section>

      {/* UPDATES */}
      <Section title="Campaign Updates">
        <div className="grid md:grid-cols-3 gap-4">
          {updates.slice(0, updateLimit).map((u) => (
            <Card key={u.id}>

              {u.image && (
                <img
                  src={`http://localhost:5000${u.image}`}
                  className="w-full h-40 object-cover rounded mb-2"
                />
              )}

              <h3 className="font-bold">{u.title}</h3>
              <p className="text-sm">{u.content}</p>

            </Card>
          ))}
        </div>

        {updateLimit < updates.length && (
          <LoadMore onClick={() => setUpdateLimit(updateLimit + 6)} />
        )}
      </Section>

      {/* GALLERY */}
      <Section title="Rally Gallery">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {gallery.slice(0, galleryLimit).map((g) => (
            <div key={g.id} className="relative group">
              <img
                src={`http://localhost:5000${g.image}`}
                className="w-full h-40 object-cover rounded"
              />

              {g.caption && (
                <div className="absolute bottom-0 bg-black/60 text-white text-xs p-1 opacity-0 group-hover:opacity-100">
                  {g.caption}
                </div>
              )}
            </div>
          ))}
        </div>

        {galleryLimit < gallery.length && (
          <LoadMore onClick={() => setGalleryLimit(galleryLimit + 8)} />
        )}
      </Section>

      {/* CTA */}
      <div className="text-center py-10 bg-blue-50">
        <button
          onClick={() => router.push("/join")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Support Campaign
        </button>
      </div>

    </div>
  );
}

/* COMPONENTS */

const Section = ({ title, children }: any) => (
  <div className="max-w-6xl mx-auto p-6">
    <h2 className="text-2xl font-bold mb-4 text-blue-800">{title}</h2>
    {children}
  </div>
);

const Card = ({ children }: any) => (
  <div className="bg-white p-4 rounded shadow">{children}</div>
);

const LoadMore = ({ onClick }: any) => (
  <div className="text-center mt-4">
    <button
      onClick={onClick}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Load More
    </button>
  </div>
);