import api from "@/lib/api";
import { User } from "@/types";

export const usersService = {
  getAll: async () => {
    const res = await api.get('/users');
    const data = res.data?.data?.users ?? res.data?.data ?? [];
    return (Array.isArray(data) ? data : []) as User[];
  },
  create: async (payload: Partial<User> & { password?: string, password_confirmation?: string, seckey?: string }) => {
    const res = await api.post('/users', payload);
    return res.data;
  },
  remove: async (id: string) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  }
};
