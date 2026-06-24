"use client";
import { useState } from "react";
import axios from "axios";

export default function Join() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    ward: "",
    category: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    // ✅ PHONE: only allow numbers, max 10 digits
    if (name === "phone") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }

    setForm({ ...form, [name]: value });
  };

  const submit = async () => {
    setError("");

    // ✅ VALIDATION
    if (form.phone.length !== 10) {
      return setError("Phone number must be exactly 10 digits");
    }

    if (!form.name || !form.ward || !form.category) {
      return setError("Please fill all fields");
    }

    try {
      setLoading(true);

      await axios.post("http://localhost:5000/api/supporters", form);

      alert("Welcome to the movement!");
      setForm({ name: "", phone: "", ward: "", category: "" });

    } catch (err: any) {
      setError(err.response?.data?.error || "Error submitting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-700 to-blue-500 p-4">

      <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md">

        <h1 className="text-2xl font-bold text-center mb-2 text-blue-700">
          Join the Movement
        </h1>

        <p className="text-center text-gray-500 mb-6 text-sm">
          Support the campaign for change in Kitui
        </p>

        {/* ERROR */}
        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        />

        <input
          name="phone"
          placeholder="Phone (10 digits)"
          value={form.phone}
          onChange={handleChange}
          maxLength={10}
          className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        />

        <input
          name="ward"
          placeholder="Ward"
          value={form.ward}
          onChange={handleChange}
          className="w-full p-3 mb-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        />

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        >
          <option value="">Select Category</option>
          <option value="youth">Youth</option>
          <option value="farmer">Farmer</option>
          <option value="business">Business</option>
          <option value="other">Other</option>
        </select>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {loading ? "Submitting..." : "Join Now"}
        </button>

      </div>
    </div>
  );
}