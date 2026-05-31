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

const display = document.getElementById("timer-display");
const label = document.getElementById("timer-label");
const progress = document.getElementById("timer-progress");
const playIcon = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const sessionText = document.getElementById("session-text");
const sessionDots = document.getElementById("session-dots");
const circumference = 741.4;

function updateDisplay() {
  const m = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const s = (timeLeft % 60).toString().padStart(2, "0");
  display.textContent = m + ":" + s;
  const offset = circumference - (timeLeft / totalTime) * circumference;
  progress.style.strokeDashoffset = offset;
}

function updateDots() {
  sessionDots.innerHTML = "";
  for (let i = 1; i <= maxSessions; i++) {
    const dot = document.createElement("div");
    dot.className =
      "dot" + (i < session ? " done" : i === session ? " active" : "");
    sessionDots.appendChild(dot);
  }
  sessionText.textContent = "Session " + session + " of " + maxSessions;
}

function toggleTimer() {
  if (running) {
    clearInterval(interval);
    running = false;
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
  } else {
    running = true;
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";
    interval = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(interval);
        running = false;
        playIcon.style.display = "block";
        pauseIcon.style.display = "none";
        if (currentMode === "focus" && session < maxSessions) session++;
        updateDots();
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
  playIcon.style.display = "block";
  pauseIcon.style.display = "none";
  updateDisplay();
}

function skipTimer() {
  clearInterval(interval);
  running = false;
  timeLeft = 0;
  playIcon.style.display = "block";
  pauseIcon.style.display = "none";
  updateDisplay();
  if (currentMode === "focus" && session < maxSessions) session++;
  updateDots();
}

function setMode(mode) {
  currentMode = mode;
  totalTime = modes[mode].time;
  timeLeft = totalTime;
  label.textContent = modes[mode].label;
  clearInterval(interval);
  running = false;
  playIcon.style.display = "block";
  pauseIcon.style.display = "none";
  document
    .querySelectorAll(".mode-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("btn-" + mode).classList.add("active");
  progress.style.stroke =
    mode === "focus" ? "#006d36" : mode === "break" ? "#f59e0b" : "#3b82f6";
  updateDisplay();
}

function selectHabit(el) {
  document
    .querySelectorAll(".focus-habit")
    .forEach((h) => h.classList.remove("selected"));
  el.classList.add("selected");
}

updateDisplay();
updateDots();
