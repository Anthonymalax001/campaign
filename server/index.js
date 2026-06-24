const express = require("express");
const cors = require("cors");
const pool = require("./db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

/* ---------- UPLOADS ---------- */
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + safe);
  }
});

const upload = multer({ storage });

/* ===============================
   🔐 LOGIN
================================ */
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM admins WHERE username=$1",
      [username]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: "User not found" });

    const user = result.rows[0];

    if (user.password !== password)
      return res.status(401).json({ error: "Wrong password" });

    const expiresAt = Date.now() + 60 * 60 * 1000;

    res.json({
      success: true,
      token: "demo-token",
      expiresAt,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   👥 ADMINS
================================ */
app.post("/api/admins", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const result = await pool.query(
      "INSERT INTO admins (username,password,role) VALUES ($1,$2,$3) RETURNING *",
      [username, password, role || "staff"]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admins", async (req, res) => {
  const result = await pool.query(
    "SELECT id, username, role, created_at FROM admins ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

/* ===============================
   SUPPORTERS
================================ */
app.post("/api/supporters", async (req, res) => {
  try {
    const { name, phone, ward, category } = req.body;

    const result = await pool.query(
      "INSERT INTO supporters (name,phone,ward,category) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, phone, ward, category]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   ISSUES
================================ */
app.post("/api/issues", async (req, res) => {
  try {
    const { title, description, ward } = req.body;

    const result = await pool.query(
      "INSERT INTO issues (title,description,ward) VALUES ($1,$2,$3) RETURNING *",
      [title, description, ward]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   🔥 UPDATES (CRUD)
================================ */

/* CREATE */
app.post("/api/updates", upload.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      "INSERT INTO updates (title,content,image) VALUES ($1,$2,$3) RETURNING *",
      [title, content, image]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* READ */
app.get("/api/updates", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM updates ORDER BY created_at DESC LIMIT 10"
  );
  res.json(result.rows);
});

/* DELETE */
app.delete("/api/updates/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM updates WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* UPDATE */
app.put("/api/updates/:id", async (req, res) => {
  try {
    const { title, content } = req.body;

    const result = await pool.query(
      "UPDATE updates SET title=$1, content=$2 WHERE id=$3 RETURNING *",
      [title, content, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   📅 EVENTS (CRUD)
================================ */

app.post("/api/events", async (req, res) => {
  try {
    const { title, location, event_date } = req.body;

    const result = await pool.query(
      "INSERT INTO events (title,location,event_date) VALUES ($1,$2,$3) RETURNING *",
      [title, location, event_date]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/events", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM events ORDER BY event_date ASC LIMIT 10"
  );
  res.json(result.rows);
});

/* DELETE */
app.delete("/api/events/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM events WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* UPDATE */
app.put("/api/events/:id", async (req, res) => {
  try {
    const { title, location, event_date } = req.body;

    const result = await pool.query(
      "UPDATE events SET title=$1, location=$2, event_date=$3 WHERE id=$4 RETURNING *",
      [title, location, event_date, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   🖼️ GALLERY
================================ */

app.post("/api/gallery", upload.single("image"), async (req, res) => {
  try {
    const caption = req.body.caption || "";
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      "INSERT INTO gallery (image,caption) VALUES ($1,$2) RETURNING *",
      [image, caption]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/gallery", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM gallery ORDER BY created_at DESC LIMIT 20"
  );
  res.json(result.rows);
});

/* DELETE */
app.delete("/api/gallery/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM gallery WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =============================== */
app.listen(5000, () => {
  console.log("Server running on port 5000");
});