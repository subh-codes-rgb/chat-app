import axios from "axios";

const apiBaseUrl = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/"
).replace(/\/?$/, "/");

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise;

export function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) {
    const error = new Error("No refresh token is available.");
    localStorage.removeItem("access");
    window.dispatchEvent(new Event("auth:expired"));
    return Promise.reject(error);
  }

  refreshPromise ??= axios
    .post(`${api.defaults.baseURL}accounts/token/refresh/`, { refresh })
    .then(({ data }) => {
      localStorage.setItem("access", data.access);
      window.dispatchEvent(
        new CustomEvent("auth:token-refreshed", { detail: data.access }),
      );
      return data.access;
    })
    .catch((error) => {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.dispatchEvent(new Event("auth:expired"));
      throw error;
    })
    .finally(() => {
      refreshPromise = undefined;
    });

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("access");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      request.url?.includes("token/")
    ) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      const access = await refreshAccessToken();
      request.headers.Authorization = `Bearer ${access}`;
      return api(request);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;
