const path = require("path");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = Number(process.env.PORT || 8787);
const APP_PASSWORD = String(process.env.APP_PASSWORD || "");
const CMS_BASE_URL = String(process.env.CMS_BASE_URL || "").replace(/\/$/, "");
const CMS_API_KEY = String(process.env.CMS_API_KEY || "");

const sessions = new Map();
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function createSession() {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function authGuard(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const expiresAt = sessions.get(token);
  if (!token || !expiresAt || expiresAt < Date.now()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function uploadToMicroCMS(file) {
  const candidates = [
    `${CMS_BASE_URL}/media`,
    `${CMS_BASE_URL}/upload`
  ];

  for (const url of candidates) {
    const form = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype || "application/octet-stream" });
    form.append("file", blob, file.originalname);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-KEY": CMS_API_KEY
      },
      body: form
    });

    if (!response.ok) {
      continue;
    }

    const data = await response.json();
    const imageUrl =
      data?.url ||
      data?.image?.url ||
      data?.file?.url ||
      data?.media?.url ||
      "";
    if (imageUrl) {
      return imageUrl;
    }
  }

  throw new Error("media/upload endpoint failed");
}

async function createPhotoEntry(payload) {
  const endpoint = `${CMS_BASE_URL}/photos`;
  const payloadVariants = [payload, { ...payload, image: payload.image?.url || "" }];

  for (const body of payloadVariants) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": CMS_API_KEY
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      continue;
    }
    return response.json();
  }

  throw new Error("photos entry create failed");
}

function requireEnv(res) {
  if (!APP_PASSWORD || !CMS_BASE_URL || !CMS_API_KEY) {
    res.status(500).json({
      message: "Missing required .env values. Check APP_PASSWORD/CMS_BASE_URL/CMS_API_KEY."
    });
    return false;
  }
  return true;
}

app.post("/api/login", (req, res) => {
  if (!requireEnv(res)) return;

  const password = String(req.body?.password || "");
  if (!password || password !== APP_PASSWORD) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const token = createSession();
  return res.json({ token });
});

app.post("/api/upload-photo", authGuard, upload.single("imageFile"), async (req, res) => {
  try {
    if (!requireEnv(res)) return;
    if (!req.file) {
      return res.status(400).json({ message: "imageFile is required" });
    }

    const title = String(req.body?.title || "").trim();
    const genre = String(req.body?.genre || "").trim();
    if (!title || !genre) {
      return res.status(400).json({ message: "title and genre are required" });
    }

    const imageUrl = await uploadToMicroCMS(req.file);
    const tags = String(req.body?.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      title,
      genre,
      caption: String(req.body?.caption || "").trim(),
      image: { url: imageUrl },
      eventDate: String(req.body?.eventDate || "").trim(),
      team: String(req.body?.team || "").trim(),
      location: String(req.body?.location || "").trim(),
      tags,
      publishStatus: String(req.body?.publishStatus || "draft"),
      featuredPriority: req.body?.featuredPriority ? Number(req.body.featuredPriority) : undefined,
      projectId: String(req.body?.projectId || "").trim()
    };

    Object.keys(payload).forEach((key) => {
      if (
        payload[key] === "" ||
        payload[key] === undefined ||
        (Array.isArray(payload[key]) && payload[key].length === 0)
      ) {
        delete payload[key];
      }
    });

    const created = await createPhotoEntry(payload);
    return res.json({ id: created.id || null, imageUrl });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "upload failed"
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Uploader app running on http://localhost:${PORT}`);
});
