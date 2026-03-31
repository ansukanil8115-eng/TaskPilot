import React, { useEffect, useState } from "react";

import { createUser, deleteUser, fetchUsers, updateUser } from "../api/axios.js";

const EMPTY_FORM = {
  username: "",
  email: "",
  role: "MANAGER",
  password: "",
};

function getMessage(error, fallback) {
  const data = error?.response?.data;
  const detail = data?.detail || data?.error;
  if (typeof detail === "string") return detail;
  if (data && typeof data === "object") {
    const fieldMessage = Object.values(data)
      .flat()
      .find((value) => typeof value === "string");
    if (fieldMessage) return fieldMessage;
  }
  return fallback;
}

export default function UserManagementPanel() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError(getMessage(err, "Could not load users."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await createUser(form);
      setForm(EMPTY_FORM);
      setSuccess("User created successfully.");
      await loadUsers();
    } catch (err) {
      setError(getMessage(err, "Could not create user."));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(user) {
    setError("");
    setSuccess("");
    try {
      const updated = await updateUser(user.id, { is_active: !user.is_active });
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(getMessage(err, "Could not update user status."));
    }
  }

  async function changeRole(user, role) {
    setError("");
    setSuccess("");
    try {
      const updated = await updateUser(user.id, { role });
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(getMessage(err, "Could not update user role."));
    }
  }

  async function removeUser(user) {
    if (!confirm(`Delete user "${user.username}"?`)) return;

    setError("");
    setSuccess("");
    try {
      await deleteUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
    } catch (err) {
      setError(getMessage(err, "Could not delete user."));
    }
  }

  return (
    <div className="card card-body mb-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-1">User Management</h5>
          <div className="text-muted small">
            Admins can create accounts, change roles, and activate or deactivate users.
          </div>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={loadUsers} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh users"}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={submit} className="row g-2 mb-4">
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Username"
            value={form.username}
            onChange={(event) => setField("username", event.target.value)}
            required
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            required
          />
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={form.role}
            onChange={(event) => setField("role", event.target.value)}
          >
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="INTERN">Intern</option>
          </select>
        </div>
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Temporary password"
            type="password"
            value={form.password}
            onChange={(event) => setField("password", event.target.value)}
            required
          />
        </div>
        <div className="col-md-1 d-grid">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "..." : "Add"}
          </button>
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ width: 240 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={user.role}
                    onChange={(event) => changeRole(user, event.target.value)}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </td>
                <td>
                  <span className={`badge ${user.is_active ? "text-bg-success" : "text-bg-secondary"}`}>
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      type="button"
                      onClick={() => toggleActive(user)}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      type="button"
                      onClick={() => removeUser(user)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-muted py-4">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
