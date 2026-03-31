import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  clearChatHistory,
  downloadChatHistoryPdf,
  fetchChatHistory,
  sendChatMessage,
} from "../api/axios.js";

const QUICK_COMMANDS = [
  "summary",
  "show tasks",
  "show overdue tasks",
  "show high priority tasks",
];

export default function ChatbotWidgetPro() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("chatTheme") || "light");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [historyBusy, setHistoryBusy] = useState(false);
  const messageEndRef = useRef(null);

  const role = localStorage.getItem("role");

  const containerClass = useMemo(
    () => `card chatbot-panel ${theme === "dark" ? "bg-dark text-light chatbot-dark" : ""}`,
    [theme]
  );

  useEffect(() => {
    localStorage.setItem("chatTheme", theme);
  }, [theme]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!open) return;
      setError("");
      try {
        const data = await fetchChatHistory();
        if (!mounted) return;
        setMessages(
          [...data].reverse().flatMap((item) => [
            { who: "user", text: item.message, ts: item.created_at },
            { who: "bot", text: item.response, ts: item.created_at },
          ])
        );
      } catch {
        if (mounted) {
          setError("Could not load chat history.");
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [open]);

  async function dispatchMessage(text) {
    setError("");
    setBusy(true);
    setMessages((current) => [
      ...current,
      { who: "user", text, ts: new Date().toISOString() },
    ]);

    try {
      const data = await sendChatMessage(text);
      setMessages((current) => [
        ...current,
        { who: "bot", text: data.response, ts: data.item.created_at },
      ]);
    } catch {
      setError("The assistant could not process that request.");
      setMessages((current) => [
        ...current,
        {
          who: "bot",
          text: "I ran into a problem handling that request. Please try again.",
          ts: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function send(event) {
    event.preventDefault();
    const msg = input.trim();
    if (!msg) return;
    setInput("");
    await dispatchMessage(msg);
  }

  async function runQuickCommand(command) {
    if (busy) return;
    setInput("");
    await dispatchMessage(command);
  }

  async function clearHistory() {
    setHistoryBusy(true);
    setError("");
    try {
      await clearChatHistory();
      setMessages([]);
    } catch {
      setError("Could not clear chat history.");
    } finally {
      setHistoryBusy(false);
    }
  }

  function formatTime(value) {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  return (
    <>
      {open && (
        <div className={containerClass}>
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <strong>TaskPilot Assistant</strong>{" "}
              <span className="text-muted small">({role})</span>
              <div className="text-muted small">
                Operations assistant for task oversight and execution.
              </div>
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
            {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

            <div className="chatbot-quick-actions mb-3">
              {QUICK_COMMANDS.map((command) => (
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
                Try: <code>summary</code>, <code>show overdue tasks</code>,{" "}
                <code>show high priority tasks</code>, or <code>help</code>.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`d-flex ${
                      message.who === "user"
                        ? "justify-content-end"
                        : "justify-content-start"
                    }`}
                  >
                    <div
                      className={`chat-bubble ${message.who} ${
                        message.who === "bot" && theme === "dark"
                          ? "text-light"
                          : ""
                      }`}
                    >
                      <div>{message.text}</div>
                      <div className="chat-timestamp">{formatTime(message.ts)}</div>
                    </div>
                  </div>
                ))}

                {busy && (
                  <div className="d-flex justify-content-start">
                    <div
                      className={`chat-bubble bot chatbot-typing ${
                        theme === "dark" ? "text-light" : ""
                      }`}
                    >
                      TaskPilot Assistant is working...
                    </div>
                  </div>
                )}

                <div ref={messageEndRef} />
              </div>
            )}
          </div>

          <div className="card-footer">
            <form onSubmit={send} className="d-flex gap-2">
              <input
                className="form-control"
                placeholder="Try: summary, show overdue tasks, add task Launch review | priority:high"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={busy}
              />
              <button className="btn btn-primary" disabled={busy}>
                Send
              </button>
            </form>
            <div className="text-muted small mt-2">
              Commands: help, summary, show tasks, show pending tasks, tasks due
              today, show overdue tasks, show high priority tasks, task status
              done
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
