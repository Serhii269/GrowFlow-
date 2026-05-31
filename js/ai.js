const habits = [
  {
    name: "Read 10 pages",
    streak: 12,
    completion: 85,
    plant: "Oak",
    status: "healthy",
  },
  {
    name: "Drink 2L water",
    streak: 4,
    completion: 50,
    plant: "Sprout",
    status: "growing",
  },
  {
    name: "Morning workout",
    streak: 0,
    completion: 20,
    plant: "Blossom",
    status: "wilting",
  },
];

const messages = [];

const systemPrompt = `You are a habit coach assistant inside GrowFlow, a habit tracking app where habits are linked to growing plants.

The user's current habits:
${habits
  .map(
    (h) =>
      `- "${h.name}": ${h.streak} day streak, ${h.completion}% completion this week, plant "${h.plant}" is ${h.status}`
  )
  .join("\n")}

Your rules:
- Only answer questions related to habits, productivity, routines, focus, wellbeing, and GrowFlow
- If asked about anything unrelated, politely redirect to habits
- Give specific, actionable advice based on the user's actual habit data
- Be warm, encouraging, and honest — not robotic
- Always respond in the same language the user writes in
- Keep answers concise but useful (2-4 sentences unless more detail is needed)
- Reference their actual habits and streaks when relevant`;

function buildMessages(userText) {
  const history = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  return [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userText },
  ];
}

async function callGroq(userText) {
  const res = await fetch("php/ai.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: buildMessages(userText),
    }),
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
    div.innerHTML = `
      <div class="message-bubble"><p>${text}</p></div>`;
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
