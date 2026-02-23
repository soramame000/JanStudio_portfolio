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
const RAW_CMS_BASE_URL = String(process.env.CMS_BASE_URL || "").replace(/\/+$/, "");
const CMS_API_KEY = String(process.env.CMS_API_KEY || "");
const MAX_IMAGE_BYTES = Number(process.env.MAX_IMAGE_BYTES || 950_000);

const sessions = new Map();
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function normalizeCmsBaseUrl(rawUrl) {
  const stripped = String(rawUrl || "").replace(/\/+$/, "").replace(/\/photos$/, "");
  if (!stripped) return "";
  return stripped.endsWith("/api/v1") ? stripped : `${stripped}/api/v1`;
}

const CMS_BASE_URL = normalizeCmsBaseUrl(RAW_CMS_BASE_URL);

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
  const candidates = [`${CMS_BASE_URL}/media`, `${CMS_BASE_URL}/media/upload`, `${CMS_BASE_URL}/upload`];
  const errors = [];

  for (const url of candidates) {
    const form = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype || "application/octet-stream" });
    form.append("file", blob, file.originalname);

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "X-API-KEY": CMS_API_KEY,
          "X-MICROCMS-API-KEY": CMS_API_KEY
        },
        body: form
      });
    } catch (error) {
      errors.push(`${url} => network error: ${error instanceof Error ? error.message : "unknown"}`);
      continue;
    }

    if (!response.ok) {
      const reason = await response.text().catch(() => "");
      errors.push(`${url} => ${response.status} ${response.statusText} ${reason}`.slice(0, 260));
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

  throw new Error(
    `media/upload endpoint failed. Check CMS_BASE_URL and API key type/permissions. details: ${errors.join(
      " | "
    )}`
  );
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
    const imageUrlFromForm = String(req.body?.imageUrl || "").trim();
    const hasImageFile = Boolean(req.file && req.file.size > 0);
    if (!hasImageFile && !imageUrlFromForm) {
      return res.status(400).json({ message: "imageFile or imageUrl is required" });
    }

    if (hasImageFile && req.file.size > MAX_IMAGE_BYTES) {
      const sizeMb = (req.file.size / (1024 * 1024)).toFixed(1);
      const maxMb = (MAX_IMAGE_BYTES / (1024 * 1024)).toFixed(1);
      return res.status(413).json({
        message: `画像サイズが大きすぎます（現在 ${sizeMb}MB / 上限 ${maxMb}MB）。書き出しサイズを下げて再アップロードしてください。`
      });
    }

    const title = String(req.body?.title || "").trim();
    const genre = String(req.body?.genre || "").trim();
    if (!title || !genre) {
      return res.status(400).json({ message: "title and genre are required" });
    }

    const imageUrl = imageUrlFromForm || (hasImageFile ? await uploadToMicroCMS(req.file) : "");
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
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      const maxMb = (MAX_IMAGE_BYTES / (1024 * 1024)).toFixed(1);
      return res.status(413).json({
        message: `画像サイズが上限を超えています（上限 ${maxMb}MB）。`
      });
    }
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
