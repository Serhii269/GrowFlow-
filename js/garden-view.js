let currentUser = null;

function getPlantStage(completions, deadline, lastCompleted) {
  if (isWilted(deadline, lastCompleted)) return 4;
  if (completions >= 7) return 3;
  if (completions >= 3) return 2;
  return 1;
}

function isWilted(deadline, lastCompleted) {
  if (deadline) {
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(23, 59, 59);
    if (new Date() > deadlineDate) return true;
  }
  if (lastCompleted) {
    const last = new Date(lastCompleted);
    const today = new Date();
    const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
    if (diffDays >= 3) return true;
  }
  return false;
}

function getStatus(completions, deadline, lastCompleted) {
  if (isWilted(deadline, lastCompleted)) return "wilting";
  if (completions >= 7) return "healthy";
  if (completions >= 3) return "growing";
  return "new";
}

function getDaysLeft(deadline) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
}

async function loadGarden() {
  try {
    const res = await fetch("php/habits.php");
    const data = await res.json();
    if (data.error) return;
    renderGarden(data.habits || []);
  } catch (e) {
    console.error("Failed to load habits", e);
  }
}

function renderGarden(habits) {
  const grid = document.getElementById("garden-grid");
  grid.innerHTML = "";

  if (habits.length === 0) {
    grid.innerHTML = `
      <div class="plant-card empty-card" onclick="window.location.href='dashboard.html'">
        <div class="plant-empty">
          <p>No plants yet.<br/>Create a habit to start growing.</p>
        </div>
      </div>`;
    return;
  }

  habits.forEach((habit) => {
    const stage = getPlantStage(
      habit.total_completions,
      habit.deadline,
      habit.last_completed
    );
    const status = getStatus(
      habit.total_completions,
      habit.deadline,
      habit.last_completed
    );
    const daysLeft = getDaysLeft(habit.deadline);
    const pct = Math.min(Math.round((habit.total_completions / 7) * 100), 100);

    let daysLabel = "";
    if (daysLeft === null) daysLabel = "No deadline";
    else if (daysLeft < 0) daysLabel = "Deadline passed";
    else if (daysLeft === 0) daysLabel = "Due today";
    else daysLabel = daysLeft + " days left";

    let statusLabel = "";
    if (status === "new") statusLabel = "Just planted";
    else if (status === "growing") statusLabel = "Growing";
    else if (status === "healthy") statusLabel = "Thriving";
    else statusLabel = "Needs water";

    const card = document.createElement("div");
    card.className = `plant-card ${status}`;
    card.onclick = () => openPlant(habit, stage, status, pct, daysLabel);
    card.innerHTML = `
      <div class="plant-stage">
        <div class="plant-glow"></div>
        <div class="plant-visual">
          <img
            src="assets/images/plants/${habit.plant}-${stage}.png"
            alt="${habit.plant_name}"
            width="120"
            height="120"
            onerror="this.style.opacity='0.2'"
          />
        </div>
      </div>
      <div class="plant-info">
        <div class="plant-header">
          <div class="plant-habit-icon">
            <img src="assets/icons/habits/${habit.icon}.svg" width="14" height="14" alt="" />
          </div>
          <p class="plant-name">${habit.plant_name}</p>
          <span class="plant-status-badge ${status}">${statusLabel}</span>
        </div>
        <span class="plant-habit-name">${habit.name}</span>
        <div class="plant-progress">
          <div class="plant-progress-bar">
            <div class="plant-progress-fill" style="width: ${pct}%"></div>
          </div>
          <span class="plant-progress-label">${pct}%</span>
        </div>
        <div class="plant-footer">
          <span class="plant-days">${daysLabel}</span>
          <span class="plant-completions">${habit.total_completions} done</span>
        </div>
      </div>`;
    grid.appendChild(card);
  });

  const addCard = document.createElement("div");
  addCard.className = "plant-card empty-card";
  addCard.onclick = () => (window.location.href = "dashboard.html");
  addCard.innerHTML = `<div class="plant-empty"><p>Plant something new</p></div>`;
  grid.appendChild(addCard);
}

function openPlant(habit, stage, status, pct, daysLabel) {
  document.getElementById(
    "modal-plant-img"
  ).src = `assets/images/plants/${habit.plant}-${stage}.png`;
  document.getElementById("modal-plant-name").textContent = habit.plant_name;
  document.getElementById("modal-habit-name").textContent = habit.name;
  document.getElementById("modal-completions").textContent =
    habit.total_completions;
  document.getElementById("modal-pct").textContent = pct + "%";
  document.getElementById("modal-progress-fill").style.width = pct + "%";
  document.getElementById("modal-stage").textContent =
    "Stage " + stage + " of 4";
  document.getElementById("modal-deadline").textContent = daysLabel;
  document.getElementById("plant-modal").classList.add("open");
}

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = await checkAuth();
  if (!currentUser) return;

  await loadGarden();

  document.getElementById("close-plant-modal").addEventListener("click", () => {
    document.getElementById("plant-modal").classList.remove("open");
  });

  document.getElementById("plant-modal").addEventListener("click", (e) => {
    if (e.target.id === "plant-modal") {
      document.getElementById("plant-modal").classList.remove("open");
    }
  });
});
