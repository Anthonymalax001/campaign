"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Admin() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);

  /* AUTH */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const expiry = localStorage.getItem("token_expiry");
    const stored = localStorage.getItem("admin");

    if (!token || !expiry || Date.now() > parseInt(expiry)) {
      localStorage.clear();
      router.push("/login");
      return;
    }

    if (stored) setAdmin(JSON.parse(stored));
  }, []);

  /* STATE */
  const [updates, setUpdates] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);

  const [newUpdate, setNewUpdate] = useState({
    title: "",
    content: ""
  });

  const [image, setImage] = useState<File | null>(null);

  const [newAdmin, setNewAdmin] = useState({
    username: "",
    password: "",
    role: "staff"
  });

  /* FETCH */
  const fetchData = async () => {
    try {
      const upd = await axios.get("http://localhost:5000/api/updates");
      setUpdates(upd.data);

      if (admin?.role === "superadmin") {
        const ad = await axios.get("http://localhost:5000/api/admins");
        setAdmins(ad.data);
      }

    } catch (err) {
      console.error("FETCH ERROR:", err);
    }
  };

  useEffect(() => {
    if (admin) fetchData();
  }, [admin]);

  /* CREATE UPDATE */
  const createUpdate = async () => {
    if (!newUpdate.title || !newUpdate.content)
      return alert("Fill all fields");

    const formData = new FormData();
    formData.append("title", newUpdate.title);
    formData.append("content", newUpdate.content);
    if (image) formData.append("image", image);

    await axios.post("http://localhost:5000/api/updates", formData);

    setNewUpdate({ title: "", content: "" });
    setImage(null);
    fetchData();
  };

  /* CREATE ADMIN */
  const createAdmin = async () => {
    if (!newAdmin.username || !newAdmin.password)
      return alert("Fill all fields");

    await axios.post("http://localhost:5000/api/admins", newAdmin);

    setNewAdmin({ username: "", password: "", role: "staff" });
    fetchData();
  };

  /* DELETE */
  const deleteUpdate = async (id: number) => {
    await axios.delete(`http://localhost:5000/api/updates/${id}`);
    fetchData();
  };

  if (!admin) return <p className="p-6 text-white">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">Admin Panel</h1>
          <p className="text-gray-400 text-sm">
            {admin.username} ({admin.role})
          </p>
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            router.push("/login");
          }}
          className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* CREATE UPDATE */}
      <div className="bg-gray-800 p-4 rounded mb-6">
        <h2 className="text-blue-300 mb-3 font-semibold">Create Update</h2>

        <input
          placeholder="Title"
          value={newUpdate.title}
          onChange={(e) =>
            setNewUpdate({ ...newUpdate, title: e.target.value })
          }
          className="w-full p-2 mb-2 bg-gray-700 rounded"
        />

        <textarea
          placeholder="Content"
          value={newUpdate.content}
          onChange={(e) =>
            setNewUpdate({ ...newUpdate, content: e.target.value })
          }
          className="w-full p-2 mb-2 bg-gray-700 rounded"
        />

        <input
          type="file"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="mb-3"
        />

        <button
          onClick={createUpdate}
          className="bg-blue-600 px-4 py-2 rounded w-full"
        >
          Post Update
        </button>
      </div>

      {/* ADMIN MANAGEMENT */}
      {admin.role === "superadmin" && (
        <div className="bg-gray-800 p-4 rounded mb-6">
          <h2 className="text-green-300 mb-3 font-semibold">
            Admin Management
          </h2>

          <input
            placeholder="Username"
            value={newAdmin.username}
            onChange={(e) =>
              setNewAdmin({ ...newAdmin, username: e.target.value })
            }
            className="w-full p-2 mb-2 bg-gray-700 rounded"
          />

          <input
            placeholder="Password"
            value={newAdmin.password}
            onChange={(e) =>
              setNewAdmin({ ...newAdmin, password: e.target.value })
            }
            className="w-full p-2 mb-2 bg-gray-700 rounded"
          />

          <select
            value={newAdmin.role}
            onChange={(e) =>
              setNewAdmin({ ...newAdmin, role: e.target.value })
            }
            className="w-full p-2 mb-3 bg-gray-700 rounded"
          >
            <option value="staff">Staff</option>
            <option value="superadmin">Super Admin</option>
          </select>

          <button
            onClick={createAdmin}
            className="bg-green-600 px-4 py-2 rounded w-full"
          >
            Create Admin
          </button>

          {admins.map((a) => (
            <div key={a.id} className="border-b border-gray-700 py-2 mt-2">
              <p>{a.username}</p>
              <p className="text-sm text-gray-400">{a.role}</p>
            </div>
          ))}
        </div>
      )}

      {/* UPDATES LIST */}
      <div className="bg-gray-800 p-4 rounded">
        <h2 className="text-blue-300 mb-3 font-semibold">Updates</h2>

        {updates.length === 0 ? (
          <p className="text-gray-400">No updates yet</p>
        ) : (
          updates.map((u) => (
            <div key={u.id} className="border-b border-gray-700 py-3">
              <p className="font-bold">{u.title}</p>
              <p className="text-gray-400">{u.content}</p>

              {u.image && (
                <img
                  src={`http://localhost:5000${u.image}`}
                  className="mt-2 rounded w-48"
                />
              )}

              <button
                onClick={() => deleteUpdate(u.id)}
                className="text-red-400 text-sm mt-1"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}