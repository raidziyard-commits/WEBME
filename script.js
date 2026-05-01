const FEEDBACK_STORAGE_KEY = "webme_feedback_v1";

const contactForm = document.getElementById("contactForm");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackList = document.getElementById("feedbackList");
const toast = document.getElementById("toast");

const feedbackId = document.getElementById("feedbackId");
const feedbackName = document.getElementById("feedbackName");
const feedbackRating = document.getElementById("feedbackRating");
const feedbackText = document.getElementById("feedbackText");
const saveFeedbackBtn = document.getElementById("saveFeedbackBtn");
const resetFeedbackBtn = document.getElementById("resetFeedbackBtn");

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.style.borderColor = isError ? "rgba(255, 107, 107, 0.7)" : "rgba(29, 209, 194, 0.7)";
  toast.classList.add("show");
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function readFeedbacks() {
  const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFeedbacks(feedbacks) {
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbacks));
}

function createFeedbackCard(item) {
  const card = document.createElement("article");
  card.className = "card feedback-item";
  card.innerHTML = `
    <h3>${item.name}</h3>
    <p class="meta">Rating: ${item.rating}/5</p>
    <p class="text">${item.text}</p>
    <div class="feedback-actions">
      <button class="btn btn-secondary" data-action="edit" data-id="${item.id}">Edit</button>
      <button class="btn btn-danger" data-action="delete" data-id="${item.id}">Delete</button>
    </div>
  `;
  return card;
}

function renderFeedbacks() {
  const feedbacks = readFeedbacks();
  feedbackList.innerHTML = "";

  if (!feedbacks.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No feedback yet. Be the first to share your experience.";
    feedbackList.appendChild(empty);
    return;
  }

  feedbacks
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((item) => feedbackList.appendChild(createFeedbackCard(item)));
}

function resetFeedbackForm() {
  feedbackForm.reset();
  feedbackId.value = "";
  saveFeedbackBtn.textContent = "Save Feedback";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateContactForm() {
  const formData = new FormData(contactForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!name || !email || !message) {
    showToast("Please fill all contact fields.", true);
    return false;
  }
  if (!validateEmail(email)) {
    showToast("Please enter a valid email address.", true);
    return false;
  }
  return true;
}

function validateFeedbackForm() {
  const name = feedbackName.value.trim();
  const text = feedbackText.value.trim();
  const rating = Number(feedbackRating.value);

  if (!name || !text || Number.isNaN(rating)) {
    showToast("Please fill all feedback fields.", true);
    return null;
  }
  if (rating < 1 || rating > 5) {
    showToast("Rating must be between 1 and 5.", true);
    return null;
  }
  return { name, text, rating };
}

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateContactForm()) return;
  contactForm.reset();
  showToast("Message sent successfully. WEBME will contact you soon.");
});

feedbackForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const validData = validateFeedbackForm();
  if (!validData) return;

  const feedbacks = readFeedbacks();
  const editingId = feedbackId.value;

  if (editingId) {
    const index = feedbacks.findIndex((item) => item.id === editingId);
    if (index >= 0) {
      feedbacks[index] = { ...feedbacks[index], ...validData };
      showToast("Feedback updated.");
    }
  } else {
    feedbacks.push({
      id: crypto.randomUUID(),
      ...validData,
      createdAt: Date.now()
    });
    showToast("Feedback saved. Thank you.");
  }

  saveFeedbacks(feedbacks);
  resetFeedbackForm();
  renderFeedbacks();
});

resetFeedbackBtn.addEventListener("click", () => {
  resetFeedbackForm();
  showToast("Feedback form cleared.");
});

feedbackList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) return;

  const feedbacks = readFeedbacks();
  const selected = feedbacks.find((item) => item.id === id);
  if (!selected) return;

  if (action === "edit") {
    feedbackId.value = selected.id;
    feedbackName.value = selected.name;
    feedbackRating.value = String(selected.rating);
    feedbackText.value = selected.text;
    saveFeedbackBtn.textContent = "Update Feedback";
    feedbackForm.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Edit mode enabled.");
    return;
  }

  if (action === "delete") {
    const updated = feedbacks.filter((item) => item.id !== id);
    saveFeedbacks(updated);
    renderFeedbacks();
    showToast("Feedback deleted.");
  }
});

renderFeedbacks();
