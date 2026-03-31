import React from "react";

function statusBadgeClass(status) {
  if (status === "SUBMITTED") return "text-bg-info";
  if (status === "DONE") return "text-bg-success";
  if (status === "IN_PROGRESS") return "text-bg-warning";
  return "text-bg-secondary";
}

export default function TaskListEnhanced({ tasks, role, onUpdateStatus, onDelete }) {
  function submitTask(task) {
    const notes = prompt(
      `Add project submission notes for "${task.title}" before sending it to your manager:`,
      task.submission_notes || "",
    );
    if (notes === null) return;
    onUpdateStatus(task, "SUBMITTED", { submission_notes: notes.trim() });
  }

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
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                className={task.is_overdue ? "table-danger" : task.is_due_today ? "table-warning" : ""}
              >
                <td>
                  <div className="fw-semibold">{task.title}</div>
                  {task.description ? (
                    <div className="text-muted small">{task.description}</div>
                  ) : null}
                  {task.submission_notes ? (
                    <div className="text-primary-emphasis small mt-1">
                      Submission: {task.submission_notes}
                    </div>
                  ) : null}
                  {task.submitted_at ? (
                    <div className="text-muted small">
                      Submitted on {new Date(task.submitted_at).toLocaleString()}
                    </div>
                  ) : null}
                </td>
                <td>
                  <span className={`badge ${statusBadgeClass(task.status)}`}>{task.status}</span>
                </td>
                <td>{task.priority}</td>
                <td>{task.deadline || "-"}</td>
                <td>{task.assigned_to_username || "-"}</td>
                <td>
                  <div className="d-flex gap-2">
                    {role === "INTERN" && task.status !== "SUBMITTED" && task.status !== "DONE" && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => submitTask(task)}
                      >
                        Submit Project
                      </button>
                    )}
                    <select
                      className="form-select form-select-sm"
                      value={task.status}
                      onChange={(event) => onUpdateStatus(task, event.target.value)}
                      title="Update status"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      {role === "INTERN" && task.status === "SUBMITTED" && (
                        <option value="SUBMITTED">Submitted</option>
                      )}
                      {role === "INTERN" && task.status === "DONE" && (
                        <option value="DONE">Done</option>
                      )}
                      {role !== "INTERN" && <option value="SUBMITTED">Submitted</option>}
                      {role !== "INTERN" && <option value="DONE">Done</option>}
                    </select>
                    {role !== "INTERN" && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onDelete(task)}
                      >
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
