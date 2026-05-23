import { db, collection, addDoc, getDocs, doc, getDoc, updateDoc } from "./firebase.js";

// ── DOM REFS ──────────────────────────────────────
const titleInput    = document.getElementById("postTitle");
const descInput     = document.getElementById("postDesc");
const contentInput  = document.getElementById("postContent");
const tagsInput     = document.getElementById("tagsInput");
const categoryInput = document.getElementById("postCategory");
const aiResult      = document.getElementById("aiResult");
const saveStatus    = document.getElementById("saveStatus");
const wordCountEl   = document.getElementById("wordCount");
const publishBtn    = document.getElementById("publishBtn");
// ── EDIT MODE DETECTION ───────────────────────────
const urlParams  = new URLSearchParams(window.location.search);
const editId     = urlParams.get("edit"); // null if not editing
const isEditMode = !!editId;


// ── TOAST ─────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

// ── AI LOADING STATE ──────────────────────────────
function setAiLoading(loading) {
  document.querySelectorAll(".mini-btn").forEach(btn => {
    btn.disabled = loading;
    btn.style.opacity = loading ? "0.5" : "1";
  });
  if (loading) aiResult.textContent = "Thinking...";
}

// ── LIVE WORD COUNT ───────────────────────────────
contentInput.addEventListener("input", () => {
  const words = contentInput.value.trim();
  wordCountEl.textContent = words ? words.split(/\s+/).length : 0;
});

// ── AI HELPER ─────────────────────────────────────
async function askClaude(prompt) {
  const res = await fetch("https://mayblog.vercel.app/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result || "No response from AI";
}

// ── AI BUTTONS ────────────────────────────────────
document.getElementById("readBtn").onclick = function () {
  const text = contentInput.value.trim();
  if (!text) { aiResult.textContent = "Write some content first."; return; }
  const words = text.split(/\s+/).length;
  const mins  = Math.ceil(words / 200);
  aiResult.textContent = "⏱ ~" + mins + " min read (" + words + " words)";
};

document.getElementById("titleBtn").onclick = async function () {
  const text = contentInput.value.trim();
  if (!text) { aiResult.textContent = "Write some content first."; return; }
  setAiLoading(true);
  try {
    const result = await askClaude(
      "Generate ONE punchy, engaging blog post title (max 12 words). Reply with only the title:\n\n" + text.slice(0, 600)
    );
    titleInput.value = result;
    aiResult.textContent = "✅ Title applied above.";
  } catch(e) {
    aiResult.textContent = "❌ AI error — is the server running?";
  } finally { setAiLoading(false); }
};

document.getElementById("summaryBtn").onclick = async function () {
  const text = contentInput.value.trim();
  if (!text) { aiResult.textContent = "Write some content first."; return; }
  setAiLoading(true);
  try {
    const result = await askClaude(
      "Write a 1-2 sentence subtitle (max 130 chars). Reply with only the description:\n\n" + text.slice(0, 600)
    );
    descInput.value = result;
    aiResult.textContent = "✅ Summary applied above.";
  } catch(e) {
    aiResult.textContent = "❌ AI error.";
  } finally { setAiLoading(false); }
};

document.getElementById("tagsBtn").onclick = async function () {
  const text = contentInput.value.trim();
  if (!text) { aiResult.textContent = "Write some content first."; return; }
  setAiLoading(true);
  try {
    const result = await askClaude(
      "Generate 4-6 hashtags for this blog post. Reply with only hashtags separated by spaces:\n\n" + text.slice(0, 600)
    );
    tagsInput.value = result;
    aiResult.textContent = "✅ Tags applied above.";
  } catch(e) {
    aiResult.textContent = "❌ AI error.";
  } finally { setAiLoading(false); }
};

document.getElementById("previewBtn").onclick = function () {
  const win = window.open("", "_blank");
  const t   = titleInput.value || "Untitled";
  const html = "<!DOCTYPE html><html><head><title>" + t + "</title>"
    + "<style>"
    + "body{background:#050505;color:#fff;font-family:sans-serif;padding:60px;max-width:800px;margin:auto;line-height:1.8;}"
    + "h1{font-size:48px;font-weight:900;margin-bottom:12px;}"
    + ".sub{color:rgba(255,255,255,.5);font-size:17px;margin-bottom:40px;display:block;}"
    + ".body-text{font-size:17px;white-space:pre-wrap;}"
    + ".tags{margin-top:36px;color:#d4af37;font-weight:600;}"
    + "</style></head><body>"
    + "<h1>" + t + "</h1>"
    + "<span class='sub'>" + (descInput.value || "") + "</span>"
    + "<div class='body-text'>" + (contentInput.value || "").replace(/\n/g, "<br>") + "</div>"
    + "<div class='tags'>" + (tagsInput.value || "") + "</div>"
    + "</body></html>";
  win.document.write(html);
};

// ── SAVE DRAFT ────────────────────────────────────
window.saveDraft = function () {
  localStorage.setItem("draftTitle",    titleInput.value);
  localStorage.setItem("draftDesc",     descInput.value);
  localStorage.setItem("draftContent",  contentInput.value);
  localStorage.setItem("draftTags",     tagsInput.value);
  localStorage.setItem("draftCategory", categoryInput.value);

  const count = parseInt(localStorage.getItem("draftCount") || "0") + 1;
  localStorage.setItem("draftCount", count);

  saveStatus.textContent = "Draft Saved ✓";
  showToast("Draft saved ✓");
};

// ── LOAD DRAFT ────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  titleInput.value    = localStorage.getItem("draftTitle")    || "";
  descInput.value     = localStorage.getItem("draftDesc")     || "";
  contentInput.value  = localStorage.getItem("draftContent")  || "";
  tagsInput.value     = localStorage.getItem("draftTags")     || "";
  categoryInput.value = localStorage.getItem("draftCategory") || "";

  document.getElementById("draftCount").textContent = localStorage.getItem("draftCount") || "0";

  if (contentInput.value.trim()) {
    wordCountEl.textContent = contentInput.value.trim().split(/\s+/).length;
  }

  if (db) loadStats();

// If edit mode, load post from Firestore and fill the form
if (isEditMode) {
  publishBtn.textContent = "Update Post";
  saveStatus.textContent = "Editing existing post";
  try {
    const snap = await getDoc(doc(db, "posts", editId));
    if (snap.exists()) {
      const data = snap.data();
      titleInput.value    = data.title    || "";
      descInput.value     = data.desc     || "";
      contentInput.value  = data.content  || "";
      tagsInput.value     = data.tags     || "";
      categoryInput.value = data.category || "";
      if (contentInput.value.trim()) {
        wordCountEl.textContent = contentInput.value.trim().split(/\s+/).length;
      }
    } else {
      showToast("Post not found.");
    }
  } catch(e) {
    showToast("Failed to load post for editing.");
    console.error(e);
  }
}
});



