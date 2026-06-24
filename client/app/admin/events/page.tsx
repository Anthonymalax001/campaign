"use client";
import { useState } from "react";
import axios from "axios";

export default function AdminEvents() {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/events", {
        title,
        location,
        event_date: date
      });

      alert("Event created!");

      setTitle("");
      setLocation("");
      setDate("");
    } catch (err) {
      alert("Error creating event");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-2xl font-bold mb-6">
        Create Campaign Event
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow max-w-xl"
      >

        <input
          type="text"
          placeholder="Event Title (e.g. Mwingi Rally)"
          className="w-full mb-4 p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Location (e.g. Mwingi Town)"
          className="w-full mb-4 p-2 border rounded"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />

        <input
          type="datetime-local"
          className="w-full mb-4 p-2 border rounded"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Create Event
        </button>

      </form>

    </div>
  );
}