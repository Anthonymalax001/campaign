"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Login() {
  const [form, setForm] = useState({
    username: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/api/login", form);

      /* ✅ USE SERVER EXPIRY */
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("token_expiry", res.data.expiresAt.toString());

      /* ✅ SAVE USER */
      localStorage.setItem("admin", JSON.stringify(res.data.user));

      alert("Login successful");
      router.push("/admin");

    } catch (err: any) {
      alert(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-700 to-blue-500 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">

        <h1 className="text-2xl font-bold mb-2 text-center text-blue-700">
          Admin Login
        </h1>

        <p className="text-center text-gray-500 mb-4 text-sm">
          Access campaign dashboard
        </p>

        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
          className="w-full p-3 mb-3 border rounded-lg"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full p-3 mb-4 border rounded-lg"
        />

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </div>
    </div>
  );
}