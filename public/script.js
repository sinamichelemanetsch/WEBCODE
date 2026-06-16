const desktop = document.querySelector("#desktop");
const template = document.querySelector("#content-template");
const projectGrid = document.querySelector("#projects");
let projectIcons = [];
const settingsToggle = document.querySelector(".settings-toggle");
const settingsPanel = document.querySelector("#layout-settings");
const settingsReset = document.querySelector(".settings-reset");
const settingsSave = document.querySelector(".settings-save");
const settingsExport = document.querySelector(".settings-export");
const settingsGenerated = document.querySelector(".settings-generated");
const layoutInputs = {
  gapX: document.querySelector("#setting-gap-x"),
  gapY: document.querySelector("#setting-gap-y"),
  noiseX: document.querySelector("#setting-noise-x"),
  noiseY: document.querySelector("#setting-noise-y"),
  size: document.querySelector("#setting-size"),
  seed: document.querySelector("#setting-seed"),
  leftMargin: document.querySelector("#setting-left-margin"),
  rightMargin: document.querySelector("#setting-right-margin"),
};
const layoutOutputs = {
  gapX: document.querySelector("#setting-gap-x-value"),
  gapY: document.querySelector("#setting-gap-y-value"),
  noiseX: document.querySelector("#setting-noise-x-value"),
  noiseY: document.querySelector("#setting-noise-y-value"),
  size: document.querySelector("#setting-size-value"),
  seed: document.querySelector("#setting-seed-value"),
  leftMargin: document.querySelector("#setting-left-margin-value"),
  rightMargin: document.querySelector("#setting-right-margin-value"),
};
const windows = new Map();
let topZ = 30;
let iconTopZ = 10;
let movedIcons = new Set();
let suppressProjectClick = false;
const layoutStorageKey = "sinaDesktopFolderLayoutV3";
localStorage.removeItem("sinaSiteContentV1");

const layoutState = {
  gapX: Number(layoutInputs.gapX.value),
  gapY: Number(layoutInputs.gapY.value),
  noiseX: Number(layoutInputs.noiseX.value),
  noiseY: Number(layoutInputs.noiseY.value),
  size: Number(layoutInputs.size.value),
  seed: Number(layoutInputs.seed.value),
  leftMargin: Number(layoutInputs.leftMargin.value),
  rightMargin: Number(layoutInputs.rightMargin.value),
};

const defaultLayoutState = { ...layoutState };
const mobileAppQuery = window.matchMedia("(max-width: 900px)");

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
  ["research", "Research", "Visual research, sketches and project material.", "50% 50%"],
  ["portfolio-26", "Portfolio26", "Current portfolio selection.", "50% 50%"],
];

const defaultSiteData = {
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
      kicker: "",
      title: "",
      body: "",
      photo: "assets/about-portrait-webtext-srgb.jpg",
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
    { id: "first-note", title: "First note", excerpt: "A short note from the studio.", date: "", category: "Journal", author: "Sina Michele Manetsch", body: "Write new blog posts in the backend. Add images or a YouTube embed whenever needed.", image: "", titleImage: "", secondImage: "", youtube: "", template: "editorial", fontFamily: "serif", titleSize: 46, bodySize: 16, imageScale: 100, imagePosition: "center" },
  ],
  media: [],
};

let siteData = loadSiteData();
let projects = {};
let pages = {};

function focusWindow(win) {
  topZ = topZ >= 55 ? 31 : topZ + 1;
  win.style.zIndex = topZ;
}

function loadSiteData() {
  return structuredClone(defaultSiteData);
}

function normalizeSiteData(stored) {
  const next = structuredClone(defaultSiteData);
  next.settings = { ...next.settings, ...(stored.settings || {}) };
  next.projects = (stored.projects || []).map((project) => ({
    short: "",
    folderColor: "#00a9a8",
    titleImage: "assets/beach-desktop.jpg",
    imagePosition: "center",
    photos: [],
    videos: [],
    ...project,
  }));
  next.pages = {
    about: { ...next.pages.about, ...(stored.pages?.about || {}) },
    contact: { ...next.pages.contact, ...(stored.pages?.contact || {}) },
  };
  next.blog = (stored.blog || []).map((post) => ({
    excerpt: "",
    date: "",
    category: "",
    author: "",
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
  }));
  next.media = Array.isArray(stored.media) ? stored.media : [];
  return next;
}

