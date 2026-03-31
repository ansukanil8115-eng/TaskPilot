import React, { useEffect, useMemo, useState } from "react";

import { deleteTask, fetchProgress, fetchTasks, updateTask } from "../api/axios.js";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";
import UserManagementPanel from "../components/UserManagementPanel.jsx";

const ROLE_SUMMARY = {
  ADMIN: "Run the workspace, manage access, and keep the whole operation aligned.",
  MANAGER: "Coordinate delivery, assign work to interns, and keep execution on track.",
  INTERN: "Focus on assigned work, update progress, and close tasks with clarity.",
};

const ROLE_TITLES = {
  ADMIN: "Command Center",
  MANAGER: "Delivery Desk",
  INTERN: "My Workboard",
};

export default function DashboardPro({ me }) {
  const role = localStorage.getItem("role");
  const username = me?.username || localStorage.getItem("username");
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState({ total: 0, done: 0, percent_completed: 0 });
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    due_today: false,
    overdue: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const params = useMemo(() => {
    const p = {};
    if (filters.q) p.q = filters.q;
    if (filters.status) p.status = filters.status;
    if (filters.due_today) p.due_today = "1";
    if (filters.overdue) p.overdue = "1";
    return p;
  }, [filters]);

  async function load() {
    setError(null);
    setBusy(true);
    try {
      const [t, prog] = await Promise.all([fetchTasks(params), fetchProgress()]);
      setTasks(t);
      setProgress(prog);
    } catch (err) {
      setError(err?.response?.data ? JSON.stringify(err.response.data) : "Failed to load tasks.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q, params.status, params.due_today, params.overdue]);

  async function onUpdateStatus(task, status) {
    const updated = await updateTask(task.id, { status });
    setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
    const prog = await fetchProgress();
    setProgress(prog);
  }

  async function onDelete(task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await deleteTask(task.id);
    setTasks((current) => current.filter((item) => item.id !== task.id));
    const prog = await fetchProgress();
    setProgress(prog);
  }

  const overdueCount = tasks.filter((task) => task.is_overdue).length;
  const dueTodayCount = tasks.filter((task) => task.is_due_today).length;
  const todoCount = tasks.filter((task) => task.status === "TODO").length;
  const inProgressCount = tasks.filter((task) => task.status === "IN_PROGRESS").length;

  const roleCards = [
    {
      label: role === "INTERN" ? "Assigned Tasks" : "Visible Tasks",
      value: tasks.length,
      tone: "primary",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      tone: "warning",
    },
    {
      label: "Due Today",
      value: dueTodayCount,
      tone: "info",
    },
    {
      label: role === "INTERN" ? "Pending" : "Overdue",
      value: role === "INTERN" ? todoCount : overdueCount,
      tone: role === "INTERN" ? "neutral" : "danger",
    },
  ];

  return (
    <div className="workspace-shell">
      <section className={`workspace-hero workspace-hero-${role?.toLowerCase()}`}>
        <div>
          <div className="workspace-eyebrow">{role}</div>
          <h1 className="workspace-title">{ROLE_TITLES[role] || "TaskPilot Workspace"}</h1>
          <p className="workspace-subtitle">
            {ROLE_SUMMARY[role] || "Role permissions are active for this account."}
          </p>
          <div className="workspace-meta">
            Signed in as <strong>{username}</strong>
          </div>
        </div>
        <div className="workspace-progress">
          <div className="workspace-progress-label">Completion</div>
          <div className="workspace-progress-value">
            {progress.done}/{progress.total} done ({progress.percent_completed}%)
          </div>
          <div className="progress workspace-progress-bar">
            <div className="progress-bar" style={{ width: `${progress.percent_completed}%` }} />
          </div>
        </div>
      </section>

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="workspace-stats">
        {roleCards.map((card) => (
          <article key={card.label} className={`stat-card stat-card-${card.tone}`}>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">{card.value}</div>
          </article>
        ))}
      </section>

      {role === "ADMIN" && (
        <section className="workspace-section">
          <div className="section-heading">
            <div>
              <h2>People & Access</h2>
              <p>Manage accounts, roles, and operational availability from one place.</p>
            </div>
          </div>
          <UserManagementPanel />
        </section>
      )}

      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <h2>Task Filters</h2>
            <p>Narrow the task stream by status, urgency, and search terms.</p>
          </div>
        </div>
        <div className="card card-body mb-3 workspace-card">
          <div className="row g-2 align-items-end">
            <div className="col-md-6">
              <label className="form-label">Search title</label>
              <input
                className="form-control"
                value={filters.q}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, q: event.target.value }))
                }
                placeholder="e.g. onboarding"
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="">All</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="col-md-3 d-flex gap-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={filters.due_today}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      due_today: event.target.checked,
                      overdue: false,
                    }))
                  }
                />
                <label className="form-check-label">Due today</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={filters.overdue}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      overdue: event.target.checked,
                      due_today: false,
                    }))
                  }
                />
                <label className="form-check-label">Overdue</label>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-end mt-3">
            <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={busy}>
              {busy ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      {role !== "INTERN" && (
        <section className="workspace-section">
          <div className="section-heading">
            <div>
              <h2>{role === "ADMIN" ? "Assign New Work" : "Create Team Task"}</h2>
              <p>
                {role === "ADMIN"
                  ? "Create tasks across the workspace and distribute ownership quickly."
                  : "Open new work items and assign them to the right intern."}
              </p>
            </div>
          </div>
          <TaskForm onCreated={() => load()} />
        </section>
      )}

      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <h2>{role === "INTERN" ? "Assigned Work" : "Task Oversight"}</h2>
            <p>
              {role === "INTERN"
                ? "Track progress on the work currently assigned to you."
                : "Monitor execution, adjust status, and keep delivery moving."}
            </p>
          </div>
        </div>
        <TaskList tasks={tasks} role={role} onUpdateStatus={onUpdateStatus} onDelete={onDelete} />
      </section>
    </div>
  );
}
