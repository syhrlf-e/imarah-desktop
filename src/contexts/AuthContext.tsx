import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthStatus = {
  is_authenticated: boolean;
  user: User | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (newToken: string, userData: User) => {
    // Save to Rust secure store
    await invoke("set_auth_data", { token: newToken, user: userData });
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      // 1. Clear Rust secure store
      await invoke("clear_auth_data");

      // 2. Clear local cache
      queryClient.clear();
      
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("unauthorized-access", handleUnauthorized);

    // Listen to session-revoked event from Rust
    const unlistenRevoked = listen("session-revoked", () => {
      logout();
    });

    // Start Rust background pulse
    invoke("start_app_pulse").catch(console.error);

    return () => {
      window.removeEventListener("unauthorized-access", handleUnauthorized);
      unlistenRevoked.then(fn => fn());
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const status = await invoke<AuthStatus>("get_auth_status");
        
        if (status.is_authenticated && status.user) {
          setUser(status.user);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error("Auth status check failed", e);
        await invoke("clear_auth_data");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
