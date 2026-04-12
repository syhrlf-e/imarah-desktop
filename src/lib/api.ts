import axios from "axios";
import { secureStore } from "./store";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://imarah-backend.test/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  },
});

// Interceptor: Asynchronously fetch token dari Desktop Store
api.interceptors.request.use(async (config) => {
  try {
    const token = await secureStore.get<string>("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error fetching token from secure store", error);
  }
  return config;
});

// Interceptor: Handle kalau error (misal: token expired)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Hapus token secara native
      await secureStore.delete("auth_token");
      await secureStore.save();
    }
    return Promise.reject(error);
  },
);

export default api;
