const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const pool = require("./db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;
const SESSION_MS = 60 * 60 * 1000;
const sessions = new Map();

app.use(cors());
app.use(express.json());

/* ---------- UPLOADS ---------- */
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9_-]/gi, "_")
      .slice(0, 60);
    const suffix = crypto.randomBytes(6).toString("hex");

    cb(null, `${Date.now()}-${name || "image"}-${suffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }

    cb(null, true);
  }
});

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const createToken = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(32).toString("hex");
};

const getToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7);
  return req.headers["x-admin-token"];
};

const getSession = (req) => {
  const token = getToken(req);
  if (!token) return null;

  const session = sessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  return session;
};

const authenticateAdmin = (req, res, next) => {
  const session = getSession(req);

  if (!session) {
    return res.status(401).json({ error: "Admin authentication required" });
  }

  req.admin = session.user;
  next();
};

const requireRoles = (...roles) => (req, res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  next();
};

const requireContentEditor = [
  authenticateAdmin,
  requireRoles("staff", "superadmin")
];

const requireSuperadmin = [
  authenticateAdmin,
  requireRoles("superadmin")
];

const normalizeRole = (role) => {
  if (role === "superadmin") return "superadmin";
  return "staff";
};

const deleteUploadedFile = async (publicPath) => {
  if (!publicPath || !publicPath.startsWith("/uploads/")) return;

  const filePath = path.resolve(uploadDir, path.basename(publicPath));
  const resolvedUploadDir = path.resolve(uploadDir);

  if (!filePath.startsWith(resolvedUploadDir)) return;

  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn("Unable to delete uploaded file:", err.message);
    }
  }
};

const createAdmin = async ({ username, password, role }) => {
  const result = await pool.query(
    "INSERT INTO admins (username,password,role) VALUES ($1,$2,$3) RETURNING id, username, role, created_at",
    [username, password, normalizeRole(role)]
  );

  return result.rows[0];
};

/* ===============================
   LOGIN
================================ */
app.post(
  "/api/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const result = await pool.query("SELECT * FROM admins WHERE username=$1", [
      username
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = result.rows[0];

    if (user.password !== password) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const expiresAt = Date.now() + SESSION_MS;
    const token = createToken();
    const safeUser = {
      id: user.id,
      username: user.username,
      role: normalizeRole(user.role)
    };

    sessions.set(token, {
      expiresAt,
      user: safeUser
    });

    res.json({
      success: true,
      token,
      expiresAt,
      user: safeUser
    });
  })
);

app.get(
  "/api/me",
  authenticateAdmin,
  asyncHandler(async (req, res) => {
    res.json(req.admin);
  })
);

/* ===============================
   ADMINS
================================ */
app.post(
  "/api/admins",
  asyncHandler(async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const countResult = await pool.query("SELECT COUNT(*)::int AS count FROM admins");
    const hasAdmins = Number(countResult.rows[0]?.count || 0) > 0;

    if (hasAdmins) {
      const session = getSession(req);
      if (!session) {
        return res.status(401).json({ error: "Admin authentication required" });
      }

      if (session.user.role !== "superadmin") {
        return res.status(403).json({ error: "Only superadmins can create admins" });
      }
    }

    const admin = await createAdmin({
      username: username.trim(),
      password,
      role: hasAdmins ? role : "superadmin"
    });

    res.json(admin);
  })
);

app.get(
  "/api/admins",
  ...requireSuperadmin,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT id, username, role, created_at FROM admins ORDER BY created_at DESC"
    );
    res.json(result.rows);
  })
);

/* ===============================
   SUPPORTERS
================================ */
app.post(
  "/api/supporters",
  asyncHandler(async (req, res) => {
    const { name, phone, ward, category } = req.body;

    if (!name || !phone || !ward || !category) {
      return res.status(400).json({ error: "All supporter fields are required" });
    }

    const result = await pool.query(
      "INSERT INTO supporters (name,phone,ward,category) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, phone, ward, category]
    );

    res.json(result.rows[0]);
  })
);

app.get(
  "/api/supporters",
  ...requireContentEditor,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM supporters ORDER BY created_at DESC"
    );
    res.json(result.rows);
  })
);

/* ===============================
   ISSUES
================================ */
app.post(
  "/api/issues",
  asyncHandler(async (req, res) => {
    const { title, description, ward } = req.body;

    if (!title || !description || !ward) {
      return res.status(400).json({ error: "All issue fields are required" });
    }

    const result = await pool.query(
      "INSERT INTO issues (title,description,ward) VALUES ($1,$2,$3) RETURNING *",
      [title, description, ward]
    );

    res.json(result.rows[0]);
  })
);

app.get(
  "/api/issues",
  ...requireContentEditor,
  asyncHandler(async (req, res) => {
    const result = await pool.query("SELECT * FROM issues ORDER BY created_at DESC");
    res.json(result.rows);
  })
);

/* ===============================
   UPDATES
================================ */
app.post(
  "/api/updates",
  ...requireContentEditor,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !content) {
      if (image) await deleteUploadedFile(image);
      return res.status(400).json({ error: "Title and content are required" });
    }

    const result = await pool.query(
      "INSERT INTO updates (title,content,image) VALUES ($1,$2,$3) RETURNING *",
      [title, content, image]
    );

    res.json(result.rows[0]);
  })
);

app.get(
  "/api/updates",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const result = await pool.query(
      "SELECT * FROM updates ORDER BY created_at DESC LIMIT $1",
      [limit]
    );
    res.json(result.rows);
  })
);

app.put(
  "/api/updates/:id",
  ...requireContentEditor,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const { title, content, removeImage } = req.body;

    if (!title || !content) {
      if (req.file) await deleteUploadedFile(`/uploads/${req.file.filename}`);
      return res.status(400).json({ error: "Title and content are required" });
    }

    const existing = await pool.query("SELECT * FROM updates WHERE id=$1", [
      req.params.id
    ]);

    if (existing.rows.length === 0) {
      if (req.file) await deleteUploadedFile(`/uploads/${req.file.filename}`);
      return res.status(404).json({ error: "Update not found" });
    }

    const previousImage = existing.rows[0].image;
    const nextImage = req.file
      ? `/uploads/${req.file.filename}`
      : removeImage === "true"
        ? null
        : previousImage;

    const result = await pool.query(
      "UPDATE updates SET title=$1, content=$2, image=$3 WHERE id=$4 RETURNING *",
      [title, content, nextImage, req.params.id]
    );

    if ((req.file || removeImage === "true") && previousImage) {
      await deleteUploadedFile(previousImage);
    }

    res.json(result.rows[0]);
  })
);

app.delete(
  "/api/updates/:id",
  ...requireSuperadmin,
  asyncHandler(async (req, res) => {
    const existing = await pool.query("SELECT image FROM updates WHERE id=$1", [
      req.params.id
    ]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Update not found" });
    }

    await pool.query("DELETE FROM updates WHERE id=$1", [req.params.id]);
    await deleteUploadedFile(existing.rows[0].image);

    res.json({ success: true });
  })
);

/* ===============================
   EVENTS
================================ */
app.post(
  "/api/events",
  ...requireContentEditor,
  asyncHandler(async (req, res) => {
    const { title, location, event_date } = req.body;

    if (!title || !location || !event_date) {
      return res.status(400).json({ error: "Title, location, and date are required" });
    }

    const result = await pool.query(
      "INSERT INTO events (title,location,event_date) VALUES ($1,$2,$3) RETURNING *",
      [title, location, event_date]
    );

    res.json(result.rows[0]);
  })
);

app.get(
  "/api/events",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const showAll = req.query.scope === "all";

    if (showAll) {
      const session = getSession(req);
      if (!session) {
        return res.status(401).json({ error: "Admin authentication required" });
      }
    }

    const query = showAll
      ? "SELECT * FROM events ORDER BY event_date ASC LIMIT $1"
      : "SELECT * FROM events WHERE event_date >= NOW() ORDER BY event_date ASC LIMIT $1";

    const result = await pool.query(query, [limit]);
    res.json(result.rows);
  })
);

app.put(
  "/api/events/:id",
  ...requireContentEditor,
  asyncHandler(async (req, res) => {
    const { title, location, event_date } = req.body;

    if (!title || !location || !event_date) {
      return res.status(400).json({ error: "Title, location, and date are required" });
    }

    const result = await pool.query(
      "UPDATE events SET title=$1, location=$2, event_date=$3 WHERE id=$4 RETURNING *",
      [title, location, event_date, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(result.rows[0]);
  })
);

app.delete(
  "/api/events/:id",
  ...requireSuperadmin,
  asyncHandler(async (req, res) => {
    const result = await pool.query("DELETE FROM events WHERE id=$1 RETURNING *", [
      req.params.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ success: true });
  })
);

/* ===============================
   GALLERY
================================ */
app.post(
  "/api/gallery",
  ...requireContentEditor,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const caption = req.body.caption || "";
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!image) {
      return res.status(400).json({ error: "Gallery image is required" });
    }

    const result = await pool.query(
      "INSERT INTO gallery (image,caption) VALUES ($1,$2) RETURNING *",
      [image, caption]
    );

    res.json(result.rows[0]);
  })
);

app.get(
  "/api/gallery",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await pool.query(
      "SELECT * FROM gallery ORDER BY created_at DESC LIMIT $1",
      [limit]
    );
    res.json(result.rows);
  })
);

app.delete(
  "/api/gallery/:id",
  ...requireSuperadmin,
  asyncHandler(async (req, res) => {
    const existing = await pool.query("SELECT image FROM gallery WHERE id=$1", [
      req.params.id
    ]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Gallery photo not found" });
    }

    await pool.query("DELETE FROM gallery WHERE id=$1", [req.params.id]);
    await deleteUploadedFile(existing.rows[0].image);

    res.json({ success: true });
  })
);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  if (err.message === "Only image uploads are allowed") {
    return res.status(400).json({ error: err.message });
  }

  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
