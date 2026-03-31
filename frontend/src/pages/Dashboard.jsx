import React, { useEffect, useMemo, useState } from "react";

import { deleteTask, fetchProgress, fetchTasks, updateTask } from "../api/axios.js";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskListEnhanced.jsx";
import UserManagementPanel from "../components/UserManagementPanel.jsx";

const ROLE_SUMMARY = {
  ADMIN: "Full access to tasks, assignments, and team visibility.",
  MANAGER: "Can create tasks, monitor the team, and assign work to interns.",
  INTERN: "Can view assigned tasks and update only their task status.",
};

export default function Dashboard({ me }) {
  const role = localStorage.getItem("role");
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

  async function onUpdateStatus(task, status, extraPayload = {}) {
    const updated = await updateTask(task.id, { status, ...extraPayload });
    setTasks((p) => p.map((x) => (x.id === task.id ? updated : x)));
    const prog = await fetchProgress();
    setProgress(prog);
  }

  async function onDelete(task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await deleteTask(task.id);
    setTasks((p) => p.filter((x) => x.id !== task.id));
    const prog = await fetchProgress();
    setProgress(prog);
  }

  const submittedCount = tasks.filter((task) => task.status === "SUBMITTED").length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <h3 className="mb-1">Dashboard</h3>
          <div className="text-muted small">
            Signed in as <strong>{me?.username || localStorage.getItem("username")}</strong> ({role})
          </div>
        </div>
        <div className="text-end">
          <div className="small text-muted">Progress</div>
          <div className="fw-semibold">
            {progress.done}/{progress.total} done ({progress.percent_completed}%)
          </div>
          <div className="progress" style={{ width: 220, height: 10 }}>
            <div className="progress-bar" style={{ width: `${progress.percent_completed}%` }} />
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {role === "MANAGER" && submittedCount > 0 && (
        <div className="alert alert-warning">
          {submittedCount} submitted task(s) are ready for review.
        </div>
      )}

      {role === "ADMIN" && <UserManagementPanel />}

      <div className="card card-body mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-6">
            <label className="form-label">Search title</label>
            <input
              className="form-control"
              value={filters.q}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
              placeholder="e.g. auth"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="">All</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div className="col-md-3 d-flex gap-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={filters.due_today}
                onChange={(e) => setFilters((p) => ({ ...p, due_today: e.target.checked, overdue: false }))}
              />
              <label className="form-check-label">Due today</label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={filters.overdue}
                onChange={(e) => setFilters((p) => ({ ...p, overdue: e.target.checked, due_today: false }))}
              />
              <label className="form-check-label">Overdue</label>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-end mt-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={busy}>
            {busy ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {role !== "INTERN" && <TaskForm onCreated={() => load()} />}

      <TaskList tasks={tasks} role={role} onUpdateStatus={onUpdateStatus} onDelete={onDelete} />
    </div>
  );
}

