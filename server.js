const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");

const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const uploadDir = path.join(rootDir, "assets", "uploads");
const contentFile = path.join(dataDir, "content.json");
const port = Number(process.env.PORT || 4174);
const sessions = new Set();

const defaultProjectData = [
  ["portrait-26", "Portrait26", "Portrait work, studies and selected faces.", "50% 40%"],
  ["portfolio-studio", "Portfolio Studio", "Studio experiments, edits and visual systems.", "50% 50%"],
  ["movies", "Movies", "Moving image, tests and short video fragments.", "50% 50%"],
  ["beach-series", "La Familia / The Beach", "A photographic series around bodies, colour and coast.", "50% 55%"],
  ["dance-study", "Dance Study", "Movement research, shadow, gesture and blur.", "50% 45%"],
  ["archive-notes", "Archive Notes", "Personal references, layouts and collected images.", "50% 50%"],
  ["color-studies", "Color Studies", "Experiments with palette, surface and atmosphere.", "50% 50%"],
  ["commissions", "Commissions", "Selected client and commissioned work.", "50% 50%"],
  ["editorial", "Editorial", "Image-led stories and publication tests.", "50% 50%"],
  ["personal-work", "Personal Work", "Open-ended studies and independent series.", "50% 50%"],
  ["research", "Research", "Visual Research", "50% 50%"],
  ["portfolio-26", "Portfolio26", "Current portfolio selection.", "50% 50%"],
];

const defaultContent = {
  settings: {
    backgroundImage: "assets/beach-desktop.jpg",
    windowBackground: "#ffffff",
    windowText: "#202020",
    windowBar: "#e0b6b6",
    windowAccent: "#ffffff",
  },
  projects: defaultProjectData.map(([id, title, description, position], index) => ({
    id,
    title,
    description,
    short: "A selected project folder. Replace text, images, videos and colour in the backend.",
    folderColor: index % 3 === 0 ? "#a05d62" : index % 3 === 1 ? "#00a9a8" : "#ff8b00",
    titleImage: index % 3 === 0 ? "assets/f1-photo.jpg" : "assets/beach-desktop.jpg",
    imagePosition: position,
    photos: ["assets/beach-desktop.jpg", "assets/f1-photo.jpg", "assets/background-dancer.jpg"],
    videos: [],
  })),
  pages: {
    about: {
      kicker: "SINA MICHELE MANETSCH",
      title: "Visual culture, photography and image worlds.",
      body: "A portfolio desktop for projects, series, contact information and notes.",
      photo: "",
    },
    contact: {
      title: "Contact",
      body: "Click any item to copy it.",
      name: "Sina Michèle Manetsch",
      email: "hello@example.com",
      photo: "",
      items: [
        { label: "Email", value: "hello@example.com", href: "mailto:hello@example.com" },
        { label: "Instagram", value: "@sinamichele", href: "https://instagram.com/" },
        { label: "Location", value: "Zurich / Paris", href: "" },
      ],
    },
  },
  blog: [
    {
      id: "first-note",
      title: "First note",
      excerpt: "A small field note.",
      date: "",
      category: "Journal",
      author: "Sina Michele Manetsch",
      body: "A small field note.",
      image: "",
      titleImage: "",
      secondImage: "",
      youtube: "",
      template: "editorial",
      fontFamily: "serif",
      titleSize: 46,
      bodySize: 16,
      imageScale: 100,
      imagePosition: "center",
    },
  ],
  media: [],
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".ico": "image/x-icon",
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function getCookie(req, name) {
  const cookies = req.headers.cookie || "";
  return cookies
    .split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([key]) => key === name)?.[1];
}

function isAuthenticated(req) {
  const sessionId = getCookie(req, "sina_session");
  return Boolean(sessionId && sessions.has(sessionId));
}

async function readBodyBuffer(req, limit = 80 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error("Request body too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readBody(req, limit = 25 * 1024 * 1024) {
  return (await readBodyBuffer(req, limit)).toString("utf8");
}

async function readJson(req) {
  const body = await readBody(req);
  return body ? JSON.parse(body) : {};
}

function normalizeContent(input) {
  const content = structuredClone(defaultContent);
  content.settings = { ...content.settings, ...(input.settings || {}) };
  content.projects = Array.isArray(input.projects)
    ? input.projects.map((project) => ({
      id: "",
      title: "",
      description: "",
      short: "",
      folderColor: "#00a9a8",
      titleImage: "assets/beach-desktop.jpg",
      imagePosition: "center",
      photos: [],
      videos: [],
      ...project,
    }))
    : content.projects;
  content.pages = {
    about: { ...content.pages.about, ...(input.pages?.about || {}) },
    contact: { ...content.pages.contact, ...(input.pages?.contact || {}) },
  };
  content.blog = Array.isArray(input.blog)
    ? input.blog.map((post) => ({
      id: "",
      title: "",
      excerpt: "",
      date: "",
      category: "",
      author: "",
      body: "",
      image: "",
      titleImage: "",
      secondImage: "",
      youtube: "",
      template: "editorial",
      fontFamily: "serif",
      titleSize: 46,
      bodySize: 16,
      imageScale: 100,
      imagePosition: "center",
      ...post,
    }))
    : content.blog;
  content.media = Array.isArray(input.media) ? input.media : [];
  return content;
}

async function loadContent() {
  try {
    const raw = await fs.readFile(contentFile, "utf8");
    return normalizeContent(JSON.parse(raw));
  } catch {
    await saveContent(defaultContent);
    return structuredClone(defaultContent);
  }
}

async function saveContent(content) {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    const current = await fs.readFile(contentFile, "utf8");
    const backupDir = path.join(dataDir, "backups");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await fs.mkdir(backupDir, { recursive: true });
    await fs.writeFile(path.join(backupDir, `content-${stamp}.json`), current);
  } catch {
    // No previous content exists yet.
  }
  await fs.writeFile(contentFile, `${JSON.stringify(normalizeContent(content), null, 2)}\n`);
}

