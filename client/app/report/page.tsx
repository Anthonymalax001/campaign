"use client";
import { useState } from "react";
import axios from "axios";

export default function Report() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    ward: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/issues", form);
      alert("Issue submitted successfully!");
      setForm({ title: "", description: "", ward: "" });
    } catch (err: any) {
      alert(err.response?.data?.error || "Error submitting issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md">
        
        <h1 className="text-2xl font-bold text-center mb-2">
          Report an Issue
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Tell us what needs to be fixed in your area
        </p>

        <input
          name="title"
          placeholder="Issue Title"
          value={form.title}
          onChange={handleChange}
          className="w-full p-3 mb-3 border rounded-lg"
        />

        <textarea
          name="description"
          placeholder="Describe the issue"
          value={form.description}
          onChange={handleChange}
          className="w-full p-3 mb-3 border rounded-lg"
        />

        <input
          name="ward"
          placeholder="Ward"
          value={form.ward}
          onChange={handleChange}
          className="w-full p-3 mb-4 border rounded-lg"
        />

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-red-600 text-white p-3 rounded-lg"
        >
          {loading ? "Submitting..." : "Submit Issue"}
        </button>
      </div>
    </div>
  );
}