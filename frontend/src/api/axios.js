import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});

api.interceptors.request.use((config) => {
  const publicAuthPaths = new Set([
    "/auth/login/",
    "/auth/register/",
    "/auth/refresh/",
    "/auth/send-otp/",
    "/auth/reset-password/",
  ]);

  if (publicAuthPaths.has(config.url)) {
    return config;
  }

  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function login(username, password) {
  const { data } = await api.post("/auth/login/", { username, password });
  localStorage.setItem("accessToken", data.access);
  localStorage.setItem("refreshToken", data.refresh);
  localStorage.setItem("role", data.role);
  localStorage.setItem("username", data.username);
  return data;
}

export async function register(payload) {
  const { data } = await api.post("/auth/register/", payload);
  return data;
}

export async function sendOtp(email) {
  const { data } = await api.post("/auth/send-otp/", { email });
  return data;
}

export async function resetPassword(email, otp, password) {
  const { data } = await api.post("/auth/reset-password/", {
    email,
    otp,
    password,
  });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me/");
  return data;
}

export async function fetchUsers() {
  const { data } = await api.get("/auth/users/");
  return data;
}

export async function createUser(payload) {
  const { data } = await api.post("/auth/users/", payload);
  return data;
}

export async function updateUser(id, payload) {
  const { data } = await api.patch(`/auth/users/${id}/`, payload);
  return data;
}

export async function deleteUser(id) {
  await api.delete(`/auth/users/${id}/`);
}

export async function fetchTasks(params = {}) {
  const { data } = await api.get("/tasks/", { params });
  return data;
}

export async function createTask(payload) {
  const { data } = await api.post("/tasks/", payload);
  return data;
}

export async function updateTask(id, payload) {
  const { data } = await api.patch(`/tasks/${id}/`, payload);
  return data;
}

export async function deleteTask(id) {
  await api.delete(`/tasks/${id}/`);
}

export async function fetchProgress() {
  const { data } = await api.get("/tasks/progress/");
  return data;
}

export async function sendChatMessage(message) {
  const { data } = await api.post("/chat/message/", { message });
  return data;
}

export async function fetchChatHistory() {
  const { data } = await api.get("/chat/history/");
  return data;
}

export async function clearChatHistory() {
  const { data } = await api.delete("/chat/history/");
  return data;
}

export async function downloadChatHistoryPdf() {
  const res = await api.get("/chat/history/pdf/", { responseType: "blob" });
  return res.data;
}

export default api;

