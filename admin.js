let data = null;
let selectedProject = "";
let selectedPost = "";
let selectedMediaId = "";

const loginView = document.querySelector("#login-view");
const adminView = document.querySelector("#admin-view");
const loginForm = document.querySelector("#login-form");
const projectList = document.querySelector("#project-list");
const projectForm = document.querySelector("#project-form");
const postList = document.querySelector("#post-list");
const postForm = document.querySelector("#post-form");
const aboutForm = document.querySelector("#about-form");
const contactForm = document.querySelector("#contact-form");
const backgroundForm = document.querySelector("#background-form");
const mediaUpload = document.querySelector("#media-upload");
const mediaList = document.querySelector("#media-list");
const selectedMediaPanel = document.querySelector("#selected-media");
const backgroundPreview = document.querySelector("#background-preview");
const projectTitlePreview = document.querySelector("#project-title-preview");
const projectPhotosPreview = document.querySelector("#project-photos-preview");
const aboutPhotoPreview = document.querySelector("#about-photo-preview");
const contactPhotoPreview = document.querySelector("#contact-photo-preview");
const blogTitleImagePreview = document.querySelector("#blog-title-image-preview");
const blogImagePreview = document.querySelector("#blog-image-preview");
const blogSecondImagePreview = document.querySelector("#blog-second-image-preview");
const saveState = document.querySelector("#save-state");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return String(value || "item")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "item";
}

