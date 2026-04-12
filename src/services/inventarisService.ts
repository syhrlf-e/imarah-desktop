import api from "@/lib/api";

export const inventarisService = {
  getAll: async (params: string) => {
    const res = await api.get(`/inventaris?${params}`);
    return res.data?.data;
  },

  create: async (data: any) => {
    return await api.post("/inventaris", data);
  },

  update: async (id: string, data: any) => {
    return await api.put(`/inventaris/${id}`, data);
  },

  delete: async (id: string) => {
    return await api.delete(`/inventaris/${id}`);
  },
};
