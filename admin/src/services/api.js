import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://aquarespond-production.up.railway.app");

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.request.use((config) => {
  const storedUser =
    localStorage.getItem("adminUser");

  if (storedUser) {
    try {
      const { token } = JSON.parse(storedUser);

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    } catch {
      localStorage.removeItem("adminUser");
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest =
      error.config?.url?.startsWith("/auth/");

    if (
      error.response?.status === 401 &&
      !isAuthRequest
    ) {
      localStorage.removeItem("adminUser");

      if (onUnauthorized) {
        onUnauthorized();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
