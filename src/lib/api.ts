import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://imarah-backend.test/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor: Otomatis tempelkan Token di setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Nanti kita simpan token di sini
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Handle kalau error (misal: token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Hapus token saja — redirect ditangani oleh RequireAuth di App.tsx
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  },
);

export default api;
