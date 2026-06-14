import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.request.use((config) => {
  const storedUser =
    localStorage.getItem("plumberUser");

  if (storedUser) {
    try {
      const { token } = JSON.parse(storedUser);

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    } catch {
      localStorage.removeItem("plumberUser");
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
      localStorage.removeItem("plumberUser");

      if (onUnauthorized) {
        onUnauthorized();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
