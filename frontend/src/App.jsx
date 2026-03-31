import React, { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { fetchMe } from "./api/axios.js";
import Dashboard from "./pages/DashboardAdminAdjusted.jsx";
import AuthPage from "./pages/AuthPage.jsx";

function isAuthed() {
  return Boolean(localStorage.getItem("accessToken"));
}

function PrivateRoute({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(isAuthed());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!isAuthed()) return;

      try {
        const data = await fetchMe();
        if (mounted) setMe(data);
      } catch {
        localStorage.clear();
        navigate("/login");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  function logout() {
    localStorage.clear();
    setMe(null);
    navigate("/login");
  }

  // ✅ Hide navbar on auth pages
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="app-shell bg-light">

      {/* NAVBAR (hidden on login/register) */}
      {!isAuthPage && (
        <nav className="navbar navbar-expand navbar-dark bg-primary">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/">
              TaskPilot
            </Link>

            <div className="navbar-nav ms-auto">
              {isAuthed() ? (
                <>
                  <span className="navbar-text me-3">
                    {username} ({role})
                  </span>

                  <button
                    className="btn btn-sm btn-outline-light"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link className="nav-link" to="/login">
                    Login
                  </Link>
                  <Link className="nav-link" to="/register">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* MAIN CONTENT */}
      <div className={isAuthPage ? "" : "container py-4"}>
        {loading ? (
          <div className="text-muted">Loading…</div>
        ) : (
          <Routes>
            {/* Dashboard */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard me={me} />
                </PrivateRoute>
              }
            />

            {/* Auth */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>

      {/* Chatbot hidden */}
    </div>
  );
}