function setStatus(message) {
  saveState.textContent = message;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function api(path, options = {}) {
  const body = options.body;
  const isFormData = body instanceof FormData;
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: isFormData ? options.headers || {} : {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed: ${response.status}`);
  return payload;
}

async function loadContent() {
  data = await api("/api/content");
  selectedProject = selectedProject || data.projects[0]?.id || "";
  selectedPost = selectedPost || data.blog[0]?.id || "";
}

async function saveContent(message = "Saved") {
  data = await api("/api/content", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  setStatus(`${message} · saved to data/content.json`);
}

function showLogin() {
  loginView.classList.remove("hidden");
  adminView.classList.add("hidden");
}

async function showAdmin() {
  await loadContent();
  loginView.classList.add("hidden");
  adminView.classList.remove("hidden");
  renderAll();
}

function currentProject() {
  return data.projects.find((project) => project.id === selectedProject) || data.projects[0];
}

function currentPost() {
  return data.blog.find((post) => post.id === selectedPost) || data.blog[0];
}

function currentMedia() {
  return data.media.find((item) => item.id === selectedMediaId) || null;
}

function renderAll() {
  renderProjectList();
  renderProjectForm();
  renderPages();
  renderPostList();
  renderPostForm();
  renderBackgroundForm();
  renderMediaList();
  renderSelectedMedia();
  renderImagePreviews();
}

function renderProjectList() {
  projectList.innerHTML = data.projects.map((project) => `
    <button type="button" class="${project.id === selectedProject ? "active" : ""}" data-project="${escapeHtml(project.id)}">
      ${escapeHtml(project.title || project.id)}
    </button>
  `).join("");
}

function renderProjectForm() {
  const project = currentProject();
  if (!project) {
    projectForm.reset();
    return;
  }
  selectedProject = project.id;
  projectForm.id.value = project.id || "";
  projectForm.title.value = project.title || "";
  projectForm.description.value = project.description || "";
  projectForm.short.value = project.short || "";
  projectForm.folderColor.value = project.folderColor || "#00a9a8";
  projectForm.titleImage.value = project.titleImage || "";
  projectForm.imagePosition.value = project.imagePosition || "center";
  projectForm.photos.value = (project.photos || []).join("\n");
  projectForm.videos.value = (project.videos || []).join("\n");
}

function renderPages() {
  const about = data.pages.about || {};
  const contact = data.pages.contact || {};
  aboutForm.kicker.value = about.kicker || "";
  aboutForm.title.value = about.title || "";
  aboutForm.body.value = about.body || "";
  aboutForm.photo.value = about.photo || "";
  contactForm.elements.name.value = contact.name || "";
  contactForm.elements.email.value = contact.email || "";
  contactForm.elements.photo.value = contact.photo || "";
  contactForm.title.value = contact.title || "";
  contactForm.body.value = contact.body || "";
  contactForm.items.value = (contact.items || [])
    .map((item) => `${item.label} | ${item.value} | ${item.href || ""}`)
    .join("\n");
}

function renderPostList() {
  postList.innerHTML = data.blog.map((post) => `
    <button type="button" class="${post.id === selectedPost ? "active" : ""}" data-post="${escapeHtml(post.id)}">
      <strong>${escapeHtml(post.title || post.id)}</strong>
      <small>${escapeHtml([post.date, post.category].filter(Boolean).join(" · ") || "Journal entry")}</small>
    </button>
  `).join("");
}

function renderPostForm() {
  const post = currentPost();
  if (!post) {
    postForm.reset();
    return;
  }
  selectedPost = post.id;
  postForm.id.value = post.id || "";
  postForm.title.value = post.title || "";
  postForm.excerpt.value = post.excerpt || "";
  postForm.date.value = post.date || "";
  postForm.category.value = post.category || "";
  postForm.author.value = post.author || "";
  postForm.titleImage.value = post.titleImage || "";
  postForm.image.value = post.image || "";
  postForm.secondImage.value = post.secondImage || "";
  postForm.youtube.value = post.youtube || "";
  postForm.template.value = post.template || "editorial";
  postForm.fontFamily.value = post.fontFamily || "serif";
  postForm.titleSize.value = post.titleSize || 46;
  postForm.bodySize.value = post.bodySize || 16;
  postForm.imageScale.value = post.imageScale || 100;
  postForm.imagePosition.value = post.imagePosition || "center";
  postForm.body.value = post.body || "";
}

function renderBackgroundForm() {
  backgroundForm.backgroundImage.value = data.settings?.backgroundImage || "";
  backgroundForm.windowBackground.value = data.settings?.windowBackground || "#ffffff";
  backgroundForm.windowText.value = data.settings?.windowText || "#202020";
  backgroundForm.windowBar.value = data.settings?.windowBar || "#e0b6b6";
  backgroundForm.windowAccent.value = data.settings?.windowAccent || "#ffffff";
}

function renderSelectedMedia() {
  const item = currentMedia();
  selectedMediaPanel.querySelector("strong").textContent = item ? item.name : "Kein Bild ausgewählt";
}

function renderMediaList() {
  if (!data.media.length) {
    mediaList.innerHTML = "<p class=\"muted\">Noch keine Bilder hochgeladen.</p>";
    return;
  }
  mediaList.innerHTML = data.media.map((item) => `
    <button type="button" class="media-card ${item.id === selectedMediaId ? "selected" : ""}" data-media-id="${escapeHtml(item.id)}">
      <div class="media-thumb" style="background-image:url('${escapeHtml(item.path).replaceAll("'", "%27")}')"></div>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.path)}</small>
    </button>
  `).join("");
}

function imageUrl(path) {
  return escapeHtml(String(path || "").replaceAll("'", "%27"));
}

function assetEmpty(message) {
  return `<div class="asset-empty">${escapeHtml(message)}</div>`;
}

function assetTile(path, label, action, extra = "") {
  return `
    <div class="asset-tile">
      <div class="asset-thumb" style="background-image:url('${imageUrl(path)}')"></div>
      <strong>${escapeHtml(label)}</strong>
      <small>${escapeHtml(path)}</small>
      <div class="asset-actions">
        <button type="button" data-image-action="${escapeHtml(action)}" ${extra}>Entfernen</button>
      </div>
    </div>
  `;
}

function renderImagePreviews() {
  const project = currentProject();
  const about = data.pages.about || {};
  const post = currentPost();
  const background = data.settings?.backgroundImage || "";

  backgroundPreview.innerHTML = background
    ? assetTile(background, "Aktuelles Hintergrundbild", "clear-background")
    : assetEmpty("Kein Hintergrundbild gesetzt.");

  projectTitlePreview.innerHTML = project?.titleImage
    ? assetTile(project.titleImage, "Aktuelles Ordnerbild", "clear-project-title")
    : assetEmpty("Kein Ordnerbild gesetzt.");

  const photos = project?.photos || [];
  projectPhotosPreview.innerHTML = photos.length
    ? photos.map((path, index) => assetTile(path, `Projektfoto ${index + 1}`, "remove-project-photo", `data-photo-index="${index}"`)).join("")
    : assetEmpty("Noch keine Projektfotos gespeichert.");

  aboutPhotoPreview.innerHTML = about.photo
    ? assetTile(about.photo, "Aktuelles ABOUT Foto", "clear-about-photo")
    : assetEmpty("Kein ABOUT Foto gesetzt.");

  contactPhotoPreview.innerHTML = data.pages.contact?.photo
    ? assetTile(data.pages.contact.photo, "Aktuelles CONTACT Bild", "clear-contact-photo")
    : assetEmpty("Kein CONTACT Bild gesetzt.");

  blogTitleImagePreview.innerHTML = post?.titleImage
    ? assetTile(post.titleImage, "Aktuelles Blog Titelbild", "clear-blog-title-image")
    : assetEmpty("Kein Blog Titelbild gesetzt.");

  blogImagePreview.innerHTML = post?.image
    ? assetTile(post.image, "Aktuelles Blog Bild", "clear-blog-image")
    : assetEmpty("Kein Blog Bild gesetzt.");

  blogSecondImagePreview.innerHTML = post?.secondImage
    ? assetTile(post.secondImage, "Aktuelles zweites Blog Bild", "clear-blog-second-image")
    : assetEmpty("Kein zweites Blog Bild gesetzt.");
}

async function uploadFile(file) {
  if (!file) return null;
  setStatus(`Uploading ${file.name}...`);
  const form = new FormData();
  form.append("file", file, file.name);
  const result = await api("/api/upload", {
    method: "POST",
    body: form,
  });
  data = result.content;
  selectedMediaId = result.item.id;
  setStatus(`${file.name} uploaded · saved to ${result.item.path}`);
  return result.item;
}

async function uploadFiles(files) {
  const uploaded = [];
  const list = [...files].filter(Boolean);
  if (!list.length) return uploaded;
  try {
    for (const file of list) {
      uploaded.push(await uploadFile(file));
    }
  } catch (error) {
    setStatus(`Upload failed: ${error.message}`);
    throw error;
  }
  renderAll();
  return uploaded;
}

async function runAction(action, fallbackMessage = "Action failed") {
  try {
    await action();
  } catch (error) {
    setStatus(`${fallbackMessage}: ${error.message}`);
  }
}

function syncProjectFromForm() {
  const project = currentProject();
  if (!project) return null;
  const form = new FormData(projectForm);
  const nextId = slugify(form.get("id"));
  Object.assign(project, {
    id: nextId,
    title: form.get("title"),
    description: form.get("description"),
    short: form.get("short"),
    folderColor: form.get("folderColor"),
    titleImage: form.get("titleImage"),
    imagePosition: form.get("imagePosition"),
    photos: String(form.get("photos")).split("\n").map((line) => line.trim()).filter(Boolean),
    videos: String(form.get("videos")).split("\n").map((line) => line.trim()).filter(Boolean),
  });
  selectedProject = nextId;
  return project;
}

function syncAboutFromForm() {
  const form = new FormData(aboutForm);
  data.pages.about = {
    kicker: form.get("kicker"),
    title: form.get("title"),
    body: form.get("body"),
    photo: form.get("photo"),
  };
}

function syncPostFromForm() {
  const post = currentPost();
  if (!post) return null;
  const form = new FormData(postForm);
  const nextId = slugify(form.get("id"));
  Object.assign(post, {
    id: nextId,
    title: form.get("title"),
    excerpt: form.get("excerpt"),
    date: form.get("date"),
    category: form.get("category"),
    author: form.get("author"),
    titleImage: form.get("titleImage"),
    image: form.get("image"),
    secondImage: form.get("secondImage"),
    youtube: form.get("youtube"),
    template: form.get("template"),
    fontFamily: form.get("fontFamily"),
    titleSize: Number(form.get("titleSize")) || 46,
    bodySize: Number(form.get("bodySize")) || 16,
    imageScale: Number(form.get("imageScale")) || 100,
    imagePosition: form.get("imagePosition") || "center",
    body: form.get("body"),
  });
  selectedPost = nextId;
  return post;
}

async function insertSelectedMedia(action) {
  const item = currentMedia();
  if (!item && action !== "delete") {
    setStatus("Select an uploaded image first.");
    return;
  }

  if (action === "project-title") {
    const project = currentProject();
    if (!project) return;
    project.titleImage = item.path;
    projectForm.titleImage.value = item.path;
    await saveContent("Folder image saved");
  }

  if (action === "project-photo") {
    const project = currentProject();
    if (!project) return;
    project.photos = [...(project.photos || []), item.path];
    projectForm.photos.value = project.photos.join("\n");
    await saveContent("Project photo saved");
  }

  if (action === "about-photo") {
    data.pages.about.photo = item.path;
    aboutForm.photo.value = item.path;
    await saveContent("About photo saved");
  }

  if (action === "contact-photo") {
    data.pages.contact.photo = item.path;
    contactForm.elements.photo.value = item.path;
    await saveContent("Contact image saved");
  }

  if (action === "blog-title-image") {
    const post = currentPost();
    if (!post) return;
    post.titleImage = item.path;
    postForm.titleImage.value = item.path;
    await saveContent("Blog title image saved");
  }

  if (action === "blog-image") {
    const post = currentPost();
    if (!post) return;
    post.image = item.path;
    postForm.image.value = item.path;
    await saveContent("Blog image saved");
  }

  if (action === "blog-second-image") {
    const post = currentPost();
    if (!post) return;
    post.secondImage = item.path;
    postForm.secondImage.value = item.path;
    await saveContent("Second blog image saved");
  }

  if (action === "background") {
    data.settings.backgroundImage = item.path;
    backgroundForm.backgroundImage.value = item.path;
    await saveContent("Background saved");
  }

  if (action === "delete") {
    if (!item) return;
    data.media = data.media.filter((media) => media.id !== item.id);
    selectedMediaId = "";
    await saveContent("Media removed from library");
  }

  renderAll();
}

async function handleImageAction(button) {
  const action = button.dataset.imageAction;

  if (action === "clear-background") {
    data.settings.backgroundImage = "";
    backgroundForm.backgroundImage.value = "";
    await saveContent("Background image removed");
  }

  if (action === "clear-project-title") {
    const project = currentProject();
    if (!project) return;
    project.titleImage = "";
    projectForm.titleImage.value = "";
    await saveContent("Folder image removed");
  }

  if (action === "remove-project-photo") {
    const project = currentProject();
    const index = Number(button.dataset.photoIndex);
    if (!project || !Number.isInteger(index)) return;
    project.photos = (project.photos || []).filter((_, itemIndex) => itemIndex !== index);
    projectForm.photos.value = project.photos.join("\n");
    await saveContent("Project photo removed");
  }

  if (action === "clear-about-photo") {
    data.pages.about.photo = "";
    aboutForm.photo.value = "";
    await saveContent("About photo removed");
  }

  if (action === "clear-contact-photo") {
    data.pages.contact.photo = "";
    contactForm.elements.photo.value = "";
    await saveContent("Contact image removed");
  }

  if (action === "clear-blog-title-image") {
    const post = currentPost();
    if (!post) return;
    post.titleImage = "";
    postForm.titleImage.value = "";
    await saveContent("Blog title image removed");
  }

  if (action === "clear-blog-image") {
    const post = currentPost();
    if (!post) return;
    post.image = "";
    postForm.image.value = "";
    await saveContent("Blog image removed");
  }

  if (action === "clear-blog-second-image") {
    const post = currentPost();
    if (!post) return;
    post.secondImage = "";
    postForm.secondImage.value = "";
    await saveContent("Second blog image removed");
  }

  renderAll();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(loginForm);
  try {
    await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });
    loginForm.querySelector(".notice").textContent = "";
    await showAdmin();
  } catch {
    loginForm.querySelector(".notice").textContent = "Wrong login.";
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST", body: "{}" }).catch(() => {});
  showLogin();
});

projectList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-project]");
  if (!button) return;
  selectedProject = button.dataset.project;
  renderAll();
});

document.querySelector("#add-project").addEventListener("click", async () => {
  const id = `project-${Date.now()}`;
  data.projects.push({
    id,
    title: "New Project",
    description: "",
    short: "",
    folderColor: "#00a9a8",
    titleImage: "assets/beach-desktop.jpg",
    imagePosition: "center",
    photos: [],
    videos: [],
  });
  selectedProject = id;
  await saveContent("Project added");
  renderAll();
});

document.querySelector("#delete-project").addEventListener("click", async () => {
  data.projects = data.projects.filter((project) => project.id !== selectedProject);
  selectedProject = data.projects[0]?.id || "";
  await saveContent("Project deleted");
  renderAll();
});

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  syncProjectFromForm();
  await saveContent("Project saved");
  renderAll();
});

projectForm.titleUpload.addEventListener("change", async (event) => {
  await runAction(async () => {
    const [item] = await uploadFiles(event.target.files);
    const project = currentProject();
    if (item && project) {
      project.titleImage = item.path;
      projectForm.titleImage.value = item.path;
      await saveContent("Folder image uploaded");
    }
    renderAll();
  }, "Folder image upload failed");
  event.target.value = "";
});

projectForm.photoUpload.addEventListener("change", async (event) => {
  await runAction(async () => {
    const items = await uploadFiles(event.target.files);
    const project = currentProject();
    if (items.length && project) {
      project.photos = [...(project.photos || []), ...items.map((item) => item.path)];
      projectForm.photos.value = project.photos.join("\n");
      await saveContent("Project photos uploaded");
    }
    renderAll();
  }, "Project photo upload failed");
  event.target.value = "";
});

aboutForm.photoUpload.addEventListener("change", async (event) => {
  await runAction(async () => {
    const [item] = await uploadFiles(event.target.files);
    if (item) {
      data.pages.about.photo = item.path;
      aboutForm.photo.value = item.path;
      await saveContent("About photo uploaded");
    }
    renderAll();
  }, "About photo upload failed");
  event.target.value = "";
});

aboutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  syncAboutFromForm();
  await saveContent("About saved");
});

contactForm.elements.photoUpload.addEventListener("change", async (event) => {
  await runAction(async () => {
    const [item] = await uploadFiles(event.target.files);
    if (item) {
      data.pages.contact.photo = item.path;
      contactForm.elements.photo.value = item.path;
      await saveContent("Contact image uploaded");
    }
    renderAll();
  }, "Contact image upload failed");
  event.target.value = "";
});

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(contactForm);
  data.pages.contact = {
    name: form.get("name"),
    email: form.get("email"),
    photo: form.get("photo"),
    title: form.get("title"),
    body: form.get("body"),
    items: String(form.get("items"))
      .split("\n")
      .map((line) => line.split("|").map((part) => part.trim()))
      .filter(([label, value]) => label && value)
      .map(([label, value, href]) => ({ label, value, href: href || "" })),
  };
  await saveContent("Contact saved");
});

postList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-post]");
  if (!button) return;
  selectedPost = button.dataset.post;
  renderAll();
});

document.querySelector("#add-post").addEventListener("click", async () => {
  const id = `journal-${Date.now()}`;
  data.blog.unshift({
    id,
    title: "Neuer Journal-Eintrag",
    excerpt: "",
    date: todayIsoDate(),
    category: "Journal",
    author: "Sina Michèle Manetsch",
    body: "",
    titleImage: "",
    image: "",
    secondImage: "",
    youtube: "",
    template: "editorial",
    fontFamily: "serif",
    titleSize: 46,
    bodySize: 16,
    imageScale: 100,
    imagePosition: "center",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  selectedPost = id;
  await saveContent("Journal entry added");
  renderAll();
});

document.querySelector("#duplicate-post").addEventListener("click", async () => {
  const source = currentPost();
  if (!source) return;
  const id = `${slugify(source.id || source.title)}-copy-${Date.now()}`;
  const copy = {
    ...source,
    id,
    title: `${source.title || "Journal-Eintrag"} Copy`,
    date: todayIsoDate(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const index = Math.max(0, data.blog.findIndex((post) => post.id === selectedPost));
  data.blog.splice(index, 0, copy);
  selectedPost = id;
  await saveContent("Journal entry duplicated");
  renderAll();
});

document.querySelector("#delete-post").addEventListener("click", async () => {
  data.blog = data.blog.filter((post) => post.id !== selectedPost);
  selectedPost = data.blog[0]?.id || "";
  await saveContent("Post deleted");
  renderAll();
});

postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const post = syncPostFromForm();
  if (post) post.updatedAt = new Date().toISOString();
  await saveContent("Post saved");
  renderAll();
});

postForm.titleImageUpload.addEventListener("change", async (event) => {
  await runAction(async () => {
    const [item] = await uploadFiles(event.target.files);
    const post = currentPost();
    if (item && post) {
      post.titleImage = item.path;
      postForm.titleImage.value = item.path;
      await saveContent("Blog title image uploaded");
    }
    renderAll();
  }, "Blog title image upload failed");
  event.target.value = "";
});

postForm.imageUpload.addEventListener("change", async (event) => {
  await runAction(async () => {
    const [item] = await uploadFiles(event.target.files);
    const post = currentPost();
    if (item && post) {
      post.image = item.path;
      postForm.image.value = item.path;
      await saveContent("Blog image uploaded");
    }
    renderAll();
  }, "Blog image upload failed");
  event.target.value = "";
});

postForm.secondImageUpload.addEventListener("change", async (event) => {
  await runAction(async () => {
    const [item] = await uploadFiles(event.target.files);
    const post = currentPost();
    if (item && post) {
      post.secondImage = item.path;
      postForm.secondImage.value = item.path;
      await saveContent("Second blog image uploaded");
    }
    renderAll();
  }, "Second blog image upload failed");
  event.target.value = "";
});

backgroundForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(backgroundForm);
  data.settings.backgroundImage = form.get("backgroundImage");
  data.settings.windowBackground = form.get("windowBackground");
  data.settings.windowText = form.get("windowText");
  data.settings.windowBar = form.get("windowBar");
  data.settings.windowAccent = form.get("windowAccent");
  await saveContent("Website settings saved");
});

backgroundForm.backgroundUpload.addEventListener("change", async (event) => {
  await runAction(async () => {
    const [item] = await uploadFiles(event.target.files);
    if (item) {
      data.settings.backgroundImage = item.path;
      backgroundForm.backgroundImage.value = item.path;
      await saveContent("Background uploaded");
    }
    renderAll();
  }, "Background upload failed");
  event.target.value = "";
});

mediaUpload.addEventListener("change", async (event) => {
  await runAction(async () => {
    await uploadFiles(event.target.files);
  }, "Media upload failed");
  event.target.value = "";
});

mediaList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-media-id]");
  if (!card) return;
  selectedMediaId = card.dataset.mediaId;
  renderMediaList();
  renderSelectedMedia();
});

selectedMediaPanel.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-insert-media]");
  if (!button) return;
  await insertSelectedMedia(button.dataset.insertMedia);
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-image-action]");
  if (!button) return;
  await runAction(async () => {
    await handleImageAction(button);
  }, "Image action failed");
});

async function init() {
  try {
    const session = await api("/api/session");
    if (session.authenticated) {
      await showAdmin();
    } else {
      showLogin();
    }
  } catch {
    loginForm.querySelector(".notice").textContent = "Backend server is not running. Start it with: node server.js";
    showLogin();
  }
}

init();
