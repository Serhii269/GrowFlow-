let currentUser = null;
let habits = [];

const modes = {
  focus: { time: 25 * 60, label: "Focus time" },
  break: { time: 5 * 60, label: "Short break" },
  long: { time: 15 * 60, label: "Long break" },
};

let currentMode = "focus";
let totalTime = modes.focus.time;
let timeLeft = totalTime;
let running = false;
let interval = null;
let session = 1;
const maxSessions = 4;
let selectedHabitId = null;
const circumference = 741.4;

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = await checkAuth();
  if (!currentUser) return;
  await loadHabits();
  updateDisplay();
  updateDots();
  setupModes();
});

async function loadHabits() {
  try {
    const res = await fetch("php/habits.php");
    const data = await res.json();
    habits = data.habits || [];
    renderFocusHabits();
    renderSessions();
  } catch (e) {
    console.error(e);
  }
}

function renderFocusHabits() {
  const container = document.getElementById("focus-habits");
  container.innerHTML = "";

  if (habits.length === 0) {
    container.innerHTML =
      '<p class="focus-empty">No habits yet. <a href="dashboard.html">Create one</a></p>';
    return;
  }

  habits.forEach((habit, i) => {
    const div = document.createElement("div");
    div.className = "focus-habit" + (i === 0 ? " selected" : "");
    div.dataset.id = habit.id;
    div.onclick = () => selectHabit(div, habit.id);
    div.innerHTML = `
      <div class="focus-habit-icon">
        <img src="assets/icons/habits/${
          habit.icon
        }.svg" width="16" height="16" alt="" />
      </div>
      <div class="focus-habit-text">
        <p>${habit.name}</p>
        <span>${habit.plant_name}${
      habit.streak > 0 ? " · " + habit.streak + "d streak" : ""
    }</span>
      </div>`;
    container.appendChild(div);
  });

  if (habits.length > 0) selectedHabitId = habits[0].id;
}

function renderSessions() {
  const container = document.getElementById("sessions-list");
  container.innerHTML = "";

  const done = habits.filter((h) => h.done_today);

  if (done.length === 0) {
    container.innerHTML =
      '<p class="focus-empty">No completed habits today.</p>';
    return;
  }

  done.forEach((habit) => {
    const div = document.createElement("div");
    div.className = "session-item done";
    div.innerHTML = `
      <div class="session-dot"></div>
      <div class="session-item-text">
        <p>${habit.name}</p>
        <span>Completed today</span>
      </div>`;
    container.appendChild(div);
  });
}

function selectHabit(el, id) {
  document
    .querySelectorAll(".focus-habit")
    .forEach((h) => h.classList.remove("selected"));
  el.classList.add("selected");
  selectedHabitId = id;
}

function setupModes() {
  document.getElementById("btn-focus").onclick = () => setMode("focus");
  document.getElementById("btn-break").onclick = () => setMode("break");
  document.getElementById("btn-long").onclick = () => setMode("long");
  document.getElementById("btn-start").onclick = toggleTimer;
  document.getElementById("btn-reset").onclick = resetTimer;
  document.getElementById("btn-skip").onclick = skipTimer;
}

function updateDisplay() {
  const m = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const s = (timeLeft % 60).toString().padStart(2, "0");
  document.getElementById("timer-display").textContent = m + ":" + s;
  const offset = circumference - (timeLeft / totalTime) * circumference;
  document.getElementById("timer-progress").style.strokeDashoffset = offset;
}

function updateDots() {
  const container = document.getElementById("session-dots");
  container.innerHTML = "";
  for (let i = 1; i <= maxSessions; i++) {
    const dot = document.createElement("div");
    dot.className =
      "dot" + (i < session ? " done" : i === session ? " active" : "");
    container.appendChild(dot);
  }
  document.getElementById("session-text").textContent =
    "Session " + session + " of " + maxSessions;
}

function toggleTimer() {
  if (running) {
    clearInterval(interval);
    running = false;
    document.getElementById("play-icon").style.display = "block";
    document.getElementById("pause-icon").style.display = "none";
  } else {
    running = true;
    document.getElementById("play-icon").style.display = "none";
    document.getElementById("pause-icon").style.display = "block";
    interval = setInterval(async () => {
      if (timeLeft <= 0) {
        clearInterval(interval);
        running = false;
        document.getElementById("play-icon").style.display = "block";
        document.getElementById("pause-icon").style.display = "none";
        if (currentMode === "focus") {
          if (selectedHabitId) {
            await fetch("php/habits.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "toggle",
                habit_id: selectedHabitId,
              }),
            });
            await loadHabits();
          }
          if (session < maxSessions) session++;
          updateDots();
        }
        return;
      }
      timeLeft--;
      updateDisplay();
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(interval);
  running = false;
  timeLeft = totalTime;
  document.getElementById("play-icon").style.display = "block";
  document.getElementById("pause-icon").style.display = "none";
  updateDisplay();
}

function skipTimer() {
  clearInterval(interval);
  running = false;
  timeLeft = 0;
  document.getElementById("play-icon").style.display = "block";
  document.getElementById("pause-icon").style.display = "none";
  updateDisplay();
  if (currentMode === "focus" && session < maxSessions) session++;
  updateDots();
}

function setMode(mode) {
  currentMode = mode;
  totalTime = modes[mode].time;
  timeLeft = totalTime;
  document.getElementById("timer-label").textContent = modes[mode].label;
  clearInterval(interval);
  running = false;
  document.getElementById("play-icon").style.display = "block";
  document.getElementById("pause-icon").style.display = "none";
  document
    .querySelectorAll(".mode-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("btn-" + mode).classList.add("active");
  const color =
    mode === "focus" ? "#006d36" : mode === "break" ? "#f59e0b" : "#3b82f6";
  document.getElementById("timer-progress").style.stroke = color;
  updateDisplay();
}
