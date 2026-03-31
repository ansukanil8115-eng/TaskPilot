import React, { useEffect, useState } from "react";

import { createTask, fetchUsers } from "../api/axios.js";

export default function TaskForm({ onCreated }) {
  const role = localStorage.getItem("role");
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    deadline: "",
    assigned_to: "",
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersBusy, setUsersBusy] = useState(false);
  const [usersError, setUsersError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      setUsersBusy(true);
      setUsersError(null);
      try {
        const data = await fetchUsers();
        if (mounted) setUsers(data);
      } catch (err) {
        if (mounted) {
          setUsersError(
            err?.response?.data ? JSON.stringify(err.response.data) : "Could not load users.",
          );
        }
      } finally {
        if (mounted) setUsersBusy(false);
      }
    }

    loadUsers();

    return () => {
      mounted = false;
    };
  }, []);

  function set(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        deadline: form.deadline || null,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      };
      const task = await createTask(payload);
      setForm({ title: "", description: "", status: "TODO", priority: "MEDIUM", deadline: "", assigned_to: "" });
      onCreated?.(task);
    } catch (err) {
      setError(err?.response?.data ? JSON.stringify(err.response.data) : "Create failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card-body mb-3">
      <h5 className="mb-3">Create Task</h5>
      <div className="text-muted small mb-3">
        {role === "ADMIN"
          ? "Admins can create tasks and assign them to any user."
          : "Managers can create tasks and assign them to interns."}
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {usersError && <div className="alert alert-warning">{usersError}</div>}
      <form onSubmit={submit}>
        <div className="row">
          <div className="col-md-6">
            <label className="form-label">Title</label>
            <input className="form-control mb-3" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="col-md-3">
            <label className="form-label">Status</label>
            <select className="form-select mb-3" value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Priority</label>
            <select className="form-select mb-3" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <label className="form-label">Description</label>
        <textarea className="form-control mb-3" value={form.description} onChange={(e) => set("description", e.target.value)} />

        <div className="row">
          <div className="col-md-6">
            <label className="form-label">Deadline</label>
            <input type="date" className="form-control mb-3" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Assigned To</label>
            <select
              className="form-select mb-3"
              value={form.assigned_to}
              onChange={(e) => set("assigned_to", e.target.value)}
              disabled={usersBusy}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Creating…" : "Create"}
        </button>
      </form>
      <div className="text-muted small mt-2">
        {usersBusy
          ? "Loading available users..."
          : "Available assignees are loaded from /api/auth/users/ based on your role."}
      </div>
    </div>
  );
}

