let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = await checkAuth();
  if (!currentUser) return;

  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  document.getElementById("greeting").textContent =
    greet + ", " + currentUser.name;
  document.getElementById("current-date").textContent =
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  await loadHabits();
  setupModal();
});

function setupModal() {
  document.getElementById("openModal").addEventListener("click", openModal);
  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("cancelModal").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeModal();
  });

  document.querySelectorAll(".icon-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".icon-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  document.querySelectorAll(".plant-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".plant-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  document
    .getElementById("add-subtask")
    .addEventListener("click", addSubtaskField);
  document.getElementById("submitHabit").addEventListener("click", createHabit);
}

function openModal() {
  document.getElementById("modal-overlay").classList.add("open");
  document.getElementById("habit-deadline").min = new Date()
    .toISOString()
    .split("T")[0];
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  document.getElementById("habit-name").value = "";
  document.getElementById("habit-deadline").value = "";
  document.getElementById("subtasks-list").innerHTML = "";
}

function addSubtaskField() {
  const list = document.getElementById("subtasks-list");
  const div = document.createElement("div");
  div.className = "subtask-field";
  div.innerHTML = `
    <input type="text" placeholder="e.g. Read 5 pages" class="subtask-input" />
    <button type="button" class="subtask-remove" onclick="this.parentElement.remove()">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </button>`;
  list.appendChild(div);
  div.querySelector("input").focus();
}

async function loadHabits() {
  try {
    const res = await fetch("php/habits.php");
    const data = await res.json();
    renderHabits(data.habits || []);

    const streak = data.max_streak || 0;
    document.getElementById("streak-stat").textContent =
      streak + (streak === 1 ? " day" : " days");
  } catch (e) {
    console.error("Failed to load habits", e);
  }
}

function renderHabits(habits) {
  const list = document.getElementById("habits-list");
  const empty = document.getElementById("habits-empty");
  empty.style.display = habits.length ? "none" : "flex";
  list.querySelectorAll(".habit-item").forEach((el) => el.remove());

  habits.forEach((habit) => {
    const el = document.createElement("div");
    el.className = "habit-item" + (habit.done_today ? " completed" : "");

    const dl = habit.deadline
      ? " · " +
        new Date(habit.deadline).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "";

    const streakText = habit.streak > 0 ? ` · ${habit.streak}d streak` : "";

    let subtasksHtml = "";
    if (habit.subtasks && habit.subtasks.length > 0) {
      subtasksHtml =
        `<div class="habit-subtasks">` +
        habit.subtasks
          .map((st) => `<span class="subtask-tag">${st.title}</span>`)
          .join("") +
        `</div>`;
    }

    el.innerHTML = `
      <div class="habit-icon">
        <img src="assets/icons/habits/${
          habit.icon
        }.svg" width="20" height="20" alt="" />
      </div>
      <div class="habit-info">
        <p>${habit.name}</p>
        <span>${habit.plant_name}${dl}${streakText}</span>
        ${subtasksHtml}
      </div>
      <div class="habit-actions">
        <button class="habit-check-btn" onclick="toggleHabit(${habit.id})">
          ${
            habit.done_today
              ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
              : ""
          }
        </button>
        <button class="habit-delete-btn" onclick="deleteHabit(${habit.id})">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </div>`;
    list.appendChild(el);
  });

  updateStats(habits);
}

async function toggleHabit(id) {
  await fetch("php/habits.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "toggle", habit_id: id }),
  });
  await loadHabits();
}

async function deleteHabit(id) {
  await fetch("php/habits.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", habit_id: id }),
  });
  await loadHabits();
}

async function createHabit() {
  const name = document.getElementById("habit-name").value.trim();
  const deadline = document.getElementById("habit-deadline").value;

  if (!name) {
    document.getElementById("habit-name").focus();
    return;
  }

  if (deadline) {
    const today = new Date().toISOString().split("T")[0];
    if (deadline < today) {
      alert("Deadline cannot be in the past.");
      return;
    }
  }

  const activeIcon = document.querySelector(".icon-btn.active");
  const activePlant = document.querySelector(".plant-btn.active");

  const subtaskInputs = document.querySelectorAll(".subtask-input");
  const subtasks = Array.from(subtaskInputs)
    .map((i) => i.value.trim())
    .filter((v) => v);

  await fetch("php/habits.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create",
      name,
      deadline,
      icon: activeIcon?.dataset.icon || "book-open",
      plant: activePlant?.dataset.plant || "sprout",
      plant_name: activePlant?.dataset.name || "Sprout",
      subtasks,
    }),
  });

  closeModal();
  await loadHabits();
}

function updateStats(habits) {
  const total = habits.length;
  const done = habits.filter((h) => h.done_today).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("completion-stat").textContent = pct + "%";
  document.getElementById("completion-bar").style.width = pct + "%";
  document.getElementById("tasks-stat").textContent = done + " / " + total;
}
