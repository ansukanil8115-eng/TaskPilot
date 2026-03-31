import React, { useEffect, useMemo, useState } from "react";

import {
  clearChatHistory,
  downloadChatHistoryPdf,
  fetchChatHistory,
  sendChatMessage,
} from "../api/axios.js";

const BASE_COMMANDS = [
  "help",
  "summary",
  "show tasks",
  "show pending tasks",
  "tasks due today",
  "show overdue tasks",
  "show high priority tasks",
  "task status done",
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("chatTheme") || "light");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const role = localStorage.getItem("role");

  const containerClass = useMemo(
    () => `card chatbot-panel ${theme === "dark" ? "bg-dark text-light chatbot-dark" : ""}`,
    [theme]
  );

  const quickCommands =
    role === "MANAGER"
      ? [...BASE_COMMANDS, "add task Sprint review | priority:high | due:2026-04-10"]
      : BASE_COMMANDS;

  useEffect(() => {
    localStorage.setItem("chatTheme", theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!open) return;
      try {
        const data = await fetchChatHistory();
        if (!mounted) return;
        setMessages(
          [...data].reverse().flatMap((messageItem) => [
            { who: "user", text: messageItem.message, ts: messageItem.created_at },
            { who: "bot", text: messageItem.response, ts: messageItem.created_at },
          ])
        );
      } catch {
        // Ignore chat history errors and keep the widget usable.
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [open]);

  async function dispatchMessage(message) {
    if (!message) return;
    setBusy(true);
    setMessages((prev) => [...prev, { who: "user", text: message, ts: new Date().toISOString() }]);
    try {
      const data = await sendChatMessage(message);
      setMessages((prev) => [...prev, { who: "bot", text: data.response, ts: data.item.created_at }]);
    } finally {
      setBusy(false);
    }
  }

  async function send(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message) return;
    setInput("");
    await dispatchMessage(message);
  }

  async function runQuickCommand(command) {
    if (busy) return;
    setInput("");
    await dispatchMessage(command);
  }

  async function openPdf() {
    const blob = await downloadChatHistoryPdf();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "chat-history.pdf";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function clearHistory() {
    setHistoryBusy(true);
    try {
      await clearChatHistory();
      setMessages([]);
    } finally {
      setHistoryBusy(false);
    }
  }

  return (
    <>
      {open && (
        <div className={containerClass}>
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <strong>TaskPilot Assistant</strong> <span className="text-muted small">({role})</span>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <button
                className={`btn btn-sm ${theme === "dark" ? "btn-outline-light" : "btn-outline-secondary"}`}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Toggle theme"
              >
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              <button
                className={`btn btn-sm ${theme === "dark" ? "btn-outline-light" : "btn-outline-secondary"}`}
                onClick={openPdf}
                title="Download chat history PDF"
              >
                PDF
              </button>
              <button
                className={`btn btn-sm ${theme === "dark" ? "btn-outline-light" : "btn-outline-secondary"}`}
                onClick={clearHistory}
                disabled={historyBusy}
                title="Clear chat history"
              >
                {historyBusy ? "..." : "Clear"}
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>

          <div className="card-body chatbot-messages">
            <div className="chatbot-quick-actions mb-3">
              {quickCommands.map((command) => (
                <button
                  key={command}
                  type="button"
                  className={`btn btn-sm ${theme === "dark" ? "btn-outline-light" : "btn-outline-primary"}`}
                  onClick={() => runQuickCommand(command)}
                  disabled={busy}
                >
                  {command}
                </button>
              ))}
            </div>

            {messages.length === 0 ? (
              <div className="text-muted small">
                Try: <code>summary</code>, <code>show overdue tasks</code>, <code>show high priority tasks</code>, or <code>help</code>.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {messages.map((message, index) => (
                  <div key={index} className={`d-flex ${message.who === "user" ? "justify-content-end" : "justify-content-start"}`}>
                    <div className={`chat-bubble ${message.who} ${message.who === "bot" && theme === "dark" ? "text-light" : ""}`}>
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-footer">
            <form onSubmit={send} className="d-flex gap-2">
              <input
                className="form-control"
                placeholder={
                  role === "MANAGER"
                    ? "Try: add task Sprint review | priority:high | due:2026-04-10"
                    : "Try: summary or show pending tasks"
                }
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={busy}
              />
              <button className="btn btn-primary" disabled={busy}>
                Send
              </button>
            </form>
            <div className="text-muted small mt-2">
              Commands: help, summary, show tasks, show pending tasks, tasks due today, show overdue tasks, show high priority tasks, task status done
              {role === "MANAGER" ? ", add task <title> | priority:high | due:YYYY-MM-DD | assign:username" : ""}
            </div>
          </div>
        </div>
      )}

      <div className="chatbot-fab">
        <button className="btn btn-primary rounded-pill" onClick={() => setOpen((value) => !value)}>
          Chat
        </button>
      </div>
    </>
  );
}
