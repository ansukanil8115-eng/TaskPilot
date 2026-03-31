import React, { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

import { login, register, resetPassword, sendOtp } from "../api/axios.js";
import logo from "../assets/logo.png";
import "./Auth.css";

const LOGIN_PANEL = "login";
const REGISTER_PANEL = "register";
const FORGOT_PANEL = "forgot";

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;
  const message = data?.error || data?.detail;
  if (Array.isArray(message)) {
    return message.join(" ");
  }
  if (message) {
    return message;
  }
  if (data && typeof data === "object") {
    const fieldMessage = Object.values(data)
      .flat()
      .find((value) => typeof value === "string");
    if (fieldMessage) {
      return fieldMessage;
    }
  }
  return message || fallback;
}

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPanel =
    location.pathname === "/register" ? REGISTER_PANEL : LOGIN_PANEL;

  const [panel, setPanel] = useState(initialPanel);
  const [busy, setBusy] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  });
  const [resetForm, setResetForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] =
    useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    setPanel(initialPanel);
    setError("");
    setSuccess("");
  }, [initialPanel]);

  function switchPanel(nextPanel) {
    setPanel(nextPanel);
    setError("");
    setSuccess("");

    if (nextPanel === REGISTER_PANEL) {
      navigate("/register");
      return;
    }

    navigate("/login");
  }

  function updateForm(setter, field, value) {
    setter((current) => ({ ...current, [field]: value }));
  }

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await login(loginForm.username, loginForm.password);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed."));
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!registerForm.role) {
      setError("Please select a role.");
      return;
    }

    if (registerForm.role === "ADMIN") {
      setError("Admin accounts can only be created by an existing admin.");
      return;
    }

    setBusy(true);
    try {
      await register({
        username: registerForm.username,
        email: registerForm.email,
        role: registerForm.role,
        password: registerForm.password,
      });
      setRegisterForm({
        username: "",
        email: "",
        role: "",
        password: "",
        confirmPassword: "",
      });
      switchPanel(LOGIN_PANEL);
      setSuccess("Account created successfully. You can sign in now.");
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed."));
    } finally {
      setBusy(false);
    }
  }

  async function handleSendOtp(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!resetForm.email) {
      setError("Enter your email to receive an OTP.");
      return;
    }

    setOtpBusy(true);
    try {
      await sendOtp(resetForm.email);
      setOtpSent(true);
      setSuccess("OTP sent to your email. It expires in 10 minutes.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not send OTP."));
    } finally {
      setOtpBusy(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (resetForm.password !== resetForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await resetPassword(resetForm.email, resetForm.otp, resetForm.password);
      setResetForm({
        email: "",
        otp: "",
        password: "",
        confirmPassword: "",
      });
      setOtpSent(false);
      switchPanel(LOGIN_PANEL);
      setSuccess("Password reset successful. Sign in with your new password.");
    } catch (err) {
      setError(getErrorMessage(err, "Password reset failed."));
    } finally {
      setBusy(false);
    }
  }

  const isRegister = panel === REGISTER_PANEL;
  const isForgotPassword = panel === FORGOT_PANEL;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-left">
          <img src={logo} alt="TaskPilot logo" className="auth-logo" />

          <h2>
            {isForgotPassword
              ? "Reset Access"
              : isRegister
                ? "Welcome"
                : "Welcome Back"}
          </h2>

          <p>
            {isForgotPassword
              ? "Request an OTP and set a new password to get back into TaskPilot."
              : isRegister
                ? "Create an account to start managing your tasks with your team."
                : "Already have an account? Jump back in and keep your work moving."}
          </p>

          {isRegister ? (
            <button type="button" onClick={() => switchPanel(LOGIN_PANEL)}>
              Sign In
            </button>
          ) : (
            <button type="button" onClick={() => switchPanel(REGISTER_PANEL)}>
              Register
            </button>
          )}
        </div>

        <div className="auth-panel-single">
          <h2>
            {isForgotPassword
              ? "Forgot Password"
              : isRegister
                ? "Create Account"
                : "Sign In"}
          </h2>
          <p className="subtitle">
            {isForgotPassword
              ? "Use your email, the OTP we send, and a new password."
              : isRegister
                ? "Set up your login details to get started."
                : "Enter your username and password to continue."}
          </p>

          {error && <div className="auth-alert auth-alert-error">{error}</div>}
          {success && (
            <div className="auth-alert auth-alert-success">{success}</div>
          )}

          {panel === LOGIN_PANEL && (
            <form onSubmit={handleLogin}>
              <input
                className="auth-input"
                placeholder="Username"
                value={loginForm.username}
                onChange={(event) =>
                  updateForm(setLoginForm, "username", event.target.value)
                }
              />

              <div className="password-box">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(event) =>
                    updateForm(setLoginForm, "password", event.target.value)
                  }
                />
                <span onClick={() => setShowLoginPassword((value) => !value)}>
                  {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <button className="auth-link-button" type="button" onClick={() => switchPanel(FORGOT_PANEL)}>
                Forgot password?
              </button>

              <button className="auth-button" type="submit" disabled={busy}>
                {busy ? "Signing in..." : "Login"}
              </button>
            </form>
          )}

          {panel === REGISTER_PANEL && (
            <form onSubmit={handleRegister}>
              <input
                className="auth-input"
                placeholder="Username"
                value={registerForm.username}
                onChange={(event) =>
                  updateForm(setRegisterForm, "username", event.target.value)
                }
              />
              <input
                className="auth-input"
                placeholder="Email"
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  updateForm(setRegisterForm, "email", event.target.value)
                }
              />
              <select
                className="auth-input"
                value={registerForm.role}
                onChange={(event) =>
                  updateForm(setRegisterForm, "role", event.target.value)
                }
              >
                <option value="" disabled>
                  Role
                </option>
                <option value="MANAGER">Manager</option>
                <option value="INTERN">Intern</option>
              </select>

              <div className="password-box">
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Password"
                  value={registerForm.password}
                  onChange={(event) =>
                    updateForm(setRegisterForm, "password", event.target.value)
                  }
                />
                <span
                  onClick={() => setShowRegisterPassword((value) => !value)}
                >
                  {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="password-box">
                <input
                  type={showRegisterConfirmPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Confirm Password"
                  value={registerForm.confirmPassword}
                  onChange={(event) =>
                    updateForm(
                      setRegisterForm,
                      "confirmPassword",
                      event.target.value,
                    )
                  }
                />
                <span
                  onClick={() =>
                    setShowRegisterConfirmPassword((value) => !value)
                  }
                >
                  {showRegisterConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <button className="auth-button" type="submit" disabled={busy}>
                {busy ? "Creating account..." : "Sign Up"}
              </button>
            </form>
          )}

          {panel === FORGOT_PANEL && (
            <form onSubmit={handleResetPassword}>
              <input
                className="auth-input"
                placeholder="Email"
                type="email"
                value={resetForm.email}
                onChange={(event) =>
                  updateForm(setResetForm, "email", event.target.value)
                }
              />

              <button
                className="auth-button auth-button-secondary"
                type="button"
                onClick={handleSendOtp}
                disabled={otpBusy}
              >
                {otpBusy ? "Sending OTP..." : "Send OTP"}
              </button>

              <input
                className="auth-input"
                placeholder="OTP"
                value={resetForm.otp}
                onChange={(event) =>
                  updateForm(setResetForm, "otp", event.target.value)
                }
              />

              <div className="password-box">
                <input
                  type={showResetPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="New Password"
                  value={resetForm.password}
                  onChange={(event) =>
                    updateForm(setResetForm, "password", event.target.value)
                  }
                />
                <span onClick={() => setShowResetPassword((value) => !value)}>
                  {showResetPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="password-box">
                <input
                  type={showResetConfirmPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Confirm New Password"
                  value={resetForm.confirmPassword}
                  onChange={(event) =>
                    updateForm(
                      setResetForm,
                      "confirmPassword",
                      event.target.value,
                    )
                  }
                />
                <span
                  onClick={() =>
                    setShowResetConfirmPassword((value) => !value)
                  }
                >
                  {showResetConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <button className="auth-button" type="submit" disabled={busy}>
                {busy ? "Resetting password..." : "Reset Password"}
              </button>

              <button
                className="auth-link-button auth-link-button-inline"
                type="button"
                onClick={() => switchPanel(LOGIN_PANEL)}
              >
                Back to sign in
              </button>

              {otpSent && <p className="auth-help-text">Check your inbox for the latest OTP code.</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