// ── PUBLISH ───────────────────────────────────────
window.submitPost = async function () {
  if (!titleInput.value.trim()) { showToast("Add a title before publishing"); return; }

  publishBtn.disabled    = true;
  publishBtn.textContent = isEditMode ? "Updating…" : "Publishing…";

  try {
    if (isEditMode) {
      // ── UPDATE existing post ──
      await updateDoc(doc(db, "posts", editId), {
        title:     titleInput.value,
        desc:      descInput.value,
        content:   contentInput.value,
        tags:      tagsInput.value,
        category:  categoryInput.value,
        updatedAt: Date.now()   // tracks when it was last edited
      });
      showToast("Post Updated! ✅");
    } else {
      // ── CREATE new post ──
      await addDoc(collection(db, "posts"), {
        title:     titleInput.value,
        desc:      descInput.value,
        content:   contentInput.value,
        tags:      tagsInput.value,
        category:  categoryInput.value,
        status:    "published",
        pinned:    false,
        createdAt: Date.now()
      });
      showToast("Post Published! 🎉");
      titleInput.value    = "";
      descInput.value     = "";
      contentInput.value  = "";
      tagsInput.value     = "";
      categoryInput.value = "";
      saveStatus.textContent  = "Not Saved";
      wordCountEl.textContent = "0";
      ["draftTitle","draftDesc","draftContent","draftTags","draftCategory"]
        .forEach(k => localStorage.removeItem(k));
    }
    loadStats();
  } catch(e) {
    showToast("Failed — see console");
    console.error(e);
  } finally {
    publishBtn.disabled    = false;
    publishBtn.textContent = isEditMode ? "Update Post" : "Publish";
  }
};

// ── STATS ─────────────────────────────────────────
async function loadStats() {
  try {
    const snap = await getDocs(collection(db, "posts"));
    document.getElementById("totalPosts").textContent = snap.size;
  } catch(e) { console.warn("Couldn't load stats:", e); }
}