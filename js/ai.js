let currentUser = null;
let habits = [];
const messages = [];

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = await checkAuth();
  if (!currentUser) return;
  await loadHabits();

  document.getElementById("chat-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});

async function loadHabits() {
  try {
    const res = await fetch("php/habits.php");
    const data = await res.json();
    habits = data.habits || [];
    renderAiHabits();
    renderWeekStats();
  } catch (e) {
    console.error(e);
  }
}

function renderAiHabits() {
  const container = document.getElementById("ai-habits-list");
  container.innerHTML = "";

  if (habits.length === 0) {
    container.innerHTML =
      '<p style="font-size:13px;color:#9aaa9b;">No habits yet.</p>';
    return;
  }

  habits.forEach((habit) => {
    const status =
      habit.streak >= 7 ? "good" : habit.streak >= 3 ? "medium" : "bad";
    const div = document.createElement("div");
    div.className = "ai-habit-item";
    div.innerHTML = `
      <div class="ai-habit-icon">
        <img src="assets/icons/habits/${
          habit.icon
        }.svg" width="14" height="14" alt="" />
      </div>
      <div class="ai-habit-text">
        <p>${habit.name}</p>
        <span>${
          habit.streak > 0 ? habit.streak + " day streak" : "No streak"
        }</span>
      </div>
      <div class="ai-habit-status ${status}"></div>`;
    container.appendChild(div);
  });
}

function renderWeekStats() {
  const total = habits.length;
  const done = habits.filter((h) => h.done_today).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const maxStreak = Math.max(0, ...habits.map((h) => h.streak));

  document.getElementById("ai-completion").textContent = pct + "%";
  document.getElementById("ai-streak").textContent = maxStreak;
}

function getSystemPrompt() {
  const habitsList =
    habits.length > 0
      ? habits
          .map(
            (h) =>
              `- "${h.name}": ${h.streak} day streak, done today: ${
                h.done_today ? "yes" : "no"
              }, plant: ${h.plant_name}`
          )
          .join("\n")
      : "No habits created yet.";

  return `You are a habit coach inside GrowFlow, a habit tracking app.
The user's name is ${currentUser?.name || "there"}.
Their current habits:
${habitsList}

Rules:
- Only answer questions related to habits, productivity, routines, focus, wellbeing, and GrowFlow
- If asked about anything unrelated, politely redirect to habits
- Give specific advice based on their actual habit data
- Be warm, encouraging, and honest
- Respond in the same language the user writes in
- Keep answers concise (2-4 sentences unless more detail is needed)`;
}

function buildMessages(userText) {
  return [
    { role: "system", content: getSystemPrompt() },
    ...messages,
    { role: "user", content: userText },
  ];
}

async function callGroq(userText) {
  const res = await fetch("php/ai.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: buildMessages(userText) }),
  });
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.reply;
}

function appendMessage(role, text) {
  const wrap = document.getElementById("chat-messages");
  const div = document.createElement("div");
  div.className = "message message-" + role;

  if (role === "ai") {
    div.innerHTML = `
      <div class="message-avatar">
        <img src="assets/icons/logo.svg" alt="" width="16" height="16" />
      </div>
      <div class="message-bubble"><p>${text}</p></div>`;
  } else {
    div.innerHTML = `<div class="message-bubble"><p>${text}</p></div>`;
  }

  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function showTyping() {
  const wrap = document.getElementById("chat-messages");
  const div = document.createElement("div");
  div.className = "message message-ai";
  div.id = "typing-indicator";
  div.innerHTML = `
    <div class="message-avatar">
      <img src="assets/icons/logo.svg" alt="" width="16" height="16" />
    </div>
    <div class="message-bubble typing">
      <span></span><span></span><span></span>
    </div>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById("typing-indicator");
  if (el) el.remove();
}

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  document.getElementById("suggestions").style.display = "none";
  messages.push({ role: "user", content: text });
  appendMessage("user", text);
  showTyping();

  try {
    const reply = await callGroq(text);
    removeTyping();
    messages.push({ role: "assistant", content: reply });
    appendMessage("ai", reply);
  } catch (e) {
    removeTyping();
    appendMessage("ai", "Something went wrong. Please try again.");
  }
}

function sendSuggestion(btn) {
  document.getElementById("chat-input").value = btn.textContent;
  sendMessage();
}