async function loadBackendSiteData() {
  try {
    const response = await fetch("/api/content", { cache: "no-store" });
    if (!response.ok) throw new Error("No backend content");
    return normalizeSiteData(await response.json());
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cssUrl(value) {
  return `url('${String(value || "assets/beach-desktop.jpg").replaceAll("'", "%27")}')`;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function blogStyle(post) {
  const titleSize = clampNumber(post.titleSize, 24, 96, 46);
  const bodySize = clampNumber(post.bodySize, 12, 28, 16);
  const imageScale = clampNumber(post.imageScale, 30, 100, 100);
  const font = ["serif", "sans", "mono", "condensed"].includes(post.fontFamily) ? post.fontFamily : "serif";
  const templateName = ["editorial", "poster", "text"].includes(post.template) ? post.template : "editorial";
  return {
    className: `template-${templateName} font-${font}`,
    vars: `--blog-title-size:${titleSize}px; --blog-body-size:${bodySize}px; --blog-image-scale:${imageScale}%; --blog-image-pos:${escapeHtml(post.imagePosition || "center")};`,
  };
}

function applySiteTheme() {
  desktop.style.setProperty("--desktop-bg", cssUrl(siteData.settings?.backgroundImage || "assets/beach-desktop.jpg"));
  desktop.style.setProperty("--window-bg", siteData.settings?.windowBackground || "#ffffff");
  desktop.style.setProperty("--window-text", siteData.settings?.windowText || "#202020");
  desktop.style.setProperty("--window-bar", siteData.settings?.windowBar || "#e0b6b6");
  desktop.style.setProperty("--window-accent", siteData.settings?.windowAccent || "#ffffff");
}

function youtubeEmbedUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${escapeHtml(url.pathname.slice(1))}`;
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${escapeHtml(id)}` : "";
    }
  } catch {
    return "";
  }
  return "";
}

function videoEmbedUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const youtube = youtubeEmbedUrl(raw);
  if (youtube) return youtube;
  try {
    const url = new URL(raw);
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${escapeHtml(id)}` : "";
    }
  } catch {
    return "";
  }
  return "";
}

function buildContentMaps() {
  projects = Object.fromEntries(siteData.projects.map((project) => [project.id, project]));
  const about = siteData.pages.about;
  const contact = siteData.pages.contact;
  pages = {
    about: {
      title: "About",
      html: `
        <article class="about-image-only">
          ${about.photo ? `<img class="about-full-image" src="${escapeHtml(about.photo)}" alt="About" />` : ""}
        </article>`,
    },
    contact: {
      title: "Contact",
      html: `
        <article class="contact-card">
          <div class="contact-hero">
            ${contact.photo ? `<img class="contact-avatar-image" src="${escapeHtml(contact.photo)}" alt="${escapeHtml(contact.name || contact.title)}" />` : `<div class="contact-avatar-fallback">${escapeHtml((contact.name || "SM").split(" ").map((part) => part[0]).join("").slice(0, 2))}</div>`}
            <h2>${escapeHtml(contact.name || "Sina Michèle Manetsch")}</h2>
            <div class="contact-quick-actions">
              <a class="circle email-bubble" href="mailto:${escapeHtml(contact.email || "")}" aria-label="Send email">✉</a>
            </div>
          </div>
          <button class="contact-copy contact-row" data-copy="${escapeHtml(contact.email || "")}">
            <span>Email</span>
            <strong>${escapeHtml(contact.email || "hello@example.com")}</strong>
          </button>
          <div class="contact-list">
            ${(contact.items || []).filter((item) => item.label && item.value).map((item) => `
              <button class="contact-copy contact-row" data-copy="${escapeHtml(item.value)}">
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}</strong>
              </button>
            `).join("")}
          </div>
          <p class="form-note" role="status"></p>
        </article>`,
    },
    blog: {
      title: "Blog",
      html: `
        <article class="blog-home phone-blog">
          <p class="kicker">FIELD NOTES</p>
          <h2>Journal</h2>
          <div class="blog-list blog-post-cards">
            ${siteData.blog.map((post) => {
              const style = blogStyle(post);
              return `
              <button class="blog-card ${style.className}" data-post-id="${escapeHtml(post.id)}" style="${style.vars}">
                ${post.image ? `<span class="blog-card-image" style="--blog-image:${cssUrl(post.image)}"></span>` : ""}
                <span class="blog-card-copy">
                  <small>${escapeHtml([post.category, post.date].filter(Boolean).join(" · "))}</small>
                  <strong>${escapeHtml(post.title)}</strong>
                  <em>${escapeHtml(post.excerpt || post.body)}</em>
                </span>
              </button>`;
            }).join("")}
          </div>
        </article>`,
    },
  };
}

function renderProjectIcons() {
  projectGrid.innerHTML = siteData.projects.map((project) => `
    <button class="project-icon" data-open="${escapeHtml(project.id)}" style="--pos:${escapeHtml(project.imagePosition)}; --folder-color:${escapeHtml(project.folderColor)}; --thumb-image:${cssUrl(project.titleImage)}">
      <span class="thumb"></span><span>${escapeHtml(project.title)}</span>
    </button>
  `).join("");
  projectIcons = [...document.querySelectorAll(".project-icon")];
}

function readStoredLayout() {
  try {
    return JSON.parse(localStorage.getItem(layoutStorageKey)) || {};
  } catch {
    return {};
  }
}

function writeStoredLayout(patch) {
  const current = readStoredLayout();
  localStorage.setItem(layoutStorageKey, JSON.stringify({ ...current, ...patch }));
}

function seededRandom(seed, index, salt) {
  let value = (seed + 1) * 374761393 + (index + 1) * 668265263 + salt * 2246822519;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  value = (value ^ (value >>> 16)) >>> 0;
  return value / 4294967295;
}

function updateSettingOutputs() {
  Object.entries(layoutOutputs).forEach(([key, output]) => {
    output.textContent = layoutState[key];
  });
}

function syncInputsFromState() {
  Object.entries(layoutInputs).forEach(([key, input]) => {
    input.value = layoutState[key];
  });
  updateSettingOutputs();
}

function getCurrentPositions() {
  return Object.fromEntries(
    projectIcons.map((icon) => [
      icon.dataset.open,
      {
        x: Math.round(parseFloat(icon.style.left) || 0),
        y: Math.round(parseFloat(icon.style.top) || 0),
      },
    ]),
  );
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function exportCurrentLayoutCsv() {
  const positions = getCurrentPositions();
  const rows = [
    [
      "folder_id",
      "folder_title",
      "x",
      "y",
      "folder_size",
      "grid_x",
      "grid_y",
      "noise_x",
      "noise_y",
      "seed",
      "left_margin",
      "right_margin",
    ],
  ];

  projectIcons.forEach((icon) => {
    const title = projects[icon.dataset.open]?.title || icon.dataset.open;
    const position = positions[icon.dataset.open];
    rows.push([
      icon.dataset.open,
      title,
      position.x,
      position.y,
      layoutState.size,
      layoutState.gapX,
      layoutState.gapY,
      layoutState.noiseX,
      layoutState.noiseY,
      layoutState.seed,
      layoutState.leftMargin,
      layoutState.rightMargin,
    ]);
  });

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sina-folder-layout.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function applyPositions(positions) {
  syncFolderSize();
  movedIcons = new Set();
  projectIcons.forEach((icon) => {
    const position = positions?.[icon.dataset.open];
    if (!position) return;
    icon.style.left = `${position.x}px`;
    icon.style.top = `${position.y}px`;
  });
}

function loadStoredSettings() {
  const stored = readStoredLayout();
  if (!stored.settings) {
    syncInputsFromState();
    return;
  }

  Object.keys(layoutState).forEach((key) => {
    const value = Number(stored.settings[key]);
    layoutState[key] = Number.isFinite(value) ? value : defaultLayoutState[key];
  });
  syncInputsFromState();
}

function syncFolderSize() {
  if (mobileAppQuery.matches) {
    projectGrid.style.setProperty("--folder-thumb-w", "72px");
    projectGrid.style.setProperty("--folder-thumb-h", "60px");
    projectGrid.style.setProperty("--folder-icon-w", "96px");
    projectGrid.style.setProperty("--folder-label-size", "12px");
    return;
  }
  const thumbW = layoutState.size;
  projectGrid.style.setProperty("--grid-gap-x", `${layoutState.gapX}px`);
  projectGrid.style.setProperty("--grid-gap-y", `${layoutState.gapY}px`);
  projectGrid.style.setProperty("--folder-thumb-w", `${thumbW}px`);
  projectGrid.style.setProperty("--folder-thumb-h", `${Math.round(thumbW * 0.833)}px`);
  projectGrid.style.setProperty("--folder-icon-w", `${Math.round(thumbW * 1.38)}px`);
  projectGrid.style.setProperty("--folder-label-size", `${Math.max(12, Math.round(thumbW * 0.155))}px`);
}

function applyMobileAppLayout() {
  syncFolderSize();
  movedIcons = new Set();
  projectGrid.scrollLeft = Math.min(projectGrid.scrollLeft, projectGrid.scrollWidth);
  projectGrid.querySelectorAll(".mobile-page-snap").forEach((marker) => marker.remove());

  const pageWidth = Math.max(320, projectGrid.clientWidth || window.innerWidth);
  const pageHeight = Math.max(430, projectGrid.clientHeight || 520);
  const columns = 3;
  const rows = 3;
  const perPage = columns * rows;
  const pages = Math.max(1, Math.ceil(projectIcons.length / perPage));
  const safeX = Math.max(72, Math.round(pageWidth * 0.16));
  const usableWidth = Math.max(1, pageWidth - safeX * 2);
  const topStart = Math.max(58, Math.round(pageHeight * 0.1));
  const rowGap = Math.min(150, Math.max(112, Math.round((pageHeight - topStart - 90) / rows)));
  const columnGap = columns > 1 ? usableWidth / (columns - 1) : 0;

  projectGrid.style.setProperty("--mobile-page-count", pages);
  for (let page = 0; page < pages; page += 1) {
    const marker = document.createElement("span");
    marker.className = "mobile-page-snap";
    marker.style.left = `${page * pageWidth}px`;
    projectGrid.appendChild(marker);
  }

  projectIcons.forEach((icon, index) => {
    const page = Math.floor(index / perPage);
    const localIndex = index % perPage;
    const col = localIndex % columns;
    const row = Math.floor(localIndex / columns);
    const x = page * pageWidth + safeX + columnGap * col;
    const y = topStart + row * rowGap;
    icon.style.left = `${Math.round(x)}px`;
    icon.style.top = `${Math.round(y)}px`;
    icon.style.zIndex = "";
  });

  projectGrid.style.paddingRight = "";
}

function generatePositions() {
  syncFolderSize();

  const gridRect = projectGrid.getBoundingClientRect();
  const iconWidth = layoutState.size * 1.26;
  const iconHeight = layoutState.size * 1.16;
  const minSpacingX = iconWidth + 34;
  const minSpacingY = iconHeight + 34;
  const gapX = Math.max(layoutState.gapX, minSpacingX);
  const gapY = Math.max(layoutState.gapY, minSpacingY);
  const maxNoiseX = Math.max(0, Math.min(layoutState.noiseX, (gapX - iconWidth - 24) / 2));
  const maxNoiseY = Math.max(0, Math.min(layoutState.noiseY, (gapY - iconHeight - 24) / 2));
  const leftLimitX = Math.max(iconWidth / 2, layoutState.leftMargin - gridRect.left + iconWidth / 2);
  const rightLimitX = Math.max(
    leftLimitX,
    window.innerWidth - layoutState.rightMargin - gridRect.left - iconWidth / 2,
  );
  const startX = Math.min(gridRect.width - iconWidth / 2, rightLimitX);
  const startY = 12;
  const cols = Math.max(1, Math.floor((startX - leftLimitX) / gapX) + 1);

  return Object.fromEntries(
    projectIcons.map((icon, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const baseX = startX - col * gapX;
      const baseY = startY + row * gapY;
      const offsetX = (seededRandom(layoutState.seed, index, 1) * 2 - 1) * maxNoiseX;
      const offsetY = (seededRandom(layoutState.seed, index, 2) * 2 - 1) * maxNoiseY;
      const x = Math.max(leftLimitX, Math.min(rightLimitX, baseX + offsetX));
      const y = Math.max(4, Math.min(gridRect.height - iconHeight, baseY + offsetY));
      return [icon.dataset.open, { x: Math.round(x), y: Math.round(y) }];
    }),
  );
}

function applyIconLayout({ resetMoved = false, preferCustom = true } = {}) {
  if (resetMoved) movedIcons = new Set();
  if (mobileAppQuery.matches) {
    applyMobileAppLayout();
    return;
  }
  projectGrid.style.paddingRight = "";
  syncFolderSize();
  updateSettingOutputs();

  const stored = readStoredLayout();
  const generatedPositions = generatePositions();
  writeStoredLayout({ settings: { ...layoutState }, generatedPositions });
  const activePositions = preferCustom && stored.customDefaultPositions ? stored.customDefaultPositions : generatedPositions;

  projectIcons.forEach((icon) => {
    if (movedIcons.has(icon.dataset.open)) return;
    const position = activePositions[icon.dataset.open] || generatedPositions[icon.dataset.open];
    if (!position) return;
    icon.style.left = `${position.x}px`;
    icon.style.top = `${position.y}px`;
  });
}

function wireFolderDragging() {
  projectIcons.forEach((icon) => {
    let startX = 0;
    let startY = 0;
    let baseX = 0;
    let baseY = 0;
    let didDrag = false;

    icon.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (mobileAppQuery.matches) return;
      event.preventDefault();
      startX = event.clientX;
      startY = event.clientY;
      baseX = parseFloat(icon.style.left) || icon.offsetLeft;
      baseY = parseFloat(icon.style.top) || icon.offsetTop;
      didDrag = false;
      iconTopZ += 1;
      icon.style.zIndex = iconTopZ;
      icon.setPointerCapture(event.pointerId);
    });

    icon.addEventListener("pointermove", (event) => {
      if (!icon.hasPointerCapture(event.pointerId)) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 5) {
        didDrag = true;
        icon.classList.add("dragging");
      }
      if (!didDrag) return;
      const gridRect = projectGrid.getBoundingClientRect();
      const iconRect = icon.getBoundingClientRect();
      const minX = iconRect.width / 2;
      const maxX = gridRect.width - iconRect.width / 2;
      const minY = 0;
      const maxY = gridRect.height - iconRect.height;
      icon.style.left = `${Math.max(minX, Math.min(maxX, baseX + dx))}px`;
      icon.style.top = `${Math.max(minY, Math.min(maxY, baseY + dy))}px`;
    });

    icon.addEventListener("pointerup", (event) => {
      if (icon.hasPointerCapture(event.pointerId)) icon.releasePointerCapture(event.pointerId);
      icon.classList.remove("dragging");
      if (didDrag) {
        movedIcons.add(icon.dataset.open);
        suppressProjectClick = true;
        window.setTimeout(() => {
          suppressProjectClick = false;
        }, 0);
      }
    });
  });
}

function wireLayoutSettings() {
  settingsToggle.addEventListener("click", () => {
    const isOpen = settingsPanel.classList.toggle("open");
    settingsToggle.setAttribute("aria-expanded", String(isOpen));
  });

  Object.entries(layoutInputs).forEach(([key, input]) => {
    input.addEventListener("input", () => {
      layoutState[key] = Number(input.value);
      updateSettingOutputs();
      applyIconLayout({ resetMoved: true, preferCustom: false });
    });
  });

  settingsReset.addEventListener("click", () => {
    const stored = readStoredLayout();
    if (stored.customDefaultPositions) {
      applyPositions(stored.customDefaultPositions);
      return;
    }
    const positions = stored.generatedPositions || generatePositions();
    applyPositions(positions);
  });

  settingsGenerated.addEventListener("click", () => {
    const generatedPositions = generatePositions();
    writeStoredLayout({
      settings: { ...layoutState },
      generatedPositions,
      customDefaultPositions: null,
    });
    applyPositions(generatedPositions);
  });

  settingsSave.addEventListener("click", () => {
    const generatedPositions = generatePositions();
    writeStoredLayout({
      settings: { ...layoutState },
      generatedPositions,
      customDefaultPositions: getCurrentPositions(),
    });
    movedIcons = new Set();
  });

  settingsExport.addEventListener("click", exportCurrentLayoutCsv);

  window.addEventListener("resize", () => applyIconLayout({ resetMoved: true }));
}

function centerWindow(win) {
  win.classList.remove("fullscreen");
  win.style.left = "50%";
  win.style.top = "50%";
  win.style.transform = "translate(-50%, -50%)";
}

function placeDockWindow(win, id) {
  if (mobileAppQuery.matches) {
    centerWindow(win);
    win.classList.add("mobile-app-window");
    return;
  }
  const order = ["about", "blog", "contact"];
  const index = Math.max(0, order.indexOf(id));
  const windowWidth = Math.min(1240, window.innerWidth - 72);
  const overlapStep = Math.min(320, Math.max(130, (window.innerWidth - windowWidth - 56) / 2));
  const left = Math.min(40 + index * overlapStep, window.innerWidth - windowWidth - 20);
  const top = 88 + index * 28;
  win.classList.remove("fullscreen");
  win.style.left = `${Math.max(20, left)}px`;
  win.style.top = `${top}px`;
  win.style.transform = "none";
}

function makeWindow(id, title, html, options = {}) {
  const existing = windows.get(id) || document.querySelector(`#window-${id}`);
  if (existing) {
    windows.set(id, existing);
    existing.classList.remove("hidden");
    if (options.mobileFullscreen) existing.classList.add("mobile-app-window");
    if (options.project) centerWindow(existing);
    if (options.page) placeDockWindow(existing, id);
    focusWindow(existing);
    return existing;
  }

  const node = template.content.firstElementChild.cloneNode(true);
  node.id = `window-${id}`;
  node.dataset.window = id;
  node.querySelector(".window-bar strong").textContent = title;
  node.querySelector(".window-body").innerHTML = html;
  if (options.project) node.classList.add("project-window");
  if (options.mobileFullscreen) node.classList.add("mobile-app-window");
  desktop.appendChild(node);
  windows.set(id, node);
  wireWindow(node);
  if (options.project) centerWindow(node);
  if (options.page) placeDockWindow(node, id);
  focusWindow(node);
  return node;
}

