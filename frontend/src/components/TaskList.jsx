import React from "react";

export default function TaskList({ tasks, role, onUpdateStatus, onDelete }) {
  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>Tasks</strong>
        <span className="text-muted small">{tasks.length} item(s)</span>
      </div>
      <div className="table-responsive">
        <table className="table table-sm mb-0 align-middle">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Deadline</th>
              <th>Assigned</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className={t.is_overdue ? "table-danger" : t.is_due_today ? "table-warning" : ""}>
                <td>
                  <div className="fw-semibold">{t.title}</div>
                  {t.description ? <div className="text-muted small">{t.description}</div> : null}
                </td>
                <td>
                  <span className="badge text-bg-secondary">{t.status}</span>
                </td>
                <td>{t.priority}</td>
                <td>{t.deadline || "—"}</td>
                <td>{t.assigned_to_username || "—"}</td>
                <td>
                  <div className="d-flex gap-2">
                    <select
                      className="form-select form-select-sm"
                      value={t.status}
                      onChange={(e) => onUpdateStatus(t, e.target.value)}
                      title="Update status"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                    {role !== "INTERN" && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(t)}>
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

