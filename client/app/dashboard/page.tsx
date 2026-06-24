"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [supporters, setSupporters] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>("ALL");

  const router = useRouter();

  /* 🔒 PROTECT */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const sup = await axios.get("http://localhost:5000/api/supporters");
      const iss = await axios.get("http://localhost:5000/api/issues");

      setSupporters(sup.data);
      setIssues(iss.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------- GROUP BY WARD ---------- */
  const supportersByWard = Object.entries(
    supporters.reduce((acc: any, s: any) => {
      acc[s.ward] = (acc[s.ward] || 0) + 1;
      return acc;
    }, {})
  );

  const supportersChartData = supportersByWard.map(([ward, count]: any) => ({
    ward,
    count
  }));

  /* 🔥 HOTSPOTS */
  const hotspots = [...supportersByWard]
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 3);

  /* ---------- UNIQUE WARDS ---------- */
  const wards = [...new Set(supporters.map((s) => s.ward))];

  /* ---------- FILTERED SUPPORTERS ---------- */
  const filteredSupporters =
    selectedWard === "ALL"
      ? supporters
      : supporters.filter((s) => s.ward === selectedWard);

  /* 🔥 ACTION: SIMULATED SMS */
  const handleSendSMS = () => {
    if (filteredSupporters.length === 0) {
      alert("No supporters in this ward");
      return;
    }

    const numbers = filteredSupporters.map((s) => s.phone);

    console.log("Sending SMS to:", numbers);

    alert(
      `SMS will be sent to ${numbers.length} supporters in ${
        selectedWard === "ALL" ? "all wards" : selectedWard
      }`
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Campaign Dashboard</h1>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2>Total Supporters</h2>
          <p className="text-3xl font-bold">{supporters.length}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2>Issues</h2>
          <p className="text-3xl font-bold">{issues.length}</p>
        </div>
      </div>

      {/* 🔥 HOTSPOTS */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-bold mb-4 text-red-600">
          🔥 Top Wards (Hotspots)
        </h2>

        {hotspots.length === 0 && (
          <p className="text-gray-500">No data yet</p>
        )}

        {hotspots.map(([ward, count]: any, index) => (
          <div key={ward} className="flex justify-between border-b py-2">
            <span>{index + 1}. {ward}</span>
            <span className="font-bold text-red-600">
              {count} supporters
            </span>
          </div>
        ))}
      </div>

      {/* CHART */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="mb-4 font-bold">Supporters by Ward</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={supportersChartData}>
            <XAxis dataKey="ward" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 🔥 WARD FILTER */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-bold mb-4">Filter by Ward</h2>

        <select
          className="p-2 border rounded"
          value={selectedWard}
          onChange={(e) => setSelectedWard(e.target.value)}
        >
          <option value="ALL">All Wards</option>

          {wards.map((w: any) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      {/* 🔥 ACTION PANEL */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-bold mb-4 text-blue-700">
          Campaign Actions
        </h2>

        <p className="mb-2">
          Selected Ward:{" "}
          <span className="font-bold">
            {selectedWard === "ALL" ? "All Wards" : selectedWard}
          </span>
        </p>

        <p className="mb-4">
          Target Supporters:{" "}
          <span className="font-bold text-blue-600">
            {filteredSupporters.length}
          </span>
        </p>

        <div className="flex gap-4 flex-wrap">

          <button
            onClick={handleSendSMS}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Send SMS (Simulated)
          </button>

          <button
            onClick={() => {
              const data = filteredSupporters
                .map((s) => `${s.name} - ${s.phone} - ${s.ward}`)
                .join("\n");

              navigator.clipboard.writeText(data);
              alert("Supporters copied!");
            }}
            className="bg-gray-700 text-white px-4 py-2 rounded"
          >
            Copy Contacts
          </button>

        </div>
      </div>

      {/* 🔥 SUPPORTERS LIST */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-4">
          Supporters ({selectedWard})
        </h2>

        {filteredSupporters.length === 0 && (
          <p className="text-gray-500">No supporters found</p>
        )}

        {filteredSupporters.map((s: any) => (
          <div key={s.id} className="border-b py-2">
            <p className="font-semibold">{s.name}</p>
            <p className="text-sm text-gray-600">
              {s.phone} — {s.ward}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}