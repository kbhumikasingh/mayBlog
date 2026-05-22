import { db } from "./firebase.js";
import {
  collection, getDocs, deleteDoc, updateDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── THEME ──────────────────────────────────────────
const savedTheme = localStorage.getItem("adminTheme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);

document.getElementById("themeToggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("adminTheme", next);
  document.getElementById("themeToggle").textContent = next === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
});
document.getElementById("themeToggle").textContent = savedTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";

// ── DELETE MODAL ───────────────────────────────────
let pendingDeleteId = null;

function showDeleteModal(id) {
  pendingDeleteId = id;
  document.getElementById("deleteModal").style.display = "flex";
}

document.getElementById("confirmDelete").onclick = async () => {
  if (!pendingDeleteId) return;
  await deleteDoc(doc(db, "posts", pendingDeleteId));
  document.getElementById("deleteModal").style.display = "none";
  pendingDeleteId = null;
  loadPosts();
};

document.getElementById("cancelDelete").onclick = () => {
  document.getElementById("deleteModal").style.display = "none";
  pendingDeleteId = null;
};

// ── LOAD POSTS ─────────────────────────────────────
const container = document.getElementById("postsContainer");

async function loadPosts() {
  container.innerHTML = "Loading posts...";
  const snap = await getDocs(collection(db, "posts"));
  container.innerHTML = "";

  let total = 0, today = 0, drafts = 0, pinned = 0;
  const todayDate = new Date().toDateString();
  const posts = [];

  snap.forEach(item => {
    posts.push({ id: item.id, ...item.data() });
  });

  // Pinned first
  posts.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  posts.forEach(data => {
    total++;
    const created = new Date(data.createdAt || Date.now());
    if (created.toDateString() === todayDate) today++;
    if (data.status === "draft") drafts++;
    if (data.pinned) pinned++;

    const statusLabel = data.status === "draft"
      ? `<span class="badge draft-badge">Draft</span>`
      : `<span class="badge live-badge">Live</span>`;

    const pinnedLabel = data.pinned
      ? `<span class="badge pin-badge">📌 Pinned</span>`
      : "";

    container.innerHTML += `
<div class="post-row ${data.pinned ? 'pinned-row' : ''}">
  <div>
    <h4>${data.title || "Untitled Post"} ${pinnedLabel}</h4>
    <p>${data.desc || ""}</p>
    ${statusLabel}
  </div>
  <div><p>${data.category || "General"}</p></div>
  <div><p>${created.toDateString()}</p></div>
  <div class="post-actions">
    <button class="view-btn"   onclick="viewPost('${data.id}')">View</button>
    <button class="edit-btn"   onclick="editPost('${data.id}')">Edit</button>
    <button class="pin-btn"    onclick="togglePin('${data.id}', ${!!data.pinned})">${data.pinned ? "Unpin" : "📌 Pin"}</button>
    <button class="toggle-btn" onclick="toggleStatus('${data.id}', '${data.status || 'published'}')">${data.status === 'draft' ? '🟢 Publish' : '⬇️ Draft'}</button>
    <button class="delete-btn" onclick="showDeleteModal('${data.id}')">Delete</button>
  </div>
</div>`;
  });

  document.getElementById("totalPosts").innerText = total;
  document.getElementById("todayPosts").innerText = today;
  document.getElementById("draftPosts").innerText = drafts;
}

// ── PIN ────────────────────────────────────────────
window.togglePin = async function(id, isPinned) {
  await updateDoc(doc(db, "posts", id), { pinned: !isPinned });
  loadPosts();
};

// ── TOGGLE DRAFT/PUBLISHED ─────────────────────────
window.toggleStatus = async function(id, currentStatus) {
  const newStatus = currentStatus === "draft" ? "published" : "draft";
  await updateDoc(doc(db, "posts", id), { status: newStatus });
  loadPosts();
};

window.showDeleteModal = showDeleteModal;

window.viewPost = function(id) {
  window.open("reader.html?id=" + id, "_blank");
};

window.editPost = function(id) {
  window.location = "create.html?edit=" + id;
};

// ── SEARCH ─────────────────────────────────────────
document.getElementById("searchBox").addEventListener("input", function() {
  const val = this.value.toLowerCase();
  document.querySelectorAll(".post-row").forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(val) ? "grid" : "none";
  });
});

// ── FILTER ─────────────────────────────────────────
document.getElementById("filterCategory").addEventListener("change", function() {
  const val = this.value.toLowerCase();
  document.querySelectorAll(".post-row").forEach(row => {
    row.style.display = (val === "all" || row.innerText.toLowerCase().includes(val)) ? "grid" : "none";
  });
});

loadPosts();