function openProject(id) {
  const project = projects[id];
  if (!project) return;
  const photos = (project.photos?.length ? project.photos : [project.titleImage]).filter(Boolean);
  const videos = (project.videos || []).map(videoEmbedUrl).filter(Boolean);
  const html = `
    <div class="project-gallery">
      ${photos.map((photo) => `<figure class="project-photo"><img src="${escapeHtml(photo)}" alt="${escapeHtml(project.title)}" /></figure>`).join("")}
      ${videos.map((video) => `<iframe class="project-video" src="${video}" title="${escapeHtml(project.title)} video" allowfullscreen></iframe>`).join("")}
    </div>
    <article>
      <p class="kicker">PROJECT FILE</p>
      <h2>${escapeHtml(project.title)}</h2>
      <p>${escapeHtml(project.description)}</p>
      <p>${escapeHtml(project.short)}</p>
    </article>`;
  makeWindow(id, project.title, html, { project: true });
}

function openPage(id) {
  const page = pages[id];
  makeWindow(id, page.title, page.html, { page: true, mobileFullscreen: true });
  if (id === "contact") wireContact(windows.get(id));
  if (id === "blog") wireBlog(windows.get(id));
}

function wireWindow(win) {
  win.addEventListener("pointerdown", () => focusWindow(win));
  win.querySelector("[data-close]").addEventListener("click", () => win.classList.add("hidden"));
  win.querySelector("[data-expand]")?.addEventListener("click", () => {
    const shouldExpand = !win.classList.contains("fullscreen");
    if (shouldExpand) {
      win.dataset.previousLeft = win.style.left || "";
      win.dataset.previousTop = win.style.top || "";
      win.dataset.previousTransform = win.style.transform || "";
      win.classList.add("fullscreen");
    } else {
      win.classList.remove("fullscreen");
      win.style.left = win.dataset.previousLeft || "50%";
      win.style.top = win.dataset.previousTop || "50%";
      win.style.transform = win.dataset.previousTransform || "translate(-50%, -50%)";
    }
  });

  const bar = win.querySelector(".window-bar");
  let startX = 0;
  let startY = 0;
  let baseX = 0;
  let baseY = 0;

  bar.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    if (win.classList.contains("fullscreen")) return;
    const rect = win.getBoundingClientRect();
    win.style.left = `${rect.left}px`;
    win.style.top = `${rect.top}px`;
    win.style.transform = "none";
    startX = event.clientX;
    startY = event.clientY;
    baseX = rect.left;
    baseY = rect.top;
    win.classList.add("dragging");
    bar.setPointerCapture(event.pointerId);
  });

  bar.addEventListener("pointermove", (event) => {
    if (!win.classList.contains("dragging")) return;
    const x = Math.max(8, Math.min(window.innerWidth - win.offsetWidth - 8, baseX + event.clientX - startX));
    const y = Math.max(44, Math.min(window.innerHeight - 88, baseY + event.clientY - startY));
    win.style.left = `${x}px`;
    win.style.top = `${y}px`;
  });

  bar.addEventListener("pointerup", () => win.classList.remove("dragging"));
  bar.addEventListener("pointercancel", () => win.classList.remove("dragging"));
}

