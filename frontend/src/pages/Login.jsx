import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { login } from "../api/axios.js";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username, password);
      onLogin?.();
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  // ✅ RETURN MUST BE INSIDE FUNCTION
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div
        style={{
          width: "350px",
          padding: "30px",
          borderRadius: "20px",
          background: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
        }}
      >
        <h3 className="text-center mb-2">Log in</h3>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={submit}>
          <input
            className="form-control mb-3"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control mb-3"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "40px" }}
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "38%",
                cursor: "pointer"
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button className="btn btn-success w-100">
            {busy ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-3">
          <Link to="/register">Create Account</Link>
        </div>
      </div>
    </div>
  );
}