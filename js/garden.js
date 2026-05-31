document.addEventListener("DOMContentLoaded", async () => {
  const user = await checkAuth();
  if (!user) return;

  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  document.getElementById("greeting").textContent = greet + ", " + user.name;
  document.getElementById("current-date").textContent =
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
});

const habits = [];
let selectedIcon = "book-open";
let selectedPlant = "sprout";
let selectedPlantName = "Sprout";

const hour = new Date().getHours();
const greet =
  hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
document.getElementById("greeting").textContent = greet;
document.getElementById("current-date").textContent =
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const openModal = () =>
  document.getElementById("modal-overlay").classList.add("open");
const closeModal = () => {
  document.getElementById("modal-overlay").classList.remove("open");
  document.getElementById("habit-name").value = "";
  document.getElementById("habit-deadline").value = "";
};

document.getElementById("openModal").onclick = openModal;
document.getElementById("closeModal").onclick = closeModal;
document.getElementById("cancelModal").onclick = closeModal;
document.getElementById("modal-overlay").onclick = (e) => {
  if (e.target.id === "modal-overlay") closeModal();
};

document.querySelectorAll(".icon-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".icon-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedIcon = btn.dataset.icon;
  };
});

document.querySelectorAll(".plant-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".plant-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedPlant = btn.dataset.plant;
    selectedPlantName = btn.dataset.name;
  };
});

document.getElementById("submitHabit").onclick = () => {
  const name = document.getElementById("habit-name").value.trim();
  const deadline = document.getElementById("habit-deadline").value;
  if (!name) {
    document.getElementById("habit-name").focus();
    return;
  }
  habits.push({
    id: Date.now(),
    name,
    deadline,
    icon: selectedIcon,
    plant: selectedPlant,
    plantName: selectedPlantName,
    done: false,
  });
  closeModal();
  renderHabits();
};

function renderHabits() {
  const list = document.getElementById("habits-list");
  const empty = document.getElementById("habits-empty");
  empty.style.display = habits.length ? "none" : "flex";
  list.querySelectorAll(".habit-item").forEach((el) => el.remove());

  habits.forEach((habit) => {
    const el = document.createElement("div");
    el.className = "habit-item" + (habit.done ? " completed" : "");
    const dl = habit.deadline
      ? " · " +
        new Date(habit.deadline).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "";
    el.innerHTML = `
      <div class="habit-icon">
        <img src="assets/icons/habits/${
          habit.icon
        }.svg" width="20" height="20" alt="" />
      </div>
      <div class="habit-info">
        <p>${habit.name}</p>
        <span>${habit.plantName}${dl}</span>
      </div>
      <div class="habit-actions">
        <button class="habit-check-btn" onclick="toggleHabit(${habit.id})">
          ${
            habit.done
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
  updateStats();
}

function toggleHabit(id) {
  const h = habits.find((h) => h.id === id);
  if (h) {
    h.done = !h.done;
    renderHabits();
  }
}

function deleteHabit(id) {
  const i = habits.findIndex((h) => h.id === id);
  if (i > -1) {
    habits.splice(i, 1);
    renderHabits();
  }
}

function updateStats() {
  const total = habits.length;
  const done = habits.filter((h) => h.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("completion-stat").textContent = pct + "%";
  document.getElementById("completion-bar").style.width = pct + "%";
  document.getElementById("tasks-stat").textContent = done + " / " + total;
}
