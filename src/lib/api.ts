import { invoke } from "@tauri-apps/api/core";

type ApiResponse<T = any> = {
  data: T;
  status: number;
};

const api = {
  async request<T = any>(method: string, path: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await invoke<any>("api_request", {
        request: {
          method,
          path,
          body,
        },
      });

      return {
        data: response,
        status: 200, // Rust command returns Err for non-2xx, so if we reach here, it's success
      };
    } catch (error: any) {
      if (error === "Unauthorized" || (error?.response?.status === 401)) {
        // Dispatch custom event so AuthContext can handle logout & redirect
        window.dispatchEvent(new CustomEvent("unauthorized-access"));
      }
      throw {
        response: {
          data: error,
          status: error === "Unauthorized" || error.toString().includes("401") ? 401 : 500,
        },
      };
    }
  },

  get<T = any>(path: string) {
    return this.request<T>("GET", path);
  },

  post<T = any>(path: string, body?: any) {
    return this.request<T>("POST", path, body);
  },

  put<T = any>(path: string, body?: any) {
    return this.request<T>("PUT", path, body);
  },

  delete<T = any>(path: string, body?: any) {
    return this.request<T>("DELETE", path, body);
  },
};

export default api;