function safeFilename(name) {
  const parsed = path.parse(name || "upload");
  const base = parsed.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase() || "upload";
  const ext = (parsed.ext || ".jpg").toLowerCase().replace(/[^.a-z0-9]/g, "");
  return `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${base}${ext}`;
}

function execFileAsync(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function convertUploadToSrgb(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".tif", ".tiff"].includes(ext)) return false;

  try {
    await execFileAsync("sips", [
      "-m",
      "/System/Library/ColorSync/Profiles/sRGB Profile.icc",
      filePath,
    ]);
    return true;
  } catch {
    return false;
  }
}

function parseMultipartUpload(req, buffer) {
  const contentType = req.headers["content-type"] || "";
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1] || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];
  if (!boundary) return null;

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let cursor = buffer.indexOf(boundaryBuffer);
  while (cursor !== -1) {
    const next = buffer.indexOf(boundaryBuffer, cursor + boundaryBuffer.length);
    if (next === -1) break;

    let part = buffer.subarray(cursor + boundaryBuffer.length, next);
    if (part.subarray(0, 2).toString("latin1") === "\r\n") part = part.subarray(2);
    if (part.subarray(part.length - 2).toString("latin1") === "\r\n") part = part.subarray(0, part.length - 2);

    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd !== -1) {
      const headers = part.subarray(0, headerEnd).toString("latin1");
      const body = part.subarray(headerEnd + 4);
      const disposition = headers.match(/content-disposition:\s*([^\r\n]+)/i)?.[1] || "";
      const filename = disposition.match(/filename="([^"]+)"/i)?.[1];
      const fieldName = disposition.match(/name="([^"]+)"/i)?.[1];
      const type = headers.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || "application/octet-stream";
      if (fieldName === "file" && filename) return { filename, type, buffer: body };
    }

    cursor = next;
  }
  return null;
}

async function handleUpload(req, res) {
  if (!isAuthenticated(req)) {
    sendJson(res, 401, { error: "Not logged in" });
    return;
  }

  let upload = null;
  if ((req.headers["content-type"] || "").includes("multipart/form-data")) {
    const body = await readBodyBuffer(req);
    upload = parseMultipartUpload(req, body);
  } else {
    const payload = await readJson(req);
    const match = String(payload.dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      upload = {
        filename: payload.name || "upload.jpg",
        type: match[1],
        buffer: Buffer.from(match[2], "base64"),
      };
    }
  }

  if (!upload) {
    sendJson(res, 400, { error: "Upload expects an image file." });
    return;
  }

  const filename = safeFilename(upload.filename);
  const relativePath = `assets/uploads/${filename}`;
  const uploadPath = path.join(uploadDir, filename);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(uploadPath, upload.buffer);
  const convertedToSrgb = await convertUploadToSrgb(uploadPath);

  const content = await loadContent();
  const item = {
    id: `media-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    name: upload.filename || filename,
    type: upload.type,
    path: relativePath,
    colorSpace: convertedToSrgb ? "sRGB" : "original",
    createdAt: new Date().toISOString(),
  };
  content.media.unshift(item);
  await saveContent(content);
  sendJson(res, 201, { item, content });
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (url.pathname === "/api/session") {
    sendJson(res, 200, { authenticated: isAuthenticated(req) });
    return true;
  }

  if (url.pathname === "/api/login" && req.method === "POST") {
    const payload = await readJson(req);
    if (payload.username === "admin" && payload.password === "admin") {
      const sessionId = crypto.randomBytes(24).toString("hex");
      sessions.add(sessionId);
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": `sina_session=${sessionId}; HttpOnly; SameSite=Lax; Path=/`,
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify({ authenticated: true }));
      return true;
    }
    sendJson(res, 401, { error: "Wrong login" });
    return true;
  }

  if (url.pathname === "/api/logout" && req.method === "POST") {
    const sessionId = getCookie(req, "sina_session");
    if (sessionId) sessions.delete(sessionId);
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": "sina_session=; Max-Age=0; SameSite=Lax; Path=/",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify({ authenticated: false }));
    return true;
  }

  if (url.pathname === "/api/content" && req.method === "GET") {
    sendJson(res, 200, await loadContent());
    return true;
  }

  if (url.pathname === "/api/content" && req.method === "PUT") {
    if (!isAuthenticated(req)) {
      sendJson(res, 401, { error: "Not logged in" });
      return true;
    }
    const payload = await readJson(req);
    await saveContent(payload);
    sendJson(res, 200, await loadContent());
    return true;
  }

  if (url.pathname === "/api/upload" && req.method === "POST") {
    await handleUpload(req, res);
    return true;
  }

  return false;
}

async function serveStatic(req, res, url) {
  const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(rootDir, requestedPath));
  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": [".html", ".js", ".css", ".json"].includes(ext) ? "no-store" : "public, max-age=60",
    });
    res.end(file);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      const handled = await handleApi(req, res, url);
      if (!handled) sendJson(res, 404, { error: "API route not found" });
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
});

async function start() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadDir, { recursive: true });
  await loadContent();
  server.listen(port, "127.0.0.1", () => {
    console.log(`Backend running at http://127.0.0.1:${port}`);
  });
}

start();
