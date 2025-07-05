const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const log = document.getElementById("chat-log");
let messages = [];

function addMessage(role, text) {
  const div = document.createElement("div");
  div.textContent = `${role === "user" ? "You" : "AI"}: ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addMessage("user", text);
  messages.push({ role: "user", content: text });
  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const data = await resp.json();
  const reply = data.reply || data.error || "";
  addMessage("assistant", reply);
  messages.push({ role: "assistant", content: reply });
  const regex = /`([^`]+)`/g;
  let match;
  let level = 0;
  while ((match = regex.exec(reply))) {
    document.dispatchEvent(
      new CustomEvent("new-node", { detail: { level, label: match[1] } }),
    );
    level += 1;
  }
});