function wireContact(win) {
  win.querySelectorAll(".contact-copy").forEach((button) => {
    if (button.dataset.ready) return;
    button.dataset.ready = "true";
    button.addEventListener("click", async () => {
      const note = win.querySelector(".form-note");
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        note.textContent = "Copied.";
      } catch {
        note.textContent = button.dataset.copy;
      }
    });
  });
}

function wireBlog(win) {
  win.querySelectorAll("[data-post-id]").forEach((button) => {
    if (button.dataset.ready) return;
    button.dataset.ready = "true";
    button.addEventListener("click", () => {
      const post = siteData.blog.find((item) => item.id === button.dataset.postId);
      if (!post) return;
      const existing = button.nextElementSibling?.classList.contains("blog-post-view") ? button.nextElementSibling : null;
      if (existing?.dataset.openPost === post.id) {
        existing.remove();
        button.setAttribute("aria-expanded", "false");
        return;
      }
      win.querySelectorAll(".blog-post-view").forEach((view) => view.remove());
      win.querySelectorAll("[data-post-id][aria-expanded='true']").forEach((openButton) => {
        openButton.setAttribute("aria-expanded", "false");
      });
      const embed = youtubeEmbedUrl(post.youtube);
      const style = blogStyle(post);
      const view = document.createElement("div");
      view.className = "blog-post-view";
      view.dataset.openPost = post.id;
      button.setAttribute("aria-expanded", "true");
      view.innerHTML = `
        <article class="blog-template ${style.className}" style="${style.vars}">
          <section class="blog-template-header">
            ${post.titleImage ? `<img class="blog-title-image" src="${escapeHtml(post.titleImage)}" alt="${escapeHtml(post.title)} title image" />` : `<h3>${escapeHtml(post.title)}</h3>`}
            <p class="blog-meta">${escapeHtml([post.category, post.date, post.author].filter(Boolean).join(" · "))}</p>
            ${post.excerpt ? `<p class="blog-excerpt">${escapeHtml(post.excerpt)}</p>` : ""}
          </section>
          <p class="blog-body">${escapeHtml(post.body)}</p>
          ${post.image ? `<img class="blog-inline-image" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" />` : ""}
          ${post.secondImage ? `<img class="blog-inline-image" src="${escapeHtml(post.secondImage)}" alt="${escapeHtml(post.title)} second image" />` : ""}
          ${embed ? `<iframe class="blog-video" src="${embed}" title="${escapeHtml(post.title)}" allowfullscreen></iframe>` : ""}
        </article>
      `;
      button.insertAdjacentElement("afterend", view);
    });
  });
}

async function refreshSiteDataFromBackend() {
  const backendData = await loadBackendSiteData();
  if (!backendData) return;
  siteData = backendData;
  buildContentMaps();
  applySiteTheme();
  renderProjectIcons();
  wireFolderDragging();
  applyIconLayout({ resetMoved: true });
  window.setTimeout(() => applyIconLayout({ resetMoved: true }), 120);
}

document.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open]");
  const actionButton = event.target.closest("[data-action]");

  if (openButton) {
    event.preventDefault();
    if (suppressProjectClick) return;
    const id = openButton.dataset.open;
    if (projects[id]) openProject(id);
    if (pages[id]) openPage(id);
  }

  if (actionButton?.dataset.action === "home") {
    event.preventDefault();
    if (mobileAppQuery.matches) {
      projectGrid.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      document.querySelector(".intro-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (actionButton?.dataset.action === "projects") {
    event.preventDefault();
    document.querySelector("#projects").scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

buildContentMaps();
applySiteTheme();
renderProjectIcons();
loadStoredSettings();
wireFolderDragging();
wireLayoutSettings();
applyIconLayout({ resetMoved: true });
refreshSiteDataFromBackend();
window.setTimeout(() => applyIconLayout({ resetMoved: true }), 120);
mobileAppQuery.addEventListener("change", () => applyIconLayout({ resetMoved: true }));
