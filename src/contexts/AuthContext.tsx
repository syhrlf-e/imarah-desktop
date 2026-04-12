import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/lib/api";
import { secureStore } from "@/lib/store";
import { queryClient } from "@/lib/queryClient";
import { clear as clearIDB } from "idb-keyval";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
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
    await secureStore.set("auth_token", newToken);
    await secureStore.save(); // Pastikan tersimpan ke disk
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      // 1. Matikan reaktivitas cache dan musnahkan status query saat ini
      queryClient.clear();
      
      // 2. Musnahkan simpanan disk Offline-First dari idb-keyval
      try {
        await clearIDB();
      } catch (idbErr) {
        console.error("Gagal menghapus IndexedDB Cache", idbErr);
      }

      // 3. Cabut token akses dari Secure Store (Desktop Vault)
      await secureStore.delete("auth_token");
      await secureStore.save();
      
      setToken(null);
      setUser(null);
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const storedToken = await secureStore.get<string>("auth_token");
        if (!storedToken) {
            setLoading(false);
            return;
        }
        setToken(storedToken);
        const response = await api.get("/profile");
        const profileData =
          response.data?.data?.user ?? response.data?.data ?? response.data;
        if (profileData?.id) {
          setUser(profileData as User);
        }
      } catch (e) {
        console.error("Token verification failed", e);
        await secureStore.delete("auth_token");
        await secureStore.save();
        setToken(null);
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
